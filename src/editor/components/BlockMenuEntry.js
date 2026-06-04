/**
 * Renders a "Never collapse this block" / "Allow collapsing this block"
 * entry in each block's three-dot settings menu.
 *
 * Stored at attributes.metadata.collapsi.neverCollapse so the
 * choice persists with the post. CollapseWrapper short-circuits when
 * the flag is true.
 */

import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function BlockMenuEntry() {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, onClose } ) => {
				if (
					! Array.isArray( selectedClientIds ) ||
					selectedClientIds.length !== 1
				) {
					return null;
				}
				return (
					<NeverCollapseToggle
						clientId={ selectedClientIds[ 0 ] }
						onClose={ onClose }
					/>
				);
			} }
		</BlockSettingsMenuControls>
	);
}

function NeverCollapseToggle( { clientId, onClose } ) {
	const { isTopLevel, metadata } = useSelect(
		( select ) => {
			const editor = select( 'core/block-editor' );
			return {
				isTopLevel: ! editor.getBlockRootClientId( clientId ),
				metadata:
					editor.getBlock( clientId )?.attributes?.metadata ?? {},
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	if ( ! isTopLevel ) {
		return null;
	}

	const isExcluded = metadata?.collapsi?.neverCollapse === true;

	const onToggle = () => {
		updateBlockAttributes( clientId, {
			metadata: {
				...metadata,
				collapsi: {
					...( metadata?.collapsi ?? {} ),
					neverCollapse: ! isExcluded,
				},
			},
		} );
		onClose();
	};

	return (
		<MenuItem onClick={ onToggle }>
			{ isExcluded
				? __( 'Allow collapsing this block', 'collapsi-for-gutenberg' )
				: __( 'Never collapse this block', 'collapsi-for-gutenberg' ) }
		</MenuItem>
	);
}

export default BlockMenuEntry;
