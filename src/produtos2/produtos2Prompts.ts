import {
  Produtos2ClientGender,
  Produtos2Duration,
  Produtos2Framing,
  Produtos2MaleClothStyle,
  Produtos2MaleSubOption,
  Produtos2Scenario,
  Produtos2SceneItem,
  Produtos2SpeechMode,
  Produtos2SubMode,
  Produtos2VisualMapItem,
} from './types';
import { applySpeechIntro } from './produtos2CopyBank';

/**
 * Retorna a descrição canônica unificada de uma cena (mesma pessoa, mesma ação e mesmo enquadramento
 * tanto no prompt da imagem do storyboard quanto no prompt do Veo — Item 7.3)
 */
export function getUnifiedSceneDescription(sc: Produtos2SceneItem): string {
  const framing = (sc.framing || '').trim().replace(/[.]+$/, '');
  let action = (sc.action || sc.storyboardDescription || '').trim();
  if (framing && action.toLowerCase().startsWith(framing.toLowerCase())) {
    action = action.slice(framing.length).replace(/^[:.\-\s]+/, '').trim();
  }
  if (!action.endsWith('.')) {
    action = `${action}.`;
  }
  return framing ? `${framing}. ${action}` : action;
}

/**
 * Formata a descrição curta da Cena 1 para completar a frase do primeiro frame:
 * com letra minúscula, sem ponto no meio e concordância natural ("da apresentadora...", "de duas mãos...") — Item 7.1
 */
export function formatFirstFrameClause(scene1: Produtos2SceneItem | undefined, productName: string): string {
  const raw = (scene1?.action || `apresentação inicial em close de ${productName}`).trim();
  // Remove reticências e substitui pontos no meio por vírgulas, limpando pontuação final
  let cleaned = raw
    .replace(/…|\.\.\./g, ',')
    .replace(/\.\s+/g, ', ')
    .replace(/[,;:.!?]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return `de apresentação inicial em close de ${productName}`;
  }

  // Primeira letra minúscula
  cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);

  if (cleaned.startsWith('a ')) {
    return `da ${cleaned.slice(2)}`;
  }
  if (cleaned.startsWith('o ')) {
    return `do ${cleaned.slice(2)}`;
  }
  if (cleaned.startsWith('as ')) {
    return `das ${cleaned.slice(3)}`;
  }
  if (cleaned.startsWith('os ')) {
    return `dos ${cleaned.slice(3)}`;
  }
  if (cleaned.startsWith('de ') || cleaned.startsWith('da ') || cleaned.startsWith('do ')) {
    return cleaned;
  }
  return `de ${cleaned}`;
}

export interface SceneVariationInfo {
  variationIndex: number;
  variationName: string;
  totalVariations: number;
}

/**
 * Regra de divisão das variações do produto (Item 7 do usuário):
 * - 1 variação: aparece normal em todas as cenas.
 * - 2 variações: divide em 2: cenas 1 a 4 (metade inicial na 1ª cor) e cenas 5 a 9 (segunda metade na 2ª cor).
 * - 3 variações: cenas 1, 2 e 3 (1ª cor); cenas 4, 5 e 6 (2ª cor); cenas 7, 8 e 9 (3ª cor).
 */
export function getSceneVariationInfo(
  sceneNumber: number,
  variations: { name?: string; photos?: string[] }[] = []
): SceneVariationInfo | null {
  const active = (variations || []).filter(
    (v) => (v.name && v.name.trim().length > 0) || (v.photos && v.photos.length > 0)
  );
  if (active.length <= 1) return null;

  if (active.length === 2) {
    const idx = sceneNumber <= 4 ? 0 : 1;
    return {
      variationIndex: idx,
      variationName: active[idx].name?.trim() || `Variação ${idx + 1}`,
      totalVariations: 2,
    };
  }

  const idx = sceneNumber <= 3 ? 0 : sceneNumber <= 6 ? 1 : 2;
  return {
    variationIndex: idx,
    variationName: active[idx].name?.trim() || `Variação ${idx + 1}`,
    totalVariations: Math.min(3, active.length),
  };
}

/**
 * Higieniza adjetivos de cores fixos do texto descritivo da ação quando o produto tem variações de cores ativas.
 * Isso evita que o modelo de vídeo (Veo) receba descrições de cor conflitantes no texto (ex: "rede azul-marinho", "franjas azul-marinho")
 * e priorize fielmente a cor de cada quadro numerado de 1 a 9 do Storyboard anexado.
 */
export function sanitizeSceneColorAdjectivesForVeo(
  actionText: string,
  sceneNumber: number,
  activeVars: { name?: string; photos?: string[] }[] = [],
  productName: string = ''
): string {
  if (!actionText || activeVars.length < 2) return actionText;

  let cleaned = actionText;

  // Substitui cores compostas e hífenadas associadas ao produto (ex: "rede-marinho" -> "rede", "tecido-marinho" -> "tecido")
  cleaned = cleaned.replace(/\b(rede|tecido|banco|tênis|franjas|algodão|cordas)-marinho\b/gi, '$1');

  // Remove adjetivos de cores específicos anexados a substantivos comuns de produtos e suas partes
  // ex: "rede azul-marinho", "franjas azul-marinho", "algodão azul-marinho", "tecido azul-marinho", "tecido vermelho", "rede preta"
  cleaned = cleaned.replace(
    /\b(rede|tecido|algodão|franjas|cordas|banco|tênis|calçado|peça|camisa|camiseta|calça|bermuda|conjunto|produto|aparelho|equipamento)\s+((?:[a-záàâãéêíóôõúç-]+(?:\s+e\s+|\s+))*\b(?:azul(?:-marinho|-acinzentad[ao]s?|-petróleo|-celeste)?|vermelh[ao]s?|pret[ao]s?|branc[ao]s?|cinza(?:-claro|-escuro)?s?|verdes?|amarel[ao]s?|laranjas?|rosas?(?:-avermelhad[ao]s?)?|marrons?|beges?|rox[ao]s?|vinho|listrad[ao]s?|estampad[ao]s?)\b)/gi,
    '$1'
  );

  // Se a cena pertencer à variação 2 ou 3 (cenas > 3 em 3 variações ou cenas > 4 em 2 variações),
  // e contiver menção a listras exclusivas da variação 1 (ex: "listras finas em branco cinza-claro e rosa-avermelhado"),
  // higieniza para não descrever listras na rede vermelha ou preta
  const isAfterVar1 = activeVars.length === 2 ? sceneNumber > 4 : sceneNumber > 3;
  if (isAfterVar1) {
    cleaned = cleaned.replace(
      /(?:com\s+)?listras(?:\s+longitudinais)?(?:\s+finas)?(?:\s+em\s+[a-záàâãéêíóôõúç,\s-]+)?(?:seguindo[^\n.,;]+)?/gi,
      ''
    );
  }

  // Coleta termos específicos das variações cadastradas
  const customVarTerms: string[] = [];
  activeVars.forEach((v) => {
    if (v.name && v.name.trim()) {
      const words = v.name.trim().split(/[\s/,-]+/).filter((w) => w.length >= 3);
      customVarTerms.push(...words);
    }
  });

  customVarTerms.forEach((term) => {
    if (productName && productName.toLowerCase().includes(term.toLowerCase())) return;
    if (/^(de|da|do|em|com|sem|para|por)$/i.test(term)) return;
    const reg = new RegExp(`\\b${term}\\b`, 'gi');
    cleaned = cleaned.replace(reg, '');
  });

  // Limpa espaços extras e pontuações soltas
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .trim();

  return cleaned;
}

/**
 * Higieniza a lista do Product Lock quando o produto tem múltiplas variações cadastradas.
 * Garante que nenhuma cor específica (ex: "azul-marinho", "listras finas em rosa") seja colocada
 * como se fosse a cor única e universal do produto, pois todas as variações adicionadas são legítimas
 * e cada uma é retratada no seu respectivo grupo de quadros do storyboard.
 */
export function sanitizeProductLockForVariations(
  productLock: string[],
  activeVars: { name?: string; photos?: string[] }[] = [],
  _productName: string = ''
): string[] {
  if (!Array.isArray(productLock) || productLock.length === 0) return productLock;
  if (activeVars.length < 2) return productLock;

  const varNamesList = activeVars.map((v) => v.name?.trim()).filter(Boolean).join(', ');

  const result: string[] = [];
  const seen = new Set<string>();

  for (const rawItem of productLock) {
    const item = String(rawItem).trim();
    if (!item) continue;

    // Se o item for sobre a logomarca do fabricante, preserva intacto
    if (item.toLowerCase().includes('logomarca') || item.toLowerCase().includes('emblema')) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
      continue;
    }

    // Se o item fala especificamente de "Cores/variações", atualiza para listar todas as variações oficiais
    if (
      item.toLowerCase().includes('cores/variações') ||
      item.toLowerCase().includes('variações fiéis') ||
      item.toLowerCase().includes('variações de cor')
    ) {
      const varEntry = `Variações de cor e estampa oficiais (${varNamesList}): todas adicionadas corretamente e retratadas em cada um dos seus respectivos quadros do storyboard.`;
      if (!seen.has(varEntry)) {
        seen.add(varEntry);
        result.push(varEntry);
      }
      continue;
    }

    // Verifica se este bullet é EXCLUSIVAMENTE sobre a cor/estampa de apenas uma das variações
    // ex: "Tecido azul-marinho com listras longitudinais finas em branco, cinza-claro e rosa-avermelhado..."
    const isExclusivelyColorPattern =
      /^(?:tecido|cor|estampa|versão)\s+(?:azul|vermelh|pret|branc|verde|amarel|cinza|listrad|estampad)/i.test(item) &&
      !item.toLowerCase().includes('formato') &&
      !item.toLowerCase().includes('dimens') &&
      !item.toLowerCase().includes('costura') &&
      !item.toLowerCase().includes('estrutura');

    if (isExclusivelyColorPattern) {
      const varEntry = `Variações de cor e estampa oficiais (${varNamesList}): manter as características de cada variação conforme fotos e quadros correspondentes do storyboard.`;
      if (!seen.has(varEntry)) {
        seen.add(varEntry);
        result.push(varEntry);
      }
      continue;
    }

    // Se o item descreve características físicas reais mas tem menção a cor específica de uma das variações
    // ex: "na versão azul-marinho", "franjas curtas azul-marinho", "tecido azul-marinho"
    let cleaned = item
      .replace(/\bna versão\s+([a-záàâãéêíóôõúç-]+)/gi, '')
      .replace(/\b(?:tecido|franjas|detalhes|lateral|peça)\s+(?:azul-marinho|azul-acinzentado|azul|vermelh[ao]|pret[ao]|branc[ao]|cinza)\b/gi, (match) => {
        return match.split(/\s+/)[0];
      })
      .replace(/rede-marinho/gi, 'rede')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }

  // Garante que exista um bullet explícito sobre as variações
  const hasVarEntry = result.some((r) => r.toLowerCase().includes('variações'));
  if (!hasVarEntry && varNamesList) {
    result.push(`Variações oficiais do produto (${varNamesList}): todas adicionadas corretamente e retratadas em cada um dos seus respectivos quadros do storyboard.`);
  }

  return result;
}

export interface DialogueDetectionResult {
  isDialogue: boolean;
  dialogueDescription?: string;
  dialogueScript?: string;
  speakers?: Array<{ speaker: string; gender?: string; speech: string }>;
  speakerLines?: {
    firstSpeaker?: { speaker: string; speech: string; gender?: string };
    secondSpeaker?: { speaker: string; speech: string; gender?: string };
  };
}

/**
 * Detecta se a fala/instruções descrevem um diálogo entre múltiplos personagens
 * (ex: homem e mulher em um encontro) ou uma narração individual padrão.
 */
export function detectDialogueInfo(params: {
  isDialogue?: boolean;
  dialogueDescription?: string;
  dialogueScript?: string;
  speakers?: Array<{ speaker: string; gender?: string; speech: string }>;
  additionalInstructions?: string;
  finalCopy?: string;
}): DialogueDetectionResult {
  const rawScript = params.dialogueScript?.trim() || '';
  const rawSpeakers = Array.isArray(params.speakers) ? params.speakers.filter((s) => s && s.speech) : [];

  // 1. Caso os campos já venham preenchidos e válidos da detecção por IA
  if (params.isDialogue && (rawScript || rawSpeakers.length > 0)) {
    const speakers = rawSpeakers.length > 0 ? rawSpeakers : [];
    const firstSpeaker = speakers[0];
    const secondSpeaker = speakers[1];
    return {
      isDialogue: true,
      dialogueDescription: params.dialogueDescription || 'Diálogo entre personagens em cena',
      dialogueScript: rawScript || speakers.map((s) => `${s.speaker}: "${s.speech}"`).join('\n'),
      speakers,
      speakerLines: {
        firstSpeaker,
        secondSpeaker,
      },
    };
  }

  // 1.5. A IA já analisou e concluiu que há apenas um personagem falando: não aplicar heurística
  if (params.isDialogue === false && rawSpeakers.length > 0) {
    return { isDialogue: false };
  }

  // 2. Análise heurística das instruções adicionais ou da copy final
  const fullText = `${params.additionalInstructions || ''}\n${params.finalCopy || ''}`;
  const lower = fullText.toLowerCase();

  const mentionsBoth =
    ((lower.includes('homem') || lower.includes('rapaz')) && (lower.includes('mulher') || lower.includes('moça'))) ||
    (lower.includes('ele') && lower.includes('ela') && (lower.includes('fala') || lower.includes('diz') || lower.includes('responde'))) ||
    lower.includes('diálogo') ||
    lower.includes('dialogo') ||
    lower.includes('duas pessoas') ||
    lower.includes('casal');

  const hasSpeakingVerb =
    /(?:fala|diz|responde|pergunt|vai falar|vai dizer|olha e fala|vira e fala|vira e diz)/i.test(fullText);

  if (mentionsBoth && hasSpeakingVerb) {
    const speakers: Array<{ speaker: string; gender?: string; speech: string }> = [];

    // Tenta extrair a fala da mulher/moça
    const womanMatch = fullText.match(
      /(?:ela|mulher|moça)\s+(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|no\s+restaurante\s+|no\s+encontro\s+)?(?:fala|diz|pergunta|falou)[:\s]+([^.]+?)(?=\s+(?:aí|ai|depois|então|ele|homem|rapaz)\s+(?:ele\s+)?(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|pega\s+)?(?:fala|diz|vai dizer|responde|falou)|$)/i
    );
    // Tenta extrair a fala do homem/rapaz
    const manMatch = fullText.match(
      /(?:ele|homem|rapaz)\s+(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|pega\s+o\s+celular\s+(?:dele\s+)?(?:e\s+)?|para\s+a\s+câmera\s+)?(?:fala|diz|vai dizer|responde|falou)[:\s]+([^.]+?)(?=\s+(?:e\s+nessas\s+falas|nessas\s+falas|essa\s+vai\s+terminar|como\s+eu\s+disse|aí|ai|depois|então|ela|mulher|moça|\.|$))/i
    );

    let womanSpeech = womanMatch ? womanMatch[1].trim() : '';
    let manSpeech = manMatch ? manMatch[1].trim() : '';

    womanSpeech = womanSpeech.replace(/^["'«“]+|["'»”]+$/g, '').trim();
    manSpeech = manSpeech.replace(/^["'«“]+|["'»”]+$/g, '').trim();

    // Remove metanarrativa remanescente
    manSpeech = manSpeech.replace(/\s+(?:e\s+nessas\s+falas|nessas\s+falas|essa\s+vai\s+terminar|como\s+eu\s+disse)[\s\S]*$/i, '').trim();

    if (womanSpeech) {
      speakers.push({
        speaker: 'Mulher',
        gender: 'feminina',
        speech: womanSpeech,
      });
    }
    if (manSpeech) {
      speakers.push({
        speaker: 'Homem',
        gender: 'masculina',
        speech: manSpeech,
      });
    }

    const script = speakers.length > 0
      ? speakers.map((s) => `${s.speaker}: "${s.speech}"`).join('\n')
      : rawScript || (params.finalCopy ? `Diálogo:\n${params.finalCopy}` : '');

    return {
      isDialogue: true,
      dialogueDescription: params.dialogueDescription || 'Diálogo entre Mulher e Homem em cena',
      dialogueScript: script,
      speakers,
      speakerLines: {
        firstSpeaker: speakers.find((s) => s.gender === 'feminina') || speakers[0],
        secondSpeaker: speakers.find((s) => s.gender === 'masculina') || speakers[1],
      },
    };
  }

  return { isDialogue: false };
}

/**
 * SEÇÃO 7.6 — Prompt-base para o gerador de imagem do Storyboard (1080 x 1920, grade 3x3, 9 cenas)
 */
export function buildProdutos2StoryboardImagePrompt(params: {
  productName: string;
  productLock: string[];
  finalCopy: string;
  visualMap: Produtos2VisualMapItem[];
  avatarDescription: string;
  framing: Produtos2Framing;
  scenarioDescription: string;
  scenes: Produtos2SceneItem[];
  additionalInstructions?: string;
  variations?: { name: string; photos: string[] }[];
  isDialogue?: boolean;
  dialogueDescription?: string;
  dialogueScript?: string;
  speakers?: Array<{ speaker: string; gender?: string; speech: string }>;
}): string {
  const {
    productName,
    productLock,
    finalCopy,
    visualMap,
    avatarDescription,
    framing,
    scenarioDescription,
    scenes,
    additionalInstructions,
    variations = [],
    isDialogue,
    dialogueDescription,
    dialogueScript,
    speakers,
  } = params;

  const dialogueInfo = detectDialogueInfo({
    isDialogue,
    dialogueDescription,
    dialogueScript,
    speakers,
    additionalInstructions,
    finalCopy,
  });

  const framingLabel =
    framing === 'com_rosto'
      ? 'com rosto (a pessoa aparece inteira, com rosto, principalmente no gancho e no fechamento/CTA)'
      : framing === 'sem_rosto'
      ? 'sem rosto (enquadrar sempre do pescoço para baixo, o rosto nunca aparece em nenhum quadro)'
      : 'POV em primeira pessoa (mostrar somente as mãos do usuário interagindo com o produto, nunca mostrar rosto ou corpo)';

  const visualMapLines = visualMap
    .map((m) => `"${m.excerpt}" → ${m.intent} (${m.visualProof}) → cenas ${m.scenes}`)
    .join('\n');

  const activeVars = (variations || []).filter(
    (v) => (v.name && v.name.trim().length > 0) || (v.photos && v.photos.length > 0)
  );

  const sanitizedProductLock =
    activeVars.length >= 2
      ? sanitizeProductLockForVariations(productLock, activeVars, productName)
      : productLock;

  let variationsBlock = '';
  if (activeVars.length >= 2) {
    variationsBlock = `

═══════════════════════════════════════════════════════════════════
REGRA MANDATÓRIA E INEGOCIÁVEL — DIVISÃO DE CORES DO PRODUTO (GRADE 3x3):
O produto possui ${activeVars.length} variações de cor/modelo anexadas nas fotos de referência:
${
  activeVars.length === 2
    ? `• Quadros 1, 2, 3 e 4 (metade inicial): O produto DEVE ser retratado OBRIGATORIAMENTE na COR/VARIAÇÃO 1: ${activeVars[0].name || '1ª Cor'}.
• Quadros 5, 6, 7, 8 e 9 (segunda metade): O produto DEVE ser retratado OBRIGATORIAMENTE na COR/VARIAÇÃO 2: ${activeVars[1].name || '2ª Cor'}.`
    : `• Quadros 1, 2 e 3 (Linha 1 do Storyboard): O produto DEVE ser retratado OBRIGATORIAMENTE na COR/VARIAÇÃO 1: ${activeVars[0].name || '1ª Cor'}.
• Quadros 4, 5 e 6 (Linha 2 do Storyboard): O produto DEVE ser retratado OBRIGATORIAMENTE na COR/VARIAÇÃO 2: ${activeVars[1].name || '2ª Cor'}.
• Quadros 7, 8 e 9 (Linha 3 do Storyboard): O produto DEVE ser retratado OBRIGATORIAMENTE na COR/VARIAÇÃO 3: ${activeVars[2].name || '3ª Cor'}.`
}
NARRATIVA CONTÍNUA E PROGRESSIVA: As 9 cenas contam uma única história contínua de demonstração do produto (NUNCA repita as mesmas ações ou cenas para cada cor). A demonstração progride normalmente da Cena 1 à Cena 9; apenas retrate o produto na cor indicada para cada grupo de quadros!
PROIBIÇÃO ABSOLUTA: NUNCA gere todos os 9 quadros na mesma cor! É expressamente PROIBIDO usar uma única cor para todo o storyboard quando há variações informadas. A divisão de cores acima é RIGOROSA e OBRIGATÓRIA!
═══════════════════════════════════════════════════════════════════`;
  }

  // Item 7.3: Usar exatamente as mesmas 9 descrições canônicas no storyboard e no Veo, injetando a variação correspondente
  const scenesLines = scenes
    .slice(0, 9)
    .map((sc, i) => {
      const varInfo = getSceneVariationInfo(i + 1, activeVars);
      const varTag = varInfo ? ` [COR/VARIAÇÃO OBRIGATÓRIA DESTE QUADRO: ${varInfo.variationName.toUpperCase()}]` : '';
      return `CENA ${i + 1} (QUADRO ${i + 1})${varTag}: ${getUnifiedSceneDescription(sc)}`;
    })
    .join('\n');

  const extraInstructions = additionalInstructions?.trim()
    ? `\nINSTRUÇÕES ADICIONAIS PRIORITÁRIAS DO USUÁRIO: ${additionalInstructions.trim()}`
    : '';

  const productIdentityRule =
    activeVars.length >= 2
      ? `O produto deve ser 100% idêntico no modelo, formato, peças, costuras e detalhes em todos os quadros (não redesenhar, não embelezar, não acrescentar peças e não simplificar detalhes), ALTERNANDO RIGOROSAMENTE A COR ENTRE OS GRUPOS DE QUADROS CONFORME A REGRA MANDATÓRIA DE VARIAÇÕES ACIMA.`
      : `O produto deve ser 100% idêntico em todos os quadros: não redesenhar, não embelezar, não trocar cor, não acrescentar peças e não simplificar detalhes.`;

  const dialogueScriptBlock = dialogueInfo.isDialogue && dialogueInfo.dialogueScript
    ? `\n\nROTEIRO E DISTRIBUIÇÃO DO DIÁLOGO DOS PERSONAGENS NAS CENAS:\n${dialogueInfo.dialogueScript}`
    : '';

  const charactersSection = dialogueInfo.isDialogue
    ? `PERSONAGENS EM CENA E INTERAÇÃO (DIÁLOGO): Dois personagens principais em interação direta e expressiva (Mulher e Homem), mantendo rigorosa continuidade física, de roupas e de traços em todos os 9 quadros. ${avatarDescription}. Enquadramento: ${framingLabel}.${dialogueScriptBlock}`
    : `PERSONAGEM: ${avatarDescription}, o mesmo em todos os quadros. Enquadramento: ${framingLabel}.`;

  return `Crie UMA ÚNICA IMAGEM VERTICAL na mais alta resolução fotográfica 4K UHD (2160x3840 ou 1080x1920, proporção 9:16) de storyboard fotográfico ultra-realista em grade 3x3 (3 colunas x 3 linhas), com EXATAMENTE 9 cenas numeradas de 1 a 9 em ordem de leitura (esquerda para direita, de cima para baixo). Quadros de tamanho igual, cantos arredondados, separados por uma borda branca fina, sobre fundo branco puro (#FFFFFF). Gravação com nitidez cristalina de câmera de smartphone moderno topo de linha, sem película plástica, névoa leitosa ou imagem pálida/desbotada.${variationsBlock}

Use as fotos anexadas como referência absoluta do produto. Preserve fielmente (PRODUCT LOCK): ${sanitizedProductLock.join('; ')}.
${productIdentityRule}
REGRA OBRIGATÓRIA DE LOGOMARCA DO FABRICANTE NO PRODUTO: A marca, a logomarca, o emblema/símbolo e os textos originais do fabricante que estão impressos, estampados ou gravados no próprio produto nas fotos de referência DEVEM aparecer 100% idênticos (mesmo desenho, formato, cor, proporção e posição exata na peça, como no encosto, painel ou corpo do produto) em TODOS os quadros onde essa parte do produto estiver visível. JAMAIS remova, apague ou deixe lisa a área onde fica a logomarca original do fabricante no produto!
PROIBIÇÃO ABSOLUTA DE SITE E CÓDIGO DE BARRAS EM EMBALAGENS/CAIXAS: É TERMINANTEMENTE PROIBIDO desenhar qualquer site, link de internet, domínio, URL (ex.: www..., .com, .com.br, https) ou código de barras/QR code em qualquer caixa, pacote ou embalagem do produto. As caixas, pacotes e embalagens devem ser 100% limpas de sites e códigos de barras!
A copy selecionada para este criativo é:
"${finalCopy}"
As cenas do storyboard devem ser construídas A PARTIR DESSA COPY. Cada cena deve provar, ilustrar ou reforçar visualmente um trecho da fala.

Mapa visual da copy:
${visualMapLines}

${charactersSection}
Estilo: fotografia ultra-realista com qualidade ótica de smartphone moderno topo de linha, estética UGC autêntica de anúncio de alta conversão, textura de pele natural, cores ricas e fiéis ao produto, ${scenarioDescription}. A iluminação, temperatura de cor e atmosfera devem acompanhar fielmente o contexto da cena especificada no prompt (seja dia claro, fim de tarde, luz de velas, noite ou ambiente residencial). Variar enquadramentos: close, macro, POV, plano médio, plano aberto.${extraInstructions}

DIRETRIZ CRÍTICA DE NITIDEZ ÓPTICA E ZERO PELÍCULA PLÁSTICA/OPACIDADE:
- LENTE CRISTALINA E ALTA DEFINIÇÃO DE SMARTPHONE MODERNO: Imagem nítida, sensor com foco apurado, contraste equilibrado e realismo autêntico.
- ZERO PELÍCULA PLÁSTICA, ZERO NÉVOA E ZERO IMAGEM PÁLIDA: É TERMINANTEMENTE PROIBIDO gerar imagem com aspecto de plástico/filme fosco ou amarelado por cima, névoa opaca/leitosa, desbotamento, palidez ou falta de definição. Cores com riqueza ótica e pretos limpos.
- ILUMINAÇÃO DINÂMICA INTEGRADA AO CENÁRIO: A iluminação deve sempre combinar de forma realista com a cena pedida no prompt (dia, noite, jantar, quarto, sala, etc.).

${scenesLines}

Mantenha continuidade de produto, logomarca original do fabricante no produto, personagem, ambiente e iluminação entre as cenas relacionadas. Cada quadro deve parecer uma fotografia real e utilizável como referência de futura animação.
Adicionar SOMENTE os números 1 a 9 em pequenos selos circulares brancos com número preto, no canto superior esquerdo de cada quadro.
PROIBIÇÃO EXCLUSIVA DE INTERFACE EXTERNA E PELÍCULA PLÁSTICA: NÃO adicionar frases flutuantes na tela, legendas, textos publicitários externos, ícone de carrinho de compras, botões, setas, preços, interface de aplicativo, logotipo do TikTok ou de rede social, nome de usuário/@, marca d'água externa, NUNCA incluir nenhum site (URL) ou código de barras em nenhuma caixa, pacote ou embalagem, E NUNCA gerar imagem com aspecto de película plástica opaca por cima, névoa leitosa ou palidez desbotada (mantendo obrigatoriamente a logomarca original do fabricante impressa no próprio produto com nitidez e cores fiéis).`;
}

/**
 * SEÇÃO 8.1 e 8.2 — Constrói o Prompt completo do Veo 3 (Omni Flash · 1 geração)
 * Suporta COM FALA e SEM FALA seguindo exatamente a estrutura validada.
 */
export function buildProdutos2VeoPrompt(params: {
  productName: string;
  duration: Produtos2Duration;
  speechMode: Produtos2SpeechMode;
  useSpeechIntro?: boolean;
  finalCopy: string;
  influencerResolved: 'Homem' | 'Mulher';
  framing: Produtos2Framing;
  productLock: string[];
  avatarDescription: string;
  scenarioDescription: string;
  scenes: Produtos2SceneItem[];
  additionalInstructions?: string;
  variations?: { name: string; photos: string[] }[];
  isDialogue?: boolean;
  dialogueDescription?: string;
  dialogueScript?: string;
  speakers?: Array<{ speaker: string; gender?: string; speech: string }>;
}): string {
  const {
    productName,
    duration,
    speechMode,
    useSpeechIntro = false,
    finalCopy,
    influencerResolved,
    framing,
    productLock,
    avatarDescription,
    scenarioDescription,
    scenes = [],
    additionalInstructions,
    variations = [],
    isDialogue,
    dialogueDescription,
    dialogueScript,
    speakers,
  } = params;

  const dialogueInfo = detectDialogueInfo({
    isDialogue,
    dialogueDescription,
    dialogueScript,
    speakers,
    additionalInstructions,
    finalCopy,
  });

  const isDialogueActive = dialogueInfo.isDialogue && speechMode === 'com_fala';

  // Aplica o prefixo "Nossa! " se useSpeechIntro estiver ativo, ou remove se estiver desativado (Padrão)
  const safeSpeech = applySpeechIntro(finalCopy, Boolean(useSpeechIntro));

  const activeVars = (variations || []).filter((v) => v.photos && v.photos.length > 0);

  // Item 7.1: Frase do primeiro frame com letra minúscula e sem ponto no meio (higienizada de cores fixas)
  const firstFrameScene = scenes?.[0]
    ? {
        ...scenes[0],
        action: activeVars.length >= 2
          ? sanitizeSceneColorAdjectivesForVeo(scenes[0].action, 1, activeVars, productName)
          : scenes[0].action,
      }
    : undefined;
  let firstFrameClause = formatFirstFrameClause(firstFrameScene, productName);
  if (isDialogueActive) {
    if (!firstFrameClause.toLowerCase().includes('mulher') && !firstFrameClause.toLowerCase().includes('moça')) {
      const isDining = /jantar|restaurante|cafeteria|mesa|encontro/i.test(`${scenarioDescription} ${additionalInstructions || ''}`);
      firstFrameClause = isDining
        ? `da mulher sentada à mesa vendo o ${productName} do homem e reagindo surpresa, apontando para ele`
        : `da mulher vendo o ${productName} do homem e reagindo surpresa, apontando para ele`;
    }
  }

  // Higieniza o productLock para não fixar apenas uma das cores quando houver múltiplas variações
  const sanitizedProductLock = activeVars.length >= 2
    ? sanitizeProductLockForVariations(productLock, activeVars, productName)
    : productLock;

  // Item 7.2: PRODUCT LOCK sempre igual no prompt da imagem e no prompt do Veo
  const productLockBullets = sanitizedProductLock
    .map((item) => `- ${item.replace(/^[-•*]\s*/, '')}`)
    .join('\n');

  const framingPersonRule =
    framing === 'com_rosto'
      ? speechMode === 'com_fala'
        ? isDialogueActive
          ? `Com rosto: os dois personagens aparecem de forma natural com expressões faciais vivas e espontâneas; nas cenas em que cada um fala (mulher no gancho/pergunta e homem na apresentação e indicação de compra), os lábios acompanham perfeitamente a sua respectiva fala com sincronia labial natural.`
          : `Com rosto: o rosto aparece de forma natural nas cenas de apresentação e na cena 9; nas cenas em que ${influencerResolved === 'Homem' ? 'ele' : 'ela'} fala olhando para a câmera, os lábios acompanham a fala com sincronia natural.`
        : `Com rosto: o rosto aparece de forma natural nas cenas de apresentação e na cena 9, sorrindo e demonstrando satisfação (sem mexer a boca como se estivesse falando).`
      : framing === 'sem_rosto'
      ? `Sem rosto: nunca mostrar o rosto em nenhuma cena; enquadrar sempre do pescoço para baixo.`
      : `POV: mostrar somente as mãos em primeira pessoa interagindo com ${productName}; nunca mostrar rosto ou corpo.`;

  const womanSpeaker = dialogueInfo.speakers?.find(
    (s) => s.gender === 'feminina' || /mulher|moça|ela|feminina/i.test(s.speaker)
  );
  const manSpeaker = dialogueInfo.speakers?.find(
    (s) => s.gender === 'masculina' || /homem|rapaz|ele|masculin/i.test(s.speaker)
  );

  let womanSpeech = womanSpeaker?.speech?.trim() || '';
  let manSpeech = manSpeaker?.speech?.trim() || '';

  if (!womanSpeech || !manSpeech) {
    const scriptMatchMulher = (dialogueInfo.dialogueScript || '').match(/mulher[:\s]+["'«“]?([^"\n»”]+)["'»”]?/i);
    const scriptMatchHomem = (dialogueInfo.dialogueScript || '').match(/homem[:\s]+["'«“]?([^"\n»”]+)["'»”]?/i);
    if (!womanSpeech && scriptMatchMulher) womanSpeech = scriptMatchMulher[1].trim();
    if (!manSpeech && scriptMatchHomem) manSpeech = scriptMatchHomem[1].trim();
  }

  if (!womanSpeech && safeSpeech) {
    const splitMatch = safeSpeech.match(/^([^?!]+[?!]+(?:\s+[^?!]+[?!]+)?)\s+([\s\S]+)$/);
    if (splitMatch) {
      womanSpeech = splitMatch[1].trim();
      if (!manSpeech) manSpeech = splitMatch[2].trim();
    }
  }

  if (!womanSpeech) womanSpeech = 'Que celular bonito! Que celular é esse?';
  if (!manSpeech) manSpeech = safeSpeech;

  // Quebra a fala da mulher e do homem para harmonizar as 9 micro-cenas
  const womanSentences = womanSpeech.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || [womanSpeech];
  const womanP1 = womanSentences[0] || womanSpeech;
  const womanP2 = womanSentences.length > 1 ? womanSentences.slice(1).join(' ') : womanP1;

  const manSentences = manSpeech.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || [manSpeech];
  const manP1 = manSentences[0] || manSpeech;
  const manP2 = manSentences.length > 2 ? manSentences[1] : '';
  const manTikTokSentence = manSentences.find((s) => /tiktok|comprei/i.test(s)) || (manSentences.length >= 3 ? manSentences[manSentences.length - 2] : '');
  const manCtaSentence = manSentences.find((s) => /carrinho|adquir|garant|toque|toca/i.test(s)) || manSentences[manSentences.length - 1] || '';

  // Item 7.3: Gerar o prompt a partir das MESMAS 9 descrições usadas para criar a imagem, sem reescrever as cenas
  // e orientando o Veo rigorosamente pelo número dos quadros (1 a 9) do storyboard anexado
  const scenesBlock = scenes
    .slice(0, 9)
    .map((sc, idx) => {
      const num = idx + 1;
      const isLast = num === 9;
      const unifiedDesc = getUnifiedSceneDescription(sc);
      let actionText = `${unifiedDesc} ${sc.cameraMovement || ''}`.trim();
      if (speechMode === 'sem_fala' && isLast) {
        actionText = actionText.replace(/falando para a câmera/gi, 'sorrindo e mostrando o produto para a câmera');
      }

      // Remove tags internas de variação do texto da ação (ex: [Variação de Cor: ...], [Produto na cor/variação: ...])
      actionText = actionText
        .replace(/\[(?:Produto na cor\/variação|Variação de Cor|COR\/VARIAÇÃO|Variação)[^\]]*\]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Se houver múltiplas variações, higieniza adjetivos fixos de cor no texto para não criar conflito com os outros quadros do storyboard
      if (activeVars.length >= 2) {
        actionText = sanitizeSceneColorAdjectivesForVeo(actionText, num, activeVars, productName);
      }

      // Se for diálogo ativo, harmoniza a atuação dos personagens e distribuição da fala em micro-cenas conforme padrão ouro
      if (isDialogueActive) {
        const cam = sc.cameraMovement ? `\n${sc.cameraMovement.trim()}` : '';
        const hasCustomDialogue = (/mulher|moça/i.test(actionText) || /homem|rapaz/i.test(actionText)) && /["'«“]/.test(actionText);

        if (!hasCustomDialogue) {
          if (num === 1) {
            actionText = `Plano médio com rosto. A mulher vê o ${productName} do homem, reage surpresa apontando para ele e fala com admiração: “${womanP1}”${cam || '\nPush-in rápido até a reação dela.'}`;
          } else if (num === 2) {
            actionText = `Close com rosto. O homem ergue o ${productName} entre os dois enquanto a mulher o observa admirada e pergunta: “${womanP2}”${cam || '\nTravelling lateral curto acompanhando o produto.'}`;
          } else if (num === 3) {
            actionText = `Close do produto. O homem gira o ${productName} para a mulher, exibindo os detalhes da peça, e inicia sua resposta: “${manP1}”${cam || '\nÓrbita curta e suave ao redor do produto.'}`;
          } else if (num === 4) {
            actionText = `Plano sobre o ombro. A mulher pega o ${productName} e inclina para admirar os detalhes.${manP2 ? `\nO homem continua falando: “${manP2}”` : '\nO homem continua a fala com segurança.'}${cam || '\nAproximação suave por trás do ombro dela.'}`;
          } else if (num === 5) {
            actionText = `POV de mãos. As mãos do homem seguram o ${productName} demonstrando o produto na prática.\nO homem continua a explicação com entusiasmo.${cam || '\nLeve estabilização de primeira pessoa com avanço sutil.'}`;
          } else if (num === 6) {
            actionText = `Macro. Detalhes construtivos, textura e acabamento de ${productName}.\nDeslizamento macro suave.\nO homem continua sua fala de forma natural e rápida.${cam ? `\n${cam.trim()}` : ''}`;
          } else if (num === 7) {
            actionText = `Close lateral. O homem manuseia o ${productName} revelando a construção e acabamento.\nO homem fala: “${manTikTokSentence || 'Eu comprei na TikTok Shop...'}”${cam || '\nPan curto acompanhando os detalhes.'}`;
          } else if (num === 8) {
            actionText = `Plano aberto com rosto. O casal sorri enquanto o homem apoia o ${productName} ao lado com satisfação.\nAfastamento suave revelando o ambiente.\nO homem prepara o encerramento da fala.${cam ? `\n${cam.trim()}` : ''}`;
          } else if (isLast) {
            actionText = `Plano médio com rosto. O homem olha para a câmera e apresenta o ${productName} em destaque.\nEle conclui diretamente para a câmera: “${manCtaSentence || '...toca no carrinho laranja!'}”${cam || '\nPush-in final curto e firme.'}`;
          }
        }
      }

      // O prompt do Veo orienta pelas cenas do storyboard pelo número delas (Quadros 1 a 9 da imagem anexada)
      const sceneStoryboardRef = ` [Visual e cor do produto: idêntico ao Quadro ${num} do storyboard anexado]`;
      return `CENA ${num} — ${sc.startTime} a ${sc.endTime}s${sceneStoryboardRef}\n${actionText}`;
    })
    .join('\n\n');

  const singleSpeaker = !isDialogueActive && Array.isArray(speakers) && speakers.length === 1 ? speakers[0] : undefined;
  const voiceGender = singleSpeaker?.gender === 'masculina'
    ? 'MASCULINA'
    : singleSpeaker?.gender === 'feminina'
    ? 'FEMININA'
    : influencerResolved === 'Homem' ? 'MASCULINA' : 'FEMININA';
  const accentMatch = additionalInstructions?.match(/sotaque\s+([a-záàâãéêíóôõúç]+)/i);
  const accentClause = accentMatch ? `, com sotaque ${accentMatch[1]}` : '';

  // Item 3: Bloco de palavras da fala exclusivas do áudio
  const speechWordsAudioOnlyLines: string[] = [];
  const lowerCopy = safeSpeech.toLowerCase();

  if (lowerCopy.includes('tiktok') || lowerCopy.includes('tik tok')) {
    speechWordsAudioOnlyLines.push(
      `A palavra "TikTok" existe SOMENTE NA LOCUÇÃO. Ela NÃO deve gerar logotipo, marca d'água, nome de usuário nem nenhum elemento visual de rede social.`
    );
  }

  const matchedCtaTerms: string[] = [];
  for (const term of ['carrinho laranja', 'carrinho', 'botão', 'link', 'aqui embaixo', 'veja aqui']) {
    if (lowerCopy.includes(term)) {
      if (term === 'carrinho' && matchedCtaTerms.includes('carrinho laranja')) continue;
      matchedCtaTerms.push(term);
    }
  }
  if (matchedCtaTerms.length > 0) {
    speechWordsAudioOnlyLines.push(
      `A expressão "${matchedCtaTerms.join(' / ')}" existe SOMENTE NA LOCUÇÃO. Ela NÃO deve gerar carrinho, ícone de carrinho, desenho de carrinho ou botão em nenhum momento.`
    );
  }

  speechWordsAudioOnlyLines.push(
    `"${productName}" e as especificações existem SOMENTE NA LOCUÇÃO. NÃO escrever nenhuma palavra ou número na tela.`
  );

  const speechWordsOnlyBlock = `\n\nAS PALAVRAS DA FALA EXISTEM SOMENTE NO ÁUDIO:\n${speechWordsAudioOnlyLines.join('\n')}`;

  const audioSection =
    speechMode === 'com_fala'
      ? isDialogueActive
        ? `========================
LOCUÇÃO E DIÁLOGO — MUITO IMPORTANTE
========================
Usar DUAS VOZES naturais em português do Brasil:
- Uma voz feminina para a mulher, somente nas Cenas 1 e 2.
- Uma voz masculina para o homem, a partir da Cena 3 até o final.

O diálogo deve acontecer UMA ÚNICA VEZ durante todo o vídeo, em fluxo contínuo, sem reiniciar falas a cada corte.
NÃO repetir o começo.
NÃO repetir nenhuma frase.
NÃO criar narradores extras.
NÃO usar uma única voz feminina para todo o vídeo.
NÃO fazer a mulher falar a parte do homem.
NÃO fazer o homem repetir a pergunta inicial da mulher.

FALAR EXATAMENTE UMA VEZ, COM ESTA DIVISÃO DE PERSONAGENS:

MULHER:
“${womanSpeech}”

HOMEM:
“${manSpeech}”

RITMO E TOM DA FALA:
A fala da mulher deve ser espontânea, curiosa, admirada e energética, como alguém que acabou de notar um ${productName} muito bonito.
A fala do homem deve ser rápida, segura, entusiasmada, natural e expressiva, como alguém recomendando uma novidade imperdível.
Todo o diálogo deve ser compreensível dentro dos ${duration} segundos, com ritmo acelerado, fluido e sem pausas desnecessárias.
Não cortar palavras.
Não acelerar de forma robótica.
Manter dicção clara, sincronização labial natural e energia comercial de UGC premium.${speechWordsOnlyBlock}`
        : `========================
LOCUÇÃO — MUITO IMPORTANTE
========================
Usar UMA ÚNICA VOZ ${voiceGender} em português do Brasil${accentClause}.
A copy abaixo foi previamente selecionada como copy validada e deve ser mantida. NÃO alterar o texto.
A locução deve ser UMA ÚNICA FALA CONTÍNUA durante todo o vídeo.
A voz começa uma vez no início e continua por cima de todas as mudanças de cena.
NÃO reiniciar a fala a cada corte.
NÃO repetir o começo.
NÃO repetir nenhuma frase.
NÃO criar uma fala diferente para cada cena.
NÃO criar várias narradoras.

FALAR EXATAMENTE UMA VEZ:
"${safeSpeech}"

RITMO E TOM DA FALA (PRIORIDADE ABSOLUTA):
A fala DEVE ser RÁPIDA E EUFÓRICA, com tom entusiasmado, acelerado e espontâneo como se a pessoa estivesse contando uma novidade imperdível, algo novo e urgente que o espectador precisa prestar atenção agora.
Locução ágil, sem arrastar e sem pausas desnecessárias, garantindo que todo o texto seja pronunciado com total clareza e emoção dentro do tempo do vídeo sem cortes.
Tom da voz: natural, brasileiro, rápido, eufórico, dinâmico e expressivo, com energia contagiante de novidade imperdível.${speechWordsOnlyBlock}`
      : `========================
ÁUDIO — SEM FALA
========================
NÃO usar locução. NÃO usar narração. Ninguém fala no vídeo e ninguém mexe a boca como se estivesse falando.
Usar apenas som ambiente natural do cenário e uma trilha instrumental animada e leve, com ritmo que acompanha os cortes.`;

  // Item 5: PRIORIDADE MÁXIMA
  const copyStartClause = useSpeechIntro
    ? 'respeitar a copy validada, falada exatamente uma vez começando obrigatoriamente com "Nossa! ";'
    : 'respeitar a copy validada, falada exatamente uma vez sem introduções extras;';

  const prioritySection =
    speechMode === 'com_fala'
      ? isDialogueActive
        ? `PRIORIDADE MÁXIMA:
1. Vídeo limpo, sem marca d'água, sem logo do TikTok, sem @, sem carrinho e sem nenhum texto adicionado; a marca/logo que já está impressa no produto aparece idêntica às fotos de referência.
2. A mulher fala exclusivamente: “${womanSpeech}”
3. O homem fala exclusivamente o restante da copy: “${manSpeech}”
4. O diálogo completo é falado exatamente uma vez, sem introduções extras, sem reinícios e sem repetições.
5. Locução rápida, natural, eufórica e clara, com sincronização labial correta para cada personagem.
6. Usar as cenas como tradução visual do diálogo.
7. Fidelidade absoluta ao produto e às cores retratadas em cada um dos quadros de 1 a 9 do storyboard anexado.
8. Usar o storyboard somente como guia visual e nunca exibi-lo.
9. Começar diretamente com uma nova cena real em movimento.
10. Recriar as 9 cenas na ordem dos números correspondentes aos quadros de 1 a 9 do storyboard anexado.
11. Fazer um vídeo rápido, realista e muito dinâmico.`
        : `PRIORIDADE MÁXIMA:
1. vídeo limpo: sem marca d'água, sem logo do TikTok, sem @, sem carrinho e sem nenhum texto adicionado; a marca/logo que já está impressa no produto aparece idêntica às fotos;
2. ${copyStartClause}
3. locução RÁPIDA E EUFÓRICA (estilo contando uma novidade imperdível), garantindo ritmo ágil para falar todo o texto com clareza sem cortes;
4. usar as cenas como tradução visual da copy;
5. fidelidade absoluta ao produto (PRODUCT LOCK) e às cores retratadas em cada um dos quadros de 1 a 9 do storyboard anexado;
6. usar o storyboard somente como guia visual e nunca exibi-lo;
7. começar diretamente com uma nova cena real em movimento;
8. recriar as 9 cenas na ordem dos números correspondentes aos quadros 1 a 9 do storyboard anexado;
9. fazer um vídeo rápido e muito dinâmico;
10. usar uma única locução contínua, sem repetições.`
      : `PRIORIDADE MÁXIMA:
1. vídeo limpo: sem marca d'água, sem logo do TikTok, sem @, sem carrinho e sem nenhum texto adicionado; a marca/logo que já está impressa no produto aparece idêntica às fotos;
2. seguir a ordem das cenas definida pela copy;
3. usar as cenas como tradução visual e demonstração real do produto;
4. fidelidade absoluta ao produto (PRODUCT LOCK) e às cores retratadas em cada um dos quadros de 1 a 9 do storyboard anexado;
5. usar o storyboard somente como guia visual e nunca exibi-lo;
6. começar diretamente com uma nova cena real em movimento;
7. recriar as 9 cenas na ordem dos números correspondentes aos quadros 1 a 9 do storyboard anexado;
8. fazer um vídeo rápido e muito dinâmico;
9. nenhuma voz e nenhuma fala no vídeo.`;

  const productLockColorClause =
    activeVars.length >= 2
      ? `Manter o modelo, acabamento, textura, proporções e costuras do produto idênticos em todas as cenas. Nas cenas onde o produto alternar de cor ou modelo entre os quadros do storyboard (quadros 1 a 9), reproduza com total fidelidade em cada cena a cor exata retratada no respectivo Quadro correspondente do storyboard anexado.`
      : `Não alterar a aparência do produto entre as cenas. Não redesenhar, não trocar cor, não acrescentar peças e não simplificar detalhes.`;

  const coupleDescription = dialogueInfo.dialogueDescription?.trim()
    ? dialogueInfo.dialogueDescription.trim()
    : avatarDescription;

  const charactersSection = isDialogueActive
    ? `========================
PERSONAGENS
========================
${coupleDescription}
Os dois são os mesmos em todas as cenas, mantendo roupas, aparência e continuidade visual idênticas ao storyboard.

A mulher fala somente no início, nas Cenas 1 e 2, com expressão natural de surpresa e admiração.
O homem fala o restante da locução a partir da Cena 3, com expressão segura, espontânea e entusiasmada.
Nas cenas em que cada personagem estiver falando com o rosto visível, os lábios devem acompanhar a fala com sincronia natural em português do Brasil.`
    : `========================
PERSONAGEM
========================
${avatarDescription} — o mesmo em todas as cenas.
${framingPersonRule}`;

  // Item 1, Item 2, Item 4 e CORREÇÃO 2 (Parte G: "gravação real" em vez de "gravação caseira")
  return `Crie um vídeo vertical 9:16, ultra-realista, com aparência de gravação real feita com smartphone (estilo UGC), com duração total de ${duration} segundos.

VÍDEO LIMPO — REGRA ABSOLUTA:
O vídeo é uma filmagem original e limpa. O quadro inteiro mostra somente a cena filmada, do primeiro ao último frame.
Os quatro cantos da tela ficam livres, sem nada por cima da imagem.
NÃO adicionar marca d'água.
NÃO adicionar logotipo flutuante.
NÃO adicionar nome de usuário, @ ou perfil.
NÃO adicionar logotipo de nenhuma rede social ou aplicativo.
NÃO adicionar textos, legendas, números, ícones, botões ou stickers.
NÃO adicionar site, endereço de site, link, URL ou domínio em caixas, pacotes ou embalagens do produto.
NÃO adicionar código de barras, barras ou QR code em nenhuma embalagem, pacote ou caixa de produto.
EXCEÇÃO: a marca, o logo e os textos que já estão impressos no próprio produto (iguais às fotos de referência e ao storyboard) DEVEM aparecer, idênticos, sempre que aquela parte do produto estiver visível.

IMPORTANTE SOBRE A IMAGEM ANEXADA (STORYBOARD DE REFERÊNCIA — 9 QUADROS NUMERADOS):
A imagem anexada é uma grade 3x3 de storyboard contendo EXATAMENTE 9 quadros numerados de 1 a 9 em ordem de leitura.
NÃO mostre a imagem do storyboard no vídeo.
NÃO use o storyboard como primeiro frame.
NÃO use a grade 3x3 como introdução.
NÃO reproduza a imagem completa nem mostre números, bordas ou divisões.
NÃO faça colagem. NÃO faça tela dividida. NÃO faça mosaico.
Use o storyboard para entender o produto, as pessoas, os enquadramentos e a progressão contínua das 9 cenas.
RECRIE cada quadro do storyboard como uma NOVA CENA REALISTA E INDEPENDENTE EM MOVIMENTO.
O PRIMEIRO FRAME DO VÍDEO já deve ser uma cena real em movimento ${firstFrameClause}, e nunca a imagem inteira do storyboard.

CORRESPONDÊNCIA OBRIGATÓRIA AOS QUADROS 1 A 9 DO STORYBOARD:
O vídeo deve recriar fielmente as 9 micro-cenas seguindo rigorosamente a ordem e o conteúdo visual dos quadros de 1 a 9 da imagem anexada:
- A Cena 1 corresponde estritamente ao Quadro 1 do storyboard anexado.
- A Cena 2 corresponde estritamente ao Quadro 2 do storyboard anexado.
- A Cena 3 corresponde estritamente ao Quadro 3 do storyboard anexado.
- A Cena 4 corresponde estritamente ao Quadro 4 do storyboard anexado.
- A Cena 5 corresponde estritamente ao Quadro 5 do storyboard anexado.
- A Cena 6 corresponde estritamente ao Quadro 6 do storyboard anexado.
- A Cena 7 corresponde estritamente ao Quadro 7 do storyboard anexado.
- A Cena 8 corresponde estritamente ao Quadro 8 do storyboard anexado.
- A Cena 9 corresponde estritamente ao Quadro 9 do storyboard anexado.
Cada cena do vídeo deve reproduzir os mesmos personagens, roupas, cenário, enquadramento de câmera e ações retratadas no respectivo Quadro (1 a 9) da imagem.

REGRA DE CORES E VARIAÇÕES POR QUADRO DO STORYBOARD:
Cada cena do vídeo DEVE reproduzir a cor, estampa e acabamento do produto EXATAMENTE como retratados no respectivo Quadro correspondente (1 a 9) do storyboard anexado.
Quando o storyboard alternar a cor do produto entre os quadros (por exemplo, uma cor nos quadros 1 a 3, outra cor nos quadros 4 a 6 e outra nos quadros 7 a 9), o vídeo DEVE acompanhar fielmente essa mudança em cada cena, usando a cor do produto ilustrada naquele quadro específico! A imagem do storyboard é a referência visual soberana e absoluta da cor do produto para cada cena.

========================
FIDELIDADE DO PRODUTO (PRODUCT LOCK)
========================
Manter ${productName} exatamente como aparece no storyboard e nas fotos:
${productLockBullets}
${productLockColorClause} A marca, a logomarca/emblema e os textos do fabricante impressos no próprio produto DEVEM aparecer 100% idênticos às fotos de referência em todas as cenas em que aquela parte do produto estiver visível. Proibido apenas adicionar textos ou logos externos de redes sociais (como TikTok/@/carrinho) na tela.

${charactersSection}

========================
STORYBOARD — 9 MICRO-CENAS
========================
${scenesBlock}

${audioSection}

========================
ESTILO DO VÍDEO
========================
Vídeo MUITO DINÂMICO e dopaminérgico.
Criar aproximadamente 9 micro-cenas dentro dos ${duration} segundos.
- cortes rápidos
- mudanças frequentes de enquadramento
- close, macro, POV, plano médio, plano aberto
- movimentos de mãos
- demonstração real e física de uso de ${productName}
- pequenos push-ins e zooms da câmera
- aparência real de gravação com smartphone moderno topo de linha
- iluminação clara e límpida de luz do dia (sem tons amarelados ou opacidade)
- ${scenarioDescription}
- UGC premium
- alta retenção visual
- nenhuma cena longa ou parada
A cada aproximadamente 0,8 a 1,3 segundo deve acontecer alguma mudança visual.

========================
PROIBIÇÕES
========================
NÃO mostrar a imagem completa do storyboard.
NÃO usar o storyboard como primeiro frame.
NÃO mostrar grade 3x3.
NÃO mostrar números 1 a 9.
NÃO mostrar bordas entre cenas.
NÃO mostrar legendas.
NÃO adicionar textos na tela.
NÃO adicionar marca d'água.
NÃO adicionar nome de usuário ou @.
NÃO adicionar logotipo do TikTok nem de nenhuma rede social ou aplicativo.
NÃO adicionar interface de aplicativo.
NÃO adicionar carrinho, ícone de carrinho ou desenho de carrinho.
NÃO adicionar botão de compra.
NÃO adicionar stickers.
NÃO adicionar site, endereço de site, link ou URL em nenhuma embalagem, caixa ou pacote.
NÃO adicionar código de barras ou QR code em nenhuma caixa, pacote ou embalagem do produto.

${prioritySection}`;
}

/**
 * Calcula os tempos das 9 cenas somando exatamente 10.0s ou 8.0s (Seção 7.3)
 */
export function getNineSceneTimings(duration: Produtos2Duration): { start: string; end: string }[] {
  if (duration === 8) {
    return [
      { start: '0.0', end: '0.8' },
      { start: '0.8', end: '1.7' },
      { start: '1.7', end: '2.6' },
      { start: '2.6', end: '3.5' },
      { start: '3.5', end: '4.4' },
      { start: '4.4', end: '5.3' },
      { start: '5.3', end: '6.2' },
      { start: '6.2', end: '7.1' },
      { start: '7.1', end: '8.0' },
    ];
  }
  return [
    { start: '0.0', end: '0.9' },
    { start: '0.9', end: '1.9' },
    { start: '1.9', end: '3.0' },
    { start: '3.0', end: '4.1' },
    { start: '4.1', end: '5.3' },
    { start: '5.3', end: '6.5' },
    { start: '6.5', end: '7.7' },
    { start: '7.7', end: '8.8' },
    { start: '8.8', end: '10.0' },
  ];
}

/**
 * PARTE G — Resolve a descrição de cenário respeitando estritamente a escolha do usuário:
 * - Se "Em casa" (em_casa): "casa brasileira simples e aconchegante, [cômodo adequado ao produto]"
 * - Se "Cenário padrão de uso" (padrao_uso): lugar real onde o produto é usado, SEM mencionar "casa", "caseiro" ou "casa brasileira"
 *   (a menos que o uso real seja exclusivamente dentro de um cômodo doméstico como cozinha/banheiro).
 * - Se o usuário informou um local nas Instruções adicionais (ex: "na praia"), essa instrução tem prioridade.
 */
export function extractCleanScenarioFromInstructions(instructions?: string): string | null {
  if (!instructions || !instructions.trim()) return null;
  const raw = instructions.trim();
  // Se for uma instrução curta puramente de local, ex: "na praia", "no quintal", "em um sítio"
  if (raw.length < 60 && !/(?:fala|diz|falou|responde|comprei|carrinho|rapaz|homem|mulher|moça)/i.test(raw)) {
    return raw;
  }
  // Se for um texto longo misto com falas e personagens, extrai apenas o cenário
  if (/cafeteria/i.test(raw)) {
    const sunSet = /p[ôo]r\s+do\s+sol/i.test(raw) ? ' ao pôr do sol' : '';
    return `cafeteria brasileira acolhedora${sunSet}`;
  }
  if (/restaurante/i.test(raw)) {
    const romantic = /rom[âa]ntic/i.test(raw) ? ' para jantar romântico' : '';
    return `restaurante brasileiro intimista${romantic}, com mesa bem posta e iluminação suave`;
  }
  if (/praia/i.test(raw)) return 'praia ao ar livre com luz solar natural';
  if (/oficina/i.test(raw)) return 'oficina mecânica bem iluminada';
  if (/academia|treino/i.test(raw)) return 'academia ou espaço de treino bem iluminado';
  if (/parque|praça/i.test(raw)) return 'parque arborizado ao ar livre com luz natural';
  return null;
}

export function resolveProdutos2ScenarioDescription(params: {
  scenario: Produtos2Scenario;
  niche: string;
  productName: string;
  productInfo: string;
  additionalInstructions?: string;
}): string {
  const { scenario, niche, productName, productInfo, additionalInstructions } = params;
  const combined = `${productName} ${productInfo}`.toLowerCase();
  const cleanExtraScenario = extractCleanScenarioFromInstructions(additionalInstructions);

  if (scenario === 'em_casa') {
    let room = 'sala bem iluminada';
    if (/cozinha|air\s*fryer|fritadeira|panela|panificadora|liquidificador|cafeteira|garrafa|copo/i.test(combined)) {
      room = 'cozinha organizada e bem iluminada';
    } else if (/banheiro|vaso\s+sanitario|pastilha|toalha|rack\s+de\s+banheiro/i.test(combined)) {
      room = 'banheiro limpo e bem iluminado';
    } else if (/cabelo|chapinha|escova|secador|maquiagem|vestido|camisa|camiseta|bermuda|calca|tenis/i.test(combined)) {
      room = 'quarto organizado e bem iluminado';
    } else if (/rocadeira|cortador|jardim|grama|pulverizador|moto|carro|ferramenta|furadeira|parafusadeira/i.test(combined)) {
      room = 'quintal ou garagem bem iluminada';
    } else if (/banco|esteira|halter|treino|exercicio|academia|fitness/i.test(combined)) {
      room = 'sala espaçosa com área de treino e luz natural';
    }
    const baseHome = `casa brasileira simples e aconchegante, ${room}`;
    if (cleanExtraScenario) {
      return `${baseHome} (${cleanExtraScenario})`;
    }
    return baseHome;
  }

  // scenario === 'padrao_uso': lugar real de uso, SEM "casa", "caseiro" ou "casa brasileira"
  const padraoByNiche: Record<string, string> = {
    'Pesca': 'margem de represa ao amanhecer com água calma e vegetação natural',
    'Natação / Esporte aquático': 'borda de piscina com água cristalina sob luz solar natural',
    'Som automotivo': 'interior de um carro estacionado em local bem iluminado',
    'Mobilidade elétrica': 'ciclovia e rua arborizada ao ar livre durante o dia',
    'Climatização': 'ambiente interno confortável e arejado em dia de calor',
    'Cozinha / Eletroportáteis': 'cozinha real em uso com bancada limpa e bem iluminada',
    'Garrafas e copos': 'mesa de trabalho ou bancada de academia com luz natural',
    'Jardim': 'jardim gramado ao ar livre, dia ensolarado',
    'Agro e roça': 'terreno de sítio e lavoura ao ar livre sob luz do dia',
    'Pet': 'ambiente interno organizado com tapete e área pet',
    'Cabelo e beleza': 'penteadeira bem iluminada com espelho e luz natural',
    'Casa, banheiro e organização': 'ambiente interno organizado e bem iluminado em uso real',
    'Moto e acessórios automotivos': 'estacionamento aberto ou garagem ampla com moto estacionada',
    'Conforto para os pés': 'piso limpo e bem iluminado destacando o calçado nos pés',
    'Limpeza e descartáveis': 'bancada de preparo e limpeza bem iluminada em uso prático',
    'Festa e decoração': 'salão de festa decorado com mesa principal iluminada',
    'Eletrônicos': 'bancada moderna de trabalho e setup bem iluminado com luz natural',
    'Infantil e brinquedos': 'pátio amplo ou área de lazer ao ar livre bem iluminada (adulto apresentando e criança brincando)',
    'Fitness': 'academia ou espaço de treino bem iluminado com equipamentos ao fundo',
    'Energia': 'bancada técnica de trabalho e operação bem iluminada',
    'Ferramentas': 'oficina mecânica ou bancada de trabalho prático bem iluminada',
    'Música': 'estúdio musical ou palco bem iluminado',
    'Calçados masculinos': 'rua/parque em corrida ao ar livre e piso de academia bem iluminado',
    'Roupas masculinas': 'ambiente urbano moderno ao ar livre e espaço de treino bem iluminado',
  };

  let resolved = padraoByNiche[niche] || '';
  if (!resolved) {
    if (/banco|supino|musculacao|treino|exercicio|halter|esteira|fitness|academia/i.test(combined)) {
      resolved = 'academia ou espaço de treino bem iluminado';
    } else if (/cortador|rocadeira|grama|jardim|pulverizador/i.test(combined)) {
      resolved = 'jardim gramado ao ar livre, dia ensolarado';
    } else if (/pesca|vara|molinete|carretilha/i.test(combined)) {
      resolved = 'margem de represa ao amanhecer';
    } else if (/som\s+automotivo|alto-falante|amplificador|carro|automotivo/i.test(combined)) {
      resolved = 'interior de um carro';
    } else if (/tenis|corrida|calcado/i.test(combined)) {
      resolved = 'rua/parque em corrida ao ar livre';
    } else if (/panela|air\s*fryer|liquidificador|cozinha/i.test(combined)) {
      resolved = 'cozinha real em uso';
    } else {
      resolved = 'ambiente real de uso prático do produto, organizado e com iluminação natural';
    }
  }

  if (cleanExtraScenario) {
    return cleanExtraScenario;
  }
  return resolved;
}

/**
 * Garante que quando scenario === 'padrao_uso', a descrição de cenário gerada pela IA não contenha
 * "casa brasileira" ou "caseiro/caseira" indevidamente (Parte G).
 */
export function sanitizeScenarioDescriptionForMode(
  rawScenarioDesc: string,
  scenario: Produtos2Scenario,
  fallbackScenarioDesc: string,
  additionalInstructions?: string
): string {
  const clean = (rawScenarioDesc || '').trim();
  if (!clean) return fallbackScenarioDesc;

  // Se o usuário pediu explicitamente casa nas instruções adicionais, respeita
  if (additionalInstructions && /\bcasa\b/i.test(additionalInstructions)) {
    return clean;
  }

  if (scenario === 'padrao_uso') {
    const cleaned = clean
      .replace(/\bcasa brasileira aconchegante e bem iluminada(?: com luz natural limpa)?\b/gi, fallbackScenarioDesc)
      .replace(/\bcasa brasileira simples e aconchegante\b/gi, fallbackScenarioDesc)
      .replace(/\bcasa brasileira simples\b/gi, fallbackScenarioDesc)
      .replace(/\bcasa brasileira\b/gi, 'ambiente real')
      .replace(/\bresidencial brasileiro\b/gi, 'real')
      .replace(/\bresidencial\b/gi, 'de uso real')
      .replace(/\bcaseiro\b/gi, 'profissional')
      .replace(/\bcaseira\b/gi, 'real')
      .replace(/\bde casa\b/gi, 'de uso real')
      .replace(/\bem casa\b/gi, 'no local de treino/uso')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || fallbackScenarioDesc;
  }

  return clean;
}

/**
 * Planejador determinístico estruturado (COPY-FIRST — Seção 7)
 * Garante que as 9 cenas provem visualmente a copy escolhida mesmo se a IA demorar ou falhar.
 */
export function buildDefaultProdutos2Plan(params: {
  productName: string;
  productInfo: string;
  niche: string;
  subMode: Produtos2SubMode;
  maleSubOption: Produtos2MaleSubOption;
  maleClothStyle: Produtos2MaleClothStyle;
  finalCopy: string;
  duration: Produtos2Duration;
  influencerResolved: 'Homem' | 'Mulher';
  clientGender: Produtos2ClientGender;
  framing: Produtos2Framing;
  scenario: Produtos2Scenario;
  additionalInstructions?: string;
  variationNames: string[];
  variations?: { name: string; photos: string[] }[];
}): {
  productLock: string[];
  avatarDescription: string;
  scenarioDescription: string;
  visualMap: Produtos2VisualMapItem[];
  scenes: Produtos2SceneItem[];
} {
  const {
    productName,
    productInfo,
    niche,
    subMode,
    maleSubOption,
    finalCopy,
    duration,
    influencerResolved,
    framing,
    scenario,
    additionalInstructions,
    variationNames,
    variations = [],
  } = params;

  const timings = getNineSceneTimings(duration);

  // 1. PRODUCT LOCK
  const colorsNote =
    variationNames.length > 1
      ? `Cores/variações fiéis às fotos anexadas (${variationNames.join(', ')})`
      : `Cor e acabamento 100% fiéis às fotos reais enviadas`;

  const infoHighlights = productInfo
    .split(/[\r\n.;•]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && s.length < 90)
    .slice(0, 3);

  const productLock: string[] = [
    `LOGOMARCA E IDENTIDADE DO FABRICANTE: Preservar 100% idênticos a logomarca, o emblema/símbolo e o nome da marca originais do fabricante impressos/estampados no próprio produto nas fotos de referência (mesmo desenho, cor, tamanho e posição exata na peça, jamais apagar ou alisar a logo do produto)`,
    `Formato, silhueta, proporção e dimensões exatas de ${productName} conforme fotos anexadas`,
    colorsNote,
    `Textura, material, costuras, encaixes, botões e funções originais preservados 1:1 sem redesenho`,
    ...(infoHighlights.length > 0 ? infoHighlights : [`Acabamento físico autêntico idêntico em todas as 9 cenas`]),
  ];

  // 2. AVATAR
  const isAdultMale = influencerResolved === 'Homem';
  let avatarDescription = isAdultMale
    ? `Homem brasileiro adulto comum (~28 a 38 anos), aparência autêntica e natural, vestindo roupa casual do dia a dia compatível com o uso do produto, pele limpa sem tatuagens`
    : `Mulher brasileira adulta comum (~26 a 36 anos), aparência autêntica e simpática, vestindo roupa casual do dia a dia, pele limpa sem tatuagens`;

  const dInfo = detectDialogueInfo({ additionalInstructions, finalCopy });
  if (dInfo.isDialogue) {
    const isBlackCouple = /negros?|negras?/i.test(additionalInstructions || '');
    const coupleEthnicity = isBlackCouple ? 'negros ' : '';
    avatarDescription = `Casal brasileiro autêntico, homem e mulher ${coupleEthnicity}jovens de aproximadamente 22 a 28 anos, elegantes e espontâneos em um encontro agradável`;
  }

  if (additionalInstructions && additionalInstructions.trim()) {
    avatarDescription += ` (Prioridade de instrução do usuário: ${additionalInstructions.trim()})`;
  }

  // 3. CENÁRIO (Parte G: respeita "Em casa" vs "Cenário padrão de uso" sem vazar "casa brasileira" no padrão de uso)
  const scenarioDescription = resolveProdutos2ScenarioDescription({
    scenario,
    niche,
    productName,
    productInfo,
    additionalInstructions,
  });


  // 4. QUEBRAR COPY EM BLOCOS PARA O MAPA VISUAL
  const sentences = finalCopy.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [finalCopy];
  const s1 = sentences[0] || finalCopy;
  const s2 = sentences[1] || s1;
  const s3 = sentences[2] || s2;
  const sLast = sentences[sentences.length - 1] || s1;

  const visualMap: Produtos2VisualMapItem[] = [
    {
      excerpt: s1,
      intent: 'Gancho visual e apresentação imediata',
      visualProof: `Close forte revelando ${productName} com nitidez nas mãos e contexto real`,
      scenes: '1–2',
    },
    {
      excerpt: s2,
      intent: 'Provar o 1º argumento e benefício central',
      visualProof: `Ação direta demonstrando o funcionamento/qualidade de ${productName} na prática`,
      scenes: '3–5',
    },
    {
      excerpt: s3,
      intent: 'Mostrar detalhe construtivo e utilidade real',
      visualProof: `Macro do acabamento/material e plano aberto mostrando o benefício no cenário`,
      scenes: '6–8',
    },
    {
      excerpt: sLast,
      intent: 'Fechamento de alta conversão (CTA)',
      visualProof: `Produto em destaque + satisfação evidente no fechamento`,
      scenes: '9',
    },
  ];

  // 5. PLANEJAR AS 9 CENAS (Respeitando Calçados Masculinos, Roupas Masculinas ou Produtos Gerais, e o Enquadramento)
  const ctaFramingAction =
    framing === 'com_rosto'
      ? `Plano médio frontal. ${isAdultMale ? 'O apresentador' : 'A apresentadora'} segura ${productName} em destaque, olhando e falando para a câmera com sorriso confiante.`
      : framing === 'sem_rosto'
      ? `Plano médio do pescoço para baixo. Tronco e mãos segurando ${productName} em destaque central com gesto natural de recomendação.`
      : `Close POV em primeira pessoa. As mãos aproximam ${productName} da lente da câmera exibindo seu acabamento impecável.`;

  let rawScenes: { framing: string; action: string; cameraMovement: string }[] = [];

  if (subMode === 'vestuario_masculino' && maleSubOption === 'calcados') {
    // Seção 9.1 — Calçados masculinos
    rawScenes = [
      {
        framing: 'Close POV em primeira pessoa',
        action: `Mãos masculinas abrindo a caixa e segurando o ${productName} de frente para a câmera, revelando o design lateral e frontal.`,
        cameraMovement: 'Leve push-in focado no calçado.',
      },
      {
        framing: 'Plano médio dinâmico',
        action: `${framing === 'com_rosto' ? 'O homem segura o par do ' + productName + ' mostrando a leveza' : 'Mãos e tronco segurando o par do ' + productName + ' em destaque'}.`,
        cameraMovement: 'Movimento suave acompanhando as mãos.',
      },
      {
        framing: 'Close macro extremo',
        action: `Mão pressionando a sola e o amortecimento do ${productName}, provando a maciez e a construção robusta do solado.`,
        cameraMovement: 'Foco cravado na textura da sola.',
      },
      {
        framing: 'Close POV de teste físico',
        action: `Mãos dobrando o ${productName} ao meio com facilidade e soltando, provando a flexibilidade total sem deformar.`,
        cameraMovement: 'Câmera próxima acompanhando a dobra.',
      },
      {
        framing: 'Macro de detalhe interno',
        action: `Dedos pressionando a palmilha macia e mostrando o tecido respirável e as costuras reforçadas do ${productName}.`,
        cameraMovement: 'Pan curto sobre o acabamento.',
      },
      {
        framing: 'Plano médio baixo (close nos pés)',
        action: `Calçando o ${productName} no pé com ajuste rápido e confortável do cadarço.`,
        cameraMovement: 'Inclinação suave acompanhando o calce.',
      },
      {
        framing: 'Plano aberto em movimento no cenário',
        action: `Caminhando e dando passos firmes com o ${productName} no pé em ${scenarioDescription}, mostrando o amortecimento em ação.`,
        cameraMovement: 'Tracking baixo acompanhando os pés em movimento.',
      },
      {
        framing: framing === 'pov' ? 'POV olhando para baixo para os pés' : 'Plano de corpo (do pescoço para baixo se sem rosto)',
        action: `Visual completo do caimento do ${productName} nos pés combinando perfeitamente com a rotina e treino.`,
        cameraMovement: 'Leve movimento angular valorizando o par.',
      },
      {
        framing: framing === 'com_rosto' ? 'Plano médio final com rosto' : framing === 'sem_rosto' ? 'Plano médio sem rosto (pescoço para baixo)' : 'Close POV final',
        action: ctaFramingAction,
        cameraMovement: 'Pequeno movimento de câmera aproximando no fechamento.',
      },
    ];
  } else if (subMode === 'vestuario_masculino' && maleSubOption === 'roupas') {
    // Seção 9.2 — Roupas masculinas
    rawScenes = [
      {
        framing: 'Close POV em primeira pessoa',
        action: `Mãos masculinas segurando e abrindo ${productName} de frente para a câmera, revelando a modelagem e cor real.`,
        cameraMovement: 'Push-in rápido destacando a peça.',
      },
      {
        framing: framing === 'pov' ? 'POV sobre superfície organizada' : 'Plano médio frontal',
        action: framing === 'pov'
          ? `Mãos estendendo ${productName} sobre a cama/mesa mostrando o corte perfeito.`
          : `Homem vestindo ${productName} em ${scenarioDescription}, exibindo o caimento anatômico no corpo.`,
        cameraMovement: 'Movimento fluido de smartphone.',
      },
      {
        framing: 'Close macro extremo do tecido',
        action: `Mão tocando a textura real do tecido de ${productName} (mostrando a maciez, gramatura e acabamento interno/externo).`,
        cameraMovement: 'Close macro nítido na trama.',
      },
      {
        framing: 'Close de prova física de elasticidade',
        action: `Duas mãos puxando levemente o tecido de ${productName} para demonstrar a elasticidade, resistência e retorno imediato.`,
        cameraMovement: 'Estabilização focada nas mãos.',
      },
      {
        framing: 'Macro de costura e detalhe funcional',
        action: `Detalhe aproximado da costura reforçada, gola/cós e bolso funcional de ${productName} (colocando o celular no bolso com firmeza).`,
        cameraMovement: 'Pan curto mostrando o acabamento.',
      },
      {
        framing: framing === 'pov' ? 'Close lateral POV da peça' : 'Plano médio lateral em movimento',
        action: framing === 'pov'
          ? `Mãos virando ${productName} para mostrar o verso e acabamento das costas.`
          : `Homem se movimentando (agachando/caminhando) com ${productName}, provando que não prende o movimento.`,
        cameraMovement: 'Acompanhamento dinâmico.',
      },
      {
        framing: 'Plano mais aberto no cenário de uso',
        action: framing === 'pov'
          ? `Visão geral de ${productName} pronta para o uso diário em ${scenarioDescription}.`
          : `Plano aberto mostrando o visual completo com ${productName} em uso real em ${scenarioDescription}.`,
        cameraMovement: 'Leve recuo revelando o contexto.',
      },
      {
        framing: 'Close de conforto e caimento',
        action: `Mão passando pelo tecido de ${productName} mostrando o ajuste perfeito e conforto térmico.`,
        cameraMovement: 'Zoom suave de valorização.',
      },
      {
        framing: framing === 'com_rosto' ? 'Plano médio final com rosto' : framing === 'sem_rosto' ? 'Plano médio sem rosto' : 'Close POV final',
        action: ctaFramingAction,
        cameraMovement: 'Pequeno movimento de câmera aproximando no final.',
      },
    ];
  } else {
    // Produtos Gerais (Seção 7.3 e 7.4)
    rawScenes = [
      {
        framing: 'Close POV muito próximo',
        action: `Duas mãos adultas seguram ${productName} diante da câmera em ${scenarioDescription}, revelando seu design real e despertando curiosidade imediata.`,
        cameraMovement: 'Pequeno movimento natural das mãos mostrando o produto.',
      },
      {
        framing: framing === 'pov' ? 'Plano médio POV sobre a bancada/ambiente' : 'Plano médio de contexto',
        action: framing === 'pov'
          ? `Mãos posicionando ${productName} no local de uso em ${scenarioDescription}.`
          : `${isAdultMale ? 'O apresentador' : 'A apresentadora'} apresenta ${productName} no ambiente real (${scenarioDescription}).`,
        cameraMovement: 'Corte rápido com leve movimento lateral.',
      },
      {
        framing: 'Close rápido e dinâmico de ação',
        action: `Mão adulta acionando/preparando/abrindo ${productName} na prática para provar o primeiro argumento da fala.`,
        cameraMovement: 'Push-in rápido focado na ação das mãos.',
      },
      {
        framing: 'Plano médio de resultado imediato',
        action: `${productName} entrando em funcionamento imediato, mostrando na prática a eficiência prometida na copy.`,
        cameraMovement: 'Câmera dinâmica acompanhando o efeito.',
      },
      {
        framing: 'Plano de demonstração principal em uso real',
        action: `Uso real e ativo de ${productName} em ${scenarioDescription}, provando o benefício central citado na locução sem esforço.`,
        cameraMovement: 'Movimento orgânico de smartphone acompanhando o uso.',
      },
      {
        framing: 'Close macro extremo de detalhe ("Olha...")',
        action: `Enquadramento macro focado no detalhe construtivo, acabamento premium e material resistente de ${productName}.`,
        cameraMovement: 'Foco cravado nos detalhes físicos do produto.',
      },
      {
        framing: 'Plano aberto contextual',
        action: `Visão mais ampla em ${scenarioDescription} mostrando como ${productName} resolve a situação e traz praticidade ao ambiente.`,
        cameraMovement: 'Panorâmica curta e natural.',
      },
      {
        framing: 'Close de prova física e satisfação',
        action: `Demonstração da resistência/vedação/acabamento de ${productName} após o uso, evidenciando qualidade superior.`,
        cameraMovement: 'Aproximação suave.',
      },
      {
        framing: framing === 'com_rosto' ? 'Plano médio final com rosto' : framing === 'sem_rosto' ? 'Plano médio sem rosto (pescoço para baixo)' : 'Close POV final',
        action: ctaFramingAction,
        cameraMovement: 'Final com pequeno movimento de câmera aproximando.',
      },
    ];
  }

  const activePlanVars = (variations || []).filter((v) => v.photos && v.photos.length > 0);
  const scenes: Produtos2SceneItem[] = rawScenes.map((sc, idx) => {
    const num = idx + 1;
    const varInfo = getSceneVariationInfo(num, activePlanVars);
    const cleanAction = sc.action.trim();
    return {
      number: num,
      startTime: timings[idx].start,
      endTime: timings[idx].end,
      framing: sc.framing,
      action: cleanAction,
      cameraMovement: sc.cameraMovement,
      storyboardDescription: `${sc.framing}: ${cleanAction}`,
      variationName: varInfo?.variationName,
    };
  });

  return {
    productLock,
    avatarDescription,
    scenarioDescription,
    visualMap,
    scenes,
  };
}

/**
 * System Prompt para o endpoint /api/produtos2-planning no backend
 */
export function buildProdutos2PlanningSystemPrompt(): string {
  return `Você é o Diretor Criativo Copy-First do Modo Produtos 2.0.
REGRA-MÃE: A COPY VENDE. O STORYBOARD PROVA VISUALMENTE A COPY. O VÍDEO ANIMA O STORYBOARD SEM NUNCA MOSTRAR A PRÓPRIA FOLHA DO STORYBOARD.

REGRA DE OURO INVIOLÁVEL — LOGOMARCA DO FABRICANTE NO PRODUTO vs ELEMENTOS DE REDE SOCIAL:
- DIFERENCIE TOTALMENTE:
  1) PROIBIDO: Logotipo do TikTok, marca d'água de rede social, @usuário, botões ou ícone de carrinho flutuantes na tela. A palavra "TikTok" NUNCA pode aparecer em "productLock", "avatarDescription", "scenarioDescription", "visualMap" nem em "scenes" (somente dentro de "adaptedCopy" se já fizer parte da fala).
  2) OBRIGATÓRIO E SAGRADO: A logomarca, o emblema, o escudo/símbolo e o nome da marca DO PRÓPRIO FABRICANTE que estão impressos, bordados ou estampados NO PRODUTO nas fotos de referência DEVEM SER FIELMENTE REPRESENTADOS E PRESERVADOS 100% IDÊNTICOS!
- Inspecione minuciosamente as fotos de referência anexadas procurando qualquer logomarca, emblema, símbolo gráfico ou texto de marca no produto (por exemplo: logo branca no encosto de um banco de exercícios, logo na lateral de um tênis, marca no painel de um eletrônico, rótulo de um frasco, etc.).
- Preencha obrigatoriamente o campo "manufacturerLogoDescription" descrevendo com precisão cirúrgica a logomarca/marca visível no produto (formato, desenho, letras/símbolo, cor exata e localização exata na peça, ex.: "Logomarca geométrica branca em formato de escudo hexagonal com 'W' estilizado centralizada na parte superior do encosto preto do banco").
- O 1º item do array "productLock" DEVE ser essa descrição exata da logomarca do fabricante e a exigência de que ela apareça idêntica em todas as cenas onde aquela parte do produto estiver visível.
- Nas descrições das cenas ("scenes") em que a parte do produto com a logomarca aparece, mencione explicitamente a presença da logomarca original no local exato (ex.: "...exibindo o encosto preto com a logomarca branca original do fabricante no topo").

Sua tarefa é receber:
1) As fotos reais do produto;
2) As "Informações do produto" e "Nome do produto";
3) A "Copy-base selecionada do banco" (ou copy nova/adaptada do molde do nicho);
4) As configurações (duração 10s ou 8s, influencer, gênero do cliente, fala, enquadramento, cenário, instruções adicionais, variações anexadas).

E retornar um JSON estrito com:
1. "manufacturerLogoDescription": string detalhando exatamente a logomarca/emblema/texto do fabricante visível no produto nas fotos anexadas (cor, formato, desenho e onde fica no produto).
2. "adaptedCopy":
   - REGRA ABSOLUTA: NUNCA crie copy do zero! O aplicativo trabalha EXCLUSIVAMENTE com as ~62 copies vencedoras validadas que já estão na memória (ou copy do mesmo produto, ou copy de outro produto do mesmo nicho adaptada, ou outra copy do banco adaptada).
   - A "baseCopy" recebida já é a copy do banco adaptada com o mínimo de mudanças e já começa obrigatoriamente com "Nossa! ". MANTENHA A "baseCopy" EXATAMENTE COMO ESTÁ!
   - A fala no Veo deve ser pronunciada de forma RÁPIDA E EUFÓRICA (estilo contando uma novidade imperdível e urgente).
   - NUNCA use a palavra "menina" como vocativo; quando o público for feminino, use "Amiga" ou "Gente". Para masculino, use "Meu amigo", "Cara", "Irmão" ou "Gente".
   - NUNCA mencione "frete grátis" ou "frete gratuito" na fala, a menos que isso tenha sido informado expressamente nas Informações do Produto.
3. "productLock": array de 4 a 6 strings detalhando fisicamente o produto visto nas fotos (1º item obrigatoriamente a descrição exata da logomarca/emblema/marca impressa no produto e sua posição exata; seguido de formato, proporção, material, textura, botões/costuras/sola/cabos/detalhes).
   - REGRA MANDATÓRIA DE VARIAÇÕES DE COR NO PRODUCT LOCK:
     * Quando houver mais de 1 variação de cor/modelo, NUNCA fixe a cor ou estampa de apenas uma das fotos (ex.: NUNCA escreva "tecido azul-marinho com listras" ou "franjas azul-marinho" como se fosse o produto inteiro!).
     * No "productLock", descreva apenas os aspectos físicos universais da peça (tecido 100% algodão, formato curvo, franjas nas laterais, cordas reforçadas nas pontas, acabamento).
     * Para a cor, cite explicitamente: "Variações oficiais de cor: o produto possui as variações informadas ([listar todas]), todas corretas e representadas fielmente nos seus respectivos quadros do storyboard".
4. "avatarDescription": descrição de 1 frase do consumidor brasileiro adulto que apresenta o produto (respeitando o gênero do Influencer e as Instruções Adicionais; se produto infantil, quem apresenta na cena 1 e 9 é sempre um adulto pai/mãe).
5. "scenarioDescription":
   - Se o usuário escolheu "em_casa" ("Em casa"): "casa brasileira simples e aconchegante, [cômodo adequado ao produto]".
   - Se o usuário escolheu "padrao_uso" ("Cenário padrão de uso"): descreva o LUGAR REAL onde o produto é usado, SEM mencionar "casa", "caseiro" ou "casa brasileira" (ex.: academia ou espaço de treino para banco de exercícios; jardim gramado ao ar livre para cortador de grama; margem de represa para vara de pesca; interior de um carro para som automotivo; rua/parque em corrida ao ar livre para tênis).
   - Se o usuário escreveu um local nas Instruções adicionais (ex.: "na praia"), essa instrução tem prioridade.
6. "visualMap": array de 4 objetos { "excerpt", "intent", "visualProof", "scenes" } mapeando os trechos da copy para provas visuais nas cenas 1 a 9.
7. "scenes": array de EXATAMENTE 9 objetos { "number": 1..9, "startTime", "endTime", "framing", "action", "cameraMovement", "storyboardDescription" }:
   - REGRA MANDATÓRIA E INEGOCIÁVEL — SEQUÊNCIA PROGRESSIVA CONTÍNUA (NUNCA REPETIR CENAS):
     * As 9 cenas formam UMA ÚNICA HISTÓRIA PROGRESSIVA DE DEMONSTRAÇÃO DO PRODUTO acompanhando a copy do início ao fim (Cena 1 a 9 é um fluxo contínuo e sem repetições).
     * É EXPRESSAMENTE PROIBIDO REPETIR AS MESMAS CENAS PARA CADA COR! (Por exemplo: NUNCA crie cena 1 apresentando cor 1, cena 2 balançando produto cor 1, cena 3 tocando tecido cor 1, e depois na cena 4 reiniciar com a apresentadora sorrindo com cor 2, cena 5 balançando cor 2... ISSO É TOTALMENTE PROIBIDO!).
     * A demonstração do produto segue seu fluxo narrativo normal, dinâmico e progressivo de 1 a 9:
       - Cenas 1–2: Gancho inicial, primeiro impacto e revelação do produto;
       - Cenas 3–5: Demonstração prática, funcionamento ativo, teste real e prova do benefício central;
       - Cenas 6–8: Macro de costuras/acabamento/material ("Olha..."), prova física de resistência e visão ampla de uso no cenário;
       - Cena 9: Fechamento com alta conversão e CTA.
     * A ÚNICA DIFERENÇA quando há variações de cor adicionadas é que o produto, nas cenas em que ele aparece, é retratado na cor correspondente àquele grupo de quadros:
       - Se 2 variações: Cenas 1 a 4 na 1ª Cor; Cenas 5 a 9 na 2ª Cor.
       - Se 3 variações: Cenas 1 a 3 na 1ª Cor; Cenas 4 a 6 na 2ª Cor; Cenas 7 a 9 na 3ª Cor.
     * Todas as 9 cenas devem ter ações DIFERENTES, complementares e progressivas, acompanhando rigorosamente a locução!
     * REGRA DE DESCRIÇÃO NEUTRA DE COR NAS CENAS: Quando houver variações, NUNCA descreva no texto da cena a cor de uma variação em cenas pertencentes a outra variação (ex.: proibido citar "azul-marinho" na Cena 4 a 9 se for vermelho ou preto!). Refira-se ao produto como "a rede", "o tecido da rede", "as franjas", permitindo que cada cena herde a cor do respectivo quadro do storyboard!
   - Todo "olha [detalhe]" na copy vira uma cena de close/macro daquele detalhe.
   - Variar enquadramentos (nunca duas cenas seguidas iguais): close, macro, POV de mãos, plano médio, plano aberto, uso real.
   - "storyboardDescription" DEVE ser idêntico a "{framing}. {action}" (mesma pessoa, mesma ação, mesmo enquadramento e mesmos objetos, sem inventar objetos extras ou mudar quem aparece entre um campo e outro).
   - Sempre que a parte do produto onde fica a logomarca do fabricante estiver visível na cena, inclua na descrição da cena que a logomarca original está visível e idêntica à foto.
   - Na Cena 1, escreva "action" de forma direta e objetiva (sem reticências e sem ponto no meio da frase).
   - Respeitar estritamente o Enquadramento:
     * "com_rosto": rosto aparece em algumas cenas (especialmente gancho e cena 9).
     * "sem_rosto": nunca mostrar o rosto; sempre do pescoço para baixo.
     * "pov": mostrar somente as mãos em primeira pessoa; nunca rosto ou corpo.
   - DIÁLOGOS E CASAL (quando as Instruções Adicionais descreverem encontro, casal ou diálogo entre homem e mulher):
     * "avatarDescription": Descreva com riqueza os dois personagens (Mulher e Homem), suas idades aproximadas, etnia (se informada) e continuidade de roupas.
     * "scenarioDescription": Dê prioridade ao ambiente de encontro/interação informado (ex: cafeteria, restaurante intimista ao pôr do sol).
     * "scenes": As Cenas 1 e 2 devem ilustrar a mulher reagindo/admirando o produto e perguntando ao homem; a partir da Cena 3 o homem responde, apresenta o produto, demonstra as funções e na Cena 9 conclui com o CTA.
   - Proibido texto flutuante externo, legenda, preço, número escrito, carrinho, marca d'água de rede social, @ ou interface de aplicativo dentro das cenas (mas OBRIGATÓRIO manter a logomarca original do fabricante impressa no próprio produto), e É EXPRESSAMENTE PROIBIDO desenhar ou prever site, link de internet, URL ou código de barras/QR code em qualquer caixa, pacote ou embalagem do produto.`;
}

