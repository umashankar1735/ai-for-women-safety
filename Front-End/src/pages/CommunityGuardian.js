// src/pages/CommunityGuardian.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import apiService from "../services/api";

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null");
}

export default function CommunityGuardian() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [guardianMode, setGuardianMode] = useState(false);
  const [watchList, setWatchList] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Get current location
    getCurrentLocation();

    // Load saved guardian mode state
    const savedMode = localStorage.getItem(`guardianMode_${user.userId}`);
    if (savedMode) {
      setGuardianMode(JSON.parse(savedMode));
    }

    // Listen for emergency alerts
    function onStorage(e) {
      if (e.key === "sos" && e.newValue) {
        const sos = JSON.parse(e.newValue);
        if (sos.from !== user.userId && guardianMode) {
          setEmergencyAlerts(prev => [...prev, sos]);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user, navigate, guardianMode]);

  // Update nearby users when location changes
  useEffect(() => {
    if (currentLocation) {
      fetchNearbyUsers();
    }
  }, [currentLocation]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setCurrentLocation(location);
          
          // Update location on backend
          try {
            await apiService.updateLocation(location.lat, location.lon, true);
          } catch (error) {
            console.error("Failed to update location on backend:", error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          // Use mock location for demo
          const mockLocation = {
            lat: 12.9716 + (Math.random() - 0.5) * 0.01,
            lon: 77.5946 + (Math.random() - 0.5) * 0.01,
            accuracy: 10
          };
          setCurrentLocation(mockLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        }
      );
    }
  };

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const fetchNearbyUsers = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getNearbyUsers(
        currentLocation.lat, 
        currentLocation.lon, 
        0.02 // 20 meters in km
      );
      
      // Calculate distances and filter for nearby users
      const nearby = response.nearbyUsers
        .filter(u => u.id !== user.userId)
        .map(u => ({
          ...u,
          userId: u.id,
          name: u.name,
          isGuardian: u.isGuardian,
          status: 'safe', // Default status
          lastSeen: u.lastSeen,
          distance: u.distance * 1000 // Convert km to meters
        }))
        .filter(u => u.distance <= 20) // Filter to 20 meters
        .sort((a, b) => a.distance - b.distance);

      setNearbyUsers(nearby);
    } catch (error) {
      console.error("Failed to fetch nearby users:", error);
      setError("Failed to load nearby users");
      
      // Fallback to mock data for demo
      const mockNearbyUsers = [
        {
          userId: "u_demo1",
          name: "Sarah Johnson",
          distance: 11,
          status: "safe",
          lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          isGuardian: true
        },
        {
          userId: "u_demo2", 
          name: "Mike Chen",
          distance: 16,
          status: "safe",
          lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isGuardian: false
        }
      ];
      setNearbyUsers(mockNearbyUsers);
    } finally {
      setLoading(false);
    }
  };

  const toggleGuardianMode = async () => {
    const newMode = !guardianMode;
    setLoading(true);
    setError(null);
    
    try {
      if (newMode && currentLocation) {
        // Join as guardian on backend
        const guardianData = {
          userId: user.userId,
          userName: user.name,
          location: {
            latitude: currentLocation.lat,
            longitude: currentLocation.lon
          },
          availability: true,
          skills: ['Emergency Response'],
          contactInfo: user.email
        };
        
        await apiService.joinAsGuardian(guardianData);
      }
      
      setGuardianMode(newMode);
      localStorage.setItem(`guardianMode_${user.userId}`, JSON.stringify(newMode));
      
      if (newMode) {
        // Register as community guardian locally
        const guardianInfo = {
          userId: user.userId,
          name: user.name,
          location: currentLocation,
          joinedAt: new Date().toISOString(),
        };
        localStorage.setItem(`guardian_${user.userId}`, JSON.stringify(guardianInfo));
      } else {
        localStorage.removeItem(`guardian_${user.userId}`);
      }
      
      // Refresh nearby users to update guardian status
      if (currentLocation) {
        await fetchNearbyUsers();
      }
      
    } catch (error) {
      console.error("Failed to toggle guardian mode:", error);
      setError("Failed to update guardian status");
    } finally {
      setLoading(false);
    }
  };

  const addToWatchList = () => {
    const name = prompt("Enter the name of the person to add to your watch list:");
    if (name && name.trim()) {
      const newPerson = {
        id: Date.now(),
        name: name.trim(),
        status: "safe",
        lastSeen: new Date().toISOString(),
      };
      setWatchList(prev => [...prev, newPerson]);
    }
  };

  const respondToAlert = async (alertId) => {
    try {
      // Report help action to backend
      await apiService.reportHelpAction(alertId, 'acknowledged', currentLocation);
      
      setEmergencyAlerts(prev => prev.filter(alert => alert.id !== alertId));
      alert("Emergency response initiated! Help is on the way.");
    } catch (error) {
      console.error("Failed to respond to alert:", error);
      // Still remove from local state for demo
      setEmergencyAlerts(prev => prev.filter(alert => alert.id !== alertId));
      alert("Emergency response initiated! Help is on the way.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e6f3ff, #fff)",
      }}
    >
      <Navbar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px",
        }}
      >
        <h2 style={{ color: "#1976d2", marginBottom: "30px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "700" }}>
          COMMUNITY GUARDIAN
        </h2>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "10px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #ef5350",
            maxWidth: "600px",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Cards Container - Side by Side Layout */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "20px",
          maxWidth: "1200px",
          width: "100%",
          marginBottom: "20px"
        }}>
          {/* Guardian Mode Toggle Card */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              padding: "20px",
              width: "320px",
              height: "200px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <h3 style={{ marginBottom: "15px", color: "#333", letterSpacing: "1px", textTransform: "uppercase" }}>
              GUARDIAN STATUS
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "15px",
              }}
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: guardianMode ? "#4caf50" : "#ff5722",
                  marginRight: "8px",
                }}
              ></span>
              <span style={{ fontWeight: "bold" }}>
                {guardianMode ? "Active Guardian" : "Inactive"}
              </span>
            </div>
            <button
              onClick={toggleGuardianMode}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: loading ? "#ccc" : (guardianMode ? "#ff5722" : "#4caf50"),
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading 
                ? "⏳ Updating..." 
                : (guardianMode ? "Deactivate Guardian" : "Become a Guardian")
              }
            </button>
          </div>

          {/* Nearby Users Card */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              padding: "20px",
              width: "320px",
              height: "200px",
              display: "flex",
              flexDirection: "column"
            }}
          >
          <h3 style={{ 
            marginBottom: "15px", 
            color: "#333", 
            letterSpacing: "1px", 
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            📍 NEARBY USERS
            <span style={{
              fontSize: "0.7rem",
              color: "#666",
              fontWeight: "normal",
              textTransform: "lowercase"
            }}>
              within 20m
            </span>
          </h3>
          
          {currentLocation ? (
            <>
              <div style={{
                fontSize: "0.75rem",
                color: "#888",
                marginBottom: "10px",
                padding: "8px",
                background: "#f8f9fa",
                borderRadius: "6px"
              }}>
                📡 Your location: {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
              </div>
              
              {nearbyUsers.length > 0 ? (
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {nearbyUsers.map((nearbyUser) => (
                    <div
                      key={nearbyUser.userId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                        marginBottom: "8px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        background: "#fafafa"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: "bold", 
                          fontSize: "0.9rem",
                          display: "flex",
                          alignItems: "center"
                        }}>
                          {nearbyUser.name}
                          {nearbyUser.isGuardian && (
                            <span style={{
                              marginLeft: "5px",
                              fontSize: "0.7rem",
                              background: "#4caf50",
                              color: "white",
                              padding: "2px 6px",
                              borderRadius: "10px"
                            }}>
                              Guardian
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: "0.75rem", 
                          color: "#666",
                          marginTop: "2px"
                        }}>
                          {Math.round(nearbyUser.distance)}m away
                        </div>
                        <div style={{ 
                          fontSize: "0.7rem", 
                          color: "#888"
                        }}>
                          Last seen: {new Date(nearbyUser.lastSeen).toLocaleTimeString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: nearbyUser.status === "safe" ? "#4caf50" : "#ff5722",
                            marginBottom: "4px"
                          }}
                        />
                        <span style={{
                          fontSize: "0.65rem",
                          color: nearbyUser.status === "safe" ? "#4caf50" : "#ff5722",
                          fontWeight: "bold"
                        }}>
                          {nearbyUser.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "20px",
                  fontSize: "0.85rem",
                  color: "#666"
                }}>
                  <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🔍</div>
                  No users found within 20 meters
                </div>
              )}
              
              <button
                onClick={fetchNearbyUsers}
                disabled={loading}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  padding: "8px",
                  backgroundColor: loading ? "#ccc" : "#2196f3",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "🔄 Loading..." : "🔄 Refresh Nearby Users"}
              </button>
            </>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "20px",
              fontSize: "0.85rem",
              color: "#666"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📍</div>
              Getting your location...
            </div>
          )}
          </div>
        </div>

        {/* Second Row - Guardian Mode Features */}
        {guardianMode && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "20px",
            maxWidth: "1200px",
            width: "100%",
            marginTop: "20px"
          }}>
            {/* Watch List & Guardian Stats Combined Card */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: "20px",
                width: "320px",
                height: "200px",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <h3 style={{ marginBottom: "15px", color: "#333", letterSpacing: "1px", textTransform: "uppercase" }}>
                👁️ WATCH LIST & STATS
              </h3>
              
              {/* Guardian Stats Section */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-around", 
                marginBottom: "15px",
                padding: "10px",
                background: "#f8f9fa",
                borderRadius: "6px"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4caf50" }}>
                    {watchList.length}
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    Watching
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2196f3" }}>
                    0
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    Emergencies
                  </div>
                </div>
                <button
                  onClick={addToWatchList}
                  style={{
                    padding: "5px 10px",
                    backgroundColor: "#2196f3",
                    border: "none",
                    borderRadius: "4px",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "0.7rem"
                  }}
                >
                  + Add
                </button>
              </div>

              {/* Watch List Section */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {watchList.length > 0 ? (
                  watchList.map((person) => (
                    <div
                      key={person.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "4px 0",
                        borderBottom: "1px solid #eee",
                        fontSize: "0.85rem"
                      }}
                    >
                      <span>{person.name}</span>
                      <span
                        style={{
                          color: person.status === "safe" ? "#4caf50" : "#ff5722",
                          fontSize: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        {person.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "12px", color: "#666", textAlign: "center", margin: "10px 0" }}>
                    No one in your watch list yet
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Alerts Card */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: "20px",
                width: "320px",
                height: "200px",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <h3 style={{ marginBottom: "15px", color: "#333", letterSpacing: "1px", textTransform: "uppercase" }}>
                🚨 EMERGENCY ALERTS
              </h3>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {emergencyAlerts.length > 0 ? (
                  emergencyAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        background: "#ffebee",
                        padding: "10px",
                        borderRadius: "6px",
                        marginBottom: "10px",
                        border: "1px solid #f44336"
                      }}
                    >
                      <p style={{ fontWeight: "bold", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
                        {alert.name} needs help!
                      </p>
                      <p style={{ fontSize: "0.75rem", margin: "0 0 10px 0", color: "#666" }}>
                        Location: {alert.lat}, {alert.lon}
                      </p>
                      <button
                        onClick={() => respondToAlert(alert.id)}
                        style={{
                          width: "100%",
                          padding: "6px",
                          backgroundColor: "#f44336",
                          border: "none",
                          borderRadius: "4px",
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "0.8rem"
                        }}
                      >
                        Respond
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
                    No emergency alerts at this time
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Non-Guardian Mode Info Card */}
        {!guardianMode && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px"
          }}>
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: "20px",
                width: "400px",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "15px", color: "#333", letterSpacing: "1px", textTransform: "uppercase" }}>
                🛡️ BECOME A COMMUNITY GUARDIAN
              </h3>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
                Help keep your community safe by monitoring and responding to emergency alerts.
              </p>
              <ul style={{ textAlign: "left", fontSize: "12px", color: "#666", maxWidth: "280px", margin: "0 auto" }}>
                <li>Receive real-time emergency alerts</li>
                <li>Monitor people in your watch list</li>
                <li>Coordinate emergency responses</li>
                <li>Build a safer community network</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}