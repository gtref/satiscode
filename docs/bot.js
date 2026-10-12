const GROQ_API = "__GROQ_API__"; // replaced by static.yml

async function askGroq(prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await response.json();

  // Handle errors safely
  if (data.error) {
    console.error("Groq API Error:", data.error);
    return "Groq error: " + data.error.message;
  }

  return data.choices[0].message.content;
}

// Example usage
askGroq("Hello from GitHub Pages!").then(console.log);
