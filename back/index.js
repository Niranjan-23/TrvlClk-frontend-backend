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

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

// Helper: Handle errors
const handleDBError = (res, error) => {
  console.error('Database Error:', error);
  res.status(500).json({ error: 'Internal server error' });
};

// Signup route
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
      password, // NOTE: In production, hash the password!
      name: name || username,
    });
    await newUser.save();
    res.status(201).json({ user: newUser });
  } catch (error) {
    handleDBError(res, error);
  }
});

// Login route
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

// Get user data route
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

// Update user route (for editing profile or deleting posts)
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


// Search users by name or username; if no query provided, return default suggestions.
app.get('/api/search', async (req, res) => {
  try {
    let { query } = req.query;
    if (!query || query.trim() === "") {
      // Return default users (e.g., first 5 users)
      const users = await User.find({}).limit(5).select('name username profileImage');
      return res.status(200).json({ users });
    }

    // Otherwise, search by name or username (case-insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ],
    }).select('name username profileImage');

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error in GET /api/search:", error);
    handleDBError(res, error);
  }
});



app.post('/api/user/:id/posts', async (req, res) => {
  try {
    console.log("Full Request Body:", req.body); // Log the entire request body

    const { imageUrl } = req.body;

    // Validate imageUrl
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === "") {
      console.error("Invalid or missing imageUrl:", imageUrl);
      return res.status(400).json({ error: 'A valid image URL is required' });
    }

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error("Invalid user ID:", req.params.id);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Update the user's posts array with the provided image URL
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { posts: imageUrl.trim() } }, // Trim whitespace
      { new: true, runValidators: true } // Return updated document and validate schema
    ).select('-password');

    if (!user) {
      console.error("User not found for ID:", req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log("User after update:", user);
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in POST /api/user/:id/posts:", error);
    handleDBError(res, error);
  }
});
// Optional: Serve static files if needed
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
