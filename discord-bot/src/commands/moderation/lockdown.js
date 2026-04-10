import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, parseDuration, formatDuration, logoAttachment } from '../../utils/helpers.js';
import Config from '../../models/Config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock or unlock a channel')
    .addStringOption(opt =>
      opt.setName('action').setDescription('Start or end a lockdown').setRequired(true)
        .addChoices({ name: 'Start', value: 'start' }, { name: 'End', value: 'end' })
    )
    .addStringOption(opt => opt.setName('duration').setDescription('Auto-unlock after (e.g. 10m, 1h) — start only').setRequired(false))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the lockdown — start only').setRequired(false)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('No Permission', 'You need the admin role to use this command.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply();

    const action      = interaction.options.getString('action');
    const durationStr = interaction.options.getString('duration');
    const reason      = interaction.options.getString('reason') || 'No reason provided';
    const channel     = interaction.channel;
    const everyone    = interaction.guild.roles.everyone;
    const logo        = logoAttachment();

    if (action === 'start') {
      await channel.permissionOverwrites.edit(everyone, { SendMessages: false });

      let ms = null, endsAt = null;
      if (durationStr) {
        ms = parseDuration(durationStr);
        if (ms) endsAt = new Date(Date.now() + ms);
      }

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $pull: { lockdowns: { channelId: channel.id } } },
        { upsert: true }
      );
      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $push: { lockdowns: { channelId: channel.id, reason, endsAt, active: true } } }
      );

      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setAuthor({ name: 'Moderation — Lockdown', iconURL: 'attachment://logo.png' })
        .setTitle('🔒  Channel Locked')
        .setThumbnail('attachment://logo.png')
        .setDescription(`${channel} has been locked down.`)
        .addFields(
          { name: '📋  Reason',    value: reason,              inline: true },
          { name: '👮  By',        value: interaction.user.tag, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' });

      if (endsAt) {
        embed.addFields({ name: '🔓  Auto-Unlock', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true });

        setTimeout(async () => {
          try {
            await channel.permissionOverwrites.edit(everyone, { SendMessages: null });
            await Config.findOneAndUpdate(
              { guildId: interaction.guild.id },
              { $pull: { lockdowns: { channelId: channel.id } } }
            );
            await channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(COLORS.success)
                  .setTitle('🔓  Lockdown Ended')
                  .setDescription(`The lockdown in ${channel} has automatically ended.`)
                  .setTimestamp()
              ]
            });
          } catch {}
        }, ms);
      }

      await interaction.editReply({ files: [logo], embeds: [embed] });

    } else {
      const config   = await Config.findOne({ guildId: interaction.guild.id });
      const lockdown = config?.lockdowns?.find(l => l.channelId === channel.id && l.active);

      if (!lockdown) {
        return interaction.editReply({ files: [logo], embeds: [errorEmbed('Not Locked', 'This channel is not currently in lockdown.')] });
      }

      await channel.permissionOverwrites.edit(everyone, { SendMessages: null });
      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $pull: { lockdowns: { channelId: channel.id } } }
      );

      await interaction.editReply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setAuthor({ name: 'Moderation — Lockdown', iconURL: 'attachment://logo.png' })
            .setTitle('🔓  Lockdown Ended')
            .setThumbnail('attachment://logo.png')
            .setDescription(`${channel} has been unlocked.`)
            .addFields(
              { name: '📢  Channel', value: `${channel}`,          inline: true },
              { name: '👮  By',      value: interaction.user.tag,   inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • Moderation', iconURL: 'attachment://logo.png' })
        ]
      });
    }
  }
};
