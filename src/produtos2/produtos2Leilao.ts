/**
 * MODO LEILÃO - Base de conhecimento e lógica do Criativo de Leilão (30s / 3 Gerações no Veo 3)
 * Baseado estritamente em:
 * - INSTRUÇÃO 1 — MODO LEILÃO: COMO FOI FEITO (base de conhecimento)
 * - INSTRUÇÃO 2 — MODO LEILÃO: O QUE IMPLEMENTAR NO APLICATIVO
 */

import { Produtos2Variation } from './types';

export interface LeilaoBidsResult {
  l1: number;
  l2: number;
  l1Text: string;
  l2Text: string;
}

export interface LeilaoSpeechParts {
  cena1: string;
  cena1A: string;
  cena1B: string;
  cena1C?: string;
  cena2: string;
  cena2A: string;
  cena2B: string;
  cena2C?: string;
  cena3: string;
  full: string;
}

export interface LeilaoBlockItem {
  blockNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  quadrosLabel: string;
  resolution: string;
  imageUrl?: string;
  imageError?: string;
  isRegenerating?: boolean;
  imagePrompt: string;
  veoPrompt: string;
  falaText: string;
}

export interface LeilaoBlockDetails {
  storyboardImageUrl?: string;
  storyboardImagePrompt?: string;
  veoPrompt?: string;
  speechText?: string;
  videoAudit?: any;
}

export interface Produtos2LeilaoResultState {
  realPrice?: number;
  l1?: number;
  l2?: number;
  l1Text?: string;
  l2Text?: string;
  bids: LeilaoBidsResult;
  speeches: LeilaoSpeechParts;
  productSize?: 'pequeno_medio' | 'grande';
  shortName?: string;
  fullName?: string;
  benefits?: string[];
  presenterDescription?: string;
  presenterClothing?: string;
  presenterGender?: 'masculino' | 'feminino';
  presenterVoice?: string;
  cena1Speech?: string;
  cena2Speech?: string;
  cena3Speech?: string;
  block1?: LeilaoBlockItem;
  block2?: LeilaoBlockItem;
  block3?: LeilaoBlockItem;
  bloco1: LeilaoBlockDetails;
  bloco2: LeilaoBlockDetails;
  bloco3: LeilaoBlockDetails;
}

/**
 * Converte números inteiros comuns em palavras por extenso em português brasileiro
 * com foco específico nos valores de lances de leilão (ex.: 6.000 -> "seis mil", 1.500 -> "mil e quinhentos").
 */
export function numberToPortugueseWords(num: number): string {
  const n = Math.round(Math.abs(num));
  if (n === 0) return 'zero';

  const unidades = [
    '',
    'um',
    'dois',
    'três',
    'quatro',
    'cinco',
    'seis',
    'sete',
    'oito',
    'nove',
  ];
  const especiais10a19 = [
    'dez',
    'onze',
    'doze',
    'treze',
    'quatorze',
    'quinze',
    'dezesseis',
    'dezessete',
    'dezoito',
    'dezenove',
  ];
  const dezenas = [
    '',
    '',
    'vinte',
    'trinta',
    'quarenta',
    'cinquenta',
    'sessenta',
    'setenta',
    'oitenta',
    'noventa',
  ];
  const centenas = [
    '',
    'cento',
    'duzentos',
    'trezentos',
    'quatrocentos',
    'quinhentos',
    'seiscentos',
    'setecentos',
    'oitocentos',
    'novecentos',
  ];

  function convertBelow1000(val: number): string {
    if (val === 0) return '';
    if (val === 100) return 'cem';

    const parts: string[] = [];
    const c = Math.floor(val / 100);
    const d = Math.floor((val % 100) / 10);
    const u = val % 10;

    if (c > 0) parts.push(centenas[c]);

    const du = val % 100;
    if (du >= 10 && du <= 19) {
      parts.push(especiais10a19[du - 10]);
    } else {
      if (d > 0) parts.push(dezenas[d]);
      if (u > 0) parts.push(unidades[u]);
    }

    return parts.join(' e ');
  }

  if (n < 1000) {
    return convertBelow1000(n);
  }

  const milhar = Math.floor(n / 1000);
  const resto = n % 1000;

  let milharText = '';
  if (milhar === 1) {
    milharText = 'mil';
  } else {
    milharText = `${convertBelow1000(milhar)} mil`;
  }

  if (resto === 0) {
    return milharText;
  }

  // Se o resto for menor que 100 ou múltiplo de 100 (ex: mil e quinhentos), conecta com "e"
  if (resto < 100 || resto % 100 === 0) {
    return `${milharText} e ${convertBelow1000(resto)}`;
  }

  return `${milharText}, ${convertBelow1000(resto)}`;
}

/**
 * Calcula o 1º e 2º lances do leilão conforme regras da Seção 2 da Instrução 1:
 * - L1 = preço real * 1,6
 * - Arredondamento de L1:
 *   - >= R$ 5.000: múltiplo de 1.000 mais próximo
 *   - R$ 1.000 a R$ 4.999: múltiplo de 500 mais próximo
 *   - < R$ 1.000: múltiplo de 50 mais próximo
 * - L2:
 *   - Se L1 >= R$ 4.000: L2 = L1 - 1.000
 *   - Se L1 < R$ 4.000: L2 = L1 * 0,8, arredondado para múltiplo de 100 (ou 50 se < 1.000)
 * - Checagem obrigatória: L2 >= preço real * 1,25 (pelo menos 25% maior que o preço real).
 *   Se não for, sobe L1 um degrau de arredondamento e recalcula L2.
 */
export function calculateLeilaoBids(realPrice: number): LeilaoBidsResult {
  if (!realPrice || realPrice <= 0 || isNaN(realPrice)) {
    return { l1: 0, l2: 0, l1Text: '', l2Text: '' };
  }

  const roundL1 = (val: number): number => {
    if (val >= 5000) {
      return Math.round(val / 1000) * 1000;
    } else if (val >= 1000) {
      return Math.round(val / 500) * 500;
    } else {
      return Math.round(val / 50) * 50;
    }
  };

  const getStep = (val: number): number => {
    if (val >= 5000) return 1000;
    if (val >= 1000) return 500;
    return 50;
  };

  let l1 = roundL1(realPrice * 1.6);

  const calculateL2 = (currentL1: number): number => {
    if (currentL1 >= 4000) {
      return currentL1 - 1000;
    } else {
      const rawL2 = currentL1 * 0.8;
      if (rawL2 < 1000) {
        return Math.round(rawL2 / 50) * 50;
      } else {
        return Math.round(rawL2 / 100) * 100;
      }
    }
  };

  let l2 = calculateL2(l1);

  // Checagem obrigatória: L2 >= preço real * 1.25
  const minRequiredL2 = realPrice * 1.25;
  let safetyLoop = 0;
  while (l2 < minRequiredL2 && safetyLoop < 20) {
    l1 += getStep(l1);
    l2 = calculateL2(l1);
    safetyLoop++;
  }

  return {
    l1,
    l2,
    l1Text: numberToPortugueseWords(l1),
    l2Text: numberToPortugueseWords(l2),
  };
}

/**
 * Tenta extrair o preço real do texto de informações do produto.
 * Suporta formatos: "R$ 3.848,00", "R$ 3.848", "3848,00", "preço: 3.848", "R$2399", etc.
 */
export function extractPriceFromProductInfo(info: string): number | null {
  if (!info || typeof info !== 'string') return null;

  // 1. Padrões explícitos com R$
  const rDollarMatch = info.match(
    /(?:R\$\s*|pre[çc]o\s*(?:[eé:]\s*)?|por\s*(?:apenas\s*)?(?:R\$\s*)?)(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i
  );
  if (rDollarMatch && rDollarMatch[1]) {
    const rawVal = rDollarMatch[1]
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 5) {
      return Math.round(parsed);
    }
  }

  // 2. Padrões com "R$" isolado seguido de número
  const standaloneR$ = info.match(/R\$\s*(\d+)/i);
  if (standaloneR$ && standaloneR$[1]) {
    const parsed = parseInt(standaloneR$[1], 10);
    if (!isNaN(parsed) && parsed > 5) {
      return parsed;
    }
  }

  return null;
}

/**
 * Classifica automaticamente o tamanho do produto para definir o púlpito nas imagens 3 e 4:
 * - pequeno_medio: cabe numa mesa (celular, notebook, fone, relógio, eletrônico pequeno, perfume, utensílio)
 * - grande: fica no chão (carrinho de bebê, cortador de grama, bicicleta ou patinete elétrico, móvel, eletrodoméstico grande)
 */
export function classifyProductSize(productName: string, productInfo: string): 'pequeno_medio' | 'grande' {
  const combined = `${productName} ${productInfo}`.toLowerCase();

  const largeKeywords = [
    'patinete',
    'bicicleta',
    'bike',
    'moto',
    'scooter',
    'carrinho de beb',
    'carrinho de crianca',
    'carrinho infantil',
    'cortador de grama',
    'esteira',
    'ergométrica',
    'ergometrica',
    'sofá',
    'sofa',
    'poltrona',
    'guarda-roupa',
    'guarda roupa',
    'armário',
    'armario',
    'geladeira',
    'fogão',
    'fogao',
    'lavadora',
    'máquina de lavar',
    'maquina de lavar',
    'lava e seca',
    'freezer',
    'ar-condicionado',
    'ar condicionado',
    'colchão',
    'colchao',
    'cama',
    'berço',
    'berco',
  ];

  for (const kw of largeKeywords) {
    if (combined.includes(kw)) {
      return 'grande';
    }
  }

  return 'pequeno_medio';
}

/**
 * Sanitiza texto para narração por voz IA:
 * - Remove marcas registradas e símbolos proibidos para narração IA (®, ™, ©, etc.)
 * - Remove asteriscos, bullets, barras e caracteres de formatação
 * - Remove reticências que truncam palavras
 */
export function sanitizeTextForAISpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/[®™©℠]/g, '')
    .replace(/[*_~•|/\\#]/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai nome curto (2 a 4 palavras) e nome completo/modelo do produto.
 */
export function extractLeilaoProductNames(productName: string, productInfo?: string): {
  shortName: string;
  fullName: string;
} {
  const cleanName = sanitizeTextForAISpeech(productName)
    .replace(/[•\n\r|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanName.split(' ').filter(Boolean);
  let shortName = words.slice(0, 4).join(' ');
  if (!shortName) shortName = 'produto';

  let fullName = words.slice(0, 5).join(' ');
  if (!fullName) fullName = shortName;

  return { shortName, fullName };
}

/**
 * Converte números e especificações técnicas para texto falado por extenso
 * (para o Veo pronunciar com perfeição).
 */
export function formatSpecsForSpokenPortuguese(text: string): string {
  if (!text) return '';

  return text
    .replace(/[®™©℠]/g, '')
    .replace(/(\d+(?:[.,]\d+)?)\s*["”']\s*(?:polegadas)?/gi, (_, n) => `${numberToPortugueseWords(parseFloat(n.replace(',', '.')))} polegadas`)
    .replace(/(\d+)\s*hz/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} hertz`)
    .replace(/(\d+)\s*w\b/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} watts`)
    .replace(/(\d+)\s*mah/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} miliamperes`)
    .replace(/(\d+)\s*gb/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} gigas`)
    .replace(/(\d+)\s*tb/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} teras`)
    .replace(/(\d+)\s*mp/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} megapixels`)
    .replace(/(\d+)\s*kg/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} quilos`)
    .replace(/(\d+)\s*km\/h/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} quilômetros por hora`)
    .replace(/(\d+)\s*h\b/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} horas`)
    .replace(/5G\b/g, 'cinco G')
    .replace(/4G\b/g, 'quatro G')
    .replace(/4K\b/g, 'quatro K')
    .replace(/8K\b/g, 'oito K')
    .replace(/Ryzen\s*7\b/gi, 'Ryzen 7')
    .replace(/Ryzen\s*5\b/gi, 'Ryzen 5')
    .replace(/Core\s*i7\b/gi, 'Core i7')
    .replace(/Core\s*i5\b/gi, 'Core i5')
    .replace(/Core\s*i9\b/gi, 'Core i9')
    .replace(/anti-reflexo/gi, 'antirreflexo')
    .replace(/120Hz/gi, 'cento e vinte hertz')
    .replace(/60Hz/gi, 'sessenta hertz')
    .replace(/144Hz/gi, 'cento e quarenta e quatro hertz')
    .replace(/1080p/gi, 'Full HD')
    .replace(/WUXGA/gi, 'Full HD')
    .replace(/IPS/gi, 'IPS')
    .replace(/LED/gi, 'LED')
    .replace(/OLED/gi, 'OLED')
    .replace(/AMOLED/gi, 'AMOLED')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai até 2 benefícios concretos das informações do produto:
 * - NUNCA repete o nome do produto
 * - NUNCA inclui marcas registradas (® ou ™)
 * - NUNCA corta palavras no meio com reticências
 * - Prioriza especificações nobres (Tela, Processador, Memória, Jato, Bateria)
 */
export function extractLeilaoBenefits(productInfo: string, productName: string): string[] {
  if (!productInfo || typeof productInfo !== 'string') {
    return ['Alta potência e desempenho premium', 'Construção reforçada de longa durabilidade'];
  }

  const cleanInfo = productInfo
    .replace(/[®™©℠]/g, '')
    .replace(/[*_~•|/\\#]/g, ' ')
    .replace(/\s+/g, ' ');

  const cleanProd = (productName || '')
    .replace(/[®™©℠]/g, '')
    .trim();

  const foundBenefits: string[] = [];

  // 1. Detectores de padrões nobres para eletrônicos / tecnologia (Notebooks, Smartphones, Gadgets)
  // Tela (ex: Tela de 16 polegadas IPS antirreflexo)
  const screenMatch = cleanInfo.match(/(?:tela|display|monitor)\s*(?:de)?\s*(\d+(?:[.,]\d+)?\s*(?:["”']|polegadas)?(?:\s*(?:ips|oled|amoled|fhd|full\s*hd|antirreflexo|anti-reflexo|retina|\d+\s*hz))*)/i);
  if (screenMatch && screenMatch[1]) {
    let screenText = `Tela de ${screenMatch[1].trim()}`
      .replace(/["”']/g, ' polegadas')
      .replace(/anti-reflexo/gi, 'antirreflexo')
      .replace(/\s+/g, ' ');
    if (!screenText.toLowerCase().includes('polegadas')) {
      screenText = screenText.replace(/Tela de (\d+)/i, 'Tela de $1 polegadas');
    }
    foundBenefits.push(screenText);
  }

  // Processador (ex: Processador AMD Ryzen 7)
  const procMatch = cleanInfo.match(/(?:processador|chip|cpu)?\s*(amd\s*ryzen\s*\d+|intel\s*core\s*i\d+|snapdragon\s*[\d\w+]+|apple\s*m\d+)/i);
  if (procMatch && procMatch[1]) {
    const procText = `Processador ${procMatch[1].trim().replace(/\s+/g, ' ')}`;
    foundBenefits.push(procText);
  }

  // Jato de água / Limpeza (para Irrigador Oral / Bucal)
  const jatoMatch = cleanInfo.match(/(jato\s*(?:de\s*)?[aá]gua\s*(?:pressurizado|de\s*alta\s*press[aã]o)?|limpeza\s*profunda(?:\s*entre\s*os\s*dentes)?)/i);
  if (jatoMatch && jatoMatch[1]) {
    foundBenefits.push('Jato de água pressurizado para limpeza profunda');
  }

  // Bateria recarregável / Autonomia
  const batMatch = cleanInfo.match(/(bateria\s*(?:recarreg[aá]vel\s*)?de\s*longa\s*dura[cç][aã]o|bateria\s*de\s*\d+\s*m?ah|autonomia\s*de\s*(?:at[eé]\s*)?\d+\s*horas?)/i);
  if (batMatch && batMatch[1] && foundBenefits.length < 2) {
    foundBenefits.push('Bateria recarregável de longa duração');
  }

  // Memória RAM (se ainda não temos 2)
  if (foundBenefits.length < 2) {
    const ramMatch = cleanInfo.match(/(\d+\s*(?:gb|gigas)\s*(?:de\s*)?ram)/i);
    if (ramMatch && ramMatch[1]) {
      foundBenefits.push(`${ramMatch[1].replace(/gb/i, 'gigas de')} RAM`);
    }
  }

  // Armazenamento SSD (se ainda não temos 2)
  if (foundBenefits.length < 2) {
    const ssdMatch = cleanInfo.match(/(\d+\s*(?:gb|tb)\s*ssd)/i);
    if (ssdMatch && ssdMatch[1]) {
      foundBenefits.push('Armazenamento SSD de alta velocidade');
    }
  }

  // Se já encontrou 2 benefícios específicos por padrão nobre, retorna
  if (foundBenefits.length >= 2) {
    return foundBenefits.slice(0, 2).map((b) => b.trim().replace(/[.,;]+$/, ''));
  }

  // 2. Extração por linhas/frases com filtro estrito anti-repetição do produto
  const prodTokens = cleanProd
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const lines = productInfo
    .split(/[\n\r•\-\*;|]/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length >= 8 &&
        !/seguran[cç]a|perigo|cuidado|aviso|garantia|sac|fabricado|cnpj|c[oó]digo|dimens[oõ]es|peso|embalagem|linux|windows/i.test(l)
    );

  for (const rawLine of lines) {
    if (foundBenefits.length >= 2) break;

    let clean = rawLine
      .replace(/^[0-9a-zA-ZÀ-ÿ\s]+:\s*/, '')
      .replace(/[®™©℠]/g, '')
      .replace(/[*_~•|/\\#]/g, ' ')
      .trim();

    // Remove tokens do nome do produto no início para não duplicar
    for (const t of prodTokens) {
      const reg = new RegExp(`^${t}\\b[:\\s-]*`, 'gi');
      clean = clean.replace(reg, '').trim();
    }

    if (clean.length < 6) continue;

    // Pega a primeira oração completa
    const clause = clean.split(/[,.;]/)[0].trim();
    if (clause.length >= 8 && clause.length <= 50) {
      if (!foundBenefits.some((b) => b.toLowerCase().includes(clause.toLowerCase().slice(0, 10)))) {
        foundBenefits.push(clause);
      }
    } else if (clean.length > 50) {
      // Pega até 5-6 palavras sem cortar palavra no meio
      const words = clean.split(/\s+/).slice(0, 6).join(' ');
      if (words.length >= 8) {
        foundBenefits.push(words);
      }
    }
  }

  if (foundBenefits.length === 0) {
    foundBenefits.push('Alta performance e velocidade');
    foundBenefits.push('Construção reforçada de longa durabilidade');
  } else if (foundBenefits.length === 1) {
    foundBenefits.push('Acabamento premium de alta resistência');
  }

  return foundBenefits.slice(0, 2).map((b) => {
    const trimmed = b.trim().replace(/[.,;]+$/, '');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  });
}

/**
 * Constrói a descrição e atributos do apresentador conforme Seção 4 da Instrução 1:
 * - Padrão: homem branco de cerca de 55 anos, cabelo grisalho penteado para trás, barba grisalha cheia e bem aparada, terno azul royal.
 * - Instruções adicionais substituem SOMENTE as características do apresentador (sexo, pele, idade, corpo, cabelo, barba, roupa).
 */
export function buildLeilaoPresenter(additionalInstructions?: string): {
  presenterDescription: string;
  presenterClothing: string;
  gender: 'masculino' | 'feminino';
  voiceLabel: string;
} {
  const instructions = (additionalInstructions || '').toLowerCase();

  const isFemale =
    /\bmulher\b|\bfeminina\b|\bgarota\b|\bapresentadora\b|\belas\b|\bvestido\b|\bmoça\b|\bsenhora\b/i.test(instructions);

  const gender: 'masculino' | 'feminino' = isFemale ? 'feminino' : 'masculino';
  const voiceLabel = isFemale ? 'feminina' : 'masculina';

  const cleanInstructions = (additionalInstructions || '').trim();

  // Roupa padrão
  let presenterClothing = isFemale
    ? 'terno feminino elegante bordô de corte clássico de alfaiataria, com camisa social clara'
    : 'terno azul royal clássico de três peças com colete, camisa branca e gravata cinza';

  let presenterDescription = isFemale
    ? 'mulher elegante de cerca de 45 anos, cabelo preso refinado, postura confiante de leiloeira'
    : 'homem branco de cerca de 55 anos, cabelo grisalho penteado para trás, barba grisalha cheia e bem aparada';

  if (cleanInstructions.length > 2) {
    // Se o usuário passou instruções específicas para o apresentador nas informações adicionais
    presenterDescription = cleanInstructions;
    if (/terno|vestido|camisa|blazer|roupa|jaqueta/i.test(cleanInstructions)) {
      presenterClothing = 'roupa social elegante de leiloeiro(a) descrita nas orientações';
    }
  }

  return {
    presenterDescription,
    presenterClothing,
    gender,
    voiceLabel,
  };
}

/**
 * Constrói as Falas Oficiais do Modo Leilão usando a matriz fixa da Correção 2:
 * - CENA 1: 1A = "Quem dá [L1] reais nesse [NOME CURTO]?" · 1B = "Quem dá [L2]? Dou-lhe uma!" · 1C = "Peraí... Olha o valor desse [NOME CURTO] no TikTok Shop. Tá de graça!"
 * - CENA 2: 2A = "Leilão cancelado! Esse é o [NOME COMPLETO]." · 2B = "[BENEFÍCIO 1]." · 2C = "[BENEFÍCIO 2]."
 * - CENA 3: "Por esse valor, não tem como fazer leilão! Clica no carrinho laranja e garante o seu!"
 */
export function buildLeilaoSpeeches(params: {
  productName: string;
  productInfo: string;
  realPrice: number;
  additionalInstructions?: string;
  userSpeech?: string;
}): {
  leilaoSpeech: LeilaoSpeechParts;
  userSpeechLeilao?: LeilaoSpeechParts;
  shortName: string;
  fullName: string;
  benefits: string[];
  l1: number;
  l2: number;
  l1Text: string;
  l2Text: string;
} {
  const { productName, productInfo, realPrice, additionalInstructions, userSpeech } = params;

  const bids = calculateLeilaoBids(realPrice);
  const { shortName, fullName } = extractLeilaoProductNames(productName, productInfo);
  const benefits = extractLeilaoBenefits(productInfo, productName);

  const cleanShortName = sanitizeTextForAISpeech(shortName);
  const cleanFullName = sanitizeTextForAISpeech(fullName);

  const l1Words = bids.l1Text || 'quatro mil';
  const l2Words = bids.l2Text || 'três mil';

  // CENA 1: fiel ao modelo original (dividida em 3 partes: 1A, 1B e 1C)
  const cena1A = `Quem dá ${l1Words} reais nesse ${cleanShortName}?`;
  const cena1B = `Quem dá ${l2Words}? Dou-lhe uma!`;
  const cena1C = `Peraí... Olha o valor desse ${cleanShortName} no TikTok Shop. Tá de graça!`;
  const cena1 = `${cena1A} ${cena1B} ${cena1C}`.trim();

  // CENA 2: fiel ao modelo original
  // "Leilão cancelado! Esse é o [NOME COMPLETO]. [BENEFÍCIO 1]. [BENEFÍCIO 2]."
  // NUNCA repetir o nome do produto no benefício 1 e 2!
  let b1 = sanitizeTextForAISpeech(benefits[0] || 'Desempenho de alta performance');
  let b2 = sanitizeTextForAISpeech(benefits[1] || 'Construção reforçada');

  // Garante que b1 e b2 não comecem repetindo o produto
  const prodTokens = cleanFullName.toLowerCase().split(/\s+/);
  for (const t of prodTokens) {
    if (t.length >= 3) {
      b1 = b1.replace(new RegExp(`^${t}\\b[:\\s-]*`, 'gi'), '').trim();
      b2 = b2.replace(new RegExp(`^${t}\\b[:\\s-]*`, 'gi'), '').trim();
    }
  }
  b1 = b1 ? b1.charAt(0).toUpperCase() + b1.slice(1) : 'Desempenho de alta performance';
  b2 = b2 ? b2.charAt(0).toUpperCase() + b2.slice(1) : 'Construção reforçada';

  const cena2A = `Leilão cancelado! Esse é o ${cleanFullName}.`;
  const cena2B = `${b1}.`;
  const cena2C = `${b2}.`;
  let cena2 = `${cena2A} ${cena2B} ${cena2C}`.trim();

  // Garantir que a Cena 2 não ultrapasse 250 caracteres sem cortar palavras
  if (cena2.length > 250) {
    cena2 = `${cena2A} ${cena2B}`.trim();
    if (cena2.length > 250) {
      const cutIdx = cena2.slice(0, 240).lastIndexOf(' ');
      cena2 = (cutIdx > 0 ? cena2.slice(0, cutIdx) : cena2.slice(0, 240)).trim() + '.';
    }
  }

  // CENA 3: fiel ao modelo original
  const cena3 = `Por esse valor, não tem como fazer leilão! Clica no carrinho laranja e garante o seu!`;

  const full = `${cena1} ${cena2} ${cena3}`;

  const leilaoSpeech: LeilaoSpeechParts = {
    cena1,
    cena1A,
    cena1B,
    cena1C,
    cena2,
    cena2A,
    cena2B,
    cena2C,
    cena3,
    full,
  };

  // Fala do Usuário se fornecida
  let userSpeechLeilao: LeilaoSpeechParts | undefined = undefined;
  if (userSpeech && userSpeech.trim().length > 10) {
    const rawUser = userSpeech.trim();
    const parts = rawUser.split(/\s*\|\s*|\s*\n\s*\n\s*/);
    if (parts.length >= 3) {
      const u1 = parts[0].slice(0, 250).trim();
      const u2 = parts[1].slice(0, 250).trim();
      const u3 = parts[2].slice(0, 250).trim();
      userSpeechLeilao = {
        cena1: u1,
        cena1A: u1,
        cena1B: '',
        cena2: u2,
        cena2A: u2,
        cena2B: '',
        cena2C: '',
        cena3: u3,
        full: `${u1} ${u2} ${u3}`,
      };
    } else {
      const words = rawUser.split(' ');
      const w1 = words.slice(0, Math.floor(words.length / 3)).join(' ');
      const w2 = words.slice(Math.floor(words.length / 3), Math.floor((2 * words.length) / 3)).join(' ');
      const w3 = words.slice(Math.floor((2 * words.length) / 3)).join(' ');
      userSpeechLeilao = {
        cena1: w1.slice(0, 250),
        cena1A: w1.slice(0, 250),
        cena1B: '',
        cena2: w2.slice(0, 250),
        cena2A: w2.slice(0, 250),
        cena2B: '',
        cena2C: '',
        cena3: w3.slice(0, 250),
        full: rawUser,
      };
    }
  }

  return {
    leilaoSpeech,
    userSpeechLeilao,
    shortName,
    fullName,
    benefits,
    l1: bids.l1,
    l2: bids.l2,
    l1Text: bids.l1Text,
    l2Text: bids.l2Text,
  };
}

/**
 * Constrói os Prompts de Imagem (Blocos 1, 2 e 3) e os Prompts do Veo 3 (Gerações 1, 2 e 3)
 * para o Modo Leilão conforme a CORREÇÃO 2: O PRODUTO APARECE EM TODAS AS CENAS.
 */
export function buildLeilaoBlockPrompts(params: {
  productName: string;
  productInfo: string;
  realPrice: number;
  productSize: 'pequeno_medio' | 'grande';
  additionalInstructions?: string;
  speeches: LeilaoSpeechParts;
  benefits?: string[];
}): {
  bloco1ImagePrompt: string;
  bloco2ImagePrompt: string;
  bloco3ImagePrompt: string;
  veoPrompt1: string;
  veoPrompt2: string;
  veoPrompt3: string;
} {
  const { productName, productInfo, productSize, additionalInstructions, speeches } = params;

  const presenter = buildLeilaoPresenter(additionalInstructions);
  const presenterDesc = presenter.presenterDescription;
  const presenterClothing = presenter.presenterClothing;
  const presenterVoice = presenter.voiceLabel;

  // Extrai benefícios específicos caso não tenham sido passados
  const prodBenefits = params.benefits || extractLeilaoBenefits(productInfo, productName);
  const beneficio1 = prodBenefits[0] || 'tela de bordas finas com acabamento de alta precisão';
  const beneficio2 = prodBenefits[1] || 'teclado e conectores de alta qualidade e resistência';

  // Posição do produto conforme o tamanho (pequeno/médio x grande)
  const posicaoProduto =
    productSize === 'grande'
      ? 'sobre uma plataforma baixa de madeira escura (cerca de um palmo de altura), no palco ao lado do púlpito, inteiro e de frente para a câmera'
      : 'em cima do púlpito alto de madeira escura, ao lado do apresentador, com a frente virada para a câmera';

  const framingQuadro4 =
    productSize === 'grande'
      ? 'enquadramento mais aberto, mostrando o produto inteiro sobre a plataforma baixa ao lado do púlpito'
      : 'mostrando o produto sobre o púlpito';

  // =========================================================================
  // STORYBOARD 1 (GERAÇÃO 1): UMA IMAGEM HORIZONTAL 16:9 (1920x1080 / 3840x2160)
  // Contendo 3 colunas verticais lado a lado, numeradas 1, 2 e 3
  // O produto aparece em todos os 3 quadros no púlpito/plataforma e no telão ao fundo
  // =========================================================================
  const bloco1ImagePrompt = `Com base nas fotos de referência do produto, crie UMA imagem panorâmica HORIZONTAL no formato 16:9 widescreen (1920 pixels de largura por 1080 pixels de altura, orientação paisagem / landscape de tela de computador ou TV). É TERMINANTEMENTE PROIBIDO gerar imagem vertical; a largura DEVE ser muito maior que a altura.

========================
ESTRUTURA DE ALTURA TOTAL (OBRIGATÓRIO):
A tela horizontal 16:9 é dividida igualmente em 3 colunas verticais lado a lado da esquerda para a direita (cada coluna com formato de tela cheia vertical 9:16 de smartphone, grade 1 linha x 3 colunas).
ENQUADRAMENTO DE ALTURA TOTAL: Cada uma das 3 colunas verticais DEVE PREENCHER 100% DA ALTURA DA IMAGEM, do topo extremo à base extrema (de cima a baixo, ocupando todos os 1080 pixels de altura), exatamente como uma gravação de celular em pé.
PROIBIÇÃO RIGOROSA DE BARRAS/LETTERBOX: É TERMINANTEMENTE PROIBIDO gerar faixas pretas, barras escuras, bordas ou letterbox em cima ou embaixo da imagem! Os quadros NÃO podem ser quadrados nem achatados no centro. Cada coluna vertical é alta, esbelta (proporção 9:16) e vai do topo da imagem até o chão/base da imagem.
Separadores: linhas divisórias brancas finas entre as 3 colunas verticais.
No canto superior direito de cada coluna, um pequeno círculo branco com o número em preto: 1, 2 e 3. Esses números são o ÚNICO texto da imagem.
========================

O mesmo apresentador, idêntico nos 3 quadros: ${presenterDesc}, com ${presenterClothing}.
O ${productName} aparece nos 3 quadros, exatamente idêntico às fotos de referência (cor, formato, proporção, logotipo e acabamento), sempre na mesma posição: ${posicaoProduto}.

QUADRO 1 (Coluna da esquerda): interior de uma casa de leilões luxuosa e clássica, estilo teatro europeu: lustres de cristal dourados, camarotes em dois andares com colunas douradas, luz quente. Câmera atrás da plateia, na altura das pessoas. No palco de piso de madeira clara, o apresentador de pé atrás do púlpito de madeira escura, com o braço direito erguido segurando um martelo de leilão, e o produto ao lado dele, visível. Ao fundo, acima do palco, um telão grande mostra apenas a foto do produto, de frente. Em primeiro plano, de costas, a plateia elegante de terno escuro, várias pessoas levantando plaquinhas de lance brancas e lisas.

QUADRO 2 (Coluna central): o mesmo salão e o mesmo momento, com a câmera mais perto do palco. O apresentador de pé, de frente, atrás do púlpito, aparece dos joelhos para cima, com uma mão apoiada no púlpito e a outra apontando para a plateia, com postura confiante de leiloeiro. O produto está ao lado dele, bem visível e nítido, de frente para a câmera. O martelo fica do outro lado do púlpito. Em primeiro plano, desfocadas, mãos da plateia levantando plaquinhas brancas e lisas.

QUADRO 3 (Coluna da direita): close do apresentador, da cintura para cima, atrás do púlpito. Com a mão direita ele segura o martelo de leilão (madeira com anel dourado) apoiado na base. Com a mão esquerda ele segura um smartphone preto e olha a tela em choque total: olhos arregalados, sobrancelhas levantadas, boca entreaberta. Em primeiro plano, no púlpito, o produto aparece grande, nítido e de frente para a câmera. Fundo desfocado: plateia com plaquinhas brancas e lisas e o telão com a foto do produto.

Fotorrealista, aparência de foto real em todos os quadros, luz quente de evento. Nenhum texto, número, letreiro ou logotipo além dos números dos quadros e do logotipo que já faz parte do próprio produto. Nenhum outro produto além desse.`;

  // =========================================================================
  // STORYBOARD 2 (GERAÇÃO 2): UMA IMAGEM HORIZONTAL 16:9 (1920x1080 / 3840x2160)
  // Contendo 3 colunas verticais lado a lado, numeradas 4, 5 e 6
  // Quadro 4: Salão de leilão contínuo, produto no púlpito, apresentador de mãos abertas ("tcharam!")
  // Quadros 5 e 6: Closes do produto sobre superfície preta fosca e fundo preto destacando benefícios 1 e 2
  // =========================================================================
  const bloco2ImagePrompt = `Com base nas fotos de referência do produto, crie UMA imagem panorâmica HORIZONTAL no formato 16:9 widescreen (1920 pixels de largura por 1080 pixels de altura, orientação paisagem / landscape de tela de computador ou TV). É TERMINANTEMENTE PROIBIDO gerar imagem vertical; a largura DEVE ser muito maior que a altura.

========================
ESTRUTURA DE ALTURA TOTAL (OBRIGATÓRIO):
A tela horizontal 16:9 é dividida igualmente em 3 colunas verticais lado a lado da esquerda para a direita (cada coluna com formato de tela cheia vertical 9:16 de smartphone, grade 1 linha x 3 colunas).
ENQUADRAMENTO DE ALTURA TOTAL: Cada uma das 3 colunas verticais DEVE PREENCHER 100% DA ALTURA DA IMAGEM, do topo extremo à base extrema (de cima a baixo, ocupando todos os 1080 pixels de altura), exatamente como uma gravação de celular em pé.
PROIBIÇÃO RIGOROSA DE BARRAS/LETTERBOX: É TERMINANTEMENTE PROIBIDO gerar faixas pretas, barras escuras, bordas ou letterbox em cima ou embaixo da imagem! Os quadros NÃO podem ser quadrados nem achatados no centro. Cada coluna vertical é alta, esbelta (proporção 9:16) e vai do topo da imagem até o chão/base da imagem.
Separadores: linhas divisórias brancas finas entre as 3 colunas verticais.
No canto superior direito de cada coluna, um pequeno círculo branco com o número em preto: 4, 5 e 6. Esses números são o ÚNICO texto da imagem.
========================

O mesmo apresentador dos quadros anteriores, idêntico: ${presenterDesc}, com ${presenterClothing}.
O ${productName} é exatamente idêntico às fotos de referência (cor, formato, proporção, logotipo, acabamento e detalhes), nítido e bem visível em todos os quadros.

QUADRO 4 (Coluna da esquerda): o mesmo salão de leilão clássico, com luz quente e a plateia desfocada ao fundo. O apresentador atrás do púlpito de madeira escura, enquadrado do peito para cima (${framingQuadro4}), sorrindo largo, com as duas mãos abertas em direção ao produto, num gesto de apresentação ("tcharam!"). O produto está ${posicaoProduto}, no centro da atenção, com a frente principal virada para a câmera, grande e nítido. O martelo fica deitado sobre o púlpito, do outro lado.

QUADRO 5 (Coluna central): close-up do produto em ângulo diagonal de 3/4, sobre uma superfície preta fosca, com fundo totalmente preto. Uma mão com a manga da roupa do apresentador aparecendo mostra o detalhe ligado ao benefício 1: ${beneficio1}. O produto ocupa quase o quadro inteiro. Iluminação suave de estúdio de produto, com reflexos sutis.

QUADRO 6 (Coluna da direita): outro close-up do mesmo produto, de outro ângulo, sobre a mesma superfície preta, com fundo preto. A mão mostra o detalhe ligado ao benefício 2: ${beneficio2}. O produto ocupa quase o quadro inteiro. Mesma iluminação de produto.

Fotorrealista, aparência de foto real e de comercial de produto. Nenhum texto, letreiro ou logotipo além dos números dos quadros e do logotipo que já faz parte do próprio produto. Nenhum outro produto além desse.`;

  // =========================================================================
  // GERAÇÃO 3: IMAGEM ÚNICA VERTICAL 9:16 (1080 x 1920 px) SEM NÚMERO
  // Apresentador apontando para a câmera, produto ao lado dele no púlpito e no telão ao fundo
  // =========================================================================
  const bloco3ImagePrompt = `Com base nas fotos de referência do produto, crie uma imagem fotorrealista vertical, exatamente 1080 x 1920 pixels. O mesmo apresentador das imagens anteriores (${presenterDesc}), com ${presenterClothing} e um microfone headset discreto na bochecha. Ele está atrás de um púlpito de madeira escura liso, sem placa e sem nada escrito, no salão de leilão clássico com colunas e plateia sentada ao fundo. Ao lado dele está o ${productName}, ${posicaoProduto}, bem visível, grande, nítido e de frente para a câmera, exatamente idêntico às fotos de referência. Ele está inclinado para frente, apontando o dedo indicador direto para a câmera, com a outra mão apoiada perto do produto, sorrindo empolgado, de boca aberta como quem fala com entusiasmo. Atrás dele, o telão mostra apenas a foto do mesmo produto. O martelo de leilão fica deitado sobre o púlpito. Plano médio, luz quente, aparência de foto real. IMPORTANTE: nenhum texto, número, letreiro ou logotipo em lugar nenhum da imagem, além do logotipo que já faz parte do próprio produto. Nenhum outro produto além desse.`;

  // =========================================================================
  // PROMPTS DO VEO 3 (CONFORME SEÇÃO 7 DA CORREÇÃO 2)
  // Regra comum: produto parado, sempre visível, de frente e idêntico
  // =========================================================================
  const fala1A = speeches.cena1A || speeches.cena1;
  const fala1B = speeches.cena1B || speeches.cena1;
  const fala1C = speeches.cena1C || speeches.cena1;
  const fala2A = speeches.cena2A || speeches.cena2;
  const fala2B = speeches.cena2B || speeches.cena2;
  const fala2C = speeches.cena2C || speeches.cena2B || speeches.cena2;
  const fala3 = speeches.cena3;

  const veoPrompt1 = `Vídeo vertical 9:16, fotorrealista, 10 segundos. A imagem anexada é um storyboard com 3 quadros numerados (1, 2 e 3). Cada quadro vira uma tomada em tela cheia, na ordem. Os números e as faixas brancas do storyboard NÃO aparecem no vídeo. Mantenha cenário, personagem, produto e enquadramento idênticos a cada quadro. O produto está visível nas 3 tomadas, sempre parado, na mesma posição, de frente para a câmera e idêntico ao do storyboard. Ele nunca some, gira, vira de costas ou muda de formato.

TOMADA 1 (0 a 3 segundos) – QUADRO 1: plano aberto do salão de leilão, câmera atrás da plateia. O apresentador (${presenterDesc}) está no palco, ao lado do produto, ergue o martelo e fala alto e rápido, no ritmo de leiloeiro, enquanto a plateia levanta as plaquinhas. O telão ao fundo mostra o produto. Leve avanço de câmera.
Fala (português brasileiro, voz ${presenterVoice} grave e eufórica): "${fala1A}"

TOMADA 2 (3 a 5,5 segundos) – corte seco para o QUADRO 2: câmera mais perto, o apresentador de frente, atrás do púlpito, com o produto ao lado bem visível. Ele aponta para a plateia, pega o martelo e o ergue para bater, falando ainda mais rápido e animado.
Fala (mesma voz): "${fala1B}"

TOMADA 3 (5,5 a 10 segundos) – corte seco para o QUADRO 3: close do apresentador com o martelo numa mão e o celular na outra, com o produto em primeiro plano no púlpito, nítido. Ele trava o martelo no ar, olha o celular, arregala os olhos em choque, aproxima o celular do rosto e fala surpreso e indignado.
Fala (mesma voz): "${fala1C}"

Áudio: burburinho da plateia e som ambiente de salão de leilão. Sem música, sem legendas, sem nenhum texto na tela.`;

  const veoPrompt2 = `Vídeo vertical 9:16, fotorrealista, 10 segundos. A imagem anexada é um storyboard com 3 quadros numerados (4, 5 e 6). Cada quadro vira uma tomada em tela cheia, na ordem. Os números e as faixas brancas do storyboard NÃO aparecem no vídeo. O produto está visível nas 3 tomadas e permanece exatamente idêntico ao do storyboard: mesma cor, formato, logotipo e detalhes, sem deformações. Ele nunca some, nunca é coberto, nunca vira de costas e não gira sozinho.

TOMADA 1 (0 a 3,5 segundos) – QUADRO 4: salão de leilão. O apresentador (${presenterDesc}) bate o martelo uma vez, abre um sorriso largo e abre as duas mãos em direção ao produto, que está no púlpito de frente para a câmera, exatamente como no QUADRO 4, apresentando com empolgação.
Fala (português brasileiro, voz ${presenterVoice} eufórica e rápida): "${fala2A}"

TOMADA 2 (3,5 a 7 segundos) – corte seco para o QUADRO 5: close do produto sobre superfície preta, com fundo preto. A mão mostra o detalhe do primeiro benefício, igual ao QUADRO 5. Movimento de câmera lento e suave, estilo comercial.
Fala (mesma voz, em off, empolgada e clara): "${fala2B}"

TOMADA 3 (7 a 10 segundos) – corte seco para o QUADRO 6: outro close do produto, de outro ângulo, sobre fundo preto. A mão mostra o detalhe do segundo benefício, igual ao QUADRO 6. Movimento de câmera lento e suave.
Fala (mesma voz, em off): "${fala2C}"

Áudio: uma batida de martelo no início. Sem música, sem legendas, sem nenhum texto na tela.`;

  const veoPrompt3 = `Vídeo vertical 9:16, fotorrealista, 10 segundos, tomada única. Use a imagem anexada como referência exata de cenário, personagem, produto e enquadramento. O produto ao lado do apresentador e no telão permanece visível o tempo todo, parado, de frente e idêntico ao da imagem.

O apresentador (${presenterDesc}), com microfone headset, está atrás do púlpito no salão de leilão, com o produto ao lado dele e a plateia ao fundo. Ele se inclina para frente, aponta o dedo indicador para a câmera, depois toca levemente o produto com a outra mão e aponta para baixo, para o canto inferior da tela, sorrindo animado e falando com urgência, rápido e eufórico, como quem dá a última chance.
Fala (português brasileiro, voz ${presenterVoice} grave e empolgada): "${fala3}"

Câmera fixa com leve aproximação lenta. Áudio: burburinho leve da plateia ao fundo. Sem música, sem legendas, sem nenhum texto na tela.`;

  return {
    bloco1ImagePrompt,
    bloco2ImagePrompt,
    bloco3ImagePrompt,
    veoPrompt1,
    veoPrompt2,
    veoPrompt3,
  };
}
