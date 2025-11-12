// T016, T017: Anthropic extraction utility with prompt
import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedProtocolData } from '@/types/database.types';

// T017: Extraction prompt constant with JSON schema
export const EXTRACTION_PROMPT = `
Extract the following information from this clinical trial protocol:

1. Study name/title
2. Phase (e.g., Phase 1, Phase 2, Phase 3, Phase 4)
3. Medical condition or indication being studied
4. ALL inclusion criteria (as a list)
5. ALL exclusion criteria (as a list)
6. Visit schedule or study timepoints (list each visit/timepoint)
7. Target enrollment number

Return ONLY valid JSON in this exact format:
{
  "name": "string",
  "phase": "string",
  "indication": "string",
  "inclusion_criteria": ["criterion 1", "criterion 2", ...],
  "exclusion_criteria": ["criterion 1", "criterion 2", ...],
  "visit_schedule": ["visit 1", "visit 2", ...],
  "target_enrollment": number
}

Do not include any explanation, only the JSON object.
`;

// T016: Extract protocol data with 5-minute timeout
export async function extractProtocolData(pdfBase64: string): Promise<ExtractedProtocolData> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // 5-minute timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
      // @ts-expect-error - AbortSignal type mismatch
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON response from Claude
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(text) as ExtractedProtocolData;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Extraction timeout (5 minutes exceeded)');
    }
    throw error;
  }
}
