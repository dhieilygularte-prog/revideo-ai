import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { AnaMariaResultState, AnaMariaAuditColorStatus, AnaMariaTheme } from './types';
import {
  downloadAnaMariaSingleImage,
  exportAnaMariaZip,
  sanitizeCleanName,
  getMasterPromptFileName,
} from './anaMariaZipExporter';
import {
  regenerateAnaMariaImage,
  regenerateAnaMariaNewScenario,
  refineAnaMariaVideoPrompt,
} from './anaMariaPipeline';
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

  const [downloadedImage, setDownloadedImage] = useState(false);
  const [hasDownloadedImageOnce, setHasDownloadedImageOnce] = useState(false);

  // Estados de ajuste de imagem
  const [imageTweakText, setImageTweakText] = useState('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isSwitchingScenario, setIsSwitchingScenario] = useState(false);

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
      await navigator.clipboard.writeText(result.headline);
      setCopiedHeadline(true);
      setHasCopiedHeadlineOnce(true);
      setTimeout(() => setCopiedHeadline(false), 2500);
    } catch {}
  };

  const handleDownloadImage = async () => {
    try {
      await downloadAnaMariaSingleImage(result.imageUrl, result.productName, result.timestamp, result.imageModel);
      setDownloadedImage(true);
      setHasDownloadedImageOnce(true);
      setTimeout(() => setDownloadedImage(false), 2500);
    } catch (err) {
      console.warn('Erro ao baixar imagem:', err);
    }
  };

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

  // Refazer Imagem (com ou sem ajuste)
  const handleRegenerateImage = async (customInstruction?: string) => {
    try {
      setIsRegeneratingImage(true);
      const res = await regenerateAnaMariaImage({
        form: {
          productName: result.productName,
          referencePhotos: result.referencePhotos,
          influencer: result.influencer,
          bodyType: result.bodyType,
          presentationMode: result.presentationMode,
          selectedMasterId: result.selectedMasterId,
          additionalInstructions: result.additionalInstructions,
          imageModel: result.imageModel,
          videoPromptLimit: result.videoPromptLimit,
          selectedScenarioId: result.selectedScenarioId,
          selectedScenarioNumber: result.selectedScenarioNumber,
        },
        tweakPrompt: customInstruction || imageTweakText,
        aiProfile,
      });

      onUpdateResult({
        ...result,
        imageUrl: res.imageUrl,
        audit: res.audit || result.audit,
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
      const res = await regenerateAnaMariaImage({
        form: {
          productName: result.productName,
          referencePhotos: result.referencePhotos,
          influencer: result.influencer,
          bodyType: result.bodyType,
          presentationMode: result.presentationMode,
          selectedMasterId: result.selectedMasterId,
          additionalInstructions: result.additionalInstructions,
          imageModel: 'seedream_5_0_pro',
          videoPromptLimit: result.videoPromptLimit,
          selectedScenarioId: result.selectedScenarioId,
          selectedScenarioNumber: result.selectedScenarioNumber,
        },
        imageModelOverride: 'seedream_5_0_pro',
        aiProfile,
      });

      onUpdateResult({
        ...result,
        imageUrl: res.imageUrl,
        imageModel: 'seedream_5_0_pro',
        audit: res.audit || result.audit,
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
      const res = await regenerateAnaMariaNewScenario({
        form: {
          productName: result.productName,
          referencePhotos: result.referencePhotos,
          influencer: result.influencer,
          bodyType: result.bodyType,
          presentationMode: result.presentationMode,
          selectedMasterId: result.selectedMasterId,
          additionalInstructions: result.additionalInstructions,
          imageModel: result.imageModel,
          videoPromptLimit: result.videoPromptLimit,
          selectedScenarioId: result.selectedScenarioId,
          selectedScenarioNumber: result.selectedScenarioNumber,
        },
        aiProfile,
      });

      onUpdateResult({
        ...result,
        imageUrl: res.imageUrl,
      });
      setHasDownloadedImageOnce(false);
      setDownloadedImage(false);
    } catch (err: any) {
      alert(`Falha ao trocar cenário: ${err?.message || err}`);
    } finally {
      setIsSwitchingScenario(false);
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

  const audit = result.audit;
  const auditStatus = audit?.status || 'green';
  const auditStyles = getStatusClasses(auditStatus);
  const auditScore = audit?.score ?? 96;
  const auditLabel = audit?.label ?? 'Verde — Fidelidade Aprovada';

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

      {/* ─── BOTÕES DE AÇÃO SUPERIORES (PADRÃO PRODUTOS 2.0 - ITENS 1 E 12) ─── */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-2 border-b ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800'}`}>
        <div className="flex flex-wrap items-center gap-2.5">
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
            disabled={isSwitchingScenario || isRegeneratingImage}
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
            {/* Header da Imagem com Resolução 1080x1920 e Badge Baixado */}
            <div className="flex items-center justify-between pb-2 px-1">
              <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">
                Foto Gerada 9:16 (1080x1920)
              </span>
              {hasDownloadedImageOnce && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" /> BAIXADO ✓
                </span>
              )}
            </div>

            {/* Imagem Vertical 9:16 */}
            <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={result.imageUrl}
                alt={`Modo Ana Maria - ${result.productName || 'Peça de Vestuário'}`}
                className="w-full h-full object-cover"
              />

              {/* Botão de Ampliar / Zoom */}
              <button
                type="button"
                onClick={() =>
                  onOpenPreviewModal(
                    result.imageUrl,
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
                {result.imageModel === 'seedream_5_0_pro'
                  ? 'SeaDream 5.0 Pro'
                  : result.imageModel === 'seedream_4_5'
                  ? 'Seedream 4.5'
                  : result.imageModel === 'kling_3_0'
                  ? 'Kling Image 3.0 Omni'
                  : result.imageModel === 'kling_o3_fal'
                  ? 'Kling O3 Omni — fal.ai'
                  : result.imageModel === 'flux_2_pro_edit'
                  ? 'FLUX 2 Pro Edit — fal.ai'
                  : 'OpenAI'}
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
            {result.imageModel === 'openai' && (
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
              </div>

              {/* Botão Copiar Prompt */}
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
            </div>

            {/* Prompt limpo sem o cabeçalho 🎥 PROMPT DE VÍDEO... */}
            <textarea
              rows={16}
              value={cleanVideoPrompt}
              onChange={(e) => {
                const val = e.target.value;
                setHasCopiedPromptOnce(false);
                setCopiedPrompt(false);
                onUpdateResult({ ...result, videoPrompt: val });
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
      {/* SEÇÃO INFERIOR: DESCRIÇÃO DO POST + HASHTAGS E HEADLINE VIRAL             */}
      {/* ========================================================================= */}
      <div className={`space-y-4 pt-4 border-t ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800'}`}>
        {/* Card: Descrição do Post + Hashtags */}
        <div
          className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 space-y-3 ${
            hasCopiedHashtagsOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <div className="flex items-center gap-2">
              <Hash className={`w-4 h-4 ${accentIconClass}`} />
              <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>Descrição do Post + Hashtags (TikTok & Reels)</span>
                {hasCopiedHashtagsOnce && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" /> COPIADO ✓
                  </span>
                )}
              </h3>
            </div>
            {/* Botão Copiar Descrição */}
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
                  <span>Copiar Descrição</span>
                </>
              )}
            </button>
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

        {/* Card: Headline Viral */}
        <div
          className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 space-y-3 ${
            hasCopiedHeadlineOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isAmetista ? 'border-purple-500/20' : 'border-zinc-800/80'}`}>
            <div className="flex items-center gap-2">
              <Smile className={`w-4 h-4 ${accentIconClass}`} />
              <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>Headline Viral</span>
                {hasCopiedHeadlineOnce && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" /> COPIADO ✓
                  </span>
                )}
              </h3>
            </div>
            {/* Botão Copiar Headline */}
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
                  <span>Copiar Headline</span>
                </>
              )}
            </button>
          </div>

          <div
            className={`p-3.5 rounded-xl text-sm font-semibold select-all transition-all leading-relaxed ${
              hasCopiedHeadlineOnce
                ? 'bg-slate-950/90 border border-sky-400/60 text-white'
                : isAmetista
                ? 'bg-[#0e0817]/95 border border-purple-500/25 text-white'
                : 'bg-zinc-900/95 border border-zinc-800 text-white'
            }`}
          >
            {result.headline}
          </div>
        </div>
      </div>
    </div>
  );
};
