const express = require('express');
const temporalAnchorService = require('../services/temporalAnchor');
const router = express.Router();

// Mock in-memory storage
let mockAnchors = [];
let nextAnchorId = 1;

// Create safety anchor
router.post('/create', async (req, res) => {
  try {
    const { userId, userName, location, timestamp, type } = req.body;

    const anchor = {
      id: `anchor_${nextAnchorId++}`,
      userId,
      userName,
      location,
      timestamp: timestamp || new Date().toISOString(),
      type: type || 'safety_check'
    };

    mockAnchors.push(anchor);

    res.json({
      message: 'Safety anchor created successfully',
      anchorId: anchor.id,
      anchor
    });

  } catch (error) {
    console.error('Anchor creation error:', error);
    res.status(500).json({ error: 'Failed to create anchor' });
  }
});

// Get nearby anchors
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 2 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    // For demo, return recent anchors
    const recentAnchors = mockAnchors
      .slice(-10) // Get last 10 anchors
      .map(anchor => ({
        ...anchor,
        distance: Math.random() * 2 // Mock distance in km
      }));

    res.json({
      anchors: recentAnchors,
      total: recentAnchors.length,
      searchRadius: parseFloat(radius)
    });

  } catch (error) {
    console.error('Nearby anchors error:', error);
    res.status(500).json({ error: 'Failed to get nearby anchors' });
  }
});

// Activate temporal anchor with email notifications
router.post('/temporal/activate', async (req, res) => {
  try {
    const { 
      userId, 
      userName, 
      emergencyContacts,
      location, 
      durationMinutes = 60,
      message 
    } = req.body;

    if (!userId || !userName || !emergencyContacts || !emergencyContacts.length) {
      return res.status(400).json({ 
        error: 'UserId, userName, and emergencyContacts are required' 
      });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ 
        error: 'Location with latitude and longitude is required' 
      });
    }

    const result = await temporalAnchorService.activateAnchor({
      userId,
      userName,
      emergencyContacts,
      location,
      durationMinutes,
      message
    });

    if (result.success) {
      res.json({
        message: 'Temporal anchor activated successfully',
        anchorId: result.anchorId,
        durationMinutes,
        emailNotification: 'Emergency contacts notified',
        updateInterval: '15 minutes'
      });
    } else {
      res.status(500).json({ error: result.error });
    }

  } catch (error) {
    console.error('Temporal anchor activation error:', error);
    res.status(500).json({ error: 'Failed to activate temporal anchor' });
  }
});

// Update location for active temporal anchor
router.put('/temporal/:anchorId/location', async (req, res) => {
  try {
    const { anchorId } = req.params;
    const { location } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ 
        error: 'Location with latitude and longitude is required' 
      });
    }

    const result = await temporalAnchorService.updateLocation(anchorId, location);

    if (result.success) {
      res.json({
        message: 'Location updated successfully',
        anchorId,
        location
      });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Deactivate temporal anchor
router.post('/temporal/:anchorId/deactivate', async (req, res) => {
  try {
    const { anchorId } = req.params;

    const result = await temporalAnchorService.deactivateAnchor(anchorId, 'manual');

    if (result.success) {
      res.json({
        message: 'Temporal anchor deactivated successfully',
        anchorId,
        totalDurationMinutes: result.totalDurationMinutes,
        emailNotification: 'Emergency contacts notified'
      });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('Temporal anchor deactivation error:', error);
    res.status(500).json({ error: 'Failed to deactivate temporal anchor' });
  }
});

// Get temporal anchor status
router.get('/temporal/:anchorId/status', async (req, res) => {
  try {
    const { anchorId } = req.params;

    const result = temporalAnchorService.getAnchorStatus(anchorId);

    if (result.success) {
      res.json({
        message: 'Anchor status retrieved successfully',
        anchor: result.anchor
      });
    } else {
      res.status(404).json({ error: result.error });
    }

  } catch (error) {
    console.error('Anchor status error:', error);
    res.status(500).json({ error: 'Failed to get anchor status' });
  }
});

// Get user's active temporal anchors
router.get('/temporal/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = temporalAnchorService.getUserActiveAnchors(userId);

    res.json({
      message: 'User active anchors retrieved successfully',
      anchors: result.anchors,
      count: result.anchors.length
    });

  } catch (error) {
    console.error('User anchors error:', error);
    res.status(500).json({ error: 'Failed to get user anchors' });
  }
});

// Get all active temporal anchors (admin)
router.get('/temporal/admin/all', async (req, res) => {
  try {
    const result = temporalAnchorService.getAllActiveAnchors();

    res.json({
      message: 'All active anchors retrieved successfully',
      anchors: result.anchors,
      count: result.count
    });

  } catch (error) {
    console.error('All anchors error:', error);
    res.status(500).json({ error: 'Failed to get all anchors' });
  }
});

module.exports = router;
