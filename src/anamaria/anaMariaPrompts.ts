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

  const hasUserInstructions = Boolean(
    form.additionalInstructions && form.additionalInstructions.trim().length > 0
  );
  const userInstructionsText = hasUserInstructions ? form.additionalInstructions.trim() : '';

  const priorityOverrideBlock = hasUserInstructions
    ? `[PRIORIDADE SOBERANA DO USUÁRIO: "${userInstructionsText}" — aplique com prioridade máxima mantendo o restante da Mestra intacto.] `
    : '';

  // ============================================================================
  // CASO 1: MODO POV (MÃOS E DOIS PRODUTOS SOBRE A CAMA DO CENÁRIO POV)
  // ============================================================================
  if (mode === 'pov' || master.isPov) {
    const povScenarioLabel = form.selectedScenarioNumber
      ? `Cenário POV ${form.selectedScenarioNumber}`
      : 'Cenário POV';

    const handsDescription = isMale
      ? `Somente duas mãos masculinas adultas e antebraços entrando pela borda inferior (unhas curtas sem esmalte e relógio masculino discreto; proibido rosto, corpo ou pernas).`
      : `${master.bodyStandardText} ${master.accessoriesIdentityText}`;

    const povLayout =
      master.id === 'pov_blusinhas_13k'
        ? '1ª peça aberta segura pelas mãos em primeiro plano e 2ª peça completa organizada sobre a cama logo abaixo'
        : 'duas unidades completas do produto organizadas no centro da cama seguras pelas laterais pelas duas mãos';

    const povPrompt = `${priorityOverrideBlock}Fotografia realista vertical 9:16 em estilo POV (primeira pessoa, câmera a 90 graus acima da cama). PRESERVAÇÃO INTEGRAL DO CENÁRIO POV: mantenha 100% a cama, colcha, lençol e iluminação da Imagem 1 (${povScenarioLabel}). PRODUTOS 1:1 (IMAGEM 2): exiba ${povLayout}, reproduzindo a peça com fidelidade 1:1 (mesma cor, tecido, corte, costuras e detalhes). MÃOS (${master.shortName}): ${handsDescription}`;

    return {
      prompt: povPrompt.trim(),
      shoeCategory: 'C_OUTRO',
      shoeDescription: 'Modo POV (Somente Mãos e Produto na Cama — Sem Calçado)',
    };
  }

  // ============================================================================
  // CASO 2: MODO MIRROR SELFIE (SEM ROSTO) OU MODO COM ROSTO (UGC)
  // ============================================================================
  const scenarioTitle = form.selectedScenarioNumber
    ? `Cenário ${form.selectedScenarioNumber}`
    : 'cenário selecionado';
  const scenarioText = SCENARIO_DESCRIPTIONS[scenarioRoom] || SCENARIO_DESCRIPTIONS.hall_espelho;

  const userRequestedSlimBody =
    hasUserInstructions &&
    /\b(magra|magrinha|bem magra|corpo de modelo|modelo de passarela|corpo fino|skinny|slim)\b/i.test(
      userInstructionsText
    );

  // Estrutura Corporal: Normal da Mestra vs Sobrescrita Corporal Plus Size vs Adaptação Masculina
  let bodySectionText = '';
  if (isMale) {
    bodySectionText = isPlusSize
      ? UNIVERSAL_MALE_PLUS_SIZE_MODULE
      : `CORPO MASCULINO: Homem brasileiro adulto (25-35 anos), ombros largos, peitoral e tronco alinhados, pernas proporcionais, pele realista e zero tatuagens.`;
  } else if (isPlusSize) {
    bodySectionText = UNIVERSAL_PLUS_SIZE_ENGLISH_DIRECTIVE;
  } else if (userRequestedSlimBody) {
    bodySectionText = `CORPO E PELE: Mulher brasileira adulta com o biotipo solicitado pelo usuário ("${userInstructionsText}"). ${master.skinAndRealismText}`;
  } else {
    bodySectionText = `CORPO OBRIGATÓRIO (${master.shortName}): ${master.bodyStandardText} ${master.skinAndRealismText}`;
  }

  // Cabelo: Mestra vs Homem
  const hairSectionText = isMale
    ? `Cabelo masculino curto alinhado (${master.id === 'mestra_duda' ? 'castanho-claro' : 'castanho-escuro'}).`
    : master.hairIdentityText;

  // Acessórios: Mestra vs Homem
  const accessoriesSectionText = isMale
    ? `Relógio masculino discreto, unhas curtas limpas sem esmalte e sem joias femininas.`
    : master.accessoriesIdentityText;

  // Regra de Rosto: Mirror Selfie (Corte estrito no queixo) vs Com Rosto (Rosto visível)
  const isFaceVisible = mode === 'com_rosto' || master.id === 'mestra_catza';
  const framingFaceSection = isFaceVisible
    ? `ENQUADRAMENTO COM ROSTO: Rosto visível no espelho (${!isMale && master.faceAndMakeupText ? master.faceAndMakeupText : 'rosto brasileiro autêntico e expressivo'}), corpo inteiro até os pés.`
    : `ENQUADRAMENTO CORTE NO QUEIXO: Corte estrito da base do queixo para baixo até os pés (PROIBIDO mostrar rosto, boca, lábios, nariz ou olhos).`;

  const hasSelectedScenario = Boolean(form.selectedScenarioId);
  const scenarioSection = hasSelectedScenario
    ? `PRESERVAÇÃO INTEGRAL DO CENÁRIO: Mantenha 100% intacto o cômodo da Imagem 1 (${scenarioTitle}), com ${isMale ? 'o modelo' : 'a modelo'} em pé diante do espelho.`
    : `CENÁRIO RESIDENCIAL E AMBIENTE: ${scenarioText}`;

  const prompt = `${priorityOverrideBlock}Fotografia realista vertical 9:16 de selfie de corpo inteiro no espelho. ${scenarioSection}
ROUPA 1:1 (IMAGEM 2): Vestir exatamente a peça da Imagem 2 com fidelidade 1:1 (mesma cor, tecido, modelagem, decote, alças, costuras e detalhes, sem inventar ou alterar nada). PROIBIDO copiar o corpo magro da pessoa/manequim da Imagem 2!
${bodySectionText}
${framingFaceSection}
APARÊNCIA E JOIAS (${master.shortName}): ${hairSectionText} ${accessoriesSectionText} ${master.lightingAndCameraText} Nos dois pés: ${shoeInfo.name}.`;

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
