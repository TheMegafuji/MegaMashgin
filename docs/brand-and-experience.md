# Brand and sensory design

The product is now **Mashgin Market — concept by Megafuji**. It takes its charcoal, citrus and warm-white direction from [Mashgin's public website](https://www.mashgin.com/), observed on 2026-09-21. The monogram and wordmark are original concept assets. Header, receipt, footer, favicon, press page and social graphics identify the same project; the press page explains independent authorship.

## Open artwork, applied deliberately

The initial product used deterministic SVG illustrations, not generated raster images. This update incorporates twenty models from [Kenney Food Kit 2.0](https://kenney.nl/assets/food-kit), licensed CC0. The upstream license, selected GLBs, shared palette texture and SHA-256 manifest are retained under [scripts/assets/kenney-food-kit](../scripts/assets/kenney-food-kit/manifest.json).

The supplied previews were only 64 px. The build tool renders the original models as transparent 480 × 360 PNGs with pinned Three.js and local Chromium. No Three.js code, GLB assets, network image service or remote font is needed by the storefront.

Eight new original drink SVGs add a ceramic cappuccino with foam, layered glass latte, cocoa mug, tall takeaway coffee, iced tea, lemonade, iced latte and matcha. Two other hot drinks use the open models. These are illustrative fictional products; descriptions were aligned with their vessels by additive migration. Packaging and remaining original art are retained. Prices and existing order snapshots are unchanged.

Rebuild assets from the repository root:

```sh
npm run art:render
npm run brand:build
```

The brand command also packages a download ZIP using Python 3's standard library. Playwright Chromium must be installed for rendering. Generated assets are committed; ordinary installation, deployment and CI do not need to regenerate them.

## Motion and sound

Hot foods and six hot drinks receive decorative SVG vapor that rises beyond the card edge. It ignores pointer events, is hidden from assistive technology, disappears for reduced-motion users and respects the animation toggle.

Clickable floating products have stationary hit areas. Only their artwork bobs, so an animation does not move the touch target away from the shopper.

Nine synthesized motifs distinguish categories. They use brief sine/triangle envelopes, a conservative peak gain, a 140 ms admission interval and disconnected audio nodes after playback. The browser creates an AudioContext only after an accepted addition gesture. No sound occurs on page load, restored state, removals, blocked changes or failed storage writes. Mute persists locally and audio/storage preference failures cannot prevent checkout. Perceived loudness still depends on the device volume; the software does not claim a calibrated decibel level.

The browser tests observe real oscillator scheduling, different category notes, no initial playback, persistent mute and graceful handling of an unavailable audio device. This verifies behavior; it is not a subjective listening assessment on the user's speakers.

## Press and SEO

The [press page](../public/press/index.html) includes editable SVG logos, landscape/social-square/presentation compositions, PNG exports, application icons, a ZIP and provenance. Open it at `/press/` on the running application.

The server writes canonical and absolute Open Graph/Twitter image URLs from trusted `PUBLIC_ORIGIN`. HTTPS public origins enable indexing and a two-page sitemap. Local/HTTP execution remains noindex with robots disallow-all. Request Host headers never decide canonical URLs. Unknown pages return 404.

This is a metadata and static press-page foundation. It does not assert search-engine indexing, rich results, organic ranking, an offline PWA, production affiliation or a deployed public domain. There are no fabricated ratings, merchant locations or product schema claims.

## Review sequence

1. Open the home page and inspect the concept identity and stable animated quick-add targets.
2. Choose Coffee & cups; compare all eight silhouettes. Look for vapor on the six warm choices.
3. Add a snack, a coffee and a fruit. Toggle sound off, reload and confirm the preference remains.
4. Pause motion or turn on the operating system's reduced-motion preference.
5. Complete a demo order; check the receipt branding and visitor history.
6. Open Press & brand kit, preview the social graphics and download the ZIP.

## Experience update — 2026-09-23 UTC

The initial cart envelope peaked at 0.018 divided by the number of notes, with
120 ms notes. That produced a very quiet cue. The revised envelope uses adjustable
volume (60% by default), a 0.16 master scale normalized across notes and 220 ms
notes. A Sound settings panel offers a preview and persists volume independently
of mute. Preview is an explicit user gesture; no music or autoplay was added.
Audio-device failure still cannot block the purchase flow.

A browser test now samples a real Web Audio analyser and requires a nonzero signal
above the test threshold, rather than only observing oscillator scheduling. This
verifies synthesis in the browser, not the listener's physical speakers or OS mute.

The hero artwork floats over an 18 px range, warm-item vapor has stronger contrast,
and quantity badges animate on each increase. A small animated storefront links
to the published game in a new tab. All purchase and navigation targets remain
stationary. Reduced motion and the global pause control still govern decoration.
