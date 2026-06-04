import apiFetch from '@wordpress/api-fetch';

const OPTION_KEY = 'collapsi_options';

export async function readSettings() {
	const response = await apiFetch( { path: '/wp/v2/settings' } );
	return response?.[ OPTION_KEY ] ?? {};
}

export async function writeSettings( options ) {
	const response = await apiFetch( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: { [ OPTION_KEY ]: options },
	} );
	return response?.[ OPTION_KEY ] ?? options;
}

export { OPTION_KEY };
