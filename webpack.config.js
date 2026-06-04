/**
 * Webpack config. Extends @wordpress/scripts default to expose two entries:
 * - editor: loaded on edit-post / edit-site screens
 * - settings: loaded on the Settings > Block Collapser admin page
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		editor: path.resolve( __dirname, 'src/editor/index.js' ),
		settings: path.resolve( __dirname, 'src/settings/index.js' ),
	},
};
