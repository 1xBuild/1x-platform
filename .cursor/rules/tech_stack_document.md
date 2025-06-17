# Tech Stack Document

This document outlines the technology choices for **thep33l**, a full-stack platform that allows marketing teams to manage AI agents, integrate them with messaging channels, and connect to external data sources. It explains each component in everyday language so that anyone—technical or not—can understand why these tools were chosen and how they work together.

## Frontend Technologies

The frontend is what users see and interact with in their web browser. Our choices here aim to deliver a fast, responsive, and easy-to-use interface.

*   **React**

    *   A popular library for building dynamic web interfaces. It lets us break the UI into reusable pieces (components), making development faster and the app easier to maintain.

*   **Vite**

    *   A modern build tool that provides a lightning-fast development server and quick builds for production. It helps developers see changes instantly as they code.

*   **Tailwind CSS**

    *   A utility-first styling framework. Instead of writing custom CSS for every element, we compose small, descriptive utility classes. This speeds up design and ensures consistent styling across the app.

*   **shadcn/ui**

    *   A set of ready-made, accessible React components built on top of Tailwind. It saves design time and guarantees that common UI patterns (buttons, forms, dialogs) look great and work well on all devices.

Why these choices improve user experience:

*   Instant feedback during development (Vite) leads to a more polished final product.
*   Consistent, responsive design (Tailwind + shadcn/ui) makes the interface intuitive and mobile-friendly.
*   Modular components (React) enable quick updates and keep the UI reliable as features grow.

## Backend Technologies

The backend powers the application’s logic, data storage, and integrations. It handles requests from the frontend, talks to AI services, and stores configuration data.

*   **Node.js**

    *   A JavaScript runtime for the server. It’s lightweight and scales well, making it ideal for handling real-time interactions like chatbots.

*   **Express.js**

    *   A minimal web framework on top of Node.js. It simplifies the creation of API endpoints (e.g., `/api/agent`, `/api/auth/login`) and middleware for tasks like authentication.

*   **TypeScript**

    *   A superset of JavaScript that adds static typing. By catching many errors at “compile time,” it improves code quality, maintainability, and team collaboration.

*   **SQLite**

    *   A file-based relational database. It’s simple to set up (no separate server) and stores all agent profiles, tool settings, and scheduled triggers in a single file.

*   **pnpm**

    *   A fast, space-efficient package manager. In our monorepo setup, it ensures that frontend and backend dependencies are installed consistently and only once.

*   **API Caching Module**

    *   A lightweight layer that stores recent external API responses (e.g., CryptoPanic news) in memory. This reduces duplicate calls, speeds up responses, and cuts down on usage costs.

How these components work together:

1.  The frontend sends requests to Express endpoints.
2.  Express (in Node.js) routes each request to the right controller.
3.  Controllers use TypeScript-enforced services to read/write data in SQLite or call external APIs.
4.  Responses (data or errors) are sent back to the frontend.

## Infrastructure and Deployment

This section covers how we host, version, and deploy the application, ensuring it’s reliable and easy to update.

*   **Version Control (Git + GitHub)**

    *   All code is tracked in Git, with GitHub as the remote repository. This provides history, collaboration tools, and code reviews.

*   **Monorepo Structure (pnpm Workspaces)**

    *   Frontend and backend live in one repository but in separate folders. Shared tools (like linting rules) are managed in a central place.

*   **CI/CD Pipelines (GitHub Actions)**

    *   Automated workflows run on every push:

        *   **Lint & Format**: ESLint and Prettier check code style.
        *   **Tests**: Jest runs unit and integration tests to catch regressions early.
        *   **Deployment**: On successful tests, the frontend can be deployed to Vercel, and backend containers can be built.

*   **Hosting Platforms**

    *   **Vercel** for the frontend: offers serverless deployments with zero-configuration builds.
    *   **Docker (Optional)** for the backend: containerizes the Node.js service, making it easy to run on any server or container platform.

*   **Environment Management**

    *   Sensitive keys (OpenAI, CryptoPanic) and configuration values live in environment files (`.env`), never in source control.

*   **Git Hooks (Husky)**

    *   Automates tasks before commits and pushes (e.g., run lint, run tests), ensuring code quality.

These choices make deployments mostly automatic, reduce human error, and allow the team to roll back safely if needed.

## Third-Party Integrations

Our platform depends on a few external services to add AI intelligence and real-time data.

*   **OpenAI**

    *   Provides powerful language models (e.g., GPT-3.5, GPT-4) that power agent conversations.

*   **Letta AI**

    *   Manages conversational memory, context, and tool orchestration for agents, ensuring interactions feel coherent over multiple messages.

*   **CryptoPanic**

    *   An external news API for cryptocurrency updates. Agents can fetch the latest headlines or market data when this tool is enabled.

*   **Discord.js**

    *   A Node.js library to connect to Discord, listen for messages, and send replies, turning each AI agent into a Discord bot.

*   **Telegraf**

    *   A framework for building Telegram bots in Node.js, enabling agents to talk to users on Telegram.

Benefits of these integrations:

*   Agents become instantly conversational without building NLP from scratch (OpenAI).
*   Memory and complex workflows are handled by Letta AI, reducing custom code.
*   CryptoPanic adds timely, real-world data for marketing alerts.
*   Discord.js and Telegraf let us support two popular chat platforms with minimal extra code.

## Security and Performance Considerations

We balance smooth performance with solid security measures to protect data and user trust.

**Security**

*   **Authentication**

    *   A simple login system for v1 (hardcoded credentials). All future versions will use industry-standard methods (JWT, OAuth).

*   **Environment Variables**

    *   API keys and secrets live in `.env` files and are never pushed to Git.

*   **HTTPS**

    *   All communication between clients and servers should use SSL/TLS in production.

*   **Input Validation & Sanitization**

    *   Express middleware checks incoming data to prevent common attacks (e.g., SQL injection).

*   **Rate Limiting**

    *   (Planned) Prevent bots or users from spamming endpoints or external APIs.

**Performance**

*   **API Caching**

    *   Reduces repeated external calls (CryptoPanic, OpenAI) by reusing cached responses.

*   **Fast Builds & Hot Reload**

    *   Vite’s instant page updates speed up development and testing.

*   **Lightweight Database**

    *   SQLite is fast for small to medium workloads; migrations to more robust DBs (PostgreSQL) are planned as usage grows.

*   **Code Quality Tools**

    *   ESLint and Prettier keep code consistent, making it easier to spot and fix slow code paths.

## Conclusion and Overall Tech Stack Summary

We’ve chosen a modern, cohesive set of tools that work together to meet thep33l’s goals:

*   **Frontend**: React + Vite + Tailwind CSS + shadcn/ui for a fast, responsive, and maintainable interface.
*   **Backend**: Node.js + Express.js + TypeScript + SQLite + pnpm for scalable server logic, data management, and easy dependency handling.
*   **Infrastructure**: GitHub + GitHub Actions + Husky + Vercel (+ Docker) for reliable versioning, testing, and deployments.
*   **Third-Party Services**: OpenAI, Letta AI, CryptoPanic, Discord.js, Telegraf to power agent conversations, memory, and multi-channel interactions.
*   **Security & Performance**: Environment variable management, caching, input validation, and code linting/tests to ensure a smooth, safe user experience.

Together, these technologies provide a solid foundation that is easy to develop, secure to operate, and simple for marketing teams to use. As the platform grows, each layer can be scaled or replaced with minimal disruption, ensuring long-term reliability and flexibility.
