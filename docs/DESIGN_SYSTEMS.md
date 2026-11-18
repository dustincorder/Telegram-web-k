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

Phase 1 exposes a small semantic `--ds-*` CSS contract for typography, colors,
surfaces, borders, radii, shadows, and transitions. All three identifiers
currently map those tokens to the existing theme-derived variables. This keeps
the current UI unchanged while providing a stable surface for later
design-system-specific components.

Future work should add tokens only when a component needs them, preserve
existing `Section`/`Row`/form primitives, and continue using the existing
settings persistence, accessibility, RTL, animation, and manager boundaries.
The selector uses the existing language-pack keys, so English, Russian, and
Ukrainian clients can provide localized labels without a second i18n system.
