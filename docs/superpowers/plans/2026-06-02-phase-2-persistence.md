# Phase 2 — State Store + Structural-Path Persistence

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-component `useState` with a shared `@wordpress/data` store. Persist the collapsed-block map to `localStorage` keyed by structural path or user-set `metadata.name`, scoped per post/template, with graceful auto-draft fallback.

**Architecture:** New `block-collapser/editor` store (`createReduxStore` + `register`) owns `{ [key]: true }` map. `CollapseWrapper` reads via `useSelect`, writes via `useDispatch`. A subscribe loop on `core/editor` hydrates state when the post id resolves and debounces write-back to `localStorage`. Auto-draft (`postId === 0`) keeps state in-memory only until first save, then migrates.

**Tech Stack:** `@wordpress/data` (`createReduxStore`, `register`, `subscribe`), `@wordpress/block-editor` (`getBlockRootClientId`, `getBlockIndex`, `getBlock`), `@wordpress/editor` (`getCurrentPostId`), Jest + `@testing-library/react`.

**Cross-cutting decisions honored:**
- #1 Persistence identity scheme: structural path (`"0.2.1"`) + `metadata.name` fallback (`"name:<name>"`)
- #3 State management: `@wordpress/data` only, selectors return narrow `bool` per `clientId`, memoized
- #8 Auto-draft: in-memory only until first save, then migrate to `localStorage`
- #9 Synced patterns: Phase 1's top-level-only wrapping already handles this; no new logic needed
- #11 Telemetry: none — `localStorage` is local-only

---

## File structure for this phase

```
src/editor/
├── index.js                       # MODIFY — register store, start hydration loop
├── components/
│   └── CollapseWrapper.js         # MODIFY — replace useState with store
├── store/
│   ├── index.js                   # CREATE — createReduxStore + register
│   ├── reducer.js                 # CREATE
│   ├── actions.js                 # CREATE
│   ├── selectors.js               # CREATE
│   └── persistence.js             # CREATE — localStorage I/O + debounce
└── utils/
    └── pathKey.js                 # CREATE — clientId → "0.2.1" or "name:foo"

tests/unit/
├── pathKey.test.js                # CREATE
├── store/
│   ├── reducer.test.js            # CREATE
│   ├── selectors.test.js          # CREATE
│   └── persistence.test.js        # CREATE
```

**No PHP changes in this phase.**

---

## Task 1: `pathKey` utility — clientId → stable key

**Files:**
- Create: `src/editor/utils/pathKey.js`
- Test: `tests/unit/pathKey.test.js`

**Rationale:** Computes a stable identifier for a block. If the user set a `metadata.name` (Gutenberg's rename feature), use `"name:<name>"` so the key survives reorder. Otherwise walk up the tree producing dot-joined indices (`"0.2.1"` = root[0].inner[2].inner[1]).

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/pathKey.test.js
import { computeBlockKey } from '../../src/editor/utils/pathKey';

function makeSelect( { parents, indices, blocks } ) {
	return ( storeName ) => {
		if ( storeName === 'core/block-editor' || storeName?.name === 'core/block-editor' ) {
			return {
				getBlockRootClientId: ( id ) => parents[ id ] ?? '',
				getBlockIndex: ( id ) => indices[ id ] ?? 0,
				getBlock: ( id ) => blocks[ id ] ?? null,
			};
		}
		return {};
	};
}

describe( 'computeBlockKey', () => {
	it( 'returns "name:<name>" when metadata.name is set', () => {
		const select = makeSelect( {
			parents: { a: '' },
			indices: { a: 0 },
			blocks: { a: { attributes: { metadata: { name: 'hero-cta' } } } },
		} );
		expect( computeBlockKey( 'a', select ) ).toBe( 'name:hero-cta' );
	} );

	it( 'returns dot-joined path for top-level block without name', () => {
		const select = makeSelect( {
			parents: { a: '' },
			indices: { a: 2 },
			blocks: { a: { attributes: {} } },
		} );
		expect( computeBlockKey( 'a', select ) ).toBe( '2' );
	} );

	it( 'returns dot-joined path for nested block', () => {
		// tree: root[0].inner[2].inner[1] = c
		const select = makeSelect( {
			parents: { a: '', b: 'a', c: 'b' },
			indices: { a: 0, b: 2, c: 1 },
			blocks: { a: {}, b: {}, c: {} },
		} );
		expect( computeBlockKey( 'c', select ) ).toBe( '0.2.1' );
	} );

	it( 'prefers metadata.name even on nested blocks', () => {
		const select = makeSelect( {
			parents: { a: '', b: 'a' },
			indices: { a: 0, b: 1 },
			blocks: { a: {}, b: { attributes: { metadata: { name: 'pricing-row' } } } },
		} );
		expect( computeBlockKey( 'b', select ) ).toBe( 'name:pricing-row' );
	} );

	it( 'returns null for unknown clientId', () => {
		const select = makeSelect( { parents: {}, indices: {}, blocks: {} } );
		expect( computeBlockKey( '', select ) ).toBeNull();
	} );
} );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/pathKey.test.js`
Expected: FAIL — `Cannot find module '../../src/editor/utils/pathKey'`.

- [ ] **Step 3: Implement `computeBlockKey`**

```js
// src/editor/utils/pathKey.js
/**
 * Computes a stable persistence key for a block.
 *
 * Prefers user-set metadata.name (survives reorder).
 * Falls back to dot-joined structural path from root.
 *
 * @param {string}   clientId Block clientId.
 * @param {Function} select   wp.data.select function (injected for testability).
 * @return {string|null} Key like "name:hero-cta" or "0.2.1", or null if unknown.
 */
export function computeBlockKey( clientId, select ) {
	if ( ! clientId ) {
		return null;
	}

	const blockEditor = select( 'core/block-editor' );
	if ( ! blockEditor ) {
		return null;
	}

	const block = blockEditor.getBlock( clientId );
	const metadataName = block?.attributes?.metadata?.name;
	if ( metadataName ) {
		return `name:${ metadataName }`;
	}

	const parts = [];
	let current = clientId;
	let guard = 0;
	while ( current && guard < 256 ) {
		parts.unshift( String( blockEditor.getBlockIndex( current ) ) );
		current = blockEditor.getBlockRootClientId( current );
		guard++;
	}
	return parts.join( '.' );
}
```

- [ ] **Step 4: Run tests, verify all pass**

Run: `npx jest tests/unit/pathKey.test.js`
Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```
git add src/editor/utils/pathKey.js tests/unit/pathKey.test.js
git commit -m "feat(editor): add pathKey utility for stable block persistence keys"
```

---

## Task 2: Reducer — collapsed map state

**Files:**
- Create: `src/editor/store/reducer.js`
- Test: `tests/unit/store/reducer.test.js`

**Rationale:** Single map of `{ [key: string]: true }`. Setting `false` removes the key (keeps map sparse). `HYDRATE` replaces the whole map (used on editor load and auto-draft migration). `CLEAR_ALL` empties the map.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/store/reducer.test.js
import reducer, { DEFAULT_STATE } from '../../../src/editor/store/reducer';

describe( 'reducer', () => {
	it( 'returns default state for unknown action', () => {
		expect( reducer( undefined, { type: 'UNKNOWN' } ) ).toEqual( DEFAULT_STATE );
	} );

	it( 'SET_COLLAPSED true adds key', () => {
		const next = reducer( DEFAULT_STATE, {
			type: 'SET_COLLAPSED',
			key: '0.1',
			isCollapsed: true,
		} );
		expect( next.collapsed ).toEqual( { '0.1': true } );
	} );

	it( 'SET_COLLAPSED false removes key', () => {
		const state = { ...DEFAULT_STATE, collapsed: { '0.1': true, '0.2': true } };
		const next = reducer( state, {
			type: 'SET_COLLAPSED',
			key: '0.1',
			isCollapsed: false,
		} );
		expect( next.collapsed ).toEqual( { '0.2': true } );
	} );

	it( 'SET_COLLAPSED with missing key is a no-op', () => {
		const next = reducer( DEFAULT_STATE, { type: 'SET_COLLAPSED', key: '', isCollapsed: true } );
		expect( next ).toBe( DEFAULT_STATE );
	} );

	it( 'HYDRATE replaces collapsed map', () => {
		const state = { ...DEFAULT_STATE, collapsed: { 'old': true } };
		const next = reducer( state, { type: 'HYDRATE', collapsed: { '0': true, 'name:a': true } } );
		expect( next.collapsed ).toEqual( { '0': true, 'name:a': true } );
	} );

	it( 'HYDRATE with non-object falls back to empty map', () => {
		const next = reducer( DEFAULT_STATE, { type: 'HYDRATE', collapsed: null } );
		expect( next.collapsed ).toEqual( {} );
	} );

	it( 'CLEAR_ALL empties the map', () => {
		const state = { ...DEFAULT_STATE, collapsed: { 'a': true, 'b': true } };
		const next = reducer( state, { type: 'CLEAR_ALL' } );
		expect( next.collapsed ).toEqual( {} );
	} );
} );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/store/reducer.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the reducer**

```js
// src/editor/store/reducer.js
export const DEFAULT_STATE = {
	collapsed: {},
};

function isPlainObject( value ) {
	return value !== null && typeof value === 'object' && ! Array.isArray( value );
}

export default function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'SET_COLLAPSED': {
			if ( ! action.key ) {
				return state;
			}
			const next = { ...state.collapsed };
			if ( action.isCollapsed ) {
				next[ action.key ] = true;
			} else {
				delete next[ action.key ];
			}
			return { ...state, collapsed: next };
		}
		case 'HYDRATE':
			return {
				...state,
				collapsed: isPlainObject( action.collapsed ) ? { ...action.collapsed } : {},
			};
		case 'CLEAR_ALL':
			return { ...state, collapsed: {} };
		default:
			return state;
	}
}
```

- [ ] **Step 4: Run tests, verify all pass**

Run: `npx jest tests/unit/store/reducer.test.js`
Expected: 7/7 PASS.

- [ ] **Step 5: Commit**

```
git add src/editor/store/reducer.js tests/unit/store/reducer.test.js
git commit -m "feat(editor/store): add reducer with collapsed map + HYDRATE/CLEAR"
```

---

## Task 3: Actions + selectors

**Files:**
- Create: `src/editor/store/actions.js`
- Create: `src/editor/store/selectors.js`
- Test: `tests/unit/store/selectors.test.js`

**Rationale:** Action creators stay tiny (just shape the action). Selectors return a narrow `bool` per `clientId` so React only re-renders the one block whose key actually flipped (perf decision #3 from roadmap).

- [ ] **Step 1: Write the failing selector test**

```js
// tests/unit/store/selectors.test.js
import { isCollapsedByKey, getCollapsedMap } from '../../../src/editor/store/selectors';

describe( 'selectors', () => {
	const state = { collapsed: { '0.1': true, 'name:hero': true } };

	it( 'isCollapsedByKey returns true for present key', () => {
		expect( isCollapsedByKey( state, '0.1' ) ).toBe( true );
		expect( isCollapsedByKey( state, 'name:hero' ) ).toBe( true );
	} );

	it( 'isCollapsedByKey returns false for absent key', () => {
		expect( isCollapsedByKey( state, '0.2' ) ).toBe( false );
	} );

	it( 'isCollapsedByKey returns false for null/empty key', () => {
		expect( isCollapsedByKey( state, null ) ).toBe( false );
		expect( isCollapsedByKey( state, '' ) ).toBe( false );
	} );

	it( 'getCollapsedMap returns the same reference across calls when state unchanged', () => {
		const a = getCollapsedMap( state );
		const b = getCollapsedMap( state );
		expect( a ).toBe( b );
	} );
} );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/store/selectors.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement actions**

```js
// src/editor/store/actions.js
export function setCollapsed( key, isCollapsed ) {
	return { type: 'SET_COLLAPSED', key, isCollapsed: !! isCollapsed };
}

export function toggleCollapsed( key, currentValue ) {
	return setCollapsed( key, ! currentValue );
}

export function hydrate( collapsed ) {
	return { type: 'HYDRATE', collapsed };
}

export function clearAll() {
	return { type: 'CLEAR_ALL' };
}
```

- [ ] **Step 4: Implement selectors**

```js
// src/editor/store/selectors.js
export function isCollapsedByKey( state, key ) {
	if ( ! key ) {
		return false;
	}
	return state.collapsed[ key ] === true;
}

export function getCollapsedMap( state ) {
	return state.collapsed;
}
```

- [ ] **Step 5: Run tests, verify all pass**

Run: `npx jest tests/unit/store/selectors.test.js`
Expected: 4/4 PASS.

- [ ] **Step 6: Commit**

```
git add src/editor/store/actions.js src/editor/store/selectors.js tests/unit/store/selectors.test.js
git commit -m "feat(editor/store): add action creators and memoized selectors"
```

---

## Task 4: Register the store

**Files:**
- Create: `src/editor/store/index.js`
- Modify: `src/editor/index.js` (add import to register on bundle load)

**Rationale:** `createReduxStore` + `register` is the canonical Gutenberg pattern. Importing `./store` from the editor entry registers it as a side effect, ensuring it's available before any `CollapseWrapper` mounts.

- [ ] **Step 1: Write the store registration**

```js
// src/editor/store/index.js
import { createReduxStore, register } from '@wordpress/data';
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

export const STORE_NAME = 'block-collapser/editor';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
```

- [ ] **Step 2: Import the store from the editor entry**

Read current `src/editor/index.js` to confirm shape, then update.

Current content (Phase 1):
```js
import { addFilter } from '@wordpress/hooks';
import withCollapse from './components/CollapseWrapper';
import './editor.scss';

addFilter( 'editor.BlockListBlock', 'block-collapser/with-collapse', withCollapse );
```

Update to:
```js
import { addFilter } from '@wordpress/hooks';
import './store';
import withCollapse from './components/CollapseWrapper';
import './editor.scss';

addFilter( 'editor.BlockListBlock', 'block-collapser/with-collapse', withCollapse );
```

- [ ] **Step 3: Build and verify no errors**

Run: `npm run build`
Expected: Build succeeds, `build/editor.js` and `build/editor.asset.php` regenerate.

- [ ] **Step 4: Commit**

```
git add src/editor/store/index.js src/editor/index.js
git commit -m "feat(editor/store): register block-collapser/editor data store"
```

---

## Task 5: Wire `CollapseWrapper` to the store

**Files:**
- Modify: `src/editor/components/CollapseWrapper.js`

**Rationale:** Replace local `useState` with `useSelect( isCollapsedByKey )` + `useDispatch( setCollapsed )`. Compute the key once per render via the existing block-editor selectors. Memoize the toggle handler so child `CollapseButton` doesn't re-render on unrelated store changes.

- [ ] **Step 1: Update `CollapseWrapper.js`**

```js
// src/editor/components/CollapseWrapper.js
/**
 * CollapseWrapper — higher-order component that wraps every top-level
 * BlockListBlock with a chevron toggle and collapsed-state CSS class.
 *
 * Phase 2: state lives in the block-collapser/editor wp.data store,
 * keyed by structural path or metadata.name. Phase 3 will add per-block
 * preview content to the collapsed bar.
 */

import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { STORE_NAME } from '../store';
import { computeBlockKey } from '../utils/pathKey';
import ErrorBoundary from './ErrorBoundary';
import CollapseButton from './CollapseButton';
import CollapseBar from './CollapseBar';

const withCollapse = createHigherOrderComponent( ( BlockListBlock ) => {
	return function CollapseWrapper( props ) {
		const { isRootBlock, key, isCollapsed } = useSelect(
			( select ) => {
				const blockEditor = select( blockEditorStore );
				const isRoot = ! blockEditor.getBlockRootClientId( props.clientId );
				const computedKey = isRoot
					? computeBlockKey( props.clientId, select )
					: null;
				return {
					isRootBlock: isRoot,
					key: computedKey,
					isCollapsed: computedKey
						? select( STORE_NAME ).isCollapsedByKey( computedKey )
						: false,
				};
			},
			[ props.clientId ]
		);

		const { setCollapsed } = useDispatch( STORE_NAME );

		const onToggle = useCallback( () => {
			if ( key ) {
				setCollapsed( key, ! isCollapsed );
			}
		}, [ key, isCollapsed, setCollapsed ] );

		if ( ! isRootBlock ) {
			return <BlockListBlock { ...props } />;
		}

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
				{ isCollapsed && (
					<CollapseBar
						name={ props.name }
						clientId={ props.clientId }
					/>
				) }
				<div className="block-collapser-content">
					<ErrorBoundary>
						<BlockListBlock { ...props } />
					</ErrorBoundary>
				</div>
			</div>
		);
	};
}, 'withCollapse' );

export default withCollapse;
```

- [ ] **Step 2: Build and verify no errors**

Run: `npm run build && npm run lint:js`
Expected: Build clean, lint clean.

- [ ] **Step 3: Smoke test in browser**

Login at `http://localhost/block-collapser/wp-admin/` (`moaz`/`moaz`), open Post Editor for any post:
- Toggle a block — verify it collapses
- Toggle another block — verify both stay collapsed independently
- Expand the first one — verify second stays collapsed
- (No reload yet; persistence is Task 6.)

- [ ] **Step 4: Commit**

```
git add src/editor/components/CollapseWrapper.js
git commit -m "feat(editor): move collapse state from useState to wp.data store"
```

---

## Task 6: `localStorage` persistence layer

**Files:**
- Create: `src/editor/store/persistence.js`
- Test: `tests/unit/store/persistence.test.js`

**Rationale:** Pure functions for `read`/`write`/`clear` on `localStorage`. Wrap all I/O in `try`/`catch` so quota/disabled/parse errors degrade to "no persistence" instead of breaking the editor. Versioned key prefix (`block-collapser:v1:`) leaves room for schema migration in future.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/store/persistence.test.js
import {
	getStorageKey,
	readState,
	writeState,
	clearState,
	STORAGE_PREFIX,
} from '../../../src/editor/store/persistence';

describe( 'persistence', () => {
	beforeEach( () => {
		localStorage.clear();
	} );

	it( 'getStorageKey prefixes with version namespace', () => {
		expect( getStorageKey( 'post:42' ) ).toBe( `${ STORAGE_PREFIX }:post:42` );
	} );

	it( 'readState returns null when nothing stored', () => {
		expect( readState( 'post:42' ) ).toBeNull();
	} );

	it( 'writeState then readState round-trips', () => {
		writeState( 'post:42', { '0': true, 'name:hero': true } );
		expect( readState( 'post:42' ) ).toEqual( { '0': true, 'name:hero': true } );
	} );

	it( 'readState returns null on corrupted JSON', () => {
		localStorage.setItem( getStorageKey( 'post:42' ), 'not-json{' );
		expect( readState( 'post:42' ) ).toBeNull();
	} );

	it( 'readState returns null when stored value is not a plain object', () => {
		localStorage.setItem( getStorageKey( 'post:42' ), JSON.stringify( [ 1, 2, 3 ] ) );
		expect( readState( 'post:42' ) ).toBeNull();
	} );

	it( 'writeState with empty context key is a no-op', () => {
		writeState( '', { '0': true } );
		expect( localStorage.length ).toBe( 0 );
	} );

	it( 'clearState removes the entry', () => {
		writeState( 'post:42', { '0': true } );
		clearState( 'post:42' );
		expect( readState( 'post:42' ) ).toBeNull();
	} );

	it( 'writeState swallows quota errors', () => {
		const orig = Storage.prototype.setItem;
		Storage.prototype.setItem = () => {
			throw new Error( 'QuotaExceeded' );
		};
		expect( () => writeState( 'post:42', { '0': true } ) ).not.toThrow();
		Storage.prototype.setItem = orig;
	} );
} );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/store/persistence.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement persistence**

```js
// src/editor/store/persistence.js
/**
 * localStorage persistence for the block-collapser editor store.
 *
 * Key namespace: block-collapser:v1:<context>
 *   context = "post:<postId>" for saved posts/templates
 *   auto-draft posts (postId === 0) are NOT persisted from here —
 *   the hydration loop holds them in-memory until first save.
 *
 * All I/O is wrapped in try/catch so a disabled or full localStorage
 * degrades to "no persistence" rather than breaking the editor.
 */

export const STORAGE_PREFIX = 'block-collapser:v1';

export function getStorageKey( contextKey ) {
	return `${ STORAGE_PREFIX }:${ contextKey }`;
}

function isPlainObject( value ) {
	return value !== null && typeof value === 'object' && ! Array.isArray( value );
}

export function readState( contextKey ) {
	if ( ! contextKey ) {
		return null;
	}
	try {
		const raw = window.localStorage.getItem( getStorageKey( contextKey ) );
		if ( raw === null ) {
			return null;
		}
		const parsed = JSON.parse( raw );
		return isPlainObject( parsed ) ? parsed : null;
	} catch ( e ) {
		return null;
	}
}

export function writeState( contextKey, collapsed ) {
	if ( ! contextKey ) {
		return;
	}
	try {
		window.localStorage.setItem(
			getStorageKey( contextKey ),
			JSON.stringify( collapsed )
		);
	} catch ( e ) {
		// quota exceeded, disabled storage, etc. — silently degrade
	}
}

export function clearState( contextKey ) {
	if ( ! contextKey ) {
		return;
	}
	try {
		window.localStorage.removeItem( getStorageKey( contextKey ) );
	} catch ( e ) {
		// ignore
	}
}
```

- [ ] **Step 4: Run tests, verify all pass**

Run: `npx jest tests/unit/store/persistence.test.js`
Expected: 8/8 PASS.

- [ ] **Step 5: Commit**

```
git add src/editor/store/persistence.js tests/unit/store/persistence.test.js
git commit -m "feat(editor/store): add localStorage persistence with safe I/O"
```

---

## Task 7: Hydration loop + debounced write-back + auto-draft migration

**Files:**
- Modify: `src/editor/index.js`

**Rationale:** Editor entry subscribes to `core/editor` once. When `getCurrentPostId()` first resolves to a non-zero value, hydrate from `localStorage` for `post:<id>` and start mirroring store changes back to storage with a 500ms debounce. When postId transitions from `0` → real id (auto-draft saved), migrate the in-memory map to the new storage key.

- [ ] **Step 1: Update `src/editor/index.js`**

```js
// src/editor/index.js
import { addFilter } from '@wordpress/hooks';
import { dispatch, select, subscribe } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { STORE_NAME, store as collapserStore } from './store';
import { readState, writeState } from './store/persistence';
import withCollapse from './components/CollapseWrapper';
import './editor.scss';

addFilter( 'editor.BlockListBlock', 'block-collapser/with-collapse', withCollapse );

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

		// First non-zero postId: hydrate from storage.
		if ( postId && hydratedForPostId !== postId ) {
			const stored = readState( `post:${ postId }` );

			// Auto-draft → real post migration: keep in-memory state if storage is empty.
			if ( stored ) {
				dispatch( STORE_NAME ).hydrate( stored );
			} else if ( hydratedForPostId === 0 && Object.keys( collapsed ).length > 0 ) {
				// Migrate the in-memory auto-draft state to the new post key immediately.
				writeState( `post:${ postId }`, collapsed );
				lastWritten = collapsed;
			}
			hydratedForPostId = postId;
			return;
		}

		// Mirror changes back to storage for known posts only.
		if ( postId && collapsed !== lastWritten ) {
			scheduleWrite( `post:${ postId }`, collapsed );
		}

		// Auto-draft: track that we've seen postId 0 so we can migrate later.
		if ( ! postId && hydratedForPostId === null ) {
			hydratedForPostId = 0;
		}
	} );
}

// Defer until the editor store actually exists (it loads asynchronously
// in the Site Editor under some conditions).
if ( typeof window !== 'undefined' ) {
	startPersistenceLoop();
}

// Re-export for tests / debugging.
export { collapserStore };
```

- [ ] **Step 2: Build and lint**

Run: `npm run build && npm run lint:js`
Expected: Both clean.

- [ ] **Step 3: Live verify — saved post round-trip**

1. Open `http://localhost/block-collapser/wp-admin/post.php?post=1&action=edit` (`moaz`/`moaz`)
2. Collapse two top-level blocks
3. Reload the page
4. **Expected:** both blocks are still collapsed on reload
5. In DevTools → Application → Local Storage, confirm key `block-collapser:v1:post:1` exists with the right map

- [ ] **Step 4: Live verify — auto-draft migration**

1. Go to `http://localhost/block-collapser/wp-admin/post-new.php` (new post, auto-draft)
2. Add 3 paragraph blocks
3. Collapse one of them
4. In DevTools → Local Storage, confirm **no** `block-collapser:v1:post:0` key exists (auto-draft does not persist)
5. Type a title and click Save Draft
6. After save, the URL acquires `post=<n>` — confirm `block-collapser:v1:post:<n>` now exists with the collapsed block
7. Reload — block stays collapsed ✓

- [ ] **Step 5: Live verify — Site Editor**

1. Open `http://localhost/block-collapser/wp-admin/site-editor.php`
2. Edit a template
3. Collapse a top-level block
4. Reload — block stays collapsed ✓ (Site Editor templates are also `wp_template` posts, so `getCurrentPostId()` returns their id)

  **If Site Editor does NOT persist:** log `getCurrentPostId()` in the persistence loop, note the actual selector value, and add a fallback (e.g. `select('core/edit-site').getEditedPostId()`). Capture the fix in this task's commit.

- [ ] **Step 6: Commit**

```
git add src/editor/index.js
git commit -m "feat(editor): hydrate from localStorage and debounce-persist store"
```

---

## Task 8: Phase verification gates

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: Zero warnings.

- [ ] **Step 2: JS lint**

Run: `npm run lint:js`
Expected: Pass.

- [ ] **Step 3: CSS lint**

Run: `npm run lint:css`
Expected: Pass.

- [ ] **Step 4: Jest**

Run: `npm test`
Expected: All Phase 1 (2) + Phase 2 (~24) tests pass. No failures.

- [ ] **Step 5: PHPStan**

Run: `composer run phpstan`
Expected: 0 errors at level 8.

- [ ] **Step 6: PHPCS**

Run: `composer run phpcs`
Expected: 0 violations.

- [ ] **Step 7: Manual smoke (final)**

In Post Editor and Site Editor:
- Collapse + reload → persists ✓
- Open second tab to same post → see collapsed state on load ✓
- Rename a block via Gutenberg's "Rename" feature, collapse it, reorder the block, reload → still collapsed (because the key is `name:<name>`, not the path) ✓
- Auto-draft → save → state migrates ✓
- DevTools console clean (no errors) ✓

- [ ] **Step 8: Mark Phase 2 complete in roadmap**

In `docs/superpowers/plans/2026-06-02-roadmap.md`, change row 2's status from "Not started" to "Complete ✓" and link this plan document.

```
git add docs/superpowers/plans/2026-06-02-roadmap.md
git commit -m "docs: mark Phase 2 complete in roadmap"
```

---

## Self-review checklist

- [x] **Cross-cutting decision #1 (path + metadata.name):** `computeBlockKey` does both — Task 1.
- [x] **Cross-cutting decision #3 (wp.data only, narrow bool):** `isCollapsedByKey(state, key) → bool` — Task 3.
- [x] **Cross-cutting decision #8 (auto-draft in-memory until save):** Task 7 holds state until non-zero postId, then migrates.
- [x] **Cross-cutting decision #9 (synced patterns as single unit):** Phase 1's top-level-only wrapping already covers this. No new code.
- [x] **No telemetry:** All persistence is `localStorage`. No `fetch`, no `wp.apiFetch`.
- [x] **i18n:** No new user-facing strings in this phase.
- [x] **Error handling at boundaries:** `localStorage` I/O wrapped in try/catch (Task 6).
- [x] **No premature abstraction:** Persistence is direct localStorage I/O — no plugin/adapter layer, no event bus.
- [x] **No `console.log` left behind:** Only `console.error` in existing `ErrorBoundary`.
- [x] **Phase produces working, testable software:** After Task 7, collapse state persists across reloads in both editors.

---

## What Phase 2 does NOT do (deferred)

- **Per-instance "Never collapse"** — Phase 4 (`BlockSettingsMenuControls`)
- **Collapse All / Expand All actions** — Phase 4 (sidebar)
- **Cross-device sync** — never (out of v1 scope; would require REST + user meta)
- **Storage cleanup on post delete** — Phase 6 (uninstall.php handles plugin removal; per-post cleanup is too noisy)
- **Schema migration logic (v1 → v2)** — only relevant once we ship v2. The `:v1:` namespace leaves room.
