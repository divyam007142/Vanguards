import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  welcomeChannelId: { type: String, default: null },
  lockdowns: [
    {
      channelId: { type: String },
      reason: { type: String },
      endsAt: { type: Date },
      active: { type: Boolean, default: true },
    },
  ],
  triggers: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      keywords: [String],
    },
  ],
  afk: [
    {
      userId: { type: String },
      reason: { type: String, default: 'AFK' },
      since: { type: Date, default: Date.now },
    },
  ],
  snipe: [
    {
      channelId: { type: String },
      authorId: { type: String },
      content: { type: String },
      deletedAt: { type: Date },
    },
  ],
  counting: {
    channelId:   { type: String,  default: null },
    current:     { type: Number,  default: 0 },
    startFrom:   { type: Number,  default: 1 },
    lastUserId:  { type: String,  default: null },
    active:      { type: Boolean, default: false },
  },
});

export default mongoose.model('Config', configSchema);
