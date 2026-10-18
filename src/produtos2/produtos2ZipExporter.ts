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

async function urlToUint8Array(url: string): Promise<Uint8Array> {
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

export function sanitizeProductFileName(productName: string): string {
  const clean = (productName || 'Produto')
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || 'Produto';
}

export function downloadProdutos2StoryboardImage(
  imageUrl: string,
  productName: string,
  sceneSuffix?: string
) {
  const baseName = sanitizeProductFileName(productName);
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = sceneSuffix ? `${baseName} - ${sceneSuffix}.png` : `${baseName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Seção 2 — Baixar tudo: arquivo .zip com a imagem e um .txt com o prompt.
 * O nome do .txt e o nome da imagem = nome do produto (ex.: Roçadeira 2000W.txt, Roçadeira 2000W.png).
 * No modo Duas Cenas (10s cada), inclui ambos os storyboards e ambos os prompts identificados por cena.
 * O .zip também leva o nome do produto.
 */
export async function exportProdutos2Zip(result: Produtos2ResultState): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const baseName = sanitizeProductFileName(result.productName);
  const isTwoScenes = result.sceneMode === '2_cenas_10s' && Boolean(result.scene2);

  if (isTwoScenes && result.scene2) {
    // 1. Arquivos .txt com os prompts das Cenas 1 e 2
    zip.file(`${baseName} - Prompt - Cena 1.txt`, result.veoPrompt);
    zip.file(`${baseName} - Prompt - Cena 2.txt`, result.scene2.veoPrompt);

    // 2. Imagens dos storyboards das Cenas 1 e 2
    if (result.storyboardImageUrl) {
      try {
        const bytes1 = await urlToUint8Array(result.storyboardImageUrl);
        zip.file(`${baseName} - Storyboard - Cena 1.png`, bytes1);
      } catch (err) {
        console.warn('Erro ao anexar imagem do storyboard da Cena 1 no zip:', err);
      }
    }
    if (result.scene2.storyboardImageUrl) {
      try {
        const bytes2 = await urlToUint8Array(result.scene2.storyboardImageUrl);
        zip.file(`${baseName} - Storyboard - Cena 2.png`, bytes2);
      } catch (err) {
        console.warn('Erro ao anexar imagem do storyboard da Cena 2 no zip:', err);
      }
    }

    // 3. Arquivo .txt com a Descrição do Post + Hashtags e as duas falas
    if (result.description) {
      const descContent = `${result.description}

---
FALA USADA NA CENA 1 (10s · ${result.copySourceLabel}):
"${result.finalCopy}"

FALA USADA NA CENA 2 (10s · ${result.scene2.copySourceLabel}):
"${result.scene2.finalCopy}"
`;
      zip.file(`descricao-${baseName}.txt`, descContent);
    }
  } else {
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
  }

  // 4. Gerar e baixar .zip com o nome do produto
  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${baseName}.zip`);
  } catch (e) {
    console.error('Erro ao gerar zip do Modo Produtos 2.0:', e);
  }
}
