// src/pages/Gamification.js
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null");
}

export default function Gamification() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [reactionTime, setReactionTime] = useState(null);
  const [reactionStartTime, setReactionStartTime] = useState(null);
  const [showReactionGame, setShowReactionGame] = useState(false);

  // Sample quiz data
  const quizzes = [
    {
      id: 1,
      type: "multiple-choice",
      question: "What should you do if you feel someone is following you?",
      options: ["Confront them", "Walk faster", "Head to a crowded place", "Run away"],
      correct: 2,
      points: 15
    },
    {
      id: 2,
      type: "true-false",
      question: "It's safe to share your live location publicly on social media.",
      correct: false,
      points: 10
    },
    {
      id: 3,
      type: "scenario",
      question: "You're in a cab and driver diverts route unexpectedly. What do you do?",
      options: ["Jump out immediately", "Call the police", "Share live location with trusted contact", "Argue with driver"],
      correct: 2,
      points: 20
    }
  ];

  // Sample challenges
  const challenges = [
    {
      id: 1,
      title: "Daily Check-In Streak",
      description: "Open the app daily for 7 days",
      progress: 3,
      target: 7,
      points: 50,
      icon: "📅"
    },
    {
      id: 2,
      title: "Safety Tip Sharing",
      description: "Share 3 safety tips this week",
      progress: 1,
      target: 3,
      points: 30,
      icon: "💡"
    },
    {
      id: 3,
      title: "Route Familiarity",
      description: "Save your daily routes",
      progress: 2,
      target: 5,
      points: 40,
      icon: "🗺️"
    },
    {
      id: 4,
      title: "Battery Alert Habit",
      description: "Keep phone charged above 20%",
      progress: 4,
      target: 5,
      points: 25,
      icon: "🔋"
    }
  ];

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("users") || "[]");
    
    // Add sample users with points if empty
    if (all.length === 0) {
      const sampleUsers = [
        { userId: "user1", name: "Sarah Johnson", points: 245, badges: ["🛡️", "🌟"] },
        { userId: "user2", name: "Emma Davis", points: 180, badges: ["🏆"] },
        { userId: "user3", name: "Mike Chen", points: 165, badges: ["⭐"] },
        { userId: "user4", name: "Lisa Wang", points: 140, badges: ["🥇"] },
        { userId: "user5", name: "Alex Kumar", points: 120, badges: ["🎯"] }
      ];
      localStorage.setItem("users", JSON.stringify(sampleUsers));
      setUsers([...sampleUsers].sort((a, b) => (b.points || 0) - (a.points || 0)));
    } else {
      setUsers([...all].sort((a, b) => (b.points || 0) - (a.points || 0)));
    }
  }, []);

  const completeChallenge = (challengeId) => {
    if (!me) return;
    const pointsEarned = challenges.find(c => c.id === challengeId)?.points || 10;
    
    const all = JSON.parse(localStorage.getItem("users") || "[]");
    const updated = all.map((u) => {
      if (u.userId === me.userId) {
        u.points = (u.points || 0) + pointsEarned;
        return u;
      }
      return u;
    });
    localStorage.setItem("users", JSON.stringify(updated));
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify(updated.find((u) => u.userId === me.userId))
    );
    setMe(updated.find((u) => u.userId === me.userId));
    setUsers([...updated].sort((a, b) => (b.points || 0) - (a.points || 0)));
    
    alert(`Challenge completed! You earned ${pointsEarned} points! 🎉`);
  };

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setQuizAnswer("");
    setShowQuizResult(false);
  };

  const submitQuiz = () => {
    if (!currentQuiz || !me) return;
    
    const isCorrect = currentQuiz.type === "true-false" 
      ? (quizAnswer === "true") === currentQuiz.correct
      : parseInt(quizAnswer) === currentQuiz.correct;
    
    if (isCorrect) {
      const all = JSON.parse(localStorage.getItem("users") || "[]");
      const updated = all.map((u) => {
        if (u.userId === me.userId) {
          u.points = (u.points || 0) + currentQuiz.points;
          return u;
        }
        return u;
      });
      localStorage.setItem("users", JSON.stringify(updated));
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify(updated.find((u) => u.userId === me.userId))
      );
      setMe(updated.find((u) => u.userId === me.userId));
      setUsers([...updated].sort((a, b) => (b.points || 0) - (a.points || 0)));
    }
    
    setShowQuizResult(true);
  };

  const startReactionGame = () => {
    setShowReactionGame(true);
    setReactionTime(null);
    const delay = Math.random() * 3000 + 1000; // 1-4 seconds
    setTimeout(() => {
      setReactionStartTime(Date.now());
    }, delay);
  };

  const handleReactionClick = () => {
    if (reactionStartTime) {
      const time = Date.now() - reactionStartTime;
      setReactionTime(time);
      setReactionStartTime(null);
      
      if (time < 1000) {
        completeChallenge(0); // Bonus points for fast reaction
      }
    }
  };

  const tabs = [
    { id: "leaderboard", name: "🏆 Leaderboard", icon: "🏆" },
    { id: "challenges", name: "🎯 Challenges", icon: "🎯" },
    { id: "quizzes", name: "🧠 Quizzes", icon: "🧠" },
    { id: "minigames", name: "🎮 Mini-Games", icon: "🎮" }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <Navbar />
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ 
          color: "white", 
          textAlign: "center", 
          marginBottom: "10px",
          fontSize: "2.5rem",
          fontWeight: "bold",
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
        }}>
          🌟 Safety Gamification Hub
        </h1>
        <p style={{ 
          textAlign: "center", 
          color: "rgba(255,255,255,0.9)", 
          marginBottom: "30px",
          fontSize: "1.1rem"
        }}>
          {me?.name} • {me?.points || 0} Points • Learn, Play, Stay Safe!
        </p>

        {/* Tab Navigation */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 20px",
                backgroundColor: activeTab === tab.id ? "white" : "rgba(255,255,255,0.2)",
                color: activeTab === tab.id ? "#667eea" : "white",
                border: "none",
                borderRadius: "25px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontSize: "0.9rem"
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          minHeight: "500px"
        }}>
          
          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <div>
              <h2 style={{ color: "#333", marginBottom: "25px", textAlign: "center" }}>
                🏆 Safety Champions Leaderboard
              </h2>
              <div style={{ display: "grid", gap: "15px" }}>
                {users.map((user, index) => (
                  <div
                    key={user.userId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "20px",
                      borderRadius: "12px",
                      background: user.userId === me?.userId 
                        ? "linear-gradient(135deg, #667eea, #764ba2)" 
                        : index === 0 ? "#ffd700" 
                        : index === 1 ? "#c0c0c0" 
                        : index === 2 ? "#cd7f32" 
                        : "#f8f9fa",
                      color: user.userId === me?.userId || index < 3 ? "white" : "#333",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      transform: user.userId === me?.userId ? "scale(1.02)" : "scale(1)",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <div style={{ 
                        fontSize: "1.5rem", 
                        fontWeight: "bold",
                        width: "40px",
                        textAlign: "center"
                      }}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </div>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                          {user.name} {user.userId === me?.userId && "(You)"}
                        </div>
                        <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                          {user.badges?.join(" ") || "🌟"}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                        {user.points || 0}
                      </div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                        points
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === "challenges" && (
            <div>
              <h2 style={{ color: "#333", marginBottom: "25px", textAlign: "center" }}>
                🎯 Weekly Safety Challenges
              </h2>
              <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                {challenges.map(challenge => (
                  <div
                    key={challenge.id}
                    style={{
                      padding: "25px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #ff9a9e, #fecfef)",
                      color: "white",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>
                      {challenge.icon}
                    </div>
                    <h3 style={{ marginBottom: "10px", fontSize: "1.2rem" }}>
                      {challenge.title}
                    </h3>
                    <p style={{ marginBottom: "15px", opacity: 0.9, fontSize: "0.9rem" }}>
                      {challenge.description}
                    </p>
                    <div style={{ marginBottom: "15px" }}>
                      <div style={{ 
                        background: "rgba(255,255,255,0.3)", 
                        borderRadius: "10px", 
                        height: "8px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          background: "white",
                          height: "100%",
                          width: `${(challenge.progress / challenge.target) * 100}%`,
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                      <div style={{ fontSize: "0.8rem", marginTop: "5px" }}>
                        {challenge.progress}/{challenge.target} completed
                      </div>
                    </div>
                    <button
                      onClick={() => completeChallenge(challenge.id)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "white",
                        color: "#ff9a9e",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "transform 0.2s ease"
                      }}
                      onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                      onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                    >
                      Complete Step (+{challenge.points} pts)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === "quizzes" && (
            <div>
              <h2 style={{ color: "#333", marginBottom: "25px", textAlign: "center" }}>
                🧠 Safety Knowledge Quizzes
              </h2>
              
              {!currentQuiz ? (
                <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                  {quizzes.map(quiz => (
                    <div
                      key={quiz.id}
                      style={{
                        padding: "25px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #a8edea, #fed6e3)",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "transform 0.2s ease"
                      }}
                      onClick={() => startQuiz(quiz)}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "15px" }}>
                        {quiz.type === "multiple-choice" ? "📝" : quiz.type === "true-false" ? "✅❌" : "🎭"}
                      </div>
                      <h3 style={{ marginBottom: "10px", color: "#333" }}>
                        {quiz.type === "multiple-choice" ? "Multiple Choice" : 
                         quiz.type === "true-false" ? "True/False" : "Scenario Based"}
                      </h3>
                      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "15px" }}>
                        {quiz.question.substring(0, 80)}...
                      </p>
                      <div style={{ 
                        background: "rgba(255,255,255,0.8)", 
                        padding: "8px 15px", 
                        borderRadius: "20px",
                        display: "inline-block",
                        color: "#333",
                        fontWeight: "bold",
                        fontSize: "0.9rem"
                      }}>
                        +{quiz.points} points
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  maxWidth: "600px",
                  margin: "0 auto",
                  padding: "30px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  borderRadius: "15px",
                  color: "white",
                  textAlign: "center"
                }}>
                  <h3 style={{ marginBottom: "25px", fontSize: "1.3rem" }}>
                    {currentQuiz.question}
                  </h3>
                  
                  {!showQuizResult ? (
                    <>
                      {currentQuiz.type === "true-false" ? (
                        <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginBottom: "25px" }}>
                          <button
                            onClick={() => setQuizAnswer("true")}
                            style={{
                              padding: "15px 30px",
                              background: quizAnswer === "true" ? "white" : "rgba(255,255,255,0.2)",
                              color: quizAnswer === "true" ? "#667eea" : "white",
                              border: "2px solid white",
                              borderRadius: "10px",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }}
                          >
                            ✅ True
                          </button>
                          <button
                            onClick={() => setQuizAnswer("false")}
                            style={{
                              padding: "15px 30px",
                              background: quizAnswer === "false" ? "white" : "rgba(255,255,255,0.2)",
                              color: quizAnswer === "false" ? "#667eea" : "white",
                              border: "2px solid white",
                              borderRadius: "10px",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }}
                          >
                            ❌ False
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: "10px", marginBottom: "25px" }}>
                          {currentQuiz.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => setQuizAnswer(index.toString())}
                              style={{
                                padding: "15px",
                                background: quizAnswer === index.toString() ? "white" : "rgba(255,255,255,0.2)",
                                color: quizAnswer === index.toString() ? "#667eea" : "white",
                                border: "2px solid white",
                                borderRadius: "10px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                textAlign: "left"
                              }}
                            >
                              {String.fromCharCode(97 + index)}. {option}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <button
                        onClick={submitQuiz}
                        disabled={!quizAnswer}
                        style={{
                          padding: "15px 30px",
                          background: quizAnswer ? "white" : "rgba(255,255,255,0.3)",
                          color: "#667eea",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: "bold",
                          cursor: quizAnswer ? "pointer" : "not-allowed",
                          marginRight: "10px"
                        }}
                      >
                        Submit Answer
                      </button>
                    </>
                  ) : (
                    <div>
                      <div style={{ fontSize: "3rem", marginBottom: "15px" }}>
                        {(() => {
                          const isCorrect = currentQuiz.type === "true-false" 
                            ? (quizAnswer === "true") === currentQuiz.correct
                            : parseInt(quizAnswer) === currentQuiz.correct;
                          return isCorrect ? "🎉" : "😔";
                        })()}
                      </div>
                      <h3 style={{ marginBottom: "15px" }}>
                        {(() => {
                          const isCorrect = currentQuiz.type === "true-false" 
                            ? (quizAnswer === "true") === currentQuiz.correct
                            : parseInt(quizAnswer) === currentQuiz.correct;
                          return isCorrect ? `Correct! +${currentQuiz.points} points!` : "Incorrect. Try again!";
                        })()}
                      </h3>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setCurrentQuiz(null)}
                    style={{
                      padding: "10px 20px",
                      background: "rgba(255,255,255,0.2)",
                      color: "white",
                      border: "2px solid white",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Back to Quizzes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mini-Games Tab */}
          {activeTab === "minigames" && (
            <div>
              <h2 style={{ color: "#333", marginBottom: "25px", textAlign: "center" }}>
                🎮 Safety Mini-Games
              </h2>
              <div style={{ display: "grid", gap: "25px", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))" }}>
                
                {/* Spot the Unsafe Route Game */}
                <div style={{
                  padding: "25px",
                  borderRadius: "15px",
                  background: "linear-gradient(135deg, #ff9a56, #ff6b9d)",
                  color: "white",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🗺️</div>
                  <h3 style={{ marginBottom: "15px" }}>Spot the Unsafe Route</h3>
                  <p style={{ marginBottom: "20px", opacity: 0.9 }}>
                    Choose the safer route between two options. Consider lighting, crowds, and escape routes.
                  </p>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", padding: "15px", borderRadius: "10px" }}>
                      <div style={{ marginBottom: "10px" }}>🌃 Route A</div>
                      <div style={{ fontSize: "0.8rem" }}>Dark alley, shortcut</div>
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", padding: "15px", borderRadius: "10px" }}>
                      <div style={{ marginBottom: "10px" }}>🌟 Route B</div>
                      <div style={{ fontSize: "0.8rem" }}>Well-lit main road</div>
                    </div>
                  </div>
                  <button
                    onClick={() => alert("Correct! Route B is safer. +15 points!")}
                    style={{
                      padding: "12px 25px",
                      background: "white",
                      color: "#ff6b9d",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Choose Route B (+15 pts)
                  </button>
                </div>

                {/* Emergency Reaction Timer */}
                <div style={{
                  padding: "25px",
                  borderRadius: "15px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  color: "white",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "15px" }}>⚡</div>
                  <h3 style={{ marginBottom: "15px" }}>Emergency Reaction Timer</h3>
                  <p style={{ marginBottom: "20px", opacity: 0.9 }}>
                    Test your emergency response time. Tap the SOS button as soon as you see the danger signal!
                  </p>
                  
                  {!showReactionGame ? (
                    <button
                      onClick={startReactionGame}
                      style={{
                        padding: "15px 30px",
                        background: "white",
                        color: "#667eea",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: "1.1rem"
                      }}
                    >
                      Start Reaction Test
                    </button>
                  ) : (
                    <div>
                      {!reactionStartTime && !reactionTime && (
                        <div style={{ padding: "20px" }}>
                          <div style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Get Ready...</div>
                          <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>Wait for the danger signal!</div>
                        </div>
                      )}
                      
                      {reactionStartTime && (
                        <div>
                          <div style={{ fontSize: "2rem", marginBottom: "15px", animation: "blink 0.5s infinite" }}>
                            🚨 DANGER! 🚨
                          </div>
                          <button
                            onClick={handleReactionClick}
                            style={{
                              padding: "20px 40px",
                              background: "#ff4757",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              fontWeight: "bold",
                              cursor: "pointer",
                              fontSize: "1.2rem"
                            }}
                          >
                            SOS
                          </button>
                        </div>
                      )}
                      
                      {reactionTime && (
                        <div style={{ padding: "20px" }}>
                          <div style={{ fontSize: "1.5rem", marginBottom: "10px" }}>
                            Your Time: {reactionTime}ms
                          </div>
                          <div style={{ marginBottom: "15px" }}>
                            {reactionTime < 500 ? "🏆 Excellent!" : 
                             reactionTime < 1000 ? "👍 Good!" : "⏰ Keep practicing!"}
                          </div>
                          <button
                            onClick={() => {
                              setShowReactionGame(false);
                              setReactionTime(null);
                              setReactionStartTime(null);
                            }}
                            style={{
                              padding: "10px 20px",
                              background: "rgba(255,255,255,0.2)",
                              color: "white",
                              border: "2px solid white",
                              borderRadius: "10px",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }}
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Safety Puzzle */}
                <div style={{
                  padding: "25px",
                  borderRadius: "15px",
                  background: "linear-gradient(135deg, #ffeaa7, #fab1a0)",
                  color: "#333",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🧩</div>
                  <h3 style={{ marginBottom: "15px" }}>Safety Steps Puzzle</h3>
                  <p style={{ marginBottom: "20px", opacity: 0.8 }}>
                    Arrange these safety steps in the correct order for maximum protection.
                  </p>
                  <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                    {["Lock doors", "Call trusted contact", "Activate safety anchor", "Share location"].map((step, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          background: "rgba(255,255,255,0.8)",
                          borderRadius: "8px",
                          cursor: "pointer",
                          border: "2px dashed #fab1a0"
                        }}
                      >
                        {index + 1}. {step}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => alert("Perfect order! Safety first! +20 points!")}
                    style={{
                      padding: "12px 25px",
                      background: "#333",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Check Order (+20 pts)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}