import { ColorPicker, BaseControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

function AppearanceTab( { settings, onChange } ) {
	const accentId = useInstanceId( AppearanceTab, 'collapsi-accent' );
	const textId = useInstanceId( AppearanceTab, 'collapsi-text' );

	return (
		<>
			<div className="collapsi-appearance__grid">
				<BaseControl
					id={ accentId }
					label={ __( 'Accent color', 'collapsi-for-block-editor' ) }
					help={ __(
						'Left border and icon color on collapsed blocks.',
						'collapsi-for-block-editor'
					) }
				>
					<ColorPicker
						color={ settings.accentColor }
						onChangeComplete={ ( color ) =>
							onChange( { accentColor: color.hex } )
						}
						disableAlpha
					/>
				</BaseControl>
				<BaseControl
					id={ textId }
					label={ __(
						'Bar title color',
						'collapsi-for-block-editor'
					) }
					help={ __(
						'Block title text in the collapsed bar.',
						'collapsi-for-block-editor'
					) }
				>
					<ColorPicker
						color={ settings.barTextColor }
						onChangeComplete={ ( color ) =>
							onChange( { barTextColor: color.hex } )
						}
						disableAlpha
					/>
				</BaseControl>
			</div>
			<div className="collapsi-appearance__preview">
				<span className="collapsi-appearance__preview-label">
					{ __( 'Live preview', 'collapsi-for-block-editor' ) }
				</span>
				<div
					className="collapsi-appearance__preview-bar"
					style={ {
						'--collapsi-accent': settings.accentColor,
						'--collapsi-bar-text': settings.barTextColor,
					} }
				>
					<span className="collapsi-appearance__preview-title">
						{ __( 'Heading', 'collapsi-for-block-editor' ) }
					</span>
					<span className="collapsi-appearance__preview-text">
						{ __(
							'— first chars of the collapsed block.',
							'collapsi-for-block-editor'
						) }
					</span>
				</div>
			</div>
		</>
	);
}

export default AppearanceTab;
