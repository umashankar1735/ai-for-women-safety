const express = require('express');
const { db } = require('../services/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Threat prediction service
class ThreatPredictionService {
  constructor() {
    this.sensorThresholds = {
      audio: {
        screamConfidence: 0.75,
        loudNoiseThreshold: 80, // dB
        gunShotConfidence: 0.85
      },
      accelerometer: {
        shakeThreshold: 15, // m/s²
        fallThreshold: 20,
        panicMovementThreshold: 12
      },
      heartRate: {
        spikeThreshold: 120, // bpm
        panicThreshold: 140
      },
      location: {
        highRiskAreaMultiplier: 1.3,
        safeAreaMultiplier: 0.7
      }
    };

    this.escalationThresholds = {
      tier0: 0.3, // Local/Passive
      tier1: 0.6, // Community/Trusted Contacts
      tier2: 0.85 // Official dispatch
    };

    this.userTrustScores = new Map(); // In production, this would be in database
  }

  // Calculate threat confidence based on multi-sensor data
  calculateThreatConfidence(sensorData, userContext) {
    let confidence = 0;
    let reasons = [];
    let sensorCount = 0;

    // Audio analysis
    if (sensorData.audio) {
      if (sensorData.audio.screamDetected && sensorData.audio.confidence >= this.sensorThresholds.audio.screamConfidence) {
        confidence += 0.4;
        reasons.push(`Audio scream: ${sensorData.audio.confidence}`);
        sensorCount++;
      }
      if (sensorData.audio.loudNoise && sensorData.audio.volume >= this.sensorThresholds.audio.loudNoiseThreshold) {
        confidence += 0.2;
        reasons.push(`Loud noise: ${sensorData.audio.volume}dB`);
        sensorCount++;
      }
      if (sensorData.audio.gunShotDetected && sensorData.audio.gunShotConfidence >= this.sensorThresholds.audio.gunShotConfidence) {
        confidence += 0.5;
        reasons.push(`Gunshot detected: ${sensorData.audio.gunShotConfidence}`);
        sensorCount++;
      }
    }

    // Accelerometer analysis
    if (sensorData.accelerometer) {
      const shake = sensorData.accelerometer.magnitude;
      if (shake >= this.sensorThresholds.accelerometer.shakeThreshold) {
        confidence += 0.3;
        reasons.push(`Accelerometer shake: ${shake.toFixed(2)}`);
        sensorCount++;
      }
      if (sensorData.accelerometer.fallDetected) {
        confidence += 0.35;
        reasons.push('Fall detected');
        sensorCount++;
      }
    }

    // Heart rate analysis
    if (sensorData.heartRate) {
      if (sensorData.heartRate.current >= this.sensorThresholds.heartRate.panicThreshold) {
        confidence += 0.25;
        reasons.push(`Heart rate spike: ${sensorData.heartRate.current}bpm`);
        sensorCount++;
      }
    }

    // Location context
    if (userContext.location && userContext.location.riskLevel) {
      const locationMultiplier = userContext.location.riskLevel === 'high' 
        ? this.sensorThresholds.location.highRiskAreaMultiplier
        : this.sensorThresholds.location.safeAreaMultiplier;
      
      confidence *= locationMultiplier;
      reasons.push(`Location risk: ${userContext.location.riskLevel}`);
    }

    // User trust score adjustment
    const trustScore = this.getUserTrustScore(userContext.userId);
    if (trustScore < 0.8) {
      confidence *= trustScore;
      reasons.push(`Trust adjustment: ${trustScore.toFixed(2)}`);
    }

    // Multi-sensor requirement for high confidence
    if (confidence >= this.escalationThresholds.tier2 && sensorCount < 2) {
      confidence = Math.min(confidence, this.escalationThresholds.tier1 - 0.01);
      reasons.push('Multi-sensor requirement not met');
    }

    return {
      confidence: Math.min(confidence, 1.0),
      reasons,
      sensorCount,
      tier: this.determineTier(confidence)
    };
  }

  determineTier(confidence) {
    if (confidence >= this.escalationThresholds.tier2) return 2;
    if (confidence >= this.escalationThresholds.tier1) return 1;
    return 0;
  }

  getUserTrustScore(userId) {
    return this.userTrustScores.get(userId) || 1.0; // Default trust score
  }

  updateUserTrustScore(userId, incident) {
    const currentScore = this.getUserTrustScore(userId);
    let newScore = currentScore;

    if (incident.type === 'false_alarm') {
      newScore = Math.max(0.1, currentScore - 0.15);
    } else if (incident.type === 'confirmed_emergency') {
      newScore = Math.min(1.0, currentScore + 0.05);
    }

    this.userTrustScores.set(userId, newScore);
    return newScore;
  }

  // Store incident with evidence
  async storeIncident(userId, threatAnalysis, sensorData, evidence) {
    const incident = {
      userId,
      timestamp: new Date().toISOString(),
      confidence: threatAnalysis.confidence,
      tier: threatAnalysis.tier,
      reasons: threatAnalysis.reasons,
      sensorData,
      evidence,
      status: 'active',
      falseAlarmCount: 0
    };

    const docRef = await db.collection('threatIncidents').add(incident);
    return { id: docRef.id, ...incident };
  }
}

const threatService = new ThreatPredictionService();

// Analyze sensor data and determine threat level
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { sensorData, userContext, evidence } = req.body;
    const userId = req.user.id;

    // Add user ID to context
    userContext.userId = userId;

    // Calculate threat confidence
    const threatAnalysis = threatService.calculateThreatConfidence(sensorData, userContext);

    // Store incident if tier > 0
    let incident = null;
    if (threatAnalysis.tier > 0) {
      incident = await threatService.storeIncident(userId, threatAnalysis, sensorData, evidence);
    }

    res.json({
      analysis: threatAnalysis,
      incident: incident,
      recommendations: {
        showCancelWindow: threatAnalysis.tier > 0,
        cancelWindowDuration: threatAnalysis.tier === 2 ? 8 : 5,
        stealthCancelAvailable: true,
        autoEscalate: threatAnalysis.tier === 2 && threatAnalysis.confidence >= 0.9
      }
    });

  } catch (error) {
    console.error('Threat analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze threat' });
  }
});

// Cancel/confirm alert
router.post('/incident/:incidentId/action', authenticateToken, async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { action, method } = req.body; // action: 'cancel' | 'confirm', method: 'manual' | 'stealth' | 'timeout'
    const userId = req.user.id;

    const incidentDoc = await db.collection('threatIncidents').doc(incidentId).get();
    
    if (!incidentDoc.exists) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const incident = incidentDoc.data();
    
    // Verify ownership
    if (incident.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update incident
    const updateData = {
      status: action === 'cancel' ? 'cancelled' : 'confirmed',
      actionMethod: method,
      actionTimestamp: new Date().toISOString()
    };

    if (action === 'cancel' && method === 'manual' && incident.tier >= 1) {
      // Check if this might be a false alarm
      updateData.possibleFalseAlarm = true;
    }

    await db.collection('threatIncidents').doc(incidentId).update(updateData);

    // Update user trust score if necessary
    if (action === 'cancel' && incident.tier >= 1) {
      const newTrustScore = threatService.updateUserTrustScore(userId, { type: 'false_alarm' });
      
      // Show warning if trust score is getting low
      if (newTrustScore < 0.7) {
        return res.json({
          success: true,
          warning: {
            type: 'trust_warning',
            message: 'Multiple false alarms detected. Please use the emergency features responsibly.',
            trustScore: newTrustScore
          }
        });
      }
    }

    res.json({ success: true, trustScore: threatService.getUserTrustScore(userId) });

  } catch (error) {
    console.error('Incident action error:', error);
    res.status(500).json({ error: 'Failed to process action' });
  }
});

// Get user's incident history
router.get('/incidents', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const incidents = await db.collection('threatIncidents')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const incidentList = incidents.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      incidents: incidentList,
      trustScore: threatService.getUserTrustScore(userId)
    });

  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to get incidents' });
  }
});

// Report false alarm
router.post('/report-false-alarm', async (req, res) => {
  try {
    const { incidentId, reporterType, reporterInfo } = req.body;

    const incidentDoc = await db.collection('threatIncidents').doc(incidentId).get();
    
    if (!incidentDoc.exists) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const incident = incidentDoc.data();

    // Update false alarm count
    await db.collection('threatIncidents').doc(incidentId).update({
      falseAlarmCount: (incident.falseAlarmCount || 0) + 1,
      falseAlarmReports: [...(incident.falseAlarmReports || []), {
        reporterType, // 'trusted_contact', 'emergency_service', 'community_responder'
        reporterInfo,
        timestamp: new Date().toISOString()
      }]
    });

    // Update user trust score
    threatService.updateUserTrustScore(incident.userId, { type: 'false_alarm' });

    res.json({ success: true });

  } catch (error) {
    console.error('Report false alarm error:', error);
    res.status(500).json({ error: 'Failed to report false alarm' });
  }
});

// Get threat prediction statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const incidents = await db.collection('threatIncidents')
      .where('userId', '==', userId)
      .get();

    let stats = {
      totalIncidents: 0,
      tier0: 0,
      tier1: 0,
      tier2: 0,
      cancelled: 0,
      confirmed: 0,
      falseAlarms: 0,
      trustScore: threatService.getUserTrustScore(userId)
    };

    incidents.docs.forEach(doc => {
      const incident = doc.data();
      stats.totalIncidents++;
      stats[`tier${incident.tier}`]++;
      
      if (incident.status === 'cancelled') stats.cancelled++;
      if (incident.status === 'confirmed') stats.confirmed++;
      if (incident.falseAlarmCount > 0) stats.falseAlarms++;
    });

    res.json(stats);

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
