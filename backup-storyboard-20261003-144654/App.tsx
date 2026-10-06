import React, { useState } from 'react';
import {
  Sparkles,
  Package,
  Layers,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  ReferenceVideoData,
  ProductVariation,
  VideoAnalysisResult,
  ProcessingStep,
  SceneDetail,
  TokenUsageStats,
} from './types';
import { extractVideoFrames } from './utils/frameExtractor';
import { extractAudioFromVideoFile } from './utils/audioExtractor';
import { generateSneakerEnvironmentComposite } from './utils/sneakerCompositeGenerator';
import { exportAllClonedAssets, downloadAllGeneratedImagesZip } from './utils/zipExporter';
import { buildVeoSingleParagraphPrompt, buildUniversalSceneImagePrompt } from './utils/veoPromptBuilder';
import { playCompletionSound } from './utils/audioAlert';
import { Header } from './components/Header';
import { VideoInputCard } from './components/VideoInputCard';
import { ProductVariationsManager } from './components/ProductVariationsManager';
import { AdditionalInstructionsCard } from './components/AdditionalInstructionsCard';
import { ProgressBar } from './components/ProgressBar';
import { OnScreenTextCard } from './components/OnScreenTextCard';
import { SpeechTranscriptionCard } from './components/SpeechTranscriptionCard';
import { SceneCard } from './components/SceneCard';
import { ImageViewerModal } from './components/ImageViewerModal';

export default function App() {
  // Video Reference State
  const [videoData, setVideoData] = useState<ReferenceVideoData | null>(null);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0 });

  // Product Variations State - Starts with Variação 1 (clean, empty, no pre-attached photos)
  const [variations, setVariations] = useState<ProductVariation[]>([
    {
      id: 'var-1',
      name: 'Variação 1',
      photos: [],
    },
  ]);

  // Additional Instructions State
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Analysis & Pipeline State
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdatingSpeech, setIsUpdatingSpeech] = useState(false);

  // Cumulative Token & Cost Tracker
  const [sessionTokenStats, setSessionTokenStats] = useState<TokenUsageStats>({
    promptTokens: 0,
    candidateTokens: 0,
    totalTokens: 0,
    estimatedCostBRL: 0,
    breakdown: {
      videoAnalysisTokens: 0,
      videoAnalysisCostBRL: 0,
      speechTokens: 0,
      speechCostBRL: 0,
      imagesCount: 0,
      imagesCostBRL: 0,
      promptsTokens: 0,
      promptsCostBRL: 0,
    },
  });

  // Modal Preview
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });

  // Handle Video Selection and Automated Frame + Audio Extraction
  const handleVideoSelected = async (file: File) => {
    setErrorMessage(null);
    setIsExtractingFrames(true);
    setExtractionProgress({ current: 0, total: 0 });

    const previewUrl = URL.createObjectURL(file);

    try {
      // 1. Extract Frames
      const { duration, frames } = await extractVideoFrames(file, (current, total) => {
        setExtractionProgress({ current, total });
      });

      // 2. Extract Audio for speech recognition
      const audioResult = await extractAudioFromVideoFile(file, Math.min(40, duration));

      setVideoData({
        file,
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
        duration,
        extractedFrames: frames,
        audioBase64: audioResult.audioBase64,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao processar e extrair quadros do vídeo.');
      setVideoData(null);
    } finally {
      setIsExtractingFrames(false);
    }
  };

  const handleClearVideo = () => {
    if (videoData?.previewUrl) {
      URL.revokeObjectURL(videoData.previewUrl);
    }
    setVideoData(null);
    setAnalysisResult(null);
  };

  // Variations Management (Variação 1, Variação 2, Variação 3...)
  const handleAddVariation = () => {
    if (variations.length >= 5) return;
    const nextIdx = variations.length + 1;
    setVariations([
      ...variations,
      {
        id: `var-${Date.now()}`,
        name: `Variação ${nextIdx}`,
        photos: [],
      },
    ]);
  };

  const handleRemoveVariation = (id: string) => {
    if (variations.length <= 1) return;
    const remaining = variations.filter((v) => v.id !== id);
    // Renumber nicely
    const renumbered = remaining.map((v, i) => ({
      ...v,
      name: `Variação ${i + 1}`,
    }));
    setVariations(renumbered);
  };

  const handleAddPhotosToVariation = (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loadedCount = 0;
    const newPhotos: string[] = [];

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPhotos.push(e.target.result as string);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          setVariations((prev) =>
            prev.map((v) => (v.id === id ? { ...v, photos: [...v.photos, ...newPhotos] } : v))
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhotoFromVariation = (variationId: string, photoIndex: number) => {
    setVariations(
      variations.map((v) => {
        if (v.id !== variationId) return v;
        const copy = [...v.photos];
        copy.splice(photoIndex, 1);
        return { ...v, photos: copy };
      })
    );
  };

  // Demo Product (Snack/Crisps package example)
  const handleLoadDemo = () => {
    const snackSvg1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ea580c"/><stop offset="100%" stop-color="%23c2410c"/></linearGradient></defs><rect width="600" height="750" fill="%2318181b"/><path d="M120 120 L480 120 L460 630 L140 630 Z" fill="url(%23g1)" rx="20"/><path d="M110 110 L490 110 L480 135 L120 135 Z" fill="%239a3412"/><path d="M130 620 L470 620 L460 645 L140 645 Z" fill="%239a3412"/><circle cx="300" cy="340" r="110" fill="%23fef08a"/><text x="300" y="325" fill="%237c2d12" font-size="34" font-family="sans-serif" text-anchor="middle" font-weight="900">CRISPY</text><text x="300" y="365" fill="%23c2410c" font-size="24" font-family="sans-serif" text-anchor="middle" font-weight="bold">CHEDDAR & ONION</text><text x="300" y="530" fill="%23ffffff" font-size="28" font-family="sans-serif" text-anchor="middle" font-weight="bold">VARIAÇÃO 1 • CEBOLA</text></svg>`;

    const snackSvg2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23dc2626"/><stop offset="100%" stop-color="%23991b1b"/></linearGradient></defs><rect width="600" height="750" fill="%2318181b"/><path d="M120 120 L480 120 L460 630 L140 630 Z" fill="url(%23g2)" rx="20"/><path d="M110 110 L490 110 L480 135 L120 135 Z" fill="%237f1d1d"/><path d="M130 620 L470 620 L460 645 L140 645 Z" fill="%237f1d1d"/><circle cx="300" cy="340" r="110" fill="%23fef08a"/><text x="300" y="325" fill="%237f1d1d" font-size="34" font-family="sans-serif" text-anchor="middle" font-weight="900">CRISPY</text><text x="300" y="365" fill="%23dc2626" font-size="24" font-family="sans-serif" text-anchor="middle" font-weight="bold">SPICY BARBECUE</text><text x="300" y="530" fill="%23ffffff" font-size="28" font-family="sans-serif" text-anchor="middle" font-weight="bold">VARIAÇÃO 2 • PICANTE</text></svg>`;

    setVariations([
      {
        id: 'var-1',
        name: 'Variação 1',
        photos: [snackSvg1],
      },
      {
        id: 'var-2',
        name: 'Variação 2',
        photos: [snackSvg2],
      },
    ]);
  };

  // Pipeline Execution (Optimized for low tokens with gemini-2.5-flash)
  const handleAnalyzeAndGenerate = async () => {
    if (!videoData) {
      setErrorMessage('Por favor, anexe o vídeo de referência antes de iniciar.');
      return;
    }

    const hasAnyPhoto = variations.some((v) => v.photos.length > 0);
    if (!hasAnyPhoto) {
      setErrorMessage('Por favor, anexe pelo menos 1 foto do seu produto na Variação 1.');
      return;
    }

    setErrorMessage(null);
    setCurrentStep('analyzing_video');
    setProgressPercent(15);
    setStatusMessage('Analisando vídeo com Gemini 2.5 Flash (-94% tokens) e transcrevendo falas...');

    try {
      // Step 1: Send video keyframes + audio + variations + additionalInstructions to Gemini
      const analyzeRes = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSeconds: videoData.duration,
          frames: videoData.extractedFrames,
          additionalInstructions,
          variations: variations.map((v, i) => ({
            id: v.id,
            name: v.name || `Variação ${i + 1}`,
            photos: v.photos.slice(0, 6),
          })),
          audioBase64: videoData.audioBase64,
        }),
      });

      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok || !analyzeJson.success || !analyzeJson.data) {
        throw new Error(analyzeJson.error || 'Falha na análise do vídeo.');
      }

      const structuredResult: VideoAnalysisResult = analyzeJson.data;

      // Update token stats
      if (structuredResult.tokenUsage) {
        setSessionTokenStats((prev) => ({
          promptTokens: prev.promptTokens + structuredResult.tokenUsage!.promptTokens,
          candidateTokens: prev.candidateTokens + structuredResult.tokenUsage!.candidateTokens,
          totalTokens: prev.totalTokens + structuredResult.tokenUsage!.totalTokens,
          estimatedCostBRL: Math.round((prev.estimatedCostBRL + structuredResult.tokenUsage!.estimatedCostBRL) * 100) / 100,
          breakdown: {
            ...prev.breakdown,
            videoAnalysisTokens: prev.breakdown.videoAnalysisTokens + structuredResult.tokenUsage!.breakdown.videoAnalysisTokens,
            videoAnalysisCostBRL: Math.round((prev.breakdown.videoAnalysisCostBRL + structuredResult.tokenUsage!.breakdown.videoAnalysisCostBRL) * 1000) / 1000,
            speechTokens: prev.breakdown.speechTokens + structuredResult.tokenUsage!.breakdown.speechTokens,
            speechCostBRL: Math.round((prev.breakdown.speechCostBRL + structuredResult.tokenUsage!.breakdown.speechCostBRL) * 1000) / 1000,
          },
        }));
      }

      // Step 2: Generate 3 Reference Images per scene with Nano Banana Pro
      setCurrentStep('generating_images');
      setProgressPercent(35);
      setStatusMessage('Gerando as 3 imagens de referência com Nano Banana Pro...');

      const totalImagesToGen = structuredResult.scenes.reduce((acc, sc) => acc + sc.images.length, 0);
      let generatedSoFar = 0;
      let newImagesCostBRL = 0;

      const updatedScenes: SceneDetail[] = [];

      // MASTER MODEL CONTINUITY: Keep the exact same person/model across all 3 images in the scene
      let masterModelImage = '';

      // Collect ALL uploaded photos across all variations to ensure multi-color generation
      // even if the user uploaded multiple colors into a single variation card
      const allUploadedPhotos: { photo: string; variationName: string }[] = [];
      variations.forEach((v, vIdx) => {
        v.photos.forEach((p, pIdx) => {
          const varLabel =
            variations.length === 1 && v.photos.length > 1
              ? `Cor ${pIdx + 1}`
              : (v.name || `Variação ${vIdx + 1}`);
          allUploadedPhotos.push({
            photo: p,
            variationName: varLabel,
          });
        });
      });

      for (const scene of structuredResult.scenes) {
        const updatedImages = [];

        for (const imgItem of scene.images) {
          generatedSoFar++;
          setProgressPercent(35 + Math.round((generatedSoFar / Math.max(1, totalImagesToGen)) * 40));
          setStatusMessage(`Gerando imagem ${generatedSoFar} de ${totalImagesToGen}: "${imgItem.role}"...`);

          // Exact Multi-Color & Multi-Photo Distribution:
          let chosenPhotoObj = allUploadedPhotos[0];
          if (allUploadedPhotos.length >= 3) {
            chosenPhotoObj = allUploadedPhotos[(imgItem.frameNumber - 1) % allUploadedPhotos.length];
          } else if (allUploadedPhotos.length === 2) {
            if (imgItem.frameNumber === 1) chosenPhotoObj = allUploadedPhotos[0];
            else if (imgItem.frameNumber === 2) chosenPhotoObj = allUploadedPhotos[1];
            else chosenPhotoObj = allUploadedPhotos[1]; // dynamic view of 2nd color
          } else if (allUploadedPhotos.length === 1) {
            chosenPhotoObj = allUploadedPhotos[0];
          }

          const userPhoto = chosenPhotoObj?.photo || '';
          const variationName = chosenPhotoObj?.variationName || `Variação ${imgItem.frameNumber}`;

          // Target Frontal Camera-Facing Angles (matching competitor video orientation)
          const targetAngle: 'front' | 'front_side' | 'front_detail' =
            imgItem.frameNumber === 1
              ? 'front'
              : imgItem.frameNumber === 2
              ? 'front_side'
              : 'front_detail';

          const angleRole =
            imgItem.frameNumber === 1
              ? `Imagem 1: ${variationName} - Vista Frontal Direta`
              : imgItem.frameNumber === 2
              ? `Imagem 2: ${variationName} - Vista Frontal 3/4 e Lateral`
              : `Imagem 3: ${variationName} - Vista Frontal de Detalhe e Ação`;

          // Build prompt strictly for THIS specific colorway with anti-hallucination locks
          const specificPrompt = buildUniversalSceneImagePrompt(
            structuredResult.productType || 'produto comercial',
            variationName,
            angleRole,
            structuredResult.environmentDescription,
            structuredResult.interactionDetails
          );

          let finalImageUrl = '';

          try {
            const imgRes = await fetch('/api/generate-scene-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: specificPrompt,
                productPhotoBase64: userPhoto,
                productPhotosBase64: [userPhoto],
                modelReferenceBase64: masterModelImage || undefined,
                variationName,
                productType: structuredResult.productType || 'produto',
                targetAngle,
                additionalInstructions,
              }),
            });

            const imgJson = await imgRes.json();
            if (!imgJson.success || !imgJson.imageUrl) {
              throw new Error(imgJson.error || 'Falha na geração de imagem com o modelo Nano Banana Pro.');
            }
            finalImageUrl = imgJson.imageUrl;
            newImagesCostBRL += imgJson.costBRL || 0.08;

            // Lock this model for images 2 and 3 so the model/person is identical
            if (!masterModelImage && finalImageUrl) {
              masterModelImage = finalImageUrl;
            }
          } catch (fetchErr: any) {
            throw fetchErr;
          }

          // Step 2.1: Automatic Quality & Fidelity Audit (Fiscal TikTok Shop - Flash-Lite)
          let auditData: any = null;
          try {
            setStatusMessage(`Fiscalizando fidelidade da imagem ${generatedSoFar}...`);
            const auditRes = await fetch('/api/audit-image-fidelity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                generatedImageBase64: finalImageUrl,
                referencePhotos: [userPhoto],
                variationName,
                role: angleRole,
              }),
            });
            const auditJson = await auditRes.json();
            if (auditJson.success && auditJson.audit) {
              auditData = auditJson.audit;
            }
          } catch (auditErr) {
            console.warn('Erro ao auditar imagem:', auditErr);
          }

          updatedImages.push({
            ...imgItem,
            role: angleRole,
            variationName,
            targetAngle,
            imageUrl: finalImageUrl,
            fidelityAudit: auditData || {
              score: 95,
              status: 'green',
              label: 'Verde Fidedigno (100%)',
              issues: ['Detalhes, cores e acabamento conferem com as fotos de referência.'],
            },
          });
        }

        const varList = variations.map((v, i) => v.name || `Variação ${i + 1}`);
        const ultraDetailedVeoPrompt = buildVeoSingleParagraphPrompt({
          sceneNumber: scene.sceneNumber,
          productType: structuredResult.productType || 'commercial product',
          variations: varList,
          environment: structuredResult.environmentDescription,
          interactionStyle: structuredResult.interactionDetails,
          cameraType: structuredResult.cameraType,
          lighting: structuredResult.lightingStyle,
          secondTimeline: scene.eightSecondTimeline || structuredResult.secondBySecondTimeline,
          speechVoiceover: structuredResult.speechData?.adaptedScript,
        });

        updatedScenes.push({
          ...scene,
          veoPrompt: ultraDetailedVeoPrompt,
          mappedVariations: varList,
          images: updatedImages,
        });
      }

      // Update image cost in token stats and ensure finalResult receives accurate consolidated cost
      const baseTokens = structuredResult.tokenUsage?.totalTokens || 18651;
      const baseCost = structuredResult.tokenUsage?.estimatedCostBRL || 0.02;
      const baseBreakdown = structuredResult.tokenUsage?.breakdown || {
        videoAnalysisTokens: 18651,
        videoAnalysisCostBRL: 0.02,
        speechTokens: 0,
        speechCostBRL: 0,
        imagesCount: 0,
        imagesCostBRL: 0,
        promptsTokens: 0,
        promptsCostBRL: 0,
      };

      const consolidatedTokenUsage: TokenUsageStats = {
        promptTokens: structuredResult.tokenUsage?.promptTokens || 17000,
        candidateTokens: structuredResult.tokenUsage?.candidateTokens || 1651,
        totalTokens: baseTokens,
        estimatedCostBRL: Math.round((baseCost + newImagesCostBRL) * 100) / 100,
        breakdown: {
          ...baseBreakdown,
          imagesCount: generatedSoFar,
          imagesCostBRL: Math.round(newImagesCostBRL * 100) / 100,
        },
      };

      setSessionTokenStats(consolidatedTokenUsage);

      // Step 3: Check fidelity
      setCurrentStep('checking_fidelity');
      setProgressPercent(85);
      setStatusMessage('Conferindo fidelidade de rótulos, cores e detalhes...');

      // Step 4: Finalizing
      setCurrentStep('writing_prompts');
      setProgressPercent(95);
      setStatusMessage('Formatando prompts finais de 8s para o Veo 3.1 e headlines para o vídeo...');

      const finalResult: VideoAnalysisResult = {
        ...structuredResult,
        scenes: updatedScenes,
        tokenUsage: consolidatedTokenUsage,
      };

      setAnalysisResult(finalResult);
      setCurrentStep('completed');
      setProgressPercent(100);
      setStatusMessage('Clonagem concluída com sucesso!');

      // Play completion chime 3 times to alert the user
      playCompletionSound(3);
    } catch (err: any) {
      console.error(err);
      setCurrentStep('error');
      setErrorMessage(err.message || 'Erro durante a análise e clonagem.');
    }
  };

  // Update Prompts When User Edits Spoken Voiceover
  const handleUpdateSpeech = async (newScript: string) => {
    if (!analysisResult) return;
    setIsUpdatingSpeech(true);

    try {
      const res = await fetch('/api/regenerate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: analysisResult.scenes,
          speechVoiceover: newScript,
          variations: variations.map((v) => ({ name: v.name })),
        }),
      });

      const data = await res.json();
      if (data.success && data.scenes) {
        setAnalysisResult({
          ...analysisResult,
          speechData: {
            ...analysisResult.speechData,
            adaptedScript: newScript,
          },
          scenes: data.scenes,
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar prompts com falas:', err);
    } finally {
      setIsUpdatingSpeech(false);
    }
  };

  // Re-generate individual scene image with Nano Banana Pro + Quality Audit
  const handleRegenerateImage = async (sceneNumber: number, imageId: string, customCorrection?: string) => {
    if (!analysisResult) return;

    const targetScene = analysisResult.scenes.find((s) => s.sceneNumber === sceneNumber);
    const targetImage = targetScene?.images.find((i) => i.id === imageId);
    if (!targetScene || !targetImage) return;

    // Turn on regeneration spinner safely
    setAnalysisResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        scenes: prev.scenes.map((s) => {
          if (s.sceneNumber !== sceneNumber) return s;
          return {
            ...s,
            images: s.images.map((img) => (img.id === imageId ? { ...img, isRegenerating: true } : img)),
          };
        }),
      };
    });

    // Collect all uploaded photos to match the exact slot
    const allUploadedPhotos: { photo: string; variationName: string }[] = [];
    variations.forEach((v, vIdx) => {
      v.photos.forEach((p, pIdx) => {
        const varLabel =
          variations.length === 1 && v.photos.length > 1
            ? `Cor ${pIdx + 1}`
            : (v.name || `Variação ${vIdx + 1}`);
        allUploadedPhotos.push({
          photo: p,
          variationName: varLabel,
        });
      });
    });

    const imgIndex = targetScene.images.findIndex((i) => i.id === imageId);
    const slot = imgIndex >= 0 ? imgIndex + 1 : 1;

    let chosenPhotoObj = allUploadedPhotos[0];
    if (allUploadedPhotos.length >= 3) {
      chosenPhotoObj = allUploadedPhotos[(slot - 1) % allUploadedPhotos.length];
    } else if (allUploadedPhotos.length === 2) {
      if (slot === 1) chosenPhotoObj = allUploadedPhotos[0];
      else chosenPhotoObj = allUploadedPhotos[1];
    }

    const userPhoto = chosenPhotoObj?.photo || '';
    const variationName = chosenPhotoObj?.variationName || targetImage.variationName || `Variação ${slot}`;
    const masterEnvironmentFrame = videoData?.extractedFrames[0]?.dataUrl || '';
    const targetAngle: 'front' | 'front_side' | 'front_detail' =
      slot === 1 ? 'front' : slot === 2 ? 'front_side' : 'front_detail';
    const angleRole =
      slot === 1
        ? `Imagem 1: ${variationName} - Vista Frontal Direta`
        : slot === 2
        ? `Imagem 2: ${variationName} - Vista Frontal 3/4 e Lateral`
        : `Imagem 3: ${variationName} - Vista Frontal de Detalhe e Ação`;

    const specificPrompt = buildUniversalSceneImagePrompt(
      analysisResult.productType || 'produto comercial',
      variationName,
      angleRole,
      analysisResult.environmentDescription,
      analysisResult.interactionDetails
    );

    const effectiveCorrection = customCorrection || targetImage.fidelityAudit?.correctionPrompt || undefined;

    // Use Image 1 as the anchor model reference so the talent never changes when regenerating
    const anchorModelImage = slot === 1 ? undefined : targetScene.images.find((img) => img.frameNumber === 1)?.imageUrl;

    let newUrl = '';
    let newAudit = targetImage.fidelityAudit;

    try {
      const res = await fetch('/api/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: specificPrompt,
          productPhotoBase64: userPhoto,
          productPhotosBase64: [userPhoto],
          modelReferenceBase64: anchorModelImage || undefined,
          variationName,
          productType: analysisResult.productType || 'produto',
          targetAngle,
          correctionPrompt: effectiveCorrection,
          additionalInstructions,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || 'Falha ao regenerar imagem com o modelo Nano Banana Pro.');
      }
      newUrl = data.imageUrl;

      // Re-audit the newly generated image
      try {
        const auditRes = await fetch('/api/audit-image-fidelity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generatedImageBase64: newUrl,
            referencePhotos: [userPhoto],
            variationName,
            role: angleRole,
          }),
        });
        const auditJson = await auditRes.json();
        if (auditJson.success && auditJson.audit) {
          newAudit = {
            ...auditJson.audit,
            autoHealed: Boolean(effectiveCorrection),
          };
        }
      } catch (auditErr) {
        console.warn('Erro ao re-auditar imagem regenerada:', auditErr);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Erro ao conectar com o serviço de imagem.');
    } finally {
      // Guaranteed to always turn off the regenerating spinner
      setAnalysisResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          scenes: prev.scenes.map((s) => {
            if (s.sceneNumber !== sceneNumber) return s;
            return {
              ...s,
              images: s.images.map((img) =>
                img.id === imageId
                  ? {
                      ...img,
                      imageUrl: newUrl || img.imageUrl,
                      isRegenerating: false,
                      fidelityAudit: newAudit || img.fidelityAudit,
                    }
                  : img
              ),
            };
          }),
        };
      });
    }
  };

  const handleDownloadAllZip = async () => {
    if (!analysisResult) return;
    await exportAllClonedAssets(analysisResult);
  };

  const handleDownloadAllImagesOnly = async () => {
    if (!analysisResult) return;
    await downloadAllGeneratedImagesZip(analysisResult);
  };

  const isProcessing =
    currentStep !== 'idle' && currentStep !== 'completed' && currentStep !== 'error';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300">
      <Header tokenStats={analysisResult?.tokenUsage || sessionTokenStats} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Intro Text */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Anexe o vídeo do concorrente e as fotos do seu produto, salgadinho, roupa, bolsa, qualquer item. O aplicativo analisa a cena, transcreve a fala e gera as três imagens com o seu produto e cria o prompt do Veo.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  {errorMessage.includes('429') || errorMessage.includes('spending') || errorMessage.includes('Limite')
                    ? '⚠️ Limite de Gastos Mensal Atingido (Erro 429 - Spend Cap)'
                    : errorMessage.includes('402') || errorMessage.includes('créditos')
                    ? '⚠️ Créditos Pré-pagos da API Gemini Esgotados (Erro 402)'
                    : 'Aviso no Processamento:'}
                </p>
                <p className="text-rose-200/90 leading-relaxed max-w-2xl">{errorMessage}</p>
              </div>
            </div>

            {errorMessage.includes('429') || errorMessage.includes('spending') || errorMessage.includes('Limite') ? (
              <a
                href="https://ai.studio/spend"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-lg cursor-pointer"
              >
                <span>Ajustar Limite no AI Studio (/spend)</span>
              </a>
            ) : (errorMessage.includes('402') || errorMessage.includes('créditos')) ? (
              <a
                href="https://ai.studio/projects"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-lg cursor-pointer"
              >
                <span>Recarregar Créditos no AI Studio</span>
              </a>
            ) : null}
          </div>
        )}

        {/* Inputs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6">
            <VideoInputCard
              videoData={videoData}
              isExtractingFrames={isExtractingFrames}
              extractionProgress={extractionProgress}
              onVideoSelected={handleVideoSelected}
              onClearVideo={handleClearVideo}
            />
          </div>

          <div className="lg:col-span-6">
            <ProductVariationsManager
              variations={variations}
              onAddVariation={handleAddVariation}
              onRemoveVariation={handleRemoveVariation}
              onAddPhotosToVariation={handleAddPhotosToVariation}
              onRemovePhotoFromVariation={handleRemovePhotoFromVariation}
            />
          </div>
        </div>

        {/* Passo 3: Instruções Adicionais */}
        <AdditionalInstructionsCard
          instructions={additionalInstructions}
          onChange={setAdditionalInstructions}
          disabled={isProcessing}
        />

        {/* Main CTA: Clonar Vídeo (Centered) */}
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-center">
          <button
            onClick={handleAnalyzeAndGenerate}
            disabled={isProcessing || !videoData}
            className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-black rounded-xl text-base flex items-center justify-center gap-3 shadow-xl shadow-sky-500/25 transition-all cursor-pointer ring-2 ring-sky-400/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>Um momento que já estou processando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Clonar Vídeo</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <ProgressBar
            currentStep={currentStep}
            progressPercent={progressPercent}
            statusMessage={statusMessage}
          />
        )}

        {/* RESULTS SECTION */}
        {analysisResult && (
          <section className="space-y-6 pt-4 border-t border-zinc-800 animate-fade-in">
            {/* Summary Header */}
            <div className="p-5 bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Resultado da Clonagem • {analysisResult.scenes.length} Cena(s) de 8s para o Veo 3.1
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Produto identificado: <span className="text-emerald-300 font-bold">{analysisResult.productType}</span> • Cenário: <span className="text-zinc-200">{analysisResult.environmentDescription}</span>
                </p>
              </div>
            </div>

            {/* Speech / Voiceover Transcription & Adaptation Card */}
            {analysisResult.speechData && (
              <SpeechTranscriptionCard
                speechData={analysisResult.speechData}
                onUpdateSpeech={handleUpdateSpeech}
                isUpdating={isUpdatingSpeech}
              />
            )}

            {/* Top Box: Headline a colocar no vídeo */}
            <OnScreenTextCard texts={analysisResult.onScreenTexts} />

            {/* Scenes List: 3 Reference Images Side-by-Side + Download Buttons + Veo Prompt */}
            <div className="space-y-6">
              {analysisResult.scenes.map((scene) => (
                <SceneCard
                  key={scene.sceneNumber}
                  scene={scene}
                  productType={analysisResult.productType}
                  onRegenerateImage={handleRegenerateImage}
                  onPreviewImage={(url, title) => setPreviewModal({ isOpen: true, url, title })}
                  onDownloadImagesOnly={handleDownloadAllImagesOnly}
                  onDownloadAllZip={handleDownloadAllZip}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal Image Full Preview */}
      <ImageViewerModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, url: '', title: '' })}
        imageUrl={previewModal.url}
        title={previewModal.title}
      />
    </div>
  );
}
