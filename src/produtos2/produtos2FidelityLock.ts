/**
 * MODULO CENTRAL DE FIDELIDADE VISUAL DO PRODUTO 2.0
 * Implementa a trava global obrigatoria e prioritaria contra invencao de partes nao fotografadas,
 * angulos ocultos e conteudo de embalagens fechadas/lacradas (Diretrizes TikTok Shop).
 */

export const PRODUCT_VISUAL_FIDELITY_LOCK_BLOCK = `PRODUCT VISUAL FIDELITY LOCK — STRICT REFERENCE CONSTRAINTS (TIKTOK SHOP ZERO-TOLERANCE COMPLIANCE):

Use the provided product reference images as the sole visual authority for the exact physical appearance, quantity, scale, and details of the product.

1. STRICT QUANTITY LOCK (EXACT UNIT & KIT COUNT):
Never show a different product quantity on screen than what the listing or reference specifies.
- If the ad/reference is for 1 single product (e.g., 1 smartphone, 1 watch, 1 perfume, 1 shirt), NEVER show 2 or more units on screen in ANY frame.
- If the ad/reference is for a kit of N units (e.g., a kit of 4 diaper packs, combo of 3 t-shirts, pack of 2 bottles), NEVER show N-1, N+1, or any quantity other than EXACTLY N units in any frame.
- 100% strict numerical fidelity to the advertised unit/pack count across every single frame.

2. EXACT BRAND, MANUFACTURER NAME, MODEL NAME & LOGO:
The brand logo, manufacturer name, model designation, and typography printed, stamped, or embossed on the physical product MUST be 100% identical in spelling, font typography, color, size, and position to the reference images. Never distort, omit, blur, or invent generic names or alternate markings.

3. ACCURATE PHYSICAL SIZE & REALISTIC SCALE (NO EXAGGERATION):
The product must NEVER appear larger, disproportionate, or physically exaggerated compared to the reference photos and real life. Proportions relative to human hands, arms, body, countertops, and nearby items must be strictly realistic and proportionate. Do not artificially enlarge, stretch, or inflate the product's visual size.

4. APPAREL & CLOTHING FIDELITY (BUTTONS, SEAMS & DETAILS):
When the product is clothing or apparel, the garment must be 100% faithful to the reference photos in every aspect: exact buttons (shape, number, color), seams/stitching lines, fabric texture, weave pattern, prints, collar shape, pockets, hem, cut, and color tone. Never add, remove, or modify buttons, zippers, seams, or embroidery.

5. ORAL CARE & NO TEETH WHITENING BEFORE/AFTER:
For oral care products (toothbrush, oral irrigator, mouthwash, dental floss, etc.), it is STRICTLY FORBIDDEN to show before-and-after teeth whitening, close-up of teeth implying whitening/bleaching results, or any visual claims of dental whitening. Produce scenes WITHOUT showing teeth or implying cosmetic whitening (e.g., demonstrate the device in hands, water stream into a sink or glass, nozzles, power buttons, and friendly presentation with closed or natural smile without exposed whitening comparison).

6. STRICT VISIBLE-ANGLE LOCK & NO UNPHOTOGRAPHED INVENTIONS:
Never invent, infer, reconstruct, hallucinate, or reveal any product surface, side, rear view, bottom view, internal component, hidden detail, accessory, connector, texture, label, color variation, or physical feature that is not clearly supported by the provided reference images.
- If the product is shown only from the front, keep it front-facing. Do not reveal its sides, rear, bottom, or internal construction unless those specific views are explicitly documented in the reference images.
- If only a closed package is shown, do not open it, remove its contents, or reveal individual items inside unless those items and their appearance are explicitly documented in the reference images.
- Do not rotate, turn, orbit around, flip, tilt, or move the camera around the product in a way that reveals any unreferenced surface or undocumented angle.
- Do not generate a reverse angle, a new perspective, or a three-dimensional view that exposes previously unseen parts of the product.

7. CAMERA MOVEMENTS & FIDELITY OVER CREATIVITY:
Keep the product within the documented viewpoints and visible surfaces of the reference images throughout the entire video. Any camera movement must remain within the visual information established by the references. Prefer static framing, controlled push-ins, controlled pull-backs, or movements that do not reveal unknown surfaces.
Reference fidelity takes absolute priority over cinematic creativity, camera movement, scene variety, and visual enhancement. Never fabricate visual information about the product.`;

/**
 * Anexa a trava global de fidelidade visual aos prompts de video do Veo 3 / Vell / OmniFlash
 * se o bloco ainda nao estiver presente.
 */
export function appendFidelityLockToVeoPrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return prompt || '';
  if (prompt.includes('PRODUCT VISUAL FIDELITY LOCK')) {
    return prompt;
  }
  return `${PRODUCT_VISUAL_FIDELITY_LOCK_BLOCK}\n\n${prompt.trim()}`;
}

/**
 * Diretrizes obrigatorias para prompts de geracao de imagem de Storyboard (DALL-E / OpenAI / Gemini).
 */
export function buildProductFidelityDirectives(_productInfo?: string): string {
  return `
========================
7 REGRAS MANDATÓRIAS DE FIDELIDADE VISUAL AO PRODUTO (TIKTOK SHOP ZERO-PUNIÇÃO):
1. TRAVA ESTRITA DE QUANTIDADE DE PRODUTO: Nunca colocar quantidade diferente do produto no vídeo! Se o anúncio é de 1 celular, 1 perfume ou 1 relógio, NUNCA pode aparecer 2 celulares/perfumes/relógios na tela em nenhum frame. Se o anúncio é kit de 4 pacotes de fraldas, NUNCA pode aparecer 3 ou 5 pacotes na mesma tela em nenhum frame: devem aparecer SEMPRE e RIGOROSAMENTE a quantidade exata (ex.: exatamente 4 pacotes). 100% de fidelidade numérica à quantidade anunciada em todos os quadros!
2. PROIBIÇÃO ABSOLUTA DE PROMESSAS / AFIRMAÇÕES DE GARANTIA NA FALA: A fala NUNCA pode conter afirmações como "EU GARANTO", "eu prometo", "garantido", "resultado garantido" ou promessas irreais. A fala deve transmitir entusiasmo conversacional seguro e autêntico ("você vai adorar", "faz toda a diferença", "vale muito a pena").
3. LOGOMARCA, NOME DO FABRICANTE E DO PRODUTO 100% IDÊNTICOS: A logomarca, o nome do fabricante e o nome do produto impressos ou gravados no produto físico DEVEM ser sempre idênticos ao que está nas imagens de referência (mesma grafia, tipografia, cor, proporção e posição exata na peça). NUNCA distorcer, inventar ou remover.
4. PRODUTOS DE USO ORAL SEM "ANTES E DEPOIS" E SEM CLAREAMENTO DE DENTES: Para produtos de uso oral (escova de dentes, irrigador oral, enxaguante bucal, etc.), é EXPRESSAMENTE PROIBIDO mostrar "antes e depois" de clareamento de dentes ou dar a entender que houve clareamento dental. Fazer o vídeo SEM mostrar dentes em close de branqueamento (demonstrar o aparelho na mão, o jato d'água na pia/copo, botões e bicos, com expressão facial espontânea e acolhedora sem focar em dentes clareados).
5. ROUPAS E VESTUÁRIO 100% FIÉIS: Quando o produto for roupas ou vestuário, a peça precisa ser 100% fiel às fotos de referência no tocante a botões (quantidade, formato, cor), costuras, pespontos, cores, detalhes, caimento e padrão visual. NUNCA inventar botões ou costuras diferentes das fotos.
6. TAMANHO REAL — PROIBIDO APARENTAR SER MAIOR: O produto NÃO pode aparentar ser maior do que o produto mostrado nas fotos de referência. Manter escala física 100% realista e proporcional às mãos, ao corpo do apresentador e ao cenário.
7. LAYOUT, CORES E ÂNGULOS VISÍVEIS 100% IDÊNTICOS (PROIBIDO INVENTAR ÂNGULOS OCULTOS): Manter o produto com layout e cores 100% idênticos às fotos de referência. NUNCA criar imagem do produto mostrando ângulos dele que não estejam nas imagens de referência (ou seja, NÃO inventar parte traseira, lateral ou interior do produto). Nunca inventar nenhum detalhe ou parte: mostrar o produto SEMPRE nos ângulos visíveis nas fotos de referência.
========================`;
}

/**
 * Detecta se o produto e um item vendido em pacote/embalagem fechada (ex.: fraldas, lencos, caixas, combos).
 */
export function isPackagedProductOnly(productName: string, productInfo?: string, extraContext?: string): boolean {
  const combined = `${productName || ''} ${productInfo || ''} ${extraContext || ''}`.toLowerCase();
  return (
    /\b(fralda|fraldas|babysec|pampers|huggies|cremer|mamy|len[çc]o|len[çc]os|toalha|toalhinhas?|absorvente|absorventes)\b/i.test(combined) ||
    /\b(pacote|pacotes|combo de pacotes|fardo|fardos|embalagem fechada|embalagem lacrada|caixa fechada|pote lacrado)\b/i.test(combined) ||
    /galinha\s*pintadinha/i.test(combined)
  );
}

export interface DetectedQuantityInfo {
  quantity: number;
  isKit: boolean;
  unitLabel: string;
}

/**
 * Detecta a quantidade e modalidade (unidade única vs kit/combo com X unidades) do produto.
 * Garante que a fidelidade numérica seja rigorosa em 100% dos frames e prompts.
 */
export function detectProductQuantity(
  productName: string,
  productInfo?: string,
  extraContext?: string
): DetectedQuantityInfo {
  const combined = `${productName || ''} ${productInfo || ''} ${extraContext || ''}`.toLowerCase();

  const kitMatch =
    combined.match(/\b(?:kit|combo|fardo|jogo|conjunto)\s+(?:com|de)\s+(\d+)\b/i) ||
    combined.match(/\b(\d+)\s*(?:pacotes?|unidades?|unid|un|pcs|peças|frascos?|garrafas?|pares|camisetas?|blusas?)\b/i);

  if (kitMatch) {
    const qty = parseInt(kitMatch[1], 10);
    if (!isNaN(qty) && qty > 0) {
      return {
        quantity: qty,
        isKit: qty > 1,
        unitLabel: qty === 1 ? '1 unidade' : `kit de ${qty} unidades`,
      };
    }
  }

  return {
    quantity: 1,
    isKit: false,
    unitLabel: '1 unidade única',
  };
}

/**
 * Detecta se o produto é de uso/higiene oral (irrigador oral, escova de dentes, enxaguante bucal, etc.)
 * Para aplicar a trava estrita do TikTok de não mostrar dentes em close, antes e depois ou sugerir clareamento dental.
 */
export function isOralCareProduct(productName: string, productInfo?: string, extraContext?: string): boolean {
  const combined = `${productName || ''} ${productInfo || ''} ${extraContext || ''}`.toLowerCase();
  return /\b(irrigador\s*oral|escova\s*(?:de\s*dentes?|dental|el[ée]trica)|enxaguante\s*bucal|fio\s*dental|creme\s*dental|pasta\s*de\s*dente|clareamento|clareador\s*dental|sa[uú]de\s*bucal)\b/i.test(combined);
}

/**
 * Detecta se o produto é peça de vestuário/roupa (camisetas, vestidos, calças, jaquetas, etc.)
 * Para exigir fidelidade 100% de botões, costuras, cores, padrão visual e caimento.
 */
export function isApparelProduct(productName: string, productInfo?: string, extraContext?: string): boolean {
  const combined = `${productName || ''} ${productInfo || ''} ${extraContext || ''}`.toLowerCase();
  return /\b(vestido|camisa|camiseta|bermuda|cal[çc]a|short|shorts|jaqueta|casaco|blusa|saia|cueca|calcinha|suti[aã]|lingerie|jogger|moletom|roupa|vestu[aá]rio)\b/i.test(combined);
}

/**
 * Retorna as cenas canônicas oficiais para produtos em pacotes fechados / combos de embalagens.
 * Todas as cenas manuseiam EXCLUSIVAMENTE a embalagem fechada, sem abrir ou inventar itens internos soltos.
 */
export function getCanonicalPackagedScene(index: number, productName: string, totalCount: 4 | 6 | 9 = 9, partIndex: 1 | 2 = 1): { framing: string; action: string } {
  const p = (productName || 'Produto').trim();

  if (totalCount === 4) {
    const canonical4 = [
      {
        framing: 'Plano médio frontal com rosto',
        action: `Apresentadora segurando com os dois braços os pacotes fechados de ${p} agrupados diante do peito, com sorriso largo e entusiasmo apresentando o kit à câmera.`,
      },
      {
        framing: 'Plano médio sobre a bancada/mesa',
        action: `Os pacotes fechados de ${p} organizados sobre a mesa ou bancada. Apresentadora ao lado apresentando o conjunto com as mãos, destacando a quantidade do kit com gestos naturais.`,
      },
      {
        framing: 'Close-up aproximado na embalagem',
        action: `Enquadramento mais próximo dos pacotes fechados de ${p} sobre a bancada. Dedo indicador apontando delicadamente para o logotipo e informações impressas na frente da embalagem lacrada.`,
      },
      {
        framing: 'Close com recomendação e aprovação',
        action: `Apresentadora demonstrando entusiasmo e abraçando delicadamente os pacotes fechados de ${p} com sorriso espontâneo e convite amigável de recomendação.`,
      },
    ];
    return canonical4[Math.min(index, canonical4.length - 1)];
  }

  if (totalCount === 6 && partIndex === 2) {
    const part2 = [
      {
        framing: 'Plano médio sobre a mesa',
        action: `Apresentadora organizando os pacotes fechados de ${p} em fila sobre a mesa ou cômoda com postura acolhedora.`,
      },
      {
        framing: 'Close-up frontal com rosto',
        action: `Apresentadora segurando um pacote fechado de ${p} de frente para a câmera, sorrindo e mostrando a embalagem original com nitidez.`,
      },
      {
        framing: 'Plano aberto no quarto',
        action: `Visão mais ampla mostrando os pacotes fechados de ${p} organizados na prateleira ou bancada, evidenciando a praticidade do combo.`,
      },
      {
        framing: 'Plano médio com rosto',
        action: `Apresentadora em pé atrás da pilha de pacotes fechados de ${p} sobre a mesa, com as mãos apoiadas neles e sorriso largo de satisfação.`,
      },
      {
        framing: 'Close com o pacote fechado',
        action: `Apresentadora segurando com carinho o pacote fechado de ${p} junto ao peito com expressão feliz e segura.`,
      },
      {
        framing: 'Plano médio de fechamento e CTA',
        action: `Apresentadora segurando o pacote fechado de ${p} em destaque com uma das mãos e apontando amigavelmente para o carrinho de compras.`,
      },
    ];
    return part2[Math.min(index, part2.length - 1)];
  }

  const canonical9 = [
    {
      framing: 'Plano médio frontal com rosto',
      action: `Apresentadora segurando com as duas mãos a pilha com os pacotes fechados de ${p}, exibindo o combo completo de frente para a câmera com sorriso entusiasmado.`,
    },
    {
      framing: 'Plano médio aproximado',
      action: `Apresentadora aproxima os pacotes fechados de ${p} da câmera, destacando a embalagem frontal lacrada e a logomarca oficial com alta nitidez.`,
    },
    {
      framing: 'Plano médio sobre a mesa/cômoda',
      action: `Apresentadora apoia a pilha de pacotes fechados de ${p} organizados sobre a cômoda ou mesa, apontando com o dedo indicador para a quantidade.`,
    },
    {
      framing: 'Plano médio dinâmico de volume',
      action: `Apresentadora segurando dois pacotes fechados de ${p} lado a lado diante do peito, evidenciando o tamanho e a quantidade que vem no kit.`,
    },
    {
      framing: 'Close-up frontal com rosto',
      action: `Apresentadora segurando um pacote fechado de ${p} de frente para a câmera, sorrindo e mostrando as ilustrações e selos oficiais impressos na própria embalagem de referência.`,
    },
    {
      framing: 'Macro fechado na embalagem',
      action: `Macro focado na frente da embalagem lacrada de ${p}. Dedo indicador apontando para a indicação de tamanho e quantidade de unidades impressas no pacote fechado.`,
    },
    {
      framing: 'Plano médio aberto contextual',
      action: `Apresentadora organizando os pacotes fechados de ${p} na prateleira ou cômoda do quarto, mostrando como o estoque fica prático e organizado no dia a dia.`,
    },
    {
      framing: 'Plano médio com rosto',
      action: `Apresentadora em pé atrás da pilha completa de pacotes fechados de ${p} sobre a mesa, com as mãos apoiadas nos pacotes e sorriso largo de satisfação.`,
    },
    {
      framing: 'Close com rosto e recomendação',
      action: `Apresentadora segurando com carinho o pacote fechado de ${p} nos braços, olhando para a câmera e fazendo um gesto amigável convidando para conferir no carrinho de compras.`,
    },
  ];

  return canonical9[Math.min(index, canonical9.length - 1)];
}

/**
 * Sanitiza descricoes de cenas para impedir qualquer comando de abrir caixas,
 * rasgar embalagens ou inventar itens internos soltos quando nao documentados,
 * alem de blindar produtos orais contra alegações/visuais de clareamento de dentes.
 */
export function sanitizeSceneFidelityAction(
  action: string,
  productName?: string,
  isPackaged?: boolean,
  productInfo?: string
): string {
  if (!action) return action;

  const packaged = isPackaged ?? (productName ? isPackagedProductOnly(productName, productInfo) : false);
  const isOralCare = productName ? isOralCareProduct(productName, productInfo, action) : false;

  let clean = action
    // Abertura de embalagens
    .replace(/\b(?:abrindo|rasgando|deslacrando)\s+[^,.;]*/gi, 'segurando o pacote fechado de frente com clareza')
    .replace(/\b(?:tirando|retirando|puxando|sacando)\s+(?:uma?|o|a|os|as|do|da|das|dos)?[^,.;]*(?:fralda|unidade|item|conte[uú]do|produto)[^,.;]*/gi, 'posicionando e exibindo os pacotes fechados')
    .replace(/\b(?:desdobrando|esticando|abrindo)\s+[^,.;]*/gi, 'apresentando a embalagem fechada de frente')
    // Elásticos, abas, fitas e partes internas
    .replace(/\b(?:el[aá]sticos?|abas?|fitas?|laterais|barreiras?|revestimento|forro|núcleo|camada|gel)[^,.;]*/gi, 'especificações e detalhes impressos na embalagem lacrada')
    // Itens soltos nao documentados
    .replace(/\bfraldas?\s+(?:abertas?|soltas?|desdobradas?|fora do pacote|de dentro)[^,.;]*/gi, 'pacote fechado de fraldas')
    .replace(/\b(?:com\s+)?estampa\s+(?:d[aeo]|divertida|infantil|colorida)?\s*(?:galinha\s*pintadinha|desenho|personagem)?[^,.;]*/gi, 'arte e logomarca oficiais impressas na própria embalagem de referência')
    // Textura interna e toques em pecas internas
    .replace(/\b(?:tocando|passando a m[aã]o|sentindo)\s+[^,.;]*/gi, 'dedo apontando para as especificações e selo de qualidade impressos na frente da embalagem fechada')
    .replace(/\bdedo\s+pressionando\s+[^,.;]*/gi, 'mão segurando com firmeza o pacote fechado')
    // Testes com liquidos e absorcao
    .replace(/\b(?:jogando|[aá]gua|despejando|derramando|copo d'?\s*[aá]gua|teste de absor[çc][aã]o|l[ií]quido azul|absorvendo)[^,.;]*/gi, 'apresentando os pacotes fechados organizados no cenário, destacando a praticidade do combo')
    // Indicador de umidade e estados usados
    .replace(/\b(?:indicador de umidade|linha indicadora|fralda molhada|fralda usada|efeito azul)[^,.;]*/gi, 'pacotes fechados organizados em destaque na cômoda ou bancada')
    // Angulos traseiros e versos
    .replace(/\bmostrando a parte traseira\b/gi, 'mostrando a frente documentada nas fotos')
    .replace(/\bmostrando o verso\b/gi, 'mostrando a frente do produto')
    .replace(/\bvirando o produto de costas\b/gi, 'mantendo o produto de frente')
    .replace(/\s+/g, ' ')
    .trim();

  // Sanitização estrita para produtos de saúde/uso oral (Regra TikTok Shop sem clareamento / antes e depois)
  if (isOralCare) {
    clean = clean
      .replace(/\b(?:antes\s+e\s+depois|clareamento\s*dental|clareamento\s*de\s*dentes?|clareando|dentes?\s+mais\s+brancos?)\b/gi, 'demonstração de uso do aparelho')
      .replace(/\b(?:close|foco|zoom)\s+(?:nos|dos|sobre\s+os)\s+dentes\b/gi, 'plano médio segurando o aparelho com sorriso acolhedor sem focar nos dentes')
      .replace(/\bmostrando\s+(?:os\s+)?dentes(?:\s+brancos)?\b/gi, 'apresentando o aparelho em mãos com expressão satisfeita')
      .replace(/\baplicando\s+o\s+jato\s+direto\s+nos\s+dentes\b/gi, 'demonstrando o jato potente e limpo de água na pia')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (packaged) {
    clean = clean
      .replace(/\bfralda\b(?!\s+(?:babysec|pampers|huggies|fechada))/gi, 'pacote de fraldas fechado')
      .replace(/\bfraldas\b(?!\s+(?:babysec|pampers|huggies|fechadas))/gi, 'pacotes de fraldas fechados');
  }

  return clean;
}

/**
 * Sanitiza todas as cenas de uma lista para blindar contra invencoes visuais de produtos embalados.
 * Se for produto embalado (fraldas, pacotes, caixas), substitui automaticamente por cenas canônicas de embalagem fechada.
 */
export function sanitizeAllScenesForFidelity<T extends { action: string; storyboardDescription?: string; framing?: string; number?: number }>(
  scenes: T[],
  productName: string,
  productInfo?: string,
  scenePartIndex: 1 | 2 = 1
): T[] {
  if (!Array.isArray(scenes)) return scenes;
  const isPackaged = isPackagedProductOnly(productName, productInfo);
  const totalCount: 4 | 6 | 9 = scenes.length === 4 ? 4 : scenes.length === 6 ? 6 : 9;

  return scenes.map((sc, idx) => {
    let cleanAction = sc.action;
    let cleanFraming = (sc.framing || '').trim();

    if (isPackaged) {
      const canonical = getCanonicalPackagedScene(idx, productName, totalCount, scenePartIndex);
      cleanAction = canonical.action;
      cleanFraming = canonical.framing;
    } else {
      cleanAction = sanitizeSceneFidelityAction(sc.action, productName, false);
    }

    const updatedDesc = cleanFraming ? `${cleanFraming}. ${cleanAction}` : cleanAction;
    return {
      ...sc,
      framing: cleanFraming,
      action: cleanAction,
      storyboardDescription: updatedDesc,
    };
  });
}

/**
 * Sanitiza a lista de travas de produto (productLock) para produtos embalados/lacrados,
 * removendo terminantemente qualquer menção a partes internas soltas, algodão, gel, elásticos e estampas internas.
 */
export function sanitizeProductLockForFidelity(
  productLock: string[],
  productName: string,
  productInfo?: string
): string[] {
  if (!Array.isArray(productLock)) return productLock;
  const isPackaged = isPackagedProductOnly(productName, productInfo, productLock.join(' '));
  if (!isPackaged) return productLock;
  const p = (productName || 'Produto').trim();

  const filtered = productLock
    .map((l) =>
      String(l)
        .replace(/\b(?:com\s+)?estampa\s+(?:d[aeo]|divertida|infantil|colorida)?\s*(?:galinha\s*pintadinha|desenho|personagem)?[^,.;]*/gi, 'arte e logomarca oficiais impressas na própria embalagem lacrada')
        .replace(/galinha\s*pintadinha/gi, 'embalagem oficial')
        .replace(/\b(?:el[aá]sticos?|abas?|fitas?|forro|revestimento interno|núcleo|camada|gel|absorção)[^,.;]*/gi, 'embalagem lacrada de fábrica')
        .replace(/\bfraldas?\s+(?:abertas?|soltas?|desdobradas?|fora do pacote|de dentro)[^,.;]*/gi, 'pacote fechado de fraldas')
        .replace(/\bfralda\b(?!\s+(?:babysec|pampers|huggies|fechada))/gi, 'pacote de fraldas fechado')
        .replace(/\bfraldas\b(?!\s+(?:babysec|pampers|huggies|fechadas))/gi, 'pacotes de fraldas fechados')
        .trim()
    )
    .filter((l) => !/solt[ao]|abert[ao]|estic|rasg|derram|líquido|teste/i.test(l));

  return [
    `EMBALAGEM LACRADA DE FÁBRICA: O produto nas fotos de referência consiste exclusivamente em pacotes fechados de ${p}. É expressamente proibido abrir o pacote, rasgar ou desenhar fraldas soltas/abertas fora da embalagem.`,
    `IDENTIDADE VISUAL DA EMBALAGEM: Cores, logomarcas oficiais e identidade gráfica frontal dos pacotes lacrados de ${p} rigorosamente idênticas às fotos reais anexadas.`,
    ...filtered,
  ];
}

/**
 * Sanitiza o mapa visual da copy para produtos embalados/lacrados, garantindo que
 * nenhuma prova visual sugira abrir o pacote ou manusear produtos soltos.
 */
export function sanitizeVisualMapForFidelity<T extends { excerpt: string; intent: string; visualProof: string; scenes: string }>(
  visualMap: T[],
  productName: string,
  productInfo?: string
): T[] {
  if (!Array.isArray(visualMap)) return visualMap;
  const isPackaged = isPackagedProductOnly(productName, productInfo);
  if (!isPackaged) return visualMap;
  const p = (productName || 'Produto').trim();

  return visualMap.map((item) => {
    let cleanProof = (item.visualProof || '')
      .replace(/\b(?:desdobrando|esticando|abrindo|rasgando)\s+[^,.;]*/gi, `apresentando os pacotes fechados de ${p}`)
      .replace(/\b(?:el[aá]sticos?|abas?|fitas?|forro|revestimento interno|gel|algodão|camada|núcleo)[^,.;]*/gi, 'especificações impressas na embalagem')
      .replace(/\b(?:fralda|item)\s+(?:aberta|solta|fora do pacote)[^,.;]*/gi, `pacote fechado de ${p}`)
      .replace(/\bfralda\b(?!\s+(?:babysec|pampers|huggies|fechada))/gi, `pacote fechado de ${p}`)
      .replace(/\bfraldas\b(?!\s+(?:babysec|pampers|huggies|fechadas))/gi, `pacotes fechados de ${p}`)
      .replace(/\b(?:jogando|[aá]gua|despejando|derramando|copo d'?\s*[aá]gua|teste de absor[çc][aã]o)[^,.;]*/gi, 'apresentando a pilha de pacotes fechados')
      .replace(/galinha\s*pintadinha/gi, 'embalagem de referência');

    return {
      ...item,
      visualProof: cleanProof,
    };
  });
}

/**
 * Higieniza o texto bruto do prompt do storyboard antes de enviar para os motores de imagem (OpenAI/Gemini).
 */
export function sanitizeStoryboardPromptForFidelity(prompt: string, productName?: string, productInfo?: string): string {
  if (!prompt || typeof prompt !== 'string') return prompt || '';
  const isPackaged = isPackagedProductOnly(productName || '', productInfo, prompt);
  if (!isPackaged) return prompt;

  return prompt
    .replace(/\b(?:abrindo|rasgando|deslacrando)\s+[^,.;\n]*/gi, 'segurando o pacote fechado de frente')
    .replace(/\b(?:tirando|retirando|puxando)\s+[^,.;\n]*(?:fralda|unidade|item)[^,.;\n]*/gi, 'exibindo os pacotes fechados de frente')
    .replace(/\b(?:desdobrando|esticando)\s+[^,.;\n]*/gi, 'apresentando o pacote fechado')
    .replace(/\b(?:el[aá]sticos?|abas?|fitas?|forro|revestimento interno|núcleo|camada|gel|absorção)[^,.;\n]*/gi, 'especificações na embalagem lacrada de fábrica')
    .replace(/\bfraldas?\s+(?:abertas?|soltas?|desdobradas?|fora do pacote|de dentro)[^,.;\n]*/gi, 'pacote fechado de fraldas')
    .replace(/\b(?:com\s+)?estampa\s+(?:d[aeo]|divertida|infantil|colorida)?\s*(?:galinha\s*pintadinha|desenho|personagem)?[^,.;\n]*/gi, 'arte e logomarca oficiais impressas na embalagem de referência')
    .replace(/galinha\s*pintadinha/gi, 'embalagem de referência')
    .replace(/\b(?:jogando|despejando|derramando)\s+[aá]gua[^,.;\n]*/gi, 'destacando os pacotes fechados')
    .replace(/\bcopo d'?\s*[aá]gua[^,.;\n]*/gi, 'pacote fechado de fraldas')
    .replace(/\bteste de absor[çc][aã]o[^,.;\n]*/gi, 'destaque dos pacotes fechados')
    .replace(/\bindicador de umidade[^,.;\n]*/gi, 'pacotes fechados organizados na bancada')
    .replace(/\btocando a textura da fralda[^,.;\n]*/gi, 'apontando para o selo oficial impresso na embalagem fechada')
    .replace(/\bfralda\b(?!\s+(?:babysec|pampers|huggies|fechada))/gi, 'pacote de fraldas fechado')
    .replace(/\bfraldas\b(?!\s+(?:babysec|pampers|huggies|fechadas))/gi, 'pacotes de fraldas fechados');
}


