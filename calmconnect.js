// calmconnect.js (FINAL FIXED VERSION)
const fetch = require("node-fetch");   // 👉 REQUIRED for keep-alive
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
// ------------------ UPDATE CORS HERE ------------------
app.use(cors({ origin: "*" }));  // 👉 Allow Netlify to call your backend
// 

// Allow frontend to call backend
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Serve all frontend files (chat.html, index.js, CSS)
app.use(express.static(__dirname));

// Load dataset
let dataset = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, "expanded_dataset.json"), "utf8");
  dataset = JSON.parse(raw);
  console.log("✔ Loaded expanded_dataset.json");
} catch (err) {
  console.error("❌ Failed to load expanded_dataset.json:", err.message);
}

// Helper functions
function normalize(txt) {
  return txt.toLowerCase().trim();
}
function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// MAIN ENDPOINT
app.post("/message", (req, res) => {
  const message = req.body.message || "";
  const sessionId = req.body.session_id || "default";

  const low = normalize(message);

  // Greetings
  if (low.startsWith("hi") || low.startsWith("hello") || low.startsWith("hey")) {
    return res.json({
      reply: choose([
        "Hey — how can I help you today?",
        "Hello! What are you feeling right now?"
      ])
    });
  }

  // Headache
  if (low.includes("headache")) {
    return res.json({
      reply: "When did the headache start, and is it mild, moderate, or severe?",
      ask_severity: true,
    });
  }

  // Mild-Mod-Severe responses
  if (low === "mild") {
    return res.json({
      reply:
        "A mild headache can come from stress, dehydration, long screen time, or lack of sleep. Try drinking some water, resting your eyes, and taking a short break. How long have you had it?",
    });
  }

  if (low === "moderate") {
    return res.json({
      reply:
        "A moderate headache may need rest, hydration, and reduced screen exposure. A cold or warm compress can help. Have you also felt nausea, light sensitivity, or stress?",
    });
  }

  if (low === "severe") {
    return res.json({
      reply:
        "A severe headache may require urgent medical evaluation. If you also notice blurry vision, weakness, dizziness, or sudden intense pain, please seek medical care immediately.",
    });
  }

  // Anxiety
  if (low.includes("anxiety") || low.includes("anxious")) {
    return res.json({
      reply:
        "You're safe right now. Let's calm your body for a moment. Try this: inhale for 4 seconds, hold for 2, exhale for 6. What triggered your anxiety?",
    });
  }

  // Chest Pain
  if (low.includes("chest pain")) {
    return res.json({
      reply:
        "Chest pain can be serious. If it's crushing, spreading to your arm/jaw, or comes with sweating or shortness of breath, please get medical help immediately.",
      emergency: true,
    });
  }

  // GENERAL TEMPLATE MATCHING
  for (const item of dataset) {
  const kw = normalize(item.user);
  if (low.includes(kw)) {
    return res.json({ reply: item.bot });
  }
}

  // DEFAULT fallback (ChatGPT-style)
  return res.json({
    reply:
      "I’m here with you. Can you describe your symptoms or what you're feeling in a bit more detail?",
  });
});

// HEALTH CHECK endpoint
app.get("/status", (req, res) => {
  res.json({ ok: true, version: "CalmConnect v1" });
});
// --- Daily Motivational Quote Endpoint ---
app.get("/daily-quote", (req, res) => {
  const quotes = [
    "You are stronger than you think.",
    "Every day is a new beginning.",
    "Small steps every day lead to big changes.",
    "You can handle whatever comes your way.",
    "Be proud of how far you’ve come."
  ];
  const today = new Date().getDate();
  res.json({ quote: quotes[today % quotes.length] });
});

// --- Tips Endpoint ---
app.get("/tips", (req, res) => {
  res.json({
    stress: "Take deep breaths, stretch, and take a short walk. Break tasks into small steps.",
    anxiety: "Try grounding: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
    motivation: "Remember your goals, reward yourself for small wins, and keep a gratitude journal.",
    study: "Use the Pomodoro technique, take regular breaks, and review with friends.",
    sleep: "Keep a consistent sleep schedule, avoid screens before bed, and try relaxing music."
  });
});

// --- Mood Tracking Endpoints (in-memory for demo) ---
let moodLog = []; // This will reset if server restarts

app.post("/mood", (req, res) => {
  const { mood, date } = req.body;
  if (!mood || !date) return res.status(400).json({ ok: false, error: "Mood and date required" });
  moodLog.push({ mood, date });
  res.json({ ok: true });
});

app.get("/mood", (req, res) => {
  res.json({ moodLog });
});
// --- Keep Render Server Alive ---
setInterval(() => {
  fetch("https://calmconnect-chatbot.onrender.com/status")
    .then(() => console.log("Pinged self to stay awake"))
    .catch(() => {});
}, 180000); // every 3 minutes
// Start server
const PORT = process.env.PORT;
app.listen(PORT, () =>
  console.log(`CalmConnect server running on port ${PORT}`)
);





