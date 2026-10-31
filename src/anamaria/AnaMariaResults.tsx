import React, { useState, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  ShieldCheck,
  Wand2,
  History,
  ArrowLeft,
  RefreshCw,
  Video,
  Hash,
  Smile,
  Mic,
  Home,
  Cpu,
} from 'lucide-react';
import { AnaMariaResultState } from './types';
import {
  downloadAnaMariaSingleImage,
  exportAnaMariaZip,
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
}) => {
  // Estados de destaque azul ativo ao copiar/baixar (item 14)
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);
  const [downloadedImage, setDownloadedImage] = useState(false);

  // Estados de ajuste de imagem
  const [imageTweakText, setImageTweakText] = useState('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isSwitchingScenario, setIsSwitchingScenario] = useState(false);

  // Estados de microfone para alteração da imagem (item 8)
  const [isImageMicRecording, setIsImageMicRecording] = useState(false);
  const imageRecRef = useRef<any>(null);
  const imageStreamRef = useRef<MediaStream | null>(null);

  // Estados de ajuste de prompt de vídeo
  const [promptCorrectionText, setPromptCorrectionText] = useState('');
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);

  // Estados de microfone para correção de prompt (item 10)
  const [isPromptMicRecording, setIsPromptMicRecording] = useState(false);
  const promptRecRef = useRef<any>(null);
  const promptStreamRef = useRef<MediaStream | null>(null);

  // Estado de exportação do ZIP
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Limpa prompt de qualquer prefixo "🎥 PROMPT DE VÍDEO..." (item 24)
  const cleanVideoPrompt = result.videoPrompt
    .replace(/^🎥 PROMPT DE VÍDEO[^\n]*\n+/i, '')
    .trim();

  // Microfone para campo de alteração da imagem (item 8)
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

  // Microfone para campo de correção do prompt de vídeo (item 10)
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

  // Handlers de cópia e download com destaque em azul (item 14)
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(cleanVideoPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {}
  };

  const handleCopyHashtags = async () => {
    try {
      await navigator.clipboard.writeText(result.hashtags);
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 3000);
    } catch {}
  };

  const handleCopyHeadline = async () => {
    try {
      await navigator.clipboard.writeText(result.headline);
      setCopiedHeadline(true);
      setTimeout(() => setCopiedHeadline(false), 3000);
    } catch {}
  };

  const handleDownloadImage = async () => {
    try {
      await downloadAnaMariaSingleImage(result.imageUrl, result.productName);
      setDownloadedImage(true);
      setTimeout(() => setDownloadedImage(false), 3000);
    } catch (err) {
      console.warn('Erro ao baixar imagem:', err);
    }
  };

  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      await exportAnaMariaZip(result);
    } catch (err) {
      console.warn('Erro ao exportar ZIP:', err);
    } finally {
      setIsExportingZip(false);
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
          additionalInstructions: result.additionalInstructions,
          imageModel: result.imageModel,
          videoPromptLimit: result.videoPromptLimit,
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
          additionalInstructions: result.additionalInstructions,
          imageModel: 'seedream_5_0_pro',
          videoPromptLimit: result.videoPromptLimit,
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
          additionalInstructions: result.additionalInstructions,
          imageModel: result.imageModel,
          videoPromptLimit: result.videoPromptLimit,
        },
        aiProfile,
      });

      onUpdateResult({
        ...result,
        imageUrl: res.imageUrl,
      });
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
    } catch (err: any) {
      alert(`Falha ao refazer prompt: ${err?.message || err}`);
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const auditScore = result.audit?.score ?? 96;
  const auditLabel = result.audit?.label ?? 'Verde Fidedigno';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* ─── NAVEGAÇÃO SUPERIOR: VOLTAR PARA A PÁGINA ANTERIOR (ITEM 9) ─── */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={onBackToForm}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-emerald-500/50 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Voltar para a página anterior</span>
        </button>
      </div>

      {/* ─── BOTÕES DE AÇÃO SUPERIORES (PADRÃO PRODUTOS 2.0 - ITENS 9, 12 E 13) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* NOVO PRODUTO (Item 12) */}
          <button
            type="button"
            onClick={onCreateNew}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-300 hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-zinc-700"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>NOVO PRODUTO</span>
          </button>

          {/* Continuar no produto */}
          <button
            type="button"
            onClick={onContinueProduct}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Continuar no produto</span>
          </button>

          {/* Trocar Cenário (Item 13) */}
          <button
            type="button"
            disabled={isSwitchingScenario || isRegeneratingImage}
            onClick={handleSwitchScenario}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Gera novamente a mesma modelo e roupa em outro cômodo da casa com frente iluminada e fundo penumbroso"
          >
            <Home className={`w-4 h-4 text-emerald-400 ${isSwitchingScenario ? 'animate-spin' : ''}`} />
            <span>{isSwitchingScenario ? 'Trocando cenário...' : 'Trocar Cenário'}</span>
          </button>
        </div>

        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="px-3.5 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-medium rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>Histórico de Gerações</span>
          </button>
        )}
      </div>

      {/* ─── GRID PRINCIPAL: FOTO DA MODELO + PAINÉIS DE CRIAÇÃO ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: FOTO GERADA (VERTICAL 9:16) */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-zinc-950 p-3 shadow-2xl relative group">
            {/* Imagem Vertical 9:16 */}
            <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={result.imageUrl}
                alt="Modo Ana Maria - Modelo no Espelho"
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
                <Eye className="w-4 h-4 text-emerald-300" />
              </button>

              {/* Badge de Motor no Topo Esquerdo */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-bold text-emerald-300 uppercase">
                {result.imageModel === 'seedream_5_0_pro'
                  ? 'SeaDream 5.0 Pro'
                  : result.imageModel === 'kling_3_0'
                  ? 'Kling 3.0'
                  : 'OpenAI'}
              </div>

              {/* Botão de Download Rápido com destaque azul ativo (item 14) */}
              <button
                type="button"
                onClick={handleDownloadImage}
                className={`absolute bottom-3 right-3 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xl ${
                  downloadedImage
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/50'
                    : 'bg-zinc-950/85 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 backdrop-blur-md'
                }`}
                title="Baixar Imagem"
              >
                {downloadedImage ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Baixado!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Baixar Imagem</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Botão Grande de Baixar Imagem (Item 14: maior e com destaque azul ao clicar) */}
          <button
            type="button"
            onClick={handleDownloadImage}
            className={`w-full py-3 px-5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              downloadedImage
                ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-400'
            }`}
          >
            {downloadedImage ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Imagem Baixada com Sucesso!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Baixar Imagem ({result.productName ? `${result.productName} Aurora.png` : 'Aurora.png'})</span>
              </>
            )}
          </button>

          {/* Botão Rápido de Refazer Imagem */}
          <button
            type="button"
            disabled={isRegeneratingImage}
            onClick={() => handleRegenerateImage()}
            className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-emerald-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRegeneratingImage ? 'animate-spin' : ''}`} />
            <span>{isRegeneratingImage ? 'Refazendo Imagem...' : 'Refazer Imagem (Maior Fidelidade)'}</span>
          </button>

          {/* Botão REFAZER COM SEEDREAM 5.0 (Item 21: quando o modelo anterior foi OPENAI) */}
          {result.imageModel === 'openai' && (
            <button
              type="button"
              disabled={isRegeneratingImage}
              onClick={handleRegenerateWithSeaDream}
              className="w-full py-2.5 px-4 rounded-xl border border-emerald-400 bg-gradient-to-r from-emerald-600 to-green-700 hover:brightness-110 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/60"
            >
              <Cpu className="w-4 h-4 text-white" />
              <span>REFAZER COM SEEDREAM 5.0</span>
            </button>
          )}

          {/* Campo: Deseja Fazer Alteração na Imagem? COM MICROFONE (Item 8) */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 block">
                Deseja fazer alteração na imagem?
              </label>
              {/* Botão de Ditar com Microfone (Item 8) */}
              <button
                type="button"
                onClick={toggleImageMicrophone}
                className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isImageMicRecording
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border-zinc-700 hover:border-emerald-500'
                }`}
                title="Ditar alterações por voz"
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="text-[10px]">{isImageMicRecording ? 'Ouvindo...' : 'Ditar'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={imageTweakText}
              onChange={(e) => setImageTweakText(e.target.value)}
              placeholder="Ex.: Ajustar o caimento da saia, escurecer um pouco o tom do tecido..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              disabled={isRegeneratingImage || !imageTweakText.trim()}
              onClick={() => handleRegenerateImage(imageTweakText)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refazer Imagem com Ajuste</span>
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: FIDELIDADE + PROMPT DE VÍDEO + BAIXAR TUDO + HASHTAGS + HEADLINE */}
        <div className="md:col-span-7 space-y-5">
          {/* 1. CARD DE ANÁLISE DE FIDELIDADE */}
          <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/40 bg-zinc-950/80 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Análise de Fidelidade da Peça
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {auditScore}% {auditLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60">
                <span className="text-zinc-500 block text-[10px]">Calçado Automático:</span>
                <span className="font-bold text-emerald-300">{result.shoeDescription}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60">
                <span className="text-zinc-500 block text-[10px]">Enquadramento:</span>
                <span className="font-bold text-emerald-300">Corte do Queixo para baixo</span>
              </div>
            </div>
          </div>

          {/* 2. CARD DO PROMPT DE VÍDEO (KLING 3.0 OMNI · 10S) */}
          <div className="p-5 rounded-2xl border border-emerald-500/40 bg-zinc-950/80 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Prompt do Vídeo (Kling 3.0 Omni · 10 Segundos)
                </h3>
              </div>
              {/* Botão Copiar Prompt (Item 14: maior e azul quando copiado) */}
              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  copiedPrompt
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/50'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-600/40 hover:border-emerald-400'
                }`}
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Prompt limpo sem o cabeçalho 🎥 PROMPT DE VÍDEO... (item 24) */}
            <div className="p-3.5 rounded-xl bg-zinc-900/95 border border-zinc-800 text-xs font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {cleanVideoPrompt}
            </div>

            {/* Ajustar ou Corrigir Prompt com IA COM MICROFONE (Item 10) */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-400 block">
                  Ajustar ou corrigir esse prompt com IA:
                </label>
                {/* Botão de Ditar com Microfone (Item 10) */}
                <button
                  type="button"
                  onClick={togglePromptMicrophone}
                  className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isPromptMicRecording
                      ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border-zinc-700 hover:border-emerald-500'
                  }`}
                  title="Ditar ajuste por voz"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{isPromptMicRecording ? 'Ouvindo...' : 'Ditar'}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptCorrectionText}
                  onChange={(e) => setPromptCorrectionText(e.target.value)}
                  placeholder="Ex.: Ajustar para movimentos mais lentos da modelo, suavizar o caimento da peça..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={isRefiningPrompt || !promptCorrectionText.trim()}
                  onClick={handleRefinePrompt}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isRefiningPrompt ? 'animate-spin' : ''}`} />
                  <span>{isRefiningPrompt ? 'Refazendo...' : 'Refazer Prompt'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. BOTÃO DE BAIXAR TUDO (.ZIP) EMBAIXO DO PROMPT (ITEM 6) */}
          <div>
            <button
              type="button"
              disabled={isExportingZip}
              onClick={handleExportZip}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-sm font-black flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-400/40 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Download className="w-5 h-5 text-white" />
              <span>{isExportingZip ? 'Compactando...' : 'Baixar Tudo (.zip)'}</span>
            </button>
          </div>

          {/* 4. CARD DE HASHTAGS (SOMENTE HASHTAGS, BOTÃO MAIOR E AZUL - ITENS 11 E 14) */}
          <div className="p-5 rounded-2xl border border-emerald-500/40 bg-zinc-950/80 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Hashtags
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyHashtags}
                className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  copiedHashtags
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/50'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-600/40 hover:border-emerald-400'
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
                    <span>Copiar Hashtags</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/95 border border-zinc-800 text-xs font-mono text-emerald-200 select-all">
              {result.hashtags}
            </div>
          </div>

          {/* 5. CARD DE HEADLINE (BOTÃO MAIOR E AZUL - ITENS 11 E 14) */}
          <div className="p-5 rounded-2xl border border-emerald-500/40 bg-zinc-950/80 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Headline
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyHeadline}
                className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  copiedHeadline
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/50'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-600/40 hover:border-emerald-400'
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

            <div className="p-3.5 rounded-xl bg-zinc-900/95 border border-zinc-800 text-sm font-semibold text-white select-all">
              {result.headline}
            </div>
          </div>
        </div>
      </div>

      {/* ─── DETECTOR DE INCONSISTÊNCIAS DE VÍDEO (AUDITORIA KLING 10S) ─── */}
      <div className="pt-4">
        <VideoFidelityAuditor
          productName={result.productName || 'Peça de Vestuário'}
          referencePhotos={result.referencePhotos}
          onOpenPreview={onOpenPreviewModal}
        />
      </div>
    </div>
  );
};
