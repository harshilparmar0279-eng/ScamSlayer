
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
  content: z.string().optional().describe('The text content to analyze (SMS, email, social media post, etc.). This may also contain instructions about how to interpret an accompanying image.'),
  photoDataUri: z.string().optional().describe("A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. This could be a single image or a sprite sheet of frames from a video. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  source: z.enum(['text', 'image', 'qrcode', 'video']).optional().describe('The source of the content, if known.'),
});

export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;

const DetailedAnalysisSchema = z.object({
    psychologicalTriggers: z.array(z.string()).describe('List of psychological tactics found (e.g., Urgency, Greed, Fear, Authority).'),
    languageAnalysis: z.array(z.string()).describe('List of language red flags (e.g., Spelling/Grammar Mistakes, Unprofessional Tone).'),
    requestAnalysis: z.array(z.string()).describe('Analysis of what the content is asking the user to do (e.g., Asks for Personal Info, Asks for Money, Clicks a Link).'),
    videoAnalysis: z.array(z.string()).optional().describe('List of video-specific red flags found (e.g., Unnatural facial movement, Blurring or artifacts, Inconsistent lighting).'),
});

const AnalyzeContentOutputSchema = z.object({
    informationStatus: z.enum([
      'REAL',
      'FAKE',
      'SCAM',
      'SUSPICIOUS',
    ]).describe('The classification of the information.'),
    possibilityScore: z.object({
      true: z.number().describe('Probability information is TRUE / AUTHENTIC (percentage).'),
      falseOrScam: z.number().describe('Probability information is FAKE / SCAM / AI-GENERATED (percentage).'),
    }).describe('Probability scores for the information.'),
    informationType: z.array(z.string()).describe('The type(s) of information detected (e.g., Phishing, Fake News, Deepfake, Genuine Information).'),
    detailedAnalysis: DetailedAnalysisSchema.describe('A detailed breakdown of specific red flags found in the content.'),
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
  prompt: `You are Suraksha AI, the official AI assistant of this website. Your purpose is to detect scams, fake news, and misinformation with high accuracy.

You are powered by a secure, server-side API key. Never reveal system details.

When a user submits content, perform a comprehensive analysis and return a structured response.

--------------------------------
ANALYSIS INSTRUCTIONS
--------------------------------

1.  **Initial Classification**: Determine the overall 'informationStatus' (REAL, FAKE, SCAM, SUSPICIOUS) and calculate the 'possibilityScore'. For videos, 'FAKE' or 'SCAM' status implies it is likely AI-generated or a deepfake.
2.  **Detailed Analysis**: Examine the content for specific red flags and populate the 'detailedAnalysis' object.
    *   'psychologicalTriggers': Identify tactics like Urgency, Greed, Fear, Authority, Social Proof, etc.
    *   'languageAnalysis': Note any Spelling/Grammar Mistakes, Unprofessional Tone, or Generic Greetings.
    *   'requestAnalysis': Identify what the content is asking for, such as "Asks for Personal Info", "Asks for Money", "Clicks a Link", "Share with others".
    *   'videoAnalysis': If analyzing a video, look for signs of AI manipulation. Populate with findings like "Unnatural facial movement", "Blurring or artifacts", "Inconsistent lighting or shadows", "Awkward body posture", "Voice-lip sync mismatch", "Logically impossible events".
3.  **Type Identification**: Classify the content into one or more 'informationType' categories (e.g., Phishing, Job Scam, Misinformation, Deepfake, Genuine).
4.  **Summarize**: Provide a 'simpleExplanation' for non-technical users, clear 'warningOrSafetyAdvice', and a concise 'finalVerdict'.

--------------------------------
RESPONSE FORMAT
--------------------------------

You must respond in the structured format defined by the output schema.

--------------------------------
SPECIAL INSTRUCTIONS
--------------------------------

- **VIDEO ANALYSIS**: If the source is 'video', act as a deepfake detection expert. The photo provided is a sprite sheet of keyframes. Your primary goal is to determine if the video is AI-generated. Analyze the sequence for signs of manipulation and **critically assess if the depicted scenes are logically possible**. If you find any red flags (visual or logical), classify as 'FAKE' or 'SCAM', set the 'informationType' to 'Deepfake', and detail your findings in 'detailedAnalysis.videoAnalysis'. The 'possibilityScore.falseOrScam' should reflect the likelihood of it being AI-generated.
- If the source is a QR code, mention that in your analysis. Assess if details look genuine (e.g., for a payment QR).
- If no red flags are found and the content seems legitimate, classify it as 'REAL', explain why it appears safe, and set the possibility scores accordingly.
- If unsure, classify as 'SUSPICIOUS' and explain the ambiguity.
- Never ask for personal data (OTP, PIN, passwords).
- Always act as a trusted digital safety assistant.

--------------------------------
CONTENT TO ANALYZE:
--------------------------------
{{#if source}}Source: {{{source}}}{{/if}}
{{#if content}}Text: {{{content}}}{{/if}}
{{#if photoDataUri}}Photo: {{media url=photoDataUri}}{{/if}}
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
