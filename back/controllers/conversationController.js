// controllers/conversationController.js
const Conversation = require('../models/Conversation');

exports.getConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    // Find conversation that contains both participants
    const conversation = await Conversation.findOne({
      participants: { $all: [user1, user2] }
    }).populate('participants', 'username name profileImage');

    // If no conversation exists, return an empty conversation packet
    if (!conversation) {
      return res.status(200).json({ conversation: { _id: null, participants: [user1, user2], messages: [] } });
    }
    res.status(200).json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Error fetching conversation' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, recipientId, text } = req.body;
    if (!senderId || !recipientId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find an existing conversation between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    // If it doesn't exist, create a new conversation
    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        messages: []
      });
    }

    // Add the new message to the conversation
    conversation.messages.push({ sender: senderId, text });
    await conversation.save();
    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
};

/** NEW: Delete a single message from a conversation */
exports.deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if the message exists in the conversation
    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Remove the message using pull method
    conversation.messages.pull(messageId);

    await conversation.save();
    res.status(200).json({ conversation });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Error deleting message" });
  }
};
