import mongoose from 'mongoose';

const warningSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  warnings: [
    {
      id: { type: String, required: true },
      moderatorId: { type: String, required: true },
      reason: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model('Warning', warningSchema);
