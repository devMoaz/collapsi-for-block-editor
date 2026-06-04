# Block Collapser — Manual Smoke-Test Checklist

Use this before tagging any release. URL: `http://localhost/block-collapser/wp-admin/` (moaz/moaz).

Tick checkboxes only when the result actually matches the expectation. If you see something different from the expected behavior, file a note next to the box.

---

## Phase 1 — Core HOC + chevron toggle

Posts → Add New → drop in 3 paragraphs + 1 Group block.

- [ ] Hover a top-level paragraph → chevron appears top-left
- [ ] Click chevron → block collapses to a 40px bar (icon + title + preview)
- [ ] Click chevron again → expands back
- [ ] Collapse 3 different blocks → each maintains its own state
- [ ] Nested blocks (inside the Group) do NOT show chevrons — only the outer Group does
- [ ] Synced pattern: insert one → confirm only the pattern wrapper has a chevron, inner blocks don't
- [ ] Console: zero errors, zero React warnings

## Phase 2 — Persistence

Saved post (post #1 or any with a numeric ID):

- [ ] Collapse a block → DevTools → Application → Local Storage → key `block-collapser:v1:post:<id>` contains that key set to `true`
- [ ] Reload page → block still collapsed ✓
- [ ] Open the same post in a second tab → second tab shows the same collapsed state on load
- [ ] Expand the block back → reload → it's expanded (the `false` was removed from the stored map, not stored as `false`)
- [ ] Rename test: open a Group block → block toolbar ⋮ → Rename → name it "My Section" → collapse it → reorder it (move up/down) → reload → still collapsed (proves `name:` key beats path)

Auto-draft (Posts → Add New, do NOT save):

- [ ] Add 3 paragraph blocks → collapse one → DevTools localStorage has NO `post:0` entry yet
- [ ] Click Save Draft → URL gets `post=N` → localStorage now has `block-collapser:v1:post:N` containing the collapse
- [ ] Reload → collapsed state survives

Site Editor (Appearance → Editor → any template):

- [ ] Collapse a top-level block in a template → reload → still collapsed (key uses string template id like `twentytwentyfive//home`)

## Phase 3 — Content previews + reduce-motion

Add fresh blocks, collapse each, confirm bar shows:

- [ ] **Paragraph** with content → first ~60 chars + ellipsis if longer
- [ ] **Heading** → heading text
- [ ] **Image** with alt → alt text
- [ ] **Image** without alt → filename
- [ ] **Group** with N inner blocks → "N blocks" (singular vs plural — test 1 vs 3)
- [ ] **Columns** → "N columns"
- [ ] **List** → "N items"
- [ ] **Buttons** → comma-joined button text
- [ ] **Cover** with inner heading → heading text
- [ ] **Cover** without inner heading → no preview (just icon + title) — title shows "Cover" or the `metadata.name` if set
- [ ] **Quote** / **Code** → first chars of content

Reduce-motion:

- [ ] DevTools → ⋮ → More tools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → reduce → toggle a block → bar appears instantly, no fade

## Phase 4 — Sidebar + shortcuts + per-block menu

Top-right editor toolbar → click the plugin pin (or ⋮ → Block Collapser):

- [ ] Sidebar opens with hint text + 3 buttons + Alt+Shift+C tip
- [ ] **Collapse All** → every top-level block collapses
- [ ] **Expand All** → every top-level block expands
- [ ] **Focus Mode** with a top-level block selected → all OTHER top-level blocks collapse, the selected one stays expanded
- [ ] Empty post (zero blocks) → all 3 buttons are disabled

Keyboard shortcut:

- [ ] Press Alt+Shift+C → if anything is expanded, all collapse; press again → all expand
- [ ] Press `?` in editor → Keyboard shortcuts modal → Block section → "Toggle collapse/expand all top-level blocks · Alt+Shift+C" listed
- [ ] On Mac: Ctrl+Alt+C works (modifier `'access'` maps differently per OS)

Per-block "Never collapse":

- [ ] Select a top-level block → block toolbar ⋮ → "Never collapse this block" appears
- [ ] Select a nested block → option is NOT in the menu (top-level only)
- [ ] Click "Never collapse this block" → chevron disappears from that block; cannot be collapsed
- [ ] Open ⋮ again → option now reads "Allow collapsing this block" → click → chevron returns
- [ ] Save post → reload → exclusion persists (it's stored in `attributes.metadata.blockCollapser.neverCollapse`, NOT in localStorage)

A11y announcements (screen reader / `wp.a11y`):

- [ ] Open DevTools console → run `wp.a11y.speak = (t) => console.log('SPEAK:', t)` to hijack
- [ ] Click Collapse All → console logs `SPEAK: Collapsed N blocks.`
- [ ] Click Expand All → logs `SPEAK: Expanded N blocks.`
- [ ] Focus Mode → logs `SPEAK: Focus mode on. <block name> only.`

## Phase 5 — Settings page (Settings → Block Collapser)

Tab presence:

- [ ] All 4 tabs render: General, Behaviour, Block Rules, Appearance

General tab:

- [ ] Toggle "Show content preview" off → Save → reload editor → previews disappear; only icon + title in collapsed bar
- [ ] Toggle "Show block icon" off → Save → reload editor → icons disappear from collapsed bars
- [ ] Toggle "Enable Block Collapser" off → Save → reload editor → no chevrons at all (kill switch works)
- [ ] Re-enable all three before continuing

Behaviour tab:

- [ ] Set "Auto-collapse on editor load" = "All top-level blocks" → Save
- [ ] Open a brand-new draft → all top-level blocks load already collapsed ✓
- [ ] Open an existing post that has NO previously collapsed blocks → all collapse on load ✓
- [ ] Open an existing post that DOES have collapsed blocks saved → existing state is preserved, auto-collapse does NOT re-stomp ✓
- [ ] Switch back to "Never" before continuing

Block Rules tab (only consulted when Behaviour mode = "Use per-block-type rules"):

- [ ] Set Behaviour to "Use per-block-type rules" → Save
- [ ] Set Paragraph = "Always", Heading = "Never", others = "Default" → Save
- [ ] Open a post with mixed content → on load: paragraphs collapsed, headings expanded, other types untouched
- [ ] Block excluded via "Never collapse this block" still excluded — block rules cannot override per-block opt-out
- [ ] Switch Behaviour back to "Never" before continuing

Appearance tab:

- [ ] Change Accent color to red `#cc0000` → Save → reload editor → collapsed blocks have red left border + red icon
- [ ] Change Bar title color to `#000080` → Save → reload → title text turns navy
- [ ] Restore both to defaults (`#1d9e75` and `#444444`)

Save flow:

- [ ] Make any change → click Save → success Notice appears → reload page → setting persists
- [ ] Network tab: `POST /wp-json/wp/v2/settings` returns 200 with the new `block_collapser_options` value
- [ ] REST validation: try `wp eval 'update_option("block_collapser_options", ["accentColor" => "not-a-color"]);'` then reload settings page → invalid value falls back to default (defense at the JS getter layer)

## Phase 6 — A11y, RTL, dark mode, frontend boundary, performance

A11y:

- [ ] Tab through editor → chevron is reachable via keyboard once focused
- [ ] Focused chevron has visible focus ring
- [ ] Chevron button has `aria-expanded="true"` when block is expanded, `"false"` when collapsed
- [ ] Pressing Enter or Space on focused chevron toggles the block

RTL:

- [ ] WP admin language → Arabic / Hebrew → reload editor
- [ ] Chevron renders on the top-RIGHT (not left) — verify the loaded stylesheet is `editor-rtl.css`
- [ ] Collapsed bar layout mirrored: icon on right, preview text right-to-left
- [ ] Switch language back to English before continuing

Dark mode:

- [ ] OS-level dark mode (Windows: Settings → Personalization → Colors → Dark) OR Chrome DevTools → ⋮ → More tools → Rendering → "Emulate CSS media feature prefers-color-scheme" = dark
- [ ] Reload editor → collapsed bar background uses dark-mode rgba(29,158,117,0.12)
- [ ] Bar text uses `--block-collapser-bar-text-dark` fallback `#ddd`
- [ ] Preview text uses lighter `#999`
- [ ] Switch back to light before continuing

Frontend boundary (PRD §8 must not leak):

- [ ] View a published post on the public frontend (not wp-admin)
- [ ] DevTools → Network → no request for `/build/editor.css` or `/build/editor.js`
- [ ] DevTools → Elements → no `.block-collapser-*` classes anywhere
- [ ] View page source → none of our chevron / wrapper markup

Classic Editor:

- [ ] Install Classic Editor plugin OR open via `?classic-editor=1` → post screen is the WP 4.x textarea
- [ ] No Block Collapser scripts loaded; no console errors

Performance:

- [ ] Open a long post (50+ blocks)
- [ ] Toggle a block → DevTools Performance tab shows single-frame update
- [ ] Open Settings → switch between 4 tabs rapidly → no console warnings
- [ ] DevTools React profiler: clicking one chevron causes one HOC instance re-render, not a full editor re-render

Uninstall:

- [ ] Plugins → Block Collapser → Deactivate → Delete (will run `uninstall.php`)
- [ ] WP-CLI: `wp option get block_collapser_options` → returns "Could not get 'block_collapser_options'" (option deleted)
- [ ] localStorage entries (`block-collapser:v1:post:*`) are NOT deleted (they live in the browser, by design — we don't clear local data on uninstall)
- [ ] Multisite: Network → Plugins → Network Delete → each site's option is deleted

Error boundary:

- [ ] Manually break preview rendering: DevTools → run `wp.data.dispatch('core/block-editor').updateBlockAttributes('<some-clientId>', { content: { broken: true } })`
- [ ] If preview throws, only that block shows the red error bar; rest of editor stays functional

## Phase 7 — Launch artifacts validity

- [ ] `block-collapser.php` has all required headers (Plugin Name, Plugin URI, Description, Version, Author, License, License URI, Text Domain, Domain Path, Requires at least, Tested up to, Requires PHP)
- [ ] `readme.txt` parses — paste into https://wpvulndb.com/readme-validator/ or manually check Stable tag matches block-collapser.php Version
- [ ] `LICENSE` is GPL-2.0 — first line: "GNU GENERAL PUBLIC LICENSE / Version 2"
- [ ] `languages/block-collapser.pot` exists with both PHP and JS msgids
- [ ] `_playground/blueprint.json` validates as JSON (`node -e "JSON.parse(require('fs').readFileSync('_playground/blueprint.json','utf8'))"`)
- [ ] `assets/screenshot-1.png` … `screenshot-4.png` exist and are valid PNGs
- [ ] Distribution zip: `dist/block-collapser-1.0.0.zip` exists, contains exactly 17 entries, no `src/`, `tests/`, `docs/`, `node_modules/`, `composer.json`, `package.json`
- [ ] `docs/submission.md` runbook present

Gates:

```bash
npm run build              # zero warnings
npm run lint:js            # clean
npm run lint:css           # clean
npm test                   # 79/79 (or current count)
composer run phpstan       # 0 errors level 8
composer run phpcs         # clean
```

---

## Bug list discovered during testing (date: YYYY-MM-DD)

- [resolved] Auto-collapse-on-load did not fire on first editor load even with empty store — race condition: `subscribe` ticked before `getBlocks()` populated. Fix: only mark applied after blocks are present. See commit `da6b2f3`.

Add new findings here as you uncover them.
