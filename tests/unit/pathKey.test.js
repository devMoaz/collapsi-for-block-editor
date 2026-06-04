import { computeBlockKey } from '../../src/editor/utils/pathKey';

function makeSelect( { parents, indices, blocks } ) {
	return ( storeName ) => {
		if (
			storeName === 'core/block-editor' ||
			storeName?.name === 'core/block-editor'
		) {
			return {
				getBlockRootClientId: ( id ) => parents[ id ] ?? '',
				getBlockIndex: ( id ) => indices[ id ] ?? 0,
				getBlock: ( id ) => blocks[ id ] ?? null,
			};
		}
		return {};
	};
}

describe( 'computeBlockKey', () => {
	it( 'returns "name:<name>" when metadata.name is set', () => {
		const select = makeSelect( {
			parents: { a: '' },
			indices: { a: 0 },
			blocks: { a: { attributes: { metadata: { name: 'hero-cta' } } } },
		} );
		expect( computeBlockKey( 'a', select ) ).toBe( 'name:hero-cta' );
	} );

	it( 'returns dot-joined path for top-level block without name', () => {
		const select = makeSelect( {
			parents: { a: '' },
			indices: { a: 2 },
			blocks: { a: { attributes: {} } },
		} );
		expect( computeBlockKey( 'a', select ) ).toBe( '2' );
	} );

	it( 'returns dot-joined path for nested block', () => {
		const select = makeSelect( {
			parents: { a: '', b: 'a', c: 'b' },
			indices: { a: 0, b: 2, c: 1 },
			blocks: { a: {}, b: {}, c: {} },
		} );
		expect( computeBlockKey( 'c', select ) ).toBe( '0.2.1' );
	} );

	it( 'prefers metadata.name even on nested blocks', () => {
		const select = makeSelect( {
			parents: { a: '', b: 'a' },
			indices: { a: 0, b: 1 },
			blocks: {
				a: {},
				b: { attributes: { metadata: { name: 'pricing-row' } } },
			},
		} );
		expect( computeBlockKey( 'b', select ) ).toBe( 'name:pricing-row' );
	} );

	it( 'returns null for unknown clientId', () => {
		const select = makeSelect( { parents: {}, indices: {}, blocks: {} } );
		expect( computeBlockKey( '', select ) ).toBeNull();
	} );
} );
