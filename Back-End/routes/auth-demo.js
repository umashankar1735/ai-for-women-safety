const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Mock in-memory storage for demo purposes
let mockUsers = [];
let nextUserId = 1;

// Mock Aadhaar verification service
const verifyAadhaar = async (aadhaarNumber, otp) => {
  // Simulate Aadhaar verification (In production, use actual Aadhaar API)
  const validAadhaars = ['123456789012', '123412341234', '999988887777'];
  const validOTP = '123456';
  
  return validAadhaars.includes(aadhaarNumber) && otp === validOTP;
};

// Register with Aadhaar
router.post('/register', async (req, res) => {
  try {
    const { 
      aadhaarNumber, 
      otp, 
      name, 
      phone, 
      email, 
      emergencyContacts,
      password 
    } = req.body;

    // Validate Aadhaar
    const isValidAadhaar = await verifyAadhaar(aadhaarNumber, otp);
    if (!isValidAadhaar) {
      return res.status(400).json({ 
        error: 'Invalid Aadhaar number or OTP',
        demo: 'Use Aadhaar: 123456789012 and OTP: 123456 for demo'
      });
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.aadhaarNumber === aadhaarNumber);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this Aadhaar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      id: `user_${nextUserId++}`,
      aadhaarNumber,
      name,
      phone,
      email,
      emergencyContacts: emergencyContacts || [],
      password: hashedPassword,
      isVerified: true,
      safetyScore: 100, // Initial gamification score
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    mockUsers.push(userData);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id, aadhaarNumber },
      process.env.JWT_SECRET || 'demo_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userData.id,
        name,
        phone,
        email,
        safetyScore: 100
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login with Aadhaar
router.post('/login', async (req, res) => {
  try {
    const { aadhaarNumber, password } = req.body;

    // Find user by Aadhaar
    const user = mockUsers.find(u => u.aadhaarNumber === aadhaarNumber);

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Update last seen
    user.lastSeen = new Date().toISOString();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, aadhaarNumber },
      process.env.JWT_SECRET || 'demo_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        safetyScore: user.safetyScore || 100,
        emergencyContacts: user.emergencyContacts || []
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Aadhaar OTP (Mock)
router.post('/aadhaar-otp', async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    
    // Simulate OTP generation
    const validAadhaars = ['123456789012', '123412341234', '999988887777'];
    
    if (!validAadhaars.includes(aadhaarNumber)) {
      return res.status(400).json({ error: 'Invalid Aadhaar number' });
    }

    // In production, this would send actual OTP
    res.json({
      message: 'OTP sent successfully',
      demo: 'Use OTP: 123456 for demo purposes'
    });

  } catch (error) {
    console.error('OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

module.exports = router;
