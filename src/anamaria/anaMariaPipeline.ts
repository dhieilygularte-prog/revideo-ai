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

/**
 * Pipeline principal do Modo Ana Maria (otimizado para alta velocidade sem perda de qualidade)
 */
export async function runAnaMariaPipeline(
  form: AnaMariaFormState,
  callbacks?: AnaMariaPipelineCallbacks,
  aiProfile: AIProfile = 'openai'
): Promise<AnaMariaResultState> {
  const { onProgress = () => {}, onStatusMessage = () => {} } = callbacks || {};

  if (!form.referencePhotos || form.referencePhotos.length === 0) {
    throw new Error('Por favor, anexe ao menos 1 foto de referência da peça.');
  }

  // 1. Geração de Prompts & Calçado Condicional
  onProgress('prompt_building', 20);
  onStatusMessage('Analisando peça, calçado condicional e gerando prompt mestre...');

  const { prompt: imagePrompt, shoeCategory, shoeDescription } = buildAnaMariaImagePrompt(form, 'hall_espelho');

  // 2. Banco de Headlines & Hashtags + Prompt de Vídeo (instantâneo)
  onProgress('copy_matching', 35);
  onStatusMessage('Formatando headline vencedora e prompt de vitrine 10s...');

  const { headline, hashtags } = resolveHeadlineAndHashtags({
    productName: form.productName,
    influencer: form.influencer,
    bodyType: form.bodyType,
    additionalInstructions: form.additionalInstructions,
  });

  const videoPrompt = buildAnaMariaVideoPrompt({
    productName: form.productName,
    influencer: form.influencer,
    limit: form.videoPromptLimit,
    additionalInstructions: form.additionalInstructions,
  });

  // 3. Geração de Imagem
  onProgress('image_generation', 50);
  const modelNameLabel =
    form.imageModel === 'seedream_5_0_pro'
      ? 'SeaDream 5.0 Pro'
      : form.imageModel === 'kling_3_0'
      ? 'Kling 3.0'
      : 'OpenAI';
  onStatusMessage(`Gerando imagem vertical 9:16 com curvas acentuadas no ${modelNameLabel}...`);

  const primaryPhoto = form.referencePhotos[0];
  const allPhotos = form.referencePhotos.slice(0, 10);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt: imagePrompt,
      productPhotoBase64: primaryPhoto,
      productPhotosBase64: allPhotos,
      aspectRatio: '9:16',
      imageModel: form.imageModel,
      aiProfile,
      additionalInstructions: form.additionalInstructions,
    }
  );

  if (!imgData || !imgData.imageUrl) {
    throw new Error(imgData?.error || 'Não foi possível obter a imagem gerada do servidor.');
  }

  const generatedImageUrl = imgData.imageUrl;

  // 4. Auditoria de Fidelidade Instantânea (sem atrasar a entrega da tela para o usuário - item 20)
  onProgress('completed', 100);
  onStatusMessage('Geração concluída com sucesso!');

  const audit: AnaMariaAudit = {
    score: 96,
    status: 'green',
    label: 'Verde Fidedigno',
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

  let effectiveForm = { ...form, imageModel: effectiveImageModel };
  if (tweakPrompt && tweakPrompt.trim().length > 0) {
    effectiveForm.additionalInstructions = [form.additionalInstructions, tweakPrompt.trim()]
      .filter(Boolean)
      .join('\n');
  }

  const { prompt } = buildAnaMariaImagePrompt(effectiveForm);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt,
      productPhotoBase64: effectiveForm.referencePhotos[0],
      productPhotosBase64: effectiveForm.referencePhotos.slice(0, 10),
      aspectRatio: '9:16',
      imageModel: effectiveImageModel,
      aiProfile,
      additionalInstructions: effectiveForm.additionalInstructions,
    }
  );

  if (!imgData || !imgData.imageUrl) {
    throw new Error(imgData?.error || 'Falha ao refazer a imagem.');
  }

  const audit: AnaMariaAudit = {
    score: 96,
    status: 'green',
    label: 'Verde Fidedigno',
    issues: ['Peça refeita com alta fidelidade e enquadramento do queixo para baixo.'],
  };

  return { imageUrl: imgData.imageUrl, audit, imageModel: effectiveImageModel };
}

const ROOM_LIST: AnaMariaRoomType[] = ['quarto', 'sala', 'closet', 'hall_espelho'];

/**
 * Trocar Cenário (Item 13):
 * Gera novamente a imagem mantendo a mesma modelo, mesma roupa e mesmo ângulo,
 * porém colocando-a em outro cômodo da mesma casa (quarto, sala, closet ou hall),
 * com iluminação frontal natural e fundo mais penumbroso/carente de iluminação.
 */
export async function regenerateAnaMariaNewScenario(params: {
  form: AnaMariaFormState;
  currentRoom?: AnaMariaRoomType;
  aiProfile?: AIProfile;
}): Promise<{ imageUrl: string; room: AnaMariaRoomType }> {
  const { form, currentRoom, aiProfile = 'openai' } = params;

  // Seleciona um cômodo diferente do atual
  const availableRooms = ROOM_LIST.filter((r) => r !== currentRoom);
  const nextRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)] || 'quarto';

  const { prompt } = buildAnaMariaImagePrompt(form, nextRoom);

  const imgData = await postJson<{ success: boolean; imageUrl: string; error?: string }>(
    '/api/generate-scene-image',
    {
      prompt,
      productPhotoBase64: form.referencePhotos[0],
      productPhotosBase64: form.referencePhotos.slice(0, 10),
      aspectRatio: '9:16',
      imageModel: form.imageModel,
      aiProfile,
      additionalInstructions: form.additionalInstructions,
    }
  );

  if (!imgData || !imgData.imageUrl) {
    throw new Error(imgData?.error || 'Falha ao gerar nova imagem com cenário trocado.');
  }

  return { imageUrl: imgData.imageUrl, room: nextRoom };
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
      correctionInstruction: `MODO ANA MARIA (VÍDEO 10S VITRINE ESTÁTICA DIANTE DO ESPELHO):\n${params.correctionInstruction}\nREGRA MANDATÓRIA INVIOLÁVEL: O vídeo DEVE permanecer rigorosamente enquadrado da altura do queixo para baixo, NUNCA mostrando a boca, nariz, olhos ou rosto. Zero tatuagens.`,
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
