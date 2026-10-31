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

/**
 * Baixa a imagem com a nomenclatura: "[Nome do Produto] Aurora.png" (item 22)
 */
export async function downloadAnaMariaSingleImage(imageUrl: string, productName: string) {
  const cleanName = sanitizeCleanName(productName);
  const fileName = `${cleanName} Aurora.png`;

  try {
    const bytes = await urlToUint8Array(imageUrl);
    const blob = new Blob([bytes], { type: 'image/png' });
    downloadBlob(blob, fileName);
  } catch (err) {
    console.warn('Erro ao baixar imagem via blob:', err);
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Exporta o pacote .zip (item 23):
 * - Imagem: "[Nome do Produto] Aurora.png"
 * - Doc 1: "Hastags e Headline - [Nome do Produto] (hora da geração).txt"
 * - Doc 2: "Prompt de Video - [Nome do Produto] (hora da geração).txt"
 * - Nome do ZIP: "Modo Ana Maria - [Nome do Produto].zip"
 */
export async function exportAnaMariaZip(result: AnaMariaResultState): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const cleanName = sanitizeCleanName(result.productName);
  const horaStr = formatTimestampForFile(result.timestamp);

  // 1. Imagem Principal: "[Nome do Produto] Aurora.png"
  try {
    const imgBytes = await urlToUint8Array(result.imageUrl);
    zip.file(`${cleanName} Aurora.png`, imgBytes);
  } catch (err) {
    console.warn('Falha ao adicionar imagem no zip:', err);
  }

  // 2. Doc de Hashtags e Headline (item 23)
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
