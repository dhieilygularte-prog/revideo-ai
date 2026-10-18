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
  gender: 'masculino' | 'feminino';
  voiceLabel: string;
} {
  const instructions = (additionalInstructions || '').toLowerCase();

  const isFemale =
    /\bmulher\b|\bfeminina\b|\bgarota\b|\bapresentadora\b|\belas\b|\bvestido\b|\bmoça\b/i.test(instructions);

  const gender: 'masculino' | 'feminino' = isFemale ? 'feminino' : 'masculino';
  const voiceLabel = isFemale ? 'feminina' : 'masculina';

  // Se o usuário passou instruções específicas para o apresentador nas instruções adicionais
  const cleanInstructions = (additionalInstructions || '').trim();
  if (cleanInstructions.length > 3) {
    return {
      presenterDescription: cleanInstructions,
      gender,
      voiceLabel,
    };
  }

  return {
    presenterDescription:
      'homem branco de cerca de 55 anos, cabelo grisalho penteado para trás, barba grisalha cheia e bem aparada',
    gender: 'masculino',
    voiceLabel: 'masculina',
  };
}

/**
 * Constrói as Falas Oficiais do Modo Leilão usando a matriz fixa da Seção 3 da Instrução 1:
 * - CENA 1: "Quem dá [L1] reais nesse [NOME CURTO]? Quem dá [L2]? Dou-lhe uma! Peraí... Olha o valor desse [NOME CURTO] no TikTok Shop. Tá de graça!"
 * - CENA 2: "Leilão cancelado! Esse é o [NOME COMPLETO]. [BENEFÍCIO 1]. [BENEFÍCIO 2]."
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

  // CENA 1: fiel ao modelo original (dividida em 3 partes: 1A, 1B e 1C conforme Seção 3 da nova instrução)
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
  const cena2B = `${b1}. ${b2}.`.replace(/\.{2,}/g, '.');
  let cena2 = `${cena2A} ${cena2B}`.trim();

  // Garantir que a Cena 2 não ultrapasse 250 caracteres sem cortar palavras
  if (cena2.length > 250) {
    cena2 = `${cena2A} ${b1}.`.trim();
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
    cena3,
    full,
  };

  // Fala do Usuário se fornecida
  let userSpeechLeilao: LeilaoSpeechParts | undefined = undefined;
  if (userSpeech && userSpeech.trim().length > 10) {
    const rawUser = userSpeech.trim();
    // Tenta dividir se o usuário usou separadores (ex: "Cena 1 | Cena 2 | Cena 3")
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
        cena3: u3,
        full: `${u1} ${u2} ${u3}`,
      };
    } else {
      // Divide proporcionalmente em 3 cenas de até 250 caracteres
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
 * para o Modo Leilão conforme Seções 7 e 8 da Instrução 1.
 */
export function buildLeilaoBlockPrompts(params: {
  productName: string;
  productInfo: string;
  realPrice: number;
  productSize: 'pequeno_medio' | 'grande';
  additionalInstructions?: string;
  speeches: LeilaoSpeechParts;
}): {
  bloco1ImagePrompt: string;
  bloco2ImagePrompt: string;
  bloco3ImagePrompt: string;
  veoPrompt1: string;
  veoPrompt2: string;
  veoPrompt3: string;
} {
  const { productName, productSize, additionalInstructions, speeches } = params;

  const presenter = buildLeilaoPresenter(additionalInstructions);
  const presenterDesc = presenter.presenterDescription;
  const presenterVoice = presenter.voiceLabel;
  const handDesc = presenter.gender === 'feminino' ? 'feminina' : 'masculina';

  const pulpitDesc =
    productSize === 'grande'
      ? 'plataforma baixa de madeira escura no chão, com cerca de um palmo de altura (uns 20 cm) e base larga onde o produto inteiro fica em cima'
      : 'púlpito alto de madeira escura, na altura da cintura do apresentador';

  const framingDescImg4 =
    productSize === 'grande'
      ? 'Enquadramento mais aberto, mostrando o produto inteiro sobre a plataforma baixa.'
      : 'Produto pequeno/médio: enquadramento do peito para cima, mostrando o produto sobre o púlpito.';

  // =========================================================================
  // STORYBOARD 1 (GERAÇÃO 1): UMA IMAGEM HORIZONTAL 16:9 (ALTA RESOLUÇÃO)
  // Contendo 3 quadros verticais 9:16 lado a lado, numerados 1, 2 e 3
  // Quadro 1: Salão de leilão aberto, câmera atrás da plateia, martelo erguido
  // Quadro 2: NOVO, plano intermediário mais perto do palco, dos joelhos para cima
  // Quadro 3: Close do leiloeiro chocado olhando o celular, produto no telão ao fundo
  // =========================================================================
  const bloco1ImagePrompt = `Com base nas fotos de referência do produto, crie UMA imagem horizontal 16:9 na maior resolução possível (ideal 3840 x 2160 pixels), em formato de storyboard, com 3 quadros verticais na proporção 9:16 lado a lado, da esquerda para a direita, separados por uma faixa branca fina. No canto superior direito de cada quadro, um círculo branco com o número em preto: 1, 2 e 3. Esses números são o ÚNICO texto da imagem. O mesmo apresentador, idêntico nos 3 quadros: ${presenterDesc}.

QUADRO 1: interior de uma casa de leilões luxuosa e clássica, estilo teatro europeu: lustres de cristal dourados, camarotes em dois andares com colunas douradas, luz quente. Câmera atrás da plateia, na altura das pessoas. Ao fundo, no palco de piso de madeira clara, o leiloeiro de pé atrás de um púlpito de madeira escura, com o braço direito erguido segurando um martelo de leilão. Em primeiro plano, de costas, a plateia elegante de terno escuro, várias pessoas levantando plaquinhas de lance brancas e lisas.

QUADRO 2: o mesmo salão e o mesmo momento, com a câmera mais perto do palco. O leiloeiro de pé, de frente para a câmera, no centro, atrás do púlpito alto de madeira escura, com as duas mãos apoiadas e o martelo em cima do púlpito. Ele aparece dos joelhos para cima, com postura confiante. Em primeiro plano, desfocadas, mãos da plateia levantando plaquinhas brancas e lisas.

QUADRO 3: close do mesmo leiloeiro, da cintura para cima, atrás do púlpito de madeira escura envernizada. Com a mão direita ele segura o martelo de leilão (madeira com anel dourado) apoiado na base. Com a mão esquerda ele segura um smartphone preto e olha a tela em choque total: olhos arregalados, sobrancelhas levantadas, boca entreaberta. Fundo desfocado: plateia levantando plaquinhas redondas brancas e lisas, e um telão mostrando apenas a foto do produto das fotos de referência, de frente.

Fotorrealista, aparência de foto real em todos os quadros, luz quente de evento. Nenhum texto, número, letreiro ou logotipo além dos números dos quadros: nada escrito no telão, no púlpito ou nas plaquinhas.`;

  // =========================================================================
  // STORYBOARD 2 (GERAÇÃO 2): UMA IMAGEM HORIZONTAL 16:9 (ALTA RESOLUÇÃO)
  // Contendo 3 quadros verticais 9:16 lado a lado, numerados 4, 5 e 6
  // Quadro 4: Estúdio cinza, produto coberto pelo pano preto
  // Quadro 5: Produto revelado de frente, apresentador de mãos abertas (tcharam!), produto grande
  // Quadro 6: Close do produto em fundo preto, ocupando quase o quadro inteiro, mão interagindo
  // =========================================================================
  const bloco2ImagePrompt = `Com base nas fotos de referência do produto, crie UMA imagem horizontal 16:9 na maior resolução possível (ideal 3840 x 2160 pixels), em formato de storyboard, com 3 quadros verticais na proporção 9:16 lado a lado, da esquerda para a direita, separados por uma faixa branca fina. No canto superior direito de cada quadro, um círculo branco com o número em preto: 4, 5 e 6. Esses números são o ÚNICO texto da imagem. O mesmo apresentador dos quadros anteriores, idêntico: ${presenterDesc}. O produto tem que ser EXATAMENTE idêntico às fotos de referência (cor, formato, proporção, logotipo, acabamento e detalhes), nítido e bem visível.

QUADRO 4: estúdio fotográfico com fundo de cortinas cinza-claro, várias luzes spot penduradas no teto, refletores em tripés nas laterais e piso cinza-claro liso. À esquerda, ${pulpitDesc}, coberto por um pano de veludo preto que esconde completamente o ${productName} em cima dele (dá para perceber o volume e o formato do produto por baixo do pano, sem mostrar nenhuma parte dele). À direita, o mesmo apresentador (${presenterDesc}), de corpo inteiro, de terno azul royal de três peças com colete, camisa branca, gravata cinza e sapato marrom. Com uma mão ele segura a ponta do pano preto e com a outra aponta para o produto coberto, sorrindo com ar de suspense, prestes a revelar o que está embaixo. Iluminação de estúdio limpa, aparência de foto real.

QUADRO 5: o mesmo estúdio cinza com luzes spot. O mesmo apresentador (${presenterDesc}) atrás de ${pulpitDesc}, sorrindo largo, com as duas mãos abertas, uma de cada lado do produto, num gesto de apresentação ("tcharam!"). Sobre o púlpito está o ${productName} das fotos de referência, com a frente principal virada de frente para a câmera, ocupando uma área grande do quadro, nítido e bem visível, exatamente idêntico ao produto real das fotos: mesma cor, formato, proporção, logotipo do fabricante e acabamento. O pano preto não aparece mais. ${framingDescImg4}.

QUADRO 6: close-up em ângulo diagonal de 3/4 do ${productName} sobre uma superfície preta fosca, com fundo totalmente preto. O produto ocupa quase o quadro inteiro, nítido e bem visível. Uma mão ${handDesc}, com a manga do terno escuro aparecendo, interage com o principal detalhe do produto. O produto tem que ser exatamente idêntico ao produto real das fotos (cor, acabamento, detalhes).

Fotorrealista, aparência de foto real em todos os quadros. Nenhum texto, letreiro ou logotipo além dos números dos quadros e do logotipo que já faz parte do próprio produto.`;

  // =========================================================================
  // GERAÇÃO 3: IMAGEM ÚNICA VERTICAL 9:16 (1080 x 1920 px) SEM NÚMERO
  // Leiloeiro apontando para a câmera, produto no telão ao fundo
  // =========================================================================
  const bloco3ImagePrompt = `Com base nas fotos de referência do produto, crie UMA imagem vertical de 1080 x 1920 pixels (proporção 9:16), em plano médio. O mesmo apresentador das imagens anteriores (${presenterDesc}), de terno azul royal com lenço no bolso, camisa branca, gravata cinza estampada e um microfone headset discreto na bochecha. Ele está atrás de um púlpito de madeira escura liso, sem placa e sem nada escrito. À esquerda, sobre o púlpito, um martelo de leilão de madeira com anel dourado. Ele está inclinado para frente, apontando o dedo indicador direto para a câmera, sorrindo empolgado, de boca aberta como quem fala com entusiasmo. Fundo: salão de leilão clássico com colunas e plateia sentada. Atrás dele, um telão grande mostra apenas a foto do ${productName} das fotos de referência, de frente, exatamente idêntico ao produto real. Fotorrealista, aparência de foto real, luz quente de evento. IMPORTANTE: nenhum número, texto, letreiro ou logotipo em lugar nenhum da imagem (NÃO coloque números de quadros nem nada escrito no telão ou púlpito).`;

  // =========================================================================
  // PROMPTS DO VEO 3 (SUBSTITUI OS ANTIGOS CONFORME NOVO DOCUMENTO)
  // =========================================================================
  const fala1A = speeches.cena1A || speeches.cena1;
  const fala1B = speeches.cena1B || speeches.cena1;
  const fala1C = speeches.cena1C || speeches.cena1;
  const fala2A = speeches.cena2A || speeches.cena2;
  const fala2B = speeches.cena2B || speeches.cena2;
  const fala3 = speeches.cena3;

  const veoPrompt1 = `Vídeo vertical 9:16, fotorrealista, 10 segundos. A imagem anexada é um storyboard com 3 quadros numerados (1, 2 e 3). O vídeo é vertical: cada quadro vira uma tomada em tela cheia, e os números e as faixas brancas do storyboard NÃO aparecem no vídeo. Siga a ordem dos quadros, mantendo cenário, personagem e enquadramento idênticos a cada quadro.

TOMADA 1 (0 a 3 segundos) – QUADRO 1: plano aberto do salão de leilão, câmera atrás da plateia. O leiloeiro (${presenterDesc}) está no palco, ergue o martelo e fala alto e rápido, no ritmo de leiloeiro, enquanto a plateia levanta as plaquinhas. Leve avanço de câmera.
Fala (português brasileiro, voz ${presenterVoice} grave e eufórica): "${fala1A}"

TOMADA 2 (3 a 5,5 segundos) – corte seco para o QUADRO 2: a câmera mais perto, o leiloeiro de frente, atrás do púlpito. Ele aponta para a plateia, pega o martelo e o ergue para bater, falando ainda mais rápido e animado. Mãos com plaquinhas em primeiro plano.
Fala (mesma voz): "${fala1B}"

TOMADA 3 (5,5 a 10 segundos) – corte seco para o QUADRO 3: close do leiloeiro com o martelo numa mão e o celular na outra. Ele trava o martelo no ar, olha o celular, arregala os olhos em choque, aproxima o celular do rosto e fala surpreso e indignado. O telão ao fundo mostra o produto, sem mudar.
Fala (mesma voz): "${fala1C}"

Áudio: burburinho da plateia e som ambiente de salão de leilão. Sem música, sem legendas, sem nenhum texto na tela.`;

  const veoPrompt2 = `Vídeo vertical 9:16, fotorrealista, 10 segundos. A imagem anexada é um storyboard com 3 quadros numerados (4, 5 e 6). O vídeo é vertical: cada quadro vira uma tomada em tela cheia, e os números e as faixas brancas do storyboard NÃO aparecem no vídeo. O produto deve permanecer exatamente idêntico ao dos quadros, sem deformações.

TOMADA 1 (0 a 5 segundos) – começa no QUADRO 4: estúdio cinza com luzes spot. O apresentador (${presenterDesc}) puxa o pano de veludo preto de uma vez. No instante em que o pano sai, o produto aparece EXATAMENTE como no QUADRO 5: na mesma posição, com a frente principal virada para a câmera desde o primeiro quadro. O produto NUNCA aparece de costas, de lado ou girando, e não se move sozinho. A câmera avança até o enquadramento do QUADRO 5: o apresentador sorrindo largo, com as duas mãos abertas ao lado do produto.
Fala (português brasileiro, voz ${presenterVoice} eufórica e rápida): "${fala2A}"

TOMADA 2 (5 a 10 segundos) – corte seco para o QUADRO 6: close do produto sobre superfície preta, com fundo preto. A mão interage com o principal detalhe do produto, igual ao QUADRO 6. Movimento de câmera lento e suave em volta do produto, estilo comercial.
Fala (mesma voz, em off, empolgada e clara): "${fala2B}"

Áudio: som do pano sendo puxado na primeira tomada. Sem música, sem legendas, sem nenhum texto na tela.`;

  const veoPrompt3 = `Vídeo vertical 9:16, fotorrealista, 10 segundos, tomada única. Use a imagem de referência como referência exata de cenário, personagem e enquadramento. O produto no telão ao fundo deve permanecer idêntico ao da imagem, sem mudar.

O apresentador (${presenterDesc}), com microfone headset, está atrás do púlpito de madeira no salão de leilão, com a plateia e o telão mostrando o produto ao fundo. Ele se inclina para frente, aponta o dedo indicador para a câmera e depois aponta para baixo, para o canto inferior da tela, sorrindo animado e falando com urgência, rápido e eufórico, como quem dá a última chance.
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
