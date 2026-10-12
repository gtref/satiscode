async function askAssistant(prompt) {
  const endpoint = window.SATISCODE_HELP_API_URL;
  if (!endpoint) {
    return "The help assistant is not configured yet. A server-side API endpoint is needed to keep its credentials private.";
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error("Request failed");

    const data = await response.json();
    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("Invalid response");
    }
    return data.reply.trim();
  } catch {
    return "I couldn't reach the help assistant. Please try again later.";
  }
}
