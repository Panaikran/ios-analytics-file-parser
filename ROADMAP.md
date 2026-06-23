# iOS Analytics File Parser — Roadmap

**v1.0 build plan · 4 phases · 4 weeks**
`🔒 local · no backend · privacy first`

---

## Overall Progress

Current release status:

- Phase 1: Complete.
- Phase 2: Complete.
- Phase 3: Complete.
- `v0.3.1-alpha`: CoreAnalytics `.ips.ca.synced` detection and parser support implemented.
- Phase 4: Not started.

| Phase | Name | Week | Status | Tasks |
|---|---|---|---|---|
| P1 | Core Parser | Week 1 | Complete | 13 tasks |
| P2 | Full Section Rendering | Week 2 | Complete | 8 tasks |
| P3 | UI Polish | Week 3 | Complete | 8 tasks |
| v0.3.1-alpha | CoreAnalytics Support | Patch | Complete | Initial `.ips.ca.synced` detection and parser support |
| P4 | PWA & Release | Week 4 | Not Started | 7 tasks |

---

## Phase 1 — Core Parser `Week 1`

> **Deliverable:** Working `.ips` + `.crash` parser with Summary, Exception, and Crashed Thread rendered in the browser. Privacy-safe parsing is enabled by default, with panic-full detection stubbed for Phase 2.

```
phase_01_core_parser() → SectionModel[]
```

**Parser foundation**
- [ ] `a1b2c3` Project scaffold — single-page HTML + vanilla JS, zero build step
- [ ] `d4e5f6` File type auto-detection engine (`detect.js`)
- [ ] `g7h8i9` `.ips` JSON parser → `SectionModel[]`
- [ ] `j0k1l2` Legacy `.crash` text parser → `SectionModel[]`
- [ ] `m3n4o5` Render: Summary card (app, device, OS, date)
- [ ] `p6q7r8` Render: Exception card (type, signal, reason)
- [ ] `s9t0u1` Render: Crashed Thread backtrace

**Privacy pipeline** _(architecture, not UI — the toggle comes in Phase 3)_
- [ ] `u2v3w4` Define sanitized data pipeline — parsers output safe `SectionModel[]` by default
- [ ] `x5y6z7` Add privacy sanitizer utility for UDIDs, serials, vendor IDs, advertising IDs, phone numbers

**Panic-full stub**
- [ ] `b8c9d0` Panic-full detection stub — detect file type and surface "panic file recognized; full rendering coming in Phase 2"

**Test fixtures**
- [ ] `e1f2g3` Create `/tests/fixtures/` with sanitized fictional `.ips` and `.crash` files
- [ ] `h4i5j6` Basic parser assertions — file detection, summary extraction, exception extraction, crashed thread extraction

---

## Phase 2 — Full Section Rendering `Week 2`

> **Deliverable:** All 5 file types parsed end-to-end. Every section — threads, binaries, memory — visible and navigable.

```
phase_02_full_sections() → SectionModel[]
```

- [ ] `v2w3x4` All Threads section with per-thread collapse
- [ ] `y5z6a7` Binary Images table (name, UUID, arch, load address)
- [ ] `b8c9d0` JetsamEvent JSON parser
- [ ] `e1f2g3` Memory process table sorted by footprint
- [ ] `h4i5j6` Simple memory bar chart (Canvas API)
- [ ] `k7l8m9` `.panic-full` text parser (Panic String + kexts)
- [ ] `n0o1p2` Generic analytics text fallback parser
- [ ] `q3r4s5` Universal `SectionModel` → DOM renderer

---

## Phase 3 — UI Polish `Week 3`

> **Deliverable:** Production-quality UX. Privacy mode on by default. Works on iPhone Safari.

```
phase_03_ui_polish() → production_ready
```

- [ ] `t6u7v8` Drag & drop anywhere + paste textarea
- [ ] `w9x0y1` Tab navigation between sections
- [ ] `z2a3b4` Search / filter within parsed output
- [ ] `c5d6e7` Privacy mode toggle UI — safe mode on by default, optional raw view for local inspection
- [ ] `f8g9h0` Copy section button on each card
- [ ] `i1j2k3` Load example files (one per file type)
- [ ] `l4m5n6` Dark / light mode via `prefers-color-scheme`
- [ ] `o7p8q9` Responsive layout — tested on iPhone 15 Safari

---

## Phase 4 — PWA & Release `Week 4`

> **Deliverable:** Deployed, offline-capable, CSP-locked. Zero data leaves the device.

```
phase_04_pwa_release() → deployed ✓
```

- [ ] `r0s1t2` Service Worker — full offline support after first load
- [ ] `u3v4w5` Web App Manifest — "Add to Home Screen" on iOS
- [ ] `x6y7z8` Sanitized sample files with fictional data
- [ ] `a9b0c1` Unit tests for all parsers (Vitest)
- [ ] `d2e3f4` Content-Security-Policy — block all external requests
- [ ] `g5h6i7` Mobile Safari QA pass
- [ ] `j8k9l0` Deploy to GitHub Pages or Cloudflare Pages

---

## Future Ideas `Post v1.0`

Ideas parked for v2 — visible but out of scope for the initial release.

| Version | Feature |
|---|---|
| v2.0 | Client-side `.dSYM` symbolication — resolve raw addresses without a backend |
| v2.0 | Confidence-based diagnosis rules — pattern-match known signatures and show plain-English likely causes with confidence levels |
| v2.0 | Panic repair hint rules database — optional repair-focused explanations for repeated panic-full signatures |
| v2.0 | MetricKit `MXCrashDiagnostic` format support |
| v2.1 | Sysdiagnose `.tar.gz` extraction and file picker |
| v2.1 | Diff view — compare two crash reports side by side |
| v2.2 | Share link — encode parsed summary as URL fragment (no server) |

---

## Timeline

```
W1          W2          W3          W4
●───────────●───────────●───────────●
Core        Full        UI          PWA &
Parser      Sections    Polish      Release
```

---

*iOS Analytics File Parser · v1.0 roadmap*
