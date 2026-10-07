import {
  AniaCategory,
  AniaCalcaSubtype,
  AniaGender,
  AniaBody,
  ProductMode,
  AgeMode,
  ScenarioKey,
} from './types';

// ─── 1. DICIONÁRIO DE TECIDOS ───────────────────────────────────────────────
export const FABRICS: Record<string, string> = {
  'duna': 'tecido duna: plano, levemente encorpado, toque seco com leve textura granulada, caimento solto e fluido, sem brilho',
  'viscolinho': 'viscolinho: leve, fresco, aparência de linho com toque macio, caimento fluido, textura de trama sutil',
  'linho': 'linho: trama aparente, aspecto natural levemente rústico, pequenos vincos naturais, sem brilho, caimento leve',
  'bengaline': 'bengaline: encorpado, com nervuras horizontais finas, elástico, ajusta ao corpo sem marcar, leve acetinado',
  'suplex': 'suplex: malha lisa, compacta e elástica, leve brilho acetinado, abraça o corpo',
  'viscolycra': 'viscolycra: malha leve, macia, fluida e elástica, toque gelado, caimento solto',
  'crepe': 'crepe: superfície levemente granulada e fosca, encorpado, caimento pesado e reto',
  'canelad': 'malha canelada: nervuras verticais bem visíveis, macia e elástica, acompanha o corpo',
  'ribana': 'ribana canelada: nervuras verticais bem visíveis, macia e muito elástica',
  'jacquard': 'jacquard: desenho tecido na própria trama, em relevo sutil, encorpado',
  'jackar': 'jacquard: desenho tecido na própria trama, em relevo sutil, encorpado',
  'plissad': 'plissado: pregas finas, regulares e permanentes que abrem e fecham com o movimento',
  'jeans': 'jeans: sarja de algodão com diagonal aparente, costuras pespontadas visíveis, encorpado',
  'alfaiataria': 'alfaiataria: plano, estruturado, caimento reto e elegante, sem elasticidade aparente',
  'risca de giz': 'alfaiataria risca de giz: listras finas verticais regulares, tecido estruturado',
  'malha': 'malha: macia, leve, flexível, caimento natural',
  'moletinho': 'moletinho: malha macia e encorpada, toque aveludado por dentro',
  'moletom': 'moletom: malha encorpada, macia e aconchegante, acabamento canelado',
  'liganete': 'liganete: malha fina, leve, fluida, levemente acetinada',
  'cetim': 'cetim: superfície lisa e brilhante, fluido, reflete a luz suavemente',
  'tricot': 'tricô: pontos de tricô visíveis, textura em relevo, macio',
  'algodao': 'algodão: tecido natural, fosco, macio, trama discreta',
  'couro': 'couro/sintético: acabamento liso e resistente, textura e brilho acetinado característico',
  'nobuck': 'nobuck: textura aveludada, acabamento fosco e toque suave',
  'camurca': 'camurça: acabamento aveludado macio com textura rústica elegante',
  'lona': 'lona/canvas: tecido resistente e tramado, acabamento esportivo',
};

export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Detecta o tecido visual baseado no nome do produto, campo manual ou informações do produto.
 */
export function detectFabric(name: string, manualFabric?: string, info?: string): { key: string; description: string } {
  const combined = removeAccents(`${manualFabric || ''} ${name || ''} ${info || ''}`);
  for (const [key, desc] of Object.entries(FABRICS)) {
    if (combined.includes(key)) {
      return { key, description: desc };
    }
  }
  return {
    key: manualFabric ? removeAccents(manualFabric) : 'padrao',
    description: 'o mesmo tecido visível na referência',
  };
}

// ─── 2. DETECÇÃO DE ELASTICIDADE (ESTICA) ──────────────────────────────────
/**
 * Sugestão de "estica" (detectStretch) — só pré-marca o rádio; o usuário confirma.
 * Retorna true para Sim, false para Não, ou null caso não haja indícios claros.
 */
export function detectStretch(text: string): boolean | null {
  const norm = removeAccents(text || '');
  if (!norm.trim()) return null;

  // Calçados por definição não esticam (marcar NÃO por padrão)
  if (FOOTWEAR_KEYWORDS.some((kw) => norm.includes(kw))) {
    return false;
  }

  // Check explicit non-stretch phrases first (e.g. "sem elastano", "100% algodao", "nao estica")
  const naoTerms = [
    'sem elastano',
    'nao estica',
    'sem lycra',
    'sem elasticidade',
    '100% algodao',
    'alfaiataria',
    'risca de giz',
    'linho puro',
    'social',
  ];

  if (naoTerms.some((t) => norm.includes(t))) {
    return false;
  }

  const simTerms = [
    'elastano',
    'lycra',
    'spandex',
    'suplex',
    'bengaline',
    'viscolycra',
    'canelad',
    'ribana',
    'malha',
    'legging',
    'estica',
    'elasticidade',
    'stretch',
  ];

  if (simTerms.some((t) => norm.includes(t))) {
    return true;
  }

  return null;
}

/**
 * Redimensiona e comprime imagens no navegador antes do upload para evitar 413 Payload Too Large
 * e timeouts em ambientes de produção/Vercel/Cloudflare.
 */
export async function compressAndResizeImage(file: File, maxDimension = 1280, quality = 0.84): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawBase64 = e.target?.result as string;
      if (!rawBase64) return resolve('');

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(rawBase64);

        ctx.drawImage(img, 0, 0, width, height);
        // Sempre converte para image/jpeg para manter alta qualidade e peso levíssimo (< 300KB)
        const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedBase64);
      };
      img.onerror = () => resolve(rawBase64);
      img.src = rawBase64;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime uma string base64 existente (ou imagem gerada da IA) para garantir que
 * payloads com múltiplas imagens nunca ultrapassem o limite de 4.5 MB do Vercel/servidor.
 */
export async function compressBase64Image(base64: string, maxDimension = 1024, quality = 0.82): Promise<string> {
  if (!base64 || typeof base64 !== 'string') return '';
  if (!base64.startsWith('data:image')) return base64;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDimension && height <= maxDimension && base64.length < 400 * 1024) {
          return resolve(base64);
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64);

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    } catch {
      resolve(base64);
    }
  });
}

/**
 * Extrai a cor dominante básica da imagem no navegador como fallback instantâneo
 */
export async function extractDominantColorFromImage(base64: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          const width = 80;
          const height = 80;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const imgData = ctx.getImageData(0, 0, width, height).data;

          // Histograma de votos de cores
          const colorVotes: Record<string, number> = {
            'Verde': 0,
            'Azul': 0,
            'Marrom': 0,
            'Vermelho': 0,
            'Rosa': 0,
            'Amarelo': 0,
            'Laranja': 0,
            'Roxo': 0,
            'Vinho': 0,
            'Bege': 0,
            'Preto': 0,
            'Branco': 0,
            'Cinza': 0,
          };

          let totalValidPixels = 0;
          let totalChromaticVotes = 0;

          for (let y = 6; y < height - 6; y++) {
            for (let x = 6; x < width - 6; x++) {
              const idx = (y * width + x) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];
              const a = imgData[idx + 3];

              if (a < 100) continue;

              // Ignora fundo branco puro ou muito claro de estúdio (> 245)
              if (r > 245 && g > 245 && b > 245) continue;

              totalValidPixels++;

              // Conversão RGB -> HSL
              const rN = r / 255, gN = g / 255, bN = b / 255;
              const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
              let h = 0, s = 0, l = (max + min) / 2;

              if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                  case rN: h = (gN - bN) / d + (gN < bN ? 6 : 0); break;
                  case gN: h = (bN - rN) / d + 2; break;
                  case bN: h = (rN - gN) / d + 4; break;
                }
                h *= 60;
              }

              // Classificação por pixel individual
              if (l < 0.16) {
                colorVotes['Preto'] += 1;
              } else if (l > 0.88 && s < 0.18) {
                colorVotes['Branco'] += 1;
              } else if (s < 0.16) {
                colorVotes['Cinza'] += 1;
              } else {
                // Pixel cromático com cor ativa (Verde, Azul, Marrom, etc.)
                totalChromaticVotes += 2.5;

                if (h >= 0 && h < 18) {
                  if (s > 0.22 && l < 0.40 && r > g && r > b) {
                    colorVotes['Marrom'] += 3.5;
                  } else if (l < 0.35) {
                    colorVotes['Vinho'] += 2.5;
                  } else {
                    colorVotes['Vermelho'] += 2.5;
                  }
                } else if (h >= 18 && h < 48) {
                  if (l < 0.45 && s < 0.75) {
                    colorVotes['Marrom'] += 4;
                  } else if (l > 0.65 && s < 0.45) {
                    colorVotes['Bege'] += 2.5;
                  } else {
                    colorVotes['Laranja'] += 2.5;
                  }
                } else if (h >= 48 && h < 75) {
                  // Faixa de transição entre Mostarda, Bege e Verde Militar/Oliva
                  if (g >= r * 0.82 && l < 0.58) {
                    colorVotes['Verde'] += 4.5; // Verde Oliva / Militar / Musgo / Cáqui
                  } else if (l > 0.65 && s < 0.45) {
                    colorVotes['Bege'] += 2.5;
                  } else if (r > g * 1.15 && s > 0.45) {
                    colorVotes['Amarelo'] += 3;
                  } else if (g >= r) {
                    colorVotes['Verde'] += 4;
                  } else {
                    colorVotes['Amarelo'] += 2;
                  }
                } else if (h >= 75 && h < 165) {
                  colorVotes['Verde'] += 4.5; // Tons verdes puros (esmeralda, folha, menta, etc.)
                } else if (h >= 165 && h < 260) {
                  colorVotes['Azul'] += 4.5; // Tons azuis (marinho, jeans, royal, turquesa, etc.)
                } else if (h >= 260 && h < 315) {
                  colorVotes['Roxo'] += 3;
                } else {
                  if (l > 0.55) {
                    colorVotes['Rosa'] += 3;
                  } else {
                    colorVotes['Vinho'] += 3;
                  }
                }
              }
            }
          }

          if (totalValidPixels === 0) return resolve('Branco');

          // Se mais de 10% dos pixels não-fundo têm cor cromática, desconsidera Cinza/Preto/Branco de fundo/sola
          if (totalChromaticVotes > totalValidPixels * 0.10) {
            delete colorVotes['Cinza'];
            delete colorVotes['Branco'];
            delete colorVotes['Preto'];
          }

          let bestColor = 'Preto';
          let maxVotes = -1;
          for (const [col, votes] of Object.entries(colorVotes)) {
            if (votes > maxVotes) {
              maxVotes = votes;
              bestColor = col;
            }
          }

          resolve(bestColor);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = base64;
    } catch {
      resolve(null);
    }
  });
}

// ─── 2.1. DETECÇÃO DE TIPO DE PRODUTO (CALÇADOS VS ROUPAS) E NOME CURTO ──
export const FOOTWEAR_KEYWORDS = [
  'tenis',
  'sapato',
  'sandalia',
  'chinelo',
  'slide',
  'rasteirinha',
  'salto',
  'bota',
  'coturno',
  'mocassim',
  'sapatilha',
  'papete',
  'tamanco',
  'scarpin',
  'chuteira',
];

export const APPAREL_KEYWORDS = [
  'calca',
  'calcas',
  'vestido',
  'vestidos',
  'saia',
  'saias',
  'short',
  'shorts',
  'bermuda',
  'bermudas',
  'camisa',
  'camisas',
  'camiseta',
  'camisetas',
  'blusa',
  'blusas',
  'cropped',
  'regata',
  'regatas',
  'macacao',
  'macaquinho',
  'conjunto',
  'conjuntos',
  'pijama',
  'pijamas',
  'camisola',
  'baby doll',
  'babydoll',
  'body',
  'jaqueta',
  'jaquetas',
  'casaco',
  'casacos',
  'moletom',
  'moletinho',
  'cardigan',
  'blazer',
  'biquini',
  'maio',
  'sunga',
  'legging',
  'pantalona',
  'roupa',
  'roupas',
];

export function detectProductMode(name?: string, info?: string): ProductMode | null {
  const norm = removeAccents(`${name || ''} ${info || ''}`);
  if (!norm.trim()) return null;
  if (FOOTWEAR_KEYWORDS.some((kw) => new RegExp(`\\b${kw}`, 'i').test(norm))) {
    return 'footwear';
  }
  if (APPAREL_KEYWORDS.some((kw) => new RegExp(`\\b${kw}`, 'i').test(norm))) {
    return 'apparel';
  }
  return null;
}

/**
 * Detecta o gênero do produto a partir do nome ou informações (ex: "masculino", "homem", "para ele", etc.)
 */
export function detectGender(name?: string, info?: string): AniaGender | null {
  const combined = removeAccents(`${name || ''} ${info || ''}`);
  if (!combined.trim()) return null;

  const isChild = CHILD_KEYWORDS.some((kw) => new RegExp(`\\b${kw}`, 'i').test(combined));
  // Se for produto infantil e NÃO for explicitamente "menino" ou "menina", o gênero fica desmarcado (null) para o usuário escolher
  if (isChild) {
    if (new RegExp(`\\bmenino\\b`, 'i').test(combined)) return 'Homem';
    if (new RegExp(`\\bmenina\\b`, 'i').test(combined)) return 'Mulher';
    return null;
  }

  const mascTerms = [
    'masculin',
    'masculino',
    'masculina',
    'homem',
    'homens',
    'para homem',
    'para homens',
    'para ele',
    'menino',
    'garoto',
  ];
  const femTerms = [
    'feminin',
    'feminino',
    'feminina',
    'mulher',
    'mulheres',
    'para mulher',
    'para mulheres',
    'para ela',
    'menina',
    'garota',
    'dama',
  ];

  if (mascTerms.some((t) => new RegExp(`\\b${t}`, 'i').test(combined))) {
    return 'Homem';
  }
  if (femTerms.some((t) => new RegExp(`\\b${t}`, 'i').test(combined))) {
    return 'Mulher';
  }
  return null;
}

export const CHILD_KEYWORDS = [
  'infantil',
  'crianca',
  'kids',
  'bebe',
  'baby',
  'menino',
  'menina',
  'juvenil',
  'toddler',
  'recem nascido',
  'primeiros passos',
  'escolar',
];

export const ELDERLY_KEYWORDS = [
  'idoso',
  'idosa',
  'terceira idade',
  'senhor',
  'senhora',
  'ortopedico',
];

/**
 * Detecta a faixa etária a partir do nome ou informações do produto
 */
export function detectAgeMode(name?: string, info?: string): AgeMode | null {
  const combined = removeAccents(`${name || ''} ${info || ''}`);
  if (!combined.trim()) return null;

  if (CHILD_KEYWORDS.some((kw) => new RegExp(`\\b${kw}`, 'i').test(combined))) {
    return 'child';
  }
  if (ELDERLY_KEYWORDS.some((kw) => new RegExp(`\\b${kw}`, 'i').test(combined))) {
    return 'senior';
  }

  // Quando falar masculino ou feminino, ou adulto, automaticamente a faixa etária é Adulto
  const adultTerms = [
    'adulto',
    'adulta',
    'masculin',
    'masculino',
    'masculina',
    'feminin',
    'feminino',
    'feminina',
    'homem',
    'homens',
    'mulher',
    'mulheres',
    'para homem',
    'para mulher',
    'para ele',
    'para ela',
  ];
  if (adultTerms.some((kw) => new RegExp(`\\b${kw}`, 'i').test(combined))) {
    return 'adult';
  }

  // Se identificou como calçado e não é infantil, faixa etária padrão é Adulto
  if (detectProductMode(name, info) === 'footwear') {
    return 'adult';
  }

  return null;
}

/**
 * Detecta o tipo de corpo a partir do nome ou informações do produto
 */
export function detectBody(name?: string, info?: string): AniaBody | null {
  const combined = removeAccents(`${name || ''} ${info || ''}`);
  if (!combined.trim()) return null;

  // Calçados: tipo de corpo do modelo é sempre Normal por padrão e fica identificado em azul
  if (detectProductMode(name, info) === 'footwear') {
    return 'Normal';
  }

  if (['plus size', 'plussize', 'plus-size', 'gordinha', 'gordinho', 'curvy', 'tamanhos grandes', 'g1', 'g2', 'g3', 'g4'].some((kw) => combined.includes(kw))) {
    return 'Plus size';
  }
  return null;
}

/**
 * Extrai apenas a palavra-chave principal e curta do produto reconhecido
 */
export function extractShortProductName(text: string): string {
  if (!text || !text.trim()) return '';
  const norm = removeAccents(text);

  // Lista ordenada por especificidade composta primeiro
  const shortKeywords: [string, string][] = [
    ['short saia', 'Short Saia'],
    ['shorts saia', 'Short Saia'],
    ['baby doll', 'Baby Doll'],
    ['babydoll', 'Baby Doll'],
    ['short doll', 'Baby Doll'],
    ['wide leg', 'Calça Wide Leg'],
    ['tenis', 'Tênis'],
    ['sapato', 'Sapato'],
    ['sandalia', 'Sandália'],
    ['chinelo', 'Chinelo'],
    ['slide', 'Chinelo Slide'],
    ['rasteirinha', 'Rasteirinha'],
    ['bota', 'Bota'],
    ['coturno', 'Coturno'],
    ['mocassim', 'Mocassim'],
    ['sapatilha', 'Sapatilha'],
    ['papete', 'Papete'],
    ['tamanco', 'Tamanco'],
    ['scarpin', 'Scarpin'],
    ['chuteira', 'Chuteira'],
    ['pijama', 'Pijama'],
    ['camisola', 'Camisola'],
    ['vestido', 'Vestido'],
    ['calca', 'Calça'],
    ['legging', 'Legging'],
    ['pantalona', 'Pantalona'],
    ['bermuda', 'Bermuda'],
    ['short', 'Short'],
    ['shorts', 'Shorts'],
    ['saia', 'Saia'],
    ['macacao', 'Macacão'],
    ['macaquinho', 'Macaquinho'],
    ['conjunto', 'Conjunto'],
    ['blusa', 'Blusa'],
    ['cropped', 'Cropped'],
    ['camisa', 'Camisa'],
    ['camiseta', 'Camiseta'],
    ['regata', 'Regata'],
    ['body', 'Body'],
    ['cardigan', 'Cardigan'],
    ['jaqueta', 'Jaqueta'],
    ['casaco', 'Casaco'],
    ['moletom', 'Moletom'],
    ['blazer', 'Blazer'],
    ['biquini', 'Biquíni'],
    ['maio', 'Maiô'],
    ['sunga', 'Sunga'],
  ];

  for (const [kw, formatted] of shortKeywords) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(norm)) {
      return formatted;
    }
  }

  // Não usa fallback genérico de palavras avulsas para evitar textos aleatórios
  return '';
}

// ─── 2.2. DETECÇÃO DE CENÁRIO NATIVO (AMBIENTE NATURAL) ───────────────────
export function detectScenarioKey(
  productName: string,
  productInfo?: string,
  category?: AniaCategory
): ScenarioKey {
  const norm = removeAccents(`${productName || ''} ${productInfo || ''}`);

  if (['pijama', 'camisola', 'baby doll', 'babydoll', 'robe', 'dormir'].some((k) => norm.includes(k)) || category === 'PIJAMA_CAMISOLA') {
    return 'home';
  }
  if (['academia', 'treino', 'fitness', 'musculacao', 'crossfit', 'ginastica', 'suplex'].some((k) => norm.includes(k))) {
    return 'gym';
  }
  if (['caminhada', 'corrida', 'parque', 'praca', 'pista', 'ar livre'].some((k) => norm.includes(k))) {
    return 'park';
  }
  if (['praia', 'piscina', 'biquini', 'maio', 'saida de praia', 'mar', 'sol', 'resort'].some((k) => norm.includes(k))) {
    return 'beach';
  }
  if (['mecanico', 'oficina', 'ferramenta', 'operario', 'trabalho pesado', 'obra', 'uniforme industrial'].some((k) => norm.includes(k))) {
    return 'workshop';
  }
  if (['skate', 'skatista', 'street', 'pista de skate', 'urbano'].some((k) => norm.includes(k))) {
    return 'skate';
  }
  if (['social', 'executivo', 'escritorio', 'alfaiataria', 'evento', 'trabalho', 'reuniao'].some((k) => norm.includes(k))) {
    return 'social_simple';
  }
  if (['passeio', 'rua', 'casual', 'shopping', 'calcada', 'jeans', 'duna'].some((k) => norm.includes(k))) {
    return 'casual_outdoor';
  }

  return 'other';
}

export function getScenarioDescription(key: ScenarioKey, naturalEnv: boolean): string {
  if (!naturalEnv || key === 'home') {
    return 'quarto simples e aconchegante de uma casa brasileira real, piso de cerâmica, móveis normais de família brasileira, organizado e sem luxo, iluminação frontal suave';
  }

  switch (key) {
    case 'gym':
      return 'academia comum e limpa de bairro brasileiro, boa iluminação, fundo discreto e sem outras pessoas em primeiro plano ou em destaque, foco exclusivo no produto e modelo';
    case 'park':
      return 'praça pública ou parque simples com pista de caminhada, fundo verde natural suave e discreto, sem pessoas concorrentes ou distrações visuais';
    case 'beach':
      return 'cenário de praia ou beira-mar simples e realista, areia clara e luz do dia suave, fundo limpo sem banhistas em destaque';
    case 'workshop':
      return 'oficina mecânica ou ambiente de trabalho simples e organizado, ferramentas ao fundo de forma limpa e discreta, sem ruído visual';
    case 'skate':
      return 'praça urbana ou pista de skate com piso de concreto liso, fundo minimalista sem elementos que disputem a atenção';
    case 'social_simple':
      return 'ambiente profissional contemporâneo e simples, hall ou escritório neutro e discreto, sem luxo excessivo';
    case 'casual_outdoor':
      return 'calçada ou rua residencial tranquila e arborizada do dia a dia brasileiro, fundo limpo e iluminação natural suave';
    case 'other':
    default:
      return 'ambiente nativo de uso limpo, neutro e realista, com fundo discreto que contextualiza sem disputar atenção com o produto';
  }
}

// ─── 3. CATEGORIAS E SUBTIPOS ──────────────────────────────────────────────
export const CATEGORY_KEYWORDS: [AniaCategory, string[]][] = [
  ['PIJAMA_CAMISOLA', ['pijama', 'camisola', 'baby doll', 'babydoll', 'robe', 'short doll', 'conjunto de dormir']],
  ['SHORT_SAIA', ['short saia', 'shorts saia', 'saia short', 'saia shorts', 'short-saia', 'saia com short']],
  ['MACACAO', ['macacao', 'macaquinho', 'jardineira']],
  ['CONJUNTO', ['conjunto', 'kit blusa', 'blusa e calca', 'blusa e short', 'cropped e']],
  ['VESTIDO', ['vestido']],
  ['SAIA', ['saia']],
  ['CALCA', ['calca', 'legging', 'pantalona', 'wide leg', 'flare', 'capri', 'cargo', 'skinny', 'jogger']],
  ['BERMUDA_SHORT', ['bermuda', 'short', 'shorts']],
  ['BLUSA', ['blusa', 'camiseta', 'camisa', 'cropped', 'top', 'regata', 'body', 't-shirt']],
  ['CALCADO', ['tenis', 'sapato', 'sandalia', 'chinelo', 'salto', 'bota', 'mocassim', 'sapatilha']],
];

export function detectCategory(name: string, info?: string): { category: AniaCategory; subtype: AniaCalcaSubtype } {
  const norm = removeAccents(`${name || ''} ${info || ''}`);

  let detectedCat: AniaCategory = 'AUTO';
  for (const [cat, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => norm.includes(kw))) {
      detectedCat = cat;
      break;
    }
  }

  let subtype: AniaCalcaSubtype = 'NORMAL';
  if (detectedCat === 'CALCA') {
    if (['flare', 'pantalona', 'wide leg', 'bailarina'].some((k) => norm.includes(k))) {
      subtype = 'PERNA_LARGA';
    } else if (['social', 'alfaiataria', 'risca de giz'].some((k) => norm.includes(k))) {
      subtype = 'SOCIAL';
    } else if (['skinny', 'legging', 'capri', 'cargo', 'jeans reta'].some((k) => norm.includes(k))) {
      subtype = 'AJUSTADA';
    }
  }

  return { category: detectedCat, subtype };
}

export function getCategoryFramingType(
  category: AniaCategory,
  productMode: ProductMode = 'apparel'
): 'INFERIOR' | 'COMPLETA' | 'CALCADO' {
  if (productMode === 'footwear' || category === 'CALCADO') {
    return 'CALCADO';
  }
  if (['CALCA', 'BERMUDA_SHORT', 'SAIA', 'SHORT_SAIA'].includes(category)) {
    return 'INFERIOR';
  }
  return 'COMPLETA';
}

// ─── 4. BIBLIOTECA DE MOVIMENTOS (MOVES) ───────────────────────────────────
export interface CategoryMoves {
  v1: string;
  v2: string;
  v3: string;
}

export const MOVES_LIBRARY: Record<AniaCategory, CategoryMoves> = {
  SHORT_SAIA: {
    v1: `Começa já fazendo uma corridinha leve no lugar enquanto a câmera faz um zoom suave na peça. Corte rápido: agachamentos naturais e controlados. Levanta um joelho, troca para o outro e estica uma perna para frente, como em treino. Corte: segura delicadamente uma lateral da saia e levanta só o necessário para mostrar o short por baixo, soltando em seguida. [E] Segura as duas laterais na altura do quadril e estica o tecido para os lados, mostrando a elasticidade. [NE] Passa as duas mãos pelas laterais do quadril, mostrando o caimento. Finaliza dando alguns passos em direção à câmera com zoom de baixo para cima.`,
    v2: `Começa caminhando dois passos em direção à câmera com zoom rápido no cós. Corte close no cós: [E] segura a frente do cós e dá duas puxadinhas para frente (puxa–solta–puxa–solta), mostrando a elasticidade. [NE] passa as pontas dos dedos pelo cós, mostrando o acabamento. Corte plano aberto: pulinhos leves no lugar, mostrando que a saia acompanha sem subir. Corte zoom na barra: balança o quadril de um lado para o outro e a saia acompanha. Elevação lateral de uma perna e depois da outra. Corte: desliza a mão pela lateral da saia, do cós até a barra. Pose frontal com o peso numa perna, ainda em movimento.`,
    v3: `Dois passos laterais rápidos, levando o peso de um lado para o outro, a saia acompanhando. Corte com zoom no quadril. Passada lateral de treino (afundo lateral), volta ao centro e repete para o outro lado. Corte: cruza uma perna levemente à frente da outra, faz uma viradinha de uns 15° e passa a mão pela lateral da saia, mostrando o caimento. Fica na ponta dos pés e desce duas vezes enquanto a câmera faz zoom rápido de baixo para cima. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  BERMUDA_SHORT: {
    v1: `Começa já em movimento, de frente. [E] Puxa a frente do cós para frente mostrando bastante elasticidade (se tiver bolso funcional, a outra mão no bolso). [NE] Passa os dedos pelo cós e pelos detalhes da cintura. Corte rápido com zoom no cós. [E] Puxadas nas laterais do quadril, primeiro um lado e depois o outro, mostrando que veste bem e estica. [NE] Desliza as mãos pelas laterais do quadril até a barra, mostrando o caimento. Passa as mãos pela frente e pelas laterais, valorizando os detalhes. Corte zoom na barra.`,
    v2: `Dois passinhos curtos para frente. Levanta um joelho, volta, levanta o outro, mostrando conforto e mobilidade. Corte: agachamento leve e sobe. [E] Segura o tecido na lateral da coxa e dá duas puxadinhas curtas para fora; o tecido volta ao corpo. [NE] Ajeita a barra com as pontas dos dedos, mostrando o acabamento. Corte: zoom de baixo para cima, da barra até o cós. Close rápido nos detalhes reais (botões, cinto, passadores, amarração — só os que existem).`,
    v3: `Corridinha leve no lugar. Corte: passos laterais curtos de um lado para o outro. Afundo lateral rápido para cada lado. Corte: desliza uma mão pela lateral, da cintura até a barra. Leve inclinação do corpo para um lado e para o outro (sem virar). Zoom rápido de baixo para cima. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  CALCA: {
    v1: `Começa já em movimento, de frente. [E] Segura as duas laterais da calça na altura do quadril e faz duas puxadinhas rápidas para os lados (puxa–solta–puxa–solta), bem visíveis, sem deformar. [NE] Passa as duas mãos pelas laterais do quadril, de cima para baixo, mostrando o caimento. Corte: zoom forte no cós. [E] Segura a frente do cós com as duas mãos e dá duas puxadinhas firmes para frente. [NE] Passa as pontas dos dedos pelo cós e pelos botões, mostrando o acabamento. Corte plano aberto: troca o peso para uma perna e faz uma pose frontal curta, valorizando cintura → quadril → coxas → barra. Corte zoom cintura e quadril: mãos apoiadas sobre a região dos bolsos (por cima do tecido; dentro só se o bolso for funcional). Desliza as duas mãos da cintura, pelas laterais do quadril, até as coxas. [E] Zoom na coxa: duas puxadinhas curtas para fora no tecido da lateral; o tecido volta imediatamente.`,
    v2: `Começa caminhando dois ou três passos curtos em direção à câmera, com zoom suave acompanhando. [LARGA] A cada passo a boca da calça balança e abre, mostrando a amplitude. Corte plano aberto: agachamento leve e rápido, sobe imediatamente. Levanta uma perna dobrando levemente o joelho e abaixa. Corte zoom cintura/quadril: uma mão desliza pela lateral da cintura, pelo quadril e pela coxa. Close rápido no cós e nos botões. Close na textura do tecido.`,
    v3: `Passos laterais curtos de um lado para o outro, o tecido acompanhando. Corte: close na barra — [LARGA] movimenta o joelho para frente e para trás fazendo a boca da calça abrir e fechar. Corte: mão na cintura e troca de peso de uma perna para a outra. Leve inclinação de uns 15° para um lado e para o outro, voltando de frente. Zoom de baixo para cima, da barra até o cós. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  SAIA: {
    v1: `Começa caminhando dois ou três passos em direção à câmera, a saia balançando a cada passo. Corte: segura as duas laterais na altura do quadril e abre levemente a saia, mostrando a amplitude (plissado: as pregas abrem). Zoom no cós. Balança suavemente o quadril de um lado para o outro. A câmera desce do cós até a barra.`,
    v2: `Meia volta suave para um lado (até 45°) e retorno para a frente, a saia girando junto. Desliza a mão pela lateral da saia. Corte: close no tecido em movimento. Troca o peso de uma perna para a outra com uma mão na cintura. [E] Leve puxadinha lateral no cós elástico. Dois passos cruzados, elegantes.`,
    v3: `Passos laterais elegantes. Corte: segura uma lateral da saia e balança duas vezes de um lado para o outro. Close na barra. Zoom de baixo para cima. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  VESTIDO: {
    v1: `Começa caminhando dois ou três passos em direção à câmera, segurando as duas laterais da saia e fazendo o vestido balançar. Corte: para por um instante, segura a saia na região do quadril e abre delicadamente para os lados, mostrando a amplitude; dois pequenos balanços alternados com zoom. Corte: close nas mangas — movimenta os braços para frente e para os lados, as manguinhas se mexem; toca a manga com a ponta dos dedos e solta (sem puxar). (Sem mangas: close nas alças/cava.)`,
    v2: `Corte: zoom no decote e nos botões/detalhes frontais; a mão passa pela lateral do busto e desce pela frente do vestido. Corte: a câmera começa num close da parte de cima e desce passando pela cintura e pela saia até a barra, enquanto ela faz pequenos movimentos de quadril. Meia volta suave de uns 45° com uma mão na cintura e a outra tocando a saia; volta para a frente.`,
    v3: `Segura uma lateral da saia e faz dois balanços suaves; close rápido no tecido balançando. Mão na cintura e troca de peso de uma perna para a outra. [E] Leve puxadinha na lateral da cintura mostrando a elasticidade. Dois passos curtos para frente. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  PIJAMA_CAMISOLA: {
    v1: `Começa dando um passo curto em direção à câmera com zoom rápido no pijama completo. Sem pausa, passa as duas mãos de cima para baixo pela frente da blusa, acompanhando o caimento. Corte + zoom numa das mangas: segura a pontinha, dá uma puxadinha leve e solta. Corte + zoom na abertura frontal: passa os dedos pelos botões de cima para baixo, sem abrir nenhum. Segura as duas laterais da barra da blusa e dá duas esticadinhas curtas e suaves. Corte + zoom descendo para o short: passa as mãos pelas laterais do short até a barra; zoom no acabamento da barra. (Camisola: as mesmas ações na barra da camisola.)`,
    v2: `Começa já andando em direção à câmera com passos leves. Corte: leve espreguiçada com os braços para cima, mostrando que a peça acompanha o corpo (manter o enquadramento sem rosto). Corte: movimento rápido do tronco, vira levemente para um lado e depois para o outro (sem perfil, sem costas). Close no tecido: a mão desliza mostrando a maciez. Corte plano aberto do conjunto completo; ela balança o corpo naturalmente, o tecido acompanha.`,
    v3: `Dois passos curtos no lugar, o tecido acompanhando. Corte: passa uma mão pela frente da blusa e pelo short. Leve mudança de pose sem virar de costas. Zoom de baixo para cima no conjunto. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  CONJUNTO: {
    v1: `Começa caminhando dois passos em direção à câmera com zoom no conjunto completo. Corte: passa as mãos pela frente da blusa, mostrando decote e caimento. Close nas mangas/alças. Corte para a peça de baixo: [E] puxadinhas laterais na altura do quadril / [NE] mãos deslizando pelas laterais do quadril. Close no cós.`,
    v2: `Corte plano aberto: [E] agachamento leve e sobe / [NE] troca de peso com mão na cintura. Levanta um joelho e depois o outro. Corte: a câmera desce da blusa até a barra da peça de baixo, mostrando que as duas peças combinam. Leve inclinação para um lado e para o outro, voltando de frente. Close na textura do tecido.`,
    v3: `Passos laterais curtos. Corte: mão desliza da blusa até a barra da peça de baixo. Pose frontal com peso numa perna, em leve movimento. Zoom de baixo para cima. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  BLUSA: {
    v1: `Começa com passo curto à frente e zoom na blusa. Passa as duas mãos pela frente, de cima para baixo. Corte: close na gola/decote, a ponta dos dedos percorre o acabamento. Close nas mangas: movimenta os braços. [E] Segura as laterais da barra e dá duas esticadinhas.`,
    v2: `Ergue os braços até a altura dos ombros e baixa, mostrando que a peça não sobe. Corte: giro de uns 30° para cada lado, voltando de frente. Close nos botões/detalhes reais. Ajeita a barra com as mãos.`,
    v3: `Passos laterais. Close na textura. Mão desliza pela lateral da blusa. Zoom de baixo para cima. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  MACACAO: {
    v1: `Começa caminhando em direção à câmera, filmado levemente de baixo para cima. Se tiver bolso funcional: enfia a mão no bolso com zoom nesse momento. Corte: mãos deslizam pela cintura e pelo quadril. Close no decote/alças.`,
    v2: `Meia volta suave de uns 45° com mão na cintura e retorno. [E] Puxadinha leve na lateral do quadril. Corte: câmera desce do decote à barra. Troca de peso elegante.`,
    v3: `Passos laterais, close na barra em movimento, zoom de baixo para cima. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
  CALCADO: {
    v1: `Começa com passos firmes em direção à câmera, enquadramento da cintura para baixo com foco nos pés. Corte: flexão suave do pé demonstrando maciez e resposta da sola. Close no cabedal, costuras e detalhes de acabamento.`,
    v2: `Corte: giro leve do pé de um lado para o outro exibindo o perfil lateral e sola. Passadas no lugar destacando o calce e estabilidade. Close na textura do material e bico.`,
    v3: `Passos laterais curtos e elevação suave do calcanhar. Zoom valorizando o par completo no piso limpo. Finaliza posicionado de frente, apontando para baixo.`,
  },
  AUTO: {
    v1: `Começa de frente com zoom suave na peça destacando acabamentos e caimento. Corte: mãos deslizam pelas laterais mostrando o formato. Corte: passos curtos e postura natural.`,
    v2: `Corte: close nos detalhes frontais e textura do tecido. Pequena inclinação de até 45° e retorno para frente. Zoom de baixo para cima.`,
    v3: `Passos curtos e troca de peso elegante, valorizando a silhueta. Zoom suave na peça. Finaliza de frente, ainda em leve movimento, apontando com o dedo indicador para baixo, em direção à parte inferior da tela, sem nenhum ícone ou elemento gráfico.`,
  },
};

// Movimentos especializados para Calçados Esportivos vs Sociais/Casuais
export const FOOTWEAR_SPORT_MOVES: CategoryMoves = {
  v1: `Começa com passos curtos e firmes em direção à câmera, enquadramento da cintura para baixo focado nos pés. Corte: apoia na ponta dos pés e flexiona levemente o solado demonstrando amortecimento e maciez. Corte rápido: corridinha leve no lugar e pequenos pulinhos suaves mostrando absorção de impacto. Close na sola e costuras reforçadas.`,
  v2: `Agachamento leve e elevação alternada dos pés destacando ergonomia e flexibilidade. Corte: giro controlado do pé para os lados (45°) mostrando perfil lateral, cabedal e logo. Corte close: aproximação da câmera no tecido respirável e solado antiderrapante. Passos laterais firmes.`,
  v3: `Passadas firmes para frente e para trás, demonstrando flexibilidade e conforto para o dia a dia. Corte: elevação de calcanhar e retorno ao solo. Zoom suave de baixo para cima valorizando o par completo. Finaliza com os pés apoiados de frente, apontando para baixo.`,
};

export const FOOTWEAR_CASUAL_MOVES: CategoryMoves = {
  v1: `Começa caminhando com passos calmos e elegantes em direção à câmera, foco dominante nos pés e calçado. Corte close: mudança de apoio de um pé para o outro, demonstrando conforto e ajuste perfeito. Corte: elevação sutil do calcanhar destacando salto e acabamento do solado. Close nas fivelas, costuras e textura do material.`,
  v2: `Giro leve do pé de um lado para o outro (até 30°) para exibir a lateral e o bico do calçado. Passos curtos no lugar com postura firme. Corte close: aproximação na textura do material e pespontos de qualidade.`,
  v3: `Dois passos elegantes à frente e retorno. Corte: cruzada leve de pés e mudança suave de apoio. Zoom de detalhe do calçado completo no chão limpo. Finaliza com os pés posicionados de frente, apontando para baixo.`,
};

// Movimentos em Modo POV Adulto para Produtos Infantis (PROIBIDO GERAR CRIANÇA)
export const CHILD_APPAREL_MOVES: CategoryMoves = {
  v1: `Câmera em primeira pessoa (POV adulto): mãos de adulto seguram a roupinha infantil sobre uma superfície limpa. [E] Estica suavemente o cós elástico e a gola mostrando maciez e elasticidade. [NE] Passa as mãos pelo tecido mostrando o caimento suave. Corte: abre a peça mostrando caimento e corte frontal. Close nos botões de pressão e costuras suaves.`,
  v2: `Mãos adultas desdobram e giram a roupinha infantil suavemente, demonstrando a textura macia do tecido e o acabamento seguro para a pele da criança. Corte: passa as mãos pelo forro e pelos detalhes. Zoom nas costuras reforçadas e etiquetas macias.`,
  v3: `Apresentação das peças infantis lado a lado pelas mãos do adulto, demonstrando praticidade para vestir no dia a dia. Finaliza com a peça posicionada e a mão apontando para baixo.`,
};

export const CHILD_FOOTWEAR_MOVES: CategoryMoves = {
  v1: `Câmera em primeira pessoa (POV adulto): mãos adultas seguram o calçadinho infantil, mostrando a leveza e flexibilidade da sola macia. Corte: flexiona suavemente a sola com os dedos para mostrar amortecimento seguro para os primeiros passos. Close nas costuras e fechos práticos.`,
  v2: `Mãos adultas giram o calçado infantil demonstrando o bico arredondado, o interior forrado e o solado antiderrapante. Corte: passa a mão na palmilha macia. Close no cabedal e nos detalhes delicados.`,
  v3: `O par infantil é posicionado sobre a superfície limpa e demonstrado em ângulo completo. Finaliza com as mãos apresentando o calçado e apontando para baixo.`,
};

/**
 * Filtra as sequências de movimento da categoria de acordo com:
 * - estica, subtipo, productMode, ageMode e productName
 */
export function filterMoves(
  categoryOrParams:
    | AniaCategory
    | {
        category: AniaCategory;
        subtype?: AniaCalcaSubtype;
        estica?: boolean;
        productMode?: ProductMode;
        ageMode?: AgeMode;
        productName?: string;
      },
  subtypeParam?: AniaCalcaSubtype,
  esticaParam?: boolean,
  productModeParam: ProductMode = 'apparel',
  ageModeParam: AgeMode = 'adult',
  productNameParam: string = ''
): { v1: string; v2: string; v3: string } {
  let category: AniaCategory;
  let subtype: AniaCalcaSubtype = 'NORMAL';
  let estica = false;
  let productMode: ProductMode = 'apparel';
  let ageMode: AgeMode = 'adult';
  let productName = '';

  if (typeof categoryOrParams === 'object') {
    category = categoryOrParams.category;
    subtype = categoryOrParams.subtype || 'NORMAL';
    estica = Boolean(categoryOrParams.estica);
    productMode = categoryOrParams.productMode || 'apparel';
    ageMode = categoryOrParams.ageMode || 'adult';
    productName = categoryOrParams.productName || '';
  } else {
    category = categoryOrParams;
    subtype = subtypeParam || 'NORMAL';
    estica = Boolean(esticaParam);
    productMode = productModeParam;
    ageMode = ageModeParam;
    productName = productNameParam;
  }

  const normName = removeAccents(productName);

  // 1. Modo Infantil (POV Adulto Obrigatório)
  if (ageMode === 'child') {
    const baseChildMoves = productMode === 'footwear' ? CHILD_FOOTWEAR_MOVES : CHILD_APPAREL_MOVES;
    return cleanMoves(baseChildMoves, estica, subtype);
  }

  // 2. Modo Calçados
  if (productMode === 'footwear' || category === 'CALCADO') {
    const isSport = ['tenis', 'esporte', 'corrida', 'running', 'treino', 'chuteira'].some((k) => normName.includes(k));
    const baseMoves = isSport ? FOOTWEAR_SPORT_MOVES : FOOTWEAR_CASUAL_MOVES;
    return cleanMoves(baseMoves, estica, subtype);
  }

  // 3. Modo Moda / Roupas
  const baseMoves = MOVES_LIBRARY[category] || MOVES_LIBRARY.CALCA;
  return cleanMoves(baseMoves, estica, subtype);
}

function cleanMoves(
  baseMoves: CategoryMoves,
  estica: boolean,
  subtype: AniaCalcaSubtype
): { v1: string; v2: string; v3: string } {
  const cleanText = (text: string): string => {
    let res = text;

    if (estica) {
      res = res.replace(/\[E\]\s*/g, '');
      res = res.replace(/\[NE\][^.\n]*\.?/g, '');
    } else {
      res = res.replace(/\[E\][^.\n]*\.?/g, '');
      res = res.replace(/\[NE\]\s*/g, '');
    }

    if (subtype === 'PERNA_LARGA') {
      res = res.replace(/\[LARGA\]\s*/g, '');
    } else {
      res = res.replace(/\[LARGA\][^.\n]*\.?/g, '');
    }

    return res
      .replace(/\s*\/\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+\./g, '.')
      .trim();
  };

  return {
    v1: cleanText(baseMoves.v1),
    v2: cleanText(baseMoves.v2),
    v3: cleanText(baseMoves.v3),
  };
}

// ─── 5. ACERVO DE FALAS CAMPEÃS (FALAS) ────────────────────────────────────
export interface FalaItem {
  id: string;
  cat: AniaCategory[];
  plus: boolean;
  est: boolean;
  t: string;
}

export const FALAS: FalaItem[] = [
  { id: 'F01', cat: ['BERMUDA_SHORT'], plus: false, est: true, t: 'Essa bermuda é tão confortável e baratinha que eu já peguei três cores. O tecido tem elastano que acompanha os movimentos sem apertar, e é aquela bermuda super confortável para o dia a dia. Se apareceu no carrinho laranja, dá uma olhada nas opções.' },
  { id: 'F02', cat: ['CALCA'], plus: false, est: true, t: 'Amiga, olha esse kit com duas calças cargo. Elas têm bastante elastano, esticam de verdade, não apertam a barriga e não ficam enrolando no corpo. Vestem super bem, deixam um look lindo e são tão confortáveis que dá pra usar o dia inteiro. Clica no carrinho laranja e garante o seu kit antes que acabe.' },
  { id: 'F04', cat: ['CALCA'], plus: false, est: true, t: 'Por esse preço, eu comprei logo duas. Sério, porque é muito difícil achar uma calça flare que veste bonito e ainda fica confortável. Ela tem cintura alta, duplo botão e tecido com elastano que se ajusta ao corpo sem ficar apertando. A modelagem valoriza as curvas. O corte flare dá efeito de pernas alongadas. Se o carrinho laranja apareceu aí, aproveita! Nesse preço, os tamanhos acabam rápido.' },
  { id: 'F05', cat: ['BERMUDA_SHORT', 'CALCA', 'CONJUNTO'], plus: false, est: false, t: 'Tava tão barato que eu já garanti quatro. Bege, super chique, azul marinho, elegante, vinho maravilhoso e o preto combina com qualquer look. Modela o corpo sem apertar, é aquela peça que você veste e já se sente pronta, linda e confortável o dia inteiro. Se o carrinho laranja apareceu pra você, aproveita agora, porque esse tipo de oferta costuma acabar rápido. Garanta o seu antes que o preço mude ou os tamanhos esgotem.' },
  { id: 'F06', cat: ['CALCA'], plus: false, est: false, t: 'Comprei uma, depois duas, e acabei de receber a terceira. Sério, amiga, eu tô apaixonada. Olha esse caimento, cintura alta, soltinha e chique. O tecido é linho leve, tem bolsos e elástico atrás, então fica muito confortável no corpo. Agora eu entendi por que tanta mulher ama essa calça. Se sua numeração ainda estiver disponível, aproveita no carrinho laranja, porque nesse preço vai acabar.' },
  { id: 'F07', cat: ['CONJUNTO'], plus: false, est: false, t: 'Eu amei tanto o marrom que eu já comprei o vinho e o bege. Gente, já tenho três cores e ainda tá faltando o preto, que eu já vou comprar, porque não tem como ter só um desse conjunto. Ele é macio, não aperta e deixa você confortável e arrumada pra passear ou viajar. A calça pantalona tem um caimento lindo no corpo. Corre no carrinho laranja antes que essa oferta acabe.' },
  { id: 'F08', cat: ['CALCA'], plus: true, est: true, t: 'Essa calça capri plus size estava tão baratinha que eu comprei logo duas! Quem tem perna grossa sabe como é difícil achar uma capri que vista bem sem apertar. Essa tem cintura alta, tecido que estica e comprimento abaixo do joelho. E o viés frontal dá aquela alongada nas pernas. Tem várias cores. Se aparecer o carrinho laranja, aproveita!' },
  { id: 'F09', cat: ['SHORT_SAIA', 'CONJUNTO', 'VESTIDO'], plus: false, est: false, t: 'Amiga, eu peguei logo dois. Esse conjunto fitness tem o vestido soltinho por cima e um short confortável por baixo. Então, não fica marcando tudo na academia. Você anda, agacha e treina tranquila. Vai do tamanho M até o GG. Corre no carrinho laranja antes que acabe.' },
  { id: 'F10', cat: ['MACACAO', 'CONJUNTO', 'CALCA'], plus: false, est: false, t: 'Amiga, eu comprei logo três. O marrom elegante, o verde maravilhoso e o bege, que é chiquérrimo. Dá pra usar sutiã normalmente e o zíper delicado nas costas facilita muito, você mesma abre e fecha. A cintura marcada valoriza super e a pantalona alonga e deixa o look muito elegante. E pelo preço que tá saindo, não dá pra deixar passar. Corre no carrinho laranja e garante o seu antes que acabe.' },
  { id: 'F11', cat: ['BERMUDA_SHORT'], plus: true, est: true, t: 'Essa bermuda é tão confortável e baratinha que eu comprei logo três. Amiga, quem tem perna grossa sabe o sofrimento que é achar uma bermuda que não aperte e não fique enrolando na coxa. Essa aqui tem bastante elastano, veste super bem, acompanha o corpo e fica confortável de verdade. A cintura é alta, valoriza sem apertar a barriga e ainda tem esse cinto lindo. Sério, por esse preço, não dá pra deixar passar. Se o carrinho laranja apareceu aí, já garante a sua porque essa vale muito a pena.' },
  { id: 'F12', cat: ['CALCA'], plus: false, est: true, t: 'Tá tão barata que eu peguei logo três. A cinza porque está simplesmente divina, a vinho porque veste linda no corpo e a preta porque combina com tudo. Eu tava cansada de calça apertando o quadril, marcando tudo. Amiga, essa calça tem cintura alta, não aperta, não marca e ainda por cima tem ótima elasticidade. Vê o carrinho laranja aí pra você e já garante a sua.' },
  { id: 'F13', cat: ['CALCA'], plus: false, est: true, t: 'Baixou o preço? Amiga, essa é simplesmente a calça em malha canelada premium mais vendida do TikTok Shop. O motivo é simples. Primeiro, o preço. Você não vai encontrar esse calibre de calça em nenhuma loja por esse preço. Ela tem cintura alta, não aperta, não marca, veste super confortável e ainda tem esse cinto forrado lindo. Já confere aqui.' },
  { id: 'F14', cat: ['CALCA'], plus: false, est: false, t: 'Amiga, dessa vez eu peguei logo três, porque uma calça dessas, nesse preço, eu não ia deixar passar. A modelagem é cintura alta, valoriza muito o corpo, veste super bem e a boca flare deixa o look muito mais elegante. Dá pra usar com body, cropped ou camisa e fica linda em qualquer ocasião. Se ainda tiver seu tamanho, corre no carrinho laranja, porque as mais bonitas acabam primeiro.' },
  { id: 'F15', cat: ['CALCA'], plus: false, est: true, t: 'Amiga, peguei três cores porque eu não aguentava mais calça apertando a cintura e prendendo meus movimentos. Essa aqui veste soltinha, olha esse caimento! E o tecido canelado é macio demais, ela acompanha o corpo sem ficar prendendo, a cintura alta fica super confortável e ainda tem esses bolsos laterais. E nessas cores tá difícil escolher uma só. Amiga, aproveita e garante a sua antes que seu tamanho acabe.' },
  { id: 'F16', cat: ['BERMUDA_SHORT'], plus: false, est: false, t: 'Quem comprou antes vai chorar, porque o vendedor abaixou o preço desse short. Ele é de linho, fica lindo no corpo, veste soltinho nas pernas e deixa qualquer look muito mais arrumado. Se ainda tiver seu tamanho, corre no carrinho laranja antes que o preço mude de novo.' },
  { id: 'F17', cat: ['BERMUDA_SHORT', 'SHORT_SAIA'], plus: false, est: true, t: 'Eu achei que vinha um, mas chegaram três. Nem tô acreditando. O tecido desse short fitness é leve, confortável e acompanha todos os movimentos sem incomodar. Dá pra usar na academia, na caminhada ou até pra ficar em casa. O cós ajusta super bem ao corpo e o tecido tem a elasticidade que a gente ama. Não aperta e não enrola durante os exercícios. Mas aviso, amiga, se o carrinho laranja aparecer aí embaixo, corre. Porque é um kit com três que, nesse preço, não dura até meia-noite. Se não vê o link, sinto muito, já acabou.' },
  { id: 'F18', cat: ['CONJUNTO'], plus: true, est: true, t: 'Amiga, se você é gordinha, para de sofrer com roupa que marca a barriga e aperta a cintura. Eu achei esse conjunto em ribana canelada que estica muito, veste do G1 ao G3 e fica lindo no corpo. Eu peguei logo três cores porque ele é confortável de verdade, não fica travando quando você senta, não marca e tem um caimento maravilhoso. É aquele conjunto que você coloca e já se sente arrumada. Corre pro carrinho laranja, porque os tamanhos maiores são sempre os primeiros a acabar.' },
  { id: 'F19', cat: ['CALCA'], plus: true, est: true, t: 'Eu comprei logo três, porque calça plus size que não aperta a barriga desse jeito é difícil de achar. Olha esse cós, amiga! Ele tem elástico, estica bastante e fica super confortável até pra sentar. A modelagem veste lindo em quem tem quadril largo e barriguinha, tem bolsos e um caimento maravilhoso. Se o carrinho apareceu aí pra você, aproveita e garante a sua antes que acabe.' },
  { id: 'F21', cat: ['PIJAMA_CAMISOLA'], plus: false, est: false, t: 'Tá tão barato que eu comprei logo três. Isso aqui é o tipo de pijama que você veste e não quer mais tirar. Sério, a malha é macia, confortável e ainda fica arrumadinho no corpo. Sabe aquele pijama que dá até pra atender a porta sem vergonha? É esse. Os botões deixam prático, a modelagem não aperta e você se sente confortável o dia inteiro, não só pra dormir. Se você também gosta de conforto sem gastar muito, aproveita o desconto e clica no carrinho agora e leva o seu, amiga.' },
  { id: 'F22', cat: ['BERMUDA_SHORT'], plus: false, est: true, t: 'Tá tão barato que eu peguei logo três. Eu tava cansada de shorts que apertam e marcam tudo. Mas esse aqui, amiga, é em malha crepe com elastano. Não aperta, não marca, estica bastante e é super confortável. A cintura é muito alta e tem esse cinto lindo que dá um tom de sofisticação. É por isso que tantas mulheres estão levando. Se aparecer o carrinho laranja pra você, já garante o seu. O estoque tá voando.' },
  { id: 'F23', cat: ['CALCA'], plus: true, est: true, t: 'Comprei logo três, porque eu estava cansada de calça apertando a barriga e marcando tudo. Amiga, essa calça plus size tem muito elastano, veste super bem, não aperta, não enrola e deixa tudo mais confortável. Depois que eu provei, entendi por que tanta mulher está comprando mais de uma. Se a sua numeração ainda estiver disponível, corre para o carrinho laranja antes que acabe.' },
  { id: 'F24', cat: ['BERMUDA_SHORT'], plus: false, est: true, t: 'Por esse preço, já peguei logo o kit com três. Eu tava cansada de shorts que apertam a barriga e marcam tudo. Mas esse aqui, amiga, é em malha crepe com elastano. Não aperta, não marca e veste super confortável. Tem cintura alta, elástico na cintura e esse lacinho regulador que dá um charme a mais. É por isso que tantas mulheres estão levando. O estoque tá voando!' },
  { id: 'F25', cat: ['CALCA'], plus: false, est: true, t: 'Ninguém acredita no preço que tá saindo essa calça. Sério, quando chegou eu não dei nada, mas na hora que vesti... Olha esse caimento! Cintura alta de verdade, modela o corpo e ainda levanta o bumbum sem esforço. E o melhor, tem lycra, então estica, não aperta e é super confortável pra usar o dia todo. Corre, clica no link e garante já a sua antes que acabe!' },
  { id: 'F26', cat: ['CALCA'], plus: false, est: false, t: 'Eu já vou pedir mais, gente. Essas calças aqui são tão boas pra trabalhar que eu já peguei uma de cada. Tô vestindo a preta, que é um pretinho básico que combina com tudo. Muita gente usa até pra uniforme de serviço. É aquele tecido crepe, mais pesadinho, mais grossinho. Ela não relaxa, não desbota, não precisa passar, pode bater na máquina, não dá bolinha e é zero transparência. Eu peguei uma cor de cada e, se você também quiser aproveitar, é só clicar aqui na sacolinha laranja e aproveitar.' },
  { id: 'F27', cat: ['BERMUDA_SHORT'], plus: false, est: true, t: 'Por esse preço, eu comprei logo três. Eu estava cansada de bermuda que aperta a barriga e marca tudo. Mas essa aqui, amiga, é em linho com elastano. Não aperta, não marca, estica bastante e veste linda. A cintura é muito alta e ainda vem com esse cinto lindo forrado. Por isso, tantas mulheres estão levando. Se aparecer o carrinho laranja pra você, já garante a sua. O estoque está voando.' },
  { id: 'F28', cat: ['CALCA'], plus: false, est: true, t: 'Por esse preço, eu comprei logo três. Eu estava cansada de calça apertando a barriga e marcando tudo. Mas essa aqui, amiga, tem modelagem flare com tecido suplex premium, tem muita elasticidade e essas listras laterais lindas. A cintura é muito alta, é confortável e serve para várias ocasiões. Por isso, tantas mulheres estão levando. Se aparecer o carrinho, já garante a sua.' },
  { id: 'F29', cat: ['BERMUDA_SHORT'], plus: false, est: true, t: 'Tá tão barato que eu peguei logo três. Eu tava cansada de shorts que apertam a barriga e marcam tudo. Mas esse aqui, amiga, é em malha com elastano, não aperta, não marca, estica bastante e veste super confortável. A cintura é muito alta e tem essas estampas lindas que dão um toque de charme à peça. É por isso que tantas mulheres estão levando. Se o carrinho laranja aparecer pra você, já garante o seu. O estoque tá voando.' },
  { id: 'F30', cat: ['CALCA'], plus: true, est: true, t: 'Encontrei no TikTok Shop a loja que vende a calça jeans plus size mais perfeita, que combina com qualquer ocasião. O caimento dela é impecável, tem lycra, não aperta a barriga, não marca e veste perfeito. Sério, amiga, por esse preço tá quase de graça. Não dá pra deixar passar. Se o carrinho laranja ainda aparece pra você, já garante a sua.' },
  { id: 'F31', cat: ['CALCA'], plus: false, est: false, t: 'Baixou o preço? Amiga, essa é simplesmente a calça em linho mais vendida do TikTok Shop. O motivo é simples: primeiro, o preço, você não vai encontrar esse calibre de calça em nenhuma loja. Ela tem cintura alta, não aperta, não marca, veste super confortável e ainda tem esse cinto forrado lindo. Se ainda tiver estoque, confere no carrinho abaixo e já garante a sua, porque essa vai acabar rapidão.' },
  { id: 'F33', cat: ['CALCA', 'SAIA'], plus: false, est: false, t: 'Por esse preço, comprei logo três. Eu tava cansada de calça apertando a barriga e marcando tudo. Amiga, essa calça pantalona é em tecido duna, tem cintura alta, não marca, não aperta, é soltinha e confortável. Sério, agora eu entendi por que tantas mulheres estão comprando. Esse nível de conforto por esse preço é imperdível. Se o carrinho laranja aparecer pra você, já garante a sua.' },
  { id: 'F35', cat: ['CALCA'], plus: false, est: false, t: 'Tá tão barato que eu peguei logo três. Eu tava cansada de calça que aperta a barriga e marca tudo. Mas essa aqui, amiga, é jeans pantalona, 100% algodão, não marca, não aperta e tem um caimento perfeito. Ela tem cintura muito alta, elástico na cintura, bolsos funcionais, é leve, soltinha e veste super confortável. É por isso que tem tantas mulheres levando. Se aparecer o carrinho laranja pra você, já pega a sua.' },
  { id: 'F37', cat: ['PIJAMA_CAMISOLA'], plus: false, est: false, t: 'Amiga, eu peguei logo três: rosa, azul e preto! Olha o caimento dessa camisola. Ela fica soltinha no corpo e é uma delícia pra dormir. Pra dormir ou ficar à vontade em casa, olha como ela veste! As três cores são lindas. Escolhe a sua preferida no carrinho laranja aqui embaixo.' },
  { id: 'F38', cat: ['VESTIDO', 'SAIA', 'MACACAO'], plus: false, est: false, t: 'Olha esse vestido, é o tipo de peça simples que fica linda quando você coloca no corpo. As alças grossas com o viscolinho deixam o modelo leve e com o visual arrumado. Ele é fresquinho, funciona bem nos dias quentes, é super prático, aquele que você pega no guarda-roupa quando quer ficar bonita sem complicação. Clica no carrinho e já garante o seu.' },
  { id: 'F39', cat: ['SHORT_SAIA'], plus: false, est: false, t: 'Amiga, eu peguei logo três. Esse short saia tem a saia mais soltinha por cima e um short superconfortável por baixo. Então ele não fica marcando o corpo na academia. Você caminha, agacha e faz seu treino com muito mais conforto. Vai do tamanho M até o tamanho G3. Corre no carrinho laranja antes que acabe.' },
];

/**
 * Seleção local das falas candidatas (pickFalas) — zero tokens
 * Pontuação:
 * +10 se cat contém a categoria
 * +3 se est == estica do produto; -6 se est = true e produto não estica
 * +3 se plus = true e corpo = Plus size; -10 se plus = true e corpo = Normal
 * +2 se o texto contém palavras do nome do produto ou tecido
 * +1 se fala <= 500 caracteres
 */
export function pickFalas(params: {
  category: AniaCategory;
  estica: boolean;
  body: AniaBody;
  productName: string;
  fabric: string;
}): { selected: FalaItem; backup?: FalaItem; candidates: FalaItem[] } {
  const { category, estica, body, productName, fabric } = params;
  const nameNorm = removeAccents(productName || '');
  const fabricNorm = removeAccents(fabric || '');
  const isPlus = body === 'Plus size';

  const scored = FALAS.map((fala) => {
    let score = 0;

    // Categoria
    if (category === 'AUTO' || fala.cat.includes(category)) {
      score += 10;
    }

    // Estica
    if (fala.est === estica) {
      score += 3;
    } else if (fala.est && !estica) {
      score -= 6;
    }

    // Plus size
    if (fala.plus && isPlus) {
      score += 3;
    } else if (fala.plus && !isPlus) {
      score -= 10;
    }

    // Palavras-chave do produto / tecido
    const words = `${nameNorm} ${fabricNorm}`.split(/\s+/).filter((w) => w.length > 3);
    for (const word of words) {
      if (removeAccents(fala.t).includes(word)) {
        score += 2;
      }
    }

    // Tamanho ideal
    if (fala.t.length <= 500) {
      score += 1;
    }

    return { fala, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    const fallback = FALAS[0];
    return { selected: fallback, candidates: [fallback] };
  }

  // Se tiver pelo menos 2 candidatas fortes, sortear entre as 2 melhores para variar
  const topCandidates = scored.slice(0, 3).map((s) => s.fala);
  let selectedIndex = 0;
  if (topCandidates.length >= 2) {
    selectedIndex = Math.random() < 0.5 ? 0 : 1;
  }

  const selected = topCandidates[selectedIndex] || topCandidates[0];
  const backup = topCandidates.find((c) => c.id !== selected.id) || topCandidates[1];

  return { selected, backup, candidates: topCandidates };
}

// ─── 6. DIVISÃO DA FALA (splitFala) ─────────────────────────────────────────
/**
 * Divide a fala em 2 ou 3 partes contínuas com base no tamanho e pontuação.
 * MAX = 250 caracteres com espaços por vídeo (ou 200 para Veo 8s).
 * - Se <= 2 * MAX: 2 partes (vídeo 1 e vídeo 2), vídeo 3 sem fala.
 * - Se > 2 * MAX: 3 partes (vídeo 1, 2 e 3).
 * Nenhuma parte repete texto da outra.
 */
export function splitFala(falaText: string, maxPerPart: number = 250): string[] {
  const clean = (falaText || '').trim().replace(/\s+/g, ' ');
  if (!clean) return [];

  const totalLen = clean.length;
  const targetPartsCount = totalLen > 2 * maxPerPart ? 3 : 2;

  // Split into sentence tokens (keeping punctuation)
  const sentenceRegex = /[^.!?]+[.!?]+|[^.!?]+$/g;
  const rawSentences = clean.match(sentenceRegex) || [clean];
  const sentences = rawSentences.map((s) => s.trim()).filter((s) => s.length > 0);

  if (sentences.length === 1 && sentences[0].length <= maxPerPart) {
    return [sentences[0]];
  }

  // Helper to split a long single sentence by commas or spaces
  const splitLongSentence = (str: string, targetCount: number): string[] => {
    const parts: string[] = [];
    const targetChunkLen = Math.ceil(str.length / targetCount);
    let remaining = str.trim();

    while (parts.length < targetCount - 1 && remaining.length > targetChunkLen) {
      // Find comma near targetChunkLen
      let splitIdx = remaining.lastIndexOf(',', targetChunkLen + 30);
      if (splitIdx === -1 || splitIdx < targetChunkLen - 40) {
        // Fallback to space
        splitIdx = remaining.lastIndexOf(' ', targetChunkLen + 20);
      }
      if (splitIdx === -1) {
        splitIdx = targetChunkLen;
      }
      const part = remaining.substring(0, splitIdx + (remaining[splitIdx] === ',' ? 1 : 0)).trim();
      parts.push(part);
      remaining = remaining.substring(splitIdx + (remaining[splitIdx] === ',' ? 1 : 0)).trim();
    }
    if (remaining.length > 0) {
      parts.push(remaining);
    }
    return parts;
  };

  if (sentences.length < targetPartsCount) {
    return splitLongSentence(clean, targetPartsCount);
  }

  // Distribute sentences across targetPartsCount balancing their lengths
  const targetLen = totalLen / targetPartsCount;
  const parts: string[] = [];
  let currentPart = '';

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const isLastTargetPart = parts.length === targetPartsCount - 1;

    if (isLastTargetPart) {
      // Dump all remaining sentences into the final part
      currentPart = currentPart ? `${currentPart} ${s}` : s;
    } else {
      if (!currentPart) {
        currentPart = s;
      } else {
        const withNext = `${currentPart} ${s}`;
        const currentDiff = Math.abs(currentPart.length - targetLen);
        const nextDiff = Math.abs(withNext.length - targetLen);

        if (nextDiff < currentDiff || (currentPart.length < targetLen * 0.75 && withNext.length <= maxPerPart * 1.15)) {
          currentPart = withNext;
        } else {
          parts.push(currentPart.trim());
          currentPart = s;
        }
      }
    }
  }

  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }

  return parts.map((p) => p.trim());
}

// ─── 7. HASHTAGS E DESCRIÇÃO ───────────────────────────────────────────────
export const HASHTAG_TIPO: Record<AniaCategory, string> = {
  CALCA: 'calça',
  BERMUDA_SHORT: 'bermuda',
  SAIA: 'saia',
  SHORT_SAIA: 'shortsaia',
  VESTIDO: 'vestido',
  PIJAMA_CAMISOLA: 'pijama',
  CONJUNTO: 'conjunto',
  BLUSA: 'blusa',
  MACACAO: 'macacão',
  CALCADO: 'tenis',
  AUTO: 'moda',
};

export function generateDescriptionHashtags(params: {
  titulo: string;
  category: AniaCategory;
  peca: string;
  gender: AniaGender;
  body: AniaBody;
  subtype: AniaCalcaSubtype;
  productName: string;
}): { description: string; hashtags: string[] } {
  const { titulo, category, gender, body, subtype, productName } = params;
  const normName = removeAccents(productName || '');

  let baseType = HASHTAG_TIPO[category] || 'look';
  if (category === 'CALCADO' || normName.includes('tenis') || normName.includes('sapato')) {
    if (normName.includes('sapato')) baseType = 'sapato';
    else if (normName.includes('sandalia')) baseType = 'sandalia';
    else if (normName.includes('bota')) baseType = 'bota';
    else if (normName.includes('chinelo')) baseType = 'chinelo';
    else baseType = 'tenis';
  } else if (category === 'BERMUDA_SHORT' && normName.includes('short')) {
    baseType = 'short';
  } else if (category === 'PIJAMA_CAMISOLA' && normName.includes('camisola')) {
    baseType = 'camisola';
  } else if (category === 'BLUSA') {
    if (normName.includes('camisa')) baseType = 'camisa';
    else if (normName.includes('camiseta')) baseType = 'camiseta';
    else if (normName.includes('cropped')) baseType = 'cropped';
  }

  const tags: string[] = [];

  // Tag 1: #{tipo}{feminina/feminino} ou #{tipo}{masculina/masculino}
  const isHomem = gender === 'Homem';
  const genderSuffix = isHomem
    ? ['calça', 'bermuda', 'saia', 'shortsaia', 'camisola', 'camisa', 'blusa', 'bota', 'sandalia', 'rasteirinha'].includes(baseType)
      ? 'masculina'
      : 'masculino'
    : ['pijama', 'vestido', 'conjunto', 'macacão', 'short', 'cropped', 'tenis', 'sapato', 'chinelo', 'look'].includes(baseType)
    ? 'feminino'
    : 'feminina';

  tags.push(`#${baseType}${genderSuffix}`);

  // Tag 2: #modafeminina or #modamasculina
  tags.push(isHomem ? '#modamasculina' : '#modafeminina');

  // Plus size tags
  if (body === 'Plus size') {
    tags.push(isHomem ? '#modamasculinaplussize' : '#modaplussize');
    tags.push('#plussize');
  }

  // Subtype tag if present in product name
  if (category === 'CALCA') {
    if (normName.includes('flare')) tags.push('#calçaflare');
    else if (normName.includes('pantalona')) tags.push('#calçapantalona');
    else if (normName.includes('wide leg')) tags.push('#calçawideleg');
    else if (normName.includes('cargo')) tags.push('#calçacargo');
    else if (normName.includes('legging')) tags.push('#legging');
  } else if (category === 'BERMUDA_SHORT') {
    if (normName.includes('bengaline')) tags.push('#bermudabengaline');
    else if (normName.includes('linho')) tags.push('#shortlinho');
  } else if (category === 'CALCADO' || normName.includes('tenis')) {
    tags.push(isHomem ? '#calcadosmasculinos' : '#calcadosfemininos');
  }

  const cleanTitle = (titulo || `${productName}`).trim().replace(/[!.]+$/, '');
  const fullDescription = `${cleanTitle}! ${tags.join(' ')}`;

  return {
    description: fullDescription,
    hashtags: tags,
  };
}

/**
 * Garante que a fala contenha estritamente o nome do produto fornecido pelo usuário,
 * substituindo termos incompatíveis vindos de templates ou alucinações da IA.
 */
export function ensureProductNameInSpeech(
  falaText: string,
  productName: string,
  colors?: { name: string }[],
  gender?: AniaGender
): string {
  if (!falaText || !productName) return falaText || '';

  let adapted = falaText.trim();
  const pNameLower = productName.trim().toLowerCase();

  // Identifica o gênero gramatical do produto informado pelo usuário
  const isShortSaia = /\bshort\s*saia\b/i.test(productName);
  const isFeminine = !isShortSaia && /\b(calça|camisola|bermuda|saia|blusa|camisa|jaqueta|bota|sandália|sandalia|rasteirinha|sapatilha|regata|t-shirt)\b/i.test(productName);
  const prep = isFeminine ? 'dessa' : 'desse';
  const art = isFeminine ? 'a' : 'o';
  const dem = isFeminine ? 'essa' : 'esse';
  const demCap = isFeminine ? 'Essa' : 'Esse';

  // Lista de substantivos de vestuário comuns em templates que podem ser conflitantes
  const garmentTerms = [
    'camisola',
    'pijama',
    'calça flare',
    'calça pantalona',
    'calça cargo',
    'calça jeans',
    'calça capri',
    'calça',
    'vestido',
    'short saia',
    'short',
    'shorts',
    'bermuda',
    'conjunto',
    'macacão',
    'macacao',
    'saia',
    'cropped',
    'blusa',
    'camisa',
    'tênis',
    'tenis',
    'sandália',
    'sandalia',
    'bota',
    'calçado',
    'calcado',
  ];

  for (const term of garmentTerms) {
    // Se o termo NÃO faz parte do nome do produto informado pelo usuário
    if (!pNameLower.includes(term)) {
      // Substitui "dessa/desse/desta/deste [termo]" -> "desse/dessa [productName]"
      const prepRegex = new RegExp(`\\b(dessa|desse|desta|deste)\\s+${term}\\b`, 'gi');
      adapted = adapted.replace(prepRegex, `${prep} ${pNameLower}`);

      // Substitui "a/o/uma/um [termo]" -> "o/a [productName]"
      const artRegex = new RegExp(`\\b(a|o|uma|um)\\s+${term}\\b`, 'gi');
      adapted = adapted.replace(artRegex, `${art} ${pNameLower}`);

      // Substitui "essa/esse/esta/este [termo]" com maiúscula no início de frase
      const demCapRegex = new RegExp(`\\b(Essa|Esse|Esta|Este)\\s+${term}\\b`, 'g');
      adapted = adapted.replace(demCapRegex, `${demCap} ${pNameLower}`);

      // Substitui "essa/esse/esta/este [termo]" minúsculo
      const demRegex = new RegExp(`\\b(essa|esse|esta|este)\\s+${term}\\b`, 'gi');
      adapted = adapted.replace(demRegex, `${dem} ${pNameLower}`);

      // Substitui palavra isolada
      const wordRegex = new RegExp(`\\b${term}\\b`, 'gi');
      adapted = adapted.replace(wordRegex, pNameLower);
    }
  }

  // Se o produto for gramaticalmente masculino (ex: pijama, short saia, conjunto, vestido, tênis)
  if (!isFeminine) {
    adapted = adapted.replace(/\bEla fica\b/g, 'Ele fica');
    adapted = adapted.replace(/\bela fica\b/g, 'ele fica');
    adapted = adapted.replace(/\bEla veste\b/g, 'Ele veste');
    adapted = adapted.replace(/\bele veste\b/g, 'ele veste');
    adapted = adapted.replace(/\bEla tem\b/g, 'Ele tem');
    adapted = adapted.replace(/\bela tem\b/g, 'ele tem');
    adapted = adapted.replace(/\bolha como ela veste\b/gi, 'olha como ele veste');
    adapted = adapted.replace(/\bsoltinha no corpo\b/gi, 'soltinho no corpo');
    adapted = adapted.replace(/\bquentinha\b/gi, 'quentinho');
    adapted = adapted.replace(/\barrumadinha\b/gi, 'arrumadinho');
    adapted = adapted.replace(/\bestá linda\b/gi, 'está lindo');
    adapted = adapted.replace(/\btá linda\b/gi, 'tá lindo');
    adapted = adapted.replace(/\bgarante a sua\b/gi, 'garante o seu');
    adapted = adapted.replace(/\bpega a sua\b/gi, 'pega o seu');
    adapted = adapted.replace(/\bleva a sua\b/gi, 'leva o seu');
    adapted = adapted.replace(/\bgaranta a sua\b/gi, 'garanta o seu');
    adapted = adapted.replace(/\ba sua preferida\b/gi, 'o seu preferido');
    adapted = adapted.replace(/\bas mais bonitas\b/gi, 'os mais bonitos');
    adapted = adapted.replace(/\buma calça dessas\b/gi, `um ${pNameLower} desses`);
  } else {
    adapted = adapted.replace(/\bEle fica\b/g, 'Ela fica');
    adapted = adapted.replace(/\bele fica\b/g, 'ela fica');
    adapted = adapted.replace(/\bEle veste\b/g, 'Ela veste');
    adapted = adapted.replace(/\bele veste\b/g, 'ela veste');
    adapted = adapted.replace(/\bEle tem\b/g, 'Ela tem');
    adapted = adapted.replace(/\bele tem\b/g, 'ela tem');
    adapted = adapted.replace(/\bolha como ele veste\b/gi, 'olha como ela veste');
    adapted = adapted.replace(/\bsoltinho no corpo\b/gi, 'soltinha no corpo');
    adapted = adapted.replace(/\bquentinho\b/gi, 'quentinha');
    adapted = adapted.replace(/\barrumadinho\b/gi, 'arrumadinha');
    adapted = adapted.replace(/\bestá lindo\b/gi, 'está linda');
    adapted = adapted.replace(/\btá lindo\b/gi, 'tá linda');
    adapted = adapted.replace(/\bgarante o seu\b/gi, 'garante a sua');
    adapted = adapted.replace(/\bpega o seu\b/gi, 'pega a sua');
    adapted = adapted.replace(/\bleva o seu\b/gi, 'leva a sua');
    adapted = adapted.replace(/\bgaranta o seu\b/gi, 'garanta a sua');
  }

  // Se o modelo for HOMEM, adaptação 100% mandatória ao gênero masculino
  if (gender === 'Homem') {
    adapted = adapted.replace(/\bOi amiga\b/g, 'Oi amigo');
    adapted = adapted.replace(/\boi amiga\b/g, 'oi amigo');
    adapted = adapted.replace(/\bFala amiga\b/g, 'Fala amigo');
    adapted = adapted.replace(/\bfala amiga\b/g, 'fala amigo');
    adapted = adapted.replace(/\bSério, amiga\b/g, 'Sério, amigo');
    adapted = adapted.replace(/\bsério, amiga\b/g, 'sério, amigo');
    adapted = adapted.replace(/\bAmiga\b/g, 'Amigo');
    adapted = adapted.replace(/\bamiga\b/g, 'amigo');
    adapted = adapted.replace(/\bapaixonada\b/g, 'apaixonado');
    adapted = adapted.replace(/\bapaixonadas\b/g, 'apaixonados');
    adapted = adapted.replace(/\bgordinha\b/g, 'gordinho');
    adapted = adapted.replace(/\bgordinhas\b/g, 'gordinhos');
    adapted = adapted.replace(/\bpronta, linda e confortável\b/gi, 'pronto, no estilo e confortável');
    adapted = adapted.replace(/\blinda e confortável\b/gi, 'confortável e no estilo');
    adapted = adapted.replace(/\blindo e confortável\b/gi, 'confortável e no estilo');
    adapted = adapted.replace(/\blinda\b/gi, 'no estilo');
    adapted = adapted.replace(/\blindo\b/gi, 'no estilo');
    adapted = adapted.replace(/\bse sente pronta\b/gi, 'se sente pronto');
    adapted = adapted.replace(/\bpronta\b/g, 'pronto');
    adapted = adapted.replace(/\bprontas\b/g, 'prontos');
    adapted = adapted.replace(/\btanta mulher ama\b/gi, 'tanto homem curte');
    adapted = adapted.replace(/\btanta mulher\b/gi, 'tanto homem');
    adapted = adapted.replace(/\btantas mulheres estão levando\b/gi, 'tantos homens estão levando');
    adapted = adapted.replace(/\btantas mulheres estão comprando\b/gi, 'tantos homens estão comprando');
    adapted = adapted.replace(/\btantas mulheres\b/gi, 'tantos homens');
    adapted = adapted.replace(/\bquando quer ficar bonita\b/gi, 'quando quer ficar no estilo');
    adapted = adapted.replace(/\bse sente bonita\b/gi, 'se sente no estilo');
    adapted = adapted.replace(/\bbonita sem complicação\b/gi, 'no estilo sem complicação');
    adapted = adapted.replace(/\bbonita\b/g, 'no estilo');
    adapted = adapted.replace(/\bbonitas\b/g, 'no estilo');
    adapted = adapted.replace(/\bveste linda no corpo\b/gi, 'veste muito bem no corpo');
    adapted = adapted.replace(/\bfica linda no corpo\b/gi, 'fica muito alinhado no corpo');
    adapted = adapted.replace(/\bfica linda\b/gi, 'fica no estilo');
    adapted = adapted.replace(/\bveste linda\b/gi, 'veste alinhado');
    adapted = adapted.replace(/\bEscolhe a sua preferida\b/g, 'Escolhe o seu preferido');
    adapted = adapted.replace(/\bescolhe a sua preferida\b/g, 'escolhe o seu preferido');
    adapted = adapted.replace(/\ba sua preferida\b/g, 'o seu preferido');
    adapted = adapted.replace(/\bpreferida\b/g, 'preferido');
    adapted = adapted.replace(/\bpreferidas\b/g, 'preferidos');
    adapted = adapted.replace(/\bgarante a sua\b/gi, 'garante o seu');
    adapted = adapted.replace(/\bgaranta a sua\b/gi, 'garanta o seu');
    adapted = adapted.replace(/\bpega a sua\b/gi, 'pega o seu');
    adapted = adapted.replace(/\bleva a sua\b/gi, 'leva o seu');
    adapted = adapted.replace(/\ba sua\b/gi, 'o seu');
    adapted = adapted.replace(/\bas suas\b/gi, 'os seus');
    adapted = adapted.replace(/\buma de cada\b/gi, 'um de cada');
    adapted = adapted.replace(/\bpeguei uma\b/gi, 'peguei um');
    adapted = adapted.replace(/\bcomprar mais de uma\b/gi, 'comprar mais de um');
    adapted = adapted.replace(/\bter só uma\b/gi, 'ter só um');
  }

  // Ajusta cores se houver 3 cores reais informadas
  if (colors && colors.length >= 3 && colors[0].name && colors[1].name && colors[2].name) {
    const c1 = colors[0].name.trim().toLowerCase();
    const c2 = colors[1].name.trim().toLowerCase();
    const c3 = colors[2].name.trim().toLowerCase();

    // Substitui padrões como "rosa, azul e preto", "marrom, vinho e bege", "bege, vinho, azul marinho e preto"
    adapted = adapted.replace(
      /\b(?:rosa|azul|preto|branco|bege|marrom|vinho|verde|cinza)(?:,\s*|\s+e\s+)(?:rosa|azul|preto|branco|bege|marrom|vinho|verde|cinza)(?:,\s*|\s+e\s+)(?:rosa|azul|preto|branco|bege|marrom|vinho|verde|cinza)\b/gi,
      `${c1}, ${c2} e ${c3}`
    );
  }

  return adapted;
}

