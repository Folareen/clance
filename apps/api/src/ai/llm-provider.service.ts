import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CompleteOptions {
  /** Ask the provider for strict JSON output instead of free text. */
  json?: boolean;
}

class ProviderError extends Error {
  constructor(
    message: string,
    public status: number | undefined,
  ) {
    super(message);
  }
}

// Google deprecates model names aggressively — if Gemini starts 404ing,
// check `GET /v1beta/models?key=...` for the current lineup before assuming
// the key is broken.
const GEMINI_MODEL = 'gemini-3.6-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

@Injectable()
export class LlmProviderService {
  private readonly logger = new Logger(LlmProviderService.name);

  constructor(private config: ConfigService) {}

  async complete(prompt: string, opts: CompleteOptions = {}): Promise<string> {
    try {
      return await this.callGemini(prompt, opts);
    } catch (err) {
      if (!this.isRetryable(err)) throw err;
      this.logger.warn(
        `Gemini failed (${(err as ProviderError).status}), falling back to Groq`,
      );
      try {
        return await this.callGroq(prompt, opts);
      } catch (fallbackErr) {
        this.logger.error('Groq fallback also failed', fallbackErr as Error);
        throw new ServiceUnavailableException(
          'The assistant is busy right now. Please try again shortly.',
        );
      }
    }
  }

  private async callGemini(
    prompt: string,
    opts: CompleteOptions,
  ): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new ProviderError('GEMINI_API_KEY not configured', undefined);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: opts.json
            ? { responseMimeType: 'application/json' }
            : undefined,
        }),
      },
    );

    if (!res.ok) {
      throw new ProviderError(`Gemini request failed: ${res.status}`, res.status);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      throw new ProviderError('Gemini returned an empty response', res.status);
    }
    return text;
  }

  private async callGroq(
    prompt: string,
    opts: CompleteOptions,
  ): Promise<string> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) throw new ProviderError('GROQ_API_KEY not configured', undefined);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: opts.json ? { type: 'json_object' } : undefined,
      }),
    });

    if (!res.ok) {
      throw new ProviderError(`Groq request failed: ${res.status}`, res.status);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new ProviderError('Groq returned an empty response', res.status);
    }
    return text;
  }

  /** Only fall back to Groq for rate-limit/capacity failures — anything else
   *  (e.g. a malformed request) is a bug that Groq would hit too, so surface it. */
  private isRetryable(err: unknown): boolean {
    if (!(err instanceof ProviderError)) return false;
    return err.status === 429 || (err.status !== undefined && err.status >= 500);
  }
}
