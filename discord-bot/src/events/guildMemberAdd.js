import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { generateWelcomeCard } from '../utils/welcomeCard.js';
import { COLORS, logoAttachment } from '../utils/helpers.js';
import Config from '../models/Config.js';

export default {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      const config = await Config.findOne({ guildId: member.guild.id });

      const avatarURL = member.user.displayAvatarURL({ size: 256, extension: 'png' });
      const joinedAt  = `<t:${Math.floor(Date.now() / 1000)}:R>`;
      const createdAt = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`;

      // ── DM the new member ────────────────────────────────────────────────
      try {
        const logo   = logoAttachment();
        const dmEmbed = new EmbedBuilder()
          .setColor(COLORS.primary)
          .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL({ size: 128 }) ?? undefined, })
          .setTitle(`👋  Welcome to ${member.guild.name}!`)
          .setDescription(
            `Hey **${member.user.username}**, we're so glad to have you here!\n\n` +
            `Make sure to read the rules, introduce yourself, and enjoy your stay. We hope you have a great time! 🎉`
          )
          .setThumbnail(avatarURL)
          .addFields(
            { name: '🏠  Server',          value: member.guild.name,                    inline: true },
            { name: '👥  Total Members',   value: `**${member.guild.memberCount}**`,   inline: true },
            { name: '📅  You Joined',      value: joinedAt,                             inline: true },
            { name: '🎂  Account Created', value: createdAt,                            inline: true },
          )
          .setImage(member.guild.bannerURL({ size: 1024 }) ?? null)
          .setTimestamp()
          .setFooter({ text: `${member.guild.name} • Welcome`, iconURL: 'attachment://logo.png' });

        await member.user.send({ files: [logo], embeds: [dmEmbed] });
      } catch {
        // DMs closed — silently skip
      }

      // ── Welcome channel message + card ───────────────────────────────────
      if (!config?.welcomeChannelId) return;
      const channel = member.guild.channels.cache.get(config.welcomeChannelId);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL({ size: 64 }) ?? undefined })
        .setTitle(`Welcome to ${member.guild.name}!`)
        .setDescription(
          `Hey <@${member.user.id}>, we're glad to have you here.\nMake sure to read the rules and enjoy your stay! 🎉`
        )
        .setThumbnail(avatarURL)
        .addFields(
          { name: '👤 Username',        value: member.user.username,               inline: true },
          { name: '📅 Account Created', value: createdAt,                           inline: true },
          { name: '📥 Joined',          value: joinedAt,                            inline: true },
          { name: '🏅 Member Count',    value: `**#${member.guild.memberCount}**`, inline: true }
        )
        .setFooter({ text: `ID: ${member.user.id}` })
        .setTimestamp();

      await channel.send({
        content: `👋 Welcome to the server, <@${member.user.id}>!`,
        embeds: [embed],
      });

      const cardBuffer = await generateWelcomeCard(member, member.guild.memberCount);
      if (cardBuffer) {
        const cardAttach = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });
        await channel.send({ files: [cardAttach] });
      }
    } catch (err) {
      console.error('Welcome event error:', err);
    }
  }
};
