---
name: verify
description: Build/launch/drive recipe for the Clance monorepo (NestJS API + Next.js web)
---

# Clance verify recipe

## Launch

Postgres: `docker compose -f docker-compose.yml ps postgres` (usually already up on port 5433 via `clance-postgres-1`). If not: `pnpm db:up` from `apps/api`.

Schema changes: `cd apps/api && pnpm db:push` (uses `drizzle-kit push`, no migration files to write by hand — just edit `src/database/schema/*.ts` and push).

API: `cd apps/api && pnpm start` (or `start:debug` for `--inspect`). Listens on port 4000, no global prefix (routes are bare `/auth/login`, `/projects/:id/...`, etc — NOT `/api/...`). Check `pnpm dev` isn't already backgrounded from a previous session (`lsof -i :4000`) — kill and restart fresh after any code change since `pnpm start` (non-watch) doesn't hot reload.

Web: `cd apps/web && pnpm dev`. Listens on port 3000. Frontend calls hit `/api/...` which Next.js route handlers in `app/api/**/route.ts` proxy to the NestJS backend via `lib/server/auth.ts`'s `proxyToApi`/`proxyRawToApi`. New backend modules need a matching proxy route added under `apps/web/app/api/<name>/`.

Both together: `pnpm dev` from repo root (turbo).

## Auth for direct API testing

No fixture users — sign up a disposable one: `POST /auth/signup` with `{email, password, first_name, last_name}` returns `access_token` directly (no email verification needed for password signup). Use `Authorization: Bearer <token>` for direct curl testing, or drive the real login form in a browser (`/login`) for UI tests.

To get a second project member for multi-user notification/push testing: `POST /projects/:id/invite` with `{email, role}`, then grab the `invite_token` column directly off the `members` row in Postgres (`SELECT invite_token FROM members WHERE user_id = '...'`) since there's no separate invites table — and accept via `POST /projects/accept-invite` with `{token}` as the invited user. Membership must be `status = 'active'` (not `pending`) before that user shows up in any active-member queries (notifications, meeting creation, etc).

## Gotchas hit during verification

- **`middleware.ts` allowlist**: any new public static file under `apps/web/public/` (manifest, service worker, icons) needs an explicit exemption in `apps/web/middleware.ts`'s early-return block, or it 307-redirects to `/login` for unauthenticated requests — including the browser's own service-worker registration fetch, which fails with "script resource is behind a redirect."
- **NestJS `204 No Content` through the proxy**: `NextResponse.json(null, {status: 204})` throws at runtime (a 204 response can't carry a body). `lib/server/auth.ts` has a `jsonResponse()` helper that returns a bare `new NextResponse(null, {status})` for 204/304 — reuse it, don't call `NextResponse.json` directly with a status that might be 204.
- **Drizzle `.update().set({})`**: an empty `SET` clause is invalid SQL and throws. Any `update()` service method built from a partial DTO needs a short-circuit no-op when every field is `undefined`.
- **`class-validator` `@ValidateNested()` does NOT imply required**: if the property itself is `undefined` (not present in the body), nested validation is skipped entirely — the DTO passes with the nested field `undefined`, and consuming code crashes with a raw 500 instead of a clean 400. Add `@IsDefined()` alongside `@ValidateNested()` for any required nested DTO field.
- **Headless Chromium (Playwright) cannot reliably grant the `Notification` permission** — `context.grantPermissions(['notifications'])`, the `permissions` context option, and raw CDP `Browser.grantPermissions` all leave `Notification.permission === "denied"` in this environment. This is a known Chromium/automation boundary, not an app bug. To verify push end-to-end anyway: hit `POST /push/subscribe` / `DELETE /push/unsubscribe` directly with a realistic FCM-shaped fake endpoint (`https://fcm.googleapis.com/fcm/send/...` + fake `p256dh`/`auth` keys), confirm the row lands in `push_subscriptions`, then trigger a real notification path (e.g. create a meeting as one project member while a second active member has a subscription) and confirm the request doesn't 500 and the fake subscription gets pruned (webpush will get a real `410 Gone` from Google's endpoint for the fake ID — that's the expected success signal, proving VAPID auth is valid and the request actually reached Google).
- **Test data cleanup**: delete via `docker exec clance-postgres-1 psql -U postgres -d clance -c "DELETE FROM ..."` — faster than going through API delete flows for disposable verification users/projects. Don't touch the real user's data — check `SELECT email FROM users` first if unsure which rows are test fixtures vs. the actual account (`sakawahab03@gmail.com`).
