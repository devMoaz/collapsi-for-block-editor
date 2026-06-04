/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../src/editor/components/ErrorBoundary';

function Boom() {
	throw new Error( 'boom' );
}

describe( 'ErrorBoundary', () => {
	beforeEach( () => {
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'renders children when nothing throws', () => {
		render(
			<ErrorBoundary>
				<span>ok</span>
			</ErrorBoundary>
		);
		expect( screen.getByText( 'ok' ) ).toBeInTheDocument();
	} );

	it( 'renders fallback when a child throws', () => {
		render(
			<ErrorBoundary>
				<Boom />
			</ErrorBoundary>
		);
		expect(
			screen.getByText( /caught a render error/i )
		).toBeInTheDocument();
	} );
} );
