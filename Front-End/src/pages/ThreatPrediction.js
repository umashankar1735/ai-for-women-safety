// src/pages/ThreatPrediction.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import apiService from "../services/api";
import sensorSimulator from "../services/sensorSimulator";

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null");
}

export default function ThreatPrediction() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [sensorData, setSensorData] = useState(null);
  const [threatAnalysis, setThreatAnalysis] = useState(null);
  const [activeIncident, setActiveIncident] = useState(null);
  const [showCancelWindow, setShowCancelWindow] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(0);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const countdownRef = useRef(null);
  const stealthCancelRef = useRef(0);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Load incidents and stats
    loadIncidents();
    loadStats();

    // Subscribe to sensor data
    const unsubscribe = sensorSimulator.subscribe(handleSensorData);

    return () => {
      unsubscribe();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [user, navigate]);

  const handleSensorData = async (data) => {
    if (!isMonitoring) return;

    setSensorData(data);

    // Analyze threat level
    try {
      const userContext = {
        userId: user.userId,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          riskLevel: 'medium' // This would be determined by location analysis
        },
        timeOfDay: new Date().getHours(),
        isInSafeZone: false // This would be determined by user's safe zones
      };

      const evidence = {
        audioBuffer: null, // Would contain actual audio data
        timestamp: data.timestamp,
        userActivity: 'walking' // Would be inferred from accelerometer
      };

      const response = await apiService.analyzeThreat(data, userContext, evidence);
      setThreatAnalysis(response.analysis);

      // Handle escalation
      if (response.incident) {
        setActiveIncident(response.incident);
        
        if (response.recommendations.showCancelWindow) {
          showCancelDialog(response.recommendations.cancelWindowDuration);
        }

        if (response.recommendations.autoEscalate) {
          // Auto escalate to authorities after countdown
          setTimeout(() => {
            handleEscalation(response.incident.tier);
          }, response.recommendations.cancelWindowDuration * 1000);
        }
      }

    } catch (error) {
      console.error("Threat analysis failed:", error);
      setError("Failed to analyze sensor data");
    }
  };

  const showCancelDialog = (duration) => {
    setShowCancelWindow(true);
    setCancelCountdown(duration);

    countdownRef.current = setInterval(() => {
      setCancelCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setShowCancelWindow(false);
          if (activeIncident) {
            handleTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = async (method = 'manual') => {
    if (!activeIncident) return;

    try {
      await apiService.incidentAction(activeIncident.id, 'cancel', method);
      setShowCancelWindow(false);
      setActiveIncident(null);
      
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      loadStats(); // Refresh stats
    } catch (error) {
      console.error("Failed to cancel incident:", error);
      setError("Failed to cancel alert");
    }
  };

  const handleConfirm = async () => {
    if (!activeIncident) return;

    try {
      await apiService.incidentAction(activeIncident.id, 'confirm', 'manual');
      setShowCancelWindow(false);
      
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      // Escalate based on tier
      handleEscalation(activeIncident.tier);
      
      loadStats(); // Refresh stats
    } catch (error) {
      console.error("Failed to confirm incident:", error);
      setError("Failed to confirm emergency");
    }
  };

  const handleTimeout = async () => {
    if (!activeIncident) return;

    // Auto-escalate on timeout
    handleEscalation(activeIncident.tier);
  };

  const handleEscalation = (tier) => {
    switch (tier) {
      case 0:
        // Local/Passive - just log
        console.log("Tier 0: Local logging");
        break;
      case 1:
        // Community/Trusted Contacts
        alert("🔔 Trusted contacts have been notified of potential emergency");
        break;
      case 2:
        // Official dispatch
        alert("🚨 Emergency services have been contacted. Help is on the way!");
        break;
      default:
        break;
    }
  };

  const handleStealthCancel = () => {
    stealthCancelRef.current += 1;
    
    if (stealthCancelRef.current >= 3) {
      handleCancel('stealth');
      stealthCancelRef.current = 0;
    }

    // Reset counter after 2 seconds
    setTimeout(() => {
      stealthCancelRef.current = 0;
    }, 2000);
  };

  const loadIncidents = async () => {
    try {
      const response = await apiService.getThreatIncidents(10);
      setIncidents(response.incidents || []);
    } catch (error) {
      console.error("Failed to load incidents:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getThreatStats();
      setStats(response);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      sensorSimulator.stopSimulation();
      setIsMonitoring(false);
    } else {
      sensorSimulator.startSimulation();
      setIsMonitoring(true);
    }
  };

  // Test different threat scenarios
  const simulateScenario = (type) => {
    switch (type) {
      case 'panic':
        sensorSimulator.simulatePanicSituation();
        break;
      case 'suspicious':
        sensorSimulator.simulateSuspiciousActivity();
        break;
      case 'noise':
        sensorSimulator.simulateLoudNoise();
        break;
      case 'gunshot':
        sensorSimulator.simulateGunshotDetection();
        break;
      default:
        break;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
      }}
    >
      <Navbar />
      
      {/* Cancel/Confirm Dialog */}
      {showCancelWindow && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div 
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "30px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
            }}
            onClick={handleStealthCancel}
          >
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
            <h2 style={{ color: "#dc2626", marginBottom: "10px" }}>
              We detected possible danger
            </h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              If this is accidental, press CANCEL now.
            </p>
            
            <div style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#dc2626",
              marginBottom: "20px"
            }}>
              {String(cancelCountdown).padStart(2, '0')}
            </div>

            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              <button
                onClick={() => handleCancel('manual')}
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "15px 30px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "15px 30px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                I NEED HELP
              </button>
            </div>

            <p style={{ 
              fontSize: "12px", 
              color: "#999", 
              marginTop: "15px",
              fontStyle: "italic"
            }}>
              Tap 3x the dialog area to cancel quietly
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: "40px" }}>
        <h2 style={{ 
          color: "#1976d2", 
          marginBottom: "30px", 
          letterSpacing: "2px", 
          textTransform: "uppercase", 
          fontWeight: "700",
          textAlign: "center"
        }}>
          🤖 AI THREAT PREDICTION
        </h2>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #ef5350",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Main Control Panel */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          
          {/* Monitoring Control */}
          <div style={{
            background: "white",
            borderRadius: "15px",
            padding: "25px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>
              🛡️ Threat Monitoring
            </h3>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px"
            }}>
              <span style={{ fontWeight: "bold" }}>
                Status: {isMonitoring ? "🟢 Active" : "🔴 Inactive"}
              </span>
              <button
                onClick={toggleMonitoring}
                style={{
                  background: isMonitoring ? "#ef4444" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
              </button>
            </div>

            {/* Current Threat Level */}
            {threatAnalysis && (
              <div style={{
                background: `${
                  threatAnalysis.tier === 2 ? "#fee2e2" :
                  threatAnalysis.tier === 1 ? "#fef3c7" : "#f0fdf4"
                }`,
                padding: "15px",
                borderRadius: "8px",
                border: `1px solid ${
                  threatAnalysis.tier === 2 ? "#fca5a5" :
                  threatAnalysis.tier === 1 ? "#fcd34d" : "#86efac"
                }`
              }}>
                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  Threat Level: Tier {threatAnalysis.tier}
                </div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Confidence: {(threatAnalysis.confidence * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: "12px", marginTop: "8px" }}>
                  {threatAnalysis.reasons.join(", ")}
                </div>
              </div>
            )}
          </div>

          {/* Live Sensor Data */}
          <div style={{
            background: "white",
            borderRadius: "15px",
            padding: "25px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>
              📊 Live Sensor Data
            </h3>
            
            {sensorData ? (
              <div style={{ fontSize: "14px" }}>
                <div style={{ marginBottom: "10px" }}>
                  🔊 Audio: {sensorData.audio.volume.toFixed(1)}dB
                  {sensorData.audio.screamDetected && " 🚨 SCREAM"}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  📱 Movement: {sensorData.accelerometer.magnitude.toFixed(1)} m/s²
                  {sensorData.accelerometer.fallDetected && " ⬇️ FALL"}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  ❤️ Heart Rate: {sensorData.heartRate.current.toFixed(0)} bpm
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>
                  Updated: {new Date(sensorData.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div style={{ color: "#888", textAlign: "center" }}>
                No sensor data available
              </div>
            )}
          </div>

          {/* Statistics */}
          {stats && (
            <div style={{
              background: "white",
              borderRadius: "15px",
              padding: "25px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ marginBottom: "20px", color: "#333" }}>
                📈 Your Statistics
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>
                    {stats.totalIncidents}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Total Incidents</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
                    {(stats.trustScore * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Trust Score</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ef4444" }}>
                    {stats.tier2}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Emergencies</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#f59e0b" }}>
                    {stats.falseAlarms}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>False Alarms</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Scenarios */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          padding: "25px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
          marginBottom: "30px"
        }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>
            🧪 Test Scenarios
          </h3>
          
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <button
              onClick={() => simulateScenario('panic')}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer"
              }}
            >
              🚨 Panic Situation
            </button>
            <button
              onClick={() => simulateScenario('suspicious')}
              style={{
                background: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer"
              }}
            >
              👀 Suspicious Activity
            </button>
            <button
              onClick={() => simulateScenario('noise')}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer"
              }}
            >
              🔊 Loud Noise
            </button>
            <button
              onClick={() => simulateScenario('gunshot')}
              style={{
                background: "#7c2d12",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer"
              }}
            >
              💥 Gunshot Detection
            </button>
          </div>
        </div>

        {/* Recent Incidents */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          padding: "25px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>
            📋 Recent Incidents
          </h3>
          
          {incidents.length > 0 ? (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {incidents.map((incident) => (
                <div key={incident.id} style={{
                  padding: "15px",
                  marginBottom: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: incident.status === 'confirmed' ? "#fef3c7" : "#f9fafb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: "bold" }}>
                        Tier {incident.tier} - {(incident.confidence * 100).toFixed(1)}%
                      </span>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                        {new Date(incident.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: incident.status === 'confirmed' ? "#dc2626" : 
                                 incident.status === 'cancelled' ? "#10b981" : "#6b7280",
                      color: "white"
                    }}>
                      {incident.status.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    {incident.reasons.slice(0, 2).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#888", padding: "40px" }}>
              No incidents recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
