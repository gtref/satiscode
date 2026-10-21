# Satiscode docs help API

This Cloudflare Worker is an optional server-side alternative. The current GitHub Pages widget does not use it; it calls Groq directly with a deployment-injected, reversibly obfuscated key. That key can be recovered by visitors from the public site. No Worker setup is needed for the current widget.

## Deploy

1. Create a free Cloudflare account and enable its `workers.dev` subdomain.
2. From the repository root, authenticate Wrangler:

   ```powershell
   npx wrangler@latest login
   ```

3. Store the Groq key as a Worker secret. Wrangler prompts for the value; do not put it in a command or source file:

   ```powershell
   npx wrangler@latest secret put GROQ_API_KEY --config api/wrangler.toml
   ```

4. Deploy the Worker:

   ```powershell
   npx wrangler@latest deploy --config api/wrangler.toml
   ```

   Wrangler prints a URL similar to `https://satiscode-docs-help.<your-account>.workers.dev`.

The current docs widget is not wired to this Worker. Switching it to this endpoint requires changing `docs/bot.js` to send requests to the Worker URL instead of Groq.

The Worker only accepts browser requests from `https://gtref.github.io`. If the docs move to a different origin, update `DOCS_ORIGIN` in `worker.mjs` and deploy again. Requests are limited to 20 per client IP per minute; the endpoint is still public, so configure usage limits on the Groq account as well.

## Local tests

Run the endpoint tests with:

```powershell
node --test api/worker.test.js
```
