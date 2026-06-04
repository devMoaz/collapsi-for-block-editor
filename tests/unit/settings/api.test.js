jest.mock( '@wordpress/api-fetch', () => jest.fn() );

import apiFetch from '@wordpress/api-fetch';
import {
	readSettings,
	writeSettings,
	OPTION_KEY,
} from '../../../src/settings/api';

describe( 'readSettings', () => {
	beforeEach( () => apiFetch.mockReset() );

	it( 'GETs /wp/v2/settings and extracts the option key', async () => {
		apiFetch.mockResolvedValue( {
			[ OPTION_KEY ]: { enabled: false },
			other_option: 'ignored',
		} );
		const out = await readSettings();
		expect( apiFetch ).toHaveBeenCalledWith( { path: '/wp/v2/settings' } );
		expect( out ).toEqual( { enabled: false } );
	} );

	it( 'returns empty object when option key missing', async () => {
		apiFetch.mockResolvedValue( { other: 1 } );
		expect( await readSettings() ).toEqual( {} );
	} );
} );

describe( 'writeSettings', () => {
	beforeEach( () => apiFetch.mockReset() );

	it( 'POSTs the option payload wrapped under the option key', async () => {
		apiFetch.mockResolvedValue( {
			[ OPTION_KEY ]: { enabled: true },
		} );
		const out = await writeSettings( { enabled: true } );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { [ OPTION_KEY ]: { enabled: true } },
		} );
		expect( out ).toEqual( { enabled: true } );
	} );

	it( 'returns the sent options when server response is missing the key', async () => {
		apiFetch.mockResolvedValue( {} );
		const out = await writeSettings( { showPreview: false } );
		expect( out ).toEqual( { showPreview: false } );
	} );
} );
