# Collapsi for the Block Editor — Rename Implementation Plan (Round 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the wp.org-pending plugin from "Collapsi for Gutenberg Blocks" / `collapsi-for-gutenberg` to "Collapsi for the Block Editor" / `collapsi-for-block-editor`, removing "Gutenberg" from the display name and slug so the upload form's restricted-term pre-check passes.

**Architecture:** Pure identifier rename, scoped to slug-shaped identifiers only. Brand-prefixed identifiers (`Collapsi` namespace, `COLLAPSI_*` constants, `collapsi-*` CSS classes, `collapsi:v1` localStorage, `collapsi/v1` REST namespace, `collapsi-editor`/`collapsi-settings` handles) all survive untouched — round 1 decoupled them from the slug. Mechanical search-replace across the slug-touching files, run the six gates, build the zip, push to a new GitHub repo, archive the old one.

**Tech Stack:** PHP 7.4+, WordPress 6.5+, `@wordpress/scripts` (webpack 5), Jest, PHPCS (WPCS 3.x), PHPStan level 8, PowerShell on Windows.

**Important environment notes:**

- The plugin root is `E:\projects\block-collapser\wp-content\plugins\collapsi-for-gutenberg\`. After Task 7 it becomes `...\collapsi-for-block-editor\`. Paths below are RELATIVE to whichever name is current.
- **The plugin folder IS a git repository this round** (the round-1 rename initialized one and pushed to `devMoaz/collapsi-for-gutenberg`). Git commits at the end of each task ARE applicable.
- "Tests" here = existing test suite passing after the rename. Behavior is unchanged; no new tests written.
- Run `git status` at the start to confirm clean working tree before beginning. If anything is dirty, stash or commit first.

**Design spec:** `docs/superpowers/specs/2026-06-04-collapsi-rename-design.md`

---

## Task 1: Rename bootstrap PHP file + update plugin header + PHP text-domain references

**Files:**
- Rename: `collapsi-for-gutenberg.php` → `collapsi-for-block-editor.php` (plugin header file)
- Modify: the renamed bootstrap file (header block + `@package` tag)
- Modify: `includes/class-admin-page.php` (SLUG constant + text-domain args)
- Modify: `includes/class-assets.php` (wp_set_script_translations text-domain args)
- Modify: `includes/class-settings.php` (OPTION_GROUP constant + text-domain args)
- Modify: `includes/class-plugin.php` (text-domain args if any)
- Modify: `uninstall.php` (text-domain args if any)
- Modify: `tests/phpstan-bootstrap.php` (COLLAPSI_FILE default path)

- [ ] **Step 1: Rename the bootstrap PHP file**

```powershell
Rename-Item 'collapsi-for-gutenberg.php' 'collapsi-for-block-editor.php'
```

Expected: `collapsi-for-block-editor.php` now exists; `collapsi-for-gutenberg.php` no longer resolves.

- [ ] **Step 2: Edit the renamed bootstrap header**

Open `collapsi-for-block-editor.php`. Update the header block so it reads:

```php
<?php
/**
 * Plugin Name:       Collapsi for the Block Editor
 * Plugin URI:        https://github.com/devMoaz/collapsi-for-block-editor
 * Description:       Editor-only collapse/expand toggle for every block in the WordPress editor. Hover a top-level block, click the chevron, and the block tucks into a compact bar with icon, title, and content preview. Survives reloads via localStorage. Works in Post Editor and Site Editor. No frontend impact.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Tested up to:      7.0
 * Author:            Moaz Mahmoud
 * Author URI:        https://www.linkedin.com/in/moazmahmmoud/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       collapsi-for-block-editor
 * Domain Path:       /languages
 *
 * @package Collapsi
 */
```

Leave everything below the header (`declare(strict_types=1)`, `defined('ABSPATH') || exit`, the four `COLLAPSI_*` `define()` calls, the `require_once` lines, the `plugins_loaded` action) UNCHANGED. The `COLLAPSI_*` constants and the `\Collapsi\Plugin::instance()->boot()` call all stay.

- [ ] **Step 3: Edit `includes/class-admin-page.php`**

Apply these specific changes:

```php
public const SLUG    = 'collapsi-for-block-editor';   // was: 'collapsi-for-gutenberg'

// In add_options_page():
__( 'Collapsi for the Block Editor', 'collapsi-for-block-editor' ),  // page title + text domain
__( 'Collapsi', 'collapsi-for-block-editor' ),                       // menu label + text domain
```

Then replace every other `'collapsi-for-gutenberg'` text-domain literal in this file with `'collapsi-for-block-editor'`. Critical: **eyeball each replacement.** Round 1 had a bulk-replace bug that converted `__( 'Collapsi', 'collapsi' )` into `__( 'collapsi-for-gutenberg', 'collapsi-for-gutenberg' )` (slug as the visible label). Do not let that happen — only the SECOND argument (the text-domain) changes. The first argument (the user-facing string) stays as a proper-cased human string.

The `'settings_page_' . self::SLUG` enqueue-guard expression stays — it derives from the SLUG constant.

- [ ] **Step 4: Edit `includes/class-assets.php`**

```php
wp_set_script_translations( self::HANDLE, 'collapsi-for-block-editor' );   // was: 'collapsi-for-gutenberg'
```

Apply to both the editor bundle and the settings bundle if both exist in this file. Handle constants (`HANDLE = 'collapsi-editor'`, `STYLE_HANDLE = 'collapsi-editor-style'`) STAY — they are brand-prefixed.

- [ ] **Step 5: Edit `includes/class-settings.php`**

```php
public const OPTION_GROUP  = 'collapsi-for-block-editor';   // was: 'collapsi-for-gutenberg'
```

`OPTION_NAME = 'collapsi_options'` stays (brand-prefixed). REST namespace `'collapsi/v1'` stays. Replace every `'collapsi-for-gutenberg'` text-domain literal with `'collapsi-for-block-editor'`.

- [ ] **Step 6: Edit `includes/class-plugin.php`**

Grep for the old text domain:

```powershell
Select-String -Path 'includes\class-plugin.php' -Pattern "collapsi-for-gutenberg"
```

For every match, change the literal `'collapsi-for-gutenberg'` to `'collapsi-for-block-editor'`. Namespace `Collapsi` stays; constants stay.

- [ ] **Step 7: Edit `uninstall.php`**

Grep:

```powershell
Select-String -Path 'uninstall.php' -Pattern "collapsi-for-gutenberg"
```

For every match (if any — there may be none since uninstall typically uses no text domain), change the literal to `'collapsi-for-block-editor'`. Option key `'collapsi_options'` stays.

- [ ] **Step 8: Edit `tests/phpstan-bootstrap.php`**

Update the `COLLAPSI_FILE` default path:

```php
defined( 'COLLAPSI_FILE' ) || define( 'COLLAPSI_FILE', dirname( __DIR__ ) . '/collapsi-for-block-editor.php' );
// was: '/collapsi-for-gutenberg.php'
```

Grep for any other `collapsi-for-gutenberg` hits in this file:

```powershell
Select-String -Path 'tests\phpstan-bootstrap.php' -Pattern "collapsi-for-gutenberg"
```

Update each.

- [ ] **Step 9: Run PHPCS to verify PHP renames are valid**

```powershell
composer run phpcs
```

Expected: exit code 0, zero errors, zero warnings. If text-domain mismatch errors fire ("expected `collapsi-for-block-editor`, found `collapsi-for-gutenberg`"), Task 3 Step 5 updates `phpcs.xml.dist` to match. For this task we accept that PHPCS may flag mismatches against the OLD pinned domain — that's fine; we will re-run after Task 3.

If PHPCS errors are about anything OTHER than text-domain (syntax, missing braces, undefined references), fix them now.

- [ ] **Step 10: Run PHPStan to verify references resolve**

```powershell
composer run phpstan
```

Expected: exit code 0, zero errors. Bootstrap path update in Step 8 should resolve any "file not found" issues during static analysis.

- [ ] **Step 11: Commit the PHP changes**

```powershell
git add collapsi-for-block-editor.php includes uninstall.php tests/phpstan-bootstrap.php
git rm collapsi-for-gutenberg.php  # git tracks the rename via add+rm
git status   # confirm staged: rename + modifications
git commit -m "refactor: rename PHP text domain and bootstrap file to collapsi-for-block-editor"
```

If `git rm collapsi-for-gutenberg.php` fails with "did not match any files" (already renamed via filesystem only), use `git add -A` to pick up the rename.

---

## Task 2: Update JS source text-domain arguments

**Files:**
- Modify: every `.js` file under `src/` that contains the literal string `'collapsi-for-gutenberg'`

Notes: The brand prefix decoupling means no CSS class names, store keys, sidebar names, HOC names, custom property names, or storage prefixes change in this round. ONLY text-domain arguments to `__()` / `_x()` / `_n()` / `_nx()` change.

- [ ] **Step 1: Enumerate every JS file with the old text domain**

```powershell
Get-ChildItem 'src' -Recurse -Include *.js | Select-String -Pattern "'collapsi-for-gutenberg'" | Select-Object Path, LineNumber, Line
```

Expected: a list of matches across `src/editor/` and `src/settings/`. The matches are all text-domain arguments — every match looks like `__( 'Some string', 'collapsi-for-gutenberg' )` or similar.

- [ ] **Step 2: Replace every match**

For each file in the list from Step 1, replace `'collapsi-for-gutenberg'` with `'collapsi-for-block-editor'`. Do this per file (Edit tool replace_all=true is safe here — the string is unambiguously the text domain, never a human-readable label).

PowerShell one-liner for a single file:

```powershell
$f = 'src\editor\some-file.js'  # example
(Get-Content $f -Raw) -replace "'collapsi-for-gutenberg'", "'collapsi-for-block-editor'" | Set-Content $f -NoNewline
```

(Use the Edit tool with `replace_all: true` if available; the PowerShell command is a fallback.)

- [ ] **Step 3: Verify zero JS hits remain for the old domain**

```powershell
Get-ChildItem 'src' -Recurse -Include *.js | Select-String -Pattern "collapsi-for-gutenberg"
```

Expected: zero matches.

- [ ] **Step 4: Verify visible UI strings did NOT get mangled**

```powershell
Get-ChildItem 'src' -Recurse -Include *.js | Select-String -Pattern "Collapsi for Gutenberg Blocks"
```

Expected: zero matches (display name was already absent in source — confirm). If any match: replace the human display-name string `"Collapsi for Gutenberg Blocks"` with `"Collapsi for the Block Editor"`.

- [ ] **Step 5: Confirm brand-prefixed identifiers are still in place**

```powershell
Get-ChildItem 'src' -Recurse -Include *.js | Select-String -Pattern "'collapsi/settings'|'collapsi'|window\.collapsiSettings|collapsi:v1:" | Select-Object -First 20
```

Expected: many matches across files. These are brand-prefixed and MUST remain. If any of them disappeared in Step 2's replace, the replace was too greedy.

- [ ] **Step 6: Run lint:js**

```powershell
npm run lint:js
```

Expected: exit code 0.

- [ ] **Step 7: Run Jest tests**

```powershell
npm test
```

Expected: all tests pass. If any test asserts the text domain literally, it will now fail — find with:

```powershell
Get-ChildItem 'tests' -Recurse -Include *.js | Select-String -Pattern "collapsi-for-gutenberg"
```

Update each match.

- [ ] **Step 8: Commit**

```powershell
git add src tests
git commit -m "refactor: update JS text-domain args to collapsi-for-block-editor"
```

---

## Task 3: Update metadata files

**Files:**
- Modify: `readme.txt` (heading + body name references)
- Modify: `package.json` (`name` + `makepot` script)
- Modify: `composer.json` (`name` if applicable)
- Modify: `phpcs.xml.dist` (ruleset name, description, `<file>`, text-domain pin)
- Modify: `webpack.config.js` (comment header if it references the old display name)
- Modify: `README.md` (GitHub landing)
- Modify: `_playground/blueprint.json` if present

- [ ] **Step 1: Edit `readme.txt`**

Apply these changes:

- Heading line: `=== Collapsi for the Block Editor ===` (was `=== Collapsi for Gutenberg Blocks ===`).
- `Tags:` line: confirm 5 or fewer. Target: `block editor, gutenberg, productivity, ux, collapse`. If currently `Tags: block editor, gutenberg, productivity, ux, collapse` — no change. If currently different, edit to that list.
- Short description: if it currently begins with "Collapsi for Gutenberg Blocks ..." or similar, swap to lead with "Collapsi for the Block Editor". Keep "Gutenberg" mentions allowed elsewhere in body (per spec readme body policy).
- Body sections: replace EVERY literal occurrence of the old display name `Collapsi for Gutenberg Blocks` with `Collapsi for the Block Editor`. Keep mid-sentence references to "Gutenberg" (the editor's codename) — those are SEO-valuable and explicitly allowed in body content.
- `== Development ==` section: replace the GitHub link `https://github.com/devMoaz/collapsi-for-gutenberg` with `https://github.com/devMoaz/collapsi-for-block-editor`.

After edits, grep:

```powershell
Select-String -Path 'readme.txt' -Pattern "Collapsi for Gutenberg Blocks|collapsi-for-gutenberg"
```

Expected: zero matches. Standalone "Gutenberg" in body prose is acceptable and should remain.

- [ ] **Step 2: Edit `package.json`**

```json
{
  "name": "collapsi-for-block-editor",
  ...
  "scripts": {
    ...
    "makepot": "wp i18n make-pot . languages/collapsi-for-block-editor.pot --slug=collapsi-for-block-editor --domain=collapsi-for-block-editor"
  }
}
```

Both `name` field and `makepot` script line change. Leave every other field exactly as-is.

Verify:

```powershell
Select-String -Path 'package.json' -Pattern "collapsi-for-gutenberg"
```

Expected: zero matches.

- [ ] **Step 3: Edit `composer.json`**

If the `name` field contains `devmoaz/collapsi-for-gutenberg`, change to `devmoaz/collapsi-for-block-editor`. If `composer.json` does not exist or does not have a `name` field, skip.

Verify:

```powershell
Select-String -Path 'composer.json' -Pattern "collapsi-for-gutenberg"
```

Expected: zero matches (or "file not found" if the file does not exist).

- [ ] **Step 4: Edit `phpcs.xml.dist`**

Apply these specific changes:

```xml
<ruleset name="Collapsi for the Block Editor">
    <description>Coding standards for Collapsi for the Block Editor.</description>

    <file>collapsi-for-block-editor.php</file>
    <file>includes</file>
    <file>uninstall.php</file>

    ...

    <rule ref="WordPress.WP.I18n">
        <properties>
            <property name="text_domain" type="array">
                <element value="collapsi-for-block-editor"/>
            </property>
        </properties>
    </rule>
</ruleset>
```

Three places change: `<ruleset name="…">`, `<description>…</description>`, `<file>` for the bootstrap, and the `<element value="…"/>` text-domain pin. Other rules (`<exclude name="…"/>`, `<arg>`, `<config>`) stay.

Verify:

```powershell
Select-String -Path 'phpcs.xml.dist' -Pattern "collapsi-for-gutenberg"
```

Expected: zero matches.

- [ ] **Step 5: Edit `webpack.config.js`**

Grep:

```powershell
Select-String -Path 'webpack.config.js' -Pattern "Collapsi for Gutenberg Blocks|collapsi-for-gutenberg"
```

For each match (likely in a comment header like `// - settings: loaded on the Settings > Collapsi admin page`), update to use "Collapsi for the Block Editor". The actual webpack entry points are file-path-based and do NOT change. No code changes expected — comments only.

- [ ] **Step 6: Edit `README.md`**

Replace:
- H1 `# Collapsi for Gutenberg Blocks` → `# Collapsi for the Block Editor`.
- Every `https://github.com/devMoaz/collapsi-for-gutenberg` → `https://github.com/devMoaz/collapsi-for-block-editor`.
- Every body-copy `Collapsi for Gutenberg Blocks` → `Collapsi for the Block Editor`. Standalone "Gutenberg" mentions stay.
- Playground badge URL: update repo path.

Verify:

```powershell
Select-String -Path 'README.md' -Pattern "Collapsi for Gutenberg Blocks|collapsi-for-gutenberg"
```

Expected: zero matches.

- [ ] **Step 7: Edit `_playground/blueprint.json` if present**

```powershell
Test-Path '_playground\blueprint.json'
```

If `True`:

```powershell
Select-String -Path '_playground\blueprint.json' -Pattern "collapsi-for-gutenberg"
```

For each match, edit `_playground/blueprint.json` and replace `collapsi-for-gutenberg` with `collapsi-for-block-editor`. This is typically inside the `plugins[*].resource` URL.

If `Test-Path` returned `False`, skip — no blueprint to update.

- [ ] **Step 8: Re-run PHPCS now that the text-domain pin matches**

```powershell
composer run phpcs
```

Expected: exit code 0, zero errors, zero warnings (any Task 1 text-domain mismatches are now resolved).

- [ ] **Step 9: Commit**

```powershell
git add readme.txt package.json composer.json phpcs.xml.dist webpack.config.js README.md _playground
git commit -m "chore: update metadata to Collapsi for the Block Editor"
```

If `_playground` was not present, omit it from the `git add` line.

---

## Task 4: Audit pass — grep for leftover old-slug strings

**Files:** All. Verification only.

- [ ] **Step 1: Grep the whole plugin tree for the old slug and display name**

```powershell
$paths = @('collapsi-for-block-editor.php','includes','src','tests','readme.txt','package.json','composer.json','phpcs.xml.dist','phpstan.neon','README.md','uninstall.php','_playground','webpack.config.js')
foreach ($p in $paths) {
  if (Test-Path $p) {
    Write-Host "=== $p ===" -ForegroundColor Cyan
    Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern "collapsi-for-gutenberg|Collapsi for Gutenberg Blocks|collapsiForGutenberg|CollapsiForGutenberg|collapsi_for_gutenberg"
  }
}
```

Expected: zero matches in any file. Acceptable exclusions (do NOT count as failures):

- `docs/` — historical plans/specs reference the old name; that's fine. (Including this round's spec which intentionally documents the from→to mapping.)
- `languages/collapsi-for-gutenberg.pot` — will be deleted in Task 6.
- `dist/collapsi-for-gutenberg-*.zip` — old build artifacts, deleted in Task 8.
- `node_modules/`, `vendor/`, `build/`, `.git/` — third-party / generated; the script above excludes them by not listing them.
- `package-lock.json` — `name` field is mirrored from `package.json`; if it still says `collapsi-for-gutenberg`, run `npm install` to regenerate.

If any non-excluded file still has a hit, edit it: text-domain literal → `'collapsi-for-block-editor'`, repo URL → `collapsi-for-block-editor`, display name → `Collapsi for the Block Editor`.

- [ ] **Step 2: Verify brand-prefixed identifiers survived intact**

```powershell
Get-ChildItem 'includes','src' -Recurse -File | Select-String -Pattern "namespace Collapsi|COLLAPSI_VERSION|COLLAPSI_FILE|COLLAPSI_DIR|COLLAPSI_URL|'collapsi/v1'|'collapsi/settings'|window\.collapsiSettings|collapsi:v1:|'collapsi-editor'|'collapsi-settings'|'collapsi-editor-style'" | Measure-Object | Select-Object Count
```

Expected: a positive count (the brand-prefixed identifiers are intact). If count is suspiciously low or zero, the bulk replace in earlier tasks was too greedy — investigate.

- [ ] **Step 3: Verify slug-shaped surfaces use the NEW value**

```powershell
Get-ChildItem 'includes' -Recurse -File | Select-String -Pattern "register_setting|add_options_page|add_menu_page|wp_set_script_translations"
```

Eyeball each match — the slug-shaped argument should be `'collapsi-for-block-editor'`, never `'collapsi-for-gutenberg'` or anything else.

- [ ] **Step 4: Regenerate package-lock.json if needed**

If Step 1 flagged `package-lock.json`:

```powershell
npm install
```

Expected: `package-lock.json` updated with new `name` field. Then re-grep to confirm clean.

- [ ] **Step 5: Commit if anything changed in this task**

```powershell
git status
```

If anything is modified or untracked:

```powershell
git add -A
git commit -m "chore: audit pass cleanup for collapsi-for-block-editor rename"
```

If clean, skip.

---

## Task 5: Run all six verification gates

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

Expected: all tests pass (round 1 had 74 passing — same count expected).

- [ ] **Step 6: Production build**

```powershell
npm run build
```

Expected: exit code 0. Bundles emit to `build/`.

```powershell
Get-ChildItem 'build' | Select-Object Name, Length
```

Expected: at minimum `editor.js`, `editor.asset.php`, `editor.css`, `editor-rtl.css`, `settings.js`, `settings.asset.php`, `settings.css`, `settings-rtl.css`.

- [ ] **Step 7: Confirm built bundles do NOT contain the old slug**

```powershell
Select-String -Path 'build\*.js','build\*.css' -Pattern "collapsi-for-gutenberg"
```

Expected: zero matches. If anything from the old slug appears in the build, source still has a hit — re-run Task 4 Step 1.

```powershell
Select-String -Path 'build\*.js','build\*.css' -Pattern "collapsi" | Measure-Object | Select-Object Count
```

Expected: positive count (brand prefix is still in the build — the CSS classes, store keys, etc.).

- [ ] **Step 8: Commit the rebuilt assets**

If `build/` is tracked in the repo (round-1 setup may have ignored it — check `.gitignore`):

```powershell
git status build
```

If `build/` is gitignored, skip. If it is tracked:

```powershell
git add build
git commit -m "build: production bundles for collapsi-for-block-editor"
```

---

## Task 6: Regenerate POT translation file

**Files:**
- Delete: `languages/collapsi-for-gutenberg.pot`
- Create: `languages/collapsi-for-block-editor.pot`

- [ ] **Step 1: Delete the old POT file**

```powershell
Remove-Item 'languages\collapsi-for-gutenberg.pot' -ErrorAction SilentlyContinue
```

- [ ] **Step 2: Generate the new POT file**

Use the npm script from package.json (updated in Task 3 Step 2):

```powershell
npm run makepot
```

If `wp` CLI is not available locally, fall back to `wp-scripts make-pot`:

```powershell
npx wp-scripts make-pot . languages/collapsi-for-block-editor.pot --slug=collapsi-for-block-editor --domain=collapsi-for-block-editor
```

Expected: `languages/collapsi-for-block-editor.pot` exists containing the source strings under the `collapsi-for-block-editor` domain.

- [ ] **Step 3: Verify the new POT file**

```powershell
Test-Path 'languages\collapsi-for-block-editor.pot'
Select-String -Path 'languages\collapsi-for-block-editor.pot' -Pattern 'collapsi-for-gutenberg'
```

Expected: file exists; zero matches for the old slug.

```powershell
Select-String -Path 'languages\collapsi-for-block-editor.pot' -Pattern 'Collapsi for Gutenberg Blocks'
```

Expected: zero matches (if the old display name appears as a source string, a JS/PHP file still has the old string — go back to Task 1 Step 3 or Task 2 Step 4).

- [ ] **Step 4: Commit**

```powershell
git add languages
git status   # confirm: deleted collapsi-for-gutenberg.pot, added collapsi-for-block-editor.pot
git commit -m "i18n: regenerate POT under collapsi-for-block-editor text domain"
```

---

## Task 7: Rename plugin folder

**Files:** None — folder operation.

- [ ] **Step 1: Stop background processes that hold file handles in the plugin folder**

Check for running watchers / dev servers:

```powershell
Get-Process | Where-Object { $_.Path -like '*collapsi-for-gutenberg*' } | Select-Object Id, Name, Path
```

If any are listed, stop them:

```powershell
# Example — kill any node.exe or php.exe holding the folder
# (Run only if you confirmed the process is yours)
# Stop-Process -Id <PID> -Force
```

Round 1 hit a file-lock retry when PHPStan held a handle — pre-empt this time.

- [ ] **Step 2: Deactivate the plugin in WordPress**

If the local WP install has the plugin active, deactivate it via wp-admin → Plugins. Alternatively, if WP-CLI is available:

```powershell
wp plugin deactivate collapsi-for-gutenberg
```

- [ ] **Step 3: Rename the folder**

From `E:\projects\block-collapser\wp-content\plugins\`:

```powershell
Set-Location 'E:\projects\block-collapser\wp-content\plugins'
Rename-Item 'collapsi-for-gutenberg' 'collapsi-for-block-editor'
Set-Location 'collapsi-for-block-editor'
```

Expected: new folder name exists, old name does not. If `Rename-Item` errors with "in use by another process", revisit Step 1.

- [ ] **Step 4: Re-activate the plugin under the new path**

```powershell
wp plugin activate collapsi-for-block-editor
```

Or via wp-admin → Plugins → Activate. The plugin row will show as **Collapsi for the Block Editor** (header reads the new Plugin Name).

Verify the admin menu shows **Settings → Collapsi** (label stays "Collapsi", confirming Task 1 Step 3 was applied correctly — the menu label is NOT the slug).

- [ ] **Step 5: Update git remote URL to match new repo (we will create the repo in Task 10; for now, only the local checkout's working folder changed — `.git/` is intact)**

The folder rename moved `.git/` along with everything else. The remote URL still points at `devMoaz/collapsi-for-gutenberg`. We will redirect it in Task 10. For now:

```powershell
git remote -v
```

Expected: `origin` still points at the old repo URL — that's fine for this task.

---

## Task 8: Build dist zip

**Files:**
- Create: `dist/collapsi-for-block-editor-1.0.0.zip`
- Delete: `dist/collapsi-for-gutenberg-*.zip` (old build artifacts)

- [ ] **Step 1: Clean dist/ and ensure folder exists**

```powershell
if (-not (Test-Path 'dist')) { New-Item -ItemType Directory dist | Out-Null }
Remove-Item 'dist\collapsi-for-gutenberg-*.zip' -ErrorAction SilentlyContinue
Remove-Item 'dist\collapsi-for-block-editor-*.zip' -ErrorAction SilentlyContinue
```

- [ ] **Step 2: Stage runtime files honoring `.distignore`**

```powershell
$stage = "$env:TEMP\collapsi-for-block-editor"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory $stage | Out-Null

Copy-Item 'collapsi-for-block-editor.php' $stage
Copy-Item 'readme.txt' $stage
Copy-Item 'uninstall.php' $stage
Copy-Item 'LICENSE' $stage
Copy-Item 'package.json' $stage
Copy-Item 'build' "$stage\build" -Recurse
Copy-Item 'includes' "$stage\includes" -Recurse
Copy-Item 'languages' "$stage\languages" -Recurse
```

Expected: staging dir contains runtime files only — no `src/`, no `tests/`, no `docs/`, no `assets/`, no `dist/`, no `node_modules/`, no `vendor/`, no `.distignore`, no `.git/`, no `.github/`, no dotfiles.

- [ ] **Step 3: Verify staging contents**

```powershell
Get-ChildItem $stage -Recurse | Select-Object FullName
```

Expected: ~18 entries. Concretely:
- `LICENSE`
- `collapsi-for-block-editor.php`
- `package.json`
- `readme.txt`
- `uninstall.php`
- `build/` (8 files: editor.{js,asset.php,css}, editor-rtl.css, settings.{js,asset.php,css}, settings-rtl.css)
- `includes/` (4 PHP files: class-plugin.php, class-assets.php, class-admin-page.php, class-settings.php)
- `languages/` (1 file: collapsi-for-block-editor.pot)

- [ ] **Step 4: Compress to the dist zip**

```powershell
$dest = "$pwd\dist\collapsi-for-block-editor-1.0.0.zip"
Compress-Archive -Path "$stage\*" -DestinationPath $dest -Force
Get-Item $dest | Format-List Name, Length, FullName
Get-FileHash $dest -Algorithm SHA256 | Select-Object Hash
```

Expected: zip exists, size 25–40 KB (round 1 was 29 KB; identifier-only changes shouldn't move the needle).

- [ ] **Step 5: List zip contents**

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($dest)
$zip.Entries | Select-Object FullName, Length | Format-Table
$zip.Dispose()
```

Expected: ~18 entries, all runtime. If any path starts with `src/`, `tests/`, `docs/`, `assets/`, `dist/`, `node_modules/`, `vendor/`, `.git/`, or `.github/` — staging leaked. Re-do Step 2.

- [ ] **Step 6: Verify zip does not contain the old slug**

```powershell
$tmp = "$env:TEMP\zip-check"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
Expand-Archive -Path $dest -DestinationPath $tmp
Get-ChildItem $tmp -Recurse -File | Select-String -Pattern "collapsi-for-gutenberg" | Select-Object Path, LineNumber, Line
Remove-Item $tmp -Recurse -Force
```

Expected: zero hits. If anything matches, the rename is incomplete somewhere in the runtime tree — go back.

- [ ] **Step 7: Commit the dist zip if dist/ is tracked**

```powershell
git status dist
```

If `dist/` is gitignored, skip. If tracked:

```powershell
git add dist
git commit -m "build: dist zip for collapsi-for-block-editor v1.0.0"
```

---

## Task 9: Manual smoke test

**Files:** None modified.

- [ ] **Step 1: Plugin activates with no PHP notices**

```powershell
Get-Content 'E:\projects\block-collapser\wp-content\debug.log' -Tail 30
```

Expected: no `PHP Fatal`, `PHP Warning`, `PHP Notice` from `collapsi-for-block-editor` paths since the most recent activation.

- [ ] **Step 2: Settings page loads correctly**

Navigate to `wp-admin → Settings → Collapsi`. Verify:
- Page renders with three tabs (General, Behaviour, Appearance).
- Heading reads **Collapsi for the Block Editor**.
- Save button present.
- Browser DevTools → Network: REST round-trip to a `collapsi/v1`-namespaced route (or `/wp-json/wp/v2/settings`) returns 2xx.

Critically: the menu sidebar label should read **Collapsi**, NOT the slug `collapsi-for-block-editor`. If it shows the slug, Task 1 Step 3 had the round-1 bulk-replace bug — fix the `add_options_page()` arguments.

- [ ] **Step 3: Editor side — collapse a block**

Open any post in the Post Editor. Verify:
- Hovering a top-level block shows the chevron in the top-right.
- Clicking the chevron collapses the block to a 40-px bar.
- The collapsed bar's DOM class is `.collapsi-wrapper` (unchanged — brand prefix). Confirm via DevTools Elements panel.

- [ ] **Step 4: Persistence works**

Reload the editor. Previously-collapsed blocks remain collapsed. In DevTools → Application → Local Storage:
- Key `collapsi:v1:post:<id>` is present with a JSON value (unchanged — brand prefix).
- No key starting with the old slug exists from this session.

- [ ] **Step 5: PluginSidebar opens**

Click the Collapsi icon in the editor's right header. Sidebar opens with title "Collapsi" and the three action buttons. Each button performs its action.

- [ ] **Step 6: Keyboard shortcut works**

Press `Alt+Shift+C`. All top-level blocks toggle.

- [ ] **Step 7: Deactivate / uninstall cleanup**

Deactivate the plugin via Plugins page. Then "Delete" → confirm. Open WP DB and verify:
- `wp_options` does NOT contain a row with `option_name = 'collapsi_options'` (uninstall cleaned it).

Reactivate for further work.

---

## Task 10: GitHub — create new repo, push, archive old repo

**Files:** None modified locally; remote operations via `gh` CLI.

- [ ] **Step 1: Verify gh CLI is authenticated as devMoaz**

```powershell
gh auth status
```

Expected: logged in as devMoaz. If not, run `gh auth login`.

- [ ] **Step 2: Create the new public repo**

```powershell
gh repo create devMoaz/collapsi-for-block-editor --public --description "Editor-only collapse/expand for every block in the WordPress editor. Tame long posts and templates without losing your place." --homepage "https://wordpress.org/plugins/collapsi-for-block-editor/"
```

Expected: repo created at `github.com/devMoaz/collapsi-for-block-editor`. If the repo already exists from a prior attempt, this command errors — skip and continue.

- [ ] **Step 3: Update local git remote to point at the new repo**

The current `origin` still points at `devMoaz/collapsi-for-gutenberg`. Re-point it.

If gh CLI uses SSH (the working setup from round 1):

```powershell
git remote set-url origin git@github.com:devMoaz/collapsi-for-block-editor.git
```

If gh CLI uses HTTPS:

```powershell
git remote set-url origin https://github.com/devMoaz/collapsi-for-block-editor.git
```

Verify:

```powershell
git remote -v
```

Expected: `origin` points at the new repo URL on both fetch and push lines.

- [ ] **Step 4: Push the current branch + commits + tags to the new repo**

```powershell
git push -u origin main
```

Expected: all round-2 commits push to the new repo's `main`.

If `main` does not exist locally (default branch is `master`):

```powershell
git branch -M main
git push -u origin main
```

- [ ] **Step 5: Add topics**

```powershell
gh repo edit devMoaz/collapsi-for-block-editor --add-topic wordpress --add-topic wordpress-plugin --add-topic gutenberg --add-topic block-editor --add-topic productivity
```

- [ ] **Step 6: Confirm CI workflow file is present and is the 6-gate workflow**

```powershell
Test-Path '.github\workflows\ci.yml'
```

Expected: `True` (the file was pushed in Step 4). Open and verify it runs all six gates: phpcs, phpstan, lint:js, lint:css, jest, build.

- [ ] **Step 7: Tag v1.0.0 (delete and re-tag if a v1.0.0 already exists from round 1)**

```powershell
git tag -l "v1.0.0"
```

If output is `v1.0.0`:

```powershell
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0  # delete on the new remote if it propagated
```

Then re-tag fresh:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

- [ ] **Step 8: Create the GitHub Release with the dist zip attached**

```powershell
gh release create v1.0.0 `
  "dist\collapsi-for-block-editor-1.0.0.zip" `
  --title "v1.0.0 — Initial release" `
  --notes "First release. Editor-only collapse/expand for every block in the WordPress editor. Pending wp.org review."
```

Expected: release published at `github.com/devMoaz/collapsi-for-block-editor/releases/tag/v1.0.0` with the zip attached.

- [ ] **Step 9: Update old repo's README with deprecation notice and archive**

Clone the old repo to a separate working directory:

```powershell
$tmp = "$env:TEMP\old-collapsi-for-gutenberg"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
gh repo clone devMoaz/collapsi-for-gutenberg $tmp
Set-Content -Path "$tmp\README.md" -Encoding utf8 -Value @'
# Collapsi for Gutenberg Blocks → Renamed to Collapsi for the Block Editor

This repository has been renamed and rebranded as **Collapsi for the Block Editor**. All future development happens at:

https://github.com/devMoaz/collapsi-for-block-editor

The previous name contained "Gutenberg", which the WordPress.org plugin directory restricts in plugin names and slugs. This repository is preserved for reference only and will not receive updates.
'@
Set-Location $tmp
git add README.md
git commit -m "Deprecation notice — moved to collapsi-for-block-editor"
git push
Set-Location 'E:\projects\block-collapser\wp-content\plugins\collapsi-for-block-editor'
```

- [ ] **Step 10: Archive the old repo**

```powershell
gh repo archive devMoaz/collapsi-for-gutenberg --yes
```

Expected: repo is now archived (read-only).

- [ ] **Step 11: Verify both repos reflect the intended state**

```powershell
gh repo view devMoaz/collapsi-for-block-editor | Select-Object -First 10
gh repo view devMoaz/collapsi-for-gutenberg | Select-Object -First 10
```

Expected: new repo is public + active with the v1.0.0 release; old repo is public + archived with the deprecation README.

---

## Task 11: Hand off to user for wp.org submission

**Files:** None modified.

- [ ] **Step 1: Print the final artifacts**

Display these to the user:

1. **Local zip path:**
   `E:\projects\block-collapser\wp-content\plugins\collapsi-for-block-editor\dist\collapsi-for-block-editor-1.0.0.zip`
2. **Zip SHA256** (from Task 8 Step 4) — share for the user's records.
3. **New GitHub repo URL:**
   `https://github.com/devMoaz/collapsi-for-block-editor`
4. **GitHub Release URL** (from Task 10 Step 8).
5. **Archived repo URL:**
   `https://github.com/devMoaz/collapsi-for-gutenberg` (deprecation notice, read-only)
6. **Round-1 archived repo URL** (from prior round, unchanged):
   `https://github.com/devMoaz/block-collapser`

- [ ] **Step 2: Provide the upload URL and email reply text**

User uploads the zip at:

> https://wordpress.org/plugins/developers/add/

logged in as `devmoaz`. The upload page will run the automated pre-scan. Expected: **PASS** (no restricted terms in name or slug).

After upload, the user replies to the existing AUTOPREREVIEW email thread (the round-1 reply thread — same email chain, do not start a new one) with this text:

```
Hi,

Thanks for the review. I've addressed the feedback
and uploaded a new version.

Please reserve the new slug: collapsi-for-block-editor

The new display name is "Collapsi for the Block Editor".

Best,
Moaz
```

Five lines. No change-list. The reviewer re-reviews the whole plugin.

- [ ] **Step 3: Set timeline expectations**

The wp.org dashboard shows 82 plugins awaiting review (down from 104 last week). After the reply, the plugin continues its existing review slot. The next email from the WordPress Plugin Team should have the subject:

> [WordPress Plugin Directory] Review in Progress: Collapsi for the Block Editor

…or, if further issues, another *Review in Progress* email with feedback. Typical wait: 3–10 days.

---

## Self-Review (post-write)

I checked the plan against the spec:

**1. Spec coverage:**

- New identity table — every row covered: display name (Task 1.2, 3.1), slug (Task 1.3, 1.5, 3.2, 3.4), folder (Task 7.3), bootstrap file (Task 1.1), text domain (Task 1, Task 2, Task 3.4), Plugin URI (Task 1.2), package.json name + makepot (Task 3.2), composer.json (Task 3.3), option group (Task 1.5), admin slug constant (Task 1.3), phpcs.xml.dist (Task 3.4), POT (Task 6), dist zip (Task 8), readme.txt heading (Task 3.1), README.md title (Task 3.6), GitHub repo (Task 10), Playground blueprint (Task 3.7).
- Brand-prefix "stays the same" list — Task 4 Step 2 explicitly verifies these survived.
- readme.txt body policy — Task 3 Step 1 follows: heading + display-name replacements only, body Gutenberg mentions preserved.
- Audit pass — Task 4 implements the spec's audit section.
- Six verification gates — Task 5 implements them in the spec's documented order.
- GitHub strategy (new repo + archive) — Task 10.
- Build + Resubmit — Task 8 (build) + Task 11 (resubmit handoff).
- Acceptance criteria — all 9 spec criteria map to tasks (1→Task 1–3, 2→Task 4, 3→Task 5, 4→Task 5.7 + manual Plugin Check, 5→Task 9, 6→Task 8, 7→Task 10, 8→Task 10.9–10.10, 9→Task 11).

**2. Placeholder scan:** No "TBD", "TODO", or vague language. Task 1 Step 6/7 (`class-plugin.php`, `uninstall.php`) deliberately use grep-and-edit (deterministic mechanical operation) because we cannot enumerate every text-domain line without reading the file — this is not a placeholder, it's a procedure. Acceptable.

**3. Type consistency:** Identifiers are consistent across all tasks:
- New text domain: `collapsi-for-block-editor` (everywhere)
- New slug / option group / admin page slug: `collapsi-for-block-editor` (everywhere)
- Brand prefix (unchanged): `Collapsi`, `COLLAPSI_*`, `collapsi-editor`, `collapsi-editor-style`, `collapsi-settings`, `collapsi:v1`, `collapsi/v1`, `collapsi/settings`, `collapsiSettings`, `collapsi_options`.
- New repo: `devMoaz/collapsi-for-block-editor`
- New zip: `collapsi-for-block-editor-1.0.0.zip`
- New POT: `collapsi-for-block-editor.pot`

No issues found. Plan is ready to execute.
