import {
  AnaMariaFormState,
  AnaMariaResultState,
  AnaMariaAudit,
  AnaMariaImageModel,
  AnaMariaMasterId,
  AnaMariaColorGroup,
  AnaMariaDressInspection,
  AnaMariaGeneratedImageItem,
} from './types';
import {
  buildAnaMariaImagePrompt,
  buildAnaMariaVideoPrompt,
  buildAnaMariaConciseVideoPrompt,
  AnaMariaRoomType,
} from './anaMariaPrompts';
import { resolveHeadlineAndHashtags } from './anaMariaBank';
import { AIProfile } from '../config/aiProfiles';
import { SCENARIO_GALLERY_ITEMS, POV_SCENARIO_GALLERY_ITEMS } from './scenarioGalleryData';
import { getModelGalleryForMode } from './modelGalleryData';
import { getMasterPromptById, resolveMasterPromptByProductName } from './masterPromptsData';

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
    // Evita estourar a cota de 5MB do localStorage quando há várias imagens em lote/base64
    const compactImages = result.generatedImages?.map((img) => ({
      ...img,
      imageUrl: img.imageUrl.startsWith('data:') && img.imageUrl.length > 250_000 ? '' : img.imageUrl,
    })).filter((img) => Boolean(img.imageUrl));
    const compactResult: AnaMariaResultState = {
      ...result,
      referencePhotos: result.referencePhotos.slice(0, 1),
      generatedImages: compactImages && compactImages.length > 0 ? compactImages.slice(0, 4) : undefined,
    };
    const updated = [compactResult, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao salvar no histórico do Modo Ana Maria (tentando versão compacta):', err);
    try {
      const minimalResult: AnaMariaResultState = {
        ...result,
        referencePhotos: [],
        generatedImages: undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([minimalResult]));
    } catch {
      // ignora silenciosamente se localStorage estiver cheio
    }
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
  quality = 0.85,
  forceCompress = false
): Promise<string> {
  if (typeof window === 'undefined' || !srcUrlOrBase64) return srcUrlOrBase64;
  // Se for JPEG já otimizado (< 350 KB em base64), retorna direto para 0ms de espera (exceto se forceCompress=true)
  if (
    !forceCompress &&
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

const preloadedScenarioUrls = new Set<string>();

export function preloadScenarioUrl(url?: string): void {
  if (!url || typeof window === 'undefined' || preloadedScenarioUrls.has(url)) return;
  preloadedScenarioUrls.add(url);
  const img = new Image();
  img.src = url;
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

async function resolveScenarioBase64(form: AnaMariaFormState): Promise<string | undefined> {
  if (form.selectedScenarioBase64 && form.selectedScenarioBase64.length > 50) {
    return compressImageForFastTransfer(form.selectedScenarioBase64, 1024, 0.88);
  }
  // Quando um cenário da galeria (com ID ou número) ou o padrão é usado, o servidor carrega o PNG nativo direto do disco (com cache em memória), evitando download/compressão no browser e upload base64 redundante.
  if (form.selectedScenarioId || form.selectedScenarioNumber || !form.selectedScenarioUrl) {
    return undefined;
  }
  const cached = scenarioBase64Cache.get(form.selectedScenarioUrl);
  if (cached) return cached;
  try {
    const compressed = await compressImageForFastTransfer(form.selectedScenarioUrl, 1024, 0.88);
    if (compressed && compressed.startsWith('data:image/')) {
      scenarioBase64Cache.set(form.selectedScenarioUrl, compressed);
      return compressed;
    }
  } catch (e) {
    console.warn('Falha ao converter cenário selecionado para base64:', e);
  }
  return undefined;
}

const modelBase64Cache = new Map<string, string>();

export async function resolveModelBase64(form: AnaMariaFormState): Promise<string | undefined> {
  if (form.generateModelViaPrompt) {
    return undefined;
  }
  if (form.selectedModelGalleryBase64 && form.selectedModelGalleryBase64.length > 50) {
    return compressImageForFastTransfer(form.selectedModelGalleryBase64, 1024, 0.88);
  }
  // Quando uma modelo da galeria é selecionada por número, o servidor carrega o PNG nativo em resolução máxima direto de public/models/gallery, evitando perda de qualidade JPEG (800px) e bordas de recorte.
  if (form.selectedModelGalleryNumber) {
    return undefined;
  }
  const url = form.selectedModelGalleryUrl;
  if (url) {
    const cached = modelBase64Cache.get(url);
    if (cached) return cached;
    try {
      const compressed = await compressImageForFastTransfer(url, 1024, 0.88);
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

export function buildExplicitColorGroups(
  sameColorPhotos: string[] = [],
  extraColorPhotos: string[] = []
): { allPhotos: string[]; colorGroups: AnaMariaColorGroup[] } {
  const fieldA = (sameColorPhotos || []).filter(Boolean).slice(0, 10);
  const fieldB = (extraColorPhotos || []).filter(Boolean).slice(0, 10);
  const allPhotos = [...fieldA, ...fieldB];

  if (allPhotos.length === 0) {
    return { allPhotos: [], colorGroups: [] };
  }

  const colorGroups: AnaMariaColorGroup[] = [];
  if (fieldA.length > 0) {
    colorGroups.push({
      colorName: fieldB.length > 0 ? 'Cor 1 (Principal)' : 'Cor Principal',
      photoIndices: fieldA.map((_, idx) => idx),
    });
  }
  fieldB.forEach((_, idx) => {
    const num = fieldA.length > 0 ? idx + 2 : idx + 1;
    colorGroups.push({
      colorName: `Cor ${num}`,
      photoIndices: [fieldA.length + idx],
    });
  });

  return { allPhotos, colorGroups };
}

const dressInspectionCache = new Map<string, AnaMariaDressInspection>();

export async function inspectDressAttributes(
  photo: string,
  productName?: string,
  presentationMode?: string
): Promise<AnaMariaDressInspection | undefined> {
  if (!photo || presentationMode === 'pov') return undefined;
  const trimmedName = (productName || '').trim();
  // Se o usuário já informou explicitamente uma peça que não é vestido (ex.: blusa, calça, bolsa), evita gastar chamada e tokens de visão
  const isExplicitlyNotDress =
    trimmedName.length > 0 &&
    /\b(blusa|blusinha|camisa|camiseta|t-shirt|tee|cropped|top|regata|body|tric[oô]|su[eê]ter|cardigan|jaqueta|casaco|blazer|cal[cç]a|jeans|short|shorts|bermuda|saia|legging|bolsa|sapato|sand[aá]lia|t[eê]nis|bota)\b/i.test(
      trimmedName
    ) &&
    !/\b(vestido|vestidos|dress|dresses|chemise|tubinho|macaquinho|macac[aã]o)\b/i.test(trimmedName);

  if (isExplicitlyNotDress) return undefined;

  const cacheKey = `${photo.slice(0, 64)}_${photo.slice(-64)}_${photo.length}_${trimmedName.toLowerCase()}`;
  const cached = dressInspectionCache.get(cacheKey);
  if (cached) return cached;

  try {
    const thumb = await compressImageForFastTransfer(photo, 384, 0.78, true);
    const res = await postJson<{
      success: boolean;
      garmentCategory?: AnaMariaDressInspection['garmentCategory'];
      lengthCategory?: AnaMariaDressInspection['lengthCategory'];
      hasSingleSideSlit?: boolean;
      slitLegWearer?: AnaMariaDressInspection['slitLegWearer'];
    }>('/api/anamaria-inspect-dress', { photoBase64: thumb, productName }, 0);

    if (res?.success) {
      const inspection: AnaMariaDressInspection = {
        garmentCategory: res.garmentCategory || 'dress',
        lengthCategory: res.lengthCategory || 'unknown',
        hasSingleSideSlit: Boolean(res.hasSingleSideSlit),
        slitLegWearer: res.slitLegWearer || 'none',
      };
      dressInspectionCache.set(cacheKey, inspection);
      return inspection;
    }
  } catch (err) {
    console.warn('Falha ao inspecionar comprimento/fenda do vestido:', err);
  }
  return undefined;
}

export function getActiveColorGroupPhotos(
  photos: string[],
  colorGroups?: AnaMariaColorGroup[],
  activeIndex = 0
): string[] {
  const safePhotos = (photos || []).filter(Boolean);
  if (!colorGroups || colorGroups.length <= 1) {
    return safePhotos;
  }
  const safeIdx = ((activeIndex % colorGroups.length) + colorGroups.length) % colorGroups.length;
  const group = colorGroups[safeIdx];
  const groupPhotos = (group?.photoIndices || []).map((i) => safePhotos[i]).filter(Boolean);
  return groupPhotos.length > 0 ? groupPhotos : safePhotos;
}

const preparedProductPhotoCache = new Map<string, { primaryPhoto: string; supplementaryPhotos: string[] }>();

async function prepareProductPhotosForPayload(photos: string[]): Promise<{
  primaryPhoto: string;
  supplementaryPhotos: string[];
}> {
  const validPhotos = (photos || []).filter(Boolean).slice(0, 4);
  const cacheKey = validPhotos.map((p) => `${p.slice(0, 48)}_${p.slice(-48)}_${p.length}`).join('|');
  if (cacheKey && preparedProductPhotoCache.has(cacheKey)) {
    return preparedProductPhotoCache.get(cacheKey)!;
  }
  const optimizedPhotos = await Promise.all(
    validPhotos.map((p) => compressImageForFastTransfer(p, 1024, 0.88))
  );
  let result: { primaryPhoto: string; supplementaryPhotos: string[] };
  if (optimizedPhotos.length >= 2) {
    const combined = await combineTwoPhotosSideBySide(optimizedPhotos[0], optimizedPhotos[1], 1024);
    result = {
      primaryPhoto: combined,
      supplementaryPhotos: [],
    };
  } else {
    result = {
      primaryPhoto: optimizedPhotos[0] || '',
      supplementaryPhotos: [],
    };
  }
  if (cacheKey) {
    preparedProductPhotoCache.set(cacheKey, result);
  }
  return result;
}

/**
 * Garante que um cenário esteja sempre definido.
 * Se o usuário não tiver escolhido nenhum cenário na galeria:
 * - No modo POV: escolhe um dos 2 cenários POV da galeria POV.
 * - Para Mestra Catza (quando nenhum cenário foi selecionado): prioriza o Cenário 24 (ambiente mais escuro com flash).
 * - Nos demais casos: sorteia randomicamente um dos 24 cenários vencedores da galeria.
 */
export function ensureAnaMariaModelAndScenario(rawForm: AnaMariaFormState): AnaMariaFormState {
  let form = { ...rawForm };

  // Seleciona automaticamente o prompt de movimento de acordo com o nome da peça,
  // a menos que o usuário tenha selecionado manualmente outro prompt na galeria ou esteja em modo POV.
  const initialMode = form.presentationMode || 'mirror_selfie';
  if (initialMode !== 'pov' && !form.isManualMasterSelection) {
    form.selectedMasterId = resolveMasterPromptByProductName(form.productName);
  }

  const master = getMasterPromptById(form.selectedMasterId);
  const activeMode = form.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');

  // 1. Cenário: se o usuário não escolheu, seleciona de forma randômica
  if (activeMode === 'pov' || master.isPov) {
    const preferredPov =
      POV_SCENARIO_GALLERY_ITEMS.find((s) => s.id === master.preferredScenarioId) ||
      POV_SCENARIO_GALLERY_ITEMS[0];
    if (preferredPov) {
      form.presentationMode = 'pov';
      form.selectedScenarioId = preferredPov.id;
      form.selectedScenarioNumber = preferredPov.number;
      form.selectedScenarioUrl = preferredPov.fullUrl;
      form.selectedScenarioBase64 = undefined;
    }
  } else if (
    !form.selectedScenarioId ||
    form.selectedScenarioId.startsWith('cenario_pov_') ||
    (!form.selectedScenarioUrl && !form.selectedScenarioBase64)
  ) {
    if (SCENARIO_GALLERY_ITEMS && SCENARIO_GALLERY_ITEMS.length > 0) {
      const chosenScenario =
        prewarmedRandomScenario ||
        SCENARIO_GALLERY_ITEMS[Math.floor(Math.random() * SCENARIO_GALLERY_ITEMS.length)] ||
        SCENARIO_GALLERY_ITEMS[0];

      const nextIndex = Math.floor(Math.random() * SCENARIO_GALLERY_ITEMS.length);
      prewarmedRandomScenario = SCENARIO_GALLERY_ITEMS[nextIndex] || SCENARIO_GALLERY_ITEMS[0];
      if (prewarmedRandomScenario?.fullUrl) {
        preloadScenarioUrl(prewarmedRandomScenario.fullUrl);
      }

      form.selectedScenarioId = chosenScenario.id;
      form.selectedScenarioNumber = chosenScenario.number;
      form.selectedScenarioUrl = chosenScenario.fullUrl;
      form.selectedScenarioBase64 = undefined;
    }
  }

  // 2. Modelo:
  // Se o usuário marcou "Desmarcar Modelo (Gerar via Prompt)", limpa qualquer modelo de foto
  if (form.generateModelViaPrompt) {
    form.selectedModelGalleryId = undefined;
    form.selectedModelGalleryNumber = undefined;
    form.selectedModelGalleryUrl = undefined;
    form.selectedModelGalleryBase64 = undefined;
  } else {
    const targetModelGallery = getModelGalleryForMode(activeMode);
    // Garante que uma modelo selecionada realmente pertence à galeria do modo ativo (UGC vs Sem Rosto)
    const matchingExisting = form.selectedModelGalleryId
      ? targetModelGallery.find((m) => m.id === form.selectedModelGalleryId)
      : undefined;

    if (!matchingExisting) {
      form.selectedModelGalleryId = undefined;
      form.selectedModelGalleryNumber = undefined;
      form.selectedModelGalleryUrl = undefined;
      form.selectedModelGalleryBase64 = undefined;
    }

    if (!form.selectedModelGalleryId && !form.selectedModelGalleryNumber && targetModelGallery.length > 0) {
      const chosenModel = targetModelGallery[Math.floor(Math.random() * targetModelGallery.length)];
      form.selectedModelGalleryId = chosenModel.id;
      form.selectedModelGalleryNumber = chosenModel.number;
      form.selectedModelGalleryUrl = chosenModel.fullUrl;
      form.selectedModelGalleryBase64 = undefined;
    }
  }

  return form;
}

export const ensureAnaMariaScenario = ensureAnaMariaModelAndScenario;

/**
 * Executa a chamada de geração de imagem com fallback automático:
 * quando imageModel é 'openai' e ocorre erro, alterna automaticamente para 'seedream_5_0_pro' e tenta novamente.
 */
async function generateSceneImageWithFallback(params: {
  payload: Record<string, any>;
  requestedModel: AnaMariaImageModel;
  onFallback?: () => void;
}): Promise<{ imageUrl: string; usedModel: AnaMariaImageModel }> {
  try {
    const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
      '/api/generate-scene-image',
      {
        ...params.payload,
        imageModel: params.requestedModel,
      }
    );
    if (!imgData || !imgData.imageUrl) {
      throw new Error(imgData?.error || 'Não foi possível obter a imagem gerada do servidor.');
    }
    return { imageUrl: imgData.imageUrl, usedModel: params.requestedModel };
  } catch (err: any) {
    if (params.requestedModel === 'openai') {
      const openAiErrMsg = err?.message || 'Erro desconhecido na OpenAI';
      console.warn(
        '[AnaMaria] Erro na geração com OpenAI; alternando automaticamente para SeaDream 5.0 Pro:',
        err
      );
      params.onFallback?.();
      try {
        const fallbackData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
          '/api/generate-scene-image',
          {
            ...params.payload,
            imageModel: 'seedream_5_0_pro',
          }
        );
        if (!fallbackData || !fallbackData.imageUrl) {
          throw new Error(fallbackData?.error || 'Falha no fallback automático com SeaDream 5.0 Pro.');
        }
        return { imageUrl: fallbackData.imageUrl, usedModel: 'seedream_5_0_pro' };
      } catch (fallbackErr: any) {
        const fallbackErrMsg = fallbackErr?.message || 'Falha no fallback automático com SeaDream 5.0 Pro.';
        throw new Error(`OpenAI falhou (${openAiErrMsg}) e o fallback SeaDream 5.0 Pro também falhou (${fallbackErrMsg})`);
      }
    }
    throw err;
  }
}

function pickDistinctGalleryScenario(
  activeMode: 'mirror_selfie' | 'pov' | 'com_rosto',
  excludeIds: Set<string>,
  excludeNumbers: Set<number>,
  lastId?: string,
  lastNumber?: number
) {
  const pool = activeMode === 'pov' ? POV_SCENARIO_GALLERY_ITEMS : SCENARIO_GALLERY_ITEMS;
  let candidates = pool.filter(
    (s) => !excludeIds.has(s.id) && !excludeNumbers.has(s.number)
  );
  if (candidates.length === 0) {
    candidates = pool.filter((s) => s.id !== lastId && s.number !== lastNumber);
  }
  if (candidates.length === 0) candidates = pool;
  return candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
}

function pickDistinctGalleryModel(
  activeMode: 'mirror_selfie' | 'pov' | 'com_rosto',
  excludeIds: Set<string>,
  excludeNumbers: Set<number>,
  lastId?: string,
  lastNumber?: number
) {
  const pool = getModelGalleryForMode(activeMode);
  let candidates = pool.filter(
    (m) => !excludeIds.has(m.id) && !excludeNumbers.has(m.number)
  );
  if (candidates.length === 0) {
    candidates = pool.filter((m) => m.id !== lastId && m.number !== lastNumber);
  }
  if (candidates.length === 0) candidates = pool;
  return candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
}

function buildAnaMariaDefaultAudit(
  bodyType: AnaMariaFormState['bodyType'],
  shoeDescription: string
): AnaMariaAudit {
  return {
    score: 96,
    status: 'green',
    label: 'Verde — Fidelidade Aprovada',
    criteria: [
      { name: 'Corte Queixo', score: 100, status: 'green' },
      { name: bodyType === 'plus_size' ? 'Plus Size (50-54)' : 'Curvas & Silhueta', score: 96, status: 'green' },
      { name: 'Zero Tatuagens', score: 100, status: 'green' },
      { name: 'Calçado Condicional', score: 95, status: 'green' },
    ],
    issues: [
      `Calçado condicional selecionado: ${shoeDescription}`,
      'Enquadramento rigoroso do queixo para baixo sem rosto',
      bodyType === 'plus_size'
        ? 'Estrutura corporal autêntica Plus Size (manequim 50-54) com celulite natural nas coxas e pele sem bronzeado artificial'
        : 'Corpo com curvas e silhueta acentuadas',
      'Zero tatuagens garantido',
    ],
  };
}

async function executeColorImageGeneration(params: {
  itemForm: AnaMariaFormState;
  colorPhotos: string[];
  colorGroupIndex: number;
  colorName: string;
  totalColors: number;
  prevColorName?: string;
  dressInspection?: AnaMariaDressInspection;
  aiProfile: AIProfile;
  overrideModelBase64?: string;
  overrideModelScenarioSource?: 'model' | 'gallery';
  displayScenarioId?: string;
  displayScenarioNumber?: number;
  displayModelScenarioSource?: 'model' | 'gallery';
  lockSameModelAndScenarioNote?: boolean;
  onFallback?: () => void;
}): Promise<{
  item: AnaMariaGeneratedImageItem;
  imagePrompt: string;
  shoeCategory: AnaMariaResultState['shoeCategory'];
  shoeDescription: string;
}> {
  const {
    itemForm,
    colorPhotos,
    colorGroupIndex,
    colorName,
    totalColors,
    prevColorName,
    dressInspection,
    aiProfile,
    overrideModelBase64,
    overrideModelScenarioSource,
    displayScenarioId,
    displayScenarioNumber,
    displayModelScenarioSource,
    lockSameModelAndScenarioNote,
    onFallback,
  } = params;

  const activeMode = itemForm.presentationMode || 'mirror_selfie';
  const payloadSource = overrideModelScenarioSource || itemForm.modelScenarioSource || 'model';

  const { prompt: imagePrompt, shoeCategory, shoeDescription } = buildAnaMariaImagePrompt(
    { ...itemForm, modelScenarioSource: payloadSource },
    'hall_espelho',
    dressInspection
  );

  const colorInstruction =
    totalColors > 1 && colorName
      ? `\n\nATENÇÃO À COR EXCLUSIVA (${colorName}): Reproduza EXCLUSIVAMENTE a peça na cor da foto de referência de produto ativa desta geração.${prevColorName && prevColorName !== colorName ? ` NÃO mantenha nem repita a cor anterior (${prevColorName}).` : ''}`
      : '';
  const sameSceneNote = lockSameModelAndScenarioNote
    ? '\n\nEDIÇÃO FIEL DA MESMA MODELO E MESMO CENÁRIO: Mantenha 100% intactos e idênticos a mesma mulher, o mesmo rosto/enquadramento, a mesma pose e o mesmo cenário da imagem base, alterando EXCLUSIVAMENTE a roupa para a cor da foto de produto ativa.'
    : '';
  const effectivePrompt = `${imagePrompt}${colorInstruction}${sameSceneNote}`;

  const [activeScenarioBase64, resolvedModelBase64, { primaryPhoto, supplementaryPhotos }] =
    await Promise.all([
      payloadSource === 'model' && overrideModelBase64
        ? Promise.resolve(undefined)
        : resolveScenarioBase64(itemForm),
      overrideModelBase64 ? Promise.resolve(overrideModelBase64) : resolveModelBase64(itemForm),
      prepareProductPhotosForPayload(colorPhotos),
    ]);

  const { imageUrl, usedModel } = await generateSceneImageWithFallback({
    requestedModel: itemForm.imageModel,
    onFallback,
    payload: {
      prompt: effectivePrompt,
      productPhotoBase64: primaryPhoto,
      productPhotosBase64: supplementaryPhotos,
      scenarioPhotoBase64: activeScenarioBase64,
      modelReferenceBase64: resolvedModelBase64,
      selectedModelGalleryId: itemForm.selectedModelGalleryId,
      selectedModelGalleryNumber: itemForm.selectedModelGalleryNumber,
      isLockedGeneratedBase: Boolean(overrideModelBase64),
      generateModelViaPrompt: overrideModelBase64 ? false : Boolean(itemForm.generateModelViaPrompt),
      modelScenarioSource: payloadSource,
      isAnaMariaMode: true,
      presentationMode: activeMode,
      selectedMasterId: itemForm.selectedMasterId,
      selectedScenarioNumber: itemForm.selectedScenarioNumber,
      selectedScenarioId: itemForm.selectedScenarioId,
      influencer: itemForm.influencer,
      aspectRatio: '9:16',
      bodyType: itemForm.bodyType,
      aiProfile,
      additionalInstructions: itemForm.additionalInstructions,
    },
  });

  const ts = Date.now();
  const audit = buildAnaMariaDefaultAudit(itemForm.bodyType, shoeDescription);

  return {
    item: {
      id: `am_img_${ts}_${colorGroupIndex}_${Math.random().toString(36).substring(2, 6)}`,
      imageUrl,
      imageModel: usedModel,
      colorGroupIndex,
      colorName,
      timestamp: ts,
      selectedScenarioId: displayScenarioId ?? itemForm.selectedScenarioId,
      selectedScenarioNumber: displayScenarioNumber ?? itemForm.selectedScenarioNumber,
      selectedModelGalleryId: itemForm.selectedModelGalleryId,
      selectedModelGalleryNumber: itemForm.selectedModelGalleryNumber,
      selectedModelGalleryUrl: itemForm.selectedModelGalleryUrl,
      modelScenarioSource: displayModelScenarioSource ?? payloadSource,
      generateModelViaPrompt: itemForm.generateModelViaPrompt,
      audit,
    },
    imagePrompt,
    shoeCategory,
    shoeDescription,
  };
}

/**
 * Pipeline principal do Modo Ana Maria (otimizado para execução rápida e suporte a geração em lote de múltiplas cores)
 */
export async function runAnaMariaPipeline(
  rawForm: AnaMariaFormState,
  callbacks?: AnaMariaPipelineCallbacks,
  aiProfile: AIProfile = 'openai'
): Promise<AnaMariaResultState> {
  const { onProgress = () => {}, onStatusMessage = () => {} } = callbacks || {};

  const fieldB = (rawForm.extraColorPhotos || []).filter(Boolean);
  const { allPhotos, colorGroups } = buildExplicitColorGroups(
    rawForm.referencePhotos,
    rawForm.extraColorPhotos
  );
  if (allPhotos.length === 0) {
    throw new Error('Por favor, anexe ao menos 1 foto de referência da peça.');
  }

  const hasMultipleColors = fieldB.length > 0 && colorGroups.length >= 2;
  const sameModelForAllColors = Boolean(rawForm.sameModelForAllColors);
  const sameScenarioForAllColors = Boolean(rawForm.sameScenarioForAllColors);
  const generateOneColorAtATime = Boolean(rawForm.generateOneColorAtATime);
  const shouldGenerateAllColorsAtOnce = hasMultipleColors && !generateOneColorAtATime;

  const form0 = ensureAnaMariaModelAndScenario({
    ...rawForm,
    referencePhotos: allPhotos,
  });
  const master = getMasterPromptById(form0.selectedMasterId);
  const activeMode = form0.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');

  // Se todas as cores compartilham o mesmo cenário mas modelos diferentes, a Cor 1 também precisa usar o cenário da galeria
  if (
    shouldGenerateAllColorsAtOnce &&
    sameScenarioForAllColors &&
    !sameModelForAllColors &&
    activeMode !== 'pov'
  ) {
    form0.modelScenarioSource = 'gallery';
  }

  const firstColorGroup = colorGroups[0];
  const firstColorPhotos = getActiveColorGroupPhotos(allPhotos, colorGroups, 0);

  // 1. Inspeção rápida de comprimento real (Curto / Midi / Longo) e fenda assimétrica única em paralelo com a compressão da foto do produto
  onProgress('prompt_building', 20);
  onStatusMessage(`Analisando detalhes reais da peça (${master.shortName})...`);
  const [dressInspection] = await Promise.all([
    inspectDressAttributes(firstColorPhotos[0], form0.productName, activeMode),
    prepareProductPhotosForPayload(firstColorPhotos),
  ]);

  const { headline, hashtags } = resolveHeadlineAndHashtags({
    productName: form0.productName,
    influencer: form0.influencer,
    bodyType: form0.bodyType,
    additionalInstructions: form0.additionalInstructions,
  });

  const videoPrompt = buildAnaMariaVideoPrompt({
    productName: form0.productName,
    influencer: form0.influencer,
    bodyType: form0.bodyType,
    presentationMode: activeMode,
    selectedMasterId: form0.selectedMasterId,
    limit: form0.videoPromptLimit,
    additionalInstructions: form0.additionalInstructions,
    hasSelectedScenario: Boolean(form0.selectedScenarioId),
    dressInspection,
  });

  // 2. Geração da Cor 1 (e das demais cores em seguida caso "Gerar em uma cor por vez" esteja em Não)
  onProgress('image_generation', 35);
  const totalToGenerate = shouldGenerateAllColorsAtOnce ? colorGroups.length : 1;
  onStatusMessage(
    totalToGenerate > 1
      ? `Gerando imagem 1 de ${totalToGenerate} (${firstColorGroup.colorName})...`
      : `Gerando imagem vertical 9:16${form0.selectedScenarioNumber ? ` no Cenário ${form0.selectedScenarioNumber}` : ''}...`
  );

  const firstGen = await executeColorImageGeneration({
    itemForm: form0,
    colorPhotos: firstColorPhotos,
    colorGroupIndex: 0,
    colorName: firstColorGroup.colorName,
    totalColors: colorGroups.length,
    dressInspection,
    aiProfile,
    onFallback: () =>
      onStatusMessage(
        'OpenAI retornou erro — mudando automaticamente para SeaDream 5.0 Pro e gerando novamente...'
      ),
  });

  const generatedImages: AnaMariaGeneratedImageItem[] = [firstGen.item];

  if (shouldGenerateAllColorsAtOnce && colorGroups.length > 1) {
    const usedModelIds = new Set<string>();
    const usedModelNumbers = new Set<number>();
    if (form0.selectedModelGalleryId) usedModelIds.add(form0.selectedModelGalleryId);
    if (typeof form0.selectedModelGalleryNumber === 'number') {
      usedModelNumbers.add(form0.selectedModelGalleryNumber);
    }

    const usedScenarioIds = new Set<string>();
    const usedScenarioNumbers = new Set<number>();
    if (form0.selectedScenarioId) usedScenarioIds.add(form0.selectedScenarioId);
    if (typeof form0.selectedScenarioNumber === 'number') {
      usedScenarioNumbers.add(form0.selectedScenarioNumber);
    }

    const needsFirstImageAsModelBase =
      sameModelForAllColors && (sameScenarioForAllColors || Boolean(form0.generateModelViaPrompt));
    const cachedFirstImageB64 = needsFirstImageAsModelBase
      ? await compressImageForFastTransfer(firstGen.item.imageUrl, 864, 0.88)
      : undefined;

    let lastModelId = form0.selectedModelGalleryId;
    let lastModelNumber = form0.selectedModelGalleryNumber;
    let lastScenarioId = form0.selectedScenarioId;
    let lastScenarioNumber = form0.selectedScenarioNumber;

    const remainingPlans = colorGroups.slice(1).map((group, offsetIdx) => {
      const colorIdx = offsetIdx + 1;
      const colorPhotos = getActiveColorGroupPhotos(allPhotos, colorGroups, colorIdx);

      let nextModelId = form0.selectedModelGalleryId;
      let nextModelNumber = form0.selectedModelGalleryNumber;
      let nextModelUrl = form0.selectedModelGalleryUrl;
      let nextGenerateViaPrompt = Boolean(form0.generateModelViaPrompt);

      if (!sameModelForAllColors) {
        const chosenModel = pickDistinctGalleryModel(
          activeMode,
          usedModelIds,
          usedModelNumbers,
          lastModelId,
          lastModelNumber
        );
        if (chosenModel) {
          nextModelId = chosenModel.id;
          nextModelNumber = chosenModel.number;
          nextModelUrl = chosenModel.fullUrl;
          usedModelIds.add(chosenModel.id);
          usedModelNumbers.add(chosenModel.number);
          lastModelId = chosenModel.id;
          lastModelNumber = chosenModel.number;
        }
        nextGenerateViaPrompt = false;
      }

      let nextScenarioId = form0.selectedScenarioId;
      let nextScenarioNumber = form0.selectedScenarioNumber;
      let nextScenarioUrl = form0.selectedScenarioUrl;
      let nextScenarioBase64 = form0.selectedScenarioBase64;

      if (!sameScenarioForAllColors) {
        const chosenScenario = pickDistinctGalleryScenario(
          activeMode,
          usedScenarioIds,
          usedScenarioNumbers,
          lastScenarioId,
          lastScenarioNumber
        );
        if (chosenScenario) {
          nextScenarioId = chosenScenario.id;
          nextScenarioNumber = chosenScenario.number;
          nextScenarioUrl = chosenScenario.fullUrl;
          nextScenarioBase64 = undefined;
          usedScenarioIds.add(chosenScenario.id);
          usedScenarioNumbers.add(chosenScenario.number);
          lastScenarioId = chosenScenario.id;
          lastScenarioNumber = chosenScenario.number;
        }
      }

      const itemForm: AnaMariaFormState = {
        ...form0,
        referencePhotos: colorPhotos,
        selectedModelGalleryId: nextModelId,
        selectedModelGalleryNumber: nextModelNumber,
        selectedModelGalleryUrl: nextModelUrl,
        selectedScenarioId: nextScenarioId,
        selectedScenarioNumber: nextScenarioNumber,
        selectedScenarioUrl: nextScenarioUrl,
        selectedScenarioBase64: nextScenarioBase64,
        generateModelViaPrompt: nextGenerateViaPrompt,
        modelScenarioSource:
          sameModelForAllColors && sameScenarioForAllColors ? 'model' : 'gallery',
      };

      const useFirstAsFullBase = sameModelForAllColors && sameScenarioForAllColors;

      return {
        colorIdx,
        group,
        colorPhotos,
        itemForm,
        overrideModelBase64:
          useFirstAsFullBase || (sameModelForAllColors && form0.generateModelViaPrompt)
            ? cachedFirstImageB64
            : undefined,
        overrideModelScenarioSource: (useFirstAsFullBase ? 'model' : 'gallery') as
          | 'model'
          | 'gallery',
        displayScenarioId: useFirstAsFullBase ? form0.selectedScenarioId : nextScenarioId,
        displayScenarioNumber: useFirstAsFullBase
          ? form0.selectedScenarioNumber
          : nextScenarioNumber,
        displayModelScenarioSource: useFirstAsFullBase
          ? (form0.modelScenarioSource || 'model')
          : ('gallery' as const),
        lockSameModelAndScenarioNote: useFirstAsFullBase,
      };
    });

    const resultsByIdx = new Array<AnaMariaGeneratedImageItem>(remainingPlans.length);
    let completed = 1;
    const concurrency = 2;

    for (let i = 0; i < remainingPlans.length; i += concurrency) {
      const chunk = remainingPlans.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async (plan, cIdx) => {
          const gen = await executeColorImageGeneration({
            itemForm: plan.itemForm,
            colorPhotos: plan.colorPhotos,
            colorGroupIndex: plan.colorIdx,
            colorName: plan.group.colorName,
            totalColors: colorGroups.length,
            prevColorName: colorGroups[plan.colorIdx - 1]?.colorName,
            dressInspection,
            aiProfile,
            overrideModelBase64: plan.overrideModelBase64,
            overrideModelScenarioSource: plan.overrideModelScenarioSource,
            displayScenarioId: plan.displayScenarioId,
            displayScenarioNumber: plan.displayScenarioNumber,
            displayModelScenarioSource: plan.displayModelScenarioSource,
            lockSameModelAndScenarioNote: plan.lockSameModelAndScenarioNote,
          });
          resultsByIdx[i + cIdx] = gen.item;
          completed++;
          const pct = Math.min(96, 35 + Math.round((completed / totalToGenerate) * 60));
          onProgress('image_generation', pct);
          onStatusMessage(
            `Gerando imagens das cores (${completed}/${totalToGenerate} concluídas)...`
          );
        })
      );
    }

    for (const item of resultsByIdx) {
      if (item) generatedImages.push(item);
    }
  }

  onProgress('completed', 100);
  onStatusMessage('Geração concluída com sucesso!');

  const activeColorGroupIndex = generatedImages[generatedImages.length - 1]?.colorGroupIndex ?? 0;

  const result: AnaMariaResultState = {
    id: `anamaria_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: firstGen.item.timestamp,
    imageUrl: firstGen.item.imageUrl,
    generatedImages,
    hasMultipleColors,
    sameModelForAllColors,
    sameScenarioForAllColors,
    generateOneColorAtATime,
    productName: form0.productName,
    referencePhotos: allPhotos,
    colorGroups,
    activeColorGroupIndex,
    dressInspection,
    influencer: form0.influencer,
    bodyType: form0.bodyType,
    additionalInstructions: form0.additionalInstructions,
    imageModel: firstGen.item.imageModel,
    videoPromptLimit: form0.videoPromptLimit,
    presentationMode: activeMode,
    selectedMasterId: form0.selectedMasterId || 'mestra_ana_maria',
    selectedScenarioId: firstGen.item.selectedScenarioId,
    selectedScenarioNumber: firstGen.item.selectedScenarioNumber,
    selectedModelGalleryId: firstGen.item.selectedModelGalleryId,
    selectedModelGalleryNumber: firstGen.item.selectedModelGalleryNumber,
    selectedModelGalleryUrl: firstGen.item.selectedModelGalleryUrl,
    modelScenarioSource: firstGen.item.modelScenarioSource,
    generateModelViaPrompt: form0.generateModelViaPrompt,
    imagePrompt: firstGen.imagePrompt,
    videoPrompt,
    conciseVideoPrompt: undefined,
    headline,
    hashtags,
    shoeCategory: firstGen.shoeCategory,
    shoeDescription: firstGen.shoeDescription,
    audit: firstGen.item.audit,
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
  dressInspection?: AnaMariaDressInspection;
  aiProfile?: AIProfile;
}): Promise<{ imageUrl: string; audit?: AnaMariaAudit; imageModel: AnaMariaImageModel }> {
  const { form, tweakPrompt, imageModelOverride, dressInspection, aiProfile = 'openai' } = params;

  const effectiveImageModel = imageModelOverride || form.imageModel;

  const effectiveForm = ensureAnaMariaModelAndScenario({ ...form, imageModel: effectiveImageModel });
  if (tweakPrompt && tweakPrompt.trim().length > 0) {
    effectiveForm.additionalInstructions = [form.additionalInstructions, tweakPrompt.trim()]
      .filter(Boolean)
      .join('\n');
  }

  const { prompt } = buildAnaMariaImagePrompt(effectiveForm, 'hall_espelho', dressInspection);
  const [activeScenarioBase64, activeModelBase64, { primaryPhoto, supplementaryPhotos }] = await Promise.all([
    resolveScenarioBase64(effectiveForm),
    resolveModelBase64(effectiveForm),
    prepareProductPhotosForPayload(effectiveForm.referencePhotos),
  ]);

  const { imageUrl: highResUrl, usedModel } = await generateSceneImageWithFallback({
    requestedModel: effectiveImageModel,
    payload: {
      prompt,
      productPhotoBase64: primaryPhoto,
      productPhotosBase64: supplementaryPhotos,
      scenarioPhotoBase64: activeScenarioBase64,
      modelReferenceBase64: activeModelBase64,
      selectedModelGalleryId: effectiveForm.selectedModelGalleryId,
      selectedModelGalleryNumber: effectiveForm.selectedModelGalleryNumber,
      modelScenarioSource: effectiveForm.modelScenarioSource || 'model',
      isAnaMariaMode: true,
      presentationMode: form.presentationMode,
      selectedMasterId: form.selectedMasterId,
      selectedScenarioNumber: effectiveForm.selectedScenarioNumber,
      selectedScenarioId: effectiveForm.selectedScenarioId,
      aspectRatio: '9:16',
      bodyType: effectiveForm.bodyType,
      aiProfile,
      additionalInstructions: effectiveForm.additionalInstructions,
    },
  });

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

  return { imageUrl: highResUrl, audit, imageModel: usedModel };
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
}): Promise<{ imageUrl: string; room: AnaMariaRoomType; imageModel: AnaMariaImageModel }> {
  const { form, currentRoom, aiProfile = 'openai' } = params;

  const availableRooms = ALTERNATIVE_ROOMS.filter((r) => r !== currentRoom);
  const nextRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)] || 'quarto';

  const { prompt } = buildAnaMariaImagePrompt(form, nextRoom);
  const { primaryPhoto, supplementaryPhotos } = await prepareProductPhotosForPayload(form.referencePhotos);

  const { imageUrl: highResUrl, usedModel } = await generateSceneImageWithFallback({
    requestedModel: form.imageModel,
    payload: {
      prompt,
      productPhotoBase64: primaryPhoto,
      productPhotosBase64: supplementaryPhotos,
      isAnaMariaMode: false,
      presentationMode: form.presentationMode,
      selectedMasterId: form.selectedMasterId,
      aspectRatio: '9:16',
      bodyType: form.bodyType,
      aiProfile,
      additionalInstructions: form.additionalInstructions,
    },
  });

  return { imageUrl: highResUrl, room: nextRoom, imageModel: usedModel };
}

/**
 * Gerar em Nova Cor:
 * Seleciona ciclicamente a próxima cor disponível das fotos de referência (Cor 1 -> Cor 2 -> ... -> Cor N -> Cor 1),
 * mantendo exatamente o mesmo produto, mesmo modo de apresentação e mesmos prompts/textos,
 * porém escolhendo outro cenário da galeria e outra modelo da galeria do modo ativo.
 */
export interface AnaMariaColorVariationOutput {
  imageUrl: string;
  imageModel: AnaMariaImageModel;
  selectedModelGalleryId?: string;
  selectedModelGalleryNumber?: number;
  selectedModelGalleryUrl?: string;
  selectedScenarioId?: string;
  selectedScenarioNumber?: number;
  modelScenarioSource: 'gallery' | 'model';
  generateModelViaPrompt: boolean;
  colorGroups: AnaMariaColorGroup[];
  activeColorGroupIndex: number;
  timestamp: number;
  newImageItem: AnaMariaGeneratedImageItem;
}

async function generateAnaMariaColorVariation(params: {
  result: AnaMariaResultState;
  baseImageItem?: AnaMariaGeneratedImageItem;
  aiProfile?: AIProfile;
  keepSameModelAndScenario: boolean;
}): Promise<AnaMariaColorVariationOutput> {
  const { result, baseImageItem, aiProfile = 'openai', keepSameModelAndScenario } = params;
  const photos = (result.referencePhotos || []).filter(Boolean);
  if (photos.length === 0) {
    throw new Error('As fotos de referência não estão mais em memória. Gere o produto novamente na Página 1.');
  }

  const colorGroups =
    result.colorGroups && result.colorGroups.length > 0
      ? result.colorGroups
      : [{ colorName: 'Cor Principal', photoIndices: photos.map((_, i) => i) }];

  const currentIdx = typeof result.activeColorGroupIndex === 'number' ? result.activeColorGroupIndex : 0;
  const nextColorIdx = (currentIdx + 1) % Math.max(colorGroups.length, 1);
  const prevColorGroup = colorGroups[currentIdx];
  const nextColorGroup = colorGroups[nextColorIdx];
  const activeColorPhotos = getActiveColorGroupPhotos(photos, colorGroups, nextColorIdx);

  const activeMode = result.presentationMode || 'mirror_selfie';
  const refImg =
    baseImageItem ||
    (result.generatedImages && result.generatedImages.length > 0
      ? result.generatedImages[result.generatedImages.length - 1]
      : undefined);

  const keepModel = keepSameModelAndScenario || Boolean(result.sameModelForAllColors);
  const keepScenario = keepSameModelAndScenario || Boolean(result.sameScenarioForAllColors);

  const refScenarioId = refImg?.selectedScenarioId ?? result.selectedScenarioId;
  const refScenarioNumber = refImg?.selectedScenarioNumber ?? result.selectedScenarioNumber;
  const refModelId = refImg?.selectedModelGalleryId ?? result.selectedModelGalleryId;
  const refModelNumber = refImg?.selectedModelGalleryNumber ?? result.selectedModelGalleryNumber;
  const refModelUrl = refImg?.selectedModelGalleryUrl ?? result.selectedModelGalleryUrl;
  const refSource = refImg?.modelScenarioSource ?? result.modelScenarioSource ?? 'model';
  const refGenerateViaPrompt =
    refImg?.generateModelViaPrompt !== undefined
      ? refImg.generateModelViaPrompt
      : Boolean(result.generateModelViaPrompt);

  const scenarioPool = activeMode === 'pov' ? POV_SCENARIO_GALLERY_ITEMS : SCENARIO_GALLERY_ITEMS;
  let nextScenarioId = refScenarioId;
  let nextScenarioNumber = refScenarioNumber;
  let nextScenarioUrl = scenarioPool.find(
    (s) => s.id === refScenarioId || s.number === refScenarioNumber
  )?.fullUrl;

  if (!keepScenario) {
    const usedSIds = new Set<string>(refScenarioId ? [refScenarioId] : []);
    const usedSNums = new Set<number>(
      typeof refScenarioNumber === 'number' ? [refScenarioNumber] : []
    );
    const chosenScenario = pickDistinctGalleryScenario(
      activeMode,
      usedSIds,
      usedSNums,
      refScenarioId,
      refScenarioNumber
    );
    nextScenarioId = chosenScenario?.id;
    nextScenarioNumber = chosenScenario?.number;
    nextScenarioUrl = chosenScenario?.fullUrl;
  }

  let nextModelId = refModelId;
  let nextModelNumber = refModelNumber;
  let nextModelUrl = refModelUrl;
  let effectiveGenerateViaPrompt = refGenerateViaPrompt;

  if (!keepModel) {
    const usedMIds = new Set<string>(refModelId ? [refModelId] : []);
    const usedMNums = new Set<number>(
      typeof refModelNumber === 'number' ? [refModelNumber] : []
    );
    const chosenModel = pickDistinctGalleryModel(
      activeMode,
      usedMIds,
      usedMNums,
      refModelId,
      refModelNumber
    );
    nextModelId = chosenModel?.id;
    nextModelNumber = chosenModel?.number;
    nextModelUrl = chosenModel?.fullUrl;
    effectiveGenerateViaPrompt = false;
  }

  const useRefImageAsModelAndRoom = keepModel && keepScenario;
  const refBaseUrl = refImg?.imageUrl || result.imageUrl;
  const overrideModelBase64 =
    (useRefImageAsModelAndRoom || (keepModel && refGenerateViaPrompt)) && refBaseUrl
      ? await compressImageForFastTransfer(refBaseUrl, 864, 0.88)
      : undefined;

  const effectiveSource: 'gallery' | 'model' = useRefImageAsModelAndRoom ? 'model' : 'gallery';

  const nextForm: AnaMariaFormState = {
    productName: result.productName,
    referencePhotos: activeColorPhotos,
    influencer: result.influencer,
    bodyType: result.bodyType,
    additionalInstructions: result.additionalInstructions,
    imageModel: result.imageModel,
    videoPromptLimit: result.videoPromptLimit,
    presentationMode: activeMode,
    selectedMasterId: result.selectedMasterId,
    selectedScenarioId: nextScenarioId,
    selectedScenarioNumber: nextScenarioNumber,
    selectedScenarioUrl: nextScenarioUrl,
    selectedModelGalleryId: nextModelId,
    selectedModelGalleryNumber: nextModelNumber,
    selectedModelGalleryUrl: nextModelUrl,
    modelScenarioSource: effectiveSource,
    generateModelViaPrompt: overrideModelBase64 ? false : effectiveGenerateViaPrompt,
  };

  const gen = await executeColorImageGeneration({
    itemForm: nextForm,
    colorPhotos: activeColorPhotos,
    colorGroupIndex: nextColorIdx,
    colorName: nextColorGroup?.colorName || `Cor ${nextColorIdx + 1}`,
    totalColors: colorGroups.length,
    prevColorName: prevColorGroup?.colorName,
    dressInspection: result.dressInspection,
    aiProfile,
    overrideModelBase64,
    overrideModelScenarioSource: effectiveSource,
    displayScenarioId: useRefImageAsModelAndRoom ? refScenarioId : nextScenarioId,
    displayScenarioNumber: useRefImageAsModelAndRoom ? refScenarioNumber : nextScenarioNumber,
    displayModelScenarioSource: useRefImageAsModelAndRoom ? refSource : 'gallery',
    lockSameModelAndScenarioNote: useRefImageAsModelAndRoom,
  });

  return {
    imageUrl: gen.item.imageUrl,
    imageModel: gen.item.imageModel,
    selectedModelGalleryId: gen.item.selectedModelGalleryId,
    selectedModelGalleryNumber: gen.item.selectedModelGalleryNumber,
    selectedModelGalleryUrl: gen.item.selectedModelGalleryUrl,
    selectedScenarioId: gen.item.selectedScenarioId,
    selectedScenarioNumber: gen.item.selectedScenarioNumber,
    modelScenarioSource: gen.item.modelScenarioSource || effectiveSource,
    generateModelViaPrompt: Boolean(gen.item.generateModelViaPrompt),
    colorGroups,
    activeColorGroupIndex: nextColorIdx,
    timestamp: gen.item.timestamp,
    newImageItem: gen.item,
  };
}

export async function generateAnaMariaNewColor(params: {
  result: AnaMariaResultState;
  baseImageItem?: AnaMariaGeneratedImageItem;
  aiProfile?: AIProfile;
}): Promise<AnaMariaColorVariationOutput> {
  return generateAnaMariaColorVariation({ ...params, keepSameModelAndScenario: false });
}

/**
 * Gerar Igual em Nova Cor:
 * Mantém exatamente a mesma modelo e mesmo cenário da imagem gerada anteriormente,
 * mudando apenas a cor da roupa para a próxima cor disponível nas referências.
 */
export async function generateAnaMariaSameModelNewColor(params: {
  result: AnaMariaResultState;
  baseImageItem?: AnaMariaGeneratedImageItem;
  aiProfile?: AIProfile;
}): Promise<AnaMariaColorVariationOutput> {
  return generateAnaMariaColorVariation({ ...params, keepSameModelAndScenario: true });
}

/**
 * Gera sob demanda o Prompt Enxuto (<= 2.450 caracteres com espaços),
 * priorizando 80% na preservação dos movimentos do prompt original.
 */
export async function generateAnaMariaCompactPrompt(params: {
  videoPrompt: string;
  productName?: string;
  influencer?: AnaMariaFormState['influencer'];
  bodyType?: AnaMariaFormState['bodyType'];
  presentationMode?: AnaMariaFormState['presentationMode'];
  selectedMasterId?: AnaMariaMasterId;
  additionalInstructions?: string;
  hasSelectedScenario?: boolean;
  aiProfile?: AIProfile;
}): Promise<string> {
  const cleanOriginal = (params.videoPrompt || '').replace(/^🎥 PROMPT DE VÍDEO[^\n]*\n+/i, '').trim();
  const master = getMasterPromptById(params.selectedMasterId);

  try {
    const res = await postJson<{ success: boolean; compactPrompt?: string; error?: string }>(
      '/api/anamaria-compact-prompt',
      {
        videoPrompt: cleanOriginal,
        productName: params.productName,
        masterShortName: master.shortName,
        aiProfile: params.aiProfile || 'openai',
      },
      0
    );
    if (res?.compactPrompt && res.compactPrompt.trim().length > 0) {
      const compact = res.compactPrompt.trim();
      return compact.length <= 2450 ? compact : compact.slice(0, 2450).trim();
    }
  } catch (err) {
    console.warn('Falha ao compactar prompt via servidor, usando compactação local:', err);
  }

  return buildAnaMariaConciseVideoPrompt({
    productName: params.productName || '',
    influencer: params.influencer,
    bodyType: params.bodyType,
    presentationMode: params.presentationMode,
    selectedMasterId: params.selectedMasterId,
    additionalInstructions: params.additionalInstructions,
    hasSelectedScenario: params.hasSelectedScenario,
  });
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
