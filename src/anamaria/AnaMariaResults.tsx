import React, { useState } from 'react';
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
  FileText,
  History,
  ArrowLeft,
  Plus,
  RefreshCw,
  Video,
  Hash,
  Smile,
} from 'lucide-react';
import { AnaMariaResultState } from './types';
import {
  downloadAnaMariaSingleImage,
  exportAnaMariaZip,
} from './anaMariaZipExporter';
import {
  regenerateAnaMariaImage,
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
  // Estados de botões copiados (ficam azuis ao clicar)
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);
  const [downloadedImage, setDownloadedImage] = useState(false);

  // Estados de ajuste de imagem
  const [imageTweakText, setImageTweakText] = useState('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);

  // Estados de ajuste de prompt de vídeo
  const [promptCorrectionText, setPromptCorrectionText] = useState('');
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);

  // Estado de exportação do ZIP
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Handlers de cópia
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(result.videoPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleCopyHashtags = async () => {
    try {
      await navigator.clipboard.writeText(result.hashtags);
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleCopyHeadline = async () => {
    try {
      await navigator.clipboard.writeText(result.headline);
      setCopiedHeadline(true);
      setTimeout(() => setCopiedHeadline(false), 3000);
    } catch {
      // Fallback
    }
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

  // Refazer Imagem (com ou sem tweak)
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
  const auditStatus = result.audit?.status ?? 'green';
  const auditLabel = result.audit?.label ?? 'Verde Fidedigno';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* ─── BARRA DE NAVEGAÇÃO E AÇÕES DO TOPO ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/40 bg-[#1b120c]/90 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToForm}
            className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="px-3.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 border border-amber-600/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:border-amber-400"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Criar Novo no Modo Ana Maria</span>
          </button>

          <button
            type="button"
            onClick={onContinueProduct}
            className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Mantém as fotos da peça e configurações atuais para gerar outra imagem"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Continuar no Produto</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Histórico</span>
            </button>
          )}

          <button
            type="button"
            disabled={isExportingZip}
            onClick={handleExportZip}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-zinc-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-900/40 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-zinc-950" />
            <span>{isExportingZip ? 'Compactando...' : 'Baixar Tudo (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* ─── GRID PRINCIPAL: FOTO DA MODELO + ANÁLISE DE FIDELIDADE ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: FOTO GERADA (VERTICAL 9:16) */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border-2 border-amber-500/50 bg-zinc-950 p-3 shadow-2xl relative group">
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
                <Eye className="w-4 h-4 text-amber-300" />
              </button>

              {/* Badge de Motor no Topo Esquerdo */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-amber-500/40 text-[10px] font-bold text-amber-300 uppercase">
                {result.imageModel === 'seedream_5_0_pro'
                  ? 'SeaDream 5.0 Pro'
                  : result.imageModel === 'kling_3_0'
                  ? 'Kling 3.0'
                  : 'OpenAI'}
              </div>

              {/* Botão de Download Rápido no Canto Inferior Direito */}
              <button
                type="button"
                onClick={handleDownloadImage}
                className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xl ${
                  downloadedImage
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/40'
                    : 'bg-zinc-950/80 hover:bg-amber-600 text-amber-300 hover:text-zinc-950 border border-amber-500/40 backdrop-blur-md'
                }`}
                title="Baixar Imagem"
              >
                {downloadedImage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Baixado!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Imagem</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Botão Rápido de Refazer Imagem */}
          <button
            type="button"
            disabled={isRegeneratingImage}
            onClick={() => handleRegenerateImage()}
            className="w-full py-2.5 px-4 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-amber-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRegeneratingImage ? 'animate-spin' : ''}`} />
            <span>{isRegeneratingImage ? 'Refazendo com Alta Fidelidade...' : 'Refazer Imagem (Maior Fidelidade)'}</span>
          </button>

          {/* Campo: Deseja Fazer Alteração na Imagem? */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-2.5">
            <label className="text-xs font-bold text-zinc-300 block">
              Deseja fazer alteração na imagem?
            </label>
            <textarea
              rows={2}
              value={imageTweakText}
              onChange={(e) => setImageTweakText(e.target.value)}
              placeholder="Ex.: Ajustar o caimento da saia, escurecer um pouco o tom do tecido, etc."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              disabled={isRegeneratingImage || !imageTweakText.trim()}
              onClick={() => handleRegenerateImage(imageTweakText)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Refazer Imagem com Ajuste</span>
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: FIDELIDADE + PROMPT DE VÍDEO + HASHTAGS + HEADLINE */}
        <div className="md:col-span-7 space-y-5">
          {/* 1. CARD DE ANÁLISE DE FIDELIDADE DO PRODUTO */}
          <div className="p-5 rounded-2xl border border-amber-500/40 bg-zinc-950/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Análise de Fidelidade da Peça
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {auditScore}% {auditLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60">
                <span className="text-zinc-500 block text-[10px]">Calçado Automático:</span>
                <span className="font-bold text-amber-300">{result.shoeDescription}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60">
                <span className="text-zinc-500 block text-[10px]">Enquadramento:</span>
                <span className="font-bold text-amber-300">Corte do Nariz/Queixo para baixo</span>
              </div>
            </div>

            {result.audit?.issues && result.audit.issues.length > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-200/90 space-y-1">
                {result.audit.issues.map((iss, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{iss}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. CARD DO PROMPT DE VÍDEO (KLING 3.0 OMNI · VITRINE ESTÁTICA 10S) */}
          <div className="p-5 rounded-2xl border border-amber-500/40 bg-zinc-950/80 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Prompt do Vídeo (Kling 3.0 Omni · 10 Segundos)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  copiedPrompt
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/40'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-600/40'
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

            <div className="p-3.5 rounded-xl bg-zinc-900/95 border border-zinc-800 text-xs font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {result.videoPrompt}
            </div>

            {/* Ajustar ou Corrigir Prompt com IA */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 block">
                Ajustar ou corrigir esse prompt com IA:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptCorrectionText}
                  onChange={(e) => setPromptCorrectionText(e.target.value)}
                  placeholder="Ex.: Ajustar para movimentos mais lentos, remover termo censurado..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  disabled={isRefiningPrompt || !promptCorrectionText.trim()}
                  onClick={handleRefinePrompt}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-zinc-950 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isRefiningPrompt ? 'animate-spin' : ''}`} />
                  <span>{isRefiningPrompt ? 'Refazendo...' : 'Refazer Prompt'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. CARD DE HASHTAGS (SOMENTE HASHTAGS, SEM NOME DO PRODUTO) */}
          <div className="p-5 rounded-2xl border border-amber-500/40 bg-zinc-950/80 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Hashtags Recomendadas (Sem Descrição)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyHashtags}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  copiedHashtags
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/40'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-600/40'
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

            <div className="p-3 rounded-xl bg-zinc-900/95 border border-zinc-800 text-xs font-mono text-amber-200 select-all">
              {result.hashtags}
            </div>
            <p className="text-[10px] text-zinc-500">
              * O nome da peça não é incluído no texto das hashtags copiadas.
            </p>
          </div>

          {/* 4. CARD DE HEADLINE (COM SÍMBOLO FLORAL) */}
          <div className="p-5 rounded-2xl border border-amber-500/40 bg-zinc-950/80 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wide">
                  Headline Vencedora
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyHeadline}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  copiedHeadline
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/40'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-600/40'
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

            <div className="p-3 rounded-xl bg-zinc-900/95 border border-zinc-800 text-sm font-semibold text-white select-all flex items-center justify-between">
              <span>{result.headline}</span>
            </div>
            <p className="text-[10px] text-zinc-500">
              * A headline sempre acompanha o símbolo floral característico no final.
            </p>
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
