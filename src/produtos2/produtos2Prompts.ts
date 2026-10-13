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
}): string {
  const {
    productLock,
    finalCopy,
    visualMap,
    avatarDescription,
    framing,
    scenarioDescription,
    scenes,
    additionalInstructions,
  } = params;

  const framingLabel =
    framing === 'com_rosto'
      ? 'com rosto (a pessoa aparece inteira, com rosto, principalmente no gancho e no fechamento/CTA)'
      : framing === 'sem_rosto'
      ? 'sem rosto (enquadrar sempre do pescoço para baixo, o rosto nunca aparece em nenhum quadro)'
      : 'POV em primeira pessoa (mostrar somente as mãos do usuário interagindo com o produto, nunca mostrar rosto ou corpo)';

  const visualMapLines = visualMap
    .map((m) => `"${m.excerpt}" → ${m.intent} (${m.visualProof}) → cenas ${m.scenes}`)
    .join('\n');

  // Item 7.3: Usar exatamente as mesmas 9 descrições canônicas no storyboard e no Veo
  const scenesLines = scenes
    .slice(0, 9)
    .map((sc, i) => `CENA ${i + 1}: ${getUnifiedSceneDescription(sc)}`)
    .join('\n');

  const extraInstructions = additionalInstructions?.trim()
    ? `\nINSTRUÇÕES ADICIONAIS PRIORITÁRIAS DO USUÁRIO: ${additionalInstructions.trim()}`
    : '';

  return `Crie UMA ÚNICA IMAGEM VERTICAL 1080x1920 (9:16) de storyboard fotográfico ultra-realista em grade 3x3 (3 colunas x 3 linhas), com EXATAMENTE 9 cenas numeradas de 1 a 9 em ordem de leitura (esquerda para direita, de cima para baixo). Quadros de tamanho igual, cantos arredondados, separados por uma borda branca fina, fundo branco.

Use as fotos anexadas como referência absoluta do produto. Preserve fielmente (PRODUCT LOCK): ${productLock.join('; ')}.
O produto deve ser 100% idêntico em todos os quadros: não redesenhar, não embelezar, não trocar cor, não acrescentar peças e não simplificar detalhes.
REGRA OBRIGATÓRIA DE LOGOMARCA DO FABRICANTE NO PRODUTO: A marca, a logomarca, o emblema/símbolo e os textos originais do fabricante que estão impressos, estampados ou gravados no próprio produto nas fotos de referência DEVEM aparecer 100% idênticos (mesmo desenho, formato, cor, proporção e posição exata na peça, como no encosto, painel ou corpo do produto) em TODOS os quadros onde essa parte do produto estiver visível. JAMAIS remova, apague ou deixe lisa a área onde fica a logomarca original do fabricante no produto!

A copy selecionada para este criativo é:
"${finalCopy}"
As cenas do storyboard devem ser construídas A PARTIR DESSA COPY. Cada cena deve provar, ilustrar ou reforçar visualmente um trecho da fala.

Mapa visual da copy:
${visualMapLines}

PERSONAGEM: ${avatarDescription}, o mesmo em todos os quadros. Enquadramento: ${framingLabel}.
Estilo: fotografia ultra-realista de smartphone, UGC premium de anúncio, luz natural, ${scenarioDescription}. Variar enquadramentos: close, macro, POV, plano médio, plano aberto.${extraInstructions}

${scenesLines}

Mantenha continuidade de produto, logomarca original do fabricante no produto, personagem, ambiente e iluminação entre as cenas relacionadas. Cada quadro deve parecer uma fotografia real e utilizável como referência de futura animação.
Adicionar SOMENTE os números 1 a 9 em pequenos selos circulares brancos com número preto, no canto superior esquerdo de cada quadro.
PROIBIÇÃO EXCLUSIVA DE INTERFACE EXTERNA: NÃO adicionar frases flutuantes na tela, legendas, textos publicitários externos, ícone de carrinho de compras, botões, setas, preços, interface de aplicativo, logotipo do TikTok ou de rede social, nome de usuário/@ ou marca d'água externa (mantendo obrigatoriamente a logomarca original do fabricante impressa no próprio produto).`;
}

/**
 * SEÇÃO 8.1 e 8.2 — Constrói o Prompt completo do Veo 3 (Omni Flash · 1 geração)
 * Suporta COM FALA e SEM FALA seguindo exatamente a estrutura validada.
 */
export function buildProdutos2VeoPrompt(params: {
  productName: string;
  duration: Produtos2Duration;
  speechMode: Produtos2SpeechMode;
  finalCopy: string;
  influencerResolved: 'Homem' | 'Mulher';
  framing: Produtos2Framing;
  productLock: string[];
  avatarDescription: string;
  scenarioDescription: string;
  scenes: Produtos2SceneItem[];
  additionalInstructions?: string;
}): string {
  const {
    productName,
    duration,
    speechMode,
    finalCopy,
    influencerResolved,
    framing,
    productLock,
    avatarDescription,
    scenarioDescription,
    scenes,
    additionalInstructions,
  } = params;

  // Item 7.1: Frase do primeiro frame com letra minúscula e sem ponto no meio
  const firstFrameClause = formatFirstFrameClause(scenes[0], productName);

  // Item 7.2: PRODUCT LOCK sempre igual no prompt da imagem e no prompt do Veo
  const productLockBullets = productLock
    .map((item) => `- ${item.replace(/^[-•*]\s*/, '')}`)
    .join('\n');

  const framingPersonRule =
    framing === 'com_rosto'
      ? speechMode === 'com_fala'
        ? `Com rosto: o rosto aparece de forma natural nas cenas de apresentação e na cena 9; nas cenas em que ${influencerResolved === 'Homem' ? 'ele' : 'ela'} fala olhando para a câmera, os lábios acompanham a fala com sincronia natural.`
        : `Com rosto: o rosto aparece de forma natural nas cenas de apresentação e na cena 9, sorrindo e demonstrando satisfação (sem mexer a boca como se estivesse falando).`
      : framing === 'sem_rosto'
      ? `Sem rosto: nunca mostrar o rosto em nenhuma cena; enquadrar sempre do pescoço para baixo.`
      : `POV: mostrar somente as mãos em primeira pessoa interagindo com ${productName}; nunca mostrar rosto ou corpo.`;

  // Item 7.3: Gerar o prompt a partir das MESMAS 9 descrições usadas para criar a imagem, sem reescrever as cenas
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
      return `CENA ${num} — ${sc.startTime} a ${sc.endTime}s\n${actionText}`;
    })
    .join('\n\n');

  const voiceGender = influencerResolved === 'Homem' ? 'MASCULINA' : 'FEMININA';
  const accentMatch = additionalInstructions?.match(/sotaque\s+([a-záàâãéêíóôõúç]+)/i);
  const accentClause = accentMatch ? `, com sotaque ${accentMatch[1]}` : '';

  // Item 3: Novo bloco logo depois de "Tom da voz: …" (só quando tiver fala)
  // Inclui somente as linhas que se aplicam à copy usada
  const speechWordsAudioOnlyLines: string[] = [];
  const lowerCopy = finalCopy.toLowerCase();

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
      ? `========================
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
"${finalCopy}"

Tom da voz: natural, brasileiro, rápido, espontâneo, acolhedor e com energia de recomendação real.${speechWordsOnlyBlock}`
      : `========================
ÁUDIO — SEM FALA
========================
NÃO usar locução. NÃO usar narração. Ninguém fala no vídeo e ninguém mexe a boca como se estivesse falando.
Usar apenas som ambiente natural do cenário e uma trilha instrumental animada e leve, com ritmo que acompanha os cortes.`;

  // Item 5: PRIORIDADE MÁXIMA — novo item 1 (os demais descem uma posição)
  const prioritySection =
    speechMode === 'com_fala'
      ? `PRIORIDADE MÁXIMA:
1. vídeo limpo: sem marca d'água, sem logo do TikTok, sem @, sem carrinho e sem nenhum texto adicionado; a marca/logo que já está impressa no produto aparece idêntica às fotos;
2. respeitar a copy validada, falada exatamente uma vez;
3. usar as cenas como tradução visual da copy;
4. fidelidade absoluta ao produto (PRODUCT LOCK) em todas as cenas;
5. usar o storyboard somente como guia visual e nunca exibi-lo;
6. começar diretamente com uma nova cena real em movimento;
7. recriar as 9 cenas na ordem dos números;
8. fazer um vídeo rápido e muito dinâmico;
9. usar uma única locução contínua, sem repetições.`
      : `PRIORIDADE MÁXIMA:
1. vídeo limpo: sem marca d'água, sem logo do TikTok, sem @, sem carrinho e sem nenhum texto adicionado; a marca/logo que já está impressa no produto aparece idêntica às fotos;
2. seguir a ordem das cenas definida pela copy;
3. usar as cenas como tradução visual e demonstração real do produto;
4. fidelidade absoluta ao produto (PRODUCT LOCK) em todas as cenas;
5. usar o storyboard somente como guia visual e nunca exibi-lo;
6. começar diretamente com uma nova cena real em movimento;
7. recriar as 9 cenas na ordem dos números;
8. fazer um vídeo rápido e muito dinâmico;
9. nenhuma voz e nenhuma fala no vídeo.`;

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
EXCEÇÃO: a marca, o logo e os textos que já estão impressos no próprio produto (iguais às fotos de referência e ao storyboard) DEVEM aparecer, idênticos, sempre que aquela parte do produto estiver visível.

IMPORTANTE SOBRE A IMAGEM ANEXADA:
A imagem anexada é SOMENTE UM STORYBOARD DE REFERÊNCIA com 9 cenas numeradas.
NÃO mostre a imagem do storyboard no vídeo.
NÃO use o storyboard como primeiro frame.
NÃO use a grade 3x3 como introdução.
NÃO reproduza a imagem completa.
NÃO mostre números, bordas, divisões ou estrutura de storyboard.
NÃO faça colagem. NÃO faça tela dividida. NÃO faça mosaico.
Use o storyboard APENAS para entender: o produto, a aparência do produto, os personagens, os enquadramentos, a ordem das ações e a progressão das 9 cenas.
RECRIE cada quadro do storyboard como uma NOVA CENA REALISTA E INDEPENDENTE EM MOVIMENTO.
O PRIMEIRO FRAME DO VÍDEO já deve ser uma cena real em movimento ${firstFrameClause}, e nunca a imagem inteira do storyboard.

========================
FIDELIDADE DO PRODUTO (PRODUCT LOCK)
========================
Manter ${productName} exatamente como aparece no storyboard e nas fotos:
${productLockBullets}
Não alterar a aparência do produto entre as cenas. Não redesenhar, não trocar cor, não acrescentar peças e não simplificar detalhes. A marca, a logomarca/emblema e os textos do fabricante impressos no próprio produto DEVEM aparecer 100% idênticos às fotos de referência em todas as cenas em que aquela parte do produto estiver visível. Proibido apenas adicionar textos ou logos externos de redes sociais (como TikTok/@/carrinho) na tela.

========================
PERSONAGEM
========================
${avatarDescription} — o mesmo em todas as cenas.
${framingPersonRule}

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
- aparência real de gravação com smartphone
- iluminação natural
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
NÃO adicionar ícone de carrinho.
NÃO adicionar botão de compra.
NÃO adicionar stickers.

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
export function resolveProdutos2ScenarioDescription(params: {
  scenario: Produtos2Scenario;
  niche: string;
  productName: string;
  productInfo: string;
  additionalInstructions?: string;
}): string {
  const { scenario, niche, productName, productInfo, additionalInstructions } = params;
  const combined = `${productName} ${productInfo}`.toLowerCase();

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
    if (additionalInstructions && additionalInstructions.trim()) {
      return `${baseHome} (${additionalInstructions.trim()})`;
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

  if (additionalInstructions && additionalInstructions.trim()) {
    return `${resolved} (${additionalInstructions.trim()})`;
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

  const scenes: Produtos2SceneItem[] = rawScenes.map((sc, idx) => ({
    number: idx + 1,
    startTime: timings[idx].start,
    endTime: timings[idx].end,
    framing: sc.framing,
    action: sc.action,
    cameraMovement: sc.cameraMovement,
    storyboardDescription: `${sc.framing}: ${sc.action}`,
  }));

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
4) As configurações (duração 10s ou 8s, influencer, gênero do cliente, fala, enquadramento, cenário, instruções adicionais).

E retornar um JSON estrito com:
1. "manufacturerLogoDescription": string detalhando exatamente a logomarca/emblema/texto do fabricante visível no produto nas fotos anexadas (cor, formato, desenho e onde fica no produto).
2. "adaptedCopy":
   - TODA copy/fala DEVE obrigatoriamente começar com a expressão inicial neutra "Nossa, " (ex.: "Nossa, ..."), que serve de margem para o corte do primeiro segundo no Veo. Não duplique caso já comece com "Nossa".
   - Se a "Copy-base selecionada" já veio pronta e calibrada, MANTENHA A "baseCopy" EXATAMENTE COMO ESTÁ! NUNCA transforme a copy em uma lista de ficha técnica (PROIBIDO escrever frases secas como "Banco ajustável com espuma de 5 cm, base de aço triangular e pés antiderrapantes. Clica no carrinho.").
   - Caso precise adaptar ou criar copy para produto novo ou outro produto do nicho, siga obrigatoriamente o DNA DAS COPIES QUE VENDEM (6 partes na ordem fixa):
     [1. GANCHO DE INTERRUPÇÃO (Choque de preço/loucura, Pergunta de dor/inconformismo, Conversa direta com vocativo + descoberta, Provocação/contraste, Desejo imediato/parcela, Segredo revelado ou Urgência de estoque)] ->
     [2. APRESENTA O PRODUTO COM EMOÇÃO] ->
     [3. "OLHA" + BENEFÍCIO 1 (característica traduzida em benefício real: "característica + que/pra/sem + benefício")] ->
     [4. BENEFÍCIO 2 (no máximo 2 ou 3 características em toda a copy, sempre traduzidas em benefício)] ->
     [5. QUEBRA DE OBJEÇÃO / COMPARAÇÃO DE VALOR / CENA DE USO] ->
     [6. CTA COMPLETO (verbo de ação + "no carrinho / aqui embaixo" + recompensa/urgência, ex.: "Clica no carrinho e garante o seu!". NUNCA use "Clica no carrinho." seco)].
   - LIMITES E ALVOS EXATOS DE CARACTERES (contando espaços e o "Nossa, " inicial):
     * Em 8 segundos (copy nova ou adaptada): janela obrigatória de 185 a 195 caracteres (limite máximo 199, quanto mais perto de 195 melhor; abaixo de 185 é proibido).
     * Em 10 segundos (copy nova ou adaptada): janela obrigatória de 242 a 250 caracteres (limite máximo 252, quanto mais perto de 250 melhor; abaixo de 242 é proibido).
   - NUNCA use a palavra "menina" como vocativo; quando o público for feminino, use "Amiga" ou "Gente". Para masculino, use "Meu amigo", "Cara", "Irmão" ou "Gente".
3. "productLock": array de 4 a 6 strings detalhando fisicamente o produto visto nas fotos (1º item obrigatoriamente a descrição exata da logomarca/emblema/marca impressa no produto e sua posição exata; seguido de formato, cor exata, material, textura, proporção, botões/costuras/sola/cabos/detalhes).
4. "avatarDescription": descrição de 1 frase do consumidor brasileiro adulto que apresenta o produto (respeitando o gênero do Influencer e as Instruções Adicionais; se produto infantil, quem apresenta na cena 1 e 9 é sempre um adulto pai/mãe).
5. "scenarioDescription":
   - Se o usuário escolheu "em_casa" ("Em casa"): "casa brasileira simples e aconchegante, [cômodo adequado ao produto]".
   - Se o usuário escolheu "padrao_uso" ("Cenário padrão de uso"): descreva o LUGAR REAL onde o produto é usado, SEM mencionar "casa", "caseiro" ou "casa brasileira" (ex.: academia ou espaço de treino para banco de exercícios; jardim gramado ao ar livre para cortador de grama; margem de represa para vara de pesca; interior de um carro para som automotivo; rua/parque em corrida ao ar livre para tênis).
   - Se o usuário escreveu um local nas Instruções adicionais (ex.: "na praia"), essa instrução tem prioridade.
6. "visualMap": array de 4 objetos { "excerpt", "intent", "visualProof", "scenes" } mapeando os trechos da copy para provas visuais nas cenas 1 a 9.
7. "scenes": array de EXATAMENTE 9 objetos { "number": 1..9, "startTime", "endTime", "framing", "action", "cameraMovement", "storyboardDescription" }:
   - Cada cena prova visualmente o que está sendo falado naquele momento da copy.
   - Todo "olha [detalhe]" na copy vira uma cena de close/macro daquele detalhe.
   - Variar enquadramentos (nunca duas cenas seguidas iguais): close, macro, POV de mãos, plano médio, plano aberto, uso real.
   - "storyboardDescription" DEVE ser idêntico a "{framing}. {action}" (mesma pessoa, mesma ação, mesmo enquadramento e mesmos objetos, sem inventar objetos extras ou mudar quem aparece entre um campo e outro).
   - Sempre que a parte do produto onde fica a logomarca do fabricante estiver visível na cena, inclua na descrição da cena que a logomarca original está visível e idêntica à foto.
   - Na Cena 1, escreva "action" de forma direta e objetiva (sem reticências e sem ponto no meio da frase).
   - Respeitar estritamente o Enquadramento:
     * "com_rosto": rosto aparece em algumas cenas (especialmente gancho e cena 9).
     * "sem_rosto": nunca mostrar o rosto; sempre do pescoço para baixo.
     * "pov": mostrar somente as mãos em primeira pessoa; nunca rosto ou corpo.
   - Proibido texto flutuante externo, legenda, preço, número escrito, carrinho, marca d'água de rede social, @ ou interface de aplicativo dentro das cenas (mas OBRIGATÓRIO manter a logomarca original do fabricante impressa no próprio produto).`;
}

