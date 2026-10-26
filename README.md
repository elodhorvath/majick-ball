# Majick Ball

Two self-contained, offline-first Halloween costume balls: a sarcastic **9-ball**
and a classic-with-attitude **8-ball**. Each page is a single HTML file with all
CSS, JS, SVG art, fonts, sounds, and icons inlined — no build step, no external
requests, no network needed after first load.

- `magic-9ball.html` — *Don't Ask Me Anything.* Tap, shake, receive snark.
- `magic-8ball.html` — *Ask Me Anything.* Tap, shake, receive an answer.

## Pages

<https://elodhorvath.github.io/majick-ball/magic-9ball.html>
<https://elodhorvath.github.io/majick-ball/magic-8ball.html>

## Install on iPad / iPhone

1. Open a page URL in Safari (**once, online** — this installs the service
   worker and caches the page).
2. Share → **Add to Home Screen**.
3. From then on the app launches full-screen, offline (airplane mode included),
   served entirely from local cache.

## Service worker & updates

`magic-sw.js` is a cache-first service worker. It is registered only on HTTPS
hosts; on plain HTTP (LAN serving) or `file://` it stays dormant.

**Update ritual:** edit a page → bump the `CACHE` version string in
`magic-sw.js` (e.g. `majick-ball-v1` → `-v2`) → deploy. Devices pick up the new
SW on their next online launch; the fresh page appears on the launch after
that (standard two-visit service-worker cadence). Forgetting the bump leaves
installed devices on the old cached page.

## Device tiers

The pages probe the GPU string at load and degrade gracefully:

- **tier 1** (M-series / recent phones): full animated turbulence fog suite.
- **tier 0** (older, e.g. A10X): static fog, no infinite animations, everything
  else intact. Dormant tier-1 code stays in-file, gated — not deleted.

Wake lock and fullscreen engage only on mobile (touch + coarse pointer);
laptops/desktops get a normal web page. Wake locks do not override iOS Low
Power Mode.

## Repo layout

```
magic-9ball.html   9-ball app (self-contained)
magic-8ball.html   8-ball app (self-contained)
magic-sw.js        cache-first service worker
assets/            editable SVG sources for ball art and icons
docs/DESIGN.md     design doc, decisions, state machine, tier policy
docs/*.md          answer-list working files
```

Fonts (Creepster, Nosifer, Space Grotesk) are embedded as base64 data URIs in
the HTML files and intentionally not stored in this repo; local copies live in
`assets/fonts/` on development machines only (gitignored).

## License

Personal party project. Answer text and design are informal; fonts are
Google Fonts (OFL) — embedded copies fall under their respective licenses.