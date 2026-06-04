# Collapsi for the Block Editor

> Editor-only collapse/expand for every Gutenberg block. Tame long posts and templates without losing your place.

Collapsi for the Block Editor adds a chevron toggle to every top-level block in the WordPress editor. Hover, click, and the block tucks into a 40-px bar showing its icon, title, and a short content preview. The collapsed state is saved per-post in `localStorage`, so it survives page reloads. Strictly editor-only — your published site is untouched.

## Features

- **Chevron toggle on every top-level block** — core, third-party, custom, ACF, anything Gutenberg renders.
- **Content previews** — paragraph text, heading content, image alt, "5 blocks", "3 columns", and so on.
- **Persistence** — `localStorage` keyed by `collapsi:v1:post:<id>`. Survives reorder when the block is renamed via Gutenberg's rename feature (key falls back to a stable structural path otherwise).
- **PluginSidebar** — Collapse All / Expand All / Focus Mode.
- **Keyboard shortcut** — `Alt+Shift+C` toggles all top-level blocks. Discoverable in the WP shortcut help modal.
- **Per-instance opt-out** — "Never collapse this block" from the block settings menu.
- **Settings page** at `Settings → Collapsi` — backed by REST, with three tabs (General, Behaviour, Appearance) and full RTL + reduced-motion support.
- **Multisite-aware uninstall** — clears its single option on every site in the network.
- **Zero telemetry. Zero remote calls. GPL-2.0-or-later, forever.**

## Install

Easiest path — from the WordPress.org plugin directory:

1. `Plugins → Add New` in wp-admin
2. Search for "Collapsi for the Block Editor"
3. Install + Activate

Or grab the latest release zip from this repo's [Releases](https://github.com/devMoaz/collapsi-for-block-editor/releases) page and upload via `Plugins → Add New → Upload Plugin`.

## Try it without installing

Open the WordPress Playground with the plugin pre-installed and a demo post seeded:

[Open in Playground →](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/devMoaz/collapsi-for-block-editor/main/_playground/blueprint.json)

## Development

### Requirements

- Node 18+ (see `.nvmrc`)
- PHP 7.4+
- Composer
- A local WordPress install (this directory should live under `wp-content/plugins/`)

### First-time setup

```bash
npm install
composer install
```

### Build the editor + settings bundles

```bash
npm run build       # production bundle
npm start           # watch mode for development
```

Output lands in `build/` (gitignored — built by CI for releases).

### Lint, type-check, test

```bash
npm run lint:js          # ESLint via @wordpress/scripts
npm run lint:css         # Stylelint
npm test                 # Jest unit tests
composer run phpstan     # PHPStan level 8 with szepeviktor/phpstan-wordpress
composer run phpcs       # WPCS 3.x + PHPCompatibilityWP
```

All six gates must pass before a release.

### Project layout

```
includes/      Runtime PHP — bootstrap, asset registration, settings, admin page
src/editor/    Gutenberg-side React: HOC, store, components, sidebar, shortcuts
src/settings/  Settings page React app
tests/unit/    Jest unit suites
languages/     POT translation template
docs/          Internal plans, smoke-test checklist, wp.org submission runbook
_playground/   WordPress Playground blueprint
```

The build pipeline is [`@wordpress/scripts`](https://github.com/WordPress/gutenberg/tree/trunk/packages/scripts) (webpack 5 under the hood). The `DependencyExtractionWebpackPlugin` externalizes every `@wordpress/*` import so the runtime depends on whatever WordPress core ships — we don't bundle React, the editor store, or any other wp.org-bundled library.

## Roadmap

v1.0 is intentionally small. Possible follow-ups:

- **Per-block-type rules** — defer behaviour per type (e.g. always collapse paragraphs, never collapse headings). Detailed plan at [`docs/superpowers/plans/2026-06-02-future-block-rules.md`](./docs/superpowers/plans/2026-06-02-future-block-rules.md).
- **Customizable keyboard shortcut** — currently hardcoded `Alt+Shift+C`.
- **Per-block-type icon overrides**.

If you want one of these, open an issue and describe the use case.

## Contributing

Issues and PRs welcome. Before opening a PR:

1. Run all six gates locally (`npm run build && npm run lint:js && npm run lint:css && npm test && composer run phpstan && composer run phpcs`).
2. If you touch user-facing strings, regenerate the POT (`wp i18n make-pot . languages/collapsi.pot`).
3. If you change anything in `includes/`, run `composer run phpcs` and `composer run phpstan` and make sure both stay clean.

## License

GPL-2.0-or-later. See [LICENSE](./LICENSE).

## Acknowledgments

Built on top of `@wordpress/data`, `@wordpress/block-editor`, `@wordpress/components`, `@wordpress/keyboard-shortcuts`, and `@wordpress/plugins`. Thanks to the Gutenberg team for keeping the iframed-editor extension story stable.
