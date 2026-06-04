import { addFilter } from '@wordpress/hooks';
import { dispatch, select, subscribe } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';
import { STORE_NAME, store as collapserStore } from './store';
import { readState, writeState } from './store/persistence';
import withCollapse from './components/CollapseWrapper';
import BlockMenuEntry from './components/BlockMenuEntry';
import CollapserSidebar from './sidebar/CollapserSidebar';
import ShortcutRegistrar from './shortcuts/register';
import { getSettings } from './utils/settings';
import { collapseAllTopLevel } from './sidebar/actions';
import './editor.scss';

addFilter( 'editor.BlockListBlock', 'collapsi/with-collapse', withCollapse );

const DEBOUNCE_MS = 500;

function startPersistenceLoop() {
	let hydratedForPostId = null;
	let appliedAutoCollapseForPostId = null;
	let writeTimer = null;
	let lastWritten = null;

	const scheduleWrite = ( contextKey, collapsed ) => {
		if ( writeTimer ) {
			window.clearTimeout( writeTimer );
		}
		writeTimer = window.setTimeout( () => {
			writeState( contextKey, collapsed );
			lastWritten = collapsed;
		}, DEBOUNCE_MS );
	};

	subscribe( () => {
		const postId = select( editorStore )?.getCurrentPostId?.() ?? 0;
		const collapsed = select( STORE_NAME ).getCollapsedMap();

		if ( postId && hydratedForPostId !== postId ) {
			const stored = readState( `post:${ postId }` );
			const wasAutoDraft = hydratedForPostId === 0;

			hydratedForPostId = postId;

			if ( stored ) {
				dispatch( STORE_NAME ).hydrate( stored );
				lastWritten = select( STORE_NAME ).getCollapsedMap();
			} else if ( wasAutoDraft && Object.keys( collapsed ).length > 0 ) {
				writeState( `post:${ postId }`, collapsed );
				lastWritten = collapsed;
			}
			return;
		}

		// Apply auto-collapse-on-load AFTER hydration, once per postId,
		// and only when no block is currently collapsed (avoid stomping
		// the user's saved state). The reducer deletes keys when set to
		// false, so length === 0 reliably means "nothing collapsed".
		if (
			postId &&
			appliedAutoCollapseForPostId !== postId &&
			Object.keys( collapsed ).length === 0
		) {
			const settings = getSettings();
			if ( settings.autoCollapseOnLoad === 'all' ) {
				// Subscribe can fire before core/block-editor has finished
				// loading blocks. Only mark applied once we actually have
				// blocks to operate on; otherwise let the next tick retry.
				const hasBlocks =
					select( 'core/block-editor' ).getBlocks().length > 0;
				if ( hasBlocks ) {
					appliedAutoCollapseForPostId = postId;
					collapseAllTopLevel( select, dispatch );
					return;
				}
			} else {
				appliedAutoCollapseForPostId = postId;
			}
		}

		if ( postId && collapsed !== lastWritten ) {
			scheduleWrite( `post:${ postId }`, collapsed );
		}

		if ( ! postId && hydratedForPostId === null ) {
			hydratedForPostId = 0;
		}
	} );
}

function CollapserPlugin() {
	return (
		<>
			<ShortcutRegistrar />
			<CollapserSidebar />
			<BlockMenuEntry />
		</>
	);
}

function applySettingsToCanvas() {
	const settings = getSettings();
	const apply = ( doc ) => {
		if ( ! doc?.documentElement ) {
			return false;
		}
		doc.documentElement.style.setProperty(
			'--collapsi-accent',
			settings.accentColor
		);
		doc.documentElement.style.setProperty(
			'--collapsi-bar-text',
			settings.barTextColor
		);
		return true;
	};

	apply( document );

	// The iframe canvas mounts asynchronously. Poll briefly until found,
	// then apply. Cap at 10s.
	const start = Date.now();
	const interval = window.setInterval( () => {
		const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
		if ( apply( iframe?.contentDocument ) ) {
			window.clearInterval( interval );
			return;
		}
		if ( Date.now() - start > 10_000 ) {
			window.clearInterval( interval );
		}
	}, 500 );
}

if ( typeof window !== 'undefined' ) {
	startPersistenceLoop();
	applySettingsToCanvas();
	registerPlugin( 'collapsi-for-gutenberg', {
		render: CollapserPlugin,
	} );
}

export { collapserStore };
