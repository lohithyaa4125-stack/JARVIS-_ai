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

  item.appendChild(name);
  item.appendChild(body);
  chat.appendChild(item);
  chat.scrollTop = chat.scrollHeight;
}

function speak(text) {
  if (!voiceOn || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.92;
  utterance.pitch = 0.65;

  const voices = window.speechSynthesis.getVoices();
  const maleVoice = voices.find(v =>
    /male|david|daniel|alex|aaron|fred|guy/i.test(v.name)
  );

  if (maleVoice) {
    utterance.voice = maleVoice;
  }

  window.speechSynthesis.speak(utterance);
}

function localReply(question) {
  const q = question.toLowerCase().trim();

  if (/^(hi|hello|hey|good morning|good evening)\b/.test(q)) {
    return "Hello! JARVIS Version 6 is online. What would you like to know?";
  }

  if (q.includes("your name")) {
    return "I am JARVIS, your personal assistant.";
  }

  if (q.includes("who made you")) {
    return "I am a personal assistant project created by you.";
  }

  if (q.includes("time")) {
    return "The time is " + new Date().toLocaleTimeString();
  }

  if (q.includes("date") || q.includes("today")) {
    return "Today's date is " + new Date().toLocaleDateString();
  }

  if (q.includes("thank")) {
    return "You're welcome! I'm ready to help.";
  }

  return null;
}

async function searchAnswer(question) {
  const searchURL =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" +
    encodeURIComponent(question) +
    "&format=json&origin=*";

  const searchResponse = await fetch(searchURL);
  if (!searchResponse.ok) throw new Error("Search unavailable");

  const searchData = await searchResponse.json();
  const results = searchData.query.search;

  if (!results || results.length === 0) {
    return "I couldn't find a useful result. Try asking in a different way.";
  }

  const title = results[0].title;

  const summaryURL =
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(title);

  const summaryResponse = await fetch(summaryURL);
  if (!summaryResponse.ok) throw new Error("Answer unavailable");

  const summary = await summaryResponse.json();

  if (summary.extract) {
    return summary.extract + "\n\nSource: Wikipedia — " + title;
  }

  return "I found information about " + title +
    ", but could not load its summary.";
}

async function sendMessage(text) {
  const question = (text || "").trim();
  if (!question) return;

  addMessage("YOU", question);
  promptInput.value = "";
  stateLabel.textContent = "THINKING...";

  const quickAnswer = localReply(question);

  if (quickAnswer) {
    addMessage("JARVIS", quickAnswer);
    speak(quickAnswer);
    stateLabel.textContent = "SYSTEM READY";
    return;
  }

  try {
    const answer = await searchAnswer(question);
    addMessage("JARVIS", answer);
    speak(answer);
  } catch (error) {
    const message =
      "I couldn't connect to the information service. Please check your internet connection and try again.";
    addMessage("JARVIS", message);
    speak(message);
  }

  stateLabel.textContent = "SYSTEM READY";
}

document.getElementById("send").addEventListener("click", () => {
  sendMessage(promptInput.value);
});

promptInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    sendMessage(promptInput.value);
  }
});

voiceButton.addEventListener("click", () => {
  voiceOn = !voiceOn;
  voiceButton.textContent = voiceOn ? "🔊 Voice: ON" : "🔇 Voice: OFF";

  if (!voiceOn && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

document.getElementById("clear").addEventListener("click", () => {
  chat.replaceChildren();
  addMessage("JARVIS", "Chat cleared. JARVIS Version 6 is ready!");
});

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;

  recognition.onstart = () => {
    stateLabel.textContent = "LISTENING...";
    micButton.textContent = "🔴 Listening...";
  };

  recognition.onresult = event => {
    const spokenText = event.results[0][0].transcript;
    sendMessage(spokenText);
  };

  recognition.onerror = () => {
    stateLabel.textContent = "MIC ERROR";
    micButton.textContent = "🎙️ Speak";
  };

  recognition.onend = () => {
    micButton.textContent = "🎙️ Speak";
    if (stateLabel.textContent === "LISTENING...") {
      stateLabel.textContent = "SYSTEM READY";
    }
  };
}

micButton.addEventListener("click", () => {
  if (!recognition) {
    addMessage("JARVIS", "Voice input is not supported here. Please use Chrome.");
    return;
  }

  try {
    recognition.start();
  } catch (error) {
    stateLabel.textContent = "PLEASE WAIT";
  }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
