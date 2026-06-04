import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function BehaviourTab( { settings, onChange } ) {
	return (
		<>
			<ToggleControl
				label={ __(
					'Auto-collapse all top-level blocks on editor load',
					'collapsi-for-block-editor'
				) }
				help={ __(
					'When enabled, every top-level block starts collapsed each time the editor opens. Per-instance "Never collapse" overrides still apply.',
					'collapsi-for-block-editor'
				) }
				checked={ settings.autoCollapseOnLoad === 'all' }
				onChange={ ( checked ) =>
					onChange( {
						autoCollapseOnLoad: checked ? 'all' : 'never',
					} )
				}
				__nextHasNoMarginBottom
			/>
			<p className="collapsi-tab__description">
				{ __(
					'Tip: press Alt+Shift+C in the editor to toggle all top-level blocks. This shortcut cannot be customized in v1.',
					'collapsi-for-block-editor'
				) }
			</p>
		</>
	);
}

export default BehaviourTab;
