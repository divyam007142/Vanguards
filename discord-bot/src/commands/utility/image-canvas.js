import { SlashCommandBuilder, AttachmentBuilder, ChannelType } from 'discord.js';
import { generateServerCard, generateUserCard } from '../../utils/infoCard.js';
import { errorEmbed, logoAttachment } from '../../utils/helpers.js';
import Level from '../../models/Level.js';

export default {
  data: new SlashCommandBuilder()
    .setName('image-canvas')
    .setDescription('Generate a beautiful image card for a user or this server')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('What card to generate')
        .setRequired(true)
        .addChoices(
          { name: 'Server Info  — detailed server stats card', value: 'server' },
          { name: 'User Info    — user profile + level card',  value: 'user'   },
        )
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to generate a profile card for (defaults to you)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const type = interaction.options.getString('type');

    // ── SERVER CARD ────────────────────────────────────────────────────────────
    if (type === 'server') {
      const guild = interaction.guild;
      await guild.members.fetch();

      const bots        = guild.members.cache.filter(m => m.user.bot).size;
      const humans      = guild.memberCount - bots;
      const textCh      = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
      const voiceCh     = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
      const categories  = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
      const emojis      = guild.emojis.cache.size;

      let ownerName = 'Unknown';
      try {
        const owner = await guild.fetchOwner();
        ownerName = owner.user.username;
      } catch {}

      const createdAt = guild.createdAt.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

      let buf;
      try {
        buf = await generateServerCard({
          guildName:         guild.name,
          guildIconUrl:      guild.iconURL({ extension: 'png', size: 256 }),
          description:       guild.description || null,
          humanCount:        humans,
          botCount:          bots,
          textChannels:      textCh,
          voiceChannels:     voiceCh,
          categories,
          roleCount:         guild.roles.cache.size,
          emojis,
          boosts:            guild.premiumSubscriptionCount ?? 0,
          boostTier:         guild.premiumTier,
          verificationLevel: guild.verificationLevel,
          createdAt,
          ownerName,
        });
      } catch (err) {
        console.error('[image-canvas server]', err);
        return interaction.editReply({
          files: [logoAttachment()],
          embeds: [errorEmbed('Card Error', 'Failed to generate the server card.')],
        });
      }

      return interaction.editReply({
        files: [new AttachmentBuilder(buf, { name: 'server-info.png' })],
      });
    }

    // ── USER CARD ──────────────────────────────────────────────────────────────
    if (type === 'user') {
      const target = interaction.options.getMember('user') ?? interaction.member;
      const user   = target.user;

      // Discord role data
      const roles = target.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position);

      const topRoles = [...roles.values()].slice(0, 8).map(r => ({
        name:  r.name,
        color: r.hexColor !== '#000000' ? r.hexColor : null,
      }));

      const roleColor = target.displayHexColor !== '#000000'
        ? target.displayHexColor
        : null;

      const tag = user.discriminator && user.discriminator !== '0'
        ? `#${user.discriminator}`
        : `@${user.username}`;

      const fmtDate = ts => new Date(ts).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

      // Level / XP data from DB
      let level = null, xp = null, totalXp = null, rank = null;
      try {
        const data = await Level.findOne({
          userId:  user.id,
          guildId: interaction.guildId,
        });
        if (data) {
          level   = data.level;
          xp      = data.xp;
          totalXp = data.totalXp;
          rank    = await Level.countDocuments({
            guildId: interaction.guildId,
            totalXp: { $gt: data.totalXp },
          }) + 1;
        }
      } catch (err) {
        console.error('[image-canvas user] level lookup error:', err);
      }

      let buf;
      try {
        buf = await generateUserCard({
          username:       user.username,
          avatarUrl:      user.displayAvatarURL({ extension: 'png', size: 256 }),
          displayColor:   roleColor,
          nickname:       target.nickname,
          tag,
          accountCreated: fmtDate(user.createdTimestamp),
          joinedServer:   fmtDate(target.joinedTimestamp),
          roleCount:      roles.size,
          topRoles,
          level,
          xp,
          totalXp,
          rank,
        });
      } catch (err) {
        console.error('[image-canvas user]', err);
        return interaction.editReply({
          files: [logoAttachment()],
          embeds: [errorEmbed('Card Error', 'Failed to generate the user card.')],
        });
      }

      return interaction.editReply({
        files: [new AttachmentBuilder(buf, { name: 'user-info.png' })],
      });
    }
  },
};
