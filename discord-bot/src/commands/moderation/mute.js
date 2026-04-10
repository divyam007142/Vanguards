import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, parseDuration, formatDuration, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout (mute) a member for a duration')
    .addUserOption(opt => opt.setName('user').setDescription('The user to mute').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Duration, e.g. 10m, 2h, 1d').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the mute').setRequired(false)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], ephemeral: true });
    }

    const target      = interaction.options.getMember('user');
    const durationStr = interaction.options.getString('duration');
    const reason      = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('User Not Found', 'That user is not in this server.')], ephemeral: true });

    const ms = parseDuration(durationStr);
    if (!ms) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Invalid Duration', 'Use a format like `10m`, `2h`, or `1d`.')], ephemeral: true });
    if (ms > 2419200000) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Too Long', 'Maximum timeout duration is 28 days.')], ephemeral: true });

    try {
      await target.timeout(ms, reason);
    } catch {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Cannot Mute', 'I do not have permission to mute this user.')], ephemeral: true });
    }

    const unmuteTs = Math.floor((Date.now() + ms) / 1000);

    try {
      await target.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.warning)
            .setTitle('🔇  You have been muted')
            .setDescription(`You were timed out in **${interaction.guild.name}**.`)
            .addFields(
              { name: '⏱️  Duration',   value: formatDuration(ms),       inline: true },
              { name: '📋  Reason',     value: reason,                   inline: true },
              { name: '👮  Moderator',  value: interaction.user.username, inline: true },
              { name: '🔓  Unmuted At', value: `<t:${unmuteTs}:F>` },
            )
            .setTimestamp()
        ]
      });
    } catch { /* DMs closed */ }

    const logo = logoAttachment();
    await interaction.reply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.warning)
          .setAuthor({ name: 'Moderation — Mute', iconURL: 'attachment://logo.png' })
          .setTitle('🔇  Member Muted')
          .setThumbnail(target.user.displayAvatarURL({ size: 128 }))
          .addFields(
            { name: '👤  User',        value: target.user.tag,            inline: true },
            { name: '⏱️  Duration',    value: formatDuration(ms),         inline: true },
            { name: '👮  Moderator',   value: interaction.user.tag,       inline: true },
            { name: '📋  Reason',      value: reason },
            { name: '🔓  Unmuted At',  value: `<t:${unmuteTs}:F>`,        inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
