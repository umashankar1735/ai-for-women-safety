const express = require('express');
const router = express.Router();

// Mock in-memory storage
let mockSOS = [];
let nextSOSId = 1;

// Send SOS alert
router.post('/alert', async (req, res) => {
  try {
    const { userId, userName, location, message, timestamp } = req.body;

    const sosAlert = {
      id: `sos_${nextSOSId++}`,
      userId,
      userName,
      location,
      message: message || 'Emergency SOS Alert',
      timestamp: timestamp || new Date().toISOString(),
      status: 'active'
    };

    mockSOS.push(sosAlert);

    // In a real app, this would trigger notifications to nearby users
    console.log('SOS Alert created:', sosAlert);

    res.json({
      message: 'SOS alert sent successfully',
      alertId: sosAlert.id,
      alert: sosAlert
    });

  } catch (error) {
    console.error('SOS alert error:', error);
    res.status(500).json({ error: 'Failed to send SOS alert' });
  }
});

// Get SOS history for user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userSOS = mockSOS
      .filter(sos => sos.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      sosHistory: userSOS,
      total: userSOS.length
    });

  } catch (error) {
    console.error('SOS history error:', error);
    res.status(500).json({ error: 'Failed to get SOS history' });
  }
});

module.exports = router;
