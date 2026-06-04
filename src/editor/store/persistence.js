// src/editor/store/persistence.js
/**
 * localStorage persistence for the collapsi editor store.
 *
 * Key namespace: collapsi:v1:<context>
 *   context = "post:<postId>" for saved posts/templates
 *   auto-draft posts (postId === 0) are NOT persisted from here —
 *   the hydration loop holds them in-memory until first save.
 *
 * All I/O is wrapped in try/catch so a disabled or full localStorage
 * degrades to "no persistence" rather than breaking the editor.
 */

export const STORAGE_PREFIX = 'collapsi:v1';

export function getStorageKey( contextKey ) {
	return `${ STORAGE_PREFIX }:${ contextKey }`;
}

function isPlainObject( value ) {
	return (
		value !== null && typeof value === 'object' && ! Array.isArray( value )
	);
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
