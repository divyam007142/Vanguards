import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  channelId: { type: String, required: true },
  message: { type: String, required: true },
  remindAt: { type: Date, required: true },
  sent: { type: Boolean, default: false },
});

export default mongoose.model('Reminder', reminderSchema);
