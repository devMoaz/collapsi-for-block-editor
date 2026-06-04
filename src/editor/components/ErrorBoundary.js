/**
 * ErrorBoundary — class component that catches render errors in its subtree.
 * Required around the wrapped BlockListBlock so a buggy third-party block
 * can't take down the editor canvas through Collapsi.
 */

import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class ErrorBoundary extends Component {
	constructor( props ) {
		super( props );
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch( error ) {
		// eslint-disable-next-line no-console
		console.error( '[collapsi] block render error', error );
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<div className="collapsi-error">
					{ __(
						'Collapsi caught a render error in this block.',
						'collapsi-for-gutenberg'
					) }
				</div>
			);
		}
		return this.props.children;
	}
}

export default ErrorBoundary;
