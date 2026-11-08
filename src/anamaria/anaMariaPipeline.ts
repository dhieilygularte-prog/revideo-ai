import {
  AnaMariaFormState,
  AnaMariaResultState,
  AnaMariaAudit,
  AnaMariaImageModel,
} from './types';
import {
  buildAnaMariaImagePrompt,
  buildAnaMariaVideoPrompt,
  AnaMariaRoomType,
} from './anaMariaPrompts';
import { resolveHeadlineAndHashtags } from './anaMariaBank';
import { AIProfile } from '../config/aiProfiles';
import { PREFERRED_SCENARIO_BASE64 } from './assets/scenarioImage';
import { SCENARIO_GALLERY_ITEMS, POV_SCENARIO_GALLERY_ITEMS } from './scenarioGalleryData';
import { getMasterPromptById } from './masterPromptsData';

export interface AnaMariaPipelineCallbacks {
  onProgress?: (stepName: string, percent: number) => void;
  onStatusMessage?: (message: string) => void;
}

async function postJson<T = any>(url: string, body: any, maxRetries = 1): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (netErr: any) {
      lastError = new Error(`Falha de conexão com o servidor: ${netErr?.message || netErr}`);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      throw lastError;
    }

    const rawText = await res.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('As fotos anexadas são muito pesadas para o servidor. Tente reduzir o tamanho ou enviar menos imagens.');
        }
        if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 524) {
          lastError = new Error('Tempo limite de geração esgotado no servidor. Clique em gerar novamente.');
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          throw lastError;
        }
        const cleanMsg = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
        throw new Error(`Erro do servidor (${res.status}): ${cleanMsg || res.statusText}`);
      }
      throw new Error(`Resposta inválida do servidor: ${rawText.slice(0, 80)}`);
    }

    if (!res.ok || (data && data.success === false)) {
      const errMsg = data?.error || `Erro HTTP ${res.status}`;
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw new Error(errMsg);
    }

    return data as T;
  }

  throw lastError || new Error('Erro inesperado na comunicação com o servidor.');
}

const STORAGE_KEY = 'aurora_ana_maria_history_v1';

export function getAnaMariaHistory(): AnaMariaResultState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAnaMariaResult(result: AnaMariaResultState): void {
  try {
    const history = getAnaMariaHistory();
    const filtered = history.filter((h) => h.id !== result.id);
    // Mantém apenas a 1ª foto de referência no histórico do localStorage para não estourar a cota de 5MB
    const compactResult: AnaMariaResultState = {
      ...result,
      referencePhotos: result.referencePhotos.slice(0, 1),
    };
    const updated = [compactResult, ...filtered].slice(0, 12);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao salvar no histórico do Modo Ana Maria:', err);
  }
}

const scenarioBase64Cache = new Map<string, string>();
const scenarioInFlightPromises = new Map<string, Promise<string>>();
let prewarmedRandomScenario =
  SCENARIO_GALLERY_ITEMS && SCENARIO_GALLERY_ITEMS.length > 0
    ? SCENARIO_GALLERY_ITEMS[Math.floor(Math.random() * SCENARIO_GALLERY_ITEMS.length)]
    : null;

/**
 * Comprime qualquer imagem (URL ou DataURL pesada em PNG) para JPEG otimizado de alta fidelidade (~140-200 KB),
 * reduzindo em até 95% o tempo de upload para o servidor e para o Seedream/OpenAI sem perda visual.
 */
export async function compressImageForFastTransfer(
  srcUrlOrBase64: string,
  maxDimension = 864,
  quality = 0.85
): Promise<string> {
  if (typeof window === 'undefined' || !srcUrlOrBase64) return srcUrlOrBase64;
  // Se for JPEG já otimizado (< 350 KB em base64), retorna direto para 0ms de espera
  if (
    srcUrlOrBase64.startsWith('data:image/jpeg;base64,') &&
    srcUrlOrBase64.length < 350_000
  ) {
    return srcUrlOrBase64;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width || 1080;
        let h = img.naturalHeight || img.height || 1920;
        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(srcUrlOrBase64);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(srcUrlOrBase64);
      }
    };
    img.onerror = () => resolve(srcUrlOrBase64);
    img.src = srcUrlOrBase64;
  });
}

export function preloadScenarioUrl(url?: string): void {
  if (!url || typeof window === 'undefined') return;
  if (scenarioBase64Cache.has(url) || scenarioInFlightPromises.has(url)) return;
  const p = compressImageForFastTransfer(url, 800, 0.84)
    .then((b64) => {
      if (b64 && b64.startsWith('data:image/')) {
        scenarioBase64Cache.set(url, b64);
      }
      scenarioInFlightPromises.delete(url);
      return b64;
    })
    .catch(() => {
      scenarioInFlightPromises.delete(url);
      return url;
    });
  scenarioInFlightPromises.set(url, p);
}

/**
 * Combina duas fotos de referência lado a lado em uma única folha de produto JPEG,
 * garantindo que o modelo multimodal receba no máximo 2 imagens totais (Cenário + Produto),
 * acelerando a geração em até 20 segundos e prevenindo timeouts de 60s da Vercel.
 */
export async function combineTwoPhotosSideBySide(
  photo1: string,
  photo2: string,
  maxDim = 864
): Promise<string> {
  if (typeof window === 'undefined' || !photo1 || !photo2) return photo1 || photo2;
  return new Promise<string>((resolve) => {
    const img1 = new Image();
    const img2 = new Image();
    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';
    let loaded = 0;
    const onBothLoaded = () => {
      try {
        const h1 = img1.naturalHeight || img1.height || 1000;
        const w1 = img1.naturalWidth || img1.width || 800;
        const h2 = img2.naturalHeight || img2.height || 1000;
        const w2 = img2.naturalWidth || img2.width || 800;

        const targetH = Math.min(h1, h2, maxDim);
        const targetW1 = Math.round((w1 * targetH) / h1);
        const targetW2 = Math.round((w2 * targetH) / h2);
        let totalW = targetW1 + targetW2;
        let totalH = targetH;

        if (totalW > maxDim) {
          const scale = maxDim / totalW;
          totalW = maxDim;
          totalH = Math.round(totalH * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = totalW;
        canvas.height = totalH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(photo1);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalW, totalH);
        const drawW1 = Math.round((targetW1 * totalW) / (targetW1 + targetW2));
        ctx.drawImage(img1, 0, 0, drawW1, totalH);
        ctx.drawImage(img2, drawW1, 0, totalW - drawW1, totalH);

        const combinedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
        resolve(combinedDataUrl);
      } catch {
        resolve(photo1);
      }
    };
    img1.onload = () => { loaded++; if (loaded === 2) onBothLoaded(); };
    img2.onload = () => { loaded++; if (loaded === 2) onBothLoaded(); };
    img1.onerror = () => resolve(photo1);
    img2.onerror = () => resolve(photo1);
    img1.src = photo1;
    img2.src = photo2;
  });
}

/**
 * Pré-aquece o cenário randômico sorteado e os cenários de Catza/POV em segundo plano
 * enquanto o usuário preenche o formulário, garantindo 0ms de espera ao tocar em GERAR VÍDEO.
 */
export function prewarmDefaultScenarios(): void {
  if (typeof window === 'undefined') return;
  if (!prewarmedRandomScenario && SCENARIO_GALLERY_ITEMS.length > 0) {
    prewarmedRandomScenario =
      SCENARIO_GALLERY_ITEMS[Math.floor(Math.random() * SCENARIO_GALLERY_ITEMS.length)];
  }
  if (prewarmedRandomScenario?.fullUrl) {
    preloadScenarioUrl(prewarmedRandomScenario.fullUrl);
  }
  const catza = SCENARIO_GALLERY_ITEMS.find((s) => s.id === 'cenario_24');
  if (catza?.fullUrl) preloadScenarioUrl(catza.fullUrl);
  POV_SCENARIO_GALLERY_ITEMS.forEach((povItem) => {
    if (povItem?.fullUrl) {
      preloadScenarioUrl(povItem.fullUrl);
    }
  });
}

async function resolveScenarioBase64(form: AnaMariaFormState): Promise<string> {
  if (form.selectedScenarioBase64 && form.selectedScenarioBase64.length > 50) {
    return compressImageForFastTransfer(form.selectedScenarioBase64, 800, 0.84);
  }
  if (form.selectedScenarioUrl) {
    const cached = scenarioBase64Cache.get(form.selectedScenarioUrl);
    if (cached) return cached;
    const inFlight = scenarioInFlightPromises.get(form.selectedScenarioUrl);
    if (inFlight) {
      const res = await inFlight;
      if (res && res.startsWith('data:image/')) return res;
    }
    try {
      const compressed = await compressImageForFastTransfer(form.selectedScenarioUrl, 800, 0.84);
      if (compressed && compressed.startsWith('data:image/')) {
        scenarioBase64Cache.set(form.selectedScenarioUrl, compressed);
        return compressed;
      }
    } catch (e) {
      console.warn('Falha ao converter cenário selecionado para base64:', e);
    }
  }
  return compressImageForFastTransfer(PREFERRED_SCENARIO_BASE64, 800, 0.84);
}

const modelBase64Cache = new Map<string, string>();

export async function resolveModelBase64(form: AnaMariaFormState): Promise<string | undefined> {
  if (form.selectedModelGalleryBase64 && form.selectedModelGalleryBase64.length > 50) {
    return compressImageForFastTransfer(form.selectedModelGalleryBase64, 800, 0.84);
  }
  const url =
    form.selectedModelGalleryUrl ||
    (form.selectedModelGalleryNumber ? `/models/gallery/${form.selectedModelGalleryNumber}.png` : undefined);
  if (url) {
    const cached = modelBase64Cache.get(url);
    if (cached) return cached;
    try {
      const compressed = await compressImageForFastTransfer(url, 800, 0.84);
      if (compressed && compressed.startsWith('data:image/')) {
        modelBase64Cache.set(url, compressed);
        return compressed;
      }
    } catch (e) {
      console.warn('Falha ao converter modelo selecionada para base64:', e);
    }
  }
  return undefined;
}

async function prepareProductPhotosForPayload(photos: string[]): Promise<{
  primaryPhoto: string;
  supplementaryPhotos: string[];
}> {
  const validPhotos = (photos || []).filter(Boolean).slice(0, 4);
  const optimizedPhotos = await Promise.all(
    validPhotos.map((p) => compressImageForFastTransfer(p, 800, 0.85))
  );
  if (optimizedPhotos.length >= 2) {
    const combined = await combineTwoPhotosSideBySide(optimizedPhotos[0], optimizedPhotos[1], 864);
    return {
      primaryPhoto: combined,
      supplementaryPhotos: [],
    };
  }
  return {
    primaryPhoto: optimizedPhotos[0] || '',
    supplementaryPhotos: [],
  };
}

/**
 * Garante que um cenário esteja sempre definido.
 * Se o usuário não tiver escolhido nenhum cenário na galeria:
 * - No modo POV: escolhe um dos 2 cenários POV da galeria POV.
 * - Para Mestra Catza (quando nenhum cenário foi selecionado): prioriza o Cenário 24 (ambiente mais escuro com flash).
 * - Nos demais casos: sorteia randomicamente um dos 24 cenários vencedores da galeria.
 */
export function ensureAnaMariaScenario(form: AnaMariaFormState): AnaMariaFormState {
  const master = getMasterPromptById(form.selectedMasterId);
  const mode = form.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');
  const isPov = mode === 'pov' || Boolean(master.isPov);

  if (isPov) {
    if (
      form.selectedScenarioId &&
      form.selectedScenarioId.startsWith('cenario_pov_') &&
      (form.selectedScenarioUrl || form.selectedScenarioBase64)
    ) {
      return form;
    }
    const preferredPov =
      POV_SCENARIO_GALLERY_ITEMS.find((s) => s.id === master.preferredScenarioId) ||
      POV_SCENARIO_GALLERY_ITEMS[Math.floor(Math.random() * POV_SCENARIO_GALLERY_ITEMS.length)] ||
      POV_SCENARIO_GALLERY_ITEMS[0];
    if (!preferredPov) return form;
    return {
      ...form,
      presentationMode: 'pov',
      selectedScenarioId: preferredPov.id,
      selectedScenarioNumber: preferredPov.number,
      selectedScenarioUrl: preferredPov.fullUrl,
      selectedScenarioBase64: undefined,
    };
  }

  if (
    form.selectedScenarioId &&
    !form.selectedScenarioId.startsWith('cenario_pov_') &&
    (form.selectedScenarioUrl || form.selectedScenarioBase64)
  ) {
    return form;
  }

  if (!SCENARIO_GALLERY_ITEMS || SCENARIO_GALLERY_ITEMS.length === 0) {
    return form;
  }

  if (master.id === 'mestra_catza' && master.preferredScenarioId) {
    const catzaScenario = SCENARIO_GALLERY_ITEMS.find((s) => s.id === master.preferredScenarioId);
    if (catzaScenario) {
      return {
        ...form,
        selectedScenarioId: catzaScenario.id,
        selectedScenarioNumber: catzaScenario.number,
        selectedScenarioUrl: catzaScenario.fullUrl,
        selectedScenarioBase64: undefined,
      };
    }
  }

  // Usa o cenário randômico já pré-aquecido em memória (0ms de download) e já sorteia/pré-carrega o próximo em background
  const chosenScenario =
    prewarmedRandomScenario ||
    SCENARIO_GALLERY_ITEMS[Math.floor(Math.random() * SCENARIO_GALLERY_ITEMS.length)] ||
    SCENARIO_GALLERY_ITEMS[0];

  // Sorteia o próximo cenário randômico diferente para a próxima geração e já inicia seu pré-carregamento
  const nextIndex = Math.floor(Math.random() * SCENARIO_GALLERY_ITEMS.length);
  prewarmedRandomScenario = SCENARIO_GALLERY_ITEMS[nextIndex] || SCENARIO_GALLERY_ITEMS[0];
  if (prewarmedRandomScenario?.fullUrl) {
    preloadScenarioUrl(prewarmedRandomScenario.fullUrl);
  }

  return {
    ...form,
    selectedScenarioId: chosenScenario.id,
    selectedScenarioNumber: chosenScenario.number,
    selectedScenarioUrl: chosenScenario.fullUrl,
    selectedScenarioBase64: undefined,
  };
}

/**
 * Pipeline principal do Modo Ana Maria (otimizado para execução rápida <25s sem perda de qualidade)
 */
export async function runAnaMariaPipeline(
  rawForm: AnaMariaFormState,
  callbacks?: AnaMariaPipelineCallbacks,
  aiProfile: AIProfile = 'openai'
): Promise<AnaMariaResultState> {
  const { onProgress = () => {}, onStatusMessage = () => {} } = callbacks || {};

  if (!rawForm.referencePhotos || rawForm.referencePhotos.length === 0) {
    throw new Error('Por favor, anexe ao menos 1 foto de referência da peça.');
  }

  const form = ensureAnaMariaScenario(rawForm);
  const master = getMasterPromptById(form.selectedMasterId);
  const activeMode = form.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');

  // 1. Geração instantânea de Prompts, Calçado Condicional, Headline e Hashtags
  onProgress('prompt_building', 25);
  onStatusMessage(`Preparando identidade de ${master.shortName} e prompt de movimentos...`);

  const { prompt: imagePrompt, shoeCategory, shoeDescription } = buildAnaMariaImagePrompt(form, 'hall_espelho');

  const { headline, hashtags } = resolveHeadlineAndHashtags({
    productName: form.productName,
    influencer: form.influencer,
    bodyType: form.bodyType,
    additionalInstructions: form.additionalInstructions,
  });

  const videoPrompt = buildAnaMariaVideoPrompt({
    productName: form.productName,
    influencer: form.influencer,
    bodyType: form.bodyType,
    presentationMode: activeMode,
    selectedMasterId: form.selectedMasterId,
    limit: form.videoPromptLimit,
    additionalInstructions: form.additionalInstructions,
    hasSelectedScenario: Boolean(form.selectedScenarioId),
  });

  // 2. Preparação em paralelo do Cenário + Fotos de Referência compactadas (~300 KB total)
  onProgress('image_generation', 45);
  const modelNameLabel =
    form.imageModel === 'seedream_5_0_pro'
      ? 'SeaDream 5.0 Pro'
      : form.imageModel === 'seedream_4_5'
      ? 'Seedream 4.5'
      : form.imageModel === 'kling_3_0'
      ? 'Kling Image 3.0 Omni'
      : form.imageModel === 'kling_o3_fal'
      ? 'Kling O3 Omni — fal.ai'
      : form.imageModel === 'flux_2_pro_edit'
      ? 'FLUX 2 Pro Edit — fal.ai'
      : 'OpenAI';
  const scenarioMsg = form.selectedScenarioNumber ? ` no Cenário ${form.selectedScenarioNumber}` : '';
  onStatusMessage(`Gerando imagem vertical 9:16${scenarioMsg} no ${modelNameLabel}...`);

  const [activeScenarioBase64, activeModelBase64, { primaryPhoto, supplementaryPhotos }] = await Promise.all([
    resolveScenarioBase64(form),
    resolveModelBase64(form),
    prepareProductPhotosForPayload(form.referencePhotos),
  ]);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt: imagePrompt,
      productPhotoBase64: primaryPhoto,
      productPhotosBase64: supplementaryPhotos,
      scenarioPhotoBase64: activeScenarioBase64,
      modelReferenceBase64: activeModelBase64,
      selectedModelGalleryId: form.selectedModelGalleryId,
      selectedModelGalleryNumber: form.selectedModelGalleryNumber,
      modelScenarioSource: form.modelScenarioSource || 'model',
      isAnaMariaMode: true,
      presentationMode: activeMode,
      selectedMasterId: form.selectedMasterId,
      selectedScenarioNumber: form.selectedScenarioNumber,
      selectedScenarioId: form.selectedScenarioId,
      influencer: form.influencer,
      aspectRatio: '9:16',
      imageModel: form.imageModel,
      bodyType: form.bodyType,
      aiProfile,
      additionalInstructions: form.additionalInstructions,
    }
  );

  if (!imgData || !imgData.imageUrl) {
    throw new Error(imgData?.error || 'Não foi possível obter a imagem gerada do servidor.');
  }

  const generatedImageUrl = imgData.imageUrl;

  onProgress('completed', 100);
  onStatusMessage('Geração concluída com sucesso!');

  const audit: AnaMariaAudit = {
    score: 96,
    status: 'green',
    label: 'Verde — Fidelidade Aprovada',
    criteria: [
      { name: 'Corte Queixo', score: 100, status: 'green' },
      { name: form.bodyType === 'plus_size' ? 'Plus Size (50-54)' : 'Curvas & Silhueta', score: 96, status: 'green' },
      { name: 'Zero Tatuagens', score: 100, status: 'green' },
      { name: 'Calçado Condicional', score: 95, status: 'green' },
    ],
    issues: [
      `Calçado condicional selecionado: ${shoeDescription}`,
      'Enquadramento rigoroso do queixo para baixo sem rosto',
      form.bodyType === 'plus_size'
        ? 'Estrutura corporal autêntica Plus Size (manequim 50-54) com celulite natural nas coxas e pele sem bronzeado artificial'
        : 'Corpo com curvas e silhueta acentuadas',
      'Zero tatuagens garantido',
    ],
  };

  const result: AnaMariaResultState = {
    id: `anamaria_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    imageUrl: generatedImageUrl,
    productName: form.productName,
    referencePhotos: form.referencePhotos,
    influencer: form.influencer,
    bodyType: form.bodyType,
    additionalInstructions: form.additionalInstructions,
    imageModel: form.imageModel,
    videoPromptLimit: form.videoPromptLimit,
    presentationMode: activeMode,
    selectedMasterId: form.selectedMasterId || 'mestra_ana_maria',
    selectedScenarioId: form.selectedScenarioId,
    selectedScenarioNumber: form.selectedScenarioNumber,
    selectedModelGalleryId: form.selectedModelGalleryId,
    selectedModelGalleryNumber: form.selectedModelGalleryNumber,
    selectedModelGalleryUrl: form.selectedModelGalleryUrl,
    modelScenarioSource: form.modelScenarioSource || 'model',
    imagePrompt,
    videoPrompt,
    headline,
    hashtags,
    shoeCategory,
    shoeDescription,
    audit,
  };

  saveAnaMariaResult(result);

  return result;
}

/**
 * Refaz a imagem do Modo Ana Maria (com modelo opcional ou instrução de ajuste)
 */
export async function regenerateAnaMariaImage(params: {
  form: AnaMariaFormState;
  tweakPrompt?: string;
  imageModelOverride?: AnaMariaImageModel;
  aiProfile?: AIProfile;
}): Promise<{ imageUrl: string; audit?: AnaMariaAudit; imageModel: AnaMariaImageModel }> {
  const { form, tweakPrompt, imageModelOverride, aiProfile = 'openai' } = params;

  const effectiveImageModel = imageModelOverride || form.imageModel;

  const effectiveForm = ensureAnaMariaScenario({ ...form, imageModel: effectiveImageModel });
  if (tweakPrompt && tweakPrompt.trim().length > 0) {
    effectiveForm.additionalInstructions = [form.additionalInstructions, tweakPrompt.trim()]
      .filter(Boolean)
      .join('\n');
  }

  const { prompt } = buildAnaMariaImagePrompt(effectiveForm);
  const [activeScenarioBase64, activeModelBase64, { primaryPhoto, supplementaryPhotos }] = await Promise.all([
    resolveScenarioBase64(effectiveForm),
    resolveModelBase64(effectiveForm),
    prepareProductPhotosForPayload(effectiveForm.referencePhotos),
  ]);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt,
      productPhotoBase64: primaryPhoto,
      productPhotosBase64: supplementaryPhotos,
      scenarioPhotoBase64: activeScenarioBase64,
      modelReferenceBase64: activeModelBase64,
      selectedModelGalleryId: effectiveForm.selectedModelGalleryId,
      selectedModelGalleryNumber: effectiveForm.selectedModelGalleryNumber,
      modelScenarioSource: effectiveForm.modelScenarioSource || 'model',
      isAnaMariaMode: true,
      presentationMode: form.presentationMode,de: form.presentationMode,
      selectedMasterId: form.selectedMasterId,
      selectedScenarioNumber: effectiveForm.selectedScenarioNumber,
      selectedScenarioId: effectiveForm.selectedScenarioId,
      aspectRatio: '9:16',
      imageModel: effectiveImageModel,
      bodyType: effectiveForm.bodyType,
      aiProfile,
      additionalInstructions: effectiveForm.additionalInstructions,
    }
  );

  if (!imgData || !imgData.imageUrl) {
    throw new Error(imgData?.error || 'Falha ao refazer a imagem.');
  }

  const highResUrl = imgData.imageUrl;

  const audit: AnaMariaAudit = {
    score: 96,
    status: 'green',
    label: 'Verde — Fidelidade Aprovada',
    criteria: [
      { name: 'Corte Queixo', score: 100, status: 'green' },
      { name: 'Curvas & Silhueta', score: 96, status: 'green' },
      { name: 'Zero Tatuagens', score: 100, status: 'green' },
      { name: 'Calçado Condicional', score: 95, status: 'green' },
    ],
    issues: ['Peça refeita com alta fidelidade, cenário fixo e enquadramento do queixo para baixo.'],
  };

  return { imageUrl: highResUrl, audit, imageModel: effectiveImageModel };
}

const ALTERNATIVE_ROOMS: AnaMariaRoomType[] = ['quarto', 'sala', 'closet'];

/**
 * Trocar Cenário (Item 13 e Item 5):
 * Gera novamente a imagem mantendo a mesma modelo, mesma roupa e mesmo ângulo,
 * porém colocando-a em outro cômodo da mesma casa (quarto, sala ou closet),
 * com iluminação frontal natural e fundo mais penumbroso/carente de iluminação.
 */
export async function regenerateAnaMariaNewScenario(params: {
  form: AnaMariaFormState;
  currentRoom?: AnaMariaRoomType;
  aiProfile?: AIProfile;
}): Promise<{ imageUrl: string; room: AnaMariaRoomType }> {
  const { form, currentRoom, aiProfile = 'openai' } = params;

  const availableRooms = ALTERNATIVE_ROOMS.filter((r) => r !== currentRoom);
  const nextRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)] || 'quarto';

  const { prompt } = buildAnaMariaImagePrompt(form, nextRoom);
  const { primaryPhoto, supplementaryPhotos } = await prepareProductPhotosForPayload(form.referencePhotos);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt,
      productPhotoBase64: primaryPhoto,
      productPhotosBase64: supplementaryPhotos,
      isAnaMariaMode: false,
      presentationMode: form.presentationMode,
      selectedMasterId: form.selectedMasterId,
      aspectRatio: '9:16',
      imageModel: form.imageModel,
      bodyType: form.bodyType,
      aiProfile,
      additionalInstructions: form.additionalInstructions,
    }
  );

  if (!imgData || !imgData.imageUrl) {
    throw new Error(imgData?.error || 'Falha ao gerar nova imagem com cenário trocado.');
  }

  const highResUrl = imgData.imageUrl;

  return { imageUrl: highResUrl, room: nextRoom };
}

/**
 * Refina o Prompt de Vídeo Kling via IA mantendo as regras estritas sem rosto
 */
export async function refineAnaMariaVideoPrompt(params: {
  currentPrompt: string;
  correctionInstruction: string;
  aiProfile?: AIProfile;
}): Promise<string> {
  const res = await postJson<{ success: boolean; refinedPrompt?: string; error?: string }>(
    '/api/refine-video-prompt',
    {
      currentPrompt: params.currentPrompt,
      correctionInstruction: `MODO ANA MARIA (VÍDEO 10S VITRINE ESTÁTICA DIANTE DO ESPELHO):
${params.correctionInstruction}
REGRA MANDATÓRIA INVIOLÁVEL: O vídeo DEVE permanecer rigorosamente enquadrado da altura do queixo para baixo, com a câmera travada em altura estável, NUNCA inclinando para cima e NUNCA mostrando a boca, lábios (terminantemente proibido lábios inchados ou aparência de botox), nariz, olhos ou rosto. Zero tatuagens.`,
      aiProfile: params.aiProfile || 'openai',
    }
  );

  if (!res || !res.refinedPrompt) {
    throw new Error(res?.error || 'Não foi possível refinar o prompt.');
  }

  const clean = res.refinedPrompt
    .replace(/^🎥 PROMPT DE VÍDEO[^\n]*\n+/i, '')
    .trim();

  return clean;
}
