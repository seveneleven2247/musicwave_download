# MusicWave Download

MusicWave is a desktop music visualizer for macOS and Windows. The waveform reacts to volume and rhythm while music is playing, then disappears automatically when playback pauses.

## Supported Players

- Apple Music
- QQ Music
- NetEase Cloud Music
- Spotify

## Downloads

Open the GitHub Pages or Cloudflare Pages website, or get the latest installer from the `downloads` directory.

- macOS: MusicWave 1.8
- Windows: MusicWave 1.0 x64

## Publishing a New Version

1. Upload the new DMG or Windows ZIP.
2. Update the version number, download URL, and release notes in `version.json`.
3. Commit and push to GitHub. Cloudflare Pages deploys the update automatically.

Version numbers are not hard-coded in the page. `script.js` reads `version.json` and updates the download buttons, release cards, and release notes.
