import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, logoAttachment } from '../../utils/helpers.js';
import Config from '../../models/Config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status — others will be notified when they mention you')
    .addStringOption(opt => opt.setName('reason').setDescription('Why are you going AFK?').setRequired(false)),

  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'AFK';

    await interaction.deferReply();

    await Config.findOneAndUpdate(
      { guildId: interaction.guild.id },
      { $pull: { afk: { userId: interaction.user.id } } },
      { upsert: true }
    );
    await Config.findOneAndUpdate(
      { guildId: interaction.guild.id },
      { $push: { afk: { userId: interaction.user.id, reason, since: new Date() } } }
    );

    const logo = logoAttachment();
    await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.muted)
          .setAuthor({ name: 'AFK Status', iconURL: 'attachment://logo.png' })
          .setTitle('💤  Gone AFK')
          .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
          .setDescription(`I'll let people know you're AFK when they mention you.`)
          .addFields(
            { name: '📋  Reason',  value: reason,                                              inline: true },
            { name: '🕐  Since',   value: `<t:${Math.floor(Date.now() / 1000)}:R>`,            inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'You will be removed from AFK when you send a message', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
