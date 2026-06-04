/**
 * Read settings localized by PHP into window.collapsiSettings.
 *
 * Defensive: any missing or wrong-type key falls back to its default.
 * Editor code should always go through getSettings() — never read
 * window.collapsiSettings directly.
 */

export const DEFAULTS = Object.freeze( {
	enabled: true,
	showPreview: true,
	showIcon: true,
	autoCollapseOnLoad: 'never',
	accentColor: '#1d9e75',
	barTextColor: '#444444',
} );

const ALLOWED_MODES = [ 'never', 'all' ];

function isPlainObject( value ) {
	return (
		value !== null && typeof value === 'object' && ! Array.isArray( value )
	);
}

function coerceBool( raw, fallback ) {
	if ( typeof raw === 'boolean' ) {
		return raw;
	}
	return fallback;
}

function coerceHex( raw, fallback ) {
	if ( typeof raw === 'string' && /^#[0-9a-fA-F]{6}$/.test( raw ) ) {
		return raw.toLowerCase();
	}
	return fallback;
}

function coerceMode( raw ) {
	return ALLOWED_MODES.includes( raw ) ? raw : DEFAULTS.autoCollapseOnLoad;
}

export function getSettings() {
	const raw = typeof window !== 'undefined' ? window.collapsiSettings : null;
	if ( ! isPlainObject( raw ) ) {
		return { ...DEFAULTS };
	}
	return {
		enabled: coerceBool( raw.enabled, DEFAULTS.enabled ),
		showPreview: coerceBool( raw.showPreview, DEFAULTS.showPreview ),
		showIcon: coerceBool( raw.showIcon, DEFAULTS.showIcon ),
		autoCollapseOnLoad: coerceMode( raw.autoCollapseOnLoad ),
		accentColor: coerceHex( raw.accentColor, DEFAULTS.accentColor ),
		barTextColor: coerceHex( raw.barTextColor, DEFAULTS.barTextColor ),
	};
}
