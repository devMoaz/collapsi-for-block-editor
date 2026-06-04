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
					label={ __( 'Accent color', 'collapsi' ) }
					help={ __(
						'Left border and icon color on collapsed blocks.',
						'collapsi'
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
					label={ __( 'Bar title color', 'collapsi' ) }
					help={ __(
						'Block title text in the collapsed bar.',
						'collapsi'
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
					{ __( 'Live preview', 'collapsi' ) }
				</span>
				<div
					className="collapsi-appearance__preview-bar"
					style={ {
						'--collapsi-accent': settings.accentColor,
						'--collapsi-bar-text': settings.barTextColor,
					} }
				>
					<span className="collapsi-appearance__preview-title">
						{ __( 'Heading', 'collapsi' ) }
					</span>
					<span className="collapsi-appearance__preview-text">
						{ __(
							'— first chars of the collapsed block.',
							'collapsi'
						) }
					</span>
				</div>
			</div>
		</>
	);
}

export default AppearanceTab;
