# iOS Analytics File Parser

A privacy-first, browser-based tool for reading and understanding iPhone and iPad diagnostic logs without uploading them to a server.

The goal of this project is to make Apple diagnostic files easier to inspect by converting raw crash reports, watchdog reports, panic logs, and analytics data into structured, human-readable sections.

## Privacy First

All parsing happens locally in the browser.

* No backend
* No uploads
* No accounts
* No tracking
* No cloud processing

Diagnostic files never leave the user's device.

## Supported Formats

### Current (v0.1.0-alpha)

* Modern `.ips` crash reports
* Legacy `.crash` reports
* Watchdog-stackshot `.ips` reports
* Panic-full detection (placeholder support)

### Planned

* JetsamEvent reports
* Full `.panic-full` parsing
* Generic analytics text logs
* Additional iOS diagnostic formats

## Features

### Crash Reports

* Summary view
* Exception information
* Crashed thread rendering
* Privacy-safe output

### Watchdog Stackshots

* Metadata + report body IPS parsing
* Termination details
* Main thread stackshot rendering

### Privacy Sanitization

Sensitive identifiers are sanitized by default, including:

* Email addresses
* UDIDs
* Serial numbers
* Advertising identifiers
* Vendor identifiers
* User-specific file paths
* Phone numbers

Debugging-useful values remain visible where appropriate:

* Bundle identifiers
* App names
* Framework names
* Process names
* Timestamps
* Stack frame addresses
* Binary image UUIDs

## Project Status

**Version:** v0.1.0-alpha
**Status:** Phase 1 Complete

### Implemented

* Browser-native ES module architecture
* File type detection
* `.ips` parser
* `.crash` parser
* Watchdog-stackshot support
* Privacy sanitizer
* Test fixtures
* Parser test suite

### Not Yet Implemented

* JetsamEvent parser
* Full panic-full parser
* Binary image tables
* Memory visualization
* Generic analytics parser
* Drag-and-drop UI
* Search and filtering
* PWA support
* Symbolication

## Architecture

```text
index.html
src/
├── main.js
├── models/
├── parsers/
├── privacy/
└── ui/
styles/
tests/
```

The project intentionally avoids framework dependencies and build tooling. Browser-native ES modules are used throughout.

## Running Locally

Clone the repository:

```bash
git clone https://github.com/Panaikran/ios-analytics-file-parser.git
cd ios-analytics-file-parser
```

Open `index.html` in a browser or serve the directory using a simple local web server.

## Tests

Run the parser test suite:

```bash
npm.cmd test
```

or:

```bash
node tests/parser.test.js
```

## Roadmap

### Phase 2

* JetsamEvent parser
* Full panic-full parser
* Binary image decoding
* All threads rendering
* Memory process tables
* Generic analytics parser

### Phase 3

* Drag-and-drop support
* Search and filtering
* Privacy toggle UI
* Copy helpers
* Mobile UI polish

### Phase 4

* PWA support
* Offline mode
* Deployment hardening
* CSP lockdown
* Release preparation

## License

License to be determined.
