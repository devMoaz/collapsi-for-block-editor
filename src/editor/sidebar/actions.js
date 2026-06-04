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
 *   2. Skips any block excluded via metadata.collapsi.neverCollapse.
 *   3. Computes the persistence key (via computeBlockKey).
 *   4. Dispatches setCollapsed on collapsi/editor.
 */

import { speak } from '@wordpress/a11y';
import { sprintf, _n, __ } from '@wordpress/i18n';
import { STORE_NAME } from '../store';
import { computeBlockKey } from '../utils/pathKey';

function isNeverCollapse( block ) {
	return block?.attributes?.metadata?.collapsi?.neverCollapse === true;
}

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
				/* translators: %d is a count of blocks. */
				_n(
					'Collapsed %d block.',
					'Collapsed %d blocks.',
					count,
					'collapsi'
				),
				count
			),
			'polite'
		);
	}
}

export function expandAllTopLevel( select, dispatch ) {
	const count = eachTopLevelKey( select, ( key ) => {
		dispatch( STORE_NAME ).setCollapsed( key, false );
	} );
	if ( count > 0 ) {
		speak(
			sprintf(
				/* translators: %d is a count of blocks. */
				_n(
					'Expanded %d block.',
					'Expanded %d blocks.',
					count,
					'collapsi'
				),
				count
			),
			'polite'
		);
	}
}

export function focusMode( select, dispatch ) {
	const selectedClientId =
		select( 'core/block-editor' ).getSelectedBlockClientId();
	if ( ! selectedClientId ) {
		return;
	}

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

	// Announce — resolve the focused block's label from the top-level block.
	const focused = select( 'core/block-editor' ).getBlock( topLevelId );
	const label =
		focused?.attributes?.metadata?.name ||
		focused?.name ||
		__( 'Block', 'collapsi' );
	speak(
		sprintf(
			/* translators: %s is the block name. */
			__( 'Focus mode on. %s only.', 'collapsi' ),
			label
		),
		'polite'
	);
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
