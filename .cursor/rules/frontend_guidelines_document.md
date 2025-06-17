# Frontend Guideline Document

## 1. Frontend Architecture

Our frontend is a modular, component-based React application built and served with Vite. Here’s how it all fits together:

- **Monorepo Structure (pnpm Workspaces)**
  - Frontend code lives under `/apps/frontend` alongside the backend. Shared configs (ESLint, Prettier) and scripts are at the repo root.
- **React + Vite**
  - **React** handles the UI as a tree of reusable components.
  - **Vite** provides an ultra-fast development server, hot module replacement, and optimized production builds with out-of-the-box code splitting.
- **Component Library (shadcn/ui)**
  - A set of accessible, themeable React components built with Radix UI and styled by Tailwind CSS.
- **Utility-First Styling (Tailwind CSS)**
  - We apply small, composable classes instead of writing bespoke CSS for each component.

This architecture supports:
- **Scalability**: Clear folder separation (atoms → molecules → organisms) and pnpm workspaces let us add features without tangled dependencies.
- **Maintainability**: Shared linting, formatting, and type checking; small components with single responsibilities keep code easy to read and update.
- **Performance**: On-demand code loading, tree shaking, and a fast dev server ensure snappy feedback during development and efficient bundles in production.

## 2. Design Principles

### Usability
- **Intuitive Flows**: Clear forms, buttons, and labels guide users through logging in, creating agents, configuring tools, and scheduling triggers.
- **Feedback & States**: Loading spinners, success toasts, and error messages keep users informed.

### Accessibility
- **Keyboard Navigation**: All interactive elements are reachable via Tab, with visible focus outlines.
- **ARIA Attributes**: We annotate custom components (modals, dialogs, tooltips) so screen readers can interpret them.
- **Color Contrast**: Our palette meets WCAG AA standards for text and background combinations.

### Responsiveness
- **Mobile-First**: Layouts use Tailwind’s responsive utilities to stack and resize elements on small screens.
- **Fluid Grids**: Containers adapt to viewport width while maintaining readable line lengths and touch targets.

## 3. Styling and Theming

### Approach & Methodology
- **Utility-First CSS (Tailwind)**: We compose design directly in JSX using descriptive class names (e.g., `px-4 py-2 bg-primary text-white rounded`).
- **Component Overrides (shadcn/ui)**: When we need brand-specific styles, we wrap or extend shadcn UI components with additional Tailwind classes.
- **No External CSS Files**: All styles live in JSX or in `tailwind.config.js` for global settings.

### Theming
- **Light / Dark Mode**: Controlled via a `ThemeContext`. We use Tailwind’s `dark:` variant to switch colors.
- **Design Tokens** in `tailwind.config.js`:
  - Extend `colors`, `fontFamily`, and `spacing` to match our brand guidelines.

### Visual Style
- **Modern Flat Design** with subtle glassmorphism effects in modals and cards:
  - Semi-transparent backgrounds with light blur (`backdrop-blur-sm`) for overlays.
  - Soft shadows (`shadow-lg`) for depth without skeuomorphism.

### Color Palette
| Name         | Hex      | Usage                         |
|--------------|----------|-------------------------------|
| Primary      | #2563EB  | Buttons, links, highlights    |
| Secondary    | #1E293B  | Sidebars, footers             |
| Accent       | #F59E0B  | Callouts, badges              |
| Success      | #16A34A  | Success messages, icons       |
| Warning      | #D97706  | Warnings, alerts              |
| Error        | #DC2626  | Error messages, icons         |
| Background   | #F8FAFC  | Page background (light mode)  |
| Surface      | #FFFFFF  | Cards, dialogs                |

### Typography
- **Font Family**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Sizes & Weights** (via Tailwind):
  - `text-base` (16px) for body copy;
  - `text-lg` / `text-xl` for headings;
  - `font-medium` for labels and buttons;
  - `font-semibold` / `font-bold` for titles and calls to action.

## 4. Component Structure

We organize components in a clear, layered folder structure under `src/components`:

- **Atoms**: Smallest building blocks (e.g., Button, Input, Badge).
- **Molecules**: Combinations of atoms (e.g., FormField with label + input + error message).
- **Organisms**: Full sections of UI (e.g., AgentCard, ToolToggleList).
- **Templates / Pages**: Layouts that assemble organisms into routes (e.g., LoginPage, AdminDashboard).

### Reuse & Single Responsibility
- Each component does one job and accepts props to customize behavior and style.
- Shared logic (data fetching hooks, context providers) lives in `src/hooks` or `src/context`.
- We avoid deeply nested props by splitting complex UIs into smaller pieces.

## 5. State Management

### Local State (useState, useReducer)
- Used for UI interactions (e.g., form inputs, modal open/close).

### Global State (Context API)
- **AuthContext**: Tracks user login status and stores the auth token.
- **ThemeContext**: Manages light/dark mode selection.

### Data Fetching
- **Custom Hooks**: `useAgents`, `useTools`, `useTriggers` encapsulate REST calls to our `/api/*` endpoints.
- Hooks handle loading, error, and data states internally.

## 6. Routing and Navigation

We use **React Router v6** to define client-side routes:

- `/login` → `LoginPage`
- `/admin` → `AdminLayout` (private, requires auth)
  - `/admin/agents` → `AgentManagerPage`
  - `/admin/tools` → `ToolsManagerPage`
  - `/admin/triggers` → `TriggersManagerPage`

### Navigation Patterns
- **Protected Routes**: A `<RequireAuth>` wrapper redirects unauthenticated users to `/login`.
- **Sidebar Navigation**: A persistent sidebar (on wider screens) or hamburger menu (on mobile) lists admin sections.
- **Breadcrumbs / Titles**: Page titles update based on route for clarity and SEO.

## 7. Performance Optimization

- **Code Splitting**: Lazy-load page components with `React.lazy` and `Suspense` to reduce initial bundle size.
- **Image & Asset Optimization**: Use `.webp` or optimized SVGs; leverage Vite’s asset handling.
- **Memoization**:
  - `React.memo` for components that receive unchanged props.
  - `useMemo` / `useCallback` to avoid unneeded recalculations.
- **Tailwind Purge**: Configured in `tailwind.config.js` to remove unused CSS in production.
- **HTTP Caching**: Leverage browser cache headers and ETags on static assets.

## 8. Testing and Quality Assurance

### Linting & Formatting
- **ESLint**: Runs on every commit (via Husky) and CI to enforce code standards.
- **Prettier**: Formats code consistently, automatically applied on save.

### Unit & Integration Tests
- **Jest** + **React Testing Library**:
  - Unit tests for atoms and molecules.
  - Integration tests for pages and data-driven flows (e.g., creating an agent).
  - Mock network requests with `msw` (Mock Service Worker) to simulate API responses.

### End-to-End (E2E) Testing (Future)
- We plan to introduce **Cypress** or **Playwright** for full flows: login → agent CRUD → tool toggle → trigger scheduling.

## 9. Conclusion and Overall Frontend Summary

This guide captures the core setup and conventions for our React-based admin interface:

- A **fast, scalable architecture** built on Vite, React, Tailwind CSS, and shadcn/ui.
- **Design principles** that prioritize usability, accessibility, and responsiveness.
- A **modern flat style** (with subtle glassmorphism) driven by utility classes and a clear color palette.
- **Component layering** that encourages reuse and single-responsibility.
- **Lightweight state management** via React hooks and Context API.
- **React Router** for intuitive navigation, complemented by code splitting and memoization for top performance.
- **Robust QA** with ESLint, Prettier, Jest, and plans for E2E coverage.

Together, these guidelines ensure any contributor—developer or marketer—can understand, navigate, and extend the frontend with confidence, delivering a consistent, high-performance user experience as our AI agent platform evolves.