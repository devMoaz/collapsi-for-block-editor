/**
 * CollapseWrapper — higher-order component that wraps every top-level
 * BlockListBlock with a chevron toggle and collapsed-state CSS class.
 *
 * Phase 2: state lives in the collapsi/editor wp.data store,
 * keyed by structural path or metadata.name.
 * Phase 4: short-circuits when attributes.metadata.collapsi.neverCollapse
 * is true (per-instance opt-out via the block settings menu).
 */

import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { speak } from '@wordpress/a11y';
import { sprintf, __ } from '@wordpress/i18n';
import { STORE_NAME } from '../store';
import { computeBlockKey } from '../utils/pathKey';
import { getSettings } from '../utils/settings';
import ErrorBoundary from './ErrorBoundary';
import CollapseButton from './CollapseButton';
import CollapseBar from './CollapseBar';

/**
 * Has this block received any user content yet?
 *
 * Returns true for fresh, untouched blocks (default empty paragraph after Enter,
 * empty heading, etc.). We hide the chevron in that state to avoid an
 * affordance pointing at a block that has nothing to collapse.
 *
 * A block counts as "non-empty" if it has any inner blocks, OR any of its
 * attribute values contains user-typed text — strings with non-whitespace
 * content, or RichText Value objects with a non-empty `.text` field.
 *
 * @param {Object} block Gutenberg block object from core/block-editor.
 * @return {boolean} True when the block is empty / fresh.
 */
function isBlockEmpty( block ) {
	if ( ! block ) {
		return false;
	}
	if ( block.innerBlocks?.length > 0 ) {
		return false;
	}
	const attrs = block.attributes;
	if ( ! attrs || typeof attrs !== 'object' ) {
		return true;
	}
	for ( const value of Object.values( attrs ) ) {
		if ( typeof value === 'string' && value.trim().length > 0 ) {
			return false;
		}
		if (
			value &&
			typeof value === 'object' &&
			typeof value.text === 'string' &&
			value.text.trim().length > 0
		) {
			return false;
		}
	}
	return true;
}

const withCollapse = createHigherOrderComponent( ( BlockListBlock ) => {
	return function CollapseWrapper( props ) {
		const {
			isRootBlock,
			isExcluded,
			isEmpty,
			key,
			isCollapsed,
			announcementLabel,
		} = useSelect(
			( select ) => {
				const blockEditor = select( blockEditorStore );
				const isRoot = ! blockEditor.getBlockRootClientId(
					props.clientId
				);
				const block = isRoot
					? blockEditor.getBlock( props.clientId )
					: null;
				const excluded =
					block?.attributes?.metadata?.collapsi?.neverCollapse ===
					true;
				const computedKey =
					isRoot && ! excluded
						? computeBlockKey( props.clientId, select )
						: null;
				const metadataName = block?.attributes?.metadata?.name;
				const blockType = select( blocksStore ).getBlockType(
					props.name
				);
				const typeTitle =
					blockType?.title ||
					props.name ||
					__( 'Block', 'collapsi-for-block-editor' );
				return {
					isRootBlock: isRoot,
					isExcluded: excluded,
					isEmpty: isRoot && isBlockEmpty( block ),
					key: computedKey,
					isCollapsed: computedKey
						? select( STORE_NAME ).isCollapsedByKey( computedKey )
						: false,
					announcementLabel: metadataName || typeTitle,
				};
			},
			[ props.clientId, props.name ]
		);

		const { setCollapsed } = useDispatch( STORE_NAME );

		const onToggle = useCallback( () => {
			if ( ! key ) {
				return;
			}
			const nextCollapsed = ! isCollapsed;
			setCollapsed( key, nextCollapsed );
			speak(
				nextCollapsed
					? sprintf(
							/* translators: %s is the block name. */
							__( '%s collapsed.', 'collapsi-for-block-editor' ),
							announcementLabel
					  )
					: sprintf(
							/* translators: %s is the block name. */
							__( '%s expanded.', 'collapsi-for-block-editor' ),
							announcementLabel
					  ),
				'polite'
			);
		}, [ key, isCollapsed, setCollapsed, announcementLabel ] );

		const settings = getSettings();
		if (
			! settings.enabled ||
			! isRootBlock ||
			isExcluded ||
			( isEmpty && ! isCollapsed )
		) {
			return <BlockListBlock { ...props } />;
		}

		const wrapperClassName = [
			'collapsi-wrapper',
			isCollapsed ? 'is-collapsed' : 'is-expanded',
		].join( ' ' );

		return (
			<div className={ wrapperClassName } data-collapsi="1">
				<div className="collapsi-toggle-host">
					<CollapseButton
						isCollapsed={ isCollapsed }
						onToggle={ onToggle }
					/>
				</div>
				{ isCollapsed && (
					<CollapseBar
						name={ props.name }
						clientId={ props.clientId }
					/>
				) }
				<div className="collapsi-content">
					<ErrorBoundary>
						<BlockListBlock { ...props } />
					</ErrorBoundary>
				</div>
			</div>
		);
	};
}, 'withCollapse' );

export default withCollapse;
