# Phase 1 Summary

## Implemented Architecture

The app is a static, browser-native ES module application with no build step, backend, framework dependency, authentication, analytics, cloud storage, or external service.

- `index.html` loads `src/main.js` with `type="module"`.
- `src/main.js` wires the file picker and paste textarea to parser and renderer modules.
- `src/parsers/` contains file detection and Phase 1 parsers.
- `src/privacy/sanitize.js` sanitizes sensitive values before display.
- `src/models/sectionModel.js` defines the shared section object shape.
- `src/ui/` renders parsed sections into DOM cards and tables.
- `styles/main.css` provides the initial developer-tool visual styling.
- `tests/` contains a Node/assert-only parser test harness and sanitized fixtures.

## Supported Detected File Types

Current `detectFileType(input)` results:

- `ips`: standard single-object app crash `.ips` reports with crash-like fields such as `bug_type`, `exception`, `threads`, or `usedImages`.
- `ips-watchdog-stackshot`: two-object `.ips` reports shaped as metadata JSON line plus report body JSON, where the body contains `termination` and `stackshot.processByPid`.
- `crash`: legacy plain-text `.crash` reports.
- `panic`: panic text detected by `panic(` or `Panic(`.
- `jetsam`: recognized in detection only for JSON with Jetsam-like fields, but not parsed in Phase 1.
- `analytics`: fallback detection label for generic analytics text, but not parsed in Phase 1.
- `unknown`: empty or malformed input.

## Parser Behavior

### Standard `.ips`

`parseIps()` renders:

- `Summary`
- `Exception`
- `Crashed Thread`

It expects a standard app crash JSON body with fields like app metadata, exception information, thread frames, and used images.

### Watchdog Stackshot `.ips`

`parseIpsWatchdogStackshot()` renders:

- `Summary`
- `Termination`
- `Main Thread Stackshot`

It supports the Apple `.ips` shape where the first line is metadata JSON and the rest is the report body JSON. It classifies the body as `ips-watchdog-stackshot` when it contains both:

- `termination`
- `stackshot.processByPid`

The target process is selected by `report.pid`, with a fallback to matching `report.procName`. The main thread is selected by `dispatch_queue_label === "com.apple.main-thread"`, then `snapshotFlags` containing `kThreadMain`, then the first available thread.

### Legacy `.crash`

`parseCrash()` renders:

- `Summary`
- `Exception`
- `Crashed Thread`

It uses line-oriented parsing for header fields, exception fields, the triggered thread number, and the crashed thread frame table.

### Panic

`parsePanicStub()` renders a placeholder section:

> Panic-full file recognized. Full panic rendering is planned for Phase 2.

This is not treated as an error.

## Privacy Sanitizer Behavior

Sanitized output is the default.

The sanitizer redacts:

- email addresses
- labeled sensitive identifiers such as UDID, serial number, IDFA, IDFV, `deviceIdentifierForVendor`, and `deviceIdentifierForAdvertising`
- UUID-like values unless they appear to be explicitly labeled as binary/image UUIDs
- Windows user path names such as `C:\Users\Alice\...`
- macOS user path names such as `/Users/Alice/...`
- phone-shaped numbers such as `+1 (415) 555-1212`

The sanitizer preserves debugging-useful values:

- bundle IDs
- app names
- framework and process names
- app versions and build numbers when present
- addresses and frame offsets
- timestamps
- numeric termination codes
- binary/image UUIDs when explicitly labeled as such

## Test Commands

Use this command in PowerShell:

```powershell
npm.cmd test
```

Equivalent direct command:

```powershell
node tests/parser.test.js
```

Plain `npm test` may be blocked on this machine by the PowerShell script execution policy because it invokes `npm.ps1`.

## Known Limitations

- No Phase 2 Jetsam parser yet.
- No full panic parser yet.
- No generic analytics text parser yet.
- No all-threads rendering for standard crashes.
- No binary images table rendering.
- No memory chart.
- No drag-and-drop UI.
- No tabs, search, copy buttons, privacy toggle UI, PWA, or deployment setup.
- No symbolication.
- Stackshot frames may render as `Image <index> + <offset>` when the binary name cannot be resolved from the report body.
- Watchdog stackshot support currently renders the main thread only.
- The sanitizer is intentionally conservative, but real diagnostic formats may still expose edge cases requiring adjustment.

## Exact Phase 2 Starting Point

Begin Phase 2 by extending parsing and rendering from the current shared `SectionModel` flow:

1. Add full section rendering for standard crash reports:
   - all threads
   - binary images table
2. Add a real JetsamEvent parser:
   - summary
   - victim process
   - process table sorted by memory footprint
   - system memory fields
3. Add memory visualization for Jetsam reports.
4. Replace the panic stub with a real `.panic-full` parser:
   - panic string
   - panic flags
   - kernel backtrace
   - loaded kexts
   - system info
5. Add a generic analytics text fallback parser.
6. Improve stackshot frame image resolution where possible, without turning it into symbolication.

Keep Phase 2 within the same constraints:

- static app
- browser-native ES modules
- local-first parsing
- sanitized output by default
- no backend
- no authentication
- no analytics
- no cloud storage
- no external services
