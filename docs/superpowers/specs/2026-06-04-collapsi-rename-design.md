# Collapsi for Gutenberg Blocks — Rename Design

**Date:** 2026-06-04
**Driver:** WordPress Plugin Directory pre-review (AUTOPREREVIEW, 2026-06-03)
**Status:** Approved, ready to plan

## Why this rename

The plugin was submitted to wp.org on 2026-06-03 as **Block Collapser** (slug `block-collapser`). The automated pre-review pended the submission with three issues:

1. **Plugin name too generic.** `Block Collapser` is purely descriptive with no distinctive brand or identifier at the start. The reviewer's example fix (`DevMoaz Block Collapser`) was acceptable but personal-brand prefixed; user preferred a coined product name.
2. **Code prefix `block` too common.** Namespace `BlockCollapser` and constants `BLOCK_COLLAPSER_*` use the generic word "block" as the prefix — fails the reviewer's "≥4 chars, distinctive" rule for `define()`, `namespace`, `register_setting()` keys.
3. **Contributors mismatch.** `readme.txt` lists `Contributors: moazmahmoud` but the wp.org account that submitted is `devmoaz` (https://profiles.wordpress.org/devmoaz/). Bot flagged as informational; we fix it for consistency.

This document specifies the new identity, the full file-level rename map, the GitHub strategy, the audit/verification approach, and the wp.org resubmission steps.

## New identity (locked)

| Element | Old value | New value |
|---|---|---|
| Display name | Block Collapser | Collapsi for Gutenberg Blocks |
| wp.org slug | `block-collapser` | `collapsi-for-gutenberg` |
| Plugin folder | `wp-content/plugins/block-collapser/` | `wp-content/plugins/collapsi-for-gutenberg/` |
| PHP namespace | `BlockCollapser` | `Collapsi` |
| PHP constants | `BLOCK_COLLAPSER_VERSION`, `BLOCK_COLLAPSER_FILE`, `BLOCK_COLLAPSER_DIR`, `BLOCK_COLLAPSER_URL` | `COLLAPSI_VERSION`, `COLLAPSI_FILE`, `COLLAPSI_DIR`, `COLLAPSI_URL` |
| Text domain | `block-collapser` | `collapsi` |
| Option key (DB) | `block_collapser_settings` | `collapsi_settings` |
| Option group | `block_collapser_options` | `collapsi_options` |
| Admin page slug | `block-collapser` | `collapsi` |
| localStorage key | `block-collapser:v1:post:<id>` | `collapsi:v1:post:<id>` |
| CSS class prefix | `.block-collapser-*` | `.collapsi-*` |
| Script handles (`wp_register_script`) | `block-collapser-editor`, `block-collapser-settings` | `collapsi-editor`, `collapsi-settings` |
| Style handles (`wp_register_style`) | `block-collapser-editor`, `block-collapser-settings` | `collapsi-editor`, `collapsi-settings` |
| Contributors (readme.txt) | `moazmahmoud` | `devmoaz` |
| Plugin URI header | `github.com/devMoaz/block-collapser` | `github.com/devMoaz/collapsi-for-gutenberg` |
| package.json `"name"` | `block-collapser` | `collapsi-for-gutenberg` |
| composer.json `"name"` | `devmoaz/block-collapser` | `devmoaz/collapsi-for-gutenberg` |
| POT file | `languages/block-collapser.pot` | `languages/collapsi.pot` |
| Dist zip filename | `block-collapser-1.0.0.zip` | `collapsi-for-gutenberg-1.0.0.zip` |
| GitHub repo | `devMoaz/block-collapser` (will be archived) | new repo `devMoaz/collapsi-for-gutenberg` |
| Playground blueprint URL | points to old repo | updated to new repo |

## Scope: clean break, no backwards-compat

The plugin is **pending review** at wp.org — never approved, never publicly installed. The only existing install is the developer's local. Therefore:

- No migration code for the existing `block_collapser_settings` option (DB value is reset on activation under the new name).
- No backwards-compat shims for the old text domain, namespace, or constants.
- No alias loading of old CSS class names.
- Existing localStorage entries on the developer's browser get orphaned (harmless — they just stop being read).

This avoids cruft. We trust that we are the only user.

## Tasks & file map

### 1. Plugin header + bootstrap (`block-collapser.php`)

- Update header block: `Plugin Name`, `Plugin URI`, `Text Domain`.
- Rename constants and all references inside the file:
  - `BLOCK_COLLAPSER_VERSION` → `COLLAPSI_VERSION`
  - `BLOCK_COLLAPSER_FILE` → `COLLAPSI_FILE`
  - `BLOCK_COLLAPSER_DIR` → `COLLAPSI_DIR`
  - `BLOCK_COLLAPSER_URL` → `COLLAPSI_URL`
- Update bootstrap `\BlockCollapser\Plugin::instance()` → `\Collapsi\Plugin::instance()`.

### 2. PHP includes (`includes/*.php`)

- `includes/class-plugin.php`: change `namespace BlockCollapser;` → `namespace Collapsi;`. Update internal references.
- `includes/class-assets.php`: change namespace. Rename `wp_register_script` / `wp_register_style` handles and `wp_localize_script` JS object name. Update text-domain arg.
- `includes/class-settings.php`: change namespace. Update `OPTION_GROUP` constant to `collapsi_options`, `OPTION_NAME` constant to `collapsi_settings`. Update REST route base from `block-collapser/v1` to `collapsi/v1` (if used). Update text-domain args.
- `includes/class-admin-page.php`: change namespace. Update admin page slug to `collapsi`. Update text-domain args.

### 3. Uninstall (`uninstall.php`)

- Update `delete_option( 'block_collapser_settings' )` → `delete_option( 'collapsi_settings' )`.
- Multisite loop variables stay prefixed (`$block_collapser_sites`, `$block_collapser_site_id`) but get renamed to `$collapsi_sites`, `$collapsi_site_id`.

### 4. readme.txt

- Heading line: `=== Collapsi for Gutenberg Blocks ===`.
- `Contributors:` line → `devmoaz`.
- `Tags:` stays at 5: `block editor, gutenberg, productivity, ux, collapse`.
- Update short description and full description body to reference the new name. Keep tagline: *"Editor-only collapse/expand for every Gutenberg block. Tame long posts and templates without losing your place."*
- Update `== Development ==` section's GitHub link.
- FAQ section: anywhere "Block Collapser" appears in user-facing copy → "Collapsi for Gutenberg Blocks" (or just "Collapsi" inside body copy).

### 5. JS source (`src/**/*.js`)

- All `__( 'text', 'block-collapser' )` calls → `__( 'text', 'collapsi' )`. Same for `_x`, `_n`, `_nx`.
- localStorage key in `src/editor/utils/storage.js` (or wherever the key constant lives) — search-replace `block-collapser:v1:post:` → `collapsi:v1:post:`.
- Any hardcoded handle references (e.g., `wp.data.dispatch('core/interface').enableComplementaryArea('block-collapser', 'block-collapser/block-collapser')`) — these are the PluginSidebar registration name and pinned-area names. They take the plugin-name string. Update both to `collapsi`.
- Settings store registration in `src/settings/store.js` (or equivalent): change store key from `block-collapser/settings` to `collapsi/settings`. Update all `useSelect`/`useDispatch` consumers.
- Editor store key (if `core/block-editor` selectors are wrapped): same pattern.

### 6. SCSS source (`src/**/*.scss`)

- `.block-collapser-wrapper`, `.block-collapser-bar`, `.block-collapser-chevron`, `.block-collapser-preview`, `.block-collapser-appearance__grid`, `.block-collapser-appearance__preview-bar`, etc. → `.collapsi-*` equivalents.
- CSS custom properties: if any are named `--block-collapser-*`, rename to `--collapsi-*`.

### 7. Tests (`tests/unit/**/*.test.js`)

- Update any test that imports modules by relative path that depended on internal naming. Most tests should not be affected since paths are relative.
- Update any inline mock data using the old option key or text domain.

### 8. Build & tooling configs

- `package.json`: `"name": "collapsi-for-gutenberg"`.
- `composer.json`: `"name": "devmoaz/collapsi-for-gutenberg"`.
- `phpcs.xml.dist`: update text-domain rule's allowed value to `collapsi`.
- `phpstan.neon`: update any namespace-specific paths if present.
- `webpack.config.js`: no rename expected (entry points are file-path-based) — verify no hardcoded plugin name string.
- `.distignore` and `.gitattributes`: paths stay the same; no changes needed for the rename itself.

### 9. POT regeneration

- Run `wp i18n make-pot . languages/collapsi.pot --domain=collapsi` (or the `@wordpress/scripts` equivalent).
- Delete old `languages/block-collapser.pot`.

### 10. Playground blueprint (`_playground/blueprint.json`)

- Update the `plugins[*].resource` URL from `github.com/devMoaz/block-collapser/...` to `github.com/devMoaz/collapsi-for-gutenberg/...`.
- Update any pre-installed demo post mentions of the old name.

### 11. README.md (GitHub landing page)

- Update title to `# Collapsi for Gutenberg Blocks`.
- Update all references to the old name and old GitHub URL.
- Update the "Open in Playground" badge URL.

### 12. Plugin folder rename

- Move `wp-content/plugins/block-collapser/` → `wp-content/plugins/collapsi-for-gutenberg/`.
- Deactivate the old plugin in WP first to avoid orphaned activation state.
- Re-activate under the new path after rename.

## Audit pass (Phase 2 — catch-all)

After the rename, grep the whole codebase for any leftover strings — the reviewer warned *"there may be more names needing a prefix"*. Search patterns:

- `block_collapser` (snake_case)
- `block-collapser` (kebab-case)
- `BlockCollapser` (PascalCase)
- `BLOCK_COLLAPSER` (SCREAMING_SNAKE)
- `blockCollapser` (camelCase)

Anywhere these still appear (outside `.distignore`, `.gitattributes`, the design/plan/spec docs themselves, the old POT file backup, or the CHANGELOG / version history) gets renamed.

Also explicitly verify the following — these are the high-collision-risk surfaces from the WordPress side:

- All `add_action()` / `add_filter()` callback registrations — the hook NAMES if any are custom (they shouldn't be — we hook into core).
- All `do_action()` / `apply_filters()` calls — if the plugin emits any custom hooks for extensibility, they must be prefixed `collapsi/*`.
- All `register_rest_route()` calls — namespace argument must be `collapsi/v1` not `block-collapser/v1`.
- All `register_setting()` and `register_meta()` calls — group + key arguments.
- All `wp_register_script()`, `wp_register_style()`, `wp_enqueue_script()`, `wp_enqueue_style()` handles.
- All `wp_localize_script()` object names (the second argument).
- All `set_transient()` / `get_transient()` / `delete_transient()` keys.
- All `update_post_meta()` / `get_post_meta()` / `delete_post_meta()` keys (if any).

## GitHub strategy

### New repo: `devMoaz/collapsi-for-gutenberg`

- Create as **public** with description: *"Editor-only collapse/expand for every Gutenberg block. Tame long posts and templates without losing your place."*
- Push the renamed codebase as the initial commit (clean history — we are not carrying forward old commits since the plugin never shipped).
- Mirror the CI workflow from the old repo (all six gates: PHPCS, PHPStan, lint:js, lint:css, Jest, build).
- Tag `v1.0.0` and create a GitHub Release with `dist/collapsi-for-gutenberg-1.0.0.zip` attached.
- Set the repo description, homepage URL (https://wordpress.org/plugins/collapsi-for-gutenberg/ — won't resolve until wp.org approves, that's fine), and topics (`wordpress`, `wordpress-plugin`, `gutenberg`, `block-editor`, `productivity`).

### Old repo: `devMoaz/block-collapser`

- Update its `README.md` to a deprecation notice pointing to the new repo:
  > *"This repository has been renamed and rebranded as **Collapsi for Gutenberg Blocks**. All future development happens at [devMoaz/collapsi-for-gutenberg](https://github.com/devMoaz/collapsi-for-gutenberg). This repo is preserved for reference only."*
- Commit the deprecation README.
- Archive via `gh repo archive devMoaz/block-collapser --yes`.

Archived repos remain browseable as read-only — no link rot for anyone who shared the old URL.

## Verification gates (Phase 4)

All six must pass clean before building the dist zip. Order matters because PHP gates are cheaper to debug than JS gates:

1. `composer run phpcs` — WPCS 3.x + PHPCompatibilityWP. Zero errors, zero warnings.
2. `composer run phpstan` — level 8 with `szepeviktor/phpstan-wordpress`. Zero errors.
3. `npm run lint:js` — ESLint via `@wordpress/scripts`. Zero errors.
4. `npm run lint:css` — Stylelint. Zero errors.
5. `npm test` — Jest unit suite. All tests pass.
6. `npm run build` — production webpack build via `@wordpress/scripts build`. Bundle emits to `build/`.

### Manual smoke test (post-build)

In a local WP install, with the renamed plugin active:

1. Plugin activates without PHP notices in `debug.log`.
2. **Settings → Collapsi** appears in admin menu (new label).
3. Settings page loads with three tabs: General, Behaviour, Appearance. REST save works.
4. Open a post in the editor. Verify chevrons appear on all top-level blocks.
5. Click a chevron — block collapses into the 40px bar. New CSS class `.collapsi-wrapper` is present in the DOM.
6. Reload the page. Verify the collapsed state persists (localStorage key `collapsi:v1:post:<id>` present in DevTools → Application).
7. Open the Collapsi PluginSidebar (right-side panel). Verify Collapse All / Expand All / Focus Mode buttons work.
8. Press `Alt+Shift+C` — verify all top-level blocks toggle.
9. Deactivate the plugin. Verify no fatal errors.
10. Uninstall via *Plugins → Delete*. Verify the `collapsi_settings` option is removed from `wp_options`.

If any step fails, fix before continuing to build/submit.

## Build + Submit

### Build

PowerShell command (mirrors the existing dist-build flow):

```powershell
Remove-Item dist\collapsi-for-gutenberg-*.zip -ErrorAction SilentlyContinue
$src  = 'E:\projects\block-collapser\wp-content\plugins\collapsi-for-gutenberg'
$dest = "$src\dist\collapsi-for-gutenberg-1.0.0.zip"
# Honor .distignore via custom file list (existing pattern in repo)
# Compress-Archive included files only
```

(Exact PowerShell script lives in the existing build flow — the implementation plan will inline it.)

### Verify zip

- Total size ≤ 50 KB (last build was 29 KB).
- Includes: `LICENSE`, `collapsi-for-gutenberg.php` (renamed bootstrap), `readme.txt`, `uninstall.php`, `package.json`, `build/` (8 minified files), `includes/` (4 PHP files), `languages/collapsi.pot`.
- Excludes: `src/`, `tests/`, `docs/`, `assets/`, `dist/`, `node_modules/`, `vendor/`, `.distignore`, `.gitattributes`, `.github/`, all dotfiles.

### Resubmit

User performs these two steps:

1. **Upload** the new zip at [wordpress.org/plugins/developers/add/](https://wordpress.org/plugins/developers/add/), logged in as `devmoaz`. Pre-scan should PASS (as it did on first submission — none of the rename changes the security/quality profile).
2. **Reply** to the review email with this text exactly:

   ```
   Hi,

   Thanks for the review. I've addressed the feedback
   and uploaded a new version.

   Please reserve the new slug: collapsi-for-gutenberg

   The new display name is "Collapsi for Gutenberg Blocks".

   Best,
   Moaz
   ```

   Five lines. No change-list (the reviewer explicitly asked us not to enumerate changes — they re-review the whole plugin).

## What we are NOT doing

To prevent scope drift:

- **No new features.** The collapse/expand behavior, persistence, sidebar, shortcut, settings tabs, and uninstall logic stay exactly as they are. This is identifier renames only.
- **No README rewrites beyond the new name.** Tagline, features list, FAQ, install steps stay.
- **No screenshot recapture.** We recaptured screenshots in the previous session — they live in `assets/` and will be pushed to SVN `/assets/` after approval. The post #47 demo draft stays untouched.
- **No banner/icon design.** That work is in `docs/wp-org-listing-assets.md` as a post-launch task. Optional, not blocking.
- **No future-Block-Rules work.** Deferred plan at `docs/superpowers/plans/2026-06-02-future-block-rules.md` stays as-is for v1.1.
- **No localization beyond the POT file.** We regenerate the POT with the new domain; we don't add new translation files.
- **No backwards-compat code.** The plugin has never been publicly installed; there is no existing user to migrate.

## Acceptance criteria

This rename is complete when:

1. All twelve identifier categories in the "New identity" table are updated.
2. Grep returns zero hits for `block_collapser`, `block-collapser`, `BlockCollapser`, `BLOCK_COLLAPSER`, `blockCollapser` outside the explicitly-excluded paths (the .distignore/.gitattributes/spec docs).
3. All six verification gates pass with zero errors.
4. Manual smoke test passes all ten checks.
5. `dist/collapsi-for-gutenberg-1.0.0.zip` builds cleanly and contains only the runtime files.
6. New GitHub repo `devMoaz/collapsi-for-gutenberg` is live, public, CI is configured, `v1.0.0` Release is published with the dist zip attached.
7. Old GitHub repo `devMoaz/block-collapser` is archived with a deprecation README.
8. User has the final zip path and the email-reply text ready to hand off.

The wp.org submission itself (upload + email reply) is the user's responsibility — Claude does not have the auth to perform it.
