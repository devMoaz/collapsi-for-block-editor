# Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a clean, lint-passing, CI-backed WordPress plugin shell that activates without errors and is ready for the core HOC mechanism in Phase 1.

**Architecture:** PHP bootstrap (`block-collapser.php`) registers a singleton `Plugin` class that wires hooks. Asset enqueue uses `enqueue_block_editor_assets` (iframe-safe). Build is `@wordpress/scripts` with two webpack entries (`editor`, `settings`). PHPStan + WPCS gate PHP quality; ESLint + Prettier gate JS quality. GitHub Actions runs every gate on push/PR.

**Tech Stack:** PHP 7.4+ · WordPress 6.5+ · `@wordpress/scripts` 30.x · Node 20 LTS · Composer 2 · PHPStan 1.x + `szepeviktor/phpstan-wordpress` · `wp-coding-standards/wpcs` · `@wordpress/eslint-plugin`.

**Working directory throughout this plan:** `E:\projects\block-collapser\wp-content\plugins\block-collapser\`

---

## Pre-flight checks

- [ ] **Step P1: Confirm Node 20+ and npm are installed**

Run:
```bash
node --version
npm --version
```
Expected: Node `v20.x.x` or higher (the existing v22.13.0 in this environment is fine), npm `10.x.x` or higher.

- [ ] **Step P2: Confirm Composer 2 is installed**

Run:
```bash
composer --version
```
Expected: `Composer version 2.x.x`. If missing, install from https://getcomposer.org/download/.

- [ ] **Step P3: Confirm PHP 7.4+ available**

Run:
```bash
php --version
```
Expected: `PHP 7.4.x` or higher. If your local WP install bundles its own PHP, ensure your shell PHP matches it.

- [ ] **Step P4: Confirm git is initialised at the plugin directory**

The plugin directory IS the git repo. Run:
```bash
cd "E:/projects/block-collapser/wp-content/plugins/block-collapser"
git init -b main
git config core.autocrlf input
```
Expected: `Initialized empty Git repository in E:/projects/block-collapser/wp-content/plugins/block-collapser/.git/`.

- [ ] **Step P5: Commit the empty repo to anchor history**

Run:
```bash
git commit --allow-empty -m "chore: initial commit"
```
Expected: `[main (root-commit) ...] chore: initial commit`.

---

## Task 1 — Plugin bootstrap and main class

**Files:**
- Create: `block-collapser.php`
- Create: `includes/class-plugin.php`
- Create: `uninstall.php`
- Create: `LICENSE`

- [ ] **Step 1.1: Write the main plugin file `block-collapser.php`**

```php
<?php
/**
 * Plugin Name:       Block Collapser
 * Plugin URI:        https://github.com/moazmahmoud/block-collapser
 * Description:       Collapse any block in the Gutenberg editor canvas — native, ACF, or custom. Editor-only, zero frontend impact.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Moaz Mahmoud
 * Author URI:        https://moazmahmoud.dev
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       block-collapser
 * Domain Path:       /languages
 *
 * @package BlockCollapser
 */

declare( strict_types=1 );

defined( 'ABSPATH' ) || exit;

define( 'BLOCK_COLLAPSER_VERSION', '1.0.0' );
define( 'BLOCK_COLLAPSER_FILE', __FILE__ );
define( 'BLOCK_COLLAPSER_DIR', plugin_dir_path( __FILE__ ) );
define( 'BLOCK_COLLAPSER_URL', plugin_dir_url( __FILE__ ) );

require_once BLOCK_COLLAPSER_DIR . 'includes/class-plugin.php';

add_action(
	'plugins_loaded',
	static function (): void {
		\BlockCollapser\Plugin::instance()->boot();
	}
);
```

- [ ] **Step 1.2: Write `includes/class-plugin.php`**

```php
<?php
/**
 * Main plugin orchestrator.
 *
 * @package BlockCollapser
 */

declare( strict_types=1 );

namespace BlockCollapser;

defined( 'ABSPATH' ) || exit;

/**
 * Singleton orchestrator. Boots subsystems on plugins_loaded.
 */
final class Plugin {

	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static ?Plugin $instance = null;

	/**
	 * Whether boot() has already run.
	 *
	 * @var bool
	 */
	private bool $booted = false;

	/**
	 * Disallow direct construction.
	 */
	private function __construct() {}

	/**
	 * Get or create the singleton.
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Wire hooks. Idempotent.
	 */
	public function boot(): void {
		if ( $this->booted ) {
			return;
		}
		$this->booted = true;

		add_action( 'init', array( $this, 'load_textdomain' ) );
	}

	/**
	 * Load plugin translations.
	 */
	public function load_textdomain(): void {
		load_plugin_textdomain(
			'block-collapser',
			false,
			dirname( plugin_basename( BLOCK_COLLAPSER_FILE ) ) . '/languages'
		);
	}
}
```

- [ ] **Step 1.3: Write `uninstall.php`**

```php
<?php
/**
 * Uninstall handler. Cleans plugin options.
 *
 * @package BlockCollapser
 */

declare( strict_types=1 );

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'block_collapser_settings' );
delete_site_option( 'block_collapser_settings' );
```

- [ ] **Step 1.4: Write `LICENSE` (GPL-2.0+ short header — full text is at gnu.org)**

```
Block Collapser — Collapse any block in the Gutenberg editor canvas.
Copyright (C) 2026  Moaz Mahmoud

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
```

- [ ] **Step 1.5: Activate the plugin manually in the local WP install and verify no PHP errors**

Open your local WordPress admin → Plugins → activate "Block Collapser". Expected: plugin appears in the list with the description "Collapse any block in the Gutenberg editor canvas — native, ACF, or custom. Editor-only, zero frontend impact.", activates without PHP notices/warnings, and admin pages continue to load normally.

If `WP_DEBUG` is off, enable it in `wp-config.php` (`define( 'WP_DEBUG', true ); define( 'WP_DEBUG_LOG', true );`) and re-check the debug log at `wp-content/debug.log` for any output. Expected: no Block Collapser entries.

- [ ] **Step 1.6: Commit**

```bash
git add block-collapser.php includes/class-plugin.php uninstall.php LICENSE
git commit -m "feat: scaffold plugin bootstrap with singleton Plugin class"
```

---

## Task 2 — Composer + PHP tooling (PHPStan, PHPCS)

**Files:**
- Create: `composer.json`
- Create: `phpstan.neon`
- Create: `phpcs.xml.dist`

- [ ] **Step 2.1: Write `composer.json`**

```json
{
  "name": "moazmahmoud/block-collapser",
  "description": "Collapse any block in the Gutenberg editor canvas.",
  "type": "wordpress-plugin",
  "license": "GPL-2.0-or-later",
  "require": {
    "php": ">=7.4"
  },
  "require-dev": {
    "phpstan/phpstan": "^1.11",
    "szepeviktor/phpstan-wordpress": "^1.3",
    "wp-coding-standards/wpcs": "^3.1",
    "dealerdirect/phpcodesniffer-composer-installer": "^1.0",
    "phpcompatibility/phpcompatibility-wp": "^2.1"
  },
  "config": {
    "allow-plugins": {
      "dealerdirect/phpcodesniffer-composer-installer": true
    },
    "sort-packages": true
  },
  "autoload": {
    "psr-4": {
      "BlockCollapser\\": "includes/"
    },
    "classmap": []
  },
  "scripts": {
    "phpstan": "phpstan analyse --memory-limit=512M",
    "phpcs": "phpcs",
    "phpcbf": "phpcbf"
  }
}
```

> **Note on PSR-4:** Current file names use `class-*.php` (WP convention). PSR-4 wants `Plugin.php`. We resolve this in Task 9 by using a classmap autoloader entry; for now leave PSR-4 declared so Composer is happy and we'll override per-file via classmap.

- [ ] **Step 2.2: Run `composer install`**

```bash
composer install
```
Expected: `Generating autoload files` at the end, no errors. Creates `vendor/` and `composer.lock`.

- [ ] **Step 2.3: Write `phpstan.neon`**

```neon
parameters:
    level: 8
    paths:
        - block-collapser.php
        - includes
        - uninstall.php
    excludePaths:
        - vendor
        - node_modules
        - build
    bootstrapFiles:
        - vendor/szepeviktor/phpstan-wordpress/bootstrap.php

includes:
    - vendor/szepeviktor/phpstan-wordpress/extension.neon
```

- [ ] **Step 2.4: Run PHPStan to verify clean baseline**

```bash
composer run phpstan
```
Expected: `[OK] No errors`. If PSR-4 autoload errors appear (because `class-plugin.php` doesn't match `Plugin.php`), fix by adding the file to a classmap — see Step 2.7.

- [ ] **Step 2.5: Write `phpcs.xml.dist`**

```xml
<?xml version="1.0"?>
<ruleset name="Block Collapser">
    <description>Coding standards for Block Collapser.</description>

    <file>block-collapser.php</file>
    <file>includes</file>
    <file>uninstall.php</file>

    <exclude-pattern>*/vendor/*</exclude-pattern>
    <exclude-pattern>*/node_modules/*</exclude-pattern>
    <exclude-pattern>*/build/*</exclude-pattern>

    <arg name="basepath" value="."/>
    <arg name="colors"/>
    <arg name="extensions" value="php"/>
    <arg value="ps"/>

    <config name="testVersion" value="7.4-"/>
    <config name="minimum_supported_wp_version" value="6.5"/>

    <rule ref="WordPress">
        <exclude name="WordPress.Files.FileName"/>
    </rule>
    <rule ref="WordPress-Extra"/>
    <rule ref="PHPCompatibilityWP"/>

    <rule ref="WordPress.WP.I18n">
        <properties>
            <property name="text_domain" type="array">
                <element value="block-collapser"/>
            </property>
        </properties>
    </rule>
</ruleset>
```

- [ ] **Step 2.6: Run PHPCS**

```bash
composer run phpcs
```
Expected: zero violations. If file-naming sniff fires despite the exclude, suppress per-file with the inline annotation. Run `composer run phpcbf` first to auto-fix anything fixable, then re-run `phpcs`.

- [ ] **Step 2.7: If Composer autoload warnings about `class-plugin.php` appear, switch to classmap**

Edit `composer.json` autoload block to:
```json
"autoload": {
  "classmap": ["includes/"]
}
```
Then re-run:
```bash
composer dump-autoload
composer run phpstan
```
Expected: PHPStan finds the `BlockCollapser\Plugin` class, no autoload warnings.

- [ ] **Step 2.8: Commit**

```bash
git add composer.json composer.lock phpstan.neon phpcs.xml.dist
git commit -m "build: add composer, phpstan level 8, wpcs ruleset"
```

---

## Task 3 — npm + @wordpress/scripts + ESLint + Prettier

**Files:**
- Create: `package.json`
- Create: `.nvmrc`
- Create: `.eslintrc.json`
- Create: `.prettierrc.json`
- Create: `webpack.config.js`
- Create: `src/editor/index.js`
- Create: `src/settings/index.js`

- [ ] **Step 3.1: Write `.nvmrc`**

```
20
```

- [ ] **Step 3.2: Write `package.json`**

```json
{
  "name": "block-collapser",
  "version": "1.0.0",
  "private": true,
  "description": "Collapse any block in the Gutenberg editor canvas.",
  "author": "Moaz Mahmoud",
  "license": "GPL-2.0-or-later",
  "scripts": {
    "build": "wp-scripts build",
    "start": "wp-scripts start",
    "format": "wp-scripts format",
    "lint:js": "wp-scripts lint-js",
    "lint:css": "wp-scripts lint-style",
    "lint:pkg-json": "wp-scripts lint-pkg-json",
    "test": "wp-scripts test-unit-js",
    "test:e2e": "wp-scripts test-playwright",
    "packages-update": "wp-scripts packages-update",
    "makepot": "wp i18n make-pot . languages/block-collapser.pot --slug=block-collapser"
  },
  "devDependencies": {
    "@wordpress/eslint-plugin": "^21.0.0",
    "@wordpress/prettier-config": "^4.0.0",
    "@wordpress/scripts": "^30.0.0",
    "@wordpress/stylelint-config": "^23.0.0"
  },
  "dependencies": {
    "@wordpress/api-fetch": "^7.0.0",
    "@wordpress/components": "^29.0.0",
    "@wordpress/compose": "^7.0.0",
    "@wordpress/data": "^10.0.0",
    "@wordpress/element": "^6.0.0",
    "@wordpress/hooks": "^4.0.0",
    "@wordpress/i18n": "^5.0.0",
    "@wordpress/icons": "^10.0.0",
    "@wordpress/keyboard-shortcuts": "^5.0.0",
    "@wordpress/plugins": "^7.0.0"
  }
}
```

- [ ] **Step 3.3: Run `npm install`**

```bash
npm install
```
Expected: completes with no errors (some warnings about peer deps are fine). Creates `node_modules/` and `package-lock.json`.

- [ ] **Step 3.4: Write `.eslintrc.json`**

```json
{
  "extends": ["plugin:@wordpress/eslint-plugin/recommended"],
  "root": true,
  "env": {
    "browser": true,
    "es2022": true
  },
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "import/no-unresolved": [
      "error",
      { "ignore": ["^@wordpress/"] }
    ]
  }
}
```

- [ ] **Step 3.5: Write `.prettierrc.json`**

```json
"@wordpress/prettier-config"
```

- [ ] **Step 3.6: Write `webpack.config.js` with two entries**

```js
/**
 * Webpack config. Extends @wordpress/scripts default to expose two entries:
 * - editor: loaded on edit-post / edit-site screens
 * - settings: loaded on the Settings > Block Collapser admin page
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		editor: path.resolve( __dirname, 'src/editor/index.js' ),
		settings: path.resolve( __dirname, 'src/settings/index.js' ),
	},
};
```

- [ ] **Step 3.7: Write a minimal `src/editor/index.js` placeholder**

```js
/**
 * Editor entry. Phase 0 is a no-op smoke test; Phase 1 wires the HOC filter.
 */

// eslint-disable-next-line no-console
console.info( '[block-collapser] editor entry loaded' );
```

- [ ] **Step 3.8: Write a minimal `src/settings/index.js` placeholder**

```js
/**
 * Settings page entry. Phase 0 is a no-op; Phase 5 mounts the React app.
 */

// eslint-disable-next-line no-console
console.info( '[block-collapser] settings entry loaded' );
```

- [ ] **Step 3.9: Run the build**

```bash
npm run build
```
Expected: webpack reports two outputs in `build/` — `editor.js`, `editor.asset.php`, `settings.js`, `settings.asset.php`. Zero errors, zero warnings (deprecation warnings from upstream packages are acceptable but note them).

- [ ] **Step 3.10: Run lint to verify zero violations**

```bash
npm run lint:js
```
Expected: no output (clean). If `import/no-unresolved` complains about `@wordpress/*` modules, the rule exception in `.eslintrc.json` should silence them; otherwise verify the rule block is correct.

- [ ] **Step 3.11: Commit**

```bash
git add package.json package-lock.json .nvmrc .eslintrc.json .prettierrc.json webpack.config.js src/editor/index.js src/settings/index.js
git commit -m "build: add @wordpress/scripts with editor and settings entries"
```

---

## Task 4 — Asset enqueue (iframe-safe editor injection)

**Files:**
- Create: `includes/class-assets.php`
- Modify: `includes/class-plugin.php`
- Test: `tests/php/AssetsTest.php` (deferred — actual PHPUnit harness wired in Phase 6; placeholder file written here)

- [ ] **Step 4.1: Write `includes/class-assets.php`**

```php
<?php
/**
 * Asset enqueue. Uses enqueue_block_editor_assets so styles reach the iframed editor.
 *
 * @package BlockCollapser
 */

declare( strict_types=1 );

namespace BlockCollapser;

defined( 'ABSPATH' ) || exit;

/**
 * Enqueues editor JS/CSS.
 */
final class Assets {

	private const HANDLE = 'block-collapser-editor';

	/**
	 * Register hooks.
	 */
	public function register(): void {
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor' ) );
	}

	/**
	 * Enqueue the editor bundle. Loaded in both Post Editor and Site Editor.
	 */
	public function enqueue_editor(): void {
		$asset_file = BLOCK_COLLAPSER_DIR . 'build/editor.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		/**
		 * Asset metadata from @wordpress/scripts.
		 *
		 * @var array{dependencies: string[], version: string} $asset
		 */
		$asset = require $asset_file;

		wp_enqueue_script(
			self::HANDLE,
			BLOCK_COLLAPSER_URL . 'build/editor.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( self::HANDLE, 'block-collapser' );
	}
}
```

- [ ] **Step 4.2: Modify `includes/class-plugin.php` to register Assets**

Replace the `boot()` method body so it instantiates and registers `Assets`. After:

```php
public function boot(): void {
	if ( $this->booted ) {
		return;
	}
	$this->booted = true;

	add_action( 'init', array( $this, 'load_textdomain' ) );

	( new Assets() )->register();
}
```

- [ ] **Step 4.3: Rebuild and verify the editor entry loads in the actual editor**

```bash
npm run build
```
Then in your browser: open any post in the WP block editor, open DevTools → Console. Expected: `[block-collapser] editor entry loaded` appears.

Open the Site Editor (`Appearance → Editor` if your theme is FSE-ready). Expected: same console message appears (confirms iframe injection works).

- [ ] **Step 4.4: Confirm the script does NOT load on the frontend**

Open any frontend page (not the editor). View source → search for `block-collapser`. Expected: zero matches.

- [ ] **Step 4.5: Re-run PHPStan and PHPCS**

```bash
composer run phpstan
composer run phpcs
```
Expected: both pass with zero issues.

- [ ] **Step 4.6: Commit**

```bash
git add includes/class-assets.php includes/class-plugin.php
git commit -m "feat: enqueue editor bundle via enqueue_block_editor_assets"
```

---

## Task 5 — Settings admin page stub

**Files:**
- Create: `includes/class-admin-page.php`
- Modify: `includes/class-plugin.php`

- [ ] **Step 5.1: Write `includes/class-admin-page.php`**

```php
<?php
/**
 * Adds Settings > Block Collapser admin page. Phase 0 renders an empty container.
 *
 * @package BlockCollapser
 */

declare( strict_types=1 );

namespace BlockCollapser;

defined( 'ABSPATH' ) || exit;

/**
 * Settings page registration + asset enqueue for the settings React app.
 */
final class Admin_Page {

	public const SLUG   = 'block-collapser';
	private const HANDLE = 'block-collapser-settings';

	/**
	 * Register hooks.
	 */
	public function register(): void {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'maybe_enqueue' ) );
	}

	/**
	 * Add the Settings > Block Collapser entry.
	 */
	public function add_menu_page(): void {
		add_options_page(
			__( 'Block Collapser', 'block-collapser' ),
			__( 'Block Collapser', 'block-collapser' ),
			'manage_options',
			self::SLUG,
			array( $this, 'render_page' )
		);
	}

	/**
	 * Render the page container. The React app mounts inside #block-collapser-settings-root.
	 */
	public function render_page(): void {
		echo '<div class="wrap"><div id="block-collapser-settings-root"></div></div>';
	}

	/**
	 * Enqueue the settings bundle only on our page.
	 *
	 * @param string $hook_suffix Admin page hook suffix.
	 */
	public function maybe_enqueue( string $hook_suffix ): void {
		if ( 'settings_page_' . self::SLUG !== $hook_suffix ) {
			return;
		}

		$asset_file = BLOCK_COLLAPSER_DIR . 'build/settings.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		/**
		 * Asset metadata.
		 *
		 * @var array{dependencies: string[], version: string} $asset
		 */
		$asset = require $asset_file;

		wp_enqueue_script(
			self::HANDLE,
			BLOCK_COLLAPSER_URL . 'build/settings.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( self::HANDLE, 'block-collapser' );
	}
}
```

- [ ] **Step 5.2: Wire `Admin_Page` into `Plugin::boot()`**

In `includes/class-plugin.php`, append after the `Assets` registration:
```php
		( new Admin_Page() )->register();
```

- [ ] **Step 5.3: Verify the menu appears**

Reload `wp-admin`. Expected: `Settings → Block Collapser` appears in the sidebar. Click it → page loads, title bar shows "Block Collapser", body contains the empty `#block-collapser-settings-root` div. Open DevTools Console: `[block-collapser] settings entry loaded` appears. On any other admin page: settings bundle does NOT load (verify via Network tab — no `settings.js` request).

- [ ] **Step 5.4: Re-run PHPStan and PHPCS**

```bash
composer run phpstan
composer run phpcs
```
Expected: both pass.

- [ ] **Step 5.5: Commit**

```bash
git add includes/class-admin-page.php includes/class-plugin.php
git commit -m "feat: add Settings > Block Collapser admin page stub"
```

---

## Task 6 — `readme.txt` skeleton for WordPress.org

**Files:**
- Create: `readme.txt`

- [ ] **Step 6.1: Write `readme.txt`**

```
=== Block Collapser ===
Contributors: moazmahmoud
Tags: gutenberg, editor, blocks, productivity, ux
Requires at least: 6.5
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Collapse any block in the Gutenberg editor canvas — native, ACF, or custom. Editor-only. Zero impact on your live site.

== Description ==

Modern WordPress pages built with Gutenberg can stack 15-30+ blocks, and a single Cover or ACF block can fill an entire viewport. Block Collapser adds a collapse toggle to every block in the editor canvas so you can keep your editing focused on the section you are working on.

**What it does:**

* Adds a chevron toggle on hover to every block in the editor
* Collapses a block to a compact label bar showing block icon, type, and preview text
* Works with every block out of the box — core, ACF, custom
* Persists collapse state per page, so the editor remembers where you left off
* Collapse All / Expand All / Focus Mode from a single sidebar panel
* Customisable settings: animation speed, bar height, auto-collapse rules per block type, colors, dark mode

**Editor-only by design:**

Block Collapser never touches block attributes, post content, or the live frontend. Deactivate the plugin and nothing changes anywhere on your site. There is no telemetry, no phone-home, and no external requests of any kind.

**Works everywhere Gutenberg works:**

Block Editor (Post / Page), Site Editor (FSE templates), and any custom post type that uses the block editor. Compatible with the Gutenberg plugin enabled or disabled.

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/block-collapser/`, or install via the Plugins screen.
2. Activate the plugin.
3. Open any post in the editor — hover any block to see the collapse chevron in the top-left corner.
4. Visit Settings → Block Collapser to customise behaviour.

== Frequently Asked Questions ==

= Does it work with ACF blocks? =

Yes. Any block registered via `acf_register_block_type` or `register_block_type` is detected automatically.

= Does it work in the Site Editor? =

Yes. The same toggle and persistence works in `Appearance → Editor` for FSE themes.

= Does it work in Classic Editor or Elementor? =

No. Block Collapser is a Gutenberg-only plugin.

= Will it slow down my editor? =

No. The plugin uses the official Gutenberg filter API with a memoised wrapper. There is no impact on page render time or build size of your site.

== Screenshots ==

1. Block hovered — collapse chevron appears in top-left
2. Block collapsed — compact 40px label bar with icon, type, and preview
3. Sidebar panel with Collapse All / Expand All / Focus Mode
4. Settings page — General tab
5. Settings page — Block Rules tab with per-block-type defaults

== Changelog ==

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.0 =
First release.
```

- [ ] **Step 6.2: Commit**

```bash
git add readme.txt
git commit -m "docs: add WordPress.org readme.txt"
```

---

## Task 7 — `.gitignore`, `.gitattributes`, `.editorconfig`

**Files:**
- Create: `.gitignore`
- Create: `.gitattributes`
- Create: `.editorconfig`

- [ ] **Step 7.1: Write `.gitignore`**

```
# Dependencies
/node_modules
/vendor

# Build output (gitignored — built by CI for releases)
/build
/languages/*.json

# Editor / OS noise
.DS_Store
Thumbs.db
.idea/
.vscode/

# Test artifacts
/coverage
/.phpunit.cache
/phpunit.xml
/test-results
/playwright-report

# Local config
.env
.env.local
```

- [ ] **Step 7.2: Write `.gitattributes` (for wp.org SVN releases — excludes dev files from the shipped zip)**

```
/.editorconfig         export-ignore
/.eslintrc.json        export-ignore
/.gitattributes        export-ignore
/.github               export-ignore
/.gitignore            export-ignore
/.nvmrc                export-ignore
/.prettierrc.json      export-ignore
/composer.json         export-ignore
/composer.lock         export-ignore
/docs                  export-ignore
/node_modules          export-ignore
/package.json          export-ignore
/package-lock.json     export-ignore
/phpcs.xml.dist        export-ignore
/phpstan.neon          export-ignore
/src                   export-ignore
/tests                 export-ignore
/vendor                export-ignore
/webpack.config.js     export-ignore
/_playground           export-ignore
```

- [ ] **Step 7.3: Write `.editorconfig`**

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = tab
indent_size = 4
insert_final_newline = true
trim_trailing_whitespace = true

[*.{json,yml,yaml,md}]
indent_style = space
indent_size = 2

[*.js]
indent_style = tab
```

- [ ] **Step 7.4: Commit**

```bash
git add .gitignore .gitattributes .editorconfig
git commit -m "build: add gitignore, gitattributes, editorconfig"
```

---

## Task 8 — GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 8.1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  php:
    name: PHP (lint + static analysis)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '7.4'
          tools: composer:v2
          coverage: none

      - name: Get composer cache directory
        id: composer-cache
        run: echo "dir=$(composer config cache-files-dir)" >> "$GITHUB_OUTPUT"

      - name: Cache composer
        uses: actions/cache@v4
        with:
          path: ${{ steps.composer-cache.outputs.dir }}
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - name: Install dependencies
        run: composer install --no-progress --no-interaction --prefer-dist

      - name: Run PHPCS
        run: composer run phpcs

      - name: Run PHPStan
        run: composer run phpstan

  js:
    name: JS (lint + build)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint JS
        run: npm run lint:js

      - name: Build
        run: npm run build
```

- [ ] **Step 8.2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions for PHP + JS gates"
```

---

## Task 9 — Playground blueprint stub

**Files:**
- Create: `_playground/blueprint.json`

- [ ] **Step 9.1: Write `_playground/blueprint.json`**

```json
{
  "$schema": "https://playground.wordpress.net/blueprint-schema.json",
  "landingPage": "/wp-admin/post-new.php?post_type=post",
  "preferredVersions": {
    "php": "8.2",
    "wp": "latest"
  },
  "features": {
    "networking": false
  },
  "steps": [
    {
      "step": "login",
      "username": "admin",
      "password": "password"
    },
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "url",
        "url": "https://downloads.wordpress.org/plugin/block-collapser.zip"
      },
      "options": {
        "activate": true
      }
    }
  ]
}
```

> **Note:** The `url` resource above is the final wp.org download URL once the plugin is published. For pre-launch local testing of the blueprint, swap to a `wordpress-org/plugins` git checkout reference or a hosted zip on GitHub Releases — Phase 7 finalises this.

- [ ] **Step 9.2: Commit**

```bash
git add _playground/blueprint.json
git commit -m "docs: add Playground blueprint stub for demo"
```

---

## Task 10 — Phase 0 verification (the gate)

This task runs the full verification protocol from the roadmap's "Verification gates between phases" section. Every check must pass before Phase 0 is considered complete.

- [ ] **Step 10.1: Clean build verification**

```bash
rm -rf build/
npm run build
```
Expected: `build/editor.js`, `build/editor.asset.php`, `build/settings.js`, `build/settings.asset.php` exist. No webpack errors.

- [ ] **Step 10.2: JS lint clean**

```bash
npm run lint:js
```
Expected: exit code 0, no output.

- [ ] **Step 10.3: PHPStan clean at level 8**

```bash
composer run phpstan
```
Expected: `[OK] No errors`.

- [ ] **Step 10.4: PHPCS clean**

```bash
composer run phpcs
```
Expected: zero violations.

- [ ] **Step 10.5: Manual activation smoke test**

In the live local WP install:

1. Deactivate then re-activate "Block Collapser" via the plugin list.
2. Check `wp-content/debug.log` (with `WP_DEBUG` and `WP_DEBUG_LOG` on) — confirm no entries from this plugin.
3. Open `Settings → Block Collapser` — page loads with empty container div and the settings entry logs to console.
4. Open a post in the editor — editor entry logs to console; no PHP notices in the page; no JS console errors.
5. Open the Site Editor (`Appearance → Editor`) on an FSE theme — editor entry logs to console.
6. View any frontend page — confirm zero `block-collapser` references in the network panel and view-source.
7. Deactivate the plugin → confirm no fatal errors; admin and frontend continue to function.

- [ ] **Step 10.6: Repo integrity check**

```bash
git status
```
Expected: `nothing to commit, working tree clean`.

```bash
git log --oneline
```
Expected: at minimum these commits (in order):
```
ci: add GitHub Actions for PHP + JS gates
docs: add Playground blueprint stub for demo
build: add gitignore, gitattributes, editorconfig
docs: add WordPress.org readme.txt
feat: add Settings > Block Collapser admin page stub
feat: enqueue editor bundle via enqueue_block_editor_assets
build: add @wordpress/scripts with editor and settings entries
build: add composer, phpstan level 8, wpcs ruleset
feat: scaffold plugin bootstrap with singleton Plugin class
chore: initial commit
```

- [ ] **Step 10.7: Update roadmap to mark Phase 0 complete**

Edit `docs/superpowers/plans/2026-06-02-roadmap.md` — change Phase 0 row's Status from "Ready" to "Complete ✓".

- [ ] **Step 10.8: Final commit**

```bash
git add docs/superpowers/plans/2026-06-02-roadmap.md
git commit -m "docs: mark phase 0 complete in roadmap"
```

---

## Self-review against PRD coverage

- [x] **PRD §1 (Overview):** plugin headers correctly state "editor-only", "no frontend impact" — see Task 1.1 description field
- [x] **PRD §6.2 file structure:** every Phase-0-applicable file matches the roadmap's "File structure overview" — see Tasks 1-5
- [x] **PRD §7 (Compatibility):** WP 6.5+ and PHP 7.4+ enforced in plugin headers and `phpcs.xml.dist` `testVersion` — see Tasks 1.1, 2.5
- [x] **PRD §8 (Scope Boundaries):** "Does not affect the live frontend" — enforced architecturally by `enqueue_block_editor_assets` choice; verified in Step 4.4
- [x] **Cross-cutting decision #4 (CSS injection):** uses `enqueue_block_editor_assets` — Task 4.1
- [x] **Cross-cutting decision #11 (no telemetry):** stated in `readme.txt` Description — Task 6.1
- [x] **Cross-cutting decision #12 (i18n):** `Text Domain` header set, `load_plugin_textdomain` registered, `wp_set_script_translations` called for both bundles — Tasks 1.1, 1.2, 4.1, 5.1
- [x] **All Phase-0 verification gates pass before handoff** — Task 10

## Placeholder scan

- [x] No "TBD", "TODO", "implement later" in any step
- [x] Every code block is complete and runnable
- [x] Every command shows expected output
- [x] Every file path is exact and absolute-from-plugin-root

## Type / name consistency

- [x] Singleton method `Plugin::instance()` referenced consistently (Steps 1.1 → 1.2 → 4.2 → 5.2)
- [x] Asset handle `block-collapser-editor` matches between class constant (4.1) and translations call (4.1)
- [x] Admin page slug `block-collapser` matches between menu registration (5.1) and `maybe_enqueue` hook check (5.1)
- [x] Constants `BLOCK_COLLAPSER_FILE/DIR/URL/VERSION` defined once in 1.1, used in 1.2, 4.1, 5.1

---

## Phase 0 completion deliverable

A clean WordPress plugin shell at `E:\projects\block-collapser\wp-content\plugins\block-collapser\` that:

- activates and deactivates cleanly with zero PHP notices
- ships two separately-enqueued JS entries (editor + settings) that load only where appropriate
- has a `Settings → Block Collapser` admin page stub ready for the Phase 5 React app
- passes PHPStan level 8, PHPCS (WPCS + WP-Extra + PHPCompatibilityWP), ESLint
- has CI green on every push
- has a `readme.txt` ready for wp.org and a Playground `blueprint.json` ready for the launch demo

After Phase 0 verification passes, return to the user for sign-off, then write the Phase 1 plan (Core HOC + toggle button) and proceed.
