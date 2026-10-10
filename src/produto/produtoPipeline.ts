import { ProdutoFormState, ProdutoResultState, ProdutoSceneResult, ProdutoImageItem } from './types';
import { buildProdutoImagePrompt, buildProdutoVeoPrompt } from './produtoPrompts';

export async function runProdutoPipeline(params: {
  form: ProdutoFormState;
  aiProfile?: string;
  onProgress?: (percent: number, message: string) => void;
}): Promise<ProdutoResultState> {
  const { form, aiProfile = 'openai', onProgress } = params;

  onProgress?.(10, 'Iniciando planejamento do Modo Produto...');

  // 1. Duração e Limite de Caracteres
  const durationSec = form.veoModelMode === 'veo3_omniflash_10s' ? 10 : 8;
  const maxChars = form.sceneCount === 1 ? 252 : 199;

  // 2. Montar Fala Adaptada
  let speech = form.customSpeech.trim();
  if (!speech) {
    if (form.gender === 'Homem') {
      speech = `Fala amigo, olha a praticidade desse ${form.productName}! Qualidade absurda, super fácil de usar no dia a dia. Aproveita que o desconto tá liberado no carrinho aqui embaixo!`;
    } else {
      speech = `Menina, olha a praticidade desse ${form.productName}! Qualidade maravilhosa, super prático pro dia a dia. Aproveita que o preço promocional tá liberado no carrinho aqui embaixo!`;
    }
  }

  // Garantir limites de caracteres por cena
  if (speech.length > maxChars) {
    speech = speech.slice(0, maxChars - 1).trim() + '!';
  }

  onProgress?.(30, 'Criando roteiro e prompts do Veo 3.1...');

  const scenes: ProdutoSceneResult[] = [];
  const totalScenes = form.sceneCount;

  // 3. Montar Cenas e Prompts
  for (let s = 1; s <= totalScenes; s++) {
    // Quantidade de imagens de referência por cena (1, 2 ou 3 conforme escolha do usuário, padrão 3)
    const imagesCount = Math.min(3, Math.max(1, form.refImagesPerScene || (totalScenes === 1 ? 3 : 1)));

    const scenePrompt = buildProdutoVeoPrompt({
      sceneNumber: s,
      totalScenes,
      productName: form.productName,
      productInfo: form.productInfo,
      durationSeconds: durationSec,
      speechText: speech,
      framing: form.framing,
      scenario: form.scenario,
      refImagesCount: imagesCount,
    });

    const sceneImages: ProdutoImageItem[] = [];

    for (let i = 1; i <= imagesCount; i++) {
      let role = `Demonstração da Cena ${s}`;
      if (imagesCount === 1) {
        role = `Imagem 1: Apresentação principal de ${form.productName}`;
      } else if (imagesCount === 2) {
        role = i === 1
          ? `Imagem 1: Apresentação frontal / geral de ${form.productName}`
          : `Imagem 2: Demonstração de uso e funcionalidade de ${form.productName}`;
      } else {
        role = i === 1
          ? `Imagem 1: Apresentação principal de ${form.productName}`
          : i === 2
          ? `Imagem 2: Ângulo de uso e funcionalidade`
          : `Imagem 3: Detalhe de textura e acabamento`;
      }

      const imgPrompt = buildProdutoImagePrompt({
        productName: form.productName,
        productInfo: form.productInfo,
        gender: form.gender,
        framing: form.framing,
        scenario: form.scenario,
        imageRole: role,
        additionalInstructions: form.additionalInstructions,
      });

      sceneImages.push({
        id: `prod-img-${s}-${i}`,
        promptUsed: imgPrompt,
        role,
      });
    }

    scenes.push({
      sceneNumber: s,
      prompt: scenePrompt,
      speech,
      images: sceneImages,
    });
  }

  // 4. Gerar Imagens via /api/generate-scene-image
  let totalImagesCount = 0;
  scenes.forEach(sc => totalImagesCount += sc.images.length);
  let currentImageIdx = 0;

  for (const sc of scenes) {
    for (let imgIdx = 0; imgIdx < sc.images.length; imgIdx++) {
      const img = sc.images[imgIdx];
      currentImageIdx++;
      const pct = Math.round(30 + (currentImageIdx / totalImagesCount) * 60);
      onProgress?.(pct, `Gerando imagem ${currentImageIdx} de ${totalImagesCount}...`);

      // Mapeia variação e foto de forma inteligente:
      // Se há múltiplas variações cadastradas, distribui entre as referências.
      // Se há 1 variação com múltiplas fotos, cada referência aproveita uma foto diferente.
      const totalVars = (form.variations && form.variations.length > 0) ? form.variations.length : 1;
      const varIndex = totalVars > 1
        ? (imgIdx % totalVars)
        : ((sc.sceneNumber - 1) % totalVars);
      const currentVar = form.variations?.[varIndex] || form.variations?.[0];
      const allPhotos = currentVar?.photos || [];
      const primaryPhoto = allPhotos[imgIdx % Math.max(1, allPhotos.length)] || allPhotos[0] || '';
      const targetAngle = imgIdx === 0 ? 'front' : imgIdx === 1 ? 'side' : 'detail';

      try {
        const res = await fetch('/api/generate-scene-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: img.promptUsed,
            productType: form.productName,
            variationName: currentVar?.name || 'Produto Original',
            targetAngle,
            productPhotoBase64: primaryPhoto,
            productPhotosBase64: allPhotos.length > 0 ? allPhotos : (primaryPhoto ? [primaryPhoto] : []),
            additionalInstructions: form.additionalInstructions,
            aiProfile,
          }),
        });
        const data = await res.json();
        if (data.success && data.imageUrl) {
          img.imageUrl = data.imageUrl;
        } else {
          img.hasError = true;
          img.error = data.error || 'Falha ao gerar imagem';
        }
      } catch (err: any) {
        img.hasError = true;
        img.error = err.message || 'Erro de conexão';
      }
    }
  }

  onProgress?.(100, 'Modo Produto concluído com sucesso!');

  const description = `Confira todos os detalhes do ${form.productName}! Praticidade e alta conversão para o seu dia a dia. #tiktokshop #achadinhos #${form.productName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  return {
    productName: form.productName,
    productInfo: form.productInfo,
    gender: form.gender,
    framing: form.framing,
    scenario: form.scenario,
    sceneCount: form.sceneCount,
    veoModelMode: form.veoModelMode,
    scenes,
    speech,
    description,
  };
}
