# Yearbib

Your year in sport, made from the data export Strava already gives you. Free, and it runs entirely in your browser: the zip is read on your device and nothing is uploaded.

## Use it

1. On strava.com, open Settings, then My Account. Under "Download or Delete Your Account", choose Get Started, then Request Your Archive.
2. Download the zip from Strava's email.
3. Drop it on the page. Pick a year and save the cards.

Reads `activities.csv` for the stats and the GPX, TCX and FIT files for the route drawings. Exports with photos are fine: the zip is read entry by entry, never loaded whole.

## Run locally

```
python3 -m http.server 8765
```

`node tools/make_fake_export.mjs test-export.zip` builds a fake export for testing.

Not made by or affiliated with Strava.

Libraries: fflate (MIT), Garmin FIT SDK (FIT Protocol License) in `vendor/`.
