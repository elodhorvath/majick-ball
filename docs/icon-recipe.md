# Home-Screen Icon Recipe

How `assets/icon-9ball.png` and `assets/icon-8ball.png` are generated, and how
they get into the pages. Written 2026-10-26; icons currently in `assets/` are
byte-exact extracts of what's embedded in the committed HTML.

## Overview

Each icon is a 180×180 PNG (Apple `apple-touch-icon` size) composed from:

1. **Ball art** — rasterized from the SVG source in `assets/`
2. **Purple-gradient "?"** — Creepster font, colored `#cf6eff → #8a2be2`,
   drawn **on top** of the ball (the ball's own number stays visible)
3. **Dark outline** subtle drop shadow on the "?" for legibility

Composite → resize to 180×180 → base64-embed into the HTML `<head>`.

## Tooling

- `qlmanage` (macOS built-in) for SVG rasterization — **but see the trap below**
- Python venv at `/tmp/fontenv` (workspace-local; recreate as needed):
  `python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install pillow fonttools brotli`
  - Pillow for compositing; fonttools/brotli only if re-subsetting fonts
- Creepster TTF: available from Google Fonts; a copy was used from the local
  fonts cache at icon-build time (not in repo — see gitignore policy)

## The critical trap: SVG `<style>` is ignored

`qlmanage` rasterizes SVG **geometry only** — internal `<style>` blocks and
`class="…"` rules are **not applied**. This caused a real bug: `8ball.svg`
hides its yellow stripe via `.cls-3 { display: none }`, so a naive
`qlmanage` render shows the stripe — a "striped 8-ball" that matches no page.

**Rule: icon builds must use `clean-*.svg` sources where visibility is set
directly as path attributes** (`display="none"`, no CSS), never the
`cls-*`-styled originals. Before rasterizing, verify with a pixel probe:
sample the left edge midline of the rendered PNG; any yellow where the
stripe would be means the hiding didn't apply.

## Step-by-step

### 1. Prepare flattened SVG base

Start from `assets/clean-8ball.svg` (or `clean-9ball.svg`). Confirm by
inspection:

- stripe path (`id="ball-stripe"`) carries `display="none"` inline — **only
  for the 8-ball**; the 9-ball keeps its stripe visible
- number groups: 8-ball shows the `"number-eight"` path, keeps
  `number-nine` hidden (`display="none"` on the group); 9-ball the reverse
- write the sanitized copy to a temp path, e.g. `/tmp/icon-base.svg`

### 2. Rasterize

```bash
qlmanage -t -s 720 -o /tmp /tmp/icon-base.svg
# produces /tmp/icon-base.svg.png (720px)
```

### 3. Pixel-verify the render (before compositing)

```python
from PIL import Image
img = Image.open('/tmp/icon-base.svg.png').convert('RGBA')
px = img.load()
probe = [px[x, y] for x in range(36, 64, 4) for y in (200, 360, 500)]
yellow = any(p[0] > 200 and p[1] > 160 and p[2] < 90 for p in probe)
# For the 8-ball: yellow must be False (stripe hidden).
# For the 9-ball: yellow must be True (stripe is part of the art).
```

### 4. Compose the icon

Python/Pillow sequence (values from the original build):

```python
from PIL import Image, ImageDraw, ImageFont

src = Image.open('/tmp/icon-base.svg.png').convert('RGBA')

# 4a. find ball bbox (non-white pixels), crop square around it
# 4b. resize the crop to 720x720 working canvas
# 4c. second pixel probe on the cropped/resized copy (belt & suspenders)

# 4d. draw "?" with Creepster at 400px into a mask
font = ImageFont.truetype('/path/to/Creepster.ttf', 400)
mask = Image.new('L', (720, 720), 0)
ImageDraw.Draw(mask).text(pos, '?', font=font, fill=255)   # centered via textbbox

# 4e. vertical purple gradient: top (207,110,255) → bottom (138,43,226)
# 4f. shadow pass: draw '?' 4-5 times offset ±5px in dark purple (10,5,20,a≈170)
#     BEFORE compositing the gradient-masked glyph on top
# 4g. Image.composite(gradient, ball, mask) → final 720px icon

# 4h. downscale to 180x180 LANCZOS, convert('RGB'), save
icon.resize((180, 180), Image.LANCZOS).convert('RGB').save('/tmp/icon-final.png', optimize=True)
```

### 5. Embed into the pages

```python
import base64, re
b64 = base64.b64encode(open('/tmp/icon-final.png', 'rb').read()).decode()
html = open('magic-9ball.html').read()
html = re.sub(
    r'(apple-touch-icon" href="data:image/png;base64,)[A-Za-z0-9+/=]+(")',
    r'\g<1>' + b64 + r'\g<2>', html, count=1)
open('magic-9ball.html', 'w').write(html)
```

### 6. Validate

```bash
# served/local byte identity after any deploy:
curl -s https://elodhorvath.github.io/majick-ball/magic-9ball.html \
  | python3 -c "…"   # extract data URI, md5-compare with /tmp/icon-final.png

# visual check: open the PNG, confirm ball identity + '?' position
```

## Current artifacts

| file | size | md5 (head) | description |
|---|---|---|---|
| `assets/icon-9ball.png` | 13990 B | `d14087b6` | yellow 9-ball, purple "?" |
| `assets/icon-8ball.png` | 10169 B | `b24f6629` | black 8-ball, "?" overlaying visible "8" |

These are **extracts from the HTML** (guaranteed byte-equal to what devices
see), not fresh builds — future regenerations should start from the SVGs,
follow this recipe, and end with the same byte-identity check.