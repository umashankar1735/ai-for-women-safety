const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let db;
try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'ai-for-women-safety'
  });
  db = admin.firestore();
  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.log('⚠️  Firebase service account not found, using demo mode');
  console.log('📝 Place your serviceAccountKey.json in the root directory');
  
  // Mock database for demo mode
  db = {
    collection: (name) => ({
      add: async (data) => ({ id: `demo_${Date.now()}`, ...data }),
      doc: (id) => ({
        set: async (data) => ({ id, ...data }),
        get: async () => ({ exists: true, data: () => ({ id, demoData: true }) }),
        update: async (data) => ({ id, ...data }),
        delete: async () => ({ success: true })
      }),
      where: () => ({
        get: async () => ({
          docs: [
            { id: 'demo1', data: () => ({ demoData: true }) },
            { id: 'demo2', data: () => ({ demoData: true }) }
          ]
        })
      }),
      get: async () => ({
        docs: [
          { id: 'demo1', data: () => ({ demoData: true }) },
          { id: 'demo2', data: () => ({ demoData: true }) }
        ]
      })
    })
  };
}

module.exports = { db, admin };
