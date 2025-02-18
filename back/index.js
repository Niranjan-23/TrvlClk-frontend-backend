require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define User Schema and Model
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }, // In production, hash passwords!
  profileImage: { type: String, default: '/default-avatar.png' },
  posts: { type: [String], default: [] },
  bio: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }]
});

const User = mongoose.model('User', userSchema);

// Sign Up endpoint
app.post('/api/signup', async (req, res) => {
  const { email, username, password, name } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All fields are required!' });
  }
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const newUser = new User({ email, username, password, name: name || username });
    await newUser.save();
    return res.status(201).json({ token: 'dummy-token', user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields are required!' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.password !== password) return res.status(401).json({ error: 'Invalid password' });
    return res.status(200).json({ token: 'dummy-token', user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch user by ID endpoint
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).populate('followers following', 'username name profileImage');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile endpoint
app.put('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, bio, profileImage, posts } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, bio, profileImage, ...(posts && { posts }) },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a post endpoint
app.post('/api/user/:id/posts', async (req, res) => {
  const { id } = req.params;
  const { postUrl } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $push: { posts: postUrl } },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error adding post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow Endpoint
app.post('/api/user/:targetId/follow', async (req, res) => {
  const targetId = req.params.targetId;
  const { followerId } = req.body;
  try {
    const targetUser = await User.findById(targetId);
    const followerUser = await User.findById(followerId);
    if (!targetUser || !followerUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (targetUser.followers.includes(followerId)) {
      return res.status(400).json({ error: 'Already following' });
    }
    targetUser.followers.push(followerId);
    followerUser.following.push(targetId);
    await targetUser.save();
    await followerUser.save();
    res.status(200).json({ targetUser, followerUser });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unfollow Endpoint
app.post('/api/user/:targetId/unfollow', async (req, res) => {
  const targetId = req.params.targetId;
  const { followerId } = req.body;
  try {
    const targetUser = await User.findById(targetId);
    const followerUser = await User.findById(followerId);
    if (!targetUser || !followerUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== followerId);
    followerUser.following = followerUser.following.filter(id => id.toString() !== targetId);
    await targetUser.save();
    await followerUser.save();
    res.status(200).json({ targetUser, followerUser });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
