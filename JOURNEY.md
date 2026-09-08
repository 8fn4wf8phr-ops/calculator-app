# The Build Journey: A Calculator, One Feature at a Time

This is the story of how this calculator went from a basic four-function app to
something with scientific mode, unit conversion, offline support, and a live
deployment. Keeping it here as a record of the process, not just the result.

**Live app:** https://calculator-app-three-sand.vercel.app/

## 1. Starting simple

The goal was a working calculator with plain HTML, CSS, and JavaScript — no
frameworks, no build tools. Just a `index.html`, a `css/style.css`, and a
`js/script.js`, kept separate from the portfolio site project. The first version
handled the basics: the four operations, a display, and a button grid.

## 2. Going all-in on features

Rather than adding features one at a time and stopping, the plan became "let's do
all of them" — a batch of upgrades added together:

- **%, +/-, and memory buttons** (MC/MR/M+/M-) — the standard extras any real
  calculator has
- **Calculation history**, saved to `localStorage` so it survives a page refresh
- **Click-to-copy** on the result display
- **Keyboard support** with an on-screen hint of the shortcuts
- **Dark mode**, also persisted
- **Scientific mode** — sin/cos/tan, square root, squares, parentheses, and pi,
  toggled in and out of view so the standard calculator stays uncluttered
- **A unit converter** — length, weight, and temperature, as a separate tab
- **PWA support** — a manifest and a service worker, so the app can be installed and
  used offline once it's loaded once

Building all of this in vanilla JavaScript (no framework) meant everything —
state, rendering, event handling — is hand-rolled. The trade-off for the extra
manual wiring is zero build step: the app runs by opening `index.html`, or serving
the folder with any static file server.

## 3. Git and GitHub

The project got its own git repository from the start, kept separate from the
portfolio site. Once the core features were in place, it was pushed to
GitHub — straightforward, since there's no build artifact to worry about
`.gitignore`-ing beyond the usual.

## 4. Round two: history search and export

After the app had been sitting untouched for a while, it got a second pass focused
on the history feature specifically:

- A **live search box** that filters the history list as you type, matching
  against either the expression or the result
- An **Export button** that downloads the full history as a CSV file, timestamped
  by filename, with each entry's date included as a column

The export uses the browser's built-in `Blob` and `URL.createObjectURL` APIs to
generate the file client-side — no server, no library, just a few lines of
JavaScript that build a CSV string and trigger a download.

## 5. Deploying to Vercel

The app had been GitHub-hosted but never actually deployed anywhere. Since it's a
static site with no build step at all, connecting it to Vercel was the simplest
deployment of any of these projects — import the GitHub repo, leave the framework
preset as "Other," and deploy. No build command, no output directory to configure.

## 6. What's next

Ideas still on the table:

- **Currency conversion** alongside the existing length/weight/temperature
  converter — would need live exchange rates from an API
- **Programmer mode** — binary/hex/octal conversions and bitwise operations
- A **history search/filter** improvement: export just the filtered results instead
  of always exporting everything
