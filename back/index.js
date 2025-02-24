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

// Connect to MongoDB Atlas (removed deprecated options)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema & Model
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '/default-avatar.png' },
    posts: { type: [String], default: [] },
    bio: { type: String, default: '', trim: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followRequests: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

// Helper: Handle errors
const handleDBError = (res, error) => {
  console.error('Database Error:', error);
  res.status(500).json({ error: 'Internal server error' });
};

// ----- Authentication & User Data Endpoints -----

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
      password, // In production, hash this!
      name: name || username,
    });
    await newUser.save();
    res.status(201).json({ user: newUser });
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
    res.json({ user });
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
    const allowedUpdates = ['name', 'bio', 'profileImage', 'posts'];
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

// ----- Content Endpoint -----

app.post('/api/user/:id/posts', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return res.status(400).json({ error: 'A valid image URL is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { posts: imageUrl.trim() } },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user });
  } catch (error) {
    handleDBError(res, error);
  }
});

// ----- Search Endpoint -----

app.get('/api/search', async (req, res) => {
  try {
    const { query, excludeId } = req.query;
    console.log('Search query:', query, 'excludeId:', excludeId); // Keep for debugging
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
      .select('name username profileImage');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    handleDBError(res, error);
  }
});

// ----- Follow/Unfollow Endpoints -----

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
      .populate('followRequests', 'name username profileImage');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ followRequests: user.followRequests });
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

    user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId.toString());
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

    user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId.toString());
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

    user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId.toString());
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
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== followerId.toString());
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

// ----- Serve Static Files -----
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});