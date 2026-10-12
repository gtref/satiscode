// bot.js — placeholder replaced by GitHub Actions

const GROQ_API = "__GROQ_API__";  // replaced during build

async function askGroq(prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Example:
askGroq("Hello from GitHub Pages!").then(console.log);
