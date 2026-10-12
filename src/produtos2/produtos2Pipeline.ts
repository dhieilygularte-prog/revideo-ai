import {
  Produtos2FormState,
  Produtos2ResultState,
  Produtos2SceneItem,
  Produtos2VisualMapItem,
} from './types';
import {
  analyzeProductInfoForProdutos2,
  applyGenderAndVocativeRules,
  enforceMaxChars,
  selectAndAdaptProdutos2Copy,
} from './produtos2CopyBank';
import {
  buildDefaultProdutos2Plan,
  buildProdutos2StoryboardImagePrompt,
  buildProdutos2VeoPrompt,
  getNineSceneTimings,
} from './produtos2Prompts';

export async function runProdutos2Pipeline(params: {
  form: Produtos2FormState;
  aiProfile?: string;
  onProgress?: (percent: number, message: string) => void;
}): Promise<Produtos2ResultState> {
  const { form, aiProfile = 'openai', onProgress } = params;

  onProgress?.(8, '1/5 Identificando produto, nicho e especificações...');

  // 1. Analisar produto e nicho
  const specs = analyzeProductInfoForProdutos2(`${form.productName} ${form.productInfo}`);
  const finalProductName = (form.productName.trim() || specs.shortName || 'Produto').trim();
  const detectedNiche = form.detectedNiche || specs.niche || 'Produtos Gerais';

  onProgress?.(18, '2/5 Sorteando e adaptando copy validada do banco...');

  // 2 & 3 & 4. Escolher copy do banco (sorteio aleatório uniforme), adaptar com o mínimo de mudanças e ajustar à duração
  const copySelection = selectAndAdaptProdutos2Copy({
    subMode: form.subMode,
    maleSubOption: form.maleSubOption,
    productName: finalProductName,
    productInfo: form.productInfo,
    duration: form.duration,
    customCopy: form.customCopy,
    clientGender: form.clientGender,
    influencer: form.influencer,
  });

  let finalCopy = copySelection.finalCopy;
  const resolvedInfluencer = copySelection.resolvedInfluencer;

  // Coletar todas as fotos anexadas nas variações
  const allPhotos: string[] = [];
  const variationNames: string[] = [];
  (form.variations || []).forEach((v) => {
    if (v.photos && v.photos.length > 0) {
      if (v.name?.trim()) variationNames.push(v.name.trim());
      v.photos.forEach((p) => {
        if (p && !allPhotos.includes(p)) allPhotos.push(p);
      });
    }
  });

  onProgress?.(32, '3/5 Construindo Mapa Visual da Copy, Product Lock e 9 Micro-Cenas...');

  // 5, 6 & 7. Planejamento Inicial Determinístico (garantia de estrutura e fallback)
  const fallbackPlan = buildDefaultProdutos2Plan({
    productName: finalProductName,
    productInfo: form.productInfo,
    niche: detectedNiche,
    subMode: form.subMode,
    maleSubOption: form.maleSubOption,
    maleClothStyle: form.maleClothStyle,
    finalCopy,
    duration: form.duration,
    influencerResolved: resolvedInfluencer,
    clientGender: form.clientGender,
    framing: form.framing,
    scenario: form.scenario,
    additionalInstructions: form.additionalInstructions,
    variationNames,
  });

  let productLock = fallbackPlan.productLock;
  let avatarDescription = fallbackPlan.avatarDescription;
  let scenarioDescription = fallbackPlan.scenarioDescription;
  let visualMap: Produtos2VisualMapItem[] = fallbackPlan.visualMap;
  let scenes: Produtos2SceneItem[] = fallbackPlan.scenes;

  // Refinamento Inteligente via IA (/api/produtos2-planning) analisando as fotos reais e a copy
  try {
    const planRes = await fetch('/api/produtos2-planning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: finalProductName,
        productInfo: form.productInfo,
        niche: detectedNiche,
        subMode: form.subMode,
        maleSubOption: form.maleSubOption,
        maleClothStyle: form.maleClothStyle,
        baseCopy: finalCopy,
        isCustomCopy: Boolean(form.customCopy && form.customCopy.trim()),
        duration: form.duration,
        influencer: resolvedInfluencer,
        clientGender: form.clientGender,
        speechMode: form.speechMode,
        framing: form.framing,
        scenario: form.scenario,
        additionalInstructions: form.additionalInstructions,
        productPhotosBase64: allPhotos.slice(0, 4),
        aiProfile,
      }),
    });

    if (planRes.ok) {
      const planJson = await planRes.json();
      if (planJson.success && planJson.data) {
        const d = planJson.data;

        // Se a IA adaptou a copy (e não era customCopy), validamos regras de vocativo e tamanho
        if (!form.customCopy?.trim() && typeof d.adaptedCopy === 'string' && d.adaptedCopy.trim().length > 30) {
          let aiCopy = applyGenderAndVocativeRules(d.adaptedCopy.trim(), form.clientGender, resolvedInfluencer);
          if (form.duration === 8 && aiCopy.length > 199) {
            aiCopy = enforceMaxChars(aiCopy, 199);
          } else if (form.duration === 10 && copySelection.copyId.startsWith('NOVA-') && aiCopy.length > 259) {
            aiCopy = enforceMaxChars(aiCopy, 259);
          }
          finalCopy = aiCopy;
        }

        if (Array.isArray(d.productLock) && d.productLock.length >= 2) {
          productLock = d.productLock.map((s: any) => String(s).trim()).filter(Boolean);
        }
        if (typeof d.avatarDescription === 'string' && d.avatarDescription.trim().length > 10) {
          avatarDescription = d.avatarDescription.trim();
        }
        if (typeof d.scenarioDescription === 'string' && d.scenarioDescription.trim().length > 5) {
          scenarioDescription = d.scenarioDescription.trim();
        }
        if (Array.isArray(d.visualMap) && d.visualMap.length >= 2) {
          visualMap = d.visualMap.map((m: any) => ({
            excerpt: String(m.excerpt || ''),
            intent: String(m.intent || ''),
            visualProof: String(m.visualProof || ''),
            scenes: String(m.scenes || ''),
          }));
        }
        if (Array.isArray(d.scenes) && d.scenes.length === 9) {
          const defaultTimings = getNineSceneTimings(form.duration);
          scenes = d.scenes.map((sc: any, idx: number) => ({
            number: idx + 1,
            startTime: String(sc.startTime || defaultTimings[idx].start),
            endTime: String(sc.endTime || defaultTimings[idx].end),
            framing: String(sc.framing || fallbackPlan.scenes[idx].framing),
            action: String(sc.action || fallbackPlan.scenes[idx].action),
            cameraMovement: String(sc.cameraMovement || fallbackPlan.scenes[idx].cameraMovement),
            storyboardDescription: String(
              sc.storyboardDescription || `${sc.framing || ''}: ${sc.action || ''}`
            ),
          }));
        }
      }
    }
  } catch (planErr) {
    console.warn('Usando planejamento determinístico Copy-First:', planErr);
  }

  // Checklist Seção 10: garantir limite de caracteres e vocativo antes do storyboard
  finalCopy = applyGenderAndVocativeRules(finalCopy, form.clientGender, resolvedInfluencer);
  if (form.duration === 8 && finalCopy.length > 199) {
    finalCopy = enforceMaxChars(finalCopy, 199);
  }

  // Garantir que a última cena termine exatamente em 10.0 ou 8.0
  if (scenes.length === 9) {
    scenes[0].startTime = '0.0';
    scenes[8].endTime = form.duration === 8 ? '8.0' : '10.0';
  }

  // 8. Construir prompt do Storyboard 1080x1920 (Seção 7.6)
  const storyboardPrompt = buildProdutos2StoryboardImagePrompt({
    productName: finalProductName,
    productLock,
    finalCopy,
    visualMap,
    avatarDescription,
    framing: form.framing,
    scenarioDescription,
    scenes,
    additionalInstructions: form.additionalInstructions,
  });

  // 9. Construir prompt completo do Veo 3 (Seção 8.1 e 8.2)
  const veoPrompt = buildProdutos2VeoPrompt({
    productName: finalProductName,
    duration: form.duration,
    speechMode: form.speechMode,
    finalCopy,
    influencerResolved: resolvedInfluencer,
    framing: form.framing,
    productLock,
    avatarDescription,
    scenarioDescription,
    scenes,
    additionalInstructions: form.additionalInstructions,
  });

  onProgress?.(60, '4/5 Gerando imagem do Storyboard 3x3 (9 cenas numeradas 1080x1920)...');

  // Gerar a imagem única do Storyboard (1080x1920)
  let storyboardImageUrl: string | undefined;
  let storyboardError: string | undefined;

  try {
    const imgRes = await fetch('/api/produtos2-generate-storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: storyboardPrompt,
        productName: finalProductName,
        productPhotosBase64: allPhotos,
        additionalInstructions: form.additionalInstructions,
        aiProfile,
      }),
    });
    const imgData = await imgRes.json();
    if (imgData.success && imgData.imageUrl) {
      storyboardImageUrl = imgData.imageUrl;
    } else {
      storyboardError = imgData.error || 'Não foi possível gerar a imagem do storyboard.';
    }
  } catch (err: any) {
    storyboardError = err?.message || 'Erro de conexão ao gerar o storyboard.';
  }

  onProgress?.(100, '5/5 Storyboard e Prompt do Veo 3 concluídos!');

  return {
    productName: finalProductName,
    detectedNiche,
    subMode: form.subMode,
    maleSubOption: form.maleSubOption,
    duration: form.duration,
    speechMode: form.speechMode,
    framing: form.framing,
    scenario: form.scenario,
    influencerResolved: resolvedInfluencer,
    clientGender: form.clientGender,
    finalCopy,
    copySourceLabel: copySelection.copySourceLabel,
    copyId: copySelection.copyId,
    productLock,
    avatarDescription,
    scenarioDescription,
    visualMap,
    scenes,
    storyboardPrompt,
    storyboardImageUrl,
    storyboardError,
    veoPrompt,
  };
}

/**
 * Permite refazer apenas a imagem do storyboard mantendo ou ajustando instruções
 */
export async function regenerateProdutos2Storyboard(params: {
  result: Produtos2ResultState;
  form: Produtos2FormState;
  aiProfile?: string;
}): Promise<{ imageUrl?: string; error?: string }> {
  const { result, form, aiProfile = 'openai' } = params;
  const allPhotos: string[] = [];
  (form.variations || []).forEach((v) => {
    (v.photos || []).forEach((p) => {
      if (p && !allPhotos.includes(p)) allPhotos.push(p);
    });
  });

  try {
    const imgRes = await fetch('/api/produtos2-generate-storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: result.storyboardPrompt,
        productName: result.productName,
        productPhotosBase64: allPhotos,
        additionalInstructions: form.additionalInstructions,
        aiProfile,
      }),
    });
    const imgData = await imgRes.json();
    if (imgData.success && imgData.imageUrl) {
      return { imageUrl: imgData.imageUrl };
    }
    return { error: imgData.error || 'Falha ao regenerar storyboard.' };
  } catch (err: any) {
    return { error: err?.message || 'Erro de conexão.' };
  }
}
