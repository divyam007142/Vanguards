import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(opt => opt.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban').setRequired(false)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('User Not Found', 'That user is not in this server.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Error', 'You cannot ban yourself.')], ephemeral: true });
    if (!target.bannable) return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Cannot Ban', 'I do not have permission to ban this user.')], ephemeral: true });

    try {
      await target.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setTitle('🔨  You have been banned')
            .setDescription(`You were banned from **${interaction.guild.name}**.`)
            .addFields(
              { name: '📋  Reason',     value: reason,                   inline: true },
              { name: '👮  Moderator',  value: interaction.user.username, inline: true },
            )
            .setTimestamp()
        ]
      });
    } catch { /* DMs closed */ }

    await target.ban({ reason });

    const logo = logoAttachment();
    await interaction.reply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.error)
          .setAuthor({ name: 'Moderation — Ban', iconURL: 'attachment://logo.png' })
          .setTitle('🔨  Member Banned')
          .setThumbnail(target.user.displayAvatarURL({ size: 128 }))
          .addFields(
            { name: '👤  User',       value: `${target.user.tag}\n\`${target.user.id}\``, inline: true },
            { name: '👮  Moderator',  value: interaction.user.tag,                         inline: true },
            { name: '📋  Reason',     value: reason },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
