import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, generateId, logoAttachment } from '../../utils/helpers.js';
import Warning from '../../models/Warning.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a formal warning to a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], flags: MessageFlags.Ephemeral });
    }

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!target) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('User Not Found', 'That user is not in this server.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply();

    const warnId  = generateId();
    const updated = await Warning.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: target.user.id },
      { $push: { warnings: { id: warnId, moderatorId: interaction.user.id, reason } } },
      { upsert: true, new: true }
    );
    const totalWarnings = updated?.warnings?.length || 1;

    try {
      await target.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.warning)
            .setTitle('⚠️  You received a warning')
            .setDescription(`You were warned in **${interaction.guild.name}**.`)
            .addFields(
              { name: '📋  Reason',         value: reason,                    inline: true },
              { name: '👮  Moderator',       value: interaction.user.username, inline: true },
              { name: '🆔  Warning ID',      value: `\`${warnId}\``,           inline: true },
              { name: '📊  Total Warnings',  value: `${totalWarnings}`,        inline: true },
            )
            .setTimestamp()
        ]
      });
    } catch { /* DMs closed */ }

    const logo = logoAttachment();
    await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.warning)
          .setAuthor({ name: 'Moderation — Warn', iconURL: 'attachment://logo.png' })
          .setTitle('⚠️  Member Warned')
          .setThumbnail(target.user.displayAvatarURL({ size: 128 }))
          .addFields(
            { name: '👤  User',            value: target.user.tag,      inline: true },
            { name: '🆔  Warning ID',      value: `\`${warnId}\``,      inline: true },
            { name: '📊  Total Warnings',  value: `${totalWarnings}`,   inline: true },
            { name: '📋  Reason',          value: reason },
            { name: '👮  Moderator',       value: interaction.user.tag, inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
