const express = require('express');
const router = express.Router();
const { addComment, getComments } = require('../controllers/commentController');

router.post('/posts/:postId/comments', addComment);
router.get('/posts/:postId/comments', getComments);

module.exports = router;