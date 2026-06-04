import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function GeneralTab( { settings, onChange } ) {
	return (
		<>
			<ToggleControl
				label={ __( 'Enable Collapsi', 'collapsi-for-block-editor' ) }
				help={ __(
					'Master switch. When off, no chevrons appear and no collapse state is tracked.',
					'collapsi-for-block-editor'
				) }
				checked={ settings.enabled }
				onChange={ ( v ) => onChange( { enabled: v } ) }
				__nextHasNoMarginBottom
			/>
			<ToggleControl
				label={ __(
					'Show content preview in collapsed bar',
					'collapsi-for-block-editor'
				) }
				help={ __(
					'Display a short summary (paragraph text, image alt, "N blocks", etc.) next to the block title when collapsed.',
					'collapsi-for-block-editor'
				) }
				checked={ settings.showPreview }
				onChange={ ( v ) => onChange( { showPreview: v } ) }
				__nextHasNoMarginBottom
			/>
			<ToggleControl
				label={ __(
					'Show block icon in collapsed bar',
					'collapsi-for-block-editor'
				) }
				help={ __(
					'Display the block-type icon next to the title.',
					'collapsi-for-block-editor'
				) }
				checked={ settings.showIcon }
				onChange={ ( v ) => onChange( { showIcon: v } ) }
				__nextHasNoMarginBottom
			/>
		</>
	);
}

export default GeneralTab;
