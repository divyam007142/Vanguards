import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout (unmute) from a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to unmute').setRequired(true)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('User Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!target.isCommunicationDisabled()) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Not Muted', 'This user is not currently muted.')], ephemeral: true });

    await target.timeout(null);

    const logo = logoAttachment();
    await interaction.reply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setAuthor({ name: 'Moderation — Unmute', iconURL: 'attachment://logo.png' })
          .setTitle('🔊  Member Unmuted')
          .setThumbnail(target.user.displayAvatarURL({ size: 128 }))
          .addFields(
            { name: '👤  User',      value: target.user.tag,      inline: true },
            { name: '👮  Moderator', value: interaction.user.tag, inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
