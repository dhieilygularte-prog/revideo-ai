import { AIProviderType, IAIProvider } from './types';
import { OpenAIProvider } from './openaiProvider';

export * from './types';
export * from './openaiProvider';
export * from './costTracker';

// Instância singleton do provedor OpenAI
export const openAIProvider = new OpenAIProvider();

/**
 * Retorna o provedor padrão configurado no ambiente.
 * Por padrão, preserva estritamente 'gemini' conforme diretriz de segurança.
 */
export function getActiveProviderType(): AIProviderType {
  const envProvider = (process.env.AI_PROVIDER || '').toLowerCase();
  if (envProvider === 'openai') {
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
