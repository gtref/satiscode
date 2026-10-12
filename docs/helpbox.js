// Extract readable text from the page
function extractPageContent() {
  const clone = document.body.cloneNode(true);

  // Remove scripts, navbars, footers, etc.
  clone.querySelectorAll("script, style, nav, footer").forEach(el => el.remove());

  const text = clone.innerText
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 3000); // keep it safe for Groq
}

// UI setup
function initHelpBox() {
  const box = document.createElement("div");
  box.id = "helpbox";

  box.innerHTML = `
    <div id="helpbox-header">Need help?</div>
    <div id="helpbox-messages"></div>
    <input id="helpbox-input" placeholder="Ask something..." />
  `;

  document.body.appendChild(box);

  const messages = document.getElementById("helpbox-messages");
  const input = document.getElementById("helpbox-input");

  function addMessage(role, text) {
    const el = document.createElement("div");
    el.style.margin = "6px 0";
    el.style.textAlign = role === "user" ? "right" : "left";
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;

    const userMsg = input.value.trim();
    if (!userMsg) return;

    addMessage("user", userMsg);
    input.value = "";

    const pageText = extractPageContent();

    const prompt = `
You are a helpful assistant embedded inside a website.
Here is the content of the page the user is viewing:

"${pageText}"

User question: "${userMsg}"

Provide a helpful answer based ONLY on the page content and general knowledge.
    `;

    const reply = await askGroq(prompt);
    addMessage("assistant", reply);
  });
}

window.addEventListener("DOMContentLoaded", initHelpBox);
