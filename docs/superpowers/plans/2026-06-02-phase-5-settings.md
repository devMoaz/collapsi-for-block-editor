# Phase 5 — Settings Page React App + REST-Backed `register_setting`

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`. Phase 5 is the largest phase (2 days). Tasks are sequenced so each ships working software on its own.

**Goal:** Ship a 4-tab settings page at `Settings → Block Collapser` that persists to `wp_options` via `register_setting` with REST exposure, plus the minimum editor wire-up so the settings actually shape editor behavior (kill switch, preview/icon visibility, accent color, auto-collapse-on-load mode).

**Architecture:** New PHP `Settings` class registers a single `block_collapser_options` option with REST schema and sanitize callback. New React app at `src/settings/` (separate webpack entry, already scaffolded as `src/settings/index.js`) renders `<TabPanel>` from `@wordpress/components` with 4 tab views. Reads + writes via `@wordpress/api-fetch` against `/wp/v2/settings`. PHP localizes the same options into the editor bundle (`window.blockCollapserSettings`) so editor JS can read them synchronously at boot — no extra REST round trip in the editor.

**Tech Stack:** `register_setting` + REST schema (PHP); `@wordpress/api-fetch`, `@wordpress/components` (`TabPanel`, `ToggleControl`, `SelectControl`, `ColorPicker`, `Button`, `Notice`), `@wordpress/element` (`useState`, `useEffect`), `@wordpress/i18n` (React).

**Cross-cutting decisions honored:**
- #11 No telemetry — settings are local options, no remote sync
- #12 i18n: all strings via `__` (JS) and `esc_html__` (PHP)
- Min versions: settings page renders fine on WP 6.5+ (TabPanel is stable since 5.5)

---

## Settings model (locked for v1)

Single option key: `block_collapser_options`. Shape:

```php
[
    'enabled'             => true,            // master kill switch
    'showPreview'         => true,            // bar preview line
    'showIcon'            => true,            // bar block icon
    'autoCollapseOnLoad'  => 'never',         // 'never' | 'all' | 'by-rule'
    'blockRules'          => [                // per-block-type rule
        // 'core/paragraph' => 'default' | 'never' | 'always'
    ],
    'accentColor'         => '#1d9e75',       // hex; drives CSS variable
    'barTextColor'        => '#444444',       // hex
]
```

REST exposure: `register_setting( 'block_collapser', 'block_collapser_options', [ 'show_in_rest' => [ 'schema' => ... ], 'sanitize_callback' => ... ] )`. The full record lives at `GET /wp/v2/settings` under the `block_collapser_options` key, writable via `POST /wp/v2/settings` with `{ "block_collapser_options": {...} }`.

The 4 tabs map to:
- **General:** `enabled`, `showPreview`, `showIcon`
- **Behaviour:** `autoCollapseOnLoad` (select)
- **Block Rules:** `blockRules` (curated list of ~12 common block types)
- **Appearance:** `accentColor`, `barTextColor`

---

## File structure for this phase

```
includes/
├── class-settings.php             # CREATE — register_setting + sanitize + REST schema
├── class-plugin.php               # MODIFY — boot Settings
├── class-assets.php               # MODIFY — wp_add_inline_script localizing settings
└── class-admin-page.php           # MODIFY — enqueue settings script + style

src/
├── editor/
│   ├── components/
│   │   ├── CollapseWrapper.js     # MODIFY — respect enabled, blockRules autoCollapse
│   │   └── CollapseBar.js         # MODIFY — respect showPreview, showIcon
│   ├── utils/
│   │   └── settings.js            # CREATE — safe getter for window.blockCollapserSettings
│   ├── editor.scss                # MODIFY — accent color via CSS variable
│   └── index.js                   # MODIFY — accent color set on :root + autoCollapseOnLoad hook
└── settings/
    ├── index.js                   # MODIFY — mount React app (was a stub)
    ├── App.js                     # CREATE — TabPanel container + save bar
    ├── api.js                     # CREATE — apiFetch wrappers
    ├── tabs/
    │   ├── GeneralTab.js          # CREATE
    │   ├── BehaviourTab.js        # CREATE
    │   ├── BlockRulesTab.js       # CREATE
    │   └── AppearanceTab.js       # CREATE
    └── settings.scss              # CREATE — minimal styles

tests/
├── unit/
│   ├── editor/
│   │   └── settings.test.js       # CREATE — safe getter handles missing/malformed input
│   └── settings/
│       └── api.test.js            # CREATE — apiFetch wrapper shapes
└── php/
    └── SettingsTest.php           # CREATE — sanitize callback unit tests (PHPUnit-style; if no PHPUnit env, defer to Phase 6)
```

---

## Task 1: PHP `Settings` class

**Files:**
- Create: `includes/class-settings.php`
- Modify: `includes/class-plugin.php`

**Rationale:** Single `register_setting` call wires options storage + REST exposure + sanitize. The sanitize callback validates each field against the schema, coerces types, and strips unknown keys.

- [ ] **Step 1: Implement `BlockCollapser\Settings`**

```php
<?php
/**
 * Settings registration with REST exposure.
 *
 * @package BlockCollapser
 */

declare( strict_types=1 );

namespace BlockCollapser;

defined( 'ABSPATH' ) || exit;

/**
 * Owns the block_collapser_options option and its REST schema.
 */
final class Settings {

	public const OPTION_NAME    = 'block_collapser_options';
	public const OPTION_GROUP   = 'block_collapser';
	public const ALLOWED_MODES  = array( 'never', 'all', 'by-rule' );
	public const ALLOWED_RULES  = array( 'default', 'never', 'always' );

	/**
	 * Hook into init.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_setting' ) );
	}

	/**
	 * Register the option with REST schema + sanitize.
	 */
	public function register_setting(): void {
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_NAME,
			array(
				'type'              => 'object',
				'default'           => self::defaults(),
				'sanitize_callback' => array( $this, 'sanitize' ),
				'show_in_rest'      => array(
					'schema' => self::schema(),
				),
			)
		);
	}

	/**
	 * Default values for the option.
	 *
	 * @return array<string, mixed>
	 */
	public static function defaults(): array {
		return array(
			'enabled'            => true,
			'showPreview'        => true,
			'showIcon'           => true,
			'autoCollapseOnLoad' => 'never',
			'blockRules'         => (object) array(),
			'accentColor'        => '#1d9e75',
			'barTextColor'       => '#444444',
		);
	}

	/**
	 * REST schema describing every field.
	 *
	 * @return array<string, mixed>
	 */
	public static function schema(): array {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'enabled'            => array( 'type' => 'boolean' ),
				'showPreview'        => array( 'type' => 'boolean' ),
				'showIcon'           => array( 'type' => 'boolean' ),
				'autoCollapseOnLoad' => array(
					'type' => 'string',
					'enum' => self::ALLOWED_MODES,
				),
				'blockRules'         => array(
					'type'                 => 'object',
					'additionalProperties' => array(
						'type' => 'string',
						'enum' => self::ALLOWED_RULES,
					),
				),
				'accentColor'        => array(
					'type'    => 'string',
					'pattern' => '^#[0-9a-fA-F]{6}$',
				),
				'barTextColor'       => array(
					'type'    => 'string',
					'pattern' => '^#[0-9a-fA-F]{6}$',
				),
			),
			'additionalProperties' => false,
		);
	}

	/**
	 * Sanitize the option payload.
	 *
	 * Returns a fresh array with only known fields, coerced types, and
	 * rejected values replaced with defaults. Safe against malicious or
	 * malformed REST input.
	 *
	 * @param mixed $value Raw input.
	 * @return array<string, mixed>
	 */
	public function sanitize( $value ): array {
		$defaults = self::defaults();
		if ( ! is_array( $value ) ) {
			return $defaults;
		}

		$out = $defaults;

		if ( isset( $value['enabled'] ) ) {
			$out['enabled'] = (bool) $value['enabled'];
		}
		if ( isset( $value['showPreview'] ) ) {
			$out['showPreview'] = (bool) $value['showPreview'];
		}
		if ( isset( $value['showIcon'] ) ) {
			$out['showIcon'] = (bool) $value['showIcon'];
		}
		if (
			isset( $value['autoCollapseOnLoad'] ) &&
			in_array( $value['autoCollapseOnLoad'], self::ALLOWED_MODES, true )
		) {
			$out['autoCollapseOnLoad'] = $value['autoCollapseOnLoad'];
		}
		if ( isset( $value['blockRules'] ) && is_array( $value['blockRules'] ) ) {
			$rules = array();
			foreach ( $value['blockRules'] as $block_name => $mode ) {
				if (
					is_string( $block_name ) &&
					preg_match( '#^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$#', $block_name ) &&
					is_string( $mode ) &&
					in_array( $mode, self::ALLOWED_RULES, true )
				) {
					$rules[ $block_name ] = $mode;
				}
			}
			$out['blockRules'] = (object) $rules;
		}
		if (
			isset( $value['accentColor'] ) &&
			is_string( $value['accentColor'] ) &&
			preg_match( '/^#[0-9a-fA-F]{6}$/', $value['accentColor'] )
		) {
			$out['accentColor'] = strtolower( $value['accentColor'] );
		}
		if (
			isset( $value['barTextColor'] ) &&
			is_string( $value['barTextColor'] ) &&
			preg_match( '/^#[0-9a-fA-F]{6}$/', $value['barTextColor'] )
		) {
			$out['barTextColor'] = strtolower( $value['barTextColor'] );
		}

		return $out;
	}

	/**
	 * Read current settings, falling back to defaults on missing keys.
	 *
	 * @return array<string, mixed>
	 */
	public static function get(): array {
		$stored = get_option( self::OPTION_NAME, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		return array_merge( self::defaults(), $stored );
	}
}
```

- [ ] **Step 2: Boot Settings from Plugin**

In `includes/class-plugin.php`, add to `boot()`:

```php
( new Settings() )->register();
```

Add to top of file:

```php
require_once BLOCK_COLLAPSER_DIR . 'includes/class-settings.php';
```

(Or rely on classmap autoload — check current pattern.)

In `block-collapser.php` add the require:

```php
require_once BLOCK_COLLAPSER_DIR . 'includes/class-settings.php';
```

- [ ] **Step 3: Verify PHP gates**

```
composer run phpstan
composer run phpcs
```

Both must be clean.

- [ ] **Step 4: Smoke test the option round-trips**

In a browser tab logged into wp-admin, visit `/wp-json/wp/v2/settings?_locale=user` (must be logged in as admin) — confirm the response includes `block_collapser_options` with the default shape.

Or via WP-CLI / `wp option get block_collapser_options --format=json` should return null until something writes, but the REST endpoint always returns defaults via the schema.

- [ ] **Step 5: Commit**

```
git add includes/class-settings.php includes/class-plugin.php block-collapser.php
git commit -m "feat: register block_collapser_options with REST schema and sanitize"
```

---

## Task 2: Localize settings into editor JS

**Files:**
- Modify: `includes/class-assets.php`
- Create: `src/editor/utils/settings.js`
- Test: `tests/unit/editor/settings.test.js`

**Rationale:** Editor reads `window.blockCollapserSettings` synchronously at boot — no async load state, no race conditions. The localize call runs alongside the editor script enqueue.

- [ ] **Step 1: Add localize call to `Assets::enqueue_editor_script()`**

Inside `enqueue_editor_script`, after `wp_set_script_translations`:

```php
wp_add_inline_script(
    self::HANDLE,
    'window.blockCollapserSettings = ' . wp_json_encode( Settings::get() ) . ';',
    'before'
);
```

Add `use BlockCollapser\Settings;` or fully qualify.

- [ ] **Step 2: Implement the JS safe getter**

```js
// src/editor/utils/settings.js
/**
 * Read settings localized by PHP into window.blockCollapserSettings.
 *
 * Defensive: any missing or wrong-type key falls back to its default.
 * Editor code should always go through getSettings() — never read
 * window.blockCollapserSettings directly.
 */

export const DEFAULTS = Object.freeze( {
	enabled: true,
	showPreview: true,
	showIcon: true,
	autoCollapseOnLoad: 'never',
	blockRules: {},
	accentColor: '#1d9e75',
	barTextColor: '#444444',
} );

const ALLOWED_MODES = [ 'never', 'all', 'by-rule' ];
const ALLOWED_RULES = [ 'default', 'never', 'always' ];

function isPlainObject( value ) {
	return value !== null && typeof value === 'object' && ! Array.isArray( value );
}

function coerceBool( raw, fallback ) {
	if ( typeof raw === 'boolean' ) {
		return raw;
	}
	return fallback;
}

function coerceHex( raw, fallback ) {
	if (
		typeof raw === 'string' &&
		/^#[0-9a-fA-F]{6}$/.test( raw )
	) {
		return raw.toLowerCase();
	}
	return fallback;
}

function coerceMode( raw ) {
	return ALLOWED_MODES.includes( raw ) ? raw : DEFAULTS.autoCollapseOnLoad;
}

function coerceBlockRules( raw ) {
	if ( ! isPlainObject( raw ) ) {
		return {};
	}
	const out = {};
	for ( const [ key, value ] of Object.entries( raw ) ) {
		if (
			typeof key === 'string' &&
			/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( key ) &&
			ALLOWED_RULES.includes( value )
		) {
			out[ key ] = value;
		}
	}
	return out;
}

export function getSettings() {
	const raw =
		typeof window !== 'undefined' ? window.blockCollapserSettings : null;
	if ( ! isPlainObject( raw ) ) {
		return { ...DEFAULTS };
	}
	return {
		enabled: coerceBool( raw.enabled, DEFAULTS.enabled ),
		showPreview: coerceBool( raw.showPreview, DEFAULTS.showPreview ),
		showIcon: coerceBool( raw.showIcon, DEFAULTS.showIcon ),
		autoCollapseOnLoad: coerceMode( raw.autoCollapseOnLoad ),
		blockRules: coerceBlockRules( raw.blockRules ),
		accentColor: coerceHex( raw.accentColor, DEFAULTS.accentColor ),
		barTextColor: coerceHex( raw.barTextColor, DEFAULTS.barTextColor ),
	};
}
```

- [ ] **Step 3: Write tests**

```js
// tests/unit/editor/settings.test.js
import { getSettings, DEFAULTS } from '../../../src/editor/utils/settings';

describe( 'getSettings', () => {
	beforeEach( () => {
		delete window.blockCollapserSettings;
	} );

	it( 'returns defaults when window.blockCollapserSettings is undefined', () => {
		expect( getSettings() ).toEqual( DEFAULTS );
	} );

	it( 'returns defaults when window.blockCollapserSettings is null', () => {
		window.blockCollapserSettings = null;
		expect( getSettings() ).toEqual( DEFAULTS );
	} );

	it( 'returns defaults when window.blockCollapserSettings is an array', () => {
		window.blockCollapserSettings = [];
		expect( getSettings() ).toEqual( DEFAULTS );
	} );

	it( 'reads valid values', () => {
		window.blockCollapserSettings = {
			enabled: false,
			showPreview: false,
			showIcon: true,
			autoCollapseOnLoad: 'all',
			blockRules: { 'core/paragraph': 'always', 'core/group': 'never' },
			accentColor: '#FF00AA',
			barTextColor: '#222222',
		};
		expect( getSettings() ).toEqual( {
			enabled: false,
			showPreview: false,
			showIcon: true,
			autoCollapseOnLoad: 'all',
			blockRules: { 'core/paragraph': 'always', 'core/group': 'never' },
			accentColor: '#ff00aa',
			barTextColor: '#222222',
		} );
	} );

	it( 'falls back to defaults for invalid types', () => {
		window.blockCollapserSettings = {
			enabled: 'yes',
			showPreview: 1,
			autoCollapseOnLoad: 'never-ever',
			accentColor: 'red',
			blockRules: 'oops',
		};
		const out = getSettings();
		expect( out.enabled ).toBe( DEFAULTS.enabled );
		expect( out.showPreview ).toBe( DEFAULTS.showPreview );
		expect( out.autoCollapseOnLoad ).toBe( DEFAULTS.autoCollapseOnLoad );
		expect( out.accentColor ).toBe( DEFAULTS.accentColor );
		expect( out.blockRules ).toEqual( {} );
	} );

	it( 'rejects block rules with malformed keys or modes', () => {
		window.blockCollapserSettings = {
			blockRules: {
				'core/paragraph': 'always',
				'no-slash': 'always',
				'core/heading': 'maybe',
				'A/B': 'never', // uppercase rejected
			},
		};
		expect( getSettings().blockRules ).toEqual( {
			'core/paragraph': 'always',
		} );
	} );
} );
```

- [ ] **Step 4: Build + lint + test**

```
npm run build
npm run lint:js -- src/editor/utils/settings.js tests/unit/editor/settings.test.js
npm test
```

Test total should be 64 + 6 = 70.

- [ ] **Step 5: Commit**

```
git add includes/class-assets.php src/editor/utils/settings.js tests/unit/editor/settings.test.js
git commit -m "feat: localize settings to window.blockCollapserSettings with safe getter"
```

---

## Task 3: REST `apiFetch` wrapper

**Files:**
- Create: `src/settings/api.js`
- Test: `tests/unit/settings/api.test.js`

**Rationale:** Thin wrapper around `@wordpress/api-fetch` for `/wp/v2/settings` reads/writes. Returns just the `block_collapser_options` slice on read; sends just that slice on write. Tests verify the request shape (path + payload).

- [ ] **Step 1: Implement**

```js
// src/settings/api.js
import apiFetch from '@wordpress/api-fetch';

const OPTION_KEY = 'block_collapser_options';

export async function readSettings() {
	const response = await apiFetch( { path: '/wp/v2/settings' } );
	return response?.[ OPTION_KEY ] ?? {};
}

export async function writeSettings( options ) {
	const response = await apiFetch( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: { [ OPTION_KEY ]: options },
	} );
	return response?.[ OPTION_KEY ] ?? options;
}

export { OPTION_KEY };
```

- [ ] **Step 2: Test**

```js
// tests/unit/settings/api.test.js
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

import apiFetch from '@wordpress/api-fetch';
import { readSettings, writeSettings, OPTION_KEY } from '../../../src/settings/api';

describe( 'readSettings', () => {
	beforeEach( () => apiFetch.mockReset() );

	it( 'GETs /wp/v2/settings and extracts the option key', async () => {
		apiFetch.mockResolvedValue( {
			[ OPTION_KEY ]: { enabled: false },
			other_option: 'ignored',
		} );
		const out = await readSettings();
		expect( apiFetch ).toHaveBeenCalledWith( { path: '/wp/v2/settings' } );
		expect( out ).toEqual( { enabled: false } );
	} );

	it( 'returns empty object when option key missing', async () => {
		apiFetch.mockResolvedValue( { other: 1 } );
		expect( await readSettings() ).toEqual( {} );
	} );
} );

describe( 'writeSettings', () => {
	beforeEach( () => apiFetch.mockReset() );

	it( 'POSTs the option payload wrapped under the option key', async () => {
		apiFetch.mockResolvedValue( {
			[ OPTION_KEY ]: { enabled: true },
		} );
		const out = await writeSettings( { enabled: true } );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { [ OPTION_KEY ]: { enabled: true } },
		} );
		expect( out ).toEqual( { enabled: true } );
	} );
} );
```

- [ ] **Step 3: Build + lint + test**

```
npm run build
npm run lint:js -- src/settings/api.js tests/unit/settings/api.test.js
npm test
```

Total tests should now be ~74.

- [ ] **Step 4: Commit**

```
git add src/settings/api.js tests/unit/settings/api.test.js
git commit -m "feat(settings): add apiFetch read/write wrappers for /wp/v2/settings"
```

---

## Task 4: Settings React app shell — `App.js` + `index.js`

**Files:**
- Create: `src/settings/App.js`
- Modify: `src/settings/index.js` (was a 5-byte stub)
- Create: `src/settings/settings.scss`

**Rationale:** Mount-point `#block-collapser-settings-root` already exists in `class-admin-page.php`. App boots `readSettings()` on mount, holds form state, renders `TabPanel` with 4 tabs and a Save button. Save calls `writeSettings()` and toggles a Notice.

- [ ] **Step 1: Implement `App.js`**

```js
// src/settings/App.js
import { useState, useEffect } from '@wordpress/element';
import { TabPanel, Button, Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { readSettings, writeSettings } from './api';
import { DEFAULTS } from '../editor/utils/settings';
import GeneralTab from './tabs/GeneralTab';
import BehaviourTab from './tabs/BehaviourTab';
import BlockRulesTab from './tabs/BlockRulesTab';
import AppearanceTab from './tabs/AppearanceTab';

const TABS = [
	{ name: 'general', title: __( 'General', 'block-collapser' ) },
	{ name: 'behaviour', title: __( 'Behaviour', 'block-collapser' ) },
	{ name: 'rules', title: __( 'Block Rules', 'block-collapser' ) },
	{ name: 'appearance', title: __( 'Appearance', 'block-collapser' ) },
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
					message: err?.message || __( 'Failed to load settings.', 'block-collapser' ),
				} );
				setLoading( false );
			} );
	}, [] );

	const update = ( patch ) => setSettings( ( prev ) => ( { ...prev, ...patch } ) );

	const onSave = async () => {
		setSaving( true );
		setNotice( null );
		try {
			const saved = await writeSettings( settings );
			setSettings( { ...DEFAULTS, ...saved } );
			setNotice( {
				status: 'success',
				message: __( 'Settings saved.', 'block-collapser' ),
			} );
		} catch ( err ) {
			setNotice( {
				status: 'error',
				message: err?.message || __( 'Save failed.', 'block-collapser' ),
			} );
		} finally {
			setSaving( false );
		}
	};

	if ( loading ) {
		return (
			<div className="block-collapser-settings__loading">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="block-collapser-settings">
			<header className="block-collapser-settings__header">
				<h1>{ __( 'Block Collapser', 'block-collapser' ) }</h1>
				<Button
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
					onClick={ onSave }
				>
					{ saving
						? __( 'Saving…', 'block-collapser' )
						: __( 'Save changes', 'block-collapser' ) }
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
				className="block-collapser-settings__tabs"
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
						case 'rules':
							return (
								<BlockRulesTab
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
```

- [ ] **Step 2: Implement `index.js`**

```js
// src/settings/index.js
import { createRoot } from '@wordpress/element';
import App from './App';
import './settings.scss';

const mount = document.getElementById( 'block-collapser-settings-root' );
if ( mount ) {
	createRoot( mount ).render( <App /> );
}
```

- [ ] **Step 3: Implement `settings.scss`**

```scss
.block-collapser-settings {
	max-width: 800px;
	margin: 20px 20px 0 0;

	&__loading {
		display: flex;
		justify-content: center;
		padding: 40px 0;
	}

	&__header {
		display: flex;
		gap: 16px;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	&__tabs {
		margin-top: 16px;
	}

	.components-tab-panel__tab-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px 0;
	}

	.block-collapser-tab__row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.block-collapser-tab__description {
		color: #666;
		font-size: 12px;
	}
}
```

- [ ] **Step 4: Build (will fail until tabs are created)**

Skip build at this point — the tab imports don't resolve yet. The next 4 tasks create them.

- [ ] **Step 5: Commit**

```
git add src/settings/App.js src/settings/index.js src/settings/settings.scss
git commit -m "feat(settings): scaffold React app shell with TabPanel and save bar"
```

---

## Task 5: General tab

**Files:**
- Create: `src/settings/tabs/GeneralTab.js`

```js
// src/settings/tabs/GeneralTab.js
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function GeneralTab( { settings, onChange } ) {
	return (
		<>
			<ToggleControl
				label={ __( 'Enable Block Collapser', 'block-collapser' ) }
				help={ __(
					'Master switch. When off, no chevrons appear and no collapse state is tracked.',
					'block-collapser'
				) }
				checked={ settings.enabled }
				onChange={ ( v ) => onChange( { enabled: v } ) }
				__nextHasNoMarginBottom
			/>
			<ToggleControl
				label={ __( 'Show content preview in collapsed bar', 'block-collapser' ) }
				help={ __(
					'Display a short summary (paragraph text, image alt, "N blocks", etc.) next to the block title when collapsed.',
					'block-collapser'
				) }
				checked={ settings.showPreview }
				onChange={ ( v ) => onChange( { showPreview: v } ) }
				__nextHasNoMarginBottom
			/>
			<ToggleControl
				label={ __( 'Show block icon in collapsed bar', 'block-collapser' ) }
				help={ __(
					'Display the block-type icon next to the title.',
					'block-collapser'
				) }
				checked={ settings.showIcon }
				onChange={ ( v ) => onChange( { showIcon: v } ) }
				__nextHasNoMarginBottom
			/>
		</>
	);
}

export default GeneralTab;
```

- [ ] **Commit:** `git commit -m "feat(settings/general): add enabled, showPreview, showIcon toggles"`

---

## Task 6: Behaviour tab

**Files:**
- Create: `src/settings/tabs/BehaviourTab.js`

```js
// src/settings/tabs/BehaviourTab.js
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function BehaviourTab( { settings, onChange } ) {
	return (
		<>
			<SelectControl
				label={ __( 'Auto-collapse on editor load', 'block-collapser' ) }
				help={ __(
					'Choose what should happen to top-level blocks each time the editor opens. Per-instance "Never collapse" overrides still apply.',
					'block-collapser'
				) }
				value={ settings.autoCollapseOnLoad }
				options={ [
					{
						label: __( 'Never auto-collapse', 'block-collapser' ),
						value: 'never',
					},
					{
						label: __( 'Collapse all top-level blocks', 'block-collapser' ),
						value: 'all',
					},
					{
						label: __( 'Use per-block-type rules', 'block-collapser' ),
						value: 'by-rule',
					},
				] }
				onChange={ ( v ) => onChange( { autoCollapseOnLoad: v } ) }
				__nextHasNoMarginBottom
			/>
			<p className="block-collapser-tab__description">
				{ __(
					'Tip: press Alt+Shift+C in the editor to toggle all top-level blocks. This shortcut cannot be customized in v1.',
					'block-collapser'
				) }
			</p>
		</>
	);
}

export default BehaviourTab;
```

- [ ] **Commit:** `git commit -m "feat(settings/behaviour): add auto-collapse mode select"`

---

## Task 7: Block Rules tab

**Files:**
- Create: `src/settings/tabs/BlockRulesTab.js`

**Rationale:** Curated list of common block types. Each row is a `SelectControl` with three modes. The setting is sparse — only non-`default` values are stored.

```js
// src/settings/tabs/BlockRulesTab.js
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const COMMON_TYPES = [
	{ name: 'core/paragraph', label: 'Paragraph' },
	{ name: 'core/heading', label: 'Heading' },
	{ name: 'core/image', label: 'Image' },
	{ name: 'core/list', label: 'List' },
	{ name: 'core/group', label: 'Group' },
	{ name: 'core/columns', label: 'Columns' },
	{ name: 'core/cover', label: 'Cover' },
	{ name: 'core/buttons', label: 'Buttons' },
	{ name: 'core/quote', label: 'Quote' },
	{ name: 'core/code', label: 'Code' },
	{ name: 'core/video', label: 'Video' },
	{ name: 'core/audio', label: 'Audio' },
];

const OPTIONS = [
	{ label: 'Default (no rule)', value: 'default' },
	{ label: 'Always auto-collapse', value: 'always' },
	{ label: 'Never auto-collapse', value: 'never' },
];

function BlockRulesTab( { settings, onChange } ) {
	const rules = settings.blockRules ?? {};

	const onRowChange = ( blockName, mode ) => {
		const next = { ...rules };
		if ( mode === 'default' ) {
			delete next[ blockName ];
		} else {
			next[ blockName ] = mode;
		}
		onChange( { blockRules: next } );
	};

	return (
		<>
			<p className="block-collapser-tab__description">
				{ __(
					'Set per-block-type behavior for the "Use per-block-type rules" auto-collapse mode. Other blocks fall back to the default (not auto-collapsed).',
					'block-collapser'
				) }
			</p>
			{ COMMON_TYPES.map( ( type ) => (
				<div key={ type.name } className="block-collapser-tab__row">
					<SelectControl
						label={ type.label }
						value={ rules[ type.name ] ?? 'default' }
						options={ OPTIONS }
						onChange={ ( v ) => onRowChange( type.name, v ) }
						__nextHasNoMarginBottom
					/>
				</div>
			) ) }
		</>
	);
}

export default BlockRulesTab;
```

- [ ] **Commit:** `git commit -m "feat(settings/rules): add per-block-type auto-collapse rules"`

---

## Task 8: Appearance tab

**Files:**
- Create: `src/settings/tabs/AppearanceTab.js`

```js
// src/settings/tabs/AppearanceTab.js
import { ColorPicker, BaseControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

function AppearanceTab( { settings, onChange } ) {
	const accentId = useInstanceId( AppearanceTab, 'block-collapser-accent' );
	const textId = useInstanceId( AppearanceTab, 'block-collapser-text' );

	return (
		<>
			<BaseControl
				id={ accentId }
				label={ __( 'Accent color', 'block-collapser' ) }
				help={ __(
					'Left border and icon color on collapsed blocks.',
					'block-collapser'
				) }
			>
				<ColorPicker
					color={ settings.accentColor }
					onChangeComplete={ ( color ) =>
						onChange( { accentColor: color.hex } )
					}
					disableAlpha
				/>
			</BaseControl>
			<BaseControl
				id={ textId }
				label={ __( 'Bar title color', 'block-collapser' ) }
				help={ __( 'Block title text in the collapsed bar.', 'block-collapser' ) }
			>
				<ColorPicker
					color={ settings.barTextColor }
					onChangeComplete={ ( color ) =>
						onChange( { barTextColor: color.hex } )
					}
					disableAlpha
				/>
			</BaseControl>
		</>
	);
}

export default AppearanceTab;
```

- [ ] **Commit:** `git commit -m "feat(settings/appearance): add accent + text color pickers"`

---

## Task 9: Enqueue settings bundle on the admin page

**Files:**
- Modify: `includes/class-admin-page.php`

**Rationale:** The settings React app needs the built `settings.js` + `settings.css` on the admin page. Wire them via `wp_enqueue_script` + `wp_enqueue_style` when the page hook matches.

- [ ] **Step 1: Read current `class-admin-page.php`**

It already renders the mount div. Add enqueue:

```php
public function register(): void {
    add_action( 'admin_menu', array( $this, 'add_menu' ) );
    add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
}

public function enqueue_assets( string $hook ): void {
    if ( $hook !== 'settings_page_' . self::SLUG ) {
        return;
    }

    $asset_file = BLOCK_COLLAPSER_DIR . 'build/settings.asset.php';
    if ( ! file_exists( $asset_file ) ) {
        return;
    }
    $asset = require $asset_file;

    wp_enqueue_script(
        self::HANDLE,
        BLOCK_COLLAPSER_URL . 'build/settings.js',
        $asset['dependencies'],
        $asset['version'],
        true
    );
    wp_set_script_translations( self::HANDLE, 'block-collapser' );

    $style_path = BLOCK_COLLAPSER_DIR . 'build/settings.css';
    if ( file_exists( $style_path ) ) {
        wp_enqueue_style(
            self::HANDLE,
            BLOCK_COLLAPSER_URL . 'build/settings.css',
            array( 'wp-components' ),
            (string) filemtime( $style_path )
        );
    }
}
```

(Adjust to match existing class shape — read current first.)

- [ ] **Step 2: Build all and verify**

```
npm run build
npm run lint:js
npm run lint:css
npm test
composer run phpstan
composer run phpcs
```

All clean.

- [ ] **Step 3: Commit**

```
git add includes/class-admin-page.php
git commit -m "feat(settings): enqueue React app on Settings → Block Collapser page"
```

---

## Task 10: Wire `enabled` + `showPreview` + `showIcon` into editor

**Files:**
- Modify: `src/editor/components/CollapseWrapper.js` — return bare BlockListBlock when `!settings.enabled`
- Modify: `src/editor/components/CollapseBar.js` — hide preview/icon per settings

**Rationale:** The settings UI persists but does nothing if the editor doesn't read it. This task wires the three General-tab settings into the editor surface.

- [ ] **Step 1: Update `CollapseWrapper.js`**

Read current file. At the top inside the HOC, add:

```js
import { getSettings } from '../utils/settings';
```

In the component function, before any `useSelect`:

```js
const settings = getSettings();
if ( ! settings.enabled ) {
    return <BlockListBlock { ...props } />;
}
```

(The `getSettings()` call is synchronous and reads `window.blockCollapserSettings` which is localized before the script runs. No re-render needed when the settings change because the page reloads after save.)

- [ ] **Step 2: Update `CollapseBar.js`**

Add `import { getSettings } from '../utils/settings';`. Inside the component, after the existing `useSelect`:

```js
const settings = getSettings();
const showIcon = settings.showIcon && icon;
const showPreview = settings.showPreview && preview;
```

Then in the JSX, gate the icon span on `showIcon` and the preview span on `showPreview`.

- [ ] **Step 3: Build + lint + test**

```
npm run build
npm run lint:js
npm test
```

All clean, 70+ tests pass.

- [ ] **Step 4: Commit**

```
git add src/editor/components/CollapseWrapper.js src/editor/components/CollapseBar.js
git commit -m "feat(editor): honor enabled, showPreview, showIcon settings"
```

---

## Task 11: Wire accent color + auto-collapse mode

**Files:**
- Modify: `src/editor/index.js`
- Modify: `src/editor/editor.scss`

**Rationale:** Accent color updates a CSS custom property at runtime. Auto-collapse-on-load runs once per editor mount inside the persistence loop's first hydration — uses Phase 4's `collapseAllTopLevel` for `'all'` mode and reads `blockRules` for `'by-rule'`.

- [ ] **Step 1: Update `editor.scss` to use custom properties**

Change hardcoded `#1d9e75` and `#444` to `var(--block-collapser-accent, #1d9e75)` and `var(--block-collapser-bar-text, #444)`.

Specifically, replace these lines:
- `border-left: 3px solid #1d9e75;` → `border-left: 3px solid var(--block-collapser-accent, #1d9e75);`
- `background: rgba(29, 158, 117, 0.05);` → leave (rgba can't be variableized cleanly in v1; accept the cosmetic mismatch or use color-mix when WP browser support catches up — defer to Phase 6)
- `color: #1d9e75;` (on icon) → `color: var(--block-collapser-accent, #1d9e75);`
- `color: #444;` (on bar) → `color: var(--block-collapser-bar-text, #444);`

- [ ] **Step 2: Update `index.js` to set the custom properties on document root**

After `startPersistenceLoop()`, add:

```js
function applySettingsToCanvas() {
    const settings = getSettings();
    if ( typeof document !== 'undefined' ) {
        document.documentElement.style.setProperty(
            '--block-collapser-accent',
            settings.accentColor
        );
        document.documentElement.style.setProperty(
            '--block-collapser-bar-text',
            settings.barTextColor
        );
    }
    // The iframe canvas pulls its own copy of editor.css, but the CSS
    // variables are on the iframe's own :root once enqueue_block_assets
    // injects them. Forward to the iframe doc when it becomes available.
    const apply = () => {
        const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
        const doc = iframe?.contentDocument;
        if ( ! doc ) {
            return false;
        }
        doc.documentElement.style.setProperty(
            '--block-collapser-accent',
            settings.accentColor
        );
        doc.documentElement.style.setProperty(
            '--block-collapser-bar-text',
            settings.barTextColor
        );
        return true;
    };
    if ( ! apply() ) {
        const interval = window.setInterval( () => {
            if ( apply() ) {
                window.clearInterval( interval );
            }
        }, 500 );
        window.setTimeout( () => window.clearInterval( interval ), 10_000 );
    }
}
```

Call `applySettingsToCanvas()` after `startPersistenceLoop()`.

- [ ] **Step 3: Wire auto-collapse-on-load**

In the persistence loop's hydrate branch, after `dispatch(STORE_NAME).hydrate(stored)` (when `stored` is null + first hydration), apply auto-collapse logic:

```js
// After initial hydration completes for this post, apply auto-collapse-on-load mode.
const settings = getSettings();
if ( settings.autoCollapseOnLoad === 'all' ) {
    collapseAllTopLevel( select, dispatch );
} else if ( settings.autoCollapseOnLoad === 'by-rule' ) {
    applyBlockRulesAutoCollapse( select, dispatch, settings.blockRules );
}
```

Add the helper `applyBlockRulesAutoCollapse` to `src/editor/sidebar/actions.js`:

```js
import { STORE_NAME } from '../store';
import { computeBlockKey } from '../utils/pathKey';

// ... existing helpers ...

export function applyBlockRulesAutoCollapse( select, dispatch, rules ) {
    if ( ! rules || typeof rules !== 'object' ) {
        return;
    }
    const blocks = select( 'core/block-editor' ).getBlocks();
    blocks.forEach( ( block ) => {
        const mode = rules[ block.name ];
        if ( mode === 'always' ) {
            const key = computeBlockKey( block.clientId, select );
            if ( key ) {
                dispatch( STORE_NAME ).setCollapsed( key, true );
            }
        } else if ( mode === 'never' ) {
            const key = computeBlockKey( block.clientId, select );
            if ( key ) {
                dispatch( STORE_NAME ).setCollapsed( key, false );
            }
        }
    } );
}
```

Add a test for it.

- [ ] **Step 4: Build + lint + test**

```
npm run build
npm run lint:js
npm run lint:css
npm test
```

All clean, ~73 tests pass.

- [ ] **Step 5: Commit**

```
git add src/editor/index.js src/editor/editor.scss src/editor/sidebar/actions.js tests/unit/sidebar/actions.test.js
git commit -m "feat(editor): apply accent color and auto-collapse-on-load mode"
```

---

## Task 12: Phase 5 verification + roadmap update

- [ ] **Step 1: Run all 6 gates**

```
npm run build
npm run lint:js
npm run lint:css
npm test
composer run phpstan
composer run phpcs
```

All must be clean / 0 errors.

- [ ] **Step 2: Live smoke — settings page**

1. Log in at `http://localhost/block-collapser/wp-admin/`
2. Navigate to `Settings → Block Collapser`
3. Verify all 4 tabs render: General, Behaviour, Block Rules, Appearance
4. Change Accent color to a distinctive color (e.g. red `#cc0000`)
5. Click Save changes — verify success Notice appears
6. Reload the settings page — verify the new color persists
7. Open the Post Editor for post #1 — verify the collapsed-bar border-left is now red ✓
8. Toggle Off "Show content preview in collapsed bar" — save — reopen editor — verify previews disappear
9. Toggle Off "Enable Block Collapser" — save — reopen editor — verify no chevrons render
10. Re-enable, switch Auto-collapse to "Collapse all top-level blocks", save, open a fresh editor session — verify all top-level blocks load collapsed

Screenshot: `phase5-settings-page.png` and `phase5-accent-applied.png`.

- [ ] **Step 3: Live smoke — REST round trip**

In DevTools → Network → filter "settings":
- On settings page load, see GET `/wp-json/wp/v2/settings` with `block_collapser_options` in response
- On Save click, see POST `/wp-json/wp/v2/settings` with `block_collapser_options` payload, then a refreshed GET (or response body) reflecting the save

- [ ] **Step 4: Live smoke — sanitize defense**

Open DevTools console on the settings page and try to inject invalid data:

```js
window.wp.apiFetch({
    path: '/wp/v2/settings',
    method: 'POST',
    data: {
        block_collapser_options: {
            enabled: 'not-a-bool',
            autoCollapseOnLoad: 'lol',
            accentColor: 'javascript:alert(1)',
            extraField: 'should-be-stripped',
        }
    }
}).then(r => console.log(r.block_collapser_options));
```

Expected response shows: `enabled: true` (default), `autoCollapseOnLoad: 'never'` (default), `accentColor: '#1d9e75'` (default), no `extraField`. PHP sanitize is the security boundary, JS getSettings is the safety net.

- [ ] **Step 5: Update roadmap**

Mark Phase 5 Complete ✓ with link to this plan in `docs/superpowers/plans/2026-06-02-roadmap.md`.

```
git add docs/superpowers/plans/2026-06-02-roadmap.md docs/superpowers/plans/2026-06-02-phase-5-settings.md
git commit -m "docs: mark Phase 5 complete in roadmap"
```

---

## Self-review for Phase 5

- [x] All 4 PRD §5 tabs present (General, Behaviour, Block Rules, Appearance)
- [x] `register_setting` with `show_in_rest` + sanitize callback (cross-cutting #1 for settings storage)
- [x] No telemetry, no remote sync — settings are local options only (#11)
- [x] All user-facing strings i18n via `__` (JS) and `esc_html__` (PHP) (#12)
- [x] Sanitize callback rejects unknown fields, validates colors via regex, validates modes via `in_array` (security boundary)
- [x] JS getter validates the same fields again (defense in depth — protects editor against tampered window.blockCollapserSettings)
- [x] Settings shape future-proofed (`additionalProperties: false` in schema rejects unknown keys at REST layer)
- [x] Each phase task ships working software incrementally; the final task wires editor consumption
- [x] No editor-side REST round trip — settings are localized synchronously into the editor bundle, removing race conditions

---

## What Phase 5 does NOT do (deferred)

- **Per-user settings** — out of v1 scope; site-wide options only
- **Block rules tab listing ALL installed block types dynamically** — curated list of 12 common types; full registry would need lazy-loading UX for sites with many custom blocks (defer to v2)
- **Bar background opacity slider** — out of v1
- **Shortcut customization** — read-only display in Behaviour tab; full custom-shortcut UI is a Phase 6+ thought
- **Animation toggle** — OS-level `prefers-reduced-motion` is the source of truth; no plugin override
- **Settings migration logic** — schema is at "v1" via the locked options shape; no migration plumbing yet (added in v2 if schema changes)
- **Import/export of settings** — out of v1
- **Multisite-network-level settings** — single-site only for v1; multisite gets per-site options like every other plugin without network UI
