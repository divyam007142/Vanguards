# Vanguard Discord Bot

## Overview

A full-featured Discord bot with slash command handler, moderation, leveling, AFK, auto-spam detection, counting channel, and AI-powered chat replies.

## Stack

- **Runtime**: Node.js 24 (ESM)
- **Discord**: discord.js v14
- **Database**: MongoDB (Mongoose)
- **AI**: Replit AI Integrations (OpenAI proxy) — no personal API key needed
- **Canvas**: @napi-rs/canvas, sharp (for welcome cards, level cards, etc.)
- **Package manager**: pnpm workspaces

## Bot Location

All bot code lives in `discord-bot/`.

```
discord-bot/
├── src/
│   ├── index.js               # Entry point, client setup, boot
│   ├── deploy-commands.js     # Slash command registration
│   ├── commands/
│   │   ├── admin/             # counting, help, stats
│   │   ├── moderation/        # ban, mute, warn, lockdown, roles, welcome-setup, ...
│   │   ├── utility/           # afk, avatar, echo, image-canvas, info, levels, remind, snipe, trigger
│   │   └── voice/             # disconnect, vcmute, vcunmute
│   ├── events/
│   │   ├── messageCreate.js   # Spam detection, XP leveling, AFK, AI chat replies
│   │   ├── interactionCreate.js
│   │   ├── guildMemberAdd.js  # Welcome cards
│   │   └── messageDelete.js   # Snipe support
│   ├── models/                # Mongoose schemas: Config, Level, Mute, Reminder, Warning
│   └── utils/                 # helpers, infoCard, levelCard, welcomeCard, stats
└── package.json
```

## Key Commands

- `pnpm --filter @workspace/discord-bot run start` — run the bot
- `pnpm --filter @workspace/discord-bot run deploy` — register slash commands with Discord

## Environment Variables Required

- `DISCORD_TOKEN` — Bot token from Discord Developer Portal
- `MONGODB_URI` — MongoDB connection string
- `GUILD_ID` — Discord server (guild) ID for slash command deployment
- `ADMIN_ROLE_ID` — Admin role ID (protected from anti-spam)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Auto-set by Replit AI Integration
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Auto-set by Replit AI Integration

## AI Chat Feature

When a user **@mentions the bot** or types its name, the bot uses AI (via Replit's built-in OpenAI proxy) to reply intelligently. It keeps a per-user conversation history (last 10 turns) so replies are context-aware. No personal API key is needed — it's billed to Replit credits.

The AI persona is "Vanguard" — helpful, concise, and conversational.

## Workflow

- **Discord Bot** — `pnpm --filter @workspace/discord-bot run start` (console output)
