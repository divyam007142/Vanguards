import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';
import Config from '../../models/Config.js';

const STAFF_ROLE = '1490320570309415022';

export default {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Show the last deleted message in this channel'),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Staff Only', 'This command can only be used by staff.')], ephemeral: true });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const config = await Config.findOne({ guildId: interaction.guild.id });
    const sniped = config?.snipe?.find(s => s.channelId === interaction.channelId);
    const logo   = logoAttachment();

    if (!sniped) {
      return interaction.editReply({
        files: [logo],
        embeds: [errorEmbed('Nothing to Snipe', 'No recently deleted message found in this channel.')]
      });
    }

    const author = await interaction.client.users.fetch(sniped.authorId).catch(() => null);
    const deletedTs = Math.floor(new Date(sniped.deletedAt).getTime() / 1000);

    await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.primary)
          .setAuthor({
            name: author ? author.tag : `User ${sniped.authorId}`,
            iconURL: author?.displayAvatarURL({ size: 64 }) ?? undefined,
          })
          .setTitle('🔫  Sniped Message')
          .setThumbnail('attachment://logo.png')
          .setDescription(sniped.content || '*[No text content]*')
          .addFields(
            { name: '👤  Author',  value: author ? `${author.tag}` : `<@${sniped.authorId}>`, inline: true },
            { name: '🗑️  Deleted', value: `<t:${deletedTs}:R>`,                                inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Snipe', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
