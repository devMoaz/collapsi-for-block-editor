# Future Feature: Per-Block-Type Rules (deferred from v1.0)

**Status:** Deferred from v1.0 launch (2026-06-02) — see commit removing the feature.

**Why deferred:** The Block Rules tab + the `by-rule` mode added a layer of complexity that wasn't justified for v1.0. The MVP collapses or not collapses. Per-block-type rules are a power-user feature and the UI added a 4th tab + 12 SelectControls + a separate code path in editor auto-collapse logic. We're shipping the simpler product first and observing whether users actually ask for it.

**Decision criteria for adding it back:**

- 3+ users in wp.org reviews or support forum specifically request per-block-type defaults
- OR: a Pro/paid tier is introduced and this becomes a paid-only feature

**Scope when re-introduced:**

1. **Settings UI** — new tab "Block Rules" with curated list of common block types (paragraph, heading, group, columns, cover, list, quote, code, image, gallery, buttons, embed). Each row has a SelectControl: `Default` / `Always collapse` / `Never collapse`.
2. **Settings persistence** — re-introduce the `blockRules` field in `Settings::DEFAULTS`, REST schema, and sanitize callback (object with keys matching `^[a-z][a-z0-9-]*/[a-z][a-z0-9-]*$` and values from `[default, always, never]`).
3. **Behaviour tab** — add a third option to the auto-collapse mode: `Use per-block-type rules`. Internally this is the `by-rule` value.
4. **Editor auto-collapse** — restore `applyBlockRulesAutoCollapse` in `src/editor/sidebar/actions.js`. Restore the `by-rule` branch in `startPersistenceLoop` inside `src/editor/index.js`.
5. **`src/editor/utils/settings.js`** — re-add `blockRules` to `DEFAULTS`, `coerceBlockRules`, expand `ALLOWED_MODES` to include `'by-rule'`.
6. **Tests** — restore the `applyBlockRulesAutoCollapse` describe block in `tests/unit/sidebar/actions.test.js`. Add a getSettings test for malformed block-rule keys.

**Reference implementation:** see git history before the v1.0 commit that removed Block Rules. The original code is recoverable in one cherry-pick.

**Interaction with existing features:**

- Per-instance `Never collapse this block` (via `metadata.blockCollapser.neverCollapse`) always wins over a block-rule's "always" mode. Document this in `readme.txt` FAQ.
- An empty `blockRules` object should be valid (current sanitize already enforces this).
- The `by-rule` mode must coexist with the persistence-loop gate: only apply rules if the store map is empty (same "don't stomp" semantics as `all`).

**Estimated effort:** 0.5 day — most of the heavy lifting (12-block curated list, SelectControl logic) is mechanical port from the prior implementation.
