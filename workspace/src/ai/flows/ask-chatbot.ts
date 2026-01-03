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
import { getSdks } from '@/firebase';

// Helper to get Firestore instance on the server
function getFirestoreInstance() {
    return getSdks(undefined as any).firestore;
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
        // Return an empty array or throw an error to let the model know something went wrong.
        return [];
      }
    }
  );


const AskChatbotInputSchema = z.object({
    prompt: z.string().describe("The user's question about the application."),
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

const prompt = ai.definePrompt({
  name: 'askChatbotPrompt',
  input: { schema: AskChatbotInputSchema },
  output: { schema: AskChatbotOutputSchema },
  tools: [getAnalysisHistory],
  prompt: `You are "Suraksha AI", an in-app AI assistant fully connected to all features of this application.

Your role is to help users detect scams, fake news, and fraud by being a helpful, user-friendly guide. You should answer questions clearly for common people and students.

You have access to and can control:
- Analyzer (Text, URL, Image, QR Code, Video)
- Dashboard data
- History of past analyses
- Settings and user preferences
- Safety guidance and education

YOUR TASK:
1.  **Understand Intent**: Determine if the user wants to analyze content, see history, ask about settings, or has a general safety question.
2.  **Guide & Assist**:
    - If the user asks for their history (e.g., "show my history", "what were my last results?"), use the \`getAnalysisHistory\` tool to fetch it for them.
    - When you return history, also provide a brief "answer" summarizing what you've done, like "Here are your 5 most recent analyses:".
    - If the user asks how to do something (e.g., "how do I scan a QR code?"), guide them to the correct feature (e.g., "Go to the 'Analyzer' page and click the 'QR Code' tab.").
    - For general questions about the app or digital safety, provide a helpful and simple answer.
    - If the user is not logged in (no \`userId\` is provided), you CANNOT fetch their history. Politely tell them they need to log in to see their history.
3.  **Be Concise & Clear**: Use simple language. Be friendly but authoritative.

Do not answer questions that are not related to the Suraksha AI app or digital safety. If asked an off-topic question, politely state that you can only answer questions about the app.

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
    const { output } = await prompt(input);
    
    // If the tool returns history, ensure it's in the final output.
    if (output?.history && output.history.length > 0) {
        return output;
    }

    // Otherwise, just return the text answer.
    return {
        answer: output?.answer || "I'm not sure how to respond to that. Please try asking in a different way.",
    };
  }
);
