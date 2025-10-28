# Repository Guidelines

## Project Structure & Module Organization
The Vue 3 + TypeScript app boots from `src/main.ts` with the router and Pinia stores. Routed pages live under `src/views`, shared layouts in `src/layouts`, and reusable widgets in `src/components`. State and data access are organised in `src/stores` and `src/services`; shared logic belongs in `src/composables` and `src/utils`. Global styling sits in `src/styles`, with Tailwind configuration in `tailwind.config.js` and PostCSS tweaks in `postcss.config.js`. WordNet assets and spreadsheets reside in `data/`, while production bundles land in `dist/`. Consult `vite.config.ts` and `tsconfig*.json` when extending build behaviour.

## Build, Test, and Development Commands
`npm run dev` launches the Vite dev server. `npm run build` runs `vue-tsc` type checks before producing optimized assets. `npm run preview` serves the latest build for release verification. `npm run lint` applies ESLint, `npm run format` enforces Prettier on `src/**/*.{vue,ts,css}`, and `npm run typecheck` performs a fast `vue-tsc --noEmit`. `npm run test` runs Vitest headlessly; `npm run test:ui` opens the interactive runner.

## Coding Style & Naming Conventions
ESLint extends `plugin:vue/vue3-recommended` and `@typescript-eslint`; Prettier enforces two-space indentation, single quotes, and omits semicolons. Prefer `<script setup>` in Vue SFCs, name components in PascalCase, composables in camelCase (`useSynsetGraph`), and Pinia stores as `useThingStore`. Co-locate domain types in `src/types` and favour explicit return types on shared helpers. Document any lint overrides with a brief comment.

## Testing Guidelines
Vitest powers unit and integration tests. Place specs beside the code (`Feature.spec.ts`) or within a local `__tests__` directory. Stub Cytoscape and external calls to keep tests deterministic, and pull sample payloads from `data/`. Run `npm run test` before pushing; attach `npm run test:ui` screenshots when demonstrating flaky behaviour. Target meaningful coverage for new stores, services, and critical view logic to guard regressions.

## Commit & Pull Request Guidelines
Recent history uses concise, imperative commits (often in Chinese, e.g., “快速创建关系时，界面不刷新”). Follow that tone: one logical change per commit, <= 70 characters in the subject, optional body for context or follow-up tasks. For PRs, include a summary, test evidence (`npm run test`, `npm run lint`, screenshots for UI changes), linked issues or documents, and any outstanding TODOs or data migrations.

## Environment & Configuration Tips
Use Node `18.18.0` (`nvm use`) to match local and CI tooling. Store secrets in untracked `.env.local` files and reference them via Vite’s `import.meta.env`. Large derived datasets should remain in `data/`; describe generation steps in the PR description so reviewers can reproduce them.
