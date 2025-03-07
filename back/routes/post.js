const express = require('express');
const router = express.Router();
const {
  createPost,
  deletePost,
  getTimelinePosts,
  getUserPosts,
  likePost,
} = require('../controllers/postController');

router.post('/posts', createPost);
router.delete('/posts/:postId', deletePost);
router.get('/timeline', getTimelinePosts);
router.get('/posts/user/:userId', getUserPosts);
router.post('/posts/:postId/like', likePost);

module.exports = router;