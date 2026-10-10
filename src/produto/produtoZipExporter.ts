import JSZip from 'jszip';
import { ProdutoResultState } from './types';

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

export async function exportProdutoZip(result: ProdutoResultState): Promise<void> {
  const zip = new JSZip();
  const prodSlug = result.productName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'produto';

  // 1. Separate Prompt Files (Prompt_Cena_01.txt, etc.)
  result.scenes.forEach((sc) => {
    const pad = String(sc.sceneNumber).padStart(2, '0');
    zip.file(`Prompt_Cena_${pad}.txt`, sc.prompt);
  });

  // 2. Conteudo_Anuncio.txt
  const adContent = `========================================================
CONTEÚDO DO ANÚNCIO (COPY, LOCUÇÃO E HASHTAGS)
Produto: ${result.productName}
========================================================

--- FALA COMPLETA DO VÍDEO ---
${result.speech}

--- DESCRIÇÃO COMERCIAL E HASHTAGS ---
${result.description}
`;
  zip.file('Conteudo_Anuncio.txt', adContent);

  // 3. Imagens geradas
  let imgIndex = 1;
  for (const sc of result.scenes) {
    for (const img of sc.images) {
      if (img.imageUrl) {
        try {
          const bytes = await urlToUint8Array(img.imageUrl);
          zip.file(`imagem_${imgIndex}_${prodSlug}.jpg`, bytes);
          imgIndex++;
        } catch (err) {
          console.warn(`Erro ao arquivar imagem ${imgIndex}:`, err);
        }
      }
    }
  }

  // 4. Download Zip
  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `modo_produto_${prodSlug}_pacote.zip`);
  } catch (e) {
    console.error('Erro ao gerar zip do Modo Produto:', e);
  }
}
