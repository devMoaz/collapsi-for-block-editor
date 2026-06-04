/**
 * Registers Alt+Shift+C → toggle Collapse All / Expand All.
 *
 * Mounted via registerPlugin in the editor entry. Renders nothing —
 * exists only to wire registerShortcut + useShortcut into the React tree.
 */

import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as shortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import {
	useDispatch,
	select as wpSelect,
	dispatch as wpDispatch,
} from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { toggleAllTopLevel } from '../sidebar/actions';

const SHORTCUT_NAME = 'collapsi/toggle-all';

function ShortcutRegistrar() {
	const { registerShortcut } = useDispatch( shortcutsStore );

	useEffect( () => {
		registerShortcut( {
			name: SHORTCUT_NAME,
			category: 'block',
			description: __(
				'Toggle collapse/expand all top-level blocks',
				'collapsi'
			),
			keyCombination: {
				modifier: 'access',
				character: 'c',
			},
		} );
	}, [ registerShortcut ] );

	useShortcut( SHORTCUT_NAME, () => {
		toggleAllTopLevel( wpSelect, wpDispatch );
	} );

	return null;
}

export default ShortcutRegistrar;
export { SHORTCUT_NAME };
