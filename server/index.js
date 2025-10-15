const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
} = require('../api/_lib/users');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes

// Sign up endpoint
app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  // Validate Harvard email
  if (!email.endsWith('@college.harvard.edu')) {
    return res.status(400).json({
      success: false,
      message: 'Please use a valid Harvard College email (@college.harvard.edu)'
    });
  }

  // Check if user already exists
  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email already exists'
    });
  }

  // Create user
  const newUser = createUser({ email, password });

  res.json({
    success: true,
    message: 'Account created successfully',
    userId: newUser.id
  });
});

// Complete onboarding endpoint
app.post('/api/onboarding/complete', (req, res) => {
  const { userId, name, gender, sportType, trainingFrequency, dietGoal } = req.body;

  // Find user and update profile
  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const updatedUser = updateUserProfile(userId, {
    name,
    gender,
    sportType,
    trainingFrequency,
    dietGoal,
  });

  res.json({
    success: true,
    message: 'Onboarding completed successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      profile: updatedUser.profile
    }
  });
});

// Get user profile endpoint
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  const user = findUserById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found' 
    });
  }
  
  res.json({ 
    success: true, 
    user: {
      id: user.id,
      email: user.email,
      profile: user.profile
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CrimsonFuel API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 CrimsonFuel server running on http://localhost:${PORT}`);
});
