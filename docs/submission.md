# WordPress.org Submission Runbook

This document is for the plugin author. The wp.org submission is a manual, human-supervised process.

## Pre-flight checklist

- [ ] All 6 gates green (`npm run build && npm run lint:js && npm run lint:css && npm test && composer run phpstan && composer run phpcs`)
- [ ] readme.txt validates — paste into https://wpvulndb.com/readme-validator/ (or manually inspect for required headers)
- [ ] All screenshots in `assets/` are clearly named (`screenshot-1.png` … `screenshot-N.png`)
- [ ] Plugin headers in `block-collapser.php` match `readme.txt` (Version, License, Author, Text Domain)
- [ ] Distribution zip exists at `dist/block-collapser-1.0.0.zip` — rebuild via the command below
- [ ] LICENSE file present and is GPL-2.0-or-later
- [ ] `languages/block-collapser.pot` present and includes both PHP and JS strings

## Build the distribution zip

The runtime files end up in the zip. Dev files (`src/`, `tests/`, `docs/`, `node_modules/`, build tooling) are NOT included.

```bash
# 1. Build production bundle
npm run build

# 2. Stage runtime files into a temp folder, then zip
# (PowerShell on Windows — adapt for your shell)
$stage = "$env:TEMP\bc-stage"
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Path "$stage\block-collapser" | Out-Null
Copy-Item LICENSE,readme.txt,block-collapser.php,uninstall.php,package.json "$stage\block-collapser\"
Copy-Item -Recurse includes,build,languages "$stage\block-collapser\"
Compress-Archive -Path "$stage\block-collapser" -DestinationPath dist\block-collapser-1.0.0.zip -Force
```

On macOS / Linux:

```bash
mkdir -p dist /tmp/bc-stage/block-collapser
cp LICENSE readme.txt block-collapser.php uninstall.php package.json /tmp/bc-stage/block-collapser/
cp -r includes build languages /tmp/bc-stage/block-collapser/
( cd /tmp/bc-stage && zip -r "$OLDPWD/dist/block-collapser-1.0.0.zip" block-collapser )
```

The zip should contain exactly these files (18 entries):

```
block-collapser/
├── LICENSE
├── block-collapser.php
├── package.json
├── readme.txt
├── uninstall.php
├── includes/
│   ├── class-admin-page.php
│   ├── class-assets.php
│   ├── class-plugin.php
│   └── class-settings.php
├── build/
│   ├── editor.asset.php
│   ├── editor.css
│   ├── editor.js
│   ├── editor-rtl.css
│   ├── settings.asset.php
│   ├── settings.css
│   ├── settings.js
│   └── settings-rtl.css
└── languages/
    └── block-collapser.pot
```

## Submission steps

1. **Create a wp.org account** at https://login.wordpress.org/register if you don't have one. The login is the same as the wordpress.org forums.

2. **Submit the plugin** at https://wordpress.org/plugins/developers/add/
   - Plugin Name: `Block Collapser`
   - Upload: `dist/block-collapser-1.0.0.zip`
   - The form auto-pulls metadata from `readme.txt` and the plugin header — verify it looks right before clicking Upload.

3. **Wait for plugin review.** The wp.org volunteer review team checks for:
   - GPL compatibility
   - No phoning home / external API calls without consent
   - No obvious security issues (XSS, SQLi, missing nonce/cap checks)
   - Proper i18n, capability checks
   - readme.txt accuracy
   - **Typical wait: 1-2 weeks.** They email back-and-forth at `plugins@wordpress.org`.

4. **Address review feedback** if any. Reply directly to the review email.

5. **After approval**, you get SVN access at `https://plugins.svn.wordpress.org/block-collapser/` with three top-level directories: `trunk/`, `tags/`, `assets/`.

## Initial SVN push (after approval)

The wp.org SVN layout is different from git — `trunk/` is what end users download as "latest", `tags/X.Y.Z/` are immutable releases, and `assets/` (at SVN root, NOT inside trunk) holds the listing screenshots and banner.

```bash
# Check out the SVN repo (separate from git working directory)
svn co https://plugins.svn.wordpress.org/block-collapser/ ~/work/block-collapser-svn
cd ~/work/block-collapser-svn

# Copy the runtime files (from your dist zip contents) into trunk/
rm -rf trunk/*
unzip -o ~/path/to/dist/block-collapser-1.0.0.zip -d /tmp/bc-extract
cp -r /tmp/bc-extract/block-collapser/* trunk/

# Create the 1.0.0 tag as an SVN copy of trunk
svn cp trunk tags/1.0.0

# Copy the screenshots to /assets/ (NOT inside trunk)
cp ~/path/to/repo/assets/screenshot-*.png assets/
# Optional: banner-772x250.png, banner-1544x500.png, icon-128x128.png, icon-256x256.png
# Add when designed.

# Stage everything and push
svn add --force *
svn ci -m "Release 1.0.0"
```

## Post-launch

- **Verify the live page** at `https://wordpress.org/plugins/block-collapser/` — it typically updates within 15-30 minutes of the SVN commit.
- Watch the **Support** tab on wp.org for user questions.
- Watch the **Reviews** tab — respond constructively to issues.
- For **v1.0.x patches**: SVN commit to `trunk/` + `svn cp trunk tags/1.0.x` + bump `Stable tag` in `readme.txt`.
- For **v1.1.0+ feature releases**: same pattern with a new tag.

## Optional: Playground demo link

After approval, the Playground demo URL becomes:

```
https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/devMoaz/block-collapser/main/_playground/blueprint.json
```

Add this to the wp.org listing description as a "Try it now" link, and to the GitHub README.

## Social launch (optional)

PRD §11 mentioned channels worth posting to:

- **LinkedIn** — Moaz's professional network. Frame around: a small, focused, GPL plugin solving a daily annoyance.
- **r/WordPress** + **r/gutenberg** — title like "I shipped a free Gutenberg productivity plugin: Block Collapser". Show a Loom.
- **WP Tavern** — they accept "tip" submissions at https://tavern.wp.com/contact/
- **Twitter / Bluesky** — short clip, plugin link, GPL note.

A **60-90s Loom video** demonstrating: chevron toggle → preview bar → sidebar → settings page. Keep it factual; the value is the productivity hook, not the implementation details.

## What you don't need to do

- **No marketing site.** wp.org page is the listing.
- **No paid plan / Pro version.** This is GPL forever.
- **No support contract.** Reply on the wp.org support forum when you can; users understand free plugins.
- **No newsletter signup.** Nothing in the plugin asks for an email.
