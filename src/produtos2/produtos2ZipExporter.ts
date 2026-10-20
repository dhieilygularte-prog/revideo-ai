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
  const isLeilao = result.sceneMode === 'modo_leilao' && Boolean(result.leilao);
  const isAchadinhos = result.sceneMode === 'modo_achadinhos' && Boolean(result.achadinhos);
  const isTwoScenes = result.sceneMode === '2_cenas_10s' && Boolean(result.scene2);

  if (isAchadinhos && result.achadinhos) {
    // 1. Arquivos .txt dos 3 prompts do Modo Achadinhos (Versão 5.0)
    zip.file('achadinhos_prompt_1.txt', result.achadinhos.bloco1.veoPrompt || result.veoPrompt || '');
    zip.file('achadinhos_prompt_2.txt', result.achadinhos.bloco2.veoPrompt || '');
    zip.file('achadinhos_prompt_3.txt', result.achadinhos.bloco3.veoPrompt || '');

    // 2. Imagens dos 3 storyboards horizontais 16:9
    if (result.achadinhos.bloco1.storyboardImageUrl) {
      try {
        const bytes1 = await urlToUint8Array(result.achadinhos.bloco1.storyboardImageUrl);
        zip.file('achadinhos_storyboard_1.png', bytes1);
      } catch (err) {
        console.warn('Erro ao anexar imagem do Storyboard 1 no zip:', err);
      }
    }
    if (result.achadinhos.bloco2.storyboardImageUrl) {
      try {
        const bytes2 = await urlToUint8Array(result.achadinhos.bloco2.storyboardImageUrl);
        zip.file('achadinhos_storyboard_2.png', bytes2);
      } catch (err) {
        console.warn('Erro ao anexar imagem do Storyboard 2 no zip:', err);
      }
    }
    if (result.achadinhos.bloco3.storyboardImageUrl) {
      try {
        const bytes3 = await urlToUint8Array(result.achadinhos.bloco3.storyboardImageUrl);
        zip.file('achadinhos_storyboard_3.png', bytes3);
      } catch (err) {
        console.warn('Erro ao anexar imagem do Storyboard 3 no zip:', err);
      }
    }

    // 3. Descrição do Post + Hashtags + Falas
    const desc = result.description || result.descriptionHashtags;
    if (desc) {
      const descContent = `${desc}

---
FALAS DO MODO AURORA ACHADINHOS (3 CENAS DE 10S):
Cena 1 (0-10s):
"${result.achadinhos.speeches.cena1}"

Cena 2 (10-20s):
"${result.achadinhos.speeches.cena2}"

Cena 3 (20-30s):
"${result.achadinhos.speeches.cena3}"
`;
      zip.file('achadinhos_descricao_post.txt', descContent);
    }
  } else if (isLeilao && result.leilao) {
    // 1. Arquivos .txt dos 3 blocos (Instrução 2 - Seção 6)
    zip.file('leilao_prompt_veo_1.txt', result.leilao.bloco1.veoPrompt || result.veoPrompt || '');
    zip.file('leilao_prompt_veo_2.txt', result.leilao.bloco2.veoPrompt || '');
    zip.file('leilao_prompt_veo_3.txt', result.leilao.bloco3.veoPrompt || '');

    // 2. Imagens dos 3 blocos (6 imagens verticais 9:16 independentes em 1080x1920)
    // Bloco 1: Imagem 1 (Salão aberto) e Imagem 2 (Leiloeiro chocado)
    const b1List =
      result.leilao.bloco1.images && result.leilao.bloco1.images.length > 0
        ? result.leilao.bloco1.images
        : result.leilao.bloco1.storyboardImageUrl
        ? [result.leilao.bloco1.storyboardImageUrl]
        : [];
    for (let i = 0; i < b1List.length; i++) {
      try {
        const bytes = await urlToUint8Array(b1List[i]);
        zip.file(`leilao_cena1_imagem${i + 1}.png`, bytes);
      } catch (err) {
        console.warn(`Erro ao anexar imagem ${i + 1} do Bloco 1 no zip:`, err);
      }
    }

    // Bloco 2: Imagem 3 (Apresentação), Imagem 4 (Close 1) e Imagem 5 (Close 2)
    const b2List =
      result.leilao.bloco2.images && result.leilao.bloco2.images.length > 0
        ? result.leilao.bloco2.images
        : result.leilao.bloco2.storyboardImageUrl
        ? [result.leilao.bloco2.storyboardImageUrl]
        : [];
    for (let i = 0; i < b2List.length; i++) {
      try {
        const bytes = await urlToUint8Array(b2List[i]);
        zip.file(`leilao_cena2_imagem${i + 3}.png`, bytes);
      } catch (err) {
        console.warn(`Erro ao anexar imagem ${i + 3} do Bloco 2 no zip:`, err);
      }
    }

    // Bloco 3: Imagem 6 (Leiloeiro Apontando para o Carrinho Laranja)
    const b3List =
      result.leilao.bloco3.images && result.leilao.bloco3.images.length > 0
        ? result.leilao.bloco3.images
        : result.leilao.bloco3.storyboardImageUrl
        ? [result.leilao.bloco3.storyboardImageUrl]
        : [];
    for (let i = 0; i < b3List.length; i++) {
      try {
        const bytes = await urlToUint8Array(b3List[i]);
        zip.file(`leilao_cena3_imagem6.png`, bytes);
      } catch (err) {
        console.warn('Erro ao anexar imagem do Bloco 3 no zip:', err);
      }
    }

    // 3. Descrição do Post + Hashtags
    const desc = result.description || result.descriptionHashtags;
    if (desc) {
      const descContent = `${desc}

---
FALA USADA NO MODO LEILÃO:
Cena 1 (0-12s):
"${result.leilao.speeches.cena1}"

Cena 2 (12-24s):
"${result.leilao.speeches.cena2}"

Cena 3 (24-30s):
"${result.leilao.speeches.cena3}"
`;
      zip.file('leilao_descricao_post.txt', descContent);
    }
  } else if (isTwoScenes && result.scene2) {
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
