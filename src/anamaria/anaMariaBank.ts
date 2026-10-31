import { AnaMariaInfluencer, AnaMariaBodyType } from './types';

export interface AnaMariaBankEntry {
  id: string;
  product: string;
  headline: string;
  hashtags: string;
  keywords: string[];
  flowerSymbol: string;
  category: 'fitness' | 'cinta' | 'vestido' | 'macaquinho' | 'calca' | 'pijama' | 'blusa' | 'geral';
}

export const ANA_MARIA_BANK: AnaMariaBankEntry[] = [
  {
    id: 'macacao_fitness',
    product: 'Macacão Fitness Feminino',
    headline: 'Esse macacão flare perfeito tá dando o que falar ❀',
    hashtags: '#fyp #foryou #gym',
    keywords: ['macacao fitness', 'macacão fitness', 'flare', 'fitness', 'treino', 'academia', 'legging', 'gym'],
    flowerSymbol: '❀',
    category: 'fitness',
  },
  {
    id: 'cinta_modeladora',
    product: 'Cinta Modeladora Abdominal',
    headline: 'o real culpado de deixar minha cintura PP ❀',
    hashtags: '#cintamodeladora #cinta #modeladora #mulher',
    keywords: ['cinta', 'modeladora', 'abdominal', 'cintura', 'corset', 'corpete', 'afinadora'],
    flowerSymbol: '❀',
    category: 'cinta',
  },
  {
    id: 'vestido_longo_renda',
    product: 'Vestido Longo Preto com Detalhes em Renda para Ocasiões Especiais',
    headline: 'o vestido que toda garota deveria ter ❀',
    hashtags: '#conjunto #fy #foryou',
    keywords: ['vestido longo', 'renda', 'preto', 'vestido festa', 'ocasioes especiais', 'vestido preto'],
    flowerSymbol: '❀',
    category: 'vestido',
  },
  {
    id: 'vestido_decote_barato',
    product: 'Vestido Feminino Longo Com Decote',
    headline: 'Logo hj que não tenho R$13 ❀',
    hashtags: '#vestido #modafeminina #fyp #foryou',
    keywords: ['vestido decote', 'decote', 'vestido longo com decote', 'vestido feminino longo'],
    flowerSymbol: '❀',
    category: 'vestido',
  },
  {
    id: 'macaquinho_fitness',
    product: 'Macaquinho Feminino Fitness',
    headline: 'Esse macaquinho está tão barato ❀',
    hashtags: '#fyp #foryou #gym',
    keywords: ['macaquinho fitness', 'macaquinho treino', 'macaquinho academia'],
    flowerSymbol: '❀',
    category: 'fitness',
  },
  {
    id: 'calca_linho',
    product: 'Calça Linho Feminino',
    headline: 'agora sim entendi o motivo dessa calça sempre tá esgotada ❀',
    hashtags: '#calçadelinho #linho #calçafeminina',
    keywords: ['calca linho', 'calça linho', 'calça de linho', 'linho', 'calça feminina', 'calca feminina', 'pantalona'],
    flowerSymbol: '❀',
    category: 'calca',
  },
  {
    id: 'macaquinho_alfaiataria',
    product: 'Macaquinho Feminino Alfaiataria',
    headline: 'O macacão que ganhou meu coração todinho ❀',
    hashtags: '#itgirl #outfit #fyp #foryou',
    keywords: ['macaquinho alfaiataria', 'macacao alfaiataria', 'alfaiataria', 'elegante', 'macacão social'],
    flowerSymbol: '❀',
    category: 'macaquinho',
  },
  {
    id: 'macaquinho_anarruga',
    product: 'Macaquinho Anarruga',
    headline: 'Esse Macaquinho Lindo Está muito Barato ❀',
    hashtags: '#lookfitness #moda #macaquinhofitness',
    keywords: ['anarruga', 'macaquinho anarruga', 'macacao anarruga', 'tecido anarruga'],
    flowerSymbol: '❀',
    category: 'macaquinho',
  },
  {
    id: 'vestido_curto_elegante',
    product: 'Vestido Curto Feminino Frente Única Elegante',
    headline: 'Esse vestido lindo está tão barato ❀',
    hashtags: '#itgirl #fyp #foryou',
    keywords: ['vestido curto', 'frente unica', 'frente única', 'vestido tubinho', 'vestido festa curto'],
    flowerSymbol: '❀',
    category: 'vestido',
  },
  {
    id: 'babydoll_feminino',
    product: 'Baby Doll Feminino',
    headline: 'Coloca esse baby doll pra deixar ele Loco ❀',
    hashtags: '#foryou #babydoll #modafeminina',
    keywords: ['baby doll', 'babydoll', 'camisola', 'pijama sensual', 'lingerie', 'renda sensual'],
    flowerSymbol: '❀',
    category: 'pijama',
  },
  {
    id: 'blusinha_cropped',
    product: 'Blusinha Cropped Babado Amarracao',
    headline: 'Essa blusinha perfeita tá tão baratinha ❀',
    hashtags: '#blusa #fyp #foryou',
    keywords: ['blusinha', 'cropped', 'babado', 'amarracao', 'amarração', 'blusa feminina', 'top'],
    flowerSymbol: '❀',
    category: 'blusa',
  },
  {
    id: 'vestido_perfeicao',
    product: 'vestido longo Femenino',
    headline: 'O vestido que entrega perfeição ✨ ❤️',
    hashtags: '#modafeminina #vestidoelegante #lookfeminino #vestidolongo',
    keywords: ['vestido entrega perfeição', 'vestido longo feminino', 'vestido elegante', 'longo feminino'],
    flowerSymbol: '✨',
    category: 'vestido',
  },
  {
    id: 'vestido_reveillon',
    product: 'Vestido Acetinado com Detalhe de Flor Vibrante para Ocasiões Especiais',
    headline: 'vestido perfeito para fim de ano ✨ 🤍',
    hashtags: '#LookDeFimDeAno #LookDeReveillon #LookReveillon #LookDeAnoNovo #Reveillon2026',
    keywords: ['acetinado', 'flor vibrante', 'fim de ano', 'reveillon', 'ano novo', 'branco', 'festa'],
    flowerSymbol: '✨',
    category: 'vestido',
  },
  {
    id: 'babydoll_petite_plus',
    product: 'Baby Doll Com Decote Nas Costas Conforto Pijama Modelo Petite e Plus Size',
    headline: 'amo dormir linda assim 🌸',
    hashtags: '#pijamafeminino #fy #vaiprofycaramba',
    keywords: ['decote nas costas', 'pijama', 'dormir', 'conforto', 'petite', 'plus size pijama', 'camisola dormir'],
    flowerSymbol: '🌸',
    category: 'pijama',
  },
];

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Seleciona e adapta a headline e as hashtags de acordo com o produto, gênero e tipo de corpo.
 * REGRA CRÍTICA: As hashtags NUNCA devem incluir o nome do produto no texto a ser copiado.
 * A headline sempre deve terminar com a florzinha (❀, 🌸 ou ✨).
 */
export function resolveHeadlineAndHashtags(params: {
  productName: string;
  influencer?: AnaMariaInfluencer;
  bodyType?: AnaMariaBodyType;
  additionalInstructions?: string;
}): { headline: string; hashtags: string; matchedEntry?: AnaMariaBankEntry } {
  const normName = normalizeText(params.productName);
  const normExtra = normalizeText(params.additionalInstructions || '');
  const combined = `${normName} ${normExtra}`.trim();

  let bestEntry: AnaMariaBankEntry = ANA_MARIA_BANK[0];
  let maxScore = -1;

  for (const entry of ANA_MARIA_BANK) {
    let score = 0;
    const normEntryProd = normalizeText(entry.product);

    if (normName && normEntryProd.includes(normName)) score += 10;
    if (normName && normName.includes(normEntryProd)) score += 10;

    for (const kw of entry.keywords) {
      const normKw = normalizeText(kw);
      if (combined.includes(normKw)) {
        score += normKw.split(' ').length * 3;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestEntry = entry;
    }
  }

  // Se não houver correspondência específica ou se o produto for vago, usa fallback baseado em categorias gerais
  if (maxScore <= 0) {
    if (combined.includes('vestid') || combined.includes('saia')) {
      bestEntry = ANA_MARIA_BANK.find((e) => e.id === 'vestido_longo_renda') || bestEntry;
    } else if (combined.includes('cinta') || combined.includes('abdominal')) {
      bestEntry = ANA_MARIA_BANK.find((e) => e.id === 'cinta_modeladora') || bestEntry;
    } else if (combined.includes('calc') || combined.includes('linho') || combined.includes('jeans')) {
      bestEntry = ANA_MARIA_BANK.find((e) => e.id === 'calca_linho') || bestEntry;
    } else if (combined.includes('pijama') || combined.includes('dormir') || combined.includes('baby doll')) {
      bestEntry = ANA_MARIA_BANK.find((e) => e.id === 'babydoll_petite_plus') || bestEntry;
    } else if (combined.includes('blus') || combined.includes('cropped') || combined.includes('camis')) {
      bestEntry = ANA_MARIA_BANK.find((e) => e.id === 'blusinha_cropped') || bestEntry;
    } else if (combined.includes('fitness') || combined.includes('academia') || combined.includes('treino')) {
      bestEntry = ANA_MARIA_BANK.find((e) => e.id === 'macacao_fitness') || bestEntry;
    }
  }

  // Adaptação mínima da headline mantendo a estrutura original
  let adaptedHeadline = bestEntry.headline;

  // Substituição sutil se o produto do usuário for específico mas diferente do modelo do banco
  if (normName) {
    if (normName.includes('saia') && adaptedHeadline.toLowerCase().includes('vestido')) {
      adaptedHeadline = adaptedHeadline.replace(/o vestido/i, 'a saia').replace(/esse vestido/i, 'essa saia');
    } else if (normName.includes('conjunto') && adaptedHeadline.toLowerCase().includes('vestido')) {
      adaptedHeadline = adaptedHeadline.replace(/o vestido/i, 'o conjunto').replace(/esse vestido/i, 'esse conjunto');
    } else if (normName.includes('short') && adaptedHeadline.toLowerCase().includes('calca')) {
      adaptedHeadline = adaptedHeadline.replace(/dessa calca/i, 'desse short').replace(/dessa calça/i, 'desse short');
    }
  }

  // Garantir a presença do símbolo floral no final da headline
  const flower = bestEntry.flowerSymbol || '❀';
  if (!adaptedHeadline.includes('❀') && !adaptedHeadline.includes('✨') && !adaptedHeadline.includes('🌸')) {
    adaptedHeadline = `${adaptedHeadline.trim()} ${flower}`;
  }

  // Tratamento de hashtags
  // REGRA DO USUÁRIO: Apenas hashtags, sem o nome do produto no texto de cópia!
  let rawHashtags = bestEntry.hashtags.trim();

  // Ajustes de influenciador masculino vs feminino
  if (params.influencer === 'Homem') {
    rawHashtags = rawHashtags
      .replace(/#modafeminina/gi, '#modamasculina')
      .replace(/#vestidolongomulher/gi, '#modamasculina')
      .replace(/#mulher/gi, '#homem')
      .replace(/#lookfeminino/gi, '#lookmasculino')
      .replace(/#calçafeminina/gi, '#calçamasculina')
      .replace(/#pijamafeminino/gi, '#pijamamasculino');
    if (!rawHashtags.includes('#modamasculina')) {
      rawHashtags = `${rawHashtags} #modamasculina`;
    }
  } else {
    // Feminino padrão
    if (!rawHashtags.includes('#modafeminina') && !rawHashtags.includes('#gym') && !rawHashtags.includes('#itgirl')) {
      rawHashtags = `${rawHashtags} #modafeminina`;
    }
  }

  // Ajuste de Plus Size
  if (params.bodyType === 'plus_size') {
    if (!rawHashtags.includes('#plussize')) {
      rawHashtags = `${rawHashtags} #plussize #modaplussize`;
    }
  }

  // Higieniza para garantir que são apenas hashtags (#tag) separadas por espaço
  const tagsOnly = rawHashtags
    .split(/\s+/)
    .filter((t) => t.startsWith('#'))
    .join(' ');

  return {
    headline: adaptedHeadline.trim(),
    hashtags: tagsOnly.trim(),
    matchedEntry: bestEntry,
  };
}
