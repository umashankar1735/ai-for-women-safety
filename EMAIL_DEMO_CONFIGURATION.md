# Email Demo Configuration

## Overview
For demo purposes, all email notifications from the AI Guardian Women's Safety App have been configured to be sent to a single demo email address instead of the actual emergency contacts.

## Configuration Details

### Demo Email Address
- **Recipient**: `ksaiumashankar@gmail.com`
- **Purpose**: All safety notifications, SOS alerts, and monitoring emails will be sent here during demo

### Changes Made
1. **Email Service Configuration** (`Back-End/services/email.js`):
   - Added `DEMO_EMAIL` constant set to `ksaiumashankar@gmail.com`
   - Added `DEMO_MODE` flag set to `true`
   - Modified `sendSafetyEmail()` function to override recipients in demo mode

### Features Affected
All email notifications will now be redirected to the demo address:

1. **Safety Anchor Emails**:
   - Activation alerts
   - Periodic location updates (every 15 minutes)
   - Deactivation notifications

2. **SOS Alert Emails**:
   - Emergency notifications to guardians
   - Location and status updates

3. **Threat Prediction Emails**:
   - Sensor-based threat alerts
   - Escalation notifications

4. **Community Guardian Emails**:
   - Guardian registration confirmations
   - Emergency response notifications

### Demo Mode Features
- **Original Recipient Tracking**: Emails include a banner showing who the email was originally intended for
- **Console Logging**: All email attempts are logged to the server console
- **HTML Formatting**: Demo emails include clear indication that they are in demo mode

### How to Switch Back to Production
To disable demo mode and use actual emergency contacts:
1. Open `Back-End/services/email.js`
2. Change `DEMO_MODE = true` to `DEMO_MODE = false`
3. Restart the backend server

### Email Content Examples
Demo emails will include:
- Original safety alert content
- Location information with Google Maps links
- Emergency contact information
- Clear demo mode indicators
- Timestamp and user information

## Testing the Configuration

### Prerequisites
- Backend server running on port 3001
- Frontend running on port 3000
- User registered with emergency contacts

### Test Scenarios
1. **Safety Anchor Test**: 
   - Enable safety anchor on SafetyAnchor page
   - Check console logs for email notifications

2. **SOS Alert Test**:
   - Trigger SOS from Dashboard
   - Verify email redirection to demo address

3. **Threat Prediction Test**:
   - Activate threat monitoring
   - Trigger high-risk scenario
   - Check escalation emails

### Current Status
✅ **Active**: Demo mode is currently enabled
✅ **Configured**: All emails redirect to `ksaiumashankar@gmail.com`
✅ **Logging**: Email attempts are logged to console
✅ **Backend**: Server restarted with new configuration

## Notes
- Since no email credentials are configured, emails are currently only logged to console
- To actually send emails, configure `EMAIL_USER` and `EMAIL_PASS` environment variables
- All email functionality works in demo mode with console logging
- Original emergency contact lists are preserved and shown in demo emails
