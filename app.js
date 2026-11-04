
const chat = document.getElementById("chat");
const promptBox = document.getElementById("prompt");
const state = document.getElementById("state");
const mic = document.getElementById("mic");
const voice = document.getElementById("voice");
const send = document.getElementById("send");
const clear = document.getElementById("clear");

let listening = false;
let recognition = null;

function addMessage(sender, message) {
  const item = document.createElement("div");
  item.className = "message";

  const name = document.createElement("b");
  name.textContent = sender;

  const content = document.createElement("p");
  content.textContent = message;

  item.append(name, content);
  chat.appendChild(item);
  chat.scrollTop = chat.scrollHeight;
}

function speak(message) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "en-IN";
  utterance.pitch = 0.75;
  utterance.rate = 0.92;

  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    /male|david|daniel|alex|aaron|fred|guy/i.test(v.name)
  );

  if (preferred) utterance.voice = preferred;

  speechSynthesis.speak(utterance);
}

async function getAnswer(question) {
  const q = question.toLowerCase().trim();

  if (/^(hi|hello|hey)\b/.test(q)) {
    return "Hello! JARVIS V10 systems are online. How can I help you?";
  }

  if (q.includes("your name")) {
    return "I am JARVIS, your personal digital assistant.";
  }

  if (q.includes("time")) {
    return "The current time is " +
      new Date().toLocaleTimeString();
  }

  if (q.includes("date") || q.includes("today")) {
    return "Today's date is " +
      new Date().toLocaleDateString();
  }

  if (q.includes("how are you")) {
    return "All systems are operating normally.";
  }

  if (q.includes("thank")) {
    return "You're welcome. Always ready to assist.";
  }

  if (q.includes("tamil")) {
    return "I can try to help in Tamil. Please ask your question in Tamil.";
  }

  try {
    state.textContent = "SEARCHING KNOWLEDGE...";

    const url =
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(question);

    const response = await fetch(url);

    if (!response.ok) {
      return "I couldn't find that answer. Please try another question.";
    }

    const data = await response.json();

    if (data.extract) {
      return data.extract;
    }

    return "I couldn't find a useful result for that question.";
  } catch (error) {
    return "Knowledge connection unavailable. Please check your internet.";
  }
}

async function askJarvis() {
  const question = promptBox.value.trim();

  if (!question) return;

  promptBox.value = "";
  addMessage("YOU", question);

  state.textContent = "PROCESSING...";

  const answer = await getAnswer(question);

  addMessage("JARVIS", answer);
  speak(answer);

  state.textContent = "SYSTEM ONLINE";
}

send.addEventListener("click", askJarvis);

promptBox.addEventListener("keydown", event => {
  if (event.key === "Enter") askJarvis();
});

clear.addEventListener("click", () => {
  chat.innerHTML = "";
  state.textContent = "SYSTEM ONLINE";
});

voice.addEventListener("click", () => {
  speak("Hello. JARVIS voice system is online.");
});

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    listening = true;
    state.textContent = "LISTENING...";
  };

  recognition.onresult = event => {
    promptBox.value = event.results[0][0].transcript;
    askJarvis();
  };

  recognition.onerror = () => {
    state.textContent = "MICROPHONE ERROR";
  };

  recognition.onend = () => {
    listening = false;
    if (state.textContent === "LISTENING...") {
      state.textContent = "SYSTEM ONLINE";
    }
  };

  mic.addEventListener("click", () => {
    if (!listening) recognition.start();
  });
} else {
  mic.addEventListener("click", () => {
    addMessage("JARVIS", "Voice recognition is not supported in this browser.");
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

addMessage("JARVIS", "JARVIS V10 initialized. All systems online.");
  
