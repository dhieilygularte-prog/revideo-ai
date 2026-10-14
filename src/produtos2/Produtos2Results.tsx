import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  RefreshCw,
  FileText,
  Sparkles,
  CheckCircle2,
  Eye,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Produtos2AuditColorStatus, Produtos2ResultState } from './types';
import {
  downloadProdutos2StoryboardImage,
  exportProdutos2Zip,
  sanitizeProductFileName,
} from './produtos2ZipExporter';
import { buildProdutos2VeoPrompt } from './produtos2Prompts';
import { MicroImageEditor } from '../components/MicroImageEditor';
import { AIProfile } from '../config/aiProfiles';

interface Produtos2ResultsProps {
  result: Produtos2ResultState;
  onUpdateResult: React.Dispatch<React.SetStateAction<Produtos2ResultState | null>>;
  onRegenerateStoryboard: (customCorrection?: string) => void;
  onOpenPreview: (url: string, title: string) => void;
  aiProfile?: AIProfile;
}

function getStatusClasses(status: Produtos2AuditColorStatus) {
  switch (status) {
    case 'green':
      return {
        box: 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300',
        badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200',
        cell: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
        dot: 'bg-emerald-400',
      };
    case 'yellow':
      return {
        box: 'bg-amber-500/10 border-amber-500/40 text-amber-200',
        badge: 'bg-amber-500/20 border-amber-400/50 text-amber-200',
        cell: 'bg-amber-950/60 border-amber-500/50 text-amber-200',
        dot: 'bg-amber-400',
      };
    case 'orange':
      return {
        box: 'bg-orange-500/15 border-orange-500/50 text-orange-200',
        badge: 'bg-orange-500/25 border-orange-400/60 text-orange-200',
        cell: 'bg-orange-950/70 border-orange-500/60 text-orange-200',
        dot: 'bg-orange-400',
      };
    case 'red':
    default:
      return {
        box: 'bg-rose-500/15 border-rose-500/50 text-rose-200',
        badge: 'bg-rose-500/25 border-rose-400/60 text-rose-200',
        cell: 'bg-rose-950/70 border-rose-500/60 text-rose-200',
        dot: 'bg-rose-500',
      };
  }
}

export const Produtos2Results: React.FC<Produtos2ResultsProps> = ({
  result,
  onUpdateResult,
  onRegenerateStoryboard,
  onOpenPreview,
  aiProfile = 'openai',
}) => {
  const [promptCopied, setPromptCopied] = useState(false);
  const [hasCopiedPromptOnce, setHasCopiedPromptOnce] = useState(false);
  const [copyCopied, setCopyCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const safeFileName = sanitizeProductFileName(result.productName);
  const audit = result.storyboardAudit;
  const auditStyles = getStatusClasses(audit?.overallStatus || 'green');
  const problemQuadrants = (audit?.quadrants || []).filter(
    (q) => q.productVisible && q.score < 90
  );

  const handleCopyVeoPrompt = () => {
    navigator.clipboard.writeText(result.veoPrompt);
    setPromptCopied(true);
    setHasCopiedPromptOnce(true);
    setTimeout(() => setPromptCopied(false), 2500);
  };

  const handleCopyFinalSpeech = () => {
    navigator.clipboard.writeText(result.finalCopy);
    setCopyCopied(true);
    setTimeout(() => setCopyCopied(false), 2000);
  };

  const handleEditCopyLive = (newCopy: string) => {
    onUpdateResult((prev) => {
      if (!prev) return null;
      const updatedVeoPrompt = buildProdutos2VeoPrompt({
        productName: prev.productName,
        duration: prev.duration,
        speechMode: prev.speechMode,
        finalCopy: newCopy,
        influencerResolved: prev.influencerResolved,
        framing: prev.framing,
        productLock: prev.productLock,
        avatarDescription: prev.avatarDescription,
        scenarioDescription: prev.scenarioDescription,
        scenes: prev.scenes,
        variations: prev.variations,
      });
      return {
        ...prev,
        finalCopy: newCopy,
        veoPrompt: updatedVeoPrompt,
      };
    });
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      await exportProdutos2Zip(result);
    } finally {
      setIsExportingZip(false);
    }
  };

  // O mesmo azul do Modo Ania quando o prompt do Veo 3 é copiado
  const copiedBlueSectionClass =
    'bg-gradient-to-br from-sky-900/85 via-blue-900/80 to-slate-900/95 border-2 border-sky-400 shadow-xl shadow-sky-950/60 ring-2 ring-sky-400/40';
  const defaultSectionClass = 'bg-zinc-900/90 border border-zinc-800 shadow-xl';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===================================================================== */}
      {/* CARD DA COPY FINAL USADA E SUA ORIGEM (Acima do Storyboard/Prompt)   */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/95 border border-emerald-500/40 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
              Copy Final Usada no Criativo
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-bold text-emerald-200">
              {result.copySourceLabel}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                (result.duration === 8 && result.finalCopy.length > 165) ||
                (result.duration === 10 && result.finalCopy.length > 235)
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {result.finalCopy.length} caracteres ({result.duration}s · máx. {result.duration === 8 ? 165 : 235})
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyFinalSpeech}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copyCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copy Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copiar Só a Fala</span>
              </>
            )}
          </button>
        </div>

        <textarea
          rows={2}
          value={result.finalCopy}
          onChange={(e) => handleEditCopyLive(e.target.value)}
          className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700/80 text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed focus:outline-none focus:border-emerald-400 resize-none"
        />
        <p className="text-[11px] text-zinc-400">
          * Se você editar qualquer palavra desta fala acima, o prompt do Veo 3 abaixo é atualizado automaticamente em tempo real.
        </p>
      </div>

      {/* ===================================================================== */}
      {/* LADO A LADO: IMAGEM DO STORYBOARD (1080x1920) + PROMPT DO VEO 3       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: IMAGEM DO STORYBOARD 9 CENAS (1080x1920) + FISCALIZAÇÃO */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                Storyboard 3×3 (9 Cenas · 1080×1920)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Arquivo: <span className="text-zinc-200 font-mono">{safeFileName}.png</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRegenerateStoryboard()}
              disabled={Boolean(result.isRegeneratingStoryboard)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Corrigir e gerar novamente a imagem do storyboard"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-sky-400 ${
                  result.isRegeneratingStoryboard ? 'animate-spin' : ''
                }`}
              />
              <span>{result.isRegeneratingStoryboard ? 'Refazendo...' : 'Refazer'}</span>
            </button>
          </div>

          <div className="relative aspect-[9/16] w-full max-w-[360px] mx-auto rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-800 shadow-2xl group">
            {result.isRegeneratingStoryboard ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3">
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="text-xs font-bold text-zinc-200">
                  Refazendo Storyboard 3×3 e corrigindo cenas apontadas...
                </p>
                <p className="text-[11px] text-zinc-400">
                  Preservando logomarca, textos impressos, cores e formato reais do produto
                </p>
              </div>
            ) : result.storyboardImageUrl ? (
              <>
                <img
                  src={result.storyboardImageUrl}
                  alt={`Storyboard 9 Cenas - ${result.productName}`}
                  onClick={() =>
                    onOpenPreview(
                      result.storyboardImageUrl!,
                      `Storyboard 9 Cenas — ${result.productName}`
                    )
                  }
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                />
                {/* Botão Ampliar no canto superior direito */}
                <button
                  type="button"
                  onClick={() =>
                    onOpenPreview(
                      result.storyboardImageUrl!,
                      `Storyboard 9 Cenas — ${result.productName}`
                    )
                  }
                  className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-black/75 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                  title="Visualizar em tela cheia"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {/* Ícone de download individual no canto inferior direito sobre a própria imagem (Seção 2) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadProdutos2StoryboardImage(
                      result.storyboardImageUrl!,
                      result.productName
                    );
                  }}
                  className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/80 hover:bg-emerald-600 text-white border border-white/25 shadow-lg transition-all cursor-pointer flex items-center justify-center"
                  title={`Baixar ${safeFileName}.png`}
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-2">
                <p className="text-xs font-bold text-rose-400">
                  {result.storyboardError || 'Imagem não disponível'}
                </p>
                <button
                  type="button"
                  onClick={() => onRegenerateStoryboard()}
                  className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* PAINEL DE FISCALIZAÇÃO DE FIDELIDADE DOS 9 QUADRANTES (3x3)       */}
          {/* ================================================================= */}
          {audit && (
            <div className={`p-3.5 rounded-xl border space-y-3 ${auditStyles.box}`}>
              {/* Cabeçalho com Nota Geral e Semáforo de 4 Cores */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {audit.overallStatus === 'green' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : audit.overallStatus === 'yellow' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <AlertCircle
                      className={`w-4 h-4 shrink-0 ${
                        audit.overallStatus === 'orange' ? 'text-orange-400' : 'text-rose-400'
                      }`}
                    />
                  )}
                  <div>
                    <span className="text-xs font-black block leading-tight">
                      {audit.overallLabel}
                    </span>
                    <span className="text-[10px] opacity-80 block">
                      Fiscalização por quadrante (Logo, Texto, Cor, Formato e Botões)
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-black shrink-0 ${auditStyles.badge}`}
                >
                  {audit.overallScore}%
                </span>
              </div>

              {/* Grade 3x3 dos 9 Quadrantes (Cenas 1 a 9) */}
              <div className="grid grid-cols-3 gap-1.5">
                {audit.quadrants.slice(0, 9).map((q) => {
                  const qStyle = getStatusClasses(q.status);
                  return (
                    <div
                      key={q.sceneNumber}
                      title={q.issue}
                      className={`px-2 py-1.5 rounded-lg border text-[10px] flex items-center justify-between gap-1 ${qStyle.cell}`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${qStyle.dot}`} />
                        Cena {q.sceneNumber}
                      </span>
                      <span className="font-mono font-black">
                        {q.productVisible ? `${q.score}%` : 'OK'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Textos explicativos das cenas onde o produto ficou diferente */}
              {problemQuadrants.length > 0 ? (
                <div className="p-2.5 rounded-lg bg-black/35 border border-white/10 space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">
                    Cenas que precisam de correção (meta &ge; 90%):
                  </p>
                  {problemQuadrants.map((q) => (
                    <p key={q.sceneNumber} className="text-[11px] leading-snug font-medium">
                      • {q.issue}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] leading-snug opacity-95 font-medium">
                  ✓ Produto acima de 90% idêntico às fotos de referência em todos os quadrantes onde aparece (logomarca, textos, cores e formato preservados).
                </p>
              )}

              {/* Legenda rápida das faixas de cores */}
              <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-white/10 text-[9px] opacity-80">
                <span className="text-emerald-300 font-bold">● &ge;90% Verde</span>
                <span className="text-amber-300 font-bold">● 71–89% Amarelo</span>
                <span className="text-orange-300 font-bold">● 60–70% Laranja</span>
                <span className="text-rose-300 font-bold">● &lt;60% Vermelho</span>
              </div>

              {/* Botão de Refazer Inteligente (corrige os frames apontados com erro) */}
              <button
                type="button"
                onClick={() => onRegenerateStoryboard()}
                disabled={Boolean(result.isRegeneratingStoryboard)}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                  problemQuadrants.length > 0
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                }`}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${result.isRegeneratingStoryboard ? 'animate-spin' : ''}`}
                />
                <span>
                  {result.isRegeneratingStoryboard
                    ? 'Refazendo e Corrigindo Cenas...'
                    : problemQuadrants.length > 0
                    ? `Refazer Corrigindo Cena${problemQuadrants.length > 1 ? 's' : ''} ${problemQuadrants
                        .map((q) => q.sceneNumber)
                        .join(', ')}`
                    : 'Refazer Imagem do Storyboard'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: PROMPT COMPLETO DO VEO 3 (Fica com fundo azul ao copiar!) */}
        <div
          className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl transition-all duration-300 space-y-3 ${
            hasCopiedPromptOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Prompt do Veo 3 ({result.duration}s · 9 Micro-Cenas)</span>
                {hasCopiedPromptOnce && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" /> Copiado ✓
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-sky-200/80 mt-0.5">
                Arquivo no pacote: <span className="font-mono text-white">{safeFileName}.txt</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyVeoPrompt}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                promptCopied
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                  : hasCopiedPromptOnce
                  ? 'bg-sky-500 hover:bg-sky-400 text-white'
                  : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white'
              }`}
            >
              {promptCopied ? (
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

          <textarea
            rows={22}
            value={result.veoPrompt}
            onChange={(e) => {
              const val = e.target.value;
              onUpdateResult((prev) => (prev ? { ...prev, veoPrompt: val } : null));
            }}
            className={`w-full p-3.5 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-400 resize-y ${
              hasCopiedPromptOnce
                ? 'bg-slate-950/90 border border-sky-400/60 text-sky-50'
                : 'bg-zinc-950 border border-zinc-800 text-zinc-200'
            }`}
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DESCRIÇÃO DO POST + HASHTAGS (Idêntico ao Modo Ania)                  */}
      {/* ===================================================================== */}
      {result.description && (
        <div className="p-5 sm:p-6 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Descrição do Post + Hashtags (TikTok & Reels)</h3>
            </div>

            <button
              type="button"
              onClick={() => handleCopy('post-description', result.description!)}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
            >
              {copiedKey === 'post-description' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
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

          <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed select-all">
            {result.description}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BOTÃO BAIXAR TUDO (.ZIP COM NOME DO PRODUTO)                          */}
      {/* ===================================================================== */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-white">
            Pacote Completo ({safeFileName}.zip)
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Contém a imagem do storyboard (<span className="text-zinc-200 font-mono">{safeFileName}.png</span>), o prompt completo do Veo 3 (<span className="text-zinc-200 font-mono">{safeFileName}.txt</span>) e a descrição com hashtags (<span className="text-zinc-200 font-mono">descricao-{safeFileName}.txt</span>).
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isExportingZip}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isExportingZip ? 'Gerando .ZIP...' : `Baixar Tudo (${safeFileName}.zip)`}</span>
        </button>
      </div>

      {/* Módulo Independente de Microedição de Imagem */}
      <MicroImageEditor aiProfile={aiProfile} onOpenPreview={onOpenPreview} />
    </div>
  );
};
