// src/components/Navbar.js
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../logo.svg";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    sessionStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <>
      <style>
        {`
          @keyframes logoSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes logoPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          .logo-hover:hover {
            animation: logoPulse 0.6s ease-in-out;
          }
        `}
      </style>
      <div
        style={{
          background: "linear-gradient(135deg, #d946ef 0%, #be185d 100%)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          color: "white",
          fontWeight: "bold",
          boxShadow: "0 4px 20px rgba(190, 24, 93, 0.3)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 182, 193, 0.2)",
        }}
      >
      {/* Left side: Logo + App name */}
      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
        <img
          src={logo}
          alt="AI Guardian Logo"
          className="logo-hover"
          style={{ 
            width: "32px", 
            height: "32px", 
            marginRight: "12px",
            filter: "brightness(0) invert(1)", // Make SVG white
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
        />
        <h2 style={{ 
          margin: 0, 
          fontSize: "20px",
          background: "linear-gradient(90deg, #ffffff, #fce7f3)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "1px"
        }}>
          🛡️ AI Guardian
        </h2>
      </div>

      {/* Center: Nav links */}
      <div
        style={{
          display: "flex",
          gap: "30px",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <NavItem
          to="/dashboard"
          label="Dashboard"
          active={location.pathname === "/dashboard"}
        />
        <NavItem
          to="/safety-anchor"
          label="Safety Anchor"
          active={location.pathname === "/safety-anchor"}
        />
        <NavItem
          to="/community-guardian"
          label="Community Guardian"
          active={location.pathname === "/community-guardian"}
        />
        <NavItem
          to="/threat-prediction"
          label="AI Threat Prediction"
          active={location.pathname === "/threat-prediction"}
        />
        <NavItem
          to="/gamification"
          label="Gamification"
          active={location.pathname === "/gamification"}
        />
      </div>

      {/* Right side: Logout button */}
      <div style={{ flex: 1, textAlign: "right" }}>
        <button
          onClick={logout}
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            color: "#be185d",
            border: "2px solid rgba(255, 182, 193, 0.5)",
            padding: "8px 16px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 1)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Logout
        </button>
      </div>
      </div>
    </>
  );
}

function NavItem({ to, label, active }) {
  return (
    <Link
      to={to}
      style={{
        color: "white",
        textDecoration: "none",
        fontWeight: active ? "bold" : "500",
        fontSize: "16px",
        padding: "6px 12px",
        borderRadius: "6px",
        background: active ? "rgba(255,255,255,0.2)" : "transparent",
        transition: "all 0.2s ease",
        display: "inline-block",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {label}
    </Link>
  );
}
