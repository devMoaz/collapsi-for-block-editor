export function isCollapsedByKey( state, key ) {
	if ( ! key ) {
		return false;
	}
	return state.collapsed[ key ] === true;
}

export function getCollapsedMap( state ) {
	return state.collapsed;
}
