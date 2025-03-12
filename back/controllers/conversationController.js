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
      return res.status(200).json({ conversation: { participants: [user1, user2], messages: [] } });
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

    // If it doesn't exist, create a new conversation packet
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
