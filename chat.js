const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

// --- Mood tracking ---
let moodHistory = JSON.parse(localStorage.getItem("moodHistory") || "[]");
function saveMood(mood) {
  const today = new Date().toLocaleDateString();
  moodHistory.push({ date: today, mood });
  if (moodHistory.length > 30) moodHistory.shift();
  localStorage.setItem("moodHistory", JSON.stringify(moodHistory));
  renderMoodChart();
}
function renderMoodChart() {
  let chart = document.getElementById("moodChart");
  if (!chart) {
    chart = document.createElement("canvas");
    chart.id = "moodChart";
    chart.style.width = "100%";
    chart.style.maxWidth = "320px";
    chart.style.margin = "12px auto";
    messages.parentElement.insertBefore(chart, messages);
  }
  const ctx = chart.getContext("2d");
  chart.height = 80;
  ctx.clearRect(0, 0, chart.width, chart.height);
  const moods = moodHistory.map(m => m.mood);
  const labels = moodHistory.map(m => m.date.split("/").slice(0,2).join("/"));
  const moodMap = { happy: 4, okay: 3, sad: 2, stressed: 1, anxious: 1, angry: 1 };
  ctx.beginPath();
  ctx.moveTo(0, 80 - (moodMap[moods[0]] || 2) * 16);
  moods.forEach((m, i) => ctx.lineTo(i * (chart.width / moods.length), 80 - (moodMap[m] || 2) * 16));
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = "10px Inter";
  ctx.fillStyle = "#9fb4d9";
  labels.forEach((l, i) => ctx.fillText(l, i * (chart.width / moods.length), 78));
}

// --- Add message to chat ---
function addMessage(text, isBot) {
  const div = document.createElement("div");
  div.className = "bubble " + (isBot ? "bot" : "user");
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// --- Send message to backend + mood detection ---
async function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;

  addMessage(msg, false);
  input.value = "";

  // Mood detection (simple keyword)
  const moodKeywords = {
    happy: ["happy", "great", "good", "awesome", "excited"],
    sad: ["sad", "down", "depressed", "unhappy", "cry"],
    stressed: ["stressed", "pressure", "overwhelmed", "tension"],
    anxious: ["anxious", "anxiety", "nervous", "worried", "panic"],
    angry: ["angry", "mad", "frustrated", "irritated"],
    okay: ["okay", "fine", "normal", "neutral"]
  };
  let detectedMood = null;
  for (const mood in moodKeywords) {
    if (moodKeywords[mood].some(w => msg.toLowerCase().includes(w))) {
      detectedMood = mood;
      break;
    }
  }
  if (detectedMood) {
    saveMood(detectedMood);
    addMessage(`📝 Mood tracked: ${detectedMood.charAt(0).toUpperCase() + detectedMood.slice(1)}`, true);
  }

  try {
    const res = await fetch("https://calmconnect-chatbot.onrender.com/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();
    addMessage(data.reply, true);

    // Suggest yoga/meditation/tips/motivation if relevant
    suggestExtra(msg, detectedMood);

  } catch (err) {
    addMessage("⚠️ Unable to reach server.", true);
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// --- Speech Synthesis (Read Aloud) ---
const ttsBtn = document.getElementById("ttsBtn");
function speakLastBotMessage() {
  const bubbles = document.querySelectorAll(".bubble.bot");
  if (bubbles.length === 0) return;
  const last = bubbles[bubbles.length - 1].textContent;
  const utter = new SpeechSynthesisUtterance(last);
  speechSynthesis.speak(utter);
}
ttsBtn.addEventListener("click", speakLastBotMessage);

// --- Speech Recognition (Microphone) ---
const micBtn = document.getElementById("micBtn");
let recognition;
let recognizing = false;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    sendMessage();
  };

  recognition.onend = () => {
    recognizing = false;
    micBtn.style.background = "";
  };

  micBtn.addEventListener("click", () => {
    if (recognizing) {
      recognition.stop();
      recognizing = false;
      micBtn.style.background = "";
    } else {
      recognition.start();
      recognizing = true;
      micBtn.style.background = "#2563eb";
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.title = "Speech recognition not supported in this browser";
}

// --- Quick start buttons ---
function quick(text) {
  input.value = text;
  sendMessage();
}

// --- Clear chat ---
function clearChat() {
  messages.innerHTML = "";
}

// --- Grounding techniques ---
function useTechnique(tech) {
  let msg = "";
  if (tech === "box_breathing") {
    msg = "Let's do 4-2-6 breathing: Inhale for 4 seconds, hold for 2, exhale for 6. Try it a few times.";
  } else if (tech === "grounding_54321") {
    msg = "Let's ground: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.";
  } else if (tech === "mini_pause") {
    msg = "Pause for 5 seconds. Breathe in... and out. Notice how your body feels.";
  }
  if (msg) addMessage(msg, true);
}

// --- Daily motivational quote ---
function showDailyQuote() {
  const quotes = [
    "You are stronger than you think.",
    "Every day is a new beginning.",
    "Small steps every day lead to big changes.",
    "You can handle whatever comes your way.",
    "Be proud of how far you’ve come."
  ];
  const today = new Date().getDate();
  addMessage("🌟 Daily Motivation: " + quotes[today % quotes.length], true);
}
showDailyQuote();

// --- Extra suggestions based on mood/message ---
function suggestExtra(msg, mood) {
  // Yoga/meditation
  if (/yoga|meditate|relax|calm|breathe|stress/i.test(msg) || mood === "stressed" || mood === "anxious") {
    addMessage("🧘‍♂️ Try 5 minutes of deep breathing or a short guided meditation. Search 'box breathing' or 'body scan meditation' on YouTube.", true);
  }
  // Motivation
  if (/motivat|inspire|energy|no energy|tired/i.test(msg) || mood === "sad" || mood === "unmotivated") {
    addMessage("💪 Remember: Progress is progress, no matter how small. You matter.", true);
  }
  // Study pressure
  if (/study|exam|test|pressure|school|college/i.test(msg)) {
    addMessage("📚 Study Tip: Take breaks, use the Pomodoro technique, and remember to breathe. You’ve got this!", true);
  }
  // Sleep hygiene
  if (/sleep|insomnia|tired|can't sleep/i.test(msg)) {
    addMessage("🛌 Sleep Tip: Avoid screens before bed, keep a consistent sleep schedule, and try relaxing music.", true);
  }
  // Anxiety
  if (/anxiety|anxious|panic|worried|nervous/i.test(msg) || mood === "anxious") {
    addMessage("😌 Anxiety Relief: Try grounding—notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.", true);
  }
  // Tension
  if (/tension|tight|body pain|ache/i.test(msg)) {
    addMessage("🧘‍♀️ Tension Relief: Try gentle neck and shoulder stretches and a few deep breaths.", true);
  }
  // Mood feedback
  if (mood) {
    addMessage("Would you like to track your mood for today? (You can type: happy, sad, okay, stressed, anxious, angry)", true);
  }
}

// --- Render mood chart on load ---

renderMoodChart();
