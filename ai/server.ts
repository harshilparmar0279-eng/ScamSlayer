
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
        // The API key is automatically sourced from the 
        // GEMINI_API_KEY environment variable.
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
