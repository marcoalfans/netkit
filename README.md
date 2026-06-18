# NetKit

**Network Toolkit** — a fast, fully **client-side** set of networking utilities: CIDR & subnet calculators, IP converter, user-agent parser, and more. No backend, no tracking — everything runs in your browser. Sibling of [RedKit](https://marcoalfans.github.io/redkit/).

🔗 **Live:** https://marcoalfans.github.io/netkit/

## Tools

- **IP & Subnet** — CIDR calculator, subnet calculator
- **Convert & Parse** — IP converter (dotted/decimal/hex/octal/binary/IPv6), user-agent parser

Bilingual UI (EN / ID) via the in-page language toggle.

## Stack

Vanilla JavaScript, no build step, deployable as a static site (GitHub Pages). Shares RedKit's framework.

```
index.html                 entry + <script> load order
assets/                    styles.css, favicon.svg
js/
  core.js                  helpers ($, el, escapeHtml, toast, copy, download)
                           + UI builders (card/field/resultHead/ghostBtn/wireCopy/wireRun/wireTabs/...)
                           + const TOOLS = {}          (loaded first)
  i18n.js                  EN/ID dictionary + translator
  shell.js                 hash router, search (⌘K), theme + language toggles
  nav.js                   per-tool EXAMPLES + loadTool   (loaded last)
  mascot.js
  tools/                   subnet.js · convert.js · _template.js
docs/ADDING-A-TOOL.md      how to add a tool
```

## Adding a tool

Copy `js/tools/_template.js` into the matching category file, add a nav button in
`index.html`, and (optionally) an `EXAMPLES` entry + Indonesian strings. Full steps
in [`docs/ADDING-A-TOOL.md`](docs/ADDING-A-TOOL.md).

## Disclaimer

For authorized network administration, learning, and testing. You are responsible for how you use it.
