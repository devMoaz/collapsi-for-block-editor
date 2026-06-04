import {
	isCollapsedByKey,
	getCollapsedMap,
} from '../../../src/editor/store/selectors';

describe( 'selectors', () => {
	const state = { collapsed: { 0.1: true, 'name:hero': true } };

	it( 'isCollapsedByKey returns true for present key', () => {
		expect( isCollapsedByKey( state, '0.1' ) ).toBe( true );
		expect( isCollapsedByKey( state, 'name:hero' ) ).toBe( true );
	} );

	it( 'isCollapsedByKey returns false for absent key', () => {
		expect( isCollapsedByKey( state, '0.2' ) ).toBe( false );
	} );

	it( 'isCollapsedByKey returns false for null/empty key', () => {
		expect( isCollapsedByKey( state, null ) ).toBe( false );
		expect( isCollapsedByKey( state, '' ) ).toBe( false );
	} );

	it( 'getCollapsedMap returns the same reference across calls when state unchanged', () => {
		const a = getCollapsedMap( state );
		const b = getCollapsedMap( state );
		expect( a ).toBe( b );
	} );
} );
