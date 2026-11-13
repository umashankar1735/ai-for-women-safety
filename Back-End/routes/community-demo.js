const express = require('express');
const router = express.Router();

// Mock in-memory storage
let mockGuardians = [];
let mockUsers = [];

// Join as community guardian
router.post('/join', async (req, res) => {
  try {
    const { userId, userName, location, availability, skills, contactInfo } = req.body;

    const guardian = {
      id: userId,
      userName,
      location,
      availability: availability || true,
      skills: skills || ['Emergency Response'],
      contactInfo,
      joinedAt: new Date().toISOString(),
      isGuardian: true,
      safetyScore: 120 // Bonus for being a guardian
    };

    // Remove existing guardian record if exists
    mockGuardians = mockGuardians.filter(g => g.id !== userId);
    mockGuardians.push(guardian);

    res.json({
      message: 'Successfully joined as community guardian',
      guardian
    });

  } catch (error) {
    console.error('Join guardian error:', error);
    res.status(500).json({ error: 'Failed to join as guardian' });
  }
});

// Get nearby community members/guardians
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 2 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    // For demo, return mock nearby users
    const nearbyUsers = mockGuardians.map((guardian, index) => ({
      id: guardian.id,
      name: guardian.userName,
      safetyScore: guardian.safetyScore || 100,
      distance: Math.random() * 2, // Mock distance in km
      lastSeen: guardian.joinedAt,
      isGuardian: true
    }));

    // Add some mock regular users
    for (let i = 0; i < 3; i++) {
      nearbyUsers.push({
        id: `mock_user_${i}`,
        name: `User ${i + 1}`,
        safetyScore: 80 + Math.random() * 40,
        distance: Math.random() * 2,
        lastSeen: new Date().toISOString(),
        isGuardian: false
      });
    }

    res.json({
      nearbyUsers,
      total: nearbyUsers.length,
      searchRadius: parseFloat(radius)
    });

  } catch (error) {
    console.error('Nearby users error:', error);
    res.status(500).json({ error: 'Failed to get nearby users' });
  }
});

module.exports = router;
