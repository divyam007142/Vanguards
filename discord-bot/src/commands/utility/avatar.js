import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('View a user\'s avatar in full size')
    .addUserOption(opt => opt.setName('user').setDescription('The user whose avatar to show (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const target    = interaction.options.getUser('user') || interaction.user;
    const avatarURL = target.displayAvatarURL({ size: 4096, extension: 'png' });
    const logo      = logoAttachment();

    await interaction.reply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.primary)
          .setAuthor({ name: 'Avatar Viewer', iconURL: 'attachment://logo.png' })
          .setTitle(`🖼️  ${target.username}'s Avatar`)
          .setThumbnail('attachment://logo.png')
          .setImage(avatarURL)
          .addFields(
            { name: '👤  User',       value: `${target.tag}`,                      inline: true },
            { name: '🔗  Download',   value: `[Full size PNG](${avatarURL})`,      inline: true },
          )
          .setTimestamp()
          .setFooter({ text: `ID: ${target.id}`, iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
