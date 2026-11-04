
const chat = document.getElementById("chat");
const promptBox = document.getElementById("prompt");
const state = document.getElementById("state");
const mic = document.getElementById("mic");
const voice = document.getElementById("voice");
const send = document.getElementById("send");
const clear = document.getElementById("clear");

let busy = false;
let listening = false;

const history = [
  {
    role: "system",
    content:
      "You are JARVIS, a helpful and intelligent personal AI assistant. " +
      "Answer naturally like a conversational AI. Understand English and Tamil. " +
      "Give clear, friendly, accurate answers. Never claim to control a device " +
      "or access information you do not actually have."
  }
];

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
  const isTamil = /[\u0B80-\u0BFF]/.test(message);

  utterance.lang = isTamil ? "ta-IN" : "en-IN";
  utterance.pitch = 0.8;
  utterance.rate = 0.95;

  const voices = speechSynthesis.getVoices();

  const preferred = voices.find(v =>
    /male|david|daniel|alex|aaron|fred|guy/i.test(v.name)
  );

  if (preferred) utterance.voice = preferred;

  speechSynthesis.speak(utterance);
}

async function askJarvis() {
  const question = promptBox.value.trim();

  if (!question || busy) return;

  promptBox.value = "";
  addMessage("YOU", question);

  history.push({
    role: "user",
    content: question
  });

  busy = true;
  send.disabled = true;
  state.textContent = "JARVIS THINKING...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: history
      })
    });

    if (!response.ok) {
      throw new Error("AI server returned " + response.status);
    }

    const data = await response.json();
    const answer = data.reply;

    if (!answer || typeof answer !== "string") {
      throw new Error("Invalid AI response");
    }

    history.push({
      role: "assistant",
      content: answer
    });

    addMessage("JARVIS", answer);
    speak(answer);

    state.textContent = "SYSTEM ONLINE";

  } catch (error) {
    console.error(error);

    const message =
      "My AI brain is not connected yet. Please check the secure AI server setup.";

    addMessage("JARVIS", message);
    state.textContent = "CONNECTION REQUIRED";

    history.pop();

  } finally {
    busy = false;
    send.disabled = false;
  }
}

send.addEventListener("click", askJarvis);

promptBox.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    askJarvis();
  }
});

clear.addEventListener("click", () => {
  history.splice(1);
  chat.innerHTML = "";
  speechSynthesis.cancel();
  addMessage("JARVIS", "Conversation cleared. Ready for a new session.");
  state.textContent = "SYSTEM ONLINE";
});

voice.addEventListener("click", () => {
  speak("Hello. JARVIS artificial intelligence system is ready.");
});

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();

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
    if (!listening && !busy) {
      recognition.start();
    }
  });

} else {
  mic.addEventListener("click", () => {
    addMessage("JARVIS", "Voice input is not supported by this browser.");
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  });
}

addMessage(
  "JARVIS",
  "V20 interface initialized. Waiting for AI brain connection."
);
