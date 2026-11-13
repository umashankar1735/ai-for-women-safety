const express = require('express');
const { db } = require('../services/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's gamification profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Get user's completed challenges
    const challengesSnapshot = await db.collection('userChallenges')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .get();

    const completedChallenges = challengesSnapshot.docs.map(doc => doc.data());

    // Calculate level based on safety score
    const safetyScore = userData.safetyScore || 100;
    const level = Math.floor(safetyScore / 100) + 1;
    const nextLevelPoints = (level * 100) - safetyScore;

    // Get achievements
    const achievements = calculateAchievements(userData, completedChallenges);

    res.json({
      userId,
      name: userData.name,
      safetyScore,
      level,
      nextLevelPoints,
      totalHelps: userData.totalHelps || 0,
      completedChallenges: completedChallenges.length,
      achievements,
      badges: userData.badges || [],
      streakDays: userData.streakDays || 0
    });

  } catch (error) {
    console.error('Gamification profile error:', error);
    res.status(500).json({ error: 'Failed to get gamification profile' });
  }
});

// Get available challenges
router.get('/challenges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current challenges
    const userChallengesSnapshot = await db.collection('userChallenges')
      .where('userId', '==', userId)
      .where('status', 'in', ['active', 'completed'])
      .get();

    const userChallenges = userChallengesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Default weekly challenges
    const weeklyNumber = getWeekNumber();
    const defaultChallenges = [
      {
        id: `weekly_${weeklyNumber}_anchor`,
        title: 'Safety Anchor Master',
        description: 'Use safety anchor 5 times this week',
        type: 'weekly',
        target: 5,
        points: 100,
        icon: '⚓',
        category: 'anchor'
      },
      {
        id: `weekly_${weeklyNumber}_guardian`,
        title: 'Community Guardian',
        description: 'Help 3 community members this week',
        type: 'weekly',
        target: 3,
        points: 150,
        icon: '🛡️',
        category: 'community'
      },
      {
        id: `weekly_${weeklyNumber}_safety`,
        title: 'Safety Scorer',
        description: 'Complete 10 safety actions this week',
        type: 'weekly',
        target: 10,
        points: 75,
        icon: '📊',
        category: 'general'
      }
    ];

    // Merge with user progress
    const challenges = defaultChallenges.map(challenge => {
      const userChallenge = userChallenges.find(uc => uc.challengeId === challenge.id);
      return {
        ...challenge,
        progress: userChallenge?.progress || 0,
        status: userChallenge?.status || 'available',
        startedAt: userChallenge?.startedAt,
        completedAt: userChallenge?.completedAt
      };
    });

    res.json({
      challenges,
      weekNumber: weeklyNumber
    });

  } catch (error) {
    console.error('Challenges error:', error);
    res.status(500).json({ error: 'Failed to get challenges' });
  }
});

// Start a challenge
router.post('/challenges/:challengeId/start', authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    // Check if already started
    const existingSnapshot = await db.collection('userChallenges')
      .where('userId', '==', userId)
      .where('challengeId', '==', challengeId)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({ error: 'Challenge already started' });
    }

    const userChallengeData = {
      userId,
      challengeId,
      progress: 0,
      status: 'active',
      startedAt: new Date().toISOString()
    };

    await db.collection('userChallenges').add(userChallengeData);

    res.json({
      message: 'Challenge started',
      challengeId,
      status: 'active'
    });

  } catch (error) {
    console.error('Start challenge error:', error);
    res.status(500).json({ error: 'Failed to start challenge' });
  }
});

// Update challenge progress
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { action, category, points = 10 } = req.body;
    const userId = req.user.id;

    // Update user's safety score
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const newScore = (userData.safetyScore || 100) + points;

    await db.collection('users').doc(userId).update({
      safetyScore: newScore,
      lastActivity: new Date().toISOString()
    });

    // Update relevant challenges
    const activeChallengesSnapshot = await db.collection('userChallenges')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    const updates = [];
    
    activeChallengesSnapshot.docs.forEach(doc => {
      const challengeData = doc.data();
      const challengeId = challengeData.challengeId;
      
      // Check if this action matches the challenge category
      if (challengeId.includes(category) || challengeId.includes('safety')) {
        const newProgress = (challengeData.progress || 0) + 1;
        updates.push(
          db.collection('userChallenges').doc(doc.id).update({
            progress: newProgress,
            lastUpdate: new Date().toISOString()
          })
        );
      }
    });

    await Promise.all(updates);

    res.json({
      message: 'Progress updated',
      action,
      pointsEarned: points,
      newSafetyScore: newScore
    });

  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { timeframe = 'all' } = req.query;

    let query = db.collection('users').orderBy('safetyScore', 'desc').limit(50);

    if (timeframe === 'weekly') {
      const weekStart = getWeekStart();
      query = query.where('lastActivity', '>=', weekStart.toISOString());
    }

    const usersSnapshot = await query.get();

    const leaderboard = usersSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        name: data.name,
        safetyScore: data.safetyScore || 100,
        level: Math.floor((data.safetyScore || 100) / 100) + 1,
        totalHelps: data.totalHelps || 0,
        badges: data.badges?.length || 0
      };
    });

    res.json({
      leaderboard,
      timeframe,
      total: leaderboard.length
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Helper functions
function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  return new Date(now.setDate(diff));
}

function calculateAchievements(userData, completedChallenges) {
  const achievements = [];

  // Safety Score achievements
  const score = userData.safetyScore || 100;
  if (score >= 500) achievements.push({ name: 'Safety Champion', icon: '🏆' });
  if (score >= 1000) achievements.push({ name: 'Guardian Master', icon: '⭐' });

  // Help achievements
  const helps = userData.totalHelps || 0;
  if (helps >= 10) achievements.push({ name: 'Helper', icon: '🤝' });
  if (helps >= 50) achievements.push({ name: 'Community Hero', icon: '🦸‍♀️' });

  // Challenge achievements
  if (completedChallenges.length >= 5) {
    achievements.push({ name: 'Challenge Collector', icon: '🎯' });
  }

  return achievements;
}

module.exports = router;
