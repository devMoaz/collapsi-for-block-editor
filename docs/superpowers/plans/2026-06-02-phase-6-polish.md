# Phase 6 — A11y + RTL + Dark Mode + Perf + Uninstall

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`. Phase 6 is the last polish pass before launch. Tasks are short and mostly independent — each ships its own slice.

**Goal:** Polish the plugin to ship-ready quality. Add an accessible status announcement, enqueue the auto-generated RTL stylesheet, ship a `prefers-color-scheme: dark` rule pack, prove perf on a 100-block stress page, and harden `uninstall.php`. Also explicitly re-verify the frontend boundary (PRD §8) so no Block Collapser asset leaks onto the public site.

**Architecture:** No new files in the editor surface — only refinements. New `_playground/` artifacts get scaffolded in Phase 7. Phase 6 is a series of small, independent edits across the existing layout.

**Tech Stack:** `@wordpress/a11y` `speak()` for screen-reader announcements, `wp_style_add_data` for RTL, plain `@media (prefers-color-scheme: dark)` CSS, React profiling via DevTools (manual), existing PHP `uninstall.php`.

**Cross-cutting decisions honored:**
- #2 a11y: keyboard support + ARIA + screen-reader feedback
- #11 no telemetry: perf audit is local-only; no external requests added
- #12 i18n: any new announcement strings via `__`
- Min versions: `@wordpress/a11y` is stable since WP 5.0; safe for our 6.5+ floor

---

## File structure for this phase

```
includes/
├── class-assets.php               # MODIFY — wp_style_add_data(..., 'rtl', 'replace')
└── (no other PHP)

src/editor/
├── components/
│   ├── CollapseWrapper.js         # MODIFY — speak() announcement on toggle
│   └── CollapseButton.js          # MODIFY — focus-visible polish (if needed)
├── editor.scss                    # MODIFY — dark-mode rules + focus-visible
└── (no other JS changes)

uninstall.php                      # MODIFY — multisite-aware option cleanup

docs/
└── superpowers/plans/2026-06-02-phase-6-polish.md   # this file
```

No new tests required — a11y + RTL + dark mode are observable behaviors; perf audit is manual; uninstall is verified by inspection.

---

## Task 1: Accessible announcement on collapse/expand

**Files:**
- Modify: `src/editor/components/CollapseWrapper.js`

**Rationale:** Today, when a user toggles a block, the visual change is the only feedback. Screen-reader users get nothing — `aria-expanded` on the button is one signal, but it requires the user to be focused on the button. A `wp.a11y.speak()` call announces the state change politely without taking focus.

**Phrasing:** include the block-type title so the user knows WHICH block changed (essential when toggling via Collapse All / shortcut). Example: `"Paragraph collapsed."` / `"Group expanded."`. Use `metadata.name` when set for the rename case.

- [ ] **Step 1: Update `CollapseWrapper.js`**

Add imports:

```js
import { speak } from '@wordpress/a11y';
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
```

(The blocks store import is new — used to read the block-type title for the announcement.)

Extend the `useSelect` to fetch `blockTypeTitle` alongside existing values:

```js
const { isRootBlock, isExcluded, key, isCollapsed, announcementLabel } = useSelect(
    ( select ) => {
        const blockEditor = select( blockEditorStore );
        const isRoot = ! blockEditor.getBlockRootClientId( props.clientId );
        const block = isRoot
            ? blockEditor.getBlock( props.clientId )
            : null;
        const excluded =
            block?.attributes?.metadata?.blockCollapser
                ?.neverCollapse === true;
        const computedKey =
            isRoot && ! excluded
                ? computeBlockKey( props.clientId, select )
                : null;
        const metadataName = block?.attributes?.metadata?.name;
        const blockType = select( blocksStore ).getBlockType( props.name );
        const typeTitle =
            blockType?.title ||
            props.name ||
            __( 'Block', 'block-collapser' );
        return {
            isRootBlock: isRoot,
            isExcluded: excluded,
            key: computedKey,
            isCollapsed: computedKey
                ? select( STORE_NAME ).isCollapsedByKey( computedKey )
                : false,
            announcementLabel: metadataName || typeTitle,
        };
    },
    [ props.clientId, props.name ]
);
```

Replace the `onToggle` callback so it dispatches AND announces:

```js
const onToggle = useCallback( () => {
    if ( ! key ) {
        return;
    }
    const nextCollapsed = ! isCollapsed;
    setCollapsed( key, nextCollapsed );
    speak(
        nextCollapsed
            ? sprintf(
                  /* translators: %s is the block name. */
                  __( '%s collapsed.', 'block-collapser' ),
                  announcementLabel
              )
            : sprintf(
                  /* translators: %s is the block name. */
                  __( '%s expanded.', 'block-collapser' ),
                  announcementLabel
              ),
        'polite'
    );
}, [ key, isCollapsed, setCollapsed, announcementLabel ] );
```

Note: bulk actions (Collapse All / Expand All / shortcut) dispatch via the helper functions in `sidebar/actions.js`. Adding `speak()` there too would be noisy ("Paragraph collapsed. Group collapsed. Image collapsed..."). Instead, announce a SUMMARY from the bulk action helpers:

- [ ] **Step 2: Update `src/editor/sidebar/actions.js`**

Add a single summary announcement at the end of each bulk helper:

```js
// Top of file, add:
import { speak } from '@wordpress/a11y';
import { sprintf, _n, __ } from '@wordpress/i18n';

// In collapseAllTopLevel — after the forEach loop:
const count = /* number of dispatches made */ ;
if ( count > 0 ) {
    speak(
        sprintf(
            /* translators: %d is a count of blocks. */
            _n( 'Collapsed %d block.', 'Collapsed %d blocks.', count, 'block-collapser' ),
            count
        ),
        'polite'
    );
}
```

Refactor `eachTopLevelKey` to return a count so each helper can announce:

```js
function eachTopLevelKey( select, callback ) {
    const blocks = select( 'core/block-editor' ).getBlocks();
    let count = 0;
    blocks.forEach( ( block ) => {
        if ( isNeverCollapse( block ) ) {
            return;
        }
        const key = computeBlockKey( block.clientId, select );
        if ( key ) {
            callback( key, block );
            count++;
        }
    } );
    return count;
}

export function collapseAllTopLevel( select, dispatch ) {
    const count = eachTopLevelKey( select, ( key ) => {
        dispatch( STORE_NAME ).setCollapsed( key, true );
    } );
    if ( count > 0 ) {
        speak(
            sprintf(
                _n(
                    'Collapsed %d block.',
                    'Collapsed %d blocks.',
                    count,
                    'block-collapser'
                ),
                count
            ),
            'polite'
        );
    }
}
```

Apply the same pattern to `expandAllTopLevel` (just swap the verb in the string).

For `focusMode`: announce `"Focus mode on. <Block name> only."` — use the selected block's `name` resolution.

For `toggleAllTopLevel`: announce nothing — it delegates to `collapseAllTopLevel` or `expandAllTopLevel` which will speak.

For `applyBlockRulesAutoCollapse`: announce nothing — runs at editor boot, before the user has interacted.

- [ ] **Step 3: Build + lint + test**

```
npm run build
npm run lint:js
npm test
```

All clean.

- [ ] **Step 4: Manual screen-reader smoke**

Best effort. With Chrome's "ChromeVox Classic" extension OR NVDA on Windows:
- Toggle a block → hear: "Paragraph collapsed." / "Heading expanded." etc.
- Click sidebar Collapse All → hear: "Collapsed 5 blocks."

If a screen reader isn't available, verify `aria-live="polite"` container exists in the DOM (WP a11y module injects it):

```js
// In DevTools console after a toggle:
document.querySelectorAll('[aria-live="polite"]').forEach(el => console.log(el, el.textContent));
```

- [ ] **Step 5: Commit**

```
git add src/editor/components/CollapseWrapper.js src/editor/sidebar/actions.js
git commit -m "feat(a11y): announce collapse/expand state via wp.a11y.speak"
```

---

## Task 2: RTL stylesheet

**Files:**
- Modify: `includes/class-assets.php`

**Rationale:** `@wordpress/scripts` already generates `build/editor-rtl.css` (we see it in webpack output). We just need to wire it up so WP swaps to the RTL variant when the site language is RTL. The canonical way is `wp_style_add_data( handle, 'rtl', 'replace' )` — WP detects this and substitutes the `-rtl.css` file automatically when `is_rtl()`.

- [ ] **Step 1: Add `wp_style_add_data` after the existing `wp_enqueue_style`**

Inside `enqueue_editor_style`:

```php
wp_enqueue_style(
    self::STYLE_HANDLE,
    BLOCK_COLLAPSER_URL . 'build/editor.css',
    array(),
    (string) filemtime( $style_path )
);

wp_style_add_data( self::STYLE_HANDLE, 'rtl', 'replace' );
wp_style_add_data( self::STYLE_HANDLE, 'suffix', '.min' );
```

(The `'suffix' => '.min'` line is harmless — webpack's output is already minified. Some WP installs check for it.)

Apply the SAME `wp_style_add_data` pattern to the SETTINGS page stylesheet in `includes/class-admin-page.php` after the `wp_enqueue_style` call there.

- [ ] **Step 2: PHP gates**

```
composer run phpstan
composer run phpcs
```

Both clean.

- [ ] **Step 3: Live verify RTL**

In `Settings → General → Site Language`, temporarily switch to Arabic or Hebrew. Reload editor.

- DevTools → Network → filter for `editor` → confirm WP requests `editor-rtl.css` (not `editor.css`)
- Collapse a block → verify:
  - The chevron is now on the RIGHT side of the wrapper (not left)
  - The icon/title/preview order in the bar flows right-to-left
  - The 3px accent border is on the RIGHT (`border-right`) — webpack RTL plugin flips `border-left` automatically

Switch the language back to English when done.

- [ ] **Step 4: Commit**

```
git add includes/class-assets.php includes/class-admin-page.php
git commit -m "feat(assets): enqueue editor-rtl.css via wp_style_add_data"
```

---

## Task 3: Dark mode

**Files:**
- Modify: `src/editor/editor.scss`

**Rationale:** `@media (prefers-color-scheme: dark)` reads the OS setting. The editor canvas itself doesn't yet auto-switch in core Gutenberg, but FSE themes that use dark backgrounds and many Mac/Win11 users running OS dark mode see a mismatch when our bar uses `#444` text on a darker editor background. Add a dark-aware variant that bumps text contrast and softens the accent background.

- [ ] **Step 1: Append the dark-mode block at the END of `editor.scss`**

```scss
@media (prefers-color-scheme: dark) {

	.block-collapser-wrapper.is-collapsed {
		background: rgba(29, 158, 117, 0.12);
	}

	.block-collapser-bar {
		color: var(--block-collapser-bar-text-dark, #ddd);
	}

	.block-collapser-bar__preview {
		color: #999;

		&::before {
			color: rgba(255, 255, 255, 0.25);
		}
	}

	.block-collapser-error {
		background: rgba(204, 24, 24, 0.18);
		color: #ffb4b4;
	}
}
```

The `--block-collapser-bar-text-dark` custom property allows future settings-driven override; the default `#ddd` works for OS dark mode. Don't add a settings field for it in v1 — the override hook is enough.

- [ ] **Step 2: Build + lint:css**

```
npm run build
npm run lint:css
```

Both clean.

- [ ] **Step 3: Live verify dark mode**

DevTools → ⋮ → More tools → Rendering → "Emulate CSS media feature `prefers-color-scheme`" → set to `dark`.

Open editor, collapse a block:
- Bar background should be slightly more visible (the 0.12 alpha vs 0.05)
- Bar title text should be light (`#ddd`-ish)
- Preview text and the `—` separator should be muted but readable

Reset to "no preference" when done.

- [ ] **Step 4: Commit**

```
git add src/editor/editor.scss
git commit -m "feat(editor): add prefers-color-scheme: dark variant"
```

---

## Task 4: Perf audit on 100-block stress page

**Files:**
- No code changes unless a hot spot surfaces. Audit-only task.

**Rationale:** PRD does not set a concrete perf budget, but the README and wp.org submission will be judged on "does it slow down my editor." Verify on a long page that:
- Initial editor load doesn't get visibly slower
- Toggling one block doesn't re-render all 100 wrappers
- Scrolling stays smooth

- [ ] **Step 1: Create a stress page**

In wp-admin → `Posts → Add New`. Title: "Phase 6 stress test". Paste this into the code editor (`⋮ → Code editor` mode):

```html
<!-- wp:paragraph --><p>Block 1</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>Block 2</p><!-- /wp:paragraph -->
...
```

Or generate 100 paragraph blocks via the console:

```js
// In DevTools console with the editor open
const blocks = Array.from({length: 100}, (_, i) =>
  wp.blocks.createBlock('core/paragraph', { content: `Block ${i + 1}` })
);
wp.data.dispatch('core/block-editor').insertBlocks(blocks);
```

Save the post.

- [ ] **Step 2: Profile**

Open Chrome DevTools → Performance tab → start recording → toggle one block → stop recording. Look at:
- Scripting time spent in `useSelect` callbacks for unaffected blocks (should be tiny — each is one `select()` call)
- Number of `CollapseWrapper.render` invocations (only the changed block + a few sidebar updates should re-render)
- Frame rate during scroll (60fps target)

Also open React DevTools → Profiler tab → record a toggle. Wrappers that re-render should be MINIMAL. If every wrapper re-renders, that's a regression — investigate.

- [ ] **Step 3: Memo the wrappers if needed**

If the profiler shows every wrapper re-renders on any state change, the fix is `React.memo` around the inner `CollapseWrapper` function returned by the HOC.

This is the only case where we'd add code. Don't add memo speculatively — only if profiling demands it.

If memo is needed:

```js
import { memo } from '@wordpress/element';

const InnerCollapseWrapper = memo( function CollapseWrapper( props ) {
    // ... existing component body
}, ( prev, next ) =>
    prev.clientId === next.clientId &&
    prev.name === next.name &&
    prev.isSelected === next.isSelected
);

const withCollapse = createHigherOrderComponent( ( BlockListBlock ) => {
    return function Wrapped( props ) {
        return <InnerCollapseWrapper {...props} BlockListBlock={BlockListBlock} />;
    };
}, 'withCollapse' );
```

(Pass BlockListBlock as prop to keep memo stable across HOC calls. This is a non-trivial restructure — only do it if profiling shows the problem.)

- [ ] **Step 4: Record findings**

Add a brief note to the bottom of this plan file with:
- Initial load time (network tab → DOMContentLoaded)
- Time-to-interactive on the 100-block page
- Average frame rate during scroll
- Profiler re-render count per toggle (target: 1-3 wrappers, not 100)

Format as:

```
### Perf audit results (recorded 2026-06-02)

- 100-block load: editor mounted in ~Xs
- Single toggle: Y wrappers re-rendered (expected: 1 + sidebar)
- Scroll FPS: Z (target: 60)
- Memo applied: yes/no — [reason]
```

- [ ] **Step 5: Commit (only if code changes; otherwise skip)**

If memo was added:
```
git add src/editor/components/CollapseWrapper.js
git commit -m "perf(editor): memoize CollapseWrapper to prevent unrelated re-renders"
```

Add the audit results note:

```
git add docs/superpowers/plans/2026-06-02-phase-6-polish.md
git commit -m "docs: record Phase 6 perf audit results"
```

---

### Perf audit results (recorded 2026-06-02)

Measured via Playwright with a 100-block paragraph stress page:

| Metric | Value |
|---|---|
| 100-block insertion (Gutenberg native) | 344 ms |
| Single toggle → wrapper class mutations | **1** (perfect isolation) |
| Single toggle → unique wrappers re-rendered | **1** |
| Bulk collapse all 100 → mutations observed | 8 (Gutenberg only mounts viewport-visible wrappers) |
| Bulk collapse all 100 → wall time | ~520 ms total (≈ 5 ms/dispatch) |
| `React.memo` applied | **No** — `wp.data` selector isolation is already per-`clientId`; profile showed only the changed block re-renders |

**Conclusion:** No optimization code added. The Phase 2 design (narrow boolean selector per `clientId`, memoized via `useSelect`) already achieves the goal — a toggle on block N has no impact on the render of block M. Bulk operations remain fast because Gutenberg virtualizes off-screen blocks.

The 5 ms/dispatch in bulk is dominated by `wp.data`'s subscriber notification + persistence loop's debounce coalescing. A v1.1 optimization could introduce a batched `SET_MANY_COLLAPSED` action, but it's not needed for ship.

---

## Task 5: Frontend boundary re-verification

**Rationale:** PRD §8 explicitly bounds this plugin to the editor — no frontend impact at all. Phase 2 implemented this via the `is_admin()` guard on the CSS enqueue and `enqueue_block_editor_assets` on the JS. Re-verify now that we've added settings and a localize call.

- [ ] **Step 1: View the published front-end of post #1**

Navigate to `http://localhost/block-collapser/?p=1` (logged out OR in a private window).

DevTools → Network tab → reload. Filter for `block-collapser`.

**Expected:** ZERO requests. No `editor.js`, no `editor.css`, no `settings.js`, no inline `blockCollapserSettings`.

DevTools → Console:
- `typeof window.blockCollapserSettings` should be `'undefined'`
- View source: no `block-collapser` strings in the rendered HTML

- [ ] **Step 2: View source for proof**

In the page source, search for `block-collapser`. The ONLY allowed match is the URL of post #1 itself (slug). No script tags, no inline JS, no stylesheets.

- [ ] **Step 3: If any leakage found**

Investigate the enqueue hook. The likely culprit would be `enqueue_block_assets` (no `is_admin()` guard) loading the editor CSS on frontend. Verify Phase 2's guard is still intact in `class-assets.php`.

No commit needed if clean. If a fix is needed, commit it:

```
git add includes/class-assets.php
git commit -m "fix(assets): restore is_admin guard on editor stylesheet"
```

---

## Task 6: Harden `uninstall.php`

**Files:**
- Modify: `uninstall.php`

**Rationale:** Phase 0 created `uninstall.php` (possibly a stub or minimal). Verify and improve:
1. Deletes the `block_collapser_options` option on single sites
2. On multisite, iterates each site and deletes per-site
3. Network-wide options (none in v1, but safe to delete by name if present)
4. Document why we DON'T touch localStorage (we can't from PHP, and it's per-browser anyway)

- [ ] **Step 1: Read current `uninstall.php`**

Confirm the current content. If it's just the safety stub `if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;`, replace with the full uninstall logic below.

- [ ] **Step 2: Implement multisite-aware cleanup**

```php
<?php
/**
 * Uninstall handler — runs when the user deletes the plugin from wp-admin.
 *
 * Removes the single option this plugin owns. localStorage is per-browser
 * and per-domain; it cannot be (and is not) cleared from PHP. Users who
 * want a clean slate can clear browser storage manually.
 *
 * @package BlockCollapser
 */

declare( strict_types=1 );

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

const BLOCK_COLLAPSER_OPTION = 'block_collapser_options';

if ( ! is_multisite() ) {
	delete_option( BLOCK_COLLAPSER_OPTION );
	return;
}

// Multisite: clear the option on every site in the network.
$sites = function_exists( 'get_sites' )
	? get_sites( array( 'fields' => 'ids' ) )
	: array();

foreach ( $sites as $site_id ) {
	switch_to_blog( (int) $site_id );
	delete_option( BLOCK_COLLAPSER_OPTION );
	restore_current_blog();
}

// Defensive: also clean any network-level traces (none in v1, but cheap).
delete_site_option( BLOCK_COLLAPSER_OPTION );
```

- [ ] **Step 3: PHP gates**

```
composer run phpstan
composer run phpcs
```

Both clean. (PHPStan will require `WP_UNINSTALL_PLUGIN` to be in the bootstrap stub — add if needed.)

- [ ] **Step 4: Manual smoke (optional — destructive)**

Skip if you don't want to re-activate the plugin after. If you do test it:
1. Visit settings → save a non-default value (e.g. red accent)
2. Verify the option exists: WP-CLI `wp option get block_collapser_options --format=json`
3. From the Plugins page → Deactivate Block Collapser → Delete
4. Run `wp option get block_collapser_options` — should return "Could not get option."
5. Re-install (`git restore` or re-clone) and re-activate

- [ ] **Step 5: Commit**

```
git add uninstall.php
git commit -m "feat(uninstall): clean block_collapser_options on single + multisite"
```

---

## Task 7: Phase 6 verification + roadmap update

- [ ] **Step 1: Run all 6 gates**

```
npm run build
npm run lint:js
npm run lint:css
npm test
composer run phpstan
composer run phpcs
```

All must be clean / 0 errors. Test count should be 79 (no new tests in this phase; existing tests still pass).

- [ ] **Step 2: Live smoke checklist (combined)**

Quick run through key scenarios:
- [ ] Toggle a block in Post Editor → no console errors, accent color from settings applied
- [ ] Toggle a block in Site Editor → ditto
- [ ] Emulate RTL via `Settings → Site Language` (Arabic) → chevron on the right ✓ then reset
- [ ] Emulate dark mode in DevTools rendering panel → bar text bumps to lighter color ✓ then reset
- [ ] View post #1 on the frontend (logged out) → no Block Collapser assets ✓
- [ ] Stress page with 100 blocks → smooth toggle + scroll
- [ ] Open settings → save a value → reload → setting persists

- [ ] **Step 3: Update roadmap**

Mark Phase 6 Complete ✓ in `docs/superpowers/plans/2026-06-02-roadmap.md`.

```
git add docs/superpowers/plans/2026-06-02-roadmap.md docs/superpowers/plans/2026-06-02-phase-6-polish.md
git commit -m "docs: mark Phase 6 complete in roadmap"
```

---

## Self-review for Phase 6

- [x] A11y: keyboard + ARIA + screen-reader announcement (single toggle and bulk)
- [x] RTL: `wp_style_add_data` swaps in `editor-rtl.css` automatically
- [x] Dark mode: `prefers-color-scheme: dark` adjusts bar text + background contrast
- [x] Perf: profiled on 100-block page; memo applied only if profiler demands
- [x] Frontend boundary: re-verified no leakage onto public site (PRD §8)
- [x] Uninstall: cleans option on single + multisite; documents localStorage scope
- [x] No new user-facing strings outside i18n
- [x] No new telemetry

---

## What Phase 6 does NOT do (deferred to v1.1+)

- **Dark mode toggle in settings** — OS-level `prefers-color-scheme` is the source of truth in v1
- **Custom shortcut UI** — read-only Behaviour tab tip; advanced UI deferred
- **PHPUnit tests for the sanitize callback** — defended via JS tests and live REST verification; full PHPUnit env adds Phase 0-style scaffolding cost not worth for v1
- **WCAG-AAA contrast variant for high-contrast users** — Windows High Contrast Mode is forced-colors and overrides our CSS naturally; no extra work needed
- **Editor canvas dark-mode detection (vs OS)** — Gutenberg doesn't expose a dark-mode signal in 6.5; OS-level is the only portable check
- **Cleanup of orphan localStorage entries on uninstall** — impossible from PHP; documented in uninstall.php comment
