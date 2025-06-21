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
  prompt: `You are an AI expert in threat detection. Analyze the provided audio stream and identify potential threats based on keywords, sound patterns, and context. \n\nDetermine if a threat is present and extract relevant keywords. Provide a confidence score for the detection. Audio stream: {{media url=audioDataUri}}`,
});

const detectAudioThreatFlow = ai.defineFlow(
  {
    name: 'detectAudioThreatFlow',
    inputSchema: DetectAudioThreatInputSchema,
    outputSchema: DetectAudioThreatOutputSchema,
  },
  async input => {
    const {output} = await detectAudioThreatPrompt(input);
    return output!;
  }
);
