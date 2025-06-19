# Backend Structure Document

## 1. Backend Architecture

**Overview**
- Built with **Node.js** and **Express.js**, written in **TypeScript**.
- Organized with a **Model–Service–Controller** pattern:
  - **Controllers** handle incoming HTTP requests.
  - **Services** encapsulate business logic (AI orchestration, scheduling, caching).
  - **Data access layer** (`db.ts`) performs SQL queries against SQLite.
- Uses a **monolithic** but **modular** codebase: clear folders for routes, controllers, services, and models.

**Scalability**
- Stateless REST API: any number of Node.js instances can run behind a load balancer.
- **API caching** layer reduces load on external AI and data services.

**Maintainability**
- Enforced code style and quality via **ESLint**, **Prettier**, and **Husky** pre-commit hooks.
- **TypeScript** static typing catches bugs early and clarifies data contracts.
- Modular structure makes it easy to add new features (agents, tools, triggers).

**Performance**
- Non-blocking I/O model of Node.js handles many concurrent bot interactions.
- In-memory caching for repeated external calls (e.g., CryptoPanic news).
- Scheduled tasks run in the background with minimal impact on request handling.

## 2. Database Management

**Database Technology**
- **SQLite** (SQL, file-based) for persistent storage of:
  - AI agents and their configurations
  - Tools and tool assignments to agents
  - Scheduled triggers
  - Admin user credentials
  - API cache entries

**Data Structure & Access**
- Data stored in normalized tables with clear foreign‐key relationships.
- Accessed via a single `db.ts` module using parameterized SQL queries to prevent injection.
- Reads and writes are wrapped in async/await calls for clarity and error handling.

## 3. Database Schema

**Human-Readable Description**
- **Users**: Stores admin login credentials.
- **Agents**: Each AI agent profile (name, persona, system prompt, model version).
- **Triggers**: Scheduled or event-based actions tied to specific agents.
- **ApiCache**: Stores recent external API responses for performance.

**SQL Schema (SQLite dialect)**

## 4. API Design and Endpoints

**Approach**
- Fully **RESTful**, JSON-based API.
- All endpoints prefixed with `/api`.

**Authentication**
- **POST /api/auth/login**: Validate credentials, return a session token.
<!-- TODO: - **GET  /api/auth/me**: Return current user details. -->

**Agent Management**
- **GET    /api/agents**: List all agents.
- **GET    /api/agents/:id**: Get a single agent’s details.
- **POST   /api/agents**: Create a new agent profile.
- **PUT    /api/agents/:id**: Update an existing agent.
- **DELETE /api/agents/:id**: Remove an agent.

**Tool Management**
<!-- TODO: - **GET  /api/tools**: List available tools. -->
<!-- TODO: - **PUT  /api/tools/:id**: Update tool configuration (e.g., enable/disable for all agents). -->
<!-- TODO: - **POST /api/agents/:agentId/tools**: Assign a tool to an agent. -->
<!-- TODO: - **DELETE /api/agents/:agentId/tools/:toolId**: Remove a tool from an agent. -->
- **POST  /api/crypto-panic**: enable CryptoPanic
- **GET  /api/crypto-panic**: get CryptoPanic status

**Trigger Management**
<!-- TODO: - **GET    /api/triggers**: List all triggers. -->
<!-- TODO: - **POST   /api/triggers**: Create a new trigger (schedule or event). -->
<!-- TODO: - **PUT    /api/triggers/:id**: Update trigger settings. -->
<!-- TODO: - **DELETE /api/triggers/:id**: Remove a trigger. -->

- **POST   /api/triggers/telegram**: enable Telegram
- **GET    /api/triggers/telegram**: get Telegram status

- **GET    /api/triggers/schedule**: get Schedule trigger
- **POST   /api/triggers/schedule**: upsert Schedule trigger
- **GET    /api/triggers/schedule/all**: get all Schedule triggers
- **DELETE /api/triggers/schedule**: delete Schedule trigger

**Health Check & Misc**
- **GET /api/health**: Returns `200 OK` when backend is running.

## 5. Hosting Solutions

**Containerized Deployment**
- No Docker yet
- server + letta are hosted on railway
- Frontend is hosted on vercel

## 6. Infrastructure Components

TODO

## 7. Security Measures

- **Authentication & Authorization**
  <!-- TODO: - Simple login for v1; future versions to use **JWT** or **OAuth2** with roles. -->
- **Input Validation & Sanitization**
  - Use libraries like **Joi** or **Zod** in Express middleware to validate all request bodies.
- **HTTP Hardening**
  - **Helmet** middleware for secure HTTP headers.
  - **CORS** configured to allow only trusted origins.
  - **Rate limiting** (express-rate-limit) to prevent brute-force and abuse.
- **Secure Configuration**
  - No secrets in source control; `.env` templates only.

## 8. Monitoring and Maintenance

- **Logging & Metrics**
  <!-- TODO: - **Pino** for structured application logs. -->
- **Error Tracking**
  <!-- TODO: - **Sentry** integration captures unhandled exceptions and performance traces. -->
- **Health Checks & Alerts**
  - Railway alerts are sent on discord
  <!-- TODO: - Function to send errors in discord (via sentry) -->
- **Database Backups**
  <!-- - Add Backup on railway (upgrade plan) -->
- **Maintenance Strategy**
  - rolling deployments via Railway for zero-downtime updates.

## 9. Conclusion and Overall Backend Summary

This backend design provides a clear, modular, and scalable foundation for **thep33l**:
- A **RESTful**, TypeScript-driven server with Node.js and Express.
- Lightweight **SQLite** storage for v1.
- Comprehensive **API endpoints** for admin workflows and bot integrations.
- **Docker**-based deployment on **AWS ECS Fargate**, offering auto-scaling, reliability, and cost controls.
- Essential infrastructure based on railway and vercel.
- Solid agent infrastructure using letta.
- Ongoing robust **security** and **monitoring** practices to protect data and ensure uptime.
