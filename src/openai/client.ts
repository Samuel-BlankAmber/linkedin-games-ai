require('dotenv').config();

import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required.');
}

export async function getOpenAIResponse(prompt: string): Promise<string> {
  const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.choices[0].message.content;
    if (content === null) {
      throw new Error('Response content is null.');
    }
    return content;
  } catch (error) {
    console.error('Error fetching OpenAI response:', error);
    throw error;
  }
}
