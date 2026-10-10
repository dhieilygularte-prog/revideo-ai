import {
  AniaCategory,
  AniaGender,
  AniaBody,
  ProductMode,
  AgeMode,
  ScenarioKey,
  PocketState,
} from './types';
import { FalaItem, getCategoryFramingType, getScenarioDescription } from './aniaLibrary';

// ─── 1. PROMPT IMAGEM 1 ─────────────────────────────────────────────────────
export function buildAniaImage1Prompt(params: {
  productName: string;
  category: AniaCategory;
  productMode?: ProductMode;
  ageMode?: AgeMode;
  gender: AniaGender;
  body: AniaBody;
  colorName: string;
  fabricDescription: string;
  detalhesTrava?: string[];
  scenarioDescription?: string;
}): string {
  const {
    productName,
    category,
    productMode = 'apparel',
    ageMode = 'adult',
    gender,
    body,
    colorName,
    fabricDescription,
    detalhesTrava = [],
    scenarioDescription,
  } = params;

  const isFootwear = productMode === 'footwear' || category === 'CALCADO';
  const isChild = ageMode === 'child';
  const isSenior = ageMode === 'senior';
  const tipo = getCategoryFramingType(category, productMode);

  // 1. Descrição do Modelo / Sujeito
  let pessoaDesc = '';
  if (isChild) {
    pessoaDesc = 'mãos de adulto responsável apresentando o produto infantil em primeira pessoa (visão POV). PROIBIDO GERAR CRIANÇA: nunca retratar criança vestindo ou usando a peça; apenas mãos adultas segurando e demonstrando o produto';
  } else if (isSenior) {
    if (gender === 'Mulher') {
      pessoaDesc = `senhora brasileira idosa de terceira idade (${body === 'Plus size' ? 'corpo plus size cheinho' : body === 'Magro' ? 'porte magro' : 'porte médio natural'}), postura natural e elegante, pele madura realista`;
    } else {
      pessoaDesc = `senhor brasileiro idoso de terceira idade (${body === 'Plus size' ? 'corpo plus size cheinho' : body === 'Magro' ? 'porte magro' : 'porte médio natural'}), postura natural, pele madura realista`;
    }
  } else {
    if (gender === 'Mulher') {
      if (body === 'Plus size') {
        pessoaDesc = 'mulher adulta brasileira com corpo Plus Size autêntico, encorpado e curvilíneo real (tamanho 48 a 52 / G1 a G3 / biotipo gordinha real): quadris largos e volumosos, coxas bem grossas e volumosas, pernas encorpadas, cintura e tronco largos com curvas cheias e naturais, braços macios e encorpados, proporções autênticas de mulher plus size brasileira real com curvas generosas. PROIBIDO gerar modelo magra, esbelta ou apenas levemente curvilínea: o corpo deve ser verdadeiramente plus size / curvy encorpado e com volume corporal realista e proporcional';
      } else if (body === 'Magro') {
        pessoaDesc = 'mulher adulta brasileira de porte magro/esguio e natural do dia a dia, anatomia realista e sem exageros';
      } else {
        pessoaDesc = 'mulher adulta brasileira, corpo feminino natural, bonito e levemente curvilíneo, porte médio, nem excessivamente magra nem plus size, anatomia realista';
      }
    } else {
      if (body === 'Plus size') {
        pessoaDesc = 'homem adulto brasileiro com corpo Plus Size autêntico, encorpado e porte físico largo/cheio (tamanho G1 a G3 / manequim grande): tronco e abdômen volumosos, braços e pernas encorpados e largos, proporções realistas de homem plus size brasileiro real. PROIBIDO gerar modelo magro ou atlético';
      } else if (body === 'Magro') {
        pessoaDesc = 'homem adulto brasileiro de porte magro/esguio e natural do dia a dia, anatomia realista';
      } else {
        pessoaDesc = 'homem adulto brasileiro, corpo masculino natural, porte médio, anatomia realista';
      }
    }
  }

  // 2. Enquadramento
  let enquadramento = '';
  if (isChild) {
    enquadramento = 'visão em primeira pessoa (POV adulto), câmera posicionada de cima para baixo ou frontal na altura da cintura/mesa, mostrando as mãos adultas segurando e demonstrando o produto infantil aberto sobre uma superfície limpa. NUNCA MOSTRAR O ROSTO E NUNCA MOSTRAR CRIANÇA.';
  } else if (isFootwear) {
    enquadramento = 'enquadramento vertical 9:16 do joelho para baixo (joelhos, canelas, tornozelos e pés), câmera próxima, com foco total e nítido no calçado nos pés no chão; o cenário aparece sem ocupar área excessiva. NUNCA MOSTRAR O ROSTO.';
  } else if (tipo === 'INFERIOR') {
    enquadramento = 'enquadramento vertical 9:16 da linha logo abaixo do busto para baixo (aparece só a barra da blusa e o cós; nunca o busto inteiro). Se for calça, mostrar até os pés. Se for short, bermuda ou saia, mostrar todo o comprimento da peça e as pernas. NUNCA MOSTRAR O ROSTO.';
  } else {
    enquadramento = 'enquadramento vertical 9:16 do pescoço para baixo (nunca mostrar a cabeça ou o rosto). Câmera um pouco afastada, mostrando a peça inteira e o caimento com naturalidade.';
  }

  const parteSuperior =
    !isChild && !isFootwear && tipo === 'INFERIOR'
      ? gender === 'Mulher'
        ? '\nPARTE SUPERIOR OBRIGATÓRIA: blusa básica lisa elegante e discreta (ex: branca, off-white ou preta neutra) usada POR DENTRO do cós do shorts/calça/saia ou cobrindo totalmente a cintura. REGRA INVIOLÁVEL: NUNCA DEIXAR BARRIGA DE FORA (zero barriga/umbigo expostos, estritamente proibido cropped curto que deixe a barriga à mostra). A blusa deve cobrir 100% o abdômen e a linha da cintura.'
        : '\nPARTE SUPERIOR OBRIGATÓRIA: camiseta básica lisa discreta e neutra cobrindo totalmente a cintura e o abdômen, sem barriga de fora.'
      : '';

  const detalhesList =
    detalhesTrava && detalhesTrava.length > 0
      ? detalhesTrava.join(', ')
      : 'modelagem fiel, costuras, cós, solado e caimento exatamente como na foto enviada';

  const ambienteDesc = scenarioDescription || 'quarto simples e aconchegante de uma casa brasileira real, organizado, piso limpo, iluminação frontal suave e realista';

  return `Use a imagem enviada como REFERÊNCIA PRINCIPAL E OBRIGATÓRIA DO PRODUTO (${productName}, cor ${colorName || 'referência'}).

Crie uma nova imagem ultra-realista, estilo fotografia de smartphone, mostrando ${pessoaDesc} apresentando/usando EXATAMENTE o produto da referência.

ENQUADRAMENTO OBRIGATÓRIO: ${enquadramento}${parteSuperior}

PRODUCT LOCK TOTAL — reproduzir com MÁXIMA FIDELIDADE 1:1: tipo da peça/calçado, formato, modelagem, proporções, sola/cabedal (se calçado), tecido e textura (${fabricDescription}), cós, cintura, costuras, botões, passadores, zíperes, cadarço, detalhes decorativos e caimento.
Detalhes deste produto que DEVEM aparecer exatamente assim: ${detalhesList}.
NÃO inventar, retirar ou modificar detalhes físicos do produto real.

POSE E APARÊNCIA:
- Postura natural e relaxada, produto em primeiro plano.
- Pele realista e natural, ZERO TATUAGENS (estritamente sem qualquer desenho, escrita ou tinta corporal no modelo, homem ou mulher).
- Sem acessórios excessivos que disputem a atenção.

AMBIENTE: ${ambienteDesc}. Fundo discreto e limpo, sem luxo artificial, sem estética de revista e sem outras pessoas em primeiro plano disputando atenção.

ILUMINAÇÃO: luz suave e uniforme vindo da direção da câmera, destacando cor verdadeira, textura do material e acabamentos reais. Sem contraluz e sem reflexos estourados.

ESTILO: fotografia real de celular moderno, alta definição, textura verdadeira e proporções humanas corretas.

PROIBIÇÕES ABSOLUTAS E REGRAS DE INTEGRIDADE:
- NUNCA MOSTRAR O ROSTO (estritamente do pescoço para baixo ou pés).
- PROIBIDO GERAR CRIANÇAS (em modo infantil, apenas mãos de adultos em POV apresentando a peça).
- REDUÇÃO DISCRETA DE DECOTE (DECOTE MODERADO SEM ALTERAR A PEÇA): Se a roupa de referência tiver decote profundo com exposição excessiva do colo ou seios, eleve discretamente o ponto central do decote em 20% a 35% diminuindo a exposição sem fechar exageradamente e mantendo 100% o formato original (ex: se for decote V, continua decote V discreto), com as mesmas alças, caimento, tecido e costuras.
- ZERO BARRIGA EXPOSTA (NUNCA DEIXAR BARRIGA OU UMBIGO DE FORA): Mesmo que a foto de referência original mostre a modelo com barriga de fora ou cropped, a imagem final DEVE cobrir o abdômen (usando blusa neutra por baixo ou prolongamento discreto), preservando o produto principal.
- CARACTERÍSTICAS LOCALIZADAS PERMANECEM LOCALIZADAS: Se uma característica for de uma parte (ex: gola canelada, punho canelado, cós elástico, detalhe em renda), aplique SOMENTE naquela parte específica, NUNCA na peça inteira.
- COR DECLARADA TEM PRIORIDADE ABSOLUTA: A cor escrita pelo usuário (${colorName}) tem prioridade total e indiscutível sobre qualquer variação ou distorção de luz da foto.
- ZERO TATUAGENS em homem ou mulher.
- Sem textos, logos digitais, marcas d'água ou banners promocionais.`;
}

// ─── 2. PROMPT TROCA DE COR (Imagens 2 e 3) ─────────────────────────────────
export function buildAniaColorSwapPrompt(params: {
  productName?: string;
  peca: string;
  colorName: string;
  imageSlot?: 2 | 3;
  hasColorPhoto?: boolean;
  productMode?: ProductMode;
  ageMode?: AgeMode;
  scenarioDescription?: string;
  gender?: AniaGender;
  body?: AniaBody;
  category?: AniaCategory;
}): string {
  const {
    productName,
    peca,
    colorName,
    imageSlot = 2,
    productMode = 'apparel',
    ageMode = 'adult',
    scenarioDescription,
    body = 'Normal',
  } = params;
  const isFootwear = productMode === 'footwear';
  const isChild = ageMode === 'child';
  const targetRefWord = imageSlot === 3 ? 'TERCEIRA' : 'SEGUNDA';
  const pecaNome = (productName || peca || (isFootwear ? 'calçado' : 'peça principal')).trim();
  const ambienteDesc = scenarioDescription || 'quarto simples e aconchegante de uma casa brasileira real, organizado, piso limpo, iluminação frontal suave e realista';

  if (isFootwear) {
    return `Use a PRIMEIRA imagem como base absoluta.

Troque SOMENTE o calçado dos pés pelo calçado/cor mostrada na ${targetRefWord} imagem de referência: ${colorName}.

A ${targetRefWord} imagem serve exclusivamente como referência da cor/variação do calçado (${pecaNome}).
IGNORE E DESCARTE 100% de qualquer fundo, chão, pessoa, estúdio ou iluminação presente na ${targetRefWord} imagem de referência.

Mantenha 100% idênticos à PRIMEIRA imagem:
mesma pessoa, mesmas pernas, mesma pose, mesma posição dos pés, mesmo chão/piso, mesmo enquadramento, mesma câmera, mesma distância, mesmo cenário (${ambienteDesc}), mesmo fundo, mesma iluminação, e mesma calça/roupa complementar.

NÃO recrie a fotografia.
NÃO gere outra modelo.
NÃO altere cenário, piso, pernas, pose ou iluminação.
NÃO mude nenhum elemento fora do calçado principal.
ZERO TATUAGENS: Pele 100% limpa e natural.

Resultado esperado:
a PRIMEIRA imagem permanece visualmente igual, mudando exclusivamente o calçado para a variação da ${targetRefWord} referência (${colorName}). Sem textos, logos ou marcas d'água.`;
  }

  if (isChild) {
    return `Use a PRIMEIRA imagem como base absoluta.

Troque SOMENTE o produto infantil (${pecaNome}) pela cor/estampa mostrada na ${targetRefWord} imagem de referência: ${colorName}.

A ${targetRefWord} imagem serve exclusivamente como referência da cor/variação do produto.
IGNORE E DESCARTE 100% de qualquer fundo, manequim ou cenário da ${targetRefWord} imagem de referência.

Mantenha 100% idênticos à PRIMEIRA imagem:
mesmas mãos adultas em POV segurando e apresentando o produto, mesmo enquadramento em primeira pessoa (NUNCA MOSTRAR ROSTO E NUNCA MOSTRAR CRIANÇAS), mesma superfície limpa, mesmo cenário (${ambienteDesc}) e mesma iluminação.

NÃO recrie a fotografia.
NÃO altere cenário ou iluminação.
NÃO mude nenhum elemento fora do produto principal.

Resultado esperado:
a PRIMEIRA imagem permanece visualmente igual, mudando exclusivamente o produto principal (${pecaNome}) para a variação da ${targetRefWord} referência (${colorName}). Sem textos, logos ou marcas d'água.`;
  }

  return `Use a PRIMEIRA imagem como base absoluta.

Troque SOMENTE a peça principal (${pecaNome}) da pessoa pela peça/cor mostrada na ${targetRefWord} imagem de referência: ${colorName}.

A ${targetRefWord} imagem serve exclusivamente como referência da cor/variação do produto.
IGNORE E DESCARTE COMPLETAMENTE qualquer fundo, manequim, cabide, loja, modelo ou estúdio da ${targetRefWord} imagem de referência! Não copie dela formato de corpo, modelo, cenário ou iluminação.

Mantenha 100% idênticos à PRIMEIRA imagem:
mesma pessoa, mesmo corpo (${body}), mesma pose, mesma posição de braços e pernas, mesmo enquadramento vertical 9:16 do pescoço para baixo (sem rosto), mesma câmera, mesma distância, mesmo cenário (${ambienteDesc}), mesmo fundo, mesma iluminação, mesmo cabelo visível, mesma roupa complementar e mesmo calçado quando ele não for o produto vendido.

NÃO recrie a fotografia.
NÃO gere outra modelo.
NÃO altere cenário, pose ou iluminação.
NÃO mude nenhum elemento fora do produto principal.
ZERO TATUAGENS: Pele 100% limpa, sem qualquer desenho ou tinta corporal.

Resultado esperado:
a PRIMEIRA imagem permanece visualmente igual, mudando exclusivamente o produto principal (${pecaNome}) para a variação da ${targetRefWord} referência (${colorName}). Sem textos, logos ou marcas d'água.`;
}

// ─── 3. PROMPT DE PLANEJAMENTO ──────────────────────────────────────────────
export function buildAniaPlanningSystemPrompt(): string {
  return `Você é o diretor de vídeos e criativos de alta conversão do Método Ania para TikTok Shop. Analise o produto e dados e devolva SOMENTE um JSON estruturado com os campos solicitados.

REGRAS CRÍTICAS:
- Fidelidade total ao produto: liste em "detalhes_trava" só detalhes reais visíveis ou informados.
- "estica": obedeça o valor enviado.
- "productMode": "apparel" ou "footwear".
- "ageMode": "adult", "child" ou "senior".
- "scenarioKey": "home" | "gym" | "park" | "beach" | "workshop" | "skate" | "casual_outdoor" | "social_simple" | "other".
- Movimentos: 3 sequências (V1, V2, V3) com cortes dinâmicos adaptados ao produto real. Se ageMode=child, forçar POV adulto (mãos demonstrando). Se productMode=footwear, foco nos pés. Se estica=false, nada de puxadas de tecido. Nunca virar de costas, nunca mostrar o rosto.
- REGRA INVIOLÁVEL DA FALA:
  * A fala DEVE OBRIGATORIAMENTE usar o nome do produto inserido pelo usuário no campo PRODUTO (ex: se o produto for "pijama", a fala DEVE falar "pijama", NUNCA camisola, nunca vestido, nunca outra peça!).
  * Se a fala candidata contiver outro substantivo (ex: "camisola"), SUBSTITUA OBRIGATORIAMENTE pelo nome do produto digitado pelo usuário.
  * SE O GÊNERO FOR HOMEM (gender === 'Homem'): todas as falas DEVEM ser estritamente no masculino! NUNCA use "amiga", "linda", "tanta mulher", "garante a sua", "escolhe a sua preferida". Use SEMPRE vocativos e concordâncias masculinas: "amigo", "fala amigo", "tanto homem", "garante o seu", "escolhe o seu preferido", "confortável e no estilo".
  * Adapte o texto mantendo o gancho comercial, benefício e CTA no carrinho laranja, mencionando as cores cadastradas. Até 500 caracteres totais.
- "titulo": título comercial claro de até 100 caracteres.
- "peca": substantivo curto do produto em minúsculas (ex: pijama, calca, bermuda, tenis, sandalia, vestido).`;
}

export function buildAniaPlanningUserMessage(params: {
  productName: string;
  category: AniaCategory;
  productMode: ProductMode;
  ageMode: AgeMode;
  subtype: string;
  gender: AniaGender;
  body: AniaBody;
  colors: { name: string }[];
  estica: boolean;
  fabric: string;
  naturalEnvironment: boolean;
  productInfo?: string;
  additionalInstructions?: string;
  customSpeech?: string;
  moves: { v1: string; v2: string; v3: string };
  candidates: FalaItem[];
}): string {
  const {
    productName,
    category,
    productMode,
    ageMode,
    subtype,
    gender,
    body,
    colors,
    estica,
    fabric,
    naturalEnvironment,
    productInfo,
    additionalInstructions,
    customSpeech,
    moves,
    candidates,
  } = params;

  const colorStr = colors.map((c, i) => `Cor ${i + 1}: ${c.name}`).join('; ');
  const candidateStr = candidates
    .map((c, idx) => `[${c.id}] ${c.t}${idx === 1 ? ' (reserva)' : ''}`)
    .join('\n');

  return `PRODUTO OBRIGATÓRIO (USAR ESTE NOME EXATO NA FALA): ${productName}
TIPO: ${productMode === 'footwear' ? 'Calçado' : 'Moda / Roupas'}
FAIXA ETÁRIA: ${ageMode === 'child' ? 'Infantil (Modo POV adulto)' : ageMode === 'senior' ? 'Idoso' : 'Adulto'}
CATEGORIA: ${category}  SUBTIPO: ${subtype || 'NORMAL'}
GÊNERO: ${gender}  CORPO: ${body}
CORES: ${colorStr || 'Cor 1: referência'}
ESTICA: ${estica}  TECIDO/MATERIAL: ${fabric || 'vazio'}
AMBIENTE NATURAL: ${naturalEnvironment ? 'SIM (detectar cenário nativo)' : 'NÃO (casa simples)'}
INFORMAÇÕES DO PRODUTO: ${productInfo && productInfo.trim() ? productInfo.trim() : '-'}
INSTRUÇÕES ADICIONAIS: ${additionalInstructions && additionalInstructions.trim() ? additionalInstructions.trim() : '-'}
FALA_USUARIO: ${customSpeech && customSpeech.trim() ? customSpeech.trim() : '-'}
BANCO MOVIMENTOS:
V1: ${moves.v1}
V2: ${moves.v2}
V3: ${moves.v3}
CANDIDATAS (ADAPTAR SUBSTITUINDO O NOME DA PEÇA OBRIGATORIAMENTE POR "${productName}"):
${candidateStr || 'Sem candidatas (usar FALA_USUARIO)'}`;
}

// ─── 4. PROMPT DE VÍDEO FINAL (GOOGLE VEO) ──────────────────────────────────
export function buildAniaVideoPrompt(params: {
  durationSeconds: number; // 8 ou 10
  gender: AniaGender;
  body: AniaBody;
  category: AniaCategory;
  productMode?: ProductMode;
  ageMode?: AgeMode;
  peca: string;
  colorName: string;
  fabricDescription: string;
  detalhes: string;
  bolsoFuncional?: boolean;
  bolsoEstado?: PocketState;
  movimento: string;
  speechPart?: string;
  scenarioDescription?: string;
}): string {
  const {
    durationSeconds,
    gender,
    body,
    category,
    productMode = 'apparel',
    ageMode = 'adult',
    peca,
    colorName,
    fabricDescription,
    detalhes,
    bolsoFuncional,
    bolsoEstado = 'none',
    movimento,
    speechPart,
    scenarioDescription,
  } = params;

  const dur = durationSeconds;
  const isHomem = gender === 'Homem';
  const isFootwear = productMode === 'footwear' || category === 'CALCADO';
  const isChild = ageMode === 'child';
  const isSenior = ageMode === 'senior';

  const voz = isHomem ? 'masculina' : 'feminina';
  const amigo = isHomem ? 'amigo' : 'amiga';

  let pessoaRef = '';
  if (isChild) {
    pessoaRef = 'mãos adultas em primeira pessoa (POV)';
  } else if (isFootwear) {
    pessoaRef = 'os mesmos pés e calçado da pessoa';
  } else if (isSenior) {
    pessoaRef = isHomem ? 'o mesmo senhor idoso' : 'a mesma senhora idosa';
  } else {
    pessoaRef = isHomem ? 'o mesmo homem' : 'a mesma mulher';
  }

  const corpoDesc = !isChild && !isFootwear
    ? body === 'Plus size'
      ? 'com o mesmo corpo plus size'
      : body === 'Magro'
      ? 'com o mesmo corpo magro'
      : 'com o mesmo corpo'
    : '';

  const tipo = getCategoryFramingType(category, productMode);
  let enquadramento = '';
  if (isChild) {
    enquadramento = 'em primeira pessoa (POV adulto), mostrando apenas mãos adultas apresentando e demonstrando a peça infantil sobre a superfície. NUNCA MOSTRAR CRIANÇA E NUNCA MOSTRAR ROSTO.';
  } else if (isFootwear) {
    enquadramento = 'da cintura para baixo com enquadramento focado nos pés e no calçado. NUNCA MOSTRAR O ROSTO.';
  } else if (tipo === 'INFERIOR') {
    enquadramento = 'da linha logo abaixo do busto para baixo (mostrando o cós, quadril e comprimento total da peça). NUNCA MOSTRAR O ROSTO.';
  } else {
    enquadramento = 'do pescoço para baixo. NUNCA MOSTRAR A CABEÇA OU O ROSTO.';
  }

  const hasFunctionalPocket = bolsoFuncional || bolsoEstado === 'functional';
  const bolsoClausula = !hasFunctionalPocket && !isFootwear && !isChild
    ? '\nA peça NÃO tem bolsos funcionais: nunca colocar as mãos dentro de bolsos inexistentes.'
    : '';

  const seFalaColorNote = speechPart && speechPart.trim()
    ? ', mesmo que a narração cite outras cores'
    : '';

  const audioBlock = speechPart && speechPart.trim()
    ? `NARRAÇÃO fora de quadro, contínua e natural, sem pausas longas, sem cortar palavras, falando exatamente:
"${speechPart.trim()}"
Voz ${voz} brasileira, natural, animada e entusiasmada, tom de indicação de ${amigo}; a mesma voz em todos os vídeos. Sem lip-sync.`
    : `SEM FALA, SEM NARRAÇÃO (apenas som ambiente realista e movimentos naturais).`;

  const ambienteStr = scenarioDescription || 'o mesmo quarto simples e realista da imagem de referência';

  return `VÍDEO VERTICAL 9:16, ULTRA-REALISTA, DINÂMICO, COM APARÊNCIA DE VÍDEO DE MODA/PRODUTO GRAVADO NO CELULAR. Duração: ${dur} segundos.

Usar EXATAMENTE ${pessoaRef} ${corpoDesc}, o mesmo produto (${peca}) na cor ${colorName || 'da referência'} e ${ambienteStr}.

TRAVA TOTAL DO PRODUTO: preservar 100% o produto da imagem: modelagem, material/tecido (${fabricDescription}), cor, comprimento, costuras, acabamento, detalhes reais (${detalhes}). NÃO criar, retirar ou alterar nenhum detalhe físico. A cor do produto permanece exatamente a da imagem de referência durante todo o vídeo${seFalaColorNote}.${bolsoClausula}

ENQUADRAMENTO: ${enquadramento}
POSIÇÃO: sempre de frente para a câmera; movimentos fluidos e naturais. NUNCA virar de costas, nunca mostrar a parte de trás completa.
O produto/modelo está em movimento dinâmico do primeiro ao último segundo.

SEQUÊNCIA DE MOVIMENTOS (cortes rápidos, zooms curtos, alternando planos e closes, câmera estável):
${movimento}

${audioBlock}

PROIBIDO:
- Rosto humano visível.
- Crianças no vídeo (em modo infantil, somente mãos de adultos em POV demonstrando a peça).
- Tatuagens ou desenhos corporais (homem ou mulher).
- Textos, legendas digitais, preços, logos de marcas, ícones gráficos ou elementos de tela.
- Pessoas concorrentes em destaque ao fundo, deformações corporais, luxo excessivo ou mansões.
Conteúdo exclusivamente de demonstração de produto para e-commerce. Totalmente vestido.`;
}
