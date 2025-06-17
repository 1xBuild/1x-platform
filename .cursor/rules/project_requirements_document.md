# Project Requirements Document

## 1. Project Overview

“thep33l” is a full-stack web platform that empowers marketing teams to create, configure, and manage AI agents in one central dashboard. Each agent can have its own persona, system prompt, tools, env vars, triggers and selected OpenAI model (e.g., GPT-3.5, GPT-4). Agents can pull in data from external tools (like CryptoPanic news), hold conversational memory via Letta AI, and engage end users on Discord and Telegram as chatbots. The platform is built as a monorepo (pnpm) with a React/Vite/Tailwind front end and a Node.js/Express/TypeScript back end using SQLite for storage.

We are building this system to streamline the deployment and maintenance of AI-driven marketing assistants, reducing manual setup and enabling non-developers to tweak agent behavior on the fly. Success will be measured by:\
• Ease of creating and updating agents (CRUD)\
• Reliable two-way chat on Discord/Telegram\
• Quick data lookups through external tools\
• Smooth scheduling of automated messages\
• Responsive, secure admin interface

## 2. In-Scope vs. Out-of-Scope

**In-Scope (v1.0)**

*   Agent CRUD: create, read, update, delete AI agents with prompts/personas/model selection
*   Admin authentication: simple login (hardcoded credentials)
*   REST API: endpoints for agents, tools, triggers, and auth
*   Bot integration: Discord.js and Telegraf bots that route user messages to agents
*   External tools: enable/disable/configure CryptoPanic news integration
*   Scheduled triggers: define and run time-based or condition-based agent actions
*   API caching: layer to avoid redundant external calls
*   Data persistence: SQLite database with clear schema

**Out-of-Scope (Phase 2+)**

*   Production-grade authentication (SSO, OAuth, roles)
*   Multiple tools using mcp and get urls with credentials
*   Advanced analytics or dashboards beyond agent settings
*   Clean architecture and letta integration using CI/CD pipelines
*   Full Docker configurations (may be documented but not required)

## 3. User Flow

A marketing team member lands on the `/login` page, enters their credentials, and submits. The front end calls `POST /api/auth/login`; on success, a token is returned and stored in memory (or cookie). The user is redirected to `/admin`, which loads the dashboard layout: a sidebar with “Agent Manager,” “Tools Manager,” and “Triggers Manager” links and a main content area that displays the selected section.

In “Agent Manager,” the user sees a list of agents. They click “New Agent,” fill in name, persona description, system prompt, and pick a model version. Submitting fires `POST /api/agent`. To update an agent, they click “Edit,” adjust fields, and send `PUT /api/agent/:id`. In “Tools Manager,” the user toggles CryptoPanic on/off per agent via calls to `/api/tools`. In “Triggers Manager,” they define a schedule (e.g., every hour) or event-based condition, assign it to an agent, and save via `/api/triggers`. Meanwhile, background services keep the Discord and Telegram bots running; when an external user sends a message, the bot service identifies the agent, calls Letta AI/OpenAI, and posts the reply back.

## 4. Core Features

*   **AI Agent Management**\
    • Full CRUD for agents (name, persona, prompt, model version)\
    • Integration with Letta AI for memory/context and tool orchestration
*   **Admin Dashboard**\
    • React + Vite UI with Tailwind CSS and shadcn/ui components\
    • Sections for Agent Manager, Tools Manager, Triggers Manager
*   **Bot Integrations**\
    • Discord.js bot (`discord-bot.ts`) listens to channels & DMs\
    • Telegraf bot (`telegram-bot.ts`) handles Telegram chats\
    • Automatic routing: User → Bot → Agent service → AI → Bot → User
*   **External Tool System**\
    • Configurable tools per agent (e.g., CryptoPanic news fetcher)\
    • Enable/disable and parameter settings in UI
*   **Scheduled Triggers**\
    • Define time-based or condition-based tasks\
    • Cron-style or interval scheduling engine
*   **Authentication**\
    • Basic login endpoint with hardcoded credentials (for internal use)
*   **API Caching**\
    • In-memory or simple file cache to store recent external API responses
*   **Data Persistence**\
    • SQLite database (`db.ts`) storing agents, tools, triggers

## 5. Tech Stack & Tools

*   **Frontend**\
    • React (UI library)\
    • Vite (dev server & build tool)\
    • Tailwind CSS (utility-first styling)\
    • shadcn/ui (prebuilt React components)
*   **Backend**\
    • Node.js (runtime)\
    • Express.js (web framework)\
    • TypeScript (static typing)\
    • SQLite (lightweight file DB)\
    • pnpm (monorepo package manager)
*   **AI & LLM Integration**\
    • OpenAI API (gpt-4o-mini models) used for simple request\
    • Letta AI (agent memory, context, orchestration)
*   **Messaging Bots**\
    • Discord.js (Discord API client)\
    • Telegraf (Telegram bot framework)
*   **Dev & Build Tools**\
    • ESLint, Prettier (code quality & formatting)\
    • Husky (Git hooks)\
    • Jest (unit/integration tests)\
    • Cursor (AI-powered IDE plugin)
*   **Deployment**\
    • Vercel (frontend hosting)\
    • Docker (optional containerization)

## 6. Non-Functional Requirements

*   **Performance**\
    • Admin UI load time < 300 ms for main pages\
    • Bot response time < 1 s for routine queries\
    • Cache hit rate ≥ 70% for repeated API calls
*   **Security**\
    • All API keys and secrets in environment variables\
    • HTTPS for all client-server communications\
    • OWASP fundamentals: input sanitization, rate limiting
*   **Scalability**\
    • Stateless backend endpoints (can be horizontally scaled)\
    • SQLite for v1, with plan to swap to a more concurrent DB later
*   **Maintainability**\
    • Modular code split (services, controllers, routes)\
    • Strict linting/prettier rules enforced via pre-commit hooks
*   **Usability**\
    • Clear, self-explanatory UI forms with validation messages\
    • Accessible components (keyboard navigation, ARIA labels)

## 7. Constraints & Assumptions

*   **Constraints**\
    • Uses SQLite—limited concurrency (single-writer).\
    • Limited to hardcoded admin credentials in v1.\
    • Discord and Telegram rate limits apply.\
    • Relies on Letta AI availability for memory/context features.
*   **Assumptions**\
    • Internal marketing team will be the sole users initially.\
    • Model keys (OpenAI) will have sufficient quota for testing.\
    • CryptoPanic API provides stable, documented endpoints.\
    • Single-region deployment; latency to AI services is acceptable.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits**\
    • OpenAI and CryptoPanic impose call quotas. Mitigate with caching, exponential backoff, and request batching.
*   **Database Locking**\
    • SQLite can lock under concurrent writes. Plan to migrate to PostgreSQL or MySQL if load increases.
*   **Scheduling Drift**\
    • Node.js timers may drift over long uptime. Use a robust scheduler (node-cron) and persistence.
*   **Bot Platform Changes**\
    • Discord/Telegram API updates could break integrations. Track SDK versions and pin dependencies.
*   **Authentication Security**\
    • Hardcoded credentials pose a risk. For v2, integrate JWT/OAuth and rotate secrets regularly.

This document serves as the single source of truth for the AI model and all subsequent technical deliverables. Each section is crafted to leave no ambiguity about features, flows, or technologies, allowing smooth transitions into detailed architecture, front-end guidelines, back-end structures, and security policies.
