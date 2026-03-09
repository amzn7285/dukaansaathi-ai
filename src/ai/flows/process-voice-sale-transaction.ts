'use server';

import { z } from 'zod';

const ProcessVoiceSaleTransactionInputSchema = z.object({
  userQuery: z.string(),
  languageCode: z.union([z.literal('en-IN'), z.literal('hi-IN')]),
  privateMode: z.boolean(),
});
export type ProcessVoiceSaleTransactionInput = z.infer<typeof ProcessVoiceSaleTransactionInputSchema>;

const ProcessVoiceSaleTransactionOutputSchema = z.object({
  spokenResponse: z.string(),
  lessonText: z.string(),
  transactionDetails: z.object({
    productName: z.string().optional(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    customerName: z.string().optional(),
    price: z.number().optional(),
  }).optional(),
});
export type ProcessVoiceSaleTransactionOutput = z.infer<typeof ProcessVoiceSaleTransactionOutputSchema>;

export async function processVoiceSaleTransaction(input: ProcessVoiceSaleTransactionInput): Promise<ProcessVoiceSaleTransactionOutput> {
  const systemPrompt = `You are BolVyaapar AI. Task: Parse voice input.
1. 'spokenResponse': 1-2 warm sentences confirmation.
2. 'lessonText': 2-sentence business insight.
3. 'transactionDetails': Extracted data.
PRIVACY: NEVER mention exact revenue aloud.
Respond ONLY with JSON.`;

  const userMessage = `User: "${input.userQuery}". Mode: ${input.privateMode ? 'Private' : 'Normal'}. Language: ${input.languageCode}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bolvyaapar-ai.vercel.app',
        'X-Title': 'BolVyaapar AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Flow AI Error:', error);
    return {
      spokenResponse: "माफ कीजिये, कुछ गड़बड़ हो गई।",
      lessonText: "Connection error.",
      transactionDetails: {}
    };
  }
}
