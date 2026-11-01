const chat = document.getElementById("chat");
const promptInput = document.getElementById("prompt");
const stateLabel = document.getElementById("state");
const micButton = document.getElementById("mic");
const voiceButton = document.getElementById("voice");
let voiceOn = true;
let recognition = null;

function addMessage(who, text) {
  const item = document.createElement("div");
  item.className = "message " + (who === "YOU" ? "user" : "bot");
  const name = document.createElement("b");
  name.textContent = who;
  const body = document.createElement("p");
  body.textContent = text;
  item.append(name, body);
  chat.appendChild(item);
  chat.scrollTop = chat.scrollHeight;
}
function speak(text) {
  if (!voiceOn || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const maleLike = voices.find(v => /male|david|mark|daniel/i.test(v.name));
  if (maleLike) utterance.voice = maleLike;
  window.speechSynthesis.speak(utterance);
}
function localReply(raw) {
  const q = raw.toLowerCase().trim();
  if (/^(hi|hello|hey)\b/.test(q)) return "Hello! How can I help you today?";
  if (q.includes("your name") || q.includes("who are you")) return "I am JARVIS, your personal assistant prototype.";
  if (q.includes("time")) return "The time on your device is " + new Date().toLocaleTimeString();
  if (q.includes("date") || q.includes("today")) return "Today's date is " + new Date().toLocaleDateString();
  if (q.includes("thank")) return "You're welcome. Always happy to help.";
  if (q.includes("tamil")) return "வணக்கம்! நான் JARVIS. உங்களுக்கு எப்படி உதவ வேண்டும்?";
  if (q.includes("help")) return "I can greet you, tell the date and time, speak replies, and open a web search. My advanced AI brain is not connected yet.";
  return "I am currently running in basic offline mode, so I do not know that answer yet. Use the Search button below to look it up, or we can connect a secure AI service in a later version.";
}
function sendMessage(text) {
  const value = (text || "").trim();
  if (!value) return;
  addMessage("YOU", value);
  promptInput.value = "";
  stateLabel.textContent = "PROCESSING";
  const reply = localReply(value);
  setTimeout(() => {
    addMessage("JARVIS", reply);
    speak(reply);
    stateLabel.textContent = "READY WHEN YOU ARE";
  }, 250);
}
document.getElementById("send").addEventListener("click", () => sendMessage(promptInput.value));
promptInput.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(promptInput.value); });
voiceButton.addEventListener("click", () => {
  voiceOn = !voiceOn;
  voiceButton.textContent = voiceOn ? "🔊 Voice: ON" : "🔇 Voice: OFF";
  if (!voiceOn && "speechSynthesis" in window) window.speechSynthesis.cancel();
});
document.getElementById("clear").addEventListener("click", () => {
  chat.replaceChildren();
  addMessage("JARVIS", "Chat cleared. I am ready.");
});
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.onstart = () => { stateLabel.textContent = "LISTENING..."; micButton.textContent = "🔴 Listening"; };
  recognition.onresult = e => sendMessage(e.results[0][0].transcript);
  recognition.onerror = () => { stateLabel.textContent = "MIC ERROR — CHECK PERMISSION"; };
  recognition.onend = () => { micButton.innerHTML = "🎙️ <span>Speak</span>"; if (stateLabel.textContent === "LISTENING...") stateLabel.textContent = "READY WHEN YOU ARE"; };
} else {
  micButton.title = "Speech recognition is not supported by this browser. Try Chrome.";
}
micButton.addEventListener("click", () => {
  if (!recognition) {
    addMessage("JARVIS", "Voice input is not supported in this browser. Please try Chrome and allow microphone permission.");
    return;
  }
  try { recognition.start(); } catch (_) { stateLabel.textContent = "PLEASE WAIT"; }
});

// PWA service worker: works on HTTPS hosting or localhost.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
