// src/pages/Dashboard.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import apiService from "../services/api";

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [lastSOS, setLastSOS] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null, accuracy: null });
  const [locationError, setLocationError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Get user's location
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user, navigate]);

  useEffect(() => {
    // Initialize audio recording on component mount
    initializeAudio();
    
    // Auto-start recording when component loads
    setTimeout(() => {
      startRecording();
    }, 1000); // Small delay to ensure audio is initialized

    // listen for SOS from other tabs
    function onStorage(e) {
      if (e.key === "sos" && e.newValue) {
        const sos = JSON.parse(e.newValue);
        if (sos.from !== user.userId) {
          setIncoming(sos);
          // Auto-start recording when receiving SOS (if not already recording)
          if (!isRecording) {
            startRecording();
          }
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [user, navigate]);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const startRecording = async () => {
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }

      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendSOS = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    // Auto-start recording when SOS is triggered
    if (!isRecording) {
      startRecording();
    }

    try {
      const sosData = {
        location: {
          latitude: location.lat || 12.9716,
          longitude: location.lon || 77.5946,
          accuracy: location.accuracy || 10
        },
        message: "Emergency SOS - Need immediate help!",
        emergencyContacts: [], // Could be populated from user profile
        audioBlob: audioBlob // Optional audio attachment
      };

      // Send SOS to backend
      const response = await apiService.sendSOS(
        sosData.location,
        sosData.message,
        sosData.emergencyContacts
      );

      // Store locally as well for immediate UI update
      const sos = {
        id: response.id || Date.now(),
        from: user.userId,
        name: user.name,
        lat: sosData.location.latitude,
        lon: sosData.location.longitude,
        time: new Date().toISOString(),
      };
      
      localStorage.setItem("sos", JSON.stringify(sos));
      localStorage.setItem(`lastSOS_${user.userId}`, JSON.stringify(sos));
      setLastSOS(sos);
      
    } catch (error) {
      console.error("Failed to send SOS:", error);
      setError("Failed to send SOS. Please try again.");
      
      // Fallback to local storage for demo
      const sos = {
        id: Date.now(),
        from: user.userId,
        name: user.name,
        lat: location.lat || 12.9716,
        lon: location.lon || 77.5946,
        time: new Date().toISOString(),
      };
      localStorage.setItem("sos", JSON.stringify(sos));
      localStorage.setItem(`lastSOS_${user.userId}`, JSON.stringify(sos));
      setLastSOS(sos);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f3e8ff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "200px",
          height: "200px",
          background: "linear-gradient(45deg, rgba(217, 70, 239, 0.08), rgba(190, 24, 93, 0.04))",
          borderRadius: "50%",
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "15%",
          width: "150px",
          height: "150px",
          background: "linear-gradient(45deg, rgba(236, 72, 153, 0.06), rgba(219, 39, 119, 0.02))",
          borderRadius: "50%",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />
      
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .slide-up { animation: slideUp 0.6s ease-out; }
          .card-hover:hover { transform: translateY(-5px); }
        `}
      </style>

      <Navbar />
      
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Welcome Header */}
        <div className="slide-up" style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{
              color: "#374151",
              fontSize: "2.5rem",
              fontWeight: "700",
              margin: "0 0 10px 0",
              textShadow: "0 2px 4px rgba(0,0,0,0.05)",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            WELCOME BACK, {user?.name?.toUpperCase()}
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "1.1rem",
              margin: 0,
              textShadow: "0 1px 2px rgba(0,0,0,0.03)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            YOUR SAFETY DASHBOARD IS READY
          </p>
        </div>

        {/* Main Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "25px",
            width: "100%",
            marginBottom: "30px",
          }}
        >
          {/* Location Status Card */}
          <div
            className="slide-up card-hover"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))",
              borderRadius: "20px",
              padding: "25px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(226,232,240,0.5)",
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  background: "linear-gradient(135deg, #538272ff, #5b8475ff)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "15px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                }}
              >
                <span style={{ fontSize: "20px", color: "white" }}>📍</span>
              </div>
              <div>
                <h3 style={{ margin: 0, color: "#4b5563", fontSize: "1.2rem", fontWeight: "600" }}>
                  Live Location
                </h3>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.9rem" }}>
                  {location.lat ? "Tracking active" : "Getting location..."}
                </p>
              </div>
            </div>
            
            {location.lat ? (
              <>
                {/* Map Container */}
                <div 
                  style={{ 
                    background: "#f1f5f9", 
                    borderRadius: "12px", 
                    padding: "15px", 
                    marginBottom: "15px",
                    minHeight: "200px",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lon-0.01},${location.lat-0.01},${location.lon+0.01},${location.lat+0.01}&layer=mapnik&marker=${location.lat},${location.lon}`}
                    style={{
                      width: "100%",
                      height: "180px",
                      border: "none",
                      borderRadius: "8px",
                    }}
                    title="Current Location Map"
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "20px",
                      right: "20px",
                      background: "rgba(255,255,255,0.9)",
                      borderRadius: "6px",
                      padding: "5px 8px",
                      fontSize: "0.8rem",
                      color: "#374151",
                      fontWeight: "500",
                    }}
                  >
                    Live
                  </div>
                </div>
                
                {/* Location Details */}
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#6b7280", fontSize: "0.9rem", fontWeight: "500" }}>Latitude:</span>
                    <span style={{ color: "#374151", fontSize: "0.9rem", fontFamily: "monospace" }}>
                      {location.lat.toFixed(6)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#6b7280", fontSize: "0.9rem", fontWeight: "500" }}>Longitude:</span>
                    <span style={{ color: "#374151", fontSize: "0.9rem", fontFamily: "monospace" }}>
                      {location.lon.toFixed(6)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280", fontSize: "0.9rem", fontWeight: "500" }}>Accuracy:</span>
                    <span style={{ color: "#669686ff", fontSize: "0.9rem", fontWeight: "600" }}>
                      ±{Math.round(location.accuracy)}m
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                {locationError ? (
                  <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                    ⚠️ {locationError}
                  </p>
                ) : (
                  <div style={{ color: "#64748b" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        border: "3px solid #e2e8f0",
                        borderTop: "3px solid #3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 10px",
                      }}
                    />
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>Acquiring location...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audio Recording Card with SOS Button */}
          <div
            className="slide-up card-hover"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))",
              borderRadius: "20px",
              padding: "25px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(226,232,240,0.5)",
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  background: isRecording 
                    ? "linear-gradient(135deg, #f87171, #fca5a5)" 
                    : "linear-gradient(135deg, #818cf8, #a5b4fc)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "15px",
                  boxShadow: isRecording 
                    ? "0 4px 12px rgba(248, 113, 113, 0.25)" 
                    : "0 4px 12px rgba(129, 140, 248, 0.25)",
                  animation: isRecording ? "pulse 2s infinite" : "none",
                }}
              >
                <span style={{ fontSize: "20px", color: "white" }}>
                  {isRecording ? "🔴" : "🎤"}
                </span>
              </div>
              <div>
                <h3 style={{ margin: 0, color: "#4b5563", fontSize: "1.2rem", fontWeight: "600" }}>
                  Auto Audio Recording
                </h3>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.9rem" }}>
                  {isRecording ? "Recording automatically" : "Initializing auto-record..."}
                </p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "15px", marginBottom: "20px" }}>
              {isRecording ? (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      color: "#f87171",
                      marginBottom: "10px",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatTime(recordingTime)}
                  </div>
                  <p style={{ margin: "0 0 10px 0", color: "#9ca3af", fontSize: "0.9rem" }}>
                    🔴 Auto-recording in progress
                  </p>
                  <button
                    onClick={stopRecording}
                    style={{
                      background: "linear-gradient(135deg, #f87171, #fca5a5)",
                      border: "none",
                      borderRadius: "10px",
                      color: "white",
                      padding: "8px 16px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(248, 113, 113, 0.25)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Stop Recording
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: "0 0 15px 0", color: "#9ca3af", fontSize: "0.9rem" }}>
                    🎤 Auto-recording will start automatically
                  </p>
                  <button
                    onClick={startRecording}
                    style={{
                      background: "linear-gradient(135deg, #818cf8, #a5b4fc)",
                      border: "none",
                      borderRadius: "10px",
                      color: "white",
                      padding: "12px 24px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(129, 140, 248, 0.25)",
                      transition: "all 0.2s ease",
                      width: "100%",
                    }}
                  >
                    Manual Start Recording
                  </button>
                  {audioBlob && (
                    <p style={{ margin: "10px 0 0 0", color: "#729b8eff", fontSize: "0.9rem" }}>
                      ✅ Last recording saved
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Emergency SOS Button - Now inside Audio Recording Card */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={sendSOS}
                disabled={loading}
                style={{
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  border: "none",
                  background: loading 
                    ? "linear-gradient(135deg, #9ca3af, #d1d5db)" 
                    : "linear-gradient(135deg, #f87171, #fca5a5)",
                  color: "white",
                  fontSize: "2rem",
                  fontWeight: "900",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading 
                    ? "0 10px 25px rgba(156, 163, 175, 0.3)" 
                    : "0 10px 25px rgba(248, 113, 113, 0.3), 0 0 0 0 rgba(248, 113, 113, 0.4)",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 15px 30px rgba(248, 113, 113, 0.4), 0 0 0 15px rgba(248, 113, 113, 0.15)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 10px 25px rgba(248, 113, 113, 0.3), 0 0 0 0 rgba(248, 113, 113, 0.4)";
                  }
                }}
              >
                <div style={{ position: "relative", zIndex: 2 }}>
                  {loading ? "⏳" : "🆘"}
                  <div style={{ fontSize: "0.8rem", fontWeight: "600", marginTop: "3px" }}>
                    {loading ? "SENDING..." : "EMERGENCY"}
                  </div>
                </div>
              </button>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "0.9rem",
                  margin: "15px 0 0 0",
                  textShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                Press for immediate emergency assistance
              </p>
              {error && (
                <p style={{
                  color: "#f87171",
                  fontSize: "0.8rem",
                  margin: "10px 0 0 0",
                  background: "rgba(248, 113, 113, 0.1)",
                  padding: "8px",
                  borderRadius: "6px"
                }}>
                  ⚠️ {error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            width: "100%",
          }}
        >
          {/* Last SOS Card */}
          {lastSOS && (
            <div
              className="slide-up card-hover"
              style={{
                background: "linear-gradient(135deg, rgba(97, 136, 123, 0.9), rgba(113, 171, 150, 0.8))",
                borderRadius: "15px",
                padding: "20px",
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.2)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "24px", marginRight: "10px" }}>✅</span>
                <h4 style={{ margin: 0, color: "white", fontSize: "1.1rem", fontWeight: "600" }}>
                  Last SOS Sent
                </h4>
              </div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "0.9rem" }}>
                <strong>{new Date(lastSOS.time).toLocaleString()}</strong>
              </p>
            </div>
          )}

          {/* Incoming Alert Card */}
          {incoming && (
            <div
              className="slide-up card-hover"
              style={{
                background: "linear-gradient(135deg, rgba(248, 113, 113, 0.9), rgba(252, 165, 165, 0.8))",
                borderRadius: "15px",
                padding: "20px",
                boxShadow: "0 8px 25px rgba(248, 113, 113, 0.25)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                transition: "all 0.3s ease",
                animation: "pulse 2s infinite",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "24px", marginRight: "10px" }}>🚨</span>
                <h4 style={{ margin: 0, color: "white", fontSize: "1.1rem", fontWeight: "600" }}>
                  Emergency Alert
                </h4>
              </div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "0.9rem" }}>
                <strong>{incoming.name}</strong> needs help!
              </p>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
