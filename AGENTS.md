# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/`: feature pages and extension surfaces (Background, Content, Sandbox, CloudRecorder, EditorWebCodecs, etc.).
- `src/messaging/`: shared runtime message routing.
- `src/assets/` and `src/_locales/`: static assets and i18n strings.
- `utils/`: build/dev server scripts (`build.js`, `server.js`, `env.js`).
- `webpack.config.js`: extension bundling and multi-entry page setup.
- `patches/`: `patch-package` overrides applied on install.

## Build, Test, and Development Commands
- `npm start`: run development server and rebuild extension assets.
- `npm run build`: production build into `build/`.
- `npm run hot-reload` or `npm run dev`: webpack dev server with HMR.
- `npm run watch`: watch mode compile.
- `npm run clean`: recreate `build/`.
- `npm run package`: create `extension.zip` from `build/`.
- `npm run lint`: ESLint autofix for `src/**/*.js`.
- `npm run prettier`: format JS/TS/CSS/SCSS/JSON/MD.
- `npm run test:phase0`: required gate for current foundation slice (unit + integration).

## Coding Style & Naming Conventions
- JavaScript/React codebase, 2-space indentation, semicolons, double quotes (match existing files).
- Components: `PascalCase` (e.g., `PopupContainer.jsx`).
- Helpers/utilities: `camelCase` (e.g., `loginWithWebsite.js`).
- Prefer small, composable modules under existing feature folders instead of adding new top-level directories.
- Run `npm run lint` and `npm run prettier` before opening a PR.

## Testing Guidelines
- Current enforced baseline:
  1. `npm run test:phase0` passes.
  2. `npm run build` passes.
  3. Relevant unpacked-extension flows are manually validated.
- Test locations:
  - `tests/phase0/`: schema and repository contract tests.
  - `tests/infra/`: shared utility tests.

## Commit & Pull Request Guidelines
- Commit style in this repo is short, imperative, and scoped (e.g., `Fix recording duration issue`).
- Keep commits focused; avoid mixing refactors and behavior changes.
- PRs should include:
  - concise summary and motivation,
  - files/areas affected,
  - manual test steps,
  - screenshots/GIFs for UI changes,
  - linked issue/task when available.

## Security & Configuration Tips
- Never commit secrets. Use local `.env` for runtime values.
- Cloud/pro flows are controlled by env flags (`SCREENITY_*`); keep local-first behavior functional when unset.

## Migration Status (Handoff)
- Completed:
  - Phase 0 foundation from `ROADMAP.md` with schema migration + local project repository.
  - Local-first project create/load/save/list handlers in background.
  - Added stack migration layer:
    - `zustand` store scaffold (`src/core/state/cloudStore.js`),
    - `@tanstack/react-query` provider + auth query (`src/core/providers`, `src/core/query`),
    - `immer` state updater utility applied in Content/Sandbox context state setters,
    - `webext-bridge` background/content wrappers (`src/core/messaging`).
- Current entrypoints wrapped with shared providers:
  - `src/pages/Content/index.jsx`
  - `src/pages/Content/index.js`
  - `src/pages/Sandbox/index.jsx`
- Next recommended step:
  1. Move high-frequency context consumers to direct Zustand selectors.
  2. Replace remaining `chrome.runtime.sendMessage` auth/project callers with bridge client wrappers.
  3. Start Phase 1 (`Edit/Preview` shell + centralized editor store) only after tests are extended for new selectors/actions.
