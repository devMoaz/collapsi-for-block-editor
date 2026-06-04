# Phase 1 — Core HOC + Toggle Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap every block in the editor canvas with a higher-order component that adds a chevron toggle button (visible on hover or selection) and, when clicked, collapses the block's inner content to a placeholder bar — using only per-block React state (persistence comes in Phase 2). Must work on core blocks, ACF blocks, and arbitrary third-party blocks in both Post Editor and Site Editor.

**Architecture:** Register a `wp.hooks.addFilter('editor.BlockListBlock', ...)` HOC in `src/editor/index.js`. The HOC (`CollapseWrapper`) holds local state via `useState`, wraps the original `BlockListBlock` child in a React `ErrorBoundary` so a buggy third-party block can't take the canvas down through us, and renders a `CollapseButton` (chevron from `@wordpress/icons`). When collapsed, the block's content is hidden via a CSS class — no DOM destruction (so React reconciliation stays clean for the wrapped block). The `Assets` class is extended to enqueue the auto-emitted `editor.css` alongside `editor.js`.

**Tech Stack:** `@wordpress/element` (React) · `@wordpress/components` (Button) · `@wordpress/icons` (chevronUp/chevronDown) · `@wordpress/i18n` · `@wordpress/hooks` (addFilter) · `@wordpress/compose` (createHigherOrderComponent) · SCSS via `@wordpress/scripts` built-in stylelint + sass-loader.

**Working directory throughout:** `E:\projects\block-collapser\wp-content\plugins\block-collapser\`

**Phase 0 gates that must remain green after every commit:** `npm run build`, `npm run lint:js`, `npm run lint:css`, `composer run phpstan`, `composer run phpcs`.

---

## Cross-cutting reminders (locked decisions from roadmap)

- **Decision 7 (motion):** Respect `prefers-reduced-motion: reduce` in `editor.scss` — fall back to instant transitions when set.
- **Decision 10 (error boundary):** Wrap HOC inner content in a React `ErrorBoundary` so a buggy third-party block can't crash the canvas through us. **Required, not optional, in Phase 1.**
- **Decision 11 (no telemetry):** Do not add any analytics, external fetch, or "report a bug" links.
- **Decision 12 (i18n):** All user-visible strings via `__()` from `@wordpress/i18n`. `wp_set_script_translations` is already wired in Task 4 of Phase 0.
- **Decision 13 (browser support):** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. CSS variables and `:hover` work everywhere we care about; modern selectors are fine.
- **Persistence:** **Not in this phase.** Phase 2 adds the `@wordpress/data` store and localStorage. Phase 1 uses `useState` per block instance only. State is intentionally lost on editor reload — that's expected.

---

## File map (final shape after Phase 1)

New files:
```
src/editor/
├── index.js                       (modified — registers HOC filter)
├── components/
│   ├── CollapseWrapper.js         (NEW — the HOC)
│   ├── CollapseButton.js          (NEW — chevron toggle)
│   └── ErrorBoundary.js           (NEW — defensive wrapper)
├── editor.scss                    (NEW — collapse styles)
└── (existing files unchanged)
includes/
└── class-assets.php               (modified — also enqueue editor.css)
tests/
└── unit/
    └── ErrorBoundary.test.js      (NEW — small Jest smoke test)
```

---

## Task 1 — Editor CSS enqueue support in `Assets` class

**Files:**
- Modify: `includes/class-assets.php`
- Test gates: PHPStan, PHPCS

**Why:** `@wordpress/scripts` auto-emits `build/editor.css` from any `.scss` import inside `src/editor/index.js`. The runtime needs to enqueue it alongside `editor.js`, conditionally (only if the file exists — to keep the no-CSS-yet case clean).

- [ ] **Step 1.1: Add a STYLE_HANDLE constant and CSS enqueue logic to `Assets`**

Open `includes/class-assets.php`. After the existing `public const HANDLE` line, add a second constant, then extend `enqueue_editor()` to also enqueue the stylesheet if `build/editor.css` exists.

The current `enqueue_editor` method ends with `wp_set_script_translations( self::HANDLE, 'block-collapser' );`. Insert the CSS block immediately after that line, before the closing `}`:

```php
		wp_set_script_translations( self::HANDLE, 'block-collapser' );

		$style_path = BLOCK_COLLAPSER_DIR . 'build/editor.css';

		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				self::STYLE_HANDLE,
				BLOCK_COLLAPSER_URL . 'build/editor.css',
				array(),
				(string) filemtime( $style_path )
			);
		}
	}
```

And add the constant near the existing `HANDLE`:

```php
	public const HANDLE       = 'block-collapser-editor';
	public const STYLE_HANDLE = 'block-collapser-editor-style';
```

- [ ] **Step 1.2: Verify PHPStan + PHPCS**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && vendor/bin/phpstan analyse --memory-limit=512M --no-progress 2>/dev/null | tail -3 && composer run phpcs 2>&1 | tail -3
```

Expected: PHPStan `[OK] No errors`. PHPCS zero violations. If PHPCBF can auto-fix the alignment of the two `=` signs (`HANDLE       =` vs `STYLE_HANDLE =`), run it: `composer run phpcbf`, then re-run `phpcs`.

- [ ] **Step 1.3: Commit**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && git add includes/class-assets.php && git commit -m "feat(assets): enqueue editor.css alongside editor.js when present"
```

---

## Task 2 — `ErrorBoundary` component

**Files:**
- Create: `src/editor/components/ErrorBoundary.js`
- Create: `tests/unit/ErrorBoundary.test.js`
- Test gates: Jest, ESLint, build

**Why:** Required by cross-cutting decision #10. If a third-party block throws during render, our HOC will catch it and render a small fallback bar so the rest of the canvas keeps working.

- [ ] **Step 2.1: Create the component**

```js
/**
 * ErrorBoundary — class component that catches render errors in its subtree.
 * Required around the wrapped BlockListBlock so a buggy third-party block
 * can't take down the editor canvas through Block Collapser.
 */

import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class ErrorBoundary extends Component {
	constructor( props ) {
		super( props );
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch( error ) {
		// eslint-disable-next-line no-console
		console.error( '[block-collapser] block render error', error );
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<div className="block-collapser-error">
					{ __( 'Block Collapser caught a render error in this block.', 'block-collapser' ) }
				</div>
			);
		}
		return this.props.children;
	}
}

export default ErrorBoundary;
```

- [ ] **Step 2.2: Write the test (TDD: write the test, see it fail, then verify it passes)**

`@wordpress/scripts` ships `jest` + `@testing-library/react`. Use `@testing-library/react` to render the boundary with a throwing child and assert the fallback is shown.

Create `tests/unit/ErrorBoundary.test.js`:

```js
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../src/editor/components/ErrorBoundary';

function Boom() {
	throw new Error( 'boom' );
}

describe( 'ErrorBoundary', () => {
	beforeEach( () => {
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'renders children when nothing throws', () => {
		render(
			<ErrorBoundary>
				<span>ok</span>
			</ErrorBoundary>
		);
		expect( screen.getByText( 'ok' ) ).toBeInTheDocument();
	} );

	it( 'renders fallback when a child throws', () => {
		render(
			<ErrorBoundary>
				<Boom />
			</ErrorBoundary>
		);
		expect(
			screen.getByText( /caught a render error/i )
		).toBeInTheDocument();
	} );
} );
```

- [ ] **Step 2.3: Install the testing-library peer dep if missing**

`@wordpress/scripts@30` includes `jest`, `babel-jest`, and `jest-environment-jsdom`, but `@testing-library/react` and `@testing-library/jest-dom` are usually NOT included. Verify:

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm ls @testing-library/react 2>&1 | tail -3
```

If absent, install them as devDependencies (keep `--legacy-peer-deps` consistent with `.npmrc`):

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm install --save-dev --legacy-peer-deps @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.4.0
```

(The matchers from `jest-dom` like `.toBeInTheDocument()` need configuration — add a `jest.setup.js` in the next step.)

- [ ] **Step 2.4: Add Jest setup file for `@testing-library/jest-dom` matchers**

Create `jest.setup.js` at the repo root:

```js
import '@testing-library/jest-dom';
```

And tell `@wordpress/scripts`' Jest config to pick it up. The simplest path is a `jest` block in `package.json`:

```json
"jest": {
  "setupFilesAfterEach": ["<rootDir>/jest.setup.js"]
}
```

Wait — `@wordpress/scripts` uses its own jest config (`@wordpress/jest-preset-default`). Override via `jest.config.js`:

```js
const defaultPreset = require( '@wordpress/jest-preset-default/jest-preset' );

module.exports = {
	...defaultPreset,
	setupFilesAfterEach: [
		...( defaultPreset.setupFilesAfterEach || [] ),
		'<rootDir>/jest.setup.js',
	],
};
```

Create that as `jest.config.js` at the repo root.

- [ ] **Step 2.5: Run the test**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm test -- --testPathPattern=ErrorBoundary 2>&1 | tail -20
```

Expected: 2 tests pass. The `[block-collapser] block render error` console.error call is suppressed by the `jest.spyOn(console, 'error')` mock.

If the test fails because Jest can't find `@testing-library/jest-dom/matchers`, the import path or the setup file path is wrong — re-check.

- [ ] **Step 2.6: Lint**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm run lint:js
```

Expected: exit 0.

- [ ] **Step 2.7: Build (to confirm the test file is excluded from production build)**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm run build 2>&1 | tail -5
```

Expected: `compiled successfully`. The 4 build artifacts produced (still no editor.css — that comes in Task 5).

- [ ] **Step 2.8: Commit**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && git add src/editor/components/ErrorBoundary.js tests/unit/ErrorBoundary.test.js jest.config.js jest.setup.js package.json package-lock.json && git commit -m "feat(editor): add ErrorBoundary component with Jest setup"
```

---

## Task 3 — `CollapseButton` component

**Files:**
- Create: `src/editor/components/CollapseButton.js`
- Test gates: ESLint, build

**Why:** A small presentational component for the chevron toggle. Splitting it out keeps `CollapseWrapper` focused on logic.

- [ ] **Step 3.1: Create the component**

```js
/**
 * CollapseButton — chevron toggle for collapsing/expanding a block.
 * Presentational only; owner component holds the state.
 */

import { Button } from '@wordpress/components';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

function CollapseButton( { isCollapsed, onToggle } ) {
	const label = isCollapsed
		? __( 'Expand block', 'block-collapser' )
		: __( 'Collapse block', 'block-collapser' );

	return (
		<Button
			className="block-collapser-toggle"
			icon={ isCollapsed ? chevronDown : chevronUp }
			label={ label }
			showTooltip
			size="small"
			onClick={ onToggle }
			aria-expanded={ ! isCollapsed }
		/>
	);
}

export default CollapseButton;
```

- [ ] **Step 3.2: Lint**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm run lint:js
```

Expected: exit 0. If ESLint flags missing PropTypes — the `@wordpress/eslint-plugin/recommended` preset does NOT require PropTypes, so this should pass. If it does flag them, add minimal PropTypes (but first verify it's actually the rule firing).

- [ ] **Step 3.3: Build (verify import resolution from `@wordpress/components` + `@wordpress/icons`)**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm run build 2>&1 | tail -8
```

Expected: `compiled successfully`. Both `@wordpress/components` and `@wordpress/icons` are externalized (wp-icons is in BUNDLED_PACKAGES so it bundles — that's fine). `editor.asset.php` now declares `wp-components` and `wp-element` as dependencies.

- [ ] **Step 3.4: Commit**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && git add src/editor/components/CollapseButton.js && git commit -m "feat(editor): add CollapseButton chevron toggle component"
```

---

## Task 4 — `CollapseWrapper` HOC

**Files:**
- Create: `src/editor/components/CollapseWrapper.js`
- Test gates: ESLint, build

**Why:** The heart of the plugin. Wraps every block in the canvas with the toggle and conditional collapse rendering.

- [ ] **Step 4.1: Create the HOC**

```js
/**
 * CollapseWrapper — higher-order component that wraps every BlockListBlock
 * with a chevron toggle and collapsed-state CSS class.
 *
 * Phase 1: local state only (useState). Phase 2 will move state into a
 * @wordpress/data store with localStorage persistence.
 */

import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useCallback } from '@wordpress/element';
import ErrorBoundary from './ErrorBoundary';
import CollapseButton from './CollapseButton';

const withCollapse = createHigherOrderComponent( ( BlockListBlock ) => {
	return function CollapseWrapper( props ) {
		const [ isCollapsed, setIsCollapsed ] = useState( false );

		const onToggle = useCallback( () => {
			setIsCollapsed( ( prev ) => ! prev );
		}, [] );

		const wrapperClassName = [
			'block-collapser-wrapper',
			isCollapsed ? 'is-collapsed' : 'is-expanded',
		].join( ' ' );

		return (
			<div className={ wrapperClassName } data-block-collapser="1">
				<div className="block-collapser-toggle-host">
					<CollapseButton
						isCollapsed={ isCollapsed }
						onToggle={ onToggle }
					/>
				</div>
				<ErrorBoundary>
					<BlockListBlock { ...props } />
				</ErrorBoundary>
			</div>
		);
	};
}, 'withCollapse' );

export default withCollapse;
```

Notes on choices:
- Wrapping in a `<div>` rather than via `useBlockProps` because we're outside the block's own render — this is the WP filter contract.
- `data-block-collapser="1"` lets future CSS / debug tools target our wrapped blocks unambiguously.
- `useCallback` so the `onToggle` reference is stable across re-renders.
- We pass `props` through to `BlockListBlock` unchanged — collapse state is invisible to the wrapped block.

- [ ] **Step 4.2: Lint + build**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm run lint:js && npm run build 2>&1 | tail -5
```

Expected: both clean. Build size for `editor.js` will grow noticeably (now includes the HOC + button — still well under 10KB).

- [ ] **Step 4.3: Commit**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && git add src/editor/components/CollapseWrapper.js && git commit -m "feat(editor): add CollapseWrapper HOC with local toggle state"
```

---

## Task 5 — Editor styles

**Files:**
- Create: `src/editor/editor.scss`
- Test gates: stylelint, build

**Why:** Visual chrome — chevron positioning, hover-to-reveal, collapsed-state hiding, accent stripe, prefers-reduced-motion.

- [ ] **Step 5.1: Write the stylesheet**

```scss
/**
 * Block Collapser — editor-only styles.
 * Loaded via enqueue_block_editor_assets so they inject into the iframed editor.
 */

.block-collapser-wrapper {
	position: relative;

	.block-collapser-toggle-host {
		position: absolute;
		top: 4px;
		left: 4px;
		z-index: 30;
		opacity: 0;
		transition: opacity 120ms ease-in-out;
		pointer-events: none;
	}

	&:hover .block-collapser-toggle-host,
	&:focus-within .block-collapser-toggle-host {
		opacity: 1;
		pointer-events: auto;
	}

	&.is-collapsed {
		/* Hide the wrapped BlockListBlock subtree; keep our wrapper visible. */
		> .components-error-boundary,
		> div:not(.block-collapser-toggle-host) {
			display: none;
		}

		/* Compact bar feel — full version arrives in Phase 3. */
		min-height: 40px;
		padding: 8px 8px 8px 36px;
		border-left: 3px solid #1d9e75;
		background: rgba(29, 158, 117, 0.05);
		border-radius: 2px;

		.block-collapser-toggle-host {
			opacity: 1;
			pointer-events: auto;
		}
	}
}

.block-collapser-toggle {
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.12);
	border-radius: 2px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.block-collapser-error {
	padding: 8px 12px;
	border-left: 3px solid #cc1818;
	background: rgba(204, 24, 24, 0.06);
	color: #8a0f0f;
	font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
	.block-collapser-wrapper .block-collapser-toggle-host {
		transition: none;
	}
}
```

- [ ] **Step 5.2: Run stylelint**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm run lint:css 2>&1 | tail -8
```

Expected: zero violations. If stylelint flags anything, fix per its message — common ones are missing leading zero on decimals, color hex case, etc.

- [ ] **Step 5.3: Commit**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && git add src/editor/editor.scss && git commit -m "feat(editor): add collapse styles with prefers-reduced-motion fallback"
```

---

## Task 6 — Wire up filter registration in editor entry

**Files:**
- Modify: `src/editor/index.js`
- Test gates: ESLint, build (must produce editor.css now)

**Why:** Without `addFilter` registration nothing the HOC defines actually runs. This step is what makes Block Collapser visible in the editor.

- [ ] **Step 6.1: Replace the placeholder `src/editor/index.js` with the real registration**

Current content is a `console.info(...)` smoke-test. Replace with:

```js
/**
 * Editor entry — registers the BlockListBlock filter that wraps every block
 * with the collapse toggle.
 */

import { addFilter } from '@wordpress/hooks';
import withCollapse from './components/CollapseWrapper';
import './editor.scss';

addFilter(
	'editor.BlockListBlock',
	'block-collapser/with-collapse',
	withCollapse
);
```

- [ ] **Step 6.2: Build and confirm `editor.css` is now emitted**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && rm -rf build/ && npm run build 2>&1 | tail -10 && ls build/
```

Expected:
- `compiled successfully`
- `build/` contains `editor.js`, `editor.asset.php`, `editor.css`, `settings.js`, `settings.asset.php`
- `editor.asset.php` declares dependencies including `wp-hooks`, `wp-element`, `wp-compose`, `wp-components`, `wp-i18n` (verify by viewing the file)

```bash
cat build/editor.asset.php
```
Expected: an array with `dependencies` including the above and a `version` hash.

- [ ] **Step 6.3: Lint**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && npm run lint:js && npm run lint:css
```

Both clean.

- [ ] **Step 6.4: Confirm PHP gates still pass**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && vendor/bin/phpstan analyse --memory-limit=512M --no-progress 2>/dev/null | tail -3 && composer run phpcs 2>&1 | tail -3
```

Expected: both clean.

- [ ] **Step 6.5: Commit**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && git add src/editor/index.js && git commit -m "feat(editor): register editor.BlockListBlock filter with collapse HOC"
```

---

## Task 7 — Phase 1 verification gate (and roadmap update)

**Files:**
- Modify: `docs/superpowers/plans/2026-06-02-roadmap.md` (mark Phase 1 complete)

- [ ] **Step 7.1: Run the full automated gate**

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && rm -rf build/ && \
  npm run build 2>&1 | tail -3 && \
  npm run lint:js && echo "LINT_JS=$?" && \
  npm run lint:css && echo "LINT_CSS=$?" && \
  npm test 2>&1 | tail -10 && \
  vendor/bin/phpstan analyse --memory-limit=512M --no-progress 2>/dev/null | tail -3 && \
  composer run phpcs 2>&1 | tail -3
```

Every gate must be green. If any fail, fix before continuing.

- [ ] **Step 7.2: Hand off the manual smoke test to the user**

The implementer subagent should report DONE and explicitly request these manual verifications from the user. They cannot be automated:

1. At `http://localhost/block-collapser/wp-admin/` — deactivate then reactivate the plugin.
2. Open any post with several different block types (Paragraph, Heading, Image, Group with nested blocks, Cover, Columns).
3. Hover any block — a small chevron button should appear in the top-left corner.
4. Click the chevron — the block's content collapses to a compact 40px green-accented bar; chevron flips direction.
5. Click again — block restores to full height.
6. Repeat on an ACF block if available, and on any custom block.
7. Open `Appearance → Editor` (Site Editor) and confirm the chevron appears on blocks there too.
8. View a frontend page — confirm the chevron does NOT appear (it's editor-only).
9. Reload the editor — collapse state should be LOST (expected; persistence is Phase 2).
10. Optional sanity: deliberately corrupt one block in a test post (e.g., an Embed with a malformed URL) — confirm the error boundary's "Block Collapser caught a render error" message renders without breaking the rest of the canvas.

Report any visual glitches: button positioning issues, z-index conflicts with WP toolbars, layout shifts when hovering, RTL mirroring problems.

- [ ] **Step 7.3: Update roadmap and commit**

Edit `docs/superpowers/plans/2026-06-02-roadmap.md` — change Phase 1's Status from `Not started` to `Complete ✓`.

```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser" && git add docs/superpowers/plans/2026-06-02-roadmap.md && git commit -m "docs: mark Phase 1 complete in roadmap"
```

---

## Self-review against the spec

- [x] **Cross-cutting decision #10 (Error boundary)** — `ErrorBoundary` created in Task 2, used in Task 4.
- [x] **Cross-cutting decision #7 (prefers-reduced-motion)** — `@media (prefers-reduced-motion: reduce)` block in `editor.scss` (Task 5).
- [x] **Cross-cutting decision #12 (i18n)** — `__()` calls in `ErrorBoundary` and `CollapseButton`.
- [x] **Editor-only enforcement** — CSS is enqueued via the existing `enqueue_block_editor_assets` hook in Task 1's extended `Assets` class; never loaded on frontend.
- [x] **Iframe safety** — editor.css is enqueued via `enqueue_block_editor_assets` (Phase 0 already verified this hook reaches the iframe).
- [x] **No persistence yet** — `useState` only; no `localStorage`, no `@wordpress/data` store. That's Phase 2.
- [x] **HOC perf consideration (decision #15-ish)** — `useCallback` for `onToggle`. The HOC is registered once; per-block state is local.
- [x] **Works for all block types** — `editor.BlockListBlock` filter fires for every block in the canvas regardless of namespace. Core, ACF, custom.
- [x] **Test coverage proportional to phase** — One trivial smoke test for `ErrorBoundary` (the only piece amenable to a unit test without mounting a full editor). Wrapper/Button tests skipped — they'd require WP store mocking out of proportion to Phase 1's scope.

## Placeholder scan

- [x] Every code block is complete and runnable.
- [x] No "TBD" / "implement later" / "similar to" references.
- [x] Every command has expected output.
- [x] File paths absolute from plugin root.

## Type / name consistency

- [x] `Assets::STYLE_HANDLE` constant name used consistently in Step 1.1.
- [x] `withCollapse` HOC name used in CollapseWrapper.js (default export) and matches the second arg to `createHigherOrderComponent`.
- [x] Filter namespace `block-collapser/with-collapse` matches the package name convention.
- [x] CSS class names `block-collapser-wrapper`, `block-collapser-toggle-host`, `block-collapser-toggle`, `block-collapser-error`, `is-collapsed`, `is-expanded` used consistently between Task 4 (JS) and Task 5 (SCSS).

---

## Phase 1 completion deliverable

After Task 7 passes, the plugin in `http://localhost/block-collapser/wp-admin/` has:
- A chevron toggle button visible on hover over every block in both Post Editor and Site Editor.
- Clicking toggles the block between full-height (normal) and a compact collapsed bar (40px tall, green left stripe).
- A user-facing fallback if a third-party block throws during render.
- Zero frontend impact, confirmed by source inspection.
- All Phase 0 gates still green; new Jest gate (`npm test`) also green with 2 passing tests.

When the user signs off on the manual smoke test, write the Phase 2 plan (state store + structural-path persistence).
