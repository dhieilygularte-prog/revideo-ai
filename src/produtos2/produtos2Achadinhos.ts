/**
 * MODO AURORA ACHADINHOS (3 CENAS DE 10S) — Versão 5.0
 * Plataforma: Google Antigravity / Destino: TikTok Shop Brasil
 * 
 * Regras principais:
 * - 3 Cenas de 10 segundos cada (30s total).
 * - Limite de fala: exatamente até 225 caracteres por cena.
 * - 3 Storyboards horizontais em proporção 16:9 (1920x1080), cada um contendo 3 quadros verticais 9:16 lado a lado (A, B e C). Total de 9 quadros.
 * - 3 Prompts de vídeo para OmniFlash / Veo 3 com 'INFLUENCER DIALOGUE IN PORTUGUÊS BRASIL: "FALA EXATA DA CENA"'.
 * - Não interfere em nenhum dos demais modos do aplicativo.
 */

import { Produtos2Variation } from './types';
import { appendFidelityLockToVeoPrompt, buildProductFidelityDirectives } from './produtos2FidelityLock';

export interface AchadinhosSpeechParts {
  cena1: string; // Hook + Apresentação (até 225 chars)
  cena2: string; // Corpo + Benefício + Demonstração (até 225 chars)
  cena3: string; // Fechamento + CTA (até 225 chars)
  full: string;  // Fala completa unificada (até 675 chars)
}

export interface AchadinhosBlockDetails {
  storyboardImageUrl?: string;
  storyboardImagePrompt?: string;
  veoPrompt?: string;
  speechText?: string;
  videoAudit?: any;
}

export interface Produtos2AchadinhosResultState {
  speeches: AchadinhosSpeechParts;
  productName?: string;
  characterDescription?: string;
  scenarioDescription?: string;
  bloco1: AchadinhosBlockDetails;
  bloco2: AchadinhosBlockDetails;
  bloco3: AchadinhosBlockDetails;
}

// ============================================================================
// BIBLIOTECA DE HOOKS (Versão 5.0 - Seção 7)
// ============================================================================
export const ACHADINHOS_HOOKS = {
  descoberta: [
    'Gente, olha o que eu achei!',
    'Vocês precisam ver isso aqui!',
    'Olha esse achadinho que apareceu pra mim!',
    'Gente, eu não esperava encontrar isso!',
    'Olha o que eu descobri!',
    'Pera aí, olha isso aqui!',
    'Gente, preciso mostrar uma coisa pra vocês!',
  ],
  curiosidade: [
    'Como é que eu não conhecia isso antes?',
    'Olha isso aqui e me diz se você já conhecia!',
    'Eu preciso mostrar uma coisa pra vocês!',
    'Pera aí, olha esse detalhe!',
    'Vocês já tinham visto uma coisa dessas?',
    'Olha só o que esse produto tem!',
    'O detalhe que me chamou atenção foi esse aqui!',
  ],
  preco: [
    'Gente, olha o preço disso aqui!',
    'Olha o que dá pra encontrar por esse valor!',
    'Eu fui conferir esse produto e olha só!',
    'Gente, olha só quanto está custando!',
    'Por esse preço, vale a pena conferir os detalhes!',
  ],
  problema_cotidiano: [
    'Se você também passa por isso, olha só!',
    'Gente, isso aqui pode facilitar essa tarefa!',
    'Olha essa solução pra uma coisa que dá trabalho!',
    'Se essa tarefa também te dá trabalho, presta atenção!',
    'Eu queria mostrar uma alternativa pra isso aqui!',
    'Olha como esse produto funciona nessa situação!',
  ],
  demonstracao: [
    'Olha isso funcionando!',
    'Presta atenção nesse detalhe aqui!',
    'Deixa eu mostrar como isso funciona!',
    'Olha o que acontece quando eu uso!',
    'Vou mostrar isso aqui de pertinho!',
    'O funcionamento é a parte que mais chama atenção!',
  ],
  identificacao: [
    'Quem gosta de praticidade vai entender!',
    'Se você gosta de deixar tudo organizado, olha só!',
    'Pra quem procura praticidade no dia a dia, olha isso!',
    'Sabe aquela tarefa que a gente sempre precisa fazer?',
    'Se você usa isso no dia a dia, presta atenção!',
  ],
  reacao_espontanea: [
    'Gente, olha isso aqui!',
    'Não, pera aí, preciso mostrar esse detalhe!',
    'Olha só isso, gente!',
    'Eu achei esse detalhe muito interessante!',
    'Olha o que eu fui descobrir!',
    'Gente, presta atenção nisso aqui!',
  ],
  pergunta_direta: [
    'Você já viu algo com essa praticidade?',
    'Já imaginou resolver isso em poucos segundos?',
    'Você também passa por esse perrengue no dia a dia?',
    'Sabia que dá pra facilitar essa tarefa rapidinho?',
  ],
  caracteristica_especifica: [
    'Olha esse acabamento e o design desse modelo!',
    'Olha essa opção perfeita pro dia a dia!',
    'Esse detalhe aqui é o que mais chama atenção!',
    'Olha a qualidade e a praticidade dessa peça!',
    'O diferencial desse achadinho é o resultado na prática!',
  ],
};

// ============================================================================
// BIBLIOTECA DE CTAS (Versão 5.0 - Seção 9)
// ============================================================================
export const ACHADINHOS_CTAS = {
  carrinho: [
    'Se você gostou, dá uma olhadinha no carrinho!',
    'Vou deixar o produto aqui no carrinho pra vocês conferirem!',
    'É só tocar no carrinho e conferir os detalhes!',
    'Dá uma olhadinha no carrinho pra ver se é o que você procura!',
    'Se fez sentido pra você, confere lá no carrinho!',
    'Gostou? Confere o produto no carrinho e vê todos os detalhes!',
  ],
  convite_natural: [
    'Dá uma olhadinha e vê se faz sentido pra você!',
    'Se era isso que você procurava, vale a pena conferir!',
    'Depois me conta o que você achou!',
    'Confere os detalhes e vê se combina com o que você precisa!',
    'Se você gostou da ideia, vale conferir o produto!',
    'Olha os detalhes por lá e vê se é uma boa opção pra você!',
  ],
  preco_e_opcoes: [
    'Confere o preço e as opções disponíveis por lá!',
    'Dá uma olhadinha nos detalhes antes de escolher!',
    'Entra lá pra conferir as informações do produto!',
    'Confere as opções disponíveis e vê qual faz mais sentido!',
    'Dá uma olhadinha no preço atualizado por lá!',
  ],
  beneficio: [
    'Se essa praticidade te ajuda, vale conferir!',
    'Dá uma olhadinha pra conhecer melhor esse recurso!',
    'Confere os detalhes e vê como ele funciona!',
    'Se você precisa disso no dia a dia, dá uma olhadinha!',
    'Vale conferir se essa solução combina com a sua rotina!',
  ],
  interacao: [
    'Me diz se você usaria um desses!',
    'Depois me conta o que você achou!',
    'Você teria um desses na sua casa?',
  ],
};

// ============================================================================
// VALIDADOR E CONTADOR DE CARACTERES (Versão 5.0 - Seção 12)
// ============================================================================
export function countChars(text: string): number {
  return [...(text || '')].length;
}

export function truncateToMax(text: string, max = 225): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (countChars(clean) <= max) return clean;

  const slice = clean.slice(0, max);
  const lastPunct = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
    slice.lastIndexOf(';')
  );
  if (lastPunct > max * 0.65) {
    return slice.slice(0, lastPunct + 1).trim();
  }
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > max * 0.75) {
    return slice.slice(0, lastSpace).trim() + '!';
  }
  return slice.trim();
}

/**
 * Divide uma fala de até 675 caracteres em 3 cenas de até 225 caracteres cada.
 * Respeita quebras de linha existentes (Cena 1, Cena 2, Cena 3 ou parágrafos) ou divide por sentenças.
 */
export function splitAchadinhosSpeech(fullSpeech: string): {
  cena1: string;
  cena2: string;
  cena3: string;
} {
  const raw = (fullSpeech || '').trim();
  if (!raw) {
    return {
      cena1: 'Gente, olha o que eu achei! Vocês precisam ver isso aqui de perto.',
      cena2: 'Olha a facilidade e praticidade disso funcionando no dia a dia.',
      cena3: 'Se fez sentido pra você, confere no carrinho e garante o seu!',
    };
  }

  // 1. Tenta identificar marcadores explícitos de cena como [Cena 1], Cena 1:, etc.
  const explicitMatch1 = raw.match(/(?:\[?Cena\s*1\]?:?)([\s\S]*?)(?=(?:\[?Cena\s*2\]?:?)|$)/i);
  const explicitMatch2 = raw.match(/(?:\[?Cena\s*2\]?:?)([\s\S]*?)(?=(?:\[?Cena\s*3\]?:?)|$)/i);
  const explicitMatch3 = raw.match(/(?:\[?Cena\s*3\]?:?)([\s\S]*?)$/i);

  if (explicitMatch1 && explicitMatch2 && explicitMatch3) {
    return {
      cena1: truncateToMax(explicitMatch1[1].trim(), 225),
      cena2: truncateToMax(explicitMatch2[1].trim(), 225),
      cena3: truncateToMax(explicitMatch3[1].trim(), 225),
    };
  }

  // 2. Tenta quebras de linhas duplas (parágrafos)
  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (paragraphs.length === 3) {
    return {
      cena1: truncateToMax(paragraphs[0], 225),
      cena2: truncateToMax(paragraphs[1], 225),
      cena3: truncateToMax(paragraphs[2], 225),
    };
  }

  // 3. Divisão inteligente por sentenças
  const sentences = raw
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 3) {
    return {
      cena1: truncateToMax(sentences[0], 225),
      cena2: truncateToMax(sentences[1], 225),
      cena3: truncateToMax(sentences[2], 225),
    };
  }

  if (sentences.length < 3) {
    // Poucas sentenças: distribui proporcionalmente
    const totalChars = countChars(raw);
    const targetPerScene = Math.ceil(totalChars / 3);
    const words = raw.split(' ');
    let c1 = '';
    let c2 = '';
    let c3 = '';

    for (const w of words) {
      if (countChars(c1 + ' ' + w) < Math.min(220, targetPerScene)) {
        c1 = c1 ? `${c1} ${w}` : w;
      } else if (countChars(c2 + ' ' + w) < Math.min(220, targetPerScene)) {
        c2 = c2 ? `${c2} ${w}` : w;
      } else {
        c3 = c3 ? `${c3} ${w}` : w;
      }
    }
    return {
      cena1: truncateToMax(c1 || 'Olha esse achadinho que acabou de chegar!', 225),
      cena2: truncateToMax(c2 || 'Praticidade real pro seu dia a dia com muita qualidade.', 225),
      cena3: truncateToMax(c3 || 'Clica no carrinho e dá uma olhadinha nos detalhes!', 225),
    };
  }

  // Mais de 3 sentenças: agrupa em 3 blocos equilibrados
  const c1Arr: string[] = [];
  const c2Arr: string[] = [];
  const c3Arr: string[] = [];

  const perBlock = Math.ceil(sentences.length / 3);
  sentences.forEach((sent, idx) => {
    if (idx < perBlock && countChars([...c1Arr, sent].join(' ')) <= 225) {
      c1Arr.push(sent);
    } else if (idx < perBlock * 2 && countChars([...c2Arr, sent].join(' ')) <= 225) {
      c2Arr.push(sent);
    } else {
      if (countChars([...c3Arr, sent].join(' ')) <= 225) {
        c3Arr.push(sent);
      }
    }
  });

  return {
    cena1: truncateToMax(c1Arr.join(' ') || sentences[0] || 'Olha esse achadinho incrível!', 225),
    cena2: truncateToMax(c2Arr.join(' ') || sentences[1] || 'Super prático e útil pro seu dia a dia.', 225),
    cena3: truncateToMax(c3Arr.join(' ') || sentences[2] || 'Confere lá no carrinho e garante o seu!', 225),
  };
}

/**
 * Constrói as falas do Modo Achadinhos com base nas informações do produto,
 * hooks e CTAs da Versão 5.0.
 */
export function buildAchadinhosSpeeches(params: {
  productName: string;
  productInfo: string;
  additionalInstructions?: string;
  userSpeech?: string;
  clientGender?: string;
}): {
  auroraSpeech: string;
  userSpeech?: string;
  speeches: AchadinhosSpeechParts;
} {
  const pName = (params.productName || 'achadinho').trim();
  const info = (params.productInfo || '').trim();

  // Seleciona hook espontâneo e natural da Versão 5.0
  const hookOptions = [
    `Gente, olha o que eu achei! Vocês precisam ver esse ${pName} de perto!`,
    `Olha esse achadinho que apareceu pra mim! Esse ${pName} me surpreendeu.`,
    `Pera aí, olha isso aqui! Como é que eu não conhecia esse ${pName} antes?`,
    `Gente, eu precisava mostrar isso pra vocês: olha os detalhes desse ${pName}!`,
  ];
  const hook = hookOptions[Math.floor(Math.random() * hookOptions.length)];

  // Extrai benefícios concretos da descrição
  let benefitText = `Ele resolve uma tarefa do dia a dia com muita facilidade e praticidade. Olha o acabamento e a qualidade do material!`;
  if (info) {
    const lines = info.split('\n').map((l) => l.trim()).filter((l) => l.length > 10);
    if (lines.length > 0) {
      const cleanLine = lines[0].replace(/^[-*•]\s*/, '').replace(/https?:\/\/\S+/g, '').trim();
      if (cleanLine.length > 15 && cleanLine.length < 150) {
        benefitText = `Ele foi feito pra facilitar sua rotina: ${cleanLine}. Olha a facilidade no funcionamento prático!`;
      }
    }
  }

  // CTA natural e conversivo
  const ctaOptions = [
    `Se fez sentido pra você, toca no carrinho e dá uma olhadinha nos detalhes antes de acabar!`,
    `Vou deixar aqui no carrinho pra vocês conferirem. Entra lá e vê todos os detalhes!`,
    `Se você precisava de uma praticidade dessas, confere agora no carrinho e garante o seu!`,
  ];
  const cta = ctaOptions[Math.floor(Math.random() * ctaOptions.length)];

  const cena1 = truncateToMax(hook, 225);
  const cena2 = truncateToMax(benefitText, 225);
  const cena3 = truncateToMax(cta, 225);

  const fullAurora = `${cena1}\n\n${cena2}\n\n${cena3}`;

  let fullUser: string | undefined = undefined;
  if (params.userSpeech && params.userSpeech.trim()) {
    fullUser = truncateToMax(params.userSpeech.trim(), 675);
  } else if (params.additionalInstructions && params.additionalInstructions.trim()) {
    fullUser = truncateToMax(params.additionalInstructions.trim(), 675);
  }

  return {
    auroraSpeech: fullAurora,
    userSpeech: fullUser,
    speeches: {
      cena1,
      cena2,
      cena3,
      full: fullAurora,
    },
  };
}

/**
 * Constrói os Prompts de Storyboard (16:9 com 3 quadros A, B, C) e Prompts do OmniFlash / Veo 3
 * de acordo com as seções 13, 14, 15, 16 e 18 da Versão 5.0.
 */
export function buildAchadinhosBlockPrompts(params: {
  productName: string;
  productInfo: string;
  speeches: AchadinhosSpeechParts;
  framing?: 'com_rosto' | 'sem_rosto' | 'pov';
  scenario?: 'padrao_uso' | 'em_casa';
  gender?: 'Homem' | 'Mulher' | null;
  additionalInstructions?: string;
  variations?: Produtos2Variation[];
}): {
  bloco1ImagePrompt: string;
  bloco2ImagePrompt: string;
  bloco3ImagePrompt: string;
  veoPrompt1: string;
  veoPrompt2: string;
  veoPrompt3: string;
} {
  const pName = (params.productName || 'produto').trim();
  const info = (params.productInfo || '').trim();
  const genderStr = params.gender === 'Homem' ? 'um criador de conteúdo brasileiro adulto (homem)' : 'uma criadora de conteúdo brasileira adulta (mulher)';
  const framingNotice = params.framing === 'sem_rosto'
    ? 'Enquadramento das mãos e do produto, sem mostrar o rosto da personagem.'
    : params.framing === 'pov'
    ? 'Ponto de vista em primeira pessoa (POV), mostrando as mãos interagindo com o produto.'
    : 'Criadora brasileira adulta com visual espontâneo e carismático de smartphone.';

  const scenarioDesc = params.scenario === 'em_casa'
    ? 'Ambiente de uma casa brasileira comum e acolhedora (sala de estar ou cozinha com luz natural).'
    : 'Ambiente realista de uso funcional e prático do produto no contexto brasileiro.';

  // --------------------------------------------------------------------------
  // PROMPTS DE STORYBOARD (16:9 com 3 Quadros Verticais A, B, C)
  // --------------------------------------------------------------------------
  const bloco1ImagePrompt = `Gere um storyboard fotográfico horizontal em proporção 16:9 (1920x1080), composto por exatamente três quadros verticais de proporção aproximada 9:16, organizados lado a lado da esquerda para a direita (Quadro A à esquerda, Quadro B ao centro, Quadro C à direita).

OBJETIVO: Representar visualmente a primeira cena (0 a 10s) de um vídeo brasileiro de achadinhos para TikTok Shop. A personagem apresenta o produto ${pName} e inicia a ação de descoberta e hook da copy.

REFERÊNCIA DO PRODUTO:
Utilize as fotografias anexadas como fonte visual prioritária. Preserve fielmente cor, formato, proporções, textura, material, logotipo original do fabricante, botões, detalhes e acabamento. Não invente detalhes. Produto: ${pName}. Detalhes: ${info.slice(0, 300)}

PERSONAGEM:
${genderStr}. ${framingNotice} Aparência natural de pessoa real, pele realista com textura natural, cabelo comum, sem filtros exagerados ou estética 3D.

CENÁRIO:
${scenarioDesc}

ROUPA E CONTINUIDADE:
Roupa casual confortável do dia a dia brasileiro, compatível com a personagem e o ambiente.

QUADRO A — INÍCIO (À ESQUERDA):
A personagem em plano médio, no cenário definido, segurando o produto ${pName} claramente visível. Postura e expressão facial transmitindo descoberta espontânea, conectada com o hook da fala: "${params.speeches.cena1}".

QUADRO B — TRANSIÇÃO (AO CENTRO):
Instante intermediário onde a personagem começa a movimentar ou apresentar o produto ${pName}. Mudança sutil de postura e gesto das mãos, revelando o design ou a forma do produto.

QUADRO C — APRESENTAÇÃO CONCLUÍDA (À DIREITA):
A personagem destaca o produto ${pName} de maneira mais clara, aproximando-o discretamente da câmera para evidenciar sua qualidade e acabamento, preparando para a demonstração da próxima cena.

COMPOSIÇÃO:
Três painéis verticais independentes alinhados horizontalmente em uma única imagem 16:9, com separação visual limpa. Ultrarrealismo, aparência de foto espontânea tirada com smartphone moderno, iluminação natural, sem logos inventados, sem textos gráficos ou legendas na imagem.
${buildProductFidelityDirectives(info)}`;

  const bloco2ImagePrompt = `Gere um storyboard fotográfico horizontal em proporção 16:9 (1920x1080), composto por exatamente três quadros verticais de proporção aproximada 9:16, organizados lado a lado da esquerda para a direita (Quadro A à esquerda, Quadro B ao centro, Quadro C à direita).

OBJETIVO: Representar visualmente a segunda cena (10 a 20s) de um vídeo brasileiro de achadinhos para TikTok Shop. Demonstração prática do produto ${pName} em funcionamento real, evidenciando seu principal benefício.

REFERÊNCIA DO PRODUTO:
Fidelidade total às fotografias anexadas do produto ${pName}. Manter rigorosamente mesmas cores, texturas, proporções e detalhes.

PERSONAGEM & CONTINUIDADE:
Mesma personagem, mesma roupa, mesmo cabelo e mesmo cenário do Storyboard 1.

BENEFÍCIO DEMONSTRADO & FALA:
"${params.speeches.cena2}"

QUADRO A — PREPARAÇÃO (À ESQUERDA):
A personagem posicionando corretamente o ${pName} ou preparando a ação de uso. O produto está em foco com postura natural de início de uso.

QUADRO B — AÇÃO INTERMEDIÁRIA (AO CENTRO):
O instante exato em que o produto está sendo utilizado de forma prática. Mãos anatomicamente corretas interagindo com o ${pName}. Enquadramento aproximado valorizando o funcionamento.

QUADRO C — RESULTADO (À DIREITA):
A ação concluída comprovando visualmente o benefício e a utilidade do ${pName}. Expressão de satisfação sincera e facilidade.

COMPOSIÇÃO:
Três quadros verticais independentes lado a lado em imagem horizontal 16:9. Fotografia de smartphone, luz natural brasileira, sem textos, sem marcas d'água, sem distorções anatômicas.
${buildProductFidelityDirectives(info)}`;

  const bloco3ImagePrompt = `Gere um storyboard fotográfico horizontal em proporção 16:9 (1920x1080), composto por exatamente três quadros verticais de proporção aproximada 9:16, organizados lado a lado da esquerda para a direita (Quadro A à esquerda, Quadro B ao centro, Quadro C à direita).

OBJETIVO: Representar visualmente a terceira cena (20 a 30s) de um vídeo brasileiro de achadinhos para TikTok Shop. Fechamento, recomendação espontânea e convite (CTA) para conferir o ${pName} no carrinho.

REFERÊNCIA DO PRODUTO:
Fidelidade estrita às fotografias anexadas do produto ${pName}.

PERSONAGEM & CONTINUIDADE:
Mesma personagem, mesma roupa, mesmo cabelo e mesmo cenário dos Storyboards anteriores.

CTA & FALA DA CENA:
"${params.speeches.cena3}"

QUADRO A — RETOMADA (À ESQUERDA):
A personagem com o ${pName} em mãos, postura relaxada comunicando que a demonstração foi um sucesso e que a apresentação está finalizando.

QUADRO B — TRANSIÇÃO PARA O FECHAMENTO (AO CENTRO):
A personagem olhando diretamente para a lente com simpatia e sorriso natural, destacando o ${pName} na altura do peito de forma convidativa.

QUADRO C — CONCLUSÃO (À DIREITA):
Composição final espontânea e acolhedora, com a personagem apresentando o produto e fazendo um gesto sutil e natural de indicação para conferir o carrinho de compras.

COMPOSIÇÃO:
Três painéis verticais em única imagem horizontal 16:9. Sem botões falsos, sem elementos de interface gráfica, estética real de smartphone em ambiente brasileiro.
${buildProductFidelityDirectives(info)}`;

  // --------------------------------------------------------------------------
  // PROMPTS DO OMNIFLASH / VEO 3 (Versão 5.0 - Seção 18)
  // --------------------------------------------------------------------------
  const veoPrompt1 = `Generate a 10-second ultra-realistic vertical social-media video using the corresponding scene 1 storyboard and product reference images.
SCENE PURPOSE:
Introduce the product immediately, deliver the approved hook, and create a natural transition into the product demonstration.
CHARACTER:
${genderStr}. ${framingNotice} Natural Brazilian content creator. Preserve facial identity, hair, skin tone, outfit, and spontaneous personality.
ENVIRONMENT:
${scenarioDesc} Natural lighting, consistent Brazilian ambient setting.
PRODUCT:
${pName}. Match the supplied product photographs exactly. Do not redesign, recolor, reshape or replace any product details.
ACTION:
Begin immediately with a natural discovery gesture. The character shows the product ${pName} to the camera. Movement is physically plausible following the storyboard progression from A to B to C.
CAMERA:
Realistic handheld smartphone framing. Natural medium shot with a subtle approach to highlight the product. Avoid excessive cinematic camera moves.
PERFORMANCE:
Natural Brazilian Portuguese delivery, spontaneous facial expressions, believable body language and accurate lip synchronization.
INFLUENCER DIALOGUE IN PORTUGUÊS BRASIL: "${params.speeches.cena1}"
AUDIO:
Clear natural voice, Brazilian Portuguese accent, realistic speech rhythm, subtle environmental ambient sound.
CONTINUITY:
The final action naturally prepares the demonstration in scene 2. Maintain the same character, clothing, product and environment.
RESTRICTIONS:
No extra fingers, malformed hands, duplicated products, floating objects, random text, invented logos or additional voices.
STYLE:
Ultra-realistic Brazilian social-media content recorded with a high-quality modern smartphone. Natural, spontaneous, non-cinematic.`;

  const veoPrompt2 = `Generate a 10-second ultra-realistic vertical social-media video using the scene 2 storyboard and the original product photographs.
SCENE PURPOSE:
Demonstrate the main real product benefit and explain why it is useful in everyday life.
CHARACTER:
Use exactly the same adult Brazilian content creator as in scene 1. Preserve facial identity, hair, outfit, voice and personality.
ENVIRONMENT:
Same Brazilian setting, lighting, furniture and background as in scene 1.
PRODUCT:
${pName}. Preserve the exact appearance and physical characteristics shown in reference images.
ACTION:
Follow the visual progression represented by storyboard frames A, B and C. Begin with the preparation, show the action in progress, and conclude with the real demonstrative result.
Hand movements must be physically plausible, showing real product interaction without impossible effects.
CAMERA:
Realistic smartphone framing. Subtle close-up following the hands and the product to emphasize the benefit clearly.
PERFORMANCE:
Natural Brazilian Portuguese speech, believable expressions, coherent gestures and accurate lip synchronization.
INFLUENCER DIALOGUE IN PORTUGUÊS BRASIL: "${params.speeches.cena2}"
AUDIO:
Clear natural voice, consistent accent, realistic pacing, subtle ambient sound and no additional dialogue.
CONTINUITY:
Seamless continuation of scene 1. The final position prepares the closing scene.
RESTRICTIONS:
No altered product details, duplicated objects, malformed hands, extra fingers, floating objects, random text or additional voices.
STYLE:
Ultra-realistic Brazilian social-media video, natural lighting, smartphone camera aesthetics and spontaneous human performance.`;

  const veoPrompt3 = `Generate a 10-second ultra-realistic vertical social-media video using the scene 3 storyboard and the original product photographs.
SCENE PURPOSE:
Conclude the presentation naturally and deliver the approved call to action.
CHARACTER:
Use exactly the same adult Brazilian content creator as in scenes 1 and 2. Preserve face, hair, outfit, body proportions and voice.
ENVIRONMENT:
Maintain the exact same Brazilian setting, background and lighting.
PRODUCT:
${pName}. Preserve the original product appearance and all visible details.
ACTION:
Follow the progression from storyboard frame A to B to C. The character naturally completes the demonstration, looks directly at the camera with a friendly smile, and finishes with a relaxed presentation of the product.
A small natural gesture accompanies the call to action, pointing politely towards the shopping area.
CAMERA:
Natural handheld smartphone framing with a gentle final reframing. Avoid exaggerated zooms or dramatic cinematic movements.
PERFORMANCE:
Spontaneous Brazilian Portuguese delivery, relaxed body language and accurate lip synchronization.
INFLUENCER DIALOGUE IN PORTUGUÊS BRASIL: "${params.speeches.cena3}"
AUDIO:
Clear natural voice, consistent Brazilian accent, realistic rhythm and subtle ambient sound.
CONTINUITY:
The final scene must feel like the natural conclusion of the video, preserving character, product, outfit and environment.
RESTRICTIONS:
No invented graphics, no artificial button overlays, no captions, no altered product details, no malformed hands.
STYLE:
Ultra-realistic Brazilian social-media content recorded on a high-quality smartphone. Natural, persuasive and non-cinematic.`;

  return {
    bloco1ImagePrompt,
    bloco2ImagePrompt,
    bloco3ImagePrompt,
    veoPrompt1: appendFidelityLockToVeoPrompt(veoPrompt1),
    veoPrompt2: appendFidelityLockToVeoPrompt(veoPrompt2),
    veoPrompt3: appendFidelityLockToVeoPrompt(veoPrompt3),
  };
}

