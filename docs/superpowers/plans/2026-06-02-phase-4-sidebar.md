# Phase 4 — PluginSidebar + Keyboard Shortcuts + Per-Block Exclude

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`. Phase 3 + Phase 4 are being executed back-to-back in a single rolling flow — this plan picks up immediately after Phase 3's last commit. Do not pause between them.

**Goal:** Give users an editor-level UX surface for the collapse system: a `PluginSidebar` with Collapse All / Expand All / Focus Mode, an `Alt+Shift+C` keyboard shortcut that toggles between collapsed/expanded, and a per-block "Never collapse this block" entry in the block-settings menu that persists with the post.

**Architecture:** New `src/editor/sidebar/` directory hosts the `PluginSidebar` component and helper actions. New `src/editor/shortcuts/` registers shortcuts via `@wordpress/keyboard-shortcuts`. New `src/editor/components/BlockMenuEntry.js` slot-fills `BlockSettingsMenuControls` with the exclude toggle. `CollapseWrapper` is extended to short-circuit wrapping when the block has `attributes.metadata.blockCollapser.neverCollapse === true`. Editor entry `registerPlugin`s the sidebar + shortcut registrar + menu entry.

**Tech Stack:** `@wordpress/editor` (`PluginSidebar`), `@wordpress/plugins` (`registerPlugin`), `@wordpress/keyboard-shortcuts` (`registerShortcut`, `useShortcut`), `@wordpress/block-editor` (`BlockSettingsMenuControls`, `updateBlockAttributes`), `@wordpress/components` (`Button`, `MenuItem`), `@wordpress/icons`.

**Cross-cutting decisions honored:**
- #2 Single `PluginSidebar` panel with 3 actions (Collapse All / Expand All / Focus Mode)
- #5 `BlockSettingsMenuControls` SlotFill (not a custom context menu)
- #6 `@wordpress/keyboard-shortcuts` — `Alt+Shift+C` for Collapse/Expand All toggle, discoverable via WP's shortcut help modal
- #12 i18n: all strings via `__`

---

## File structure for this phase

```
src/editor/
├── index.js                       # MODIFY — registerPlugin for sidebar + shortcuts + menu
├── components/
│   ├── CollapseWrapper.js         # MODIFY — respect metadata.blockCollapser.neverCollapse
│   └── BlockMenuEntry.js          # CREATE — BlockSettingsMenuControls + MenuItem
├── sidebar/
│   ├── CollapserSidebar.js        # CREATE — PluginSidebar with 3 action buttons
│   └── actions.js                 # CREATE — collapseAllTopLevel/expandAllTopLevel/focusMode helpers
└── shortcuts/
    └── register.js                # CREATE — ShortcutRegistrar component
```

**No PHP changes.**

---

## Design notes

### Bulk action helpers — keep them simple

`collapseAllTopLevel`, `expandAllTopLevel`, `focusMode` are plain functions that take `(select, dispatch)` from `@wordpress/data` — NOT thunk actions registered on the store. Reason: the bulk operation is the responsibility of the UI surface that triggers it, not the data layer. The store stays a dumb map.

Each helper:
1. Reads top-level blocks from `core/block-editor`
2. Computes the persistence key for each (via existing `computeBlockKey`)
3. Dispatches `setCollapsed(key, bool)` for each

The wrapper's `useSelect` subscriptions re-render the affected blocks. The persistence loop's debounce coalesces the writes into a single localStorage commit.

### `Alt+Shift+C` toggle semantics

If ANY top-level block is currently expanded → collapse all. Otherwise → expand all. This matches PRD §4.1 "Collapse All / Expand All" being a single toggle and avoids needing a second shortcut.

### "Never collapse this block" persistence

Stored at `block.attributes.metadata.blockCollapser = { neverCollapse: true }`. Reasoning:
- `metadata` is the canonical namespace for block-instance metadata (Gutenberg's Rename feature uses `metadata.name`)
- Nested under `blockCollapser` to keep our plugin's keys isolated
- Persists with the post (so the user's choice survives editor reloads on saved posts)
- No new option storage required

CollapseWrapper, when wrapping a top-level block, checks this and short-circuits to a bare `<BlockListBlock {...props} />` when set. No chevron renders. No state collapsed.

### Why not a single `excludedBlocks` array in settings?

Settings (Phase 5) will offer block-type-level rules ("never auto-collapse Cover blocks across the site"). Per-instance exclusion is a different concern — it's about THIS Cover specifically. Storing per-instance via metadata keeps the two cleanly separated.

---

## Task 1: Bulk action helpers

**Files:**
- Create: `src/editor/sidebar/actions.js`
- Test: `tests/unit/sidebar/actions.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/sidebar/actions.test.js
import {
	collapseAllTopLevel,
	expandAllTopLevel,
	focusMode,
} from '../../../src/editor/sidebar/actions';

function makeFixture( { topLevelBlocks, selectedClientId = null } ) {
	const calls = [];
	const blockMap = new Map();
	topLevelBlocks.forEach( ( b ) => blockMap.set( b.clientId, b ) );

	const select = ( storeName ) => {
		if ( storeName === 'core/block-editor' ) {
			return {
				getBlocks: () => topLevelBlocks,
				getBlock: ( id ) => blockMap.get( id ) ?? null,
				getBlockRootClientId: ( id ) => {
					const b = blockMap.get( id );
					return b ? '' : '';
				},
				getBlockIndex: ( id ) =>
					topLevelBlocks.findIndex( ( b ) => b.clientId === id ),
				getSelectedBlockClientId: () => selectedClientId,
			};
		}
		return {};
	};

	const dispatch = ( storeName ) => ( {
		setCollapsed: ( key, val ) => {
			calls.push( { storeName, key, val } );
		},
	} );

	return { select, dispatch, calls };
}

describe( 'collapseAllTopLevel', () => {
	it( 'dispatches setCollapsed(true) for each top-level block', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{ clientId: 'a', attributes: {} },
				{ clientId: 'b', attributes: {} },
			],
		} );
		collapseAllTopLevel( select, dispatch );
		expect( calls ).toEqual( [
			{ storeName: 'block-collapser/editor', key: '0', val: true },
			{ storeName: 'block-collapser/editor', key: '1', val: true },
		] );
	} );

	it( 'prefers metadata.name keys when present', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{
					clientId: 'a',
					attributes: { metadata: { name: 'hero' } },
				},
			],
		} );
		collapseAllTopLevel( select, dispatch );
		expect( calls ).toEqual( [
			{
				storeName: 'block-collapser/editor',
				key: 'name:hero',
				val: true,
			},
		] );
	} );

	it( 'skips blocks excluded via metadata.blockCollapser.neverCollapse', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{ clientId: 'a', attributes: {} },
				{
					clientId: 'b',
					attributes: {
						metadata: { blockCollapser: { neverCollapse: true } },
					},
				},
			],
		} );
		collapseAllTopLevel( select, dispatch );
		expect( calls ).toHaveLength( 1 );
		expect( calls[ 0 ].key ).toBe( '0' );
	} );
} );

describe( 'expandAllTopLevel', () => {
	it( 'dispatches setCollapsed(false) for each top-level block', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{ clientId: 'a', attributes: {} },
				{ clientId: 'b', attributes: {} },
			],
		} );
		expandAllTopLevel( select, dispatch );
		expect( calls.every( ( c ) => c.val === false ) ).toBe( true );
		expect( calls ).toHaveLength( 2 );
	} );
} );

describe( 'focusMode', () => {
	it( 'collapses all except the selected top-level block', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{ clientId: 'a', attributes: {} },
				{ clientId: 'b', attributes: {} },
				{ clientId: 'c', attributes: {} },
			],
			selectedClientId: 'b',
		} );
		focusMode( select, dispatch );
		const map = Object.fromEntries(
			calls.map( ( c ) => [ c.key, c.val ] )
		);
		expect( map ).toEqual( { 0: true, 1: false, 2: true } );
	} );

	it( 'no-op when no block is selected', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [ { clientId: 'a', attributes: {} } ],
			selectedClientId: null,
		} );
		focusMode( select, dispatch );
		expect( calls ).toEqual( [] );
	} );
} );
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx jest tests/unit/sidebar/actions.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement helpers**

```js
// src/editor/sidebar/actions.js
/**
 * Bulk helpers that operate on top-level blocks in the editor.
 *
 * These are NOT registered as wp.data thunk actions — they are plain
 * functions called from the sidebar buttons + shortcut handler. The
 * store stays a dumb {key: true} map; orchestrating "do this for every
 * top-level block" is a UI-layer concern.
 *
 * Each helper:
 *   1. Reads top-level blocks from core/block-editor.
 *   2. Skips any block excluded via metadata.blockCollapser.neverCollapse.
 *   3. Computes the persistence key (via computeBlockKey).
 *   4. Dispatches setCollapsed on block-collapser/editor.
 */

import { STORE_NAME } from '../store';
import { computeBlockKey } from '../utils/pathKey';

function isNeverCollapse( block ) {
	return (
		block?.attributes?.metadata?.blockCollapser?.neverCollapse === true
	);
}

function eachTopLevelKey( select, callback ) {
	const blocks = select( 'core/block-editor' ).getBlocks();
	blocks.forEach( ( block ) => {
		if ( isNeverCollapse( block ) ) {
			return;
		}
		const key = computeBlockKey( block.clientId, select );
		if ( key ) {
			callback( key, block );
		}
	} );
}

export function collapseAllTopLevel( select, dispatch ) {
	eachTopLevelKey( select, ( key ) => {
		dispatch( STORE_NAME ).setCollapsed( key, true );
	} );
}

export function expandAllTopLevel( select, dispatch ) {
	eachTopLevelKey( select, ( key ) => {
		dispatch( STORE_NAME ).setCollapsed( key, false );
	} );
}

export function focusMode( select, dispatch ) {
	const selectedClientId = select(
		'core/block-editor'
	).getSelectedBlockClientId();
	if ( ! selectedClientId ) {
		return;
	}

	// Walk up to the top-level ancestor.
	let topLevelId = selectedClientId;
	let guard = 0;
	while ( guard < 256 ) {
		const parent =
			select( 'core/block-editor' ).getBlockRootClientId( topLevelId );
		if ( ! parent ) {
			break;
		}
		topLevelId = parent;
		guard++;
	}

	eachTopLevelKey( select, ( key, block ) => {
		dispatch( STORE_NAME ).setCollapsed(
			key,
			block.clientId !== topLevelId
		);
	} );
}

export function toggleAllTopLevel( select, dispatch ) {
	const collapsedMap = select( STORE_NAME ).getCollapsedMap();
	let anyExpanded = false;
	eachTopLevelKey( select, ( key ) => {
		if ( ! collapsedMap[ key ] ) {
			anyExpanded = true;
		}
	} );
	if ( anyExpanded ) {
		collapseAllTopLevel( select, dispatch );
	} else {
		expandAllTopLevel( select, dispatch );
	}
}
```

(Note: `toggleAllTopLevel` is included here even though Task 1's tests don't cover it — it's a thin wrapper over the other two, used by the keyboard shortcut in Task 3. Adding a test for it is optional; the helpers it composes are already tested.)

- [ ] **Step 4: Run tests + lint**

```
npx jest tests/unit/sidebar/actions.test.js
npm run lint:js -- src/editor/sidebar/actions.js tests/unit/sidebar/actions.test.js
```

Expected: tests green, lint clean.

- [ ] **Step 5: Commit**

```
git add src/editor/sidebar/actions.js tests/unit/sidebar/actions.test.js
git commit -m "feat(editor/sidebar): add bulk collapse/expand/focus helpers"
```

---

## Task 2: `CollapserSidebar` component

**Files:**
- Create: `src/editor/sidebar/CollapserSidebar.js`

- [ ] **Step 1: Implement**

```js
// src/editor/sidebar/CollapserSidebar.js
import { PluginSidebar } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronUp, chevronDown, group } from '@wordpress/icons';
import { dispatch as wpDispatch, select as wpSelect } from '@wordpress/data';
import {
	collapseAllTopLevel,
	expandAllTopLevel,
	focusMode,
} from './actions';

const SIDEBAR_NAME = 'block-collapser';

function CollapserSidebar() {
	const { topLevelCount } = useSelect( ( select ) => {
		const blocks = select( 'core/block-editor' ).getBlocks();
		return { topLevelCount: blocks.length };
	}, [] );

	const onCollapseAll = () =>
		collapseAllTopLevel( wpSelect, wpDispatch );
	const onExpandAll = () => expandAllTopLevel( wpSelect, wpDispatch );
	const onFocusMode = () => focusMode( wpSelect, wpDispatch );

	return (
		<PluginSidebar
			name={ SIDEBAR_NAME }
			title={ __( 'Block Collapser', 'block-collapser' ) }
			icon={ group }
		>
			<div className="block-collapser-sidebar">
				<p className="block-collapser-sidebar__hint">
					{ __(
						'Manage which top-level blocks are collapsed in this editor.',
						'block-collapser'
					) }
				</p>
				<div className="block-collapser-sidebar__actions">
					<Button
						variant="primary"
						icon={ chevronUp }
						onClick={ onCollapseAll }
						disabled={ topLevelCount === 0 }
					>
						{ __( 'Collapse All', 'block-collapser' ) }
					</Button>
					<Button
						variant="secondary"
						icon={ chevronDown }
						onClick={ onExpandAll }
						disabled={ topLevelCount === 0 }
					>
						{ __( 'Expand All', 'block-collapser' ) }
					</Button>
					<Button
						variant="tertiary"
						onClick={ onFocusMode }
					>
						{ __( 'Focus Mode', 'block-collapser' ) }
					</Button>
				</div>
				<p className="block-collapser-sidebar__shortcut">
					{ __(
						'Tip: Alt+Shift+C toggles all.',
						'block-collapser'
					) }
				</p>
			</div>
		</PluginSidebar>
	);
}

export default CollapserSidebar;
export { SIDEBAR_NAME };
```

- [ ] **Step 2: Add minimal SCSS for sidebar layout**

Append to `src/editor/editor.scss`:

```scss
.block-collapser-sidebar {
    padding: 16px;

    &__hint {
        margin: 0 0 12px;
        color: #555;
        font-size: 12px;
    }

    &__actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &__shortcut {
        margin: 16px 0 0;
        color: #888;
        font-size: 11px;
        font-style: italic;
    }
}
```

- [ ] **Step 3: Build + lint**

```
npm run build
npm run lint:js -- src/editor/sidebar/CollapserSidebar.js
npm run lint:css
```

Expected: all clean.

- [ ] **Step 4: Commit**

```
git add src/editor/sidebar/CollapserSidebar.js src/editor/editor.scss
git commit -m "feat(editor/sidebar): add PluginSidebar with bulk actions"
```

---

## Task 3: Keyboard shortcut

**Files:**
- Create: `src/editor/shortcuts/register.js`

**Rationale:** WP's `@wordpress/keyboard-shortcuts` requires registering the shortcut once (with `registerShortcut`) AND attaching a handler via `useShortcut`. We do both inside a tiny React component that returns `null`; it gets mounted via `registerPlugin` from `index.js`.

- [ ] **Step 1: Implement**

```js
// src/editor/shortcuts/register.js
/**
 * Registers Alt+Shift+C → toggle Collapse All / Expand All.
 *
 * Mounted via registerPlugin in the editor entry. Renders nothing —
 * exists only to wire registerShortcut + useShortcut into the React tree.
 */

import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as shortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import {
	useDispatch,
	select as wpSelect,
	dispatch as wpDispatch,
} from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { toggleAllTopLevel } from '../sidebar/actions';

const SHORTCUT_NAME = 'block-collapser/toggle-all';

function ShortcutRegistrar() {
	const { registerShortcut } = useDispatch( shortcutsStore );

	useEffect( () => {
		registerShortcut( {
			name: SHORTCUT_NAME,
			category: 'block',
			description: __(
				'Toggle collapse/expand all top-level blocks',
				'block-collapser'
			),
			keyCombination: {
				modifier: 'access',
				character: 'c',
			},
		} );
	}, [ registerShortcut ] );

	useShortcut( SHORTCUT_NAME, () => {
		toggleAllTopLevel( wpSelect, wpDispatch );
	} );

	return null;
}

export default ShortcutRegistrar;
export { SHORTCUT_NAME };
```

(Note: `modifier: 'access'` is WP's cross-platform key alias — `Alt+Shift` on Windows/Linux, `Ctrl+Alt` on macOS. Matches PRD §6 accessibility convention and the shortcut help modal's notation.)

- [ ] **Step 2: Build + lint**

```
npm run build
npm run lint:js -- src/editor/shortcuts/register.js
```

Expected: clean.

- [ ] **Step 3: Commit**

```
git add src/editor/shortcuts/register.js
git commit -m "feat(editor/shortcuts): register Alt+Shift+C toggle-all shortcut"
```

---

## Task 4: `BlockMenuEntry` — "Never collapse this block"

**Files:**
- Create: `src/editor/components/BlockMenuEntry.js`

**Rationale:** `BlockSettingsMenuControls` SlotFill renders a child render prop for each block's settings dropdown (the three-dot menu on the block toolbar). We render a `MenuItem` only for single-selection top-level blocks (no-op for nested or multi-select). Clicking writes `metadata.blockCollapser.neverCollapse` via `updateBlockAttributes` and closes the menu.

- [ ] **Step 1: Implement**

```js
// src/editor/components/BlockMenuEntry.js
/**
 * Renders a "Never collapse this block" / "Allow collapsing this block"
 * entry in each block's three-dot settings menu.
 *
 * Stored at attributes.metadata.blockCollapser.neverCollapse so the
 * choice persists with the post. CollapseWrapper short-circuits when
 * the flag is true.
 */

import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function BlockMenuEntry() {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, onClose } ) => {
				if (
					! Array.isArray( selectedClientIds ) ||
					selectedClientIds.length !== 1
				) {
					return null;
				}
				return (
					<NeverCollapseToggle
						clientId={ selectedClientIds[ 0 ] }
						onClose={ onClose }
					/>
				);
			} }
		</BlockSettingsMenuControls>
	);
}

function NeverCollapseToggle( { clientId, onClose } ) {
	const { isTopLevel, metadata } = useSelect(
		( select ) => {
			const editor = select( 'core/block-editor' );
			return {
				isTopLevel: ! editor.getBlockRootClientId( clientId ),
				metadata:
					editor.getBlock( clientId )?.attributes?.metadata ?? {},
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	if ( ! isTopLevel ) {
		return null;
	}

	const isExcluded = metadata?.blockCollapser?.neverCollapse === true;

	const onToggle = () => {
		updateBlockAttributes( clientId, {
			metadata: {
				...metadata,
				blockCollapser: {
					...( metadata?.blockCollapser ?? {} ),
					neverCollapse: ! isExcluded,
				},
			},
		} );
		onClose();
	};

	return (
		<MenuItem onClick={ onToggle }>
			{ isExcluded
				? __( 'Allow collapsing this block', 'block-collapser' )
				: __( 'Never collapse this block', 'block-collapser' ) }
		</MenuItem>
	);
}

export default BlockMenuEntry;
```

- [ ] **Step 2: Build + lint**

```
npm run build
npm run lint:js -- src/editor/components/BlockMenuEntry.js
```

Expected: clean.

- [ ] **Step 3: Commit**

```
git add src/editor/components/BlockMenuEntry.js
git commit -m "feat(editor): add 'Never collapse this block' menu entry"
```

---

## Task 5: Wire exclusion into `CollapseWrapper`

**Files:**
- Modify: `src/editor/components/CollapseWrapper.js`

**Rationale:** After Task 4 ships the toggle, the wrapper needs to honor it. Read `metadata.blockCollapser.neverCollapse` inside the existing `useSelect` (the wrapper already fetches the block). If true, short-circuit to a bare `<BlockListBlock {...props} />` — no chevron, no wrapper div, no store interaction.

- [ ] **Step 1: Update `useSelect` to read exclusion**

Read current `CollapseWrapper.js`. Extend the selector:

```js
const { isRootBlock, key, isCollapsed, isExcluded } = useSelect(
	( select ) => {
		const blockEditor = select( blockEditorStore );
		const isRoot = ! blockEditor.getBlockRootClientId( props.clientId );
		const block = isRoot ? blockEditor.getBlock( props.clientId ) : null;
		const excluded =
			block?.attributes?.metadata?.blockCollapser?.neverCollapse ===
			true;
		const computedKey =
			isRoot && ! excluded
				? computeBlockKey( props.clientId, select )
				: null;
		return {
			isRootBlock: isRoot,
			isExcluded: excluded,
			key: computedKey,
			isCollapsed: computedKey
				? select( STORE_NAME ).isCollapsedByKey( computedKey )
				: false,
		};
	},
	[ props.clientId ]
);
```

And add an early return after the nested-block guard:

```js
if ( ! isRootBlock ) {
	return <BlockListBlock { ...props } />;
}

if ( isExcluded ) {
	return <BlockListBlock { ...props } />;
}
```

- [ ] **Step 2: Build + lint + test**

```
npm run build
npm run lint:js -- src/editor/components/CollapseWrapper.js
npm test
```

Expected: build clean, lint clean, tests still pass.

- [ ] **Step 3: Commit**

```
git add src/editor/components/CollapseWrapper.js
git commit -m "feat(editor): honor metadata.blockCollapser.neverCollapse"
```

---

## Task 6: Mount sidebar + shortcuts + menu via `registerPlugin`

**Files:**
- Modify: `src/editor/index.js`

**Rationale:** `registerPlugin` is the canonical hook for editor-level slot fills. One plugin registration mounts CollapserSidebar + ShortcutRegistrar + BlockMenuEntry as siblings inside a fragment, so they all live inside the editor's React tree (required for `useShortcut` to bind and `PluginSidebar` to mount).

- [ ] **Step 1: Update `src/editor/index.js`**

Read current file. Add imports + registerPlugin call at the bottom, AFTER the existing persistence loop.

New full content:

```js
import { addFilter } from '@wordpress/hooks';
import { dispatch, select, subscribe } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';
import { STORE_NAME, store as collapserStore } from './store';
import { readState, writeState } from './store/persistence';
import withCollapse from './components/CollapseWrapper';
import BlockMenuEntry from './components/BlockMenuEntry';
import CollapserSidebar from './sidebar/CollapserSidebar';
import ShortcutRegistrar from './shortcuts/register';
import './editor.scss';

addFilter(
	'editor.BlockListBlock',
	'block-collapser/with-collapse',
	withCollapse
);

const DEBOUNCE_MS = 500;

function startPersistenceLoop() {
	let hydratedForPostId = null;
	let writeTimer = null;
	let lastWritten = null;

	const scheduleWrite = ( contextKey, collapsed ) => {
		if ( writeTimer ) {
			window.clearTimeout( writeTimer );
		}
		writeTimer = window.setTimeout( () => {
			writeState( contextKey, collapsed );
			lastWritten = collapsed;
		}, DEBOUNCE_MS );
	};

	subscribe( () => {
		const postId = select( editorStore )?.getCurrentPostId?.() ?? 0;
		const collapsed = select( STORE_NAME ).getCollapsedMap();

		if ( postId && hydratedForPostId !== postId ) {
			const stored = readState( `post:${ postId }` );
			const wasAutoDraft = hydratedForPostId === 0;
			hydratedForPostId = postId;

			if ( stored ) {
				dispatch( STORE_NAME ).hydrate( stored );
				lastWritten = select( STORE_NAME ).getCollapsedMap();
			} else if ( wasAutoDraft && Object.keys( collapsed ).length > 0 ) {
				writeState( `post:${ postId }`, collapsed );
				lastWritten = collapsed;
			}
			return;
		}

		if ( postId && collapsed !== lastWritten ) {
			scheduleWrite( `post:${ postId }`, collapsed );
		}

		if ( ! postId && hydratedForPostId === null ) {
			hydratedForPostId = 0;
		}
	} );
}

function CollapserPlugin() {
	return (
		<>
			<ShortcutRegistrar />
			<CollapserSidebar />
			<BlockMenuEntry />
		</>
	);
}

if ( typeof window !== 'undefined' ) {
	startPersistenceLoop();
	registerPlugin( 'block-collapser', {
		render: CollapserPlugin,
	} );
}

export { collapserStore };
```

- [ ] **Step 2: Build + lint + test**

```
npm run build
npm run lint:js
npm test
```

Expected: clean across the board.

- [ ] **Step 3: Commit**

```
git add src/editor/index.js
git commit -m "feat(editor): mount sidebar, shortcut, and block menu via registerPlugin"
```

---

## Task 7: Phase 3 + 4 combined live verification

This is the verification gate for BOTH phases.

- [ ] **Step 1: Run all automated gates**

```
npm run build
npm run lint:js
npm run lint:css
npm test
composer run phpstan
composer run phpcs
```

All must be clean / 0 errors.

- [ ] **Step 2: Live smoke — Phase 3 preview**

Login at `http://localhost/block-collapser/wp-admin/` and open the test post:
- Collapse blocks of types: paragraph, image, group, columns, cover
- Verify each bar shows: `<icon> <title> — <preview>` with the expected preview content
- Toggle reduce-motion via DevTools → confirm bar appears instantly, no fade
- Screenshot showing 3+ block types collapsed with previews → `phase3-4-previews.png`

- [ ] **Step 3: Live smoke — Phase 4 sidebar**

In the same editor session:
- Open the PluginSidebar via the editor's plugin icon (top-right). Verify "Block Collapser" panel appears with 3 buttons + hint text.
- Click **Collapse All** — all top-level blocks collapse
- Click **Expand All** — all top-level blocks expand
- Click a block (e.g. the Cover), then click **Focus Mode** — all OTHER top-level blocks collapse, the Cover stays expanded
- Take a screenshot of the sidebar open with focus mode active → `phase4-sidebar.png`

- [ ] **Step 4: Live smoke — Phase 4 keyboard shortcut**

- Press `Alt+Shift+C` — if any block was expanded, all collapse. Press again — all expand.
- Open WP's keyboard shortcut help modal (`?` key in the editor). Verify "Block Collapser" shortcut appears under the Block category with description.

- [ ] **Step 5: Live smoke — Phase 4 per-block exclusion**

- Select a top-level Cover block. Click its three-dot menu → click **"Never collapse this block"**.
- Verify the chevron disappears from that Cover. It cannot be collapsed.
- Reopen the menu → entry now reads **"Allow collapsing this block"**. Click it.
- Verify chevron returns.
- Save the post. Reload. Verify exclusion persists for whatever state you left.

- [ ] **Step 6: Update roadmap**

Edit `docs/superpowers/plans/2026-06-02-roadmap.md`:
- Mark row 3 (Phase 3) Complete ✓ with link to `2026-06-02-phase-3-preview.md`
- Mark row 4 (Phase 4) Complete ✓ with link to `2026-06-02-phase-4-sidebar.md`

Commit:

```
git add docs/superpowers/plans/2026-06-02-roadmap.md
git commit -m "docs: mark Phase 3 + Phase 4 complete in roadmap"
```

---

## Self-review for Phase 4

- [x] Cross-cutting decision #2: single `PluginSidebar` with 3 actions, works in Post Editor and Site Editor (registerPlugin works in both)
- [x] #5: `BlockSettingsMenuControls` SlotFill, not a custom menu
- [x] #6: `@wordpress/keyboard-shortcuts` with `access` modifier (Alt+Shift on Win/Linux, Ctrl+Alt on macOS), discoverable in WP's shortcut help modal
- [x] #12: all strings `__('...', 'block-collapser')`
- [x] No telemetry, no external requests
- [x] Per-instance exclusion persists with the post (via `metadata`), not via separate storage
- [x] CollapseWrapper short-circuits cleanly for excluded blocks — no chevron, no wrapper

---

## What Phase 4 does NOT do (deferred)

- **Block-type-level rules** (e.g. "never auto-collapse Cover" globally) — Phase 5 settings
- **Default-collapsed-on-load rules** — Phase 5 settings
- **Color/visual customization of bar accent** — Phase 5 Appearance tab
- **"Collapse all in this section" for inner blocks** — out of v1 scope
- **Mobile/touch interaction polish** — Phase 6
