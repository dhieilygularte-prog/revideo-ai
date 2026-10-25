import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Eye,
  Edit3,
  Mic,
  Square,
  Wand2,
  RotateCcw,
} from 'lucide-react';
import { VideoFidelityAudit } from './types';
import { downloadProdutos2StoryboardImage } from './produtos2ZipExporter';
import { VideoFidelityAuditor } from './VideoFidelityAuditor';
import { AIProfile } from '../config/aiProfiles';

interface AchadinhosBlockSectionProps {
  blockNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  downloadFileName: string;
  storyboardImageUrl?: string;
  isRegeneratingStoryboard?: boolean;
  veoPrompt: string;
  speechText: string;
  productName: string;
  productLock?: string[];
  referencePhotos: string[];
  videoAudit?: VideoFidelityAudit;
  aiProfile?: AIProfile;
  onUpdateVeoPrompt: (val: string) => void;
  onUpdateSpeech: (val: string) => void;
  onRegenerateImage: (instruction?: string) => void;
  onAuditChange: (vAudit: VideoFidelityAudit) => void;
  onAuditComplete?: (vAudit: VideoFidelityAudit, usage: any) => void;
  onOpenPreview: (url: string, title: string) => void;
}

export const AchadinhosBlockSection: React.FC<AchadinhosBlockSectionProps> = ({
  blockNumber,
  title,
  subtitle,
  downloadFileName,
  storyboardImageUrl,
  isRegeneratingStoryboard,
  veoPrompt,
  speechText,
  productName,
  productLock,
  referencePhotos,
  videoAudit,
  aiProfile: _aiProfile,
  onUpdateVeoPrompt,
  onUpdateSpeech,
  onRegenerateImage,
  onAuditChange,
  onAuditComplete,
  onOpenPreview,
}) => {
  // 1. Estado da fala
  const [speechInput, setSpeechInput] = useState(speechText || '');
  const [isReviewingSpeech, setIsReviewingSpeech] = useState(false);
  const [speechAppliedSuccess, setSpeechAppliedSuccess] = useState(false);
  const [isSpeechMicRecording, setIsSpeechMicRecording] = useState(false);
  const speechRecStopper = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (speechText) {
      setSpeechInput(speechText);
    }
  }, [speechText]);

  // 2. Estado de alteração da imagem por instrução/voz
  const [imageCorrection, setImageCorrection] = useState('');
  const [isImageMicRecording, setIsImageMicRecording] = useState(false);
  const imageRecStopper = useRef<(() => void) | null>(null);

  // 3. Estado de refinamento do prompt com IA
  const [promptCorrection, setPromptCorrection] = useState('');
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);
  const [promptRefinedSuccess, setPromptRefinedSuccess] = useState(false);
  const [isPromptMicRecording, setIsPromptMicRecording] = useState(false);
  const promptRecStopper = useRef<(() => void) | null>(null);

  // 4. Estado de cópia do prompt e download do storyboard
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [hasCopiedPromptOnce, setHasCopiedPromptOnce] = useState(false);
  const [hasDownloadedStoryboard, setHasDownloadedStoryboard] = useState(false);

  useEffect(() => {
    setHasDownloadedStoryboard(false);
  }, [storyboardImageUrl]);

  const copiedBlueSectionClass =
    'bg-gradient-to-br from-sky-900/85 via-blue-900/80 to-slate-900/95 border-2 border-sky-400 shadow-xl shadow-sky-950/60 ring-2 ring-sky-400/40';

  // Helper de gravação de voz contínua
  const startRecording = (
    initialValue: string,
    onResult: (text: string) => void,
    setIsRecording: (rec: boolean) => void
  ): (() => void) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz direto. Use o Chrome ou Edge.');
      return () => {};
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    let baseText = initialValue.trim();
    if (baseText) baseText += ' ';
    let sessionAccumulated = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          sessionAccumulated += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const full = (baseText + sessionAccumulated + interim).replace(/\s+/g, ' ').trim();
      onResult(full);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.warn('Erro de reconhecimento de voz:', e.error);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Não foi possível iniciar reconhecimento:', err);
      setIsRecording(false);
    }

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
      setIsRecording(false);
    };
  };

  const handleToggleSpeechMic = () => {
    if (isSpeechMicRecording) {
      speechRecStopper.current?.();
      speechRecStopper.current = null;
    } else {
      speechRecStopper.current = startRecording(
        speechInput,
        (val) => setSpeechInput(val),
        setIsSpeechMicRecording
      );
    }
  };

  const handleToggleImageMic = () => {
    if (isImageMicRecording) {
      imageRecStopper.current?.();
      imageRecStopper.current = null;
    } else {
      imageRecStopper.current = startRecording(
        imageCorrection,
        (val) => setImageCorrection(val),
        setIsImageMicRecording
      );
    }
  };

  const handleTogglePromptMic = () => {
    if (isPromptMicRecording) {
      promptRecStopper.current?.();
      promptRecStopper.current = null;
    } else {
      promptRecStopper.current = startRecording(
        promptCorrection,
        (val) => setPromptCorrection(val),
        setIsPromptMicRecording
      );
    }
  };

  // Botão "Revisar texto" com IA (máx 225 caracteres para a cena individual)
  const handleReviewSpeech = async () => {
    if (!speechInput.trim() || isReviewingSpeech) return;
    setIsReviewingSpeech(true);
    try {
      const res = await fetch('/api/produtos2-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'normalize_speech_for_ai',
          text: speechInput.trim(),
          sceneMode: 'modo_achadinhos',
          isSingleScenePart: true,
          maxChars: 225,
          minChars: 150,
          productName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.normalizedText) {
          setSpeechInput(data.normalizedText);
          onUpdateSpeech(data.normalizedText);
          setSpeechAppliedSuccess(true);
          setTimeout(() => setSpeechAppliedSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.warn('Erro ao revisar fala da cena de Achadinhos:', err);
    } finally {
      setIsReviewingSpeech(false);
    }
  };

  const handleApplySpeech = () => {
    onUpdateSpeech(speechInput);
    setSpeechAppliedSuccess(true);
    setTimeout(() => setSpeechAppliedSuccess(false), 3000);
  };

  // Botão "Refazer prompt com IA"
  const handleRefinePrompt = async () => {
    if (!promptCorrection.trim() || isRefiningPrompt) return;
    setIsRefiningPrompt(true);
    try {
      const res = await fetch('/api/produtos2-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine_prompt_with_instructions',
          prompt: veoPrompt,
          instructions: promptCorrection.trim(),
          sceneNumber: blockNumber,
          productName,
          speech: speechInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.refinedPrompt) {
          onUpdateVeoPrompt(data.refinedPrompt);
          setPromptRefinedSuccess(true);
          setPromptCorrection('');
          setTimeout(() => setPromptRefinedSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.warn('Erro ao refinar prompt do bloco de Achadinhos:', err);
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(veoPrompt);
    setCopiedPrompt(true);
    setHasCopiedPromptOnce(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const charCount = speechInput.length;
  const isOverLimit = charCount > 225;

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-zinc-950/85 border border-emerald-900/60 shadow-2xl space-y-6">
      {/* CABEÇALHO DO BLOCO */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-emerald-950/50">
            {blockNumber}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-emerald-300">
              {title}
            </h3>
            <p className="text-[11px] text-zinc-400">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {storyboardImageUrl && (
            <>
              <button
                type="button"
                onClick={() => onOpenPreview(storyboardImageUrl, `${title} - Storyboard 16:9`)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center gap-1.5 border border-zinc-700/60 transition-all cursor-pointer"
                title="Visualizar em tamanho grande"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Visualizar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (storyboardImageUrl) {
                    setHasDownloadedStoryboard(true);
                    downloadProdutos2StoryboardImage(storyboardImageUrl, productName, downloadFileName);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                title="Baixar imagem individual em alta resolução"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{hasDownloadedStoryboard ? 'Baixado ✓' : 'Baixar Storyboard'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ÁREA VISUAL DO STORYBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* IMAGEM DO STORYBOARD (16:9 PAISAGEM) */}
        <div
          className={`lg:col-span-6 space-y-3 p-3 rounded-2xl transition-all duration-300 ${
            hasDownloadedStoryboard
              ? copiedBlueSectionClass
              : 'bg-zinc-900/40 border border-emerald-950/60'
          }`}
        >
          {hasDownloadedStoryboard && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black text-sky-200 uppercase tracking-wider">
                Storyboard — Cena {blockNumber}
              </span>
              <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-sky-300" />
                <span>BAIXADO ✓</span>
              </span>
            </div>
          )}
          <div
            className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black/80 border-2 flex items-center justify-center group shadow-xl ${
              hasDownloadedStoryboard ? 'border-sky-400/80' : 'border-emerald-900/50'
            }`}
          >
            {storyboardImageUrl ? (
              <>
                <img
                  src={storyboardImageUrl}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] cursor-pointer"
                  onClick={() => onOpenPreview(storyboardImageUrl, `${title} - Storyboard 16:9`)}
                />
                {/* Botão Visualizar em tela cheia no canto superior direito */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPreview(storyboardImageUrl, `${title} - Storyboard 16:9`);
                  }}
                  className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-black/75 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg z-10"
                  title="Visualizar em tamanho grande"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {/* Número da cena + Botão de download individual no canto inferior direito sobre a imagem */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHasDownloadedStoryboard(true);
                    downloadProdutos2StoryboardImage(storyboardImageUrl, productName, downloadFileName);
                  }}
                  className={`absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-xl font-black text-xs border shadow-lg transition-all cursor-pointer flex items-center gap-1.5 z-10 ${
                    hasDownloadedStoryboard
                      ? 'bg-sky-500 hover:bg-sky-400 text-white border-sky-300 ring-2 ring-sky-300/60'
                      : 'bg-black/85 hover:bg-emerald-600 text-white border-white/30'
                  }`}
                  title={`Clique para baixar apenas o Storyboard da Cena ${blockNumber} (${downloadFileName}.png)`}
                >
                  <span className="w-5 h-5 rounded-full bg-white text-slate-950 font-black text-[11px] flex items-center justify-center shadow">
                    {blockNumber}
                  </span>
                  <Download className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2">
                <FileText className="w-10 h-10 stroke-1 text-emerald-800 animate-pulse" />
                <span className="text-xs">Gerando Storyboard em 16:9...</span>
              </div>
            )}
            {isRegeneratingStoryboard && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2 z-10">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-xs font-bold text-emerald-200">Atualizando imagem...</span>
              </div>
            )}
          </div>

          {/* DITAR ALTERAÇÕES NA IMAGEM */}
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-emerald-950/80 space-y-2">
            <label className="text-[11px] font-bold text-emerald-300 flex items-center justify-between">
              <span>Ditar ou escrever alterações na imagem:</span>
              <span className="text-[10px] text-zinc-400 font-normal">Ex: "Aproxime mais o produto no Quadro B"</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={imageCorrection}
                onChange={(e) => setImageCorrection(e.target.value)}
                placeholder="Ex: Mude o gesto da mão no Quadro C..."
                className="w-full pl-3 pr-20 py-2 bg-black/60 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:border-emerald-400"
              />
              <div className="absolute right-1 top-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleImageMic}
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    isImageMicRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                  title={isImageMicRecording ? 'Parar gravação' : 'Gravar instrução por voz'}
                >
                  {isImageMicRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (imageCorrection.trim()) {
                      onRegenerateImage(imageCorrection.trim());
                      setImageCorrection('');
                    }
                  }}
                  disabled={!imageCorrection.trim() || isRegeneratingStoryboard}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  title="Aplicar instrução e gerar novamente"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Refazer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PROMPT DO OMNIFLASH / VEO 3 & EDIÇÃO DA FALA */}
        <div className="lg:col-span-6 space-y-4">
          {/* CAMPO DE EDIÇÃO INDIVIDUAL DA FALA (<= 225 CARACTERES) */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-emerald-950/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-black text-white">
                  Fala da Cena {blockNumber} (10s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    isOverLimit
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-zinc-950 text-emerald-300 border border-emerald-800/40'
                  }`}
                >
                  {charCount} / 225
                </span>
                <button
                  type="button"
                  onClick={handleReviewSpeech}
                  disabled={isReviewingSpeech || !speechInput.trim()}
                  className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow"
                  title="Revisar com IA (otimiza para narração por IA e limita a 225 caracteres)"
                >
                  {isReviewingSpeech ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  <span>Revisar texto</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={speechInput}
                onChange={(e) => setSpeechInput(e.target.value)}
                rows={3}
                className={`w-full p-2.5 bg-black/60 border rounded-xl text-xs text-zinc-100 font-sans leading-relaxed resize-y ${
                  isOverLimit ? 'border-rose-500 focus:border-rose-400' : 'border-zinc-800 focus:border-emerald-400'
                }`}
                placeholder={`Fala da Cena ${blockNumber} (máximo 225 caracteres)...`}
              />
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  onClick={handleToggleSpeechMic}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    isSpeechMicRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {isSpeechMicRecording ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}
                  <span>{isSpeechMicRecording ? 'Gravando...' : 'Ditar fala'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplySpeech}
                  disabled={!speechInput.trim()}
                  className={`px-3 py-1 rounded-md text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                    speechAppliedSuccess
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {speechAppliedSuccess ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                  <span>{speechAppliedSuccess ? 'Salvo!' : 'Salvar Fala'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* PROMPT DO OMNIFLASH / VEO 3 */}
          <div
            className={`p-3.5 rounded-2xl transition-all duration-300 space-y-2 ${
              hasCopiedPromptOnce
                ? copiedBlueSectionClass
                : 'bg-zinc-900/90 border border-emerald-950/80'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-black text-white">
                  Prompt do Vídeo — Cena {blockNumber} (OmniFlash / Veo 3)
                </span>
                {hasCopiedPromptOnce && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" />
                    <span>COPIADO ✓</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`px-3 py-1 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  copiedPrompt
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                    : hasCopiedPromptOnce
                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                }`}
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Copiado!' : 'Copiar Prompt'}</span>
              </button>
            </div>

            <textarea
              value={veoPrompt}
              onChange={(e) => {
                setHasCopiedPromptOnce(false);
                setCopiedPrompt(false);
                onUpdateVeoPrompt(e.target.value);
              }}
              rows={4}
              className={`w-full p-2.5 rounded-xl text-[11px] font-mono leading-relaxed resize-y ${
                hasCopiedPromptOnce
                  ? 'bg-slate-950/90 border border-sky-400/60 text-sky-50 focus:border-sky-300'
                  : 'bg-black/60 border border-zinc-800 focus:border-emerald-400 text-zinc-300'
              }`}
            />

            {/* REFINAR PROMPT COM IA */}
            <div className="pt-1 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 block">
                Refazer prompt com IA (instruções adicionais):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={promptCorrection}
                  onChange={(e) => setPromptCorrection(e.target.value)}
                  placeholder="Ex: Adicione movimento de aproximação mais lento..."
                  className="w-full pl-3 pr-24 py-1.5 bg-black/60 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:border-emerald-400"
                />
                <div className="absolute right-1 top-1 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleTogglePromptMic}
                    className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      isPromptMicRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {isPromptMicRecording ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleRefinePrompt}
                    disabled={!promptCorrection.trim() || isRefiningPrompt}
                    className="px-2 py-1 rounded-md bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isRefiningPrompt ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    <span>Refazer</span>
                  </button>
                </div>
              </div>
              {promptRefinedSuccess && (
                <p className="text-[10px] text-emerald-400 font-bold">
                  ✓ Prompt atualizado com sucesso pela IA!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AUDITORIA DE VÍDEO ÚNICA NO FINAL (Exibida ao final da 3ª Cena do Modo Achadinhos) */}
      {blockNumber === 3 && (
        <div className="pt-2 border-t border-emerald-950/80">
          <VideoFidelityAuditor
            productName={productName}
            productLock={productLock}
            referencePhotos={referencePhotos}
            onAuditChange={onAuditChange}
            onAuditComplete={(vAudit, usage) => {
              onAuditChange(vAudit);
              onAuditComplete?.(vAudit, usage);
            }}
            initialAudit={videoAudit}
            onOpenPreview={onOpenPreview}
          />
        </div>
      )}
    </div>
  );
};
