import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';
import Reminder from '../../models/Reminder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a personal reminder — you\'ll get a DM when the time comes')
    .addIntegerOption(opt => opt.setName('hours').setDescription('Hours from now (0–720)').setRequired(true).setMinValue(0).setMaxValue(720))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes from now (0–59)').setRequired(true).setMinValue(0).setMaxValue(59))
    .addStringOption(opt => opt.setName('message').setDescription('What should I remind you about?').setRequired(true)),

  async execute(interaction) {
    const hours   = interaction.options.getInteger('hours');
    const minutes = interaction.options.getInteger('minutes');
    const message = interaction.options.getString('message');

    if (hours === 0 && minutes === 0) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Invalid Time', 'Please specify at least 1 minute.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const ms       = (hours * 3600 + minutes * 60) * 1000;
    const remindAt = new Date(Date.now() + ms);

    const reminder = await Reminder.create({
      userId:    interaction.user.id,
      channelId: interaction.channelId,
      message,
      remindAt
    });

    const remindTs = Math.floor(remindAt.getTime() / 1000);
    const logo     = logoAttachment();

    await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.primary)
          .setAuthor({ name: 'Reminder Set', iconURL: 'attachment://logo.png' })
          .setTitle('⏰  Reminder Created!')
          .setThumbnail('attachment://logo.png')
          .setDescription(`I'll remind you about:\n> **${message}**`)
          .addFields(
            { name: '📅  Remind At', value: `<t:${remindTs}:F>`,  inline: true },
            { name: '⏳  That\'s',   value: `<t:${remindTs}:R>`,  inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'You will receive a DM when the time comes', iconURL: 'attachment://logo.png' })
      ]
    });

    setTimeout(async () => {
      try {
        const user = await interaction.client.users.fetch(interaction.user.id);
        await user.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.primary)
              .setTitle('⏰  Reminder!')
              .setDescription(`You asked me to remind you:\n\n> **${message}**`)
              .addFields({ name: '⏱️  Set', value: `<t:${Math.floor((remindAt.getTime() - ms) / 1000)}:R>` })
              .setTimestamp()
          ]
        });
        await Reminder.findByIdAndUpdate(reminder._id, { sent: true });
      } catch { /* DMs closed */ }
    }, ms);
  }
};
