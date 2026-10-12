// bot.js

async function askGroq(prompt) {
  const response = await fetch("/groq", {
    method: "POST",
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Example usage:
askGroq("Hello from Cloudflare Pages!").then(console.log);
