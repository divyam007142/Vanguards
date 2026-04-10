import mongoose from 'mongoose';

const muteSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  reason: { type: String, default: 'No reason provided' },
});

export default mongoose.model('Mute', muteSchema);
