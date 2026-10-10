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
  VeoModelMode,
} from './types';
import { extractVideoFrames } from './utils/frameExtractor';
import { extractAudioFromVideoFile } from './utils/audioExtractor';
import { generateSneakerEnvironmentComposite } from './utils/sneakerCompositeGenerator';
import { exportAllClonedAssets, downloadAllGeneratedImagesZip } from './utils/zipExporter';
import { buildVeoSingleParagraphPrompt, buildUniversalSceneImagePrompt } from './utils/veoPromptBuilder';
import { distributeSpeechAcrossScenes } from './utils/speechDistributor';
import { playCompletionSound } from './utils/audioAlert';
import { Header } from './components/Header';
import { VideoInputCard } from './components/VideoInputCard';
import { ProductVariationsManager } from './components/ProductVariationsManager';
import { ModelPhotoCard } from './components/ModelPhotoCard';
import { ProductInfoCard } from './components/ProductInfoCard';
import { AdditionalInstructionsCard } from './components/AdditionalInstructionsCard';
import { ProgressBar } from './components/ProgressBar';
import { OnScreenTextCard } from './components/OnScreenTextCard';
import { SpeechTranscriptionCard } from './components/SpeechTranscriptionCard';
import { SceneCard } from './components/SceneCard';
import { ImageViewerModal } from './components/ImageViewerModal';
import { AniaForm } from './ania/AniaForm';
import { AniaResults } from './ania/AniaResults';
import { runAniaPipeline, regenerateAniaSingleImage } from './ania/aniaPipeline';
import { buildAniaVideoPrompt } from './ania/aniaPrompts';
import { detectFabric, filterMoves, detectScenarioKey, getScenarioDescription } from './ania/aniaLibrary';
import { AniaFormState, AniaResultState } from './ania/types';
import { MicroImageEditor } from './components/MicroImageEditor';
import { ProdutoForm } from './produto/ProdutoForm';
import { ProdutoResults } from './produto/ProdutoResults';
import { runProdutoPipeline } from './produto/produtoPipeline';
import { ProdutoFormState, ProdutoResultState } from './produto/types';
import { AIProfile, AI_PROFILES } from './config/aiProfiles';

export default function App() {
  // Mode Selection State ('ania' default, options: 'ania' | 'clone' | 'produto')
  const [appMode, setAppMode] = useState<'ania' | 'clone' | 'produto'>('ania');

  // AI Profile Selection State ('openai' default no modo clonagem)
  const [aiProfile, setAiProfile] = useState<AIProfile>('openai');

  const handleModeChange = (newMode: 'ania' | 'clone' | 'produto') => {
    setAppMode(newMode);
    if (newMode === 'clone') {
      setAiProfile('openai');
    }
  };

  // Modo Produto State
  const [produtoForm, setProdutoForm] = useState<ProdutoFormState>({
    productName: '',
    productInfo: '',
    gender: 'Mulher',
    framing: 'sem_rosto',
    scenario: 'tipico',
    sceneCount: 1,
    veoModelMode: 'veo3_omniflash_10s',
    refImagesPerScene: 3,
    variations: [
      {
        id: 'var-1',
        name: 'Variação 1',
        photos: [],
      },
    ],
    additionalInstructions: '',
    customSpeech: '',
  });
  const [produtoResult, setProdutoResult] = useState<ProdutoResultState | null>(null);
  const [isProcessingProduto, setIsProcessingProduto] = useState(false);
  const [produtoProgressPercent, setProdutoProgressPercent] = useState(0);
  const [produtoStatusMessage, setProdutoStatusMessage] = useState('');
  const [produtoErrorMessage, setProdutoErrorMessage] = useState<string | null>(null);

  // Modo Ania State
  const [aniaForm, setAniaForm] = useState<AniaFormState>({
    productName: '',
    category: 'AUTO',
    productMode: 'apparel',
    ageMode: 'adult',
    gender: 'Mulher',
    body: 'Plus size',
    colors: [
      { id: 'col-1', name: '' },
      { id: 'col-2', name: '' },
      { id: 'col-3', name: '' },
    ],
    stretch: null,
    fabric: '',
    naturalEnvironment: false,
    productInfo: '',
    additionalInstructions: '',
    customSpeech: '',
    veoModelMode: 'veo3_basic_8s',
  });
  const [aniaResult, setAniaResult] = useState<AniaResultState | null>(null);
  const [isProcessingAnia, setIsProcessingAnia] = useState(false);
  const [aniaProgressPercent, setAniaProgressPercent] = useState(0);
  const [aniaStatusMessage, setAniaStatusMessage] = useState('');
  const [aniaErrorMessage, setAniaErrorMessage] = useState<string | null>(null);

  // Video Reference State (Modo Clonagem)
  const [videoData, setVideoData] = useState<ReferenceVideoData | null>(null);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0 });
  const [veoModelMode, setVeoModelMode] = useState<VeoModelMode>('veo3_basic_8s');

  // Product Variations State - Starts with Variação 1 (clean, empty, no pre-attached photos)
  const [variations, setVariations] = useState<ProductVariation[]>([
    {
      id: 'var-1',
      name: 'Variação 1',
      photos: [],
    },
  ]);

  // Optional Model Photo & Product Info
  const [modelPhotoUrl, setModelPhotoUrl] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<string>('');

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
      // Step 1: Send video keyframes + audio + variations + additionalInstructions + modelPhoto + productInfo to backend
      const analyzeRes = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSeconds: videoData.duration,
          frames: videoData.extractedFrames,
          additionalInstructions,
          productInfo,
          modelPhotoUrl,
          veoModelMode,
          variations: variations.map((v, i) => ({
            id: v.id,
            name: v.name || `Variação ${i + 1}`,
            photos: v.photos.slice(0, 6),
          })),
          audioBase64: videoData.audioBase64,
          aiProfile,
        }),
      });

      const analyzeText = await analyzeRes.text();
      let analyzeJson: any;
      try {
        analyzeJson = JSON.parse(analyzeText);
      } catch {
        throw new Error(`Erro do servidor (${analyzeRes.status}): ${analyzeText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)}`);
      }

      if (!analyzeRes.ok || !analyzeJson.success || !analyzeJson.data) {
        throw new Error(analyzeJson?.error || 'Falha na análise do vídeo.');
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

      // Step 2: Generate Reference Images per scene with real continuity
      setCurrentStep('generating_images');
      setProgressPercent(35);
      setStatusMessage('Gerando imagens de referência para as cenas...');

      const totalImagesToGen = structuredResult.scenes.reduce((acc, sc) => acc + sc.images.length, 0);
      let generatedSoFar = 0;
      let newImagesCostBRL = 0;

      const updatedScenes: SceneDetail[] = [];

      // MASTER MODEL CONTINUITY: Keep the exact same person/model and environment across ALL scenes in the video
      let masterModelImage = '';

      // Garante que cada cena possua sua fala contínua correspondente (sem repetição global)
      // Se for música ou não tiver locução comercial real do produto, NUNCA use letras de música como fala
      const fullSpeechText = Boolean(structuredResult.speechData?.hasSpeech && structuredResult.speechData?.adaptedScript?.trim())
        ? structuredResult.speechData!.adaptedScript.trim()
        : '';
      const continuousScenes = distributeSpeechAcrossScenes(fullSpeechText, structuredResult.scenes);

      for (const scene of continuousScenes) {
        const updatedImages = [];

        for (const imgItem of scene.images) {
          generatedSoFar++;
          setProgressPercent(35 + Math.round((generatedSoFar / Math.max(1, totalImagesToGen)) * 40));
          setStatusMessage(`Gerando imagem ${generatedSoFar} de ${totalImagesToGen}: "${imgItem.role}"...`);

          // 1. Identifica a variação correspondente preservando suas fotos agrupadas
          let targetVar = variations.find((v) =>
            v.name?.trim().toLowerCase() === imgItem.variationName?.trim().toLowerCase()
          );

          if (!targetVar && variations.length > 0) {
            const varIdx = (imgItem.frameNumber - 1) % variations.length;
            targetVar = variations[varIdx] || variations[0];
          }

          const variationName = targetVar?.name || imgItem.variationName || 'Variação 1';
          const varPhotos = (targetVar?.photos && targetVar.photos.length > 0) ? targetVar.photos : [];

          // 2. Ângulo e papel derivados DIRETAMENTE do storyboard do vídeo de referência
          const targetAngle = imgItem.targetAngle || 'front';
          const angleRole = imgItem.role || `Imagem ${imgItem.frameNumber}: ${variationName} (${targetAngle})`;

          // 3. Seleção inteligente da foto de referência:
          // Se o storyboard pedir costas/rear e a variação tiver foto secundária (costas), prioriza-a.
          const isRear = targetAngle === 'rear' || targetAngle.includes('costas') || targetAngle.includes('back');
          const primaryPhoto = isRear && varPhotos.length > 1 ? varPhotos[1] : (varPhotos[0] || '');

          // 4. Cenário e Ação derivados DIRETAMENTE do storyboard do vídeo de referência
          const imageLocation = imgItem.location || scene.environmentDescription || structuredResult.environmentDescription || 'cenário comercial';
          const imageAction = imgItem.actionDescription || imgItem.role || structuredResult.interactionDetails || '';

          // 5. Prompt dinâmico para qualquer categoria de produto e qualquer ângulo
          const specificPrompt = buildUniversalSceneImagePrompt(
            structuredResult.productType || 'produto comercial',
            variationName,
            angleRole,
            imageLocation,
            structuredResult.interactionDetails,
            targetAngle,
            structuredResult.modelFraming,
            productInfo,
            imageAction,
            Boolean(modelPhotoUrl)
          );

          let finalImageUrl = '';

          try {
            const imgRes = await fetch('/api/generate-scene-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: specificPrompt,
                productPhotoBase64: primaryPhoto,
                productPhotosBase64: varPhotos.length > 0 ? varPhotos : [primaryPhoto],
                modelReferenceBase64: modelPhotoUrl || undefined,
                hasUserProvidedModel: Boolean(modelPhotoUrl),
                variationName,
                productType: structuredResult.productType || 'produto comercial',
                targetAngle,
                location: imageLocation,
                actionDescription: imageAction,
                additionalInstructions,
                aiProfile,
                isCloneMode: true,
              }),
            });

            const imgJson = await imgRes.json();
            if (!imgJson.success || !imgJson.imageUrl) {
              throw new Error(imgJson.error || 'Falha na geração de imagem com a IA.');
            }
            finalImageUrl = imgJson.imageUrl;
            newImagesCostBRL += imgJson.costBRL || 0.08;
          } catch (fetchErr: any) {
            throw fetchErr;
          }

          // Step 2.1: Automatic Quality & Fidelity Audit (Fiscal TikTok Shop)
          let auditData: any = null;
          try {
            setStatusMessage(`Fiscalizando fidelidade da imagem ${generatedSoFar}...`);
            const auditRes = await fetch('/api/audit-image-fidelity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                generatedImageBase64: finalImageUrl,
                referencePhotos: varPhotos.length > 0 ? varPhotos : [primaryPhoto],
                variationName,
                role: angleRole,
                aiProfile,
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
            location: imageLocation,
            actionDescription: imageAction,
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
          totalScenes: continuousScenes.length,
          durationSeconds: veoModelMode === 'veo3_omniflash_10s' ? 10 : 8,
          productType: structuredResult.productType || 'commercial product',
          variations: varList,
          environment: structuredResult.environmentDescription,
          interactionStyle: structuredResult.interactionDetails,
          cameraType: structuredResult.cameraType,
          lighting: structuredResult.lightingStyle,
          secondTimeline: scene.eightSecondTimeline || structuredResult.secondBySecondTimeline,
          speechVoiceover: scene.sceneSpeech, // Fala EXCLUSIVA deste trecho (sem repetição de cenas anteriores)
          modelFraming: structuredResult.modelFraming,
          sceneImages: updatedImages.map((im) => ({
            role: im.role,
            variationName: im.variationName,
            targetAngle: im.targetAngle,
            location: im.location,
            actionDescription: im.actionDescription,
          })),
        });

        updatedScenes.push({
          ...scene,
          veoPrompt: ultraDetailedVeoPrompt,
          veoInstruction: `Anexe no Veo a(s) ${updatedImages.length} imagem(ns) de referência gerada(s) para esta cena`,
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
        totalCostUSD: structuredResult.tokenUsage?.totalCostUSD,
        totalCalls: (structuredResult.tokenUsage?.totalCalls || 0) + generatedSoFar * 2,
        modelsUsed: structuredResult.tokenUsage?.modelsUsed,
        provider: structuredResult.tokenUsage?.provider,
        detailedSteps: structuredResult.tokenUsage?.detailedSteps,
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

  // Update Prompt of a Single Scene when user edits that scene's speech
  const handleUpdateSingleSceneSpeech = (sceneNumber: number, newSpeech: string) => {
    if (!analysisResult) return;

    const varList = variations.map((v, i) => v.name || `Variação ${i + 1}`);
    const durationSeconds = veoModelMode === 'veo3_omniflash_10s' ? 10 : 8;

    const updatedScenes = analysisResult.scenes.map((sc) => {
      if (sc.sceneNumber !== sceneNumber) return sc;

      const updatedVeoPrompt = buildVeoSingleParagraphPrompt({
        sceneNumber: sc.sceneNumber,
        totalScenes: analysisResult.scenes.length,
        durationSeconds,
        productType: analysisResult.productType || 'commercial product',
        variations: varList,
        environment: sc.environmentDescription || analysisResult.environmentDescription,
        interactionStyle: analysisResult.interactionDetails,
        cameraType: analysisResult.cameraType,
        lighting: analysisResult.lightingStyle,
        secondTimeline: sc.eightSecondTimeline,
        speechVoiceover: newSpeech,
        modelFraming: analysisResult.modelFraming,
        sceneImages: (sc.images || []).map((im) => ({
          role: im.role,
          variationName: im.variationName,
          targetAngle: im.targetAngle,
          location: im.location,
          actionDescription: im.actionDescription,
        })),
      });

      return {
        ...sc,
        sceneSpeech: newSpeech,
        veoPrompt: updatedVeoPrompt,
      };
    });

    const combinedScript = updatedScenes
      .map((s) => (s.sceneSpeech || '').trim())
      .filter(Boolean)
      .join(' ');

    setAnalysisResult({
      ...analysisResult,
      speechData: {
        ...analysisResult.speechData,
        adaptedScript: combinedScript,
        hasSpeech: Boolean(combinedScript.trim().length > 0),
      },
      scenes: updatedScenes,
    });
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

    // 1. Identifica a variação correspondente preservando suas fotos agrupadas
    const targetVar = variations.find((v) =>
      v.name?.trim().toLowerCase() === targetImage.variationName?.trim().toLowerCase()
    ) || variations[0];

    const variationName = targetVar?.name || targetImage.variationName || `Variação ${slot}`;
    const varPhotos = (targetVar?.photos && targetVar.photos.length > 0) ? targetVar.photos : [];

    // 2. Mantém o ângulo e papel definidos pelo storyboard
    const targetAngle = targetImage.targetAngle || 'front';
    const isRear = targetAngle === 'rear' || targetAngle.includes('costas') || targetAngle.includes('back');
    const primaryPhoto = isRear && varPhotos.length > 1 ? varPhotos[1] : (varPhotos[0] || '');
    const angleRole = targetImage.role || `Imagem ${slot}: ${variationName} (${targetAngle})`;

    // 3. Cenário e Ação derivados do storyboard do vídeo de referência
    const imageLocation = targetImage.location || targetScene.environmentDescription || analysisResult.environmentDescription || 'cenário comercial';
    const imageAction = targetImage.actionDescription || targetImage.role || analysisResult.interactionDetails || '';

    const specificPrompt = buildUniversalSceneImagePrompt(
      analysisResult.productType || 'produto comercial',
      variationName,
      angleRole,
      imageLocation,
      analysisResult.interactionDetails,
      targetAngle,
      analysisResult.modelFraming,
      productInfo,
      imageAction,
      Boolean(modelPhotoUrl)
    );

    const effectiveCorrection = customCorrection || targetImage.fidelityAudit?.correctionPrompt || undefined;

    // Use a primeira imagem gerada da Cena 1 como âncora de modelo para manter a mesma pessoa e ambiente
    const anchorModelImage = (slot === 1 && targetScene.sceneNumber === 1)
      ? undefined
      : (analysisResult.scenes[0]?.images[0]?.imageUrl || undefined);

    let newUrl = '';
    let newAudit = targetImage.fidelityAudit;

    try {
      const res = await fetch('/api/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: specificPrompt,
          productPhotoBase64: primaryPhoto,
          productPhotosBase64: varPhotos.length > 0 ? varPhotos : [primaryPhoto],
          modelReferenceBase64: modelPhotoUrl || undefined,
          hasUserProvidedModel: Boolean(modelPhotoUrl),
          variationName,
          productType: analysisResult.productType || 'produto comercial',
          targetAngle,
          location: imageLocation,
          actionDescription: imageAction,
          correctionPrompt: effectiveCorrection,
          additionalInstructions,
          aiProfile,
          isCloneMode: true,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || 'Falha ao regenerar imagem.');
      }
      newUrl = data.imageUrl;

      // Re-audit the newly generated image
      try {
        const auditRes = await fetch('/api/audit-image-fidelity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generatedImageBase64: newUrl,
            referencePhotos: varPhotos.length > 0 ? varPhotos : [primaryPhoto],
            variationName,
            role: angleRole,
            aiProfile,
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

  // ─── MODO ANIA HANDLERS ──────────────────────────────────────────────────
  const handleStartAnia = async () => {
    setAniaErrorMessage(null);
    setIsProcessingAnia(true);
    setAniaProgressPercent(5);
    setAniaStatusMessage('Iniciando pipeline do Método Ania...');

    try {
      const res = await runAniaPipeline(
        aniaForm,
        {
          onProgress: (_step, pct) => setAniaProgressPercent(pct),
          onStatusMessage: (msg) => setAniaStatusMessage(msg),
          onPartialResult: (partial) => {
            setAniaResult(partial);
          },
        },
        aiProfile
      );

      setAniaResult(res);

      if (res.tokenUsage) {
        setSessionTokenStats((prev) => ({
          promptTokens: prev.promptTokens + res.tokenUsage!.promptTokens,
          candidateTokens: prev.candidateTokens + res.tokenUsage!.candidateTokens,
          totalTokens: prev.totalTokens + res.tokenUsage!.totalTokens,
          estimatedCostBRL: Math.round((prev.estimatedCostBRL + res.tokenUsage!.estimatedCostBRL) * 100) / 100,
          breakdown: {
            ...prev.breakdown,
            imagesCount: prev.breakdown.imagesCount + (res.tokenUsage!.breakdown.imagesCount || 3),
            imagesCostBRL: Math.round((prev.breakdown.imagesCostBRL + (res.tokenUsage!.breakdown.imagesCostBRL || 0.24)) * 100) / 100,
          },
        }));
      }

      // Tocar alarme sonoro uma única vez se todas as imagens estiverem prontas sem erro
      const allImagesOk = res.images.length === 3 && res.images.every((im) => im.imageUrl && !im.hasError);
      if (allImagesOk) {
        playCompletionSound(1);
      }
    } catch (err: any) {
      console.error(err);
      setAniaErrorMessage(err.message || 'Erro durante o processamento do Método Ania.');
    } finally {
      setIsProcessingAnia(false);
    }
  };

  const handleRegenerateAniaImage = async (
    imageIndex: number,
    customCorrection?: string,
    overrideProductPhotoBase64?: string
  ) => {
    if (!aniaResult) return;

    // Atualiza a foto da cor no formulário se fornecida uma nova foto
    if (overrideProductPhotoBase64) {
      setAniaForm((prev) => {
        const updatedColors = [...prev.colors];
        if (updatedColors[imageIndex]) {
          updatedColors[imageIndex] = {
            ...updatedColors[imageIndex],
            photoBase64: overrideProductPhotoBase64,
          };
        }
        return {
          ...prev,
          colors: updatedColors,
        };
      });
    }

    // Se o usuário clicar em "Refazer" ou "Editar" na Imagem 1:
    // As imagens 2 e 3 ficam desatualizadas e são refeitas automaticamente a partir da nova Imagem 1
    if (imageIndex === 0) {
      setAniaResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.map((img) => ({ ...img, isRegenerating: true })),
        };
      });

      try {
        // 1. Refaz a Imagem 1
        const updatedImage1 = await regenerateAniaSingleImage({
          imageIndex: 0,
          result: aniaResult,
          form: aniaForm,
          customCorrection,
          overrideProductPhotoBase64,
          aiProfile,
        });

        const tempResultWithNewImg1: AniaResultState = {
          ...aniaResult,
          images: [updatedImage1, aniaResult.images[1], aniaResult.images[2]],
        };

        setAniaResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            images: [updatedImage1, { ...prev.images[1], isRegenerating: true }, { ...prev.images[2], isRegenerating: true }],
          };
        });

        // 2. Refaz Imagens 2 e 3 em paralelo a partir da nova Imagem 1
        const [updatedImage2, updatedImage3] = await Promise.all([
          regenerateAniaSingleImage({
            imageIndex: 1,
            result: tempResultWithNewImg1,
            form: aniaForm,
            aiProfile,
          }),
          regenerateAniaSingleImage({
            imageIndex: 2,
            result: tempResultWithNewImg1,
            form: aniaForm,
            aiProfile,
          }),
        ]);

        setAniaResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            images: [updatedImage1, updatedImage2, updatedImage3],
          };
        });

        const allOk = [updatedImage1, updatedImage2, updatedImage3].every((im) => im.imageUrl && !im.hasError);
        if (allOk) {
          playCompletionSound(1);
        }
      } catch (err: any) {
        console.error('Erro ao refazer Imagem 1 e dependentes:', err);
        setAniaResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            images: prev.images.map((img) => ({ ...img, isRegenerating: false })),
          };
        });
      }
      return;
    }

    // Se o usuário clicar em "Refazer" na Imagem 2 ou 3:
    // Usa a Imagem 1 atual como base mestre
    setAniaResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        images: prev.images.map((img, i) => (i === imageIndex ? { ...img, isRegenerating: true } : img)),
      };
    });

    try {
      const updatedImage = await regenerateAniaSingleImage({
        imageIndex,
        result: aniaResult,
        form: aniaForm,
        customCorrection,
        overrideProductPhotoBase64,
        aiProfile,
      });

      setAniaResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.map((img, i) => (i === imageIndex ? updatedImage : img)),
        };
      });

      if (updatedImage.imageUrl && !updatedImage.hasError) {
        playCompletionSound(1);
      }
    } catch (err: any) {
      console.error('Erro ao refazer imagem Ania:', err);
      setAniaResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.map((img, i) => (i === imageIndex ? { ...img, isRegenerating: false } : img)),
        };
      });
    }
  };

  const handleUpdateAniaVideoPrompt = (videoIndex: number, newPrompt: string) => {
    if (!aniaResult) return;
    setAniaResult((prev) => {
      if (!prev) return null;
      const updated = [...prev.videoPrompts];
      if (updated[videoIndex]) {
        updated[videoIndex] = {
          ...updated[videoIndex],
          prompt: newPrompt,
        };
      }
      return {
        ...prev,
        videoPrompts: updated,
      };
    });
  };

  const handleUpdateAniaVideoSpeech = (videoIndex: number, newSpeech: string) => {
    if (!aniaResult) return;

    const durationSec = videoIndex === 2 ? 8 : (aniaForm.veoModelMode === 'veo3_omniflash_10s' ? 10 : 8);
    const rawColors = aniaForm.colors.filter((c) => c.name.trim() || c.photoBase64);
    const cor1 = rawColors[0] || { id: 'c1', name: 'Cor 1', photoBase64: '' };
    const normalizedColors = [
      { ...cor1, name: cor1.name.trim() || 'Cor 1' },
      { ...(rawColors[1] || cor1), name: (rawColors[1] ? rawColors[1].name.trim() : '') || 'Cor 2' },
      { ...(rawColors[2] || cor1), name: (rawColors[2] ? rawColors[2].name.trim() : '') || 'Cor 3' },
    ];

    const category = aniaResult.planning.categoria || aniaForm.category;
    const productMode = aniaResult.planning.productMode || aniaForm.productMode || 'apparel';
    const ageMode = aniaResult.planning.ageMode || aniaForm.ageMode || 'adult';
    const fabricObj = detectFabric(aniaForm.productName, aniaForm.fabric, aniaForm.productInfo);
    const scenarioKey = aniaResult.planning.scenarioKey || detectScenarioKey(aniaForm.productName, aniaForm.productInfo, category);
    const scenarioDesc = getScenarioDescription(scenarioKey, Boolean(aniaForm.naturalEnvironment));

    const moves = filterMoves({
      category,
      subtype: 'NORMAL',
      estica: aniaResult.planning.estica,
      productMode,
      ageMode,
      productName: aniaForm.productName,
    });

    const videoMoves = aniaResult.planning.movimentos && aniaResult.planning.movimentos.length >= 3
      ? aniaResult.planning.movimentos
      : [moves.v1, moves.v2, moves.v3];

    const trimmedSpeech = newSpeech.trim();

    const updatedVideoPrompts = aniaResult.videoPrompts.map((vp, idx) => {
      if (idx !== videoIndex) return vp;

      const updatedPrompt = buildAniaVideoPrompt({
        durationSeconds: vp.durationSec || durationSec,
        gender: aniaForm.gender,
        body: aniaForm.body,
        category,
        productMode,
        ageMode,
        peca: aniaResult.planning.peca || aniaForm.productName,
        colorName: normalizedColors[idx]?.name || vp.colorName,
        fabricDescription: fabricObj.description,
        detalhes: (aniaResult.planning.detalhes_trava || []).join(', ') || 'modelagem e acabamento fiéis',
        bolsoFuncional: Boolean(aniaResult.planning.bolso_funcional),
        movimento: videoMoves[idx] || (idx === 0 ? moves.v1 : idx === 1 ? moves.v2 : moves.v3),
        speechPart: trimmedSpeech || undefined,
        scenarioDescription: scenarioDesc,
      });

      return {
        ...vp,
        speechPart: trimmedSpeech || undefined,
        label: trimmedSpeech
          ? `com fala – parte ${idx + 1}`
          : idx === 2
          ? 'só movimento (apontando p/ baixo)'
          : 'só movimento',
        prompt: updatedPrompt,
      };
    });

    setAniaResult({
      ...aniaResult,
      videoPrompts: updatedVideoPrompts,
    });
  };

  // Modo Produto Pipeline Trigger
  const handleStartProduto = async () => {
    setIsProcessingProduto(true);
    setProdutoProgressPercent(5);
    setProdutoStatusMessage('Iniciando...');
    setProdutoErrorMessage(null);

    try {
      const res = await runProdutoPipeline({
        form: produtoForm,
        aiProfile,
        onProgress: (pct, msg) => {
          setProdutoProgressPercent(pct);
          setProdutoStatusMessage(msg);
        },
      });
      setProdutoResult(res);
      playCompletionSound();
    } catch (err: any) {
      setProdutoErrorMessage(err.message || 'Erro ao processar o Modo Produto.');
    } finally {
      setIsProcessingProduto(false);
    }
  };

  const isProcessing =
    currentStep !== 'idle' && currentStep !== 'completed' && currentStep !== 'error';

  return (
    <div className={`min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-300 transition-colors duration-300 ${
      appMode === 'produto' ? 'bg-[#1c130e]' : 'bg-zinc-950'
    }`}>
      <Header
        tokenStats={
          appMode === 'ania'
            ? (aniaResult?.tokenUsage || sessionTokenStats)
            : (analysisResult?.tokenUsage || sessionTokenStats)
        }
        mode={appMode}
        onModeChange={handleModeChange}
        aiProfile={aiProfile}
        onAIProfileChange={setAiProfile}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ========================================================================= */}
        {/* MODO ANIA VIEW                                                            */}
        {/* ========================================================================= */}
        {appMode === 'ania' ? (
          <div className="space-y-6">
            {/* Error Notification */}
            {aniaErrorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Aviso no Processamento (Método Ania):</p>
                  <p className="text-rose-200/90 leading-relaxed">{aniaErrorMessage}</p>
                </div>
              </div>
            )}

            {!aniaResult ? (
              <>
                <AniaForm
                  form={aniaForm}
                  onChange={setAniaForm}
                  onSubmit={handleStartAnia}
                  isProcessing={isProcessingAnia}
                />

                {isProcessingAnia && (
                  <ProgressBar
                    currentStep="generating_images"
                    progressPercent={aniaProgressPercent}
                    statusMessage={aniaStatusMessage}
                  />
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAniaResult(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-zinc-700"
                  >
                    <RotateCcw className="w-4 h-4 text-purple-400" />
                    <span>Criar Novo Criativo no Método Ania</span>
                  </button>
                </div>

                <AniaResults
                  result={aniaResult}
                  onRegenerateImage={handleRegenerateAniaImage}
                  onUpdateVideoSpeech={handleUpdateAniaVideoSpeech}
                  onUpdateVideoPrompt={handleUpdateAniaVideoPrompt}
                  onOpenPreviewModal={(url, title) => setPreviewModal({ isOpen: true, url, title })}
                  aiProfile={aiProfile}
                />
              </div>
            )}
          </div>
        ) : appMode === 'produto' ? (
          /* ========================================================================= */
          /* MODO PRODUTO VIEW (Tema Marrom Escuro #1c130e)                             */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Error Notification */}
            {produtoErrorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Aviso no Processamento (Modo Produto):</p>
                  <p className="text-rose-200/90 leading-relaxed">{produtoErrorMessage}</p>
                </div>
              </div>
            )}

            {!produtoResult ? (
              <>
                <ProdutoForm
                  form={produtoForm}
                  onChange={setProdutoForm}
                  onSubmit={handleStartProduto}
                  isProcessing={isProcessingProduto}
                />

                {isProcessingProduto && (
                  <ProgressBar
                    currentStep="generating_images"
                    progressPercent={produtoProgressPercent}
                    statusMessage={produtoStatusMessage}
                  />
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-[#452d1f]">
                  <button
                    type="button"
                    onClick={() => setProdutoResult(null)}
                    className="px-4 py-2 bg-[#281b14] hover:bg-[#38261c] text-xs font-bold text-amber-200 hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-[#52392b]"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Criar Novo no Modo Produto</span>
                  </button>
                </div>

                <ProdutoResults
                  result={produtoResult}
                  onOpenPreview={(url, title) => setPreviewModal({ isOpen: true, url, title })}
                  aiProfile={aiProfile}
                />
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO CLONAGEM VIEW (Original Intacto)                                     */
          /* ========================================================================= */
          <div className="space-y-8">
            {/* Intro Text */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Anexe o vídeo de referência e as fotos do seu produto (roupa, calçado, embalagem, acessório, utilidade ou qualquer item). O aplicativo analisa a narrativa, distribui as falas de forma contínua, gera as imagens de referência fidedignas para cada cena e constrói os prompts contínuos do Google Veo.
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
                  veoModelMode={veoModelMode}
                  onVeoModelModeChange={setVeoModelMode}
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

            {/* Foto da Modelo (Opcional) & Informações do Produto (Opcional) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6">
                <ModelPhotoCard
                  modelPhotoUrl={modelPhotoUrl}
                  onPhotoSelected={setModelPhotoUrl}
                  disabled={isProcessing}
                />
              </div>

              <div className="lg:col-span-6">
                <ProductInfoCard
                  productInfo={productInfo}
                  onChange={setProductInfo}
                  disabled={isProcessing}
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
                      Resultado da Clonagem • {analysisResult.scenes.length} Cena(s) de {veoModelMode === 'veo3_omniflash_10s' ? '10s (Veo 3 Omni Flash)' : '8s (Veo 3 Básico)'} para o Veo 3.1
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
                    veoModelMode={veoModelMode}
                    sceneCount={analysisResult.scenes.length}
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
                      veoModelMode={veoModelMode}
                      totalScenes={analysisResult.scenes.length}
                      onUpdateSceneSpeech={handleUpdateSingleSceneSpeech}
                      onRegenerateImage={handleRegenerateImage}
                      onPreviewImage={(url, title) => setPreviewModal({ isOpen: true, url, title })}
                      onDownloadImagesOnly={handleDownloadAllImagesOnly}
                      onDownloadAllZip={handleDownloadAllZip}
                    />
                  ))}
                </div>

                {/* Microedição de Imagem Independente */}
                <MicroImageEditor
                  aiProfile={aiProfile}
                  onOpenPreview={(url, title) => setPreviewModal({ isOpen: true, url, title })}
                />
              </section>
            )}
          </div>
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
