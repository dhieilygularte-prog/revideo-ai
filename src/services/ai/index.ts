import dotenv from 'dotenv';
dotenv.config();

import { AIProviderType } from './types';
import { OpenAIProvider } from './openaiProvider';

export * from './types';
export * from './openaiProvider';
export * from './costTracker';

// Normalização de chaves caso cadastradas como APIOPENAI
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.APIOPENAI || process.env.OPENAI_KEY || process.env.VITE_OPENAI_API_KEY || '';
}

// Instância singleton do provedor OpenAI
export const openAIProvider = new OpenAIProvider();

/**
 * Retorna o provedor ativo do ambiente ('openai').
 */
export function getActiveProviderType(): AIProviderType {
  return 'openai';
}

/**
 * Verifica status das chaves configuradas no ambiente
 */
export function getAIProvidersStatus() {
  const hasOpenAI = Boolean(
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) ||
    (process.env.APIOPENAI && process.env.APIOPENAI.trim().length > 0)
  );

  return {
    activeProvider: getActiveProviderType(),
    openai: {
      configured: hasOpenAI,
      ready: true,
    },
  };
}
