# Phase 4 Summary

## Overview

Phase 4 is complete. It delivered the PWA, offline app shell, mobile Safari hardening, and release-readiness milestone in `v0.4.0-alpha`, followed by the `v0.4.1-alpha` PWA update activation hotfix.

The project remains a static, browser-native ES module app. Phase 4 did not add a backend, authentication, analytics, cloud storage, external services, framework dependencies, report persistence, or parser behavior changes.

GitHub Pages is the deployment target.

## Phase 4 Status

| Slice | Status | Summary |
| --- | --- | --- |
| Slice 1 | Complete | PWA identity, manifest, icons, Apple web app meta tags, install guidance, privacy trust copy |
| Slice 2 | Complete | Service worker, offline app shell, offline fictional examples, strict cache allowlist |
| Slice 3 | Complete | Offline/install/update UX polish, safe file intake, mobile Safari layout fixes |
| Slice 4 | Complete | Release documentation alignment, deployment readiness, manual QA checklist, CSP decision |
| v0.4.1-alpha | Complete | PWA update activation hotfix for waiting service workers |

Next planned milestone: `v0.5.0-alpha`, focused on Large Report Usability and Performance. See `ROADMAP.md` for the current v0.5 slice plan.

## Slices Completed

### Slice 1: PWA Identity

Delivered:

- `manifest.webmanifest`.
- App name, short name, description, display mode, scope, start URL, theme color, and background color.
- GitHub Pages-safe relative manifest paths.
- PWA icons:
  - `icons/icon-192.png`
  - `icons/icon-512.png`
  - `icons/maskable-512.png`
- Favicon and Apple touch icon:
  - `icons/favicon.svg`
  - `icons/favicon-32.png`
  - `icons/apple-touch-icon.png`
- Apple web app meta tags.
- Install guidance UI.
- Privacy messaging explaining that installation saves the app shell, not reports.

### Slice 2: Offline App Shell

Delivered:

- Root `service-worker.js`.
- Service worker registration from `src/main.js`.
- GitHub Pages-safe registration:
  - script URL from `new URL('../service-worker.js', import.meta.url)`
  - scope from `new URL('../', import.meta.url)`
- Versioned app cache.
- Explicit precache allowlist.
- Cache cleanup for old `ios-analytics-parser-*` caches.
- Cache-first behavior only for allowlisted same-origin GET assets.
- Cached `index.html` navigation fallback for same-origin app navigation.
- Offline fictional examples after first successful service worker setup.

### Slice 3: Offline, Install, Update, And Mobile UX

Delivered:

- Offline-ready status:
  - `Offline app shell ready. Examples can open offline. Reports are still not saved.`
- Offline setup failure status:
  - `Offline setup unavailable. Online parsing still works.`
- Update-ready status:
  - `Update ready. Reload when done with the current report.`
- Explicit `Reload app` button.
- No automatic reload while a report may be open.
- Install guidance:
  - `Install for quick access. Installation saves the app shell, not your reports.`
  - iPhone/iPad Add to Home Screen guidance.
  - desktop install guidance.
- Developer cache-version reminder for precached asset changes.
- Broad file picker to avoid iOS Safari greying out `.ips` files.
- Pre-read file validation before `file.text()`.
- 20 MB mobile Safari file safety limit.
- Rejection of clearly unsupported image, video, audio, PDF, ZIP, and unsafe octet-stream files.
- Panic/raw diagnostic text wrapping fixes for long slash-separated hex strings.
- Mobile layout containment for raw notes, table scroll areas, section cards, and page body.
- Safe-area bottom padding for mobile Safari.

## Service Worker Architecture

The service worker is intentionally conservative.

Install:

- Opens the versioned app cache.
- Adds only explicit `PRECACHE_URLS`.

Activate:

- Deletes old caches whose names start with `ios-analytics-parser-`.
- Keeps only the current versioned cache.
- Calls `clients.claim()` after cleanup.

Fetch:

- Handles only GET requests.
- Ignores cross-origin requests.
- Uses cache-first only for same-origin allowlisted URLs.
- Uses cached `index.html` only for same-origin navigation fallback.
- Falls back to network for non-allowlisted same-origin assets.
- Does not dynamically cache network responses.

Update:

- A waiting service worker triggers non-blocking update-ready UI.
- The user must press `Reload app`.
- The app sends `SKIP_WAITING` only from that explicit action.
- The page reload is gated behind the user-requested update flow.

## Cache Allowlist Boundaries

Cached:

- `./`
- `./index.html`
- `./manifest.webmanifest`
- `./styles/main.css`
- browser-native ES modules under `src/`
- parser modules under `src/parsers/`
- UI/search/clipboard/privacy modules used by the app shell
- PWA icons and favicon files under `icons/`
- sanitized fictional examples under `examples/`

Never cached or persisted by the app:

- uploaded files
- pasted report text
- parsed sections
- raw-mode output
- search state
- dense-table state
- clipboard output
- test fixtures
- unknown same-origin URLs
- external URLs
- real diagnostic reports

Forbidden service worker patterns remain out of scope:

- dynamic `cache.put`
- runtime caching of unknown requests
- Background Sync
- Periodic Sync
- Push
- Share Target
- file handlers

## Offline Examples

Production examples live under `examples/` and are sanitized fictional files.

They are included in the service worker allowlist so they can open offline after first successful load.

Test fixtures remain under `tests/fixtures/` and are not cached by the service worker.

If an example is unavailable offline, the UI may show:

```text
Example unavailable offline. Reconnect once to refresh offline examples.
```

## Update-Ready UX

The update flow is intentionally user-controlled.

- The app does not auto-reload.
- The update-ready message is non-blocking.
- The `Reload app` button is keyboard accessible.
- The user can finish reading the current report before updating.

Approved update-ready copy:

```text
Update ready. Reload when done with the current report.
```

Post-release hotfix:

- `v0.4.1-alpha` fixed a stuck `Update ready` state where a waiting service worker could remain waiting after reload.
- The service worker `SKIP_WAITING` message flow now keeps `self.skipWaiting()` alive with `event.waitUntil(self.skipWaiting())`.
- The hotfix did not change parser behavior, caching strategy, privacy model, backend behavior, analytics, cloud storage, or package metadata.

## Privacy Model

Sanitized mode remains the default.

Raw local view remains opt-in and applies only to the current in-memory report.

No persistence was added:

- no uploaded report storage
- no pasted report storage
- no parsed-output storage
- no raw-mode storage
- no report history
- no recent files
- no `localStorage`
- no `sessionStorage`
- no `IndexedDB`
- no cookies

No external services were added:

- no backend
- no authentication
- no analytics
- no cloud storage
- no external parsing service
- no framework dependencies

The service worker cache is limited to app-shell assets and sanitized fictional examples. It does not cache user reports.

## File-Intake Safety

File intake now validates selected files before reading them into memory.

Allowed known diagnostic extensions include:

- `.ips`
- `.crash`
- `.panic-full`
- `.log`
- `.txt`
- `.plist`
- `.ips.ca.synced`
- `.synced`

Unknown extensions may be allowed when the browser reports `text/plain` or `application/json`.

Rejected before reading:

- `image/*`
- `video/*`
- `audio/*`
- `application/pdf`
- `application/zip`
- unsafe `application/octet-stream` files without known diagnostic extensions

Oversized file message:

```text
This file exceeds the 20 MB safety limit and was not opened.
```

Unsupported file message:

```text
This file does not look like a supported text diagnostic report.
```

## Mobile Safari QA Fixes

Phase 4 mobile Safari validation found and fixed:

- `.ips` files greyed out when the file picker used a restrictive `accept` filter.
- Wrong-format files could freeze iPhone Safari after broadening file selection.
- Panic String sections could overflow horizontally on iPhone Safari.
- Long slash-separated hex strings needed direct raw-note wrapping.
- Kernel Backtrace and table sections needed controlled internal horizontal scrolling.
- Section navigation chips needed mobile-safe horizontal scrolling.
- Safari bottom toolbar could cover lower page content.
- Stale service worker caches could keep serving old CSS/JS after mobile fixes.

Implemented fixes:

- Broad file input with safe pre-read validation.
- 20 MB safety limit.
- Unsupported binary/media/PDF/ZIP rejection.
- Raw diagnostic text wrapper class on rendered raw notes.
- Mobile CSS containment for cards, raw notes, tables, app containers, and safe-area padding.
- Service worker cache-version discipline and tests.

## GitHub Pages Deployment Notes

GitHub Pages is the intended deployment target.

Deployment assumptions:

- The app may be served from a repository subpath.
- `manifest.webmanifest` uses relative `start_url`, `scope`, and icon paths.
- Service worker registration derives its script URL and scope from `import.meta.url`.
- The service worker file must remain at the deployment root for the app scope.
- Offline app shell support works after a successful online load and service worker install.
- Updates require a new service worker version and, when precached assets change, a `CACHE_VERSION` bump.

Manual live-site checks should confirm:

- `manifest.webmanifest` loads.
- icons load.
- `service-worker.js` registers with the expected scope.
- offline app shell works after first load.
- examples open offline.
- update-ready UI appears when a new worker is waiting.

## CSP Decision

CSP/header hardening is deferred for `v0.4.0-alpha`.

Reason:

- GitHub Pages does not support custom response headers.
- A meta CSP is weaker than response headers and can break ES modules, examples, icons, manifest loading, or service worker registration if tightened too quickly.
- Stronger CSP is better handled as a focused follow-up or on a host that supports headers, such as Cloudflare Pages.

Recommended future CSP direction:

- `default-src 'self'`
- `script-src 'self'`
- `style-src 'self'`
- `img-src 'self' data:`
- `connect-src 'self'`
- `manifest-src 'self'`
- `worker-src 'self'`
- `base-uri 'none'`
- `form-action 'none'`
- `object-src 'none'`
- `frame-ancestors 'none'`

This target should be validated separately before enforcement.

## Manual QA Checklist

Desktop browser:

- Serve locally with a static server.
- Load each production example.
- Parse file picker input.
- Parse pasted text.
- Drag and drop a supported file.
- Clear Report wipes rendered content and state.
- Raw local view is opt-in and resets on new report.
- Search filters sections and rows.
- Copy uses visible content.
- Dense table controls work.
- Service worker registers.
- Offline app shell status appears after setup.
- Update-ready UI does not auto-reload.

GitHub Pages:

- Verify app loads from the repository subpath.
- Verify manifest loads from the deployed path.
- Verify icons load.
- Verify service worker scope is correct.
- Verify no unknown requests are runtime-cached.
- Verify examples open offline after first load.

iPhone Safari:

- `.ips` files are selectable.
- Unsupported files are rejected before reading.
- Files over 20 MB show the safety-limit message.
- Panic String wraps inside the card.
- Kernel Backtrace tables scroll inside the table area.
- Section navigation scrolls horizontally without clipping.
- Bottom content is not hidden behind the Safari toolbar.
- Add to Home Screen works.
- Installed app opens and parses locally.

iPad Safari:

- Same checks as iPhone Safari.
- Verify split-screen/narrow-width layout does not overflow.
- Verify installed app shell and offline examples.

Offline:

- Load online once.
- Disable network.
- Reopen the app.
- Confirm app shell opens.
- Confirm examples can open offline.
- Confirm user reports are not saved or restored.

Update:

- Deploy a changed precached asset with a bumped cache version.
- Confirm update-ready message appears.
- Confirm `Reload app` is required.
- Confirm reload happens only after button activation.

## Test Commands

Primary test command:

```powershell
npm.cmd test
```

Focused syntax checks used for Phase 4 code changes:

```powershell
node --check src\main.js
node --check service-worker.js
node --check src\fileValidation.js
```

No documentation-specific test runner exists.

## Known Limitations

- CSP/header hardening is deferred.
- No Cloudflare/header CSP deployment is configured yet.
- No report persistence, recent files, or history.
- No automated browser or mobile Safari test harness.
- Offline support covers the app shell and fictional examples only.
- Offline support requires at least one successful online load.
- Service worker updates require cache-version discipline when precached assets change.
- `package.json` may still show legacy version metadata; release state is tracked by Git tags and documentation.
- No symbolication.
- No `.dSYM` support.
- No sysdiagnose archive extraction.

## Release Checklist

Phase 4 release checklist was completed for `v0.4.0-alpha`, with the update activation hotfix released as `v0.4.1-alpha`.

Before future release tags:

- Confirm README, ROADMAP, CHANGELOG, and phase summaries are aligned.
- Confirm package version handling decision.
- Run `npm.cmd test`.
- Run syntax checks for any changed JavaScript files.
- Confirm service worker cache allowlist includes current precached assets.
- Confirm no `cache.put` or runtime caching was added.
- Confirm no persistent report storage APIs were added.
- Run local static-server QA.
- Run GitHub Pages QA.
- Run iPhone Safari QA.
- Run iPad Safari QA.
- Run installed PWA QA.
- Run offline app shell and offline examples QA.
- Run update-ready QA.
- Prepare GitHub release notes from completed work only.
