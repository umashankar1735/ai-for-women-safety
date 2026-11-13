const nodemailer = require('nodemailer');

// Demo email configuration - all emails will be sent here for demo purposes
const DEMO_EMAIL = 'ksaiumashankar@gmail.com';
const DEMO_MODE = true; // Set to false to use actual emergency contacts

// Create transporter
let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('📧 Email service initialized');
  if (DEMO_MODE) {
    console.log(`📧 DEMO MODE: All emails will be sent to ${DEMO_EMAIL}`);
  }
} else {
  console.log('📧 Email service in DEMO mode (no credentials provided)');
}

async function sendSafetyEmail(emailData) {
  try {
    // Override recipient in demo mode
    const recipients = DEMO_MODE ? [DEMO_EMAIL] : emailData.to;
    
    if (!transporter) {
      // Demo mode - just log
      console.log('📧 DEMO EMAIL:', {
        to: recipients,
        originalTo: emailData.to,
        subject: emailData.subject,
        preview: emailData.body.substring(0, 100) + '...'
      });
      return { success: true, demo: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(recipients) ? recipients.join(', ') : recipients,
      subject: emailData.subject,
      text: emailData.body,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d63384;">🛡️ AI Guardian Safety Alert</h2>
          ${DEMO_MODE ? `<div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 10px 0;">
            <strong>📧 DEMO MODE:</strong> This email was originally intended for: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}
          </div>` : ''}
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${emailData.body.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">
            This is an automated safety notification from AI Guardian Women's Safety App.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${recipients} (demo mode: ${DEMO_MODE})`);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendSOSAlert(sosData) {
  try {
    const emailData = {
      to: sosData.emergencyContacts,
      subject: `🚨 EMERGENCY SOS ALERT - ${sosData.userName}`,
      body: `
URGENT: ${sosData.userName} has triggered an SOS alert!

Location: ${sosData.location.latitude}, ${sosData.location.longitude}
Time: ${sosData.timestamp}
Message: ${sosData.message || 'Emergency assistance needed'}

Please contact local authorities and the user immediately.

Emergency Contacts:
${sosData.emergencyContacts.map(contact => `- ${contact}`).join('\n')}
      `
    };

    return await sendSafetyEmail(emailData);
  } catch (error) {
    console.error('SOS alert email error:', error);
    return { success: false, error: error.message };
  }
}

async function sendTemporalAnchorAlert(anchorData) {
  try {
    const emailData = {
      to: anchorData.emergencyContacts,
      subject: `⚓ Safety Anchor Update - ${anchorData.userName}`,
      body: `
Safety Anchor Status Update for ${anchorData.userName}

🕐 Time: ${anchorData.timestamp}
📍 Current Location: 
   - Latitude: ${anchorData.location.latitude}
   - Longitude: ${anchorData.location.longitude}
   - Address: ${anchorData.location.address || 'Resolving address...'}

🛡️ Status: ${anchorData.status}
⚓ Anchor Duration: ${anchorData.durationMinutes} minutes
🔄 Next Update: In 15 minutes

${anchorData.message ? `📝 Message: ${anchorData.message}` : ''}

This is an automated safety check-in. If you haven't heard from ${anchorData.userName} and are concerned, please contact them immediately.

Google Maps Link: https://maps.google.com/?q=${anchorData.location.latitude},${anchorData.location.longitude}
      `
    };

    return await sendSafetyEmail(emailData);
  } catch (error) {
    console.error('Temporal anchor email error:', error);
    return { success: false, error: error.message };
  }
}

async function sendAnchorActivationAlert(anchorData) {
  try {
    const emailData = {
      to: anchorData.emergencyContacts,
      subject: `🟢 Safety Anchor Activated - ${anchorData.userName}`,
      body: `
${anchorData.userName} has activated a Safety Anchor!

📍 Starting Location: 
   - Latitude: ${anchorData.location.latitude}
   - Longitude: ${anchorData.location.longitude}
   - Address: ${anchorData.location.address || 'Resolving address...'}

⏱️ Duration: ${anchorData.durationMinutes} minutes
🔄 Updates: Every 15 minutes
📱 Started: ${anchorData.timestamp}

${anchorData.message ? `📝 Message: ${anchorData.message}` : ''}

You will receive location updates every 15 minutes until the anchor is deactivated.

Google Maps Link: https://maps.google.com/?q=${anchorData.location.latitude},${anchorData.location.longitude}
      `
    };

    return await sendSafetyEmail(emailData);
  } catch (error) {
    console.error('Anchor activation email error:', error);
    return { success: false, error: error.message };
  }
}

async function sendAnchorDeactivationAlert(anchorData) {
  try {
    const emailData = {
      to: anchorData.emergencyContacts,
      subject: `🔴 Safety Anchor Deactivated - ${anchorData.userName}`,
      body: `
${anchorData.userName} has safely deactivated their Safety Anchor.

📍 Final Location: 
   - Latitude: ${anchorData.location.latitude}
   - Longitude: ${anchorData.location.longitude}
   - Address: ${anchorData.location.address || 'Resolving address...'}

⏱️ Total Duration: ${anchorData.totalDurationMinutes} minutes
🔚 Ended: ${anchorData.timestamp}

${anchorData.userName} is safe and has completed their journey.

Google Maps Link: https://maps.google.com/?q=${anchorData.location.latitude},${anchorData.location.longitude}
      `
    };

    return await sendSafetyEmail(emailData);
  } catch (error) {
    console.error('Anchor deactivation email error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendSafetyEmail,
  sendSOSAlert,
  sendTemporalAnchorAlert,
  sendAnchorActivationAlert,
  sendAnchorDeactivationAlert
};
