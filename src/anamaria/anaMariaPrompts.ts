import {
  AnaMariaFormState,
  AnaMariaInfluencer,
  AnaMariaBodyType,
  AnaMariaShoeCategory,
  AnaMariaShoeOption,
  AnaMariaVideoPromptLimit,
  AnaMariaPresentationMode,
  AnaMariaMasterId,
  AnaMariaDressInspection,
} from './types';
import { isBagProduct } from '../produtos2/produtos2FidelityLock';
import {
  getMasterPromptById,
  UNIVERSAL_PLUS_SIZE_MODULE,
  UNIVERSAL_PLUS_SIZE_ENGLISH_DIRECTIVE,
  UNIVERSAL_MALE_PLUS_SIZE_MODULE,
} from './masterPromptsData';
import { analyzeAnaMariaProductInfo } from './anaMariaProductInfo';

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

// 19- Prompt DH VIP
export const KLING_FIXED_VIDEO_PROMPT = `Create a 10-second ultra-realistic fashion video using the provided image as the EXACT first frame.

**ACTION — FOLLOW THIS EXACT MOVEMENT SEQUENCE:**

0–2s: Starting from the original pose, the model gently holds the dress at the hip with one hand, lightly touching and pulling the skirt fabric to subtly showcase its shape and drape.

2–4s: She releases the skirt and moves the same hand toward the neckline, bringing it close to the camera to highlight the neckline details. Her fingers gently glide over the neckline, showcasing its construction and finish.

4–6s: Her hand slowly moves downward from the neckline, tracing the garment along the torso, waist and hip, highlighting the fit, silhouette and fabric details.

6–8s: She gently turns her body slightly to one side, creating a subtle three-quarter angle to showcase the dress silhouette. NEVER turn her back to the camera or show the back of the garment.

8–10s: She smoothly returns to her original frontal position and finishes in a natural, relaxed pose.

**CAMERA & PHONE LOCK:** Preserve the exact original camera angle, framing, perspective and smartphone position throughout the entire video. The camera must remain completely stationary. If the model holds the phone with both hands, only one hand may be released to perform the movements while the other continuously holds the phone in exactly the original position. Never change the phone's position or orientation.

**IDENTITY & FRAMING:** Preserve the exact original model, body proportions, appearance and facial features. If her face is visible, maintain it consistently. If it is cropped or hidden, preserve the exact original framing without revealing additional facial features.

**ABSOLUTE PRODUCT FIDELITY:** The dress must remain IDENTICAL to the reference image throughout every frame. Preserve its exact color, fabric, texture, cut, neckline, length, seams, stitching, buttons, patterns and all construction details. NEVER redesign, reshape, replace or modify any part of the garment.

Natural, fluid and realistic human movements. No exaggerated gestures, no camera movement, no cuts, no transitions, no additional objects, no speech, no voiceover, no subtitles and no on-screen text.`;

export const SHOE_CONTRAST_COLOR_RULE_PT =
  'REGRA DE COR DO CALÇADO (CONTRASTE OBRIGATÓRIO QUANDO PRÓXIMO À PEÇA): O calçado NUNCA pode ser da mesma cor da peça de roupa que fica próxima ou encostando nele (ex.: se a calça/peça longa for branca ou off-white, o calçado NÃO pode ser branco e deve ter outra cor contrastante e harmônica como caramelo, nude amendoado, preto, marrom ou dourado; se a peça próxima ao pé for preta ou escura, o calçado deve ter cor clara contrastante como branco, off-white, nude claro, prata ou dourado). Se a peça for mais curta e não chegar perto do calçado, não há restrição. A cor fixa é sempre a da imagem de referência do produto; a cor do calçado é que se adapta para contrastar e combinar.';

export const SHOE_CONTRAST_COLOR_RULE_EN =
  '[MANDATORY FOOTWEAR COLOR CONTRAST RULE]: The footwear MUST NEVER be the same color as the clothing piece right next to or touching it (e.g., if pants/sweatpants/long skirt are white or off-white, the shoes MUST NOT be white and must be a contrasting harmonious color such as tan, caramel, black, brown, or gold; if the bottom garment near the feet is black or dark, the shoes must be a contrasting light color such as white, off-white, light nude, silver, or gold). If the garment is short and does not reach near the shoes, there is no restriction. The reference garment color is 100% fixed; only the shoe color adapts.';

/**
 * Seleciona automaticamente uma das 4 opções de calçado (nunca 'outro') com base no NOME DA PEÇA:
 * - Calça social ou pantalona, calça social folgada -> 'sandalia_flatform'
 * - Saia couro, calça jeans, calça social -> 'scarpin'
 * - Roupa de academia, conjunto de academia, cinta modeladora -> 'tenis'
 * - Vestido, saia, conjunto, macacão -> 'sandalia_salto'
 */
export function resolveAutoShoeOptionByProductName(
  productName: string,
  additionalInstructions: string = '',
  dressInspection?: AnaMariaDressInspection
): Exclude<AnaMariaShoeOption, 'outro'> {
  const combined = `${productName} ${additionalInstructions}`.toLowerCase();
  const inspectedCat = dressInspection?.garmentCategory;

  // 1. Roupa de academia, conjunto de academia, cinta modeladora -> Tênis
  if (
    inspectedCat === 'fitness' ||
    /\b(academia|conjunto\s+de\s+academia|roupa\s+de\s+academia|fitness|treino|gym|legging|cinta\s+modeladora|cinta|esportiv|suplex|dry\s*fit|dryfit|bermuda\s+academia|short\s+academia|top\s+academia|macac[aã]o\s+fitness|macaquinho\s+fitness)\b/i.test(
      combined
    )
  ) {
    return 'tenis';
  }

  // Verifica se é conjunto (exceto conjunto de academia que já caiu acima)
  const isConjunto =
    /\b(conjunto|conjuntinho)\b/i.test(combined) ||
    /\b(cal[cç]a|bermuda|short|shorts|saia)\s+(?:e|com|\+)\s+(?:blusa|blusinha|top|cropped|camisa|regata|jaqueta|colete)\b/i.test(
      combined
    ) ||
    /\b(blusa|blusinha|top|cropped|camisa|regata|jaqueta|colete)\s+(?:e|com|\+)\s+(?:cal[cç]a|bermuda|short|shorts|saia)\b/i.test(
      combined
    ) ||
    /\bbermuda\s+e\s+saia\b/i.test(combined);

  // 2. Calça social ou pantalona, calça social folgada -> Sandália Flatform
  if (
    !isConjunto &&
    /\b(pantalona|cal[cç]a\s+social\s+folgada|cal[cç]a\s+folgada|cal[cç]a\s+social\s+ou\s+pantalona|cal[cç]a\s+pantalona|wide\s*leg|palazzo|pantacourt|cal[cç]a\s+larga|cal[cç]a\s+de\s+linho|cal[cç]a\s+linho|cal[cç]a\s+alfaiataria\s+folgada|cal[cç]a\s+alfaiataria\s+larga)\b/i.test(
      combined
    )
  ) {
    return 'sandalia_flatform';
  }

  // 3. Saia couro, calça jeans, calça social -> Scarpin
  if (
    !isConjunto &&
    /\b(saia\s+couro|saia\s+de\s+couro|saia\s+em\s+couro|cal[cç]a\s+jeans|jeans|cal[cç]a\s+social|cal[cç]a\s+alfaiataria|cal[cç]a\s+flare|cal[cç]a\s+skinny|cal[cç]a\s+reta|cal[cç]a\s+sarja|cal[cç]a\s+cargo)\b/i.test(
      combined
    )
  ) {
    return 'scarpin';
  }

  // 4. Vestido, saia, conjunto, macacão -> Sandália de Salto (Modelo Delicado)
  if (
    isConjunto ||
    inspectedCat === 'dress' ||
    /\b(vestido|vestidos|dress|saia|macac[aã]o|macaquinho|jumpsuit|chemise|tubinho)\b/i.test(
      combined
    )
  ) {
    return 'sandalia_salto';
  }

  // 5. Outros tipos de peças (ex.: moletom, camiseta, short casual, blusa, etc.)
  if (/\b(moletom|jogger|camiseta|t-shirt|tshirt|short\s+jeans|bermuda\s+jeans)\b/i.test(combined)) {
    return 'tenis';
  }

  return 'sandalia_salto';
}

export function detectShoeCategory(
  productName: string,
  additionalInstructions: string = '',
  influencer: AnaMariaInfluencer = 'Mulher',
  dressInspection?: AnaMariaDressInspection,
  selectedShoeOption?: AnaMariaShoeOption,
  customShoeText?: string
): { category: AnaMariaShoeCategory; description: string; name: string } {
  const combined = `${productName} ${additionalInstructions}`.toLowerCase();
  const isMale = influencer === 'Homem';

  // Se o usuário selecionou 'outro' e digitou o calçado personalizado
  if (selectedShoeOption === 'outro' && customShoeText && customShoeText.trim().length > 0) {
    const customTrimmed = customShoeText.trim();
    const isCustomTenis = /\b(t[eê]nis|sneaker)\b/i.test(customTrimmed);
    const isCustomChinelo = /\b(chinelo|rasteirinha|flatform|slide)\b/i.test(customTrimmed);
    return {
      category: isCustomTenis ? 'B_TENIS' : isCustomChinelo ? 'A_CHINELO' : 'C_OUTRO',
      name: customTrimmed,
      description: `${customTrimmed} combinando de forma harmônica com a roupa da modelo. ${SHOE_CONTRAST_COLOR_RULE_PT}`,
    };
  }

  // Se há opção explícita (ou resolvida automaticamente para Mulher)
  const resolvedOption: Exclude<AnaMariaShoeOption, 'outro'> =
    selectedShoeOption && selectedShoeOption !== 'outro'
      ? selectedShoeOption
      : resolveAutoShoeOptionByProductName(productName, additionalInstructions, dressInspection);

  if (isMale && !selectedShoeOption) {
    const isFitness =
      dressInspection?.garmentCategory === 'fitness' ||
      /\b(fitness|academia|treino|gym|esportiv|dry\s*fit)\b/i.test(combined);
    if (isFitness) {
      return {
        category: 'B_TENIS',
        name: 'Tênis Esportivo Masculino',
        description: `Tênis masculino esportivo moderno de cano baixo, solado estruturado. ${SHOE_CONTRAST_COLOR_RULE_PT}`,
      };
    }
    return {
      category: 'B_TENIS',
      name: 'Calçado Masculino Harmonioso',
      description: `Calçado masculino moderno que combine com a roupa do modelo. ${SHOE_CONTRAST_COLOR_RULE_PT}`,
    };
  }

  switch (resolvedOption) {
    case 'sandalia_flatform':
      return {
        category: 'A_CHINELO',
        name: 'Sandália feminina flatform de dedo com tiras largas cruzadas e plataforma branca',
        description: `Sandália feminina flatform de dedo com tiras largas cruzadas sobre o peito do pé e plataforma elevada (deixando os dedos aparentes com acabamento moderno e elegante, em tom branco/off-white ou em cor contrastante harmônica caso a barra da calça que encosta no calçado seja branca/clara). ${SHOE_CONTRAST_COLOR_RULE_PT}`,
      };
    case 'scarpin':
      return {
        category: 'C_OUTRO',
        name: 'Scarpin feminino de bico fino com salto baixo e delicado',
        description: `Scarpin feminino fechado na frente de bico fino triangular alongado com salto baixo e delicado, design clássico e elegante que combina perfeitamente com a peça. ${SHOE_CONTRAST_COLOR_RULE_PT}`,
      };
    case 'tenis':
      return {
        category: 'B_TENIS',
        name: 'Tênis casual feminino branco, estilo urbano, com solado baixo',
        description: `Tênis casual feminino estilo urbano com solado baixo reto (na cor branca quando a peça próxima aos pés for escura/colorida ou peça curta, mas OBRIGATORIAMENTE em outra cor contrastante e harmônica — como preto, caramelo, nude escuro ou cinza chumbo — caso a calça/peça que chega próximo ao calçado seja branca ou off-white). ${SHOE_CONTRAST_COLOR_RULE_PT}`,
      };
    case 'sandalia_salto':
    default:
      return {
        category: 'C_OUTRO',
        name: 'SANDÁLIA DE SALTO FEMININA — MODELO DELICADO',
        description: `Sandália de salto feminina — modelo delicado, aberta na frente exibindo os dedos, com tiras finas horizontais delicadas sobre os dedos e o peito do pé, salto fino elegante e acabamento sofisticado. REGRA INVIOLÁVEL DA PARTE INFERIOR DA PEÇA: Preserve 100% o comprimento original da peça; NUNCA encurte a barra para exibir o calçado. ${SHOE_CONTRAST_COLOR_RULE_PT}`,
      };
  }
}

export interface ComplementaryGarmentInfo {
  type: 'upper_only' | 'lower_only' | 'full_body' | 'lingerie' | 'auto';
  directiveTextPt: string;
  directiveTextEn: string;
}

/**
 * REGRA UNIVERSAL DE PEÇAS COMPLEMENTARES E CONTRASTE OBRIGATÓRIO DE COR (MODO ANA MARIA)
 * - Quando a peça gerada for da parte de baixo (calça, bermuda, saia, short), a parte de cima criada pelo app
 *   DEVE SEMPRE ser em COR CONTRASTANTE mas que combine e fique harmônica (para o robô do TikTok não confundir uma peça com a outra).
 * - Quando a peça gerada for da parte de cima (blusa, top, cropped, camisa, jaqueta, etc.), a parte de baixo criada pelo app
 *   DEVE SEMPRE ser em COR CONTRASTANTE mas que combine e fique harmônica.
 * - Porém, quando for um CONJUNTO (ex: bermuda e saia, calça e blusinha, calça e top, calça e blusa, bermuda e blusa, conjunto de academia, etc.)
 *   ou peça de corpo inteiro (vestido, macacão), AMBAS as peças são reproduzidas 100% como na imagem de referência (mesmas cores exatas da foto de referência).
 */
export function detectComplementaryGarment(
  productName: string,
  additionalInstructions: string = '',
  influencer: AnaMariaInfluencer = 'Mulher',
  dressInspection?: AnaMariaDressInspection
): ComplementaryGarmentInfo {
  const combined = `${productName} ${additionalInstructions}`.toLowerCase();
  const isMale = influencer === 'Homem';
  const inspectedCat = dressInspection?.garmentCategory;
  const inspectedIsDress =
    inspectedCat === 'dress' ||
    (dressInspection?.lengthCategory !== undefined &&
      dressInspection.lengthCategory !== 'unknown' &&
      inspectedCat !== 'upper' &&
      inspectedCat !== 'lower');

  // Detecta CONJUNTO explicitamente (ex: "conjunto", "calça e blusinha", "calça e top", "calça e blusa", "bermuda e blusa", "bermuda e saia", etc.)
  const isConjunto =
    /\b(conjunto|conjuntinho)\b/i.test(combined) ||
    /\b(cal[cç]a|bermuda|short|shorts|saia)\s+(?:e|com|\+)\s+(?:blusa|blusinha|top|cropped|camisa|regata|jaqueta|colete|casaco|blazer)\b/i.test(
      combined
    ) ||
    /\b(blusa|blusinha|top|cropped|camisa|regata|jaqueta|colete|casaco|blazer)\s+(?:e|com|\+)\s+(?:cal[cç]a|bermuda|short|shorts|saia)\b/i.test(
      combined
    ) ||
    /\bbermuda\s+e\s+saia\b/i.test(combined);

  const isFullBody =
    isConjunto ||
    inspectedIsDress ||
    /\b(vestido|longo|midi|macacao|macacão|macaquinho|jumpsuit|pijama completo|robe e pijama|terno completo)\b/i.test(
      combined
    );
  const isLingerie =
    !isConjunto &&
    (inspectedCat === 'sleepwear' ||
      /\b(lingerie|suti[aã]|calcinha|babydoll|baby doll|camisola|corselet|cinta modeladora|body de renda)\b/i.test(
        combined
      ));
  const isUpper =
    !isFullBody &&
    (inspectedCat === 'upper' ||
      /\b(blusa|blusinha|blusinhas|blusas|camisa|camiseta|cropped|top|regata|t-shirt|tshirt|casaco|jaqueta|blazer|moletom|sueter|suéter|cardiga|cardigã|cropped rendad[oa]|blusa rendad[oa]|bata|rendada|rendado|colete)\b/i.test(
        combined
      ));
  const isLower =
    !isFullBody &&
    (inspectedCat === 'lower' ||
      /\b(calca|calça|jeans|short|shorts|bermuda|saia|minissaia|pantacourt|pantalona|legging|pant|pants)\b/i.test(
        combined
      ));

  if (isFullBody) {
    return {
      type: 'full_body',
      directiveTextPt: isConjunto
        ? `REGRA DE CONJUNTO COMPLETO (FIDELIDADE 100% NAS DUAS PEÇAS): O produto anunciado (${productName}) é um CONJUNTO. Reproduza AMBAS as peças (parte de cima e parte de baixo) EXATAMENTE como estão na imagem de referência, mantendo 100% as mesmas cores, tecidos, recortes e detalhes da foto de referência.`
        : 'O produto anunciado é uma peça de corpo inteiro (vestido/macacão). A modelo veste exclusivamente a peça completa conforme as fotos de referência, mantendo 100% a cor e comprimento originais.',
      directiveTextEn: isConjunto
        ? `[FULL MATCHING SET - 1:1 EXACT REPRODUCTION OF BOTH PIECES]: The advertised product (${productName}) is a two-piece set (conjunto). Reproduce BOTH top and bottom pieces 100% identically to the reference image, keeping the exact colors, fabric, cut, and details from the reference photo.`
        : 'The advertised product is a full-body garment (dress/jumpsuit). The model wears the exact full garment according to the reference photos.',
    };
  }

  if (isUpper && !isLower) {
    if (isMale) {
      return {
        type: 'upper_only',
        directiveTextPt: `REGRA DE PARTE DE BAIXO EM COR CONTRASTANTE HARMÔNICA (SEPARAÇÃO VISUAL PARA O ROBÔ DO TIKTOK):\nComo o produto anunciado é uma peça da parte de cima (${productName}), a peça superior deve ter EXATAMENTE a cor e detalhes da imagem de referência (1:1), enquanto a calça complementar criada pelo app DEVE SEMPRE ser em COR CONTRASTANTE que combine e fique harmônica (NUNCA da mesma cor da peça de cima: se a blusa/camisa for clara/branca, use calça escura preta/marinho/jeans escuro; se a peça de cima for preta/escura, use calça clara bege/off-white/jeans claro).`,
        directiveTextEn: `[MANDATORY CONTRASTING BOTTOM GARMENT]: The advertised product is an upper garment (${productName}). Keep the upper garment 100% in its exact reference color, and dress the model in pants of a CONTRASTING YET HARMONIOUS COLOR (NEVER the same color as the top, so top and bottom have clear visual separation).`,
      };
    }
    return {
      type: 'upper_only',
      directiveTextPt: `REGRA OBRIGATÓRIA DE PARTE DE BAIXO EM COR CONTRASTANTE E HARMÔNICA (PROIBIDO NUDEZ E PROIBIDO MESMA COR DA BLUSA):\nComo o produto anunciado na foto de referência é uma peça da parte de cima (${productName}), a peça superior deve ser reproduzida com fidelidade 1:1 na EXATA COR da foto de referência, e a parte de baixo criada pelo app (calça feminina elegante / calça jeans de cintura alta) DEVE SEMPRE SER EM COR CONTRASTANTE MAS QUE COMBINE E FIQUE HARMÔNICA com a peça de cima (para que o robô de análise de vídeo do TikTok jamais confunda uma peça como continuação da outra!).\n- Se a peça de cima (blusa/top/cropped/camisa/jaqueta) for ESCURA (preta, marrom café, azul-marinho, vinho, verde escuro, etc.), a calça de baixo deve ser CLARA CONTRASTANTE (off-white, bege claro, creme ou jeans azul claro).\n- Se a peça de cima for CLARA (branca, off-white, bege, creme, rosa bebê, etc.), a calça de baixo deve ser ESCURA CONTRASTANTE (jeans azul escuro índigo, preta, marrom escuro ou grafite).\n- NUNCA gere a parte de baixo da mesma cor da parte de cima! É TERMINANTEMENTE PROIBIDO a modelo ficar sem calça ou de calcinha na parte de baixo.`,
      directiveTextEn: `[MANDATORY CONTRASTING BOTTOM GARMENT - CLEAR VISUAL SEPARATION BETWEEN TOP AND BOTTOM]: The advertised product in the reference photo is strictly an upper-body piece (${productName}). Keep the upper piece 100% in its exact reference color, and dress the model in complementary high-waisted pants/jeans in a CONTRASTING YET HARMONIOUS COLOR (NEVER the same color as the upper garment, so TikTok's AI video analysis never confuses top and bottom as a single continuous garment! If the top is dark/black/navy/brown -> use contrasting light off-white, cream, light beige, or light-wash blue jeans; if the top is white/off-white/light -> use contrasting dark indigo jeans, black, or espresso pants). STRICTLY NO LOWER-BODY NUDITY.`,
    };
  }

  if (isLower && !isUpper) {
    if (isMale) {
      return {
        type: 'lower_only',
        directiveTextPt: `REGRA DE PARTE DE CIMA EM COR CONTRASTANTE HARMÔNICA:\nComo o produto anunciado é uma peça da parte de baixo (${productName}), ela deve manter 100% a cor da foto de referência, e a camiseta masculina na parte de cima DEVE SEMPRE ser em COR CONTRASTANTE e harmônica (se a calça/bermuda for clara, camiseta preta/escura; se for escura, camiseta branca/off-white).`,
        directiveTextEn: `[MANDATORY CONTRASTING TOP GARMENT]: The advertised product is a bottom garment (${productName}) in its exact reference color. The model wears a crew-neck t-shirt in a CONTRASTING YET HARMONIOUS COLOR (never the same color as the bottom piece).`,
      };
    }
    return {
      type: 'lower_only',
      directiveTextPt: `REGRA OBRIGATÓRIA DE PARTE DE CIMA EM COR CONTRASTANTE E HARMÔNICA (SEPARAÇÃO VISUAL PARA O ROBÔ DO TIKTOK):\nComo o produto anunciado na foto de referência é uma peça da parte de baixo (${productName} — calça, bermuda ou saia), a peça de baixo deve ser reproduzida com fidelidade 1:1 na EXATA COR da imagem de referência, enquanto a peça da parte de cima (blusa feminina elegante ou cropped/top de caimento limpo) criada pelo app para a modelo não ficar nua DEVE SEMPRE SER EM COR CONTRASTANTE MAS QUE COMBINE E FIQUE HARMÔNICA (para que o robô de análise do TikTok nunca confunda uma peça com a outra achando que uma é continuação da outra!).\n- Se a peça de baixo (calça, bermuda ou saia) for CLARA (branca, off-white, bege, areia, creme, jeans claro, etc.), a blusa/top da parte de cima DEVE ser ESCURA CONTRASTANTE e elegante (preta, marrom café/espresso, azul-marinho ou vinho escuro).\n- Se a peça de baixo for ESCURA (preta, jeans escuro, marrom, azul-marinho, verde militar, couro preto/marrom, etc.), a blusa/top da parte de cima DEVE ser CLARA CONTRASTANTE e elegante (branca, off-white, manteiga/creme ou bege claro).\n- Se a peça de baixo for COLORIDA VIVA, escolha um tom neutro contrastante (branco/off-white ou preto) que destaque onde termina a blusa e onde começa a cintura da peça de baixo. NUNCA use a mesma cor da peça de baixo na blusa de cima!`,
      directiveTextEn: `[MANDATORY CONTRASTING TOP GARMENT - CLEAR VISUAL SEPARATION FOR TIKTOK ANALYSIS]: The advertised product in the reference photo is strictly a lower-body piece (${productName} — pants, shorts/bermuda, or skirt). Reproduce the lower piece 100% in its exact reference color, while the complementary top/blouse created by the app MUST ALWAYS BE IN A CONTRASTING YET HARMONIOUS COLOR (NEVER the same color as the bottom piece, so TikTok's AI video analysis never mistakes top and bottom for a single continuous piece! If the bottom piece is white, off-white, beige, cream, or light -> the top MUST be a contrasting dark color like black, espresso brown, or deep navy; if the bottom piece is black, dark denim, dark brown, or dark -> the top MUST be a contrasting light color like crisp white, off-white, or cream).`,
    };
  }

  if (isLingerie) {
    return {
      type: 'lingerie',
      directiveTextPt: `REGRA DE MODA ÍNTIMA / CINTA MODELADORA:\nSe for cinta modeladora ou peça avulsa, mantenha a cor exata da peça de referência e combine as demais peças em tom contrastante harmônico, preservando estética comercial elegante.`,
      directiveTextEn: `[COORDINATED COMMERCIAL AESTHETIC]: Reproduce the reference piece in its exact reference color with harmonious contrasting complementary styling.`,
    };
  }

  return {
    type: 'auto',
    directiveTextPt: `REGRA DE LOOK COMERCIAL COMPLETO:\nReproduza fielmente a peça mostrada na foto de produto anexada na sua cor exata de referência (se for peça única ou conjunto, reproduza o look completo; se for peça avulsa de cima ou de baixo, a peça complementar criada pelo app deve estar em cor contrastante e harmônica).`,
    directiveTextEn: `[FULL OUTFIT MANDATE]: Reproduce the exact garment from the product photo in its exact reference color (if a separate top or bottom piece, the complementary piece must be in a contrasting yet harmonious color).`,
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

function buildDressLengthAndSlitDirectives(
  productName: string,
  additionalInstructions = '',
  dressInspection?: AnaMariaDressInspection
): {
  imageLengthRule: string;
  imageSlitRule: string;
  videoSlitRule: string;
} {
  const combined = `${productName} ${additionalInstructions}`.toLowerCase();
  const isDressContext = /\b(vestido|vestidos|dress|dresses|chemise|tubinho|midi|longo)\b/i.test(combined);
  if (!isDressContext && !dressInspection) {
    return { imageLengthRule: '', imageSlitRule: '', videoSlitRule: '' };
  }

  const imageLengthRule =
    '- PRESERVAÇÃO 1:1 INTEGRAL DO COMPRIMENTO, COSTURAS, ESTAMPA E PARTE INFERIOR DA PEÇA: Reproduza 100% da construção original da peça do topo até a barra inferior exatamente como na foto de referência do produto. É TERMINANTEMENTE PROIBIDO encurtar a peça, comer ou cortar a parte de baixo do vestido/saia, alterar o formato da barra, mudar babados/recortes inferiores, modificar linhas de costura ou alterar o padrão de estampa e textura em qualquer parte da peça (nem em cima nem embaixo).';

  let imageSlitRule = '';
  let videoSlitRule = '';
  if (
    dressInspection?.hasSingleSideSlit &&
    (dressInspection.slitLegWearer === 'left' || dressInspection.slitLegWearer === 'right')
  ) {
    const isLeft = dressInspection.slitLegWearer === 'left';
    const wearerLegPt = isLeft ? 'PERNA ESQUERDA' : 'PERNA DIREITA';
    const otherLegPt = isLeft ? 'PERNA DIREITA' : 'PERNA ESQUERDA';
    const wearerLegEn = isLeft ? 'LEFT leg' : 'RIGHT leg';
    const otherLegEn = isLeft ? 'RIGHT leg' : 'LEFT leg';
    const viewerSideEn = isLeft ? "viewer's RIGHT side" : "viewer's LEFT side";

    imageSlitRule =
      `[ASSIMETRIA OBRIGATÓRIA DE FENDA ÚNICA]: O vestido possui APENAS UMA ÚNICA FENDA LATERAL localizada exclusivamente na ${wearerLegPt} da modelo. A ${otherLegPt} DEVE permanecer 100% COBERTA por tecido contínuo fechado sem nenhuma fenda! É TERMINANTEMENTE PROIBIDO gerar fenda dupla simétrica nas duas pernas.\n` +
      `[CRITICAL ANTI-SYMMETRY SINGLE-SLIT LOCK]: The dress has ONLY ONE SINGLE asymmetric side slit exclusively on the model's ${wearerLegEn} (${viewerSideEn}). The opposite leg (${otherLegEn}) MUST stay 100% CLOSED solid continuous fabric with ZERO slit — strictly ONE slit on ONLY ONE leg, NO symmetrical double slits!`;

    videoSlitRule =
      `**PRESERVAÇÃO OBRIGATÓRIA DE FENDA ÚNICA ASSIMÉTRICA (REGRA ANTI-SIMETRIA DE VÍDEO):**\n` +
      `O vestido possui APENAS UMA ÚNICA fenda lateral localizada exclusivamente na ${wearerLegPt} da modelo. Durante todos os movimentos e giros do vídeo, mantenha a fenda ÚNICA somente na ${wearerLegPt} e mantenha a ${otherLegPt} 100% fechada e coberta por tecido sólido contínuo (TERMINANTEMENTE PROIBIDO duplicar ou inventar uma segunda fenda simétrica na outra perna / STRICTLY ONE asymmetric side slit exclusively on the model's ${wearerLegEn}; opposite ${otherLegEn} stays 100% covered with ZERO slit).`;
  }

  return { imageLengthRule, imageSlitRule, videoSlitRule };
}

export function buildAnaMariaImagePrompt(
  form: AnaMariaFormState,
  scenarioRoom: AnaMariaRoomType = 'hall_espelho',
  dressInspection?: AnaMariaDressInspection
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
  const shoeInfo = detectShoeCategory(
    form.productName,
    form.additionalInstructions,
    form.influencer,
    dressInspection,
    form.selectedShoeOption,
    form.customShoeText
  );
  const isBag = isBagProduct(form.productName, form.additionalInstructions);
  const noBagDirectivePt = !isBag
    ? '\n- REGRA OBRIGATÓRIA DE ZERO BOLSAS: A modelo NÃO DEVE usar, segurar ou carregar nenhum tipo de bolsa, bolsa tiracolo, bolsa de mão, carteira, sacola, clutch ou mochila. Mãos e ombros completamente livres de bolsas. Bolsas só podem aparecer se a bolsa for o próprio produto de referência anunciado (o que NÃO é o caso aqui).'
    : '';
  const noBagDirectiveEn = !isBag
    ? '\nMANDATORY CONSTRAINT: NO BAGS, NO PURSES, NO HANDBAGS. The model must NOT wear, hold, or carry any handbag, purse, tote bag, shoulder bag, backpack, clutch or crossbody bag. Both hands and shoulders 100% free of bags.'
    : '';
  const complementaryInfo = detectComplementaryGarment(
    form.productName,
    form.additionalInstructions,
    form.influencer,
    dressInspection
  );
  const { imageLengthRule, imageSlitRule } = buildDressLengthAndSlitDirectives(
    form.productName,
    form.additionalInstructions,
    dressInspection
  );

  const hasUserInstructions = Boolean(
    form.additionalInstructions && form.additionalInstructions.trim().length > 0
  );
  const userInstructionsText = hasUserInstructions ? form.additionalInstructions.trim() : '';
  const productInfoSpec = analyzeAnaMariaProductInfo(form.productInfo);

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
Preservar com fidelidade absoluta (1:1) a cor exata, modelagem, corte, decote, costuras, textura do tecido, botões, rendas ou estampas do produto anexado. Nunca modificar ou redesenhar a construção da peça.${
  productInfoSpec.hasInfo ? `\n${productInfoSpec.promptBlockPt}` : ''
}

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

  const scenarioRelightRulePt = `- FOTOGRAFIA ÚNICA NATIVA NO CÔMODO (ZERO MONTAGEM / ZERO COLAGEM / ZERO CONTORNO BRANCO): A imagem DEVE ser renderizada como uma única fotografia real capturada em exposição única dentro do cômodo do CENÁRIO — nunca como recorte ou sobreposição.
- PERSPECTIVA 3D, ESCALA E ANCORAGEM FÍSICA NO PISO: Alinhe a escala corporal, a altura do horizonte da câmera, a distância focal e a perspectiva dos pés ao plano geométrico real do piso e rodapés do CENÁRIO. Os pés/calçado (ou a barra longa) apoiam-se firmemente no chão, projetando sombra de contato escura sob a sola/salto, oclusão de ambiente nos tornozelos/barra e sombra projetada suave no piso coerente com a direção da luz do quarto.
- REILUMINAÇÃO FÍSICA GLOBAL & TRANSIÇÃO ÓPTICA DE BORDAS: Descarte 100% a iluminação de estúdio ou parede clara da foto original da modelo/produto. Reilumine pele, rosto, cabelos e tecido obedecendo exclusivamente à luz ambiente, temperatura de cor (quente/fria), contraste, reflexos indiretos das paredes/cortinas e grão óptico da câmera do CENÁRIO, com fusão sub-pixel orgânica nos fios de cabelo, ombros e braços (ZERO linha branca, ZERO halo claro, ZERO borda dura de máscara).`;

  const isScenario24Active =
    form.selectedScenarioId === 'cenario_24' ||
    Number(form.selectedScenarioNumber) === 24 ||
    ((form.modelScenarioSource || 'model') === 'model' &&
      hasGalleryModel &&
      (Number(form.selectedModelGalleryNumber) === 5 ||
        form.selectedModelGalleryId === 'modelo_5_catza' ||
        form.selectedModelGalleryId === 'modelo_sem_rosto_5_catza' ||
        form.selectedModelGalleryId === 'modelo_26_catza_corpo'));

  const scenario24FlashRulePt = isScenario24Active
    ? `\n- [REGRA OBRIGATÓRIA DO CENÁRIO 24 — FLASH DO CELULAR SEMPRE LIGADO]: Na imagem gerada no Cenário 24, o FLASH DA CÂMERA TRASEIRA DO CELULAR da modelo DEVE ESTAR SEMPRE LIGADO E BRILHANDO INTENSAMENTE no espelho (ponto luminoso branco intenso com estrela de luz / bright glowing camera flash starburst on the back of the smartphone), iluminando a modelo e a roupa com luz frontal quente de flash contra o ambiente mais escuro do Cenário 24, INDEPENDENTEMENTE de qual modelo foi escolhida!`
    : '';

  const scenarioSection = hasSelectedScenario
    ? `## 4. PRESERVAÇÃO INTEGRAL DO CENÁRIO INDEPENDENTE (${scenarioTitle.toUpperCase()})
A foto de cenário anexada é a autoridade visual absoluta do ambiente e da iluminação.
Preserve integralmente todo o cômodo da foto de referência: piso, paredes, portas, cama/móveis, cortinas e arquitetura.
NÃO redesenhe e NÃO gere um ambiente diferente. Fotografe ${isMale ? 'o modelo' : 'a modelo'} fisicamente presente e em pé sobre o piso real dentro deste exato cômodo em uma única captura óptica natural.
${scenarioRelightRulePt}${scenario24FlashRulePt}`
    : `## 4. CENÁRIO RESIDENCIAL E AMBIENTE
${scenarioText}${scenario24FlashRulePt}`;

  const phonePostureSection = `## 5. SMARTPHONE, ILUMINAÇÃO E POSTURA (${master.shortName.toUpperCase()})
${
  isMale
    ? 'O modelo segura um smartphone moderno com uma das mãos diante do espelho de corpo inteiro.'
    : (userPhoneDirectivePt || 'A modelo segura um smartphone moderno com uma das mãos diante do espelho de corpo inteiro (respeitando eventual cor de celular solicitada nas instruções adicionais).')
}
${master.lightingAndCameraText}${scenario24FlashRulePt}
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

    const dressDetailDirective = [imageLengthRule, imageSlitRule].filter(Boolean).join('\n');
    const garmentTypeInstruction = isDressOrOnePiece
      ? `- O PRODUTO DA FOTO 1 É UM VESTIDO / MACACÃO / CONJUNTO COMPLETO: A modelo veste EXCLUSIVAMENTE a peça/conjunto completo da Foto 1 com máxima fidelidade 1:1 (mesmas cores exatas da foto de referência).\n` +
        `- ${complementaryInfo.directiveTextPt}\n` +
        `- Calçado obrigatório nos pés (se visíveis): ${shoeInfo.name} (${shoeInfo.description}).` +
        (dressDetailDirective ? `\n${dressDetailDirective}` : '')
      : isUpperOnly
      ? `- O PRODUTO DA FOTO 1 É UMA PEÇA DA PARTE DE CIMA (${form.productName}): A modelo veste a peça superior da Foto 1 com máxima fidelidade 1:1 na EXATA COR da foto de referência, combinada OBRIGATORIAMENTE com uma peça da parte de baixo (calça feminina elegante / calça jeans de cintura alta) em COR CONTRASTANTE MAS QUE COMBINE E FIQUE HARMÔNICA (NUNCA da mesma cor da peça de cima, para que o robô do TikTok jamais confunda uma peça como continuação da outra!).\n` +
        `- ${complementaryInfo.directiveTextPt}\n` +
        `- Calçado obrigatório nos pés: ${shoeInfo.name} (${shoeInfo.description}).`
      : isLowerOnly
      ? `- O PRODUTO DA FOTO 1 É UMA PEÇA DA PARTE DE BAIXO (${form.productName}): A modelo veste a peça inferior da Foto 1 com máxima fidelidade 1:1 na EXATA COR da foto de referência, combinada OBRIGATORIAMENTE com uma parte de cima (blusa feminina elegante ou top/cropped de caimento limpo) em COR CONTRASTANTE MAS QUE COMBINE E FIQUE HARMÔNICA (NUNCA da mesma cor da peça de baixo, para que o robô do TikTok jamais confunda uma peça como continuação da outra!).\n` +
        `- ${complementaryInfo.directiveTextPt}\n` +
        `- Calçado obrigatório nos pés: ${shoeInfo.name} (${shoeInfo.description}).`
      : `- Reproduza com máxima fidelidade 1:1 o produto da Foto 1 na sua cor exata de referência, com calçado ${shoeInfo.name} (${shoeInfo.description}) nos pés.\n` +
        `- ${complementaryInfo.directiveTextPt}` +
        (dressDetailDirective ? `\n${dressDetailDirective}` : '');

    const galleryFaceFramingRule2Img = isFaceVisible
      ? '- PRESERVAÇÃO INTEGRAL DE ROSTO, POSE E ENQUADRAMENTO DA FOTO 2 (MODO COM ROSTO UGC): Mantenha RIGOROSAMENTE o mesmo enquadramento, mesmo ângulo, mesma pose e mesmo rosto da Foto 2. O rosto da modelo DEVE APARECER IDENTICAMENTE, com a mesma face, olhos, nariz, boca, cabelo e expressão da mulher da Foto 2 (PROIBIDO cortar a cabeça ou esconder o rosto!).'
      : '- PROIBIÇÃO ABSOLUTA DE MOSTRAR ROSTO — ENQUADRAMENTO SEM ROSTO DA FOTO 2 (MODO MIRROR SELFIE SEM ROSTO): Neste modo SEM ROSTO, é TERMINANTEMENTE PROIBIDO mostrar o rosto, olhos, nariz ou testa da modelo! Mantenha RIGOROSAMENTE o enquadramento sem rosto da Foto 2 (corte exato na altura da base do queixo para baixo ou rosto 100% oculto pelo celular exatamente como na Foto 2 — NUNCA desenhe ou revele cabeça ou rosto descoberto acima do queixo ou do celular!).';

    const galleryFaceFramingRule3Img = isFaceVisible
      ? '- PRESERVAÇÃO INTEGRAL DA MODELO COM ROSTO DA FOTO 2 (MODO COM ROSTO UGC): A mulher fotografada DEVE SER RIGOROSAMENTE A MESMA MODELO DA FOTO 2, reproduzindo 100% a mesma identidade facial (mesmo rosto, olhos, nariz, boca e expressão da Foto 2), mesmos cabelos, mesmo tom de pele, mesmas curvas corporais e mesma postura de selfie da Foto 2.'
      : '- PRESERVAÇÃO INTEGRAL DA MODELO DA FOTO 2 & PROIBIÇÃO ABSOLUTA DE ROSTO (MODO MIRROR SELFIE SEM ROSTO): A mulher fotografada DEVE SER RIGOROSAMENTE A MESMA MODELO SELECIONADA NA FOTO 2 (reproduza 100% o mesmo corpo, mesmas curvas, mesmo quadril, mesma cintura, mesmo busto, mesmas pernas, mesmo tom de pele, mesmos cabelos caindo nos ombros, mesmas mãos/acessórios e mesma postura de selfie da Foto 2). REGRA SOBERANA SEM ROSTO: É TERMINANTEMENTE PROIBIDO mostrar o rosto, olhos, nariz ou testa na imagem gerada! Mantenha o enquadramento sem rosto da Foto 2 (corte na altura da base do queixo para baixo ou rosto 100% encoberto pelo celular exatamente como na Foto 2 — NUNCA invente ou mostre rosto descoberto!).';

    let galleryModelPrompt = '';

    if (isModelScenario) {
      // MODO PADRÃO (2 FOTOS): Preserva 100% da Modelo E 100% do Cenário da Foto 2, trocando apenas a roupa pelo Produto (Foto 1)
      galleryModelPrompt = `${resolvedPriorityBlock || priorityOverrideBlock}FOTOGRAFIA COMERCIAL VERTICAL 9:16 (1080x1920) COMBINANDO RIGOROSAMENTE AS 2 FOTOS DE REFERÊNCIA:

1. FOTO 1 (PRODUTO — PEÇA DE ROUPA COM FIDELIDADE 100% DE CIMA A BAIXO):
- Vestir a modelo com a roupa da Foto 1 com fidelidade absoluta 1:1 do topo até a barra inferior (mesma cor exata, mesmo padrão de estampa sem alterar os desenhos, mesma textura do tecido, mesmas linhas de costura, recortes, babados, pregas, caimento, formato da saia/barra, comprimento exato da peça, decote, alças e mangas).
- PROIBIÇÃO TOTAL DE ALTERAR OU ENCURTAR A PEÇA: É TERMINANTEMENTE PROIBIDO encurtar a peça, comer ou cortar a parte de baixo do vestido/saia, mudar o formato da barra, omitir costuras ou modificar a estampa/textura em qualquer parte da peça (nem na parte de cima nem na parte de baixo).
${garmentTypeInstruction}${productInfoSpec.hasInfo ? `\n${productInfoSpec.promptBlockPt}` : ''}
- Calçado nos pés: ${shoeInfo.name} (${shoeInfo.description}), substituindo qualquer sapato/tênis original da Foto 2 caso os pés fiquem visíveis pelo comprimento original da peça (NUNCA encurte ou levante a barra da peça da Foto 1 para mostrar os pés/calçado!).
- REGRA CRÍTICA DE ISOLAMENTO TOTAL DA FOTO 1: Da Foto 1 (produto), extraia RIGOROSAMENTE apenas a peça de roupa e tecido. É TERMINANTEMENTE PROIBIDO copiar, mesclar ou misturar o rosto, a cabeça, o cabelo, a pele ou a pose da pessoa da Foto 1! Ignore 100% a pessoa da Foto 1 (ZERO mistura com o rosto da Foto 1). É TERMINANTEMENTE PROIBIDO copiar tatuagens, marcas corporais ou desenhos da pessoa da Foto 1. A modelo gerada deve ter PELE 100% LIMPA, ZERO TATUAGENS em todo o corpo (braços, mãos, pernas, colo e pescoço totalmente livres de tatuagens).
${noBagDirectivePt}${noBagDirectiveEn}

2. FOTO 2 (MODELO E CENÁRIO BASE ABSOLUTO — PRESERVAÇÃO INTEGRAL 1:1):
- A modelo gerada DEVE SER RIGOROSAMENTE A MESMA MULHER DA FOTO 2, NA MESMA POSE DIANTE DO ESPELHO E DENTRO DO MESMO CÔMODO/CENÁRIO DA FOTO 2.
- PRESERVAÇÃO INTEGRAL DE BIOTIPO E IDENTIDADE: reproduza com fidelidade 100% o mesmo corpo, curvas, biotipo, quadris, cintura, pernas, tom de pele natural com poros reais e cabelos (mesma cor, corte e textura da foto da modelo).
- PRESERVAÇÃO INTEGRAL DO CENÁRIO DA FOTO 2 (CENÁRIO DA MODELO): O cômodo de fundo, paredes, piso, espelho, portas, móveis e iluminação natural DEVEM ser 100% preservados e idênticos aos da Foto 2. NÃO altere nem redesenhe o ambiente da Foto 2.
${galleryFaceFramingRule2Img}
- ÚNICA MUDANÇA PERMITIDA: Substituir as roupas e o calçado que a modelo veste na Foto 2 pela peça completa da Foto 1 (preservando 100% da parte superior e 100% da parte inferior/barra da Foto 1 sem encurtar) e pelo calçado indicado (${shoeInfo.name}).
- REILUMINAÇÃO & ZERO BORDA DE RECORTE: A roupa e o calçado trocados devem assumir 100% a iluminação, temperatura de cor e sombras do cômodo da Foto 2, sem contorno branco ou aspecto colado.${scenario24FlashRulePt}

Qualidade fotográfica autêntica de smartphone moderno, textura de pele humana real com poros visíveis, acabamento fosco suave sem brilho excessivo de óleo, sem aspecto de cera ou plástico. ZERO tatuagens.`;
    } else {
      // MODO CENÁRIO DA GALERIA (3 FOTOS): Modelo da Foto 2 fotografada nativamente dentro do Cenário Independente da Foto 3
      galleryModelPrompt = `${resolvedPriorityBlock || priorityOverrideBlock}FOTOGRAFIA COMERCIAL REALISTA VERTICAL 9:16 (1080x1920) EM EXPOSIÇÃO ÚNICA NATIVA:

1. FOTO 1 (PRODUTO — PEÇA DE ROUPA COM FIDELIDADE 100% DE CIMA A BAIXO):
- Vestir a modelo com a roupa da Foto 1 com fidelidade absoluta 1:1 do topo até a barra inferior (mesma cor exata, mesmo padrão de estampa sem alterar os desenhos, mesma textura do tecido, mesmas linhas de costura, recortes, babados, pregas, caimento, formato da saia/barra, comprimento exato da peça, decote, alças e mangas).
- PROIBIÇÃO TOTAL DE ALTERAR OU ENCURTAR A PEÇA: É TERMINANTEMENTE PROIBIDO encurtar a peça, comer ou cortar a parte de baixo do vestido/saia, mudar o formato da barra, omitir costuras ou modificar a estampa/textura em qualquer parte da peça (nem na parte de cima nem na parte de baixo).
${garmentTypeInstruction}${productInfoSpec.hasInfo ? `\n${productInfoSpec.promptBlockPt}` : ''}
- Calçado nos pés: ${shoeInfo.name} (${shoeInfo.description}), descartando qualquer tênis ou sapato original da Foto 2 caso os pés fiquem visíveis pelo comprimento original da peça (NUNCA encurte ou levante a barra da peça da Foto 1 para mostrar os pés/calçado!).
- REGRA CRÍTICA DE ISOLAMENTO TOTAL DA FOTO 1: Da Foto 1 (produto), use APENAS a peça de roupa e tecido. Ignore 100% o rosto, cabeça, corpo, tatuagens ou fundo da pessoa da Foto 1. PELE 100% LIMPA, ZERO TATUAGENS.
${noBagDirectivePt}${noBagDirectiveEn}

2. FOTO 2 (IDENTIDADE E POSTURA DA MODELO — DESCARTE TOTAL DA LUZ E DO QUARTO ANTIGO):
${galleryFaceFramingRule3Img}
- DESCARTE ABSOLUTO DO QUARTO, DA LUZ E DAS BORDAS DA FOTO 2: É TERMINANTEMENTE PROIBIDO trazer a iluminação frontal/estúdio, o contraste, o brilho de parede branca nos contornos do cabelo/ombros, a roupa antiga, o tênis antigo ou qualquer elemento do quarto da Foto 2.

3. FOTO 3 (CENÁRIO REAL E CAMPO DE LUZ SOBERANO — INTEGRAÇÃO ÓPTICA E GEOMÉTRICA 3D):
- Fotografe a mulher fisicamente em pé sobre o piso real dentro do cômodo exato da Foto 3 (que já está no ponto de vista do espelho olhando para dentro do quarto — NÃO adicione moldura de espelho extra).
- Preserve 100% a arquitetura real da Foto 3: piso, paredes, rodapés, cortinas (cor e dobras exatas), portas e móveis, permitindo que a presença física da modelo interaja naturalmente com a luz do quarto (projetando sombras reais no piso e oclusão de ambiente).
${scenarioRelightRulePt}${scenario24FlashRulePt}

Qualidade fotográfica autêntica de smartphone moderno (iPhone 16 Pro) em captura única real, textura de pele humana com poros visíveis, grão e nitidez óptica unificados entre modelo e cômodo. ZERO tatuagens.`;
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


## 7. REGRA UNIVERSAL DE CALÇADO (HARMONIA COM A ROUPA & PROIBIÇÃO DE ENCURTAR A PEÇA)
Calçado nos pés: **${shoeInfo.name}** (visível somente se o comprimento original da peça na foto de referência deixar os pés à mostra).
Especificação do calçado: ${shoeInfo.description}.
(REGRA INVIOLÁVEL: O comprimento, formato da barra, costuras e estampa da parte inferior da peça seguem 100% a foto de referência do produto. NUNCA encurte, corte ou suba a barra da peça para mostrar os pés ou o calçado!). Enquadrar o corpo inteiro naturalmente diante do espelho.

## 7.1. REGRA DE LOOK COMPLETO E PEÇAS COMPLEMENTARES (LOOK COMERCIAL COMPLETO)
${complementaryInfo.directiveTextPt}
${complementaryInfo.directiveTextEn}

## 8. FIDELIDADE ABSOLUTA E SOBERANA AO PRODUTO ANEXADO (1:1 DE CIMA A BAIXO — ZERO ALTERAÇÃO DE COSTURAS, ESTAMPA OU COMPRIMENTO)
A foto da peça anexada pelo usuário é a referência soberana e inviolável da roupa (venda real TikTok Shop).
Reproduza a roupa 1:1 com máxima fidelidade em TODA a sua extensão (tanto na parte superior quanto na parte inferior): mesma cor exata, tonalidade, mesmo padrão de estampa (mesmos motivos, escala e posição da estampa), mesma textura do tecido, modelagem, formato da saia e da barra, comprimento exato da peça sem encurtar nem alongar, decote, alças, mangas, rendas, transparências, linhas de costura, babados, pregas, botões e recortes.
${imageLengthRule ? `${imageLengthRule}\n` : ''}${imageSlitRule ? `${imageSlitRule}\n` : ''}${productInfoSpec.hasInfo ? `${productInfoSpec.promptBlockPt}\n` : ''}É TERMINANTEMENTE PROIBIDO encurtar a peça, comer/cortar a parte de baixo do vestido, alterar costuras, mudar a estampa ou modificar o formato da peça em qualquer parte dela.
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
        ? `**MOVEMENT CHOREOGRAPHY (10s CONTINUOUS — 01. CONJUNTO THAI):**
- 0.0–1.8s: From the first frame, free hand gently pulls ONLY the bottom hem of the upper top outward away from the abdomen to show elasticity/drape (never pulling the bottom garment).
- 1.8–3.0s: Gradually releases the top hem and prepares to rotate.
- 3.0–5.2s: Pronounced 80–90° side turn showing complete side silhouette.
- 5.2–6.8s: Smooth, complete return to direct frontal mirror-facing position.
- 6.8–8.3s: Free hand sweeps continuously across waist and front abdomen over the fabric.
- 8.3–10.0s: Hand lowers near hip/upper lower piece presenting fit with subtle weight transfer.`
        : `**MOVEMENT CHOREOGRAPHY (10s CONTINUOUS — 01. CONJUNTO THAI):**
- 0.0–1.8s: From the very first frame, free hand pulls ONLY the bottom hem of the TOP (blouse) gently outward from the abdomen to demonstrate elasticity and fit. NEVER touch or pull the skirt.
- 1.8–3.0s: Gradually releases the top hem back to place while shifting weight to turn.
- 3.0–5.2s: Pronounced 80–90° side turn presenting a genuine full side silhouette of top and skirt; brief hold.
- 5.2–6.8s: Smooth, complete return back to direct frontal mirror-facing position.
- 6.8–8.3s: Free hand makes a deliberate continuous sweep across the waist and front abdomen.
- 8.3–10.0s: Free hand moves near hip/upper skirt presenting fit with subtle weight transfer until final frame.`;

    case 'mestra_iara':
      return isMale
        ? `**MOVEMENT CHOREOGRAPHY (10s CONTINUOUS — 02. CALÇA THAI):**
- 0.0–0.6s: Relaxed frontal mirror stance, legs close together, one foot slightly ahead.
- 0.6–2.0s: Free hand moves to outer thigh, gently pinches and pulls trouser fabric horizontally outward to show width and drape, then releases and transitions to lateral waistband.
- 2.0–4.0s: Hand glides down upper thigh, brushes front thigh, sweeps gently to front waistband/abdomen and relaxes to side.
- 4.5–6.5s: Subtle weight shift, small lateral foot step opening stance with natural wide-leg fabric sway.
- 6.5–10.0s: Smooth hip/torso rotation into a 3/4 side-and-rear silhouette presentation with natural final hold.`
        : `**MOVEMENT CHOREOGRAPHY (10s CONTINUOUS — 02. CALÇA THAI):**
- 0.0–0.6s: Natural frontal mirror stance, legs close, one foot slightly ahead.
- 0.6–2.0s: Free hand reaches outer thigh, pinches/pulls lateral trouser fabric horizontally outward showing wide fit and drape, then releases upward toward lateral waistband.
- 2.0–4.0s: Hand glides down upper thigh, brushes front thigh, moves smoothly across front waistband/abdomen and relaxes alongside body.
- 4.5–6.5s: Controlled weight shift and small lateral step creating an open balanced stance as wide trouser legs sway naturally.
- 6.5–10.0s: Smooth torso and hip rotation into a 3/4 side and slightly rearward presentation showing side/rear trouser drape until final frame.`;

    case 'mestra_duda':
      return `**MOVEMENT CHOREOGRAPHY (10s CONTINUOUS — 03. VESTIDO THAI):**
- 0.0–2.0s: Starts frontal with one leg visibly bent at knee ahead, free hand on upper thigh; knee gradually straightens as hand descends and legs return closer together.
- 2.0–3.8s: Subtle foot adjustment; free hand approaches and glides along upper lateral skirt fabric showing texture and fit.
- 3.8–6.2s: Advances one leg clearly forward then diagonally outward with natural weight transfer onto supporting leg.
- 6.2–8.2s: Free hand glides down skirt then grasps upper thigh fabric and pulls gently HORIZONTALLY SIDEWAYS a few cm (NEVER lift dress or raise hemline), releasing naturally.
- 8.2–10.0s: Final natural frontal presentation with slight hip/foot adjustment and relaxed dress drape.`;

    case 'mestra_nay':
      return `**MOVEMENT CHOREOGRAPHY (10s CONTINUOUS — 04. SAIA THAI):**
- 0.0–1.2s: Initial crossed-leg frontal stance, hips displaced; quick foot adjustment transferring body weight visibly onto opposite leg.
- 1.2–3.3s: Free hand rises to waistband, moves across belt/buckle/front waist, then descends naturally along skirt side.
- 3.3–5.8s: Decisive alternating weight transfer between legs, quick outward lateral foot step opening stance with natural skirt swing, then second weight shift back.
- 5.8–8.3s: Hand glides down upper skirt, then grasps skirt fabric at upper thigh and pulls clearly OUTWARD and slightly sideways (not touching waist or lifting hem), releasing naturally.
- 8.3–10.0s: Final visible weight transfer settling into an asymmetrical frontal stance.`;

    case 'mestra_catza':
      return `**MOVEMENT CHOREOGRAPHY (10s CONTINUOUS — 05. MACACÃO THAI):**
- 0.0–2.3s: Asymmetrical stance with visible leg weight transfer; free hand glides along upper thigh then performs a gentle outward pull on jumpsuit fabric at upper thigh and releases.
- 2.3–5.0s: Hand moves visibly up from thigh to abdomen, glides horizontally across waist/abdomen, then descends over hip and upper thigh.
- 5.0–7.3s: Clear alternating weight transfer onto opposite leg, foot repositioning with second weight transfer, hand moves to lower jumpsuit area.
- 7.3–8.5s: Second gentle outward fabric pull at upper thigh, brief hold, natural release.
- 8.5–10.0s: Pronounced 70–90° side turn showing complete side silhouette of the jumpsuit through final frame.`;

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
  productInfo?: string;
  influencer?: AnaMariaInfluencer;
  bodyType?: AnaMariaBodyType;
  presentationMode?: AnaMariaPresentationMode;
  selectedMasterId?: AnaMariaMasterId;
  additionalInstructions?: string;
  hasSelectedScenario?: boolean;
  dressInspection?: AnaMariaDressInspection;
}): string {
  const master = getMasterPromptById(params.selectedMasterId);
  const isMale = params.influencer === 'Homem';
  const isPlusSize = params.bodyType === 'plus_size';
  const fabricSpec = analyzeAnaMariaProductInfo(params.productInfo);
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
Reproduzir as peças sobre a cama com fidelidade 100% à foto de referência: mesma cor, textura, tecido, costuras e modelagem.${
      fabricSpec.hasInfo
        ? ` Tecido real informado pelo usuário: ${fabricSpec.fabricSummaryLabel} (preservar textura, trama e caimento exatos do tecido).`
        : ''
    } PROIBIDO inventar botões, fechos, zíperes ou detalhes inexistentes. Não esticar ou deformar as peças.

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
    `A roupa da foto de referência é sagrada e imutável. TERMINANTEMENTE PROIBIDO modificar cor, estampa, tecido, modelagem, decote ou comprimento.${
      fabricSpec.hasInfo
        ? ` Tecido especificado da peça: ${fabricSpec.fabricSummaryLabel} (preservar textura, trama e caimento reais do tecido).`
        : ''
    } Proibido inventar partes, botões, bolsos ou costuras inexistentes. A peça deve se manter 100% fiel à imagem em todos os frames e movimentos.`;

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
  // Margem de segurança para garantir estritamente <= 2.450 caracteres e nunca cortar o final
  const maxUserChars = Math.max(0, 2430 - baseLength - 40);

  const userBlock = (hasUserInstructions && maxUserChars > 30)
    ? `**INSTRUÇÕES DO USUÁRIO:**\n"${userInstructionsText.length > maxUserChars ? userInstructionsText.slice(0, maxUserChars - 4) + '...' : userInstructionsText}"`
    : '';

  const upperGarmentRule =
    isUpperOnly && !master.isPov
      ? `**REGRA OBRIGATÓRIA DE INTERAÇÃO COM A ROUPA (PEÇA SUPERIOR):**\n` +
        `Como o produto objeto do vídeo é uma peça superior (${params.productName}), a modelo deve interagir, passar a mão e demonstrar EXCLUSIVAMENTE a blusa/peça superior. É TERMINANTEMENTE PROIBIDO à modelo puxar, tocar, alisar ou interagir com a calça, saia ou bermuda (peça de baixo). Toda a movimentação das mãos deve focar exclusivamente na valorização da peça superior anunciada.`
      : '';

  const { videoSlitRule } = buildDressLengthAndSlitDirectives(
    params.productName,
    params.additionalInstructions,
    params.dressInspection
  );
  const sections = [
    headerLine,
    framingBlock,
    garmentFidelityBlock,
    videoSlitRule,
    upperGarmentRule,
    identityBlock,
    userBlock,
    movementsBlock,
    executionBlock,
  ].filter(Boolean);

  let concise = sections.join('\n\n').trim();

  // Caso exceda 2.450 caracteres, encontra a última frase completa antes do limite (NUNCA corta no meio de palavras ou blocos)
  if (concise.length > 2450) {
    const sub = concise.slice(0, 2445);
    const lastPeriod = Math.max(sub.lastIndexOf('.'), sub.lastIndexOf('\n'));
    concise = lastPeriod > 1500 ? sub.slice(0, lastPeriod + 1).trim() : sub.trim();
  }

  return concise;
}

export function buildAnaMariaVideoPrompt(params: {
  productName: string;
  productInfo?: string;
  influencer?: AnaMariaInfluencer;
  bodyType?: AnaMariaBodyType;
  presentationMode?: AnaMariaPresentationMode;
  selectedMasterId?: AnaMariaMasterId;
  limit?: AnaMariaVideoPromptLimit;
  additionalInstructions?: string;
  hasSelectedScenario?: boolean;
  dressInspection?: AnaMariaDressInspection;
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
  const fabricSpec = analyzeAnaMariaProductInfo(params.productInfo);
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
  if (!master.isPov) {
    if (mode === 'com_rosto') {
      base = base
        .replace(/The reference camera angle is BELOW THE CHIN\./gi, 'The reference camera angle preserves the EXACT framing from the attached model photograph (VISIBLE FACE IN MIRROR).')
        .replace(/Original crop below the chin\./gi, 'Original framing preserving the model face as shown in the reference photograph.')
        .replace(/below-chin framing/gi, 'exact reference mirror framing (preserving visible face)')
        .replace(/BELOW THE CHIN/g, 'PER THE ATTACHED REFERENCE PHOTOGRAPH');
    }
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
      `A roupa da imagem de referência é 100% sagrada e imutável. É TERMINANTEMENTE PROIBIDO ao gerador de vídeo modificar a cor, tom, estampa, tecido, textura, modelagem, caimento, decote, mangas ou comprimento da peça.${
        fabricSpec.hasInfo
          ? ` ${fabricSpec.compactLinePt} — preservar fielmente a textura real e o comportamento natural desse tecido nos movimentos.`
          : ''
      } PROIBIDO inventar partes, botões, bolsos, zíperes ou costuras inexistentes. A peça deve se manter 100% fiel à imagem de referência em todos os frames e movimentos.\n\n`;

    const { videoSlitRule } = buildDressLengthAndSlitDirectives(
      params.productName,
      params.additionalInstructions,
      params.dressInspection
    );
    const slitBlock = videoSlitRule ? `${videoSlitRule}\n\n` : '';
    base = framingAndGarmentRule + slitBlock + base;
  } else if (fabricSpec.hasInfo) {
    base = `**TECIDO REAL DO PRODUTO (${fabricSpec.fabricSummaryLabel.toUpperCase()}):** ${fabricSpec.compactLinePt}\n\n` + base;
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
