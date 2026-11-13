const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../services/firebase');

const router = express.Router();

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
    const existingUser = await db.collection('users')
      .where('aadhaarNumber', '==', aadhaarNumber)
      .get();
    
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'User already exists with this Aadhaar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
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

    const userRef = await db.collection('users').add(userData);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: userRef.id, aadhaarNumber },
      process.env.JWT_SECRET || 'demo_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userRef.id,
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
    const userSnapshot = await db.collection('users')
      .where('aadhaarNumber', '==', aadhaarNumber)
      .get();

    if (userSnapshot.empty) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Update last seen
    await userDoc.ref.update({ lastSeen: new Date().toISOString() });

    // Generate JWT token
    const token = jwt.sign(
      { userId: userDoc.id, aadhaarNumber },
      process.env.JWT_SECRET || 'demo_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userDoc.id,
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        safetyScore: userData.safetyScore || 100,
        emergencyContacts: userData.emergencyContacts || []
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
