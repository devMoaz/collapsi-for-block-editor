import {
	collapseAllTopLevel,
	expandAllTopLevel,
	focusMode,
} from '../../../src/editor/sidebar/actions';

function makeFixture( { topLevelBlocks, selectedClientId = null } ) {
	const calls = [];
	const blockMap = new Map();
	topLevelBlocks.forEach( ( b ) => blockMap.set( b.clientId, b ) );

	const select = ( storeName ) => {
		if ( storeName === 'core/block-editor' ) {
			return {
				getBlocks: () => topLevelBlocks,
				getBlock: ( id ) => blockMap.get( id ) ?? null,
				getBlockRootClientId: () => '',
				getBlockIndex: ( id ) =>
					topLevelBlocks.findIndex( ( b ) => b.clientId === id ),
				getSelectedBlockClientId: () => selectedClientId,
			};
		}
		return {};
	};

	const dispatch = ( storeName ) => ( {
		setCollapsed: ( key, val ) => {
			calls.push( { storeName, key, val } );
		},
	} );

	return { select, dispatch, calls };
}

describe( 'collapseAllTopLevel', () => {
	it( 'dispatches setCollapsed(true) for each top-level block', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{ clientId: 'a', attributes: {} },
				{ clientId: 'b', attributes: {} },
			],
		} );
		collapseAllTopLevel( select, dispatch );
		expect( calls ).toEqual( [
			{ storeName: 'collapsi/editor', key: '0', val: true },
			{ storeName: 'collapsi/editor', key: '1', val: true },
		] );
	} );

	it( 'prefers metadata.name keys when present', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{
					clientId: 'a',
					attributes: { metadata: { name: 'hero' } },
				},
			],
		} );
		collapseAllTopLevel( select, dispatch );
		expect( calls ).toEqual( [
			{
				storeName: 'collapsi/editor',
				key: 'name:hero',
				val: true,
			},
		] );
	} );

	it( 'skips blocks excluded via metadata.collapsi.neverCollapse', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{ clientId: 'a', attributes: {} },
				{
					clientId: 'b',
					attributes: {
						metadata: { collapsi: { neverCollapse: true } },
					},
				},
			],
		} );
		collapseAllTopLevel( select, dispatch );
		expect( calls ).toHaveLength( 1 );
		expect( calls[ 0 ].key ).toBe( '0' );
	} );
} );

describe( 'expandAllTopLevel', () => {
	it( 'dispatches setCollapsed(false) for each top-level block', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{ clientId: 'a', attributes: {} },
				{ clientId: 'b', attributes: {} },
			],
		} );
		expandAllTopLevel( select, dispatch );
		expect( calls.every( ( c ) => c.val === false ) ).toBe( true );
		expect( calls ).toHaveLength( 2 );
	} );
} );

describe( 'focusMode', () => {
	it( 'collapses all except the selected top-level block', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [
				{ clientId: 'a', attributes: {} },
				{ clientId: 'b', attributes: {} },
				{ clientId: 'c', attributes: {} },
			],
			selectedClientId: 'b',
		} );
		focusMode( select, dispatch );
		const map = Object.fromEntries(
			calls.map( ( c ) => [ c.key, c.val ] )
		);
		expect( map ).toEqual( { 0: true, 1: false, 2: true } );
	} );

	it( 'no-op when no block is selected', () => {
		const { select, dispatch, calls } = makeFixture( {
			topLevelBlocks: [ { clientId: 'a', attributes: {} } ],
			selectedClientId: null,
		} );
		focusMode( select, dispatch );
		expect( calls ).toEqual( [] );
	} );
} );
