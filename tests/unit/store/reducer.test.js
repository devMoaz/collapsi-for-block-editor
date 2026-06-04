import reducer, { DEFAULT_STATE } from '../../../src/editor/store/reducer';

describe( 'reducer', () => {
	it( 'returns default state for unknown action', () => {
		expect( reducer( undefined, { type: 'UNKNOWN' } ) ).toEqual(
			DEFAULT_STATE
		);
	} );

	it( 'SET_COLLAPSED true adds key', () => {
		const next = reducer( DEFAULT_STATE, {
			type: 'SET_COLLAPSED',
			key: '0.1',
			isCollapsed: true,
		} );
		expect( next.collapsed ).toEqual( { 0.1: true } );
	} );

	it( 'SET_COLLAPSED false removes key', () => {
		const state = { ...DEFAULT_STATE, collapsed: { 0.1: true, 0.2: true } };
		const next = reducer( state, {
			type: 'SET_COLLAPSED',
			key: '0.1',
			isCollapsed: false,
		} );
		expect( next.collapsed ).toEqual( { 0.2: true } );
	} );

	it( 'SET_COLLAPSED with missing key is a no-op', () => {
		const next = reducer( DEFAULT_STATE, {
			type: 'SET_COLLAPSED',
			key: '',
			isCollapsed: true,
		} );
		expect( next ).toBe( DEFAULT_STATE );
	} );

	it( 'HYDRATE replaces collapsed map', () => {
		const state = { ...DEFAULT_STATE, collapsed: { old: true } };
		const next = reducer( state, {
			type: 'HYDRATE',
			collapsed: { 0: true, 'name:a': true },
		} );
		expect( next.collapsed ).toEqual( { 0: true, 'name:a': true } );
	} );

	it.each( [
		[ 'null', null ],
		[ 'undefined', undefined ],
		[ 'array', [ 'a', 'b' ] ],
		[ 'string', 'oops' ],
		[ 'number', 42 ],
		[ 'boolean', true ],
	] )( 'HYDRATE with %s falls back to empty map', ( _label, bad ) => {
		const next = reducer( DEFAULT_STATE, {
			type: 'HYDRATE',
			collapsed: bad,
		} );
		expect( next.collapsed ).toEqual( {} );
	} );

	it( 'CLEAR_ALL empties the map', () => {
		const state = { ...DEFAULT_STATE, collapsed: { a: true, b: true } };
		const next = reducer( state, { type: 'CLEAR_ALL' } );
		expect( next.collapsed ).toEqual( {} );
	} );
} );
