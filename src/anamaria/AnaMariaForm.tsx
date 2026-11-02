import React, { useRef, useState } from 'react';
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
} from 'lucide-react';
import {
  AnaMariaFormState,
  AnaMariaInfluencer,
  AnaMariaBodyType,
  AnaMariaImageModel,
  AnaMariaVideoPromptLimit,
} from './types';
import { compressAndResizeImage } from '../ania/aniaLibrary';
import { ProgressBar } from '../components/ProgressBar';
import { SCENARIO_GALLERY_ITEMS } from './scenarioGalleryData';

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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const remainingSlots = 10 - form.referencePhotos.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = validFiles.slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const b64Promises = filesToProcess.map((file) => compressAndResizeImage(file, 1440, 0.85));
      const newPhotos = await Promise.all(b64Promises);

      onChange((prev) => ({
        ...prev,
        referencePhotos: [...prev.referencePhotos, ...newPhotos].slice(0, 10),
      }));
    } catch (err) {
      console.error('Erro ao processar imagens:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    onChange((prev) => ({
      ...prev,
      referencePhotos: prev.referencePhotos.filter((_, i) => i !== index),
    }));
  };

  const handleClearAllPhotos = () => {
    onChange((prev) => ({
      ...prev,
      referencePhotos: [],
    }));
  };

  const handleToggleScenario = (item: (typeof SCENARIO_GALLERY_ITEMS)[number]) => {
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

  const canSubmit = form.referencePhotos.length > 0 && !isProcessing && !isUploading;
  const isInstructionsFilled = Boolean(form.additionalInstructions && form.additionalInstructions.trim().length > 0);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* ─── TOPO COMPACTO COM BOTÃO DE HISTÓRICO NO CANTO ─── */}
      {onOpenHistory && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onOpenHistory}
            className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-sky-500/50 text-sky-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <History className="w-4 h-4 text-sky-400" />
            <span>Histórico de Gerações</span>
          </button>
        </div>
      )}

      {/* ─── BOTÃO DE AVANÇAR PARA A PÁGINA DE RESULTADOS (AMARELO VIBRANTE - ITEM 3) ─── */}
      {hasExistingResult && onGoToResults && (
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-200">
              Você já possui uma imagem gerada neste modo.
            </span>
          </div>
          <button
            type="button"
            onClick={onGoToResults}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-950/40"
          >
            <span>Avançar para a página com a imagem gerada</span>
            <ArrowRight className="w-4 h-4 text-zinc-950 stroke-[3]" />
          </button>
        </div>
      )}

      {/* ─── CARD 1: FOTOS DE REFERÊNCIA DO PRODUTO (ATÉ 10 FOTOS) ─── */}
      <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                1. Fotos de Referência da Peça (Até 10 fotos)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Anexe fotos de frente, costas, detalhes do tecido e caimento. Todas as fotos devem ser do mesmo produto e na mesma cor.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                form.referencePhotos.length > 0
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
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
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-900/60 bg-zinc-900/30'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-200">
                Arraste as fotos da peça aqui ou clique para selecionar
              </p>
              <p className="text-[11px] text-zinc-500">
                Suporta PNG, JPG, WEBP. Você pode anexar até 10 fotos da mesma peça para máxima fidelidade.
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
                className="relative group rounded-xl overflow-hidden border border-sky-500/30 bg-zinc-900 aspect-[9/16] max-h-48 flex items-center justify-center"
              >
                <img
                  src={photo}
                  alt={`Referência ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-between items-center">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900/90 text-sky-300 text-[10px] font-bold">
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
                    <span className="px-1.5 py-0.5 rounded bg-sky-600/90 text-white text-[9px] font-black uppercase text-center">
                      Foto Principal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {form.referencePhotos.length === 0 && (
          <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Por favor, anexe ao menos 1 foto da peça para prosseguir com a geração.</span>
          </div>
        )}
      </div>

      {/* ─── CARD 2: NOME DA PEÇA / PRODUTO ─── */}
      <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
          <Layers className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            2. Nome da Peça / Produto (Opcional)
          </h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          O nome da peça é usado pelo aplicativo para selecionar a melhor headline e as hashtags correspondentes.
        </p>
        <input
          type="text"
          value={form.productName}
          onChange={(e) => onChange((prev) => ({ ...prev, productName: e.target.value }))}
          placeholder="Ex: Macacão Fitness Feminino, Cinta Modeladora Abdominal, Vestido Longo com Decote..."
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </div>

      {/* ─── CARD 3: MODELO (INFLUENCER) & TIPO DE CORPO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Influenciador */}
        <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              3. Influenciador / Modelo
            </h3>
            <p className="text-[11px] text-zinc-400">Mulher é o padrão do modo</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, influencer: 'Mulher' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                form.influencer === 'Mulher'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.influencer === 'Mulher' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Mulher (Padrão)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, influencer: 'Homem' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                form.influencer === 'Homem'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.influencer === 'Homem' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Homem</span>
            </button>
          </div>
        </div>

        {/* Tipo de Corpo */}
        <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              4. Tipo de Corpo
            </h3>
            <p className="text-[11px] text-zinc-400">Normal é o padrão do modo</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, bodyType: 'normal' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                form.bodyType === 'normal'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.bodyType === 'normal' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Normal (Padrão)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, bodyType: 'plus_size' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                form.bodyType === 'plus_size'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.bodyType === 'plus_size' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Plus Size</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── CARD 5: INSTRUÇÕES ADICIONAIS (COM MICROFONE IGUAL PRODUTOS 2.0) ─── */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 shadow-xl space-y-3 transition-all ${
          isInstructionsFilled
            ? 'border-sky-500/60 bg-slate-950/90 shadow-sky-950/40'
            : 'border-sky-950/60 bg-zinc-950/80'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              5. Instruções Adicionais (Opcional — Prioridade Máxima)
            </h2>
            {isInstructionsFilled && (
              <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-sky-300" /> Preenchido ✓
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400">
            Digite ou dite pelo microfone. Qualquer preferência aqui sobrepõe detalhes padrão.
          </p>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={form.additionalInstructions}
            onChange={(e) => onChange((prev) => ({ ...prev, additionalInstructions: e.target.value }))}
            placeholder='Ex.: "Modelo morena clara com cabelos castanhos longos. Detalhe da estampa floral bem visível..." (ou clique no microfone para ditar)'
            className={`w-full p-3.5 pr-12 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none font-sans ${
              isInstructionsFilled
                ? 'bg-zinc-900/90 border border-sky-400/60'
                : 'bg-zinc-900/80 border border-zinc-700/80'
            }`}
          />
          <button
            type="button"
            onClick={toggleMic}
            className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
              isRecordingMic
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                : 'bg-zinc-800 text-sky-300 hover:bg-zinc-700 border border-zinc-700'
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
        {/* Seletor de Gerador de Imagem (1º SeaDream, 2º Kling, 3º OpenAI) */}
        <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                6. Gerador de Imagem
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400">Padrão: SeaDream 5.0 Pro</span>
          </div>

          <div className="space-y-2">
            {/* 1º: SeaDream 5.0 Pro */}
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'seedream_5_0_pro' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.imageModel === 'seedream_5_0_pro'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>SeaDream 5.0 Pro (Padrão)</span>
              {form.imageModel === 'seedream_5_0_pro' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>

            {/* 2º: Kling 3.0 */}
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'kling_3_0' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.imageModel === 'kling_3_0'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Kling 3.0</span>
              {form.imageModel === 'kling_3_0' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>

            {/* 3º: OpenAI */}
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'openai' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.imageModel === 'openai'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>OpenAI</span>
              {form.imageModel === 'openai' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>
          </div>
        </div>

        {/* Seletor de Prompt de Vídeo */}
        <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                7. Prompt de Vídeo
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400">Limite de Caracteres</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: 'unlimited' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.videoPromptLimit === 'unlimited'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Padrão (Sem Limite)</span>
              {form.videoPromptLimit === 'unlimited' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: '5000' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.videoPromptLimit === '5000'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Até 5.000 Caracteres</span>
              {form.videoPromptLimit === '5000' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: '2500' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.videoPromptLimit === '2500'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Até 2.500 Caracteres</span>
              {form.videoPromptLimit === '2500' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── CARD 8: TOQUE AQUI PARA ESCOLHER UM CENÁRIO (SUBMENU EXPANSÍVEL - ITEM 8) ─── */}
      <div
        className={`rounded-2xl transition-all duration-300 overflow-hidden shadow-2xl ${
          form.selectedScenarioNumber
            ? 'border-2 border-amber-400 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/30 shadow-amber-950/50'
            : 'border-2 border-orange-500/80 hover:border-orange-400 bg-gradient-to-br from-zinc-950 via-orange-950/20 to-zinc-950 shadow-orange-950/40 ring-1 ring-orange-500/30'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsGalleryExpanded((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-orange-500/10 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-orange-500/40 shrink-0 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wide group-hover:text-amber-200 transition-colors">
                  8. TOQUE AQUI PARA ESCOLHER UM CENÁRIO
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-zinc-950 uppercase tracking-wider shadow-sm">
                  OPCIONAL
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hidden sm:inline-block">
                  {SCENARIO_GALLERY_ITEMS.length} Cenários Vencedores
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-300 mt-1">
                Opcional: selecione um cenário para fixar. Se não escolher, o app sorteará um dos 23 cenários automaticamente ao gerar!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {form.selectedScenarioNumber ? (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black px-3 py-1.5 rounded-xl border border-amber-300 shadow-md shadow-orange-950/40">
                <span className="text-xs">
                  Cenário {form.selectedScenarioNumber} Selecionado ✓
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
              <div className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/60 text-orange-300 text-xs font-black flex items-center gap-1.5 group-hover:bg-orange-500 group-hover:text-zinc-950 transition-all shadow-sm">
                <span>Abrir Galeria</span>
              </div>
            )}
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-300 group-hover:bg-orange-500 group-hover:text-zinc-950 transition-all">
              {isGalleryExpanded ? <ChevronUp className="w-4 h-4 stroke-[3]" /> : <ChevronDown className="w-4 h-4 stroke-[3]" />}
            </div>
          </div>
        </button>

        {isGalleryExpanded && (
          <div className="p-5 pt-0 border-t border-orange-500/30 space-y-4 animate-fade-in bg-zinc-950/60">
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
              <p className="text-xs text-amber-200/90 font-medium">
                Toque em qualquer miniatura para escolher o cenário. Se não escolher, um cenário será sorteado de forma randômica.
              </p>
              {form.selectedScenarioNumber && (
                <button
                  type="button"
                  onClick={handleClearScenario}
                  className="text-xs text-amber-300 hover:text-amber-200 font-black underline cursor-pointer"
                >
                  Remover seleção (voltar ao sorteio randômico)
                </button>
              )}
            </div>

            {/* Grade Responsiva de Cenários: 2 colunas no celular, 4 no sm, 5 no md, 6 no lg */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {SCENARIO_GALLERY_ITEMS.map((item) => {
                const isSelected = form.selectedScenarioId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleScenario(item)}
                    className={`group relative rounded-xl overflow-hidden aspect-[9/16] transition-all cursor-pointer text-left bg-zinc-900 flex flex-col justify-between ${
                      isSelected
                        ? 'ring-3 ring-amber-400 border-2 border-amber-300 shadow-xl shadow-orange-500/40 scale-[1.02]'
                        : 'border border-zinc-800 hover:border-orange-500/60 opacity-85 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Imagem do Cenário (Thumbnail leve) */}
                    <img
                      src={item.thumbUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Bolinha Branca com o Número no Canto Superior Esquerdo */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white text-zinc-950 font-black text-xs flex items-center justify-center shadow-md select-none border border-zinc-300">
                      {item.number}
                    </div>

                    {/* Selo de Selecionado no Canto Superior Direito */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-zinc-950 font-black flex items-center justify-center shadow-md animate-fade-in">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Overlay inferior com o nome */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6">
                      <span className={`text-[11px] font-bold block truncate ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
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

      {/* ─── BARRA DE PROGRESSO COM GIF IGUAL AO MODO PRODUTOS 2.0 ─── */}
      {isProcessing && (
        <ProgressBar
          currentStep="generating_images"
          progressPercent={progressPercent}
          statusMessage={statusMessage || 'Gerando vídeo no Modo Ana Maria...'}
        />
      )}

      {/* ─── BOTÃO DE AÇÃO: GERAR VÍDEO (VERDE VIBRANTE PADRÃO PRODUTOS 2.0) ─── */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl ${
            canSubmit
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 text-white shadow-emerald-950/50 hover:scale-[1.01]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>{isProcessing ? 'Gerando Vídeo no Modo Ana Maria...' : 'Gerar Vídeo'}</span>
        </button>
      </div>
    </div>
  );
};
