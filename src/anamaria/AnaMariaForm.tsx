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
} from './masterPromptsData';
import { preloadScenarioUrl, prewarmDefaultScenarios } from './anaMariaPipeline';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isIdentifyingProduct, setIsIdentifyingProduct] = useState(false);
  const [autoIdentifiedBadge, setAutoIdentifiedBadge] = useState(false);
  const hasUserManuallyEditedNameRef = useRef<boolean>(false);

  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  const [isPromptsGalleryExpanded, setIsPromptsGalleryExpanded] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isAmetista = theme === 'ametista';
  const activeMode: AnaMariaPresentationMode = form.presentationMode || 'mirror_selfie';
  const activeMaster = getMasterPromptById(form.selectedMasterId);
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

  /**
   * Identifica automaticamente o nome da peça (ex: Camisola, Camiseta, Calça, Bermuda, Conjunto)
   * assim que o usuário adiciona a primeira foto, sem jamais sobrescrever o que o usuário digitar.
   */
  const autoIdentifyGarmentFromPhoto = async (photoBase64: string) => {
    if (!photoBase64 || hasUserManuallyEditedNameRef.current) return;
    setIsIdentifyingProduct(true);
    try {
      const res = await fetch('/api/detect-dominant-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64,
          mode: 'identify_garment',
        }),
      });
      const data = await res.json();
      if (data?.success && data?.garmentName && !hasUserManuallyEditedNameRef.current) {
        onChange((prev) => {
          // Só preenche se o usuário não tiver digitado manualmente enquanto identificava
          if (hasUserManuallyEditedNameRef.current && prev.productName.trim().length > 0) {
            return prev;
          }
          return {
            ...prev,
            productName: data.garmentName,
          };
        });
        setAutoIdentifiedBadge(true);
      }
    } catch (err) {
      console.warn('Falha silenciosa ao identificar peça automaticamente:', err);
    } finally {
      setIsIdentifyingProduct(false);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const remainingSlots = 10 - form.referencePhotos.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = validFiles.slice(0, remainingSlots);
    const wasEmptyBefore = form.referencePhotos.length === 0;
    setIsUploading(true);

    try {
      // Alta definição (1536px, qualidade 0.92) nas fotos do produto para preservar 100% de rendas, costuras e microtexturas
      const b64Promises = filesToProcess.map((file) => compressAndResizeImage(file, 1536, 0.92));
      const newPhotos = await Promise.all(b64Promises);

      onChange((prev) => ({
        ...prev,
        referencePhotos: [...prev.referencePhotos, ...newPhotos].slice(0, 10),
      }));

      // Se era o primeiro anexo (ou o campo Nome da Peça ainda está vazio e não foi editado pelo usuário),
      // envia miniatura leve de 512px (~25 KB) apenas para identificar o nome da peça em <0.6s sem competir com a geração
      if (filesToProcess[0] && (wasEmptyBefore || !form.productName.trim()) && !hasUserManuallyEditedNameRef.current) {
        compressAndResizeImage(filesToProcess[0], 512, 0.75)
          .then((thumbB64) => autoIdentifyGarmentFromPhoto(thumbB64))
          .catch(() => autoIdentifyGarmentFromPhoto(newPhotos[0]));
      }
    } catch (err) {
      console.error('Erro ao processar imagens:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    onChange((prev) => {
      const nextPhotos = prev.referencePhotos.filter((_, i) => i !== index);
      if (nextPhotos.length === 0 && !hasUserManuallyEditedNameRef.current) {
        setAutoIdentifiedBadge(false);
      }
      return {
        ...prev,
        referencePhotos: nextPhotos,
      };
    });
  };

  const handleClearAllPhotos = () => {
    if (!hasUserManuallyEditedNameRef.current) {
      setAutoIdentifiedBadge(false);
      onChange((prev) => ({
        ...prev,
        referencePhotos: [],
        productName: '',
      }));
    } else {
      onChange((prev) => ({
        ...prev,
        referencePhotos: [],
      }));
    }
  };

  const handleSelectPresentationMode = (newMode: AnaMariaPresentationMode) => {
    onChange((prev) => {
      const currentMaster = getMasterPromptById(prev.selectedMasterId);
      const isMasterCompatible = currentMaster.categories.includes(newMode);
      const nextMaster = isMasterCompatible
        ? currentMaster
        : getDefaultMasterForMode(newMode);

      const wasPov = prev.presentationMode === 'pov';
      const willBePov = newMode === 'pov';
      const shouldResetScenario = wasPov !== willBePov;

      return {
        ...prev,
        presentationMode: newMode,
        selectedMasterId: nextMaster.id,
        selectedScenarioId: shouldResetScenario ? undefined : prev.selectedScenarioId,
        selectedScenarioNumber: shouldResetScenario ? undefined : prev.selectedScenarioNumber,
        selectedScenarioUrl: shouldResetScenario ? undefined : prev.selectedScenarioUrl,
        selectedScenarioBase64: shouldResetScenario ? undefined : prev.selectedScenarioBase64,
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
    onChange((prev) => {
      const currentMode = prev.presentationMode || 'mirror_selfie';
      const nextMode = item.primaryCategory;
      const wasPov = currentMode === 'pov';
      const willBePov = nextMode === 'pov';
      const shouldResetScenario = wasPov !== willBePov;

      return {
        ...prev,
        presentationMode: nextMode,
        selectedMasterId: item.id,
        selectedScenarioId: shouldResetScenario ? undefined : prev.selectedScenarioId,
        selectedScenarioNumber: shouldResetScenario ? undefined : prev.selectedScenarioNumber,
        selectedScenarioUrl: shouldResetScenario ? undefined : prev.selectedScenarioUrl,
        selectedScenarioBase64: shouldResetScenario ? undefined : prev.selectedScenarioBase64,
      };
    });
  };

  const canSubmit = form.referencePhotos.length > 0 && !isProcessing && !isUploading;
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
                1. Fotos de Referência da Peça (Até 10 fotos)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Anexe fotos de frente, costas, detalhes do tecido e caimento. Ao anexar a foto, o app identifica automaticamente o tipo de peça no campo 2!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                form.referencePhotos.length > 0
                  ? isAmetista
                    ? 'bg-purple-500/20 text-[#d4ff59] border-purple-400/40'
                    : 'bg-orange-500/20 text-amber-300 border-orange-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {form.referencePhotos.length}/10 fotos
            </span>
            {form.referencePhotos.length > 0 && (
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

        {/* Zona de Upload Drag & Drop */}
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
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? isAmetista
                  ? 'border-[#d4ff59] bg-purple-500/15'
                  : 'border-amber-400 bg-orange-500/10'
                : isAmetista
                ? 'border-purple-500/30 hover:border-purple-400/60 hover:bg-[#1b112c]/60 bg-[#0e0817]/50'
                : 'border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900/60 bg-zinc-900/30'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  isAmetista
                    ? 'bg-purple-500/15 border-purple-400/40 text-[#d4ff59]'
                    : 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                }`}
              >
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-200">
                Arraste as fotos da peça aqui ou clique para selecionar
              </p>
              <p className="text-[11px] text-zinc-500">
                Suporta PNG, JPG, WEBP. Você pode anexar até 10 fotos da peça para máxima fidelidade.
              </p>
            </div>
          </div>
        )}

        {/* Grade de Fotos Anexadas */}
        {form.referencePhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
            {form.referencePhotos.map((photo, index) => (
              <div
                key={index}
                className={`relative group rounded-xl overflow-hidden border bg-zinc-900 aspect-[9/16] max-h-48 flex items-center justify-center ${
                  isAmetista ? 'border-purple-400/40' : 'border-orange-500/40'
                }`}
              >
                <img
                  src={photo}
                  alt={`Referência ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
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
                      className="w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {index === 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-zinc-950 text-[9px] font-black uppercase text-center ${
                        isAmetista ? 'bg-[#d4ff59]' : 'bg-orange-500'
                      }`}
                    >
                      Foto Principal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {form.referencePhotos.length === 0 && (
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
              <span>Identificado automaticamente (você pode editar se preferir)</span>
            </span>
          ) : null}
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Ao anexar a imagem da peça acima, o app identifica e preenche automaticamente o nome (ex.: Camisola, Camiseta, Calça, Bermuda, Conjunto). Se preferir, você pode editar livremente — o que estiver escrito aqui será sempre o nome soberano usado pelo app.
        </p>
        <input
          type="text"
          value={form.productName}
          onChange={(e) => {
            const val = e.target.value;
            hasUserManuallyEditedNameRef.current = val.trim().length > 0;
            setAutoIdentifiedBadge(false);
            onChange((prev) => ({ ...prev, productName: val }));
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
              onClick={() => onChange((prev) => ({ ...prev, influencer: 'Mulher' }))}
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
              onClick={() => onChange((prev) => ({ ...prev, influencer: 'Homem' }))}
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
              <span className={`font-bold ${isAmetista ? 'text-[#d4ff59]' : 'text-orange-400'}`}>✓ Plus Size Real (Manequim 50–54):</span> Coxas hiper-grossas que se tocam, textura de celulite natural visível, pele clara não bronzeada e volume corporal autêntico.
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
            <span className="text-[10px] text-zinc-400">Padrão: SeaDream 5.0 Pro</span>
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
              <span>SeaDream 5.0 Pro (Padrão)</span>
              {form.imageModel === 'seedream_5_0_pro' && (
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
              <span>Kling 3.0</span>
              {form.imageModel === 'kling_3_0' && (
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
              <span>OpenAI</span>
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

          {/* Botão 2: Modo POV */}
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

          {/* Botão 3: Com Rosto (UGC) */}
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
                  Rosto visível · Estilo Catza
                </span>
              </div>
            </div>
            {activeMode === 'com_rosto' && (
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
                  : 'Opcional: escolha qualquer um dos 24 cenários. Se não escolher, o app sorteará automaticamente (ou usará o Cenário 24 para Mestra Catza)!'}
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
          onClick={onSubmit}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <Sparkles className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>
            {isProcessing
              ? `Gerando com ${activeMaster.shortName}...`
              : `Gerar Vídeo (${activeMaster.shortName})`}
          </span>
        </button>
      </div>
    </div>
  );
};
