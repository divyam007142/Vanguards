import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, COLORS, generateId, logoAttachment } from '../../utils/helpers.js';
import Config from '../../models/Config.js';

const STAFF_ROLE = '1490320570309415022';

export default {
  data: new SlashCommandBuilder()
    .setName('trigger')
    .setDescription('Manage auto-response triggers for this server')
    .addStringOption(opt =>
      opt.setName('action').setDescription('What to do').setRequired(true)
        .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }, { name: 'List', value: 'list' })
    )
    .addStringOption(opt => opt.setName('keywords').setDescription('Comma-separated keywords (for add)').setRequired(false))
    .addStringOption(opt => opt.setName('title').setDescription('Response title (for add)').setRequired(false))
    .addStringOption(opt => opt.setName('description').setDescription('Response description (for add)').setRequired(false))
    .addStringOption(opt => opt.setName('id').setDescription('Trigger ID (for remove)').setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Staff Only', 'This command can only be used by staff.')], ephemeral: true });
    }

    const action = interaction.options.getString('action');

    if (action === 'add') {
      const keywords    = interaction.options.getString('keywords');
      const title       = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      if (!keywords || !title || !description) {
        return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Missing Info', 'Provide `keywords`, `title`, and `description` to add a trigger.')], flags: MessageFlags.Ephemeral });
      }
    }
    if (action === 'remove' && !interaction.options.getString('id')) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Missing ID', 'Provide the trigger `id` to remove.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply();

    const logo = logoAttachment();

    if (action === 'add') {
      const keywords    = interaction.options.getString('keywords');
      const title       = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const id          = generateId();
      const kwArray     = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $push: { triggers: { id, title, description, keywords: kwArray } } },
        { upsert: true }
      );

      await interaction.editReply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Triggers — Add', iconURL: 'attachment://logo.png' })
            .setTitle('✅  Trigger Added')
            .setThumbnail('attachment://logo.png')
            .addFields(
              { name: '🆔  ID',          value: `\`${id}\``,          inline: true },
              { name: '📌  Title',        value: title,                 inline: true },
              { name: '🔑  Keywords',     value: kwArray.join(', ') },
              { name: '💬  Description',  value: description },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • Triggers', iconURL: 'attachment://logo.png' })
        ]
      });

    } else if (action === 'remove') {
      const id     = interaction.options.getString('id');
      const config = await Config.findOne({ guildId: interaction.guild.id });
      const exists = config?.triggers?.some(t => t.id === id);

      if (!exists) {
        return interaction.editReply({ files: [logo], embeds: [errorEmbed('Not Found', `No trigger found with ID \`${id}\`.`)] });
      }

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $pull: { triggers: { id } } }
      );

      await interaction.editReply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Triggers — Remove', iconURL: 'attachment://logo.png' })
            .setTitle('✅  Trigger Removed')
            .setThumbnail('attachment://logo.png')
            .setDescription(`Trigger \`${id}\` has been deleted.`)
            .setTimestamp()
            .setFooter({ text: 'Bot • Triggers', iconURL: 'attachment://logo.png' })
        ]
      });

    } else {
      const config = await Config.findOne({ guildId: interaction.guild.id });

      if (!config?.triggers?.length) {
        return interaction.editReply({
          files: [logo],
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.info)
              .setAuthor({ name: 'Triggers — List', iconURL: 'attachment://logo.png' })
              .setTitle('⚡  Auto-Response Triggers')
              .setThumbnail('attachment://logo.png')
              .setDescription('No triggers configured yet.\nUse `/trigger add` to create one.')
              .setTimestamp()
              .setFooter({ text: 'Bot • Triggers', iconURL: 'attachment://logo.png' })
          ]
        });
      }

      const list = config.triggers.map(t =>
        `**\`${t.id}\`** — **${t.title}**\n🔑 ${t.keywords.join(', ')}`
      ).join('\n\n');

      await interaction.editReply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.info)
            .setAuthor({ name: 'Triggers — List', iconURL: 'attachment://logo.png' })
            .setTitle('⚡  Active Triggers')
            .setThumbnail('attachment://logo.png')
            .setDescription(list)
            .setTimestamp()
            .setFooter({ text: `${config.triggers.length} trigger(s) • Bot • Triggers`, iconURL: 'attachment://logo.png' })
        ]
      });
    }
  }
};
