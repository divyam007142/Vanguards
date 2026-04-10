import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get detailed info about a user or the server')
    .addStringOption(opt =>
      opt.setName('type').setDescription('What info to show').setRequired(true)
        .addChoices({ name: 'User', value: 'user' }, { name: 'Server', value: 'server' })
    )
    .addUserOption(opt => opt.setName('user').setDescription('User to look up (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const logo = logoAttachment();

    if (type === 'user') {
      const target = interaction.options.getMember('user') || interaction.member;
      const user   = target.user;
      const roles  = target.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => `${r}`)
        .join(', ') || 'None';

      await interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(target.displayHexColor !== '#000000' ? target.displayHexColor : COLORS.info)
            .setAuthor({ name: 'User Information', iconURL: 'attachment://logo.png' })
            .setTitle(`👤  ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
              { name: '🏷️  Tag',             value: user.tag,                                              inline: true },
              { name: '🆔  User ID',          value: `\`${user.id}\``,                                     inline: true },
              { name: '🤖  Bot',              value: user.bot ? 'Yes' : 'No',                               inline: true },
              { name: '📝  Nickname',         value: target.nickname || 'None',                             inline: true },
              { name: '📅  Account Created',  value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`,   inline: true },
              { name: '📥  Joined Server',    value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>`,  inline: true },
              { name: `🎭  Roles (${target.roles.cache.size - 1})`, value: roles.length > 1024 ? roles.substring(0, 1020) + '…' : roles },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • User Info', iconURL: 'attachment://logo.png' })
        ]
      });

    } else {
      const guild = interaction.guild;
      await guild.members.fetch();
      const bots   = guild.members.cache.filter(m => m.user.bot).size;
      const humans = guild.memberCount - bots;

      await interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.info)
            .setAuthor({ name: 'Server Information', iconURL: 'attachment://logo.png' })
            .setTitle(`🏠  ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 256 }) || 'attachment://logo.png')
            .addFields(
              { name: '🆔  Server ID',          value: `\`${guild.id}\``,                                      inline: true },
              { name: '👑  Owner',               value: `<@${guild.ownerId}>`,                                  inline: true },
              { name: '📅  Created',             value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,   inline: true },
              { name: '👥  Total Members',       value: `${guild.memberCount}`,                                 inline: true },
              { name: '🧑  Humans',              value: `${humans}`,                                            inline: true },
              { name: '🤖  Bots',                value: `${bots}`,                                              inline: true },
              { name: '📢  Channels',            value: `${guild.channels.cache.size}`,                        inline: true },
              { name: '🎭  Roles',               value: `${guild.roles.cache.size}`,                           inline: true },
              { name: '🚀  Boost Level',         value: `Level ${guild.premiumTier}`,                          inline: true },
              { name: '💎  Boosts',              value: `${guild.premiumSubscriptionCount || 0}`,              inline: true },
              { name: '🔒  Verification Level',  value: `${guild.verificationLevel}`,                          inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • Server Info', iconURL: 'attachment://logo.png' })
        ]
      });
    }
  }
};
