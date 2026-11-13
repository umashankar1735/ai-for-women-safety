# AI Guardian Backend Integration Guide

This guide explains how the frontend has been integrated with the backend API services.

## Overview

The frontend has been updated to use the backend APIs instead of localStorage for data persistence and real-time features. The integration includes:

- **User Authentication** - Login/Registration with backend validation
- **Community Guardian** - Real-time guardian tracking and nearby user detection
- **SOS Emergency System** - Backend-powered emergency alert broadcasting
- **Location Services** - Server-side location tracking and sharing
- **Gamification** - Backend-managed scoring and achievements

## Backend Integration Components

### 1. API Service (`src/services/api.js`)
Central service for all backend communication:
- `apiService.login()` - User authentication
- `apiService.joinAsGuardian()` - Community guardian registration
- `apiService.getNearbyUsers()` - Location-based user discovery
- `apiService.sendSOS()` - Emergency alert transmission
- `apiService.updateLocation()` - Location tracking

### 2. Environment Configuration (`.env`)
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

### 3. Updated Components

#### Login Page (`src/pages/Login.js`)
- **Backend Authentication**: Uses `/api/auth/login` and `/api/auth/register`
- **Fallback Mode**: Falls back to localStorage if backend is unavailable
- **Location Integration**: Sends user location during registration
- **Error Handling**: Shows backend connection status

#### Community Guardian (`src/pages/CommunityGuardian.js`)
- **Real-time Guardian Network**: Connects to `/api/community/join`
- **Nearby User Discovery**: Fetches from `/api/community/nearby`
- **Location Sharing**: Updates backend with `/api/community/location`
- **Guardian Status Sync**: Maintains state between frontend and backend

#### Dashboard (`src/pages/Dashboard.js`)
- **SOS Integration**: Sends emergency alerts via `/api/sos/send`
- **Location Tracking**: Real-time location updates to backend
- **Audio Recording**: Uploads audio data with SOS alerts

## Backend API Endpoints Used

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration

### Community Guardian
- `POST /api/community/join` - Join as guardian
- `GET /api/community/nearby` - Get nearby users
- `POST /api/community/location` - Update user location
- `POST /api/community/help-action` - Report help action

### SOS Emergency
- `POST /api/sos/send` - Send emergency alert
- `GET /api/sos/alerts` - Get nearby emergency alerts

### Gamification
- `GET /api/gamification/profile` - User profile and score
- `POST /api/gamification/score` - Update safety score
- `GET /api/gamification/leaderboard` - Get top guardians

## Fallback Strategy

The frontend implements a graceful fallback strategy:

1. **Primary**: Try backend API connection
2. **Secondary**: If backend fails, use localStorage for demo purposes
3. **User Feedback**: Display connection status and errors
4. **Offline Mode**: Core features remain functional without backend

## Error Handling

Each component includes comprehensive error handling:
- Network errors are caught and displayed to users
- Loading states provide feedback during API calls
- Fallback mechanisms ensure app remains functional
- Error messages guide users on next steps

## Real-time Features

- **Socket.IO Integration**: Ready for real-time updates
- **Location Streaming**: Continuous location sharing
- **Emergency Broadcasting**: Instant SOS alert distribution
- **Guardian Network**: Live guardian status updates

## Security Features

- **JWT Token Authentication**: Secure API access
- **Location Privacy**: Encrypted location data
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Client and server-side validation

## Development Workflow

1. **Start Backend**: `cd Back-End && npm start`
2. **Start Frontend**: `cd Front-End && npm start`
3. **Or Use Script**: `./start-app.sh` (starts both services)

The integration maintains backward compatibility while adding powerful backend features for a production-ready women's safety application.

## Testing the Integration

1. **Authentication Flow**:
   - Enter Aadhaar number and OTP
   - Check network tab for API calls
   - Verify token storage in sessionStorage

2. **Community Guardian**:
   - Toggle guardian mode
   - Check nearby users refresh
   - Verify location updates in backend

3. **SOS Emergency**:
   - Trigger SOS button
   - Monitor API call to `/api/sos/send`
   - Check guardian alert distribution

4. **Fallback Mode**:
   - Stop backend server
   - Verify frontend continues working with localStorage
   - Check error messages and offline mode indicators
