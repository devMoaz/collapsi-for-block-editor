# Phase 3 — Content Preview + Collapsed Bar Visuals + Reduce-Motion

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`. Phase 3 + Phase 4 are being executed back-to-back in a single rolling flow. Plans are filed separately for clarity; do not pause between them.

**Goal:** Replace the bare block-type title in the collapsed bar with a per-block-type content preview (PRD §4.3) so users can scan a long page of collapsed blocks and still know what's inside each. Add a subtle bar fade-in animation honoring `prefers-reduced-motion`.

**Architecture:** Pure utility `getPreviewText(block) → string|null` selects a per-block-type formatter (paragraph → first 60 stripped-HTML chars, image → alt or filename, group → "N blocks", etc.). `CollapseBar` looks up the full block via `useSelect` and renders `title` + optional `— preview` line. CSS adds a 150ms opacity fade on bar appearance with reduce-motion override.

**Tech Stack:** `@wordpress/data`, `@wordpress/block-editor` (existing), `@wordpress/i18n` (`__`, `_n`, `sprintf`), pure JS string utilities.

**Cross-cutting decisions honored:**
- #7 Animations: `@media (prefers-reduced-motion: reduce)` disables the fade
- #12 i18n: All user-facing strings use `__` / `_n`

---

## File structure for this phase

```
src/editor/
├── utils/
│   └── previewText.js            # CREATE — per-block-type preview formatter
├── components/
│   └── CollapseBar.js            # MODIFY — render preview line
└── editor.scss                   # MODIFY — bar fade-in + reduce-motion override

tests/unit/
└── previewText.test.js           # CREATE
```

**No PHP changes.**

---

## Block-type coverage

The preview table is intentionally focused. For v1 we cover the highest-impact block types; the default (block-type title only, already shipping from Phase 1) remains for everything else.

| Block name | Preview text |
|---|---|
| `core/paragraph` | first 60 chars of `attributes.content`, HTML stripped |
| `core/heading` | first 60 chars of `attributes.content`, HTML stripped |
| `core/image` | `attributes.alt` if non-empty, else filename from `attributes.url` |
| `core/video` | filename from `attributes.src` |
| `core/audio` | filename from `attributes.src` |
| `core/list` | `_n('%d item', '%d items', N)` — N = `innerBlocks.length` |
| `core/group` | `_n('%d block', '%d blocks', N)` — N = `innerBlocks.length` |
| `core/columns` | `_n('%d column', '%d columns', N)` — N = `innerBlocks.length` |
| `core/buttons` | comma-joined button texts (each `core/button` inner block's `attributes.text`), truncated to 60 chars |
| `core/quote` | first 60 chars of `attributes.value`, HTML stripped |
| `core/code` | first 60 chars of `attributes.content` (no HTML strip — code is literal) |
| `core/cover` | first non-empty inner heading text, else `null` |
| anything else | `null` (CollapseBar shows title only, as today) |

**Truncation rule:** trim whitespace, take first 60 chars, append `…` (real ellipsis U+2026) only if truncated.

---

## Task 1: `previewText` utility

**Files:**
- Create: `src/editor/utils/previewText.js`
- Test: `tests/unit/previewText.test.js`

**Rationale:** Pure function over a block object. No `wp.data` access — caller passes the block. Keeps the utility independently testable and side-effect free.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/previewText.test.js
import { getPreviewText } from '../../src/editor/utils/previewText';

const block = ( name, attributes = {}, innerBlocks = [] ) => ( {
	name,
	attributes,
	innerBlocks,
} );

describe( 'getPreviewText', () => {
	it( 'returns null for unknown block types', () => {
		expect( getPreviewText( block( 'core/unknown-block' ) ) ).toBeNull();
	} );

	it( 'returns null for null/undefined input', () => {
		expect( getPreviewText( null ) ).toBeNull();
		expect( getPreviewText( undefined ) ).toBeNull();
	} );

	describe( 'core/paragraph', () => {
		it( 'returns first 60 chars of content', () => {
			expect(
				getPreviewText(
					block( 'core/paragraph', {
						content: 'Hello world this is a paragraph',
					} )
				)
			).toBe( 'Hello world this is a paragraph' );
		} );

		it( 'strips HTML tags', () => {
			expect(
				getPreviewText(
					block( 'core/paragraph', {
						content: '<strong>Bold</strong> and <em>italic</em> text',
					} )
				)
			).toBe( 'Bold and italic text' );
		} );

		it( 'truncates over 60 chars with ellipsis', () => {
			const long = 'a'.repeat( 100 );
			const result = getPreviewText(
				block( 'core/paragraph', { content: long } )
			);
			expect( result ).toBe( 'a'.repeat( 60 ) + '…' );
		} );

		it( 'returns null for empty content', () => {
			expect(
				getPreviewText( block( 'core/paragraph', { content: '' } ) )
			).toBeNull();
			expect(
				getPreviewText( block( 'core/paragraph' ) )
			).toBeNull();
		} );

		it( 'collapses whitespace', () => {
			expect(
				getPreviewText(
					block( 'core/paragraph', {
						content: '  Hello  \n  world  ',
					} )
				)
			).toBe( 'Hello world' );
		} );
	} );

	describe( 'core/heading', () => {
		it( 'returns stripped content', () => {
			expect(
				getPreviewText(
					block( 'core/heading', { content: '<em>Section</em> title' } )
				)
			).toBe( 'Section title' );
		} );
	} );

	describe( 'core/image', () => {
		it( 'prefers alt text', () => {
			expect(
				getPreviewText(
					block( 'core/image', {
						alt: 'Sunset photo',
						url: 'https://example.com/img.jpg',
					} )
				)
			).toBe( 'Sunset photo' );
		} );

		it( 'falls back to filename when alt is empty', () => {
			expect(
				getPreviewText(
					block( 'core/image', {
						alt: '',
						url: 'https://example.com/uploads/cat.jpg',
					} )
				)
			).toBe( 'cat.jpg' );
		} );

		it( 'returns null when neither alt nor url', () => {
			expect( getPreviewText( block( 'core/image' ) ) ).toBeNull();
		} );
	} );

	describe( 'core/video', () => {
		it( 'returns filename from src', () => {
			expect(
				getPreviewText(
					block( 'core/video', {
						src: 'https://example.com/uploads/demo.mp4',
					} )
				)
			).toBe( 'demo.mp4' );
		} );
	} );

	describe( 'core/audio', () => {
		it( 'returns filename from src', () => {
			expect(
				getPreviewText(
					block( 'core/audio', { src: 'https://example.com/song.mp3' } )
				)
			).toBe( 'song.mp3' );
		} );
	} );

	describe( 'core/list', () => {
		it( 'returns "N items" for plural', () => {
			expect(
				getPreviewText(
					block( 'core/list', {}, [
						block( 'core/list-item' ),
						block( 'core/list-item' ),
						block( 'core/list-item' ),
					] )
				)
			).toBe( '3 items' );
		} );

		it( 'returns "1 item" for single', () => {
			expect(
				getPreviewText(
					block( 'core/list', {}, [ block( 'core/list-item' ) ] )
				)
			).toBe( '1 item' );
		} );

		it( 'returns null when empty', () => {
			expect( getPreviewText( block( 'core/list' ) ) ).toBeNull();
		} );
	} );

	describe( 'core/group', () => {
		it( 'returns "N blocks"', () => {
			expect(
				getPreviewText(
					block( 'core/group', {}, [
						block( 'core/paragraph' ),
						block( 'core/image' ),
					] )
				)
			).toBe( '2 blocks' );
		} );
	} );

	describe( 'core/columns', () => {
		it( 'returns "N columns"', () => {
			expect(
				getPreviewText(
					block( 'core/columns', {}, [
						block( 'core/column' ),
						block( 'core/column' ),
					] )
				)
			).toBe( '2 columns' );
		} );
	} );

	describe( 'core/buttons', () => {
		it( 'joins button texts with comma', () => {
			expect(
				getPreviewText(
					block( 'core/buttons', {}, [
						block( 'core/button', { text: 'Sign up' } ),
						block( 'core/button', { text: 'Learn more' } ),
					] )
				)
			).toBe( 'Sign up, Learn more' );
		} );

		it( 'truncates joined text over 60 chars', () => {
			const result = getPreviewText(
				block( 'core/buttons', {}, [
					block( 'core/button', { text: 'a'.repeat( 40 ) } ),
					block( 'core/button', { text: 'b'.repeat( 40 ) } ),
				] )
			);
			expect( result ).toHaveLength( 61 );
			expect( result.endsWith( '…' ) ).toBe( true );
		} );

		it( 'returns null when no button texts', () => {
			expect(
				getPreviewText(
					block( 'core/buttons', {}, [
						block( 'core/button' ),
						block( 'core/button', { text: '' } ),
					] )
				)
			).toBeNull();
		} );
	} );

	describe( 'core/quote', () => {
		it( 'returns first 60 chars of value, HTML stripped', () => {
			expect(
				getPreviewText(
					block( 'core/quote', {
						value: '<p>To be or not to be</p>',
					} )
				)
			).toBe( 'To be or not to be' );
		} );
	} );

	describe( 'core/code', () => {
		it( 'returns first 60 chars literal (no HTML strip)', () => {
			expect(
				getPreviewText(
					block( 'core/code', {
						content: 'const x = <T>(arg: T): T => arg;',
					} )
				)
			).toBe( 'const x = <T>(arg: T): T => arg;' );
		} );
	} );

	describe( 'core/cover', () => {
		it( 'returns first inner heading content', () => {
			expect(
				getPreviewText(
					block( 'core/cover', {}, [
						block( 'core/paragraph', { content: 'Intro' } ),
						block( 'core/heading', { content: 'Main Title' } ),
					] )
				)
			).toBe( 'Main Title' );
		} );

		it( 'returns null when no inner heading', () => {
			expect(
				getPreviewText(
					block( 'core/cover', {}, [
						block( 'core/paragraph', { content: 'Just text' } ),
					] )
				)
			).toBeNull();
		} );
	} );
} );
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx jest tests/unit/previewText.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the utility**

```js
// src/editor/utils/previewText.js
/**
 * Per-block-type collapsed-bar preview text.
 *
 * Pure function over a block object. No wp.data access — the caller
 * passes the block via useSelect. Returns a short, single-line
 * description suitable for rendering after the block-type title in
 * the collapsed bar, or null when the block has no meaningful preview.
 */

import { __, _n, sprintf } from '@wordpress/i18n';

const MAX_LENGTH = 60;
const ELLIPSIS = '…';

function stripHtml( html ) {
	if ( typeof html !== 'string' ) {
		return '';
	}
	return html.replace( /<[^>]*>/g, '' );
}

function normalizeWhitespace( text ) {
	return text.replace( /\s+/g, ' ' ).trim();
}

function truncate( text ) {
	if ( ! text ) {
		return null;
	}
	if ( text.length <= MAX_LENGTH ) {
		return text;
	}
	return text.slice( 0, MAX_LENGTH ) + ELLIPSIS;
}

function filenameFromUrl( url ) {
	if ( typeof url !== 'string' || ! url ) {
		return null;
	}
	const last = url.split( /[\\/]/ ).pop();
	return last || null;
}

function textPreview( content, { strip = true } = {} ) {
	const raw = strip ? stripHtml( content ) : content;
	if ( typeof raw !== 'string' ) {
		return null;
	}
	return truncate( normalizeWhitespace( raw ) );
}

const HANDLERS = {
	'core/paragraph': ( block ) => textPreview( block.attributes?.content ),
	'core/heading': ( block ) => textPreview( block.attributes?.content ),
	'core/quote': ( block ) => textPreview( block.attributes?.value ),
	'core/code': ( block ) =>
		textPreview( block.attributes?.content, { strip: false } ),
	'core/image': ( block ) => {
		const alt = block.attributes?.alt;
		if ( alt && alt.trim() ) {
			return truncate( normalizeWhitespace( alt ) );
		}
		return filenameFromUrl( block.attributes?.url );
	},
	'core/video': ( block ) => filenameFromUrl( block.attributes?.src ),
	'core/audio': ( block ) => filenameFromUrl( block.attributes?.src ),
	'core/list': ( block ) => {
		const n = block.innerBlocks?.length ?? 0;
		if ( ! n ) {
			return null;
		}
		return sprintf(
			/* translators: %d is the number of list items. */
			_n( '%d item', '%d items', n, 'block-collapser' ),
			n
		);
	},
	'core/group': ( block ) => {
		const n = block.innerBlocks?.length ?? 0;
		if ( ! n ) {
			return null;
		}
		return sprintf(
			/* translators: %d is the number of blocks inside a group. */
			_n( '%d block', '%d blocks', n, 'block-collapser' ),
			n
		);
	},
	'core/columns': ( block ) => {
		const n = block.innerBlocks?.length ?? 0;
		if ( ! n ) {
			return null;
		}
		return sprintf(
			/* translators: %d is the number of columns. */
			_n( '%d column', '%d columns', n, 'block-collapser' ),
			n
		);
	},
	'core/buttons': ( block ) => {
		const texts = ( block.innerBlocks ?? [] )
			.map( ( inner ) => inner.attributes?.text )
			.filter( ( t ) => typeof t === 'string' && t.trim() );
		if ( ! texts.length ) {
			return null;
		}
		return truncate( normalizeWhitespace( texts.join( ', ' ) ) );
	},
	'core/cover': ( block ) => {
		const heading = ( block.innerBlocks ?? [] ).find(
			( inner ) => inner.name === 'core/heading'
		);
		if ( ! heading ) {
			return null;
		}
		return textPreview( heading.attributes?.content );
	},
};

export function getPreviewText( block ) {
	if ( ! block || ! block.name ) {
		return null;
	}
	const handler = HANDLERS[ block.name ];
	return handler ? handler( block ) : null;
}

// Internal exports for testing only — do not consume externally.
export const __test__ = {
	stripHtml,
	normalizeWhitespace,
	truncate,
	filenameFromUrl,
};
```

- [ ] **Step 4: Run test, verify all pass**

Run: `npx jest tests/unit/previewText.test.js`
Expected: All tests PASS (count depends on `it.each` expansions — should be ~20 it() calls).

- [ ] **Step 5: Lint**

Run: `npm run lint:js -- src/editor/utils/previewText.js tests/unit/previewText.test.js`
Expected: clean. Apply `--fix` if needed.

- [ ] **Step 6: Commit**

```
git add src/editor/utils/previewText.js tests/unit/previewText.test.js
git commit -m "feat(editor): add per-block-type collapsed-bar preview utility"
```

---

## Task 2: Render preview in `CollapseBar`

**Files:**
- Modify: `src/editor/components/CollapseBar.js`

**Rationale:** CollapseBar already pulls the block-type title and `metadata.name`. Extend the `useSelect` to also pull the full block (already available in scope) and call `getPreviewText`. Render in a second span beneath the title.

- [ ] **Step 1: Update `CollapseBar.js`**

Read current file first to preserve metadata.name handling.

New content:

```js
/**
 * CollapseBar — compact label shown inside the collapsed wrapper.
 *
 * Phase 3: adds per-block-type content preview alongside the title.
 * Phase 4 may add rule indicators (e.g. "never collapse" icon) here.
 */

import { useSelect } from '@wordpress/data';
import { BlockIcon, store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { getPreviewText } from '../utils/previewText';

function CollapseBar( { name, clientId } ) {
	const { blockType, block } = useSelect(
		( select ) => ( {
			blockType: select( blocksStore ).getBlockType( name ),
			block: select( blockEditorStore ).getBlock( clientId ),
		} ),
		[ name, clientId ]
	);

	const metadataName = block?.attributes?.metadata?.name;
	const typeTitle =
		blockType?.title || name || __( 'Unknown block', 'block-collapser' );
	const title = metadataName || typeTitle;
	const icon = blockType?.icon;
	const preview = getPreviewText( block );

	return (
		<div className="block-collapser-bar" aria-hidden="true">
			{ icon && (
				<span className="block-collapser-bar__icon">
					<BlockIcon icon={ icon } showColors />
				</span>
			) }
			<span className="block-collapser-bar__title">{ title }</span>
			{ preview && (
				<span className="block-collapser-bar__preview">
					{ preview }
				</span>
			) }
		</div>
	);
}

export default CollapseBar;
```

- [ ] **Step 2: Build + lint**

```
npm run build
npm run lint:js -- src/editor/components/CollapseBar.js
```

Both clean.

- [ ] **Step 3: Commit**

```
git add src/editor/components/CollapseBar.js
git commit -m "feat(editor): render per-block-type preview in collapsed bar"
```

---

## Task 3: Bar styles + reduce-motion guard

**Files:**
- Modify: `src/editor/editor.scss`

**Rationale:** Add visual treatment for the new `.block-collapser-bar__preview` line (lighter color, smaller, truncated). Add a 150ms opacity fade-in on the bar when it appears. Wrap the new transition in the existing `prefers-reduced-motion` block so motion is disabled when the user requests it.

- [ ] **Step 1: Update SCSS**

Read current `src/editor/editor.scss`. The existing bar block sits at `.block-collapser-bar`. Add a preview rule and a fade-in animation. Keep changes minimal.

Add inside the existing `.block-collapser-bar` selector (alongside `__icon` and `__title`):

```scss
.block-collapser-bar__preview {
    overflow: hidden;
    color: #757575;
    font-weight: 400;
    text-overflow: ellipsis;
    white-space: nowrap;

    &::before {
        margin: 0 6px;
        content: '—';
        color: rgba(0, 0, 0, 0.2);
    }
}
```

Add a fade-in keyframe + animation reference on `.block-collapser-bar`:

```scss
.block-collapser-bar {
    /* existing rules above ... */
    animation: block-collapser-bar-fade-in 150ms ease-in-out;
}

@keyframes block-collapser-bar-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
}
```

Extend the existing `prefers-reduced-motion` block to also disable the bar animation:

```scss
@media (prefers-reduced-motion: reduce) {

    .block-collapser-wrapper .block-collapser-toggle-host {
        transition: none;
    }

    .block-collapser-bar {
        animation: none;
    }
}
```

- [ ] **Step 2: Build + lint:css**

```
npm run build
npm run lint:css
```

Both clean.

- [ ] **Step 3: Commit**

```
git add src/editor/editor.scss
git commit -m "feat(editor): style preview line and add bar fade-in animation"
```

---

## Task 4: Phase 3 live verification

- [ ] **Step 1: Smoke test in Post Editor**

1. Log in at `http://localhost/block-collapser/wp-admin/` (`moaz`/`moaz`)
2. Open the test post and collapse:
   - A paragraph block — preview shows first words of content
   - An image block — preview shows alt or filename
   - A group/cover block — preview shows "N blocks" or inner heading
3. Confirm collapse bar text reads: `<icon> <Type or Name> — <preview>`
4. Toggle a block multiple times — bar fade-in is smooth (~150ms), no jank
5. In DevTools, simulate `prefers-reduced-motion: reduce`:
   - Open DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion: reduce"
   - Toggle a block — bar appears instantly, no fade

- [ ] **Step 2: Take a screenshot showing multiple block types collapsed with previews**

Save to `task3-previews.png`.

- [ ] **Step 3: Phase 3 commit + status**

If Phase 4 is being executed in the same flow, do NOT mark Phase 3 complete in the roadmap yet — defer that to the combined Phase 3+4 verification at the end of Phase 4.

---

## Self-review for Phase 3

- [x] Every PRD §4.3 block type with a meaningful preview is handled (11 types + default).
- [x] All user-facing strings (the count phrases for list/group/columns) use `_n()` for plurals + `sprintf`.
- [x] No `wp.data` access inside the utility — pure function.
- [x] Animation respects `prefers-reduced-motion`.
- [x] No new console errors in the editor.
- [x] No PHP touched.

---

## What Phase 3 does NOT do (deferred)

- **Dark mode awareness for preview color** — Phase 6
- **RTL mirroring of `—` separator placement** — Phase 6 (the `::before` `—` will render fine in RTL because it's part of inline flow)
- **Animation of the wrapper itself (height transition)** — out of scope; the `display: none` collapse is instant by design (height animation on arbitrary block content is fragile and rarely worth the complexity)
- **Live preview update when block content changes while collapsed** — `useSelect` already subscribes to block changes, so this just works without extra effort. Verify during smoke.
