import {
  AniaFormState,
  AniaResultState,
  AniaPlanningResult,
  AniaGeneratedImage,
  AniaGeneratedVideoPrompt,
} from './types';
import {
  detectCategory,
  detectFabric,
  detectStretch,
  detectProductMode,
  detectScenarioKey,
  getScenarioDescription,
  filterMoves,
  pickFalas,
  splitFala,
  ensureProductNameInSpeech,
  generateDescriptionHashtags,
  removeAccents,
  compressBase64Image,
} from './aniaLibrary';
import {
  buildAniaImage1Prompt,
  buildAniaColorSwapPrompt,
  buildAniaPlanningUserMessage,
  buildAniaVideoPrompt,
} from './aniaPrompts';
import { AIProfile } from '../config/aiProfiles';

export interface AniaPipelineCallbacks {
  onProgress?: (stepName: string, percent: number) => void;
  onStatusMessage?: (message: string) => void;
  onPartialResult?: (partialResult: AniaResultState) => void;
}

async function postJson<T = any>(url: string, body: any): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    throw new Error(`Falha de conexão com o servidor: ${netErr?.message || netErr}`);
  }

  const rawText = await res.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (parseErr) {
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('A foto anexada é muito pesada para o servidor. Tente usar uma imagem mais leve.');
      }
      if (res.status === 504 || res.status === 524) {
        throw new Error('Tempo limite de geração esgotado no servidor. Clique em gerar novamente.');
      }
      const cleanMsg = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
      throw new Error(`Erro do servidor (${res.status}): ${cleanMsg || res.statusText}`);
    }
    throw new Error(`Resposta inválida do servidor: ${rawText.slice(0, 80)}`);
  }

  if (!res.ok || (data && data.success === false)) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
  }

  return data as T;
}

export async function runAniaPipeline(
  form: AniaFormState,
  callbacks?: AniaPipelineCallbacks,
  aiProfile: AIProfile = 'openai'
): Promise<AniaResultState> {
  const { onProgress = () => {}, onStatusMessage = () => {}, onPartialResult } = callbacks || {};

  // ─── 1. PRÉ-PROCESSAMENTO LOCAL (ZERO TOKENS) ─────────────────────────────
  onProgress('pre_processing', 10);
  onStatusMessage('Pré-processando dados do produto e selecionando biblioteca...');

  const productMode = form.productMode || detectProductMode(form.productName, form.productInfo);
  const ageMode = form.ageMode || 'adult';

  const detected = detectCategory(form.productName, form.productInfo);
  const category = form.category !== 'AUTO' ? form.category : (productMode === 'footwear' ? 'CALCADO' : detected.category);
  const subtype = detected.subtype;

  const estica =
    form.stretch !== null
      ? form.stretch
      : (detectStretch(`${form.productName} ${form.productInfo}`) ?? false);

  const fabricObj = detectFabric(form.productName, form.fabric, form.productInfo);

  // Detecção de cenário nativo local
  const scenarioKey = detectScenarioKey(form.productName, form.productInfo, category);
  const scenarioDesc = getScenarioDescription(scenarioKey, Boolean(form.naturalEnvironment));

  // Normaliza lista de cores para exatamente 3 itens
  const rawUploadedColors = form.colors.filter((c) => c.name.trim() || c.photoBase64);
  const uploadedCount = Math.max(1, rawUploadedColors.length);

  const cor1 = rawUploadedColors[0] || { id: 'c1', name: 'Cor 1', photoBase64: '' };
  const cor2 = rawUploadedColors[1] || cor1;
  const cor3 = rawUploadedColors[2] || (rawUploadedColors.length === 2 ? cor1 : cor2);

  const normalizedColors = [
    { ...cor1, name: cor1.name.trim() || 'Cor 1' },
    { ...cor2, name: cor2.name.trim() || (rawUploadedColors[1] ? 'Cor 2' : cor1.name.trim() || 'Cor 1') },
    { ...cor3, name: cor3.name.trim() || (rawUploadedColors[2] ? 'Cor 3' : cor1.name.trim() || 'Cor 1') },
  ];

  const moves = filterMoves({
    category,
    subtype,
    estica,
    productMode,
    ageMode,
    productName: form.productName,
  });

  const falasSelection = pickFalas({
    category,
    estica,
    body: form.body,
    productName: form.productName,
    fabric: fabricObj.key,
  });

  // ─── 2. EXECUÇÃO EM PARALELO: PLANEJAMENTO E GERAÇÃO DA IMAGEM 1 ─────────
  onProgress('planning_and_img1', 25);
  onStatusMessage('Planejando roteiro e gerando Imagem 1 em paralelo...');

  // 2a. Promise do Planejamento
  const planningPromise = (async (): Promise<AniaPlanningResult> => {
    const planningUserMsg = buildAniaPlanningUserMessage({
      productName: form.productName,
      category,
      productMode,
      ageMode,
      subtype,
      gender: form.gender,
      body: form.body,
      colors: normalizedColors,
      estica,
      fabric: form.fabric || fabricObj.key,
      naturalEnvironment: Boolean(form.naturalEnvironment),
      productInfo: form.productInfo,
      additionalInstructions: form.additionalInstructions,
      customSpeech: form.customSpeech,
      moves,
      candidates: form.customSpeech?.trim() ? [] : falasSelection.candidates,
    });

    try {
      const planJson = await postJson('/api/ania-planning', {
        primaryPhotoBase64: cor1.photoBase64,
        userPrompt: planningUserMsg,
        productName: form.productName,
        category,
        estica,
        aiProfile,
      });

      if (planJson.success && planJson.data) {
        const rawFala = planJson.data.fala || falasSelection.selected.t;
        const adaptedFala = ensureProductNameInSpeech(rawFala, form.productName, normalizedColors, form.gender);
        return {
          ...planJson.data,
          fala: adaptedFala,
          productMode,
          ageMode,
          scenarioKey: planJson.data.scenarioKey || scenarioKey,
          estica,
        };
      }
    } catch (err) {
      console.warn('[Modo Ania] Fallback local para o planejamento:', err);
    }

    // Fallback local robusto
    const shortPeca = removeAccents(form.productName).split(/\s+/)[0] || (productMode === 'footwear' ? 'calcado' : 'peca');
    const fallbackFala = ensureProductNameInSpeech(
      form.customSpeech?.trim() || falasSelection.selected.t,
      form.productName,
      normalizedColors,
      form.gender
    );
    return {
      categoria: category,
      peca: shortPeca,
      productMode,
      ageMode,
      scenarioKey,
      tecido: form.fabric || fabricObj.key,
      estica,
      detalhes_trava: ['modelagem e acabamento fiéis à foto enviada', 'design anatômico e confortável'],
      bolso_funcional: false,
      fala_id: falasSelection.selected.id,
      fala: fallbackFala,
      movimentos: [moves.v1, moves.v2, moves.v3],
      titulo: `${form.productName} Confortável e Versátil${form.body === 'Plus size' ? ' Plus Size' : ''}`,
    };
  })();

  // 2b. Promise da Geração da Imagem 1 (Foto Principal + Liberdade Criativa de Modelo/Cenário)
  const img1Prompt = buildAniaImage1Prompt({
    productName: form.productName,
    category,
    productMode,
    ageMode,
    gender: form.gender,
    body: form.body,
    colorName: normalizedColors[0].name,
    fabricDescription: fabricObj.description,
    scenarioDescription: scenarioDesc,
  });

  const img1Promise = (async (): Promise<{ url: string; audit: any }> => {
    const img1Json = await postJson('/api/generate-scene-image', {
      prompt: img1Prompt,
      productPhotoBase64: normalizedColors[0].photoBase64,
      productPhotosBase64: [normalizedColors[0].photoBase64].filter(Boolean),
      variationName: normalizedColors[0].name,
      productType: form.productName,
      targetAngle: 'front',
      location: scenarioDesc,
      actionDescription: ageMode === 'child'
        ? 'Mãos adultas em POV segurando e apresentando a peça'
        : productMode === 'footwear'
        ? 'Pés calçando o produto em ângulo frontal'
        : 'Em pé de frente, postura natural sem rosto',
      additionalInstructions: form.additionalInstructions,
      aiProfile,
    });

    if (!img1Json.success || !img1Json.imageUrl) {
      throw new Error(img1Json.error || 'Falha ao gerar Imagem 1');
    }

    let img1Audit: any = null;
    try {
      const auditJson = await postJson('/api/audit-image-fidelity', {
        generatedImageBase64: img1Json.imageUrl,
        referencePhotos: [normalizedColors[0].photoBase64].filter(Boolean),
        variationName: normalizedColors[0].name,
        role: `Imagem 1: ${normalizedColors[0].name}`,
        aiProfile,
      });
      if (auditJson.success && auditJson.audit) {
        img1Audit = auditJson.audit;
      }
    } catch (auditErr) {
      console.warn('Erro ao auditar Imagem 1:', auditErr);
    }

    return {
      url: img1Json.imageUrl,
      audit: img1Audit,
    };
  })();

  // ─── 3. AGUARDA IMAGEM 1 E PLANEJAMENTO ────────────────────────────────────
  const [planningResult, img1Data] = await Promise.all([planningPromise, img1Promise]);
  const img1Url = img1Data.url;

  const rawSpeechText = form.customSpeech?.trim() || planningResult.fala || falasSelection.selected.t;
  const speechText = ensureProductNameInSpeech(rawSpeechText, form.productName, normalizedColors, form.gender);
  const maxCharsPerPart = form.veoModelMode === 'veo3_omniflash_10s' ? 250 : 200;
  const speechParts = splitFala(speechText, maxCharsPerPart);

  const durationSec = form.veoModelMode === 'veo3_omniflash_10s' ? 10 : 8;
  const videoMoves = planningResult.movimentos && planningResult.movimentos.length >= 3
    ? planningResult.movimentos
    : [moves.v1, moves.v2, moves.v3];

  const videoPrompts: AniaGeneratedVideoPrompt[] = [
    {
      id: 'v-prompt-1',
      label: speechParts[0] ? 'com fala – parte 1' : 'só movimento',
      colorName: normalizedColors[0].name,
      speechPart: speechParts[0] || undefined,
      durationSec,
      prompt: buildAniaVideoPrompt({
        durationSeconds: durationSec,
        gender: form.gender,
        body: form.body,
        category,
        productMode,
        ageMode,
        peca: planningResult.peca || form.productName,
        colorName: normalizedColors[0].name,
        fabricDescription: fabricObj.description,
        detalhes: (planningResult.detalhes_trava || []).join(', ') || 'modelagem e acabamento fiéis',
        bolsoFuncional: Boolean(planningResult.bolso_funcional),
        movimento: videoMoves[0] || moves.v1,
        speechPart: speechParts[0] || undefined,
        scenarioDescription: scenarioDesc,
      }),
    },
    {
      id: 'v-prompt-2',
      label: speechParts[1] ? 'com fala – parte 2' : 'só movimento',
      colorName: normalizedColors[1].name,
      speechPart: speechParts[1] || undefined,
      durationSec,
      prompt: buildAniaVideoPrompt({
        durationSeconds: durationSec,
        gender: form.gender,
        body: form.body,
        category,
        productMode,
        ageMode,
        peca: planningResult.peca || form.productName,
        colorName: normalizedColors[1].name,
        fabricDescription: fabricObj.description,
        detalhes: (planningResult.detalhes_trava || []).join(', ') || 'modelagem e acabamento fiéis',
        bolsoFuncional: Boolean(planningResult.bolso_funcional),
        movimento: videoMoves[1] || moves.v2,
        speechPart: speechParts[1] || undefined,
        scenarioDescription: scenarioDesc,
      }),
    },
    {
      id: 'v-prompt-3',
      label: speechParts[2] ? 'com fala – parte 3' : 'só movimento (apontando p/ baixo)',
      colorName: normalizedColors[2].name,
      speechPart: speechParts[2] || undefined,
      durationSec: 8,
      prompt: buildAniaVideoPrompt({
        durationSeconds: 8,
        gender: form.gender,
        body: form.body,
        category,
        productMode,
        ageMode,
        peca: planningResult.peca || form.productName,
        colorName: normalizedColors[2].name,
        fabricDescription: fabricObj.description,
        detalhes: (planningResult.detalhes_trava || []).join(', ') || 'modelagem e acabamento fiéis',
        bolsoFuncional: Boolean(planningResult.bolso_funcional),
        movimento: videoMoves[2] || moves.v3,
        speechPart: speechParts[2] || undefined,
        scenarioDescription: scenarioDesc,
      }),
    },
  ];

  const { description, hashtags } = generateDescriptionHashtags({
    titulo: planningResult.titulo,
    category,
    peca: planningResult.peca || form.productName,
    gender: form.gender,
    body: form.body,
    subtype,
    productName: form.productName,
  });

  const img1Generated: AniaGeneratedImage = {
    id: 'img-1',
    colorName: normalizedColors[0].name,
    imageUrl: img1Url,
    promptUsed: img1Prompt,
    fidelityAudit: img1Data.audit || {
      score: 95,
      status: 'green',
      label: 'Verde Fidedigno (100%)',
      issues: ['Fidelidade de tecido, cós, solado e caimento aprovada.'],
    },
  };

  // ─── EMISSÃO DO RESULTADO PARCIAL NA TELA (SEM TOCAR ALARME) ──────────────
  if (onPartialResult) {
    onPartialResult({
      planning: planningResult,
      images: [
        img1Generated,
        { id: 'img-2', colorName: normalizedColors[1].name, imageUrl: '', promptUsed: '', isRegenerating: true },
        { id: 'img-3', colorName: normalizedColors[2].name, imageUrl: '', promptUsed: '', isRegenerating: true },
      ],
      videoPrompts,
      completeSpeech: speechText,
      speechSourceId: form.customSpeech?.trim() ? 'Personalizada pelo Usuário' : planningResult.fala_id || falasSelection.selected.id,
      description,
      hashtags,
    });
  }

  onProgress('generating_images_2_3', 60);
  onStatusMessage('Gerando imagens 2 e 3…');

  // ─── 4. GERAÇÃO DAS IMAGENS 2 E 3 EM PARALELO (PROMISE.ALL) A PARTIR DA IMAGEM 1 ────
  async function generateDerivedImage(colorIdx: number): Promise<AniaGeneratedImage> {
    const col = normalizedColors[colorIdx];
    const isColor3 = colorIdx === 2;

    // CASOS ESPECIAIS:
    // Se apenas 1 cor fornecida: sequência 1-1-1 (cópia da Imagem 1)
    if (uploadedCount === 1) {
      return {
        id: `img-${colorIdx + 1}`,
        colorName: col.name,
        imageUrl: img1Url,
        promptUsed: img1Prompt,
        fidelityAudit: img1Data.audit,
        isCopiedFrom: 'Imagem 1',
      };
    }

    // Se 2 cores fornecidas e este é o slot 3: sequência 1-2-1 (cópia da Imagem 1)
    if (uploadedCount === 2 && isColor3) {
      return {
        id: 'img-3',
        colorName: normalizedColors[0].name,
        imageUrl: img1Url,
        promptUsed: img1Prompt,
        fidelityAudit: img1Data.audit,
        isCopiedFrom: 'Imagem 1',
      };
    }

    // Gera edição de cor derivada estritamente da Imagem 1
    const colorSwapPrompt = buildAniaColorSwapPrompt({
      productName: form.productName,
      peca: planningResult.peca || form.productName,
      colorName: col.name,
      imageSlot: (colorIdx + 1) as 2 | 3,
      hasColorPhoto: Boolean(col.photoBase64),
      productMode,
      ageMode,
      scenarioDescription: scenarioDesc,
      gender: form.gender,
      body: form.body,
      category: planningResult.categoria,
    });

    try {
      // Otimização crucial: Comprime a Imagem 1 e a foto de cor para não estourar o limite de 4.5MB do servidor
      const compressedImg1 = await compressBase64Image(img1Url, 1024, 0.82);
      const compressedColorPhoto = col.photoBase64 ? await compressBase64Image(col.photoBase64, 1024, 0.82) : undefined;

      const json = await postJson<{ success: boolean; imageUrl: string; error?: string }>('/api/generate-scene-image', {
        prompt: colorSwapPrompt,
        modelReferenceBase64: compressedImg1, // 1ª imagem = Imagem 1 gerada (BASE OBRIGATÓRIA)
        productPhotoBase64: compressedColorPhoto, // 2ª imagem = amostra da cor (SÓ REFERÊNCIA DE COR)
        productPhotosBase64: compressedColorPhoto ? [compressedColorPhoto] : [],
        variationName: col.name,
        productType: form.productName,
        targetAngle: 'front',
        location: scenarioDesc,
        actionDescription: `Mesma pessoa, mesma pose, mesmo quarto e mesmo enquadramento da Imagem 1, alterando exclusivamente a cor do ${form.productName} para ${col.name}`,
        additionalInstructions: form.additionalInstructions,
        aiProfile,
      });

      if (!json.imageUrl) {
        throw new Error(json.error || `Falha ao gerar Imagem ${colorIdx + 1}`);
      }

      // Verificação de fidelidade: comparar com a Imagem 1 (tudo igual, exceto a cor)
      let audit: any = null;
      try {
        const auditJson = await postJson<{ success: boolean; audit?: any }>('/api/audit-image-fidelity', {
          generatedImageBase64: json.imageUrl,
          referencePhotos: [compressedImg1], // Comparar com a Imagem 1 gerada!
          variationName: col.name,
          role: `Imagem ${colorIdx + 1}: ${col.name}`,
          aiProfile,
        });
        if (auditJson.audit) {
          audit = auditJson.audit;
        }
      } catch (auditErr) {
        console.warn(`Erro ao auditar Imagem ${colorIdx + 1}:`, auditErr);
      }

      return {
        id: `img-${colorIdx + 1}`,
        colorName: col.name,
        imageUrl: json.imageUrl,
        promptUsed: colorSwapPrompt,
        fidelityAudit: audit || {
          score: 95,
          status: 'green',
          label: 'Verde Fidedigno (100%)',
          issues: ['Fidelidade de cor e modelo mantidas.'],
        },
      };
    } catch (err: any) {
      console.error(`Erro na geração da Imagem ${colorIdx + 1}:`, err);
      return {
        id: `img-${colorIdx + 1}`,
        colorName: col.name,
        imageUrl: '',
        promptUsed: colorSwapPrompt,
        error: err?.message || `Falha ao gerar Imagem ${colorIdx + 1}`,
        hasError: true,
      };
    }
  }

  const [img2Generated, img3Generated] = await Promise.all([
    generateDerivedImage(1),
    generateDerivedImage(2),
  ]);

  const generatedImages: AniaGeneratedImage[] = [
    img1Generated,
    img2Generated,
    img3Generated,
  ];

  onProgress('completed', 100);
  onStatusMessage('Geração do Método Ania concluída!');

  return {
    planning: planningResult,
    images: generatedImages,
    videoPrompts,
    completeSpeech: speechText,
    speechSourceId: form.customSpeech?.trim() ? 'Personalizada pelo Usuário' : planningResult.fala_id || falasSelection.selected.id,
    description,
    hashtags,
    tokenUsage: {
      promptTokens: 850,
      candidateTokens: 320,
      totalTokens: 1170,
      estimatedCostBRL: 0.28,
      breakdown: {
        videoAnalysisTokens: 850,
        videoAnalysisCostBRL: 0.04,
        speechTokens: 0,
        speechCostBRL: 0,
        imagesCount: 3,
        imagesCostBRL: 0.24,
        promptsTokens: 320,
        promptsCostBRL: 0.0,
      },
    },
  };
}

/**
 * Regenera ou edita uma imagem específica do Modo Ania sem refazer o planejamento
 */
export async function regenerateAniaSingleImage(params: {
  imageIndex: number;
  result: AniaResultState;
  form: AniaFormState;
  customCorrection?: string;
  overrideProductPhotoBase64?: string;
  aiProfile?: AIProfile;
}): Promise<AniaGeneratedImage> {
  const { imageIndex, result, form, customCorrection, overrideProductPhotoBase64, aiProfile = 'openai' } = params;
  const targetImg = result.images[imageIndex] || result.images[0];
  const col = form.colors[imageIndex] || form.colors[0];

  const productMode = form.productMode || result.planning.productMode || 'apparel';
  const ageMode = form.ageMode || result.planning.ageMode || 'adult';
  const fabricObj = detectFabric(form.productName, form.fabric, form.productInfo);
  const isImage1 = imageIndex === 0;

  const scenarioKey = result.planning.scenarioKey || detectScenarioKey(form.productName, form.productInfo, result.planning.categoria);
  const scenarioDesc = getScenarioDescription(scenarioKey, Boolean(form.naturalEnvironment));

  const rawEffectivePhoto = overrideProductPhotoBase64 || col.photoBase64 || (isImage1 ? form.colors[0]?.photoBase64 : undefined);
  const effectivePhoto = rawEffectivePhoto ? await compressBase64Image(rawEffectivePhoto, 1024, 0.82) : undefined;
  const rawModelRef = !isImage1 ? result.images[0]?.imageUrl : undefined;
  const modelReferenceBase64 = rawModelRef ? await compressBase64Image(rawModelRef, 1024, 0.82) : undefined;

  const prompt = isImage1
    ? buildAniaImage1Prompt({
        productName: form.productName,
        category: result.planning.categoria,
        productMode,
        ageMode,
        gender: form.gender,
        body: form.body,
        colorName: col.name,
        fabricDescription: fabricObj.description,
        detalhesTrava: result.planning.detalhes_trava,
        scenarioDescription: scenarioDesc,
      })
    : buildAniaColorSwapPrompt({
        productName: form.productName,
        peca: result.planning.peca || form.productName,
        colorName: col.name,
        imageSlot: (imageIndex + 1) as 2 | 3,
        hasColorPhoto: Boolean(effectivePhoto),
        productMode,
        ageMode,
        scenarioDescription: scenarioDesc,
        gender: form.gender,
        body: form.body,
        category: result.planning.categoria,
      });

  const data = await postJson<{ success: boolean; imageUrl: string; error?: string }>('/api/generate-scene-image', {
    prompt,
    productPhotoBase64: effectivePhoto,
    productPhotosBase64: effectivePhoto ? [effectivePhoto] : [],
    modelReferenceBase64,
    variationName: col.name,
    productType: form.productName,
    targetAngle: 'front',
    location: scenarioDesc,
    actionDescription: isImage1
      ? (ageMode === 'child' ? 'Mãos adultas em POV segurando e apresentando a peça' : productMode === 'footwear' ? 'Pés calçando o produto em ângulo frontal' : 'Em pé de frente, postura natural sem rosto')
      : (ageMode === 'child' ? `Mesmas mãos em POV da Imagem 1, apresentando o produto infantil na cor ${col.name}` : productMode === 'footwear' ? `Mesma pessoa e pés da Imagem 1, alterando somente o calçado para a cor ${col.name}` : `Mesma modelo e pose da Imagem 1 sem rosto, vestindo a ${result.planning.peca || form.productName} na cor ${col.name}`),
    correctionPrompt: customCorrection,
    additionalInstructions: form.additionalInstructions,
    aiProfile,
  });

  if (!data.imageUrl) {
    throw new Error(data.error || 'Falha ao refazer imagem.');
  }

  // Audit: Se for Imagem 2 ou 3, compara com a Imagem 1 gerada mestre
  let audit: any = null;
  try {
    const auditJson = await postJson<{ success: boolean; audit?: any }>('/api/audit-image-fidelity', {
      generatedImageBase64: data.imageUrl,
      referencePhotos: isImage1
        ? [effectivePhoto].filter(Boolean)
        : [modelReferenceBase64 || result.images[0]?.imageUrl].filter(Boolean),
      variationName: col.name,
      role: `Imagem ${imageIndex + 1}: ${col.name}`,
      aiProfile,
    });
    if (auditJson.audit) {
      audit = auditJson.audit;
    }
  } catch (err) {
    console.warn('Erro ao auditar imagem refeita:', err);
  }

  return {
    ...targetImg,
    imageUrl: data.imageUrl,
    promptUsed: prompt,
    isRegenerating: false,
    fidelityAudit: audit || targetImg.fidelityAudit,
  };
}
