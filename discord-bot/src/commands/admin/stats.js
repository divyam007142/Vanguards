import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { errorEmbed, COLORS, formatDuration, logoAttachment } from '../../utils/helpers.js';
import os from 'os';

const STAFF_ROLE = '1490320570309415022';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show bot statistics and system health'),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ files: [logoAttachment()], embeds: [errorEmbed('Staff Only', 'This command can only be used by staff.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const sent      = await interaction.fetchReply();
    const latency   = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;
    const uptime    = formatDuration(interaction.client.uptime);
    const memUsed   = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const memTotal  = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
    const cpuModel  = os.cpus()[0]?.model?.split('@')[0]?.trim() || 'Unknown';
    const guilds    = interaction.client.guilds.cache.size;
    const users     = interaction.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    const commands  = interaction.client.commands?.size ?? '—';

    const pingEmoji = wsLatency < 100 ? '🟢' : wsLatency < 250 ? '🟡' : '🔴';

    const logo = logoAttachment();
    await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.info)
          .setAuthor({ name: 'Bot Statistics', iconURL: 'attachment://logo.png' })
          .setTitle('📊  System Overview')
          .setThumbnail('attachment://logo.png')
          .addFields(
            { name: '⏱️  Uptime',      value: uptime,                              inline: true },
            { name: `${pingEmoji}  WS Ping`, value: `\`${wsLatency}ms\``,          inline: true },
            { name: '📡  Latency',     value: `\`${latency}ms\``,                  inline: true },
            { name: '🏠  Servers',     value: `\`${guilds}\``,                     inline: true },
            { name: '👥  Users',       value: `\`${users}\``,                      inline: true },
            { name: '⚡  Commands',    value: `\`${commands}\``,                   inline: true },
            { name: '💾  Memory',      value: `\`${memUsed} MB / ${memTotal} GB\``, inline: true },
            { name: '📦  Node.js',     value: `\`${process.version}\``,            inline: true },
            { name: '🖥️  CPU',         value: cpuModel,                            inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Stats', iconURL: 'attachment://logo.png' })
      ]
    });
  }
};
