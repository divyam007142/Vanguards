import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const LOGO_PATH = join(__dirname, '../assets/logo.png');

export const COLORS = {
  primary:  0x5865F2,
  error:    0xED4245,
  success:  0x57F287,
  warning:  0xFEE75C,
  info:     0x00B0F4,
  muted:    0x4F545C,
  ban:      0xED4245,
  mute:     0xFEE75C,
  mod:      0xEB459E,
};

export function logoAttachment() {
  return new AttachmentBuilder(LOGO_PATH, { name: 'logo.png' });
}

export function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.error)
    .setAuthor({ name: 'Action Failed', iconURL: 'attachment://logo.png' })
    .setTitle(`❌  ${title}`)
    .setDescription(`> ${description}`)
    .setThumbnail('attachment://logo.png')
    .setTimestamp()
    .setFooter({ text: 'Something went wrong', iconURL: 'attachment://logo.png' });
}

export function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setAuthor({ name: 'Action Successful', iconURL: 'attachment://logo.png' })
    .setTitle(`✅  ${title}`)
    .setDescription(`> ${description}`)
    .setThumbnail('attachment://logo.png')
    .setTimestamp()
    .setFooter({ text: 'Action completed', iconURL: 'attachment://logo.png' });
}

export function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.primary)
    .setAuthor({ name: 'Information', iconURL: 'attachment://logo.png' })
    .setTitle(title)
    .setDescription(description)
    .setThumbnail('attachment://logo.png')
    .setTimestamp()
    .setFooter({ text: 'Bot Info', iconURL: 'attachment://logo.png' });
}

export function isAdmin(member) {
  return (
    member.permissions.has('Administrator') ||
    member.roles.cache.has(process.env.ADMIN_ROLE_ID)
  );
}

export function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const [, amount, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(amount) * multipliers[unit];
}

export function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function generateId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
