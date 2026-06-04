// src/settings/App.js
import { useState, useEffect } from '@wordpress/element';
import { TabPanel, Button, Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { readSettings, writeSettings } from './api';
import { DEFAULTS } from '../editor/utils/settings';
import GeneralTab from './tabs/GeneralTab';
import BehaviourTab from './tabs/BehaviourTab';
import AppearanceTab from './tabs/AppearanceTab';

const TABS = [
	{ name: 'general', title: __( 'General', 'collapsi-for-gutenberg' ) },
	{ name: 'behaviour', title: __( 'Behaviour', 'collapsi-for-gutenberg' ) },
	{ name: 'appearance', title: __( 'Appearance', 'collapsi-for-gutenberg' ) },
];

function App() {
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ settings, setSettings ] = useState( DEFAULTS );
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		readSettings()
			.then( ( stored ) => {
				setSettings( { ...DEFAULTS, ...stored } );
				setLoading( false );
			} )
			.catch( ( err ) => {
				setNotice( {
					status: 'error',
					message:
						err?.message ||
						__(
							'Failed to load settings.',
							'collapsi-for-gutenberg'
						),
				} );
				setLoading( false );
			} );
	}, [] );

	const update = ( patch ) =>
		setSettings( ( prev ) => ( { ...prev, ...patch } ) );

	const onSave = async () => {
		setSaving( true );
		setNotice( null );
		try {
			const saved = await writeSettings( settings );
			setSettings( { ...DEFAULTS, ...saved } );
			setNotice( {
				status: 'success',
				message: __( 'Settings saved.', 'collapsi-for-gutenberg' ),
			} );
		} catch ( err ) {
			setNotice( {
				status: 'error',
				message:
					err?.message ||
					__( 'Save failed.', 'collapsi-for-gutenberg' ),
			} );
		} finally {
			setSaving( false );
		}
	};

	if ( loading ) {
		return (
			<div className="collapsi-settings__loading">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="collapsi-settings">
			<header className="collapsi-settings__header">
				<h1>
					{ __(
						'Collapsi for Gutenberg Blocks',
						'collapsi-for-gutenberg'
					) }
				</h1>
				<Button
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
					onClick={ onSave }
				>
					{ saving
						? __( 'Saving…', 'collapsi-for-gutenberg' )
						: __( 'Save changes', 'collapsi-for-gutenberg' ) }
				</Button>
			</header>
			{ notice && (
				<Notice
					status={ notice.status }
					onRemove={ () => setNotice( null ) }
				>
					{ notice.message }
				</Notice>
			) }
			<TabPanel
				className="collapsi-settings__tabs"
				tabs={ TABS }
				initialTabName="general"
			>
				{ ( tab ) => {
					switch ( tab.name ) {
						case 'general':
							return (
								<GeneralTab
									settings={ settings }
									onChange={ update }
								/>
							);
						case 'behaviour':
							return (
								<BehaviourTab
									settings={ settings }
									onChange={ update }
								/>
							);
						case 'appearance':
							return (
								<AppearanceTab
									settings={ settings }
									onChange={ update }
								/>
							);
						default:
							return null;
					}
				} }
			</TabPanel>
		</div>
	);
}

export default App;
