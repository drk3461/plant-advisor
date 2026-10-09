# Plant Advisor

Next.js dashboard with a real LLM chat (any OpenAI-compatible API, Groq free tier by default) that answers using live plant data: soil moisture, pH, EC, NPK, temperature, humidity, sunlight and camera observations.

## Deploy from GitHub (no local setup)
1. Create a new GitHub repo and upload these files (or push them).
2. Go to vercel.com → Add New → Project → import the repo.
3. Under Environment Variables add `LLM_API_KEY` (a free key from console.groq.com/keys). Optional: `LLM_BASE_URL` and `LLM_MODEL` to use another provider (Cerebras, OpenRouter, Gemini).
4. Click Deploy. Every push to GitHub redeploys automatically.

## Where things live
- `lib/sensorData.ts` – the only place sensor data comes from. Mock now; replace with ESP32/Arduino fetch later.
- `lib/plantConfig.ts` – plant name and ideal range for each sensor.
- `app/api/sensors/route.ts` – JSON the dashboard polls every 5 s.
- `app/api/chat/route.ts` – streams LLM answers; builds context from the same data on the server. The token never reaches the browser.
