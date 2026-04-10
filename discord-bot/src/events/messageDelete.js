import Config from '../models/Config.js';

export default {
  name: 'messageDelete',
  async execute(message, client) {
    if (message.author?.bot || !message.guild) return;
    if (!message.content) return;

    try {
      let config = await Config.findOne({ guildId: message.guild.id });
      if (!config) config = new Config({ guildId: message.guild.id });

      config.snipe = config.snipe.filter(s => s.channelId !== message.channelId);
      config.snipe.push({
        channelId: message.channelId,
        authorId: message.author.id,
        content: message.content,
        deletedAt: new Date()
      });

      if (config.snipe.length > 20) config.snipe = config.snipe.slice(-20);
      await config.save();
    } catch {}
  }
};
