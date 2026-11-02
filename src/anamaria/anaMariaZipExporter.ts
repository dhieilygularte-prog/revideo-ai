import { AnaMariaResultState } from './types';

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
  if (typeof window === 'undefined') return inputUrlOrBase64;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        if (img.width === targetWidth && img.height === targetHeight) {
          resolve(inputUrlOrBase64);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(inputUrlOrBase64);
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
        resolve(inputUrlOrBase64);
      }
    };
    img.onerror = () => {
      resolve(inputUrlOrBase64);
    };
    img.src = inputUrlOrBase64;
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
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fetch(inputUrlOrBase64)
            .then((r) => r.blob())
            .then(resolve)
            .catch(() => resolve(new Blob([])));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              fetch(inputUrlOrBase64)
                .then((r) => r.blob())
                .then(resolve)
                .catch(() => resolve(new Blob([])));
            }
          },
          'image/jpeg',
          0.99
        );
      } catch (err) {
        console.warn('Erro ao gerar blob 1080x1920 no canvas:', err);
        fetch(inputUrlOrBase64)
          .then((r) => r.blob())
          .then(resolve)
          .catch(() => resolve(new Blob([])));
      }
    };
    img.onerror = () => {
      fetch(inputUrlOrBase64)
        .then((r) => r.blob())
        .then(resolve)
        .catch(() => resolve(new Blob([])));
    };
    img.src = inputUrlOrBase64;
  });
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

  // 3. Doc do Prompt de Vídeo (limpo, sem cabeçalho "🎥 PROMPT DE VÍDEO...")
  const cleanVideoPrompt = result.videoPrompt
    .replace(/^🎥 PROMPT DE VÍDEO[^\n]*\n+/i, '')
    .trim();
  zip.file(`Prompt de Video - ${cleanName} (${horaStr}).txt`, cleanVideoPrompt);

  // Gerar e baixar arquivo .zip com o nome "Modo Ana Maria - [Produto].zip"
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  downloadBlob(zipBlob, `Modo Ana Maria - ${cleanName}.zip`);
}
