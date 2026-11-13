const express = require('express');
const cron = require('node-cron');
const { db } = require('../services/firebase');
const { authenticateToken } = require('../middleware/auth');
const { sendSafetyEmail } = require('../services/email');

const router = express.Router();

// Start safety anchor for a user
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { location, destination, estimatedArrival } = req.body;
    const userId = req.user.id;

    const anchorData = {
      userId,
      startLocation: location,
      destination,
      estimatedArrival,
      status: 'active',
      checkpoints: [],
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };

    const anchorRef = await db.collection('safetyAnchors').add(anchorData);

    // Start periodic updates (every minute for demo, configurable)
    const intervalMinutes = process.env.ANCHOR_EMAIL_INTERVAL_MIN || 1;
    
    // Store anchor ID for the user
    await db.collection('users').doc(userId).update({
      activeAnchorId: anchorRef.id,
      lastAnchorStart: new Date().toISOString()
    });

    res.json({
      message: 'Safety anchor started',
      anchorId: anchorRef.id,
      intervalMinutes,
      status: 'active'
    });

  } catch (error) {
    console.error('Start anchor error:', error);
    res.status(500).json({ error: 'Failed to start safety anchor' });
  }
});

// Update location checkpoint
router.post('/checkpoint', authenticateToken, async (req, res) => {
  try {
    const { anchorId, location, message } = req.body;
    const userId = req.user.id;

    const checkpoint = {
      location,
      message: message || 'Safety checkpoint',
      timestamp: new Date().toISOString(),
      userId
    };

    // Update anchor with new checkpoint
    const anchorRef = db.collection('safetyAnchors').doc(anchorId);
    const anchorDoc = await anchorRef.get();

    if (!anchorDoc.exists) {
      return res.status(404).json({ error: 'Safety anchor not found' });
    }

    const anchorData = anchorDoc.data();
    if (anchorData.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedCheckpoints = [...(anchorData.checkpoints || []), checkpoint];

    await anchorRef.update({
      checkpoints: updatedCheckpoints,
      lastUpdate: new Date().toISOString(),
      currentLocation: location
    });

    // Send update to emergency contacts
    await sendSafetyUpdate(userId, checkpoint, anchorData);

    res.json({
      message: 'Checkpoint added',
      checkpoint,
      totalCheckpoints: updatedCheckpoints.length
    });

  } catch (error) {
    console.error('Checkpoint error:', error);
    res.status(500).json({ error: 'Failed to add checkpoint' });
  }
});

// Stop safety anchor
router.post('/stop/:anchorId', authenticateToken, async (req, res) => {
  try {
    const { anchorId } = req.params;
    const userId = req.user.id;

    const anchorRef = db.collection('safetyAnchors').doc(anchorId);
    const anchorDoc = await anchorRef.get();

    if (!anchorDoc.exists) {
      return res.status(404).json({ error: 'Safety anchor not found' });
    }

    const anchorData = anchorDoc.data();
    if (anchorData.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await anchorRef.update({
      status: 'completed',
      endTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    });

    // Clear active anchor from user
    await db.collection('users').doc(userId).update({
      activeAnchorId: null
    });

    // Send completion notification
    await sendSafetyCompletion(userId, anchorData);

    res.json({
      message: 'Safety anchor stopped',
      duration: calculateDuration(anchorData.startTime),
      checkpoints: anchorData.checkpoints?.length || 0
    });

  } catch (error) {
    console.error('Stop anchor error:', error);
    res.status(500).json({ error: 'Failed to stop safety anchor' });
  }
});

// Get user's anchor history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const anchorsSnapshot = await db.collection('safetyAnchors')
      .where('userId', '==', userId)
      .orderBy('startTime', 'desc')
      .limit(parseInt(limit))
      .get();

    const anchors = anchorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      anchors,
      total: anchors.length
    });

  } catch (error) {
    console.error('Anchor history error:', error);
    res.status(500).json({ error: 'Failed to get anchor history' });
  }
});

// Helper functions
async function sendSafetyUpdate(userId, checkpoint, anchorData) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const emailData = {
      to: userData.emergencyContacts?.map(contact => contact.email).filter(Boolean) || [],
      subject: `Safety Update - ${userData.name}`,
      body: `
        Safety checkpoint received from ${userData.name}:
        
        Location: ${checkpoint.location.latitude}, ${checkpoint.location.longitude}
        Message: ${checkpoint.message}
        Time: ${checkpoint.timestamp}
        
        Journey started: ${anchorData.startTime}
        Destination: ${anchorData.destination?.name || 'Not specified'}
      `
    };

    await sendSafetyEmail(emailData);
  } catch (error) {
    console.error('Send safety update error:', error);
  }
}

async function sendSafetyCompletion(userId, anchorData) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const emailData = {
      to: userData.emergencyContacts?.map(contact => contact.email).filter(Boolean) || [],
      subject: `Journey Completed - ${userData.name}`,
      body: `
        ${userData.name} has safely completed their journey.
        
        Started: ${anchorData.startTime}
        Completed: ${new Date().toISOString()}
        Total checkpoints: ${anchorData.checkpoints?.length || 0}
      `
    };

    await sendSafetyEmail(emailData);
  } catch (error) {
    console.error('Send completion error:', error);
  }
}

function calculateDuration(startTime) {
  const start = new Date(startTime);
  const end = new Date();
  const durationMs = end.getTime() - start.getTime();
  const minutes = Math.floor(durationMs / 60000);
  return `${minutes} minutes`;
}

module.exports = router;
