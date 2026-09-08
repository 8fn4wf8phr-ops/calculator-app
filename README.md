# Calculator

A calculator app built with plain HTML, CSS, and JavaScript — no frameworks, no build
step. Started as a simple four-function calculator and grew from there.

**Try it live:** https://calculator-app-three-sand.vercel.app/

Curious how it was built? See [JOURNEY.md](./JOURNEY.md).

## Features

- Standard calculator with %, +/-, memory buttons (MC/MR/M+/M-)
- Scientific mode: sin/cos/tan, square root, squares, parentheses, pi
- Unit converter: length, weight, and temperature
- Calculation history with live search/filter, and CSV export
- Click-to-copy on the result display
- Dark mode, persisted across visits
- Installable as a PWA (works offline once loaded)

## Tech stack

- Plain HTML/CSS/JavaScript — no framework, no build tools
- A PWA manifest and service worker for offline support
- [Vercel](https://vercel.com/) for hosting, with GitHub auto-deploy on push

## Getting started

```bash
git clone https://github.com/8fn4wf8phr-ops/calculator-app.git
cd calculator-app
python3 -m http.server 8080
```

Then open http://localhost:8080 — there's no build step, so any static file server
works.
