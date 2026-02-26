# NooCore-v3-Bot

A Facebook Messenger bot built on Node.js (v18), using the `fca-unofficial` library for Facebook API access.

## Project Structure

- `index.js` — Entry point. Spawns `NoobCore.js` and handles optional AutoGit push loop.
- `NoobCore.js` — Main bot logic: loads config, connects database, loads scripts/events, starts listening.
- `config.json` — Bot configuration (Facebook account, dashboard, database, language, etc.).
- `configCommands.json` — Per-command configuration.
- `ncstate.json` — Facebook session/appstate (cookies).
- `fca-unofficial/` — Bundled local copy of the FCA (Facebook Chat API) library.
- `core/` — Core utilities: logger, login, database controller, event/action handlers, language files.
- `scripts/cmds/` — Bot commands organized by category (admin, ai, game, fun, etc.).
- `scripts/events/` — Bot event handlers.
- `public/` — Express web server (dashboard) and database connector.

## Key Configuration

- **Dashboard port**: 5000 (set in `config.json` under `dashBoard.port`)
- **Database**: MongoDB (URI in `config.json` under `database.uriMongodb`)
- **Language**: English (`en`)
- **Bot prefix**: `-`

## Workflow

- **Start application**: `node index.js` — runs the bot, dashboard served on port 5000.

## Dependencies Fixed During Setup

- Downgraded `cheerio` to `1.0.0-rc.12` (newer versions use ESM undici incompatible with Node 18)
- Downgraded `chalk` to `4.1.2` (v5+ is ESM-only, incompatible with `require()`)
- Installed `axios-cookiejar-support`, `tough-cookie`, `duplexify`, `ws` for `fca-unofficial`
- Installed system dependencies: `libuuid`, `cairo`, `pango`, `libjpeg`, `giflib`, `librsvg`, `pixman` for `canvas`
- Ran `npm rebuild canvas` after installing system deps

## Deployment

- Target: **VM** (always-running bot process)
- Run command: `node index.js`
