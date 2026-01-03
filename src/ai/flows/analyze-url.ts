'use server';

/**
 * @fileOverview An AI agent that analyzes a URL for safety.
 *
 * - analyzeUrl - A function that analyzes a given URL.
 * - AnalyzeUrlInput - The input type for the analyzeUrl function.
 * - AnalyzeUrlOutput - The return type for the analyzeUrl function.
 */

import { ai } from '@/ai/server';
import { z } from 'zod';

const AnalyzeUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to be analyzed for safety.'),
});
export type AnalyzeUrlInput = z.infer<typeof AnalyzeUrlInputSchema>;

const AnalyzeUrlOutputSchema = z.object({
  safetyStatus: z.enum(['Safe', 'Suspicious', 'Unsafe']).describe('The safety status of the URL.'),
  reason: z.string().describe('A clear explanation for the assigned safety status.'),
  risk: z.string().describe('The potential risk if the user proceeds (e.g., data theft, malware).'),
  advice: z.string().describe('Actionable advice for the user.'),
});
export type AnalyzeUrlOutput = z.infer<typeof AnalyzeUrlOutputSchema>;

export async function analyzeUrl(input: AnalyzeUrlInput): Promise<AnalyzeUrlOutput> {
  return analyzeUrlFlow(input);
}

const analyzeUrlPrompt = ai.definePrompt({
  name: 'analyzeUrlPrompt',
  input: { schema: AnalyzeUrlInputSchema },
  output: { schema: AnalyzeUrlOutputSchema },
  prompt: `You are an AI Cyber Security Assistant. Your job is to analyze the safety of a given URL.

Analyze the URL based on common security indicators:
- Known phishing or malware patterns.
- Suspicious URL structure (e.g., excessive subdomains, keyword stuffing like 'login', 'account', 'secure').
- Use of URL shorteners for obfuscation.
- TLD (.zip, .mov, .xyz can be risky).
- Mismatches between the domain name and what it pretends to be.

Based on your analysis, provide a structured response.

URL to Analyze: {{{url}}}
`,
});

const analyzeUrlFlow = ai.defineFlow(
  {
    name: 'analyzeUrlFlow',
    inputSchema: AnalyzeUrlInputSchema,
    outputSchema: AnalyzeUrlOutputSchema,
  },
  async input => {
    const { output } = await analyzeUrlPrompt(input);
    return output!;
  }
);
