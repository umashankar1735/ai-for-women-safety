# AI Guardian Women's Safety App - Connected System

🚀 **Backend and Frontend are now successfully connected!**

## 🌟 Current Status

✅ **Backend Server**: Running on http://localhost:3001  
✅ **Frontend App**: Running on http://localhost:3000  
✅ **Real-time Communication**: Socket.IO connected  
✅ **API Integration**: All endpoints working  

## 🔧 How to Start the Application

### Option 1: Use the startup script
```bash
./start-app.sh
```

### Option 2: Manual startup

1. **Start Backend**:
   ```bash
   cd Back-End
   npm start
   ```

2. **Start Frontend** (in another terminal):
   ```bash
   cd Front-End
   npm start
   ```

## 🌐 Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔧 Connected Features

### 🔐 Authentication
- Mock authentication with Aadhaar and OTP
- Session management with JWT tokens
- Auto-logout on unauthorized access

### 🚨 SOS Emergency System
- **Real-time alerts** via Socket.IO
- Location-based alert distribution
- Automatic notification to nearby guardians
- Emergency contact integration

### ⚓ Safety Anchor
- Periodic location tracking
- Backend storage of safety check-ins
- Configurable interval (currently 60 seconds)

### 🛡️ Community Guardian Network
- Guardian registration system
- Real-time emergency alert notifications
- Location-based guardian discovery
- Help action tracking and scoring

### 🎮 Gamification System
- Points for helping others
- Community leaderboard
- Achievement tracking
- Safety score calculation

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### SOS System
- `POST /api/sos/alert` - Send emergency alert
- `GET /api/sos/history/:userId` - Get SOS history

### Safety Anchor
- `POST /api/anchor/create` - Create safety anchor
- `GET /api/anchor/nearby` - Get nearby anchors

### Community
- `POST /api/community/join` - Join as guardian
- `GET /api/community/nearby` - Get nearby guardians

### Gamification
- `GET /api/gamification/points/:userId` - Get user points
- `GET /api/gamification/leaderboard` - Get leaderboard
- `POST /api/gamification/add-points` - Add points to user

## 🔄 Real-time Features (Socket.IO)

### Events Emitted by Client:
- `join-location` - Join location-based room
- `sos-alert` - Broadcast emergency alert

### Events Received by Client:
- `nearby-sos` - Receive nearby emergency alerts
- `connect` / `disconnect` - Connection status

## 🎯 Testing the Connection

1. **Open the app**: http://localhost:3000
2. **Login** with any Aadhaar number and OTP
3. **Test SOS**: Click the SOS button on dashboard
4. **Test Guardian Mode**: Go to Community Guardian page and activate
5. **Test Gamification**: Complete challenges to earn points

## 🗂️ Data Flow

```
Frontend (React) ↔ Backend (Express/Node.js)
       ↕                    ↕
   Socket.IO        ↔    Socket.IO
       ↕                    ↕
   Local Storage           Firebase
```

## 🎨 Features Implemented

- ✅ User authentication with backend validation
- ✅ Real-time SOS alerts via WebSockets
- ✅ Location-based services
- ✅ Community guardian network
- ✅ Gamification with backend scoring
- ✅ Safety anchor tracking
- ✅ Emergency alert system
- ✅ Responsive UI with loading states
- ✅ Error handling and user feedback

## 🔒 Security Features

- Token-based authentication
- CORS protection
- Input validation
- Error handling middleware
- Session management

## 🚀 Production Deployment

For production deployment:

1. **Backend**: Deploy to services like Heroku, Railway, or DigitalOcean
2. **Frontend**: Deploy to Vercel, Netlify, or any static hosting
3. **Environment Variables**: Update API URLs in production
4. **Database**: Use production Firebase project
5. **SSL**: Enable HTTPS for both services

## 📱 Mobile Responsiveness

The frontend is designed to work on:
- 📱 Mobile phones
- 📱 Tablets  
- 💻 Desktop browsers

## 🤝 Contributing

1. Both frontend and backend are now modular
2. API service layer handles all backend communication
3. Socket.IO provides real-time features
4. Easy to add new features or modify existing ones

---

**🎉 Your frontend and backend are now fully connected and working together!**
