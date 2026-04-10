import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';
import Warning from '../../models/Warning.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Interactively remove a warning from a user')
    .addUserOption(opt => opt.setName('user').setDescription('The user to unwarn').setRequired(true)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const target = interaction.options.getUser('user');
    const doc    = await Warning.findOne({ guildId: interaction.guild.id, userId: target.id });
    const logo   = logoAttachment();

    if (!doc || !doc.warnings.length) {
      return interaction.editReply({
        files: [logo],
        embeds: [errorEmbed('No Warnings', `**${target.username}** has no warnings to remove.`)]
      });
    }

    const buttons = doc.warnings.slice(0, 5).map(w =>
      new ButtonBuilder()
        .setCustomId(`unwarn_${w.id}`)
        .setLabel(`${w.id} — ${w.reason.substring(0, 22)}`)
        .setStyle(ButtonStyle.Danger)
    );

    const row = new ActionRowBuilder().addComponents(buttons);

    const warnList = doc.warnings.map((w, i) =>
      `**${i + 1}.** \`${w.id}\` — ${w.reason}\n> <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>`
    ).join('\n\n');

    const msg = await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.warning)
          .setAuthor({ name: 'Moderation — Remove Warning', iconURL: 'attachment://logo.png' })
          .setTitle(`⚠️  Warnings for ${target.username}`)
          .setThumbnail(target.displayAvatarURL({ size: 128 }))
          .setDescription(warnList)
          .setFooter({ text: 'Click a button below to remove that warning — expires in 30s', iconURL: 'attachment://logo.png' })
      ],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async btn => {
      const warnId = btn.customId.replace('unwarn_', '');
      await Warning.updateOne(
        { guildId: interaction.guild.id, userId: target.id },
        { $pull: { warnings: { id: warnId } } }
      );
      await btn.update({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Warning Removed', iconURL: 'attachment://logo.png' })
            .setTitle('✅  Warning Removed')
            .setDescription(`Warning \`${warnId}\` has been removed from **${target.username}**.`)
            .setTimestamp()
            .setFooter({ text: 'Bot • Moderation' })
        ],
        components: [],
        files: []
      });
      collector.stop();
    });

    collector.on('end', collected => {
      if (!collected.size) {
        interaction.editReply({ components: [] }).catch(() => {});
      }
    });
  }
};
