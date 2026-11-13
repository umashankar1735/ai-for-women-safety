// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";
import logo from "../logo.svg";

function Login() {
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!aadhaar || !otp) {
      setError("Enter Aadhaar and OTP");
      return;
    }

    setLoading(true);
    setError(null);

    // Get user's current location during registration
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const userLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };

            // Try backend authentication first
            try {
              const authData = {
                email: `${aadhaar}@aadhaar.gov.in`, // Convert Aadhaar to email format for demo
                password: otp, // Use OTP as password for demo
                name: displayName || "User-" + aadhaar.slice(-4),
                aadhaar,
                location: userLocation
              };

              // Try login first, if fails then register
              let response;
              try {
                response = await apiService.login(authData.email, authData.password);
              } catch (loginError) {
                // If login fails, try registration
                response = await apiService.register(authData);
              }

              // Store user data with token
              const user = {
                userId: response.user?.id || response.id || "u_" + Math.random().toString(36).slice(2, 8),
                name: response.user?.name || authData.name,
                email: authData.email,
                aadhaar,
                token: response.token,
                points: response.user?.safetyScore || 0,
                guardians: ["guardian@example.com"],
                registrationLocation: userLocation,
                registeredAt: new Date().toISOString(),
                safetyAnchorActive: false,
                lastSafetyUpdate: null
              };

              sessionStorage.setItem("currentUser", JSON.stringify(user));
              
              // Also store in localStorage for demo compatibility
              const users = JSON.parse(localStorage.getItem("users") || "[]");
              const deduped = users.filter((u) => u.aadhaar !== aadhaar);
              deduped.push(user);
              localStorage.setItem("users", JSON.stringify(deduped));

              // Send registration confirmation email
              sendRegistrationEmail(user);
              
              navigate("/dashboard");

            } catch (apiError) {
              console.error("Backend auth failed, falling back to local:", apiError);
              setError("Backend connection failed. Using offline mode.");
              
              // Fallback to local storage authentication
              const userId = "u_" + Math.random().toString(36).slice(2, 8);
              const user = {
                userId,
                name: displayName || "User-" + aadhaar.slice(-4),
                aadhaar,
                points: 0,
                guardians: ["guardian@example.com"],
                registrationLocation: userLocation,
                registeredAt: new Date().toISOString(),
                safetyAnchorActive: false,
                lastSafetyUpdate: null
              };

              const users = JSON.parse(localStorage.getItem("users") || "[]");
              const deduped = users.filter((u) => u.aadhaar !== aadhaar);
              deduped.push(user);
              localStorage.setItem("users", JSON.stringify(deduped));

              sessionStorage.setItem("currentUser", JSON.stringify(user));
              
              // Send registration confirmation email
              sendRegistrationEmail(user);
              
              navigate("/dashboard");
            }
          } catch (error) {
            console.error("Authentication error:", error);
            setError("Authentication failed. Please try again.");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setLoading(false);
          setError("Location access is required for safety features. Please enable location services.");
          console.error("Location error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLoading(false);
      setError("Geolocation is not supported by this browser. Safety features may be limited.");
    }
  };

  const sendRegistrationEmail = (user) => {
    const emailContent = {
      to: user.guardians,
      subject: "Women Safety App - User Registration Confirmation",
      timestamp: new Date().toISOString(),
      user: user.name,
      location: user.registrationLocation,
      message: "User has successfully registered for Women Safety App with location tracking enabled."
    };

    // Store email log for demo purposes
    const emailLogs = JSON.parse(localStorage.getItem("emailLogs") || "[]");
    emailLogs.push({
      id: Date.now(),
      type: "registration",
      ...emailContent
    });
    localStorage.setItem("emailLogs", JSON.stringify(emailLogs));
    
    console.log("Registration email sent:", emailContent);
  };

  return (
    <>
      <style>
        {`
          @keyframes logoSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes floatIn {
            0% { 
              opacity: 0;
              transform: translateY(40px) scale(0.95);
              filter: blur(4px);
            }
            50% { 
              opacity: 0.8;
              transform: translateY(10px) scale(0.98);
              filter: blur(2px);
            }
            100% { 
              opacity: 1;
              transform: translateY(0px) scale(1);
              filter: blur(0px);
            }
          }
          
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>
      <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: "url('/women-safety-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Static overlay for better contrast */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 1,
        }}
      />
      
      {/* Main login card - enhanced design */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          padding: "35px 25px 30px 25px",
          borderRadius: "20px",
          width: "300px",
          maxWidth: "90vw",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          border: "1px solid rgba(139, 69, 110, 0.2)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 25px rgba(139, 69, 110, 0.2)",
          animation: "floatIn 1.2s ease-out",
          transition: "all 0.3s ease",
          backdropFilter: "blur(10px)",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Logo/Icon Section */}
        <div style={{
          width: "70px",
          height: "70px",
          background: "linear-gradient(135deg, #8b456e 0%, #be185d 100%)",
          borderRadius: "50%",
          margin: "0 auto 15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 15px rgba(139, 69, 110, 0.3)",
          overflow: "hidden"
        }}>
          <img
            src={logo}
            alt="AI Guardian Logo"
            style={{
              width: "40px",
              height: "40px",
              filter: "brightness(0) invert(1)",
              animation: "logoSpin 10s linear infinite"
            }}
          />
        </div>

        <h2 style={{ 
          marginBottom: "5px", 
          color: "#2d3748", 
          fontWeight: "700", 
          fontSize: "1.4rem", 
          letterSpacing: "1px", 
          lineHeight: "1.3", 
          fontFamily: "'Arial Black', sans-serif"
        }}>
          AI GUARDIAN
        </h2>
        <p style={{ 
          marginBottom: "25px", 
          color: "#8b456e", 
          fontSize: "0.85rem", 
          fontWeight: "600", 
          letterSpacing: "0.5px", 
          lineHeight: "1.4"
        }}>
          Secure Access Portal
        </p>
        
        <input
          placeholder="Display Name (as per Aadhaar)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = "#8b456e";
            e.target.style.backgroundColor = "#ffffff";
            e.target.style.boxShadow = "0 0 0 3px rgba(139, 69, 110, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(139, 69, 110, 0.1)";
            e.target.style.backgroundColor = "#f8f9fa";
            e.target.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.05)";
          }}
        />
        <input
          placeholder="Aadhaar Number (Mock)"
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value)}
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = "#8b456e";
            e.target.style.backgroundColor = "#ffffff";
            e.target.style.boxShadow = "0 0 0 3px rgba(139, 69, 110, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(139, 69, 110, 0.1)";
            e.target.style.backgroundColor = "#f8f9fa";
            e.target.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.05)";
          }}
        />
        <input
          placeholder="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = "#8b456e";
            e.target.style.backgroundColor = "#ffffff";
            e.target.style.boxShadow = "0 0 0 3px rgba(139, 69, 110, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(139, 69, 110, 0.1)";
            e.target.style.backgroundColor = "#f8f9fa";
            e.target.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.05)";
          }}
        />
        
        {/* Error Message */}
        {error && (
          <div style={{
            background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "15px",
            border: "1px solid #fecaca",
            fontSize: "0.85rem",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}
        
        <button 
          onClick={handleLogin} 
          disabled={loading}
          style={{
            ...buttonStyle,
            background: loading 
              ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)" 
              : "linear-gradient(135deg, #8b456e 0%, #be185d 100%)",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.boxShadow = "0 8px 25px rgba(139, 69, 110, 0.5)";
              e.target.style.background = "linear-gradient(135deg, #be185d 0%, #8b456e 100%)";
              e.target.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.boxShadow = "0 6px 20px rgba(139, 69, 110, 0.4)";
              e.target.style.background = "linear-gradient(135deg, #8b456e 0%, #be185d 100%)";
              e.target.style.transform = "translateY(0)";
            }
          }}
        >
          {loading ? "⏳ AUTHENTICATING..." : "🔐 SECURE LOGIN"}
        </button>
        
        <div style={{
          marginTop: "20px",
          padding: "12px",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          borderRadius: "10px",
          border: "1px solid rgba(139, 69, 110, 0.1)"
        }}>
          <p style={{ 
            fontSize: "0.7rem", 
            color: "#64748b", 
            margin: "0 0 5px 0",
            fontWeight: "500"
          }}>
            🔒 Your safety is our priority
          </p>
          <p style={{ 
            fontSize: "0.65rem", 
            color: "#94a3b8", 
            margin: "0",
            lineHeight: "1.3"
          }}>
            All data is encrypted and securely stored
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  margin: "8px 0",
  borderRadius: "10px",
  border: "2px solid rgba(139, 69, 110, 0.1)",
  outline: "none",
  fontSize: "0.9rem",
  fontWeight: "500",
  color: "#2d3748",
  transition: "all 0.3s ease",
  backgroundColor: "#f8f9fa",
  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
  letterSpacing: "0.5px",
  fontFamily: "'Inter', sans-serif",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "14px 20px",
  marginTop: "20px",
  border: "none",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #8b456e 0%, #be185d 100%)",
  color: "white",
  fontWeight: "700",
  fontSize: "1rem",
  cursor: "pointer",
  transition: "all 0.3s ease",
  boxShadow: "0 6px 20px rgba(139, 69, 110, 0.4)",
  letterSpacing: "1px",
  textTransform: "uppercase",
  fontFamily: "'Inter', sans-serif",
  transform: "translateY(0)",
  boxSizing: "border-box",
};

export default Login;
