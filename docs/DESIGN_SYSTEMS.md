# Design systems

Telegram Web K stores the interface style separately from the color theme.
The common `settings.designSystem` setting accepts three stable identifiers:

- `classic` — the default interface style
- `cupertino`
- `material3`

Missing or invalid values fall back to `classic`. The setting is persisted
through `setAppSettings` and `AppStateManager`, alongside the existing common
settings. It is not account state.

The bootstrap initializes `designSystemController`, which applies the selected
identifier as `data-design-system` on the document root and listens for
`settings_updated` events. The controller does not call the theme controller or
change `settings.theme`, so light/dark/system selection, accents, wallpapers,
tinted themes, and contrast remain independent.

A small semantic `--ds-*` CSS contract covers typography, colors, surfaces,
borders, radii, shadows, and transitions. It defaults to the existing theme
variables. Cupertino adds scoped component styles; Classic and the Material 3
foundation retain the original appearance.

Future work should add tokens only when a component needs them, preserve
existing `Section`/`Row`/form primitives, and continue using the existing
settings persistence, accessibility, RTL, animation, and manager boundaries.
The selector uses the existing language-pack keys, so English, Russian, and
Ukrainian clients can provide localized labels without a second i18n system.

## Cupertino fixture preview

Development builds support `?cupertinoPreview=1`. This route mounts
`src/components/cupertinoPreview/` before session restoration and renders
deterministic chat, settings, menu, and dialog fixtures. It does not restore an
account, read Telegram data, or expose write-enabled manager actions. The
controls switch between interface styles, light/dark presentation, desktop or
mobile sizing, and LTR/RTL direction.

The preview also exposes `window.cupertinoPreview` for browser automation.
Screenshots and interaction checks should use this route instead of creating
authentication fixtures. Preview-only imports are behind the development gate
in `src/index.ts` and are not loaded by production users.

## Cupertino component styles

`partials/_designSystemCupertino.scss` now emits six small component mixins from
`src/scss/designSystems/cupertino/` under the Cupertino root marker: tokens,
navigation, dialog rows, conversation/composer, sidebar sections, and overlays.
Classic and Material 3 still use the existing primitives. Bubble corner hooks
in `_chatBubble.scss` retain the original 15px/5px defaults and let Cupertino use
18px/6px corners consistently across the body, grouped messages and media edges.
The existing shape animation code reads those computed radii. The base popup
radius also has an optional default token, leaving fullscreen and specialized
popup overrides in control.

Cupertino uses system typography, flat navigation surfaces, inset grouped sidebar
sections, 31px switches, and opaque popovers. Theme-derived message colors are
kept together rather than recoloring just the outgoing background. Virtualized
chat heights (72px, or 82px with folder tags), avatar/selection bounds, composer
height accounting, keyboard focus rules, animation levels and modal placement
remain owned by the existing components.

The fixture preview now uses the real Section, Row and checkbox primitives,
production chat row/message classes, and root theme/direction markers. Its CSS
supplies a deterministic sample palette and layout scaffolding, not a second
bubble/control design. Narrow frame mode does **not** simulate CSS breakpoints:
resize the browser viewport for mobile checks. These structural fixtures do not
validate live data, media, popup focus trapping or composer behavior; use the
existing popup sandbox and signed-in suites for those flows.

`await window.cupertinoPreview.ready()` waits for fonts and two frames, then
rejects if a Vite error overlay is present. Mounting preserves existing overlays.
Readiness does not mean that asynchronous type/lint checks have finished or that
a build or test passed; an overlay appearing later also invalidates a screenshot.

## Watcher investigation and validation limits

The `TypeScript watcher stopped` overlay is emitted by `scripts/dev-checks.mjs`
when its `tsc --watch` subprocess closes outside disposal, independently of the
fixture route. Previously the handler replaced a missing exit code with `1`,
discarded the termination signal, and omitted compiler/startup output. It now
keeps the last 80 output lines and reports the signal or actual exit code. The
plugin also disposes children through `closeBundle`, including middleware-mode
servers without an HTTP server. Neither error overlays nor checks are disabled.
The development-only Cupertino flag now agrees with its bootstrap gate instead
of marking a built preview as a sandbox without mounting the fixture.

The earlier screenshot cannot establish whether the watcher failed from a
missing executable, resource limits, compiler failure or server lifecycle. That
requires terminal output and a runtime reproduction. A dependency-free mocked
plugin check is available with:

```sh
node --experimental-test-module-mocks --test scripts/dev-checks.test.mjs
```

This overhaul was reviewed with source checks and those mocked plugin checks.
No dependencies were installed and no application, build, browser, screenshots,
Vitest, popup, focus, accessibility or editor e2e suites were run. Cloudflare
build results and runtime review in light/dark, LTR/RTL, desktop/mobile and reduced
motion are still required before calling the interface visually validated.

## Flat Cupertino navigation (iOS 15–18)

The reference period is pre-2025: Apple's [Designed for iPad (2020)](https://developer.apple.com/videos/play/wwdc2020/10206/),
[Lists in UICollectionView (2020)](https://developer.apple.com/videos/play/wwdc2020/10026/)
and [Explore navigation design for iOS (2022)](https://developer.apple.com/videos/play/wwdc2022/10001/).
The design uses split-view navigation, plain full-width chat rows with separators
aligned to the text, and inset groups for settings. The current HIG also covers
Liquid Glass, so it is not the visual specification for these surfaces.

`getDesignSystemLayout` supplies the geometry to `updateColumnWidths`: Cupertino
has no outer column gutters or folder-rail gap. The controller emits the local
`design_system_changed` event after applying the root marker so geometry and
visible header accessories update when switching styles, without a reload.
Classic/Material keep their previous 16px desktop / 8px chat-on-phone geometry.

`--chat-pane-inline-inset` is the single CSS boundary for the scroll region and
Cupertino's full-width toolbar/audio/call bars. Message width remains separately
capped by `--chat-width`. Header accessories attach without a card gap; their
height reservation uses the same policy as their CSS. The chat history also
uses that policy for its top/bottom spacers, including immediate style changes;
popup preview spacers remain unchanged. Columns, headers, folder
rails and selected chat rows have straight edges; avatars, bubbles, controls,
menus, settings groups and dialogs retain their component-specific radii.
Classic's inverse selected-row palette is excluded only for Cupertino, which
uses a tinted full-row selection and retains normal badge/mute/pin semantics.
Virtualized row heights and avatar/checkbox bounds stay unchanged.

Mobile retains the existing single-column navigation/back stack and safe-area
handling. No new tab bar is introduced: the app has no independent top-level tab
stacks, and folder filters are not top-level destinations. Existing animation
levels and focus helpers continue to own transitions and keyboard behavior.
The controller's dependency-free regression script also exercises the actual
width helper across style changes, resized/collapsed sidebars, folder rails and
mobile sizes. Browser layout, contrast, RTL, focus, media/call accessories and
Cloudflare builds still need runtime verification.

## Cascade order and the large navigation title

Two structural fixes define the current implementation:

1. **Cascade order.** `partials/_designSystemCupertino.scss` is imported last
   in `style.scss` (after every app partial). Previously it was imported
   fourth, so its rules lost the cascade against ~90 later partials at equal
   specificity — the main reason the Cupertino selection barely changed the
   rendered interface.
2. **Sidebar navigation block.** `CupertinoSidebarNav`
   (`src/components/cupertino/sidebarNav.tsx`) replaces Web K's single header
   bar with the iOS Mail / Messages arrangement: a nav bar (the untouched
   `.sidebar-header` with its menu, emoji-status and lock accessories), then
   a 34px/700 large navigation title, then the search row. The app's real
   `InputSearch` instance is adopted (moved out of the nav bar) while
   Cupertino is active and restored to the header on dispose, so Classic and
   Material 3 keep their original structure. `AppSidebarLeft` mounts and
   unmounts it reactively (`stores/designSystem.ts`, fed by the controller's
   `design_system_changed` event). Mounted inside `#chatlist-container`, it
   hides with the list during search and tab navigation, and hides entirely
   in the collapsed rail. The title is a real `h2` navigation heading.
3. **Chat-list rows.** The row skeleton (avatar / title+details / subtitle)
   already matches Telegram iOS anatomy; the Cupertino variant changes its
   structure where iOS differs: `DialogElement.createTimePill` renders a
   pill-free inline pin before the timestamp under Cupertino (no pill box),
   and the row typography is iOS 16–18 (17pt semibold title, 15pt subtitle,
   12pt tabular time). Virtualized heights, badges, selection, context menus
   and reordering are untouched.
