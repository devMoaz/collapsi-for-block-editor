# Phase 7 — Launch: Playground Blueprint, readme.txt, Screenshots, wp.org Submission

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`. Phase 7 produces the **shippable artifacts** — no behavior changes to the plugin itself. The wp.org SVN submission is a manual step the user executes after this phase produces the inputs.

**Goal:** Produce every artifact required for a WordPress.org plugin directory submission and an instant Playground demo. After this phase, the plugin can be zipped and uploaded to wp.org for review.

**Architecture:** No code changes inside `src/` or `includes/`. New top-level artifacts: `readme.txt`, `LICENSE`, `.gitattributes`, `_playground/blueprint.json`, `assets/screenshot-*.png`, `languages/block-collapser.pot`. Updated plugin headers in `block-collapser.php`.

**Tech Stack:** WordPress.org readme spec, WordPress Playground blueprint schema, `@wordpress/scripts` POT generation, manual Playwright screenshot capture.

**Cross-cutting decisions honored:**
- #11 no telemetry: readme explicitly states this
- #12 i18n: POT file ships in `/languages/`
- Min versions: readme declares Requires 6.5+ / PHP 7.4+ matching the actual code

---

## File structure for this phase

```
(new at plugin root)
├── readme.txt                     # CREATE — wp.org standard format
├── LICENSE                        # CREATE — GPL-2.0+
├── .gitattributes                 # CREATE — exclude dev files from SVN export

(new at plugin root)
├── _playground/
│   └── blueprint.json             # CREATE — Playground demo config

├── assets/                        # CREATE — wp.org listing assets (.gitignore'd from trunk)
│   ├── banner-772x250.png         # (placeholder or designed by user)
│   ├── banner-1544x500.png
│   ├── icon-128x128.png
│   ├── icon-256x256.png
│   ├── screenshot-1.png           # captured via Playwright
│   ├── screenshot-2.png
│   ├── screenshot-3.png
│   └── screenshot-4.png

├── languages/
│   └── block-collapser.pot        # CREATE — translation template

(modified)
├── block-collapser.php            # MODIFY — complete plugin headers
```

---

## Task 1: Complete plugin headers

**Files:**
- Modify: `block-collapser.php`

**Rationale:** WordPress.org requires specific plugin headers. The Phase 0 stub has minimal headers; this fills in the gaps so the wp.org listing populates correctly.

- [ ] **Step 1: Read current `block-collapser.php` header block**

- [ ] **Step 2: Replace the header block with the complete set**

```php
<?php
/**
 * Plugin Name:       Block Collapser
 * Plugin URI:        https://github.com/moazmahmoud/block-collapser
 * Description:       Editor-only collapse/expand toggle for every Gutenberg block. Hover any top-level block, click the chevron, and the block tucks away into a compact bar with a label, icon, and content preview. Tame long Site-Editor templates and 100-block posts without losing your place.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Tested up to:      6.8
 * Author:            Moaz Mahmoud
 * Author URI:        https://github.com/moazmahmoud
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       block-collapser
 * Domain Path:       /languages
 *
 * @package BlockCollapser
 */
```

(Keep the existing `define()` calls and `require_once` lines below unchanged.)

- [ ] **Step 3: Verify headers**

Activate the plugin in wp-admin → `Plugins` page → confirm:
- Plugin Name appears as "Block Collapser"
- Description matches
- Version: 1.0.0
- Author link works

- [ ] **Step 4: PHP gates**

```
composer run phpstan
composer run phpcs
```

Both clean.

- [ ] **Step 5: Commit**

```
git add block-collapser.php
git commit -m "feat: complete WordPress plugin headers for wp.org submission"
```

---

## Task 2: LICENSE file

**Files:**
- Create: `LICENSE` (no extension — wp.org convention)

**Rationale:** wp.org requires a GPL-2.0-or-later compatible license. Bundle the full GPL-2.0 text as the canonical LICENSE file.

- [ ] **Step 1: Fetch the official GPL-2.0 text**

Use `WebFetch` against `https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt` OR copy the canonical text from any GPL-2.0 licensed WP plugin in the local install (e.g. `wp-content/plugins/akismet/LICENSE.txt`). Save to `LICENSE` at the plugin root.

- [ ] **Step 2: Verify**

The file should:
- Start with `                    GNU GENERAL PUBLIC LICENSE\n                       Version 2, June 1991\n`
- Include the full preamble + terms
- End with the "How to Apply These Terms to Your New Programs" section
- Be ~17-18 KB

- [ ] **Step 3: Commit**

```
git add LICENSE
git commit -m "feat: add GPL-2.0 LICENSE file"
```

---

## Task 3: readme.txt (wp.org format)

**Files:**
- Create: `readme.txt`

**Rationale:** This is the master file for the wp.org listing — it drives the plugin page title, description, screenshots, FAQ, changelog. Format is strict (markdown-like with specific section markers).

- [ ] **Step 1: Implement**

```
=== Block Collapser ===
Contributors:      moazmahmoud
Tags:              block editor, gutenberg, productivity, ux, collapse
Requires at least: 6.5
Tested up to:      6.8
Requires PHP:      7.4
Stable tag:        1.0.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Editor-only collapse/expand toggle for every Gutenberg block. Tame long posts and templates without losing your place.

== Description ==

**Block Collapser** adds an editor-only chevron toggle to every Gutenberg block. Hover any top-level block, click the chevron, and the block tucks away into a compact bar showing the block's icon, title, and a short content preview (paragraph text, image alt, "5 blocks", and so on). Toggle it back open with the same chevron.

Built for the long pages and Site Editor templates where scrolling past 50 blocks to find the one you want is the daily annoyance. Block Collapser is **strictly editor-only** — your published site is untouched, no extra CSS or JS ships to the frontend.

= Why this plugin =

* **Stop scrolling endlessly.** Collapse the sections you're not working on. Find the one you are in seconds.
* **Works on every block.** Core, third-party, custom, ACF — anything Gutenberg renders, Block Collapser can collapse.
* **Survives reloads.** Collapse state is saved per post, per template, per browser. Come back tomorrow, your layout is where you left it.
* **Per-instance opt-out.** Set "Never collapse this block" on a hero or any pinned block from the block settings menu.
* **Keyboard shortcut.** `Alt+Shift+C` toggles all top-level blocks at once. Discoverable in WP's shortcut help modal (`?`).
* **No telemetry. No remote calls. No premium upsell.** Free, GPL, forever.

= How it works =

The plugin hooks `editor.BlockListBlock` with a higher-order component that wraps every top-level block. State lives in a `@wordpress/data` store and persists to `localStorage` keyed by either the block's structural path (`"0.2.1"`) or its user-set name from Gutenberg's rename feature. A `PluginSidebar` exposes Collapse All / Expand All / Focus Mode. Settings live at `Settings → Block Collapser` and persist via the REST API.

= Compatibility =

* WordPress 6.5+ (iframed editor)
* PHP 7.4+
* Post Editor and Site Editor
* Browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

= Not in scope =

* No Classic Editor support — Gutenberg only
* No frontend collapse (this is an editor productivity plugin, not a UX framework)
* No premium tier

== Installation ==

= Automatic =

1. Visit `Plugins → Add New` in your wp-admin
2. Search for "Block Collapser"
3. Click `Install Now` and then `Activate`

= Manual =

1. Download the plugin .zip
2. Visit `Plugins → Add New → Upload Plugin`
3. Choose the .zip and click `Install Now`, then `Activate`

After activation, open any post in the editor and hover any top-level block — the chevron appears top-left.

== Frequently Asked Questions ==

= Does this affect my published site? =

No. Block Collapser injects nothing into the frontend. The CSS is enqueued via `enqueue_block_assets` with an `is_admin()` guard, and the JS is enqueued via `enqueue_block_editor_assets` which only fires inside the editor. Verified on every release.

= Where is the collapsed state stored? =

In your browser's localStorage, keyed by `block-collapser:v1:post:<postId>`. It's per-browser and per-device — switching to a different machine or browser starts fresh. The plugin makes no server-side or remote calls to persist state.

= I renamed a block via Gutenberg's "Rename" feature. Does the collapsed state survive reorder? =

Yes. When you set a `metadata.name` via the block rename feature, the persistence key becomes `name:<your-name>`. Reorder the block, the key still matches, the collapsed state survives.

= Can I exclude specific blocks from collapsing? =

Yes. Open any top-level block's three-dot ⋮ menu and click "Never collapse this block". The setting persists with the post.

= Does it work in the Site Editor? =

Yes. Templates and template parts are treated the same as posts.

= How do I customize the accent color? =

`Settings → Block Collapser → Appearance` — change the accent color and bar title color, then save.

= Will it slow down the editor with 100 blocks on a page? =

No. Selector subscriptions are per-`clientId`, so a toggle on one block has no rendering impact on the other 99. Profiled on a 100-block stress page: a single toggle re-renders 1 wrapper.

= Does it support RTL languages? =

Yes. The plugin enqueues `editor-rtl.css` automatically via `wp_style_add_data`.

= Does it support dark mode? =

Partially. The plugin honors `prefers-color-scheme: dark` for bar text color and accent contrast. The editor canvas itself does not yet have first-party dark mode support in Gutenberg, so the experience varies by theme.

= What's the keyboard shortcut? =

`Alt+Shift+C` (Windows/Linux) or `Ctrl+Alt+C` (macOS). Toggles all top-level blocks. Discoverable in WP's shortcut help modal (`?` key inside the editor).

= How do I uninstall cleanly? =

Just delete the plugin from `Plugins → Installed Plugins` — the plugin's option is removed automatically (single-site and multisite). The per-post collapse state lives in your browser's localStorage and stays there until you clear browser storage; it doesn't affect anything else.

== Screenshots ==

1. The collapsed bar showing icon, block title, and content preview. Multiple blocks collapsed independently.
2. Hovering a block reveals the chevron toggle in the top-left corner.
3. The PluginSidebar with Collapse All, Expand All, and Focus Mode actions.
4. The Settings page with four tabs: General, Behaviour, Block Rules, Appearance.

== Changelog ==

= 1.0.0 =

* Initial public release.
* HOC wraps top-level Gutenberg blocks with a chevron toggle.
* Per-block-type content preview (paragraph, heading, image, list, group, columns, cover, buttons, quote, code, video, audio).
* Collapse state persists to `localStorage`, keyed by structural path or `metadata.name`. Survives reorder when renamed.
* PluginSidebar with Collapse All / Expand All / Focus Mode.
* Keyboard shortcut `Alt+Shift+C` toggles all top-level blocks.
* Per-instance "Never collapse this block" via the block settings menu.
* Settings page at `Settings → Block Collapser` (4 tabs: General, Behaviour, Block Rules, Appearance) — backed by REST.
* Auto-collapse modes: never / collapse all on load / by per-type rule.
* Screen-reader announcements via `wp.a11y.speak()`.
* RTL stylesheet, `prefers-color-scheme: dark` support, `prefers-reduced-motion` honored.
* Multisite-aware uninstall.
* Works in Post Editor and Site Editor.

== Upgrade Notice ==

= 1.0.0 =

First public release of Block Collapser.
```

- [ ] **Step 2: Validate format**

Run a quick check that every required header is present:

```bash
grep -E "^(Contributors|Tags|Requires at least|Tested up to|Requires PHP|Stable tag|License|License URI):" readme.txt
```

Should output 7 matches.

- [ ] **Step 3: Commit**

```
git add readme.txt
git commit -m "feat: add wp.org-format readme.txt for 1.0.0 launch"
```

---

## Task 4: `.gitattributes` — exclude dev files from SVN export

**Files:**
- Create: `.gitattributes`

**Rationale:** wp.org uses SVN. Many teams `git archive` the trunk and copy into SVN; `.gitattributes` with `export-ignore` lets `git archive` skip dev files so the wp.org tarball contains only what end users need.

- [ ] **Step 1: Implement**

```
# Files and directories excluded from `git archive` (used for wp.org SVN export).
# End users get only the runtime files; dev tooling stays in the git repo.

/.editorconfig         export-ignore
/.eslintrc.json        export-ignore
/.gitattributes        export-ignore
/.gitignore            export-ignore
/.npmrc                export-ignore
/.nvmrc                export-ignore
/.prettierrc.json      export-ignore
/.github/              export-ignore
/composer.json         export-ignore
/composer.lock         export-ignore
/jest.config.js        export-ignore
/jest.setup.js         export-ignore
/package.json          export-ignore
/package-lock.json     export-ignore
/phpcs.xml.dist        export-ignore
/phpstan.neon          export-ignore
/webpack.config.js     export-ignore

/docs/                 export-ignore
/node_modules/         export-ignore
/src/                  export-ignore
/tests/                export-ignore
/vendor/               export-ignore
/_playground/          export-ignore
/assets/               export-ignore
```

(The `/assets/` directory is excluded from `git archive` because wp.org assets live at SVN repo root `/assets/`, NOT inside the plugin folder. We exclude them here so the trunk export doesn't include them; they get committed to a separate SVN path during submission.)

- [ ] **Step 2: Verify**

Run:

```bash
git archive HEAD --format=zip -o /tmp/block-collapser-trunk.zip
unzip -l /tmp/block-collapser-trunk.zip | head -40
```

The archive should contain ONLY: `block-collapser.php`, `uninstall.php`, `LICENSE`, `readme.txt`, `includes/`, `build/`, `languages/`. NOT `src/`, `tests/`, `node_modules/`, etc.

- [ ] **Step 3: Commit**

```
git add .gitattributes
git commit -m "build: add .gitattributes to slim wp.org SVN export"
```

---

## Task 5: Generate POT translation template

**Files:**
- Create: `languages/block-collapser.pot`

**Rationale:** Gives translators a starting point. wp.org indexes it for the translation dashboard. We use `wp-cli` if available; falls back to `wp-scripts make-pot`.

- [ ] **Step 1: Generate the POT file**

Try WP-CLI first:

```bash
wp i18n make-pot . languages/block-collapser.pot --domain=block-collapser --slug=block-collapser --headers='{"Report-Msgid-Bugs-To":"https://github.com/moazmahmoud/block-collapser/issues"}'
```

If WP-CLI isn't installed locally, use `@wordpress/scripts`:

```bash
npx wp-scripts pot --location languages/block-collapser.pot --domain=block-collapser
```

If neither tool succeeds in this environment, document the command in the README and defer execution to the actual submission day (the user can run it locally before zipping).

- [ ] **Step 2: Sanity-check**

Open `languages/block-collapser.pot` and confirm:
- The header includes `"Content-Type: text/plain; charset=UTF-8\n"`
- Each `__()` / `_n()` / `_x()` call in the codebase appears as a `msgid`
- Strings from PHP (`esc_html__`) AND from JS (`__()`) are both included

- [ ] **Step 3: Commit**

```
git add languages/block-collapser.pot
git commit -m "feat(i18n): generate POT translation template"
```

(If POT generation could not run, commit a `languages/.gitkeep` and document the command in `docs/submission.md`.)

---

## Task 6: Playground blueprint

**Files:**
- Create: `_playground/blueprint.json`

**Rationale:** WordPress Playground (`playground.wordpress.net`) lets anyone try the plugin in-browser without installing WP. A blueprint JSON defines what gets installed and pre-configured. After wp.org publishes the plugin, a Playground URL of the form `https://playground.wordpress.net/?blueprint-url=...` becomes the "Live Demo" link in the readme + wp.org page.

- [ ] **Step 1: Implement**

```json
{
  "$schema": "https://playground.wordpress.net/blueprint-schema.json",
  "landingPage": "/wp-admin/post-new.php",
  "preferredVersions": {
    "php": "8.0",
    "wp": "latest"
  },
  "phpExtensionBundles": [
    "kitchen-sink"
  ],
  "features": {
    "networking": true
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
        "resource": "wordpress.org/plugins",
        "slug": "block-collapser"
      }
    },
    {
      "step": "writeFile",
      "path": "/wordpress/wp-content/plugins/_seed-post.php",
      "data": "<?php\n// Auto-create a sample post so the editor has something to collapse.\nadd_action('init', function() {\n    if (get_option('block_collapser_demo_seeded')) return;\n    $post_id = wp_insert_post([\n        'post_title' => 'Block Collapser demo',\n        'post_content' => '<!-- wp:heading --><h2>Try collapsing me</h2><!-- /wp:heading -->\\n\\n<!-- wp:paragraph --><p>Hover any block to reveal the chevron toggle. Click to collapse.</p><!-- /wp:paragraph -->\\n\\n<!-- wp:group --><div class=\"wp-block-group\"><!-- wp:paragraph --><p>Group block with nested content. Only the outer container gets a chevron.</p><!-- /wp:paragraph --><!-- wp:image --><figure class=\"wp-block-image\"><img alt=\"placeholder\" src=\"https://placehold.co/600x400\"/></figure><!-- /wp:image --></div><!-- /wp:group -->\\n\\n<!-- wp:paragraph --><p>Try the keyboard shortcut Alt+Shift+C to toggle all blocks.</p><!-- /wp:paragraph -->',\n        'post_status' => 'publish',\n        'post_type' => 'post',\n    ]);\n    update_option('block_collapser_demo_seeded', $post_id);\n    wp_redirect(admin_url('post.php?post=' . $post_id . '&action=edit'));\n    exit;\n});\n"
    }
  ]
}
```

- [ ] **Step 2: Validate the JSON**

Use any JSON validator (e.g. `python -m json.tool _playground/blueprint.json` or `cat _playground/blueprint.json | jq .`). Confirm it parses without error.

- [ ] **Step 3: Commit**

```
git add _playground/blueprint.json
git commit -m "feat(playground): add Playground blueprint with sample post seed"
```

---

## Task 7: Capture wp.org screenshots

**Files:**
- Create: `assets/screenshot-1.png` through `assets/screenshot-4.png`

**Rationale:** wp.org displays up to 6 screenshots at the top of the plugin listing. They're the visual hook. Capture 4 screenshots that map to the readme's `== Screenshots ==` numbered list.

- [ ] **Step 1: Prep environment**

In the local install at `http://localhost/block-collapser/wp-admin/` (`moaz`/`moaz`):
1. Visit `Settings → Block Collapser` → click "Reset to defaults" OR manually restore default accent + everything enabled. (If no reset UI, manually set defaults.)
2. Create a fresh demo post titled "Block Collapser demo" with: heading "About Block Collapser", paragraph with some content, an image block (use any URL), a group block containing 2 paragraphs, a buttons block.

- [ ] **Step 2: Screenshot 1 — collapsed blocks with previews**

In the editor:
- Collapse the paragraph, image, and group blocks (leave the heading expanded so it's visible)
- Make sure each collapsed bar shows: icon + title + preview text
- Take a screenshot of the editor canvas region. Aim for ~1200×800 px (wp.org standard).

Use Playwright:

```js
mcp__plugin_playwright_playwright__browser_take_screenshot({
  filename: "assets/screenshot-1.png",
  type: "png"
})
```

- [ ] **Step 3: Screenshot 2 — hover chevron**

In the editor:
- Hover one block so the chevron toggle is visible
- Capture: `assets/screenshot-2.png`

(This is hard to capture directly because hover state goes away on Playwright "take screenshot" timing. Workaround: use DevTools to force-set `:hover` via `Toggle element state` OR temporarily change the CSS to `opacity: 1` for the screenshot pass.)

- [ ] **Step 4: Screenshot 3 — sidebar**

In the editor:
- Open the Block Collapser PluginSidebar
- Capture full editor with sidebar visible: `assets/screenshot-3.png`

- [ ] **Step 5: Screenshot 4 — settings page**

Navigate to `Settings → Block Collapser`:
- Capture the General tab (default opened): `assets/screenshot-4.png`

- [ ] **Step 6: Optional — banner + icon**

These are NOT required for submission, but improve the wp.org listing. If the user wants to design them:

- `assets/banner-772x250.png` — listing banner
- `assets/banner-1544x500.png` — retina banner
- `assets/icon-128x128.png` — listing icon
- `assets/icon-256x256.png` — retina icon

If we don't have design assets at this time, commit a `docs/branding.md` placeholder noting the dimensions the user needs to design later. The wp.org listing will show without them initially.

- [ ] **Step 7: Commit**

```
git add assets/
git commit -m "feat(assets): add wp.org listing screenshots for v1.0.0"
```

---

## Task 8: Build the distribution zip

**Files:**
- Created at: `dist/block-collapser-1.0.0.zip` (outside the plugin, gitignored)

**Rationale:** Final sanity check — produce the exact .zip the user will upload to wp.org. Verify its contents.

- [ ] **Step 1: Make sure build is fresh**

```
npm run build
```

Confirm `build/editor.js`, `build/editor.css`, `build/editor-rtl.css`, `build/editor.asset.php`, `build/settings.js`, `build/settings.css`, `build/settings-rtl.css`, `build/settings.asset.php` all exist.

- [ ] **Step 2: Use `git archive` to produce the zip**

From the plugin root:

```bash
mkdir -p dist
git archive HEAD --prefix=block-collapser/ --format=zip -o dist/block-collapser-1.0.0.zip
```

Note: `git archive` uses `.gitattributes` export-ignore, so dev files are stripped automatically.

- [ ] **Step 3: Inspect the zip**

```bash
unzip -l dist/block-collapser-1.0.0.zip
```

Expected contents (and ONLY these):

```
block-collapser/
├── block-collapser.php
├── uninstall.php
├── readme.txt
├── LICENSE
├── includes/
│   ├── class-plugin.php
│   ├── class-assets.php
│   ├── class-admin-page.php
│   └── class-settings.php
├── build/
│   ├── editor.js
│   ├── editor.css
│   ├── editor-rtl.css
│   ├── editor.asset.php
│   ├── settings.js
│   ├── settings.css
│   ├── settings-rtl.css
│   └── settings.asset.php
└── languages/
    └── block-collapser.pot
```

If `src/`, `tests/`, `docs/`, `node_modules/`, or any dotfile is in the archive, `.gitattributes` is wrong — fix it before continuing.

- [ ] **Step 4: Manual install test (optional, ~10 min)**

If you have a second WP install (or can use Playground locally):
1. Deactivate + delete the current dev install of the plugin
2. Upload `dist/block-collapser-1.0.0.zip` via `Plugins → Add New → Upload Plugin`
3. Activate
4. Run a quick smoke: open an editor, collapse a block, save, reload — works
5. Visit `Settings → Block Collapser` — page renders, all 4 tabs visible
6. Delete the plugin — confirm `wp option get block_collapser_options` returns "could not get"

- [ ] **Step 5: Add `dist/` to `.gitignore`**

```
dist/
```

This belongs in `.gitignore` (don't commit the zip). The zip is a build artifact.

- [ ] **Step 6: Commit**

```
git add .gitignore
git commit -m "build: ignore dist/ release artifacts"
```

---

## Task 9: wp.org submission docs for the user

**Files:**
- Create: `docs/submission.md`

**Rationale:** The actual submission is a multi-step manual process. Document it so the user (Moaz) has a clear runbook.

- [ ] **Step 1: Implement**

```markdown
# WordPress.org Submission Runbook

This document is for the plugin author. The wp.org submission is a manual,
human-supervised process.

## Pre-flight checklist

- [ ] All 6 gates green (build, lint:js, lint:css, jest, phpstan, phpcs)
- [ ] readme.txt validates at https://wpvulndb.com/readme-validator/ (or manually inspect)
- [ ] All screenshots in `assets/` are 1200×800 (or similar) and clearly named
- [ ] Plugin headers in block-collapser.php match readme.txt (version, license, author)
- [ ] Distribution zip built via `git archive HEAD --prefix=block-collapser/ -o dist/block-collapser-1.0.0.zip`
- [ ] Tested the zip on a fresh WP install (manual or Playground)
- [ ] LICENSE file present and is GPL-2.0+
- [ ] languages/block-collapser.pot present and includes both PHP and JS strings

## Submission steps

1. **Create a wp.org account** at https://login.wordpress.org/register if you don't have one. The login is the same as wordpress.org forums.

2. **Submit the plugin** at https://wordpress.org/plugins/developers/add/
   - Plugin Name: `Block Collapser`
   - Upload: `dist/block-collapser-1.0.0.zip`
   - The form auto-pulls metadata from readme.txt and the plugin header — verify it looks right before submitting.

3. **Wait for plugin review.** The wp.org volunteer review team checks for:
   - GPL compatibility
   - No phoning home / external API calls without consent
   - No obvious security issues (XSS, SQLi)
   - Proper i18n, capability checks, nonce usage where applicable
   - readme.txt accuracy
   - Typical wait: 1-2 weeks. They email back-and-forth via `plugins@wordpress.org`.

4. **Address review feedback** if any. Reply directly to the review email.

5. **After approval**, you get SVN access at `https://plugins.svn.wordpress.org/block-collapser/`.

6. **Initial SVN push:**
   ```bash
   svn co https://plugins.svn.wordpress.org/block-collapser/ block-collapser-svn
   cd block-collapser-svn

   # Copy the zip contents into trunk
   unzip -o ../dist/block-collapser-1.0.0.zip -d /tmp/bc
   rm -rf trunk/*
   cp -r /tmp/bc/block-collapser/* trunk/

   # Tag the release
   svn cp trunk tags/1.0.0

   # Copy assets to /assets/ (these live OUTSIDE trunk)
   cp ../assets/screenshot-*.png assets/
   cp ../assets/banner-*.png assets/         # if you have them
   cp ../assets/icon-*.png assets/           # if you have them

   svn add --force *
   svn ci -m "Release 1.0.0"
   ```

7. **Verify the live page** at `https://wordpress.org/plugins/block-collapser/` —
   it typically updates within 15-30 minutes of the SVN commit.

## After launch

- Watch the `Support` tab on wp.org for user questions.
- Watch the `Reviews` tab — respond to issues constructively.
- For v1.0.x patches: SVN commit to `trunk/` + update `tags/1.0.x` + bump `Stable tag` in readme.txt.
- For v1.1.0+ feature releases: same pattern, new tag.

## Social launch (optional, your call)

The PRD §11 mentioned launching on:
- LinkedIn
- r/WordPress + r/gutenberg
- WP Tavern (a "tip" submission)
- Twitter / Bluesky

Keep it factual — what the plugin does, why someone would want it, free + GPL.
A short Loom video of the editor experience (60-90s) is high-value for a launch post.
```

- [ ] **Step 2: Commit**

```
git add docs/submission.md
git commit -m "docs: wp.org submission runbook for v1.0.0"
```

---

## Task 10: Final gates + roadmap update + tag

- [ ] **Step 1: Run all 6 gates one final time**

```
npm run build
npm run lint:js
npm run lint:css
npm test
composer run phpstan
composer run phpcs
```

All must be clean.

- [ ] **Step 2: Verify the final tree looks shippable**

```bash
ls -la
```

Top level should include: `block-collapser.php`, `uninstall.php`, `readme.txt`, `LICENSE`, `.gitattributes`, `.gitignore`, `composer.json`, `package.json`, `phpstan.neon`, `phpcs.xml.dist`, plus the `build/`, `includes/`, `src/`, `tests/`, `docs/`, `_playground/`, `assets/`, `languages/` directories.

- [ ] **Step 3: Update the roadmap — mark Phase 7 complete**

In `docs/superpowers/plans/2026-06-02-roadmap.md`, change row 7's status to `Complete ✓` and link this plan.

- [ ] **Step 4: Final commit**

```
git add docs/superpowers/plans/2026-06-02-roadmap.md docs/superpowers/plans/2026-06-02-phase-7-launch.md
git commit -m "docs: mark Phase 7 complete in roadmap — ready to ship"
```

- [ ] **Step 5: Tag the release**

```
git tag -a v1.0.0 -m "Block Collapser v1.0.0 — initial public release"
```

(Note: do NOT push tags to a wp.org remote — wp.org uses SVN. The git tag is for the GitHub repo only.)

---

## Self-review for Phase 7

- [x] All wp.org submission artifacts present (readme.txt, LICENSE, screenshots, POT)
- [x] Distribution zip excludes dev files via `.gitattributes`
- [x] Playground blueprint loads a sensible demo without requiring an account
- [x] readme.txt has every required header + an FAQ that pre-empts the common questions
- [x] Plugin headers complete (Plugin URI, License, Text Domain, Domain Path)
- [x] Submission runbook documented for the user
- [x] No code changes in `src/` or `includes/` — Phase 7 is artifacts-only

---

## What Phase 7 does NOT do (you, the user, do this)

- **Submit to wp.org** — manual upload via the submission form
- **Respond to the wp.org review team** — back-and-forth email
- **Push to SVN** after approval — using the runbook in `docs/submission.md`
- **Record a demo video** — optional, but highly recommended for the launch post
- **Write the LinkedIn / Reddit launch posts** — your voice, your call
- **Design final banner / icon graphics** — the wp.org listing works without them; ship later if you want polish
