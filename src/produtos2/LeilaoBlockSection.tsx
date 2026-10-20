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
  Sparkles,
  Mic,
  Square,
  Wand2,
  RotateCcw,
} from 'lucide-react';
import { VideoFidelityAudit } from './types';
import { downloadProdutos2StoryboardImage } from './produtos2ZipExporter';
import { VideoFidelityAuditor } from './VideoFidelityAuditor';
import { AIProfile } from '../config/aiProfiles';

interface LeilaoBlockSectionProps {
  blockNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  downloadFileName: string;
  images?: string[];
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
  onRegenerateImage: (instruction?: string, imageIndex?: number) => void;
  onAuditChange: (vAudit: VideoFidelityAudit) => void;
  onAuditComplete?: (vAudit: VideoFidelityAudit, usage: any) => void;
  onOpenPreview: (url: string, title: string) => void;
  onUpdateImage?: (newUrl: string) => void;
}

export const LeilaoBlockSection: React.FC<LeilaoBlockSectionProps> = ({
  blockNumber,
  title,
  subtitle,
  downloadFileName,
  images,
  storyboardImageUrl,
  isRegeneratingStoryboard,
  veoPrompt,
  speechText,
  productName,
  productLock,
  referencePhotos,
  videoAudit,
  aiProfile,
  onUpdateVeoPrompt,
  onUpdateSpeech,
  onRegenerateImage,
  onAuditChange,
  onAuditComplete,
  onOpenPreview,
  onUpdateImage: _onUpdateImage,
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

  // 4. Estado de cópia do prompt
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [hasCopiedPromptOnce, setHasCopiedPromptOnce] = useState(false);

  // Helper de gravação de voz contínua
  const startRecording = (
    initialValue: string,
    onResult: (text: string) => void,
    setIsRecording: (rec: boolean) => void
  ): (() => void) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado neste navegador. Utilize o Google Chrome ou Edge.');
      setIsRecording(false);
      return () => {};
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      const baseText = initialValue ? initialValue.trim() + ' ' : '';

      recognition.onresult = (evt: any) => {
        let interim = '';
        for (let i = 0; i < evt.results.length; i++) {
          interim += evt.results[i][0].transcript + ' ';
        }
        onResult((baseText + interim).trim());
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);

      return () => {
        try {
          recognition.stop();
        } catch {}
        setIsRecording(false);
      };
    } catch (err) {
      console.warn('Erro ao iniciar reconhecimento de voz:', err);
      setIsRecording(false);
      return () => {};
    }
  };

  // Alternadores de microfone
  const toggleSpeechMic = () => {
    if (isSpeechMicRecording) {
      speechRecStopper.current?.();
      speechRecStopper.current = null;
    } else {
      speechRecStopper.current = startRecording(
        speechInput,
        (text) => setSpeechInput(text),
        setIsSpeechMicRecording
      );
    }
  };

  const toggleImageMic = () => {
    if (isImageMicRecording) {
      imageRecStopper.current?.();
      imageRecStopper.current = null;
    } else {
      imageRecStopper.current = startRecording(
        imageCorrection,
        (text) => setImageCorrection(text),
        setIsImageMicRecording
      );
    }
  };

  const togglePromptMic = () => {
    if (isPromptMicRecording) {
      promptRecStopper.current?.();
      promptRecStopper.current = null;
    } else {
      promptRecStopper.current = startRecording(
        promptCorrection,
        (text) => setPromptCorrection(text),
        setIsPromptMicRecording
      );
    }
  };

  // Revisar fala com IA
  const handleReviewSpeech = async () => {
    const trimmed = speechInput.trim();
    if (!trimmed || isReviewingSpeech) return;
    setIsReviewingSpeech(true);
    try {
      const res = await fetch('/api/produtos2-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'normalize_speech_for_ai',
          text: trimmed,
          sceneMode: '1_cena_10s',
          targetMinChars: 150,
          targetMaxChars: 250,
          aiProfile,
        }),
      });
      const data = await res.json();
      if (data.success && data.reviewedSpeech) {
        setSpeechInput(data.reviewedSpeech);
        onUpdateSpeech(data.reviewedSpeech);
      } else {
        alert(`Erro ao revisar fala: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar com o serviço de revisão: ${err?.message || err}`);
    } finally {
      setIsReviewingSpeech(false);
    }
  };

  // Aplicar nova fala no prompt do Veo 3
  const handleApplySpeechToPrompt = () => {
    const cleanSpeech = speechInput.trim();
    if (!cleanSpeech) return;
    onUpdateSpeech(cleanSpeech);

    let updatedPrompt = veoPrompt;
    const falaRegex = /(Fala\s*\([^)]*\)\s*:\s*")[^"]*(")/gi;
    if (falaRegex.test(updatedPrompt)) {
      updatedPrompt = updatedPrompt.replace(falaRegex, `$1${cleanSpeech}$2`);
    } else {
      const simpleRegex = /(Fala\s*:\s*")[^"]*(")/gi;
      if (simpleRegex.test(updatedPrompt)) {
        updatedPrompt = updatedPrompt.replace(simpleRegex, `$1${cleanSpeech}$2`);
      } else {
        updatedPrompt = `${updatedPrompt}\n\nFala (português brasileiro): "${cleanSpeech}"`;
      }
    }
    onUpdateVeoPrompt(updatedPrompt);
    setSpeechAppliedSuccess(true);
    setTimeout(() => setSpeechAppliedSuccess(false), 3000);
  };

  // Refazer prompt com IA
  const handleRefinePromptWithAI = async () => {
    const correction = promptCorrection.trim();
    if (!correction || isRefiningPrompt) return;
    setIsRefiningPrompt(true);
    try {
      const res = await fetch('/api/refine-video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPrompt: veoPrompt,
          correctionInstruction: correction,
          aiProfile,
        }),
      });
      const data = await res.json();
      if (data.success && data.refinedPrompt) {
        onUpdateVeoPrompt(data.refinedPrompt);
        setPromptCorrection('');
        setPromptRefinedSuccess(true);
        setTimeout(() => setPromptRefinedSuccess(false), 3000);
      } else {
        alert(`Erro ao refazer prompt: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar com o serviço de refinamento: ${err?.message || err}`);
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  // Copiar prompt do Veo 3
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(veoPrompt || '');
    setCopiedPrompt(true);
    setHasCopiedPromptOnce(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const badgeColor =
    blockNumber === 1
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : blockNumber === 2
      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';

  const maxChars = 250;

  // Metadados das imagens verticais de cada bloco
  const blockMeta = React.useMemo(() => {
    if (blockNumber === 1) {
      return {
        labels: [
          'Imagem 1 — Salão de Leilão (Plano Aberto)',
          'Imagem 2 — Leiloeiro Chocado com Smartphone',
        ],
        files: ['leilao_cena1_imagem1', 'leilao_cena1_imagem2'],
        gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto',
      };
    }
    if (blockNumber === 2) {
      return {
        labels: [
          'Imagem 3 — Revelação no Púlpito ("Tcharam!")',
          'Imagem 4 — Close Benefício 1 (Fundo Preto)',
          'Imagem 5 — Close Benefício 2 (Fundo Preto)',
        ],
        files: ['leilao_cena2_imagem3', 'leilao_cena2_imagem4', 'leilao_cena2_imagem5'],
        gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-4xl mx-auto',
      };
    }
    return {
      labels: ['Imagem 6 — Leiloeiro Apontando (Carrinho Laranja)'],
      files: ['leilao_cena3_imagem6'],
      gridClass: 'max-w-xs mx-auto',
    };
  }, [blockNumber]);

  const activeImageList =
    images && images.length > 0
      ? images
      : storyboardImageUrl
      ? [storyboardImageUrl]
      : [];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/95 border border-amber-900/50 shadow-2xl space-y-5">
      {/* 1. CABEÇALHO DO BLOCO */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-7 h-7 rounded-lg border font-black text-sm flex items-center justify-center shrink-0 ${badgeColor}`}
          >
            {blockNumber}
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">{title}</h3>
            <p className="text-[11px] text-zinc-400">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            activeImageList.forEach((imgUrl, idx) => {
              const fileName = blockMeta.files[idx] || `${downloadFileName}_imagem${idx + 1}`;
              downloadProdutos2StoryboardImage(imgUrl, fileName);
            });
          }}
          disabled={activeImageList.length === 0}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-700 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar Imagens (Bloco {blockNumber})</span>
        </button>
      </div>

      {/* 2. IMAGENS VERTICAIS 9:16 DO STORYBOARD (1080x1920) */}
      {isRegeneratingStoryboard ? (
        <div className="h-72 flex flex-col items-center justify-center p-6 text-center gap-3 rounded-2xl bg-black/60 border border-zinc-800 shadow-inner">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs font-bold text-amber-200">
            Refazendo imagem do Bloco {blockNumber}...
          </p>
          <p className="text-[11px] text-zinc-400">
            Preservando continuidade física do leiloeiro e fidelidade absoluta do produto
          </p>
        </div>
      ) : activeImageList.length > 0 ? (
        <div className={blockMeta.gridClass}>
          {activeImageList.map((imgUrl, idx) => {
            const label = blockMeta.labels[idx] || `Imagem ${idx + 1}`;
            const fileName = blockMeta.files[idx] || `${downloadFileName}_${idx + 1}`;
            return (
              <div key={idx} className="space-y-1.5 flex flex-col items-center w-full">
                <div className="w-full flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-amber-300/90 truncate" title={label}>
                    {label}
                  </span>
                </div>
                <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black/60 border border-zinc-800 group shadow-lg">
                  <img
                    src={imgUrl}
                    alt={label}
                    onClick={() => onOpenPreview(imgUrl, label)}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {/* Botão Ampliar */}
                  <button
                    type="button"
                    onClick={() => onOpenPreview(imgUrl, label)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-black/75 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                    title="Visualizar em tela cheia"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {/* Botão Baixar individual */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadProdutos2StoryboardImage(imgUrl, fileName);
                    }}
                    className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/80 hover:bg-emerald-600 text-white border border-white/25 shadow-lg transition-all cursor-pointer flex items-center justify-center"
                    title={`Baixar ${fileName}.png`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-zinc-500 text-sm rounded-2xl bg-black/60 border border-zinc-800">
          Imagens do Bloco {blockNumber} não disponíveis
        </div>
      )}

      {/* 3. DITAR MUDANÇAS QUE SE DESEJA NA IMAGEM DO STORYBOARD */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-amber-900/40 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-amber-200/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Deseja mudar alguma imagem deste Storyboard? (Voz ou Texto)</span>
          </label>
          {imageCorrection && (
            <button
              type="button"
              onClick={() => setImageCorrection('')}
              className="text-[10px] text-zinc-400 hover:text-rose-400 font-bold transition-colors cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={imageCorrection}
            onChange={(e) => setImageCorrection(e.target.value)}
            placeholder='Dite ou digite o que deseja mudar na imagem (ex: "Altere a expressão do leiloeiro para mais eufórica" ou "Ajuste o enquadramento do produto")...'
            className="w-full p-2.5 pr-11 bg-zinc-950 border border-zinc-700/80 focus:border-amber-400 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed shadow-inner"
          />

          <button
            type="button"
            onClick={toggleImageMic}
            className={`absolute right-2 top-2.5 p-2 rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center ${
              isImageMicRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700'
            }`}
            title={isImageMicRecording ? 'Parar gravação' : 'Ditar mudança por voz'}
          >
            {isImageMicRecording ? (
              <Square className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-zinc-300" />
            )}
          </button>
        </div>

        {isImageMicRecording && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Gravando suas instruções por voz... clique no quadrado vermelho para parar.
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onRegenerateImage(imageCorrection.trim() || undefined)}
            disabled={Boolean(isRegeneratingStoryboard)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingStoryboard ? 'animate-spin' : ''}`} />
            <span>Refazer Imagem Bloco {blockNumber}</span>
          </button>
        </div>
      </div>

      {/* 4. EDITAR FALA ("TROCAR FALA — BLOCO X") SEM OS BOTÕES DE AURORA COPY / BANCO DE COPYS */}
      <div className="p-4 rounded-xl bg-zinc-950/80 border border-purple-500/40 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs sm:text-sm font-black text-white">
              Trocar fala — Bloco {blockNumber}
            </h4>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {speechAppliedSuccess && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-xs font-bold text-emerald-300 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Prompt do Veo 3 e fala atualizados com sucesso!
              </span>
            )}

            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                speechInput.length > maxChars
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {speechInput.length}/{maxChars} caracteres
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="relative">
            <textarea
              rows={3}
              value={speechInput}
              onChange={(e) => setSpeechInput(e.target.value)}
              placeholder="Digite aqui a nova fala do leiloeiro ou use o microfone..."
              className={`w-full p-3.5 pr-12 rounded-xl bg-zinc-900 border text-xs sm:text-sm placeholder-zinc-500 focus:outline-none leading-relaxed font-sans shadow-inner resize-y transition-colors ${
                speechInput.length > maxChars
                  ? 'text-rose-400 border-rose-500 focus:border-rose-400 font-semibold'
                  : 'text-zinc-100 border-zinc-700 focus:border-purple-400'
              }`}
            />

            {/* Botão Microfone */}
            <button
              type="button"
              onClick={toggleSpeechMic}
              className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                isSpeechMicRecording
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-600'
              }`}
              title={isSpeechMicRecording ? 'Parar gravação' : 'Ditar fala por voz'}
            >
              {isSpeechMicRecording ? (
                <Square className="w-4 h-4 fill-white" />
              ) : (
                <Mic className="w-4 h-4 text-zinc-300" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <span
              className={`text-[11px] font-mono ${
                speechInput.length > maxChars ? 'text-rose-400 font-bold' : 'text-zinc-400'
              }`}
            >
              {speechInput.length}/{maxChars} caracteres
            </span>
            {isSpeechMicRecording && (
              <span className="text-[11px] text-rose-400 flex items-center gap-1.5 font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Gravando sua fala... clique no quadrado vermelho para parar.
              </span>
            )}
          </div>
        </div>

        {/* Linha dos botões de ação (Revisar texto e Refazer Prompt) */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
          {/* Botão Revisar texto (Amarelo) */}
          <button
            type="button"
            onClick={handleReviewSpeech}
            disabled={isReviewingSpeech || !speechInput.trim()}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-950/20"
          >
            {isReviewingSpeech ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>Revisando texto...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>Revisar texto</span>
              </>
            )}
          </button>

          {/* Botão Refazer Prompt */}
          <button
            type="button"
            onClick={handleApplySpeechToPrompt}
            disabled={!speechInput.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Refazer Prompt</span>
          </button>
        </div>
      </div>

      {/* 5. PROMPT DO VEO 3 COM REFINAMENTO POR VOZ/TEXTO */}
      <div className="p-4 rounded-xl bg-black/60 border border-sky-500/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span className="text-xs sm:text-sm font-black text-white">
              Prompt do Veo 3 — Bloco {blockNumber}
            </span>
            {hasCopiedPromptOnce && (
              <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-sky-300" />
                <span>COPIADO</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyPrompt}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              copiedPrompt
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                : 'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-950/40'
            }`}
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Prompt {blockNumber}</span>
              </>
            )}
          </button>
        </div>

        {/* Textarea do Prompt do Veo 3 */}
        <textarea
          value={veoPrompt || ''}
          onChange={(e) => {
            setHasCopiedPromptOnce(false);
            setCopiedPrompt(false);
            onUpdateVeoPrompt(e.target.value);
          }}
          rows={6}
          className="w-full p-3 bg-zinc-950 border border-zinc-700/80 focus:border-sky-400 rounded-xl text-xs text-zinc-200 font-mono leading-relaxed resize-y"
        />

        {/* REFINAR PROMPT COM IA (VOZ OU TEXTO) */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Ajustar Prompt do Veo 3 com IA (Voz ou Texto)</span>
            </label>
            {promptRefinedSuccess && (
              <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Prompt refinado com sucesso!
              </span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={promptCorrection}
                onChange={(e) => setPromptCorrection(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRefinePromptWithAI();
                  }
                }}
                placeholder='Dite ou digite como ajustar o prompt (ex: "Aumente o movimento de câmera" ou "Dê mais ênfase no produto")...'
                className="w-full px-3 py-2 pr-10 bg-zinc-950 border border-zinc-700/80 focus:border-purple-400 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={togglePromptMic}
                className={`absolute right-1.5 top-1.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                  isPromptMicRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
                }`}
                title={isPromptMicRecording ? 'Parar gravação' : 'Ditar ajuste por voz'}
              >
                {isPromptMicRecording ? (
                  <Square className="w-3.5 h-3.5 fill-white" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-zinc-300" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefinePromptWithAI}
              disabled={isRefiningPrompt || !promptCorrection.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
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

          {isPromptMicRecording && (
            <p className="text-[11px] text-purple-300 italic opacity-90 pl-1">
              Gravando instrução de ajuste por voz... clique para parar.
            </p>
          )}
        </div>
      </div>

      {/* 6. AUDITORIA DE VÍDEO (VIDEO FIDELITY AUDITOR) */}
      <div className="pt-2">
        <VideoFidelityAuditor
          productName={`${productName} (Bloco ${blockNumber})`}
          productLock={productLock}
          referencePhotos={referencePhotos}
          initialAudit={videoAudit}
          onAuditChange={onAuditChange}
          onAuditComplete={onAuditComplete}
          onOpenPreview={onOpenPreview}
        />
      </div>
    </div>
  );
};
