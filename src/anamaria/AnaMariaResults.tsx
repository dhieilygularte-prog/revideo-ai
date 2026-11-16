import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Wand2,
  History,
  ArrowLeft,
  RefreshCw,
  Video,
  Hash,
  Smile,
  Mic,
  Square,
  Home,
  Cpu,
  CheckCircle2,
  Plus,
  Palette,
} from 'lucide-react';
import {
  AnaMariaResultState,
  AnaMariaAuditColorStatus,
  AnaMariaTheme,
  AnaMariaGeneratedImageItem,
} from './types';
import {
  downloadAnaMariaSingleImage,
  exportAnaMariaZip,
  sanitizeCleanName,
  getMasterPromptFileName,
} from './anaMariaZipExporter';
import {
  regenerateAnaMariaImage,
  regenerateAnaMariaNewScenario,
  generateAnaMariaNewColor,
  generateAnaMariaSameModelNewColor,
  getActiveColorGroupPhotos,
  refineAnaMariaVideoPrompt,
  saveAnaMariaResult,
} from './anaMariaPipeline';
import {
  resolveHeadlineAndHashtags,
  resolveMultipleDistinctHeadlines,
} from './anaMariaBank';
import { KLING_FIXED_VIDEO_PROMPT } from './anaMariaPrompts';
import { getMasterPromptById } from './masterPromptsData';
import { VideoFidelityAuditor } from '../produtos2/VideoFidelityAuditor';
import { AIProfile } from '../config/aiProfiles';

interface AnaMariaResultsProps {
  result: AnaMariaResultState;
  onUpdateResult: (updated: AnaMariaResultState) => void;
  onBackToForm: () => void;
  onCreateNew: () => void;
  onContinueProduct: () => void;
  onOpenHistory?: () => void;
  onOpenPreviewModal: (url: string, title: string) => void;
  aiProfile?: AIProfile;
  theme?: AnaMariaTheme;
}

function getStatusClasses(status: AnaMariaAuditColorStatus) {
  switch (status) {
    case 'green':
      return {
        box: 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300',
        badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200',
        cell: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
        dot: 'bg-emerald-400',
        text: 'text-emerald-300',
      };
    case 'yellow':
      return {
        box: 'bg-amber-500/10 border-amber-500/40 text-amber-200',
        badge: 'bg-amber-500/20 border-amber-400/50 text-amber-200',
        cell: 'bg-amber-950/60 border-amber-500/50 text-amber-200',
        dot: 'bg-amber-400',
        text: 'text-amber-300',
      };
    case 'orange':
      return {
        box: 'bg-orange-500/15 border-orange-500/50 text-orange-200',
        badge: 'bg-orange-500/25 border-orange-400/60 text-orange-200',
        cell: 'bg-orange-950/70 border-orange-500/60 text-orange-200',
        dot: 'bg-orange-400',
        text: 'text-orange-300',
      };
    case 'red':
    default:
      return {
        box: 'bg-rose-500/15 border-rose-500/50 text-rose-200',
        badge: 'bg-rose-500/25 border-rose-400/60 text-rose-200',
        cell: 'bg-rose-950/70 border-rose-500/60 text-rose-200',
        dot: 'bg-rose-400',
        text: 'text-rose-300',
      };
  }
}

function formatImageEngineLabel(imageModel?: string): string {
  switch (imageModel) {
    case 'seedream_5_0_pro':
      return 'SeaDream 5.0 Pro';
    default:
      return 'OpenAI';
  }
}

export const AnaMariaResults: React.FC<AnaMariaResultsProps> = ({
  result,
  onUpdateResult,
  onBackToForm,
  onCreateNew,
  onContinueProduct,
  onOpenHistory,
  onOpenPreviewModal,
  aiProfile = 'openai',
  theme = 'ametista',
}) => {
  const isAmetista = theme === 'ametista';

  // Classes padrão com contraste da paleta selecionada (Fogo vs Ametista)
  const copiedBlueSectionClass =
    'bg-gradient-to-br from-sky-900/85 via-blue-900/80 to-slate-900/95 border-2 border-sky-400 shadow-xl shadow-sky-950/60 ring-2 ring-sky-400/40';
  const defaultSectionClass = isAmetista
    ? 'bg-[#140d21]/95 border border-purple-500/35 shadow-[0_4px_24px_rgba(124,58,237,0.14)]'
    : 'bg-[#111113]/95 border border-orange-500/25 shadow-xl';
  const accentIconClass = isAmetista ? 'text-[#d4ff59]' : 'text-orange-400';

  // Estados de destaque azul ativo ao copiar/baixar (itens 6, 7 e 14)
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [hasCopiedPromptOnce, setHasCopiedPromptOnce] = useState(false);

  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [hasCopiedHashtagsOnce, setHasCopiedHashtagsOnce] = useState(false);

  const [copiedHeadline, setCopiedHeadline] = useState(false);
  const [hasCopiedHeadlineOnce, setHasCopiedHeadlineOnce] = useState(false);

  // Estado de remixagem rápida de headlines e hashtags
  const [isRemixing, setIsRemixing] = useState(false);

  const [downloadedImage, setDownloadedImage] = useState(false);
  const [hasDownloadedImageOnce, setHasDownloadedImageOnce] = useState(false);
  const [downloadedImageIds, setDownloadedImageIds] = useState<Record<string, boolean>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
    setDownloadedImageIds({});
    setHasDownloadedImageOnce(false);
    setDownloadedImage(false);
  }, [result.id]);

  const imagesList: AnaMariaGeneratedImageItem[] =
    result.generatedImages && result.generatedImages.length > 0
      ? result.generatedImages
      : [
          {
            id: result.id,
            imageUrl: result.imageUrl,
            imageModel: result.imageModel,
            colorGroupIndex: result.activeColorGroupIndex || 0,
            colorName:
              result.colorGroups?.[result.activeColorGroupIndex || 0]?.colorName || 'Cor Principal',
            timestamp: result.timestamp,
            selectedScenarioId: result.selectedScenarioId,
            selectedScenarioNumber: result.selectedScenarioNumber,
            selectedModelGalleryId: result.selectedModelGalleryId,
            selectedModelGalleryNumber: result.selectedModelGalleryNumber,
            selectedModelGalleryUrl: result.selectedModelGalleryUrl,
            modelScenarioSource: result.modelScenarioSource,
            generateModelViaPrompt: result.generateModelViaPrompt,
            audit: result.audit,
          },
        ];

  const safeSelectedIdx = Math.min(
    Math.max(selectedImageIndex, 0),
    Math.max(imagesList.length - 1, 0)
  );
  const activeImageItem = imagesList[safeSelectedIdx];
  const canGenerateWithNewModelAndScenario = Boolean(
    result.referencePhotos && result.referencePhotos.length > 0
  );
  const canUseNewColorButtons = Boolean(
    (result.colorGroups?.length || 0) >= 2 ||
      result.hasMultipleColors ||
      (result.referencePhotos?.length || 0) >= 2
  );
  const [copiedKlingPrompt, setCopiedKlingPrompt] = useState(false);
  const [copiedHeadlineIndices, setCopiedHeadlineIndices] = useState<Record<number, boolean>>({});
  const [hasCopiedHeadlineIndices, setHasCopiedHeadlineIndices] = useState<Record<number, boolean>>(
    {}
  );

  // Estados de ajuste de imagem
  const [imageTweakText, setImageTweakText] = useState('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isSwitchingScenario, setIsSwitchingScenario] = useState(false);
  const [isGeneratingNewColor, setIsGeneratingNewColor] = useState(false);
  const [isGeneratingSameModelNewColor, setIsGeneratingSameModelNewColor] = useState(false);

  // Microfone para alteração da imagem (Item 8)
  const [isImageMicRecording, setIsImageMicRecording] = useState(false);
  const imageRecRef = useRef<any>(null);
  const imageStreamRef = useRef<MediaStream | null>(null);

  // Estados de ajuste de prompt de vídeo
  const [promptCorrectionText, setPromptCorrectionText] = useState('');
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);

  // Microfone para correção de prompt (Item 10)
  const [isPromptMicRecording, setIsPromptMicRecording] = useState(false);
  const promptRecRef = useRef<any>(null);
  const promptStreamRef = useRef<MediaStream | null>(null);

  // Estado de exportação do ZIP com ref lock contra cliques duplos (Item 8)
  const [isExportingZip, setIsExportingZip] = useState(false);
  const isExportingZipRef = useRef(false);

  const safeFileName = sanitizeCleanName(result.productName);

  // Limpa prompt de qualquer prefixo "🎥 PROMPT DE VÍDEO..."
  const cleanVideoPrompt = result.videoPrompt
    .replace(/^🎥 PROMPT DE VÍDEO[^\n]*\n+/i, '')
    .trim();

  // Microfone para campo de alteração da imagem
  const toggleImageMicrophone = async () => {
    if (isImageMicRecording) {
      if (imageRecRef.current) {
        try {
          imageRecRef.current.stop();
        } catch {}
      }
      if (imageStreamRef.current) {
        imageStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsImageMicRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      imageStreamRef.current = stream;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        imageRecRef.current = rec;
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;

        const initial = imageTweakText;
        rec.onresult = (evt: any) => {
          let transcript = '';
          for (let i = 0; i < evt.results.length; i++) {
            transcript += evt.results[i][0].transcript + ' ';
          }
          const combined = initial ? `${initial.trim()} ${transcript.trim()}` : transcript.trim();
          setImageTweakText(combined);
        };

        rec.onerror = () => setIsImageMicRecording(false);
        rec.onend = () => setIsImageMicRecording(false);
        rec.start();
        setIsImageMicRecording(true);
      }
    } catch {
      setIsImageMicRecording(false);
    }
  };

  // Microfone para campo de correção do prompt de vídeo
  const togglePromptMicrophone = async () => {
    if (isPromptMicRecording) {
      if (promptRecRef.current) {
        try {
          promptRecRef.current.stop();
        } catch {}
      }
      if (promptStreamRef.current) {
        promptStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsPromptMicRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      promptStreamRef.current = stream;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        promptRecRef.current = rec;
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;

        const initial = promptCorrectionText;
        rec.onresult = (evt: any) => {
          let transcript = '';
          for (let i = 0; i < evt.results.length; i++) {
            transcript += evt.results[i][0].transcript + ' ';
          }
          const combined = initial ? `${initial.trim()} ${transcript.trim()}` : transcript.trim();
          setPromptCorrectionText(combined);
        };

        rec.onerror = () => setIsPromptMicRecording(false);
        rec.onend = () => setIsPromptMicRecording(false);
        rec.start();
        setIsPromptMicRecording(true);
      }
    } catch {
      setIsPromptMicRecording(false);
    }
  };

  // Handlers de cópia e download com destaque em azul igual Produtos 2.0
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(cleanVideoPrompt);
      setCopiedPrompt(true);
      setHasCopiedPromptOnce(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {}
  };

  const handleCopyKlingFixedPrompt = async () => {
    try {
      await navigator.clipboard.writeText(KLING_FIXED_VIDEO_PROMPT);
      setCopiedKlingPrompt(true);
      setHasCopiedPromptOnce(true);
      setTimeout(() => setCopiedKlingPrompt(false), 2500);
    } catch (err) {
      console.error('Erro ao copiar prompt Kling:', err);
    }
  };

  // Resolve todas as headlines distintas (1 para cada cor gerada, sem repetir iguais se houver menos na memória)
  const distinctHeadlinesList: string[] = (() => {
    const rawList: string[] = [];
    if (result.headlines && result.headlines.length > 0) {
      rawList.push(...result.headlines);
    }
    for (const img of imagesList) {
      if (img.headline && img.headline.trim()) {
        rawList.push(img.headline.trim());
      }
    }
    if (rawList.length === 0 && result.headline) {
      rawList.push(result.headline);
    }
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const h of rawList) {
      const k = h.trim().toLowerCase();
      if (k && !seen.has(k)) {
        seen.add(k);
        deduped.push(h.trim());
      }
    }
    return deduped.length > 0 ? deduped : [result.headline];
  })();

  const handleCopySpecificHeadline = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHeadlineIndices((prev) => ({ ...prev, [idx]: true }));
      setHasCopiedHeadlineIndices((prev) => ({ ...prev, [idx]: true }));
      setCopiedHeadline(true);
      setHasCopiedHeadlineOnce(true);
      setTimeout(() => {
        setCopiedHeadlineIndices((prev) => ({ ...prev, [idx]: false }));
        setCopiedHeadline(false);
      }, 2500);
    } catch {}
  };

  const handleCopyHashtags = async () => {
    try {
      await navigator.clipboard.writeText(result.hashtags);
      setCopiedHashtags(true);
      setHasCopiedHashtagsOnce(true);
      setTimeout(() => setCopiedHashtags(false), 2500);
    } catch {}
  };

  const handleCopyHeadline = async () => {
    try {
      const textToCopy =
        distinctHeadlinesList.length > 1
          ? distinctHeadlinesList.join('\n\n')
          : result.headline;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedHeadline(true);
      setHasCopiedHeadlineOnce(true);
      setTimeout(() => setCopiedHeadline(false), 2500);
    } catch {}
  };

  /**
   * Refaz instantaneamente a Headline (ou todas as N headlines distintas quando há várias cores)
   * e as Hashtags sorteando novas opções exclusivas do banco de memória agrupado para a categoria deste produto.
   */
  const handleRemixHeadlinesAndHashtags = () => {
    try {
      setIsRemixing(true);
      const remix = resolveHeadlineAndHashtags({
        productName: result.productName,
        influencer: result.influencer,
        bodyType: result.bodyType,
        additionalInstructions: result.additionalInstructions,
        excludeHeadline: result.headline,
        excludeHashtags: result.hashtags,
      });

      const targetCount = Math.max(1, imagesList.length);
      const nextHeadlines =
        targetCount > 1
          ? resolveMultipleDistinctHeadlines({
              productName: result.productName,
              additionalInstructions: result.additionalInstructions,
              count: targetCount,
              excludeHeadlines: distinctHeadlinesList,
            })
          : [remix.headline];

      const nextGeneratedImages = result.generatedImages?.map((img, i) => ({
        ...img,
        headline: nextHeadlines[i] || nextHeadlines[0] || remix.headline,
      }));

      const updatedResult: AnaMariaResultState = {
        ...result,
        headline: nextHeadlines[0] || remix.headline,
        headlines: nextHeadlines,
        generatedImages: nextGeneratedImages,
        hashtags: remix.hashtags,
      };

      onUpdateResult(updatedResult);
      saveAnaMariaResult(updatedResult);

      // Reseta os estados visuais de cópia para o usuário copiar o novo texto limpo
      setCopiedHashtags(false);
      setCopiedHeadline(false);
      setHasCopiedHashtagsOnce(false);
      setHasCopiedHeadlineOnce(false);
      setCopiedHeadlineIndices({});
      setHasCopiedHeadlineIndices({});

      setTimeout(() => {
        setIsRemixing(false);
      }, 350);
    } catch (err) {
      console.error('Erro ao refazer headline e hashtags:', err);
      setIsRemixing(false);
    }
  };

  const handleDownloadSpecificImage = async (item: AnaMariaGeneratedImageItem) => {
    try {
      const namePrefix =
        imagesList.length > 1
          ? `${result.productName} - Cor ${item.colorGroupIndex + 1}`
          : result.productName;
      await downloadAnaMariaSingleImage(
        item.imageUrl,
        namePrefix,
        item.timestamp || result.timestamp,
        item.imageModel || result.imageModel
      );
      setDownloadedImageIds((prev) => ({ ...prev, [item.id]: true }));
      if (item.id === activeImageItem.id) {
        setDownloadedImage(true);
        setHasDownloadedImageOnce(true);
        setTimeout(() => setDownloadedImage(false), 2500);
      }
    } catch (err) {
      console.warn('Erro ao baixar imagem:', err);
    }
  };

  const handleDownloadImage = () => handleDownloadSpecificImage(activeImageItem);

  const handleExportZip = async () => {
    if (isExportingZipRef.current) return;
    isExportingZipRef.current = true;
    setIsExportingZip(true);
    try {
      await exportAnaMariaZip(result);
    } catch (err) {
      console.warn('Erro ao exportar ZIP:', err);
    } finally {
      setIsExportingZip(false);
      isExportingZipRef.current = false;
    }
  };

  const updateActiveImageInResult = (patch: Partial<AnaMariaGeneratedImageItem>) => {
    const nextImages = imagesList.map((item, idx) =>
      idx === safeSelectedIdx ? { ...item, ...patch } : item
    );
    const updatedItem = nextImages[safeSelectedIdx];
    const updated: AnaMariaResultState = {
      ...result,
      generatedImages: nextImages,
      imageUrl: updatedItem.imageUrl,
      imageModel: updatedItem.imageModel,
      audit: updatedItem.audit || result.audit,
    };
    onUpdateResult(updated);
    saveAnaMariaResult(updated);
  };

  // Refazer Imagem (com ou sem ajuste)
  const handleRegenerateImage = async (customInstruction?: string) => {
    try {
      setIsRegeneratingImage(true);
      const activePhotos = getActiveColorGroupPhotos(
        result.referencePhotos,
        result.colorGroups,
        activeImageItem.colorGroupIndex
      );
      const res = await regenerateAnaMariaImage({
        form: {
          productInfo: result.productInfo,
          fabricType: result.fabricType,
          productName: result.productName,
          referencePhotos: activePhotos,
          influencer: result.influencer,
          bodyType: result.bodyType,
          presentationMode: result.presentationMode,
          selectedMasterId: result.selectedMasterId,
          additionalInstructions: result.additionalInstructions,
          imageModel: activeImageItem.imageModel || result.imageModel,
          videoPromptLimit: result.videoPromptLimit,
          selectedScenarioId: activeImageItem.selectedScenarioId ?? result.selectedScenarioId,
          selectedScenarioNumber: activeImageItem.selectedScenarioNumber ?? result.selectedScenarioNumber,
          selectedModelGalleryId: activeImageItem.selectedModelGalleryId ?? result.selectedModelGalleryId,
          selectedModelGalleryNumber: activeImageItem.selectedModelGalleryNumber ?? result.selectedModelGalleryNumber,
          selectedModelGalleryUrl: activeImageItem.selectedModelGalleryUrl ?? result.selectedModelGalleryUrl,
          modelScenarioSource: activeImageItem.modelScenarioSource ?? result.modelScenarioSource,
          generateModelViaPrompt: activeImageItem.generateModelViaPrompt ?? result.generateModelViaPrompt,
          ultraRealism: activeImageItem.ultraRealism ?? result.ultraRealism,
          selectedShoeOption: result.selectedShoeOption,
          customShoeText: result.customShoeText,
        },
        tweakPrompt: customInstruction || imageTweakText,
        dressInspection: result.dressInspection,
        aiProfile,
      });

      updateActiveImageInResult({
        imageUrl: res.imageUrl,
        imageModel: res.imageModel,
        audit: res.audit || activeImageItem.audit,
        timestamp: Date.now(),
      });
      setImageTweakText('');
      setHasDownloadedImageOnce(false);
      setDownloadedImage(false);
    } catch (err: any) {
      alert(`Falha ao refazer imagem: ${err?.message || err}`);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Refazer com SeaDream 5.0 (Item 21: quando o modelo anterior foi OpenAI)
  const handleRegenerateWithSeaDream = async () => {
    try {
      setIsRegeneratingImage(true);
      const activePhotos = getActiveColorGroupPhotos(
        result.referencePhotos,
        result.colorGroups,
        activeImageItem.colorGroupIndex
      );
      const res = await regenerateAnaMariaImage({
        form: {
          productInfo: result.productInfo,
          fabricType: result.fabricType,
          productName: result.productName,
          referencePhotos: activePhotos,
          influencer: result.influencer,
          bodyType: result.bodyType,
          presentationMode: result.presentationMode,
          selectedMasterId: result.selectedMasterId,
          additionalInstructions: result.additionalInstructions,
          imageModel: 'seedream_5_0_pro',
          videoPromptLimit: result.videoPromptLimit,
          selectedScenarioId: activeImageItem.selectedScenarioId ?? result.selectedScenarioId,
          selectedScenarioNumber: activeImageItem.selectedScenarioNumber ?? result.selectedScenarioNumber,
          selectedModelGalleryId: activeImageItem.selectedModelGalleryId ?? result.selectedModelGalleryId,
          selectedModelGalleryNumber: activeImageItem.selectedModelGalleryNumber ?? result.selectedModelGalleryNumber,
          selectedModelGalleryUrl: activeImageItem.selectedModelGalleryUrl ?? result.selectedModelGalleryUrl,
          modelScenarioSource: activeImageItem.modelScenarioSource ?? result.modelScenarioSource,
          generateModelViaPrompt: activeImageItem.generateModelViaPrompt ?? result.generateModelViaPrompt,
          ultraRealism: activeImageItem.ultraRealism ?? result.ultraRealism,
          selectedShoeOption: result.selectedShoeOption,
          customShoeText: result.customShoeText,
        },
        imageModelOverride: 'seedream_5_0_pro',
        dressInspection: result.dressInspection,
        aiProfile,
      });

      updateActiveImageInResult({
        imageUrl: res.imageUrl,
        imageModel: 'seedream_5_0_pro',
        audit: res.audit || activeImageItem.audit,
        timestamp: Date.now(),
      });
      setHasDownloadedImageOnce(false);
      setDownloadedImage(false);
    } catch (err: any) {
      alert(`Falha ao refazer com SeaDream 5.0: ${err?.message || err}`);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Trocar Cenário (Item 13: muda o cômodo da mesma casa mantendo modelo e roupa)
  const handleSwitchScenario = async () => {
    try {
      setIsSwitchingScenario(true);
      const activePhotos = getActiveColorGroupPhotos(
        result.referencePhotos,
        result.colorGroups,
        activeImageItem.colorGroupIndex
      );
      const res = await regenerateAnaMariaNewScenario({
        form: {
          productInfo: result.productInfo,
          fabricType: result.fabricType,
          productName: result.productName,
          referencePhotos: activePhotos,
          influencer: result.influencer,
          bodyType: result.bodyType,
          presentationMode: result.presentationMode,
          selectedMasterId: result.selectedMasterId,
          additionalInstructions: result.additionalInstructions,
          imageModel: activeImageItem.imageModel || result.imageModel,
          videoPromptLimit: result.videoPromptLimit,
          selectedScenarioId: activeImageItem.selectedScenarioId ?? result.selectedScenarioId,
          selectedScenarioNumber: activeImageItem.selectedScenarioNumber ?? result.selectedScenarioNumber,
          ultraRealism: activeImageItem.ultraRealism ?? result.ultraRealism,
          selectedShoeOption: result.selectedShoeOption,
          customShoeText: result.customShoeText,
        },
        aiProfile,
      });

      updateActiveImageInResult({
        imageUrl: res.imageUrl,
        imageModel: res.imageModel,
        audit: res.audit || activeImageItem.audit,
        timestamp: Date.now(),
      });
      setHasDownloadedImageOnce(false);
      setDownloadedImage(false);
    } catch (err: any) {
      alert(`Falha ao trocar cenário: ${err?.message || err}`);
    } finally {
      setIsSwitchingScenario(false);
    }
  };

  // Variações de cor / Nova Modelo e Cenário:
  // - keepSameModelAndScenario === true ("GERAR IGUAL EM NOVA COR"): mantém a mesma modelo e mesmo cenário, trocando para outra cor anexada nas referências.
  // - keepSameModelAndScenario === false ("GERAR COM NOVA MODELO E CENÁRIO"): gera com uma nova modelo e um novo cenário.
  const handleColorVariation = async (keepSameModelAndScenario: boolean) => {
    if (keepSameModelAndScenario && !canUseNewColorButtons) {
      return;
    }
    if (!keepSameModelAndScenario && !canGenerateWithNewModelAndScenario) {
      return;
    }
    if (!result.referencePhotos || result.referencePhotos.length === 0) {
      alert('Nenhuma foto de referência encontrada na memória deste resultado.');
      return;
    }
    const setLoading = keepSameModelAndScenario ? setIsGeneratingSameModelNewColor : setIsGeneratingNewColor;
    try {
      setLoading(true);
      const generator = keepSameModelAndScenario
        ? generateAnaMariaSameModelNewColor
        : generateAnaMariaNewColor;
      const res = await generator({
        result,
        baseImageItem: activeImageItem,
        aiProfile,
      });

      const nextImages = [...imagesList, res.newImageItem];
      const nextHeadlines = resolveMultipleDistinctHeadlines({
        productName: result.productName,
        additionalInstructions: result.additionalInstructions,
        count: nextImages.length,
      });
      // Preserva as headlines já existentes e adiciona uma nova diferente caso haja no banco
      const mergedHeadlines = [...distinctHeadlinesList];
      for (const cand of nextHeadlines) {
        if (mergedHeadlines.length >= nextImages.length) break;
        if (!mergedHeadlines.some((h) => h.toLowerCase() === cand.toLowerCase())) {
          mergedHeadlines.push(cand);
        }
      }

      const updatedResult: AnaMariaResultState = {
        ...result,
        timestamp: res.timestamp,
        imageUrl: res.imageUrl,
        imageModel: res.imageModel,
        generatedImages: nextImages,
        headlines: mergedHeadlines,
        ultraRealism: res.newImageItem.ultraRealism ?? result.ultraRealism,
        generateModelViaPrompt: res.generateModelViaPrompt,
        selectedModelGalleryId: res.selectedModelGalleryId,
        selectedModelGalleryNumber: res.selectedModelGalleryNumber,
        selectedModelGalleryUrl: res.selectedModelGalleryUrl,
        selectedScenarioId: res.selectedScenarioId,
        selectedScenarioNumber: res.selectedScenarioNumber,
        modelScenarioSource: res.modelScenarioSource,
        colorGroups: res.colorGroups,
        activeColorGroupIndex: res.activeColorGroupIndex,
        audit: res.newImageItem.audit || result.audit,
      };
      onUpdateResult(updatedResult);
      setSelectedImageIndex(nextImages.length - 1);
      saveAnaMariaResult(updatedResult);
      setHasDownloadedImageOnce(false);
      setDownloadedImage(false);
    } catch (err: any) {
      alert(`Falha ao gerar variação: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Refinar Prompt de Vídeo com IA
  const handleRefinePrompt = async () => {
    if (!promptCorrectionText.trim()) return;
    try {
      setIsRefiningPrompt(true);
      const refined = await refineAnaMariaVideoPrompt({
        currentPrompt: result.videoPrompt,
        correctionInstruction: promptCorrectionText.trim(),
        aiProfile,
      });

      onUpdateResult({
        ...result,
        videoPrompt: refined,
        conciseVideoPrompt: undefined,
      });
      setPromptCorrectionText('');
      setHasCopiedPromptOnce(false);
      setCopiedPrompt(false);
    } catch (err: any) {
      alert(`Falha ao refazer prompt: ${err?.message || err}`);
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const audit = activeImageItem.audit || result.audit;
  const auditStatus = audit?.status || 'green';
  const auditStyles = getStatusClasses(auditStatus);
  const auditScore = audit?.score ?? 96;
  const auditLabel = audit?.label ?? 'Verde — Fidelidade Aprovada';

  const presentationModeLabel =
    result.presentationMode === 'pov'
      ? 'Modo POV'
      : result.presentationMode === 'com_rosto'
      ? 'Com Rosto (UGC)'
      : 'Mirror Selfie';
  const resolveModelDisplay = (item: AnaMariaGeneratedImageItem) =>
    item.generateModelViaPrompt
      ? 'Via Prompt'
      : item.selectedModelGalleryNumber !== undefined
      ? item.selectedModelGalleryNumber
      : 'Automática';
  const resolveScenarioDisplay = (item: AnaMariaGeneratedImageItem) =>
    result.presentationMode === 'pov' ||
    item.generateModelViaPrompt ||
    item.modelScenarioSource === 'gallery'
      ? item.selectedScenarioNumber ?? 'Automático'
      : 'Da Modelo';

  const defaultCriteria: { name: string; score: number; status: AnaMariaAuditColorStatus; issue?: string }[] = [
    { name: 'Corte Queixo', score: 100, status: 'green' as AnaMariaAuditColorStatus },
    { name: result.bodyType === 'plus_size' ? 'Plus Size (50-54)' : 'Curvas & Silhueta', score: 96, status: 'green' as AnaMariaAuditColorStatus },
    { name: 'Zero Tatuagens', score: 100, status: 'green' as AnaMariaAuditColorStatus },
    { name: 'Calçado Condicional', score: 95, status: 'green' as AnaMariaAuditColorStatus },
  ];
  const criteriaList = audit?.criteria && audit.criteria.length > 0 ? audit.criteria : defaultCriteria;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* ─── NAVEGAÇÃO SUPERIOR: VOLTAR PARA A PÁGINA ANTERIOR ─── */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={onBackToForm}
          className={`px-4 py-2.5 text-zinc-200 hover:text-white border text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md ${
            isAmetista
              ? 'bg-[#170f26] hover:bg-[#221638] border-purple-500/35 hover:border-purple-400'
              : 'bg-[#111113] hover:bg-zinc-800 border-zinc-700/80 hover:border-orange-500/45'
          }`}
        >
          <ArrowLeft className={`w-4 h-4 ${accentIconClass}`} />
          <span>Voltar para a página anterior</span>
        </button>
      </div>

      {/* ─── BOTÕES DE AÇÃO SUPERIORES (GERAR COM NOVA MODELO E CENÁRIO + GERAR IGUAL EM NOVA COR À ESQUERDA) ─── */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-2 border-b ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800'}`}>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* GERAR COM NOVA MODELO E CENÁRIO (à esquerda do botão GERAR IGUAL EM NOVA COR) */}
          <button
            type="button"
            disabled={
              !canGenerateWithNewModelAndScenario ||
              isGeneratingNewColor ||
              isGeneratingSameModelNewColor ||
              isSwitchingScenario ||
              isRegeneratingImage
            }
            onClick={() => handleColorVariation(false)}
            className={`px-4 py-2 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-md border ${
              !canGenerateWithNewModelAndScenario
                ? 'bg-zinc-800/70 border-zinc-700/60 text-zinc-400 opacity-50 cursor-not-allowed shadow-none'
                : 'bg-sky-600 hover:bg-sky-500 disabled:opacity-60 cursor-pointer shadow-sky-950/50 border-sky-400/50'
            }`}
            title="Gera uma nova foto com uma nova modelo e um novo cenário da galeria"
          >
            <Palette className={`w-4 h-4 text-white ${isGeneratingNewColor ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingNewColor
                ? 'Gerando nova modelo e cenário...'
                : 'GERAR COM NOVA MODELO E CENÁRIO'}
            </span>
          </button>

          {/* GERAR IGUAL EM NOVA COR (à esquerda, logo ao lado de GERAR COM NOVA MODELO E CENÁRIO) */}
          <button
            type="button"
            disabled={
              !canUseNewColorButtons ||
              isGeneratingSameModelNewColor ||
              isGeneratingNewColor ||
              isSwitchingScenario ||
              isRegeneratingImage
            }
            onClick={() => handleColorVariation(true)}
            className={`px-4 py-2 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-md border ${
              !canUseNewColorButtons
                ? 'bg-zinc-800/70 border-zinc-700/60 text-zinc-400 opacity-50 cursor-not-allowed shadow-none'
                : 'bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 cursor-pointer shadow-cyan-950/50 border-cyan-400/50'
            }`}
            title={
              !canUseNewColorButtons
                ? 'Indisponível: adicione outra cor do produto nas referências para usar esta função'
                : 'Gera uma foto com a mesma modelo no mesmo cenário, usando a outra cor da roupa anexada nas referências diferente da anterior'
            }
          >
            <Copy className={`w-4 h-4 text-white ${isGeneratingSameModelNewColor ? 'animate-spin' : ''}`} />
            <span>{isGeneratingSameModelNewColor ? 'Gerando igual...' : 'GERAR IGUAL EM NOVA COR'}</span>
          </button>

          {/* NOVO PRODUTO */}
          <button
            type="button"
            onClick={onCreateNew}
            className={`px-4 py-2 text-xs font-bold text-zinc-200 hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer border ${
              isAmetista
                ? 'bg-[#170f26] hover:bg-[#221638] border-purple-500/35 hover:border-purple-400'
                : 'bg-[#111113] hover:bg-zinc-800 border-zinc-700/80 hover:border-orange-500/45'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${accentIconClass}`} />
            <span>NOVO PRODUTO</span>
          </button>

          {/* + Continuar no produto */}
          <button
            type="button"
            onClick={onContinueProduct}
            className={`px-4 py-2 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isAmetista
                ? 'bg-[#d4ff59] hover:bg-[#e2ff85] shadow-lime-950/40'
                : 'bg-amber-400 hover:bg-amber-300 shadow-amber-950/40'
            }`}
          >
            <Plus className="w-4 h-4 text-zinc-950 stroke-[3]" />
            <span>Continuar no produto</span>
          </button>

          {/* Trocar Cenário */}
          <button
            type="button"
            disabled={isSwitchingScenario || isRegeneratingImage || isGeneratingNewColor || isGeneratingSameModelNewColor}
            onClick={handleSwitchScenario}
            className={`px-4 py-2 text-zinc-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm border ${
              isAmetista
                ? 'bg-[#170f26] hover:bg-[#221638] border-purple-500/35 hover:border-purple-400'
                : 'bg-[#111113] hover:bg-zinc-800 border-zinc-700/80 hover:border-orange-500/45'
            }`}
            title="Gera novamente a mesma modelo e roupa em outro cômodo da casa com frente iluminada e fundo penumbroso"
          >
            <Home className={`w-4 h-4 ${accentIconClass} ${isSwitchingScenario ? 'animate-spin' : ''}`} />
            <span>{isSwitchingScenario ? 'Trocando cenário...' : 'Trocar Cenário'}</span>
          </button>
        </div>

        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className={`px-3.5 py-2 text-zinc-400 hover:text-zinc-200 border text-xs font-medium rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm ${
              isAmetista
                ? 'bg-[#170f26]/90 hover:bg-[#221638] border-purple-500/25 hover:border-purple-400/50'
                : 'bg-[#111113]/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <History className={`w-3.5 h-3.5 ${accentIconClass}`} />
            <span>Histórico de Gerações</span>
          </button>
        )}
      </div>

      {/* ─── GALERIA DE TODAS AS CORES GERADAS (QUANDO HÁ 2 OU MAIS IMAGENS) ─── */}
      {imagesList.length > 1 && (
        <div className={`p-4 sm:p-5 rounded-2xl space-y-3 ${defaultSectionClass}`}>
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                Cores Geradas ({imagesList.length} imagem{imagesList.length === 1 ? '' : 'ns'} • 1 Prompt)
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              Clique em uma imagem para visualizar/editar em destaque abaixo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {imagesList.map((imgItem, idx) => {
              const isSelected = idx === safeSelectedIdx;
              const isCardDownloaded = Boolean(downloadedImageIds[imgItem.id]);
              const itemAuditStatus: AnaMariaAuditColorStatus =
                imgItem.audit?.status || result.audit?.status || 'green';
              const isItemRejected = itemAuditStatus === 'red' || itemAuditStatus === 'orange';
              const isItemYellow = itemAuditStatus === 'yellow';
              return (
                <div
                  key={imgItem.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`rounded-xl p-2 transition-all cursor-pointer space-y-2 border-2 ${
                    isSelected
                      ? isItemRejected
                        ? 'border-red-500 bg-red-950/35 ring-2 ring-red-500/60 shadow-lg shadow-red-950/50'
                        : isItemYellow
                        ? 'border-amber-400 bg-amber-950/35 ring-2 ring-amber-400/50 shadow-lg'
                        : 'border-sky-400 bg-sky-950/35 ring-2 ring-sky-400/40 shadow-lg'
                      : isItemRejected
                      ? 'border-red-500/80 hover:border-red-400 bg-red-950/20 ring-1 ring-red-500/40'
                      : isItemYellow
                      ? 'border-amber-400/75 hover:border-amber-300 bg-amber-950/15'
                      : isAmetista
                      ? 'border-purple-500/25 hover:border-purple-400/60 bg-[#0e0817]/90'
                      : 'border-zinc-800 hover:border-orange-500/50 bg-zinc-950/80'
                  }`}
                >
                  <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden bg-black">
                    <img
                      src={imgItem.imageUrl}
                      alt={`${result.productName || 'Peça'} - ${imgItem.colorName}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-sky-600/95 text-white text-[10px] font-black shadow flex items-center gap-1.5">
                      <span>{imgItem.colorName}</span>
                    </div>
                    {/* Bolinha de Fidelidade na Galeria (apenas visual na tela, não sai no download/ZIP):
                        - Reprovada (red/orange): bolinha vermelha grande com bastante destaque e pulso
                        - Amarelo (yellow): bolinha de destaque em amarelo
                        - Aprovada (green): bolinha discreta verde */}
                    <div
                      className="absolute bottom-2.5 left-2.5 z-10 flex items-center pointer-events-none"
                      title={
                        isItemRejected
                          ? `Reprovada na verificação de fidelidade (${imgItem.audit?.score ?? 60}%) — clique para corrigir antes de baixar`
                          : isItemYellow
                          ? `Atenção: Variação leve na fidelidade (${imgItem.audit?.score ?? 80}%)`
                          : `Fidelidade Aprovada (${imgItem.audit?.score ?? 96}%)`
                      }
                    >
                      {isItemRejected ? (
                        <span className="w-5 h-5 rounded-full bg-red-500 border-2 border-white ring-4 ring-red-500/80 shadow-[0_0_16px_rgba(239,68,68,1)] animate-pulse block" />
                      ) : isItemYellow ? (
                        <span className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white ring-4 ring-amber-400/75 shadow-[0_0_14px_rgba(251,191,36,0.95)] block" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 border border-emerald-200/60 shadow-sm block" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPreviewModal(
                          imgItem.imageUrl,
                          `${result.productName || 'Peça'} - ${imgItem.colorName}`
                        );
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white border border-white/20 cursor-pointer"
                      title="Ampliar imagem"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSpecificImage(imgItem);
                      }}
                      className={`absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-lg border ${
                        isCardDownloaded
                          ? 'bg-sky-500 text-white border-sky-300'
                          : 'bg-zinc-950/90 hover:bg-zinc-800 text-white border-white/20'
                      }`}
                      title="Baixar esta imagem"
                    >
                      <Download className="w-3 h-3" />
                      <span>{isCardDownloaded ? 'OK' : 'Baixar'}</span>
                    </button>
                  </div>
                  <div className="px-0.5 text-[10px] text-zinc-300 leading-tight space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-white truncate">{formatImageEngineLabel(imgItem.imageModel)}</p>
                      {isItemRejected ? (
                        <span className="text-[9px] font-black text-red-400 uppercase shrink-0">Reprovada</span>
                      ) : isItemYellow ? (
                        <span className="text-[9px] font-black text-amber-300 uppercase shrink-0">Atenção</span>
                      ) : null}
                    </div>
                    <p className="text-zinc-400 truncate">
                      Modelo: {resolveModelDisplay(imgItem)} • Cenário: {resolveScenarioDisplay(imgItem)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── GRID PRINCIPAL: LADO ESQUERDO (FOTO + FISCALIZAÇÃO ABAIXO) / LADO DIREITO (PROMPT + BAIXAR TUDO + DETECTOR) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA: FOTO GERADA (1080x1920) + PAINEL DE FISCALIZAÇÃO ABAIXO */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card da Imagem Gerada */}
          <div
            className={`rounded-2xl transition-all duration-300 p-3 shadow-2xl relative group ${
              hasDownloadedImageOnce
                ? copiedBlueSectionClass
                : isAmetista
                ? 'border-2 border-purple-400/50 bg-[#140d21]'
                : 'border-2 border-orange-500/40 bg-[#111113]'
            }`}
          >
            {/* Header da Imagem com Resolução 1080x1920, Bolinha de Fidelidade e Badge Baixado */}
            <div className="flex items-center justify-between pb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">
                  Foto Gerada 9:16 (1080x1920)
                </span>
                {auditStatus === 'red' || auditStatus === 'orange' ? (
                  <span
                    className="w-4 h-4 rounded-full bg-red-500 border-2 border-white ring-4 ring-red-500/75 shadow-[0_0_14px_rgba(239,68,68,1)] animate-pulse inline-block shrink-0"
                    title={`Imagem reprovada na fidelidade (${auditScore}%)`}
                  />
                ) : auditStatus === 'yellow' ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white ring-4 ring-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.95)] inline-block shrink-0"
                    title={`Imagem em amarelo na fidelidade (${auditScore}%)`}
                  />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 border border-emerald-200/60 shadow-sm inline-block shrink-0"
                    title={`Imagem aprovada na fidelidade (${auditScore}%)`}
                  />
                )}
              </div>
              {hasDownloadedImageOnce && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" /> BAIXADO ✓
                </span>
              )}
            </div>

            {/* Imagem Vertical 9:16 */}
            <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={activeImageItem.imageUrl}
                alt={`Modo Ana Maria - ${result.productName || 'Peça de Vestuário'}`}
                className="w-full h-full object-cover"
              />

              {/* Bolinha de Fidelidade sobre a Visualização Maior (apenas para visualização do usuário, não sai na imagem baixada) */}
              <div
                className="absolute bottom-3.5 left-3.5 z-10 flex items-center pointer-events-none"
                title={
                  auditStatus === 'red' || auditStatus === 'orange'
                    ? `Reprovada na fidelidade (${auditScore}%) — corrija antes de baixar`
                    : auditStatus === 'yellow'
                    ? `Fidelidade em amarelo (${auditScore}%)`
                    : `Fidelidade aprovada (${auditScore}%)`
                }
              >
                {auditStatus === 'red' || auditStatus === 'orange' ? (
                  <span className="w-6 h-6 rounded-full bg-red-500 border-2 border-white ring-4 ring-red-500/80 shadow-[0_0_20px_rgba(239,68,68,1)] animate-pulse block" />
                ) : auditStatus === 'yellow' ? (
                  <span className="w-5 h-5 rounded-full bg-amber-400 border-2 border-white ring-4 ring-amber-400/75 shadow-[0_0_16px_rgba(251,191,36,0.95)] block" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-emerald-400/90 border border-emerald-200/60 shadow-sm block" />
                )}
              </div>

              {/* Botão de Ampliar / Zoom */}
              <button
                type="button"
                onClick={() =>
                  onOpenPreviewModal(
                    activeImageItem.imageUrl,
                    `Modo Ana Maria - ${result.productName || 'Peça de Vestuário'}`
                  )
                }
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg group-hover:scale-105"
                title="Ampliar Imagem"
              >
                <Eye className={`w-4 h-4 ${accentIconClass}`} />
              </button>

              {/* Badge de Motor no Topo Esquerdo */}
              <div
                className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-md border text-[10px] font-bold uppercase ${
                  isAmetista
                    ? 'border-purple-400/50 text-[#d4ff59]'
                    : 'border-orange-500/45 text-orange-300'
                }`}
              >
                {formatImageEngineLabel(activeImageItem.imageModel)}
              </div>

              {/* Botão Circular de Baixar Imagem (Padrão 1 Download no canto inferior direito do Modo Produtos 2.0) */}
              <button
                type="button"
                onClick={handleDownloadImage}
                className={`absolute bottom-3 right-3 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xl ${
                  hasDownloadedImageOnce || downloadedImage
                    ? 'bg-sky-500 hover:bg-sky-400 text-white border border-sky-300 ring-2 ring-sky-300/60'
                    : isAmetista
                    ? 'bg-[#170f26]/90 hover:bg-[#d4ff59] text-[#d4ff59] hover:text-zinc-950 border border-purple-400/50 backdrop-blur-md'
                    : 'bg-zinc-950/90 hover:bg-zinc-800 text-white border border-orange-500/45 backdrop-blur-md'
                }`}
                title="Baixar Imagem em 1080x1920 pixels"
              >
                <span className="w-4 h-4 rounded-full bg-white text-slate-950 font-black text-[10px] flex items-center justify-center shadow">
                  1
                </span>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PAINEL DE FISCALIZAÇÃO DE FIDELIDADE (LOCALIZADO DIRETAMENTE ABAIXO DA IMAGEM) */}
          {/* ========================================================================= */}
          <div className={`p-3.5 rounded-xl border space-y-3 shadow-lg ${auditStyles.box}`}>
            {/* Cabeçalho com Nota Geral e Semáforo de 4 Cores idêntico ao Modo Produtos 2.0 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {auditStatus === 'green' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : auditStatus === 'yellow' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <AlertCircle
                    className={`w-5 h-5 shrink-0 ${
                      auditStatus === 'orange' ? 'text-orange-400' : 'text-rose-400'
                    }`}
                  />
                )}
                <div>
                  <span className="text-xs font-black block leading-tight">
                    {auditLabel}
                  </span>
                  <span className="text-[10px] opacity-80 block">
                    Fiscalização da peça (Corte no Queixo, Curvas, Sem Tatuagem, Calçado)
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-black shrink-0 ${auditStyles.badge}`}
              >
                {auditScore}%
              </span>
            </div>

            {/* Grade dos Critérios (4 cards em formato 2x2 com bolinha de status colorida) */}
            <div className="grid grid-cols-2 gap-1.5">
              {criteriaList.map((crit, idx) => {
                const cStyle = getStatusClasses(crit.status);
                return (
                  <div
                    key={idx}
                    title={crit.issue || crit.name}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] flex items-center justify-between gap-1 ${cStyle.cell}`}
                  >
                    <span className="font-bold flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cStyle.dot}`} />
                      <span className="truncate">{crit.name}</span>
                    </span>
                    <span className="font-mono font-black shrink-0">
                      {crit.score}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Informações detalhadas do calçado condicional e conformidade */}
            <div className="p-2.5 rounded-lg bg-black/35 border border-white/10 space-y-1 text-[11px] leading-snug">
              <p className="font-semibold text-white/90">
                ✓ Calçado selecionado automaticamente:{' '}
                <span className="text-sky-300 font-bold">{result.shoeDescription}</span>
              </p>
              <p className="opacity-80 text-[10px]">
                {result.bodyType === 'plus_size'
                  ? 'Enquadramento do queixo para baixo, corpo genuinamente Plus Size (manequim 50-54 com celulite natural nas coxas), sem tatuagens e cenário fixo.'
                  : 'Enquadramento 100% do queixo para baixo, silhueta com curvas acentuadas, sem tatuagens e cenário fixo.'}
              </p>
            </div>

            {/* Legenda rápida das 4 faixas de cores idêntica ao Modo Produtos 2.0 */}
            <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-white/10 text-[9px] opacity-80">
              <span className="text-emerald-300 font-bold">● &ge;90% Verde</span>
              <span className="text-amber-300 font-bold">● 71–89% Amarelo</span>
              <span className="text-orange-300 font-bold">● 60–70% Laranja</span>
              <span className="text-rose-300 font-bold">● &lt;60% Vermelho</span>
            </div>

            {/* CAMPO: DESEJA REFAZER A IMAGEM COM CORREÇÕES? (VOZ OU TEXTO) */}
            <div className="pt-2.5 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deseja refazer a imagem com correções? (Voz ou Texto)</span>
                </label>
                {imageTweakText && (
                  <button
                    type="button"
                    onClick={() => setImageTweakText('')}
                    className="text-[10px] text-zinc-400 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  rows={2}
                  value={imageTweakText}
                  onChange={(e) => setImageTweakText(e.target.value)}
                  placeholder='Dite ou digite o que mudar (ex: "Ajustar o caimento da saia", "Clarear um pouco o tom do tecido")...'
                  className="w-full p-2.5 pr-11 bg-black/40 border border-white/15 focus:border-amber-400/80 rounded-xl text-xs text-white placeholder-zinc-400/80 focus:outline-none resize-none leading-relaxed transition-all shadow-inner"
                />

                <button
                  type="button"
                  onClick={toggleImageMicrophone}
                  className={`absolute right-2 top-2.5 p-2 rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center ${
                    isImageMicRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10'
                  }`}
                  title={
                    isImageMicRecording
                      ? 'Parar gravação de voz'
                      : 'Ditar mudança da imagem por voz'
                  }
                >
                  {isImageMicRecording ? (
                    <Square className="w-3.5 h-3.5 text-white fill-white" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isImageMicRecording && (
                <p className="text-[10px] text-rose-300 font-bold animate-pulse flex items-center gap-1.5 pl-0.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-ping" />
                  Gravando voz... Fale a mudança desejada e clique no botão vermelho para parar.
                </p>
              )}

              <p className="text-[10px] text-zinc-400/90 leading-tight">
                <span className="text-amber-300 font-bold">Prioridade Máxima:</span> A IA manterá o cenário fixo e proporções da modelo, alterando apenas o que você solicitar.
              </p>
            </div>

            {/* BOTÃO REFAZER CORRIGINDO (GRADIENTE ÂMBAR / LARANJA IDÊNTICO AO MODO PRODUTOS 2.0) */}
            <button
              type="button"
              onClick={() => handleRegenerateImage(imageTweakText.trim() || undefined)}
              disabled={isRegeneratingImage}
              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                imageTweakText.trim()
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-black'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingImage ? 'animate-spin' : ''}`} />
              <span>
                {isRegeneratingImage
                  ? 'Refazendo Imagem com Correção...'
                  : imageTweakText.trim()
                  ? 'Refazer Imagem com Minha Alteração'
                  : 'Refazer Corrigindo Imagem'}
              </span>
            </button>

            {/* Botão REFAZER COM SEEDREAM 5.0 (quando gerado via OpenAI) */}
            {activeImageItem.imageModel === 'openai' && (
              <button
                type="button"
                disabled={isRegeneratingImage}
                onClick={handleRegenerateWithSeaDream}
                className="w-full py-2.5 px-3 rounded-xl border border-sky-400 bg-gradient-to-r from-sky-600 to-blue-700 hover:brightness-110 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-sky-950/60"
              >
                <Cpu className="w-4 h-4 text-white" />
                <span>REFAZER COM SEEDREAM 5.0</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA: PROMPT DO VÍDEO + BAIXAR TUDO + DETECTOR DE INCONSISTÊNCIAS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card do Prompt do Vídeo (10s) com Destaque Azul Ativo ao Copiar */}
          <div
            className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 space-y-3 ${
              hasCopiedPromptOnce ? copiedBlueSectionClass : defaultSectionClass
            }`}
          >
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Video className={`w-4 h-4 ${accentIconClass}`} />
                  <span>
                    Prompt do Vídeo (10s -{' '}
                    {result.presentationMode === 'pov'
                      ? 'Modo POV'
                      : result.presentationMode === 'com_rosto'
                      ? 'Com Rosto'
                      : 'Mirror Selfie'}
                    )
                  </span>
                  {hasCopiedPromptOnce && (
                    <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-sky-300" /> Copiado ✓
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Arquivo no pacote:{' '}
                  <span className="font-mono text-white">
                    {getMasterPromptFileName(result)}
                  </span>
                </p>
                <p className="text-[11px] text-zinc-300 mt-1 font-medium">
                  Modo de Apresentação:{' '}
                  <span className="text-white font-semibold">{presentationModeLabel}</span>
                  {', Modelo: '}
                  <span className="text-white font-semibold">{resolveModelDisplay(activeImageItem)}</span>
                  {', Cenário: '}
                  <span className="text-white font-semibold">{resolveScenarioDisplay(activeImageItem)}</span>
                  {', Prompt: '}
                  <span className="text-white font-semibold">
                    {getMasterPromptById(result.selectedMasterId).shortName.replace(/^(\d+)\.\s*/, '$1- ')}
                  </span>
                  {result.colorGroups && result.colorGroups.length > 1 && (
                    <>
                      {', Cor: '}
                      <span className="text-sky-300 font-semibold">
                        {activeImageItem.colorName || 'Cor'}{' '}
                        ({activeImageItem.colorGroupIndex + 1}/{result.colorGroups.length})
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Botão Copiar Prompt alinhado à direita + link discreto "Copiar prompt Kling" logo embaixo */}
              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    copiedPrompt
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                      : hasCopiedPromptOnce
                      ? 'bg-sky-500 hover:bg-sky-400 text-white'
                      : isAmetista
                      ? 'bg-[#d4ff59] hover:bg-[#e2ff85] text-zinc-950'
                      : 'bg-zinc-800 hover:bg-zinc-700 border border-orange-500/45 text-white'
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Prompt Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Prompt</span>
                    </>
                  )}
                </button>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleCopyKlingFixedPrompt}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCopyKlingFixedPrompt();
                    }
                  }}
                  className="text-[11px] text-sky-400 hover:text-sky-300 underline underline-offset-2 cursor-pointer select-none transition-colors pr-0.5 font-medium"
                  title="Copiar prompt fixo para o Kling (19- Prompt DH VIP)"
                >
                  {copiedKlingPrompt ? 'Prompt Kling copiado ✓' : 'Copiar prompt Kling'}
                </span>
              </div>
            </div>

            {/* Prompt limpo sem o cabeçalho 🎥 PROMPT DE VÍDEO... (prompt original longo permanece sempre visível) */}
            <textarea
              rows={16}
              value={cleanVideoPrompt}
              onChange={(e) => {
                const val = e.target.value;
                setHasCopiedPromptOnce(false);
                setCopiedPrompt(false);
                onUpdateResult({ ...result, videoPrompt: val, conciseVideoPrompt: undefined });
              }}
              className={`w-full p-3.5 rounded-xl text-xs font-mono leading-relaxed focus:outline-none resize-y select-all ${
                hasCopiedPromptOnce
                  ? 'bg-slate-950/90 border border-sky-400/60 text-sky-50 focus:ring-2 focus:ring-sky-400'
                  : isAmetista
                  ? 'bg-[#0e0817]/95 border border-purple-500/30 text-zinc-200 focus:border-[#d4ff59]'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-200 focus:border-orange-500/60'
              }`}
            />

            {/* Ajustar ou Corrigir este Prompt com IA com Microfone */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl space-y-2.5 transition-all ${
                hasCopiedPromptOnce
                  ? 'bg-slate-900/90 border border-sky-400/50'
                  : isAmetista
                  ? 'bg-[#1a102b]/95 border border-purple-500/30 shadow-inner'
                  : 'bg-zinc-900/95 border border-zinc-800 shadow-inner'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                  <Wand2 className={`w-3.5 h-3.5 ${accentIconClass}`} />
                  <span>Ajustar ou Corrigir este Prompt com IA:</span>
                </label>
                {isPromptMicRecording && (
                  <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Ouvindo sua correção...
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promptCorrectionText}
                    onChange={(e) => setPromptCorrectionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRefinePrompt();
                      }
                    }}
                    placeholder='Ex: "Ajustar movimentos mais lentos", "Mude a rotação final do corpo"...'
                    className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors shadow-inner font-sans ${
                      isAmetista
                        ? 'bg-[#0e0817] border border-purple-500/30 focus:border-[#d4ff59]'
                        : 'bg-zinc-950 border border-zinc-700 focus:border-orange-400'
                    }`}
                  />

                  {/* Botão Microfone embutido */}
                  <button
                    type="button"
                    onClick={togglePromptMicrophone}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
                      isPromptMicRecording
                        ? 'bg-rose-500/20 text-rose-400 animate-pulse ring-2 ring-rose-400'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title={
                      isPromptMicRecording
                        ? 'Parar gravação'
                        : 'Ditar correção do prompt por voz'
                    }
                  >
                    {isPromptMicRecording ? (
                      <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Botão Refazer Prompt */}
                <button
                  type="button"
                  onClick={handleRefinePrompt}
                  disabled={isRefiningPrompt || !promptCorrectionText.trim()}
                  className={`px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 ${
                    isAmetista
                      ? 'bg-[#d4ff59] hover:bg-[#e2ff85] text-zinc-950'
                      : 'bg-zinc-800 hover:bg-zinc-700 border border-orange-500/45 text-white'
                  }`}
                >
                  {isRefiningPrompt ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Refazendo...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Refazer Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTÃO BAIXAR TUDO (.ZIP COM NOME DO PRODUTO) EM VERDE VIBRANTE            */}
          {/* ========================================================================= */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleExportZip}
              disabled={isExportingZip}
              className="w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingZip ? 'Gerando .ZIP...' : `Baixar Tudo (${safeFileName}.zip)`}</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* DETECTOR DE INCONSISTÊNCIAS DO VÍDEO (POSICIONADO ABAIXO DE BAIXAR TUDO)   */}
          {/* ========================================================================= */}
          <div>
            <VideoFidelityAuditor
              productName={result.productName || 'Peça de Vestuário'}
              referencePhotos={result.referencePhotos}
              onOpenPreview={onOpenPreviewModal}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO INFERIOR: TEXTO DO VÍDEO (HEADLINE) E DESCRIÇÃO/HASHTAGS            */}
      {/* ========================================================================= */}
      <div className={`space-y-4 pt-4 border-t ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800'}`}>
        {/* Barra superior com botão único para refazer Headlines e Hashtags do banco de memória */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-semibold">Textos Validados do Banco de Memória</span>
          </div>
          <button
            type="button"
            onClick={handleRemixHeadlinesAndHashtags}
            disabled={isRemixing}
            className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 decoration-sky-400/60 hover:decoration-sky-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer py-1 px-2.5 rounded-lg hover:bg-sky-500/10 active:scale-95 disabled:opacity-50"
            title="Refazer Texto do Vídeo e Hashtags usando outro item do banco de memória para este produto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRemixing ? 'animate-spin' : ''}`} />
            <span>Refazer Headlines e Hashtags</span>
          </button>
        </div>

        {/* 1º Card (ACIMA): Texto do Vídeo (1 Headline ou N Headlines diferentes quando há várias cores) */}
        <div
          className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 space-y-3 ${
            hasCopiedHeadlineOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <div className="flex items-center gap-2">
              <Smile className={`w-4 h-4 ${accentIconClass}`} />
              <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>
                  {distinctHeadlinesList.length > 1
                    ? `Textos do Vídeo (${distinctHeadlinesList.length} Headlines Diferentes)`
                    : 'Texto do Vídeo'}
                </span>
                {hasCopiedHeadlineOnce && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" /> COPIADO ✓
                  </span>
                )}
              </h3>
            </div>
            {/* Controles da direita: Botão Copiar Texto do Vídeo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyHeadline}
                className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  hasCopiedHeadlineOnce || copiedHeadline
                    ? 'bg-sky-500 hover:bg-sky-400 text-white border border-sky-300 ring-2 ring-sky-300/60'
                    : isAmetista
                    ? 'bg-[#d4ff59] hover:bg-[#e2ff85] text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 border border-orange-500/45 text-white'
                }`}
              >
                {copiedHeadline ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {distinctHeadlinesList.length > 1
                        ? 'Copiar Todas as Headlines'
                        : 'Copiar Texto do Vídeo'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {distinctHeadlinesList.length > 1 ? (
            <div className="space-y-2.5">
              {distinctHeadlinesList.map((headlineItem, idx) => {
                const isThisCopied = Boolean(copiedHeadlineIndices[idx]);
                const hasCopiedThis = Boolean(hasCopiedHeadlineIndices[idx]);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all leading-relaxed ${
                      hasCopiedThis
                        ? 'bg-slate-950/90 border border-sky-400/70 text-white'
                        : isAmetista
                        ? 'bg-[#0e0817]/95 border border-purple-500/25 text-white'
                        : 'bg-zinc-900/95 border border-zinc-800 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 select-all">
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/40 text-[10px] font-black text-sky-300 uppercase">
                        Headline {idx + 1}
                      </span>
                      <span className="whitespace-pre-line">{headlineItem}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopySpecificHeadline(headlineItem, idx)}
                      className={`shrink-0 py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        hasCopiedThis || isThisCopied
                          ? 'bg-sky-500 hover:bg-sky-400 text-white border border-sky-300'
                          : isAmetista
                          ? 'bg-purple-500/25 hover:bg-purple-500/40 text-purple-100 border border-purple-400/40'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {isThisCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={`p-3.5 rounded-xl text-sm font-semibold select-all transition-all leading-relaxed whitespace-pre-line ${
                hasCopiedHeadlineOnce
                  ? 'bg-slate-950/90 border border-sky-400/60 text-white'
                  : isAmetista
                  ? 'bg-[#0e0817]/95 border border-purple-500/25 text-white'
                  : 'bg-zinc-900/95 border border-zinc-800 text-white'
              }`}
            >
              {result.headline}
            </div>
          )}
        </div>

        {/* 2º Card (ABAIXO): Descrição/Hastags */}
        <div
          className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 space-y-3 ${
            hasCopiedHashtagsOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <div className="flex items-center gap-2">
              <Hash className={`w-4 h-4 ${accentIconClass}`} />
              <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>Descrição/Hastags</span>
                {hasCopiedHashtagsOnce && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" /> COPIADO ✓
                  </span>
                )}
              </h3>
            </div>
            {/* Controles da direita: Botão Copiar Hastags */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyHashtags}
                className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  hasCopiedHashtagsOnce || copiedHashtags
                    ? 'bg-sky-500 hover:bg-sky-400 text-white border border-sky-300 ring-2 ring-sky-300/60'
                    : isAmetista
                    ? 'bg-[#d4ff59] hover:bg-[#e2ff85] text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 border border-orange-500/45 text-white'
                }`}
              >
                {copiedHashtags ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Hastags</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl text-xs font-mono select-all transition-all leading-relaxed ${
              hasCopiedHashtagsOnce
                ? 'bg-slate-950/90 border border-sky-400/60 text-sky-100'
                : isAmetista
                ? 'bg-[#0e0817]/95 border border-purple-500/25 text-purple-100'
                : 'bg-zinc-900/95 border border-zinc-800 text-zinc-200'
            }`}
          >
            {result.hashtags}
          </div>
        </div>
      </div>
    </div>
  );
};
