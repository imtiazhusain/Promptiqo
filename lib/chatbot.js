import axios from 'axios';
import NodeCache from 'node-cache';
import OpenAI from 'openai';

/**
 * Validate required environment variables
 */
if (!process.env.GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in .env.local file');
}

if (!process.env.SERPER_API_KEY) {
  throw new Error('Missing SERPER_API_KEY in .env.local file');
}

/**
 * Constants
 */
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Groq uses OpenAI-compatible API
 */
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

/**
 * Tool definition
 */
const tools = [
  {
    type: 'function',
    function: {
      name: 'webSearch',
      description: 'Search latest and real-time information from the internet',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
        },
        required: ['query'],
      },
    },
  },
];

// Use a module-level cache (persists across requests in the same server process)
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // 24 hours

export async function generate(userMessage, threadId) {
  const baseMessages = [
    {
      role: 'system',
      content: `You are a smart personal assistant.
              If you know the answer to a question, answer it directly in plain English.
              If the answer requires real-time, local, or up-to-date information, or if you don't know the answer, use the available tools to find it.
              You have access to the following tool:
              webSearch(query: string): Use this to search the internet for current or unknown information.
              Decide when to use your own knowledge and when to use the tool.
              Do not mention the tool unless needed.

              Examples:
              Q: What is the capital of France?
              A: The capital of France is Paris.

              Q: What's the weather in Mumbai right now?
              A: (use the search tool to find the latest weather)

              Q: Who is the Prime Minister of India?
              A: The current Prime Minister of India is Narendra Modi.

              Q: Tell me the latest IT news.
              A: (use the search tool to get the latest news)

              current date and time: ${new Date().toUTCString()}`,
    },
  ];

  const messages = cache.get(threadId) ?? baseMessages;

  messages.push({
    role: 'user',
    content: userMessage,
  });

  const MAX_RETRIES = 10;
  let count = 0;

  while (true) {
    if (count > MAX_RETRIES) {
      return 'I could not find the result, please try again';
    }
    count++;

    const completions = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages,
      tools,
      tool_choice: 'auto',
    });

    messages.push(completions.choices[0].message);

    const toolCalls = completions.choices[0].message.tool_calls;

    if (!toolCalls) {
      // End the loop and return the response
      cache.set(threadId, messages);
      return completions.choices[0].message.content;
    }

    for (const tool of toolCalls) {
      const functionName = tool.function.name;
      const functionParams = tool.function.arguments;

      if (functionName === 'webSearch') {
        const toolResult = await webSearch(JSON.parse(functionParams));

        messages.push({
          tool_call_id: tool.id,
          role: 'tool',
          name: functionName,
          content: toolResult,
        });
      }
    }
  }
}

async function webSearch({ query }) {
  console.log('calling web search....');

  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    const results = data.organic?.slice(0, 5) || [];

    if (results.length === 0) {
      return 'No search results found.';
    }

    const formattedResults = results.map((item) => {
      return `Snippet: ${item.snippet}`;
    });

    return formattedResults.join('\n');
  } catch (error) {
    console.error('SERPER API error:', error.message);
    throw new Error('Failed to get response from SERPER API');
  }
}
