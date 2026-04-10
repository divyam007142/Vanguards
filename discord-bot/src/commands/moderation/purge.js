import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages in this channel')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1–100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(opt => opt.setName('user').setDescription('Only delete messages from this user').setRequired(false)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], ephemeral: true });
    }

    const amount     = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const toDelete = [...messages.values()]
      .filter(m => {
        if (Date.now() - m.createdTimestamp > 1209600000) return false;
        return targetUser ? m.author.id === targetUser.id : true;
      })
      .slice(0, amount);

    if (!toDelete.length) {
      return interaction.editReply({ files: [logoAttachment()], embeds: [errorEmbed('No Messages', 'No deletable messages found in this channel.')] });
    }

    const deleted = await interaction.channel.bulkDelete(toDelete, true);
    const logo    = logoAttachment();

    await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setAuthor({ name: 'Moderation — Purge', iconURL: 'attachment://logo.png' })
          .setTitle('🗑️  Messages Purged')
          .setThumbnail('attachment://logo.png')
          .addFields(
            { name: '🗑️  Deleted',   value: `\`${deleted.size}\` messages`,         inline: true },
            { name: '📢  Channel',   value: `${interaction.channel}`,                inline: true },
            { name: '🔍  Filter',    value: targetUser ? targetUser.tag : 'Everyone', inline: true },
            { name: '👮  By',        value: interaction.user.tag,                    inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
