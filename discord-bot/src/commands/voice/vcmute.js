import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vcmute')
    .setDescription('Mute a user in their voice channel')
    .addUserOption(opt => opt.setName('user').setDescription('The user to voice mute').setRequired(true)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('User Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!target.voice.channel) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Not in Voice', 'That user is not currently in a voice channel.')], ephemeral: true });
    if (target.voice.serverMute) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Already Muted', 'That user is already voice muted.')], ephemeral: true });

    await target.voice.setMute(true, `Muted by ${interaction.user.tag}`);

    const logo = logoAttachment();
    await interaction.reply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.warning)
          .setAuthor({ name: 'Voice — Mute', iconURL: 'attachment://logo.png' })
          .setTitle('🔇  Voice Muted')
          .setThumbnail(target.user.displayAvatarURL({ size: 128 }))
          .addFields(
            { name: '👤  User',      value: target.user.tag,           inline: true },
            { name: '🎙️  Channel',   value: target.voice.channel.name, inline: true },
            { name: '👮  Moderator', value: interaction.user.tag,      inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'Use /vcunmute to unmute • Bot • Voice', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
