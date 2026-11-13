const express = require('express');
const { db } = require('../services/firebase');
const { authenticateToken } = require('../middleware/auth');
const { sendSOSAlert } = require('../services/email');

const router = express.Router();

// Trigger SOS alert
router.post('/trigger', authenticateToken, async (req, res) => {
  try {
    const { location, message, severity = 'high' } = req.body;
    const userId = req.user.id;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    // Get user data for emergency contacts
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Create SOS alert
    const sosAlert = {
      userId,
      userName: userData.name,
      userPhone: userData.phone,
      location,
      message: message || 'Emergency assistance needed',
      severity, // low, medium, high, critical
      status: 'active',
      timestamp: new Date().toISOString(),
      emergencyContacts: userData.emergencyContacts || [],
      responseCount: 0
    };

    const alertRef = await db.collection('sosAlerts').add(sosAlert);

    // Send email alerts to emergency contacts
    if (userData.emergencyContacts && userData.emergencyContacts.length > 0) {
      const emailContacts = userData.emergencyContacts
        .map(contact => contact.email)
        .filter(Boolean);

      if (emailContacts.length > 0) {
        await sendSOSAlert({
          userName: userData.name,
          location,
          timestamp: sosAlert.timestamp,
          message: sosAlert.message,
          emergencyContacts: emailContacts
        });
      }
    }

    // Notify nearby community members via Socket.IO
    if (global.io) {
      const locationRoom = `loc_${Math.floor(location.latitude * 100)}_${Math.floor(location.longitude * 100)}`;
      
      global.io.to(locationRoom).emit('nearby-sos', {
        alertId: alertRef.id,
        location,
        userName: userData.name,
        message: sosAlert.message,
        severity,
        timestamp: sosAlert.timestamp
      });
    }

    // Update user's safety score (emergency situation)
    await db.collection('users').doc(userId).update({
      lastSOSAlert: new Date().toISOString(),
      totalSOSAlerts: (userData.totalSOSAlerts || 0) + 1
    });

    res.json({
      message: 'SOS alert triggered successfully',
      alertId: alertRef.id,
      status: 'active',
      notifiedContacts: userData.emergencyContacts?.length || 0,
      timestamp: sosAlert.timestamp
    });

  } catch (error) {
    console.error('SOS trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger SOS alert' });
  }
});

// Get nearby SOS alerts for community response
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Get active SOS alerts
    const alertsSnapshot = await db.collection('sosAlerts')
      .where('status', '==', 'active')
      .get();

    const nearbyAlerts = [];

    alertsSnapshot.docs.forEach(doc => {
      const alertData = doc.data();
      
      // Skip own alerts
      if (alertData.userId === userId) return;

      const distance = calculateDistance(
        lat, lng,
        alertData.location.latitude,
        alertData.location.longitude
      );

      if (distance <= radiusKm) {
        nearbyAlerts.push({
          id: doc.id,
          userName: alertData.userName,
          location: alertData.location,
          message: alertData.message,
          severity: alertData.severity,
          timestamp: alertData.timestamp,
          distance: Math.round(distance * 100) / 100,
          responseCount: alertData.responseCount || 0
        });
      }
    });

    // Sort by distance and severity
    nearbyAlerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return a.distance - b.distance;
    });

    res.json({
      nearbyAlerts,
      total: nearbyAlerts.length,
      searchRadius: radiusKm,
      userLocation: { latitude: lat, longitude: lng }
    });

  } catch (error) {
    console.error('Nearby SOS error:', error);
    res.status(500).json({ error: 'Failed to get nearby SOS alerts' });
  }
});

// Respond to SOS alert
router.post('/:alertId/respond', authenticateToken, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { responseType, location, message } = req.body;
    const userId = req.user.id;

    // Valid response types: 'acknowledged', 'on_way', 'authorities_contacted', 'helped'
    const validResponses = ['acknowledged', 'on_way', 'authorities_contacted', 'helped'];
    
    if (!validResponses.includes(responseType)) {
      return res.status(400).json({ error: 'Invalid response type' });
    }

    // Get alert data
    const alertDoc = await db.collection('sosAlerts').doc(alertId).get();
    if (!alertDoc.exists) {
      return res.status(404).json({ error: 'SOS alert not found' });
    }

    // Record the response
    const response = {
      alertId,
      responderId: userId,
      responseType,
      location,
      message: message || `Responder ${responseType.replace('_', ' ')}`,
      timestamp: new Date().toISOString()
    };

    await db.collection('sosResponses').add(response);

    // Update alert response count
    const alertData = alertDoc.data();
    await db.collection('sosAlerts').doc(alertId).update({
      responseCount: (alertData.responseCount || 0) + 1,
      lastResponse: new Date().toISOString()
    });

    // Award points to responder
    const pointsMap = {
      'acknowledged': 10,
      'on_way': 25,
      'authorities_contacted': 50,
      'helped': 100
    };

    const points = pointsMap[responseType];
    
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    await db.collection('users').doc(userId).update({
      safetyScore: (userData.safetyScore || 100) + points,
      totalHelps: (userData.totalHelps || 0) + 1,
      lastHelpAction: new Date().toISOString()
    });

    // Notify alert creator of response
    if (global.io) {
      global.io.to(alertData.userId).emit('sos-response', {
        alertId,
        responseType,
        responderName: userData.name,
        message: response.message,
        timestamp: response.timestamp
      });
    }

    res.json({
      message: 'Response recorded successfully',
      responseType,
      pointsEarned: points,
      newSafetyScore: (userData.safetyScore || 100) + points
    });

  } catch (error) {
    console.error('SOS response error:', error);
    res.status(500).json({ error: 'Failed to record SOS response' });
  }
});

// Cancel/resolve SOS alert
router.post('/:alertId/resolve', authenticateToken, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution = 'safe' } = req.body;
    const userId = req.user.id;

    const alertDoc = await db.collection('sosAlerts').doc(alertId).get();
    if (!alertDoc.exists) {
      return res.status(404).json({ error: 'SOS alert not found' });
    }

    const alertData = alertDoc.data();
    
    // Only the alert creator can resolve it
    if (alertData.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to resolve this alert' });
    }

    await db.collection('sosAlerts').doc(alertId).update({
      status: 'resolved',
      resolution,
      resolvedAt: new Date().toISOString()
    });

    // Notify responders
    if (global.io) {
      const locationRoom = `loc_${Math.floor(alertData.location.latitude * 100)}_${Math.floor(alertData.location.longitude * 100)}`;
      
      global.io.to(locationRoom).emit('sos-resolved', {
        alertId,
        resolution,
        message: `SOS alert has been resolved - ${resolution}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: 'SOS alert resolved',
      alertId,
      resolution,
      totalResponses: alertData.responseCount || 0
    });

  } catch (error) {
    console.error('SOS resolve error:', error);
    res.status(500).json({ error: 'Failed to resolve SOS alert' });
  }
});

// Get user's SOS history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const alertsSnapshot = await db.collection('sosAlerts')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const alerts = alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      alerts,
      total: alerts.length
    });

  } catch (error) {
    console.error('SOS history error:', error);
    res.status(500).json({ error: 'Failed to get SOS history' });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

module.exports = router;
