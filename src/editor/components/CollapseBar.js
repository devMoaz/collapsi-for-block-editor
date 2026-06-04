/**
 * CollapseBar — compact label shown inside the collapsed wrapper.
 *
 * Phase 3: adds per-block-type content preview alongside the title.
 */

import { useSelect } from '@wordpress/data';
import { BlockIcon, store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { getPreviewText } from '../utils/previewText';
import { getSettings } from '../utils/settings';

function CollapseBar( { name, clientId } ) {
	const { blockType, block } = useSelect(
		( select ) => ( {
			blockType: select( blocksStore ).getBlockType( name ),
			block: select( blockEditorStore ).getBlock( clientId ),
		} ),
		[ name, clientId ]
	);

	const settings = getSettings();
	const metadataName = block?.attributes?.metadata?.name;
	const typeTitle =
		blockType?.title ||
		name ||
		__( 'Unknown block', 'collapsi-for-gutenberg' );
	const title = metadataName || typeTitle;
	const icon = blockType?.icon;
	const preview = getPreviewText( block );
	const showIcon = settings.showIcon && !! icon;
	const showPreview = settings.showPreview && !! preview;

	return (
		<div className="collapsi-bar" aria-hidden="true">
			{ showIcon && (
				<span className="collapsi-bar__icon">
					<BlockIcon icon={ icon } showColors />
				</span>
			) }
			<span className="collapsi-bar__title">{ title }</span>
			{ showPreview && (
				<span className="collapsi-bar__preview">{ preview }</span>
			) }
		</div>
	);
}

export default CollapseBar;
