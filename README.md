# Discord Link Shortener Bot

A Discord bot that auto-shortens long URLs using TinyURL. Posts shortened links via webhook impersonation (looks like the user posted it themselves).

## Features

- **Auto-shorten** — any URL longer than 30 chars gets auto-shortened on post
- **Webhook impersonation** — bot reposts as the user (their name + avatar)
- **Slash command** — `/shorten url:<link>` for manual shortening
- **No API key needed** — uses TinyURL's free public API

## Prerequisites

- Node.js 18+ (use `fnm` to manage versions)
- A Discord bot application — https://discord.com/developers/applications

---

## Local Setup (Windows / Mac / Linux)

### 1. Clone and install

```bash
git clone https://github.com/ObsaSiyo/shorten-url.git
cd shorten-url
npm install
```

### 2. Create `.env` file

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
```

Get both from https://discord.com/developers/applications → your app:
- **Application ID**: General Information page
- **Bot Token**: Bot tab → Reset Token

### 3. Enable Privileged Intents

In the Developer Portal → **Bot** tab → scroll to **Privileged Gateway Intents**:
- Toggle ON: **Message Content Intent**
- Click **Save Changes**

### 4. Invite the bot to your server

Replace `YOUR_CLIENT_ID` and open in browser:

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=536957952
```

Permissions included: View Channels, Send Messages, Manage Messages, Manage Webhooks, Embed Links, Read Message History.

### 5. Run the bot

```bash
# Development (auto-restarts on save)
npm run dev

# Production
npm start
```

---

## Deploying to Linux (Oracle Cloud / Ubuntu / etc.)

### 1. SSH into your server and install Node

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
```

### 2. Clone and configure

```bash
git clone https://github.com/ObsaSiyo/shorten-url.git
cd shorten-url
npm install
nano .env   # paste DISCORD_TOKEN and DISCORD_CLIENT_ID
```

### 3. Install pm2 and start the bot

```bash
npm install -g pm2
npm run pm2
pm2 save
pm2 startup
# Run the command pm2 prints (starts with: sudo env PATH=...)
```

Bot now runs 24/7 and auto-restarts on reboot.

---

## NPM Scripts

| Command | What it does |
|---|---|
| `npm start` | Run bot in production |
| `npm run dev` | Run with `--watch` (auto-restart on file changes) |
| `npm run pm2` | Start under pm2 as `shorten-bot` |
| `npm run pm2:logs` | Tail live pm2 logs |
| `npm run pm2:restart` | Restart the pm2 process |
| `npm run pm2:stop` | Stop the pm2 process |

---

## Usage in Discord

**Auto-shorten:**
Just post any URL longer than 30 characters. Bot deletes the original and reposts via webhook with the shortened version, attributed to you.

**Manual shorten:**
```
/shorten url:https://your-long-url-here.com
```

---

## Troubleshooting

**Bot online but not shortening links**
- Confirm Message Content Intent is ON in Developer Portal
- Confirm bot has Manage Messages and Manage Webhooks in the channel

**`Used disallowed intents` error on startup**
- Message Content Intent toggle isn't saved — toggle off, save, toggle on, save again

**`message.content` is empty in logs**
- Re-invite the bot to the server using the OAuth2 URL above
- Wait 5 minutes after re-invite for Discord cache to clear

**Permissions error 50013**
- Channel-level permissions override server permissions — check the specific channel's settings

---

## Security

- Never commit `.env` to git — it's in `.gitignore`
- If your token leaks, **reset it immediately** in the Developer Portal
- GitHub's secret scanning will block pushes containing tokens — clean history if this happens

---

## Tech Stack

- Node.js 18+
- discord.js v14
- node-fetch (TinyURL API calls)
- dotenv (env var loading)
- pm2 (process manager for production)