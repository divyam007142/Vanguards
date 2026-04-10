import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID')
    .addStringOption(opt => opt.setName('userid').setDescription('The user ID to unban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the unban').setRequired(false)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], ephemeral: true });
    }

    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      const ban = await interaction.guild.bans.fetch(userId);
      await interaction.guild.members.unban(userId, reason);

      const logo = logoAttachment();
      await interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Moderation — Unban', iconURL: 'attachment://logo.png' })
            .setTitle('✅  Member Unbanned')
            .setThumbnail('attachment://logo.png')
            .addFields(
              { name: '👤  User',      value: `${ban.user.tag}\n\`${userId}\``, inline: true },
              { name: '👮  Moderator', value: interaction.user.tag,              inline: true },
              { name: '📋  Reason',    value: reason },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' })
        ]
      });
    } catch {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Not Found', 'No ban found for that user ID.')], ephemeral: true });
    }
  }
};
