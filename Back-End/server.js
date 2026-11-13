const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth-demo');
const anchorRoutes = require('./routes/anchor-demo');
const communityRoutes = require('./routes/community-demo');
const gamificationRoutes = require('./routes/gamification-demo');
const sosRoutes = require('./routes/sos-demo');
const threatPredictionRoutes = require('./routes/threat-prediction');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/anchor', anchorRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/threat-prediction', threatPredictionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'AI Guardian Backend is running'
  });
});

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their location-based room
  socket.on('join-location', (data) => {
    const { latitude, longitude, userId } = data;
    const locationRoom = `loc_${Math.floor(latitude * 100)}_${Math.floor(longitude * 100)}`;
    socket.join(locationRoom);
    socket.userId = userId;
    socket.locationRoom = locationRoom;
    console.log(`User ${userId} joined location room: ${locationRoom}`);
  });

  // Handle SOS alerts
  socket.on('sos-alert', (data) => {
    console.log('SOS Alert received:', data);
    // Broadcast to nearby users
    if (socket.locationRoom) {
      socket.to(socket.locationRoom).emit('nearby-sos', {
        alertId: data.alertId,
        location: data.location,
        message: 'SOS alert in your area',
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 AI Guardian Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Export for use in other modules
global.io = io;
module.exports = { app, io };
