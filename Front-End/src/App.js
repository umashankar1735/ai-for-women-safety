import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoIntro from "./components/VideoIntro";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SafetyAnchor from "./pages/SafetyAnchor";
import CommunityGuardian from "./pages/CommunityGuardian";
import Gamification from "./pages/Gamification";
import ThreatPrediction from "./pages/ThreatPrediction";

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null");
}

function App() {
  // Check if intro has been shown before in this session
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("introShown");
  });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check for existing user when app loads
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleVideoEnd = () => {
    setShowIntro(false);
    // Mark intro as shown for this session
    sessionStorage.setItem("introShown", "true");
  };

  if (showIntro) {
    return <VideoIntro onVideoEnd={handleVideoEnd} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/safety-anchor" element={<SafetyAnchor />} />
        <Route path="/community-guardian" element={<CommunityGuardian />} />
        <Route path="/gamification" element={<Gamification />} />
        <Route path="/threat-prediction" element={<ThreatPrediction />} />
      </Routes>
    </Router>
  );
}

export default App;
