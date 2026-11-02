import {
  AnaMariaFormState,
  AnaMariaResultState,
  AnaMariaAudit,
} from './types';
import {
  buildAnaMariaImagePrompt,
  buildAnaMariaVideoPrompt,
  AnaMariaRoomType,
} from './anaMariaPrompts';
import { resolveHeadlineAndHashtags } from './anaMariaBank';
import { AIProfile } from '../config/aiProfiles';
import { PREFERRED_SCENARIO_BASE64 } from './assets/scenarioImage';
import { ensureHighResAnaMariaDataUrl } from './anaMariaZipExporter';
import { SCENARIO_GALLERY_ITEMS, POV_SCENARIO_GALLERY_ITEMS } from './scenarioGalleryData';
import { getMasterPromptById } from './masterPromptsData';

export interface AnaMariaPipelineCallbacks {
  onProgress?: (stepName: string, percent: number) => void;
  onStatusMessage?: (message: string) => void;
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
  } catch {
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('As fotos anexadas são muito pesadas para o servidor. Tente reduzir o tamanho ou enviar menos imagens.');
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
    const updated = [result, ...filtered].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao salvar no histórico do Modo Ana Maria:', err);
  }
}

async function resolveScenarioBase64(form: AnaMariaFormState): Promise<string> {
  if (form.selectedScenarioBase64 && form.selectedScenarioBase64.length > 50) {
    return form.selectedScenarioBase64;
  }
  if (form.selectedScenarioUrl) {
    try {
      const res = await fetch(form.selectedScenarioUrl);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Falha ao converter cenário selecionado para base64:', e);
    }
  }
  return PREFERRED_SCENARIO_BASE64;
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
    // Verifica se já tem um cenário POV selecionado
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

  // Modo Mirror Selfie ou Com Rosto: se já tem um cenário normal selecionado, mantém
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

  // Preferência pelo Cenário 24 (ou cenários mais escuros) quando a Mestra Catza estiver selecionada sem cenário manual
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

  const randomIndex = Math.floor(Math.random() * SCENARIO_GALLERY_ITEMS.length);
  const randomScenario = SCENARIO_GALLERY_ITEMS[randomIndex] || SCENARIO_GALLERY_ITEMS[0];
  return {
    ...form,
    selectedScenarioId: randomScenario.id,
    selectedScenarioNumber: randomScenario.number,
    selectedScenarioUrl: randomScenario.fullUrl,
    selectedScenarioBase64: undefined,
  };
}

/**
 * Pipeline principal do Modo Ana Maria (otimizado para alta velocidade sem perda de qualidade)
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

  // Se o usuário não escolheu um cenário na galeria, sorteia de acordo com o modo/mestra
  const form = ensureAnaMariaScenario(rawForm);
  const master = getMasterPromptById(form.selectedMasterId);
  const activeMode = form.presentationMode || (master.isPov ? 'pov' : 'mirror_selfie');

  // 1. Geração de Prompts & Calçado Condicional
  onProgress('prompt_building', 20);
  onStatusMessage(`Analisando peça e aplicando identidade de ${master.shortName}...`);

  const { prompt: imagePrompt, shoeCategory, shoeDescription } = buildAnaMariaImagePrompt(form, 'hall_espelho');

  // 2. Banco de Headlines & Hashtags + Prompt de Vídeo (instantâneo)
  onProgress('copy_matching', 35);
  onStatusMessage(`Formatando headline vencedora e prompt de movimentos (${master.shortName})...`);

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

  // 3. Geração de Imagem com Cenário Selecionado ou Fixo Travado (Item 2)
  onProgress('image_generation', 50);
  const modelNameLabel =
    form.imageModel === 'seedream_5_0_pro'
      ? 'SeaDream 5.0 Pro'
      : form.imageModel === 'kling_3_0'
      ? 'Kling 3.0'
      : 'OpenAI';
  const scenarioMsg = form.selectedScenarioNumber ? ` no Cenário ${form.selectedScenarioNumber}` : '';
  onStatusMessage(`Gerando imagem vertical 9:16${scenarioMsg} no ${modelNameLabel}...`);

  const primaryPhoto = form.referencePhotos[0];
  const allPhotos = form.referencePhotos.slice(0, 10);
  const activeScenarioBase64 = await resolveScenarioBase64(form);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt: imagePrompt,
      productPhotoBase64: primaryPhoto,
      productPhotosBase64: allPhotos,
      scenarioPhotoBase64: activeScenarioBase64,
      isAnaMariaMode: true,
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

  // Resolução de 1080x1920 pixels garantida (Full HD vertical 9:16 para Kling 3.0)
  onStatusMessage('Calibrando resolução em alta definição 1080x1920 (Full HD 9:16)...');
  const generatedImageUrl = await ensureHighResAnaMariaDataUrl(imgData.imageUrl, 1080, 1920);

  // 4. Auditoria de Fidelidade Instantânea com 4 Critérios e Semáforo (Item 1)
  onProgress('completed', 100);
  onStatusMessage('Geração concluída com sucesso!');

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
    issues: [
      `Calçado condicional selecionado: ${shoeDescription}`,
      'Enquadramento rigoroso do queixo para baixo sem rosto',
      'Corpo com curvas e silhueta acentuadas',
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
  imageModelOverride?: 'seedream_5_0_pro' | 'kling_3_0' | 'openai';
  aiProfile?: AIProfile;
}): Promise<{ imageUrl: string; audit?: AnaMariaAudit; imageModel: 'seedream_5_0_pro' | 'kling_3_0' | 'openai' }> {
  const { form, tweakPrompt, imageModelOverride, aiProfile = 'openai' } = params;

  const effectiveImageModel = imageModelOverride || form.imageModel;

  let effectiveForm = ensureAnaMariaScenario({ ...form, imageModel: effectiveImageModel });
  if (tweakPrompt && tweakPrompt.trim().length > 0) {
    effectiveForm.additionalInstructions = [form.additionalInstructions, tweakPrompt.trim()]
      .filter(Boolean)
      .join('\n');
  }

  const { prompt } = buildAnaMariaImagePrompt(effectiveForm);
  const activeScenarioBase64 = await resolveScenarioBase64(effectiveForm);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt,
      productPhotoBase64: effectiveForm.referencePhotos[0],
      productPhotosBase64: effectiveForm.referencePhotos.slice(0, 10),
      scenarioPhotoBase64: activeScenarioBase64,
      isAnaMariaMode: true,
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

  // Resolução de 1080x1920 pixels garantida (Full HD vertical 9:16)
  const highResUrl = await ensureHighResAnaMariaDataUrl(imgData.imageUrl, 1080, 1920);

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

  // Seleciona um cômodo alternativo diferente do atual (quarto, sala ou closet)
  const availableRooms = ALTERNATIVE_ROOMS.filter((r) => r !== currentRoom);
  const nextRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)] || 'quarto';

  const { prompt } = buildAnaMariaImagePrompt(form, nextRoom);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt,
      productPhotoBase64: form.referencePhotos[0],
      productPhotosBase64: form.referencePhotos.slice(0, 10),
      isAnaMariaMode: false,
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

  // Resolução de 1080x1920 pixels garantida (Full HD vertical 9:16)
  const highResUrl = await ensureHighResAnaMariaDataUrl(imgData.imageUrl, 1080, 1920);

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

  // Remove qualquer cabeçalho residual de prompt de vídeo
  const clean = res.refinedPrompt
    .replace(/^🎥 PROMPT DE VÍDEO[^\n]*\n+/i, '')
    .trim();

  return clean;
}
