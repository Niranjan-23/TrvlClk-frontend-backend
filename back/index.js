// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// ------------------- Mongoose Connection -------------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ------------------- Schemas & Models -------------------

// User Schema (posts field removed as posts are now in a separate collection)
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      lowercase: true, 
      trim: true, 
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address.']
    },
    username: { 
      type: String, 
      required: [true, 'Username is required'], 
      unique: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      match: [/(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/, 'Password must be minimum eight characters, at least one letter and one number.']
    },
    profileImage: { type: String, default: '/default-avatar.png' },
    bio: { type: String, default: '', trim: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    acceptedFollowRequests: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    followRequests: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

// Post Schema – separate from the user model
const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);
const Post = mongoose.model('Post', postSchema);

// Comment Schema
const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);
const Comment = mongoose.model('Comment', commentSchema);

// ------------------- Helper: Handle errors -------------------
const handleDBError = (res, error) => {
  console.error('Database Error:', error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: 'Internal server error' });
};

// ------------------- Authentication & User Data Endpoints -------------------

app.post('/api/signup', async (req, res) => {
  try {
    const { email, username, password, name } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required!' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const newUser = new User({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password, // In production, hash the password!
      name: name || username,
    });
    await newUser.save();
    const token = 'dummy-token'; // Replace with real token generation
    res.status(201).json({ user: newUser, token });
  } catch (error) {
    handleDBError(res, error);
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = 'dummy-token';
    res.json({ user, token });
  } catch (error) {
    handleDBError(res, error);
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    handleDBError(res, error);
  }
});

app.put('/api/user/:id', async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    // Removed 'posts' from allowedUpdates
    const allowedUpdates = ['name', 'bio', 'profileImage'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates!' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    handleDBError(res, error);
  }
});

// ------------------- Post Endpoints -------------------

// Create a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { userId, imageUrl } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return res.status(400).json({ error: 'A valid image URL is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newPost = new Post({
      user: userId,
      imageUrl: imageUrl.trim(),
      likes: [],
    });
    await newPost.save();
    const populatedPost = await Post.findById(newPost._id).populate('user', 'username profileImage');
    res.status(201).json({ post: populatedPost });
  } catch (error) {
    handleDBError(res, error);
  }
});

// Delete a post using deleteOne() instead of remove()
app.delete('/api/posts/:postId', async (req, res) => {
  try {
    const { userId } = req.body;
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(req.params.postId)
    ) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await post.deleteOne(); // Use deleteOne() instead of remove()
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    handleDBError(res, error);
  }
});


// Get timeline posts (posts from current user and those the user follows)
// Timeline Endpoint – Only returns posts from followed users (excluding the current user)
app.get('/api/timeline', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });
    
    // Only include posts from users that the current user is following
    const posts = await Post.find({ user: { $in: currentUser.following } })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ posts });
  } catch (error) {
    handleDBError(res, error);
  }
});

// Get posts for a specific user
app.get('/api/posts/user/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (error) {
    handleDBError(res, error);
  }
});

// Search Endpoint – Place this before serving static files!
app.get('/api/search', async (req, res) => {
  try {
    const { query, excludeId } = req.query;
    console.log('Search query:', query, 'excludeId:', excludeId);
    const filter = query && query.trim() !== ''
      ? {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } },
          ],
        }
      : {};

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
      console.log('Excluding ID:', excludeId);
    } else if (excludeId) {
      console.log('Invalid excludeId:', excludeId);
    }

    const users = await User.find(filter)
      .limit(query ? 10 : 5)
      .select('name username profileImage followRequests acceptedFollowRequests followers');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    handleDBError(res, error);
  }
});

// Like/Unlike a post
app.post('/api/posts/:postId/like', async (req, res) => {
  try {
    const { userId } = req.body;
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(req.params.postId)
    ) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const index = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );
    if (index > -1) {
      // Already liked; remove like (toggle)
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.status(200).json({ post });
  } catch (error) {
    handleDBError(res, error);
  }
});

// ------------------- Comment Endpoints -------------------

// Add a comment to a post
app.post('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    if (
      !mongoose.Types.ObjectId.isValid(req.params.postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const newComment = new Comment({
      post: req.params.postId,
      user: userId,
      text: text.trim(),
    });
    await newComment.save();
    const populatedComment = await Comment.findById(newComment._id)
      .populate('user', 'username profileImage');
    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    handleDBError(res, error);
  }
});

// Get comments for a post
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username profileImage')
      .sort({ createdAt: 1 });
    res.status(200).json({ comments });
  } catch (error) {
    handleDBError(res, error);
  }
});

// ------------------- Follow/Unfollow Endpoints -------------------
// (These endpoints remain unchanged)

app.post('/api/user/:targetId/followRequest', async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (requesterId.toString() === req.params.targetId.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ error: 'Invalid requester ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.targetId)) {
      return res.status(400).json({ error: 'Invalid target ID' });
    }
    const targetUser = await User.findById(req.params.targetId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
    if (targetUser.followers.map(id => id.toString()).includes(requesterId.toString())) {
      return res.status(400).json({ error: 'You are already following this user.' });
    }
    if (targetUser.followRequests.map(id => id.toString()).includes(requesterId.toString())) {
      return res.status(400).json({ error: 'Follow request already sent' });
    }
    targetUser.followRequests.push(requesterId);
    await targetUser.save();

    res.status(200).json({ message: 'Follow request sent', user: targetUser });
  } catch (error) {
    handleDBError(res, error);
  }
});

app.get('/api/user/:id/followRequests', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id)
      .populate('followRequests acceptedFollowRequests', 'name username profileImage');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ 
      pendingFollowRequests: user.followRequests,
      acceptedFollowRequests: user.acceptedFollowRequests
    });
  } catch (error) {
    handleDBError(res, error);
  }
});

app.post('/api/user/:id/followRequest/accept', async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ error: 'Invalid requester ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.followRequests = user.followRequests.filter(
      id => id.toString() !== requesterId.toString()
    );
    if (!user.acceptedFollowRequests.map(id => id.toString()).includes(requesterId.toString())) {
      user.acceptedFollowRequests.push(requesterId);
    }
    if (!user.followers.map(id => id.toString()).includes(requesterId.toString())) {
      user.followers.push(requesterId);
    }
    await user.save();

    const requester = await User.findById(requesterId);
    if (requester && !requester.following.map(id => id.toString()).includes(req.params.id.toString())) {
      requester.following.push(req.params.id);
      await requester.save();
    }

    const updatedUser = await User.findById(req.params.id)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    res.status(200).json({
      message: 'Follow request accepted. Please click "Follow Back" to complete the process.',
      user: updatedUser,
    });
  } catch (error) {
    handleDBError(res, error);
  }
});

app.post('/api/user/:id/followRequest/reject', async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ error: 'Invalid requester ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.followRequests = user.followRequests.filter(
      id => id.toString() !== requesterId.toString()
    );
    await user.save();

    const updatedUser = await User.findById(req.params.id)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    res.status(200).json({ message: 'Follow request rejected', user: updatedUser });
  } catch (error) {
    handleDBError(res, error);
  }
});

app.post('/api/user/:id/followBack', async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ error: 'Invalid requester ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.acceptedFollowRequests = user.acceptedFollowRequests.filter(
      id => id.toString() !== requesterId.toString()
    );
    if (!user.following.map(id => id.toString()).includes(requesterId.toString())) {
      user.following.push(requesterId);
    }
    await user.save();

    const requester = await User.findById(requesterId);
    if (requester && !requester.followers.map(id => id.toString()).includes(req.params.id.toString())) {
      requester.followers.push(req.params.id);
      await requester.save();
    }

    const updatedUser = await User.findById(req.params.id)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    res.status(200).json({ message: 'Followed back successfully', user: updatedUser });
  } catch (error) {
    handleDBError(res, error);
  }
});

app.post('/api/user/:targetId/unfollow', async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId || !mongoose.Types.ObjectId.isValid(followerId)) {
      return res.status(400).json({ error: 'Invalid follower ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.targetId)) {
      return res.status(400).json({ error: 'Invalid target ID' });
    }
    if (followerId.toString() === req.params.targetId.toString()) {
      return res.status(400).json({ error: 'You cannot unfollow yourself.' });
    }
    const targetUser = await User.findById(req.params.targetId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== followerId.toString()
    );
    await targetUser.save();

    const followerUser = await User.findById(followerId);
    if (!followerUser) return res.status(404).json({ error: 'Follower user not found' });
    followerUser.following = followerUser.following.filter(
      id => id.toString() !== req.params.targetId.toString()
    );
    await followerUser.save();

    const updatedFollowerUser = await User.findById(followerId)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    res.status(200).json({ message: 'Unfollowed successfully', user: updatedFollowerUser });
  } catch (error) {
    handleDBError(res, error);
  }
});


// ------------------- Serve Static Files -------------------
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

