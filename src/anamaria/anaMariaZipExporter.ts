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

export function getMasterPromptFileName(result: AnaMariaResultState): string {
  const cleanName = sanitizeCleanName(result.productName);
  const horaStr = formatTimestampForFile(result.timestamp);
  if (result.selectedMasterId) {
    const master = getMasterPromptById(result.selectedMasterId);
    // Limpa prefixo numérico ("05. ") e notas entre parênteses: "05. Mestra Catza (Flash / Com Rosto)" -> "Mestra Catza"
    const masterCleanName = master.shortName
      .replace(/^\d+[\.\s-]*/, '')
      .replace(/\s*\(.*?\)/g, '')
      .trim();
    return `${masterCleanName} - ${cleanName} (${horaStr}).txt`;
  }
  return `Prompt de Video - ${cleanName} (${horaStr}).txt`;
}

function formatTimestampForFile(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month} as ${hours}h${minutes}`;
}

/**
 * Garante que a imagem gerada esteja na resolução ideal de 1080x1920 pixels (Full HD vertical 9:16)
 * com máxima nitidez e interpolação de alta qualidade para o Kling 3.0 Omni / TikTok.
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
        if (img.width === targetWidth && img.height === targetHeight && resolvedSrc.startsWith('data:image/')) {
          resolve(resolvedSrc);
          return;
        }
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
        // Qualidade 0.99 em JPEG: Máxima pureza visual e preservação total de microtexturas para Kling 3.0
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
 * Converte qualquer imagem ou dataURL para Blob JPEG com 1080x1920 pixels garantidos.
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
 * Baixa a imagem individual com resolução de 1080x1920 pixels
 * Nomenclatura: "[Nome do Produto] Aurora.jpg"
 */
export async function downloadAnaMariaSingleImage(imageUrl: string, productName: string) {
  const cleanName = sanitizeCleanName(productName);
  const fileName = `${cleanName} Aurora.jpg`;

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
 * - Imagem em 1080x1920 pixels: "[Nome do Produto] Aurora.jpg"
 * - Doc 1: "Hastags e Headline - [Nome do Produto] (hora da geração).txt"
 * - Doc 2: "Prompt de Video - [Nome do Produto] (hora da geração).txt"
 * - Nome do ZIP: "Modo Ana Maria - [Nome do Produto].zip"
 * - Sem subpastas adicionais (todos os arquivos na raiz do .zip)
 */
export async function exportAnaMariaZip(result: AnaMariaResultState): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const cleanName = sanitizeCleanName(result.productName);
  const horaStr = formatTimestampForFile(result.timestamp);

  // 1. Imagem Principal em 1080x1920 pixels: "[Nome do Produto] Aurora.jpg"
  try {
    const imgBlob = await ensureHighResAnaMariaBlob(result.imageUrl, 1080, 1920);
    const imgBuffer = await imgBlob.arrayBuffer();
    zip.file(`${cleanName} Aurora.jpg`, imgBuffer);
  } catch (err) {
    console.warn('Falha ao adicionar imagem de alta resolução no zip:', err);
  }

  // 2. Doc de Hashtags e Headline (sem caracteres estranhos ou pastas aninhadas)
  const hashtagsAndHeadlineContent = `HEADLINE:
${result.headline}

HASHTAGS:
${result.hashtags}
`;
  zip.file(`Hastags e Headline - ${cleanName} (${horaStr}).txt`, hashtagsAndHeadlineContent);

  // 3. Doc do Prompt de Vídeo (limpo, nomeado como Mestra [Nome] - [Produto] (data).txt)
  const cleanVideoPrompt = result.videoPrompt
    .replace(/^🎥 PROMPT DE VÍDEO[^\n]*\n+/i, '')
    .trim();
  const videoPromptFileName = getMasterPromptFileName(result);
  zip.file(videoPromptFileName, cleanVideoPrompt);

  // Gerar e baixar arquivo .zip com o nome "Modo Ana Maria - [Produto].zip"
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  downloadBlob(zipBlob, `Modo Ana Maria - ${cleanName}.zip`);
}
