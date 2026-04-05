// ---------- DOM Elements ----------
const messagesContainer = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");
const personaBtns = document.querySelectorAll(".persona-btn");
const currentPersonaEl = document.getElementById("currentPersona");

// ---------- Persona Display Config ----------
const personaLabels = {
  tutor: "📚 Study Buddy",
  coder: "💻 Code Guru",
  quiz: "🧠 Quiz Master",
  motivator: "🔥 Coach Spark",
};

const welcomeMessages = {
  tutor:
    "Hey there! 👋 I'm your <strong>Study Buddy</strong>. Ask me anything about Physics, Chemistry, Maths, or any subject you're curious about!",
  coder:
    "Hello! 👨‍💻 I'm <strong>Code Guru</strong>. Ready to learn some coding? Ask me about JavaScript, Python, or any programming concept!",
  quiz:
    "Welcome! 🎯 I'm the <strong>Quiz Master</strong>. Pick a topic and I'll quiz you! Try saying: <em>\"Quiz me on Newton's Laws\"</em>",
  motivator:
    "Hey champion! 💪 I'm <strong>Coach Spark</strong>. Need help staying motivated or planning your study schedule? Let's go!",
};

// ---------- Send Message ----------
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Display user message
  appendMessage(message, "user");
  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  // Show typing indicator
  const typingEl = showTypingIndicator();

  try {
    // Call our backend API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    // Remove typing indicator
    typingEl.remove();

    if (data.error) {
      appendMessage("Oops! Something went wrong. Please try again.", "bot");
    } else {
      appendMessage(data.reply, "bot");
    }
  } catch (error) {
    typingEl.remove();
    appendMessage(
      "Could not connect to the server. Make sure it's running!",
      "bot"
    );
  }

  sendBtn.disabled = false;
  userInput.focus();
}

// ---------- Append Message to Chat ----------
function appendMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "user" ? "🧑" : "🤖";

  const content = document.createElement("div");
  content.className = "message-content";
  content.innerHTML = formatMessage(text);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  messagesContainer.appendChild(messageDiv);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ---------- Format Bot Response ----------
function formatMessage(text) {
  // Convert markdown-like syntax to HTML
  let formatted = text
    // Code blocks: ```code```
    .replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    // Inline code: `code`
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold: **text**
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Italic: *text*
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    // Line breaks
    .replace(/\n/g, "<br>");

  // Wrap in paragraph if no HTML block elements
  if (!formatted.includes("<pre>") && !formatted.includes("<ul>")) {
    formatted = `<p>${formatted}</p>`;
  }

  return formatted;
}

// ---------- Typing Indicator ----------
function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot-message";
  typingDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return typingDiv;
}

// ---------- Switch Persona ----------
async function switchPersona(persona) {
  try {
    const response = await fetch("/api/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    });

    const data = await response.json();

    if (data.success) {
      // Update UI
      personaBtns.forEach((btn) => btn.classList.remove("active"));
      document
        .querySelector(`[data-persona="${persona}"]`)
        .classList.add("active");

      currentPersonaEl.textContent = personaLabels[persona];

      // Clear chat and show welcome message
      messagesContainer.innerHTML = "";
      appendMessage(welcomeMessages[persona], "bot");
    }
  } catch (error) {
    console.error("Failed to switch persona:", error);
  }
}

// ---------- Reset Chat ----------
async function resetChat() {
  try {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // Find the currently active persona
    const activePersona =
      document.querySelector(".persona-btn.active")?.dataset.persona || "tutor";

    messagesContainer.innerHTML = "";
    appendMessage(welcomeMessages[activePersona], "bot");
  } catch (error) {
    console.error("Failed to reset chat:", error);
  }
}

// ---------- Event Listeners ----------

// Send button click
sendBtn.addEventListener("click", sendMessage);

// Enter key to send (Shift+Enter for new line)
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

// Persona buttons
personaBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchPersona(btn.dataset.persona);
  });
});

// Reset button
resetBtn.addEventListener("click", resetChat);