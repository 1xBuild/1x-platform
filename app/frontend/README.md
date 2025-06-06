# Frontend Admin – Quick Documentation

## Overview

This admin frontend lets you manage AI agents through a modern React interface (Vite + Tailwind + shadcn/ui). It includes simple authentication, an admin dashboard, and an architecture ready to evolve.

---

## Main Features

- **Secure login** (ID: Rick, PW: ricksanchez)
- **Protected routing** (`/admin` accessible only if authenticated)
- **UI components**: shadcn/ui, Tailwind
- **Logout button** (top right on all protected pages)
- **AgentManager**: advanced UI for agent management (currently static)

---

## Folder Structure

```
src/
  components/
    AgentManager.tsx      # Main admin UI
    AuthGuard.tsx         # Route protection + Logout
    login-form.tsx        # Login form
    ui/                   # shadcn/ui components (button, card, ...)
  pages/
    Login.tsx             # Login page
    Admin.tsx             # Admin dashboard page
  lib/
    utils.ts              # Utility functions (cn, ...)
  App.tsx                 # Main routing
```

---

## Authentication

- Login via `/login` (ID: Rick, PW: ricksanchez)
- Authentication stored in `localStorage` (`isAuthenticated`)
- Logout: clears auth and redirects to `/login`

---

## How to Evolve the Codebase

- **Connect the backend**: replace static data with API calls (fetch/axios)
- **Add tests**: Vitest + Testing Library
- **Improve UX**: user feedback, loaders, toasts
- **Add roles, advanced auth, etc.**
- **Document each component**

---

## Running the Project

```bash
pnpm install
pnpm dev
```

---

## Evolving TODO

- [ ] Connect backend API
- [ ] Dynamic agent management
- [ ] Unit tests
- [ ] Detailed documentation
- [ ] CI/CD, lint, formatting

---

_This README will evolve as the project grows._
