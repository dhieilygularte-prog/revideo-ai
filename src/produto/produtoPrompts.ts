import { ProdutoFormState } from './types';

export function getScenarioDescription(scenario: string): string {
  switch (scenario) {
    case 'casa':
      return 'ambiente residencial acolhedor de uma casa brasileira real, organizado e com iluminação natural suave';
    case 'ar_livre':
      return 'ambiente externo bem iluminado e natural (parque, calçada ou quintal brasileiro simples)';
    case 'estudio_neutro':
      return 'cenário neutro e limpo com iluminação de estúdio suave, sem poluição visual';
    case 'tipico':
    default:
      return 'cenário típico e natural de uso cotidiano deste produto, funcional e autêntico';
  }
}

export function buildProdutoImagePrompt(params: {
  productName: string;
  productInfo: string;
  gender: 'Mulher' | 'Homem' | null;
  framing: string;
  scenario: string;
  imageRole: string;
  additionalInstructions?: string;
}): string {
  const {
    productName,
    productInfo,
    gender,
    framing,
    scenario,
    imageRole,
    additionalInstructions,
  } = params;

  const scenarioDesc = getScenarioDescription(scenario);

  let pessoaDesc = '';
  if (framing === 'apenas_produto') {
    pessoaDesc = 'foco total e exclusivo no produto, sem pessoas visíveis no quadro.';
  } else if (framing === 'sem_rosto') {
    if (gender === 'Homem') {
      pessoaDesc = 'homem brasileiro com enquadramento do pescoço para baixo (mãos e corpo, NUNCA MOSTRAR O ROSTO OU A CABEÇA), segurando e apresentando o produto.';
    } else if (gender === 'Mulher') {
      pessoaDesc = 'mulher brasileira com enquadramento do pescoço para baixo (mãos e corpo, NUNCA MOSTRAR O ROSTO OU A CABEÇA), segurando e apresentando o produto.';
    } else {
      pessoaDesc = 'mãos e tronco de pessoa brasileira demonstrando o produto em visão POV / pescoço para baixo (NUNCA MOSTRAR O ROSTO).';
    }
  } else {
    // com_rosto
    pessoaDesc = `${gender === 'Homem' ? 'homem' : 'mulher'} brasileiro(a) com expressão simpática e natural, demonstrando o produto com autenticidade.`;
  }

  const instructionsBlock = additionalInstructions ? `\nINSTRUÇÕES ADICIONAIS: ${additionalInstructions}` : '';

  return `Fotografia vertical 9:16 de alta definição estilo celular para e-commerce e TikTok Shop.
PRODUTO PRINCIPAL: "${productName}".
DETALHES DO PRODUTO: ${productInfo || 'Produto comercial autêntico exatamente como descrito'}.
PAPEL DA IMAGEM: ${imageRole}.
SUJEITO E APRESENTAÇÃO: ${pessoaDesc}
CENÁRIO: ${scenarioDesc}.

REGRAS ABSOLUTAS:
1. FIDELIDADE 1:1 ao produto real: reproduzir forma, cores, rótulos, texturas e materiais com máxima fidelidade.
2. ZERO TATUAGENS: Se houver mãos, braços ou corpo visíveis, pele 100% limpa, sem qualquer tatuagem.
3. SEM BARRIGA DE FORA: Corpo totalmente composto e bem vestido, zero exposição de abdômen ou umbigo.
4. NUNCA MOSTRAR ROSTO se o enquadramento for sem rosto.
5. Sem textos ou logos digitais na imagem.${instructionsBlock}`;
}

export function buildProdutoVeoPrompt(params: {
  sceneNumber: number;
  totalScenes: number;
  productName: string;
  productInfo: string;
  durationSeconds: number;
  speechText: string;
  framing: string;
  scenario: string;
  refImagesCount?: number;
}): string {
  const {
    sceneNumber,
    totalScenes,
    productName,
    productInfo,
    durationSeconds,
    speechText,
    framing,
    scenario,
    refImagesCount = 3,
  } = params;

  const durationWord = durationSeconds === 10 ? 'ten-second' : 'eight-second';
  const scenarioDesc = getScenarioDescription(scenario);

  let timeline = '';
  if (totalScenes === 1) {
    if (refImagesCount === 1) {
      timeline = `0.0–3.0 seconds (HOOK): Engaging visual introduction presenting ${productName} in action to immediately catch viewer attention.
3.0–7.0 seconds (BENEFIT): Clear functional demonstration showing practicality (${productInfo.slice(0, 80) || 'ease of use and premium feel'}).
7.0–${durationSeconds}.0 seconds (CALL TO ACTION): Final clear product highlight directing to the shopping cart.`;
    } else if (refImagesCount === 2) {
      timeline = `0.0–3.0 seconds (HOOK): Dynamic opening with Reference 1 presenting ${productName} in motion.
3.0–7.0 seconds (DEMONSTRATION): Cut to Reference 2 perspective showing detail and real-life functionality.
7.0–${durationSeconds}.0 seconds (CTA): Final dynamic framing with compelling commercial call to action.`;
    } else {
      timeline = `0.0–2.5 seconds (HOOK): Engaging visual opening with Reference 1 presenting ${productName} in action.
2.5–6.5 seconds (DEMONSTRATION): Quick clean cuts across Reference 2 and Reference 3 highlighting versatility and quality.
6.5–${durationSeconds}.0 seconds (CALL TO ACTION): Full product presentation encouraging immediate purchase.`;
    }
  } else {
    timeline = `0.0–4.0 seconds: Seamless demonstration of ${productName} focusing on functional benefits in ${scenarioDesc}.
4.0–${durationSeconds}.0 seconds: Dynamic action highlighting quality and practical everyday appeal.`;
  }

  const framingRule = framing === 'sem_rosto'
    ? 'Strictly neck-down POV / hands holding and using the product. The model face is NOT visible.'
    : framing === 'apenas_produto'
    ? 'Product-only close-up showcase, zero visible persons.'
    : 'Natural Brazilian talent demonstrating the product.';

  return `Create a ${durationWord} vertical 9:16 commercial TikTok Shop product video for "${productName}".

TIMELINE AND ACTION PROGRESSION (Scene ${sceneNumber} of ${totalScenes}):
${timeline}

FRAMING & ENVIRONMENT:
Framing: ${framingRule}.
Setting: ${scenarioDesc}.
Authentic handheld mobile camera motion with organic breathing sway and clean natural lighting.

PRODUCT FIDELITY & REALISM:
100% faithful to the authentic product specifications: ${productInfo || productName}.
Natural physics, realistic material reflections, and crisp texture.

AUDIO & SPOKEN DIALOGUE (SCENE ${sceneNumber}):
"${speechText || 'Garanta o seu com desconto exclusivo no carrinho abaixo!'}"

NEGATIVE CONSTRAINTS:
Zero on-screen text overlays, zero subtitles, zero fake badges, zero digital logos, zero tattoos.`;
}
