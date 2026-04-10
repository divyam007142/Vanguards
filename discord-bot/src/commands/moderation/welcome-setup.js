import {
  SlashCommandBuilder, EmbedBuilder, MessageFlags,
} from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';
import Config from '../../models/Config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('welcome-setup')
    .setDescription('Configure or reset the welcome channel for new members')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('What to do')
        .setRequired(true)
        .addChoices(
          { name: 'Set — register the welcome channel',  value: 'set'   },
          { name: 'Reset — clear welcome config entirely', value: 'reset' },
        )
    )
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('The channel to use for welcome messages (required for Set)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        files: [logoAttachment()],
        embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const action  = interaction.options.getString('action');
    const channel = interaction.options.getChannel('channel');
    const logo    = logoAttachment();
    const config  = await Config.findOne({ guildId: interaction.guild.id });

    // ── SET ──────────────────────────────────────────────────────────────────
    if (action === 'set') {
      if (!channel) {
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed('Missing Channel', 'Please specify a channel with the `channel` option.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      // Block re-registration — must reset first
      if (config?.welcomeChannelId) {
        const existingCh  = interaction.guild.channels.cache.get(config.welcomeChannelId);
        const existingStr = existingCh ? `${existingCh}` : `\`${config.welcomeChannelId}\` *(deleted)*`;
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed(
            'Already Registered',
            `A welcome channel is already configured (${existingStr}).\n\n` +
            `Use \`/welcome-setup reset\` to clear the existing setup before registering a new channel.`
          )],
          flags: MessageFlags.Ephemeral,
        });
      }

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: { welcomeChannelId: channel.id } },
        { upsert: true, new: true }
      );

      return interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Server Setup', iconURL: 'attachment://logo.png' })
            .setTitle('✅  Welcome Channel Set')
            .setThumbnail('attachment://logo.png')
            .setDescription(`Welcome messages will now be sent in ${channel} whenever a new member joins.`)
            .addFields(
              { name: '📢  Channel', value: `${channel}`,         inline: true },
              { name: '👮  Set By',  value: interaction.user.tag, inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • Setup', iconURL: 'attachment://logo.png' }),
        ],
      });
    }

    // ── RESET ────────────────────────────────────────────────────────────────
    if (action === 'reset') {
      if (!config?.welcomeChannelId) {
        return interaction.reply({
          files: [logo],
          embeds: [errorEmbed('Not Configured', 'There is no welcome channel configured to reset.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $unset: { welcomeChannelId: '' } }
      );

      return interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setAuthor({ name: 'Server Setup', iconURL: 'attachment://logo.png' })
            .setTitle('🗑️  Welcome Config Reset')
            .setThumbnail('attachment://logo.png')
            .setDescription('The welcome channel configuration has been cleared.\nYou can now use `/welcome-setup set` to register a new welcome channel.')
            .addFields({ name: '👮  Reset By', value: interaction.user.tag, inline: true })
            .setTimestamp()
            .setFooter({ text: 'Bot • Setup', iconURL: 'attachment://logo.png' }),
        ],
      });
    }
  },
};
