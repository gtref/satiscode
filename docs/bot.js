const ENCODED_GROQ_API_KEY = "__GROQ_API_OBFUSCATED__";
const GROQ_KEY_MASK = "SatiscodePublicDocsMask2026";

function decodeGroqApiKey() {
  if (ENCODED_GROQ_API_KEY === "__GROQ_API_OBFUSCATED__") return "";

  const base64 = ENCODED_GROQ_API_KEY.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bytes = atob(padded);
  return Array.from(bytes, (byte, index) =>
    String.fromCharCode(byte.charCodeAt(0) ^ GROQ_KEY_MASK.charCodeAt(index % GROQ_KEY_MASK.length))
  ).join("");
}

async function askAssistant(prompt) {
  const apiKey = decodeGroqApiKey();
  if (!apiKey) return "The help assistant isn't configured yet.";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) throw new Error("Request failed");

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("Invalid response");
    }
    return reply.trim();
  } catch {
    return "I couldn't reach the help assistant. Please try again later.";
  }
}
