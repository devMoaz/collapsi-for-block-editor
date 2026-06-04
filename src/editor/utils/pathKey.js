/**
 * Computes a stable persistence key for a block.
 *
 * Prefers user-set metadata.name (survives reorder).
 * Falls back to dot-joined structural path from root.
 *
 * @param {string}   clientId Block clientId.
 * @param {Function} select   wp.data.select function (injected for testability).
 * @return {string|null} Key like "name:hero-cta" or "0.2.1", or null if unknown.
 */
export function computeBlockKey( clientId, select ) {
	if ( ! clientId ) {
		return null;
	}

	const blockEditor = select( 'core/block-editor' );
	if ( ! blockEditor ) {
		return null;
	}

	const block = blockEditor.getBlock( clientId );
	const metadataName = block?.attributes?.metadata?.name;
	if ( metadataName ) {
		return `name:${ metadataName }`;
	}

	const parts = [];
	let current = clientId;
	let guard = 0;
	while ( current && guard < 256 ) {
		parts.unshift( String( blockEditor.getBlockIndex( current ) ) );
		current = blockEditor.getBlockRootClientId( current );
		guard++;
	}
	return parts.join( '.' );
}
