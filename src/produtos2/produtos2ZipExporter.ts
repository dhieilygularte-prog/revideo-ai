import { Produtos2ResultState } from './types';

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

export async function ensureHighResStoryboardBlob(
  imageUrl: string,
  targetWidth = 2160,
  targetHeight = 3840
): Promise<Blob> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    const res = await fetch(imageUrl);
    return await res.blob();
  }

  return new Promise<Blob>((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width || 0;
          const h = img.naturalHeight || img.height || 0;
          const isLandscape = w > h;
          const outW = isLandscape ? 3840 : targetWidth;
          const outH = isLandscape ? 2160 : targetHeight;

          const canvas = document.createElement('canvas');
          canvas.width = outW;
          canvas.height = outH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            fetch(imageUrl).then((r) => r.blob()).then(resolve).catch(() => resolve(new Blob()));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, outW, outH);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else fetch(imageUrl).then((r) => r.blob()).then(resolve).catch(() => resolve(new Blob()));
          }, 'image/png');
        } catch {
          fetch(imageUrl).then((r) => r.blob()).then(resolve).catch(() => resolve(new Blob()));
        }
      };
      img.onerror = () => fetch(imageUrl).then((r) => r.blob()).then(resolve).catch(() => resolve(new Blob()));
      img.src = imageUrl;
    } catch {
      fetch(imageUrl).then((r) => r.blob()).then(resolve).catch(() => resolve(new Blob()));
    }
  });
}

async function urlToUint8Array(url: string): Promise<Uint8Array> {
  try {
    const blob = await ensureHighResStoryboardBlob(url, 2160, 3840);
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return bytes;
    }
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }
}

export function sanitizeProductFileName(productName: string): string {
  const clean = (productName || 'Produto')
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || 'Produto';
}

export async function downloadProdutos2StoryboardImage(imageUrl: string, productName: string) {
  const blob = await ensureHighResStoryboardBlob(imageUrl, 2160, 3840);
  const baseName = sanitizeProductFileName(productName);
  downloadBlob(blob, `${baseName}.png`);
}

/**
 * Seção 2 — Baixar tudo: arquivo .zip com a imagem e um .txt com o prompt.
 * O nome do .txt e o nome da imagem = nome do produto (ex.: Roçadeira 2000W.txt, Roçadeira 2000W.png).
 * O .zip também leva o nome do produto.
 */
export async function exportProdutos2Zip(result: Produtos2ResultState): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const baseName = sanitizeProductFileName(result.productName);

  // 1. Arquivo .txt com o prompt do Veo 3
  zip.file(`${baseName}.txt`, result.veoPrompt);

  // 2. Imagem do storyboard .png
  if (result.storyboardImageUrl) {
    try {
      const bytes = await urlToUint8Array(result.storyboardImageUrl);
      zip.file(`${baseName}.png`, bytes);
    } catch (err) {
      console.warn('Erro ao anexar imagem do storyboard no zip:', err);
    }
  }

  // 3. Arquivo .txt com a Descrição do Post + Hashtags (Modo Ania portado para Produtos 2.0)
  if (result.description) {
    const descContent = `${result.description}

---
FALA USADA NO VÍDEO (${result.duration}s · ${result.copySourceLabel}):
"${result.finalCopy}"
`;
    zip.file(`descricao-${baseName}.txt`, descContent);
  }

  // 4. Gerar e baixar .zip com o nome do produto
  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${baseName}.zip`);
  } catch (e) {
    console.error('Erro ao gerar zip do Modo Produtos 2.0:', e);
  }
}
