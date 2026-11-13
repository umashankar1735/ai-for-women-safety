# AI Guardian Women's Safety - Backend API

🛡️ **AI Guardian** is an innovative women's safety application that provides proactive protection through AI-driven features, community support, and gamification.

## 🌟 Key Features

### 1. **Temporal Safety Anchor** ⚓
- Periodic safety data trails with GPS tracking
- Automatic email/SMS notifications to emergency contacts
- Evidence trail creation for emergencies

### 2. **Community Guardian** 🤝
- Real-time SOS alerts to nearby community members
- Location-based emergency response network
- Social responsibility scoring system

### 3. **Gamification System** 🎮
- Safety score and level progression
- Weekly challenges and achievements
- Community leaderboards
- Points-based reward system

### 4. **Aadhaar Authentication** 🔐
- Secure login with Aadhaar verification
- OTP-based authentication system
- User profile management

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Firebase project setup
- Gmail account for email notifications

### Installation

1. **Clone and navigate to the backend directory**
   ```bash
   cd "/Users/umashankar/My Space/Hackathon/Back-End"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```bash
   # Email Configuration
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-app-password

   # Firebase Configuration
   FIREBASE_PROJECT_ID=ai-for-women-safety

   # Server Configuration
   PORT=5000

   # Demo Mode (set to false for production)
   DEMO_MODE=true
   ```

4. **Firebase Setup** (Optional - works in demo mode without this)
   - Download `serviceAccountKey.json` from Firebase Console
   - Place it in the root directory

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 📱 API Endpoints

### Authentication Routes (`/api/auth`)

#### Register with Aadhaar
```http
POST /api/auth/register
Content-Type: application/json

{
  "aadhaarNumber": "123456789012",
  "otp": "123456",
  "name": "User Name",
  "phone": "+91XXXXXXXXXX",
  "email": "user@example.com",
  "password": "securepassword",
  "emergencyContacts": [
    {"name": "Emergency Contact", "phone": "+91XXXXXXXXXX", "email": "emergency@example.com"}
  ]
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "aadhaarNumber": "123456789012",
  "password": "securepassword"
}
```

#### Get Aadhaar OTP
```http
POST /api/auth/aadhaar-otp
Content-Type: application/json

{
  "aadhaarNumber": "123456789012"
}
```

### Safety Anchor Routes (`/api/anchor`)

#### Start Safety Anchor
```http
POST /api/anchor/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {"latitude": 28.6139, "longitude": 77.2090},
  "destination": {"name": "Home", "latitude": 28.7041, "longitude": 77.1025},
  "estimatedArrival": "2025-09-19T20:00:00Z"
}
```

#### Add Checkpoint
```http
POST /api/anchor/checkpoint
Authorization: Bearer <token>
Content-Type: application/json

{
  "anchorId": "anchor_id_here",
  "location": {"latitude": 28.6129, "longitude": 77.2095},
  "message": "Reached metro station safely"
}
```

### Community Guardian Routes (`/api/community`)

#### Get Nearby Users
```http
GET /api/community/nearby?latitude=28.6139&longitude=77.2090&radius=2
Authorization: Bearer <token>
```

#### Join as Guardian
```http
POST /api/community/join-guardian
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {"latitude": 28.6139, "longitude": 77.2090},
  "availability": "available"
}
```

### SOS Emergency Routes (`/api/sos`)

#### Trigger SOS Alert
```http
POST /api/sos/trigger
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {"latitude": 28.6139, "longitude": 77.2090},
  "message": "Need immediate help",
  "severity": "high"
}
```

#### Respond to SOS
```http
POST /api/sos/{alertId}/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "responseType": "authorities_contacted",
  "location": {"latitude": 28.6140, "longitude": 77.2091},
  "message": "Police notified"
}
```

### Gamification Routes (`/api/gamification`)

#### Get User Profile
```http
GET /api/gamification/profile
Authorization: Bearer <token>
```

#### Get Available Challenges
```http
GET /api/gamification/challenges
Authorization: Bearer <token>
```

#### Get Leaderboard
```http
GET /api/gamification/leaderboard?timeframe=weekly
Authorization: Bearer <token>
```

## 🎮 Demo Mode

For quick testing without full setup:

1. **Demo Aadhaar Numbers:**
   - `123456789012`
   - `123412341234`
   - `999988887777`

2. **Demo OTP:** `123456`

3. **Demo User Registration:**
   ```json
   {
     "aadhaarNumber": "123456789012",
     "otp": "123456",
     "name": "Demo User",
     "phone": "+919999999999",
     "email": "demo@example.com",
     "password": "demo123"
   }
   ```

## 🔥 Real-time Features

The backend uses Socket.IO for real-time communication:

### Events

#### Client to Server:
- `join-location` - Join location-based room for SOS alerts
- `sos-alert` - Broadcast SOS to nearby users

#### Server to Client:
- `nearby-sos` - Receive SOS alerts in your area
- `sos-response` - Get responses to your SOS
- `sos-resolved` - Alert resolution notification

### Frontend Socket.IO Integration:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join location room
socket.emit('join-location', {
  latitude: 28.6139,
  longitude: 77.2090,
  userId: 'user_id'
});

// Listen for nearby SOS alerts
socket.on('nearby-sos', (alert) => {
  console.log('SOS Alert nearby:', alert);
  // Show notification to user
});
```

## 📊 Database Structure (Firebase Firestore)

### Collections:

1. **users** - User profiles and authentication
2. **safetyAnchors** - Active and completed safety journeys
3. **sosAlerts** - Emergency SOS alerts
4. **sosResponses** - Community responses to SOS
5. **userChallenges** - Gamification challenge progress
6. **helpActions** - Community help tracking

## 🛡️ Security Features

- JWT token-based authentication
- Aadhaar verification simulation
- Request validation and sanitization
- Location-based access control
- Emergency contact verification

## 🎯 Points System

| Action | Points |
|--------|--------|
| Complete Safety Anchor | 25 |
| Join as Guardian | 50 |
| Acknowledge SOS | 10 |
| Help in Emergency | 50 |
| Contact Authorities | 100 |
| Complete Weekly Challenge | 75-150 |

## 📧 Email Notifications

The system sends automated emails for:
- Safety anchor checkpoints
- SOS emergency alerts
- Journey completion notifications
- Weekly challenge updates

## 🔗 Frontend Integration

### Expected Frontend Routes:
- `/login` - Aadhaar authentication
- `/dashboard` - Main safety dashboard
- `/anchor` - Safety anchor tracking
- `/community` - Community guardian features
- `/challenges` - Gamification challenges
- `/sos` - Emergency SOS interface

### API Response Format:
```json
{
  "message": "Success message",
  "data": { /* response data */ },
  "timestamp": "2025-09-19T15:30:00Z"
}
```

### Error Response Format:
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-09-19T15:30:00Z"
}
```

## 🚀 Production Deployment

1. Set up Firebase project with Firestore
2. Configure email service with actual SMTP
3. Set environment variables in production
4. Enable HTTPS for secure communication
5. Set up monitoring and logging

## 📱 Health Check

```http
GET /api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-09-19T15:30:00Z",
  "message": "AI Guardian Backend is running"
}
```

## 🤝 Team Integration

### For Frontend Team:
1. Use the provided API endpoints
2. Handle JWT tokens for authentication
3. Implement Socket.IO for real-time features
4. Display gamification elements
5. Integrate location services

### Current Status:
✅ Authentication with Aadhaar  
✅ Temporal Safety Anchor  
✅ Community Guardian System  
✅ Gamification Features  
✅ Real-time SOS Alerts  
✅ Email Notifications  

---

**Ready for Demo! 🎉**

The backend is fully functional and ready to support your frontend implementation for the review in 2 hours!
