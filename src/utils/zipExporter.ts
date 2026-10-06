import JSZip from 'jszip';
import { VideoAnalysisResult, SceneDetail } from '../types';

/**
 * Extracts a clean, simple, lowercase product slug from productType
 * e.g. "Tênis Esportivo" -> "tenis", "Camiseta Streetwear" -> "camiseta"
 */
export function getCleanProductName(productType?: string): string {
  if (!productType) return 'produto';
  const clean = productType
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .split('_')
    .filter(Boolean)[0];
  return clean || 'produto';
}

/**
 * Downloads ALL generated scene images at once in a single ZIP file.
 * Filenames are strictly: "1_tenis.jpg", "2_tenis.jpg", "3_tenis.jpg"
 */
export async function downloadAllGeneratedImagesZip(analysis: VideoAnalysisResult): Promise<void> {
  const zip = new JSZip();
  let count = 0;
  const prodSlug = getCleanProductName(analysis.productType);
  const totalScenes = analysis.scenes.length;

  for (const scene of analysis.scenes) {
    scene.images.forEach((img, imgIdx) => {
      if (!img.imageUrl) return;
      count++;
      const slotNumber = imgIdx + 1;
      const filename =
        totalScenes > 1
          ? `cena${scene.sceneNumber}_${slotNumber}_${prodSlug}.jpg`
          : `${slotNumber}_${prodSlug}.jpg`;

      try {
        if (img.imageUrl.startsWith('data:image/')) {
          const base64Data = img.imageUrl.split(',')[1];
          zip.file(filename, base64Data, { base64: true });
        } else {
          fetch(img.imageUrl)
            .then((res) => res.blob())
            .then((blob) => zip.file(filename, blob))
            .catch((e) => console.warn(`Erro ao baixar imagem ${filename}:`, e));
        }
      } catch (err) {
        console.warn(`Erro ao adicionar ${filename} ao zip:`, err);
      }
    });
  }

  if (count === 0) return;

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `imagens_veo_${prodSlug}_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the generated images of a specific scene in a ZIP file.
 * Filenames are strictly: "1_produto.jpg", "2_produto.jpg", etc.
 */
export async function downloadSceneImagesZip(scene: SceneDetail, productType?: string): Promise<void> {
  const zip = new JSZip();
  let count = 0;
  const prodSlug = getCleanProductName(productType);

  scene.images.forEach((img, imgIdx) => {
    if (!img.imageUrl) return;
    count++;
    const slotNumber = imgIdx + 1;
    const filename = `${slotNumber}_${prodSlug}.jpg`;

    try {
      if (img.imageUrl.startsWith('data:image/')) {
        const base64Data = img.imageUrl.split(',')[1];
        zip.file(filename, base64Data, { base64: true });
      } else {
        fetch(img.imageUrl)
          .then((res) => res.blob())
          .then((blob) => zip.file(filename, blob))
          .catch((e) => console.warn(`Erro ao carregar ${filename}:`, e));
      }
    } catch (err) {
      console.warn(`Erro ao adicionar ${filename} ao zip da cena:`, err);
    }
  });

  if (count === 0) return;

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cena_${scene.sceneNumber}_${prodSlug}_veo.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports complete package: prompts, headlines, and 9:16 images named "1_tenis.jpg", "2_tenis.jpg", "3_tenis.jpg"
 */
export async function exportAllClonedAssets(analysis: VideoAnalysisResult): Promise<void> {
  const zip = new JSZip();
  const prodSlug = getCleanProductName(analysis.productType);

  // 1. Add Text Files
  let promptsText = `========================================================\n`;
  promptsText += `CLONADOR DE VÍDEO DE PRODUTO • PACOTE GOOGLE VEO\n`;
  promptsText += `========================================================\n\n`;
  promptsText += `Produto: ${analysis.productType || 'Produto Comercial'}\n`;
  promptsText += `Cenário Geral: ${analysis.environmentDescription}\n`;
  promptsText += `Câmera: ${analysis.cameraType} (${analysis.cameraStability})\n`;
  promptsText += `Iluminação: ${analysis.lightingStyle}\n\n`;

  analysis.scenes.forEach((scene) => {
    promptsText += `--------------------------------------------------------\n`;
    promptsText += `CENA ${scene.sceneNumber} (${scene.timeRangeText})\n`;
    promptsText += `Instrução: ${scene.veoInstruction}\n`;
    promptsText += `Resumo: ${scene.actionSummary}\n\n`;
    promptsText += `PROMPT VEO:\n${scene.veoPrompt}\n\n`;
  });

  zip.file('prompts_google_veo.txt', promptsText);

  // 2. Add Headlines File (if on-screen texts exist)
  if (analysis.onScreenTexts && analysis.onScreenTexts.length > 0) {
    let headlineText = `========================================================\n`;
    headlineText += `HEADLINE A COLOCAR NO VÍDEO (APLICAR NO CAPCUT OU TIKTOK)\n`;
    headlineText += `========================================================\n\n`;

    analysis.onScreenTexts.forEach((t, i) => {
      headlineText += `[HEADLINE ${i + 1}] (${t.timestamp})\n`;
      headlineText += `Texto: "${t.text}"\n`;
      headlineText += `Fonte: ${t.fontStyle}\n`;
      headlineText += `Cor: ${t.color}\n`;
      headlineText += `Posição: ${t.position}\n\n`;
    });

    zip.file('headline_a_colocar_no_video.txt', headlineText);
  }

  // 3. Add Generated 9:16 Images organized by Scene Folder with clear numbers 1_tenis.jpg, 2_tenis.jpg, 3_tenis.jpg
  for (const scene of analysis.scenes) {
    const sceneFolder = zip.folder(`cena_${scene.sceneNumber}`);
    if (sceneFolder) {
      scene.images.forEach((img, imgIdx) => {
        if (!img.imageUrl) return;
        const slotNumber = imgIdx + 1;
        const filename = `${slotNumber}_${prodSlug}.jpg`;

        try {
          if (img.imageUrl.startsWith('data:image/')) {
            const base64Data = img.imageUrl.split(',')[1];
            sceneFolder.file(filename, base64Data, { base64: true });
          } else {
            fetch(img.imageUrl)
              .then((res) => res.blob())
              .then((blob) => sceneFolder.file(filename, blob))
              .catch((e) => console.warn(`Erro ao carregar ${filename}:`, e));
          }
        } catch (err) {
          console.warn(`Erro ao arquivar imagem ${img.id}:`, err);
        }
      });
    }
  }

  // 4. Generate and download zip
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pacote_veo_${prodSlug}_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
