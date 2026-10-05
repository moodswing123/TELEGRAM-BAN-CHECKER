# V-BAN-CHECKER

A Telegram bot for checking WhatsApp ban status through baron0’s public free-check flow. The bot uses the requested `?`, `/`, and `.` prefixes, live typing/editing updates, three force-join buttons, and the **Powered by Victory Tech™** watermark.

## Features

- `?`, `/`, or `.` directly followed by an international WhatsApp number.
- Progressive “typing” experience: Telegram typing action plus edited analysis frames.
- Telegram Rich Message mode: structured headings, bordered/striped tables, bold text, and date-time entities, with an automatic HTML fallback if the Bot API or client does not support Rich Messages.
- Force join gates for one channel and two groups.
- Dark, field/value ban-analysis report modeled on the supplied reference image.
- No secrets committed: credentials live in `.env`.
- Node.js 22+ with current `grammy`, `dotenv`, and `pino` dependencies.

## Setup

```bash
cp .env.example .env
# edit .env and set BOT_TOKEN plus the three chat IDs and public URLs
npm install
npm run check
npm test
npm start
```

### Required `.env` values

- `BOT_TOKEN`: token from Telegram’s `@BotFather`.
- `FORCE_JOIN_CHANNEL`: channel username or numeric ID; the bot must be able to check membership.
- `FORCE_JOIN_GROUP_ONE`: first group username or numeric ID.
- `FORCE_JOIN_GROUP_TWO`: second group username or numeric ID.
- The three `*_URL` values are the URLs opened by the inline buttons.

The bot must be an administrator in the force-join channel/groups if Telegram requires it for membership checks.

`RICH_MESSAGES_ENABLED=true` enables the Bot API `sendRichMessage` method. Set it to `false` to use the compatible HTML `<blockquote>`/`<pre>` report instead.

## Baron0 integration

The authenticated integration uses `BAN_CHECKER_API_URL` and sends the configured `BARON_API_KEY` as `Authorization: Bearer <key>`. The current endpoint is `https://baron0.com/api/v2/check` with a JSON body of `{ "number": "+2348131225323" }`.

The current public free page exposes this flow:

1. `GET https://baron0.com/api/get-token`
2. `POST https://baron0.com/check-numberr2` with `X-Page-Token` and `{ number, "cf-turnstile-response": "" }`.

Baron0 may reject server-side automated requests with `403 Access denied` when a Turnstile or rate-limit check is required. The bot reports that state instead of pretending a result was returned. If you have a separate approved API credential/endpoint, adapt `src/ban-checker.mjs` and set `BARON_BASE_URL` accordingly.

## Commands

```text
/start
/help
?+2348131225323
/+2348131225323
.+2348131225323
```

## Deployment

Run this as an always-on Node worker, not a short-lived serverless function. Keep `.env` private and use a process manager such as systemd, PM2, Docker, or a managed worker. Never paste the Telegram token into source control or chat.

# Main file is 
 <strong> Main file is in src/index mjs</strong>
