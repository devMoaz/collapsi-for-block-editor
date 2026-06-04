import { getSettings, DEFAULTS } from '../../../src/editor/utils/settings';

describe( 'getSettings', () => {
	beforeEach( () => {
		delete window.collapsiSettings;
	} );

	it( 'returns defaults when window.collapsiSettings is undefined', () => {
		expect( getSettings() ).toEqual( DEFAULTS );
	} );

	it( 'returns defaults when window.collapsiSettings is null', () => {
		window.collapsiSettings = null;
		expect( getSettings() ).toEqual( DEFAULTS );
	} );

	it( 'returns defaults when window.collapsiSettings is an array', () => {
		window.collapsiSettings = [];
		expect( getSettings() ).toEqual( DEFAULTS );
	} );

	it( 'reads valid values and lowercases hex colors', () => {
		window.collapsiSettings = {
			enabled: false,
			showPreview: false,
			showIcon: true,
			autoCollapseOnLoad: 'all',
			accentColor: '#FF00AA',
			barTextColor: '#222222',
		};
		expect( getSettings() ).toEqual( {
			enabled: false,
			showPreview: false,
			showIcon: true,
			autoCollapseOnLoad: 'all',
			accentColor: '#ff00aa',
			barTextColor: '#222222',
		} );
	} );

	it( 'falls back to defaults for invalid types', () => {
		window.collapsiSettings = {
			enabled: 'yes',
			showPreview: 1,
			autoCollapseOnLoad: 'never-ever',
			accentColor: 'red',
		};
		const out = getSettings();
		expect( out.enabled ).toBe( DEFAULTS.enabled );
		expect( out.showPreview ).toBe( DEFAULTS.showPreview );
		expect( out.autoCollapseOnLoad ).toBe( DEFAULTS.autoCollapseOnLoad );
		expect( out.accentColor ).toBe( DEFAULTS.accentColor );
	} );

	it( 'rejects autoCollapseOnLoad values outside the allowed set', () => {
		window.collapsiSettings = { autoCollapseOnLoad: 'by-rule' };
		expect( getSettings().autoCollapseOnLoad ).toBe(
			DEFAULTS.autoCollapseOnLoad
		);
	} );
} );
