import { AnaMariaResultState } from './types';
import { getMasterPromptById } from './masterPromptsData';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function sanitizeCleanName(name: string): string {
  const clean = (name || 'Produto')
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || 'Produto';
}

/**
 * Formata o horário de geração no padrão "HH.mm.ss" (ex: 11.12.56)
 * Compatível com todos os sistemas operacionais (Windows, Mac, Linux, Android, iOS)
 */
export function formatTimeForFilename(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}.${minutes}.${seconds}`;
}

export function getImageModelLabel(imageModel?: string): string {
  switch (imageModel) {
    case 'seedream_5_0_pro':
      return 'Seedream 5.0 Pro';
    case 'seedream_4_5':
      return 'Seedream 4.5';
    case 'kling_3_0':
      return 'Kling 3.0 Omni';
    case 'kling_o3_fal':
      return 'Kling O3 Omni Fal.ai';
    case 'flux_2_pro_edit':
      return 'FLUX 2 Pro';
    case 'openai':
      return 'OpenAI';
    default:
      return imageModel ? imageModel.replace(/_/g, ' ') : '';
  }
}

export function buildImageFileName(
  productName: string,
  timestamp?: number,
  imageModel?: string,
  ext = 'jpg'
): string {
  const cleanName = sanitizeCleanName(productName);
  const timeStr = formatTimeForFilename(timestamp);
  const modelLabel = getImageModelLabel(imageModel);
  const suffix = modelLabel ? ` ${modelLabel}` : '';
  return `${cleanName} ${timeStr}${suffix}.${ext}`;
}

export function getMasterPromptFileName(result: AnaMariaResultState): string {
  const cleanName = sanitizeCleanName(result.productName);
  const timeStr = formatTimeForFilename(result.timestamp);
  if (result.selectedMasterId) {
    const master = getMasterPromptById(result.selectedMasterId);
    // Limpa prefixo numérico ("05. ") e notas entre parênteses: "05. Mestra Catza (Flash / Com Rosto)" -> "Mestra Catza"
    const masterCleanName = master.shortName
      .replace(/^\d+[\.\s-]*/, '')
      .replace(/\s*\(.*?\)/g, '')
      .trim();
    return `${masterCleanName} - ${cleanName} ${timeStr}.txt`;
  }
  return `Prompt de Video - ${cleanName} ${timeStr}.txt`;
}

/**
 * Garante que a imagem gerada esteja em alta resolução vertical 9:16 preservando 100% da nitidez óptica.
 * Se a imagem já for nativa de alta resolução (altura >= 1600 e largura >= 900), preserva os bytes originais intactos,
 * evitando a perda de nitidez e o efeito embaçado da reamostragem bilinear de canvas.
 */
export async function ensureHighResAnaMariaDataUrl(
  inputUrlOrBase64: string,
  targetWidth = 1080,
  targetHeight = 1920
): Promise<string> {
  if (typeof window === 'undefined' || !inputUrlOrBase64) return inputUrlOrBase64;

  let resolvedSrc = inputUrlOrBase64;
  if (resolvedSrc.startsWith('http://') || resolvedSrc.startsWith('https://')) {
    try {
      const proxyRes = await fetch('/api/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'proxy_image', imageUrl: resolvedSrc }),
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData?.success && typeof proxyData.imageUrl === 'string' && proxyData.imageUrl.startsWith('data:image/')) {
          resolvedSrc = proxyData.imageUrl;
        }
      }
    } catch (err) {
      console.warn('Fallback para URL direta na calibração Full HD:', err);
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Se a imagem já é de alta resolução nativa (ex: 1024x1792 da OpenAI, 1440x2560 do Seedream, 2K do Kling),
        // PRESERVE A IMAGEM ORIGINAL 100% INTACTA!
        // Redesenhar no canvas com drawImage aplica interpolação que borra e tira a nitidez original da IA.
        const currentRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight; // 1080 / 1920 = 0.5625
        const isAlreadyHighRes = img.height >= 1600 && img.width >= 900 && Math.abs(currentRatio - targetRatio) < 0.08;

        if (isAlreadyHighRes) {
          resolve(resolvedSrc);
          return;
        }

        if (img.width === targetWidth && img.height === targetHeight && resolvedSrc.startsWith('data:image/')) {
          resolve(resolvedSrc);
          return;
        }

        // Apenas para imagens de menor resolução fazemos o upscaling no canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(resolvedSrc);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.99);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Erro ao redimensionar imagem para 1080x1920 no canvas:', err);
        resolve(resolvedSrc);
      }
    };
    img.onerror = () => {
      resolve(resolvedSrc);
    };
    img.src = resolvedSrc;
  });
}

/**
 * Converte qualquer imagem ou dataURL para Blob com resolução de alta definição preservada.
 */
export async function ensureHighResAnaMariaBlob(
  inputUrlOrBase64: string,
  targetWidth = 1080,
  targetHeight = 1920
): Promise<Blob> {
  if (typeof window === 'undefined') return new Blob([]);
  try {
    const dataUrl = await ensureHighResAnaMariaDataUrl(inputUrlOrBase64, targetWidth, targetHeight);
    const r = await fetch(dataUrl);
    return await r.blob();
  } catch (err) {
    console.warn('Fallback no ensureHighResAnaMariaBlob:', err);
    try {
      const direct = await fetch(inputUrlOrBase64);
      return await direct.blob();
    } catch {
      return new Blob([]);
    }
  }
}

/**
 * Baixa a imagem individual com resolução de alta fidelidade
 * Nomenclatura: "[Nome da Peça] [Hora da Geração] [Gerador].[ext]"
 * Exemplo: "Vestido Tubinho 14.10.05 Seedream 5.0 Pro.jpg"
 */
export async function downloadAnaMariaSingleImage(
  imageUrl: string,
  productName: string,
  timestamp?: number,
  imageModel?: string
) {
  const isPng = imageUrl.startsWith('data:image/png');
  const ext = isPng ? 'png' : 'jpg';
  const fileName = buildImageFileName(productName, timestamp, imageModel, ext);

  try {
    const blob = await ensureHighResAnaMariaBlob(imageUrl, 1080, 1920);
    downloadBlob(blob, fileName);
  } catch (err) {
    console.warn('Erro ao baixar imagem via blob de alta resolução:', err);
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Exporta o pacote .zip (Item 23 e Item 8):
 * - Imagem: "[Nome da Peça] [Hora da Geração] [Gerador].[ext]"
 * - Doc 1: "Hastags e Headline - [Nome da Peça] [Hora da Geração].txt"
 * - Doc 2: "Prompt de Video - [Nome da Peça] [Hora da Geração].txt"
 * - Nome do ZIP: "[Nome da Peça] [Hora da Geração] [Gerador].zip"
 * - Sem subpastas adicionais (todos os arquivos na raiz do .zip)
 */
export async function exportAnaMariaZip(result: AnaMariaResultState): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const cleanName = sanitizeCleanName(result.productName);
  const timeStr = formatTimeForFilename(result.timestamp);
  const modelLabel = getImageModelLabel(result.imageModel);
  const isPng = result.imageUrl.startsWith('data:image/png');
  const ext = isPng ? 'png' : 'jpg';

  // 1. Imagem Principal: "[Nome da Peça] [Hora da Geração] [Gerador].[ext]"
  const imageFileName = buildImageFileName(result.productName, result.timestamp, result.imageModel, ext);
  try {
    const imgBlob = await ensureHighResAnaMariaBlob(result.imageUrl, 1080, 1920);
    const imgBuffer = await imgBlob.arrayBuffer();
    zip.file(imageFileName, imgBuffer);
  } catch (err) {
    console.warn('Falha ao adicionar imagem de alta resolução no zip:', err);
  }

  // 2. Doc de Hashtags e Headline: "Hastags e Headline - [Nome da Peça] [Hora da Geração].txt"
  const hashtagsAndHeadlineContent = `HEADLINE:
${result.headline}

HASHTAGS:
${result.hashtags}
`;
  zip.file(`Hastags e Headline - ${cleanName} ${timeStr}.txt`, hashtagsAndHeadlineContent);

  // 3. Doc do Prompt de Vídeo: "[Mestra/Prompt] - [Nome da Peça] [Hora da Geração].txt"
  const cleanVideoPrompt = result.videoPrompt
    .replace(/^🎥 PROMPT DE VÍDEO[^\n]*\n+/i, '')
    .trim();
  const videoPromptFileName = getMasterPromptFileName(result);
  zip.file(videoPromptFileName, cleanVideoPrompt);

  if (result.conciseVideoPrompt && result.conciseVideoPrompt.trim() !== cleanVideoPrompt) {
    const conciseFileName = videoPromptFileName.replace(/\.txt$/i, ' - Prompt Enxuto (2500).txt');
    zip.file(conciseFileName, result.conciseVideoPrompt.trim());
  }

  // Gerar e baixar arquivo .zip com o nome "[Nome da Peça] [Hora da Geração] [Gerador].zip"
  const zipFileName = `${cleanName} ${timeStr}${modelLabel ? ` ${modelLabel}` : ''}.zip`;
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  downloadBlob(zipBlob, zipFileName);
}
