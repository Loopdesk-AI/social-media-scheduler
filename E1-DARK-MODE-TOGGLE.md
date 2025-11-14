# E1. Dark Mode Toggle

This document describes the "Dark Mode Toggle" feature added to the project and how to run and test it.

## Summary

- Adds a theme system using a React Context (`ThemeContext`) and a `useTheme` hook.
- Persists user's theme preference to `localStorage` and restores it on load.
- Applies theme globally by setting `data-theme="light"` or `data-theme="dark"` on the `<html>` element.
- CSS variables are used for colors so the UI updates instantly when the theme changes.
- Includes unit tests (Vitest + React Testing Library) that cover toggling, DOM updates, persistence, and restore.

## Files added / modified

- `src/lib/ThemeContext.tsx` — ThemeContext and `ThemeProvider` (persistence + html[data-theme]).
- `src/lib/useTheme.tsx` — Hook for consuming the context.
- `src/index.tsx` — App wrapped with `ThemeProvider`.
- `src/components/Navigation.tsx` — Toggle button (moved to top of side pane) and styles updated to use CSS variables.
- `src/components/CalendarView.tsx` — Calendar updated to use CSS variables so it appears white with black text in light mode.
- `src/index.css` — CSS variables for light and dark themes (using `html[data-theme="..."]`).
- `src/types/index.ts` — `Theme` type added (`'light' | 'dark'`).
- `src/lib/ThemeContext.test.tsx` — Tests for the ThemeContext.
- `package.json` — test script and test devDependencies added.

## Implementation details

- Theme detection order (on initial load):

  1. If `localStorage.getItem('theme')` exists and is `'light'` or `'dark'` → use it.
  2. Else: use `window.matchMedia('(prefers-color-scheme: dark)')` result.
  3. Else: fallback to `'light'`.

- The `ThemeProvider` sets the attribute on the document with:

```ts
document.documentElement.setAttribute("data-theme", theme);
localStorage.setItem("theme", theme);
```

- Colors are defined as CSS variables in `src/index.css`. Components should use these variables (e.g. `hsl(var(--card))`, `hsl(var(--card-foreground))`) to react instantly to theme changes.

## How to run (dev)

1. Install dependencies (if you haven't already):

```cmd
npm install
```

2. Start the dev server:

```cmd
npm run dev
```

3. Open the app in the browser. Toggle the theme using the moon/sun button at the top of the left side pane. The calendar should be white with black text in light mode.

## Tests

Run tests with Vitest:

```cmd
npm test
```

What the tests cover (file: `src/lib/ThemeContext.test.tsx`):

- Default theme selection (no localStorage, no prefers-color-scheme).
- Toggle functionality flips theme and updates `document.documentElement.dataset.theme`.
- Theme persistence in `localStorage` after toggling.
- Restoring theme from `localStorage` on mount.
- Using `prefers-color-scheme` if no `localStorage` value.

Notes about testing environment:

- Tests use a jsdom environment (file includes `// @vitest-environment jsdom`) so `localStorage`, `document`, and `window.matchMedia` are available.
- The tests mock `window.matchMedia` so you can assert behavior depending on the system preference.

## Troubleshooting

- If tests complain about `localStorage is not defined`, ensure Vitest runs in jsdom. You can add a `vitest.config.ts` to set `test.environment = 'jsdom'` globally.
- If the UI doesn't update after toggle, verify components use CSS variables (e.g., `hsl(var(--background))`) for colors instead of hard-coded Tailwind color classes like `bg-black` or `text-white`.

## Next steps (suggestions)

- Migrate more components to use CSS variables instead of Tailwind hard-coded colors for consistent theming.
- Add a small accessibility enhancement: persist prefers reduced-motion and consider adding keyboard focus styles for the toggle.
- Add an app-level `vitest.config.ts` so test environment doesn't need the file-level directive.

---

If you want, I can add a `vitest.config.ts` now, or scan the codebase and prepare a PR that converts all remaining hard-coded colors to variables.
