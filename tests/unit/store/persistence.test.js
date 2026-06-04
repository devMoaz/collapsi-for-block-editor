// tests/unit/store/persistence.test.js
import {
	getStorageKey,
	readState,
	writeState,
	clearState,
	STORAGE_PREFIX,
} from '../../../src/editor/store/persistence';

describe( 'persistence', () => {
	beforeEach( () => {
		localStorage.clear();
	} );

	it( 'getStorageKey prefixes with version namespace', () => {
		expect( getStorageKey( 'post:42' ) ).toBe(
			`${ STORAGE_PREFIX }:post:42`
		);
	} );

	it( 'readState returns null when nothing stored', () => {
		expect( readState( 'post:42' ) ).toBeNull();
	} );

	it( 'writeState then readState round-trips', () => {
		writeState( 'post:42', { 0: true, 'name:hero': true } );
		expect( readState( 'post:42' ) ).toEqual( {
			0: true,
			'name:hero': true,
		} );
	} );

	it( 'readState returns null on corrupted JSON', () => {
		localStorage.setItem( getStorageKey( 'post:42' ), 'not-json{' );
		expect( readState( 'post:42' ) ).toBeNull();
	} );

	it( 'readState returns null when stored value is not a plain object', () => {
		localStorage.setItem(
			getStorageKey( 'post:42' ),
			JSON.stringify( [ 1, 2, 3 ] )
		);
		expect( readState( 'post:42' ) ).toBeNull();
	} );

	it( 'writeState with empty context key is a no-op', () => {
		writeState( '', { 0: true } );
		expect( localStorage.length ).toBe( 0 );
	} );

	it( 'clearState removes the entry', () => {
		writeState( 'post:42', { 0: true } );
		clearState( 'post:42' );
		expect( readState( 'post:42' ) ).toBeNull();
	} );

	it( 'writeState swallows quota errors', () => {
		const orig = Storage.prototype.setItem;
		Storage.prototype.setItem = () => {
			throw new Error( 'QuotaExceeded' );
		};
		expect( () => writeState( 'post:42', { 0: true } ) ).not.toThrow();
		Storage.prototype.setItem = orig;
	} );
} );
