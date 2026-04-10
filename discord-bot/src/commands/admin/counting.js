import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';
import Config from '../../models/Config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('counting')
    .setDescription('Manage the counting channel')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('What to do')
        .setRequired(true)
        .addChoices(
          { name: 'Set — choose channel & starting number', value: 'set' },
          { name: 'Start — enable counting',                value: 'start' },
          { name: 'Stop — pause counting',                  value: 'stop' },
          { name: 'Reset — clear counting config entirely',  value: 'reset' },
        )
    )
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('The channel for counting (required for Set)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('start_from')
        .setDescription('Number to start counting from (default: 1)')
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        files: [logoAttachment()],
        embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')],
        ephemeral: true,
      });
    }

    const action    = interaction.options.getString('action');
    const channel   = interaction.options.getChannel('channel');
    const startFrom = interaction.options.getInteger('start_from') ?? 1;
    const logo      = logoAttachment();

    // ── SET ─────────────────────────────────────────────────────────────────
    if (action === 'set') {
      if (!channel) {
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed('Missing Channel', 'Please specify a channel to use for counting.')],
          ephemeral: true,
        });
      }

      const existing = await Config.findOne({ guildId: interaction.guild.id });
      if (existing?.counting?.channelId) {
        const existingCh = interaction.guild.channels.cache.get(existing.counting.channelId);
        const existingStr = existingCh ? `${existingCh}` : `\`${existing.counting.channelId}\` *(deleted)*`;
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed(
            'Already Registered',
            `A counting channel is already configured (${existingStr}).\n\n` +
            `Use \`/counting reset\` to clear the existing setup before registering a new one.`
          )],
          ephemeral: true,
        });
      }

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          $set: {
            'counting.channelId':  channel.id,
            'counting.current':    startFrom - 1,
            'counting.startFrom':  startFrom,
            'counting.lastUserId': null,
            'counting.active':     true,
          },
        },
        { upsert: true }
      );

      return interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Counting Setup', iconURL: 'attachment://logo.png' })
            .setTitle('🔢  Counting Channel Set')
            .setThumbnail('attachment://logo.png')
            .setDescription(`Counting is now active in ${channel}.\nStart counting from **${startFrom}**!`)
            .addFields(
              { name: '📢  Channel',     value: `${channel}`,       inline: true },
              { name: '🔢  Starts From', value: `\`${startFrom}\``, inline: true },
              { name: '👮  Set By',      value: interaction.user.tag, inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • Counting', iconURL: 'attachment://logo.png' }),
        ],
      });
    }

    // ── START ────────────────────────────────────────────────────────────────
    if (action === 'start') {
      const config = await Config.findOne({ guildId: interaction.guild.id });
      if (!config?.counting?.channelId) {
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed('Not Configured', 'Use `/counting set` first to configure a counting channel.')],
          ephemeral: true,
        });
      }
      if (config.counting.active) {
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed('Already Active', 'Counting is already running. Use `/counting stop` to pause it.')],
          ephemeral: true,
        });
      }

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: { 'counting.active': true } }
      );

      const ch = interaction.guild.channels.cache.get(config.counting.channelId);
      return interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Counting', iconURL: 'attachment://logo.png' })
            .setTitle('▶️  Counting Started')
            .setThumbnail('attachment://logo.png')
            .setDescription(`Counting has been re-enabled in ${ch ?? `<#${config.counting.channelId}>`}.\nNext number: **${config.counting.current + 1}**`)
            .setTimestamp()
            .setFooter({ text: 'Bot • Counting', iconURL: 'attachment://logo.png' }),
        ],
      });
    }

    // ── STOP ─────────────────────────────────────────────────────────────────
    if (action === 'stop') {
      const config = await Config.findOne({ guildId: interaction.guild.id });
      if (!config?.counting?.active) {
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed('Not Running', 'Counting is not currently active.')],
          ephemeral: true,
        });
      }

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: { 'counting.active': false } }
      );

      return interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.warning)
            .setAuthor({ name: 'Counting', iconURL: 'attachment://logo.png' })
            .setTitle('⏸️  Counting Paused')
            .setThumbnail('attachment://logo.png')
            .setDescription(`Counting has been paused. Current count: **${config.counting.current}**\nUse \`/counting start\` to resume.`)
            .setTimestamp()
            .setFooter({ text: 'Bot • Counting', iconURL: 'attachment://logo.png' }),
        ],
      });
    }

    // ── RESET ────────────────────────────────────────────────────────────────
    if (action === 'reset') {
      const config = await Config.findOne({ guildId: interaction.guild.id });
      if (!config?.counting?.channelId) {
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed('Not Configured', 'There is no counting config to reset.')],
          ephemeral: true,
        });
      }

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          $unset: { counting: '' },
        }
      );

      return interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setAuthor({ name: 'Counting', iconURL: 'attachment://logo.png' })
            .setTitle('🗑️  Counting Config Reset')
            .setThumbnail('attachment://logo.png')
            .setDescription('The counting configuration has been completely cleared.\nYou can now use `/counting set` to register a new counting channel.')
            .addFields({ name: '👮  Reset By', value: interaction.user.tag, inline: true })
            .setTimestamp()
            .setFooter({ text: 'Bot • Counting', iconURL: 'attachment://logo.png' }),
        ],
      });
    }
  },
};
