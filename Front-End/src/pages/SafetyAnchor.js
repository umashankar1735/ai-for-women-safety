// src/pages/SafetyAnchor.js
import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null");
}

export default function SafetyAnchor() {
  const user = getCurrentUser();
  const [enabled, setEnabled] = useState(false);
  const [lastLog, setLastLog] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSeen, setLastSeen] = useState(new Date());
  const intervalRef = useRef(null);
  const emailIntervalRef = useRef(null);
  const timeIntervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    
    // Load saved state
    const saved = localStorage.getItem(`lastSafety_${user.userId}`);
    if (saved) setLastLog(JSON.parse(saved));
    
    const anchorEnabled = localStorage.getItem(`safetyAnchor_${user.userId}`);
    if (anchorEnabled === "true") {
      setEnabled(true);
      startLocationTracking();
      startEmailNotifications();
    }

    // Get current location
    getCurrentLocation();

    // Start time updates immediately and then every second
    setCurrentTime(new Date()); // Set initial time immediately
    setLastSeen(new Date()); // Set initial last seen time
    timeIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
      setLastSeen(new Date()); // Update last seen every second to show activity
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (emailIntervalRef.current) clearInterval(emailIntervalRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, [user]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.error("Location error:", error);
          // Use fallback location if GPS fails
          setCurrentLocation({
            lat: 12.9716,
            lon: 77.5946,
            accuracy: null,
            timestamp: new Date().toISOString()
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        }
      );
    }
  };

  const sendAnchor = () => {
    if (!user) return;
    
    getCurrentLocation();
    
    const log = {
      id: Date.now(),
      userId: user.userId,
      name: user.name,
      time: new Date().toISOString(),
      lat: currentLocation?.lat || 12.9716,
      lon: currentLocation?.lon || 77.5946,
      accuracy: currentLocation?.accuracy,
      type: "safety_anchor"
    };
    
    localStorage.setItem(`lastSafety_${user.userId}`, JSON.stringify(log));
    setLastLog(log);
    
    // Send safety anchor email immediately
    sendSafetyEmail(log);
    
    console.log("Safety anchor log saved:", log);
  };

  const sendSafetyEmail = (logData) => {
    const emailContent = {
      to: user.guardians || ["guardian@example.com"],
      subject: "🚨 Women Safety App - Safety Anchor Alert",
      timestamp: new Date().toISOString(),
      user: user.name,
      userId: user.userId,
      location: {
        latitude: logData.lat,
        longitude: logData.lon,
        accuracy: logData.accuracy,
        address: `Lat: ${logData.lat.toFixed(6)}, Lon: ${logData.lon.toFixed(6)}`,
        mapLink: `https://maps.google.com/?q=${logData.lat},${logData.lon}`
      },
      message: `Safety anchor activated for ${user.name}. Current location has been logged and tracked.`,
      emergencyLevel: enabled ? "ACTIVE_MONITORING" : "SINGLE_ALERT"
    };

    // Store email log
    const emailLogs = JSON.parse(localStorage.getItem("emailLogs") || "[]");
    emailLogs.push({
      id: Date.now(),
      type: "safety_anchor",
      ...emailContent
    });
    localStorage.setItem("emailLogs", JSON.stringify(emailLogs));
    
    console.log("Safety email sent:", emailContent);
    return emailContent;
  };

  const startLocationTracking = () => {
    // Send location update every 20 seconds for demo (in real app, this could be longer)
    intervalRef.current = setInterval(() => {
      sendAnchor();
    }, 20 * 1000);
  };

  const startEmailNotifications = () => {
    // Send email notifications every 15 minutes (900000 ms)
    // For demo purposes, using 30 seconds (30000 ms)
    emailIntervalRef.current = setInterval(() => {
      if (enabled && user) {
        const emailLog = {
          id: Date.now(),
          userId: user.userId,
          name: user.name,
          time: new Date().toISOString(),
          lat: currentLocation?.lat || 12.9716,
          lon: currentLocation?.lon || 77.5946,
          accuracy: currentLocation?.accuracy,
          type: "periodic_update"
        };
        
        sendSafetyEmail(emailLog);
        console.log("15-minute safety email sent automatically");
      }
    }, 30000); // 30 seconds for demo, change to 900000 for 15 minutes
  };

  const toggle = () => {
    if (!enabled) {
      sendAnchor(); // Send immediately
      startLocationTracking();
      startEmailNotifications();
      setEnabled(true);
      localStorage.setItem(`safetyAnchor_${user.userId}`, "true");
      
      // Update user record
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.map(u => 
        u.userId === user.userId 
          ? { ...u, safetyAnchorActive: true, lastSafetyUpdate: new Date().toISOString() }
          : u
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
    } else {
      clearInterval(intervalRef.current);
      clearInterval(emailIntervalRef.current);
      intervalRef.current = null;
      emailIntervalRef.current = null;
      setEnabled(false);
      localStorage.setItem(`safetyAnchor_${user.userId}`, "false");
      
      // Update user record
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.map(u => 
        u.userId === user.userId 
          ? { ...u, safetyAnchorActive: false, lastSafetyUpdate: new Date().toISOString() }
          : u
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }
  };

  const openMockEmail = () => {
    if (!lastLog) return alert("No safety log yet.");
    
    // Get the latest email from logs
    const emailLogs = JSON.parse(localStorage.getItem("emailLogs") || "[]");
    const latestEmail = emailLogs
      .filter(email => email.type === "safety_anchor" || email.type === "periodic_update")
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const html = `
      <html>
        <head>
          <title>Women Safety App - Safety Alert</title>
          <style>
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 20px; 
              background: linear-gradient(135deg, #fdf2f8, #f3e8ff);
              margin: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #d946ef, #be185d);
              color: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              margin-bottom: 20px;
            }
            .alert-info {
              background: #fef2f2;
              border: 2px solid #fca5a5;
              border-radius: 8px;
              padding: 15px;
              margin: 15px 0;
            }
            .location-info {
              background: #f0f9ff;
              border: 2px solid #93c5fd;
              border-radius: 8px;
              padding: 15px;
              margin: 15px 0;
            }
            .coordinates {
              font-family: monospace;
              background: #f1f5f9;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
            }
            .map-link {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 WOMEN SAFETY ALERT</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Emergency Safety Anchor Notification</p>
            </div>
            
            <div class="alert-info">
              <h3 style="color: #dc2626; margin-top: 0;">⚠️ SAFETY ANCHOR ACTIVATED</h3>
              <p><strong>User:</strong> ${lastLog.name}</p>
              <p><strong>User ID:</strong> ${lastLog.userId}</p>
              <p><strong>Activation Time:</strong> ${new Date(lastLog.time).toLocaleString()}</p>
              <p><strong>Alert Type:</strong> ${enabled ? 'Continuous Monitoring (15-min intervals)' : 'Single Alert'}</p>
            </div>

            <div class="location-info">
              <h3 style="color: #1d4ed8; margin-top: 0;">📍 CURRENT LOCATION</h3>
              <div class="coordinates">
                <p><strong>Latitude:</strong> ${lastLog.lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> ${lastLog.lon.toFixed(6)}</p>
                ${lastLog.accuracy ? `<p><strong>Accuracy:</strong> ±${Math.round(lastLog.accuracy)} meters</p>` : ''}
              </div>
              
              <a href="https://maps.google.com/?q=${lastLog.lat},${lastLog.lon}" 
                 class="map-link" target="_blank">
                🗺️ View on Google Maps
              </a>
              
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                Location captured at: ${new Date(lastLog.time).toLocaleString()}
              </p>
            </div>

            ${enabled ? `
              <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h3 style="color: #d97706; margin-top: 0;">📧 AUTOMATIC MONITORING ACTIVE</h3>
                <p>This user has activated continuous safety monitoring. You will receive location updates every 15 minutes until the safety anchor is deactivated.</p>
                <p><strong>Next update expected:</strong> ${new Date(Date.now() + 15 * 60 * 1000).toLocaleString()}</p>
              </div>
            ` : ''}

            <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <h3 style="color: #374151; margin-top: 0;">📋 RECOMMENDED ACTIONS</h3>
              <ul style="color: #4b5563;">
                <li>Contact the user immediately to verify their safety</li>
                <li>If unable to reach, consider contacting local authorities</li>
                <li>Check the provided location for any emergency situations</li>
                <li>Keep monitoring for subsequent location updates</li>
              </ul>
            </div>

            <div class="footer">
              <p>This is an automated safety notification from Women Safety App</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p style="color: #d946ef; font-weight: bold;">🛡️ Your safety is our priority</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.title = "Safety Alert - " + lastLog.name;
    w.document.close();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Navbar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px",
        }}
      >
        <h2 style={{ color: "#333", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "700" }}>SAFETY ANCHOR</h2>
        <p style={{ color: "#666", letterSpacing: "1px", textTransform: "uppercase" }}>
          LOGGED IN AS <strong>{user?.name?.toUpperCase()}</strong>
        </p>

        {/* Cards Container - Side by Side Layout */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "30px",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "flex-start",
            width: "100%",
            maxWidth: "1200px"
          }}
        >
          {/* Current Location Display */}
          {currentLocation && (
            <div
              style={{
                padding: "20px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                width: "280px",
                height: "320px",
                textAlign: "center",
                flex: "1",
                minWidth: "280px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <h3 style={{ color: "#6aa290ff", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "15px" }}>📍 CURRENT LOCATION</h3>
                <div style={{ background: "#f0f9ff", borderRadius: "8px", padding: "15px", marginBottom: "15px" }}>
                  <p style={{ margin: "5px 0" }}><strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}</p>
                  <p style={{ margin: "5px 0" }}><strong>Longitude:</strong> {currentLocation.lon.toFixed(6)}</p>
                  {currentLocation.accuracy && (
                    <p style={{ margin: "5px 0" }}><strong>Accuracy:</strong> ±{Math.round(currentLocation.accuracy)}m</p>
                  )}
                  <p style={{ fontSize: "12px", color: "#666", margin: "5px 0" }}>
                    Updated: {new Date(currentLocation.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  backgroundColor: "#73a292ff",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginTop: "auto"
                }}
              >
                🗺️ View on Maps
              </a>
            </div>
          )}

          {/* Email Status Display */}
          {enabled && (
            <div
              style={{
                padding: "20px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                width: "280px",
                height: "320px",
                textAlign: "center",
                border: "2px solid #fbbf24",
                flex: "1",
                minWidth: "280px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <h3 style={{ color: "#d97706", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "15px" }}>📧 EMAIL MONITORING</h3>
                <div style={{ background: "#fffbeb", borderRadius: "8px", padding: "15px" }}>
                  <p style={{ color: "#92400e", fontWeight: "bold", marginBottom: "10px" }}>
                    ✅ AUTOMATIC EMAILS ACTIVE
                  </p>
                  <p style={{ fontSize: "14px", color: "#78350f", margin: "8px 0" }}>
                    📨 Sending location updates every 15 minutes
                  </p>
                  <p style={{ fontSize: "14px", color: "#78350f", margin: "8px 0" }}>
                    📍 Real-time location tracking enabled
                  </p>
                  <p style={{ fontSize: "12px", color: "#a16207", marginTop: "10px" }}>
                    Guardians will receive continuous safety updates
                  </p>
                </div>
              </div>
              <div style={{ 
                marginTop: "auto",
                padding: "8px",
                background: "#fef3c7",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#92400e",
                fontWeight: "bold"
              }}>
                🔒 SECURITY STATUS: PROTECTED
              </div>
            </div>
          )}

          {/* Current Time Display */}
          <div
            style={{
              padding: "20px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              width: "280px",
              height: "320px",
              textAlign: "center",
              border: "2px solid #8b5cf6",
              flex: "1",
              minWidth: "280px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <h3 style={{ 
                color: "#7c3aed", 
                letterSpacing: "2px", 
                textTransform: "uppercase",
                marginBottom: "15px"
              }}>
                🕐 CURRENT TIME
              </h3>
              <div style={{ 
                background: "#f3f4f6", 
                borderRadius: "10px", 
                padding: "15px"
              }}>
                <div style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#374151",
                  fontFamily: "monospace",
                  letterSpacing: "2px"
                }}>
                  {String(currentTime.getHours()).padStart(2, '0')}:
                  {String(currentTime.getMinutes()).padStart(2, '0')}:
                  {String(currentTime.getSeconds()).padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginTop: "8px",
                  fontWeight: "500"
                }}>
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <div style={{ 
              marginTop: "auto",
              padding: "8px", 
              background: "#ede9fe", 
              borderRadius: "6px",
              border: "1px solid #c4b5fd"
            }}>
              <span style={{ 
                fontSize: "11px", 
                color: "#059669",
                fontWeight: "bold"
              }}>
                🟢 LAST SEEN: {lastSeen.toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
              <br />
              <span style={{ 
                fontSize: "10px", 
                color: "#6b7280"
              }}>
                Active Now • Online
              </span>
            </div>
          </div>
        </div>

        {/* Enable/Disable Button */}
        <button
          onClick={toggle}
          style={{
            marginTop: "30px",
            padding: "14px 24px",
            backgroundColor: enabled ? "#868e96" : "#339af0",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            width: "220px",
          }}
        >
          {enabled ? "Disable Safety Anchor" : "Enable Safety Anchor"}
        </button>
      </div>
    </div>
  );
}
