# electron-apps

Small, focused Electron wrappers around popular web apps. Each app is its own workspace package with a shared Electron core for window/tray behavior.

## Apps
- ChatGPT
- Discord
- GCP
- Gitlab
- Gmail
- Linear
- Notion
- Telegram
- Whatsup

## Prerequisites
- Node.js + pnpm
- Linux x64 (packaging is currently configured for linux-x64)

## Quick Start
Install dependencies:

```bash
pnpm install
```

Package everything (builds each app and writes desktop entries):

```bash
pnpm package
```

Package a single app:

```bash
cd ChatGPT
pnpm run prepackage
pnpm run package
```

## How It Works
- Each app has an `index.ts` entry that calls a shared lifecycle helper from `common/`.
- Rollup bundles `index.ts` into `bundle.js` using the root `rollup.config.js`.
- Electron Packager creates `*-electron-linux-x64/` in the app folder.
- A Linux `.desktop` file is generated for each app in `~/.local/share/applications/`.

## Configuration
- `CHROMIUM_USER_DATA_PATH`: Optional env var to override Electron's user data directory.
- Tray/Badge: The shared lifecycle supports tray icons and optional badge rendering (configured per app).

## Repository Layout
- `common/`: Shared Electron logic (window, tray, menu, external links, search helpers).
- App folders: one per app (`ChatGPT/`, `Gmail/`, etc.).
- `scripts/` and `postpackage.js`: packaging helpers.

## Notes
- Generated binaries and packaged folders may be present in the repo; avoid editing them manually.
- There are no automated tests; validate changes by running at least one app.

## License
ISC
