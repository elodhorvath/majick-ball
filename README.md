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

> **Non-technical?** Read [INSTALL.md](INSTALL.md) instead — plain-English
> steps with no jargon. The section below is the technically complete
> reference.

**All devices — first install (needs network once):**

1. Open the page URL in **Safari** (not Chrome/other browsers — iOS installs
   Home Screen web apps from Safari only):
   <https://elodhorvath.github.io/majick-ball/magic-8ball.html>
   (or `magic-9ball.html`)
2. Wait for the ball to render (fonts/effects are inline; first paint is fast).
3. **Share** (□↑) → scroll to **Add to Home Screen** → Add.
4. Launch from the Home Screen icon once while online. This arms the service
   worker cache — from now on the app is airplane-mode-proof.
5. Test airplane mode: toggle it on, launch the app, tap for an answer. If it
   answers, the device is venue-ready; toggle airplane back off.

**Older iPad (A10X, iOS 17.7.x):** fully supported — service workers and
standalone Home Screen web apps have been in Safari since iOS 16.4, so iOS 17
misses nothing. Expect the
*tier-0* experience by design (static fog, no infinite animations) — that is
the hardware capability gate doing its job, not a defect. Do **not** enable
Low Power Mode on the event device; it suppresses screen wake locks at the
OS level.

**Newer iPad / iPhone (M-series or A12+, same iOS 17):** identical flow. The
OS version is not the differentiator — the GPU probe is. These devices get
the full *tier-1* suite (animated turbulence fog) automatically. On first
launch the page may ask nothing and just work — standalone
mode engages on Home Screen launch; fullscreen on Safari tabs triggers on
first tap.

**Notes for both:**

- The **first visit must be online** — the service worker installs and the
  page caches at that moment. Later installs/updates need that same device
  to come online once to refresh the cache.
- After the app is installed, treat it as an app: deleting the Home Screen
  icon also deletes its cache; re-install = repeat step 1.
- Page updates ship via the **cache-version ritual** (README §Service worker):
  bump `majick-ball-v1` → `-v2`, deploy, then launch the app once online per
  device; the fresh page appears on the launch after that.
- If the icon on the Home Screen shows a white ball instead of the striped
  9 / black 8 art, the install pre-dates the icon embed — delete the icon,
  come online, re-install from step 1.

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