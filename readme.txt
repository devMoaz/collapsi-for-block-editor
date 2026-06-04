=== Collapsi for the Block Editor ===
Contributors: devmoaz
Tags: block editor, gutenberg, productivity, ux, collapse
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Editor-only collapse/expand toggle for every Gutenberg block. Tame long posts and templates without losing your place.

== Description ==

**Collapsi for the Block Editor** adds an editor-only chevron toggle to every Gutenberg block. Hover any top-level block, click the chevron, and the block tucks away into a compact bar showing the block's icon, title, and a short content preview (paragraph text, image alt, "5 blocks", and so on). Toggle it back open with the same chevron.

Built for the long pages and Site Editor templates where scrolling past 50 blocks to find the one you want is the daily annoyance. Collapsi is **strictly editor-only** — your published site is untouched, no extra CSS or JS ships to the frontend.

= Why this plugin =

* **Stop scrolling endlessly.** Collapse the sections you're not working on. Find the one you are in seconds.
* **Works on every block.** Core, third-party, custom, ACF — anything Gutenberg renders, Collapsi can collapse.
* **Survives reloads.** Collapse state is saved per post, per template, per browser. Come back tomorrow, your layout is where you left it.
* **Per-instance opt-out.** Set "Never collapse this block" on a hero or any pinned block from the block settings menu.
* **Keyboard shortcut.** `Alt+Shift+C` toggles all top-level blocks at once. Discoverable in WP's shortcut help modal (`?`).
* **No telemetry. No remote calls. No premium upsell.** Free, GPL, forever.

= How it works =

The plugin hooks `editor.BlockListBlock` with a higher-order component that wraps every top-level block. State lives in a `@wordpress/data` store and persists to `localStorage` keyed by either the block's structural path (`"0.2.1"`) or its user-set name from Gutenberg's rename feature. A `PluginSidebar` exposes Collapse All / Expand All / Focus Mode. Settings live at `Settings → Collapsi` and persist via the REST API.

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
2. Search for "Collapsi for the Block Editor"
3. Click `Install Now` and then `Activate`

= Manual =

1. Download the plugin .zip
2. Visit `Plugins → Add New → Upload Plugin`
3. Choose the .zip and click `Install Now`, then `Activate`

After activation, open any post in the editor and hover any top-level block — the chevron appears top-left.

== Frequently Asked Questions ==

= Does this affect my published site? =

No. Collapsi injects nothing into the frontend. The CSS is enqueued via `enqueue_block_assets` with an `is_admin()` guard, and the JS is enqueued via `enqueue_block_editor_assets` which only fires inside the editor. Verified on every release.

= Where is the collapsed state stored? =

In your browser's localStorage, keyed by `collapsi:v1:post:<postId>`. It's per-browser and per-device — switching to a different machine or browser starts fresh. Collapsi makes no server-side or remote calls to persist state.

= I renamed a block via Gutenberg's "Rename" feature. Does the collapsed state survive reorder? =

Yes. When you set a `metadata.name` via the block rename feature, the persistence key becomes `name:<your-name>`. Reorder the block, the key still matches, the collapsed state survives.

= Can I exclude specific blocks from collapsing? =

Yes. Open any top-level block's three-dot ⋮ menu and click "Never collapse this block". The setting persists with the post.

= Does it work in the Site Editor? =

Yes. Templates and template parts are treated the same as posts.

= How do I customize the accent color? =

`Settings → Collapsi → Appearance` — change the accent color and bar title color, then save.

= Will it slow down the editor with 100 blocks on a page? =

No. Selector subscriptions are per-`clientId`, so a toggle on one block has no rendering impact on the other 99. Profiled on a 100-block stress page: a single toggle re-renders 1 wrapper.

= Does it support RTL languages? =

Yes. The plugin enqueues `editor-rtl.css` automatically via `wp_style_add_data`.

= How do I theme the collapsed bar? =

Both the accent (left border + icon) and the bar title color are user-configurable under `Settings → Collapsi → Appearance`. The preview text harmonizes with the title color automatically.

= What's the keyboard shortcut? =

`Alt+Shift+C` (Windows/Linux) or `Ctrl+Alt+C` (macOS). Toggles all top-level blocks. Discoverable in WP's shortcut help modal (`?` key inside the editor).

= How do I uninstall cleanly? =

Just delete the plugin from `Plugins → Installed Plugins` — the plugin's option is removed automatically (single-site and multisite). The per-post collapse state lives in your browser's localStorage and stays there until you clear browser storage; it doesn't affect anything else.

== Screenshots ==

1. The collapsed bar showing icon, block title, and content preview. Multiple blocks collapsed independently.
2. Hovering a block reveals the chevron toggle in the top-left corner.
3. The PluginSidebar with Collapse All, Expand All, and Focus Mode actions.
4. The Settings page with three tabs: General, Behaviour, Appearance.

== Changelog ==

= 1.0.0 =

* Initial public release.
* HOC wraps top-level Gutenberg blocks with a chevron toggle.
* Per-block-type content preview (paragraph, heading, image, list, group, columns, cover, buttons, quote, code, video, audio).
* Collapse state persists to `localStorage`, keyed by structural path or `metadata.name`. Survives reorder when renamed.
* PluginSidebar with Collapse All / Expand All / Focus Mode.
* Keyboard shortcut `Alt+Shift+C` toggles all top-level blocks.
* Per-instance "Never collapse this block" via the block settings menu.
* Settings page at `Settings → Collapsi` (3 tabs: General, Behaviour, Appearance) — backed by REST.
* Auto-collapse on editor load: off, or all top-level blocks.
* Screen-reader announcements via `wp.a11y.speak()`.
* RTL stylesheet and `prefers-reduced-motion` honored.
* Multisite-aware uninstall.
* Works in Post Editor and Site Editor.

== Upgrade Notice ==

= 1.0.0 =

First public release of Collapsi for the Block Editor.

== Development ==

Source code, issue tracker, and build instructions live at https://github.com/devMoaz/collapsi-for-block-editor. The compiled assets in `build/` are produced by `@wordpress/scripts` (webpack) from the `src/` directory in the GitHub repository. Run `npm install && npm run build` to reproduce.
