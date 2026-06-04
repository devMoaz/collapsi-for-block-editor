const path = require( 'path' );
const defaultPreset = require( '@wordpress/jest-preset-default/jest-preset' );

module.exports = {
	...defaultPreset,
	setupFilesAfterEnv: [
		...( defaultPreset.setupFilesAfterEnv || [] ),
		'<rootDir>/jest.setup.js',
	],
	transform: {
		'\\.[jt]sx?$': path.join(
			require.resolve( '@wordpress/scripts/package.json' ),
			'..',
			'config',
			'babel-transform.js'
		),
	},
};
