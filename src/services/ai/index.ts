import { AIProviderType, IAIProvider } from './types';
import { OpenAIProvider } from './openaiProvider';

export * from './types';
export * from './openaiProvider';
export * from './costTracker';

// Normalização de chaves caso cadastradas como APIOPENAI ou GEMINIAPI
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.APIOPENAI || process.env.OPENAI_KEY || process.env.VITE_OPENAI_API_KEY || '';
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.GEMINIAPI || process.env.GEMINI_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

// Instância singleton do provedor OpenAI
export const openAIProvider = new OpenAIProvider();

/**
 * Retorna o provedor padrão configurado no ambiente.
 * Por padrão, preserva estritamente 'gemini' conforme diretriz de segurança.
 */
export function getActiveProviderType(): AIProviderType {
  const hasOpenAi = Boolean(
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) ||
    (process.env.APIOPENAI && process.env.APIOPENAI.trim().length > 0)
  );
  const hasGemini = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) ||
    (process.env.GEMINIAPI && process.env.GEMINIAPI.trim().length > 0)
  );
  const envProvider = (process.env.AI_PROVIDER || '').toLowerCase();

  if (envProvider === 'openai' && hasOpenAi) {
    return 'openai';
  }
  if (envProvider === 'gemini' && hasGemini) {
    return 'gemini';
  }
  if (hasGemini) {
    return 'gemini';
  }
  if (hasOpenAi) {
    return 'openai';
  }
  return 'gemini';
}

/**
 * Verifica status das chaves configuradas no ambiente
 */
export function getAIProvidersStatus() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);

  return {
    activeProvider: getActiveProviderType(),
    gemini: {
      configured: hasGemini,
    },
    openai: {
      configured: hasOpenAI,
      ready: true,
    },
  };
}
