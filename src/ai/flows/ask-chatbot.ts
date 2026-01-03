
'use server';

/**
 * @fileOverview A flow to answer questions about the Suraksha AI application and fetch user data.
 *
 * - askChatbot - A function that handles chatbot queries.
 * - AskChatbotInput - The input type for the askChatbot function.
 * - AskChatbotOutput - The return type for the askChatbot function.
 */

import { ai } from '@/ai/server';
import { z } from 'genkit';
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Helper to get Firestore instance on the server
function getFirestoreInstance() {
    return initializeFirebase().firestore;
}

const HistoryItemSchema = z.object({
  id: z.string(),
  finalVerdict: z.string(),
  content: z.string(),
  informationStatus: z.string(),
  analysisTimestamp: z.object({
    seconds: z.number(),
    nanoseconds: z.number(),
  }).optional().nullable(),
});

const getAnalysisHistory = ai.defineTool(
    {
      name: 'getAnalysisHistory',
      description: 'Get the user\'s most recent analysis history records.',
      inputSchema: z.object({
        userId: z.string().describe('The ID of the user to fetch history for.'),
        count: z.number().optional().default(5).describe('The number of recent items to fetch.'),
      }),
      outputSchema: z.array(HistoryItemSchema),
    },
    async ({ userId, count }) => {
      console.log(`Fetching history for user ${userId} with count ${count}`);
      try {
        const firestore = getFirestoreInstance();
        const historyQuery = query(
          collection(firestore, `users/${userId}/analysis_results`),
          orderBy('analysisTimestamp', 'desc'),
          limit(count)
        );
        const snapshot = await getDocs(historyQuery);
        if (snapshot.empty) {
          return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as z.infer<typeof HistoryItemSchema>[];
      } catch (error) {
        console.error('Error fetching analysis history:', error);
        // Let the model know something went wrong.
        return [];
      }
    }
  );


const AskChatbotInputSchema = z.object({
    prompt: z.string().describe("The user's question or greeting."),
    userId: z.string().optional().describe("The ID of the user asking the question, if they are logged in."),
});
export type AskChatbotInput = z.infer<typeof AskChatbotInputSchema>;

const AskChatbotOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question."),
  history: z.array(HistoryItemSchema).optional().describe("A list of analysis history items, if requested by the user."),
});
export type AskChatbotOutput = z.infer<typeof AskChatbotOutputSchema>;


export async function askChatbot(input: AskChatbotInput): Promise<AskChatbotOutput> {
  return askChatbotFlow(input);
}

const chatbotPrompt = ai.definePrompt({
  name: 'askChatbotPrompt',
  input: { schema: AskChatbotInputSchema },
  output: { schema: AskChatbotOutputSchema },
  tools: [getAnalysisHistory],
  prompt: `You are "Suraksha AI," a friendly and intelligent assistant for the Suraksha AI application.

Your persona is helpful, clear, and reassuring. Your goal is to guide users and answer their questions about the app.

You have extensive knowledge about this application:
- **Creators**: You were created by a team named "Quantum Crew".
- **Features**: You can explain all app features: Text Analysis, URL Scanning, Image Analysis, QR Code Scanning, and Video (Deepfake) Analysis.
- **Navigation**: You can guide users to the right pages (e.g., "Go to the Analyzer page and click the 'URL' tab").

You also have tools:
- **\`getAnalysisHistory\`**: You can fetch a user's recent analysis history if they ask for it (e.g., "show my last 5 results").

YOUR BEHAVIOR:
1.  **Handle Greetings**: If the user says "hi", "hello", etc., respond with a friendly greeting and ask how you can help.
2.  **Answer App Questions**: If asked about features, creators, or how to use the app, provide a clear and simple answer.
3.  **Use Tools**: If the user asks for their history, use the \`getAnalysisHistory\` tool. If no user ID is provided, politely tell them they need to be logged in. When you return history, provide a summary in the 'answer' field.
4.  **Stay On-Topic**: Only answer questions about Suraksha AI or general digital safety. For unrelated questions, politely decline by saying, "I can only help with questions about the Suraksha AI application and digital safety."
5.  **Be Concise**: Keep your answers direct and easy to understand for everyone.

User's prompt:
"{{{prompt}}}"
{{#if userId}}
The user is logged in with user ID: {{{userId}}}
{{/if}}
`,
});

const askChatbotFlow = ai.defineFlow(
  {
    name: 'askChatbotFlow',
    inputSchema: AskChatbotInputSchema,
    outputSchema: AskChatbotOutputSchema,
  },
  async input => {
    const { output } = await chatbotPrompt(input);
    
    if (!output) {
      return { answer: "I'm sorry, I'm having trouble thinking right now. Please try asking again." };
    }

    // Ensure there is always an answer.
    if (!output.answer && output.history && output.history.length > 0) {
      output.answer = `I found ${output.history.length} items in your recent history.`
    } else if (!output.answer) {
      output.answer = "I'm not sure how to respond to that. Could you please rephrase your question?"
    }

    return output;
  }
);
