import {
  AnaMariaFormState,
  AnaMariaInfluencer,
  AnaMariaBodyType,
  AnaMariaShoeCategory,
  AnaMariaVideoPromptLimit,
  AnaMariaPresentationMode,
  AnaMariaMasterId,
} from './types';
import {
  getMasterPromptById,
  UNIVERSAL_PLUS_SIZE_MODULE,
  UNIVERSAL_PLUS_SIZE_ENGLISH_DIRECTIVE,
  UNIVERSAL_MALE_PLUS_SIZE_MODULE,
} from './masterPromptsData';

/**
 * REGRA UNIVERSAL DE CALÇADOS (CAMADA ACIMA DOS PROMPTS DOS MESTRES)
 * Determina o calçado com base no nome da peça, instruções adicionais e sexo do modelo.
 */
export function detectShoeCategory(
  productName: string,
  additionalInstructions: string = '',
  influencer: AnaMariaInfluencer = 'Mulher'
): { category: AnaMariaShoeCategory; description: string; name: string } {
  const combined = `${productName} ${additionalInstructions}`.toLowerCase();
  const isMale = influencer === 'Homem';

  // B) Roupas Fitness / Academia / Esportivas
  const isFitness =
    /\b(fitness|academia|treino|gym|legging|macacao fitness|macacão fitness|macaquinho fitness|esportiv|suplex|poliamida fitness|anarruga fitness|top fitness|conjunto fitness|short fitness|bermuda academia|camiseta treino|dry fit|dryfit)\b/i.test(
      combined
    );

  // Calças (para mulher: calça = tênis branco; para homem: calça social = sapato social, demais calças = tênis casual)
  const isPants = /\b(calca|calça|jeans|jogger|cargo|pantacourt|pantalona|sarja)\b/i.test(combined);
  const isSocial =
    /\b(social|camisa social|calça social|calca social|terno|blazer|alfaiataria|gravata|esporte fino)\b/i.test(
      combined
    );

  if (isMale) {
    if (isFitness) {
      return {
        category: 'B_TENIS',
        name: 'Tênis Esportivo Masculino',
        description:
          'Tênis masculino esportivo moderno de cano baixo, design limpo e anatômico, cores sóbrias (branco ou preto/cinza neutro) compatíveis com roupa de academia/treino, solado esportivo estruturado e meia esportiva discreta.',
      };
    }

    if (isSocial) {
      return {
        category: 'C_OUTRO',
        name: 'Sapato Social Masculino',
        description:
          'Sapato social masculino de couro legítimo com acabamento fosco/acetinado elegante (preto ou marrom café conforme a peça), bico levemente arredondado e solado clássico alinhado à roupa social.',
      };
    }

    if (isPants) {
      return {
        category: 'B_TENIS',
        name: 'Tênis Casual Masculino',
        description:
          'Tênis casual masculino de cano baixo, design minimalista e versátil que combina perfeitamente com a calça, acabamento impecável e solado reto.',
      };
    }

    // Demais roupas masculinas em casa (bermuda, camiseta, short, pijama, etc.) -> Chinelo masculino
    return {
      category: 'A_CHINELO',
      name: 'Chinelo Masculino Tradicional',
      description:
        'Chinelo masculino tradicional de dedo ou slide discreto em tom neutro (preto, marinho ou branco), solado plano de borracha e visual cotidiano autêntico de quem está em casa.',
    };
  }

  // REGRAS PARA MULHER (CAMADA UNIVERSAL ACIMA DOS MESTRES):
  // 1. Quando a mulher estiver de calça, macacão fitness ou qualquer roupa de academia -> Tênis Branco Esportivo
  if (isFitness || (isPants && !/\b(pijama|dormir|casa)\b/i.test(combined))) {
    return {
      category: 'B_TENIS',
      name: 'Tênis Branco Esportivo Casual Feminino',
      description:
        'Tênis feminino esportivo casual de cano baixo, inteiramente branco e com design robusto. Cabedal com painéis sobrepostos, costuras delicadas, biqueira arredondada com pequenas perfurações, cadarços brancos tradicionais, meia branca cano médio, língua acolchoada e colarinho estofado. Solado branco espesso, levemente elevado, com laterais em camadas e acabamento texturizado. Sem detalhes coloridos.',
    };
  }

  // 2. Qualquer roupa de ficar em casa, cinta modeladora, corselet, vestido (inclusive vestido de festa), macaquinho/macacão casual, pijama, camisola, lingerie, blusa, saia -> Chinelo Branco com detalhezinhos metálicos
  return {
    category: 'A_CHINELO',
    name: 'Chinelo Branco Feminino Delicado com Detalhes Metálicos',
    description:
      'Chinelo feminino tradicional de dedo, branco, com duas tiras finas em Y, acabamento levemente brilhante e pequenos detalhes metálicos dourados próximos à junção das tiras. Palmilha branca anatômica e levemente contornada. Solado baixo, plano, levemente espesso e com bordas arredondadas.',
  };
}

export interface ComplementaryGarmentInfo {
  type: 'upper_only' | 'lower_only' | 'full_body' | 'lingerie';
  directiveTextPt: string;
  directiveTextEn: string;
}

/**
 * REGRA UNIVERSAL DE PEÇAS COMPLEMENTARES E LOOK COMPLETO
 * Garante que a modelo NUNCA fique nua ou desvestida na parte inferior ou superior.
 * Se anexar blusa/top -> adiciona calça jeans/inferior que combina.
 * Se anexar calça/short -> adiciona blusa/superior que combina.
 */
export function detectComplementaryGarment(
  productName: string,
  additionalInstructions: string = '',
  influencer: AnaMariaInfluencer = 'Mulher'
): ComplementaryGarmentInfo {
  const combined = `${productName} ${additionalInstructions}`.toLowerCase();
  const isMale = influencer === 'Homem';

  const isFullBody = /\b(vestido|longo|midi|macacao|macacão|macaquinho|jumpsuit|conjunto|pijama completo|robe e pijama|terno completo)\b/i.test(combined);
  const isLingerie = /\b(lingerie|suti[aã]|calcinha|babydoll|baby doll|camisola|corselet|cinta modeladora|body de renda)\b/i.test(combined);
  const isUpper = /\b(blusa|camisa|camiseta|cropped|top|regata|t-shirt|tshirt|casaco|jaqueta|blazer|moletom|sueter|suéter|cardiga|cardigã|cropped rendad[oa]|blusa rendad[oa]|bata)\b/i.test(combined);
  const isLower = /\b(calca|calça|jeans|short|shorts|bermuda|saia|minissaia|pantacourt|pantalona|legging|pant|pants)\b/i.test(combined);

  if (isFullBody) {
    return {
      type: 'full_body',
      directiveTextPt: 'O produto anunciado é uma peça de corpo inteiro (vestido/macacão/conjunto). A modelo veste o look completo conforme as fotos de referência.',
      directiveTextEn: 'The advertised product is a full-body garment (dress/jumpsuit/set). The model wears the full garment according to the reference photos.',
    };
  }

  if (isUpper && !isLower) {
    if (isMale) {
      return {
        type: 'upper_only',
        directiveTextPt: `REGRA DE LOOK COMPLETO (PROIBIDO NUDEZ / PARTE INFERIOR OBRIGATÓRIA):\nComo o produto anunciado é uma peça superior (${productName}), o modelo DEVE OBRIGATORIAMENTE VESTIR UMA PEÇA INFERIOR COMPLEMENTAR: calça jeans masculina clássica de corte reto ou calça casual escura alinhada. TERMINANTEMENTE PROIBIDO gerar o modelo nu, sem calça, de cueca ou desvestido na parte de baixo.`,
        directiveTextEn: `[MANDATORY COMPLEMENTARY BOTTOM GARMENT - STRICTLY NO NUDITY]: The advertised product is an upper garment (${productName}). The model MUST WEAR a matching classic straight-cut dark blue denim jeans. STRICTLY FORBIDDEN: Generating the model naked, pantless, or in underwear. Full complete outfit required.`,
      };
    }
    return {
      type: 'upper_only',
      directiveTextPt: `REGRA DE LOOK COMPLETO (PROIBIÇÃO ABSOLUTA DE NUDEZ / PARTE INFERIOR OBRIGATÓRIA):\nComo o produto anunciado na foto de referência é EXCLUSIVAMENTE uma peça superior (${productName}), a modelo DEVE OBRIGATORIAMENTE VESTIR UMA PEÇA INFERIOR COMPLEMENTAR QUE COMBINE PERFEITAMENTE:\n- Uma calça jeans feminina clássica de cintura alta em tom azul tradicional (ou jeans claro clássico), corte reto ou flare elegante, com caimento impecável que valoriza a silhueta da modelo.\n- TERMINANTEMENTE PROIBIDO GERAR A MODELO NUA, SEM CALÇA, DE CALCINHA OU DESVESTIDA NA PARTE DE BAIXO.\n- A blusa/peça anunciada é o foco principal (fidelidade 1:1), e a calça jeans completa o look comercial realista com calçado adequado nos pés.`,
      directiveTextEn: `[MANDATORY COMPLEMENTARY BOTTOM GARMENT - ZERO NUDITY DIRECTIVE]: The advertised product in the reference photo is strictly an upper-body piece (${productName}). The model MUST OBLIGATORILY WEAR A COMPLEMENTARY BOTTOM GARMENT: a stylish classic high-waisted blue denim jeans with a flattering feminine fit. ABSOLUTELY AND STRICTLY FORBIDDEN: Generating the model pantless, naked, in panties, or undressed below the waist. The model must be fully clothed in a complete commercial mirror-selfie outfit.`,
    };
  }

  if (isLower && !isUpper) {
    if (isMale) {
      return {
        type: 'lower_only',
        directiveTextPt: `REGRA DE LOOK COMPLETO (PROIBIDO NUDEZ / PARTE SUPERIOR OBRIGATÓRIA):\nComo o produto anunciado é uma peça inferior (${productName}), o modelo DEVE OBRIGATORIAMENTE VESTIR UMA PEÇA SUPERIOR COMPLEMENTAR: camiseta básica masculina de manga curta em tom neutro (branca ou preta) com caimento limpo. TERMINANTEMENTE PROIBIDO gerar o modelo sem camisa, topless ou nu.`,
        directiveTextEn: `[MANDATORY COMPLEMENTARY TOP GARMENT - STRICTLY NO NUDITY]: The advertised product is a bottom garment (${productName}). The model MUST WEAR a matching clean neutral crew-neck t-shirt (white or black). STRICTLY FORBIDDEN: Topless or shirtless model.`,
      };
    }
    return {
      type: 'lower_only',
      directiveTextPt: `REGRA DE LOOK COMPLETO (PROIBIÇÃO ABSOLUTA DE NUDEZ / PARTE SUPERIOR OBRIGATÓRIA):\nComo o produto anunciado na foto de referência é EXCLUSIVAMENTE uma peça inferior (${productName}), a modelo DEVE OBRIGATORIAMENTE VESTIR UMA PEÇA SUPERIOR COMPLEMENTAR QUE COMBINE PERFEITAMENTE:\n- Uma blusa feminina delicada de manga curta ou cropped elegante em tom neutro suave (off-white ou branco) de caimento limpo que harmonize com a peça inferior.\n- TERMINANTEMENTE PROIBIDO GERAR A MODELO TOPLESS, SEM BLUSA, DE SUTIÃ OU NUA NA PARTE SUPERIOR.\n- A peça inferior anunciada é o foco principal (fidelidade 1:1), e a blusa completa o look comercial realista.`,
      directiveTextEn: `[MANDATORY COMPLEMENTARY TOP GARMENT - ZERO NUDITY DIRECTIVE]: The advertised product in the reference photo is strictly a bottom piece (${productName}). The model MUST OBLIGATORILY WEAR A COMPLEMENTARY TOP GARMENT: a clean, elegant neutral white or off-white feminine short-sleeve top/blouse that harmonizes with the bottom piece. ABSOLUTELY AND STRICTLY FORBIDDEN: Generating the model topless, shirtless, or in bra only. Full complete outfit required.`,
    };
  }

  if (isLingerie) {
    return {
      type: 'lingerie',
      directiveTextPt: `REGRA DE MODA ÍNTIMA COMPLETA (CONJUNTO ELEGANTE):\nA modelo deve vestir o conjunto coordenado e harmonioso de moda íntima comercial elegante de sleepwear/homewear, com acabamento refinado de renda/cetim, preservando a dignidade estética comercial sem poses explícitas.`,
      directiveTextEn: `[COORDINATED SLEEPWEAR/LOUNGEWEAR ENSEMBLE]: The model wears a tasteful, coordinated commercial homewear/sleepwear ensemble with delicate lace/satin details, maintaining elegant commercial aesthetic.`,
    };
  }

  return {
    type: 'upper_only',
    directiveTextPt: `REGRA DE LOOK COMPLETO (PROIBIÇÃO DE NUDEZ):\nSe a foto de produto anexada for de uma peça superior, a modelo deve vestir calça jeans feminina clássica de cintura alta. Se for peça inferior, veste blusa neutra elegante. É expressamente proibido gerar a modelo nua ou desvestida.`,
    directiveTextEn: `[FULL OUTFIT MANDATE]: The model must be fully dressed with matching complementary garment (jeans or neutral top), strictly no nudity.`,
  };
}

export type AnaMariaRoomType = 'hall_espelho' | 'quarto' | 'sala' | 'closet';

export const SCENARIO_DESCRIPTIONS: Record<AnaMariaRoomType, string> = {
  hall_espelho:
    'Ambiente residencial autêntico diante do espelho de corpo inteiro (UTILIZAR EXATAMENTE A FOTO DE REFERÊNCIA DO CENÁRIO ANEXADA): A foto de referência do cenário é o ambiente real obrigatório e inviolável. Preserve integralmente o piso, as portas, as paredes, a perspectiva e a iluminação do cômodo da foto de referência. Posicione o(a) modelo em pé EXATAMENTE neste cenário da foto anexada. É expressamente proibido criar outro cômodo ou alterar a arquitetura, o piso e os móveis da foto de referência.',
  quarto:
    'Quarto da mesma residência em frente ao espelho de corpo inteiro: ambiente limpo e aconchegante, piso de porcelanato bege claro, cabeceira de cama estofada neutra e porta de madeira escura visíveis discretamente ao fundo. Iluminação frontal natural suave que ilumina a frente da modelo com perfeição, enquanto o fundo do quarto permanece com iluminação indireta mais baixa e suave para que o foco fique total na modelo e na roupa.',
  sala:
    'Canto da sala de estar da mesma residência em frente ao espelho de corpo inteiro: piso de porcelanato bege rajado brilhante, parede neutra clara e porta/painel de madeira escura ao fundo. Iluminação frontal natural bem distribuída realçando a textura e o caimento da peça, com o fundo mais carente de iluminação.',
  closet:
    'Área de closet/quarto de vestir da mesma residência em frente ao espelho de corpo inteiro: armários com portas de madeira escura ao fundo, piso de porcelanato bege claro. Iluminação frontal direta e suave destacando o tecido e as curvas da modelo, com o fundo discreto e em penumbra suave.',
};

/**
 * Constrói o Prompt Mestre de Imagem para o Modo Ana Maria
 * Respeita a hierarquia:
 * 1º Instruções Adicionais do Usuário (Prioridade Soberana)
 * 2º Camada Universal (Modo Mirror Selfie vs POV vs Com Rosto, Módulo Plus Size, Adaptação Masculina, Regra Universal de Calçados, Cenário Independente)
 * 3º Identidade Física e Acessórios da Mestra selecionada na Galeria de Prompts
 */
/**
 * Extrai e compõe os atributos físicos da modelo respeitando estritamente a hierarquia:
 * PRIORIDADE 1: Instruções Adicionais do Usuário (Soberana)
 * PRIORIDADE 2: Configuração Plus Size (Altera exclusivamente o biotipo corporal)
 * PRIORIDADE 3: Características Físicas Originais da Mestra
 */
export function resolveModelAttributesHierarchy(params: {
  master: ReturnType<typeof getMasterPromptById>;
  isPlusSize: boolean;
  isMale: boolean;
  additionalInstructions?: string;
  presentationMode: AnaMariaPresentationMode;
}) {
  const { master, isPlusSize, isMale, additionalInstructions = '' } = params;
  const userText = additionalInstructions.trim();
  const lowerUser = userText.toLowerCase();

  // 1. Detecção de atributos especificados pelo usuário (Prioridade 1)
  // A) Etnia e Cor da Pele
  const isBlackUser = /\b(negra|negro|preta|preto|afro|afrodescendente|pele preta|pele negra|pele escura|retinta|modelo negra|modelo preta|mulher negra|mulher preta|mulher de pele preta|black woman|dark skin|dark-skinned black woman)\b/i.test(lowerUser);
  const isAsianUser = /\b(japonesa|japones|asiatica|asiática|oriental|coreana|chinesa|asian)\b/i.test(lowerUser);
  const isRedheadUser = /\b(ruiva|ruivo|cabelo ruivo|cabelos ruivos|redhead|ginger)\b/i.test(lowerUser);
  const isWhiteUser = /\b(branca|pele clara|caucasiana|pale skin|fair skin|branca de pele clara)\b/i.test(lowerUser);
  const isTannedUser = /\b(morena|morena escura|morena clara|bronzeada|pele morena|parda|indigena|indígena)\b/i.test(lowerUser);

  let userEthnicitySummary = '';
  let userEthnicityDirectiveEnglish = '';
  let userEthnicityDirectivePt = '';

  if (isBlackUser) {
    userEthnicitySummary = 'mulher negra com tom de pele bronze-chocolate quente, dourado e radiante';
    userEthnicityDirectivePt = `REGRA DE INTERPRETAÇÃO ÉTNICA E TONALIDADE DE PELE — MULHER NEGRA / PELE PRETA (NOVA REFERÊNCIA OFICIAL):
- TONALIDADE OFICIAL DE REFERÊNCIA (FOTO ATUALIZADA): A modelo DEVE ser uma MULHER NEGRA autêntica com tom de pele bronze-chocolate quente, dourado e luminoso (mais claro e aberto, exatamente conforme a foto de referência de mulher negra com pele bronze-aveludada e reflexos quentes/âmbar luminosos nos ombros, colo e pernas).
- TEXTURA E ACABAMENTO: Pele negra com viço radiante natural e acabamento acetinado saudável. Textura de pele humana real com poros visíveis, sem aspecto acinzentado, sem opacidade e sem efeito plástico.
- LIMITES E PROIBIÇÕES: É TERMINANTEMENTE PROIBIDO gerar mulher branca, caucasiana, de pele clara ou pálida. Por outro lado, PROIBIDO gerar tom preto-carvão/ébano retinto excessivamente escuro ou opaco; o tom deve ser o marrom bronze-chocolate quente, dourado e luminoso da modelo negra de referência.
- PREVALÊNCIA SOBERANA: Esta tonalidade prevalece com autoridade máxima sobre a Mestra e combina perfeitamente com biotipo padrão ou Plus Size preservando o tom bronze-chocolate radiante.`;
    userEthnicityDirectiveEnglish = `[SOVEREIGN PRIORITY 1 MANDATE — RADIANT WARM BRONZE-CHOCOLATE BLACK WOMAN]:
- OFFICIAL REFERENCE SKIN TONE: The model MUST be an authentic BLACK WOMAN with a radiant, warm bronze-chocolate / golden-amber dark brown skin tone (lighter, warmer, and luminous, with glowing golden-bronze undertones, exactly matching the reference photo of a vibrant Black woman with healthy satin glow).
- SATIN GLOW & REALISTIC TEXTURE: Hydrated, healthy skin with warm amber/bronze highlights across shoulders, décolletage, arms, and legs. Realistic skin pores, zero ashy/gray tone, zero plastic wax effect.
- STRICT EXCLUSIONS: Strictly FORBIDDEN: white, fair, pale, or caucasian models. Also strictly avoid overly dark pitch-black / ebony / jet-black skin; her tone must be the luminous warm bronze-chocolate of the reference photo.
- BIOTYPE HARMONY: Completely sovereign Priority 1 instruction. Applies seamlessly to both standard and plus-size bodies, preserving this radiant warm bronze-chocolate skin tone.`;
  } else if (isAsianUser) {
    userEthnicitySummary = 'mulher japonesa / asiática oriental';
    userEthnicityDirectivePt = 'A modelo DEVE ser uma MULHER JAPONESA / ASIÁTICA ORIENTAL com traços faciais asiáticos naturais e pele lisa clara/natural. É TERMINANTEMENTE PROIBIDO gerar mulher caucasiana ou ocidental.';
    userEthnicityDirectiveEnglish = '[SOVEREIGN PRIORITY 1 — ETHNICITY & SKIN COLOR MANDATE]:\nThe model MUST be an authentic JAPANESE / EAST ASIAN WOMAN with natural East Asian facial features. STRICTLY FORBIDDEN: caucasian, black, or western features.';
  } else if (isRedheadUser) {
    userEthnicitySummary = 'mulher ruiva de pele clara';
    userEthnicityDirectivePt = 'A modelo DEVE ser uma MULHER RUIVA com cabelos ruivos acobreados naturais e pele clara natural com leves sardas delicadas.';
    userEthnicityDirectiveEnglish = '[SOVEREIGN PRIORITY 1 — ETHNICITY & HAIR MANDATE]:\nThe model MUST be a natural REDHEAD WOMAN with natural copper-red hair and fair/pale skin with subtle natural freckles.';
  } else if (isWhiteUser) {
    userEthnicitySummary = 'mulher de pele clara caucasiana';
    userEthnicityDirectivePt = 'A modelo DEVE apresentar pele clara natural (caucasiana).';
    userEthnicityDirectiveEnglish = '[SOVEREIGN PRIORITY 1 — SKIN COLOR MANDATE]:\nThe model MUST have fair / light natural Caucasian skin tone.';
  } else if (isTannedUser) {
    userEthnicitySummary = 'mulher morena';
    userEthnicityDirectivePt = `A modelo DEVE apresentar tom de pele conforme solicitado: "${userText}".`;
    userEthnicityDirectiveEnglish = `[SOVEREIGN PRIORITY 1 — SKIN COLOR MANDATE]:\nThe model MUST have skin tone matching the user directive: "${userText}".`;
  } else if (userText.length > 0 && /\b(pele|etnia|cor|tom)\b/i.test(lowerUser)) {
    userEthnicitySummary = userText;
    userEthnicityDirectivePt = `A modelo DEVE seguir exatamente a etnia/cor de pele solicitada pelo usuário: "${userText}".`;
    userEthnicityDirectiveEnglish = `[SOVEREIGN PRIORITY 1 — SKIN COLOR MANDATE]:\nThe model MUST follow the exact ethnicity and skin color specified by the user: "${userText}".`;
  }

  // B) Cabelo
  const isBlondeUser = /\b(loira|loiro|cabelos loiros|cabelo loiro|blonde)\b/i.test(lowerUser);
  const isCurlyUser = /\b(cabelo crespo|cabelos crespos|afro|black power|tranças|tranca|trança|cabelo cacheado|cachos)\b/i.test(lowerUser);
  const isStraightUser = /\b(cabelo liso|cabelos lisos|liso longo|liso escorrido)\b/i.test(lowerUser);
  const isShortUser = /\b(cabelo curto|cabelos curtos|chanel|pixie)\b/i.test(lowerUser);

  let userHairSummary = '';
  let userHairDirectivePt = '';
  let userHairDirectiveEnglish = '';

  if (isBlondeUser) {
    userHairSummary = 'cabelos loiros';
    userHairDirectivePt = 'Cabelos loiros naturais e iluminados, fios saudáveis e realistas.';
    userHairDirectiveEnglish = '[SOVEREIGN PRIORITY 1 — HAIR MANDATE]: The model MUST have BLONDE HAIR.';
  } else if (isRedheadUser) {
    userHairSummary = 'cabelos ruivos';
    userHairDirectivePt = 'Cabelos ruivos acobreados naturais e saudáveis.';
    userHairDirectiveEnglish = '[SOVEREIGN PRIORITY 1 — HAIR MANDATE]: The model MUST have NATURAL COPPER-RED HAIR.';
  } else if (isCurlyUser) {
    userHairSummary = 'cabelo crespo / cacheado volumoso';
    userHairDirectivePt = 'Cabelo crespo / afro / cacheado com curvatura natural e textura autêntica.';
    userHairDirectiveEnglish = '[SOVEREIGN PRIORITY 1 — HAIR MANDATE]: The model MUST have natural textured afro/curly/braided hair as requested.';
  } else if (isShortUser) {
    userHairSummary = 'cabelo curto';
    userHairDirectivePt = 'Cabelo curto feminino moderno e estilizado.';
    userHairDirectiveEnglish = '[SOVEREIGN PRIORITY 1 — HAIR MANDATE]: The model MUST have SHORT HAIR.';
  } else if (isStraightUser) {
    userHairSummary = 'cabelo liso';
    userHairDirectivePt = 'Cabelo liso alinhado com caimento natural.';
    userHairDirectiveEnglish = '[SOVEREIGN PRIORITY 1 — HAIR MANDATE]: The model MUST have straight hair.';
  }

  // C) Biotipo Corporal
  const hasNegativeOrComplaintAboutSlim =
    /(?:n[aã]o|sem|proibid[oa]|evit[ea]|menos|chega de|nada de|parar|t[aá] vindo|est[aá] vindo|recalibr|t[aá] muito|muito)\s+(?:[^\n,.;]*\s+)?(?:magr|esgui|slim|skinny|slender)/i.test(lowerUser) ||
    /\b(?:magr|esgui|slim|skinny|slender)[^\n,.;]*(?:demais|errad[oa]|ruim|feio|esquelet|desnutr)/i.test(lowerUser);

  const userSpecifiedSlim =
    !hasNegativeOrComplaintAboutSlim &&
    /\b(?:quero\s+(?:uma\s+)?modelo\s+magra|corpo\s+(?:bem\s+)?magro|biotipo\s+magro|silhueta\s+magra|modelo\s+esguia)\b/i.test(lowerUser);
  const userSpecifiedPlus = /\b(plus size|plus-size|gordinha|pesada|gorda|corpo pesado)\b/i.test(lowerUser);
  const userSpecifiedMuscular = /\b(muito musculosa|musculosa|fisiculturista|marombada|muito forte)\b/i.test(lowerUser);

  // D) Idade da modelo especificada pelo usuário (sobrescreve a idade padrão da Mestra)
  const ageMatch = lowerUser.match(/\b(?:(\d{2})\s*(?:anos|yo|years old)|mulher de (\d{2})|homem de (\d{2})|idosa|meia-idade|madura|senhora)\b/i);
  let userAgeSummary = '';
  let userAgeDirectivePt = '';
  let userAgeDirectiveEnglish = '';
  if (ageMatch) {
    const rawAge = ageMatch[1] || ageMatch[2] || ageMatch[3];
    const ageNum = rawAge ? parseInt(rawAge, 10) : (lowerUser.includes('idosa') || lowerUser.includes('senhora') ? 60 : 50);
    userAgeSummary = `${isMale ? 'homem' : 'mulher'} de ${ageNum} anos de idade`;
    userAgeDirectivePt = `A modelo DEVE ser uma ${isMale ? 'homem adulto' : 'mulher madura'} de exatamente ${ageNum} anos de idade, com fisionomia, textura de pele e maturidade corporal autênticas dessa faixa etária. Substitui a idade padrão da Mestra.`;
    userAgeDirectiveEnglish = `[SOVEREIGN PRIORITY 1 — AGE MANDATE]: The model MUST be an adult ${isMale ? 'man' : 'woman'} aged ${ageNum} years old, with authentic mature skin texture and realistic age-appropriate physical features.`;
  }

  // E) Cor do Smartphone / Celular
  const phoneMatch = lowerUser.match(/\b(?:celular|smartphone|iphone|telefone)\s+(?:de\s+cor\s+|cor\s+)?(vermelh[oa]|azul|pret[oa]|dourad[oa]|prat[ao]|ros[ao]|rox[oa]|verde|branc[oa]|amarel[oa]|titanium|grafite)\b/i);
  let userPhoneDirectivePt = '';
  let userPhoneDirectiveEnglish = '';
  if (phoneMatch) {
    const phoneColor = phoneMatch[1];
    userPhoneDirectivePt = `A modelo segura um smartphone moderno na cor ${phoneColor.toUpperCase()} diante do espelho. Substitui a cor de celular padrão da Mestra.`;
    userPhoneDirectiveEnglish = `[SOVEREIGN PRIORITY 1 — SMARTPHONE COLOR]: The modern smartphone held by the model MUST be ${phoneColor.toUpperCase()}.`;
  }

  // F) Manicure / Cor de esmalte das unhas
  const nailMatch = lowerUser.match(/\b(?:unhas?|esmalte)\s+(?:de\s+cor\s+|cor\s+)?(vermelh[ao]s?|pret[ao]s?|branc[ao]s?|azuis?|ros[ao]s?|nudes?|francesinha|vinho|dourad[ao]s?)\b/i);
  let userNailDirectivePt = '';
  let userNailDirectiveEnglish = '';
  if (nailMatch) {
    const nailColor = nailMatch[1];
    userNailDirectivePt = `As unhas das mãos da modelo DEVEM estar impecavelmente esmaltadas na cor ${nailColor.toUpperCase()}. Substitui a cor de unhas padrão da Mestra.`;
    userNailDirectiveEnglish = `[SOVEREIGN PRIORITY 1 — NAILS COLOR]: The model's fingernails MUST be manicured with ${nailColor.toUpperCase()} polish.`;
  }

  // RESOLUÇÃO DE BIOTIPO:
  // Prioridade 1: Usuário (se especificou corpo)
  // Prioridade 2: Plus Size ativado
  // Prioridade 3: Padrão da Mestra
  let resolvedBodyText = '';
  let bodySummaryLabel = '';

  if (isMale) {
    if (isPlusSize || userSpecifiedPlus) {
      resolvedBodyText = UNIVERSAL_MALE_PLUS_SIZE_MODULE;
      bodySummaryLabel = 'um homem adulto genuinamente PLUS SIZE (manequim 52 a 56)';
    } else {
      resolvedBodyText = `## 1. ESTRUTURA CORPORAL MASCULINA (ADAPTAÇÃO MASCULINA DE ${master.shortName.toUpperCase()})\nHomem brasileiro adulto (25 a 35 anos, salvo outra idade nas instruções adicionais), aparência natural, autêntica e cotidiana.\nCorpo masculino proporcional e em forma: ombros largos, peitoral e tronco alinhados, cintura masculina natural e pernas masculinas proporcionais.`;
      bodySummaryLabel = 'um homem adulto em forma';
    }
  } else if (userSpecifiedSlim) {
    resolvedBodyText = `## 1. BIOTIPO CORPORAL — PRIORIDADE 1 DO USUÁRIO (CORPO MAGRO / ESGUIO)\nA modelo DEVE apresentar silhueta esguia, magra e elegante, com cintura estreita e pernas proporcionais, conforme solicitado soberanamente pelo usuário.`;
    bodySummaryLabel = 'uma mulher adulta de silhueta esguia e magra';
  } else if (userSpecifiedMuscular) {
    resolvedBodyText = `## 1. BIOTIPO CORPORAL — PRIORIDADE 1 DO USUÁRIO (CORPO MUSCULOSO)\nA modelo DEVE apresentar musculatura densa e visível, com pernas muito musculosas, braços firmes e abdômen definido, conforme solicitado pelo usuário.`;
    bodySummaryLabel = 'uma mulher adulta com musculatura desenvolvida';
  } else if (isPlusSize || userSpecifiedPlus) {
    // PRIORIDADE 2: PLUS SIZE REAL (Sem cor de pele acoplada!)
    resolvedBodyText = `${UNIVERSAL_PLUS_SIZE_MODULE}\n\n${UNIVERSAL_PLUS_SIZE_ENGLISH_DIRECTIVE}`;
    bodySummaryLabel = 'uma mulher adulta genuinamente PLUS SIZE PESADA (manequim 50 a 54 / 2XL-3XL, corpo volumoso, busto farto com caimento natural, abdômen arredondado macio, quadris largos e coxas muito grossas com celulite natural visível)';
  } else {
    // PRIORIDADE 3: MESTRA SELECIONADA
    resolvedBodyText = `## 1. PADRÃO CORPORAL — ${master.shortName.toUpperCase()}\n${master.bodyStandardText}`;
    bodySummaryLabel = `uma mulher adulta seguindo a silhueta da ${master.shortName}`;
  }

  // RESOLUÇÃO DE PELE E ETNIA:
  // Prioridade 1: Usuário (se especificou etnia ou cor de pele)
  // Prioridade 2: Plus Size NÃO altera etnia nem cor de pele! Apenas textura (celulite nas coxas)
  // Prioridade 3: Padrão da Mestra
  let resolvedSkinText = '';
  if (userEthnicityDirectivePt) {
    resolvedSkinText = `### ETNIA E COR DA PELE — PRIORIDADE 1 SOBERANA DO USUÁRIO\n${userEthnicityDirectivePt}\n${userEthnicityDirectiveEnglish}\nTextura fotográfica humana real, poros naturais visíveis, sem filtros digitais de beleza e sem efeito de cera/plástico.${isPlusSize ? ' Preservar a celulite natural visível nas coxas e pernas característica do corpo plus size.' : ''}`;
  } else {
    resolvedSkinText = `### PELE E REALISMO HUMANO — ${master.shortName.toUpperCase()}\n${master.skinAndRealismText}${isPlusSize ? '\n\n**CELULITE NATURAL (PLUS SIZE):** Preservar celulite natural visível nas coxas volumosas sem remover com filtros digitais.' : ''}`;
  }

  // RESOLUÇÃO DE CABELO:
  // Prioridade 1: Usuário
  // Prioridade 2/3: Mestra
  let resolvedHairText = '';
  if (userHairDirectivePt) {
    resolvedHairText = `## CABELO — PRIORIDADE 1 SOBERANA DO USUÁRIO\n${userHairDirectivePt}\n${userHairDirectiveEnglish}\nSubstitui integralmente o cabelo padrão da Mestra selecionada. Fios com aspecto de cabelo humano real.`;
  } else if (isMale) {
    resolvedHairText = 'Cabelo masculino curto a médio, alinhado e natural.';
  } else {
    resolvedHairText = master.hairIdentityText;
  }

  // BLOCO DE PRIORIDADE SOBERANA DO USUÁRIO NO CABEÇALHO DO PROMPT
  const priorityOverrideBlock = userText.length > 0
    ? '## PRIORIDADE SOBERANA ABSOLUTA (PRIORIDADE 1) — INSTRUÇÕES DO USUÁRIO\n' +
      '"' + userText + '"\n' +
      'REGRA DEFINITIVA DE HIERARQUIA:\n' +
      '1º LUGAR (SOBERANO ABSOLUTO): As instruções do usuário acima têm PRIORIDADE MÁXIMA e sobrescrevem exclusivamente os atributos citados da Mestra (' + master.shortName + '). Todo o restante da Mestra não citado permanece intacto.\n' +
      (userAgeDirectivePt ? '- IDADE: OBRIGATÓRIO seguir ' + userAgeSummary.toUpperCase() + ' (' + userAgeDirectiveEnglish + ').\n' : '') +
      (userEthnicityDirectivePt ? '- ETNIA/COR DA PELE: OBRIGATÓRIO seguir ' + userEthnicitySummary.toUpperCase() + ' (' + userEthnicityDirectiveEnglish + ').\n' : '') +
      (userHairDirectivePt ? '- CABELO: OBRIGATÓRIO seguir ' + userHairSummary.toUpperCase() + '.\n' : '') +
      (userPhoneDirectivePt ? '- SMARTPHONE: OBRIGATÓRIO ' + userPhoneDirectivePt + ' (' + userPhoneDirectiveEnglish + ').\n' : '') +
      (userNailDirectivePt ? '- UNHAS: OBRIGATÓRIO ' + userNailDirectivePt + ' (' + userNailDirectiveEnglish + ').\n' : '') +
      (userSpecifiedSlim ? '- BIOTIPO: OBRIGATÓRIO seguir SILHUETA MAGRA/ESGUIA.\n' : '') +
      '2º LUGAR: Seletor Plus Size / Homem: ' + (isPlusSize && !userSpecifiedSlim ? 'PLUS SIZE REAL (manequim 50-54, corpo volumoso e coxas grossas com celulite natural visível).' : 'Conforme definido acima.') + '\n' +
      '3º LUGAR (BASE): Identidade e movimentos da Mestra selecionada (' + master.shortName + ') — mantém enquadramento, postura, movimentos, calçado e look comercial.\n\n'
    : '';

  return {
    resolvedBodyText,
    resolvedSkinText,
    resolvedHairText,
    bodySummaryLabel,
    userAgeSummary,
    userEthnicitySummary,
    userHairSummary,
    userPhoneDirectivePt,
    userNailDirectivePt,
    userEthnicityDirectiveEnglish,
    priorityOverrideBlock,
  };
}

export function buildAnaMariaImagePrompt(
  form: AnaMariaFormState,
  scenarioRoom: AnaMariaRoomType = 'hall_espelho'
): {
  prompt: string;
  shoeCategory: AnaMariaShoeCategory;
  shoeDescription: string;
} {
  const master = getMasterPromptById(form.selectedMasterId);
  const mode: AnaMariaPresentationMode =
    form.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');
  const isMale = form.influencer === 'Homem';
  const isPlusSize = form.bodyType === 'plus_size';
  const shoeInfo = detectShoeCategory(form.productName, form.additionalInstructions, form.influencer);
  const complementaryInfo = detectComplementaryGarment(form.productName, form.additionalInstructions, form.influencer);

  const hasUserInstructions = Boolean(
    form.additionalInstructions && form.additionalInstructions.trim().length > 0
  );
  const userInstructionsText = hasUserInstructions ? form.additionalInstructions.trim() : '';

  const priorityOverrideBlock = hasUserInstructions
    ? `## PRIORIDADE SOBERANA ABSOLUTA — INSTRUÇÕES ADICIONAIS DO USUÁRIO
"${userInstructionsText}"
REGRA DE ADAPTAÇÃO COM INTERVENÇÃO MÍNIMA: As instruções do usuário acima têm PRIORIDADE MÁXIMA sobre qualquer característica padrão da Mestra (${master.shortName}). Mantenha todo o restante da identidade da Mestra 100% original e altere EXCLUSIVAMENTE os atributos que conflitarem com o que o usuário pediu acima (ex.: se o usuário pediu outra cor/estilo de cabelo, outra idade, outra etnia/tom de pele, outra cor de celular, outro acessório ou outra pose, aplique exatamente a escolha do usuário mantendo o restante da Mestra intacto).\n\n`
    : '';

  // ============================================================================
  // CASO 1: MODO POV (MÃOS E DOIS PRODUTOS SOBRE A CAMA DO CENÁRIO POV)
  // ============================================================================
  if (mode === 'pov' || master.isPov) {
    const povScenarioLabel = form.selectedScenarioNumber
      ? `Cenário POV ${form.selectedScenarioNumber}`
      : 'Cenário POV selecionado';

    const handsDescription = isMale
      ? `Mostrar exclusivamente duas mãos masculinas adultas e parte dos antebraços entrando pela parte inferior do enquadramento em primeira pessoa (POV): pele realista com poros naturais, unhas curtas e limpas sem esmalte, e um relógio masculino discreto em um dos pulsos. REGRA OBRIGATÓRIA: mãos e antebraços 100% limpos, SEM NENHUMA TATUAGEM.`
      : `${master.bodyStandardText}\n${master.skinAndRealismText}\n\n## ACESSÓRIOS E MANICURE DAS MÃOS (${master.shortName.toUpperCase()})\n${master.accessoriesIdentityText}\n- ZERO TATUAGENS (REGRA OBRIGATÓRIA): Mãos, dedos, punhos e antebraços completamente limpos, SEM NENHUMA TATUAGEM, desenho ou marca corporal.`;

    const povPrompt = `${priorityOverrideBlock}Crie uma fotografia comercial hiper-realista vertical 9:16 em estilo POV (Point of View em primeira pessoa, câmera posicionada diretamente acima da cama em ângulo superior de 90 graus), apresentando o produto das fotos de referência sobre a cama do ${povScenarioLabel} anexado.

## 1. PRESERVAÇÃO INTEGRAL DO CENÁRIO POV ANEXADO (${povScenarioLabel.toUpperCase()})
A imagem do cenário POV anexada (cama/superfície) é a referência visual obrigatória do ambiente.
Reproduza fielmente a colcha, lençol, manta, texturas de tecido da cama, cores e iluminação natural do cenário POV anexado.

## 2. DISPOSIÇÃO DOS PRODUTOS NA CAMA E FIDELIDADE 1:1
Posicione EXATAMENTE DUAS unidades completas do produto anexado pelo usuário sobre a cama (se o usuário anexou duas cores/variações nas fotos de referência, exiba uma de cada cor; caso tenha anexado apenas uma cor, exiba duas unidades idênticas da peça).
${
  master.id === 'pov_blusinhas_13k'
    ? 'As duas mãos seguram a primeira peça aberta pelas extremidades laterais em primeiro plano voltada para a câmera, enquanto a segunda peça completa repousa visível e organizada sobre a cama logo abaixo.'
    : 'Os dois produtos estão dobrados/organizados no centro da cama com as duas mãos segurando delicadamente pelas extremidades laterais para iniciar a demonstração.'
}
Preservar com fidelidade absoluta (1:1) a cor exata, modelagem, corte, decote, costuras, textura do tecido, botões, rendas ou estampas do produto anexado. Nunca modificar ou redesenhar a construção da peça.

## 3. IDENTIDADE VISUAL DAS MÃOS E ACESSÓRIOS (${master.shortName.toUpperCase()})
REGRA OBRIGATÓRIA DE ZERO TATUAGENS NO MODO POV:
É TERMINANTEMENTE PROIBIDO qualquer tatuagem, desenho, tinta ou marca nas mãos, dedos, punhos ou antebraços. A pele deve ser 100% limpa, pura e natural.
${handsDescription}
${
  hasUserInstructions
    ? `IMPORTANTE: Caso a instrução adicional do usuário ("${userInstructionsText}") especifique outra cor de pele para as mãos, outra cor de unha ou outro acessório, aplique a solicitação do usuário com prioridade máxima.`
    : ''
}
PROIBIDO mostrar rosto, cabeça, cabelo, tronco ou pernas — enquadramento 100% POV mostrando apenas as duas mãos, punhos/antebraços interagindo com os dois produtos sobre a cama.

## 4. ILUMINAÇÃO E REALISMO FOTOGRÁFICO
${master.lightingAndCameraText}
Qualidade fotográfica autêntica de smartphone moderno em alta definição 1080x1920 (9:16).`;

    return {
      prompt: povPrompt.trim(),
      shoeCategory: 'C_OUTRO',
      shoeDescription: 'Modo POV (Somente Mãos e Produto na Cama — Sem Calçado)',
    };
  }

  // ============================================================================
  // CASO 2: MODO MIRROR SELFIE (SEM ROSTO) OU MODO COM ROSTO (UGC)
  // ============================================================================
  const hasSelectedScenario = Boolean(form.selectedScenarioId);
  const scenarioTitle = form.selectedScenarioNumber
    ? `Cenário ${form.selectedScenarioNumber}`
    : 'cenário selecionado';
  const scenarioText = SCENARIO_DESCRIPTIONS[scenarioRoom] || SCENARIO_DESCRIPTIONS.hall_espelho;

  // RESOLUÇÃO DE ATRIBUTOS PELA HIERARQUIA SOBERANA:
  // Prioridade 1: Usuário -> Prioridade 2: Plus Size (somente corpo) -> Prioridade 3: Mestra
  const {
    resolvedBodyText,
    resolvedSkinText,
    resolvedHairText,
    bodySummaryLabel,
    userAgeSummary,
    userEthnicitySummary,
    userHairSummary,
    userPhoneDirectivePt,
    userNailDirectivePt,
    priorityOverrideBlock: resolvedPriorityBlock,
  } = resolveModelAttributesHierarchy({
    master,
    isPlusSize,
    isMale,
    additionalInstructions: form.additionalInstructions,
    presentationMode: mode,
  });

  const bodySectionText = `${resolvedBodyText}\n\n${resolvedSkinText}`;
  const hairSectionText = resolvedHairText;

  // Acessórios: Mestra vs Homem
  const accessoriesSectionText = isMale
    ? `Acessórios masculinos discretos (Adaptação Masculina):
- Relógio de pulso masculino elegante e discreto em um dos pulsos.
- Ausência total de colares femininos, pulseiras femininas delicadas ou esmalte colorido. Unhas masculinas curtas e limpas.`
    : `${master.accessoriesIdentityText}${userNailDirectivePt ? `\n- ${userNailDirectivePt}` : ''}`;

  // Regra de Rosto: Mirror Selfie (Corte estrito no queixo) vs Com Rosto (Rosto visível)
  const isFaceVisible = mode === 'com_rosto';
  const framingFaceSection = isFaceVisible
    ? `## 2. ROSTO E ENQUADRAMENTO — MODO COM ROSTO (UGC / ESPELHO)
Neste modo COM ROSTO, o rosto ${isMale ? 'do modelo' : 'da modelo'} DEVE aparecer de forma natural e harmoniosa na selfie diante do espelho.
${
  !isMale && master.faceAndMakeupText
    ? master.faceAndMakeupText
    : `Rosto ${isMale ? 'masculino' : 'feminino'} brasileiro autêntico, expressivo, simpático e fotográfico, com textura de pele real e proporções anatômicas naturais.`
}
${isMale ? 'O modelo' : 'A modelo'} segura o smartphone naturalmente na altura do peito/ombro apontado para o espelho, permitindo ver o rosto e o corpo inteiro até os pés.`
    : `## 2. ROSTO — CORTE OBRIGATÓRIO ESTRITO NA BASE DO QUEIXO (MODO MIRROR SELFIE SEM ROSTO)
REGRA SOBERANA ACIMA DO PROMPT DA MESTRA: Enquadrar a cabeça RIGOROSAMENTE DA ALTURA DA BASE DO QUEIXO PARA BAIXO.
É TERMINANTEMENTE PROIBIDO MOSTRAR LÁBIOS, BOCA, NARIZ OU OLHOS EM QUALQUER PARTE DA IMAGEM.
Os lábios, a boca, o nariz e os olhos devem ficar 100% FORA do enquadramento em todas as circunstâncias. Mostrar somente a ponta inferior do queixo, o pescoço, o colo (com parte do comprimento dos cabelos caindo sobre os ombros/colo) e todo o corpo até os pés. O corte deve parecer uma selfie espontânea natural tirada no espelho com corte exato na base do queixo.`;

  const scenarioSection = hasSelectedScenario
    ? `## 4. PRESERVAÇÃO INTEGRAL DO CENÁRIO INDEPENDENTE (${scenarioTitle.toUpperCase()})
A foto de cenário anexada é a autoridade visual absoluta do ambiente.
Preserve integralmente e sem modificações todo o cômodo da foto de referência: piso, paredes, portas, cama/móveis, espelho e elementos arquitetônicos.
NÃO redesenhe, NÃO altere e NÃO gere um ambiente diferente. Insira ${isMale ? 'o modelo' : 'a modelo'} perfeitamente integrado(a) e em pé diante do espelho dentro deste exato cômodo real.`
    : `## 4. CENÁRIO RESIDENCIAL E AMBIENTE
${scenarioText}`;

  const phonePostureSection = `## 5. SMARTPHONE, ILUMINAÇÃO E POSTURA (${master.shortName.toUpperCase()})
${
  isMale
    ? 'O modelo segura um smartphone moderno com uma das mãos diante do espelho de corpo inteiro.'
    : (userPhoneDirectivePt || 'A modelo segura um smartphone moderno com uma das mãos diante do espelho de corpo inteiro (respeitando eventual cor de celular solicitada nas instruções adicionais).')
}
${master.lightingAndCameraText}
${
  isPlusSize
    ? `Postura natural em pé diante do espelho, valorizando com autenticidade a estrutura corporal genuinamente PLUS SIZE PESADA (manequim 50-54, peso corporal evidente, coxas hiper-grossas que se tocam sem vão, celulites naturais visíveis nas coxas, quadris muito largos, abdômen arredondado macio e braços roliços carnudos), com o braço livre relaxado ou tocando levemente a lateral sem esconder detalhes da roupa.`
    : `Postura natural em pé diante do espelho, peso apoiado de forma orgânica valorizando a silhueta e o caimento da peça, com o braço livre relaxado ou tocando suavemente a lateral sem esconder detalhes da roupa.`
}`;

  const hasGalleryModel = Boolean(form.selectedModelGalleryId || form.selectedModelGalleryNumber);

  if (hasGalleryModel) {
    const isDressOrOnePiece = complementaryInfo.type === 'full_body';
    const isUpperOnly = complementaryInfo.type === 'upper_only';
    const isLowerOnly = complementaryInfo.type === 'lower_only';

    const garmentTypeInstruction = isDressOrOnePiece
      ? '- O PRODUTO DA FOTO 1 É UM VESTIDO / PEÇA ÚNICA COMPLETA: A modelo veste EXCLUSIVAMENTE o vestido/peça única da Foto 1 com máxima fidelidade 1:1.\n' +
        '- PROIBIÇÃO ABSOLUTA DE CALÇA OU SHORTS: É TERMINANTEMENTE PROIBIDO ADICIONAR CALÇA JEANS, CALÇA, SHORTS, BERMUDA OU QUALQUER OUTRA PEÇA INFERIOR. A modelo veste APENAS o vestido da Foto 1 cobrindo o corpo por completo com pernas limpas naturais até os pés.'
      : isUpperOnly
      ? '- O PRODUTO DA FOTO 1 É UMA PEÇA SUPERIOR: A modelo veste a peça superior da Foto 1 com máxima fidelidade 1:1, combinada com uma peça inferior que combine com harmonia (calça, saia, short ou bermuda) para look completo elegante sem nudez.'
      : isLowerOnly
      ? '- O PRODUTO DA FOTO 1 É UMA PEÇA INFERIOR: A modelo veste a peça inferior da Foto 1 com máxima fidelidade 1:1, combinada com uma blusa neutra elegante para look completo sem nudez.'
      : '- Se o produto for vestido ou macacão, veste EXCLUSIVAMENTE o vestido (PROIBIDO calça jeans ou shorts por baixo); se for blusa, veste peça inferior combinando; se for calça/short, veste blusa combinando.';

    const galleryModelPrompt = `${resolvedPriorityBlock || priorityOverrideBlock}FOTOGRAFIA COMERCIAL VERTICAL 9:16 (1080x1920) COMBINANDO RIGOROSAMENTE AS 3 FOTOS DE REFERÊNCIA:

1. FOTO 1 (PRODUTO — PEÇA DE ROUPA):
- Vestir a modelo com a roupa da Foto 1 com máxima fidelidade 1:1 (mesma cor exata, tonalidade, textura do tecido, caimento, modelagem, decote, mangas e detalhes reais da peça).
${garmentTypeInstruction}
- Calçado nos pés: ${shoeInfo.name} (${shoeInfo.description}), mostrando os dois pés calçados apoiados no piso.
- REGRA CRÍTICA DE POSE E ISOLAMENTO: Da Foto 1 (produto), extraia RIGOROSAMENTE apenas a peça de roupa e o tecido. É TERMINANTEMENTE PROIBIDO COPIAR A POSE, O ÂNGULO OU A POSIÇÃO CORPORAL DA PESSOA DA FOTO 1 (mesmo que na foto do produto a pessoa esteja de lado, de perfil, sentada ou de costas).

2. FOTO 2 (MODELO — IDENTIDADE E POSE DE FRENTE 1:1):
- A modelo gerada DEVE SER LITERALMENTE A MESMA MULHER DA FOTO 2.
- PRESERVAÇÃO INTEGRAL DO BIOTIPO DA FOTO 2: reproduza com fidelidade 100% o mesmo corpo, curvas, biotipo, quadris, cintura, pernas, tom de pele natural com poros reais, cabelos (mesma cor, corte e textura da foto da modelo).
- POSE OBRIGATÓRIA DE FRENTE: A modelo deve estar POSICIONADA RIGOROSAMENTE DE FRENTE PARA O ESPELHO (front-facing), mostrando a frente inteira da roupa com máxima clareza. PROIBIDO corpo de lado ou de perfil.
- ENQUADRAMENTO DA FOTO 2 (CORTE ESTRITO NO QUEIXO): A modelo segura o smartphone na altura do peito/queixo tirando foto no espelho. Enquadramento estritamente da base do queixo para baixo até os pés. NÃO mostrar olhos, nariz, boca ou cabeça (rosto 100% fora do enquadramento / encoberto pelo smartphone conforme a foto da modelo).
- DESCONSIDERAR A ROUPA E O CENÁRIO DA FOTO 2: É TERMINANTEMENTE PROIBIDO copiar a roupa que a modelo veste na Foto 2 e PROIBIDO usar o cenário de fundo da Foto 2.

3. FOTO 3 (CENÁRIO INDEPENDENTE):
- A modelo da Foto 2, vestindo a roupa da Foto 1 de frente para o espelho, está em pé diante do espelho dentro do cômodo da Foto 3.
- Preserve integralmente o cenário real da Foto 3: piso, paredes, portas, espelho e iluminação natural sem alterar nem redesenhar.

Qualidade fotográfica autêntica de smartphone moderno, textura de pele humana real com poros visíveis, acabamento fosco suave sem brilho excessivo de óleo, sem aspecto de cera ou plástico. ZERO tatuagens.`;

    return {
      prompt: galleryModelPrompt.trim(),
      shoeCategory: shoeInfo.category,
      shoeDescription: shoeInfo.name,
    };
  }

  const openingDescriptor = [
    userAgeSummary ? `${userAgeSummary} (${bodySummaryLabel})` : bodySummaryLabel,
    userEthnicitySummary && `de etnia/pele: ${userEthnicitySummary}`,
    userHairSummary && `com ${userHairSummary}`,
  ].filter(Boolean).join(', ');

  const prompt = `${resolvedPriorityBlock || priorityOverrideBlock}Crie uma fotografia hiper-realista vertical 9:16 (1080x1920) de ${openingDescriptor} vestindo exatamente a peça de roupa da imagem de referência anexada, inserida com perfeição no ${scenarioTitle} anexado, em uma fotografia de espelho de corpo inteiro.

${bodySectionText}
**REGRA DE PELE LIMPA: ${isMale ? 'O modelo' : 'A modelo'} não deve possuir tatuagens no corpo (salvo se solicitado nas instruções adicionais).**

${framingFaceSection}

## 3. CABELO E APARÊNCIA (${master.shortName.toUpperCase()})
${hairSectionText}

${scenarioSection}

${phonePostureSection}

## 6. ACESSÓRIOS E JOIAS (${master.shortName.toUpperCase()})
${accessoriesSectionText}

## 7. REGRA UNIVERSAL DE CALÇADO (CAMADA ACIMA DO PROMPT DA MESTRA)
Calçado obrigatório nos dois pés: **${shoeInfo.name}**.
Especificação do calçado: ${shoeInfo.description}
(Observação: Esta regra universal de calçado prevalece sobre qualquer menção genérica de calçado do catálogo da Mestra, salvo se o usuário pediu outro calçado específico nas Instruções Adicionais). Enquadrar o corpo inteiro mostrando os dois pés calçados apoiados naturalmente no piso do cenário.

## 7.1. REGRA DE LOOK COMPLETO E PEÇAS COMPLEMENTARES (PROIBIÇÃO ABSOLUTA DE NUDEZ)
${complementaryInfo.directiveTextPt}
${complementaryInfo.directiveTextEn}

## 8. FIDELIDADE ABSOLUTA E SOBERANA AO PRODUTO ANEXADO (1:1 — ZERO INVENÇÃO DE DETALHES)
A foto da peça anexada pelo usuário é a referência soberana e inviolável da roupa (venda real TikTok Shop).
Reproduza a roupa 1:1 com máxima fidelidade: mesma cor exata, tonalidade, textura do tecido, modelagem, comprimento, decote, alças, mangas, barra, rendas, transparências, costuras, botões, recortes e estampas.
É TERMINANTEMENTE PROIBIDO inventar detalhes inexistentes na peça (não adicionar rendas, babados, laços, botões, fendas, costuras ou estampas que não existam na foto real) e proibido omitir detalhes reais da peça.
A roupa deve vestir anatomicamente o corpo ${isPlusSize ? 'genuinamente PLUS SIZE' : 'do(a) modelo'} sem jamais redesenhar ou descaracterizar o produto.`;

  return {
    prompt: prompt.trim(),
    shoeCategory: shoeInfo.category,
    shoeDescription: shoeInfo.name,
  };
}

/**
 * Mantém exportações legadas para retrocompatibilidade caso algum módulo externo importe
 */
export const VENCEDOR_BY_GPT_PROMPT = getMasterPromptById('mestra_ana_maria').movementPromptText;
export const VENCEDOR_BY_GPT_SCENARIO_PROMPT = getMasterPromptById('mestra_ana_maria').movementPromptText;

/**
 * Constrói o Prompt de Vídeo de Movimentos do Modo Ana Maria
 * Baseado no Prompt da Mestra selecionada na Galeria + Camadas Superiores:
 * - Modo Mirror Selfie (trava estrita sem rosto/lábios) vs Com Rosto vs POV
 * - Adaptação Masculina (quando influencer === 'Homem', mantendo 80%+ da coreografia da Mestra com gestos masculinos)
 * - Preservação da estrutura Plus Size (quando bodyType === 'plus_size')
 * - Prioridade Soberana das Instruções Adicionais do Usuário (sobrepondo características ou movimentos específicos mantendo o restante original)
 */
export function buildAnaMariaVideoPrompt(params: {
  productName: string;
  influencer?: AnaMariaInfluencer;
  bodyType?: AnaMariaBodyType;
  presentationMode?: AnaMariaPresentationMode;
  selectedMasterId?: AnaMariaMasterId;
  limit?: AnaMariaVideoPromptLimit;
  additionalInstructions?: string;
  hasSelectedScenario?: boolean;
}): string {
  const master = getMasterPromptById(params.selectedMasterId);
  const mode: AnaMariaPresentationMode =
    params.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');
  const isMale = params.influencer === 'Homem';
  const isPlusSize = params.bodyType === 'plus_size';
  const limit = params.limit || 'unlimited';
  const hasUserInstructions = Boolean(
    params.additionalInstructions && params.additionalInstructions.trim().length > 0
  );
  const userInstructionsText = hasUserInstructions ? params.additionalInstructions!.trim() : '';

  let base = master.movementPromptText;

  // 1. Adaptação para Homem (mantendo 80%+ dos movimentos originais da Mestra com postura e gestos masculinos)
  if (isMale) {
    base = base
      .replace(/\bwoman\b/g, 'man')
      .replace(/\bwoman's\b/g, "man's")
      .replace(/\bShe\b/g, 'He')
      .replace(/\bshe\b/g, 'he')
      .replace(/\bHer\b/g, 'His')
      .replace(/\bher\b/g, 'his')
      .replace(/\bbust\b/g, 'chest')
      .replace(/\bdress\b/g, 'garment')
      .replace(/mesma modelo/gi, 'mesmo modelo masculino')
      .replace(/a modelo/gi, 'o modelo masculino')
      .replace(/A modelo/g, 'O modelo masculino')
      .replace(/mãos femininas/gi, 'mãos masculinas')
      .replace(/busto/gi, 'peitoral');

    base = `**ADAPTAÇÃO MASCULINA OBRIGATÓRIA (MODELO HOMEM):**
Adapte toda a execução para o modelo masculino da imagem de referência, preservando 85% da sequência exata de movimentos da ${master.shortName}, porém executada com postura corporal, mecânica e gestos naturais masculinos, mantendo o relógio masculino discreto e a fidelidade 1:1 à peça de roupa.\n\n` + base;
  }

  // 2. Preservação da estrutura Plus Size durante toda a animação (sobrescrita exclusivamente corporal)
  if (isPlusSize && mode !== 'pov' && !master.isPov) {
    base = `**PRESERVAÇÃO OBRIGATÓRIA DO CORPO PLUS SIZE REAL:**
Mantenha rigorosamente em todos os frames a estrutura corporal genuinamente PLUS SIZE da imagem de referência: corpo robusto e volumoso, seios grandes e pesados, braços grossos e macios, abdômen com projeção natural e dobras suaves, quadris largos e glúteos volumosos, coxas muito grossas com celulite natural visível e tom de pele morena clara a média com subtom quente. Jamais afinar a modelo, emagrecer membros ou transformar em corpo fitness durante os giros e movimentos.\n\n` + base;
  }

  // 3. Regra de Enquadramento: Com Rosto (UGC) vs Mirror Selfie (Corte no queixo)
  const isFaceMode =
    mode === 'com_rosto' ||
    Boolean(master.allowsFaceByDefault) ||
    master.primaryCategory === 'com_rosto' ||
    master.id === 'mestra_catza';

  if (isFaceMode && !master.isPov) {
    // Remove qualquer restrição residual de "sem rosto"
    base = base
      .replace(/Never reveal the model's face\.[^\n]*/gi, "Preserve the model's natural face and expression as shown in the reference image.")
      .replace(/O rosto e os lábios nunca devem aparecer\.[^\n]*/gi, 'Preservar o rosto natural e harmonioso da modelo conforme a imagem de referência.')
      .replace(/\*\*REGRA SUPERIOR INEGOCIÁVEL DE ENQUADRAMENTO[^\n]*\*\*[\s\S]*?(?=\n\n|$)/gi, '');

    const faceRule = `**MODO COM ROSTO (UGC COM ESPELHO & FLASH):**
Demonstração comercial autêntica em selfie no espelho com flash do smartphone ligado. Preservar o rosto natural, maquiagem e expressão espontânea da imagem de referência.
Vídeo 100% silencioso: a modelo NÃO fala e NÃO movimenta os lábios como se estivesse falando.\n\n`;
    base = faceRule + base;
  } else if (mode === 'mirror_selfie' && !master.isPov) {
    const strictChinLock = `**REGRA SUPERIOR INEGOCIÁVEL DE ENQUADRAMENTO (MODO MIRROR SELFIE — CORTE NO QUEIXO):**
O enquadramento deve permanecer 100% travado da base do queixo para baixo durante todo o vídeo.
É TERMINANTEMENTE PROIBIDO mostrar lábios (especialmente lábios inchados ou com aspecto de botox), boca, nariz, olhos ou rosto em qualquer frame, inclusive no final do vídeo ou durante giros. A câmera NUNCA deve subir ou inclinar para cima.\n\n`;
    base = strictChinLock + base;
  }

  // 4. Prioridade Soberana das Instruções Adicionais do Usuário (sobrepõe características e movimentos específicos)
  if (hasUserInstructions) {
    const sovereignHeader = `**PRIORIDADE SOBERANA — INSTRUÇÕES PERSONALIZADAS DO USUÁRIO:**
"${userInstructionsText}"
REGRA DE ADAPTAÇÃO: As instruções personalizadas acima têm PRIORIDADE ABSOLUTA sobre o prompt base da ${master.shortName}.
- Se o usuário especificou características físicas, idade, etnia, cabelo, cor de celular ou acessórios diferentes, substitua apenas esses elementos mantendo todo o restante idêntico.
- Se o usuário especificou algum movimento adicional ou mudança de movimento (ex.: como começar o vídeo ou um gesto específico), integre e priorize esse movimento exatamente no momento indicado pelo usuário, mantendo o restante da coreografia da ${master.shortName} o mais original e fiel possível.\n\n`;
    base = sovereignHeader + base + `\n\n**LEMBRETE FINAL DE PRIORIDADE DO USUÁRIO:** Cumprir rigorosamente: ${userInstructionsText}`;
  }

  if (limit === 'unlimited') {
    return base.trim();
  }

  if (limit === '5000') {
    if (base.length <= 5000) return base.trim();
    return base.slice(0, 4980).trim();
  }

  // Até 2.500 caracteres
  if (base.length <= 2500) return base.trim();
  return base.slice(0, 2480).trim();
}
