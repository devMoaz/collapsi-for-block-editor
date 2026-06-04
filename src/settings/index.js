import { createRoot } from '@wordpress/element';
import App from './App';
import './settings.scss';

const mount = document.getElementById( 'collapsi-settings-root' );
if ( mount ) {
	createRoot( mount ).render( <App /> );
}
