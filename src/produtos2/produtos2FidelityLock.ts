/**
 * MODULO CENTRAL DE FIDELIDADE VISUAL DO PRODUTO 2.0
 * Implementa a trava global obrigatoria e prioritaria contra invencao de partes nao fotografadas,
 * angulos ocultos e conteudo de embalagens fechadas/lacradas (Diretrizes TikTok Shop).
 */

export const PRODUCT_VISUAL_FIDELITY_LOCK_BLOCK = `PRODUCT VISUAL FIDELITY LOCK — STRICT REFERENCE CONSTRAINTS:

Use the provided product reference images as the sole visual authority for the exact physical appearance of the product.

Never invent, infer, reconstruct, hallucinate, or reveal any product surface, side, rear view, bottom view, internal component, hidden detail, accessory, connector, texture, label, color variation, or physical feature that is not clearly supported by the provided reference images.

Do not rotate, turn, orbit around, flip, tilt, or move the camera around the product in a way that reveals any unreferenced surface or undocumented angle.

Do not generate a reverse angle, a new perspective, or a three-dimensional view that exposes previously unseen parts of the product.

Keep the product within the documented viewpoints and visible surfaces of the reference images throughout the entire video.

Any camera movement must remain within the visual information established by the references. Prefer static framing, controlled push-ins, controlled pull-backs, or movements that do not reveal unknown surfaces.

If the product is shown only from the front, keep it front-facing. Do not reveal its sides, rear, bottom, or internal construction unless those specific views are explicitly documented in the reference images.

If only a closed package is shown, do not open it, remove its contents, or reveal individual items inside unless those items and their appearance are explicitly documented in the reference images.

Preserve the exact product identity, proportions, shape, color, visible components, packaging, labels, and other documented details.

When a requested action would require inventing an unknown product feature or revealing an undocumented surface, do not perform that action. Use an alternative camera framing or scene action that preserves the documented appearance.

Reference fidelity takes absolute priority over cinematic creativity, camera movement, scene variety, and visual enhancement.

Never fabricate visual information about the product.`;

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
REGRA GLOBAL CRÍTICA DE FIDELIDADE VISUAL AO PRODUTO — PROIBIÇÃO ABSOLUTA DE INVENÇÃO (TIKTOK SHOP COMPLIANCE):
1. Use as fotos reais de referência anexadas como a ÚNICA fonte autorizada para determinar a aparência física do produto.
2. NÃO INVENTAR PARTES NÃO MOSTRADAS: Nunca invente, reconstrua ou deduza a parte traseira, laterais, parte inferior, botões, conexões, acabamentos, texturas, estampas ou características que não estejam claramente documentadas nas fotos de referência.
3. RESTRIÇÃO PARA PRODUTOS EMBALADOS / PACOTES LACRADOS: Se o usuário anexou apenas imagens de uma embalagem fechada, pacote lacrado ou caixa (exemplo: pacotes de fraldas fechados, caixas de bombons, embalagens de cosméticos, caixas de eletrônicos ou kits fechados), é TERMINANTEMENTE PROIBIDO abrir a embalagem, rasgar o pacote ou desenhar o produto solto por dentro. Em TODOS os quadros, represente e mostre a EMBALAGEM FECHADA exatamente como nas fotos reais!
4. RESTRIÇÃO DE ÂNGULO: Se o produto foi fotografado apenas de frente, mantenha-o rigorosamente de frente. Não gere perspectivas que exponham superfícies desconhecidas.
5. A variedade criativa deve vir do cenário, iluminação, composição e ator/apresentador, e JAMAIS da alteração ou invenção física do produto!
========================`;
}

/**
 * Detecta se o produto e um item vendido em pacote/embalagem fechada (ex.: fraldas, lencos, caixas, combos).
 */
export function isPackagedProductOnly(productName: string, productInfo?: string): boolean {
  const combined = `${productName || ''} ${productInfo || ''}`.toLowerCase();
  return (
    /\b(fralda|fraldas|babysec|pampers|huggies|cremer|mamy|len[çc]o|len[çc]os|toalha|toalhinhas?|absorvente|absorventes)\b/i.test(combined) ||
    /\b(pacote|pacotes|combo de pacotes|fardo|fardos|embalagem fechada|embalagem lacrada|caixa fechada|pote lacrado)\b/i.test(combined)
  );
}

/**
 * Sanitiza descricoes de cenas para impedir qualquer comando de abrir caixas,
 * rasgar embalagens ou inventar itens internos soltos quando nao documentados.
 */
export function sanitizeSceneFidelityAction(action: string, productName?: string, isPackaged?: boolean): string {
  if (!action) return action;

  const packaged = isPackaged ?? (productName ? isPackagedProductOnly(productName) : false);

  let clean = action
    // Abertura de embalagens
    .replace(/\b(?:abrindo|rasgando|deslacrando)\s+(?:o|a|os|as|um|uma)?\s*(?:pacote|embalagem|caixa|fralda|sacola|pl[aá]stico|lacre)[^,.;]*/gi, 'segurando o pacote fechado de frente com clareza')
    .replace(/\b(?:tirando|retirando|puxando|sacando)\s+(?:o|a|os|as|uma?)\s*(?:fralda|unidade|item|conte[uú]do|produto)[^,.;]*/gi, 'posicionando e exibindo os pacotes fechados')
    .replace(/\b(?:desdobrando|esticando|abrindo)\s+(?:a|o)?\s*(?:fralda|produto|item)[^,.;]*/gi, 'apresentando a embalagem fechada de frente')
    // Itens soltos nao documentados
    .replace(/\bfraldas?\s+(?:abertas?|soltas?|desdobradas?|fora do pacote)[^,.;]*/gi, 'pacote fechado de fraldas')
    .replace(/\b(?:com\s+)?estampa\s+(?:d[aeo]|divertida|infantil|colorida)?\s*(?:galinha\s*pintadinha|desenho|personagem)?[^,.;]*/gi, 'arte e logomarca oficiais impressas na própria embalagem de referência')
    // Textura interna e toques em pecas internas
    .replace(/\b(?:tocando|passando a m[aã]o|sentindo)\s+(?:a\s+)?(?:textura|maciez|toque)\s*(?:d[aeo]\s*(?:fralda|algod[aã]o|tecido interno|gel))?[^,.;]*/gi, 'dedo apontando para as especificações e selo de qualidade impressos na frente da embalagem fechada')
    .replace(/\bdedo\s+pressionando\s+(?:a\s+)?(?:fralda|superf[ií]cie interna|algod[aã]o)[^,.;]*/gi, 'mão segurando com firmeza o pacote fechado')
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

  if (packaged) {
    // Para produtos estritamente embalados (fraldas, etc), reforca que tudo e o pacote fechado
    clean = clean
      .replace(/\bfralda\b(?!\s+(?:babysec|pampers|huggies|fechada))/gi, 'pacote de fraldas')
      .replace(/\bfraldas\b(?!\s+(?:babysec|pampers|huggies|fechadas))/gi, 'pacotes de fraldas');
  }

  return clean;
}

/**
 * Sanitiza todas as cenas de uma lista para blindar contra invencoes visuais de produtos embalados.
 */
export function sanitizeAllScenesForFidelity<T extends { action: string; storyboardDescription?: string; framing?: string }>(
  scenes: T[],
  productName: string,
  productInfo?: string
): T[] {
  if (!Array.isArray(scenes)) return scenes;
  const isPackaged = isPackagedProductOnly(productName, productInfo);

  return scenes.map((sc) => {
    const cleanAction = sanitizeSceneFidelityAction(sc.action, productName, isPackaged);
    const cleanFraming = (sc.framing || '').trim();
    const updatedDesc = cleanFraming ? `${cleanFraming}. ${cleanAction}` : cleanAction;
    return {
      ...sc,
      action: cleanAction,
      storyboardDescription: updatedDesc,
    };
  });
}

/**
 * Higieniza o texto bruto do prompt do storyboard antes de enviar para os motores de imagem (OpenAI/Gemini).
 */
export function sanitizeStoryboardPromptForFidelity(prompt: string, productName?: string, productInfo?: string): string {
  if (!prompt || typeof prompt !== 'string') return prompt || '';
  const isPackaged = isPackagedProductOnly(productName || '', productInfo);
  if (!isPackaged) return prompt;

  return prompt
    .replace(/\b(?:abrindo|rasgando|deslacrando)\s+(?:o|a|os|as|um|uma)?\s*(?:pacote|embalagem|caixa|fralda)[^,.;\n]*/gi, 'segurando o pacote fechado de frente')
    .replace(/\b(?:tirando|retirando|puxando)\s+(?:o|a|os|as|uma?)\s*(?:fralda|unidade|item)[^,.;\n]*/gi, 'exibindo os pacotes fechados de frente')
    .replace(/\b(?:desdobrando|esticando)\s+(?:a|o)?\s*fralda[^,.;\n]*/gi, 'apresentando o pacote fechado')
    .replace(/\bfraldas?\s+(?:abertas?|soltas?|desdobradas?|fora do pacote)[^,.;\n]*/gi, 'pacote fechado de fraldas')
    .replace(/\b(?:jogando|despejando|derramando)\s+[aá]gua[^,.;\n]*/gi, 'destacando os pacotes fechados')
    .replace(/\bcopo d'?\s*[aá]gua[^,.;\n]*/gi, 'pacote fechado de fraldas')
    .replace(/\bteste de absor[çc][aã]o[^,.;\n]*/gi, 'destaque dos pacotes fechados')
    .replace(/\bindicador de umidade[^,.;\n]*/gi, 'pacotes fechados organizados na bancada')
    .replace(/\btocando a textura da fralda[^,.;\n]*/gi, 'apontando para o selo oficial impresso na embalagem fechada');
}

