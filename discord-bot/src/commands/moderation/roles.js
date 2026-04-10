import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { isAdmin, errorEmbed, COLORS, logoAttachment } from '../../utils/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Add or remove a role from a member or the entire server')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('What to do with the role')
        .setRequired(true)
        .addChoices(
          { name: 'Add — give role to a member',        value: 'add' },
          { name: 'Remove — take role from a member',   value: 'remove' },
          { name: 'Add Everyone — give role to all',    value: 'add_everyone' },
          { name: 'Remove Everyone — take role from all', value: 'remove_everyone' },
        )
    )
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('The role to add or remove')
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Target member (required for Add / Remove)')
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

    const action = interaction.options.getString('action');
    const role   = interaction.options.getRole('role');
    const user   = interaction.options.getMember('user');

    // Sanity: bot must be able to manage this role
    const botMember = interaction.guild.members.me;
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply({
        files: [logoAttachment()],
        embeds: [errorEmbed('Cannot Manage Role', 'That role is equal to or higher than my highest role.')],
        ephemeral: true,
      });
    }

    // ── Single-member actions ────────────────────────────────────────────────
    if (action === 'add' || action === 'remove') {
      if (!user) {
        return interaction.reply({
          files: [logoAttachment()],
          embeds: [errorEmbed('Missing User', 'Please specify a member to add/remove the role from.')],
          ephemeral: true,
        });
      }

      if (action === 'add') {
        if (user.roles.cache.has(role.id)) {
          return interaction.reply({
            files: [logoAttachment()],
            embeds: [errorEmbed('Already Has Role', `${user.user.tag} already has the ${role} role.`)],
            ephemeral: true,
          });
        }
        await user.roles.add(role);
      } else {
        if (!user.roles.cache.has(role.id)) {
          return interaction.reply({
            files: [logoAttachment()],
            embeds: [errorEmbed('Does Not Have Role', `${user.user.tag} does not have the ${role} role.`)],
            ephemeral: true,
          });
        }
        await user.roles.remove(role);
      }

      const logo = logoAttachment();
      return interaction.reply({
        files: [logo],
        embeds: [
          new EmbedBuilder()
            .setColor(action === 'add' ? COLORS.success : COLORS.warning)
            .setAuthor({ name: 'Role Management', iconURL: 'attachment://logo.png' })
            .setTitle(action === 'add' ? '✅  Role Added' : '➖  Role Removed')
            .setThumbnail(user.user.displayAvatarURL({ size: 128 }))
            .addFields(
              { name: '👤  Member', value: `${user.user.tag}\n\`${user.user.id}\``, inline: true },
              { name: '🎭  Role',   value: `${role}`,                                inline: true },
              { name: '👮  By',     value: interaction.user.tag,                     inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Bot • Role Management', iconURL: 'attachment://logo.png' }),
        ],
      });
    }

    // ── Server-wide actions ──────────────────────────────────────────────────
    await interaction.deferReply();

    const members = await interaction.guild.members.fetch();
    const targets = action === 'add_everyone'
      ? members.filter(m => !m.user.bot && !m.roles.cache.has(role.id))
      : members.filter(m => !m.user.bot &&  m.roles.cache.has(role.id));

    if (!targets.size) {
      return interaction.editReply({
        files: [logoAttachment()],
        embeds: [errorEmbed(
          'Nothing to Do',
          action === 'add_everyone'
            ? 'All members already have that role.'
            : 'No members currently have that role.',
        )],
      });
    }

    let success = 0;
    let failed  = 0;

    for (const [, member] of targets) {
      try {
        if (action === 'add_everyone') await member.roles.add(role);
        else                            await member.roles.remove(role);
        success++;
      } catch {
        failed++;
      }
    }

    const logo = logoAttachment();
    await interaction.editReply({
      files: [logo],
      embeds: [
        new EmbedBuilder()
          .setColor(action === 'add_everyone' ? COLORS.success : COLORS.warning)
          .setAuthor({ name: 'Role Management', iconURL: 'attachment://logo.png' })
          .setTitle(action === 'add_everyone' ? '✅  Role Added to Everyone' : '➖  Role Removed from Everyone')
          .setThumbnail('attachment://logo.png')
          .addFields(
            { name: '🎭  Role',      value: `${role}`,            inline: true },
            { name: '✅  Updated',   value: `\`${success}\``,     inline: true },
            { name: '❌  Failed',    value: `\`${failed}\``,      inline: true },
            { name: '👮  By',        value: interaction.user.tag, inline: true },
          )
          .setTimestamp()
          .setFooter({ text: 'Bot • Role Management', iconURL: 'attachment://logo.png' }),
      ],
    });
  },
};
