import { ProdutoFormState, ProdutoResultState, ProdutoSceneResult, ProdutoImageItem } from './types';
import { buildProdutoImagePrompt, buildProdutoVeoPrompt } from './produtoPrompts';
import { compressAndResizeImage } from '../ania/aniaLibrary';
import {
  analyzeProductInfoForProdutos2,
  enforceMaxChars,
  selectAndAdaptProdutos2Copy,
} from '../produtos2/produtos2CopyBank';

export async function runProdutoPipeline(params: {
  form: ProdutoFormState;
  aiProfile?: string;
  onProgress?: (percent: number, message: string) => void;
}): Promise<ProdutoResultState> {
  const { form, aiProfile = 'openai', onProgress } = params;

  onProgress?.(10, 'Iniciando planejamento do Modo Produto OLD...');

  // 1. Duração e Limite de Caracteres
  const durationSec = form.veoModelMode === 'veo3_omniflash_10s' ? 10 : 8;
  const maxChars = form.sceneCount === 1 ? 259 : 199;

  // 2. Montar Fala Adaptada (Usa o Banco de Copies Validadas de 10s quando for 1 cena, e usa "Amiga" em vez de "Menina")
  let speech = form.customSpeech.trim();
  if (!speech) {
    if (form.sceneCount === 1) {
      const specs = analyzeProductInfoForProdutos2(`${form.productName} ${form.productInfo}`);
      const clientGender =
        form.gender === 'Homem'
          ? 'Masculino'
          : form.gender === 'Mulher'
          ? 'Feminino'
          : 'Unissex';
      const selected = selectAndAdaptProdutos2Copy({
        subMode: specs.subMode,
        maleSubOption: specs.maleSubOption,
        productName: form.productName,
        productInfo: form.productInfo,
        duration: durationSec === 10 ? 10 : 8,
        clientGender,
        influencer: form.gender,
      });
      speech = selected.finalCopy;
    } else {
      if (form.gender === 'Homem') {
        speech = `Meu amigo, olha a praticidade desse ${form.productName}! Qualidade absurda, super fácil de usar no dia a dia. Aproveita que o desconto tá liberado no carrinho laranja aqui embaixo!`;
      } else if (form.gender === 'Mulher') {
        speech = `Amiga, olha a praticidade desse ${form.productName}! Qualidade maravilhosa, super prático pro dia a dia. Aproveita que o preço promocional tá liberado no carrinho laranja aqui embaixo!`;
      } else {
        speech = `Gente, olha a praticidade desse ${form.productName}! Qualidade incrível, super prático pro dia a dia. Aproveita que a promoção tá liberada no carrinho laranja aqui embaixo!`;
      }
    }
  }

  // Garantir que nunca tenha "Menina," como vocativo
  speech = speech.replace(/\bMeninas\s*,/gi, 'Amigas,').replace(/\bMenina\s*,/gi, 'Amiga,');

  // Garantir limites de caracteres por cena
  if (speech.length > maxChars) {
    speech = enforceMaxChars(speech, maxChars);
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

  // 4. Gerar Imagens via /api/generate-scene-image com pré-compressão única e concorrência controlada
  const uniqueRawPhotos = Array.from(
    new Set((form.variations || []).flatMap((v) => v.photos || []).filter(Boolean))
  );
  const compressedPhotoMap = new Map<string, string>();
  await Promise.all(
    uniqueRawPhotos.map(async (raw) => {
      try {
        const compact = await compressAndResizeImage(raw, 1200, 0.88);
        compressedPhotoMap.set(raw, compact && compact.length < raw.length ? compact : raw);
      } catch {
        compressedPhotoMap.set(raw, raw);
      }
    })
  );

  interface ProdutoImageTask {
    sc: ProdutoSceneResult;
    img: ProdutoImageItem;
    imgIdx: number;
    seqIdx: number;
  }
  const tasks: ProdutoImageTask[] = [];
  let totalImagesCount = 0;
  for (const sc of scenes) {
    for (let imgIdx = 0; imgIdx < sc.images.length; imgIdx++) {
      totalImagesCount++;
      tasks.push({ sc, img: sc.images[imgIdx], imgIdx, seqIdx: totalImagesCount });
    }
  }

  let completedCount = 0;
  const processSingleProdutoTask = async (task: ProdutoImageTask) => {
    const { sc, img, imgIdx } = task;
    const totalVars = (form.variations && form.variations.length > 0) ? form.variations.length : 1;
    const varIndex = totalVars > 1
      ? (imgIdx % totalVars)
      : ((sc.sceneNumber - 1) % totalVars);
    const currentVar = form.variations?.[varIndex] || form.variations?.[0];
    const allPhotos = (currentVar?.photos || []).map((p) => compressedPhotoMap.get(p) || p).filter(Boolean);
    const primaryPhoto = allPhotos[imgIdx % Math.max(1, allPhotos.length)] || allPhotos[0] || '';
    const targetAngle = imgIdx === 0 ? 'front' : imgIdx === 1 ? 'side' : 'detail';

    try {
      const refPhotosList = allPhotos.length > 0 ? allPhotos : (primaryPhoto ? [primaryPhoto] : []);
      const res = await fetch('/api/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: img.promptUsed,
          productType: form.productName,
          variationName: currentVar?.name || 'Produto Original',
          targetAngle,
          productPhotoBase64: primaryPhoto,
          productPhotosBase64: refPhotosList,
          additionalInstructions: form.additionalInstructions,
          aiProfile,
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        const generatedUrl: string = data.imageUrl;
        img.imageUrl = generatedUrl;

        // Verificação automática de fidelidade com imagem compactada + retry automático se necessário
        if (refPhotosList.length > 0) {
          try {
            const compactGen = generatedUrl.startsWith('data:')
              ? await compressAndResizeImage(generatedUrl, 896, 0.85)
              : generatedUrl;
            const auditRes = await fetch('/api/audit-image-fidelity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                generatedImageBase64: compactGen,
                referencePhotos: refPhotosList.slice(0, 2),
                variationName: currentVar?.name || form.productName || 'Produto Original',
                role: img.role,
                aiProfile,
              }),
            });
            const auditJson = await auditRes.json();
            if (auditJson?.success && auditJson?.audit && auditJson.audit.status !== 'green') {
              const fixProd =
                auditJson.audit.correctionPrompt ||
                (auditJson.audit.issues || []).join('; ') ||
                'Corrigir o produto para ficar 100% idêntico à foto de referência.';
              onProgress?.(
                Math.round(30 + (completedCount / Math.max(1, totalImagesCount)) * 60),
                `Imagem ${task.seqIdx} ficou em ${auditJson.audit.status === 'yellow' ? 'Amarelo' : 'Vermelho'} — regerando automaticamente com correção...`
              );
              const retryRes = await fetch('/api/generate-scene-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: `${img.promptUsed}\n\n[CORREÇÃO AUTOMÁTICA OBRIGATÓRIA DE FIDELIDADE]: ${fixProd}`,
                  productType: form.productName,
                  variationName: currentVar?.name || 'Produto Original',
                  targetAngle,
                  productPhotoBase64: primaryPhoto,
                  productPhotosBase64: refPhotosList,
                  correctionPrompt: fixProd,
                  additionalInstructions: form.additionalInstructions,
                  aiProfile,
                }),
              });
              const retryData = await retryRes.json();
              if (retryData?.success && retryData?.imageUrl) {
                img.imageUrl = retryData.imageUrl;
              }
            }
          } catch (auditErr) {
            console.warn('Aviso ao auditar imagem no Modo Produto:', auditErr);
          }
        }
      } else {
        img.hasError = true;
        img.error = data.error || 'Falha ao gerar imagem';
      }
    } catch (err: any) {
      img.hasError = true;
      img.error = err.message || 'Erro de conexão';
    } finally {
      completedCount++;
      const pct = Math.round(30 + (completedCount / Math.max(1, totalImagesCount)) * 60);
      onProgress?.(pct, `Imagens geradas: ${completedCount} de ${totalImagesCount}...`);
    }
  };

  onProgress?.(30, `Gerando ${totalImagesCount} imagens em paralelo...`);
  const CONCURRENCY = 2;
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    await Promise.all(tasks.slice(i, i + CONCURRENCY).map(processSingleProdutoTask));
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
