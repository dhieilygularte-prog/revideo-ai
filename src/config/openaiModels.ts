// ═══ CONFIGURAÇÃO OFICIAL DE MODELOS OPENAI ESPECIFICADOS PELO USUÁRIO (2026) ═══

/**
 * 1. Cérebro Principal / Análise Visual / Engenharia Reversa / Storyboard / Prompts Finais
 * Modelo: gpt-5.6-terra com reasoning_effort: 'medium'
 * Executa a análise profunda dos quadros extraídos e fotos de referência.
 */
export const OPENAI_BRAIN_MODEL = 'gpt-5.6-terra';
export const OPENAI_REASONING_EFFORT = 'medium' as const;

/**
 * 2. Transcrição do Áudio do Vídeo (Speech-to-Text)
 * Modelo: gpt-transcribe
 * Transcrição de alta fidelidade do áudio comercial extraído do vídeo.
 */
export const OPENAI_AUDIO_MODEL = 'gpt-transcribe';

/**
 * 3. Geração das Imagens Verticais (9:16) com Múltiplas Fotos Reais de Referência
 * Modelo: gpt-image-2.5-sunburst
 * Parâmetros de alta precisão: quality: 'high', input_fidelity: 'high', size: '1024x1792'
 */
export const OPENAI_IMAGE_MODEL = 'gpt-image-2.5-sunburst';
export const OPENAI_IMAGE_QUALITY = 'high' as const;
export const OPENAI_IMAGE_FIDELITY = 'high' as const;
export const OPENAI_IMAGE_SIZE = '1024x1792' as const;

/**
 * 4. Auditoria Visual de Fidelidade de Produto (Fiscal TikTok Shop)
 * Modelo: gpt-5.6-luna
 * Compara minuciosamente a imagem gerada contra as fotos reais enviadas.
 */
export const OPENAI_AUDIT_MODEL = 'gpt-5.6-luna';

/**
 * TABELA OFICIAL DE PREÇOS OPENAI (USD) PARA MEDIÇÃO EXATA DE CUSTOS
 */
export const OPENAI_PRICING = {
  // gpt-5.6-terra (USD per 1M tokens)
  terra: {
    inputPer1M: 2.00,
    outputPer1M: 12.00,
  },
  // gpt-5.6-luna (USD per 1M tokens)
  luna: {
    inputPer1M: 0.20,
    outputPer1M: 1.00,
  },
  // gpt-transcribe (USD per minute)
  transcribe: {
    perMinuteUSD: 0.006,
    perSecondUSD: 0.0001,
  },
  // gpt-image-2.5-sunburst (USD per image high quality 1024x1792)
  sunburst: {
    perImageHighUSD: 0.08,
    perImageStandardUSD: 0.04,
  },
  usdToBrl: 5.70,
};
