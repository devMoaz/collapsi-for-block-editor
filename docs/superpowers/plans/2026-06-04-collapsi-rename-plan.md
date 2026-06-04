# Collapsi for Gutenberg Blocks — Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the wp.org-pending plugin from "Block Collapser" / `block-collapser` to "Collapsi for Gutenberg Blocks" / `collapsi-for-gutenberg`, addressing the AUTOPREREVIEW feedback (generic name, generic prefix, contributors mismatch) so the resubmission passes review.

**Architecture:** Pure identifier rename — no logic changes. Mechanical search-replace across PHP/JS/SCSS/config, then six verification gates, then build/package. No tests change behavior because behavior doesn't change.

**Tech Stack:** PHP 7.4+, WordPress 6.5+, `@wordpress/scripts` (webpack 5), Jest, PHPCS (WPCS 3.x), PHPStan level 8, PowerShell on Windows.

**Important environment notes:**

- The plugin root is `E:\projects\block-collapser\wp-content\plugins\block-collapser\`. After Task 9 it becomes `...\collapsi-for-gutenberg\`. All paths below are RELATIVE to whichever name is current.
- This project is NOT a git repository — `git commit` steps do not apply. Instead of commits, each task ends with running the relevant verification gate. Replace any reflex to `git add && git commit` with running the gates.
- "Tests" in this rename context = the existing test suite passing after the rename. We are not adding new behavior, so we are not writing new tests. The verification gates collectively prove the rename is correct.

**Design spec:** `docs/superpowers/specs/2026-06-04-collapsi-rename-design.md`

---

## Task 1: Rename PHP namespace, constants, option keys, text domain

**Files:**
- Modify: `block-collapser.php` (bootstrap header + 4 constants)
- Modify: `includes/class-plugin.php` (namespace)
- Modify: `includes/class-admin-page.php` (namespace + admin slug + text domain)
- Modify: `includes/class-assets.php` (namespace + HANDLE + STYLE_HANDLE + script-translations text domain + window variable)
- Modify: `includes/class-settings.php` (namespace + OPTION_NAME + OPTION_GROUP)
- Modify: `uninstall.php` (option key + variable names)
- Modify: `tests/phpstan-bootstrap.php` (any stub references)

- [ ] **Step 1: Edit `block-collapser.php` header + constants**

Replace lines 3–18 (header block) and lines 24–32 (constants + requires) so the file reads:

```php
<?php
/**
 * Plugin Name:       Collapsi for Gutenberg Blocks
 * Plugin URI:        https://github.com/devMoaz/collapsi-for-gutenberg
 * Description:       Editor-only collapse/expand toggle for every Gutenberg block. Hover a top-level block, click the chevron, and the block tucks into a compact bar with icon, title, and content preview. Survives reloads via localStorage. Works in Post Editor and Site Editor. No frontend impact.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Tested up to:      7.0
 * Author:            Moaz Mahmoud
 * Author URI:        https://www.linkedin.com/in/moazmahmmoud/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       collapsi
 * Domain Path:       /languages
 *
 * @package Collapsi
 */

declare( strict_types=1 );

defined( 'ABSPATH' ) || exit;

define( 'COLLAPSI_VERSION', '1.0.0' );
define( 'COLLAPSI_FILE', __FILE__ );
define( 'COLLAPSI_DIR', plugin_dir_path( __FILE__ ) );
define( 'COLLAPSI_URL', plugin_dir_url( __FILE__ ) );

require_once COLLAPSI_DIR . 'includes/class-plugin.php';
require_once COLLAPSI_DIR . 'includes/class-assets.php';
require_once COLLAPSI_DIR . 'includes/class-admin-page.php';
require_once COLLAPSI_DIR . 'includes/class-settings.php';

add_action(
	'plugins_loaded',
	static function (): void {
		\Collapsi\Plugin::instance()->boot();
	}
);
```

- [ ] **Step 2: Edit `includes/class-plugin.php`**

Change `namespace BlockCollapser;` → `namespace Collapsi;`. Change `@package BlockCollapser` → `@package Collapsi`. Any inner reference to `BLOCK_COLLAPSER_DIR`/`_URL` → `COLLAPSI_DIR`/`_URL`. Any text-domain arguments `'block-collapser'` → `'collapsi'`.

- [ ] **Step 3: Edit `includes/class-admin-page.php`**

Change `namespace BlockCollapser;` → `namespace Collapsi;`. Change `@package BlockCollapser` → `@package Collapsi`. Change admin page slug arg in `add_options_page()` from `'block-collapser'` → `'collapsi'`. Change all `'block-collapser'` text-domain args to `'collapsi'`. Change any constant references.

- [ ] **Step 4: Edit `includes/class-assets.php`**

Apply these specific changes:

```php
namespace Collapsi;                         // was: BlockCollapser

use Collapsi\Settings;                       // was: BlockCollapser\Settings

public const HANDLE       = 'collapsi-editor';        // was: 'block-collapser-editor'
public const STYLE_HANDLE = 'collapsi-editor-style';  // was: 'block-collapser-editor-style'

// Replace BLOCK_COLLAPSER_DIR / BLOCK_COLLAPSER_URL everywhere with COLLAPSI_DIR / COLLAPSI_URL

wp_set_script_translations( self::HANDLE, 'collapsi' );  // was: 'block-collapser'

wp_add_inline_script(
    self::HANDLE,
    'window.collapsiSettings = ' . wp_json_encode( Settings::get() ) . ';',  // was: window.blockCollapserSettings
    'before'
);
```

Also update `@package BlockCollapser` → `@package Collapsi` in the docblock.

- [ ] **Step 5: Edit `includes/class-settings.php`**

```php
namespace Collapsi;                          // was: BlockCollapser

public const OPTION_NAME   = 'collapsi_options';   // was: 'block_collapser_options'
public const OPTION_GROUP  = 'collapsi';            // was: 'block_collapser'
```

Update `@package BlockCollapser` → `@package Collapsi`. Update class docblock comment "Owns the block_collapser_options option..." → "Owns the collapsi_options option...".

- [ ] **Step 6: Edit `uninstall.php`**

Change the option key from `'block_collapser_options'` → `'collapsi_options'`. Rename PHP variables: `$block_collapser_sites` → `$collapsi_sites`, `$block_collapser_site_id` → `$collapsi_site_id`. Update `@package BlockCollapser` → `@package Collapsi`.

- [ ] **Step 7: Edit `tests/phpstan-bootstrap.php`**

Grep for any `BlockCollapser`, `BLOCK_COLLAPSER` references in this file. Update namespace stubs to `Collapsi`. If it defines fake constants like `BLOCK_COLLAPSER_DIR` for analysis, rename them to `COLLAPSI_DIR` etc.

- [ ] **Step 8: Run PHPCS to verify PHP renames are syntactically valid and pass coding standards**

```powershell
composer run phpcs
```

Expected: exit code 0, no errors, no warnings. If any text-domain mismatch errors fire ("Text domain X expected, Y found"), check `phpcs.xml.dist` — the allowed text-domain rule needs updating in Task 4 metadata changes; until then expect a clean run because we own the rule.

- [ ] **Step 9: Run PHPStan to verify namespace + constant references resolve**

```powershell
composer run phpstan
```

Expected: exit code 0, no errors. If "constant BLOCK_COLLAPSER_X not found" or "class BlockCollapser\X not found" — there's a stale reference; grep for it and fix.

---

## Task 2: Rename JS source — text domains, storage key, sidebar name, HOC name, JS-side CSS custom props

**Files:**
- Modify: `src/editor/store/persistence.js` (STORAGE_PREFIX constant)
- Modify: `src/editor/index.js` (HOC name, registerPlugin name, CSS custom prop names)
- Modify: `src/editor/sidebar/CollapserSidebar.js` (SIDEBAR_NAME constant + text domains + CSS classes)
- Modify: `src/editor/sidebar/actions.js` (text domains + store key references in comments)
- Modify: `src/editor/components/CollapseWrapper.js` (text domains + CSS classes)
- Modify: `src/editor/components/CollapseBar.js` (text domains + CSS classes)
- Modify: `src/editor/components/CollapseButton.js` (text domains + CSS classes)
- Modify: `src/editor/components/BlockMenuEntry.js` (text domains)
- Modify: `src/editor/components/ErrorBoundary.js` (text domains + CSS classes)
- Modify: `src/editor/utils/previewText.js` (text domains)
- Modify: `src/editor/shortcuts/register.js` (text domains)
- Modify: `src/settings/index.js` (mount element ID `block-collapser-settings-root`)
- Modify: `src/settings/App.js` (text domains + CSS classes + visible "Block Collapser" string)
- Modify: `src/settings/api.js` (any references)
- Modify: `src/settings/tabs/GeneralTab.js` (text domains)
- Modify: `src/settings/tabs/BehaviourTab.js` (text domains + CSS classes)
- Modify: `src/settings/tabs/AppearanceTab.js` (text domains + CSS classes + custom props + useInstanceId prefixes)

- [ ] **Step 1: Rename `src/editor/store/persistence.js` STORAGE_PREFIX**

```js
export const STORAGE_PREFIX = 'collapsi:v1';   // was: 'block-collapser:v1'
```

Also update the docblock header (lines 2–12) comment that mentions `block-collapser:v1:<context>` to `collapsi:v1:<context>`.

- [ ] **Step 2: Rename `src/editor/index.js` identifiers**

Apply these specific renames in the file:

```js
// Around line 17 — addFilter HOC name:
'collapsi/with-collapse',        // was: 'block-collapser/with-collapse'

// Around lines 112, 116 — CSS custom property names:
'--collapsi-accent',             // was: '--block-collapser-accent'
'--collapsi-bar-text',           // was: '--block-collapser-bar-text'

// Around line 142 — registerPlugin name:
registerPlugin( 'collapsi', {    // was: 'block-collapser'
```

- [ ] **Step 3: Rename `src/editor/sidebar/CollapserSidebar.js`**

```js
const SIDEBAR_NAME = 'collapsi';                            // was: 'block-collapser'
title={ __( 'Collapsi', 'collapsi' ) }                      // was: __( 'Block Collapser', 'block-collapser' )
<div className="collapsi-sidebar">                          // was: 'block-collapser-sidebar'
<p className="collapsi-sidebar__hint">                      // was: 'block-collapser-sidebar__hint'
<div className="collapsi-sidebar__actions">                 // was: 'block-collapser-sidebar__actions'
```

Replace every `'block-collapser'` text-domain string in this file with `'collapsi'`.

- [ ] **Step 4: Bulk-rename text-domain strings across remaining `src/editor/**/*.js` files**

In each file in `src/editor/` (excluding `store/persistence.js` already done), replace every occurrence of the literal string `'block-collapser'` with `'collapsi'`. These are all `__()`, `_x()`, `_n()`, `_nx()` text-domain arguments. Run a grep first to enumerate:

```powershell
Get-ChildItem 'src\editor' -Recurse -Include *.js | Select-String -Pattern "'block-collapser'" | Select-Object Path, LineNumber, Line
```

Edit each match. Verify zero remaining:

```powershell
Get-ChildItem 'src\editor' -Recurse -Include *.js | Select-String -Pattern "'block-collapser'"
```

Expected: no output.

- [ ] **Step 5: Bulk-rename CSS class names across `src/editor/**/*.js` files**

In each file in `src/editor/`, replace every class-name string fragment `block-collapser-` with `collapsi-`. These appear in `className="..."` props. Run grep first:

```powershell
Get-ChildItem 'src\editor' -Recurse -Include *.js | Select-String -Pattern "block-collapser-"
```

Edit each match. Verify zero remaining:

```powershell
Get-ChildItem 'src\editor' -Recurse -Include *.js | Select-String -Pattern "block-collapser-"
```

Expected: no output.

- [ ] **Step 6: Rename `src/settings/index.js` mount element ID**

```js
const mount = document.getElementById( 'collapsi-settings-root' );  // was: 'block-collapser-settings-root'
```

(This mount ID is created in PHP — Task 1 Step 3 covers the `class-admin-page.php` side. Cross-verify both halves use `collapsi-settings-root`.)

- [ ] **Step 7: Rename `src/settings/App.js` strings**

In particular, the visible `<h1>{ __( 'Block Collapser', 'block-collapser' ) }</h1>` (around line 75) must become:

```jsx
<h1>{ __( 'Collapsi for Gutenberg Blocks', 'collapsi' ) }</h1>
```

Then replace every other `'block-collapser'` literal with `'collapsi'`, and every `block-collapser-` class fragment with `collapsi-`.

- [ ] **Step 8: Bulk-rename remaining `src/settings/**/*.js` files**

For every file under `src/settings/`, run the same two replacements: `'block-collapser'` → `'collapsi'`, then `block-collapser-` → `collapsi-`. In `AppearanceTab.js` specifically there are CSS custom property names:

```js
'--collapsi-accent': settings.accentColor,        // was: '--block-collapser-accent'
'--collapsi-bar-text': settings.barTextColor,     // was: '--block-collapser-bar-text'
```

And `useInstanceId( AppearanceTab, 'collapsi-accent' )` (was `'block-collapser-accent'`), `useInstanceId( AppearanceTab, 'collapsi-text' )` (was `'block-collapser-text'`).

- [ ] **Step 9: Verify zero JS hits remain**

```powershell
Get-ChildItem 'src' -Recurse -Include *.js | Select-String -Pattern "block-collapser|block_collapser|BlockCollapser|BLOCK_COLLAPSER"
```

Expected: no output. If any survives — grep is your truth source; edit accordingly.

- [ ] **Step 10: Run lint:js to verify JS is still syntactically clean**

```powershell
npm run lint:js
```

Expected: exit code 0. If "string not localized" or similar surfaces, the text-domain rename is incomplete — re-run step 4.

- [ ] **Step 11: Run Jest unit tests to verify behavior unchanged**

```powershell
npm test
```

Expected: all tests pass. If any test imports a constant/string with the old prefix, update the test:

```powershell
Get-ChildItem 'tests' -Recurse -Include *.js | Select-String -Pattern "block-collapser|block_collapser|BlockCollapser"
```

Edit the matches in the same way (text domain → `collapsi`, class fragments → `collapsi-`, namespace → `Collapsi`).

---

## Task 3: Rename SCSS source — CSS class names + custom properties + keyframes

**Files:**
- Modify: `src/editor/editor.scss` (all `.block-collapser-*` selectors, `--block-collapser-*` custom props, `@keyframes block-collapser-bar-fade-in`)
- Modify: `src/settings/settings.scss` (all `.block-collapser-*` selectors)

- [ ] **Step 1: Rename selectors and custom properties in `src/editor/editor.scss`**

Open the file. Replace every occurrence of the literal substring `block-collapser-` with `collapsi-`. This covers:

```scss
.collapsi-wrapper            /* was: .block-collapser-wrapper */
.collapsi-toggle-host        /* was: .block-collapser-toggle-host */
.collapsi-content            /* was: .block-collapser-content */
.collapsi-toggle             /* was: .block-collapser-toggle */
.collapsi-bar                /* was: .block-collapser-bar */
.collapsi-bar__icon          /* was: .block-collapser-bar__icon */
.collapsi-bar__title         /* was: .block-collapser-bar__title */
.collapsi-bar__preview       /* was: .block-collapser-bar__preview */
.collapsi-error              /* was: .block-collapser-error */
.collapsi-sidebar            /* was: .block-collapser-sidebar */

var( --collapsi-accent, #1d9e75 )           /* was: --block-collapser-accent */
var( --collapsi-bar-text, #444 )            /* was: --block-collapser-bar-text */

@keyframes collapsi-bar-fade-in { … }       /* was: block-collapser-bar-fade-in */
animation: collapsi-bar-fade-in 150ms …     /* was: block-collapser-bar-fade-in */
```

- [ ] **Step 2: Rename selectors in `src/settings/settings.scss`**

Same operation: replace `block-collapser-` substring with `collapsi-`. This covers `.block-collapser-settings`, `.block-collapser-settings__header`, `.block-collapser-settings__tabs`, `.block-collapser-settings__loading`, `.block-collapser-tab__description`, `.block-collapser-appearance__grid`, `.block-collapser-appearance__preview`, `.block-collapser-appearance__preview-bar`, `.block-collapser-appearance__preview-label`, `.block-collapser-appearance__preview-title`, `.block-collapser-appearance__preview-text`.

- [ ] **Step 3: Verify zero SCSS hits remain**

```powershell
Get-ChildItem 'src' -Recurse -Include *.scss | Select-String -Pattern "block-collapser|block_collapser"
```

Expected: no output.

- [ ] **Step 4: Run lint:css**

```powershell
npm run lint:css
```

Expected: exit code 0.

- [ ] **Step 5: Run production build to confirm SCSS compiles end-to-end**

```powershell
npm run build
```

Expected: exit code 0. Bundles emit to `build/` with the new class names embedded.

---

## Task 4: Rename metadata — readme.txt, package.json, composer.json, phpcs.xml.dist, README.md, Playground blueprint

**Files:**
- Modify: `readme.txt`
- Modify: `package.json`
- Modify: `composer.json`
- Modify: `phpcs.xml.dist` (if the rule has an explicit allowed text-domain list, update it)
- Modify: `README.md` (GitHub landing page)
- Modify: `_playground/blueprint.json`

- [ ] **Step 1: Edit `readme.txt` header block**

Update the top of the file:

```
=== Collapsi for Gutenberg Blocks ===
Contributors: devmoaz
Tags: block editor, gutenberg, productivity, ux, collapse
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
```

(`Contributors:` was `moazmahmoud`, heading was `Block Collapser`.)

- [ ] **Step 2: Update readme.txt body copy**

Throughout the file, replace every user-facing mention of "Block Collapser" with "Collapsi for Gutenberg Blocks" on first mention in a paragraph, and "Collapsi" thereafter in the same paragraph. Update the `== Development ==` section's GitHub link from `github.com/devMoaz/block-collapser` → `github.com/devMoaz/collapsi-for-gutenberg`.

- [ ] **Step 3: Edit `package.json`**

```json
{
  "name": "collapsi-for-gutenberg",
  ...
}
```

(Was `"block-collapser"`.) Leave other fields untouched.

- [ ] **Step 4: Edit `composer.json`**

```json
{
  "name": "devmoaz/collapsi-for-gutenberg",
  ...
}
```

(Was `"devmoaz/block-collapser"`.) Leave other fields untouched.

- [ ] **Step 5: Edit `phpcs.xml.dist` if it pins text-domain**

Grep the file:

```powershell
Select-String -Path 'phpcs.xml.dist' -Pattern 'block-collapser|block_collapser'
```

If any rule has `<element value="block-collapser"/>` (the WordPress.WP.I18n text-domain rule), change `block-collapser` → `collapsi`. If no match, no change needed.

- [ ] **Step 6: Edit `README.md`**

Replace the H1 `# Block Collapser` with `# Collapsi for Gutenberg Blocks`. Replace every link `github.com/devMoaz/block-collapser` → `github.com/devMoaz/collapsi-for-gutenberg`. Replace mentions of "Block Collapser" in body copy with "Collapsi for Gutenberg Blocks" (first mention) / "Collapsi" (subsequent). Update the Playground badge URL.

- [ ] **Step 7: Edit `_playground/blueprint.json`**

```powershell
Select-String -Path '_playground\blueprint.json' -Pattern 'block-collapser'
```

Replace every URL or string referencing `block-collapser` or the old repo path with the new equivalents. Specifically the `plugins[*].resource` URL needs to point at `github.com/devMoaz/collapsi-for-gutenberg`.

- [ ] **Step 8: Re-run PHPCS now that phpcs.xml.dist may have changed**

```powershell
composer run phpcs
```

Expected: exit code 0.

---

## Task 5: Audit pass — grep for any leftover old-prefix strings

**Files:** All. Verification step only.

- [ ] **Step 1: Grep the whole plugin tree for all five spellings**

```powershell
$paths = @('block-collapser.php','includes','src','tests','readme.txt','package.json','composer.json','phpcs.xml.dist','phpstan.neon','README.md','uninstall.php','_playground')
foreach ($p in $paths) {
  Write-Host "=== $p ===" -ForegroundColor Cyan
  if (Test-Path $p) {
    Get-ChildItem $p -Recurse -File | Select-String -Pattern "block-collapser|block_collapser|BlockCollapser|BLOCK_COLLAPSER|blockCollapser"
  }
}
```

Expected: zero matches in any file. Acceptable exclusions (do NOT count as failures):

- `docs/` — historical plans/specs reference the old name, that's fine.
- `languages/block-collapser.pot` — will be deleted in Task 7.
- `.distignore`, `.gitattributes` — no occurrences expected anyway since these list dotfiles by path, not by plugin name.
- `node_modules/`, `vendor/` — third-party code, not searched (the script above does walk them by default; ignore any hits there).

If any non-excluded file still has a hit, edit it: text-domain string → `'collapsi'`, class fragment → `collapsi-`, namespace → `Collapsi`, constant → `COLLAPSI_*`, store key fragment → `collapsi/*`.

- [ ] **Step 2: Verify the four WordPress collision-risk surfaces**

Run these targeted greps to confirm no hooks, REST routes, transients, or script handles still use the old prefix:

```powershell
Get-ChildItem 'includes','src' -Recurse -File | Select-String -Pattern "do_action\s*\(\s*['""]block[_-]collapser|apply_filters\s*\(\s*['""]block[_-]collapser|register_rest_route\s*\(\s*['""]block[_-]collapser|set_transient\s*\(\s*['""]block[_-]collapser"
```

Expected: zero matches.

```powershell
Get-ChildItem 'includes','src' -Recurse -File | Select-String -Pattern "wp_register_script|wp_register_style|wp_enqueue_script|wp_enqueue_style|wp_localize_script" | Select-Object Path, LineNumber, Line
```

Inspect each match by eye — confirm every handle and object name uses `collapsi-` / `collapsi`.

---

## Task 6: Run all six verification gates

**Files:** None modified; gates only.

- [ ] **Step 1: PHPCS**

```powershell
composer run phpcs
```

Expected: exit code 0, zero errors, zero warnings.

- [ ] **Step 2: PHPStan**

```powershell
composer run phpstan
```

Expected: exit code 0, zero errors.

- [ ] **Step 3: ESLint**

```powershell
npm run lint:js
```

Expected: exit code 0.

- [ ] **Step 4: Stylelint**

```powershell
npm run lint:css
```

Expected: exit code 0.

- [ ] **Step 5: Jest**

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Production build**

```powershell
npm run build
```

Expected: exit code 0. Verify outputs:

```powershell
Get-ChildItem 'build' | Select-Object Name, Length
```

Expected: at minimum `editor.js`, `editor.asset.php`, `editor.css`, `editor-rtl.css`, `settings.js`, `settings.asset.php`, `settings.css`, `settings-rtl.css`. Filenames may include hashes — that's fine.

- [ ] **Step 7: Confirm built bundles contain the new strings, not the old**

```powershell
Select-String -Path 'build\*.js','build\*.css' -Pattern 'collapsi'
```

Expected: many matches.

```powershell
Select-String -Path 'build\*.js','build\*.css' -Pattern 'block-collapser|block_collapser'
```

Expected: zero matches. If anything from the old prefix slipped into the build, the source still has it — go back to Task 5 Step 1.

---

## Task 7: Regenerate POT translation file

**Files:**
- Delete: `languages/block-collapser.pot`
- Create: `languages/collapsi.pot`

- [ ] **Step 1: Delete the old POT file**

```powershell
Remove-Item 'languages\block-collapser.pot' -ErrorAction SilentlyContinue
```

- [ ] **Step 2: Generate the new POT file**

Use the `@wordpress/scripts` make-pot command (works without wp-cli installed):

```powershell
npx wp-scripts make-pot . languages/collapsi.pot --slug=collapsi-for-gutenberg --domain=collapsi
```

If `wp-scripts make-pot` is not available in this version of the package, fall back to the WP-CLI binary if installed:

```powershell
wp i18n make-pot . languages/collapsi.pot --domain=collapsi --slug=collapsi-for-gutenberg
```

Expected: a new `languages/collapsi.pot` file containing all translatable strings under the `collapsi` domain.

- [ ] **Step 3: Verify the POT file was generated with the right domain**

```powershell
Select-String -Path 'languages\collapsi.pot' -Pattern '"X-Text-Domain' -SimpleMatch
```

If the file has a Text-Domain header, it should read `collapsi`. If the tool didn't emit a header, no problem — the `.po` files derived from this will set the domain at compile time. The important check is that this file does not contain the literal string `block-collapser`:

```powershell
Select-String -Path 'languages\collapsi.pot' -Pattern 'block-collapser'
```

Expected: zero matches (only source string content; if "Block Collapser" appears as an English source string anywhere it's been missed in Task 2/3 — go back and fix).

---

## Task 8: Rename plugin folder

**Files:** None — folder operation.

- [ ] **Step 1: Deactivate the current plugin in WordPress (if active)**

If the local WordPress install has the plugin active, deactivate it first via the wp-admin Plugins page. (Renaming a folder of an active plugin can leave orphaned activation state in `wp_options.active_plugins` pointing at the old path.) If unsure, just check `wp_options` — if `active_plugins` contains `block-collapser/block-collapser.php`, deactivate before the rename.

- [ ] **Step 2: Rename the plugin directory**

From `E:\projects\block-collapser\wp-content\plugins\`:

```powershell
Rename-Item 'block-collapser' 'collapsi-for-gutenberg'
```

Expected: the new folder exists, the old name no longer resolves.

- [ ] **Step 3: Re-activate the plugin under the new path**

Visit wp-admin → Plugins. The plugin will now show as `Collapsi for Gutenberg Blocks` (new header). Activate it. Verify the admin menu shows **Settings → Collapsi**.

If WP-CLI is available locally:

```powershell
wp plugin activate collapsi-for-gutenberg
```

---

## Task 9: Manual smoke test

**Files:** None.

- [ ] **Step 1: Plugin activates with no PHP notices**

Check `wp-content\debug.log` (or the WP debug log location):

```powershell
Get-Content 'E:\projects\block-collapser\wp-content\debug.log' -Tail 20
```

Expected: no `PHP Fatal`, `PHP Warning`, `PHP Notice` from `collapsi-for-gutenberg` paths since the last activation timestamp.

- [ ] **Step 2: Settings page loads**

Navigate to `wp-admin → Settings → Collapsi`. Verify:
- Page renders with three tabs (General, Behaviour, Appearance).
- Heading reads "Collapsi for Gutenberg Blocks".
- Save button is present.
- Browser DevTools → Network: the REST round-trip GETs and POSTs to a route under `wp-json/wp/v2/settings` (or your custom REST route). No 4xx/5xx responses.

- [ ] **Step 3: Editor side — collapse a block**

Open any post in the Post Editor (e.g., post #47 from the prior session). Verify:
- Hovering a top-level block shows the chevron in the top-right.
- Clicking the chevron collapses the block to a 40-px bar.
- The collapsed bar's DOM class is `.collapsi-wrapper` (NOT `.block-collapser-wrapper`). Confirm via DevTools Elements panel.

- [ ] **Step 4: Persistence works**

Reload the editor. The previously-collapsed blocks remain collapsed. In DevTools → Application → Local Storage → `<your-site>`:
- Key `collapsi:v1:post:47` (or whichever post ID) is present with a JSON value.
- No key starting with `block-collapser:v1:` exists from this session.

- [ ] **Step 5: PluginSidebar opens**

Click the Collapsi icon in the editor's right header. Sidebar opens with title "Collapsi" and three buttons: Collapse All, Expand All, Focus Mode. Clicking each performs the expected action.

- [ ] **Step 6: Keyboard shortcut works**

Press `Alt+Shift+C`. All top-level blocks toggle their collapsed state. The shortcut is discoverable in the WP shortcut help modal (`Shift+Alt+H` on Mac, `Ctrl+Alt+H` elsewhere).

- [ ] **Step 7: Deactivate/uninstall cleanup**

Deactivate the plugin via Plugins page. Then "Delete" → confirm. Open the WP DB (e.g. via Adminer or phpMyAdmin) and verify:
- `wp_options` does NOT contain a row with `option_name = 'collapsi_options'` (uninstall cleaned it).
- `wp_options` does NOT contain a leftover row with `option_name = 'block_collapser_options'` (it was cleaned by the prior install or never written under that key after the rename).

Reactivate the plugin for further work.

---

## Task 10: Build dist zip

**Files:**
- Create: `dist/collapsi-for-gutenberg-1.0.0.zip`
- Delete (if exists): `dist/block-collapser-1.0.0.zip`

- [ ] **Step 1: Remove old dist zips and ensure dist/ exists**

```powershell
if (-not (Test-Path 'dist')) { New-Item -ItemType Directory dist | Out-Null }
Remove-Item 'dist\block-collapser-*.zip' -ErrorAction SilentlyContinue
Remove-Item 'dist\collapsi-for-gutenberg-*.zip' -ErrorAction SilentlyContinue
```

- [ ] **Step 2: Stage runtime files honoring .distignore**

Read `.distignore`. Build a staging directory containing only the runtime files. This pattern was used in the prior session; adapt to the new plugin name:

```powershell
$stage = "$env:TEMP\collapsi-for-gutenberg"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory $stage | Out-Null

# Copy runtime files
Copy-Item 'block-collapser.php' "$stage\collapsi-for-gutenberg.php"    # rename bootstrap to match folder name
Copy-Item 'readme.txt' $stage
Copy-Item 'uninstall.php' $stage
Copy-Item 'LICENSE' $stage
Copy-Item 'package.json' $stage
Copy-Item 'build' "$stage\build" -Recurse
Copy-Item 'includes' "$stage\includes" -Recurse
Copy-Item 'languages' "$stage\languages" -Recurse
```

NOTE: The bootstrap file is `block-collapser.php` on disk. In wp.org-shipped plugins, the bootstrap filename typically matches the plugin slug. Rename it during the staging copy to `collapsi-for-gutenberg.php` (the Plugin Name header inside makes the actual name; the file basename is by convention only). After this rename succeeds, also rename the file on the development side in a follow-up if convenient — but the dist is what wp.org sees.

- [ ] **Step 3: Verify staging contents**

```powershell
Get-ChildItem $stage -Recurse | Select-Object FullName
```

Expected: only LICENSE, collapsi-for-gutenberg.php, package.json, readme.txt, uninstall.php, build/ (with 8 files), includes/ (4 PHP files), languages/collapsi.pot. NO src/, NO tests/, NO docs/, NO assets/, NO .distignore.

- [ ] **Step 4: Compress to the dist zip**

```powershell
$dest = "$pwd\dist\collapsi-for-gutenberg-1.0.0.zip"
Compress-Archive -Path "$stage\*" -DestinationPath $dest -Force
Get-Item $dest | Format-List Name, Length, FullName
Get-FileHash $dest -Algorithm SHA256 | Select-Object Hash
```

Expected: zip exists, size between 25–40 KB (prior was 29 KB), SHA256 hash recorded for reference.

- [ ] **Step 5: List zip contents**

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($dest)
$zip.Entries | Select-Object FullName, Length | Format-Table
$zip.Dispose()
```

Expected: 18-ish entries — runtime files only. If any path starts with `src/`, `tests/`, `docs/`, `assets/`, `dist/`, `node_modules/`, `vendor/`, or `.github/` — something leaked from staging. Re-do step 2.

---

## Task 11: GitHub — create new repo, mirror CI, archive old repo

**Files:** None modified locally; remote operations via `gh` CLI.

- [ ] **Step 1: Verify gh CLI is authenticated as devMoaz**

```powershell
gh auth status
```

Expected: logged in as devMoaz. If not, run `gh auth login` first.

- [ ] **Step 2: Create the new public repo**

```powershell
gh repo create devMoaz/collapsi-for-gutenberg --public --description "Editor-only collapse/expand for every Gutenberg block. Tame long posts and templates without losing your place." --homepage "https://wordpress.org/plugins/collapsi-for-gutenberg/"
```

Expected: repo created at `github.com/devMoaz/collapsi-for-gutenberg`.

- [ ] **Step 3: Initialize git locally in the renamed plugin folder and push as initial commit**

The plugin folder is not currently a git repo. Initialize and push:

```powershell
git init
git remote add origin https://github.com/devMoaz/collapsi-for-gutenberg.git
git add .
git commit -m "Initial commit: Collapsi for Gutenberg Blocks v1.0.0"
git branch -M main
git push -u origin main
```

If the repo already had a default initialization commit from `gh repo create`, force-push or use `--rebase` as needed. If the local checkout has uncommitted unrelated files, stage selectively rather than `git add .`.

- [ ] **Step 4: Add the topics**

```powershell
gh repo edit devMoaz/collapsi-for-gutenberg --add-topic wordpress --add-topic wordpress-plugin --add-topic gutenberg --add-topic block-editor --add-topic productivity
```

- [ ] **Step 5: Mirror the CI workflow from the old repo**

The CI workflow file `.github/workflows/ci.yml` was excluded from dist but should be in the new repo's source tree. Copy it forward:

```powershell
# .github should already be in the local clone since we pushed everything
Test-Path '.github\workflows\ci.yml'   # should print True
```

If `True` and the file looks correct (six gates: phpcs, phpstan, lint:js, lint:css, jest, build), no action needed. If missing, copy from the prior session's content.

- [ ] **Step 6: Tag v1.0.0 and create a Release with the dist zip attached**

```powershell
git tag v1.0.0
git push origin v1.0.0

gh release create v1.0.0 `
  "dist\collapsi-for-gutenberg-1.0.0.zip" `
  --title "v1.0.0 — Initial release" `
  --notes "First release. Editor-only collapse/expand for every Gutenberg block. Pending wp.org review."
```

Expected: release published at `github.com/devMoaz/collapsi-for-gutenberg/releases/tag/v1.0.0` with the zip attached.

- [ ] **Step 7: Update old repo's README with a deprecation notice**

Clone the old repo separately (not in the current working dir):

```powershell
$tmp = "$env:TEMP\old-block-collapser"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
gh repo clone devMoaz/block-collapser $tmp
Set-Content -Path "$tmp\README.md" -Encoding utf8 -Value @'
# Block Collapser → Renamed to Collapsi for Gutenberg Blocks

This repository has been renamed and rebranded as **Collapsi for Gutenberg Blocks**. All future development happens at:

https://github.com/devMoaz/collapsi-for-gutenberg

This repository is preserved for reference only and will not receive updates.
'@
cd $tmp
git add README.md
git commit -m "Deprecation notice — moved to collapsi-for-gutenberg"
git push
cd 'E:\projects\block-collapser\wp-content\plugins\collapsi-for-gutenberg'
```

- [ ] **Step 8: Archive the old repo**

```powershell
gh repo archive devMoaz/block-collapser --yes
```

Expected: repo is now archived (read-only). The deprecation README still renders.

- [ ] **Step 9: Verify both repos reflect the intended state**

```powershell
gh repo view devMoaz/collapsi-for-gutenberg | Select-Object -First 10
gh repo view devMoaz/block-collapser | Select-Object -First 10
```

Expected: new repo is public + active, old repo is public + archived with deprecation README.

---

## Task 12: Hand off to user for wp.org submission

**Files:** None modified.

- [ ] **Step 1: Print the final artifacts the user needs**

Display these to the user:

1. **Local zip path:**
   `E:\projects\block-collapser\wp-content\plugins\collapsi-for-gutenberg\dist\collapsi-for-gutenberg-1.0.0.zip`
2. **Zip SHA256** (from Task 10 Step 4) — share for the user's records.
3. **New GitHub repo URL:**
   `https://github.com/devMoaz/collapsi-for-gutenberg`
4. **GitHub Release URL** (from Task 11 Step 6).
5. **Old GitHub repo URL** (now archived):
   `https://github.com/devMoaz/block-collapser`

- [ ] **Step 2: Provide the upload URL and the email reply text**

The user uploads the zip at:

> https://wordpress.org/plugins/developers/add/

logged in as `devmoaz`. The upload page will trigger the automated pre-scan. Expected result: PASS.

After upload, the user replies to the existing review email thread with this text:

```
Hi,

Thanks for the review. I've addressed the feedback
and uploaded a new version.

Please reserve the new slug: collapsi-for-gutenberg

The new display name is "Collapsi for Gutenberg Blocks".

Best,
Moaz
```

Five lines. No change-list. The slug reservation is explicit.

- [ ] **Step 3: Set expectations on timeline**

The previous queue position was #104. After replying, the plugin re-enters the queue. The next email from the WordPress Plugin Team should have the subject:

> [WordPress Plugin Directory] Review in Progress: Collapsi for Gutenberg Blocks

…or, if there are further issues, another *Review in Progress* email with feedback. Typical wait: 3–10 days after the reply.

---

## Self-Review (post-write)

I checked the plan against the spec:

- **Identity rename table coverage:** Every row in the spec's "New identity" table maps to a step. Display name (Task 1.1, Task 4.1), slug (Task 4.1 + Task 12.2), folder (Task 8.2), namespace + constants (Task 1), text domain (Task 1, 2), option key + group (Task 1.5), admin page slug (Task 1.3), localStorage key (Task 2.1), CSS class prefix (Task 2.5, 3), script handles (Task 1.4), Contributors (Task 4.1), Plugin URI (Task 1.1), package/composer (Task 4.3, 4.4), POT (Task 7), dist zip (Task 10.4), GitHub repos (Task 11), Playground blueprint (Task 4.7).
- **Audit pass:** Task 5 implements the spec's "Audit pass (Phase 2)" section.
- **Verification gates:** Task 6 implements the spec's "Verification gates (Phase 4)" section.
- **GitHub strategy:** Task 11 implements the spec's "GitHub strategy" section.
- **Submit + email:** Task 12 implements the spec's "Build + Submit" section.
- **Out-of-scope items:** The spec's "What we are NOT doing" section is not violated by any task — no new features, no screenshot rework, no backwards-compat shims.

**Placeholder scan:** No "TBD", "TODO", or vague language. Every step has either complete code, a complete command, or a complete diff target. The one looseness is Task 1 Step 7 (`tests/phpstan-bootstrap.php`) where the file content isn't shown — but the step is "grep and rename whatever is there" which is a deterministic mechanical operation, not a placeholder. Acceptable.

**Type consistency:** All identifiers are consistent across tasks — `collapsi` text domain, `Collapsi` namespace, `COLLAPSI_*` constants, `collapsi_options` option key, `collapsi` option group, `collapsi-editor` / `collapsi-editor-style` script handles, `collapsi:v1:post:` localStorage prefix, `collapsi-*` CSS class fragment.

No issues found. Plan is ready to execute.
