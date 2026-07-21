# Contacts Management Dashboard

A Contacts Management Dashboard built as an Angular SPA with a companion
GraphQL Backend-for-Frontend (BFF). Customer service reps browse and inspect
contacts sourced from a mock REST API (mockapi.io), fronted by a single
GraphQL endpoint that batches away the N+1 email-address fetch problem.

## Architecture

```
                    ┌─────────────────────┐
                    │   Browser (SPA)     │
                    │  Angular 21 + Apollo │
                    │      Client cache    │
                    └──────────┬───────────┘
                               │  GraphQL over HTTP
                               │  (single /graphql endpoint,
                               │   proxied in dev to :4000)
                               ▼
                    ┌─────────────────────┐
                    │        BFF          │
                    │  Express + Apollo    │
                    │      Server 4        │
                    │  ┌────────────────┐  │
                    │  │  Resolvers     │  │
                    │  │  - contacts    │  │
                    │  │  - contact(id) │  │
                    │  │  - fullName    │  │
                    │  │  - emails ─────┼──┼──┐
                    │  └────────────────┘  │  │
                    │  ┌────────────────┐  │  │ Contact.emailAddresses
                    │  │  DataLoader    │◄─┼──┘ resolved through here,
                    │  │  (per-request  │  │    batched into ONE tick
                    │  │   email batch) │  │    per GraphQL query
                    │  └───────┬────────┘  │
                    └──────────┼───────────┘
                               │  REST (axios)
                               ▼
                    ┌─────────────────────┐
                    │     mockapi.io       │
                    │  /contacts            │
                    │  /contacts/:id/       │
                    │    email_addresses    │
                    └─────────────────────┘
```

**Why GraphQL instead of REST directly:** the REST source exposes two
endpoints — `/contacts` and `/contacts/{id}/email_addresses`. Fetching 20
contacts and then their emails naively fires 21 HTTP requests (the classic
N+1 problem). The BFF exposes one `/graphql` endpoint and resolves
`Contact.emailAddresses` through a per-request `DataLoader`, which collects
every contact id requested during a single GraphQL operation and dispatches
them together. Apollo Client on the frontend then normalises and caches
results by `id`, so navigating back to a previously viewed contact renders
instantly with zero re-fetch.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | Angular 21 (standalone, zoneless, signals, OnPush) — see [Assumptions](#assumptions--simplifications) |
| Language | TypeScript 5.9 (strict mode) |
| Styles | SCSS design tokens, no CSS-in-JS |
| GraphQL client | `apollo-angular` v14 / `@apollo/client` v4 |
| State | Apollo Client normalised cache + Angular signals (no NgRx) |
| BFF server | Node 20+, Express 4, Apollo Server 4, DataLoader |
| Testing | Angular's built-in unit-test builder (Vitest-backed) |
| Icons | Google Material Icons (CDN) |
| Font | Lato (Google Fonts CDN) |

No third-party UI/component library is used anywhere — every primitive
(avatar, status dot, icon button, tag badge) is hand-built.

## Prerequisites

- Node.js 20+ (developed against Node 24)
- npm 10+
- A free [mockapi.io](https://mockapi.io) account with two resources set up
  under one project: `/contacts` and the nested
  `/contacts/:contactId/email_addresses` (see field lists in the project
  spec / `MASTER_PROMPT_contacts_dashboard.md`)

## Setup

```bash
npm install                       # installs both workspaces (bff + frontend)
cp bff/.env.example bff/.env      # then edit bff/.env:
# MOCKAPI_BASE_URL=https://<your-project-id>.mockapi.io/api/v1
```

`MOCKAPI_BASE_URL` is required — there is no local/offline fallback data.
Until it's set, the BFF starts fine but every GraphQL query returns a clear
error telling you to configure it.

## Running the app

```bash
npm run dev
```

This starts both processes concurrently:
- **BFF** on `http://localhost:4000` (GraphQL endpoint at `/graphql`, health
  check at `/health`)
- **Angular dev server** on `http://localhost:4200`, with `/graphql` requests
  proxied to the BFF (see `frontend/proxy.conf.json`) — this avoids CORS
  configuration in dev and mirrors how a reverse proxy would front the BFF in
  production.

Open `http://localhost:4200` in a browser.

## Running tests

```bash
npm test
```

Runs the frontend's unit-test suite (Angular's `@angular/build:unit-test`
builder, Vitest-backed) — component specs for the shared UI primitives, the
contact list/detail views (via `RouterTestingHarness` + a mocked
`ContactService`), and `ContactService` itself (via `apollo-angular/testing`).

No end-to-end tests are included, per the project's scope.

## Assumptions & simplifications

- **Angular version:** the environment's installed Angular CLI is v21, not
  the v18 named in the original spec. The app was built against v21
  (standalone-by-default, zoneless change detection, signal inputs,
  `@if`/`@for` control flow, the Vitest-backed test builder) rather than
  downgrading the toolchain. `apollo-angular` v14 / `@apollo/client` v4 are
  used accordingly (the spec's `apollo-angular` v7 / Apollo Client v3 line
  targets Angular ≤17).
- **DataLoader batching:** mockapi.io's free tier has no `GET /contacts?ids=…`
  batch endpoint, so `bff/src/dataloaders/emailLoader.ts` batches by firing
  parallel individual requests (`Promise.all`) within one DataLoader tick
  rather than issuing a single batched HTTP call. This still fully solves the
  N+1 problem from the GraphQL layer's perspective — all ids requested during
  one query are collected and dispatched together instead of serially. In
  production, swap the loader's body for a real batched endpoint.
- **`status` field (contacts):** mockapi.io's free tier can't generate a
  random value from a custom enum list, so the schema field is a generic
  string. `bff/src/services/mockApiService.ts` normalises it deterministically
  via `parseInt(id, 10) % 3` so each contact always maps to the same status
  across re-fetches — no colour flicker on re-render or cache miss.
- **`label` field (email addresses):** same limitation, normalised via
  `parseInt(id, 10) % 2` → `"work" | "personal"`.
- **Missing nested email collections:** mockapi.io returns `404` (not `[]`)
  for `GET /contacts/:id/email_addresses` when that contact has zero seeded
  email records, rather than an empty array. `fetchEmailsByContactId` treats
  a 404 there as "no emails" and resolves to `[]`, mirroring how `getContact`
  already treats a 404 on `/contacts/:id` as "not found" → `null`.
- **Sidebar width:** the design-token dump listed `$sidebar-width: 636px`,
  which conflicts with the separately-specified responsive table (380px
  desktop / 280px tablet / full-width mobile). The responsive table was
  treated as authoritative; 636px was a Figma frame width, not a sidebar
  width.
- **Error handling / retries:** no retry logic or circuit breaker around the
  BFF's axios calls, and no custom Apollo error-policy/retry link on the
  frontend — both are marked with `// TODO: production would use …` comments
  at their call sites.
- **Phone numbers / social links:** mockapi.io's contact schema has no phone
  or social-profile fields, so the detail view renders static placeholder rows
  for "Phone" and "Social" rather than fabricating fake data.
- **Auth:** not implemented. A production deployment would validate a JWT in
  the BFF's Apollo context function and attach the authenticated principal to
  resolvers from there.
- **Apollo Server 4 EOL notice:** Apollo Server v4 reached end-of-life in
  January 2026. It was kept because the spec explicitly calls for it and it
  still functions correctly; a future maintenance pass should migrate to
  Apollo Server v5.
