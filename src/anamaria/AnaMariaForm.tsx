import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  Trash2,
  Check,
  AlertCircle,
  History,
  ArrowRight,
  Layers,
  Cpu,
  Scissors,
  Mic,
  Square,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Play,
  Video,
  Smartphone,
  Hand,
  Smile,
  RefreshCw,
  Wand2,
  Palette,
} from 'lucide-react';
import {
  AnaMariaFormState,
  AnaMariaPresentationMode,
  AnaMariaTheme,
} from './types';
import { compressAndResizeImage } from '../ania/aniaLibrary';
import { ProgressBar } from '../components/ProgressBar';
import {
  SCENARIO_GALLERY_ITEMS,
  POV_SCENARIO_GALLERY_ITEMS,
  AnaMariaScenarioItem,
} from './scenarioGalleryData';
import {
  MASTER_PROMPTS_GALLERY,
  AnaMariaMasterPromptItem,
  getMasterPromptById,
  getDefaultMasterForMode,
  resolveMasterPromptByProductName,
} from './masterPromptsData';
import { preloadScenarioUrl, prewarmDefaultScenarios } from './anaMariaPipeline';
import {
  MODEL_GALLERY_ITEMS,
  MODEL_GALLERY_COM_ROSTO,
  MODEL_GALLERY_SEM_ROSTO,
  getModelGalleryForMode,
  AnaMariaModelItem,
} from './modelGalleryData';
import { UserCheck } from 'lucide-react';

interface AnaMariaFormProps {
  form: AnaMariaFormState;
  onChange: React.Dispatch<React.SetStateAction<AnaMariaFormState>>;
  onSubmit: () => void;
  isProcessing: boolean;
  progressPercent: number;
  statusMessage: string;
  hasExistingResult?: boolean;
  onGoToResults?: () => void;
  onOpenHistory?: () => void;
  onNavigateToProdutos2?: () => void;
  theme?: AnaMariaTheme;
}

export const AnaMariaForm: React.FC<AnaMariaFormProps> = ({
  form,
  onChange,
  onSubmit,
  isProcessing,
  progressPercent,
  statusMessage,
  hasExistingResult = false,
  onGoToResults,
  onOpenHistory,
  theme = 'ametista',
}) => {
  // Sincronização automática do gerador de imagem: Homem ou POV mudam automaticamente para OpenAI
  useEffect(() => {
    if (form.presentationMode === 'pov' || form.influencer === 'Homem') {
      if (form.imageModel !== 'openai') {
        onChange((prev) => ({ ...prev, imageModel: 'openai' }));
      }
    }
  }, [form.presentationMode, form.influencer, form.imageModel, onChange]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingExtra, setIsDraggingExtra] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isIdentifyingProduct, setIsIdentifyingProduct] = useState(false);
  const [autoIdentifiedBadge, setAutoIdentifiedBadge] = useState(false);
  const hasUserManuallyEditedNameRef = useRef<boolean>(false);
  const lastUploadedFileNameRef = useRef<string>('');

  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  const [isPromptsGalleryExpanded, setIsPromptsGalleryExpanded] = useState(false);
  const [isModelGalleryExpanded, setIsModelGalleryExpanded] = useState(false);

  const isAmetista = theme === 'ametista';
  const activeMode: AnaMariaPresentationMode = form.presentationMode || 'mirror_selfie';
  const activeMaster = getMasterPromptById(form.selectedMasterId);
  const currentModelGallery = getModelGalleryForMode(activeMode);

  const selectedModelItem =
    !form.generateModelViaPrompt && (form.selectedModelGalleryId || form.selectedModelGalleryNumber)
      ? currentModelGallery.find(
          (m) => m.id === form.selectedModelGalleryId || m.number === form.selectedModelGalleryNumber
        )
      : undefined;

  const handleSelectModel = (item: AnaMariaModelItem) => {
    onChange((prev) => ({
      ...prev,
      selectedModelGalleryId: item.id,
      selectedModelGalleryNumber: item.number,
      selectedModelGalleryUrl: item.fullUrl,
      generateModelViaPrompt: false,
      modelScenarioSource: prev.modelScenarioSource || 'model',
    }));
  };

  const handleClearModel = () => {
    onChange((prev) => ({
      ...prev,
      selectedModelGalleryId: undefined,
      selectedModelGalleryNumber: undefined,
      selectedModelGalleryUrl: undefined,
      selectedModelGalleryBase64: undefined,
      generateModelViaPrompt: false,
    }));
  };

  const handleToggleGenerateViaPrompt = () => {
    onChange((prev) => ({
      ...prev,
      selectedModelGalleryId: undefined,
      selectedModelGalleryNumber: undefined,
      selectedModelGalleryUrl: undefined,
      selectedModelGalleryBase64: undefined,
      generateModelViaPrompt: !prev.generateModelViaPrompt,
    }));
  };
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPovMode = activeMode === 'pov';
  const activeScenarioList = isPovMode ? POV_SCENARIO_GALLERY_ITEMS : SCENARIO_GALLERY_ITEMS;

  // Pré-aquece o cache do cenário selecionado (e do cenário randômico sorteado) em segundo plano para geração instantânea
  useEffect(() => {
    prewarmDefaultScenarios();
    if (form.selectedScenarioUrl) {
      preloadScenarioUrl(form.selectedScenarioUrl);
    }
  }, [form.selectedScenarioUrl, isPovMode]);

  // Filtra os prompts de movimento pela aba ativa (Mirror Selfie | POV | Com Rosto)
  const filteredMasterPrompts = MASTER_PROMPTS_GALLERY.filter((item) =>
    item.categories.includes(activeMode)
  );

  const stopMicrophone = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
    }
    setIsRecordingMic(false);
  };

  const toggleMic = async () => {
    if (isRecordingMic) {
      stopMicrophone();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        recognitionRef.current = rec;
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = false;

        rec.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }
          if (transcript.trim()) {
            onChange((prev) => ({
              ...prev,
              additionalInstructions: prev.additionalInstructions
                ? `${prev.additionalInstructions.trim()} ${transcript.trim()}`
                : transcript.trim(),
            }));
          }
        };

        rec.onerror = () => stopMicrophone();
        rec.onend = () => setIsRecordingMic(false);

        rec.start();
        setIsRecordingMic(true);
      }
    } catch {
      stopMicrophone();
    }
  };

  // Heurística local instantânea para extração do nome da peça caso ocorra falha de rede ou IA
  const extractGarmentFromFileName = (rawName?: string): string | null => {
    if (!rawName || typeof rawName !== 'string') return null;
    const s = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[_\-]+/g, ' ');

    if ((s.includes('macacao') || s.includes('macaquinho')) && (s.includes('assimetrico') || s.includes('short') || s.includes('bermuda') || s.includes('blusa') || s.includes('cropped') || s.includes('top'))) {
      return 'Conjunto Alfaiataria';
    }
    if (s.includes('conjunto')) {
      if (s.includes('fitness') || s.includes('academia') || s.includes('treino')) return 'Conjunto Fitness';
      if (s.includes('pantalona') || s.includes('linho') || s.includes('alfaiataria')) return 'Conjunto Alfaiataria';
      return 'Conjunto Alfaiataria';
    }
    if (s.includes('macaquinho')) return 'Macaquinho Alfaiataria';
    if (s.includes('macacao')) {
      if (s.includes('longo') || s.includes('pantalona') || s.includes('flare')) return 'Macacão Longo';
      return 'Conjunto Alfaiataria';
    }
    if (s.includes('vestido')) {
      if (s.includes('longo')) return 'Vestido Longo';
      if (s.includes('midi')) return 'Vestido Midi';
      if (s.includes('curto')) return 'Vestido Curto';
      return 'Vestido';
    }
    if (s.includes('baby doll') || s.includes('babydoll') || s.includes('camisola')) return 'Camisola Baby Doll';
    if (s.includes('bermuda') || s.includes('shorts') || s.includes('short')) {
      if (s.includes('jeans')) return 'Short Jeans';
      return 'Bermuda Alfaiataria';
    }
    if (s.includes('calca')) {
      if (s.includes('jeans')) return 'Calça Jeans';
      if (s.includes('pantalona')) return 'Calça Pantalona';
      return 'Calça Alfaiataria';
    }
    if (s.includes('saia')) return 'Saia Midi';
    if (s.includes('biquini') || s.includes('maio')) return 'Biquíni Cortininha';
    if (s.includes('body')) return 'Body Poliamida';
    if (s.includes('cinta')) return 'Cinta Modeladora';
    if (s.includes('camiseta') || s.includes('t-shirt') || s.includes('tshirt')) return 'Camiseta Oversized';
    if (s.includes('cropped') || s.includes('blusa') || s.includes('camisa')) return 'Blusa Feminina';
    return null;
  };

  /**
   * Identifica automaticamente o nome da peça (ex: Camisola, Camiseta, Calça, Bermuda, Conjunto)
   * assim que o usuário adiciona a primeira foto, sem jamais sobrescrever o que o usuário digitar.
   */
  const autoIdentifyGarmentFromPhoto = async (photoBase64: string, force = false, fileName?: string) => {
    if (!photoBase64) return;
    if (!force && hasUserManuallyEditedNameRef.current && form.productName.trim().length > 0) return;
    const targetFileName = fileName || lastUploadedFileNameRef.current || '';
    setIsIdentifyingProduct(true);
    try {
      const res = await fetch('/api/detect-dominant-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64,
          mode: 'identify_garment',
          fileName: targetFileName,
        }),
      });
      const data = await res.json();
      let resolvedName = data?.success && data?.garmentName ? data.garmentName : null;

      // Fallback local se o servidor não conseguir identificar via IA
      if (!resolvedName && targetFileName) {
        resolvedName = extractGarmentFromFileName(targetFileName);
      }

      if (resolvedName) {
        onChange((prev) => {
          // Só preenche se não foi digitado manualmente enquanto identificava (ou se foi forçado pelo botão)
          if (!force && hasUserManuallyEditedNameRef.current && prev.productName.trim().length > 0) {
            return prev;
          }
          const modeNow = prev.presentationMode || 'mirror_selfie';
          return {
            ...prev,
            productName: resolvedName,
            selectedMasterId:
              !prev.isManualMasterSelection && modeNow !== 'pov'
                ? resolveMasterPromptByProductName(resolvedName)
                : prev.selectedMasterId,
          };
        });
        setAutoIdentifiedBadge(true);
      }
    } catch (err) {
      console.warn('Falha silenciosa ao identificar peça via IA, tentando fallback local:', err);
      const fallbackLocal = extractGarmentFromFileName(targetFileName);
      if (fallbackLocal) {
        onChange((prev) => {
          const modeNow = prev.presentationMode || 'mirror_selfie';
          return {
            ...prev,
            productName: fallbackLocal,
            selectedMasterId:
              !prev.isManualMasterSelection && modeNow !== 'pov'
                ? resolveMasterPromptByProductName(fallbackLocal)
                : prev.selectedMasterId,
          };
        });
        setAutoIdentifiedBadge(true);
      }
    } finally {
      setIsIdentifyingProduct(false);
    }
  };

  const processProductFiles = async (files: FileList | File[], targetField: 'same' | 'extra') => {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const currentFieldPhotos =
      targetField === 'same' ? form.referencePhotos : form.extraColorPhotos || [];
    const remainingSlots = 10 - currentFieldPhotos.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = validFiles.slice(0, remainingSlots);
    const totalExisting = form.referencePhotos.length + (form.extraColorPhotos?.length || 0);
    const wasEmptyBefore = totalExisting === 0;
    if (filesToProcess[0]) {
      lastUploadedFileNameRef.current = filesToProcess[0].name || '';
    }
    setIsUploading(true);

    try {
      const b64Promises = filesToProcess.map((file) => compressAndResizeImage(file, 1080, 0.88));
      const newPhotos = await Promise.all(b64Promises);

      onChange((prev) =>
        targetField === 'same'
          ? {
              ...prev,
              referencePhotos: [...prev.referencePhotos, ...newPhotos].slice(0, 10),
            }
          : {
              ...prev,
              extraColorPhotos: [...(prev.extraColorPhotos || []), ...newPhotos].slice(0, 10),
            }
      );

      if (filesToProcess[0] && (wasEmptyBefore || !form.productName.trim() || autoIdentifiedBadge || !hasUserManuallyEditedNameRef.current)) {
        const fName = filesToProcess[0].name;
        compressAndResizeImage(filesToProcess[0], 512, 0.75)
          .then((thumbB64) => autoIdentifyGarmentFromPhoto(thumbB64, true, fName))
          .catch(() => autoIdentifyGarmentFromPhoto(newPhotos[0], true, fName));
      }
    } catch (err) {
      console.error('Erro ao processar imagens:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = (files: FileList | File[]) => processProductFiles(files, 'same');
  const handleExtraColorFiles = (files: FileList | File[]) => processProductFiles(files, 'extra');

  const handleRemovePhoto = (index: number) => {
    onChange((prev) => {
      const nextPhotos = prev.referencePhotos.filter((_, i) => i !== index);
      if (nextPhotos.length === 0 && (prev.extraColorPhotos?.length || 0) === 0) {
        hasUserManuallyEditedNameRef.current = false;
        setAutoIdentifiedBadge(false);
      }
      return {
        ...prev,
        referencePhotos: nextPhotos,
      };
    });
  };

  const handleRemoveExtraColorPhoto = (index: number) => {
    onChange((prev) => {
      const nextExtra = (prev.extraColorPhotos || []).filter((_, i) => i !== index);
      if (nextExtra.length === 0 && prev.referencePhotos.length === 0) {
        hasUserManuallyEditedNameRef.current = false;
        setAutoIdentifiedBadge(false);
      }
      return {
        ...prev,
        extraColorPhotos: nextExtra,
      };
    });
  };

  const handleClearAllPhotos = () => {
    hasUserManuallyEditedNameRef.current = false;
    setAutoIdentifiedBadge(false);
    onChange((prev) => {
      const modeNow = prev.presentationMode || 'mirror_selfie';
      return {
        ...prev,
        referencePhotos: [],
        extraColorPhotos: [],
        productName: '',
        selectedMasterId:
          !prev.isManualMasterSelection && modeNow !== 'pov'
            ? resolveMasterPromptByProductName('')
            : prev.selectedMasterId,
      };
    });
  };

  /**
   * Seleção automática do gerador de imagem:
   * - OpenAI é o padrão em todos os modos (fallback automático para SeaDream 5.0 Pro caso dê erro).
   * - POV ou Homem também garantem OpenAI.
   * O usuário continua podendo trocar manualmente o gerador depois.
   */
  const resolveAutoImageModel = (
    prev: AnaMariaFormState,
    nextMode: AnaMariaPresentationMode | undefined,
    nextInfluencer: AnaMariaFormState['influencer']
  ): AnaMariaFormState['imageModel'] => {
    const isOpenAiCase = nextMode === 'pov' || nextInfluencer === 'Homem';
    if (isOpenAiCase) return 'openai';
    return prev.imageModel || 'openai';
  };

  const handleSelectInfluencer = (nextInfluencer: AnaMariaFormState['influencer']) => {
    onChange((prev) => ({
      ...prev,
      influencer: nextInfluencer,
      imageModel: resolveAutoImageModel(prev, prev.presentationMode, nextInfluencer),
    }));
  };

  const handleSelectPresentationMode = (newMode: AnaMariaPresentationMode) => {
    if (newMode === 'pov') {
      POV_SCENARIO_GALLERY_ITEMS.forEach((s) => preloadScenarioUrl(s.fullUrl));
    }
    onChange((prev) => {
      const prevMode = prev.presentationMode || 'mirror_selfie';
      const currentMaster = getMasterPromptById(prev.selectedMasterId);
      const isMasterCompatible = currentMaster.categories.includes(newMode);

      const nextMaster =
        prev.isManualMasterSelection && isMasterCompatible
          ? currentMaster
          : getDefaultMasterForMode(newMode, prev.productName);

      const nextIsManual =
        isMasterCompatible ? Boolean(prev.isManualMasterSelection) : false;

      const wasPov = prevMode === 'pov';
      const willBePov = newMode === 'pov';
      const shouldResetScenario = wasPov !== willBePov;
      const modeChanged = prevMode !== newMode;

      // Ao trocar de modo de apresentação (ex.: Mirror Selfie -> Com Rosto UGC),
      // desmarca qualquer modelo da galeria anterior para que o app sorteie
      // randomicamente uma modelo da nova galeria (a menos que o usuário marque uma depois).
      return {
        ...prev,
        presentationMode: newMode,
        imageModel: resolveAutoImageModel(prev, newMode, prev.influencer),
        selectedMasterId: nextMaster.id,
        isManualMasterSelection: nextIsManual,
        selectedScenarioId: shouldResetScenario ? undefined : prev.selectedScenarioId,
        selectedScenarioNumber: shouldResetScenario ? undefined : prev.selectedScenarioNumber,
        selectedScenarioUrl: shouldResetScenario ? undefined : prev.selectedScenarioUrl,
        selectedScenarioBase64: shouldResetScenario ? undefined : prev.selectedScenarioBase64,
        selectedModelGalleryId: modeChanged ? undefined : prev.selectedModelGalleryId,
        selectedModelGalleryNumber: modeChanged ? undefined : prev.selectedModelGalleryNumber,
        selectedModelGalleryUrl: modeChanged ? undefined : prev.selectedModelGalleryUrl,
        selectedModelGalleryBase64: modeChanged ? undefined : prev.selectedModelGalleryBase64,
      };
    });
  };

  const handleToggleScenario = (item: AnaMariaScenarioItem) => {
    preloadScenarioUrl(item.fullUrl);
    onChange((prev) => {
      if (prev.selectedScenarioId === item.id) {
        return {
          ...prev,
          selectedScenarioId: undefined,
          selectedScenarioNumber: undefined,
          selectedScenarioUrl: undefined,
          selectedScenarioBase64: undefined,
        };
      }
      return {
        ...prev,
        selectedScenarioId: item.id,
        selectedScenarioNumber: item.number,
        selectedScenarioUrl: item.fullUrl,
        selectedScenarioBase64: undefined,
        modelScenarioSource: 'gallery', // Ao selecionar um cenário no Item 8, a chave do Item 10 vai para 'gallery'
      };
    });
  };

  const handleClearScenario = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange((prev) => ({
      ...prev,
      selectedScenarioId: undefined,
      selectedScenarioNumber: undefined,
      selectedScenarioUrl: undefined,
      selectedScenarioBase64: undefined,
    }));
  };

  const handleSelectMasterPrompt = (item: AnaMariaMasterPromptItem) => {
    if (item.primaryCategory === 'pov' || item.isPov) {
      POV_SCENARIO_GALLERY_ITEMS.forEach((s) => preloadScenarioUrl(s.fullUrl));
    }
    onChange((prev) => {
      const currentMode = prev.presentationMode || 'mirror_selfie';
      const nextMode: AnaMariaPresentationMode = item.isPov
        ? 'pov'
        : currentMode === 'pov'
        ? 'mirror_selfie'
        : currentMode;
      const wasPov = currentMode === 'pov';
      const willBePov = nextMode === 'pov';
      const shouldResetScenario = wasPov !== willBePov;

      return {
        ...prev,
        presentationMode: nextMode,
        imageModel: resolveAutoImageModel(prev, nextMode, prev.influencer),
        selectedMasterId: item.id,
        isManualMasterSelection: true,
        selectedScenarioId: shouldResetScenario ? undefined : prev.selectedScenarioId,
        selectedScenarioNumber: shouldResetScenario ? undefined : prev.selectedScenarioNumber,
        selectedScenarioUrl: shouldResetScenario ? undefined : prev.selectedScenarioUrl,
        selectedScenarioBase64: shouldResetScenario ? undefined : prev.selectedScenarioBase64,
      };
    });
  };

  const extraColorPhotos = form.extraColorPhotos || [];
  const totalProductPhotos = form.referencePhotos.length + extraColorPhotos.length;

  const canSubmit =
    totalProductPhotos > 0 &&
    !isProcessing &&
    !isUploading &&
    !isRecordingMic;
  const isInstructionsFilled = Boolean(
    form.additionalInstructions && form.additionalInstructions.trim().length > 0
  );

  // ─── PALETA DE CORES POR TEMA (FOGO vs AMETISTA) ───
  // Botões pré-selecionados (Itens 3, 4, 6, 7 e Modo de Apresentação) ficam discretos (fundo escuro com borda sutil)
  // para não ofuscar o visual, reservando o destaque vibrante para os Itens 8 e 9.
  const sectionCardClass = isAmetista
    ? 'rounded-2xl border border-purple-500/35 bg-[#140d21]/95 backdrop-blur-sm shadow-[0_4px_24px_rgba(124,58,237,0.12)]'
    : 'rounded-2xl border border-orange-500/25 bg-[#111113]/95 backdrop-blur-sm shadow-xl';

  const activeOptionButtonClass = isAmetista
    ? 'bg-[#221538] border-purple-400/60 text-white shadow-sm ring-1 ring-purple-400/25 font-bold'
    : 'bg-zinc-800/95 border-orange-500/50 text-white shadow-sm ring-1 ring-orange-500/20 font-bold';

  const inactiveOptionButtonClass = isAmetista
    ? 'bg-[#0e0817]/90 border-purple-500/20 text-zinc-400 hover:text-zinc-200 hover:border-purple-400/40'
    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700';

  const checkIconColorClass = isAmetista ? 'text-[#d4ff59]' : 'text-orange-400';
  const sectionIconColorClass = isAmetista ? 'text-[#d4ff59]' : 'text-orange-400';

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* ─── TOPO COMPACTO COM BOTÃO DE HISTÓRICO NO CANTO ─── */}
      {onOpenHistory && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onOpenHistory}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isAmetista
                ? 'bg-[#170f26] hover:bg-[#221638] border border-purple-500/35 hover:border-purple-400 text-purple-200 hover:text-white'
                : 'bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-700/80 hover:border-orange-500/45 text-zinc-300 hover:text-white'
            }`}
          >
            <History className={`w-4 h-4 ${sectionIconColorClass}`} />
            <span>Histórico de Gerações</span>
          </button>
        </div>
      )}

      {/* ─── BOTÃO DE AVANÇAR PARA A PÁGINA DE RESULTADOS ─── */}
      {hasExistingResult && onGoToResults && (
        <div
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-lg animate-fade-in border ${
            isAmetista
              ? 'bg-[#1e1233]/90 border-purple-400/45'
              : 'bg-amber-500/10 border-amber-500/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className={`w-4 h-4 shrink-0 ${isAmetista ? 'text-[#d4ff59]' : 'text-amber-400'}`} />
            <span className={`text-xs font-bold ${isAmetista ? 'text-purple-100' : 'text-amber-200'}`}>
              Você já possui uma imagem gerada neste modo.
            </span>
          </div>
          <button
            type="button"
            onClick={onGoToResults}
            className={`px-4 py-2 rounded-xl text-zinc-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isAmetista
                ? 'bg-[#d4ff59] hover:bg-[#e2ff85] shadow-lime-950/40'
                : 'bg-amber-400 hover:bg-amber-300 shadow-amber-950/40'
            }`}
          >
            <span>Avançar para a página com a imagem gerada</span>
            <ArrowRight className="w-4 h-4 text-zinc-950 stroke-[3]" />
          </button>
        </div>
      )}

      {/* ─── CARD 1: FOTOS DE REFERÊNCIA DO PRODUTO (ATÉ 10 FOTOS) ─── */}
      <div className={`${sectionCardClass} p-5 sm:p-6 space-y-4`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
          <div className="flex items-center gap-2.5">
            <ImageIcon className={`w-5 h-5 ${sectionIconColorClass}`} />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                1. Fotos de Referência da Peça
              </h2>
              <p className="text-[11px] text-zinc-400">
                Use o campo <strong className="text-zinc-200">1A</strong> para ângulos da <strong className="text-zinc-200">mesma cor</strong> (1 imagem) ou o campo <strong className="text-sky-300">1B</strong> para gerar <strong className="text-sky-300">várias cores</strong> do produto.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                totalProductPhotos > 0
                  ? isAmetista
                    ? 'bg-purple-500/20 text-[#d4ff59] border-purple-400/40'
                    : 'bg-orange-500/20 text-amber-300 border-orange-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {totalProductPhotos} foto{totalProductPhotos === 1 ? '' : 's'}
            </span>
            {totalProductPhotos > 0 && (
              <button
                type="button"
                onClick={handleClearAllPhotos}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Inputs ocultos para os 2 campos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={extraFileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleExtraColorFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Grid de 2 Campos Explícitos: Campo 1 (Mesma Cor / Ângulos) + Campo 2 (Cores Diferentes) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CAMPO 1: MESMA COR / MÚLTIPLOS ÂNGULOS */}
          <div className="space-y-3 p-3.5 rounded-xl border border-zinc-800/80 bg-[#0b0713]/60">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-white uppercase tracking-wide">
                  1A. Mesma Cor (Vários Ângulos / Detalhes)
                </p>
                <p className="text-[11px] text-zinc-400">
                  Para várias fotos da <strong className="text-zinc-200">mesma cor</strong> (frente, costas, detalhes). Gera 1 imagem única (não habilita &quot;Gerar em nova cor&quot;).
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[11px] font-bold text-zinc-300 shrink-0">
                {form.referencePhotos.length}/10
              </span>
            </div>

            {form.referencePhotos.length < 10 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? isAmetista
                      ? 'border-[#d4ff59] bg-purple-500/15'
                      : 'border-amber-400 bg-orange-500/10'
                    : isAmetista
                    ? 'border-purple-500/30 hover:border-purple-400/60 hover:bg-[#1b112c]/60 bg-[#0e0817]/50'
                    : 'border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900/60 bg-zinc-900/30'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isAmetista
                        ? 'bg-purple-500/15 border-purple-400/40 text-[#d4ff59]'
                        : 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                    }`}
                  >
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-200">
                    Adicionar fotos na mesma cor (ângulos)
                  </p>
                  <p className="text-[11px] text-zinc-500">PNG, JPG ou WEBP</p>
                </div>
              </div>
            )}

            {form.referencePhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                {form.referencePhotos.map((photo, index) => (
                  <div
                    key={index}
                    className={`relative group rounded-xl overflow-hidden border bg-zinc-900 aspect-[9/16] max-h-40 flex items-center justify-center ${
                      isAmetista ? 'border-purple-400/40' : 'border-orange-500/40'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Ângulo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                      <div className="flex justify-between items-center">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900/90 text-white text-[10px] font-bold">
                          #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(index);
                          }}
                          className="w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Remover foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {index === 0 && (
                        <span
                          className={`px-1 py-0.5 rounded text-zinc-950 text-[9px] font-black uppercase text-center ${
                            isAmetista ? 'bg-[#d4ff59]' : 'bg-orange-500'
                          }`}
                        >
                          Principal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CAMPO 2: CORES DIFERENTES (PARA "GERAR EM NOVA COR") */}
          <div className="space-y-3 p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/15">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-sky-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>1B. Várias Cores do Produto</span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Anexe aqui as fotos das <strong className="text-sky-200">várias cores</strong> do produto que deseja gerar (cada foto aqui = 1 cor).
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/35 text-[11px] font-bold text-sky-200 shrink-0">
                {extraColorPhotos.length}/10
              </span>
            </div>

            {extraColorPhotos.length < 10 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingExtra(true);
                }}
                onDragLeave={() => setIsDraggingExtra(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingExtra(false);
                  if (e.dataTransfer.files) handleExtraColorFiles(e.dataTransfer.files);
                }}
                onClick={() => extraFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDraggingExtra
                    ? 'border-sky-400 bg-sky-500/15'
                    : 'border-sky-500/35 hover:border-sky-400/70 hover:bg-sky-950/35 bg-[#09121e]/50'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-sky-500/15 border-sky-400/40 text-sky-300">
                    <Palette className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-sky-100">
                    Adicionar fotos em outras cores da peça
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Ex.: preto, rosa, verde, branco (pode usar só este campo se quiser)
                  </p>
                </div>
              </div>
            )}

            {extraColorPhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                {extraColorPhotos.map((photo, index) => {
                  const colorNum = form.referencePhotos.length > 0 ? index + 2 : index + 1;
                  return (
                    <div
                      key={index}
                      className="relative group rounded-xl overflow-hidden border border-sky-400/45 bg-zinc-900 aspect-[9/16] max-h-40 flex items-center justify-center"
                    >
                      <img
                        src={photo}
                        alt={`Cor ${colorNum}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-sky-600/95 text-white text-[9px] font-black uppercase shadow">
                        Cor {colorNum}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end p-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveExtraColorPhoto(index);
                          }}
                          className="w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Remover cor"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* OPÇÕES DE GERAÇÃO EM VÁRIAS CORES (APARECE AUTOMATICAMENTE AO ANEXAR EM 1B) */}
        {extraColorPhotos.length > 0 && (
          <div className="p-4 rounded-xl border border-sky-500/40 bg-gradient-to-br from-sky-950/35 to-[#0b1322]/90 space-y-3 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-500/20 pb-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-black text-sky-200 uppercase tracking-wide">
                  Configurações das Várias Cores ({(form.referencePhotos.length > 0 ? 1 : 0) + extraColorPhotos.length} cor{((form.referencePhotos.length > 0 ? 1 : 0) + extraColorPhotos.length) === 1 ? '' : 'es'})
                </span>
              </div>
              <span className="text-[10px] text-sky-300/80 font-semibold">
                Padrão: Não nas 3 opções (gera todas as cores de uma vez com modelos e cenários variados)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  key: 'sameModelForAllColors' as const,
                  label: 'Gerar todas as cores com a mesma modelo',
                  yesHint: 'Sim: mesma modelo em todas as cores',
                  noHint: 'Não: cada cor em uma modelo diferente',
                },
                {
                  key: 'sameScenarioForAllColors' as const,
                  label: 'Gerar todas as cores com o mesmo cenário',
                  yesHint: 'Sim: todas as cores no mesmo cenário',
                  noHint: 'Não: novo cenário da galeria a cada cor',
                },
                {
                  key: 'generateOneColorAtATime' as const,
                  label: 'Gerar em uma cor por vez',
                  yesHint: 'Sim: gera a 1ª cor e aguarda os botões',
                  noHint: 'Não: gera todas as cores de uma vez',
                },
              ].map((opt) => {
                const isYes = Boolean(form[opt.key]);
                return (
                  <div
                    key={opt.key}
                    className="p-3 rounded-xl border border-sky-500/25 bg-[#090f1c]/90 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-white leading-snug">{opt.label}:</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {isYes ? opt.yesHint : opt.noHint}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onChange((prev) => ({ ...prev, [opt.key]: true }))}
                        className={`py-1.5 px-3 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                          isYes
                            ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange((prev) => ({ ...prev, [opt.key]: false }))}
                        className={`py-1.5 px-3 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                          !isYes
                            ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalProductPhotos === 0 && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              isAmetista
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                : 'bg-orange-500/10 border-orange-500/30 text-amber-200'
            }`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 ${sectionIconColorClass}`} />
            <span>Por favor, anexe ao menos 1 foto da peça para prosseguir com a geração.</span>
          </div>
        )}
      </div>

      {/* ─── CARD 2: NOME DA PEÇA / PRODUTO (IDENTIFICAÇÃO AUTOMÁTICA + EDITÁVEL PELO USUÁRIO) ─── */}
      <div className={`${sectionCardClass} p-5 sm:p-6 space-y-3`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
          <div className="flex items-center gap-2">
            <Layers className={`w-4 h-4 ${sectionIconColorClass}`} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              2. Nome da Peça / Tipo de Roupa (Define Calçado, Headline e Hashtags)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {totalProductPhotos > 0 && (
              <button
                type="button"
                disabled={isIdentifyingProduct}
                onClick={() => {
                  const firstAny = form.referencePhotos[0] || extraColorPhotos[0];
                  if (firstAny) {
                    hasUserManuallyEditedNameRef.current = false;
                    autoIdentifyGarmentFromPhoto(firstAny, true, lastUploadedFileNameRef.current);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isAmetista
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
                title="Identificar automaticamente o nome da peça a partir da foto"
              >
                <Wand2 className="w-3 h-3 text-amber-300" />
                <span>Identificar da foto</span>
              </button>
            )}

            {isIdentifyingProduct ? (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 animate-pulse ${
                  isAmetista
                    ? 'bg-purple-500/20 text-[#d4ff59] border border-purple-400/40'
                    : 'bg-orange-500/20 text-amber-300 border border-orange-500/40'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Identificando peça pela foto...</span>
              </span>
            ) : autoIdentifiedBadge && form.productName.trim() ? (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  isAmetista
                    ? 'bg-[#1a1128] text-[#d4ff59] border border-[#d4ff59]/40'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Identificado automaticamente</span>
              </span>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Ao anexar a imagem da peça acima, o app identifica e preenche automaticamente o nome (ex.: Camisola, Camiseta, Calça, Bermuda, Conjunto). Se preferir, você pode editar livremente — o que estiver escrito aqui será sempre o nome soberano usado pelo app.
        </p>
        <input
          type="text"
          value={form.productName}
          onChange={(e) => {
            const val = e.target.value;
            if (!val.trim()) {
              hasUserManuallyEditedNameRef.current = false;
              setAutoIdentifiedBadge(false);
            } else {
              hasUserManuallyEditedNameRef.current = true;
              setAutoIdentifiedBadge(false);
            }
            onChange((prev) => {
              const modeNow = prev.presentationMode || 'mirror_selfie';
              return {
                ...prev,
                productName: val,
                selectedMasterId:
                  !prev.isManualMasterSelection && modeNow !== 'pov'
                    ? resolveMasterPromptByProductName(val)
                    : prev.selectedMasterId,
              };
            });
          }}
          placeholder="Ex: Camisola, Conjunto Fitness, Vestido Longo, Calça Jeans, Bermuda, Camiseta..."
          className={`w-full px-4 py-2.5 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none transition-colors ${
            isAmetista
              ? 'bg-[#0e0817]/90 border border-purple-400/30 focus:border-[#d4ff59]'
              : 'bg-zinc-900/90 border border-zinc-700/80 focus:border-orange-500'
          }`}
        />
      </div>

      {/* ─── CARD 3 & 4: INFLUENCIADOR & TIPO DE CORPO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Influenciador */}
        <div className={`${sectionCardClass} p-5 space-y-3`}>
          <div className={`border-b pb-2 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              3. Influenciador / Modelo
            </h3>
            <p className="text-[11px] text-zinc-400">
              Mulher é o padrão; Homem cria versão masculina da Mestra escolhida
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectInfluencer('Mulher')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs flex items-center justify-center gap-2 ${
                form.influencer === 'Mulher' ? activeOptionButtonClass : inactiveOptionButtonClass
              }`}
            >
              {form.influencer === 'Mulher' && (
                <Check className={`w-3.5 h-3.5 stroke-[3] ${checkIconColorClass}`} />
              )}
              <span>Mulher (Padrão)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectInfluencer('Homem')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs flex items-center justify-center gap-2 ${
                form.influencer === 'Homem' ? activeOptionButtonClass : inactiveOptionButtonClass
              }`}
            >
              {form.influencer === 'Homem' && (
                <Check className={`w-3.5 h-3.5 stroke-[3] ${checkIconColorClass}`} />
              )}
              <span>Homem</span>
            </button>
          </div>
        </div>

        {/* Tipo de Corpo */}
        <div className={`${sectionCardClass} p-5 space-y-3`}>
          <div className={`border-b pb-2 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              4. Tipo de Corpo
            </h3>
            <p className="text-[11px] text-zinc-400">
              Normal usa o corpo da Mestra; Plus Size ativa o Módulo Universal Plus Size
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, bodyType: 'normal' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs flex items-center justify-center gap-2 ${
                form.bodyType === 'normal' ? activeOptionButtonClass : inactiveOptionButtonClass
              }`}
            >
              {form.bodyType === 'normal' && (
                <Check className={`w-3.5 h-3.5 stroke-[3] ${checkIconColorClass}`} />
              )}
              <span>Normal (Padrão)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, bodyType: 'plus_size' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs flex items-center justify-center gap-2 ${
                form.bodyType === 'plus_size' ? activeOptionButtonClass : inactiveOptionButtonClass
              }`}
            >
              {form.bodyType === 'plus_size' && (
                <Check className={`w-3.5 h-3.5 stroke-[3] ${checkIconColorClass}`} />
              )}
              <span>Plus Size</span>
            </button>
          </div>
          {form.bodyType === 'plus_size' && (
            <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-2 pl-0.5 leading-snug">
              <span className={`font-bold ${isAmetista ? 'text-[#d4ff59]' : 'text-orange-400'}`}>✓ Plus Size Real (Fidelidade Máxima):</span> Sobrescrita corporal ativada — corpo volumoso autêntico, coxas muito grossas com celulite natural visível, seios fartos e proporções reais da referência. Preserva 100% dos acessórios, cabelo e movimentos da Mestra.
            </p>
          )}
        </div>
      </div>

      {/* ─── CARD 5: INSTRUÇÕES ADICIONAIS (PRIORIDADE SOBERANA SOBRE A MESTRA) ─── */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 shadow-xl space-y-3 transition-all ${
          isInstructionsFilled
            ? isAmetista
              ? 'border-[#d4ff59]/60 bg-gradient-to-br from-[#1d1130] to-[#120a1f]'
              : 'border-amber-400/70 bg-gradient-to-br from-[#16120d] to-zinc-950'
            : isAmetista
            ? 'border-purple-500/35 bg-[#140d21]/95'
            : 'border-orange-500/25 bg-[#111113]/95'
        }`}
      >
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              5. Instruções Adicionais (Opcional — Prioridade Máxima sobre o Prompt)
            </h2>
            {isInstructionsFilled && (
              <span
                className={`text-[10px] text-zinc-950 font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  isAmetista ? 'bg-[#d4ff59]' : 'bg-amber-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-zinc-950" /> Preenchido ✓
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400">
            Qualquer característica física, acessório ou movimento digitado aqui sobrepõe o padrão da Mestra escolhida.
          </p>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={form.additionalInstructions}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, additionalInstructions: e.target.value }))
            }
            placeholder='Ex.: "Quero uma mulher ruiva de 45 anos segurando celular amarelo e começando mostrando a palma da mão..." (ou clique no microfone para ditar)'
            className={`w-full p-3.5 pr-12 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none resize-none font-sans ${
              isAmetista
                ? 'bg-[#0e0817]/90 border border-purple-400/30 focus:border-[#d4ff59]'
                : 'bg-zinc-900/80 border border-zinc-700/80 focus:border-orange-400'
            }`}
          />
          <button
            type="button"
            onClick={toggleMic}
            className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
              isRecordingMic
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                : isAmetista
                ? 'bg-[#211536] text-[#d4ff59] hover:bg-[#2c1d47] border border-purple-400/40'
                : 'bg-zinc-800 text-amber-300 hover:bg-zinc-700 border border-orange-500/30'
            }`}
            title={isRecordingMic ? 'Parar gravação' : 'Ditar instruções adicionais'}
          >
            {isRecordingMic ? (
              <Square className="w-4 h-4 fill-white" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>

        {isRecordingMic && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Ouvindo sua voz... fale suas instruções e clique no quadrado vermelho para parar.
          </p>
        )}
      </div>

      {/* ─── CARD 6 & 7: GERADOR DE IMAGEM & PROMPT DE VÍDEO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Seletor de Gerador de Imagem */}
        <div className={`${sectionCardClass} p-5 space-y-3`}>
          <div className={`border-b pb-2 flex items-center justify-between ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <div className="flex items-center gap-2">
              <Cpu className={`w-4 h-4 ${sectionIconColorClass}`} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                6. Gerador de Imagem
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400">Padrão: OpenAI</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'seedream_5_0_pro' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'seedream_5_0_pro'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>SeaDream 5.0 Pro</span>
              {form.imageModel === 'seedream_5_0_pro' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'seedream_4_5' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'seedream_4_5'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>Seedream 4.5</span>
              {form.imageModel === 'seedream_4_5' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'kling_3_0' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'kling_3_0'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>Kling Image 3.0 Omni</span>
              {form.imageModel === 'kling_3_0' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'kling_o3_fal' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'kling_o3_fal'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>Kling O3 Omni — fal.ai</span>
              {form.imageModel === 'kling_o3_fal' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'flux_2_pro_edit' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'flux_2_pro_edit'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>FLUX 2 Pro Edit — fal.ai</span>
              {form.imageModel === 'flux_2_pro_edit' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'openai' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'openai'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>OpenAI (Padrão)</span>
              {form.imageModel === 'openai' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>
          </div>
        </div>

        {/* Seletor de Prompt de Vídeo */}
        <div className={`${sectionCardClass} p-5 space-y-3`}>
          <div className={`border-b pb-2 flex items-center justify-between ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <div className="flex items-center gap-2">
              <Scissors className={`w-4 h-4 ${sectionIconColorClass}`} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                7. Tamanho do Prompt de Vídeo
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400">Limite de Caracteres</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: 'unlimited' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.videoPromptLimit === 'unlimited'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>Padrão (Sem Limite)</span>
              {form.videoPromptLimit === 'unlimited' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: '5000' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.videoPromptLimit === '5000'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>Até 5.000 Caracteres</span>
              {form.videoPromptLimit === '5000' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: '2500' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.videoPromptLimit === '2500'
                  ? activeOptionButtonClass
                  : inactiveOptionButtonClass
              }`}
            >
              <span>Até 2.500 Caracteres</span>
              {form.videoPromptLimit === '2500' && (
                <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── SELETOR DE MODO DE APRESENTAÇÃO (MIRROR SELFIE vs MODO POV vs COM ROSTO) — BOTÕES DISCRETOS ─── */}
      <div className={`${sectionCardClass} p-4 sm:p-5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
              Modo de Apresentação (Estilo de Gravação)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Por padrão fica em Mirror Selfie (sem mostrar do queixo para cima). Ao tocar em Modo POV, os cenários e prompts mudam automaticamente para POV na cama.
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
              isAmetista
                ? 'bg-[#1a1128] border-purple-400/40 text-[#d4ff59]'
                : 'bg-zinc-900 border-orange-500/35 text-amber-300'
            }`}
          >
            Ativo:{' '}
            {activeMode === 'mirror_selfie'
              ? 'Mirror Selfie (Sem Rosto)'
              : activeMode === 'pov'
              ? 'Modo POV (Mãos na Cama)'
              : 'Com Rosto (UGC)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Botão 1: Mirror Selfie (Padrão) */}
          <button
            type="button"
            onClick={() => handleSelectPresentationMode('mirror_selfie')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeMode === 'mirror_selfie' ? activeOptionButtonClass : inactiveOptionButtonClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smartphone
                className={`w-4 h-4 shrink-0 ${
                  activeMode === 'mirror_selfie' ? checkIconColorClass : 'text-zinc-500'
                }`}
              />
              <div>
                <span className="text-xs font-bold block uppercase">Mirror Selfie (Padrão)</span>
                <span className="text-[10px] block text-zinc-400">
                  No Face · Corte no queixo
                </span>
              </div>
            </div>
            {activeMode === 'mirror_selfie' && (
              <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
            )}
          </button>

          {/* Botão 2: Com Rosto (UGC) */}
          <button
            type="button"
            onClick={() => handleSelectPresentationMode('com_rosto')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeMode === 'com_rosto' ? activeOptionButtonClass : inactiveOptionButtonClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smile
                className={`w-4 h-4 shrink-0 ${
                  activeMode === 'com_rosto' ? checkIconColorClass : 'text-zinc-500'
                }`}
              />
              <div>
                <span className="text-xs font-bold block uppercase">Com Rosto (UGC)</span>
                <span className="text-[10px] block text-zinc-400">
                  Rosto visível · Galeria UGC
                </span>
              </div>
            </div>
            {activeMode === 'com_rosto' && (
              <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
            )}
          </button>

          {/* Botão 3: Modo POV */}
          <button
            type="button"
            onClick={() => handleSelectPresentationMode('pov')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeMode === 'pov' ? activeOptionButtonClass : inactiveOptionButtonClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Hand
                className={`w-4 h-4 shrink-0 ${
                  activeMode === 'pov' ? checkIconColorClass : 'text-zinc-500'
                }`}
              />
              <div>
                <span className="text-xs font-bold block uppercase">Modo POV</span>
                <span className="text-[10px] block text-zinc-400">
                  Mãos & 2 Peças na Cama
                </span>
              </div>
            </div>
            {activeMode === 'pov' && (
              <Check className={`w-4 h-4 stroke-[3] ${checkIconColorClass}`} />
            )}
          </button>
        </div>
      </div>

      {/* ─── CARD 8: TOQUE AQUI PARA ESCOLHER UM CENÁRIO (MANTÉM O DESTAQUE ESPECIAL QUE O USUÁRIO GOSTOU) ─── */}
      <div
        className={`rounded-2xl transition-all duration-300 overflow-hidden shadow-2xl ${
          isAmetista
            ? form.selectedScenarioNumber
              ? 'border-2 border-[#d4ff59] bg-gradient-to-br from-[#130b20] via-[#251238] to-[#1a2212] shadow-purple-950/60 ring-2 ring-[#d4ff59]/30'
              : 'border-2 border-purple-400/75 bg-gradient-to-br from-[#130b20] via-[#261139] to-[#120a1e] shadow-purple-950/60 ring-2 ring-purple-500/30'
            : form.selectedScenarioNumber
            ? 'border-2 border-amber-400 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/40 shadow-amber-950/60 ring-2 ring-amber-400/30'
            : 'border-2 border-orange-500 bg-gradient-to-br from-zinc-950 via-orange-950/30 to-zinc-950 shadow-orange-950/50 ring-2 ring-orange-500/30'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsGalleryExpanded((prev) => !prev)}
          className={`w-full p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-left transition-colors cursor-pointer group ${
            isAmetista ? 'hover:bg-purple-500/10' : 'hover:bg-orange-500/10'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl text-zinc-950 flex items-center justify-center font-black shadow-lg shrink-0 group-hover:scale-105 transition-transform ${
                isAmetista
                  ? 'bg-[#d4ff59] shadow-lime-950/40'
                  : 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 shadow-orange-500/40'
              }`}
            >
              <ImageIcon className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-sm sm:text-base font-black uppercase tracking-wide transition-colors ${
                    isAmetista
                      ? 'text-white group-hover:text-[#d4ff59]'
                      : 'text-amber-300 group-hover:text-amber-200'
                  }`}
                >
                  {isPovMode
                    ? '8. TOQUE AQUI PARA ESCOLHER UM CENÁRIO POV'
                    : '8. TOQUE AQUI PARA ESCOLHER UM CENÁRIO'}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                    isAmetista
                      ? 'bg-[#1a1128] text-[#d4ff59] border border-[#d4ff59]/50'
                      : 'bg-orange-500 text-zinc-950'
                  }`}
                >
                  OPCIONAL
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold hidden sm:inline-block ${
                    isAmetista
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-400/35'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeScenarioList.length}{' '}
                  {isPovMode ? 'Cenários POV' : 'Cenários Vencedores'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-300 mt-1">
                {isPovMode
                  ? 'Opcional: escolha entre o Cenário POV 1 (colcha branca e manta rosé) ou Cenário POV 2 (lençol rosa). Se não escolher, o app sorteará automaticamente!'
                  : 'Opcional: escolha qualquer um dos 24 cenários. Se não escolher, o app sorteará automaticamente!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {form.selectedScenarioNumber ? (
              <div
                className={`flex items-center gap-1.5 text-zinc-950 font-black px-3 py-1.5 rounded-xl border shadow-md ${
                  isAmetista
                    ? 'bg-[#d4ff59] border-lime-300 shadow-lime-950/40'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 border-amber-300 shadow-orange-950/40'
                }`}
              >
                <span className="text-xs">
                  {isPovMode
                    ? `Cenário POV ${form.selectedScenarioNumber} ✓`
                    : `Cenário ${form.selectedScenarioNumber} Selecionado ✓`}
                </span>
                <button
                  type="button"
                  onClick={handleClearScenario}
                  className="p-1 hover:bg-black/20 rounded-lg text-zinc-950 transition-colors ml-1 cursor-pointer"
                  title="Desmarcar cenário (sortear de forma randômica)"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div
                className={`px-3 py-1.5 rounded-xl text-zinc-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
                  isAmetista
                    ? 'bg-[#d4ff59] group-hover:bg-[#e3ff88]'
                    : 'bg-orange-500 group-hover:bg-amber-400'
                }`}
              >
                <span>{isPovMode ? 'Abrir Cenários POV' : 'Abrir Galeria'}</span>
              </div>
            )}
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                isAmetista
                  ? 'bg-purple-500/20 border-purple-400/50 text-[#d4ff59] group-hover:bg-[#d4ff59] group-hover:text-zinc-950'
                  : 'bg-orange-500/20 border-orange-500/50 text-orange-300 group-hover:bg-orange-500 group-hover:text-zinc-950'
              }`}
            >
              {isGalleryExpanded ? (
                <ChevronUp className="w-4 h-4 stroke-[3]" />
              ) : (
                <ChevronDown className="w-4 h-4 stroke-[3]" />
              )}
            </div>
          </div>
        </button>

        {isGalleryExpanded && (
          <div
            className={`p-5 pt-0 border-t space-y-4 animate-fade-in ${
              isAmetista
                ? 'border-purple-500/30 bg-[#0d0816]/90'
                : 'border-orange-500/30 bg-zinc-950/80'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
              <p className={`text-xs font-medium ${isAmetista ? 'text-purple-200' : 'text-amber-200/90'}`}>
                {isPovMode
                  ? 'Toque em um dos cenários POV abaixo para definir a cama onde os 2 produtos e as mãos serão gerados:'
                  : 'Toque em qualquer miniatura para escolher o cenário independente. Se não escolher, um cenário será sorteado automaticamente:'}
              </p>
              {form.selectedScenarioNumber && (
                <button
                  type="button"
                  onClick={handleClearScenario}
                  className={`text-xs font-black underline cursor-pointer ${
                    isAmetista ? 'text-[#d4ff59] hover:text-lime-200' : 'text-amber-300 hover:text-amber-200'
                  }`}
                >
                  Remover seleção (voltar ao sorteio randômico)
                </button>
              )}
            </div>

            <div
              className={
                isPovMode
                  ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl'
                  : 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'
              }
            >
              {activeScenarioList.map((item) => {
                const isSelected = form.selectedScenarioId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleScenario(item)}
                    className={`group relative rounded-xl overflow-hidden aspect-[9/16] transition-all cursor-pointer text-left bg-zinc-900 flex flex-col justify-between ${
                      isSelected
                        ? isAmetista
                          ? 'ring-3 ring-[#d4ff59] border-2 border-[#d4ff59] shadow-xl shadow-purple-500/40 scale-[1.02]'
                          : 'ring-3 ring-amber-400 border-2 border-amber-300 shadow-xl shadow-orange-500/40 scale-[1.02]'
                        : isAmetista
                        ? 'border border-purple-500/30 hover:border-[#d4ff59]/60 opacity-85 hover:opacity-100 hover:scale-[1.01]'
                        : 'border border-zinc-800 hover:border-orange-500/60 opacity-85 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    <img
                      src={item.thumbUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white text-zinc-950 font-black text-xs flex items-center justify-center shadow-md select-none border border-zinc-300">
                      {item.number}
                    </div>

                    {isSelected && (
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full text-zinc-950 font-black flex items-center justify-center shadow-md animate-fade-in ${
                          isAmetista ? 'bg-[#d4ff59]' : 'bg-amber-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6">
                      <span
                        className={`text-[11px] font-bold block truncate ${
                          isSelected
                            ? isAmetista
                              ? 'text-[#d4ff59]'
                              : 'text-amber-300'
                            : 'text-zinc-200'
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── CARD 9: GALERIA DE PROMPTS DE MOVIMENTO (MANTÉM O DESTAQUE ESPECIAL QUE O USUÁRIO GOSTOU) ─── */}
      <div
        className={`rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl ${
          isAmetista
            ? 'border-2 border-purple-400/75 bg-gradient-to-br from-[#120a1f] via-[#27113b] to-[#140b22] shadow-purple-950/60 ring-2 ring-purple-500/30'
            : 'border-2 border-orange-500 bg-gradient-to-br from-[#0d0d0f] via-[#17120e] to-[#0d0d0f] shadow-orange-950/50 ring-2 ring-orange-500/30'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsPromptsGalleryExpanded((prev) => !prev)}
          className={`w-full p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-left transition-colors cursor-pointer group ${
            isAmetista ? 'hover:bg-purple-500/10' : 'hover:bg-orange-500/10'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl text-zinc-950 flex items-center justify-center font-black shadow-lg shrink-0 group-hover:scale-105 transition-transform ${
                isAmetista
                  ? 'bg-[#d4ff59] shadow-lime-950/40'
                  : 'bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 shadow-orange-500/40'
              }`}
            >
              <Video className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-sm sm:text-base font-black uppercase tracking-wide transition-colors ${
                    isAmetista
                      ? 'text-white group-hover:text-[#d4ff59]'
                      : 'text-amber-300 group-hover:text-amber-200'
                  }`}
                >
                  9. TOQUE AQUI PARA ESCOLHER O PROMPT DE MOVIMENTO (GALERIA DE MESTRES)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                    isAmetista
                      ? 'bg-[#1a1128] text-[#d4ff59] border border-[#d4ff59]/50'
                      : 'bg-amber-400 text-zinc-950'
                  }`}
                >
                  {MASTER_PROMPTS_GALLERY.length} VÍDEOS MESTRES
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-300 mt-1">
                Passe o mouse sobre os vídeos para reproduzir. O prompt selecionado define as características físicas da modelo, joias/acessórios e coreografia de movimentos!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center gap-1.5 text-zinc-950 font-black px-3.5 py-1.5 rounded-xl border shadow-md ${
                isAmetista
                  ? 'bg-[#d4ff59] border-lime-300 shadow-lime-950/40'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 border-amber-300 shadow-orange-950/40'
              }`}
            >
              <span className="text-xs">{activeMaster.shortName} ✓</span>
            </div>
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                isAmetista
                  ? 'bg-purple-500/20 border-purple-400/50 text-[#d4ff59] group-hover:bg-[#d4ff59] group-hover:text-zinc-950'
                  : 'bg-orange-500/20 border-orange-500/50 text-orange-300 group-hover:bg-orange-500 group-hover:text-zinc-950'
              }`}
            >
              {isPromptsGalleryExpanded ? (
                <ChevronUp className="w-4 h-4 stroke-[3]" />
              ) : (
                <ChevronDown className="w-4 h-4 stroke-[3]" />
              )}
            </div>
          </div>
        </button>

        {isPromptsGalleryExpanded && (
          <div className="p-5 sm:p-6 border-t border-orange-500/30 bg-[#0b0b0c] space-y-5 animate-fade-in">
            {/* MENU SUPERIOR DE ABAS IGUAL À REFERÊNCIA (APENAS MIRROR SELFIE, POV E COM ROSTO) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPresentationMode('mirror_selfie')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  activeMode === 'mirror_selfie'
                    ? 'bg-[#26150b] border-orange-500 text-orange-400 shadow-md shadow-orange-950/50'
                    : 'bg-[#141416] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeMode === 'mirror_selfie' ? 'bg-orange-500' : 'bg-purple-500'
                  }`}
                />
                <span>Mirror Selfie</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresentationMode('com_rosto')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  activeMode === 'com_rosto'
                    ? 'bg-[#26150b] border-orange-500 text-orange-400 shadow-md shadow-orange-950/50'
                    : 'bg-[#141416] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeMode === 'com_rosto' ? 'bg-orange-500' : 'bg-amber-500'
                  }`}
                />
                <span>Com Rosto (UGC)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresentationMode('pov')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  activeMode === 'pov'
                    ? 'bg-[#26150b] border-orange-500 text-orange-400 shadow-md shadow-orange-950/50'
                    : 'bg-[#141416] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeMode === 'pov' ? 'bg-orange-500' : 'bg-pink-500'
                  }`}
                />
                <span>POV</span>
              </button>
            </div>

            {/* CONTADOR DE PROMPTS DA ABA ATIVA */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {filteredMasterPrompts.length}{' '}
                {filteredMasterPrompts.length === 1 ? 'PROMPT' : 'PROMPTS'}
              </span>
              <span className="text-[11px] text-amber-300/90">
                Passe o mouse sobre o vídeo para visualizar os movimentos e clique para selecionar
              </span>
            </div>

            {/* GRADE 4 POR LINHA ESTILO IMAGEM DE REFERÊNCIA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredMasterPrompts.map((item) => {
                const isSelected = activeMaster.id === item.id;
                const isPlaying = playingVideoId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectMasterPrompt(item)}
                    onMouseEnter={(e) => {
                      const videoEl = e.currentTarget.querySelector('video');
                      if (videoEl) {
                        setPlayingVideoId(item.id);
                        videoEl.play().catch(() => {});
                      }
                    }}
                    onMouseLeave={(e) => {
                      const videoEl = e.currentTarget.querySelector('video');
                      if (videoEl) {
                        videoEl.pause();
                        setPlayingVideoId((prev) => (prev === item.id ? null : prev));
                      }
                    }}
                    className={`group rounded-2xl overflow-hidden bg-[#161618] flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-orange-500 ring-2 ring-orange-500/40 shadow-2xl shadow-orange-950/70 scale-[1.01]'
                        : 'border border-zinc-800/90 hover:border-orange-500/60 hover:shadow-xl'
                    }`}
                  >
                    {/* Área Superior: Vídeo Vertical 9:16 */}
                    <div className="relative aspect-[9/16] w-full bg-black overflow-hidden">
                      <video
                        src={item.videoUrl}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />

                      {/* Badge Superior Esquerdo: ▶ VÍDEO */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#332010]/90 border border-orange-500/50 text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm shadow">
                        <span>▶ VÍDEO</span>
                      </div>

                      {/* Círculo Superior Direito: Indicador de Seleção */}
                      <div
                        className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${
                          isSelected
                            ? 'bg-orange-500 text-zinc-950 border border-amber-300'
                            : 'bg-black/65 border border-white/15 text-zinc-400'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <span className="text-[10px] font-bold">{item.number}</span>
                        )}
                      </div>

                      {/* Ícone Play Central (some suavemente enquanto o vídeo reproduz no hover) */}
                      <div
                        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
                          isPlaying ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-black/55 border border-white/25 flex items-center justify-center text-white backdrop-blur-sm shadow-lg">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Área Inferior: Título, Objetivo e Botão Laranja */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-[#161618]">
                      <div className="space-y-1.5">
                        <h4 className="text-xs sm:text-[13px] font-black text-white uppercase leading-snug">
                          {item.cardTitle}
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {item.objective}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMasterPrompt(item);
                        }}
                        className={`w-full py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 border border-amber-300 shadow-md shadow-orange-950/50'
                            : 'bg-[#26160c] hover:bg-[#382010] border border-orange-600/60 text-orange-400'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>PROMPT SELECIONADO</span>
                          </>
                        ) : (
                          <span>USAR ESTE PROMPT</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── CARD 10: TOQUE AQUI PARA ESCOLHER SUA MODELO (GALERIA DE MODELOS) ─── */}
      <div
        className={`rounded-2xl transition-all duration-300 overflow-hidden shadow-2xl ${
          isAmetista
            ? selectedModelItem
              ? 'border-2 border-[#d4ff59] bg-gradient-to-br from-[#130b20] via-[#251238] to-[#1a2212] shadow-purple-950/60 ring-2 ring-[#d4ff59]/30'
              : 'border-2 border-purple-400/75 bg-gradient-to-br from-[#130b20] via-[#261139] to-[#120a1e] shadow-purple-950/60 ring-2 ring-purple-500/30'
            : selectedModelItem
            ? 'border-2 border-amber-400 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/40 shadow-amber-950/60 ring-2 ring-amber-400/30'
            : 'border-2 border-orange-500 bg-gradient-to-br from-zinc-950 via-orange-950/30 to-zinc-950 shadow-orange-950/50 ring-2 ring-orange-500/30'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsModelGalleryExpanded((prev) => !prev)}
          className={`w-full p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-left transition-colors cursor-pointer group ${
            isAmetista ? 'hover:bg-purple-500/10' : 'hover:bg-orange-500/10'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl text-zinc-950 flex items-center justify-center font-black shadow-lg shrink-0 group-hover:scale-105 transition-transform ${
                isAmetista
                  ? 'bg-[#d4ff59] shadow-lime-950/40'
                  : 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 shadow-orange-500/40'
              }`}
            >
              <UserCheck className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-sm sm:text-base font-black uppercase tracking-wide transition-colors ${
                    isAmetista
                      ? 'text-white group-hover:text-[#d4ff59]'
                      : 'text-amber-300 group-hover:text-amber-200'
                  }`}
                >
                  10. TOQUE AQUI PARA ESCOLHER SUA MODELO (GALERIA DE MODELOS)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                    isAmetista
                      ? 'bg-[#1a1128] text-[#d4ff59] border border-[#d4ff59]/50'
                      : 'bg-amber-400 text-zinc-950'
                  }`}
                >
                  {currentModelGallery.length} MODELOS
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    activeMode === 'com_rosto'
                      ? 'bg-purple-950/70 text-purple-300 border-purple-500/50'
                      : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {activeMode === 'com_rosto' ? 'Galeria Com Rosto (UGC)' : 'Galeria Mirror Selfie (Sem Rosto)'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold hidden sm:inline-block ${
                    isAmetista
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-400/35'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  }`}
                >
                  {selectedModelItem ? `Padrão: ${selectedModelItem.name}` : 'Dinâmico via Prompt'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-300 mt-1">
                A modelo escolhida define 100% o biotipo, curvas, tom de pele, cabelos, pose e ângulo da foto. O app troca apenas a roupa pelo produto (Item 1) + peça complementar e coloca no cenário escolhido (Item 8)!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedModelItem ? (
              <div
                className={`flex items-center gap-1.5 text-zinc-950 font-black px-3 py-1.5 rounded-xl border shadow-md ${
                  isAmetista
                    ? 'bg-[#d4ff59] border-lime-300 shadow-lime-950/40'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 border-amber-300 shadow-orange-950/40'
                }`}
              >
                <span className="text-xs">{selectedModelItem.name} ✓</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearModel();
                  }}
                  className="hover:opacity-75 transition-opacity ml-1 p-0.5 cursor-pointer"
                  title="Desmarcar modelo (sortear automaticamente)"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            ) : form.generateModelViaPrompt ? (
              <div className="flex items-center gap-1.5 text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 text-xs">
                <span>✨ Gerar via Prompt</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sky-300 font-bold px-3 py-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 text-xs">
                <span>🎲 Aleatório (Galeria)</span>
              </div>
            )}
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                isAmetista
                  ? 'bg-purple-500/20 border-purple-400/50 text-[#d4ff59] group-hover:bg-[#d4ff59] group-hover:text-zinc-950'
                  : 'bg-orange-500/20 border-orange-500/50 text-orange-300 group-hover:bg-orange-500 group-hover:text-zinc-950'
              }`}
            >
              {isModelGalleryExpanded ? (
                <ChevronUp className="w-4 h-4 stroke-[3]" />
              ) : (
                <ChevronDown className="w-4 h-4 stroke-[3]" />
              )}
            </div>
          </div>
        </button>

        {isModelGalleryExpanded && (
          <div className="p-5 sm:p-6 border-t border-orange-500/30 bg-[#0b0b0c] space-y-5 animate-fade-in">
            {/* Interruptor de Cenário da Modelo (esquerda) vs Cenário da Galeria (direita) em tom azul suave */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-zinc-300">Cenário da Composição:</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {(form.modelScenarioSource || 'model') === 'model'
                    ? 'Cenário e pose da modelo preservados 100% idênticos (Modo 2 Fotos).'
                    : 'Modelo inserida em um cenário da galeria de cenários (Modo 3 Fotos).'}
                </p>
              </div>
              {/* Interruptor tipo de luz */}
              <div className="inline-flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800/90 shadow-inner">
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, modelScenarioSource: 'model' }))}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    (form.modelScenarioSource || 'model') === 'model'
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Manter o cenário da modelo (Modo 2 Fotos)"
                >
                  Cenário da Modelo
                </button>
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, modelScenarioSource: 'gallery' }))}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    form.modelScenarioSource === 'gallery'
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Usar cenário da galeria de cenários (Modo 3 Fotos)"
                >
                  Cenário da Galeria
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Selecione uma modelo da galeria (${currentModelGallery.length} opções disponíveis)
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {form.generateModelViaPrompt
                    ? '✨ Modo Gerar via Prompt ATIVO: Uma modelo exclusiva será gerada via IA por descrição textual (sem usar foto fixa), com joias delicadas e calçado combinando.'
                    : selectedModelItem
                    ? 'Por padrão ("Cenário da Modelo"), a modelo e o cenário dela são preservados 100% idênticos, trocando apenas a roupa pelo seu produto.'
                    : `🎲 Modo Automático: Como nenhuma modelo foi selecionada, o app escolherá aleatoriamente uma das ${currentModelGallery.length} modelos e um dos cenários da galeria a cada geração.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleGenerateViaPrompt}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    form.generateModelViaPrompt
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 ring-1 ring-amber-400/40'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                  title="Gera a modelo puramente via prompt (sem foto de referência de modelo)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{form.generateModelViaPrompt ? 'Gerando via Prompt ✓' : 'Desmarcar Modelo (Gerar via Prompt)'}</span>
                </button>

                {(selectedModelItem || form.generateModelViaPrompt) && (
                  <button
                    type="button"
                    onClick={handleClearModel}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Voltar ao modo randômico / aleatório automático"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Aleatório da Galeria</span>
                  </button>
                )}
              </div>
            </div>

            {/* Grid com as modelos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {currentModelGallery.map((item) => {
                const isSelected = selectedModelItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectModel(item)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group border flex flex-col ${
                      isSelected
                        ? isAmetista
                          ? 'border-[#d4ff59] ring-2 ring-[#d4ff59] shadow-lg shadow-purple-950/80 bg-zinc-900'
                          : 'border-amber-400 ring-2 ring-amber-400 shadow-lg shadow-orange-950/80 bg-zinc-900'
                        : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950'
                    }`}
                  >
                    <div className="relative aspect-[9/16] bg-zinc-900 overflow-hidden">
                      <img
                        src={item.fullUrl}
                        alt={item.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-black text-amber-300 border border-amber-400/30">
                        #{String(item.number).padStart(2, '0')}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-black shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectModel(item);
                        }}
                        className={`w-full mt-2.5 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 border border-amber-300 shadow-sm'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {isSelected ? 'SELECIONADA ✓' : 'ESCOLHER'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── BARRA DE PROGRESSO COM GIF IGUAL AO MODO PRODUTOS 2.0 ─── */}
      {isProcessing && (
        <ProgressBar
          currentStep="generating_images"
          progressPercent={progressPercent}
          statusMessage={statusMessage || 'Gerando vídeo no Modo Ana Maria...'}
        />
      )}

      {/* ─── BOTÃO DE AÇÃO: GERAR VÍDEO (MESMA COR DO MODO PRODUTOS 2.0) ─── */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            if (!canSubmit || isRecordingMic) return;
            onSubmit();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          {isRecordingMic ? (
            <>
              <Square className="w-5 h-5 fill-rose-400 text-rose-400 animate-pulse" />
              <span>Gravação de voz ativa — Pare o microfone (⏹) para liberar o botão</span>
            </>
          ) : (
            <>
              <Sparkles className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isProcessing
                  ? `Gerando com ${activeMaster.shortName}...`
                  : `Gerar Vídeo (${activeMaster.shortName})`}
              </span>
            </>
          )}
        </button>

        {isRecordingMic && (
          <p className="text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-1.5 mt-2 animate-pulse">
            <Mic className="w-3.5 h-3.5 animate-bounce text-rose-400" />
            Ditado de voz ativo nas instruções adicionais. Pause a gravação no microfone para liberar a geração do vídeo.
          </p>
        )}
      </div>
    </div>
  );
};
