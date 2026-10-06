import JSZip from 'jszip';
import { AniaResultState } from './types';
import { removeAccents } from './aniaLibrary';

/**
 * Downloads a Blob directly to the user's computer.
 */
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

/**
 * Converts a base64 DataURL or remote URL to a Uint8Array buffer.
 */
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
 * Exports all Modo Ania assets into a single .zip file containing the 7 requested files:
 * 1. imagem-1-{peca}.png
 * 2. imagem-2-{peca}.png
 * 3. imagem-3-{peca}.png
 * 4. prompt-imagem-1-{peca}.txt (or prompt-video-1)
 * 5. prompt-imagem-2-{peca}.txt
 * 6. prompt-imagem-3-{peca}.txt
 * 7. descricao-{peca}.txt
 */
export async function exportAniaAssetsZip(result: AniaResultState): Promise<void> {
  const zip = new JSZip();
  const pecaRaw = result.planning?.peca || 'peca';
  const peca = removeAccents(pecaRaw).replace(/[^a-z0-9]/g, '') || 'peca';

  // 1. Add 3 Images
  for (let i = 0; i < 3; i++) {
    const imgObj = result.images[i] || result.images[0];
    if (imgObj && imgObj.imageUrl) {
      try {
        const bytes = await urlToUint8Array(imgObj.imageUrl);
        zip.file(`imagem-${i + 1}-${peca}.png`, bytes);
      } catch (err) {
        console.warn(`Erro ao empacotar imagem ${i + 1}:`, err);
      }
    }
  }

  // 2. Add 3 Prompts (Video Prompts formatted for Flow / Veo with Image Prompt reference if needed)
  for (let i = 0; i < 3; i++) {
    const vPrompt = result.videoPrompts[i];
    const imgObj = result.images[i] || result.images[0];
    const textContent = `=== PROMPT DE VÍDEO ${i + 1} (COR: ${vPrompt?.colorName || `Cor ${i + 1}`}) ===
${vPrompt?.prompt || ''}

${imgObj?.promptUsed ? `\n=== PROMPT UTILIZADO NA IMAGEM ${i + 1} ===\n${imgObj.promptUsed}` : ''}`;

    zip.file(`prompt-imagem-${i + 1}-${peca}.txt`, textContent);
  }

  // 3. Add Description + Hashtags
  const descContent = `${result.description}

---
FALA COMPLETA ADAPTADA (Origem: ${result.speechSourceId || 'Acervo Ania'}):
"${result.completeSpeech}"
`;
  zip.file(`descricao-${peca}.txt`, descContent);

  // Generate & Download ZIP
  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `modo-ania-${peca}-pacote-completo.zip`);
  } catch (err) {
    console.error('Erro ao gerar ZIP do Modo Ania, iniciando fallback sequencial:', err);
    // Fallback: download description at least
    const descBlob = new Blob([descContent], { type: 'text/plain;charset=utf-8' });
    downloadBlob(descBlob, `descricao-${peca}.txt`);
  }
}
