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
 * Sanitiza descricoes de cenas para impedir qualquer comando de abrir caixas,
 * rasgar embalagens ou inventar itens internos soltos quando nao documentados.
 */
export function sanitizeSceneFidelityAction(action: string): string {
  if (!action) return action;
  return action
    .replace(/\babrindo a caixa\b/gi, 'segurando a embalagem fechada')
    .replace(/\babrindo o pacote\b/gi, 'segurando o pacote fechado')
    .replace(/\brasgando o pacote\b/gi, 'apoiando o pacote')
    .replace(/\btirando da caixa\b/gi, 'destacando a embalagem')
    .replace(/\brevelando a fralda solta\b/gi, 'destacando o pacote fechado')
    .replace(/\bmostrando a parte traseira\b/gi, 'mostrando a frente documentada')
    .replace(/\bmostrando o verso\b/gi, 'mostrando a frente')
    .trim();
}
