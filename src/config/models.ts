// ═══ CONFIGURAÇÃO DE MODELOS E REGRAS DE DURAÇÃO ═══

/**
 * Modelo de maior custo-benefício e inteligência da linha Flash para análise de vídeo e estrutura
 * Reduz em até 94% o consumo de créditos mantendo excelente qualidade
 */
export const GEMINI_VISION_MODEL = 'gemini-3.8-flash';

/** Modelo Flash-Lite ultraeconômico para tarefas leves e áudio */
export const GEMINI_VISION_FAST_MODEL = 'gemini-3.1-flash-lite';

/**
 * Modelo Flash Image para geração fotorrealista de imagem (Nano Banana 2 / Flash Image)
 * Custa uma fração do preço da linha Pro e gera em altíssima velocidade
 */
export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';

/** Modelo alternativo Flash-Lite Image */
export const GEMINI_IMAGE_FAST_MODEL = 'gemini-3.1-flash-lite-image';

/** Limite máximo de duração de vídeo aceito pelo app (em segundos) */
export const MAX_VIDEO_DURATION_SECONDS = 40;

/** Duração padrão de cada geração no Google Veo 3.1 (em segundos) */
export const VEO_GENERATION_DURATION_SECONDS = 8;
export const VEO_BASIC_DURATION = 8;
export const VEO_OMNIFLASH_DURATION = 10;

/** Limites de caracteres de fala por cena */
export const MAX_SPEECH_CHARS_8S = 199;
export const MAX_SPEECH_CHARS_10S = 252;

/** Quantidade máxima de imagens de referência por cena */
export const VEO_MAX_REFERENCE_IMAGES_PER_SCENE = 3;

/** Quantidade máxima de variações */
export const MAX_PRODUCT_COLORS = 5;

/**
 * Função utilitária oficial para cálculo de cenas conforme especificação do usuário e modo Veo:
 * Veo 3 Básico (8s):
 * - até 13s: 1 cena
 * - 14 a 19s: 2 cenas
 * - 20 a 26s: 3 cenas
 * - 27 a 35s: 4 cenas
 * - acima de 35s: 5 cenas
 *
 * Veo 3 Omni Flash (10s):
 * - até 15s: 1 cena
 * - 16 a 24s: 2 cenas
 * - 25 a 33s: 3 cenas
 * - acima de 33s: 4 a 5 cenas
 */
export function calculateSceneCount(
  durationSeconds: number,
  mode: 'veo3_basic_8s' | 'veo3_omniflash_10s' = 'veo3_basic_8s'
): number {
  const d = Math.round(durationSeconds || 12);
  if (mode === 'veo3_omniflash_10s') {
    if (d <= 15) return 1;
    if (d <= 24) return 2;
    if (d <= 33) return 3;
    if (d <= 40) return 4;
    return 5;
  }
  if (d <= 13) return 1;
  if (d <= 19) return 2;
  if (d <= 26) return 3;
  if (d <= 35) return 4;
  return 5;
}

export function getMaxSpeechChars(mode: 'veo3_basic_8s' | 'veo3_omniflash_10s' = 'veo3_basic_8s'): number {
  return mode === 'veo3_omniflash_10s' ? MAX_SPEECH_CHARS_10S : MAX_SPEECH_CHARS_8S;
}


/** Bloco inegociável de fidelidade universal para QUALQUER produto comercial */
export const FIDELITY_BLOCK_TEXT = `O produto tem que ser 100% FIEL às fotos de referência que eu enviei. Não pode mudar nem 1%: formato, embalagem, rótulo, materiais, texturas, costuras, tipografia, logotipos, ilustrações, detalhes gráficos e cores. É estritamente proibido inventar, alterar, trocar detalhes ou substituir o produto por itens genéricos. Se algum detalhe não estiver visível na foto, manter simples em vez de alucinar.`;
