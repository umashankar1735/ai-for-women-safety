#!/bin/bash

# Test script for Temporal Anchor Email Service
# This script demonstrates the complete temporal anchor workflow

echo "🧪 Testing Temporal Anchor Email Service"
echo "========================================"

# Base URL
BASE_URL="http://localhost:3001"

# Test data
USER_ID="test_user_123"
USER_NAME="Priya Sharma"
EMERGENCY_CONTACTS='["emergency1@example.com", "emergency2@example.com", "guardian@example.com"]'
LATITUDE="28.6139"  # New Delhi coordinates
LONGITUDE="77.2090"
DURATION_MINUTES="30"  # 30 minutes for testing
MESSAGE="Going for evening walk. Will be back by 8 PM."

echo ""
echo "📋 Test Configuration:"
echo "User: $USER_NAME ($USER_ID)"
echo "Location: $LATITUDE, $LONGITUDE (New Delhi)"
echo "Duration: $DURATION_MINUTES minutes"
echo "Emergency Contacts: $EMERGENCY_CONTACTS"
echo ""

# Step 1: Health Check
echo "🔍 Step 1: Health Check"
echo "curl -X GET $BASE_URL/api/health"
curl -X GET "$BASE_URL/api/health"
echo -e "\n"

# Step 2: Activate Temporal Anchor
echo "🟢 Step 2: Activate Temporal Anchor"
echo "This will:"
echo "  - Send activation email to emergency contacts"
echo "  - Start 15-minute interval updates"
echo "  - Auto-deactivate after $DURATION_MINUTES minutes"
echo ""

ACTIVATE_PAYLOAD="{
  \"userId\": \"$USER_ID\",
  \"userName\": \"$USER_NAME\",
  \"emergencyContacts\": $EMERGENCY_CONTACTS,
  \"location\": {
    \"latitude\": $LATITUDE,
    \"longitude\": $LONGITUDE
  },
  \"durationMinutes\": $DURATION_MINUTES,
  \"message\": \"$MESSAGE\"
}"

echo "curl -X POST $BASE_URL/api/anchor/temporal/activate \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '$ACTIVATE_PAYLOAD'"

ANCHOR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/anchor/temporal/activate" \
  -H "Content-Type: application/json" \
  -d "$ACTIVATE_PAYLOAD")

echo "$ANCHOR_RESPONSE"
echo ""

# Extract anchor ID from response
ANCHOR_ID=$(echo "$ANCHOR_RESPONSE" | grep -o '"anchorId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ANCHOR_ID" ]; then
  echo "❌ Failed to activate temporal anchor"
  exit 1
fi

echo "✅ Temporal Anchor Activated: $ANCHOR_ID"
echo ""

# Step 3: Check Anchor Status
echo "📊 Step 3: Check Anchor Status"
echo "curl -X GET $BASE_URL/api/anchor/temporal/$ANCHOR_ID/status"
curl -X GET "$BASE_URL/api/anchor/temporal/$ANCHOR_ID/status"
echo -e "\n"

# Step 4: Update Location (simulate movement)
echo "📍 Step 4: Update Location (Simulate Movement)"
NEW_LATITUDE="28.6289"  # Slightly different location
NEW_LONGITUDE="77.2065"

UPDATE_PAYLOAD="{
  \"location\": {
    \"latitude\": $NEW_LATITUDE,
    \"longitude\": $NEW_LONGITUDE
  }
}"

echo "curl -X PUT $BASE_URL/api/anchor/temporal/$ANCHOR_ID/location \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '$UPDATE_PAYLOAD'"

curl -X PUT "$BASE_URL/api/anchor/temporal/$ANCHOR_ID/location" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD"
echo -e "\n"

# Step 5: Get User's Active Anchors
echo "👤 Step 5: Get User's Active Anchors"
echo "curl -X GET $BASE_URL/api/anchor/temporal/user/$USER_ID"
curl -X GET "$BASE_URL/api/anchor/temporal/user/$USER_ID"
echo -e "\n"

# Step 6: Get All Active Anchors (Admin View)
echo "👨‍💼 Step 6: Get All Active Anchors (Admin View)"
echo "curl -X GET $BASE_URL/api/anchor/temporal/admin/all"
curl -X GET "$BASE_URL/api/anchor/temporal/admin/all"
echo -e "\n"

# Step 7: Wait and show periodic updates
echo "⏰ Step 7: Temporal Anchor is now active!"
echo "The system will:"
echo "  ✉️  Send email updates every 15 minutes"
echo "  📍 Include current location and coordinates"
echo "  🔄 Continue until $DURATION_MINUTES minutes or manual deactivation"
echo ""
echo "To manually deactivate the anchor, run:"
echo "curl -X POST $BASE_URL/api/anchor/temporal/$ANCHOR_ID/deactivate"
echo ""

# Optional: Wait for a few seconds and then deactivate (for demo)
echo "⏳ Waiting 10 seconds before manual deactivation (for demo)..."
sleep 10

# Step 8: Manual Deactivation
echo ""
echo "🔴 Step 8: Manual Deactivation"
echo "curl -X POST $BASE_URL/api/anchor/temporal/$ANCHOR_ID/deactivate"
curl -X POST "$BASE_URL/api/anchor/temporal/$ANCHOR_ID/deactivate"
echo -e "\n"

echo "✅ Temporal Anchor Test Completed!"
echo ""
echo "📧 Email Notifications (DEMO MODE):"
echo "In production with SMTP configured, emergency contacts would receive:"
echo "  1. Activation email with starting location"
echo "  2. Location updates every 15 minutes"
echo "  3. Deactivation email with final location"
echo ""
echo "Check the backend console for demo email logs."
