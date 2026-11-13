import React, { useState, useRef, useEffect } from 'react';

function VideoIntro({ onVideoEnd }) {
  const [videoEnded, setVideoEnded] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Show skip button after 3 seconds
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setTimeout(() => {
      onVideoEnd();
    }, 1000);
  };

  const handleSkip = () => {
    setVideoEnded(true);
    onVideoEnd();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        opacity: videoEnded ? 0 : 1,
        transition: "opacity 1s ease-out",
      }}
    >
      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        autoPlay
        muted
        onEnded={handleVideoEnd}
        onError={() => {
          console.log("Video failed to load, skipping to login");
          onVideoEnd();
        }}
      >
        <source src="/Logo_Animation_with_Rolling_Titles.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Skip Button */}
      {showSkip && !videoEnded && (
        <button
          onClick={handleSkip}
          style={{
            position: "absolute",
            top: "30px",
            right: "30px",
            padding: "12px 24px",
            background: "linear-gradient(135deg, #d946ef 0%, #be185d 100%)",
            color: "white",
            border: "none",
            borderRadius: "25px",
            fontWeight: "600",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 15px rgba(190, 24, 93, 0.3)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 182, 193, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "linear-gradient(135deg, #ec4899 0%, #db2777 100%)";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "linear-gradient(135deg, #d946ef 0%, #be185d 100%)";
            e.target.style.transform = "scale(1)";
          }}
        >
          Skip Intro →
        </button>
      )}

      {/* Loading indicator for slow connections */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#f472b6",
          fontSize: "1rem",
          fontWeight: "600",
          opacity: 0.9,
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        🛡️ Loading Women Safety Portal...
      </div>
    </div>
  );
}

export default VideoIntro;