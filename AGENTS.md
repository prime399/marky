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

## Coding Style & Naming Conventions
- JavaScript/React codebase, 2-space indentation, semicolons, double quotes (match existing files).
- Components: `PascalCase` (e.g., `PopupContainer.jsx`).
- Helpers/utilities: `camelCase` (e.g., `loginWithWebsite.js`).
- Prefer small, composable modules under existing feature folders instead of adding new top-level directories.
- Run `npm run lint` and `npm run prettier` before opening a PR.

## Testing Guidelines
- No formal automated test suite is currently configured.
- Minimum validation for each change:
  1. `npm run build` succeeds.
  2. Relevant flow works in unpacked extension (`chrome://extensions` -> Load unpacked `build/`).
  3. For recording/editor changes, test start, stop, and post-recording/editor paths.
- If adding tests, colocate with feature modules and document run command in PR.

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
