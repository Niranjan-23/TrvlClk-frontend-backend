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

// Add this route if not already present
router.get('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'username profileImage');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;