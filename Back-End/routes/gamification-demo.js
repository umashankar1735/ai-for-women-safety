const express = require('express');
const router = express.Router();

// Mock in-memory storage
let mockUserPoints = {};
let mockLeaderboard = [];

// Get user points
router.get('/points/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const points = mockUserPoints[userId] || 100; // Default points

    res.json({
      userId,
      points,
      rank: calculateRank(userId, points)
    });

  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: 'Failed to get user points' });
  }
});

// Add points to user
router.post('/add-points', async (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    if (!userId || !points) {
      return res.status(400).json({ error: 'UserId and points are required' });
    }

    const currentPoints = mockUserPoints[userId] || 100;
    const newPoints = currentPoints + points;
    
    mockUserPoints[userId] = newPoints;

    // Update leaderboard
    updateLeaderboard(userId, newPoints);

    res.json({
      message: 'Points added successfully',
      userId,
      pointsAdded: points,
      newTotal: newPoints,
      reason: reason || 'Points awarded'
    });

  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ error: 'Failed to add points' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Create mock leaderboard if empty
    if (mockLeaderboard.length === 0) {
      for (let i = 1; i <= 5; i++) {
        mockLeaderboard.push({
          userId: `mock_user_${i}`,
          name: `Guardian ${i}`,
          points: 200 - (i * 20),
          rank: i
        });
      }
    }

    // Sort by points and add real users
    const realUsers = Object.entries(mockUserPoints).map(([userId, points]) => ({
      userId,
      name: `User ${userId.slice(-4)}`,
      points,
      rank: 0 // Will be calculated
    }));

    const allUsers = [...mockLeaderboard, ...realUsers]
      .sort((a, b) => b.points - a.points)
      .slice(0, parseInt(limit))
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    res.json({
      leaderboard: allUsers,
      total: allUsers.length
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Helper functions
function calculateRank(userId, points) {
  const allPoints = Object.values(mockUserPoints).concat(mockLeaderboard.map(u => u.points));
  const sortedPoints = [...new Set(allPoints)].sort((a, b) => b - a);
  return sortedPoints.indexOf(points) + 1;
}

function updateLeaderboard(userId, points) {
  const existingIndex = mockLeaderboard.findIndex(u => u.userId === userId);
  if (existingIndex >= 0) {
    mockLeaderboard[existingIndex].points = points;
  } else {
    mockLeaderboard.push({
      userId,
      name: `User ${userId.slice(-4)}`,
      points,
      rank: 0
    });
  }
}

module.exports = router;
