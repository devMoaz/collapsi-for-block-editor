export const DEFAULT_STATE = {
	collapsed: {},
};

function isPlainObject( value ) {
	return (
		value !== null && typeof value === 'object' && ! Array.isArray( value )
	);
}

export default function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'SET_COLLAPSED': {
			if ( ! action.key ) {
				return state;
			}
			const next = { ...state.collapsed };
			if ( action.isCollapsed ) {
				next[ action.key ] = true;
			} else {
				delete next[ action.key ];
			}
			return { ...state, collapsed: next };
		}
		case 'HYDRATE':
			return {
				...state,
				collapsed: isPlainObject( action.collapsed )
					? { ...action.collapsed }
					: {},
			};
		case 'CLEAR_ALL':
			return { ...state, collapsed: {} };
		default:
			return state;
	}
}
