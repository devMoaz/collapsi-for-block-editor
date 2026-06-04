# WP.org Listing Assets — Banner + Icon Spec

These are **optional** but recommended. The listing works without them — a default puzzle-piece icon is shown and the banner area collapses. You can add them at any time after launch by pushing PNGs to SVN `/assets/` (no plugin release needed).

When you're ready to design, hand this brief to a designer (or to an AI image tool — prompts at the bottom).

---

## Files needed

| File | Dimensions | Format | Notes |
|---|---|---|---|
| `assets/icon-128x128.png` | 128 × 128 | PNG (32-bit, transparent OK) | Used in search results, plugin grid |
| `assets/icon-256x256.png` | 256 × 256 | PNG | Retina version of above |
| `assets/banner-772x250.png` | 772 × 250 | PNG | Top-of-listing banner |
| `assets/banner-1544x500.png` | 1544 × 500 | PNG | Retina banner |

Optional SVG icon: `assets/icon.svg` — if present, wp.org will use it instead of the PNGs at any size. Easier than maintaining two raster versions but only works for solid-color logos.

All four (or icon.svg + 2 banners) live at SVN root, **not** inside `trunk/`.

---

## Brand direction

### Concept

Block Collapser is about **reducing visual noise in the editor**. The icon should evoke:
- A stack of blocks
- One or two collapsing into a thin bar
- Order from clutter

Avoid: chevrons in isolation (too generic), magnifying glasses, gears (suggests admin settings, not editing).

### Colors

Match the plugin's default accent: **`#1d9e75`** (a calm green-teal). Pairs well with:
- Dark text: **`#1e1e1e`** (matches Gutenberg dark text)
- Subtle background: **`#f6f7f7`** or pure white

Avoid: WordPress blue (`#3858e9`) — too similar to WP core and your plugin isn't an admin tool. Avoid: bright red/orange — they signal "warning" or "delete," not productivity.

### Typography

For text in the banner, use **Inter** or **Source Sans Pro** at a heavy weight (700+). Both are open-source, GPL-compatible, and render at small sizes cleanly. Avoid: Helvetica/Arial (looks generic), display fonts (don't survive resize to 772×250).

---

## Icon design (128×128 and 256×256)

### Layout

A square icon read at 32×32 in plugin grids. **No fine detail.**

**Recommended composition:**

```
┌──────────────────┐
│   ┌────────┐     │   <- expanded block (full-height rectangle)
│   │        │     │      bordered, no fill
│   │        │     │
│   └────────┘     │
│   ┌────────┐     │   <- collapsed bar (thin)
│   ▌── title ─    │      with the #1d9e75 left accent strip
│   └────────┘     │
└──────────────────┘
```

A 2-block stack: top one expanded, bottom one collapsed. The collapsed bar has the signature green-teal **left accent strip** that the plugin actually draws in the editor.

Adds visual brand consistency: someone seeing the icon, then installing, then seeing a collapsed bar in their editor, immediately recognizes the same shape.

### Background

- White or `#f6f7f7` background — wp.org listings show icons on white tiles, so transparent backgrounds tend to look hollow
- Don't fill the entire 128×128 — leave at least 8-12 px padding all around so the icon doesn't kiss the tile edges

### File output

- `icon-128x128.png` — 128×128, optimized PNG (`pngquant` or `oxipng`)
- `icon-256x256.png` — same artwork, just 2× rendered, not 2× upscaled

---

## Banner design (772×250 and 1544×500)

### Layout

A 3.1 : 1 horizontal banner. Visible on the listing page only.

**Recommended composition:**

```
┌────────────────────────────────────────────────────────────────┐
│                                          ┌────────────┐       │
│  Block Collapser                         │ ─── Hero    │       │
│  Tame long posts and templates           │ ─── Para    │       │
│  without losing your place.              │ ▌── Group ─ │       │
│                                          │ ─── Image   │       │
│                                          └────────────┘       │
└────────────────────────────────────────────────────────────────┘
```

**Left half:** plugin name + tagline
- Plugin name: **Block Collapser** — bold, 64px (banner-1544 measurement), color `#1e1e1e`
- Tagline: **"Tame long posts and templates without losing your place."** — regular, 28px, color `#444` or `#555`
- Optional small chip: green-teal pill saying **"Editor-only • GPL"**

**Right half:** stylized illustration of the editor canvas with 4-5 block stubs, one of them showing the collapsed bar with the green-teal accent strip. Same visual motif as the icon.

### Background

Pure white (`#ffffff`) or very subtle vertical gradient `#ffffff → #f6f7f7`. Don't use a colored background — it'll fight with the plugin name.

### File output

- `banner-772x250.png` — 772×250, render at this exact resolution (don't downscale 1544px to 772px and call it done — the type will get blurry)
- `banner-1544x500.png` — 1544×500, retina version

---

## Tooling options (cheapest → most polished)

### 1. **Figma (free)** — 1-2 hours
Best ROI for you. Quick steps:
1. Create a Figma file with two frames: 128×128 and 1544×500
2. Use auto-layout to draw 2 rounded rectangles (the block stack) and one thin bar with a 3-px left strip in `#1d9e75`
3. Add a text node with the plugin name in Inter Bold 64
4. Export each frame as PNG at 1× and 2× → drop into `assets/`

### 2. **AI image tools** — 30 min if it cooks, longer if it doesn't
Useful for the right-half illustration on the banner. Sample prompts:

**Icon prompt:**
> "Minimal flat icon, 128x128, two stacked rounded rectangles representing UI blocks. Top one is expanded with thin horizontal lines inside (representing content). Bottom one is collapsed into a thin bar with a green-teal (#1d9e75) vertical accent strip on its left edge. White background. Centered composition with 12px padding. Modern, clean, no gradients, no shadows. Style: WordPress admin aesthetic."

**Banner prompt:**
> "Horizontal banner, 1544x500, white background. Left half: large bold text 'Block Collapser' in #1e1e1e, with subheading 'Tame long posts and templates without losing your place' in lighter gray. Right half: stylized illustration of a vertical stack of 5 content blocks, one of them is collapsed into a thin bar with a #1d9e75 green-teal left accent strip. Modern flat design, no gradients, no glow. Inter font."

### 3. **Hire a designer** — $50-150 on Dribbble / Fiverr
For "I want this to look like it belongs on Wirecutter." Brief them with this document.

---

## Where these files go

After approval and SVN access:

```bash
# In your local SVN checkout of plugins.svn.wordpress.org/block-collapser/
cp icon-128x128.png icon-256x256.png banner-772x250.png banner-1544x500.png assets/
svn add assets/*.png
svn ci -m "Add listing banner and icon"
```

The wp.org listing auto-refreshes within ~30 minutes.

---

## Checklist when you're ready to ship them

- [ ] `icon-128x128.png` — 128×128, < 50 KB, optimized
- [ ] `icon-256x256.png` — 256×256, < 100 KB
- [ ] `banner-772x250.png` — 772×250, < 200 KB
- [ ] `banner-1544x500.png` — 1544×500, < 500 KB
- [ ] All four use the green-teal `#1d9e75` accent
- [ ] Banner doesn't use trademarks (no Gutenberg logo, no WordPress wordmark)
- [ ] Tested in the wp.org preview (paste to a draft listing first if possible)
