#!/bin/bash

echo "🚀 Starting AI Guardian Women's Safety App"
echo "=========================================="

# Check if backend is running
echo "📡 Checking backend status..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is already running on port 3001"
else
    echo "🔧 Starting backend server..."
    cd "Back-End" && npm start &
    BACKEND_PID=$!
    echo "⏳ Waiting for backend to start..."
    sleep 5
fi

# Check if frontend is running
echo "🌐 Checking frontend status..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is already running on port 3000"
else
    echo "🔧 Starting frontend development server..."
    cd "Front-End" && npm start &
    FRONTEND_PID=$!
fi

echo ""
echo "🎉 Application is starting up!"
echo "📡 Backend API: http://localhost:3001"
echo "🌐 Frontend App: http://localhost:3000"
echo ""
echo "📱 Features available:"
echo "  • User Authentication"
echo "  • SOS Emergency Alerts (Real-time)"
echo "  • Safety Anchor Tracking"
echo "  • Community Guardian Network"
echo "  • Gamification & Leaderboard"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user interruption
wait
