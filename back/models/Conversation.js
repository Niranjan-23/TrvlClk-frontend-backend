const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema(
  {
    // Participants should be the two users involved
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    ],
    // All messages exchanged between these users
    messages: [messageSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
