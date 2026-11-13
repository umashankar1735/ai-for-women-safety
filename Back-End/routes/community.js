const express = require('express');
const { db } = require('../services/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get nearby community members
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 2 } = req.query;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    // Simple radius-based search (in production, use geohashing or spatial indexing)
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Get active users within radius
    const usersSnapshot = await db.collection('users')
      .where('isActive', '==', true)
      .get();

    const nearbyUsers = [];
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (doc.id === userId) return; // Skip self

      if (userData.lastLocation) {
        const distance = calculateDistance(
          lat, lng,
          userData.lastLocation.latitude,
          userData.lastLocation.longitude
        );

        if (distance <= radiusKm) {
          nearbyUsers.push({
            id: doc.id,
            name: userData.name,
            safetyScore: userData.safetyScore || 100,
            distance: Math.round(distance * 100) / 100, // Round to 2 decimals
            lastSeen: userData.lastSeen,
            isGuardian: userData.isGuardian || false
          });
        }
      }
    });

    res.json({
      nearbyUsers,
      total: nearbyUsers.length,
      searchRadius: radiusKm,
      userLocation: { latitude: lat, longitude: lng }
    });

  } catch (error) {
    console.error('Nearby users error:', error);
    res.status(500).json({ error: 'Failed to get nearby users' });
  }
});

// Update user location and status
router.post('/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, isActive = true } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    await db.collection('users').doc(userId).update({
      lastLocation: { latitude, longitude },
      lastSeen: new Date().toISOString(),
      isActive
    });

    res.json({
      message: 'Location updated',
      location: { latitude, longitude },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Join as guardian
router.post('/join-guardian', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { location, availability } = req.body;

    await db.collection('users').doc(userId).update({
      isGuardian: true,
      guardianSince: new Date().toISOString(),
      availability: availability || 'available', // available, busy, offline
      lastLocation: location
    });

    // Update gamification score
    const userDoc = await db.collection('users').doc(userId).get();
    const currentScore = userDoc.data().safetyScore || 100;
    
    await db.collection('users').doc(userId).update({
      safetyScore: currentScore + 50 // Bonus for joining as guardian
    });

    res.json({
      message: 'Successfully joined as community guardian',
      bonusPoints: 50,
      newSafetyScore: currentScore + 50
    });

  } catch (error) {
    console.error('Join guardian error:', error);
    res.status(500).json({ error: 'Failed to join as guardian' });
  }
});

// Get guardian leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const guardiansSnapshot = await db.collection('users')
      .where('isGuardian', '==', true)
      .orderBy('safetyScore', 'desc')
      .limit(parseInt(limit))
      .get();

    const leaderboard = guardiansSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        name: data.name,
        safetyScore: data.safetyScore || 100,
        guardianSince: data.guardianSince,
        totalHelps: data.totalHelps || 0
      };
    });

    res.json({
      leaderboard,
      total: leaderboard.length
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Report help action
router.post('/help-action', authenticateToken, async (req, res) => {
  try {
    const { alertId, actionType, location } = req.body;
    const userId = req.user.id;

    // Valid action types: 'acknowledged', 'helped', 'contacted_authorities'
    const validActions = ['acknowledged', 'helped', 'contacted_authorities'];
    
    if (!validActions.includes(actionType)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    // Record the help action
    const helpAction = {
      userId,
      alertId,
      actionType,
      location,
      timestamp: new Date().toISOString()
    };

    await db.collection('helpActions').add(helpAction);

    // Award points based on action type
    const pointsMap = {
      'acknowledged': 10,
      'helped': 50,
      'contacted_authorities': 100
    };

    const points = pointsMap[actionType];
    
    // Update user score and help count
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    await db.collection('users').doc(userId).update({
      safetyScore: (userData.safetyScore || 100) + points,
      totalHelps: (userData.totalHelps || 0) + 1,
      lastHelpAction: new Date().toISOString()
    });

    res.json({
      message: 'Help action recorded',
      actionType,
      pointsEarned: points,
      newSafetyScore: (userData.safetyScore || 100) + points
    });

  } catch (error) {
    console.error('Help action error:', error);
    res.status(500).json({ error: 'Failed to record help action' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

module.exports = router;
