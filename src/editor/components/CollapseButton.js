/**
 * CollapseButton — chevron toggle for collapsing/expanding a block.
 * Presentational only; owner component holds the state.
 */

import { Button } from '@wordpress/components';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

function CollapseButton( { isCollapsed, onToggle } ) {
	const label = isCollapsed
		? __( 'Expand block', 'collapsi-for-block-editor' )
		: __( 'Collapse block', 'collapsi-for-block-editor' );

	return (
		<Button
			className="collapsi-toggle"
			icon={ isCollapsed ? chevronDown : chevronUp }
			label={ label }
			showTooltip
			size="small"
			onClick={ onToggle }
			aria-expanded={ ! isCollapsed }
		/>
	);
}

export default CollapseButton;
