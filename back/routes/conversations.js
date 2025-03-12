const express = require('express');
const router = express.Router();
const { getConversation, sendMessage } = require('../controllers/conversationController');

// Get the conversation between two users
router.get('/conversations/:user1/:user2', getConversation);
// Send a new message (creates or updates a conversation)
router.post('/conversations', sendMessage);

module.exports = router;
