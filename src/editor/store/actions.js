export function setCollapsed( key, isCollapsed ) {
	return { type: 'SET_COLLAPSED', key, isCollapsed: !! isCollapsed };
}

export function toggleCollapsed( key, currentValue ) {
	return setCollapsed( key, ! currentValue );
}

export function hydrate( collapsed ) {
	return { type: 'HYDRATE', collapsed };
}

export function clearAll() {
	return { type: 'CLEAR_ALL' };
}
