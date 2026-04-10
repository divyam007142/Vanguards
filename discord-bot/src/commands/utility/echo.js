import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';

const STAFF_ROLE = '1490320570309415022';

export default {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Send a message as the bot in a channel')
    .addStringOption(opt => opt.setName('message').setDescription('The message to send').setRequired(true))
    .addChannelOption(opt => opt.setName('channel').setDescription('Target channel (defaults to this channel)').setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Staff Only', 'This command can only be used by staff.')], ephemeral: true });
    }

    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.send(message);

      const logo = logoAttachment();
      await interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Echo', iconURL: 'attachment://logo.png' })
            .setTitle('📢  Message Sent')
            .setThumbnail('attachment://logo.png')
            .addFields(
              { name: '📢  Channel', value: `${channel}`,                                                       inline: true },
              { name: '👮  Sent By', value: interaction.user.tag,                                               inline: true },
              { name: '💬  Content', value: message.length > 500 ? message.substring(0, 497) + '…' : message },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • Echo', iconURL: 'attachment://logo.png' })
        ],
        ephemeral: true
      });
    } catch {
      await interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Failed', 'Could not send the message to that channel.')], ephemeral: true });
    }
  }
};
