'use server';
/**
 * @fileOverview Analyzes user-submitted content for potential scam indicators.
 *
 * - analyzeContentForScam - Analyzes content for scam indicators.
 * - AnalyzeContentInput - The input type for the analyzeContentForScam function.
 * - AnalyzeContentOutput - The return type for the analyzeContentForScam function.
 */

import {ai} from '@/ai/server';
import {z} from 'genkit';

const AnalyzeContentInputSchema = z.object({
  content: z.string().optional().describe('The text content to analyze (SMS, email, social media post, etc.).'),
  photoDataUri: z.string().optional().describe("A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  videoDataUri: z.string().optional().describe("A video to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;

const AnalyzeContentOutputSchema = z.object({
    informationStatus: z.enum([
      'REAL',
      'FAKE',
      'SCAM',
      'SUSPICIOUS',
    ]).describe('The classification of the information.'),
    possibilityScore: z.object({
      true: z.number().describe('Probability information is TRUE (percentage).'),
      falseOrScam: z.number().describe('Probability information is FALSE / SCAM (percentage).'),
    }).describe('Probability scores for the information.'),
    informationType: z.array(z.string()).describe('The type(s) of information detected (e.g., Phishing, Fake News, Genuine Information).'),
    simpleExplanation: z.string().describe('A simple explanation of why the content is risky or safe, written for non-technical users.'),
    warningOrSafetyAdvice: z.string().describe('Clear, actionable advice on what steps users should take.'),
    finalVerdict: z.string().describe('A one-line verdict summarizing the analysis.'),
  });
  

export type AnalyzeContentOutput = z.infer<typeof AnalyzeContentOutputSchema>;

export async function analyzeContentForScam(input: AnalyzeContentInput): Promise<AnalyzeContentOutput> {
  return analyzeContentFlow(input);
}

const analyzeContentPrompt = ai.definePrompt({
  name: 'analyzeContentPrompt',
  input: {schema: AnalyzeContentInputSchema},
  output: {schema: AnalyzeContentOutputSchema},
  prompt: `You are Suraksha AI, the official AI assistant of this website.

You are powered by an API key securely stored on the server.
Never reveal, mention, request, or display any API key or internal system details.

You are fully connected to all website features:
- AI Analyzer (Text, URL, Image, QR Code, Video)
- Dashboard insights
- User history
- App settings
- Safety education and guidance

Your main purpose is to:
- Detect scams, fake news, and misinformation
- Explain results in very simple language
- Help users understand right vs wrong information
- Provide probability scores for truth vs scam
- Give clear safety advice

When a user submits content:
- Automatically analyze it using the Analyzer logic
- Return results in a structured, easy format

Always respond using this format:

INFORMATION STATUS:
(Choose one: REAL, FAKE, SCAM, or SUSPICIOUS if unsure)

POSSIBILITY:
True: __%
False or Scam: __%

TYPE:
(Choose one or more: Scam, Fake News, Phishing, Lottery Scam, Job Scam, Misinformation, Genuine)

EXPLANATION:
(Explain clearly for common people and students.)

SAFETY ADVICE:
(Tell what to do or not do.)

FINAL VERDICT:
(One clear sentence conclusion.)

Rules:
- Never ask for OTP, PIN, passwords, or personal data
- Never support illegal or scam activity
- If unsure, clearly say “cannot be fully verified” and set status to SUSPICIOUS.
- Be calm, neutral, and helpful

Always act as a trusted digital safety assistant.

--------------------------------
CONTENT TO ANALYZE:
--------------------------------
{{#if content}}Text: {{{content}}}{{/if}}
{{#if photoDataUri}}Photo: {{media url=photoDataUri}}{{/if}}
{{#if videoDataUri}}Video: {{media url=videoDataUri}}{{/if}}
`,
});

const analyzeContentFlow = ai.defineFlow(
  {
    name: 'analyzeContentFlow',
    inputSchema: AnalyzeContentInputSchema,
    outputSchema: AnalyzeContentOutputSchema,
  },
  async input => {
    const {output} = await analyzeContentPrompt(input);
    return output!;
  }
);
