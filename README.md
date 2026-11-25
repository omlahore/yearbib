# Yearbib

Your year in sport, made from the data export Strava already gives you. Free, and it runs entirely in your browser: the zip is read on your device and nothing is uploaded.

Seven cards, each 1080 x 1920 for an Instagram or WhatsApp story:

1. The bib, with your year's distance as the bib number
2. Official results, as a timing slip
3. By sport, as running-track lanes
4. Season profile, month by month
5. Training log, every day of the year
6. Big days, as finisher medals
7. Longest route, with its elevation profile

You can pick the colours, the sport, the number on the bib, the name, the year and the units, then save each card as a PNG or share them all to your story.

## Get your export

1. On strava.com, open Settings, then My Account.
2. Under "Download or Delete Your Account", choose Get Started, then Request Your Archive.
3. Download the zip from Strava's email and drop it on the page.

## Run it locally

```
python3 tools/serve.py
```

Then open http://localhost:8765. `node tools/make_fake_export.mjs test-export.zip` builds a fake export for testing.

## Notes

The zip is read entry by entry, so exports with photos in them still work. Stats come from `activities.csv`; routes and elevation come from the GPX, TCX and FIT files.

Not made by or affiliated with Strava. Strava is a trademark of Strava, Inc.

Libraries in `vendor/`: fflate (MIT), html-to-image (MIT), Garmin FIT SDK (FIT Protocol License). Fonts: Mona Sans and Hubot Sans (SIL Open Font License).
