import { inflateSync } from "./vendor/fflate.js";

// Reads entries straight from a File/Blob so multi-GB exports (with photos) never load whole into memory.
const u8 = async (blob, a, b) => new Uint8Array(await blob.slice(a, b).arrayBuffer());

export async function openZip(blob) {
  const tailLen = Math.min(blob.size, 65557);
  const tail = await u8(blob, blob.size - tailLen, blob.size);
  const dv = new DataView(tail.buffer);
  let e = -1;
  for (let i = tail.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error("This file is not a zip.");
  let cdSize = dv.getUint32(e + 12, true), cdOff = dv.getUint32(e + 16, true);
  if (cdOff === 0xffffffff || cdSize === 0xffffffff) {
    const loc = e - 20;
    if (loc < 0 || dv.getUint32(loc, true) !== 0x07064b50) throw new Error("Unsupported zip.");
    const z64 = Number(dv.getBigUint64(loc + 8, true));
    const rec = new DataView((await u8(blob, z64, z64 + 56)).buffer);
    cdSize = Number(rec.getBigUint64(40, true)); cdOff = Number(rec.getBigUint64(48, true));
  }
  const cd = await u8(blob, cdOff, cdOff + cdSize);
  const v = new DataView(cd.buffer), dec = new TextDecoder();
  const entries = new Map();
  for (let p = 0; p + 46 <= cd.length && v.getUint32(p, true) === 0x02014b50;) {
    const method = v.getUint16(p + 10, true);
    let csize = v.getUint32(p + 20, true), usize = v.getUint32(p + 24, true);
    const nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true);
    let off = v.getUint32(p + 42, true);
    const name = dec.decode(cd.subarray(p + 46, p + 46 + nl));
    for (let x = p + 46 + nl, end = x + xl; x + 4 <= end;) {
      const id = v.getUint16(x, true), sz = v.getUint16(x + 2, true);
      if (id === 1) {
        let q = x + 4;
        if (usize === 0xffffffff) { usize = Number(v.getBigUint64(q, true)); q += 8; }
        if (csize === 0xffffffff) { csize = Number(v.getBigUint64(q, true)); q += 8; }
        if (off === 0xffffffff) off = Number(v.getBigUint64(q, true));
      }
      x += 4 + sz;
    }
    entries.set(name, { method, csize, off });
    p += 46 + nl + xl + cl;
  }
  return {
    names: [...entries.keys()],
    async read(name) {
      const en = entries.get(name);
      if (!en) return null;
      const h = new DataView((await u8(blob, en.off, en.off + 30)).buffer);
      const start = en.off + 30 + h.getUint16(26, true) + h.getUint16(28, true);
      const data = await u8(blob, start, start + en.csize);
      if (en.method === 0) return data;
      if (en.method === 8) return inflateSync(data);
      throw new Error("Unsupported compression in " + name);
    },
  };
}
