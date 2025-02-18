require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware: Parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the User schema and model
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }, // NOTE: Hash passwords in production!
  profileImage: { type: String, default: '/default-avatar.png' },
  posts: { type: [String], default: [] },
  bio: { type: String, default: '' }
});

const User = mongoose.model('User', userSchema);

// API Endpoint: Sign Up
app.post('/api/signup', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All fields are required!' });
  }
  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }
    // Create and save the new user
    const newUser = new User({ email, username, password });
    await newUser.save();
    // Return a dummy token for now (use JWT in production)
    return res.status(201).json({ token: 'dummy-token', user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoint: Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields are required!' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.password !== password) return res.status(401).json({ error: 'Invalid password' });
    // Return a dummy token for now (use JWT in production)
    return res.status(200).json({ token: 'dummy-token', user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// (Optional) Additional endpoints for posts, profiles, etc. can be added here.

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
