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

export function sanitizeFileName(name: string): string {
  const clean = (name || 'Modo_Ana_Maria')
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, '_')
    .trim();
  return clean || 'Modo_Ana_Maria';
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

export async function downloadAnaMariaSingleImage(imageUrl: string, productName: string) {
  try {
    const bytes = await urlToUint8Array(imageUrl);
    const blob = new Blob([bytes], { type: 'image/png' });
    const name = sanitizeFileName(productName);
    downloadBlob(blob, `${name}_Ana_Maria_1080x1920.png`);
  } catch (err) {
    console.warn('Erro ao baixar imagem direta:', err);
    // Fallback simples via link direto
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${sanitizeFileName(productName)}_Ana_Maria.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Exporta o pacote completo do Modo Ana Maria em arquivo .ZIP:
 * - Imagem gerada em alta definição vertical 9:16
 * - prompt_video_kling.txt (pronto para animar no Kling 3.0 Omni)
 * - hashtags.txt (somente hashtags, SEM o nome do produto)
 * - headline.txt (headline com florzinha)
 * - resumo_criativo.txt
 */
export async function exportAnaMariaZip(result: AnaMariaResultState): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const baseName = sanitizeFileName(result.productName);

  // 1. Imagem Principal
  try {
    const imgBytes = await urlToUint8Array(result.imageUrl);
    zip.file(`${baseName}_imagem_1080x1920.png`, imgBytes);
  } catch (err) {
    console.warn('Falha ao adicionar imagem no zip:', err);
  }

  // 2. Prompt de Vídeo (Kling 3.0 Omni / Veo)
  zip.file(`prompt_video_kling_omni.txt`, result.videoPrompt);

  // 3. Hashtags (REGRA: Somente hashtags, SEM nome do produto)
  zip.file(`hashtags.txt`, result.hashtags);

  // 4. Headline (Com a florzinha no final)
  zip.file(`headline.txt`, result.headline);

  // 5. Resumo do Criativo
  const resumo = `=====================================================
AURORA MODO ANA MARIA — CRIATIVO DE ALTA CONVERSÃO
=====================================================

PRODUTO: ${result.productName || 'Não especificado'}
DATA DA GERAÇÃO: ${new Date(result.timestamp).toLocaleString('pt-BR')}
MODELO DE IMAGEM USADO: ${result.imageModel}
INFLUENCIADOR: ${result.influencer}
TIPO DE CORPO: ${result.bodyType === 'plus_size' ? 'Plus Size' : 'Normal'}
CALÇADO SELECIONADO: ${result.shoeDescription} (Categoria ${result.shoeCategory})
ENQUADRAMENTO: Corte obrigatório da altura do nariz/lábio inferior para baixo (Sem rosto)
TATUAGENS: Zero tatuagens

-----------------------------------------------------
HEADLINE VENCEDORA (COM SÍMBOLO FLORAL):
-----------------------------------------------------
${result.headline}

-----------------------------------------------------
HASHTAGS RECOMENDADAS (SEM NOME DO PRODUTO):
-----------------------------------------------------
${result.hashtags}

-----------------------------------------------------
PROMPT DO VÍDEO (KLING 3.0 OMNI / VITRINE ESTÁTICA 10S):
-----------------------------------------------------
${result.videoPrompt}

-----------------------------------------------------
PROMPT MESTRE DE IMAGEM UTILIZADO:
-----------------------------------------------------
${result.imagePrompt}
`;
  zip.file(`resumo_criativo.txt`, resumo);

  // Gerar e baixar arquivo .zip
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `${baseName}_Modo_Ana_Maria_Criativo.zip`);
}
