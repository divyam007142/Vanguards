import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnect a user from their voice channel')
    .addUserOption(opt => opt.setName('user').setDescription('The user to disconnect').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the disconnect').setRequired(false)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('User Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!target.voice.channel) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Not in Voice', 'That user is not currently in a voice channel.')], ephemeral: true });

    const channelName = target.voice.channel.name;
    await target.voice.disconnect(reason);

    const logo = logoAttachment();
    await interaction.reply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.error)
          .setAuthor({ name: 'Voice — Disconnect', iconURL: 'attachment://logo.png' })
          .setTitle('📵  User Disconnected')
          .setThumbnail(target.user.displayAvatarURL({ size: 128 }))
          .addFields(
            { name: '👤  User',      value: target.user.tag,      inline: true },
            { name: '🎙️  Channel',   value: channelName,          inline: true },
            { name: '👮  Moderator', value: interaction.user.tag, inline: true },
            { name: '📋  Reason',    value: reason },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Voice Moderation', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
