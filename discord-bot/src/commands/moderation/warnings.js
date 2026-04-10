import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';
import Warning from '../../models/Warning.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View all warnings for a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(true)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply();

    const target = interaction.options.getUser('user');
    const doc    = await Warning.findOne({ guildId: interaction.guild.id, userId: target.id });
    const logo   = logoAttachment();

    if (!doc || !doc.warnings.length) {
      return interaction.editReply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Moderation — Warnings', iconURL: 'attachment://logo.png' })
            .setTitle('📋  Warning History')
            .setThumbnail(target.displayAvatarURL({ size: 128 }))
            .setDescription(`✅  **${target.username}** has a clean record — no warnings.`)
            .setTimestamp()
            .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' })
        ]
      });
    }

    const warnList = doc.warnings.map((w, i) =>
      `**${i + 1}.** \`${w.id}\` — ${w.reason}\n> <@${w.moderatorId}> • <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>`
    ).join('\n\n');

    await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(doc.warnings.length >= 3 ? COLORS.error : COLORS.warning)
          .setAuthor({ name: 'Moderation — Warnings', iconURL: 'attachment://logo.png' })
          .setTitle(`⚠️  Warnings for ${target.username}`)
          .setThumbnail(target.displayAvatarURL({ size: 128 }))
          .setDescription(warnList)
          .setTimestamp()
          .setFooter({ text: `${doc.warnings.length} active warning(s) • Bot • Moderation`, iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
