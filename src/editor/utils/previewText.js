/**
 * Per-block-type collapsed-bar preview text.
 *
 * Pure function over a block object. No wp.data access — the caller
 * passes the block via useSelect. Returns a short, single-line
 * description suitable for rendering after the block-type title in
 * the collapsed bar, or null when the block has no meaningful preview.
 */

import { _n, sprintf } from '@wordpress/i18n';

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

/**
 * Normalize block-attribute text values to a plain string.
 *
 * Gutenberg may store rich-text attributes (paragraph/heading/quote
 * content, button.text) as either a plain string or a RichText "Value"
 * object that exposes a `.text` string and a custom `.toString()`.
 * Falls back to null if the value cannot be coerced sensibly.
 *
 * @param {string|{text?: string, toString?: Function}|null|undefined} value
 * @return {string|null} Plain string or null.
 */
function toPlainString( value ) {
	if ( typeof value === 'string' ) {
		return value;
	}
	if ( ! value ) {
		return null;
	}
	if ( typeof value.text === 'string' ) {
		return value.text;
	}
	if ( typeof value.toString === 'function' ) {
		const str = value.toString();
		if ( str && str !== '[object Object]' ) {
			return str;
		}
	}
	return null;
}

function textPreview( content, { strip = true } = {} ) {
	const raw = toPlainString( content );
	if ( raw === null ) {
		return null;
	}
	const processed = strip ? stripHtml( raw ) : raw;
	return truncate( normalizeWhitespace( processed ) );
}

const HANDLERS = {
	'core/paragraph': ( block ) => textPreview( block.attributes?.content ),
	'core/heading': ( block ) => textPreview( block.attributes?.content ),
	'core/quote': ( block ) => textPreview( block.attributes?.value ),
	'core/code': ( block ) =>
		textPreview( block.attributes?.content, { strip: false } ),
	'core/image': ( block ) => {
		const alt = toPlainString( block.attributes?.alt );
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
			_n( '%d item', '%d items', n, 'collapsi-for-gutenberg' ),
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
			_n( '%d block', '%d blocks', n, 'collapsi-for-gutenberg' ),
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
			_n( '%d column', '%d columns', n, 'collapsi-for-gutenberg' ),
			n
		);
	},
	'core/buttons': ( block ) => {
		const texts = ( block.innerBlocks ?? [] )
			.map( ( inner ) => toPlainString( inner.attributes?.text ) )
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
