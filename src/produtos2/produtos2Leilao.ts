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

export interface Produtos2LeilaoResultState {
  realPrice: number;
  l1: number;
  l2: number;
  l1Text: string;
  l2Text: string;
  productSize: 'pequeno_medio' | 'grande';
  shortName: string;
  fullName: string;
  benefits: string[];
  presenterDescription: string;
  presenterGender: 'masculino' | 'feminino';
  presenterVoice: string;
  cena1Speech: string;
  cena2Speech: string;
  cena3Speech: string;
  block1: LeilaoBlockItem;
  block2: LeilaoBlockItem;
  block3: LeilaoBlockItem;
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
 * Extrai nome curto (2 a 4 palavras) e nome completo/modelo do produto.
 */
export function extractLeilaoProductNames(productName: string, productInfo: string): {
  shortName: string;
  fullName: string;
} {
  const cleanName = productName
    .replace(/[•\n\r|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanName.split(' ').filter(Boolean);
  let shortName = words.slice(0, 4).join(' ');
  if (!shortName) shortName = 'produto';

  // Nome completo: até 6-8 palavras ou nome curto + primeiro diferencial
  let fullName = words.slice(0, 7).join(' ');
  if (!fullName) fullName = shortName;

  // Se o nome completo for idêntico ao nome curto mas houver modelo nas informações, complementa
  if (fullName === shortName && productInfo) {
    const modelMatch = productInfo.match(/(?:modelo|linha|vers[aã]o|processador|geração)[:\s]+([^\n.,;]+)/i);
    if (modelMatch && modelMatch[1]) {
      const extra = modelMatch[1].trim().split(' ').slice(0, 3).join(' ');
      fullName = `${shortName} ${extra}`.trim();
    }
  }

  return { shortName, fullName };
}

/**
 * Converte números e especificações técnicas para texto falado por extenso
 * (para o Veo pronunciar com perfeição).
 */
export function formatSpecsForSpokenPortuguese(text: string): string {
  if (!text) return '';

  return text
    .replace(/(\d+)\s*["”']\s*(?:polegadas)?/gi, (_, n) => `${numberToPortugueseWords(parseInt(n, 10))} polegadas`)
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
    .replace(/Ryzen\s*7\b/gi, 'Ryzen sete')
    .replace(/Ryzen\s*5\b/gi, 'Ryzen cinco')
    .replace(/Core\s*i7\b/gi, 'Core i sete')
    .replace(/Core\s*i5\b/gi, 'Core i cinco')
    .replace(/Core\s*i9\b/gi, 'Core i nove')
    .replace(/120Hz/gi, 'cento e vinte hertz')
    .replace(/60Hz/gi, 'sessenta hertz')
    .replace(/144Hz/gi, 'cento e quarenta e quatro hertz')
    .replace(/1080p/gi, 'dez oitenta p')
    .replace(/WUXGA/gi, 'W U X G A')
    .replace(/IPS/gi, 'I P S')
    .replace(/LED/gi, 'Léd')
    .replace(/OLED/gi, 'O-Léd')
    .replace(/AMOLED/gi, 'Amo-léd')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai até 2 benefícios concretos com números das informações do produto
 * (limite de ~80 caracteres totais, números por extenso).
 */
export function extractLeilaoBenefits(productInfo: string, productName: string): string[] {
  if (!productInfo || typeof productInfo !== 'string') {
    return ['Alta potência e desempenho premium', 'Construção reforçada de longa durabilidade'];
  }

  // Divide por linhas ou marcadores
  const lines = productInfo
    .split(/[\n\r•\-\*]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && !l.toLowerCase().includes('segurança') && !l.toLowerCase().includes('perigo'));

  // Procura linhas com especificações concretas com números
  const candidatesWithNumbers = lines.filter((l) => /\d/.test(l));
  const pool = candidatesWithNumbers.length >= 2 ? candidatesWithNumbers : lines;

  const cleanBenefits: string[] = [];
  for (const raw of pool) {
    if (cleanBenefits.length >= 2) break;
    const clean = raw
      .replace(/^[0-9a-zA-Z\s]+:\s*/, '') // Remove prefixos tipo "Conforto Máximo: "
      .replace(/[•\-\*]/g, '')
      .trim();

    if (clean.length >= 8 && !cleanBenefits.some((b) => b.toLowerCase().slice(0, 15) === clean.toLowerCase().slice(0, 15))) {
      const formatted = formatSpecsForSpokenPortuguese(clean);
      // Pega até cerca de 45-50 caracteres de cada benefício para manter a soma <= 80 chars
      const shortDesc = formatted.length > 55 ? `${formatted.slice(0, 52).trim()}...` : formatted;
      cleanBenefits.push(shortDesc);
    }
  }

  if (cleanBenefits.length === 0) {
    cleanBenefits.push('Alta durabilidade com acabamento reforçado');
    cleanBenefits.push('Desempenho rápido e confiável no uso diário');
  } else if (cleanBenefits.length === 1) {
    cleanBenefits.push('Acabamento premium de alta resistência');
  }

  return cleanBenefits;
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
    // Incorpora as características solicitadas mantendo o estilo de leiloeiro elegante
    return {
      presenterDescription: cleanInstructions,
      gender,
      voiceLabel,
    };
  }

  // Descrição padrão canônica da Seção 4
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
  const { productName, productInfo, realPrice, userSpeech } = params;

  const bids = calculateLeilaoBids(realPrice);
  const { shortName, fullName } = extractLeilaoProductNames(productName, productInfo);
  const benefits = extractLeilaoBenefits(productInfo, productName);

  const l1Words = bids.l1Text || 'quatro mil';
  const l2Words = bids.l2Text || 'três mil';

  // CENA 1
  const cena1A = `Quem dá ${l1Words} reais nesse ${shortName}? Quem dá ${l2Words}? Dou-lhe uma!`;
  const cena1B = `Peraí... Olha o valor desse ${shortName} no TikTok Shop. Tá de graça!`;
  let cena1 = `${cena1A} ${cena1B}`.trim();

  // CENA 2
  const b1 = benefits[0] || 'Desempenho de alta performance';
  const b2 = benefits[1] || 'Construção reforçada';
  const cena2A = `Leilão cancelado! Esse é o ${fullName}.`;
  const cena2B = `${b1}. ${b2}.`;
  let cena2 = `${cena2A} ${cena2B}`.trim();

  // Garantir que a Cena 2 não ultrapasse 250 caracteres
  if (cena2.length > 250) {
    cena2 = `${cena2A} ${b1}.`.trim();
    if (cena2.length > 250) {
      cena2 = cena2.slice(0, 245).trim() + '.';
    }
  }

  // CENA 3
  const cena3 = `Por esse valor, não tem como fazer leilão! Clica no carrinho laranja e garante o seu!`;

  const full = `${cena1} ${cena2} ${cena3}`;

  const leilaoSpeech: LeilaoSpeechParts = {
    cena1,
    cena1A,
    cena1B,
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
  // BLOCO 1: STORYBOARD 2 QUADROS LADO A LADO (2160 x 1920 px)
  // Imagem 1: Salão aberto com plateia e martelo erguido
  // Imagem 2: Close do leiloeiro chocado olhando o celular
  // =========================================================================
  const img1Desc = `Interior de uma casa de leilões luxuosa e clássica, estilo teatro europeu: lustres de cristal dourados, camarotes em dois andares com colunas e detalhes dourados, luz quente e elegante. Ao fundo, no centro, sobre um palco de piso de madeira clara, um leiloeiro de pé atrás de um púlpito de madeira escura, com o braço direito erguido segurando um martelo de leilão. O leiloeiro é ${presenterDesc}, de terno azul royal e camisa escura. Em primeiro plano, de costas para a câmera, uma plateia elegante de terno escuro sentada em cadeiras, várias pessoas levantando plaquinhas de lance brancas e lisas. Câmera na altura da plateia, atrás das pessoas, profundidade de campo, aparência de foto real de evento. Nenhum texto, número ou logotipo na imagem.`;

  const img2Desc = `O mesmo leiloeiro da Imagem 1 (${presenterDesc}, terno azul royal, camisa escura), em plano médio da cintura para cima, atrás de um púlpito de madeira escura envernizada. Com a mão direita ele segura um martelo de leilão de madeira com anel dourado, apoiado na base sobre o púlpito. Com a mão esquerda ele segura um smartphone preto e olha para a tela com expressão de choque total: olhos arregalados, sobrancelhas levantadas, boca entreaberta. Relógio prateado no pulso. Fundo desfocado: salão de leilão moderno com plateia sentada levantando plaquinhas redondas brancas e lisas, e um telão ao fundo com luz azul suave. Luz quente de evento, bokeh, aparência de foto real. Nenhum texto, número, letreiro ou logotipo em lugar nenhum da imagem.`;

  const bloco1ImagePrompt = `MODO LEILÃO - BLOCO 1 (GERAÇÃO 1). Storyboard fotorrealista vertical composto por EXATAMENTE 2 QUADROS numerados dispostos lado a lado na horizontal (grade 1x2, 2 colunas e 1 linha), resolução total 2160 x 1920 pixels. Cada quadro possui proporção vertical 9:16 e traz no canto superior direito um número de identificação discreto ("1" e "2"). O mesmo apresentador (${presenterDesc}) aparece com rigorosa continuidade física em ambos os quadros:
- QUADRO 1 (Salão aberto de leilão): ${img1Desc}
- QUADRO 2 (Close do leiloeiro chocado com o celular): ${img2Desc}
REGRAS OBRIGATÓRIAS: Aparência de foto real de alta definição. Nenhum texto, número, letreiro ou logotipo em lugar nenhum da imagem, exceto os números 1 e 2 nos cantos superiores de cada quadro.`;

  // =========================================================================
  // BLOCO 2: STORYBOARD 3 QUADROS LADO A LADO (3240 x 1920 px)
  // Imagem 3: Estúdio cinza, produto coberto com pano de veludo preto
  // Imagem 4: Produto revelado no estúdio (frente principal para a câmera)
  // Imagem 5: Close do produto em fundo totalmente preto com interação da mão
  // =========================================================================
  const img3Desc = `Estúdio fotográfico com fundo de cortinas cinza-claro, várias luzes spot penduradas no teto, refletores em tripés nas laterais e piso cinza-claro liso. À esquerda, ${pulpitDesc}, coberto por um pano de veludo preto que esconde completamente o ${productName} em cima dele (dá para perceber o volume e o formato do produto por baixo do pano, sem mostrar nenhuma parte dele). À direita, o mesmo apresentador das imagens anteriores (${presenterDesc}), de corpo inteiro, de terno azul royal de três peças com colete, camisa branca, gravata cinza e sapato marrom. Com uma mão ele segura a ponta do pano preto e com a outra aponta para o produto coberto, sorrindo com ar de suspense, prestes a revelar o que está embaixo. Iluminação de estúdio limpa, aparência de foto real. Nenhum texto ou logotipo.`;

  const img4Desc = `Com base nas fotos de referência do produto, o mesmo estúdio cinza da Imagem 3, com luzes spot no teto. O mesmo apresentador (${presenterDesc}, terno azul royal, camisa branca, gravata cinza) atrás de ${pulpitDesc}, sorrindo largo, com as duas mãos abertas, uma de cada lado do produto, num gesto de apresentação ("tcharam!"). Sobre o púlpito está o ${productName} das fotos de referência, com a frente principal virada de frente para a câmera, exatamente idêntico ao produto real das fotos: mesma cor, formato, proporção, logotipo do fabricante e acabamento. O pano preto não aparece mais. ${framingDescImg4} Iluminação de estúdio de produto, aparência de foto real. Nenhum texto extra.`;

  const img5Desc = `Com base nas fotos de referência do produto, close-up em ângulo diagonal de 3/4 do ${productName} sobre uma superfície preta fosca, com fundo totalmente preto. Uma mão ${handDesc}, com a manga do terno escuro aparecendo, interage com o principal detalhe do produto. O produto tem que ser exatamente idêntico ao produto real das fotos (cor, acabamento, detalhes). Iluminação suave de estúdio de produto, com reflexos sutis. Aparência de comercial de produto de luxo. Nenhum texto.`;

  const bloco2ImagePrompt = `MODO LEILÃO - BLOCO 2 (GERAÇÃO 2). Storyboard fotorrealista vertical composto por EXATAMENTE 3 QUADROS numerados dispostos lado a lado na horizontal (grade 1x3, 3 colunas e 1 linha), resolução total 3240 x 1920 pixels. Cada quadro possui proporção vertical 9:16 e traz no canto superior direito um número de identificação discreto ("3", "4" e "5"). As fotos reais de referência do produto determinam com 100% de fidelidade a cor, formato, proporção e logomarca nos quadros 4 e 5. O mesmo apresentador (${presenterDesc}) aparece nos quadros 3 e 4:
- QUADRO 3 (Estúdio com produto coberto pelo pano preto): ${img3Desc}
- QUADRO 4 (Produto revelado de frente para a câmera): ${img4Desc}
- QUADRO 5 (Close do produto em fundo preto): ${img5Desc}
REGRAS OBRIGATÓRIAS: Aparência de foto real de alta definição. O produto nos quadros 4 e 5 deve ser 100% fidedigno às fotos de referência anexadas. Nenhum texto, número ou letreiro, exceto os números identificadores 3, 4 e 5 nos cantos superiores.`;

  // =========================================================================
  // BLOCO 3: IMAGEM ÚNICA (1080 x 1920 px)
  // Imagem 6: Leiloeiro apontando para a câmera, produto no telão ao fundo
  // =========================================================================
  const bloco3ImagePrompt = `MODO LEILÃO - BLOCO 3 (GERAÇÃO 3). Com base nas fotos de referência do produto, imagem fotorrealista vertical, exatamente 1080 x 1920 pixels. O mesmo apresentador das imagens anteriores (${presenterDesc}), de terno azul royal com lenço no bolso, camisa branca, gravata cinza estampada e um microfone headset discreto na bochecha. Ele está atrás de um púlpito de madeira escura liso, sem placa e sem nada escrito. À esquerda, sobre o púlpito, um martelo de leilão de madeira com anel dourado. Ele está inclinado para frente, apontando o dedo indicador direto para a câmera, sorrindo empolgado, de boca aberta como quem fala com entusiasmo. Fundo: salão de leilão clássico com colunas e plateia sentada. Atrás dele, um telão grande mostra apenas a foto do ${productName} das fotos de referência, de frente, exatamente idêntico ao produto real. Plano médio, luz quente, aparência de foto real. IMPORTANTE: nenhum texto, número, letreiro ou logotipo em lugar nenhum da imagem, nem no telão, nem no púlpito. Nenhum outro produto além desse.`;

  // =========================================================================
  // PROMPTS DO VEO 3 (SEÇÃO 8 DA INSTRUÇÃO 1)
  // =========================================================================
  const fala1A = speeches.cena1A || speeches.cena1;
  const fala1B = speeches.cena1B || speeches.cena1;
  const fala2A = speeches.cena2A || speeches.cena2;
  const fala2B = speeches.cena2B || speeches.cena2;
  const fala3 = speeches.cena3;

  const veoPrompt1 = `Vídeo vertical 9:16, fotorrealista, 10 segundos, com um corte no meio. Use as imagens de referência como referência exata de cenário, personagem e enquadramento.

TOMADA 1 (0 a 5 segundos) – Imagem 1: salão de leilão clássico e luxuoso, câmera atrás da plateia. O leiloeiro (${presenterDesc}) está atrás do púlpito no palco, ergue o martelo de leilão e fala alto, rápido e eufórico, no ritmo típico de leiloeiro, enquanto várias pessoas da plateia levantam as plaquinhas de lance. Leve movimento de câmera avançando para frente.
Fala (português brasileiro, voz ${presenterVoice} grave e empolgada): "${fala1A}"

TOMADA 2 (5 a 10 segundos) – corte seco para a Imagem 2: close do mesmo leiloeiro atrás do púlpito, segurando o martelo com uma mão e o celular com a outra. Ele trava o martelo no ar, olha o celular, arregala os olhos em choque, aproxima o celular do rosto e fala surpreso, rápido e indignado.
Fala (português brasileiro, mesma voz): "${fala1B}"

Áudio: burburinho da plateia e som ambiente de salão de leilão. Sem música, sem legendas, sem nenhum texto na tela.`;

  const veoPrompt2 = `Vídeo vertical 9:16, fotorrealista, 10 segundos, com um corte no meio. Use as imagens de referência como referência exata de cenário, personagem e produto. O produto deve permanecer exatamente idêntico ao das imagens de referência, sem deformações.

TOMADA 1 (0 a 5 segundos) – começa na Imagem 3: estúdio cinza com luzes spot. O apresentador (${presenterDesc}) puxa o pano de veludo preto de uma vez. No instante em que o pano sai, o produto aparece EXATAMENTE como na Imagem 4: na mesma posição, com a frente principal virada para a câmera desde o primeiro quadro. O produto NUNCA aparece de costas, de lado ou girando, e não se move sozinho. A câmera avança até o enquadramento da Imagem 4: o apresentador atrás do púlpito, sorrindo largo, com as duas mãos abertas ao lado do produto, apresentando com empolgação.
Fala (português brasileiro, voz ${presenterVoice} grave, eufórica e rápida): "${fala2A}"

TOMADA 2 (5 a 10 segundos) – corte seco para a Imagem 5: close do produto sobre superfície preta, com fundo preto. A mão interage com o principal detalhe do produto, igual à Imagem 5. Movimento de câmera lento e suave em volta do produto, estilo comercial de produto.
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
