import {
  AnaMariaFormState,
  AnaMariaInfluencer,
  AnaMariaBodyType,
  AnaMariaShoeCategory,
  AnaMariaVideoPromptLimit,
  AnaMariaPresentationMode,
  AnaMariaMasterId,
} from './types';
import { isBagProduct } from '../produtos2/produtos2FidelityLock';
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
// ACESSÓRIOS FIXOS DA MODELO — PADRÃO DOURADO (MODO GERAR VIA PROMPT)
export const UNIVERSAL_GOLDEN_ACCESSORIES_PROMPT_BLOCK = `## ACESSÓRIOS FIXOS DA MODELO — PADRÃO DOURADO DISCRETO E ELEGANTE (COMBINANDO COM A ROUPA)

**COLARES DOURADOS EM CAMADAS:**
Utilizar dois colares dourados delicados, usados simultaneamente em camadas:
- Primeiro colar: corrente dourada extremamente fina, curta, rente à base do pescoço, estilo gargantilha delicada.
- Segundo colar: corrente dourada fina e um pouco mais comprida, com pequeno pingente oval ou medalhinha dourada, posicionado na região superior do colo.
- O conjunto deve apresentar aparência elegante, discreta e feminina, com as duas correntes naturalmente distribuídas no colo.

**PULSEIRAS FINAS NOS DOIS PULSOS:**
Utilizar pulseiras finas e delicadas nos dois pulsos:
- No pulso esquerdo: pulseira de corrente dourada fina, com pequenos elos e um pequeno pingente pendente.
- No pulso direito: pulseira dourada delicada, de corrente fina, com pequenos detalhes metálicos e um pequeno elemento pendente.
- As pulseiras devem ficar levemente soltas nos pulsos, acompanhando naturalmente os movimentos das mãos, com brilho metálico discreto de joias reais.

**ANÉIS DELICADOS EM METAL CLARO / PRATEADO:**
Utilizar anéis delicados predominantemente prateados ou em tonalidade metálica clara:
- Anéis finos, minimalistas e elegantes: um anel delicado em um dos dedos da mão direita e um anel liso e discreto em um dedo da outra mão.
- Não utilizar anéis grandes, pedras volumosas ou modelos chamativos.

**PADRÃO GERAL:**
Manter sempre a mesma identidade de acessórios: colares dourados em camadas, pulseiras douradas fininhas nos dois pulsos e anéis delicados em metal claro. Os acessórios devem parecer joias verdadeiras, com acabamento refinado, proporções pequenas e brilho natural.
Não utilizar relógios grandes, maxi colares, pulseiras grossas ou acessórios exagerados. Os acessórios SEMPRE combinam perfeitamente com a roupa.
- AUSÊNCIA TOTAL DE BOLSAS (REGRA MANDATÓRIA): É terminantemente proibido a modelo usar, segurar ou carregar qualquer tipo de bolsa, bolsa tiracolo, bolsa de ombro, bolsa de mão, clutch ou mochila (mãos e ombros completamente livres de bolsas), exceto se a bolsa for o próprio produto à venda.`;

export const UNIVERSAL_GOLDEN_ACCESSORIES_ENGLISH_BLOCK = `[MANDATORY FEMININE DELICATE ACCESSORIES - GOLD & LIGHT METALS]:
- LAYERED GOLD NECKLACES: Two delicate gold necklaces worn simultaneously in layers:
  1. Choker chain: extremely fine, short gold chain sitting close to the base of the neck.
  2. Lower chain: slightly longer fine gold chain with a small subtle oval pendant or tiny gold medallion on the upper decolletage.
- DELICATE BRACELETS ON BOTH WRISTS:
  1. Left wrist: delicate fine gold chain bracelet with tiny links and a small dangling charm.
  2. Right wrist: delicate fine gold chain bracelet with subtle metallic accents.
  Loose natural fit on wrists, realistic understated jewelry sheen.
- MINIMALIST METALLIC RINGS: Fine, subtle, elegant silver/light-gold rings (one delicate ring on right hand, one subtle smooth band on left hand; no chunky gems or large cocktail rings).
- STRICT PROHIBITIONS: NO bulky watches, NO chunky bracelets, NO oversized statement jewelry. Accessories must look like real, refined, delicate fine jewelry harmonizing with the outfit.
- STRICT NO BAGS MANDATE: The model must NOT wear, carry or hold any bag, purse, handbag, tote bag, shoulder bag, backpack or clutch. Hands and shoulders must be 100% free of bags.`;

export function detectShoeCategory(
  productName: string,
  additionalInstructions: string = '',
  influencer: AnaMariaInfluencer = 'Mulher'
): { category: AnaMariaShoeCategory; description: string; name: string } {
  const combined = `${productName} ${additionalInstructions}`.toLowerCase();
  const isMale = influencer === 'Homem';

  // 1. Roupas Fitness / Academia / Esportivas / Treino -> SEMPRE TÊNIS
  const isFitness =
    /\b(fitness|academia|treino|gym|legging|macacao fitness|macacão fitness|macaquinho fitness|esportiv|suplex|poliamida fitness|anarruga fitness|top fitness|conjunto fitness|short fitness|bermuda academia|camiseta treino|dry fit|dryfit)\b/i.test(
      combined
    );

  // 2. Camisola, Baby Doll, Roupa de Dormir, Pijama ou Roupa de Ficar em Casa -> CHINELO DE DEDO BRANCO COM DETALHES
  const isSleepwearOrHomewear =
    /\b(camisola|baby doll|babydoll|pijama|dormir|sleepwear|homewear|ficar em casa|roupa de casa|lingerie|robe)\b/i.test(
      combined
    );

  // 3. Roupa de Festa, Vestido de Festa, Social, Gala, Casamento, Formatura -> SAPATO OU SANDÁLIA DE FESTA ELEGANTE
  const isPartyOrSocial =
    /\b(festa|vestido de festa|gala|formatura|social|casamento|cocktail|baile|madrinha|evento|alfaiataria|blazer|terno|fino|elegante)\b/i.test(
      combined
    );

  // Peças únicas (vestidos, macacões, camisolas, babydolls, pijamas) NÃO são peças superiores avulsas
  const isOnePieceForShoes = /\b(vestido|vestidos|dress|dresses|macac[aã]o|macaquinho|camisola|baby\s*doll|babydoll|jumpsuit|chemise|tubinho|pijama completo|robe)\b/i.test(combined);
  const isDress = /\b(vestido|vestidos|dress|dresses|longo|midi|chemise|tubinho)\b/i.test(combined);

  // 3.1. Blusas, Blusinhas, Croppeds ou Peças Superiores -> SEMPRE TÊNIS (combinando com a Calça Jeans obrigatória)
  const isUpperPieceForShoes = !isOnePieceForShoes && /\b(blusa|blusinha|blusinhas|blusas|rendada|rendado|cropped|top|regata|camisa|camiseta|t-shirt|tshirt|casaco|jaqueta|blazer|moletom|sueter|suéter|cardiga|cardigã|bata|cropped rendad[oa]|blusa rendad[oa])\b/i.test(combined);

  // 4. Calças (para mulher: calça = tênis casual branco ou harmonioso; para homem: social = sapato social, demais = tênis)
  const isPants = /\b(calca|calça|jeans|jogger|cargo|pantacourt|pantalona|sarja)\b/i.test(combined);

  if (isMale) {
    if (isFitness) {
      return {
        category: 'B_TENIS',
        name: 'Tênis Esportivo Masculino',
        description:
          'Tênis masculino esportivo moderno de cano baixo, design limpo e anatômico, cores sóbrias (branco ou preto/cinza neutro) compatíveis com roupa de academia/treino, solado esportivo estruturado e meia esportiva discreta.',
      };
    }

    if (isPartyOrSocial) {
      return {
        category: 'C_OUTRO',
        name: 'Sapato Social Masculino Elegante',
        description:
          'Sapato social masculino de couro legítimo com acabamento fosco/acetinado elegante (preto ou marrom café conforme a peça), bico levemente arredondado e solado clássico alinhado à roupa social/festa.',
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

    if (isSleepwearOrHomewear) {
      return {
        category: 'A_CHINELO',
        name: 'Chinelo Masculino de Casa',
        description:
          'Chinelo masculino tradicional de dedo ou slide discreto em tom neutro (branco, preto ou marinho), solado plano e visual autêntico e confortável de casa.',
      };
    }

    return {
      category: 'C_OUTRO',
      name: 'Calçado Masculino Harmonioso',
      description:
        'Calçado masculino moderno e harmonioso que combine perfeitamente com a proposta e estilo da peça anunciada.',
    };
  }

  // REGRAS PARA MULHER (CAMADA UNIVERSAL SOBERANA):
  // 1. Academia / Fitness -> SEMPRE TÊNIS
  if (isFitness) {
    return {
      category: 'B_TENIS',
      name: 'Tênis Esportivo Feminino Harmonioso',
      description:
        'Tênis esportivo feminino moderno de cano baixo (branco ou em tom coordenado), design anatômico impecável, solado esportivo e meias discretas, combinando 100% com a roupa de academia/fitness.',
    };
  }

  // 2. Camisola, Baby Doll, Roupa de Dormir ou Roupa de Ficar em Casa -> CHINELO DE DEDO BRANCO COM DETALHES
  if (isSleepwearOrHomewear) {
    return {
      category: 'A_CHINELO',
      name: 'Chinelo de Dedo Branco Feminino com Detalhes Delicados',
      description:
        'Chinelo de dedo branco feminino delicado com detalhes refinados nas tiras, deixando o calçado charmoso, bonito e sofisticado, harmonizando perfeitamente com a camisola, baby doll ou roupa de ficar em casa.',
    };
  }

  // 3. Roupa de Festa, Vestido de Festa ou Social -> SAPATO OU SANDÁLIA DE FESTA ELEGANTE
  if (isPartyOrSocial) {
    return {
      category: 'C_OUTRO',
      name: 'Sapato ou Sandália de Festa Elegante que Combina com a Roupa',
      description:
        'Sapato refinado de salto ou sandália feminina de festa sofisticada com tiras elegantes que combine e harmonize 100% com o vestido de festa ou roupa social.',
    };
  }

  // 3.2. Para Mulher: Blusa, Blusinha ou Peça Superior -> TÊNIS FEMININO CASUAL (combinando com a Calça Jeans)
  if (isUpperPieceForShoes && !isDress && !isSleepwearOrHomewear && !isPartyOrSocial) {
    return {
      category: 'B_TENIS',
      name: 'Tênis Casual Feminino Moderno (combinando com a Calça Jeans)',
      description:
        'Tênis casual feminino moderno de cano baixo (branco ou neutro claro), design anatômico elegante e solado reto, combinando perfeitamente com a calça jeans clássica e a blusa anunciada.',
    };
  }

  // 4. Vestidos em geral (tubinho, midi, longo casual, etc.) -> Sandália feminina elegante que harmonize com o vestido
  if (isDress) {
    const isLongDress = /\b(longo|longa|maxi|arrastando|ch[aã]o|floor)\b/i.test(combined);
    return {
      category: 'C_OUTRO',
      name: isLongDress ? 'Sandália Feminina sob a Barra Longa (se visível)' : 'Sandália Feminina Elegante que Combina com o Vestido',
      description: isLongDress
        ? 'Sandália feminina elegante que harmoniza com o vestido longo. REGRA DE COMPRIMENTO: Se o vestido for longo até o chão cobrindo o calçado, preserve a barra longa cobrindo os pés; NÃO é obrigatório aparecer calçado e é proibido encurtar o vestido longo.'
        : 'Sandália feminina elegante de tiras delicadas ou salto harmonioso que combine perfeitamente com a cor, caimento e proposta do vestido.',
    };
  }

  // 5. Calças casuais / jeans -> Tênis casual moderno ou calçado elegante harmonioso
  if (isPants) {
    return {
      category: 'B_TENIS',
      name: 'Tênis Casual Feminino Harmonioso',
      description:
        'Tênis casual feminino moderno de cano baixo ou calçado alinhado que harmonize perfeitamente com a calça e componha um look comercial moderno e elegante.',
    };
  }

  // 6. Demais roupas femininas -> Calçado que SEMPRE combina com a roupa e contexto
  return {
    category: 'C_OUTRO',
    name: 'Calçado Harmonioso que Combina com a Peça',
    description:
      'Calçado feminino elegante que combine 100% em estilo, cor e contexto com a peça anunciada na foto de referência.',
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
  const isUpper = /\b(blusa|blusinha|blusinhas|blusas|camisa|camiseta|cropped|top|regata|t-shirt|tshirt|casaco|jaqueta|blazer|moletom|sueter|suéter|cardiga|cardigã|cropped rendad[oa]|blusa rendad[oa]|bata|rendada|rendado)\b/i.test(combined);
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
        directiveTextPt: `REGRA DE LOOK COMERCIAL COMPLETO (PARTE INFERIOR COMPLEMENTAR):\nComo o produto anunciado é uma peça superior (${productName}), o modelo veste obrigatoriamente calça jeans masculina clássica de corte reto ou calça casual escura alinhada para compor um look comercial elegante de catálogo.`,
        directiveTextEn: `[MANDATORY COMPLEMENTARY BOTTOM GARMENT - COMMERCIAL LOOK]: The advertised product is an upper garment (${productName}). The model wears matching classic straight-cut dark blue denim jeans. Full complete commercial catalog outfit required.`,
      };
    }
    return {
      type: 'upper_only',
      directiveTextPt: `REGRA DE LOOK COMERCIAL COMPLETO (PARTE INFERIOR COMPLEMENTAR & TÊNIS OBRIGATÓRIOS — PROIBIDO NUDEZ EMBAIXO):\nComo o produto anunciado na foto de referência é exclusivamente uma peça superior (${productName}), a modelo veste OBRIGATORIAMENTE uma CALÇA JEANS feminina clássica de cintura alta em tom azul tradicional (ou jeans claro clássico) com caimento impecável E TÊNIS casual moderno nos pés. É TERMINANTEMENTE PROIBIDO a modelo ficar sem calça, de calcinha, com pernas despidas ou nua na parte de baixo! A blusa/peça superior anunciada é o foco principal (fidelidade 1:1), e a calça jeans com tênis completam o look comercial 100% vestido e realista.`,
      directiveTextEn: `[MANDATORY COMPLEMENTARY JEANS AND SNEAKERS - STRICTLY NO LOWER-BODY NUDITY]: The advertised product in the reference photo is strictly an upper-body piece (${productName}). The model MUST wear complementary bottom clothing: stylish classic high-waisted blue denim jeans, and CASUAL SNEAKERS on her feet. STRICTLY FORBIDDEN FOR THE MODEL TO BE PANTLESS, IN UNDERWEAR ONLY, BARE-LEGGED WITHOUT PANTS, OR NUDE ON THE LOWER BODY! The model is 100% fully dressed in a complete commercial mirror-selfie outfit: reference blouse + classic blue denim jeans + casual sneakers.`,
    };
  }

  if (isLower && !isUpper) {
    if (isMale) {
      return {
        type: 'lower_only',
        directiveTextPt: `REGRA DE LOOK COMERCIAL COMPLETO (PARTE SUPERIOR COMPLEMENTAR):\nComo o produto anunciado é uma peça inferior (${productName}), o modelo veste camiseta básica masculina de manga curta em tom neutro (branca ou preta) com caimento limpo para compor um visual completo de catálogo comercial.`,
        directiveTextEn: `[MANDATORY COMPLEMENTARY TOP GARMENT]: The advertised product is a bottom garment (${productName}). The model wears a matching clean neutral crew-neck t-shirt (white or black). Complete commercial outfit.`,
      };
    }
    return {
      type: 'lower_only',
      directiveTextPt: `REGRA DE LOOK COMERCIAL COMPLETO (PARTE SUPERIOR COMPLEMENTAR):\nComo o produto anunciado na foto de referência é exclusivamente uma peça inferior (${productName}), a modelo veste uma blusa feminina delicada de manga curta ou cropped elegante em tom neutro suave (off-white ou branco) de caimento limpo que harmonize com a peça inferior. A peça inferior anunciada é o foco principal (fidelidade 1:1), e a blusa completa o look comercial realista.`,
      directiveTextEn: `[MANDATORY COMPLEMENTARY TOP GARMENT]: The advertised product in the reference photo is strictly a bottom piece (${productName}). The model wears a complementary top garment: a clean, elegant neutral white or off-white feminine short-sleeve top/blouse that harmonizes with the bottom piece. Full complete commercial outfit required.`,
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
    directiveTextPt: `REGRA DE LOOK COMERCIAL COMPLETO:\nSe a foto de produto anexada for de uma peça superior, a modelo veste calça jeans feminina clássica de cintura alta. Se for peça inferior, veste blusa neutra elegante para compor um visual completo de moda.`,
    directiveTextEn: `[FULL OUTFIT MANDATE]: The model is fully dressed with matching complementary garment (jeans or neutral top) for a complete commercial look.`,
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
  const isBag = isBagProduct(form.productName, form.additionalInstructions);
  const noBagDirectivePt = !isBag
    ? '\n- REGRA OBRIGATÓRIA DE ZERO BOLSAS: A modelo NÃO DEVE usar, segurar ou carregar nenhum tipo de bolsa, bolsa tiracolo, bolsa de mão, carteira, sacola, clutch ou mochila. Mãos e ombros completamente livres de bolsas. Bolsas só podem aparecer se a bolsa for o próprio produto de referência anunciado (o que NÃO é o caso aqui).'
    : '';
  const noBagDirectiveEn = !isBag
    ? '\nMANDATORY CONSTRAINT: NO BAGS, NO PURSES, NO HANDBAGS. The model must NOT wear, hold, or carry any handbag, purse, tote bag, shoulder bag, backpack, clutch or crossbody bag. Both hands and shoulders 100% free of bags.'
    : '';
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
  const hasGalleryModel = Boolean(form.selectedModelGalleryId || form.selectedModelGalleryNumber) && !form.generateModelViaPrompt;

  const accessoriesSectionText = isMale
    ? `Acessórios masculinos discretos (Adaptação Masculina):
- Relógio de pulso masculino elegante e discreto em um dos pulsos.
- Ausência total de colares femininos, pulseiras femininas delicadas ou esmalte colorido. Unhas masculinas curtas e limpas.`
    : form.generateModelViaPrompt || !hasGalleryModel
    ? UNIVERSAL_GOLDEN_ACCESSORIES_PROMPT_BLOCK
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

  

  if (hasGalleryModel) {
    const isModelScenario = (form.modelScenarioSource || 'model') === 'model';
    const isDressOrOnePiece = complementaryInfo.type === 'full_body';
    const isUpperOnly = complementaryInfo.type === 'upper_only';
    const isLowerOnly = complementaryInfo.type === 'lower_only';

    const garmentTypeInstruction = isDressOrOnePiece
      ? '- O PRODUTO DA FOTO 1 É UM VESTIDO / PEÇA ÚNICA COMPLETA: A modelo veste EXCLUSIVAMENTE o vestido/peça única da Foto 1 com máxima fidelidade 1:1.\n' +
        '- PROIBIÇÃO ABSOLUTA DE CALÇA OU SHORTS: É TERMINANTEMENTE PROIBIDO ADICIONAR CALÇA JEANS, CALÇA, SHORTS, BERMUDA OU QUALQUER OUTRA PEÇA INFERIOR. A modelo veste APENAS o vestido da Foto 1 cobrindo o corpo por completo com pernas limpas naturais.\n' +
        '- REGRA CRÍTICA DE COMPRIMENTO (VESTIDO LONGO / SAIA LONGA): Se na Foto 1 o produto for vestido longo ou saia longa que cubra os pés/calçado, MANTENHA O COMPRIMENTO LONGO EXATO 1:1 ATÉ O CHÃO cobrindo os pés. NÃO É OBRIGATÓRIO APARECER O CALÇADO! É TERMINANTEMENTE PROIBIDO encurtar o vestido ou subir a barra para forçar mostrar o calçado.'
      : isUpperOnly
      ? '- O PRODUTO DA FOTO 1 É UMA PEÇA SUPERIOR (BLUSA, BLUSINHA, CROPPED OU PARTE DE CIMA): A modelo veste a peça superior da Foto 1 com máxima fidelidade 1:1, combinada OBRIGATORIAMENTE com CALÇA JEANS feminina clássica de cintura alta (azul tradicional) e TÊNIS casual nos pés. É TERMINANTEMENTE PROIBIDO a modelo ficar sem calça, de calcinha, com pernas despidas ou nua na parte de baixo! Look 100% completo, elegante e comercial com blusa + calça jeans + tênis.\n' +
        '- REGRA DE ENQUADRAMENTO DA CINTURA PARA CIMA (PEÇA SUPERIOR): Como o produto anunciado é uma peça que fica acima da cintura, o enquadramento fotográfico no espelho deve priorizar da cintura para cima (waist-up medium close-up shot), focando diretamente na blusa/peça superior com máxima nitidez de detalhes, decote, caimento e textura.'
      : isLowerOnly
      ? '- O PRODUTO DA FOTO 1 É UMA PEÇA INFERIOR: A modelo veste a peça inferior da Foto 1 com máxima fidelidade 1:1, combinada com uma blusa neutra elegante para compor um look comercial elegante de catálogo.'
      : '- Se o produto for vestido ou macacão, veste EXCLUSIVAMENTE o vestido (sem calça jeans ou shorts por baixo); se for blusa/peça superior, veste CALÇA JEANS clássica de cintura alta e TÊNIS nos pés (TERMINANTEMENTE PROIBIDO ficar sem calça ou nua na parte de baixo); se for calça/short, veste blusa combinando.';

    let galleryModelPrompt = '';

    if (isModelScenario) {
      // MODO PADRÃO (2 FOTOS): Preserva 100% da Modelo E 100% do Cenário da Foto 2, trocando apenas a roupa pelo Produto (Foto 1)
      galleryModelPrompt = `${resolvedPriorityBlock || priorityOverrideBlock}FOTOGRAFIA COMERCIAL VERTICAL 9:16 (1080x1920) COMBINANDO RIGOROSAMENTE AS 2 FOTOS DE REFERÊNCIA:

1. FOTO 1 (PRODUTO — PEÇA DE ROUPA):
- Vestir a modelo com a roupa da Foto 1 com máxima fidelidade 1:1 (mesma cor exata, tonalidade, textura do tecido, caimento, modelagem, decote, mangas e detalhes reais da peça).
${garmentTypeInstruction}
- Calçado nos pés: ${shoeInfo.name} (${shoeInfo.description}), compondo um visual harmonioso e elegante com a peça (se os pés estiverem visíveis; se a Foto 1 for vestido longo cobrindo o calçado, preserve a barra longa até o chão cobrindo o calçado, sem jamais encurtar o vestido para forçar mostrar o calçado; NÃO é obrigatório aparecer calçado em peças longas).
- REGRA CRÍTICA DE ISOLAMENTO TOTAL DA FOTO 1: Da Foto 1 (produto), extraia RIGOROSAMENTE apenas a peça de roupa e tecido. É TERMINANTEMENTE PROIBIDO copiar, mesclar ou misturar o rosto, a cabeça, o cabelo, a pele ou a pose da pessoa da Foto 1! Ignore 100% a pessoa da Foto 1 (ZERO mistura com o rosto da Foto 1). É TERMINANTEMENTE PROIBIDO copiar tatuagens, marcas corporais ou desenhos da pessoa da Foto 1. A modelo gerada deve ter PELE 100% LIMPA, ZERO TATUAGENS em todo o corpo (braços, mãos, pernas, colo e pescoço totalmente livres de tatuagens).
${noBagDirectivePt}${noBagDirectiveEn}

2. FOTO 2 (MODELO E CENÁRIO BASE ABSOLUTO — PRESERVAÇÃO INTEGRAL 1:1):
- A modelo gerada DEVE SER RIGOROSAMENTE A MESMA MULHER DA FOTO 2, NA MESMA POSE DIANTE DO ESPELHO E DENTRO DO MESMO CÔMODO/CENÁRIO DA FOTO 2.
- PRESERVAÇÃO INTEGRAL DE BIOTIPO E IDENTIDADE: reproduza com fidelidade 100% o mesmo corpo, curvas, biotipo, quadris, cintura, pernas, tom de pele natural com poros reais e cabelos (mesma cor, corte e textura da foto da modelo).
- PRESERVAÇÃO INTEGRAL DO CENÁRIO DA FOTO 2 (CENÁRIO DA MODELO): O cômodo de fundo, paredes, piso, espelho, portas, móveis e iluminação natural DEVEM ser 100% preservados e idênticos aos da Foto 2. NÃO altere nem redesenhe o ambiente da Foto 2.
- PRESERVAÇÃO INTEGRAL DE ROSTO, POSE E ENQUADRAMENTO DA FOTO 2: Mantenha RIGOROSAMENTE o mesmo enquadramento, mesmo ângulo, mesma pose e mesma cabeça/rosto da Foto 2. Se na Foto 2 o rosto da modelo aparece (total ou parcialmente), o rosto DEVE APARECER IDENTICAMENTE, com a mesma face, olhos, nariz, boca, cabelo e expressão da mulher da Foto 2 (PROIBIDO cortar a cabeça ou o queixo se o rosto aparece na Foto 2!). Se na Foto 2 o rosto estiver encoberto pelo celular ou cortado no enquadramento, mantenha o mesmo corte original da Foto 2.
- ÚNICA MUDANÇA PERMITIDA: Substituir as roupas que a modelo veste na Foto 2 pela roupa da Foto 1 (respeitando as regras de look completo e calçado harmonioso).

Qualidade fotográfica autêntica de smartphone moderno, textura de pele humana real com poros visíveis, acabamento fosco suave sem brilho excessivo de óleo, sem aspecto de cera ou plástico. ZERO tatuagens.`;
    } else {
      // MODO CENÁRIO DA GALERIA (3 FOTOS): Modelo da Foto 2 + Cenário Independente da Foto 3
      galleryModelPrompt = `${resolvedPriorityBlock || priorityOverrideBlock}FOTOGRAFIA COMERCIAL VERTICAL 9:16 (1080x1920) COMBINANDO RIGOROSAMENTE AS 3 FOTOS DE REFERÊNCIA:

1. FOTO 1 (PRODUTO — PEÇA DE ROUPA):
- Vestir a modelo com a roupa da Foto 1 com máxima fidelidade 1:1 (mesma cor exata, tonalidade, textura do tecido, caimento, modelagem, decote, mangas e detalhes reais da peça).
${garmentTypeInstruction}
- Calçado nos pés: ${shoeInfo.name} (${shoeInfo.description}), compondo um visual harmonioso e elegante com a peça (se os pés estiverem visíveis; se a Foto 1 for vestido longo cobrindo o calçado, preserve a barra longa até o chão cobrindo o calçado, sem jamais encurtar o vestido para forçar mostrar o calçado; NÃO é obrigatório aparecer calçado em peças longas).
- REGRA CRÍTICA DE ISOLAMENTO TOTAL DA FOTO 1: Da Foto 1 (produto), extraia RIGOROSAMENTE apenas a peça de roupa e tecido. É TERMINANTEMENTE PROIBIDO copiar, mesclar ou misturar o rosto, a cabeça, o cabelo, a pele ou a pose da pessoa da Foto 1! Ignore 100% a pessoa da Foto 1 (ZERO mistura com o rosto da Foto 1). É TERMINANTEMENTE PROIBIDO copiar tatuagens, marcas corporais ou desenhos da pessoa da Foto 1. A modelo gerada deve ter PELE 100% LIMPA, ZERO TATUAGENS em todo o corpo (braços, mãos, pernas, colo e pescoço totalmente livres de tatuagens).
${noBagDirectivePt}${noBagDirectiveEn}

2. FOTO 2 (MODELO — IDENTIDADE, ROSTO E POSE 1:1):
- A modelo gerada DEVE SER LITERALMENTE A MESMA MULHER DA FOTO 2.
- PRESERVAÇÃO INTEGRAL DO BIOTIPO DA FOTO 2: reproduza com fidelidade 100% o mesmo corpo, curvas, biotipo, quadris, cintura, pernas, tom de pele natural com poros reais, cabelos (mesma cor, corte e textura da foto da modelo).
- PRESERVAÇÃO INTEGRAL DE ROSTO E ENQUADRAMENTO DA FOTO 2: Se na Foto 2 o rosto da modelo aparece, o rosto DEVE APARECER IDENTICAMENTE ao da Foto 2, com os mesmos traços, olhos, boca e expressão. Se na Foto 2 o rosto estiver encoberto ou fora do quadro, mantenha exatamente o mesmo corte original da Foto 2.
- POSE OBRIGATÓRIA DA FOTO 2: A modelo mantém a mesma pose e mesma atitude diante do espelho da Foto 2.
- DESCONSIDERAR A ROUPA E O CENÁRIO DA FOTO 2: É TERMINANTEMENTE PROIBIDO copiar a roupa que a modelo veste na Foto 2 e PROIBIDO usar o cenário de fundo da Foto 2.

3. FOTO 3 (CENÁRIO INDEPENDENTE DA GALERIA):
- A modelo da Foto 2, vestindo a roupa da Foto 1 de frente para o espelho, está em pé diante do espelho dentro do cômodo da Foto 3.
- Preserve integralmente o cenário real da Foto 3: piso, paredes, portas, espelho e iluminação natural sem alterar nem redesenhar.

Qualidade fotográfica autêntica de smartphone moderno, textura de pele humana real com poros visíveis, acabamento fosco suave sem brilho excessivo de óleo, sem aspecto de cera ou plástico. ZERO tatuagens.`;
    }

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

## 6.1. REGRA MANDATÓRIA DE ZERO BOLSAS (PROIBIÇÃO TOTAL DE BOLSAS)
${isBag ? "O produto anunciado é uma bolsa: a modelo pode apresentar/usar a bolsa de referência." : "A modelo NÃO DEVE estar usando, segurando ou carregando NENHUM tipo de bolsa, bolsa tiracolo, bolsa de mão, bolsa de ombro, carteira, sacola, clutch ou mochila. Mãos e ombros completamente livres de bolsas. Bolsas só podem aparecer se a bolsa for o produto de referência anunciado.\nCRITICAL CONSTRAINT (NO BAGS): The model must NOT wear, carry or hold any handbag, purse, tote bag, shoulder bag, backpack, clutch or crossbody bag. Hands and shoulders must remain 100% free of bags."}


## 7. REGRA UNIVERSAL DE CALÇADO (HARMONIA COM A ROUPA & RESPEITO AO COMPRIMENTO)
Calçado nos pés: **${shoeInfo.name}** (se os pés estiverem visíveis).
Especificação do calçado: ${shoeInfo.description}.
(Observação: Esta regra universal de calçado harmoniza com o look. REGRA CRÍTICA E INVIOLÁVEL DE COMPRIMENTO — VESTIDO/SAIA LONGA: Se a peça for um vestido longo, saia longa, calça flare longa ou qualquer peça longa que desça até o chão ou cubra o calçado na foto de referência, PRESERVE O COMPRIMENTO LONGO EXATO ATÉ O CHÃO IGUAL À REFERÊNCIA. NÃO É OBRIGATÓRIO APARECER O CALÇADO! É TERMINANTEMENTE PROIBIDO encurtar a peça, subir a barra ou transformá-la em midi/curta para forçar mostrar o calçado. Se o vestido/saia longo cobre o calçado, o calçado permanece naturalmente oculto sob o tecido longo que toca o piso). Enquadrar o corpo inteiro naturalmente diante do espelho.

## 7.1. REGRA DE LOOK COMPLETO E PEÇAS COMPLEMENTARES (LOOK COMERCIAL COMPLETO)
${complementaryInfo.directiveTextPt}
${complementaryInfo.directiveTextEn}

## 8. FIDELIDADE ABSOLUTA E SOBERANA AO PRODUTO ANEXADO (1:1 — ZERO INVENÇÃO DE DETALHES)
A foto da peça anexada pelo usuário é a referência soberana e inviolável da roupa (venda real TikTok Shop).
Reproduza a roupa 1:1 com máxima fidelidade: mesma cor exata, tonalidade, textura do tecido, modelagem, comprimento exato da barra, decote, alças, mangas, barra, rendas, transparências, costuras, botões, recortes e estampas.
REGRA DE COMPRIMENTO DE PEÇAS LONGAS: Se for vestido longo ou saia longa que cubra os pés/calçado, o comprimento DEVE ser mantido até o chão cobrindo os pés. Jamais encurte a barra de peças longas para forçar a aparição de calçados; não é obrigatório mostrar calçado em vestidos longos.
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
 * Retorna a coreografia cronológica rica e concisa de movimentos de cada Mestra
 * Baseada 100% no documento da Mestra selecionada
 */
export function getConciseMovementForMaster(
  masterId: AnaMariaMasterId,
  isMale: boolean,
  isUpperOnly: boolean = false
): string {
  if (isUpperOnly) {
    return isMale
      ? `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — FOCO NA PEÇA SUPERIOR):**
- 0s–2.5s: Mão livre sobe até o peitoral e gola da peça superior, tocando o acabamento frontal sob o flash do smartphone.
- 2.5s–5s: Desliza suavemente a mão pelo peitoral até a barra da peça superior; segura sutilmente a lateral da peça demonstrando caimento e elasticidade, soltando com suavidade.
- 5s–7.5s: Gira suavemente cerca de 35 a 45 graus exibindo o caimento lateral e mangas da peça superior diante do espelho.
- 7.5s–10s: Retorna à postura frontal diante do espelho com gesto natural apresentando o caimento da peça superior.
(REGRA: Movimentos focados exclusivamente na peça superior. PROIBIDO tocar, puxar ou alisar calça/bermuda).`
      : `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA CATZA / FOCO NA PEÇA SUPERIOR):**
- 0s–2.5s: A mão livre sobe delicadamente até o colo e decote da blusa, tocando acabamentos frontais sob iluminação com flash do smartphone.
- 2.5s–5s: Desliza suavemente a mão pelo busto até a barra da blusa; segura delicadamente a lateral do tecido demonstrando caimento e elasticidade, soltando com suavidade.
- 5s–7.5s: Gira sutilmente de 35 a 45 graus exibindo o caimento lateral, cavas e mangas da blusa diante do espelho.
- 7.5s–10s: Retorna à postura frontal diante do espelho, alisando delicadamente a parte frontal da blusa em pose natural e estável.
(REGRA: Movimentos focados exclusivamente na blusa/peça superior. PROIBIDO tocar, puxar ou alisar calça, saia ou bermuda).`;
  }

  switch (masterId) {
    case 'mestra_ana_maria':
      return isMale
        ? `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA ANA MARIA):**
- 0s–1.5s: Postura frontal diante do espelho segurando o smartphone; aproxima-se fisicamente um pouco do espelho (sem zoom digital).
- 1.5s–2.7s: Próximo ao espelho, com a mão livre puxa suavemente para fora a lateral/cós demonstrando elasticidade sem exagerar.
- 2.7s–3.3s: Solta naturalmente o tecido; a peça retorna imediatamente ao caimento original.
- 3.3s–4.8s: Gira suavemente cerca de 40–60 graus de lado mostrando o caimento lateral com o celular cobrindo o rosto.
- 4.8s–5.8s: Retorna à posição frontal recuando suavemente à distância original do espelho.
- 5.8s–7s: De frente para o espelho, desliza a mão livre pela parte superior/peitoral em gesto natural.
- 7s–8.5s: Gira de lado novamente mostrando cintura, quadril e silhueta lateral.
- 8.5s–10s: Retorna à posição frontal diante do espelho e relaxa a mão livre.`
        : `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA ANA MARIA):**
- 0s–1.5s: Postura frontal diante do espelho segurando o smartphone; aproxima-se fisicamente um pouco do espelho (sem zoom digital).
- 1.5s–2.7s: Próxima ao espelho, com a mão livre puxa suavemente para fora a lateral/cós do shorts demonstrando elasticidade sem exagerar.
- 2.7s–3.3s: Solta naturalmente o tecido; o shorts retorna imediatamente ao formato original.
- 3.3s–4.8s: Gira suavemente cerca de 40–60 graus de lado mostrando o caimento lateral com o celular cobrindo o rosto.
- 4.8s–5.8s: Retorna à posição frontal recuando suavemente à distância original do espelho.
- 5.8s–7s: De frente para o espelho, desliza a mão livre pela parte superior/peito em gesto delicado sem puxar a blusa.
- 7s–8.5s: Gira de lado novamente mostrando cintura, quadril e silhueta lateral.
- 8.5s–10s: Retorna à posição frontal diante do espelho e relaxa a mão livre.`;

    case 'mestra_iara':
      return isMale
        ? `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA IARA):**
- 0s–1.5s (Elasticidade): Mão livre na lateral segura o tecido e puxa para fora demonstrando elasticidade; solta suavemente.
- 1.5s–3.5s (Demonstração frontal): Retorna a mão ao abdômen e desliza para cima até o peitoral em alisamento suave.
- 3.5s–6.5s (Giro lateral): Rotação gradual em 3/4 até perfil lateral com pequenos ajustes nos pés e discreta transferência de peso.
- 6.5s–7.5s (Retorno frontal): Gira suavemente de volta para a posição frontal, deslizando a palma sobre a frente da peça.
- 7.5s–10s (Pose final): Pequenos ajustes de postura, toque suave no quadril e sutil pose 3/4 finalizando com elegância diante do espelho.`
        : `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA IARA):**
- 0s–1.5s (Elasticidade): Com a mão livre na lateral da peça, segura delicadamente o tecido e puxa para fora; solta suavemente.
- 1.5s–3.5s (Demonstração frontal): Retorna a mão ao abdômen e desliza lentamente para cima até o busto em alisamento suave do tecido.
- 3.5s–6.5s (Giro lateral): Inicia rotação gradual em 3/4 até alcançar perfil lateral com pequenos ajustes nos pés e discreta transferência de peso.
- 6.5s–7.5s (Retorno frontal): Gira o corpo de volta para a posição frontal, deslizando a palma sobre a parte frontal da peça.
- 7.5s–10s (Pose final): Permanece de frente, realizando pequenos ajustes naturais de postura, toque no quadril e sutil pose 3/4 finalizando com elegância.`;

    case 'mestra_duda':
      return isMale
        ? `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA DUDA):**
- 0s–3s: Demonstração da peça com a mão livre tocando a parte frontal superior e deslizando suavemente para baixo pelo tecido.
- 3s–6s: A mão percorre cintura e quadril mostrando a modelagem e o ajuste anatômico da roupa.
- 6s–8.5s: Pequena rotação suave do corpo em 3/4 com discreta transferência de peso entre as pernas, apresentando o caimento lateral.
- 8.5s–10s: Retorno suave para a posição frontal com pequenos gestos naturais apresentando os detalhes da peça diante do espelho.`
        : `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA DUDA):**
- 0s–3s: Demonstração da peça com a mão livre tocando delicadamente a parte frontal superior e deslizando suavemente para baixo pelo tecido.
- 3s–6s: A mão percorre suavemente a cintura, quadril e laterais, demonstrando a modelagem justa e o caimento do tecido.
- 6s–8.5s: Pequena rotação suave do corpo em 3/4 com discreta transferência de peso entre as pernas, apresentando o caimento lateral da roupa.
- 8.5s–10s: Retorno suave para a posição frontal com pequenos gestos naturais apresentando os detalhes e finalizando em pose relaxada diante do espelho.`;

    case 'mestra_nay':
      return isMale
        ? `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA NAY):**
- 0s–2s: Postura natural diante do espelho; a mão livre sobe até o peitoral.
- 2s–4s: Apoia a palma sobre o tecido e inicia deslizamento contínuo para baixo em direção ao abdômen.
- 4s–7s: Deslizamento contínuo descendente passando pelo abdômen, cintura, quadril e coxa, demonstrando caimento e ajuste.
- 7s–10s: Afasta suavemente a mão do tecido, com pequenas transferências de peso entre as pernas e orientação predominantemente frontal.`
        : `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA NAY):**
- 0s–2s: Postura natural diante do espelho; a mão livre sobe suavemente até a região superior/colo da peça.
- 2s–4s: Apoia delicadamente a palma sobre o tecido e inicia deslizamento contínuo para baixo em direção ao abdômen.
- 4s–7s: Deslizamento contínuo descendente passando pelo abdômen inferior, cintura, quadril e parte superior da coxa, demonstrando caimento e ajuste.
- 7s–10s: Afasta suavemente a mão do tecido, com pequenas transferências de peso entre as pernas e orientação predominantemente frontal diante do espelho.`;

    case 'mestra_catza':
      return isMale
        ? `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA CATZA):**
- 0s–3s: Mão livre sobe até a parte superior da peça, tocando peitoral, decote e acabamentos sob o flash do smartphone.
- 3s–6s: Deslizamento suave da mão da parte superior até a cintura e abdômen, demonstrando o ajuste do tecido no corpo.
- 6s–8s: Toques sutis no quadril e laterais com transferência suave de peso entre as pernas em pose diagonal/3/4 elegante.
- 8s–10s: Pose final estável diante do espelho valorizando a peça, com movimentos espontâneos e naturais.`
        : `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS — MESTRA CATZA):**
- 0s–3s: A mão livre sobe até a parte superior da peça, tocando delicadamente colo, decote e acabamentos frontais sob iluminação com flash do smartphone.
- 3s–6s: Deslizamento suave da mão da parte superior até a cintura e abdômen, demonstrando o ajuste anatômico do tecido no corpo.
- 6s–8s: Toques sutis no quadril e laterais com transferência suave de peso entre as pernas em pose diagonal/3/4 elegante.
- 8s–10s: Pose final estável diante do espelho valorizando a peça, com movimentos espontâneos e naturais.`;

    case 'pov_cinta_85k':
      return `**CRONOGRAMA DE MOVIMENTOS (10s POV EM PRIMEIRA PESSOA — 85K):**
- 0s–1.5s: Duas mãos sobre a cama retiram a embalagem plástica ou ajustam os produtos centralizados sobre a superfície.
- 1.5s–3s: Levanta o primeiro produto pelas laterais apresentando a parte frontal à câmera com a estrutura intacta.
- 3s–5s: Apoia o primeiro produto na cama e passa suavemente as mãos alisando o tecido sem deformar.
- 5s–7.5s: Levanta o segundo produto com as duas mãos, apresentando-o de frente e posicionando lado a lado com o primeiro.
- 7.5s–10s: Com o indicador de uma mão, aponta e percorre detalhes reais do produto, finalizando com o produto centralizado e íntegro na cama.`;

    case 'pov_blusinhas_13k':
      return `**CRONOGRAMA DE MOVIMENTOS (10s–12s POV EM PRIMEIRA PESSOA — 13K):**
- 0s–3s: Duas mãos seguram a primeira peça pelas extremidades laterais, mantendo-a aberta e suspensa de frente para a câmera.
- 3s–6s: Abaixa a primeira peça e levanta a segunda peça pelas laterais apresentando a parte frontal de forma limpa e centralizada.
- 6s–9s: Retorna à primeira peça aproximando-a suavemente enquanto a segunda permanece íntegra na cama.
- 9s–12s: Uma mão sustenta a peça enquanto a outra desliza os dedos sobre a superfície do tecido, demonstrando acabamento, textura e caimento real.`;

    default:
      return `**CRONOGRAMA DE MOVIMENTOS (10s CONTÍNUOS):**
- 0s–2s: Postura natural diante do espelho segurando o smartphone, mão livre toca delicadamente a parte frontal da peça.
- 2s–5s: Desliza a palma suavemente pela frente da roupa, passando pelo abdômen e cintura até o quadril.
- 5s–7.5s: Demonstração da elasticidade e ajuste com toque sutil na cintura e lateral.
- 7.5s–10s: Rotação suave do corpo em 3/4 exibindo o caimento lateral e pose final estável.`;
  }
}

/**
 * Constrói o Prompt de Vídeo Enxuto (até 2.500 caracteres)
 * Completo e sem cortes, focado 100% nos movimentos da Mestra e fidelidade da peça
 */
export function buildAnaMariaConciseVideoPrompt(params: {
  productName: string;
  influencer?: AnaMariaInfluencer;
  bodyType?: AnaMariaBodyType;
  presentationMode?: AnaMariaPresentationMode;
  selectedMasterId?: AnaMariaMasterId;
  additionalInstructions?: string;
  hasSelectedScenario?: boolean;
}): string {
  const master = getMasterPromptById(params.selectedMasterId);
  const isMale = params.influencer === 'Homem';
  const isPlusSize = params.bodyType === 'plus_size';
  const hasUserInstructions = Boolean(
    params.additionalInstructions && params.additionalInstructions.trim().length > 0
  );
  const userInstructionsText = hasUserInstructions ? params.additionalInstructions!.trim() : '';

  const complementaryInfo = detectComplementaryGarment(
    params.productName,
    params.additionalInstructions,
    params.influencer
  );
  const isUpperOnly = complementaryInfo.type === 'upper_only';

  const movementsBlock = getConciseMovementForMaster(master.id, isMale, isUpperOnly);

  if (master.isPov) {
    return `Vídeo vertical 9:16 hiper-realista de 10s em perspectiva POV (visão superior em primeira pessoa). Use a imagem inicial anexada como referência soberana.

**FIDELIDADE ABSOLUTA E IMUTÁVEL DAS PEÇAS (1:1):**
Reproduzir as peças sobre a cama com fidelidade 100% à foto de referência: mesma cor, textura, tecido, costuras e modelagem. PROIBIDO inventar botões, fechos, zíperes ou detalhes inexistentes. Não esticar ou deformar as peças.

${movementsBlock}

**REGRAS DE EXECUÇÃO:**
- Take único contínuo sem cortes, zooms ou transições. Gestos suaves e humanos.
- Demonstração 100% silenciosa: sem fala, sem diálogos e sem narração.`.trim();
  }

  const headerLine = `Vídeo vertical 9:16 de 10s hiper-realista vitrine de moda no espelho. Use a imagem de referência anexada como ponto de partida visual absoluto.`;

  const framingBlock =
    `**PRESERVAÇÃO DO ENQUADRAMENTO E DA FOTO ORIGINAL:**\n` +
    `Manter rigorosamente o mesmo ângulo e enquadramento da foto de referência durante todo o vídeo de 10s:\n` +
    `- Se o smartphone cobre o rosto, continue com o aparelho cobrindo o rosto durante todo o vídeo.\n` +
    `- Se não aparece o rosto (corte no queixo), mantenha sem mostrar o rosto sem a câmera inclinar ou subir.\n` +
    `- Se o rosto da modelo aparece (visível total ou parcialmente), continue com o mesmo rosto natural visível.`;

  const garmentFidelityBlock =
    `**FIDELIDADE ABSOLUTA DA PEÇA (1:1):**\n` +
    `A roupa da foto de referência é sagrada e imutável. TERMINANTEMENTE PROIBIDO modificar cor, estampa, tecido, modelagem, decote ou comprimento. Proibido inventar partes, botões, bolsos ou costuras inexistentes. A peça deve se manter 100% fiel à imagem em todos os frames e movimentos.`;

  const identityBlock =
    `**PRESERVAÇÃO DE IDENTIDADE E CENÁRIO:**\n` +
    `Preservar exatamente ${isMale ? 'o modelo masculino' : 'a modelo'} da foto (${isPlusSize ? 'corpo robusto PLUS SIZE preservado sem afinar membros' : 'mesmo corpo, curvas e biotipo'}), cabelos, tom de pele e o cômodo/cenário intacto.`;

  const executionBlock =
    `**REGRAS DE EXECUÇÃO:**\n` +
    `- Take único contínuo sem cortes, zooms ou transições. Movimentos suaves, fluidos e com velocidade humana realista.\n` +
    `- Demonstração 100% silenciosa: sem fala, sem locução e sem movimentar os lábios.`;

  const baseSections = [
    headerLine,
    framingBlock,
    garmentFidelityBlock,
    identityBlock,
    movementsBlock,
    executionBlock,
  ];
  const baseLength = baseSections.join('\n\n').length;
  // Margem de segurança para garantir estritamente <= 2.480 caracteres e nunca cortar o final
  const maxUserChars = Math.max(0, 2480 - baseLength - 40);

  const userBlock = (hasUserInstructions && maxUserChars > 30)
    ? `**INSTRUÇÕES DO USUÁRIO:**\n"${userInstructionsText.length > maxUserChars ? userInstructionsText.slice(0, maxUserChars - 4) + '...' : userInstructionsText}"`
    : '';

  const upperGarmentRule =
    isUpperOnly && !master.isPov
      ? `**REGRA OBRIGATÓRIA DE INTERAÇÃO COM A ROUPA (PEÇA SUPERIOR):**\n` +
        `Como o produto objeto do vídeo é uma peça superior (${params.productName}), a modelo deve interagir, passar a mão e demonstrar EXCLUSIVAMENTE a blusa/peça superior. É TERMINANTEMENTE PROIBIDO à modelo puxar, tocar, alisar ou interagir com a calça, saia ou bermuda (peça de baixo). Toda a movimentação das mãos deve focar exclusivamente na valorização da peça superior anunciada.`
      : '';

  const sections = [
    headerLine,
    framingBlock,
    garmentFidelityBlock,
    upperGarmentRule,
    identityBlock,
    userBlock,
    movementsBlock,
    executionBlock,
  ].filter(Boolean);

  let concise = sections.join('\n\n').trim();

  // Caso exceda 2.500 caracteres, encontra a última frase completa antes do limite (NUNCA corta no meio de palavras ou blocos)
  if (concise.length > 2500) {
    const sub = concise.slice(0, 2490);
    const lastPeriod = Math.max(sub.lastIndexOf('.'), sub.lastIndexOf('\n'));
    if (lastPeriod > 1800) {
      concise = sub.slice(0, lastPeriod + 1).trim();
    }
  }

  return concise;
}

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
  const limit = params.limit || 'unlimited';

  // Se o usuário selecionou até 2.500 caracteres, retorna a versão enxuta inteligente completa
  if (limit === '2500') {
    return buildAnaMariaConciseVideoPrompt(params);
  }

  const master = getMasterPromptById(params.selectedMasterId);
  const mode: AnaMariaPresentationMode =
    params.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');
  const isMale = params.influencer === 'Homem';
  const isPlusSize = params.bodyType === 'plus_size';
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
    if (master.id === 'mestra_ana_maria') {
      base =
        `**MANDATORY REAL PLUS SIZE BODY PRESERVATION:**\n` +
        `Preserve the authentic PLUS SIZE body from the reference image in all frames: voluminous, heavy bust, full curvy hips and thighs, soft abdomen, and realistic proportions. NEVER slim down the model, thin limbs, or transform into a fitness/skinny physique during the rotation.\n\n` +
        base;
    } else {
      base =
        `**PRESERVAÇÃO OBRIGATÓRIA DO CORPO PLUS SIZE REAL:**\n` +
        `Mantenha rigorosamente em todos os frames a estrutura corporal genuinamente PLUS SIZE da imagem de referência: corpo robusto e volumoso, seios grandes e pesados, braços grossos e macios, abdômen com projeção natural e dobras suaves, quadris largos e glúteos volumosos, coxas muito grossas com celulite natural visível e tom de pele morena clara a média com subtom quente. Jamais afinar a modelo, emagrecer membros ou transformar em corpo fitness durante os giros e movimentos.\n\n` +
        base;
    }
  }

  // 3. Regra de Enquadramento e Fidelidade da Imagem Original:
  // Preserva rigorosamente o enquadramento, ângulo e rosto da imagem de referência inicial
  if (!master.isPov && master.id !== 'mestra_ana_maria') {
    // Remove qualquer texto legado de restrição absoluta de rosto ou lábios caso venha no template base
    base = base
      .replace(/\*\*REGRA SUPERIOR INEGOCIÁVEL DE ENQUADRAMENTO[^\n]*\*\*[\s\S]*?(?=\n\n|$)/gi, '')
      .replace(/\*\*REGRA ABSOLUTA DE ENQUADRAMENTO[^\n]*\*\*[\s\S]*?(?=\n\n|$)/gi, '')
      .replace(/\*\*FACE AND CAMERA FRAMING[^\n]*\*\*[\s\S]*?(?=\n\n|$)/gi, '')
      .replace(/Never reveal the model's face\.[^\n]*/gi, '')
      .replace(/The lips, mouth, nose[^\n]*/gi, '')
      .replace(/The camera must remain anchored at chest level and must NEVER tilt upward or drift above the base of the chin[^\n]*/gi, '')
      .replace(/O rosto e os lábios nunca devem aparecer\.[^\n]*/gi, '')
      .replace(/Manter permanentemente o enquadramento rigoroso da base do queixo para baixo[^\n]*/gi, '')
      .replace(/- Não modificar o enquadramento para revelar o rosto ou lábios\./gi, '');

    const framingAndGarmentRule =
      `**PRESERVAÇÃO DO ENQUADRAMENTO E DA FOTO ORIGINAL:**\n` +
      `Manter rigorosamente o mesmo ângulo, enquadramento e perspectiva da foto de referência original durante toda a gravação:\n` +
      `- Se na foto original de referência o smartphone cobre o rosto, durante o vídeo continua com o smartphone cobrindo o rosto.\n` +
      `- Se na foto original não aparece o rosto (enquadramento cortado do queixo para baixo), durante o vídeo continua sem mostrar o rosto e a câmera NUNCA deve subir ou inclinar para cima.\n` +
      `- Se na foto original o rosto da modelo aparece (visível total ou parcialmente), durante o vídeo continua com o rosto visível e natural da modelo da imagem.\n\n` +
      `**FIDELIDADE ABSOLUTA E IMUTÁVEL DA PEÇA DE ROUPA (1:1):**\n` +
      `A roupa da imagem de referência é 100% sagrada e imutável. É TERMINANTEMENTE PROIBIDO ao gerador de vídeo modificar a cor, tom, estampa, tecido, textura, modelagem, caimento, decote, mangas ou comprimento da peça. PROIBIDO inventar partes, botões, bolsos, zíperes ou costuras inexistentes. A peça deve se manter 100% fiel à imagem de referência em todos os frames e movimentos.\n\n`;

    base = framingAndGarmentRule + base;
  }

  // 4. Regra de Interação Restrita para Peça Superior (Blusa, Cropped, Camiseta, Jaqueta)
  const complementaryInfo = detectComplementaryGarment(
    params.productName,
    params.additionalInstructions,
    params.influencer
  );
  const isUpperOnly = complementaryInfo.type === 'upper_only';

  if (isUpperOnly && !master.isPov) {
    const upperGarmentRule =
      `**REGRA OBRIGATÓRIA DE INTERAÇÃO COM A ROUPA (PEÇA SUPERIOR — ${params.productName.toUpperCase()}):**\n` +
      `Como o produto anunciado é uma peça que fica acima da cintura (${params.productName}), a modelo deve tocar, passar a mão e demonstrar EXCLUSIVAMENTE a blusa/peça superior (gola, decote, mangas, busto e barra da blusa).\n` +
      `É TERMINANTEMENTE PROIBIDO à modelo puxar, tocar, alisar ou demonstrar a peça da parte de baixo (calça jeans, calça, saia ou bermuda). A atenção e movimentação das mãos devem focar única e exclusivamente na peça superior do anúncio.\n\n`;
    base = upperGarmentRule + base;
  }

  // 4. Prioridade Soberana das Instruções Adicionais do Usuário (sobrepõe características e movimentos específicos)
  if (hasUserInstructions) {
    if (master.id === 'mestra_ana_maria') {
      base +=
        `\n\n**ADDITIONAL USER INSTRUCTIONS (HIGH PRIORITY):**\n` +
        `"${userInstructionsText}"\n` +
        `Execute the above custom instructions with maximum priority while keeping the choreography, outfit lock and styling faithful.`;
    } else {
      const sovereignHeader = `**PRIORIDADE SOBERANA — INSTRUÇÕES PERSONALIZADAS DO USUÁRIO:**
"${userInstructionsText}"
REGRA DE ADAPTAÇÃO: As instruções personalizadas acima têm PRIORIDADE ABSOLUTA sobre o prompt base da ${master.shortName}.
- Se o usuário especificou características físicas, idade, etnia, cabelo, cor de celular ou acessórios diferentes, substitua apenas esses elementos mantendo todo o restante idêntico.
- Se o usuário especificou algum movimento adicional ou mudança de movimento (ex.: como começar o vídeo ou um gesto específico), integre e priorize esse movimento exatamente no momento indicado pelo usuário, mantendo o restante da coreografia da ${master.shortName} o mais original e fiel possível.\n\n`;
      base = sovereignHeader + base + `\n\n**LEMBRETE FINAL DE PRIORIDADE DO USUÁRIO:** Cumprir rigorosamente: ${userInstructionsText}`;
    }
  }

  if (limit === 'unlimited') {
    return base.trim();
  }

  if (limit === '5000') {
    if (base.length <= 5000) return base.trim();
    return base.slice(0, 4980).trim();
  }

  return base.trim();
}
