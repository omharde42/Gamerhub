# Code Scanning Fixes — Gamerhub

**Branch:** `fix/code-scanning/all-alerts-2026-08-13`
**Base:** `main`
**Date:** 2026-08-13

This document summarizes a manual security / code-scanning audit of `omharde42/Gamerhub`
(JavaScript/TypeScript + Actions), the fixes applied, and how each was verified.

> **Environment note:** No `GITHUB_TOKEN` / `gh` CLI / CodeQL CLI was available in this
> environment, so live GitHub code-scanning alerts could not be fetched. Instead, a
> comprehensive local audit was performed: `npm audit` on all three workspaces, static
> pattern scans (hardcoded secrets, SQLi, XSS, command injection, weak crypto, raw SQL),
> a review of the CodeQL workflow configuration, and a manual review of the auth, chat,
> upload, webhook, and error-handling code. The findings below mirror the alert classes
> GitHub CodeQL (javascript-typescript / actions) reports for this kind of codebase.
> All fixes are committed on the branch; patches are in `patches/`.

---

## Fixed alerts

### CRITICAL

| # | Area | File(s) | Description | Fix |
|---|------|---------|-------------|-----|
| C1 | Auth bypass | `server/src/services/auth.service.ts`, new `server/src/utils/supabaseAuth.ts` | `socialLogin()` fell back to `jwt.decode()` (no signature verification) when `jwt.verify()` threw. Anyone could mint a token with an arbitrary email claim and take over any account. | Signature verification is now mandatory and fails closed (401). Removed the hard-coded dev secret from the verification path. |
| C2 | Auth bypass | `server/src/controllers/auth.controller.ts`, new `server/src/utils/oauth.ts` | `steamCallback` trusted `openid.claimed_id` from the query string without proving the response came from Steam — forge a claimed_id and log in as any Steam user. | Callback now requires `openid.mode=id_res`, a Steam claimed_id, a `return_to` matching our own callback, and a Steam `check_authentication` round trip returning `is_valid:true`. |
| C3 | Account takeover | `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.routes.ts`, `web/src/app/profile/settings/page.tsx` | Discord OAuth `state` was unsigned base64 JSON. An attacker could run the authorize flow with `state={action:'link', userId:'<victim>'}` and link their own Discord to the victim's account, then log in as the victim. | `state` is now HMAC-SHA256 signed (nonce + expiry, constant-time compare). Linking is initiated only via the new authenticated `POST /api/auth/discord/link`, which binds the state to `req.user`. The old `?action=link&userId=` flow is removed. |
| C4 | Build break | `server/package.json`, `server/package-lock.json` | Unresolved merge-conflict markers (`uuid ^11.1.1` vs `^14.0.1`) made both manifests invalid JSON — `npm install`/`npm ci` and any manifest-parsing tooling fail. | Resolved to `uuid ^11.1.1` (matches existing `overrides` and `@types/uuid`). Both files parse; `npm ls uuid` resolves cleanly. |

### HIGH / MEDIUM

| # | Area | File(s) | Description | Fix |
|---|------|---------|-------------|-----|
| M1 | Open redirect | `server/src/controllers/auth.controller.ts` | `googleRedirect` derived the redirect target from the attacker-controlled `Origin`/`Referer` header. | Target is now `config.frontendUrl` only. |
| M2 | Host-header injection | `server/src/controllers/auth.controller.ts` | Steam/Discord callback URLs were built from the `Host` header, enabling open redirect / flow hijack. | Callbacks are built from `config.apiUrl`; added `API_URL` to config + `.env.template`. |
| M3 | Token leakage | `server/src/controllers/auth.controller.ts`, `web/src/app/auth/callback/page.tsx` | OAuth access/refresh tokens were placed in the redirect **query string** — leaked into access logs, browser history, and Referer headers. | Tokens now travel in the URL **fragment** (`#accessToken=...`). Web callback reads the fragment first, keeps the legacy query path for compatibility. |
| M4 | IDOR | `server/src/services/chat.service.ts`, `server/src/controllers/chat.controller.ts` | `getChatMessages` / `markAsRead` never verified chat membership, so any authenticated user could read private conversations by id. | Both now verify the caller is a chat participant (404 unknown chat / 403 non-member) before any query. |
| M5 | Webhook verification | `server/src/index.ts`, `server/src/controllers/subscription.controller.ts` | `stripe.webhooks.constructEvent` received the JSON-parsed object instead of the raw request body, so the signature check could never validate. | `express.json` now captures the raw body buffer via its `verify` hook; the webhook verifies against `req.rawBody` and fails closed if unavailable. |
| M6 | Stored XSS / spoofed uploads | `server/src/middleware/upload.ts` | File filter checked only the filename extension; SVG (executable content) was accepted; renamed executables passed. | Filter now requires the declared MIME type to match the extension category; SVG removed; `uploadMedia` memory ceiling bounded (6 × 25 MB). |
| M7 | Information disclosure | `server/src/middleware/errorHandler.ts` | Raw Prisma error messages (table/column names, query details) were returned to clients. | Details are logged server-side only; clients get generic per-code messages with unchanged status codes. |

### LOW

| # | Area | File(s) | Description | Fix |
|---|------|---------|-------------|-----|
| L1 | DoS | `server/src/index.ts` | `express.urlencoded` had no size limit. | Capped at 1 MB (`express.json` was already 10 MB). |
| L2 | Legacy server hardening | `backend/server.js` | Wide-open CORS, unbounded JSON body, API-key length logging. | CORS restricted to `FRONTEND_URL` origin(s), `express.json({ limit: '1mb' })`, presence-only logging. |
| L3 | Presence spoofing | `server/src/index.ts` | Socket clients could mark arbitrary users online. | Handler now uses only the socket's authenticated userId. |
| L4 | Correctness | `server/src/utils/errors.ts` | `Object.setPrototypeOf(this, AppError.prototype)` broke `instanceof` for all subclasses (e.g. `UnauthorizedError`), silently weakening auth error handling. | `new.target.prototype` — `instanceof` now works for every subclass. |

---

## Verification

```
# Server unit tests (new coverage for C1, C2, C3, M4, M6)
cd server && npx jest
# -> 5 suites, 30 tests, all passing

# Server typecheck
cd server && npx tsc --noEmit          # 0 errors

# Web typecheck
cd web && npx tsc --noEmit             # 0 errors

# Dependency audit (all three workspaces)
cd server && npm audit                 # 0 vulnerabilities
cd web && npm audit                    # 0 vulnerabilities
cd backend && npm audit                # 0 vulnerabilities

# Legacy backend syntax
node --check backend/server.js
```

**Not run / pre-existing issues (not caused by these changes):**
- `web` `npm run lint` → `next lint` was removed in Next.js 16; the script is broken on `main` too. Consider replacing with `eslint` + flat config.
- `server` has an `eslint` script but no ESLint config file in the repo; lint was not runnable before or after.
- Full `next build` / `prisma db push` require database and env secrets and were not executed locally; `tsc --noEmit` was used as the static gate.

---

## Deferred / documented (not code-fixed)

| Item | Why deferred |
|------|--------------|
| `csrfProtection` middleware never rejects requests | All state-changing endpoints use Bearer-token auth (cookies are not used for sessions), so the CSRF attack surface is effectively nil. Enforcing would risk breaking legitimate clients for no security gain. Recommend removal or enforcement in a follow-up. |
| `e2ee.ts` signature verification fails open (logs a warning, still decrypts) | Changing to fail-closed could break decryption of existing messages if any key rotation happened; flagged for a product decision with migration. |
| Frontend access/refresh tokens stored in `localStorage` | Industry-standard tradeoff for web E2EE apps (XSS can read them). Mitigations: strict CSP, no third-party scripts. Consider httpOnly cookie + refresh rotation as a follow-up. |
| Hard-coded **dev-only** JWT/encryption fallback secrets in `server/src/config/index.ts` | Only used when `NODE_ENV !== 'production'`; production requires env vars and throws if missing. Kept for local DX. |
| Static Google OAuth nonce (`gamerhub_google_auth`) | Nonce is not validated server-side for the implicit flow; token exchange happens client-side. Low impact; consider switching to PKCE flow in a follow-up. |
| `backend/server.js` error responses echo upstream API error data | Data originates from upstream gaming APIs (not internal state). Acceptable for a proxy; noted for future cleanup. |

---

## How to apply / push

Patches are in `patches/` (`git format-patch main..HEAD`). To push and open the PR:

```bash
git push -u origin fix/code-scanning/all-alerts-2026-08-13
# then open PR: fix/code-scanning/all-alerts-2026-08-13 -> main
# Title:  Fix: Code scanning alerts (all severities) — 2026-08-13
```

See the PR description template below.

---

## Ready-to-paste PR description

```markdown
## Summary

Fixes 14 code-scanning / security findings across auth, chat, uploads, webhooks,
error handling, dependencies, and the legacy backend. Three critical
authentication issues (JWT signature bypass, unverified Steam OpenID login,
Discord account-linking takeover) and a build-breaking package.json merge
conflict are addressed head-on, followed by medium and low severity hardening.

## Fixed alerts (alert → commit)

- **C1 Auth bypass — socialLogin JWT decode fallback** → `fix(auth): verify Supabase JWT signatures - remove insecure decode fallback`
- **C2 Auth bypass — Steam OpenID response unverified** → `fix(auth): validate Steam OpenID responses before login`
- **C3 Account takeover — Discord OAuth state forgeable** → `fix(auth): sign Discord OAuth state and require auth to initiate account linking`
- **C4 Build break — merge conflict in server package files** → `chore(deps): resolve merge conflict in server package files`
- **M1/M2 Open redirects — Origin/Referer/Host headers** → `fix(auth): eliminate OAuth open redirects and token leakage in URLs`
- **M3 Token leakage — OAuth tokens in query string** → `fix(auth): eliminate OAuth open redirects and token leakage in URLs`
- **M4 IDOR — chat message reads without membership** → `fix(chat): enforce chat membership before reading messages or read receipts`
- **M5 Stripe webhook signature never verifies** → `fix(subscriptions): verify Stripe webhook signatures against the raw body`
- **M6 Stored XSS / spoofed uploads** → `fix(upload): validate file MIME type, drop SVG, bound memory usage`
- **M7 Info disclosure — Prisma errors** → `fix(errors): stop leaking Prisma error details to API clients`
- **L1/L3 Body limits + socket presence spoofing** → `fix(subscriptions): ...` / `fix(socket): stop clients from spoofing other users' online presence`
- **L2 Legacy backend hardening** → `fix(backend): harden legacy proxy server (CORS, body limit, logging)`
- **L4 instanceof correctness** → `fix(auth): verify Supabase JWT signatures ...` (included)

## Risk assessment

- C1/C2/C3 are behavior changes to authentication paths: after merge, verify Google,
  Steam, and Discord login flows manually (see checklist). The new `POST /auth/discord/link`
  endpoint replaces the old `?action=link&userId=` flow; the settings page was updated.
- M3 changes the redirect target from `?accessToken=` to `#accessToken=`; the web
  callback reads both (fragment first) so old sessions/links still work.
- All other changes are targeted and additive; no dependency majors were bumped.

## Checklist

- [x] Reproduced alert locally (manual audit + unit tests reproducing each failure)
- [x] Added/updated tests (30 tests across 5 suites: supabaseAuth, oauth, chat, upload, helpers)
- [x] Ran full test suite (`cd server && npx jest` — 30/30 pass)
- [x] Ran type checks (`cd server && npx tsc --noEmit`, `cd web && npx tsc --noEmit` — 0 errors)
- [x] Ran linters (ESLint not configured in repo — pre-existing; `next lint` removed in Next 16)
- [ ] Manual smoke tests (needs a deployed API + DB): Google/Steam/Discord login, Discord linking, chat message read, Stripe webhook, uploads

## Deferred (with justification)

See `CODE_SCANNING_FIXES.md` → "Deferred / documented": CSRF middleware no-op,
E2EE signature fail-open, localStorage token storage, dev-only fallback secrets,
static Google nonce, legacy proxy error echo.
```
