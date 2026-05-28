# Promptiqo

A full-stack AI assistant built with Next.js — with conversation memory, live web search, and few-shot prompting. No separate server. One codebase, one deploy.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-orange?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## What makes it different

Most ChatGPT clones are glorified wrappers — one API call, no memory, no tools.

Promptiqo goes further:

- **Conversation memory** — stores the full message history per thread using `node-cache`. The AI remembers everything you've said in the session.
- **Live web search** — powered by Serper API. The model decides on its own when to search Google vs. answer from its own knowledge.
- **Few-shot prompting** — real examples baked into the system prompt that teach the model when to use tools without any fine-tuning.
- **Agentic tool-calling loop** — the model runs in a `while` loop, calls tools if needed, injects results, and loops again until it has a confident answer.
- **No separate server** — Express.js replaced entirely by Next.js API routes. One codebase handles both frontend and backend.

---

## How it works

```
User types a message
        ↓
Next.js API route receives it (/api/chat)
        ↓
chatbot.js sends message + history to Groq (Llama 3.3 70B)
        ↓
Model decides: "Can I answer this? Or do I need live data?"
        ↓
    [needs search]          [knows the answer]
        ↓                           ↓
Serper API fires           Return response directly
Google search                       ↓
        ↓               Save history to node-cache
Results injected                    ↓
back into context          Send back to frontend
        ↓
Model loops again
        ↓
Final grounded answer
```

There's no LangChain. No vector database. No magic framework.

Just. A. While. Loop.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19 |
| Styling | Tailwind CSS v4 |
| AI Model | Groq — Llama 3.3 70B |
| Web Search | Serper API (Google Search) |
| Memory | node-cache (in-memory, per thread) |
| API | Next.js Route Handlers (`/app/api`) |

---

## Project structure

```
Promptiqo/
├── app/
│   ├── layout.js           # Root HTML layout, metadata
│   ├── page.js             # Chat UI — all frontend logic
│   ├── globals.css         # Tailwind import
│   └── api/
│       └── chat/
│           └── route.js    # POST /api/chat — replaces Express server
├── lib/
│   └── chatbot.js          # Core AI logic: memory, tool calling, web search
├── .env.local.example              # Environment variable template
├── next.config.mjs
├── postcss.config.mjs
└── package.json
```

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/imtiazhusain/Promptiqo.git
cd Promptiqo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your keys:

```env
GROQ_API_KEY=your_groq_api_key_here
SERPER_API_KEY=your_serper_api_key_here
```

Getting your API keys:
- **Groq** — free at [console.groq.com](https://console.groq.com)
- **Serper** — free tier at [serper.dev](https://serper.dev)

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Key concepts explained

### Conversation memory

Each browser session generates a unique `threadId`. Every message sent to `/api/chat` includes this ID. On the server, `node-cache` stores the full message array keyed by `threadId` — so the model always receives the complete conversation history with every request.

```js
// lib/chatbot.js
const messages = cache.get(threadId) ?? baseMessages;
messages.push({ role: 'user', content: userMessage });
// ... after response:
cache.set(threadId, messages);
```

### Few-shot prompting

The system prompt includes concrete examples that train the model's decision-making without fine-tuning:

```
Q: What is the capital of France?
A: The capital of France is Paris.        ← answer directly

Q: What's the weather in Mumbai right now?
A: (use the search tool)                  ← use the tool
```

The model learns the pattern and applies it to every new question automatically.

### The agent loop

```js
while (true) {
  const response = await groq.chat.completions.create({ messages, tools });

  // If no tool call → we're done, return the answer
  if (!response.choices[0].message.tool_calls) {
    return response.choices[0].message.content;
  }

  // Otherwise → run the tool, inject result, loop again
  const result = await webSearch(params);
  messages.push({ role: 'tool', content: result });
}
```

This is the same core pattern used in production AI agents — just without the abstraction layers.

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
```

---

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `GROQ_API_KEY` | Your Groq API key | Yes |
| `SERPER_API_KEY` | Your Serper (Google Search) API key | Yes |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

MIT — use it, fork it, ship it.

---

Built by Imtiaz Hussain (https://www.linkedin.com/in/imtiaz-hussain21/) · If this helped you, drop a ⭐ on the repo.
