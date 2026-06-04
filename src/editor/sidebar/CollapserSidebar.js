// src/editor/sidebar/CollapserSidebar.js
import { PluginSidebar } from '@wordpress/editor';
import {
	useSelect,
	dispatch as wpDispatch,
	select as wpSelect,
} from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronUp, chevronDown, group } from '@wordpress/icons';
import { collapseAllTopLevel, expandAllTopLevel, focusMode } from './actions';

const SIDEBAR_NAME = 'collapsi';

function CollapserSidebar() {
	const { topLevelCount } = useSelect( ( select ) => {
		const blocks = select( 'core/block-editor' ).getBlocks();
		return { topLevelCount: blocks.length };
	}, [] );

	const onCollapseAll = () => collapseAllTopLevel( wpSelect, wpDispatch );
	const onExpandAll = () => expandAllTopLevel( wpSelect, wpDispatch );
	const onFocusMode = () => focusMode( wpSelect, wpDispatch );

	return (
		<PluginSidebar
			name={ SIDEBAR_NAME }
			title={ __( 'Collapsi', 'collapsi-for-block-editor' ) }
			icon={ group }
		>
			<div className="collapsi-sidebar">
				<p className="collapsi-sidebar__hint">
					{ __(
						'Manage which top-level blocks are collapsed in this editor.',
						'collapsi-for-block-editor'
					) }
				</p>
				<div className="collapsi-sidebar__actions">
					<Button
						variant="primary"
						icon={ chevronUp }
						onClick={ onCollapseAll }
						disabled={ topLevelCount === 0 }
					>
						{ __( 'Collapse All', 'collapsi-for-block-editor' ) }
					</Button>
					<Button
						variant="secondary"
						icon={ chevronDown }
						onClick={ onExpandAll }
						disabled={ topLevelCount === 0 }
					>
						{ __( 'Expand All', 'collapsi-for-block-editor' ) }
					</Button>
					<Button variant="tertiary" onClick={ onFocusMode }>
						{ __( 'Focus Mode', 'collapsi-for-block-editor' ) }
					</Button>
				</div>
				<p className="collapsi-sidebar__shortcut">
					{ __(
						'Tip: Alt+Shift+C toggles all.',
						'collapsi-for-block-editor'
					) }
				</p>
			</div>
		</PluginSidebar>
	);
}

export default CollapserSidebar;
export { SIDEBAR_NAME };
