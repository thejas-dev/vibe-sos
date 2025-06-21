'use server';

/**
 * @fileOverview AI-powered audio threat detection flow.
 *
 * - detectAudioThreat - Analyzes an audio stream to identify potential threats.
 * - DetectAudioThreatInput - Input type for the detectAudioThreat function.
 * - DetectAudioThreatOutput - Return type for the detectAudioThreat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAudioThreatInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio stream as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectAudioThreatInput = z.infer<typeof DetectAudioThreatInputSchema>;

const DetectAudioThreatOutputSchema = z.object({
  threatDetected: z
    .boolean()
    .describe('Whether a threat is detected in the audio stream.'),
  threatKeywords: z
    .array(z.string())
    .describe('Keywords or sound patterns that indicate a threat.'),
  confidenceScore: z
    .number()
    .describe('Confidence score of the threat detection (0 to 1).'),
});
export type DetectAudioThreatOutput = z.infer<typeof DetectAudioThreatOutputSchema>;

export async function detectAudioThreat(input: DetectAudioThreatInput): Promise<DetectAudioThreatOutput> {
  return detectAudioThreatFlow(input);
}

const detectAudioThreatPrompt = ai.definePrompt({
  name: 'detectAudioThreatPrompt',
  input: {schema: DetectAudioThreatInputSchema},
  output: {schema: DetectAudioThreatOutputSchema},
  prompt: `You are an AI expert in threat detection. Analyze the provided audio stream and identify potential threats based on keywords, sound patterns, and context. 
  
Determine if a threat is present and extract relevant keywords. Provide a confidence score for the detection. If no specific threat is detected, the audio is silent, or the audio is unclear, you MUST return a response with 'threatDetected' as false, an empty 'threatKeywords' array, and a 'confidenceScore' of 0.

Audio stream: {{media url=audioDataUri}}`,
});

const detectAudioThreatFlow = ai.defineFlow(
  {
    name: 'detectAudioThreatFlow',
    inputSchema: DetectAudioThreatInputSchema,
    outputSchema: DetectAudioThreatOutputSchema,
  },
  async input => {
    const {output} = await detectAudioThreatPrompt(input);
    if (!output) {
      // If the model fails to produce a valid output, we'll return a default "no threat" response
      // to make the flow more resilient against model flakiness.
      return {
        threatDetected: false,
        threatKeywords: [],
        confidenceScore: 0,
      };
    }
    return output;
  }
);
