// tests/unit/previewText.test.js
import { getPreviewText } from '../../src/editor/utils/previewText';

const block = ( name, attributes = {}, innerBlocks = [] ) => ( {
	name,
	attributes,
	innerBlocks,
} );

describe( 'getPreviewText', () => {
	it( 'returns null for unknown block types', () => {
		expect( getPreviewText( block( 'core/unknown-block' ) ) ).toBeNull();
	} );

	it( 'returns null for null/undefined input', () => {
		expect( getPreviewText( null ) ).toBeNull();
		expect( getPreviewText( undefined ) ).toBeNull();
	} );

	describe( 'core/paragraph', () => {
		it( 'returns first 60 chars of content', () => {
			expect(
				getPreviewText(
					block( 'core/paragraph', {
						content: 'Hello world this is a paragraph',
					} )
				)
			).toBe( 'Hello world this is a paragraph' );
		} );

		it( 'strips HTML tags', () => {
			expect(
				getPreviewText(
					block( 'core/paragraph', {
						content:
							'<strong>Bold</strong> and <em>italic</em> text',
					} )
				)
			).toBe( 'Bold and italic text' );
		} );

		it( 'truncates over 60 chars with ellipsis', () => {
			const long = 'a'.repeat( 100 );
			const result = getPreviewText(
				block( 'core/paragraph', { content: long } )
			);
			expect( result ).toBe( 'a'.repeat( 60 ) + '…' );
		} );

		it( 'returns null for empty content', () => {
			expect(
				getPreviewText( block( 'core/paragraph', { content: '' } ) )
			).toBeNull();
			expect( getPreviewText( block( 'core/paragraph' ) ) ).toBeNull();
		} );

		it( 'collapses whitespace', () => {
			expect(
				getPreviewText(
					block( 'core/paragraph', {
						content: '  Hello  \n  world  ',
					} )
				)
			).toBe( 'Hello world' );
		} );

		it( 'reads RichText Value objects (object with .text)', () => {
			// Gutenberg may store rich-text attributes as a Value object
			// (e.g. { text, formats, replacements }) rather than a plain string.
			const richTextValue = {
				text: 'From RichText value',
				formats: [],
				replacements: [],
			};
			expect(
				getPreviewText(
					block( 'core/paragraph', { content: richTextValue } )
				)
			).toBe( 'From RichText value' );
		} );

		it( 'reads RichText Value via custom toString()', () => {
			const richTextValue = {
				toString() {
					return 'Via toString';
				},
			};
			expect(
				getPreviewText(
					block( 'core/paragraph', { content: richTextValue } )
				)
			).toBe( 'Via toString' );
		} );
	} );

	describe( 'core/heading', () => {
		it( 'returns stripped content', () => {
			expect(
				getPreviewText(
					block( 'core/heading', {
						content: '<em>Section</em> title',
					} )
				)
			).toBe( 'Section title' );
		} );
	} );

	describe( 'core/image', () => {
		it( 'prefers alt text', () => {
			expect(
				getPreviewText(
					block( 'core/image', {
						alt: 'Sunset photo',
						url: 'https://example.com/img.jpg',
					} )
				)
			).toBe( 'Sunset photo' );
		} );

		it( 'falls back to filename when alt is empty', () => {
			expect(
				getPreviewText(
					block( 'core/image', {
						alt: '',
						url: 'https://example.com/uploads/cat.jpg',
					} )
				)
			).toBe( 'cat.jpg' );
		} );

		it( 'returns null when neither alt nor url', () => {
			expect( getPreviewText( block( 'core/image' ) ) ).toBeNull();
		} );
	} );

	describe( 'core/video', () => {
		it( 'returns filename from src', () => {
			expect(
				getPreviewText(
					block( 'core/video', {
						src: 'https://example.com/uploads/demo.mp4',
					} )
				)
			).toBe( 'demo.mp4' );
		} );
	} );

	describe( 'core/audio', () => {
		it( 'returns filename from src', () => {
			expect(
				getPreviewText(
					block( 'core/audio', {
						src: 'https://example.com/song.mp3',
					} )
				)
			).toBe( 'song.mp3' );
		} );
	} );

	describe( 'core/list', () => {
		it( 'returns "N items" for plural', () => {
			expect(
				getPreviewText(
					block( 'core/list', {}, [
						block( 'core/list-item' ),
						block( 'core/list-item' ),
						block( 'core/list-item' ),
					] )
				)
			).toBe( '3 items' );
		} );

		it( 'returns "1 item" for single', () => {
			expect(
				getPreviewText(
					block( 'core/list', {}, [ block( 'core/list-item' ) ] )
				)
			).toBe( '1 item' );
		} );

		it( 'returns null when empty', () => {
			expect( getPreviewText( block( 'core/list' ) ) ).toBeNull();
		} );
	} );

	describe( 'core/group', () => {
		it( 'returns "N blocks"', () => {
			expect(
				getPreviewText(
					block( 'core/group', {}, [
						block( 'core/paragraph' ),
						block( 'core/image' ),
					] )
				)
			).toBe( '2 blocks' );
		} );
	} );

	describe( 'core/columns', () => {
		it( 'returns "N columns"', () => {
			expect(
				getPreviewText(
					block( 'core/columns', {}, [
						block( 'core/column' ),
						block( 'core/column' ),
					] )
				)
			).toBe( '2 columns' );
		} );
	} );

	describe( 'core/buttons', () => {
		it( 'joins button texts with comma', () => {
			expect(
				getPreviewText(
					block( 'core/buttons', {}, [
						block( 'core/button', { text: 'Sign up' } ),
						block( 'core/button', { text: 'Learn more' } ),
					] )
				)
			).toBe( 'Sign up, Learn more' );
		} );

		it( 'truncates joined text over 60 chars', () => {
			const result = getPreviewText(
				block( 'core/buttons', {}, [
					block( 'core/button', { text: 'a'.repeat( 40 ) } ),
					block( 'core/button', { text: 'b'.repeat( 40 ) } ),
				] )
			);
			expect( result ).toHaveLength( 61 );
			expect( result.endsWith( '…' ) ).toBe( true );
		} );

		it( 'returns null when no button texts', () => {
			expect(
				getPreviewText(
					block( 'core/buttons', {}, [
						block( 'core/button' ),
						block( 'core/button', { text: '' } ),
					] )
				)
			).toBeNull();
		} );
	} );

	describe( 'core/quote', () => {
		it( 'returns first 60 chars of value, HTML stripped', () => {
			expect(
				getPreviewText(
					block( 'core/quote', {
						value: '<p>To be or not to be</p>',
					} )
				)
			).toBe( 'To be or not to be' );
		} );
	} );

	describe( 'core/code', () => {
		it( 'returns first 60 chars literal (no HTML strip)', () => {
			expect(
				getPreviewText(
					block( 'core/code', {
						content: 'const x = <T>(arg: T): T => arg;',
					} )
				)
			).toBe( 'const x = <T>(arg: T): T => arg;' );
		} );
	} );

	describe( 'core/cover', () => {
		it( 'returns first inner heading content', () => {
			expect(
				getPreviewText(
					block( 'core/cover', {}, [
						block( 'core/paragraph', { content: 'Intro' } ),
						block( 'core/heading', { content: 'Main Title' } ),
					] )
				)
			).toBe( 'Main Title' );
		} );

		it( 'returns null when no inner heading', () => {
			expect(
				getPreviewText(
					block( 'core/cover', {}, [
						block( 'core/paragraph', { content: 'Just text' } ),
					] )
				)
			).toBeNull();
		} );
	} );
} );
