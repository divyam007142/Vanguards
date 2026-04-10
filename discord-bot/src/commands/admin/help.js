import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, logoAttachment } from '../../utils/helpers.js';

const STAFF_ROLE = '1490320570309415022';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available bot commands'),

  async execute(interaction) {
    const isStaff = interaction.member.roles.cache.has(STAFF_ROLE);
    const logo    = logoAttachment();

    // ── Embed 1: Header ───────────────────────────────────────────────────────
    const header = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setAuthor({
        name: `${interaction.client.user.username} — Command Reference`,
        iconURL: 'attachment://logo.png',
      })
      .setImage('attachment://logo.png')
      .setDescription(
        '**Welcome to the command guide!**\n\n' +
        '> 🌐 **Public** — available to everyone\n' +
        '> 🛡️ **Admin** — requires the Admin role\n' +
        '> 🔒 **Staff** — requires the Staff role\n\n' +
        '─────────────────────────────'
      );

    // ── Embed 2: General ──────────────────────────────────────────────────────
    const general = new EmbedBuilder()
      .setColor(COLORS.primary)
      .addFields({
        name: '🌐  General Commands',
        value: [
          '`/help`    — Show this command list',
          '`/avatar`  — View a user\'s full-size avatar',
          '`/info`    — Info about a user or this server',
          '`/afk`     — Set or clear your AFK status',
          '`/remind`  — Set a personal reminder (DM)',
          '`/levels`        — View your level card or the server leaderboard',
          '`/image-canvas`  — Generate a server or user profile image card',
        ].join('\n'),
      });

    // ── Embed 3: Moderation ───────────────────────────────────────────────────
    const moderation = new EmbedBuilder()
      .setColor(COLORS.error)
      .addFields({
        name: '🛡️  Moderation Commands',
        value: [
          '`/ban`            — Ban a member from the server',
          '`/unban`          — Unban a user by their ID',
          '`/mute`           — Timeout a member (e.g. `10m`, `2h`, `1d`)',
          '`/unmute`         — Remove an active timeout',
          '`/warn`           — Issue a formal warning (sends DM)',
          '`/unwarn`         — Remove a warning interactively',
          '`/warnings`       — View all warnings for a member',
          '`/purge`          — Bulk-delete messages in a channel',
          '`/lockdown`       — Lock or unlock a channel',
          '`/roles`          — Add/remove roles from members or everyone',
          '`/welcome-setup`  — Set or reset the welcome channel',
          '`/counting`       — Set, start, stop, or reset the counting channel',
        ].join('\n'),
      });

    // ── Embed 4: Voice ────────────────────────────────────────────────────────
    const voice = new EmbedBuilder()
      .setColor(COLORS.muted)
      .addFields({
        name: '🎙️  Voice Moderation',
        value: [
          '`/vcmute`      — Server-mute a user in voice',
          '`/vcunmute`    — Remove server-mute from a user',
          '`/disconnect`  — Disconnect a user from their VC',
        ].join('\n'),
      });

    // ── Embed 5: Staff ────────────────────────────────────────────────────────
    const staffOnly = new EmbedBuilder()
      .setColor(COLORS.warning)
      .addFields({
        name: '🔒  Staff-Only Commands',
        value: [
          '`/snipe`    — See the last deleted message in a channel',
          '`/echo`     — Send a message as the bot',
          '`/trigger`  — Manage auto-response trigger rules',
          '`/stats`    — Bot uptime, ping, memory & system info',
        ].join('\n'),
      })
      .setTimestamp()
      .setFooter({
        text: isStaff
          ? '🔒 You have the Staff role — all commands are available to you.'
          : '🔒 Staff commands require the Staff role to execute.',
        iconURL: 'attachment://logo.png',
      });

    await interaction.reply({
      files: [logo],
      embeds: [header, general, moderation, voice, staffOnly],
    });
  },
};
