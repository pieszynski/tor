
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Project Overview

Angular 21 application using PrimeNG 21 (Aura theme) + Tailwind CSS v4 for UI. See [README.md](README.md) for project background.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/
ng test            # unit tests (Vitest)
ng generate component <name>   # scaffold component
```

## Tech Stack

- **Angular 21** — standalone components (no NgModules), signals, new control flow
- **PrimeNG 21** — UI components, configured with Aura theme preset in `src/app/app.config.ts`
- **Tailwind CSS v4** — utility classes via PostCSS (`@import 'tailwindcss'` in `styles.css`)
- **PrimeIcons** — icon font (`pi pi-*` classes)

## Code Generation Defaults

The project schematics are pre-configured (in `angular.json`):
- All new components use **inline templates and inline styles** (no separate `.html`/`.css` files)
- **Tests are skipped** by default for all schematics
- Component prefix: `tor` (e.g. `tor-root`, `tor-header`)

## Formatting

Prettier with `printWidth: 100`, `singleQuote: true`, Angular HTML parser for `.html` files.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
