import React, { useState } from 'react';
import { Coins, X, ChevronDown, Sparkles, Film, Image as ImageIcon, Mic, Activity, Layers, Cpu } from 'lucide-react';
import { TokenUsageStats } from '../types';

interface TokenCostBadgeProps {
  stats?: TokenUsageStats;
}

export const TokenCostBadge: React.FC<TokenCostBadgeProps> = ({ stats }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!stats) return null;

  const hasDetailedSteps = Boolean(stats.detailedSteps && stats.detailedSteps.length > 0);
  const costUSDText = stats.totalCostUSD ? `$ ${stats.totalCostUSD.toFixed(3)} USD` : null;

  return (
    <>
      {/* Clickable Header Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm group"
        title="Ver mediÃ§Ã£o completa de custos por etapa (USD e BRL)"
      >
        <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
        {costUSDText && (
          <>
            <span className="text-sky-300">{costUSDText}</span>
            <span className="text-zinc-500">â€¢</span>
          </>
        )}
        <span className="text-emerald-400">R$ {stats.estimatedCostBRL.toFixed(2)}</span>
        <ChevronDown className="w-3 h-3 text-amber-400/70" />
      </button>

      {/* Modal Breakdown */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">MediÃ§Ã£o de Custos da Clonagem</h3>
                  <p className="text-[11px] text-zinc-400">Detalhamento por etapa, modelo e tokens</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Highlight */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Custo Total (USD)</span>
                <p className="text-2xl font-bold font-mono text-sky-400 mt-0.5">
                  ${(stats.totalCostUSD ?? (stats.estimatedCostBRL / 5.70)).toFixed(3)} <span className="text-xs text-zinc-400">USD</span>
                </p>
                {stats.totalCalls && (
                  <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>{stats.totalCalls} chamadas instrumentadas</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Custo Estimado (BRL)</span>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                  R$ {stats.estimatedCostBRL.toFixed(2)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                  {stats.totalTokens.toLocaleString('pt-BR')} tokens
                </p>
              </div>
            </div>

            {/* Modelos Utilizados */}
            {stats.modelsUsed && stats.modelsUsed.length > 0 && (
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs shrink-0 space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Modelos Utilizados nesta Clonagem:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stats.modelsUsed.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10px]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Operations Breakdown */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 text-xs">
              {hasDetailedSteps ? (
                stats.detailedSteps!.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-zinc-950/70 rounded-lg border border-zinc-800/80 flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-200 capitalize">{step.step}</span>
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-800/40">
                          {step.model}
                        </span>
                      </div>
                      {step.details && <p className="text-[10px] text-zinc-400 mt-0.5">{step.details}</p>}
                      {((step.promptTokens ?? 0) + (step.completionTokens ?? 0)) > 0 && (
                        <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                          {(step.promptTokens ?? 0).toLocaleString('pt-BR')} in / {(step.completionTokens ?? 0).toLocaleString('pt-BR')} out tokens
                        </p>
                      )}
                    </div>
                    <div className="text-right font-mono shrink-0 ml-2">
                      <div className="text-sky-300 font-bold">${step.costUSD.toFixed(3)}</div>
                      <div className="text-emerald-400 text-[10px]">R$ {step.costBRL.toFixed(3)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Activity className="w-4 h-4 text-sky-400" />
                      <span>AnÃ¡lise de VÃ­deo e VisÃ£o</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-zinc-400">{stats.breakdown.videoAnalysisTokens.toLocaleString('pt-BR')} tok</span>
                      <span className="text-emerald-400 ml-2">R$ {stats.breakdown.videoAnalysisCostBRL.toFixed(3)}</span>
                    </div>
                  </div>

                  {stats.breakdown.speechTokens > 0 && (
                    <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Mic className="w-4 h-4 text-purple-400" />
                        <span>TranscriÃ§Ã£o de Ãudio</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-zinc-400">{stats.breakdown.speechTokens.toLocaleString('pt-BR')} tok</span>
                        <span className="text-emerald-400 ml-2">R$ {stats.breakdown.speechCostBRL.toFixed(3)}</span>
                      </div>
                    </div>
                  )}

                  {stats.breakdown.imagesCount > 0 && (
                    <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <ImageIcon className="w-4 h-4 text-pink-400" />
                        <span>Imagens ({stats.breakdown.imagesCount} geradas)</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-emerald-400">R$ {stats.breakdown.imagesCostBRL.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-500 leading-tight shrink-0 border-t border-zinc-800/80 pt-2">
              * Custos medidos com precisÃ£o por chamada em USD e convertidos para BRL (taxa oficial R$ 5,70). Tokens e operaÃ§Ãµes registrados conforme retorno da API.
            </p>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};



