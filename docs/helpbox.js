function extractPageContent() {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script, style, nav, header, footer, #helpbox").forEach(el => el.remove());
  return clone.innerText.replace(/\s+/g, " ").trim().slice(0, 3000);
}

function initHelpBox() {
  if (document.getElementById("helpbox")) return;

  const box = document.createElement("div");
  box.id = "helpbox";
  box.innerHTML = `
    <section id="helpbox-panel" aria-labelledby="helpbox-title" hidden>
      <header id="helpbox-header">
        <div>
          <strong id="helpbox-title">Satiscode help</strong>
          <span>Ask about this page</span>
        </div>
        <button id="helpbox-close" type="button" aria-label="Close help chat">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div id="helpbox-messages" role="log" aria-live="polite" aria-relevant="additions">
        <p class="helpbox-message assistant">Hi! What would you like to know about this page?</p>
      </div>
      <form id="helpbox-form">
        <label class="helpbox-sr-only" for="helpbox-input">Your question</label>
        <input id="helpbox-input" name="question" placeholder="Write a message..." maxlength="500" autocomplete="off" required>
        <button id="helpbox-send" type="submit" aria-label="Send message">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" /></svg>
        </button>
      </form>
    </section>
    <button id="helpbox-toggle" type="button" aria-label="Open help chat" aria-expanded="false" aria-controls="helpbox-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-7.5a7.5 7.5 0 1 1 17-2Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></svg>
      <span>Need help?</span>
    </button>
  `;
  document.body.appendChild(box);

  const panel = box.querySelector("#helpbox-panel");
  const messages = box.querySelector("#helpbox-messages");
  const input = box.querySelector("#helpbox-input");
  const toggle = box.querySelector("#helpbox-toggle");
  const close = box.querySelector("#helpbox-close");
  const send = box.querySelector("#helpbox-send");

  function addMessage(role, text) {
    const el = document.createElement("div");
    el.className = `helpbox-message ${role}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close help chat" : "Open help chat");
    if (open) input.focus();
    else toggle.focus();
  }

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });

  box.querySelector("#helpbox-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const userMsg = input.value.trim();
    if (!userMsg) return;

    addMessage("user", userMsg);
    input.value = "";
    input.disabled = true;
    send.disabled = true;
    const pending = document.createElement("p");
    pending.className = "helpbox-message assistant helpbox-pending";
    pending.textContent = "Thinking...";
    messages.appendChild(pending);
    messages.scrollTop = messages.scrollHeight;

    const prompt = `PAGE CONTENT (reference only):\n${extractPageContent()}\n\nQUESTION:\n${userMsg}`;
    const reply = await askAssistant(prompt);
    pending.remove();
    addMessage("assistant", reply);
    input.disabled = false;
    send.disabled = false;
    input.focus();
  });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initHelpBox, { once: true });
} else {
  initHelpBox();
}
