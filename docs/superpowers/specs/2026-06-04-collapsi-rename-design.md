# Collapsi for the Block Editor — Rename Design (Round 2)

**Date:** 2026-06-04
**Driver:** WordPress.org plugin submission form hard-blocked the upload of `Collapsi for Gutenberg Blocks` because the term **"Gutenberg"** is on the wp.org restricted-terms list and is forbidden in both the plugin display name and the slug. The reviewer's guideline that "for X" patterns are acceptable applies to *human review*, but the automated upload pre-check is stricter and rejects the zip outright before it ever reaches a human reviewer.
**Status:** Approved, ready to plan
**Replaces:** the previous content of this file, which documented the round-1 rename `block-collapser → collapsi-for-gutenberg`. That rename is complete and merged; this file now documents the round-2 rename `collapsi-for-gutenberg → collapsi-for-block-editor`. The round-1 work survives in git history.

## Why this rename

The plugin was renamed to **Collapsi for Gutenberg Blocks** (slug `collapsi-for-gutenberg`) on 2026-06-04 in response to the AUTOPREREVIEW email from 2026-06-03. All six gates passed, the dist zip was built, and the user attempted to upload it at [wordpress.org/plugins/developers/add/](https://wordpress.org/plugins/developers/add/).

The submission form rejected the upload with this exact message:

> Your chosen plugin name – Collapsi for Gutenberg Blocks – contains the restricted term **"gutenberg"**, which cannot be used at all in your plugin permalink nor the display name. To proceed with this submission you must change your Plugin Name: line in both your main plugin file and readme to abide by these requirements. Do not attempt to work around this by removing letters or using numbers — those are seen as intentional actions to avoid our restrictions, and are not permitted.

The restriction is enforced at the pre-upload gate, not at human review. No amount of "for X" framing changes the outcome. The only remediation is to remove "Gutenberg" from the plugin display name and slug. The plugin body (readme.txt description, tags, FAQ) may continue to mention Gutenberg — that is explicitly allowed and SEO-valuable, since "Gutenberg" is the term users actually search for.

The new identity replaces "Gutenberg" with "Block Editor" — the official, trademark-clean WordPress term that wp.org's own documentation uses interchangeably with the editor's project codename.

### Name safety verification

| Check | Result |
|---|---|
| Slug `collapsi-for-block-editor` available on wp.org | ✅ Zero matches on wp.org plugin search |
| Display name "Collapsi" / "Collapsi for the Block Editor" not taken | ✅ No plugin named Collapsi exists (only generic "Collapse X" / "Collapsing X") |
| "Block Editor" on any restricted-terms list | ✅ Not restricted. wp.org's [Block-Specific Plugin Guidelines](https://developer.wordpress.org/plugins/wordpress-org/block-specific-plugin-guidelines/) and [Detailed Plugin Guidelines](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/) use the term throughout. Restrictions target other-company trademarks (Facebook, etc.), "WP" prefixes, and the codename "Gutenberg". |
| Slug starts with a distinctive brand term | ✅ `collapsi-*` matches the reviewer's own correction pattern (brand-first, generic-suffix). Slug does not begin with another product's term. |

Verdict: green light on all axes. This name will pass the upload form, Plugin Check, and human review.

## New identity (locked)

| Element | Old value (round 1 → current) | New value (round 2 → target) |
|---|---|---|
| Display name | Collapsi for Gutenberg Blocks | **Collapsi for the Block Editor** |
| wp.org slug | `collapsi-for-gutenberg` | `collapsi-for-block-editor` |
| Plugin folder | `wp-content/plugins/collapsi-for-gutenberg/` | `wp-content/plugins/collapsi-for-block-editor/` |
| Bootstrap file | `collapsi-for-gutenberg.php` | `collapsi-for-block-editor.php` |
| Text domain (PHP + JS i18n calls + `wp_set_script_translations`) | `collapsi-for-gutenberg` | `collapsi-for-block-editor` |
| Plugin URI header | `https://github.com/devMoaz/collapsi-for-gutenberg` | `https://github.com/devMoaz/collapsi-for-block-editor` |
| package.json `"name"` | `collapsi-for-gutenberg` | `collapsi-for-block-editor` |
| composer.json `"name"` | `devmoaz/collapsi-for-gutenberg` | `devmoaz/collapsi-for-block-editor` |
| Settings API option group (first arg to `register_setting()`) | `collapsi-for-gutenberg` | `collapsi-for-block-editor` |
| Admin page slug constant (`Admin_Page::SLUG`) | `collapsi-for-gutenberg` | `collapsi-for-block-editor` |
| phpcs.xml.dist text-domain pin | `collapsi-for-gutenberg` | `collapsi-for-block-editor` |
| phpcs.xml.dist ruleset name + description + `<file>` | `collapsi-for-gutenberg.php` | `collapsi-for-block-editor.php` |
| POT file | `languages/collapsi-for-gutenberg.pot` | `languages/collapsi-for-block-editor.pot` |
| package.json `makepot` script | `--slug=collapsi-for-gutenberg --domain=collapsi-for-gutenberg` | `--slug=collapsi-for-block-editor --domain=collapsi-for-block-editor` |
| Dist zip filename | `dist/collapsi-for-gutenberg-1.0.0.zip` | `dist/collapsi-for-block-editor-1.0.0.zip` |
| readme.txt heading | `=== Collapsi for Gutenberg Blocks ===` | `=== Collapsi for the Block Editor ===` |
| README.md (GitHub landing) title | `# Collapsi for Gutenberg Blocks` | `# Collapsi for the Block Editor` |
| GitHub repo | `devMoaz/collapsi-for-gutenberg` (will be archived after this round) | new repo `devMoaz/collapsi-for-block-editor` |
| Playground blueprint `plugins[*].resource` URL | points to `collapsi-for-gutenberg` repo | points to `collapsi-for-block-editor` repo |

## Stays the same (brand prefix — survives this rename)

The previous rename decoupled the brand prefix (`collapsi-*`) from the slug suffix (`-for-gutenberg`). Round 2 only touches the slug suffix; the brand prefix is untouched. This is why the previous rename was a good investment.

- **PHP namespace** `Collapsi`
- **PHP constants** `COLLAPSI_VERSION`, `COLLAPSI_FILE`, `COLLAPSI_DIR`, `COLLAPSI_URL`
- **CSS class prefix** `.collapsi-*` (including `.collapsi-wrapper`, `.collapsi-bar`, `.collapsi-chevron`, `.collapsi-preview`, `.collapsi-appearance__*`)
- **CSS custom properties** `--collapsi-*` (if any)
- **localStorage key** `collapsi:v1:post:<id>`
- **DB option key** `collapsi_options` (the `OPTION_NAME` constant value passed to `add_option()` / `register_setting()` first arg)
- **Script handles** `collapsi-editor`, `collapsi-settings`
- **Style handles** `collapsi-editor`, `collapsi-settings` (same string, separate enqueue)
- **REST route namespace** `collapsi/v1`
- **`wp_localize_script` object name** `collapsiSettings`
- **PluginSidebar registration name** `collapsi` and pinned-area name `collapsi/collapsi`
- **`@wordpress/data` store key** `collapsi/settings`

## Scope: clean break, no backwards-compat

Same posture as round 1. The plugin is **pending review** at wp.org — never approved, never publicly installed. The only existing install is the developer's local. Therefore:

- No migration code for the existing `collapsi_options` DB value (option key is unchanged anyway — it's brand-prefixed, not slug-prefixed).
- No backwards-compat shims for the old text domain.
- No alias loading of old handles, store keys, or admin page slugs.
- No legacy redirects in the Plugin Slug ecosystem (admin page slug change orphans any bookmarked `wp-admin/options-general.php?page=collapsi-for-gutenberg` link — the developer's only).

This avoids cruft. We are the only user.

## readme.txt body policy

The wp.org upload form's restriction targets only the **Plugin Name line** and **slug** — not the readme body. Body mentions of "Gutenberg" are explicitly allowed and improve discoverability because "Gutenberg" is the term most users search for. Policy:

- **Plugin Name line / heading** → `Collapsi for the Block Editor`
- **Short description (≤150 chars)** → rephrase to use "Block Editor" as the primary label, mention "Gutenberg" parenthetically once if it fits
- **Long description body** → keep current "Gutenberg" mentions where they read naturally
- **Tags (5 max)** → keep `gutenberg`, add `block editor` if there is room; drop the weakest tag to make room if the current 5 are taken. Target tag set: `block editor, gutenberg, productivity, ux, collapse`
- **FAQ** → no rewrites
- **`== Development ==` section** → update GitHub URL to new repo

## Tasks & file map

### 1. Plugin header + bootstrap (`collapsi-for-gutenberg.php` → `collapsi-for-block-editor.php`)

- Rename the file itself.
- Update `Plugin Name:` header to `Collapsi for the Block Editor`.
- Update `Plugin URI:` header to `https://github.com/devMoaz/collapsi-for-block-editor`.
- Update `Text Domain:` header to `collapsi-for-block-editor`.
- All `COLLAPSI_*` constants stay (brand-prefix, not slug).
- Bootstrap call `\Collapsi\Plugin::instance()->boot()` stays.

### 2. PHP includes (`includes/*.php`)

- **`includes/class-plugin.php`**: namespace `Collapsi` stays. No changes expected — verify no slug-shaped strings.
- **`includes/class-assets.php`**:
  - `wp_set_script_translations( self::HANDLE, 'collapsi-for-gutenberg' )` → `'collapsi-for-block-editor'` (both editor and settings bundles).
  - Handle constants `HANDLE = 'collapsi-editor'` and `STYLE_HANDLE = 'collapsi-editor-style'` stay.
- **`includes/class-settings.php`**:
  - `OPTION_GROUP = 'collapsi-for-gutenberg'` → `'collapsi-for-block-editor'`.
  - `OPTION_NAME = 'collapsi_options'` stays (brand prefix; this is the `register_setting()` second-arg / `wp_options` row name).
  - REST route namespace `'collapsi/v1'` stays.
  - All `__()` / `esc_html__()` / `esc_attr__()` calls: second arg `'collapsi-for-gutenberg'` → `'collapsi-for-block-editor'`.
- **`includes/class-admin-page.php`**:
  - `SLUG = 'collapsi-for-gutenberg'` → `'collapsi-for-block-editor'`.
  - All `__()` calls: text-domain arg → `'collapsi-for-block-editor'`.
  - Menu page title stays `'Collapsi for the Block Editor'` (mirrors the new display name); menu label stays `'Collapsi'`. **Eyeball every replacement in this file** — a previous bulk replace turned `__( 'Collapsi', 'collapsi' )` into the slug as a label. Do not let that happen again.
  - `'settings_page_' . self::SLUG` enqueue-guard stays correct because it derives from the constant.

### 3. Uninstall (`uninstall.php`)

- `delete_option( 'collapsi_options' )` stays (option key is brand-prefixed).
- Multisite loop variable names `$collapsi_sites` / `$collapsi_site_id` stay.
- No text-domain strings expected here; verify with grep.

### 4. readme.txt

- Heading: `=== Collapsi for the Block Editor ===`.
- `Contributors:` stays `devmoaz` (fixed in round 1).
- `Tags:` confirm 5 or fewer, target set `block editor, gutenberg, productivity, ux, collapse`.
- Short description: rephrase per readme body policy above.
- Long description body: leave existing Gutenberg references where natural; replace any literal `Collapsi for Gutenberg Blocks` display-name occurrences with `Collapsi for the Block Editor`.
- `== Development ==` section: update GitHub link to `https://github.com/devMoaz/collapsi-for-block-editor`.

### 5. JS source (`src/**/*.js`)

- All `__( 'text', 'collapsi-for-gutenberg' )` calls → `__( 'text', 'collapsi-for-block-editor' )`. Same for `_x`, `_n`, `_nx`, `sprintf` wrappers.
- `STORAGE_PREFIX = 'collapsi:v1'` in `src/editor/store/persistence.js` stays (brand-prefixed).
- `@wordpress/data` store key `'collapsi/settings'` stays.
- PluginSidebar registration name `'collapsi'` and pinned-area pair `('collapsi', 'collapsi/collapsi')` stay.
- `window.collapsiSettings` reads stay.
- Grep `src/` for the literal string `collapsi-for-gutenberg` — any remaining hit is a text-domain arg.

### 6. SCSS source (`src/**/*.scss`)

- No changes expected. CSS class prefix `.collapsi-*` and custom properties `--collapsi-*` are brand-prefixed.
- Grep `src/` for `collapsi-for-gutenberg` to confirm zero hits.

### 7. Tests (`tests/unit/**/*.test.js`)

- Inline mock data that mentions the text domain → update.
- Snapshot files referencing the display name → regenerate via `npm test -- -u` if any exist (current suite has zero snapshots per round-1 verification).
- PHP test bootstrap `tests/phpstan-bootstrap.php`: update `COLLAPSI_FILE` default to point at the new bootstrap filename (`collapsi-for-block-editor.php`).

### 8. Build & tooling configs

- **`package.json`**:
  - `"name": "collapsi-for-block-editor"`.
  - `"description"`: keep current tagline, swap display name occurrences.
  - `makepot` script: `wp i18n make-pot . languages/collapsi-for-block-editor.pot --slug=collapsi-for-block-editor --domain=collapsi-for-block-editor`.
- **`composer.json`**: `"name": "devmoaz/collapsi-for-block-editor"`.
- **`phpcs.xml.dist`**:
  - `<ruleset name="Collapsi for the Block Editor">`.
  - `<description>` updated.
  - `<file>collapsi-for-block-editor.php</file>` (bootstrap file path).
  - Text-domain pin: `<element value="collapsi-for-block-editor"/>`.
- **`phpstan.neon`**: verify no slug-shaped paths.
- **`webpack.config.js`**: grep comments for the literal `Collapsi for Gutenberg Blocks` — update to `Collapsi for the Block Editor`. No code changes expected (entry points are file-path-based).
- **`.distignore`**: no changes — patterns are path-based.

### 9. POT regeneration

- Run `npm run makepot` to produce `languages/collapsi-for-block-editor.pot`.
- Delete `languages/collapsi-for-gutenberg.pot`.

### 10. Playground blueprint (`_playground/blueprint.json` if present)

- Update `plugins[*].resource` URL from `github.com/devMoaz/collapsi-for-gutenberg/...` to `github.com/devMoaz/collapsi-for-block-editor/...`.

### 11. README.md (GitHub landing page)

- Title `# Collapsi for the Block Editor`.
- All `Collapsi for Gutenberg Blocks` display-name occurrences → `Collapsi for the Block Editor`.
- All `collapsi-for-gutenberg` repo-URL occurrences → `collapsi-for-block-editor`.
- "Open in Playground" badge URL updated.

### 12. Plugin folder rename

- Move `wp-content/plugins/collapsi-for-gutenberg/` → `wp-content/plugins/collapsi-for-block-editor/`.
- Deactivate the plugin in WP admin first to release any file handles.
- Stop any running `npm start` / `composer` / background watchers before the rename (round-1 hit a file-lock retry — pre-empt it this time).
- Re-activate under the new path after rename.

## Audit pass (Phase 2 — catch-all)

After the rename, grep the whole codebase (excluding `node_modules/`, `vendor/`, `build/`, `dist/`, `.git/`, and the spec/plan docs themselves) for residual occurrences of:

- `collapsi-for-gutenberg` (kebab — slug, text domain, repo URL, file)
- `Collapsi for Gutenberg Blocks` (display name)
- `collapsi-for-gutenberg.php` (old bootstrap filename, if any literal references)
- `collapsiForGutenberg` (camelCase — should not exist but check)
- `CollapsiForGutenberg` (PascalCase — should not exist but check)
- `collapsi_for_gutenberg` (snake_case — should not exist but check)

Any hit outside excluded paths gets renamed.

Explicitly verify these high-collision-risk surfaces:

- All `register_setting()` calls — `option_group` (first arg) must equal `collapsi-for-block-editor`; `option_name` (second arg) stays `collapsi_options`.
- All `register_rest_route()` calls — namespace argument stays `collapsi/v1` (brand-prefixed); confirm none accidentally use the slug.
- All `add_options_page()` / `add_menu_page()` calls — slug argument must equal `collapsi-for-block-editor`.
- All `wp_set_script_translations()` calls — text-domain argument must equal `collapsi-for-block-editor`.
- All `wp_register_script()` / `wp_register_style()` / `wp_enqueue_script()` / `wp_enqueue_style()` handles stay `collapsi-editor` / `collapsi-settings` / `collapsi-editor-style` (brand-prefixed) — confirm none drift to slug-shaped values.
- `wp_localize_script()` object name stays `collapsiSettings`.

Body content in `readme.txt` that mentions "Gutenberg" as a concept is intentionally preserved per the readme body policy above; do not flag those as hits.

## GitHub strategy

### New repo: `devMoaz/collapsi-for-block-editor`

- Create as **public** with description: *"Editor-only collapse/expand for every block in the WordPress editor. Tame long posts and templates without losing your place."*
- Push the renamed codebase as the initial commit (clean history — the plugin has not shipped).
- Mirror the 6-gate CI workflow from `collapsi-for-gutenberg`.
- Tag `v1.0.0` and create a GitHub Release with `dist/collapsi-for-block-editor-1.0.0.zip` attached.
- Set repo description, homepage URL (`https://wordpress.org/plugins/collapsi-for-block-editor/` — will 404 until wp.org approves, expected), and topics (`wordpress`, `wordpress-plugin`, `gutenberg`, `block-editor`, `productivity`).

### Old repo: `devMoaz/collapsi-for-gutenberg`

- Replace `README.md` with a deprecation notice:
  > *"This repository has been renamed and rebranded as **Collapsi for the Block Editor**. All future development happens at [devMoaz/collapsi-for-block-editor](https://github.com/devMoaz/collapsi-for-block-editor). This repo is preserved for reference only. The previous name contained 'Gutenberg' which the wp.org plugin directory restricts."*
- Commit the deprecation README.
- Archive via `gh repo archive devMoaz/collapsi-for-gutenberg --yes`.

### Already-archived: `devMoaz/block-collapser`

- No action. The round-1 deprecation README already points to `collapsi-for-gutenberg`; following the chain `block-collapser → collapsi-for-gutenberg → collapsi-for-block-editor` is acceptable repo archaeology.

## Verification gates (Phase 4)

All six must pass clean before building the dist zip. Same order as round 1 (PHP gates cheaper to debug):

1. `composer run phpcs` — WPCS 3.x + PHPCompatibilityWP. Zero errors, zero warnings.
2. `composer run phpstan` — level 8 with `szepeviktor/phpstan-wordpress`. Zero errors.
3. `npm run lint:js` — ESLint via `@wordpress/scripts`. Zero errors.
4. `npm run lint:css` — Stylelint. Zero errors.
5. `npm test` — Jest unit suite. All tests pass.
6. `npm run build` — production webpack build. Bundle emits to `build/`.

Then run Plugin Check (`wp plugin check collapsi-for-block-editor` if WP-CLI available, or via the wp-admin Plugin Check UI). Expected: zero errors, the same "trademark" warning we documented in round 1 may still appear because Plugin Check is conservative — verify the only flagged term is now "block editor" (allowed) and not "gutenberg" (would be a regression).

### Manual smoke test (post-build)

In a local WP install, with the renamed plugin active:

1. Plugin activates without PHP notices in `debug.log`.
2. **Settings → Collapsi** menu entry appears (label stays "Collapsi", not the new slug).
3. Settings page loads with three tabs: General, Behaviour, Appearance. REST save works (uses `collapsi/v1` route).
4. Open a post in the editor. Verify chevrons appear on all top-level blocks.
5. Click a chevron — block collapses into the 40px bar. `.collapsi-wrapper` class still present in DOM.
6. Reload — collapsed state persists (`collapsi:v1:post:<id>` present in DevTools → Application → localStorage).
7. Open Collapsi PluginSidebar — Collapse All / Expand All / Focus Mode buttons work.
8. `Alt+Shift+C` toggles all top-level blocks.
9. Deactivate — no fatal errors.
10. Uninstall via *Plugins → Delete* — `collapsi_options` removed from `wp_options`.

If any step fails, fix before building/submitting.

## Build + Resubmit

### Build

PowerShell script (same pattern as round 1, only filenames change):

```powershell
Remove-Item dist\collapsi-for-block-editor-*.zip -ErrorAction SilentlyContinue
if (-not (Test-Path 'dist')) { New-Item -ItemType Directory dist | Out-Null }
$src  = 'E:\projects\block-collapser\wp-content\plugins\collapsi-for-block-editor'
$dest = "$src\dist\collapsi-for-block-editor-1.0.0.zip"
# Honor .distignore via the existing file-list builder helper
```

(Exact PowerShell script lives in the build flow — the implementation plan inlines it.)

### Verify zip

- Total size ≤ 50 KB (round-1 build was 29 KB; identifier-only changes should not move the needle).
- Includes: `LICENSE`, `collapsi-for-block-editor.php` (renamed bootstrap), `readme.txt`, `uninstall.php`, `package.json`, `build/` (8 minified files), `includes/` (4 PHP files), `languages/collapsi-for-block-editor.pot`.
- Excludes: `src/`, `tests/`, `docs/`, `assets/`, `dist/`, `node_modules/`, `vendor/`, `.distignore`, `.gitattributes`, `.github/`, all dotfiles.

### Resubmit

**Important constraint:** The wp.org dashboard shows *"You have 1 plugin being actively reviewed and have been sent an email regarding issues. You must complete this review before you can submit another plugin."* — this refers to the original `block-collapser` submission queued on 2026-06-03. We cannot start a fresh submission; we must continue the existing review by uploading the new zip at the same `developers/add/` form (the form is reused for the same submission) and replying to the existing review email.

User performs these two steps:

1. **Upload** the new zip at [wordpress.org/plugins/developers/add/](https://wordpress.org/plugins/developers/add/), logged in as `devmoaz`. Pre-scan should PASS (no restricted terms in name or slug).
2. **Reply** to the original AUTOPREREVIEW email thread (subject thread for `block-collapser`) with this text exactly:

   ```
   Hi,

   Thanks for the review. I've addressed the feedback
   and uploaded a new version.

   Please reserve the new slug: collapsi-for-block-editor

   The new display name is "Collapsi for the Block Editor".

   Best,
   Moaz
   ```

   Five lines. No change-list. The reviewer re-reviews the whole plugin and does not want a diff.

## What we are NOT doing

To prevent scope drift:

- **No new features.** Identifier renames only.
- **No README rewrites beyond the new name and GitHub URL.**
- **No screenshot recapture.** Existing `assets/` screenshots stay; they show the editor UI which is unchanged.
- **No banner/icon design.** Optional post-launch work, not blocking.
- **No future-Block-Rules work.** Deferred plan at `docs/superpowers/plans/2026-06-02-future-block-rules.md` stays as-is.
- **No localization beyond the POT file.** Regenerate POT, do not add `.po` / `.mo` files.
- **No backwards-compat code.** Plugin has never been publicly installed.
- **No editing of round-1 history.** Git history of `block-collapser → collapsi-for-gutenberg` stays intact; this is a forward-only rename.

## Acceptance criteria

This rename is complete when:

1. All identifier categories in the "New identity" table are updated to round-2 target values.
2. Grep returns zero hits for `collapsi-for-gutenberg`, `Collapsi for Gutenberg Blocks`, and the camel/Pascal/snake variants outside excluded paths.
3. All six verification gates pass with zero errors.
4. Plugin Check shows no "gutenberg" flag (Block Editor warning, if any, is acceptable).
5. Manual smoke test passes all ten checks.
6. `dist/collapsi-for-block-editor-1.0.0.zip` builds cleanly and contains only the runtime files.
7. New GitHub repo `devMoaz/collapsi-for-block-editor` is live, public, CI configured, `v1.0.0` Release published with the dist zip attached.
8. Old GitHub repo `devMoaz/collapsi-for-gutenberg` is archived with a deprecation README pointing at the new repo.
9. User has the final zip path and the email-reply text ready to hand off.

The wp.org submission itself (upload + email reply) is the user's responsibility — Claude does not have the auth to perform it.
