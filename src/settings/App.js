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
	{ name: 'general', title: __( 'General', 'collapsi-for-block-editor' ) },
	{
		name: 'behaviour',
		title: __( 'Behaviour', 'collapsi-for-block-editor' ),
	},
	{
		name: 'appearance',
		title: __( 'Appearance', 'collapsi-for-block-editor' ),
	},
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
							'collapsi-for-block-editor'
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
				message: __( 'Settings saved.', 'collapsi-for-block-editor' ),
			} );
		} catch ( err ) {
			setNotice( {
				status: 'error',
				message:
					err?.message ||
					__( 'Save failed.', 'collapsi-for-block-editor' ),
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
						'Collapsi for the Block Editor',
						'collapsi-for-block-editor'
					) }
				</h1>
				<Button
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
					onClick={ onSave }
				>
					{ saving
						? __( 'Saving…', 'collapsi-for-block-editor' )
						: __( 'Save changes', 'collapsi-for-block-editor' ) }
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
