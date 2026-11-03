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
      ? `Mostrar exclusivamente duas mãos masculinas adultas e parte dos antebraços entrando pela parte inferior do enquadramento em primeira pessoa (POV): pele realista com poros naturais, unhas curtas e limpas sem esmalte, e um relógio masculino discreto em um dos pulsos.`
      : `${master.bodyStandardText}\n${master.skinAndRealismText}\n\n## ACESSÓRIOS E MANICURE DAS MÃOS (${master.shortName.toUpperCase()})\n${master.accessoriesIdentityText}`;

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
  const scenarioTitle = form.selectedScenarioNumber
    ? `Cenário ${form.selectedScenarioNumber}`
    : 'cenário selecionado';
  const scenarioText = SCENARIO_DESCRIPTIONS[scenarioRoom] || SCENARIO_DESCRIPTIONS.hall_espelho;

  // Estrutura Corporal: Normal da Mestra vs Módulo Universal Plus Size vs Adaptação Masculina
  let bodySectionText = '';
  if (isMale) {
    bodySectionText = isPlusSize
      ? UNIVERSAL_MALE_PLUS_SIZE_MODULE
      : `## 1. ESTRUTURA CORPORAL MASCULINA (ADAPTAÇÃO MASCULINA DE ${master.shortName.toUpperCase()})
Homem brasileiro adulto (25 a 35 anos, salvo outra idade nas instruções adicionais), aparência natural, autêntica e cotidiana.
Corpo masculino proporcional e em forma: ombros largos, peitoral e tronco alinhados, cintura masculina natural e pernas masculinas proporcionais.
Pele com o mesmo padrão de realismo fotográfico da Mestra selecionada (poros visíveis, textura humana verdadeira, zero efeito plástico).`;
  } else if (isPlusSize) {
    bodySectionText = `${UNIVERSAL_PLUS_SIZE_MODULE}\n\n### PELE E TEXTURA HUMANA (${master.shortName.toUpperCase()})\n${master.skinAndRealismText}`;
  } else {
    bodySectionText = `## 1. PADRÃO CORPORAL E PELE — ${master.shortName.toUpperCase()}\n${master.bodyStandardText}\n\n### PELE E REALISMO HUMANO\n${master.skinAndRealismText}`;
  }

  // Cabelo: Mestra vs Homem
  const hairSectionText = isMale
    ? `Cabelo masculino curto a médio, alinhado e natural, mantendo a mesma tonalidade base da Mestra selecionada (${
        master.id === 'mestra_duda'
          ? 'castanho-claro a castanho-médio'
          : 'castanho-escuro a preto'
      }, salvo se o usuário solicitou outro cabelo nas instruções adicionais).`
    : master.hairIdentityText;

  // Acessórios: Mestra vs Homem
  const accessoriesSectionText = isMale
    ? `Acessórios masculinos discretos (Adaptação Masculina):
- Relógio de pulso masculino elegante e discreto em um dos pulsos.
- Ausência total de colares femininos, pulseiras femininas delicadas ou esmalte colorido. Unhas masculinas curtas e limpas.`
    : master.accessoriesIdentityText;

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

  const hasSelectedScenario = Boolean(form.selectedScenarioId);
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
    : 'A modelo segura um smartphone moderno com uma das mãos diante do espelho de corpo inteiro (respeitando eventual cor de celular solicitada nas instruções adicionais).'
}
${master.lightingAndCameraText}
${
  isPlusSize
    ? `Postura natural em pé diante do espelho, valorizando com autenticidade a estrutura corporal genuinamente PLUS SIZE (manequim 48-52, coxas grossas, quadris largos, abdômen arredondado natural e braços cheios), com o braço livre relaxado ou tocando levemente a lateral sem esconder detalhes da roupa.`
    : `Postura natural em pé diante do espelho, peso apoiado de forma orgânica valorizando a silhueta e o caimento da peça, com o braço livre relaxado ou tocando suavemente a lateral sem esconder detalhes da roupa.`
}`;

  const prompt = `${priorityOverrideBlock}Crie uma fotografia hiper-realista vertical 9:16 (1080x1920) de ${
    isMale
      ? isPlusSize
        ? 'um homem adulto genuinamente PLUS SIZE (porte grande e pesado, manequim 52-56)'
        : 'um homem adulto em forma'
      : isPlusSize
      ? 'uma mulher adulta genuinamente PLUS SIZE (manequim 48 a 52, volume adiposo evidente, coxas grossas, quadris largos e curvas generosas)'
      : `uma mulher adulta seguindo o padrão físico da ${master.shortName}`
  } vestindo exatamente a peça de roupa da imagem de referência anexada, inserida com perfeição no ${scenarioTitle} anexado, em uma fotografia de espelho de corpo inteiro.

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

  // 2. Preservação da estrutura Plus Size durante toda a animação (resumo conciso para o vídeo sem sobrepor movimentos)
  if (isPlusSize && mode !== 'pov' && !master.isPov) {
    base = `**PRESERVAÇÃO DO CORPO PLUS SIZE:** Preservar a silhueta e proporções corporais plus size da modelo da imagem de referência durante todos os movimentos.\n\n` + base;
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

/**
 * Constrói o Prompt Enxuto de Vídeo (ESTRITAMENTE <= 600 CARACTERES contando com os espaços).
 * Concentra o texto prioritariamente nos movimentos essenciais da Mestra selecionada
 * e utiliza o espaço restante para a trava de fidelidade 1:1 da peça, enquadramento e instruções do usuário.
 */
export function buildAnaMariaCompactVideoPrompt(params: {
  productName?: string;
  influencer?: AnaMariaInfluencer;
  bodyType?: AnaMariaBodyType;
  presentationMode?: AnaMariaPresentationMode;
  selectedMasterId?: AnaMariaMasterId;
  additionalInstructions?: string;
}): string {
  const MAX_CHARS = 600;
  const master = getMasterPromptById(params.selectedMasterId);
  const mode: AnaMariaPresentationMode =
    params.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');
  const isMale = params.influencer === 'Homem';
  const isPlusSize = params.bodyType === 'plus_size';
  const isFaceMode =
    mode === 'com_rosto' ||
    Boolean(master.allowsFaceByDefault) ||
    master.primaryCategory === 'com_rosto' ||
    master.id === 'mestra_catza';

  let movements = (master.compactMovementPromptText || '').replace(/\s+/g, ' ').trim();

  if (isMale) {
    movements = movements
      .replace(/\bbusto\b/gi, 'peitoral')
      .replace(/\bcolo\b/gi, 'peitoral')
      .replace(/\bdecote\b/gi, 'gola');
  }

  const userExtra = (params.additionalInstructions || '').replace(/\s+/g, ' ').trim();
  const shortUserExtra = userExtra.length > 90 ? `${userExtra.slice(0, 87).trim()}...` : userExtra;

  // Bloco complementar conciso (Fidelidade 1:1 + Enquadramento + Corpo)
  let framingAndFidelity = '';
  if (mode === 'pov' || master.isPov) {
    const handsNote = isMale
      ? 'Só mãos masculinas.'
      : master.id === 'pov_blusinhas_13k'
      ? 'Só mãos (unhas vinho amendoadas, joias prata).'
      : 'Só mãos (unhas vermelhas, joias douradas).';
    framingAndFidelity = `Vídeo 9:16 10s POV na cama, sem fala. ${handsNote} Manter peças 1:1 idênticas à foto sem inventar detalhes.`;
  } else if (isFaceMode) {
    const bodyNote = isMale ? 'modelo homem' : isPlusSize ? 'modelo plus size real' : 'modelo';
    framingAndFidelity = `Vídeo 9:16 10s no espelho com flash, sem falar/mexer lábios. Manter ${bodyNote} e roupa 1:1 idêntica sem alterar detalhes.`;
  } else {
    const bodyNote = isMale ? 'modelo homem' : isPlusSize ? 'modelo plus size real' : 'modelo';
    framingAndFidelity = `Vídeo 9:16 10s sem fala. Corte fixo no queixo (sem rosto/lábios). Manter ${bodyNote}, cenário e roupa 1:1 sem alterar detalhes.`;
  }

  const parts: string[] = [];
  if (shortUserExtra) {
    parts.push(`Prioridade: ${shortUserExtra}.`);
  }
  parts.push(`Movimentos: ${movements}`);
  parts.push(framingAndFidelity);

  let combined = parts.join(' ').replace(/\s+/g, ' ').trim();

  if (combined.length <= MAX_CHARS) {
    return combined;
  }

  // Se ultrapassou 600 caracteres (ex: quando há instrução adicional longa), preserva 100% dos movimentos + trava curta
  const compactFidelity =
    mode === 'pov' || master.isPov
      ? 'POV 9:16 10s sem fala, manter peças 1:1 fiéis.'
      : isFaceMode
      ? `9:16 10s com rosto/flash, sem falar, roupa 1:1 fiel${isPlusSize ? ', corpo plus size' : ''}.`
      : `9:16 10s sem fala, corte no queixo (sem rosto/lábios), roupa 1:1 fiel${isPlusSize ? ', corpo plus size' : ''}.`;

  const prefix = shortUserExtra ? `Prioridade: ${shortUserExtra}. ` : '';
  const suffix = ` ${compactFidelity}`;
  const availableForMovements = MAX_CHARS - prefix.length - suffix.length;

  if (movements.length <= availableForMovements) {
    combined = `${prefix}${movements}${suffix}`.replace(/\s+/g, ' ').trim();
  } else {
    const slicedMov = movements.slice(0, Math.max(200, availableForMovements - 1));
    const lastSpace = slicedMov.lastIndexOf(' ');
    const cleanMov = (lastSpace > 150 ? slicedMov.slice(0, lastSpace) : slicedMov).replace(/[,;:\s]+$/, '') + '.';
    combined = `${prefix}${cleanMov}${suffix}`.replace(/\s+/g, ' ').trim();
  }

  if (combined.length > MAX_CHARS) {
    const hardSlice = combined.slice(0, MAX_CHARS);
    const lastSp = hardSlice.lastIndexOf(' ');
    return (lastSp > 500 ? hardSlice.slice(0, lastSp) : hardSlice).trim();
  }

  return combined;
}
