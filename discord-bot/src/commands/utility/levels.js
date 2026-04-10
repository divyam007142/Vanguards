import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';
import { generateStatsCard, generateLeaderboardCard } from '../../utils/levelCard.js';
import Level from '../../models/Level.js';

export default {
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('View XP stats or the server leaderboard')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('What to show')
        .setRequired(true)
        .addChoices(
          { name: 'Stats — your personal level card',    value: 'stats'       },
          { name: 'Leaderboard — top 10 server card',   value: 'leaderboard' },
        )
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to view stats for (stats only, defaults to you)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const type   = interaction.options.getString('type');
    const target = interaction.options.getMember('user') ?? interaction.member;

    await interaction.deferReply();

    // ── STATS ─────────────────────────────────────────────────────────────────
    if (type === 'stats') {
      const user = target.user;

      const levelDoc = await Level.findOne({ guildId: interaction.guild.id, userId: user.id });

      if (!levelDoc || levelDoc.totalXp === 0) {
        return interaction.editReply({
          files: [logoAttachment()],
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.muted)
              .setAuthor({ name: 'Levels — Stats', iconURL: 'attachment://logo.png' })
              .setTitle('📊  No XP Yet')
              .setDescription(
                `**${user.username}** hasn't earned any XP yet.\n` +
                `Send messages with 3 or more words to start gaining XP!`
              )
              .setTimestamp()
              .setFooter({ text: 'Bot • Leveling', iconURL: 'attachment://logo.png' })
          ],
        });
      }

      // Rank = position in guild sorted by totalXp DESC
      const rank = await Level.countDocuments({
        guildId: interaction.guild.id,
        totalXp: { $gt: levelDoc.totalXp },
      }) + 1;

      let cardBuffer;
      try {
        cardBuffer = await generateStatsCard({
          user:    user,
          level:   levelDoc.level,
          xp:      levelDoc.xp,
          totalXp: levelDoc.totalXp,
          rank:    rank,
        });
      } catch (err) {
        console.error('Stats card generation failed:', err);
        return interaction.editReply({
          files: [logoAttachment()],
          embeds: [errorEmbed('Card Error', 'Failed to generate the stats card. Please try again.')],
        });
      }

      const attachment = new AttachmentBuilder(cardBuffer, { name: 'stats.png' });
      return interaction.editReply({ files: [attachment] });
    }

    // ── LEADERBOARD ───────────────────────────────────────────────────────────
    if (type === 'leaderboard') {
      const topDocs = await Level.find({ guildId: interaction.guild.id })
        .sort({ totalXp: -1 })
        .limit(10)
        .lean();

      if (!topDocs.length) {
        return interaction.editReply({
          files: [logoAttachment()],
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.muted)
              .setAuthor({ name: 'Levels — Leaderboard', iconURL: 'attachment://logo.png' })
              .setTitle('🏆  No Data Yet')
              .setDescription('Nobody has earned XP in this server yet.\nSend messages with 3 or more words to start gaining XP!')
              .setTimestamp()
              .setFooter({ text: 'Bot • Leveling', iconURL: 'attachment://logo.png' })
          ],
        });
      }

      // Resolve user objects and avatars
      const entries = await Promise.all(
        topDocs.map(async (doc, i) => {
          let username   = `Unknown User`;
          let avatarUrl  = null;
          try {
            const member = await interaction.guild.members.fetch(doc.userId);
            username  = member.user.username;
            avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 64 });
          } catch {
            try {
              const user = await interaction.client.users.fetch(doc.userId);
              username  = user.username;
              avatarUrl = user.displayAvatarURL({ extension: 'png', size: 64 });
            } catch {}
          }
          return {
            rank:     i + 1,
            username,
            avatarUrl,
            level:    doc.level,
            xp:       doc.xp,
            totalXp:  doc.totalXp,
          };
        })
      );

      const guildIconUrl = interaction.guild.iconURL({ extension: 'png', size: 64 });

      let cardBuffer;
      try {
        cardBuffer = await generateLeaderboardCard({
          guildName:   interaction.guild.name,
          guildIconUrl,
          entries,
        });
      } catch (err) {
        console.error('Leaderboard card generation failed:', err);
        return interaction.editReply({
          files: [logoAttachment()],
          embeds: [errorEmbed('Card Error', 'Failed to generate the leaderboard card. Please try again.')],
        });
      }

      const attachment = new AttachmentBuilder(cardBuffer, { name: 'leaderboard.png' });
      return interaction.editReply({ files: [attachment] });
    }
  },
};
