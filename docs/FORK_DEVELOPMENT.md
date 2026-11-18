# Fork Development

This repository is a fork of `TelegramOrg/Telegram-web-k`. The production fork
is deployed statically at `https://tweb.dustcord.dev/` by Cloudflare Pages.
It does not require a backend, proxy, serverless function, or server-side
runtime.

## Repository structure

- `src/` contains application code: Solid components, app managers, MTProto,
  workers, stores, helpers, configuration, styles and tests.
- `src/components/` contains UI. Theme, settings and chat code should follow
  existing component patterns.
- `src/lib/appManagers/` is the boundary for Telegram protocol data and actions.
- `src/lib/mtproto/`, `src/lib/serviceWorker/`, and account/session storage are
  sensitive boundaries. Change them only for a reproduced, verified issue.
- `src/scss/` contains global styles; component styles live in neighboring
  `.module.scss` files.
- `public/` contains static runtime assets, manifests, Wasm, workers and the
  previous checked-in production output. The Vite build copies only the
  required static assets from this directory; current hashed modules come from
  the build itself.
- `vite.config.ts` contains the actual build configuration, aliases and worker
  settings.
- `AGENTS.md` contains repository-wide AI-agent instructions.
- `.github/workflows/` contains push security review and Docker release jobs.
  Cloudflare Pages handles website deployment, so GitHub Actions should not
  add a second deployment job.

## Local development

Use pnpm and the Node version declared in `package.json`:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm start
```

The dev server listens on `http://localhost:8080/`. Use
`bash scripts/start-preview.sh --detach` for an authorized preview rather than
plain Vite or direct process-management commands.

Useful source checks:

```bash
pnpm test src/tests/<target>
pnpm typecheck
pnpm lint
```

## Cloudflare Pages configuration

Configure the project without custom build output transforms or worker bindings:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `pnpm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js version | `22.18.0` or compatible Node 24 |

Deploy only the checked-in application build. The build:

1. Generates types and runs TypeScript checks.
2. Generates changelog files.
3. Builds Vite output into `dist/`.
4. Copies required static assets from `public/` into `dist/` while excluding
   stale hashed JavaScript, CSS and source maps.
5. Checks the bundle.

The comprehensive test suite remains available as `pnpm run test:ci` and the
combined `pnpm run build:ci` command. Cloudflare Pages should use `pnpm run
build` so deployments do not repeat thousands of tests; CI can use
`pnpm run build:ci`.

Keep asset URLs root-relative. The app registers its service worker with a
relative scope and is intended to run at `/`; do not configure a subdirectory
base or add SPA rewrites unless the deployment location actually changes.

Cloudflare Pages DNS and custom-domain settings are managed outside this
repository. Do not add an application proxy or backend to serve MTProto.

## UI customization entry points

Start with existing UI structures instead of replacing layout or framework code:

- `src/components/` for Solid components and popup/tab implementations.
- `src/scss/` and neighboring `.module.scss` files for theme-aware styles.
- `src/stores/` and `src/lib/appManagers/` for state and manager access.
- `src/lang.ts` and the existing i18n conventions for localized text.
- `src/config/` for application constants and theme/configuration data.
- `src/components/popupSandbox/stories/` when a changed or new popup needs
  fixture coverage.

Preserve existing Telegram behavior: UI code must call manager methods rather
than raw MTProto APIs, account-bound actions must follow the starting session,
and new controls must follow native semantics, keyboard/focus behavior,
reduced-motion levels and RTL mirroring. Verify both text directions and every
shipped theme for visual changes.

## Testing and validation

Use the smallest suite that observes the change:

- `pnpm test src/tests/<target>` for unit and source checks.
- `pnpm typecheck` for TypeScript/SCSS type changes.
- `pnpm lint` for repository lint checks.
- `pnpm test:popups` for popup and popup-sandbox changes.
- `pnpm test:focus` or `pnpm test:a11y` for keyboard, focus or accessibility
  changes.
- `pnpm test:editor:e2e` for composer changes.
- The authenticated `:app` suites for signed-in UI behavior require a running,
  authorized preview.

For UI changes, verify the affected flow in a preview. Record only tests that
actually ran and succeeded; browser capability and signed-in flows that were
not available must be listed as not tested.

## Upstream synchronization

Keep the `origin` remote for this fork and add `upstream` once:

```bash
git remote add upstream https://github.com/TelegramOrg/Telegram-web-k.git
git fetch upstream
```

Create a dedicated synchronization branch and rebase or merge only upstream
changes into it:

```bash
git switch master
git pull --ff-only origin master
git switch -c chore/sync-upstream
git fetch upstream
git merge upstream/master
```

Resolve conflicts in small areas, preserving fork-only Cloudflare/PWA changes
and existing application behavior. Do not upgrade dependencies or resolve
unrelated drift while syncing. Run targeted tests and `pnpm run build`, review
the resulting diff, and open a Pull Request rather than merging or deploying
automatically.
