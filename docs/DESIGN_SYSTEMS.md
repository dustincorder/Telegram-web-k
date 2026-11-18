# Design systems

Telegram Web K stores the interface style separately from the color theme.
The common `settings.designSystem` setting accepts two stable identifiers:

- `classic` — the default interface style
- `material3`

`cupertino` is retired: it was removed from the source tree (SCSS, components,
stores wiring) and a persisted legacy value falls back to `classic` through
`normalizeDesignSystemId`. Missing or invalid values fall back to `classic`
the same way. The setting is persisted through `setAppSettings` and
`AppStateManager` alongside the existing common settings; it is not account
state.

## Switching infrastructure (shared by both designs)

The bootstrap initializes `designSystemController`, which applies the selected
identifier as `data-design-system` on the document root, listens for
`settings_updated` events, and dispatches the local `design_system_changed`
event. The controller does not call the theme controller or change
`settings.theme`, so light/dark/system selection, accents, wallpapers, tinted
themes and contrast remain independent.

`stores/designSystem.ts` mirrors the controller event into a Solid signal —
the hook components use to mount design-specific UI reactively (mount under
the selected design, restore/dispose for Classic). `getDesignSystemLayout`
supplies column geometry to `updateColumnWidths`; both designs share the
standard Web K geometry, and a future design-specific layout policy branches
there.

Regression guards: `scripts/design-system-controller.test.mjs` runs the real
controller and width helper under Node (switching, persistence, fallbacks,
loading gate, geometry); `scripts/material3-structure.test.mjs` pins the
structural decisions below without needing a bundler.

## Material web library evaluation

| Candidate | Verdict |
|---|---|
| `material/solid` (Solid bindings) | Rejected. No official bindings exist; the community ports are small and stale — a thin, unmaintained surface over the same web components. |
| **`@material/web`** (official Material Web Components, M3) | **Selected.** Framework-agnostic Lit web components — Solid renders custom elements natively (with the small JSX intrinsic declarations in `components/material3/elements.d.ts`). Per-component ESM imports keep the bundle to what the slice uses (lazy-loaded only while Material 3 is selected — `lib/designSystems/material3.ts`); theming is the library's official token path (`--md-sys-color-*` and friends as CSS custom properties); accessibility, keyboard behavior and state layers are built to the M3 spec; Google-maintained stable v2 line. |
| MDUI (v2) | Rejected for this purpose. Also Lit-based M3 and Solid-compatible, but coarser component/token granularity than the official library and a smaller maintenance surface; offers nothing `@material/web` does not. |

No dependencies were installed in this checkout (none may be): the dependency
is declared in `package.json` and resolves on the next full install/CI build.

## Material 3 token layer (dynamic color)

`scss/designSystems/material3/_tokens.scss` maps the M3 system tokens from the
live Telegram theme variables under `html[data-design-system='material3']`:

- `--md-sys-color-primary` follows `--primary-color` — the Telegram accent is
  the dynamic-color source; on/primary, primary/secondary containers and
  state layers derive from it via `color-mix`.
- Surfaces follow the theme's own `--surface-color` / `--primary-text-color` /
  `--secondary-text-color` / `--border-color`, so day/night, tinted and
  contrast themes flow into every MD3 surface and control without recomputing
  palettes.
- The typography and shape scales are mapped on the app's font stack and
  radius scale.

Because every mapping is a `var()` indirection, theme switches are live and
require no recomputation.

## Material 3 vertical slice

The slice covers the sidebar: navigation, search, folder navigation and
chat-list presentation.

- **Sidebar navigation** — `components/material3/sidebarNav.tsx`
  (`Material3SidebarNav`) replaces the single header arrangement with an M3
  top app bar structure: the untouched `.sidebar-header` as the bar, a
  `headline-small` app bar label (real `h2`), and the search row. The app's
  real `InputSearch` instance is adopted (moved out of the bar) while
  Material 3 is active and restored on dispose; `AppSidebarLeft` mounts and
  unmounts it reactively. The search affordance is an official
  `md-outlined-icon-button` (lazily registered) that focuses the adopted
  field.
- **Search field** — the adopted `InputSearch` is presented through the M3
  filled-text-field recipe (surface-container-high, full corner, no resting
  border) by setting its own CSS custom properties from the M3 tokens. Its
  logic (search flow, focus, IME, keyboard layer) is untouched.
- **Folder navigation** — the app's tabs primitive keeps its selection,
  scrolling and badge wiring; its presentation is M3 primary-tab styling
  driven by the mapped tokens. Swapping the primitive for `md-primary-tabs`
  would drop badge and context-menu behavior for no token gain.
- **Chat-list presentation** — M3 list conventions through the rows' own
  variables: state-layer hover (`--md-sys-state-*`), secondary-container
  selection, outline-variant dividers. Virtualized row heights (72/82px),
  badges, selection, context menus and reordering are untouched.

Structural regression guards for all of the above live in
`scripts/material3-structure.test.mjs` (source-level; the checkout cannot run
a bundler or a DOM).

## What is intentionally not migrated

The conversation view, composer, popups and settings screens stay Classic
primitives styled by the shared theme for now; the slice establishes the
token layer, the component loading path and the adoption pattern the rest of
the migration reuses. MTProto, routing, managers and the worker boundaries
are design-system-agnostic and unchanged.

## Verification limits

No dependencies were installed and no application, build, browser, screenshot,
Vitest, popup, focus, accessibility or editor e2e suites were run in this
checkout: `@material/web` and the full toolchain are absent locally (sparse
checkout, no `node_modules`). The dependency-free suites listed above pass,
and the TS sources parse, but the SCSS has not been compiled and the M3 slice
has not been rendered. Cloudflare build results and runtime review in
light/dark, LTR/RTL, desktop/mobile and reduced motion are required before
calling the Material 3 interface visually validated.
