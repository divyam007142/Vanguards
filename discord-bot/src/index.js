import { Client, GatewayIntentBits, Collection, Partials, ActivityType } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import chalk from 'chalk';
import { stats } from './utils/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ESC sequences
const CLEAR_SCREEN  = '\x1B[2J\x1B[H';   // clear visible area, jump to top
const HIDE_CURSOR   = '\x1B[?25l';
const SHOW_CURSOR   = '\x1B[?25h';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands  = new Collection();
client.cooldowns = new Collection();

// ── Load commands ─────────────────────────────────────────────────────────────
const commandFolders = readdirSync(join(__dirname, 'commands'));
let commandCount = 0;

for (const folder of commandFolders) {
  const commandFiles = readdirSync(join(__dirname, 'commands', folder)).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = pathToFileURL(join(__dirname, 'commands', folder, file)).href;
    const command  = await import(filePath);
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
      commandCount++;
    }
  }
}

// ── Load events ───────────────────────────────────────────────────────────────
const eventFiles = readdirSync(join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const filePath = pathToFileURL(join(__dirname, 'events', file)).href;
  const event    = await import(filePath);
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args, client));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args, client));
  }
}

// ── MongoDB ───────────────────────────────────────────────────────────────────
function sanitizeMongoURI(uri) {
  if (!uri) return uri;
  const prefix = uri.match(/^mongodb(\+srv)?:\/\//)?.[0];
  if (!prefix) return uri;
  const rest     = uri.slice(prefix.length);
  const lastAt   = rest.lastIndexOf('@');
  if (lastAt === -1) return uri;
  const host     = rest.slice(lastAt + 1);
  const userpass = rest.slice(0, lastAt);
  const colonIdx = userpass.indexOf(':');
  if (colonIdx === -1) return uri;
  const user = userpass.slice(0, colonIdx);
  const pass = userpass.slice(colonIdx + 1).replace(/@/g, '%40');
  return `${prefix}${user}:${pass}@${host}`;
}

async function connectMongo(retries = 5) {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(sanitizeMongoURI(process.env.MONGODB_URI), { serverSelectionTimeoutMS: 15000 });
      return;
    } catch (err) {
      process.stdout.write(chalk.red(`  MongoDB attempt ${i}/${retries} failed: ${err.message}\n`));
      if (i === retries) {
        process.stdout.write(chalk.red.bold(`  Could not connect. Check Atlas IP whitelist (0.0.0.0/0).\n`));
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, 5_000));
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatUptime(ms) {
  const s  = Math.floor(ms / 1000);
  const h  = Math.floor(s / 3600).toString().padStart(2, '0');
  const m  = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sc = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sc}`;
}

function memMB() {
  return (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
}

// ── Rotating status ───────────────────────────────────────────────────────────
const STATUSES = [
  { name: 'Serving As Moderation',  type: ActivityType.Playing   },
  { name: 'Ggs Vanguards \uD83E\uDD0D',       type: ActivityType.Watching  },
  { name: 'Looking over /commands', type: ActivityType.Listening },
];
let statusIdx = 0;

function currentActivity() {
  return STATUSES[((statusIdx - 1) % STATUSES.length + STATUSES.length) % STATUSES.length]?.name ?? '—';
}

// ── Full-screen render (clears + redraws every 2 s) ───────────────────────────
// W = visible width of the horizontal rule chars (pure ASCII, always exact).
// Content rows only use a LEFT border │ — no right border — because emojis
// are 2 terminal columns wide but 1 JS char, making right-padding impossible
// to calculate correctly without a native wcwidth implementation.
const W = 50;
const c = chalk;

const HR_TOP = c.cyan('┌' + '─'.repeat(W) + '┐');
const HR_MID = c.cyan('├' + '─'.repeat(W) + '┤');
const HR_BOT = c.cyan('└' + '─'.repeat(W) + '┘');

// Left-bordered content line — no right │, so emoji width doesn't matter.
// Icon and label are kept separate so padEnd() only operates on pure ASCII text.
function row(icon, label, value) {
  const lbl = c.gray(label.padEnd(10));   // pure text — padEnd is accurate
  const sep = c.dim(' › ');
  return c.cyan('│') + '  ' + icon + '  ' + lbl + sep + value;
}

// Plain centred line (used for section headers — also left-border only)
function header(text) {
  return c.cyan('│') + '  ' + text;
}

function render() {
  const uptime   = formatUptime(Date.now() - stats.startTime);
  const ping     = client.ws.ping;
  const ram      = memMB();
  const guilds   = client.guilds.cache.size;
  const members  = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
  const activity = currentActivity();
  const botTag   = client.user?.tag ?? '—';
  const startedAt = stats.startedAt ?? '—';

  const pingStr = ping < 0   ? c.yellow('connecting...')
                : ping < 100 ? c.green.bold(ping + ' ms')
                : ping < 200 ? c.yellow.bold(ping + ' ms')
                :              c.red.bold(ping + ' ms');

  const aiStatus = (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY)
    ? c.green.bold('AI Agent  ✓  Connected')
    : c.red.bold('AI Agent  ✗  Not configured');

  const lines = [
    CLEAR_SCREEN,
    '',
    HR_TOP,
    header(c.bold.yellow('⚔') + '  ' + c.bold.white('V A N G U A R D') + '  ' + c.bold.cyan('Discord Bot') + '  ' + c.bold.yellow('⚔')),
    HR_MID,
    row('🤖', 'Bot',      c.white.bold(botTag)),
    row('⚡', 'Commands', c.white.bold(commandCount + ' loaded')),
    row('💾', 'Database', c.green.bold('MongoDB  ✓')),
    row('🧠', 'AI',       aiStatus),
    row('🕐', 'Started',  c.white(startedAt)),
    HR_MID,
    header(c.bgMagenta.white.bold(' ◉ LIVE STATS ') + c.dim('  refreshes every 2 s')),
    HR_MID,
    row('⏱',  'Uptime',   c.yellow.bold(uptime)),
    row('📶', 'Ping',     pingStr),
    row('💿', 'Memory',   c.blue.bold(ram + ' MB')),
    row('🌐', 'Servers',  c.cyan.bold(String(guilds))),
    row('👥', 'Members',  c.green.bold(String(members))),
    row('✉',  'Messages', c.white.bold(String(stats.messages))),
    row('⚡', 'Commands', c.magenta.bold(String(stats.commands))),
    row('🎮', 'Activity', c.yellow(activity)),
    HR_BOT,
    '',
  ];

  process.stdout.write(lines.join('\n') + '\n');
}

// ── Boot ──────────────────────────────────────────────────────────────────────
await connectMongo();
await client.login(process.env.DISCORD_TOKEN);

client.once('clientReady', () => {
  stats.startedAt = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Calcutta',
    day:      '2-digit',
    month:    'short',
    year:     'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
  });

  // Suppress any stray console output once live monitor starts
  const noop = () => {};
  console.log   = noop;
  console.info  = noop;
  // Keep console.error for genuine crash debugging but prefix it cleanly
  const _origErr = console.error.bind(console);
  console.error = (...a) => {
    // Let render redraw after error so layout stays clean
    _origErr(...a);
  };

  // Hide cursor, draw first frame
  process.stdout.write(HIDE_CURSOR);
  render();
  setInterval(render, 2_000);

  // Restore cursor on exit
  process.on('exit', () => process.stdout.write(SHOW_CURSOR));
  process.on('SIGINT', () => { process.stdout.write(SHOW_CURSOR); process.exit(0); });

  // Rotating activity status
  const setStatus = () => {
    const s = STATUSES[statusIdx % STATUSES.length];
    client.user.setPresence({ activities: [{ name: s.name, type: s.type }], status: 'online' });
    statusIdx++;
  };
  setStatus();
  setInterval(setStatus, 15_000);
});
