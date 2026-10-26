# Magic 8/9-Ball Costume Display — Design Doc

Project: `halloween-majick-ball`
Owner: Elod (costume: Sarcastic Magic 9-ball) + Jamie (costume: Magic 8-ball)
Target event: Halloween scotch doubles tournament + costume contest (next week)
Status: Draft v1 — locked decisions applied; awaiting answer lists & tone confirmation
Created: 2026-10-22 · Last updated: 2026-10-22

---

## 1. Problem & Goal

Hang an iPad from each of our necks. Each iPad runs a single, self-contained, offline web
page that performs the "magic answer" schtick of a Magic 8/9-ball:

- **8-ball (Jamie):** prompt `Ask Me Anything`. Tap → animates → reveals a (mostly) helpful / sometimes quippy magic answer.
- **9-ball (Elod):** prompt `Don't Ask Me Anything`. Tap → animates → reveals a sarcastic/snarky magic answer.

No build step, no server, no network at the venue. One `.html` file per costume, droppable onto an iPad and opened in Safari (or installed to home screen as a standalone web app). Must survive a 6–10 hour event with costumed humans (spilled drinks, sweaty fingers, low light, accidental taps).

---

## 2. Success Criteria

1. Each page boots offline in <2s on iPad Safari from a cold start.
2. A single tap anywhere on the idle screen starts the sequence; no tiny targets.
3. Full idle → answer → idle cycle completes gracefully; answer holds **15–20s** then auto-resets; any tap during hold skips immediately.
4. Tap-to-answer latency from tap to first visible feedback <150ms.
5. Survives accidental double-taps, sleep/wake, orientation changes, and iOS screen dimming without a manual reload.
6. Screen never sleeps during the event (best-effort Wake Lock; fallback instructions).
7. Audio plays on tap (iOS gesture-unlocked) or fails gracefully silently.
8. Text is legible from ~3–4 ft in a dim bar/bowling alley.

---

## 3. Non-Goals (v1)

- No multiplayer / two-iPad sync (each costume is independent).
- No scorekeeping, no league integration, no LMS-Extract tie-in beyond borrowing SVG art.
- No custom answer authoring UI at the venue — answer lists are baked into the HTML.
- No account/login, no analytics, no backend.

---

## 4. Users & Context of Use

- **Wearer** (Jamie or Elod): cannot easily see their own screen; relies on auto-reset and large feedback.
- **Questioner** (random tournament participant): one hand free, maybe holding a drink; taps with a finger or knuckle.
- **Environment**: bowling alley / bar, low-ish light, loud (audio is a bonus, not required), motion in costumes (iPad swings).

Implications: huge hit target, high contrast, one-handed tap, long-but-auto-resetting cycles, graceful degradation.

---

## 5. Proposed UX Flow (per device)

### State machine

```text
IDLE ──tap──► SHAKING ──timer──► REVEAL (zoom) ──(tap or 15–20s)──► FADEOUT ──timer──► IDLE
```

1. **IDLE**: ball occupies most of screen (landscape); prompt text beneath the ball (`Ask Me Anything` / `Don't Ask Me Anything`) with a secondary tap hint (`Tap for an answer` / `I dare you to tap`). Subtle idle motion (slow float + glow) so it reads as "alive" in a crowd.
2. **SHAKING** (~1.2–1.8s): tap anywhere. Ball wobbles/rotates; liquid/smoke swirl inside the window; a **countdown** indicator (visual tick + per-device audio tic) paces the "thinking" pause. Additional taps are locked out for the whole shake phase.
3. **REVEAL (zoom)** (~0.4s before end of shake → reveal): the viewport **zooms onto the ball's front face** (CSS transform, ~1.5–1.7× centered on the triangle window's centroid) so the answer window fills ~70% of the screen; the answer fades in and wraps over multiple centered lines, auto-shrinking font for long lines. Hold **15–20s** OR until next tap (tap skips to fadeout).
4. **FADEOUT** (~0.8s): zoom eases back out to idle framing; answer fades; ball returns to IDLE.

### Interaction rules

- Any tap on `IDLE` starts the sequence. Taps during `REVEAL` skip to `FADEOUT`.
- Double/triple taps coalesce (ignore taps within 300ms of any state transition).
- `beforeunload` guard is NOT used (would trap users). In browser mode, back-swipe exits; in standalone (home-screen) mode the page is immersive. Recommend Add-to-Home-Screen for the event.
- Orientation change: **reflow gracefully** — CSS `vmin`/`clamp` + media queries keep the full-screen tap target intact in portrait or landscape; no "rotate" overlay. Tap target is the entire document at all times.

### Idle prompt copy (locked)

- 8-ball: `Ask Me Anything` (tap hint: `Tap for an answer`)
- 9-ball: `Don't Ask Me Anything` (tap hint: `I dare you to tap`)

---

## 6. Visual Design

- **Landscape-first.** Ball fills ~80–90% of the shorter viewport edge; auto-scales up to 90vmin.
- Background: near-black with a subtle radial spotlight behind the ball so the white text on the ball's face pops in low light.
- Prompt: large (clamp 20px–4.5vw), high contrast, centered beneath the ball; tap hint slightly smaller and dimmer.
- **Answer (REVEAL)**: rendered inside the zoomed-in triangle window on the ball's front face; multi-line centered text, auto-shrink from ~5.5vmin down to ~2.8vmin until it fits (or down to a floor and vertical scroll is avoided by design of answer lengths). The whole ball stays visible behind the zoomed window at reduced opacity so it never feels un-anchored.
- Motion: CSS keyframes only (no JS animation libs). Respect `prefers-reduced-motion`: skip shake/zoom, show answer after a short (≈600ms) delay, auto-reset as usual.
- 8-ball theme: deep indigo/purple accent (mystical). 9-ball theme: amber/orange accent (snark). Idle glow carries the theme color.

### SVG notes

- `assets/8ball.svg` (from `billiards-8ball.svg`): standard 8-ball look — white number circle, black "8", clean black ball.
- `assets/9ball.svg` (from `billiards-9ball.svg`): visible yellow stripe + "9" inside white circle — reads instantly as a 9-ball.
- Strip the metadata/vectorcraft block; inline minified SVGs into each HTML file (single-file requirement). Expected ~30–50KB per SVG.

---

## 7. Audio (optional, graceful)

- **Approach: Web Audio synthesis** (preferred — tiny, offline, no base64 assets). Real sound bites can be swapped in later if desired.
- **Countdown pacing tone**: a distinct tic per device during the shake:
  - **8-ball**: soft, regular, gentle tick (mystical metronome), ~120 BPM feel.
  - **9-ball**: slightly faster, impatient, dry tick, with a touch of urgency.
- **Reveal tone**:
  - **8-ball**: soft bell/chime (two ascending tones, e.g. C5→G5).
  - **9-ball**: flat buzzer or "wah-wah" deflate (descending minor bend).
- Audio context unlocked inside the tap handler (iOS policy). If blocked, visual sequence proceeds silently with no error.
- **Mute toggle**: small fixed control in a bottom corner, state persisted in `localStorage` (`mv.mute`). Default unmuted; visually subtle. Auto-mutes on `prefers-reduced-motion`? No — respect mute choice only.

---

## 8. Answer Lists (curated)

### 8-ball (Jamie) — standard Magic 8-ball answers (20) PLUS augmented quippy/funny

Standard set (keep all 20 canonical):

- Affirmative: "It is certain", "It is decidedly so", "Without a doubt", "Yes definitely", "You may rely on it", "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes".
- Non-committal: "Reply hazy, try again", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again".
- Negative: "Don't count on it", "My reply is no", "My sources say no", "Outlook not so good", "Very doubtful".

Augmented quippy/funny set: **E to provide** (target 15–25 extra lines). Mixed uniformly into the pool with the standard 20.

### 9-ball (Elod) — sarcastic, ~20+ items

**E to provide the final list.** Draft (snarky/insulting tone) retained as seed — see question 1 in §14 for tone confirmation:

- "Sure, and I'm a real magic ball."
- "Absolutely. In an alternate universe."
- "Let me check... no."
- "The spirits say: try harder."
- "I'd answer but I'm a 9, not wise."
- "Take a wild guess and call it tradition."
- "Not even with a ouija board."
- "My sources are laughing at you."
- "Ask the 8-ball; I'm on break."
- "Maybe after you buy me a drink."
- "The prophecy says 'meh'."
- "I'm a ball, not a therapist."
- "Roll again, hotshot."
- "Fortune says: embarrassing."
- "Why are you even asking me?"
- "Statistically? No."
- "I could tell you, but then I'd have to charge."
- "Don't bet your scotch doubles on that one."
- "I'm contractually obligated to refuse."
- "Magic says: absolutely not."

Selection: uniform random; avoid immediate repeat (re-roll once if identical to last answer).

---

## 9. Technical Architecture

- **Single file per device**: `magic-8ball.html` (Jamie), `magic-9ball.html` (Elod). All CSS, JS, SVG, audio inlined. No external resources, no fetch, works fully offline.
- **No dependencies / no framework.** Vanilla JS, ES2020. Target iPadOS 17+ (confirmed device 1). Wake Lock API available.
- **State**: tiny finite-state machine in JS (`idle | shaking | reveal | fadeout`), with a single current `phaseToken` to ignore stale timers after skips.
- **Persistence**: `localStorage` keys prefixed `mv.`: `mv.mute`, `mv.lastAnswer`, `mv.installHintDismissed`.
- **Wake Lock**: `navigator.wakeLock.request('screen')` on first tap; re-acquire on `visibilitychange` (iOS releases the lock when the page is hidden); document fallback = Settings → Display & Brightness → Auto-Lock → Never.
- **Orientation**: landscape-first layout, gracious reflow in portrait (see §5 rules). No lock prompt.
- **Fullscreen/standalone**: provide install instructions (Safari Share → Add to Home Screen); detect `display-mode: standalone` to hide the install banner.
- **Offline**: everything inlined. Pre-event verification: turn on Airplane mode, cold-open each file, run a full cycle.
- **Performance**: target <120KB per file (SVG ~45KB + code ~15KB + minimal audio code). Web Audio synthesis adds ~2KB instead of ~40KB base64.

---

## 10. Resolved vs Open Decisions

**Resolved**

1. Answer placement → **zoom-in to ball's front face**, triangle window, multi-line wrap. No caption bar. (Answer length is no longer a constraint due to zoom.)
2. Auto-reset timing → **15–20s** hold + tap-to-skip.
3. Orientation → **landscape-first**, graceful reflow on rotation.
4. Idle motion → **subtle float + glow**, honor `prefers-reduced-motion`.
5. Audio → **Web Audio synthesis**, distinct countdown tic + reveal tone per device, mute toggle.
6. Styling → 8-ball deep indigo/purple (mystical); 9-ball amber/orange (snark).

**Open**

1. Tone confirmation for 9-ball (snarky/insulting vs. playful/cheeky) — see grill Q1.
2. 8-ball's augmented quippy answer list (E to provide).
3. 9-ball's final answer list (E to provide).
4. iPad #2 model + iOS version (E to confirm) — affects Wake Lock/ES baseline assumption.
5. **Venue / Wi-Fi**: resolved (2026-10-22) → event at **8 on Eighth Billiards**, open Wi-Fi available; build stays fully offline regardless (Wi-Fi is a backup, not a dependency).
6. **Device fleet resolved** (2026-10-24): iPad #1 = iPad Pro 10.5" (MPDY2LL/A), iPadOS 17.7.11; iPad #2 = iPad 6th Gen, iPadOS 17.7.10 (both WebKit 17-era, Wake Lock per §9, single AudioContext-unlock gesture works the same across both, localStorage available offline). No ES baseline downgrade needed.
7. Zoom animation tuning after first working build (see §5 item 3 note).

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| iPad auto-locks mid-event | Wake Lock API on first tap + re-acquire on visibilitychange; fallback "Auto-Lock → Never" steps |
| Tap not registered due to swing | Full-document touch target; `touch-action: none`; prevent scroll/zoom via viewport meta |
| Audio silent on first tap (iOS policy) | Unlock AudioContext in tap handler; visual never depends on audio |
| Long answers clip / wrap badly | Mitigated by zoom-in: the answer window fills much of the screen, so multi-line wrap has ample room |
| Accidental back swipe exits app | Standalone install recommended for event; browser mode accepted as degraded |
| Low battery | Full charge + portable battery; brightness ~70% |
| Screen glare under alley lights | High contrast, theme accents, large type; test on-site if possible |
| Older iPadOS on device #2 | ES2020 floor; await device confirmation |
| Stuck state after interrupted reveal | Single `phaseToken`; every timer checks it; visibilitychange resets to IDLE only if stuck >60s |

---

## 12. File Layout

```text
halloween-majick-ball/
  DESIGN.md            (this file)
  magic-8ball.html     (Jamie)  [M2]
  magic-9ball.html     (Elod)   [M2]
  assets/
    8ball.svg
    9ball.svg
  README.md            (install + offline test + event-day checklist) [M4]
```

---

## 13. Milestones

- M1 (now): Lock decisions — largely done; awaiting answer lists + tone confirmation.
- M2: Build both HTML files + inline SVGs.
- M3: Offline + Wake Lock + audio smoke test on confirmed iPad.
- M4: Event-day checklist + dress rehearsal in costume with lanyard.
- M5 (post-event): optional write-up / reuse.

---

## 14. Questions for E

1. ~~**Tone check for 9-ball**~~ (nixed 2026-10-24): voice = snarky/insulting as seeded in §8 (lines survive, no retitration to playful/cheeky); 9-ball's final answer list still E's in §8 — she owes it.
2. ~~**Answer subsets**~~ (nixed 2026-10-24): 8-ball keeps the canonical 20 standard answers + 15–25 augmented quippy (current: `8ball-quippy-extras.md`, 16 items, 16 chips pending Jamie/Watson edit; finalizing counts is M2). No non-sarcastic 9-ball answers requested — 9-ball list is strictly snarky.
3. ~~iPad #2 model + iOS version?~~ **Resolved 2026-10-24 (E): iPad 6th Gen, iPadOS 17.7.10** → see §10 decision #6 (both pads WebKit 17-era; no ES baseline downgrade).
4. ~~**Venue**: any Wi-Fi, or fully offline?~~ **Resolved 2026-10-22 (E):** event at 8 on Eighth Billiards with open Wi-Fi — but build stays 100% offline regardless (Wi-Fi is a backup, not a dependency), so the answer to Q4 doesn't change any artifact.
5. **Priorities for M2**: want a single combined "demo mode" flag (e.g., append `?debug=1` to show state + timing readouts) useful while tuning, or keep it clean?

---

_Reply with answer lists + tone choice, and I'll move to M2 and build both files._
