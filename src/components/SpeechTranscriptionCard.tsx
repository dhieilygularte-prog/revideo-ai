import React, { useState } from 'react';
import { Mic, Sparkles, RefreshCw, Check, MessageSquare, Volume2, Music, Plus } from 'lucide-react';
import { SpeechData, VeoModelMode } from '../types';

interface SpeechTranscriptionCardProps {
  speechData: SpeechData;
  veoModelMode?: VeoModelMode;
  sceneCount?: number;
  onUpdateSpeech: (newScript: string) => void;
  isUpdating?: boolean;
}

export const SpeechTranscriptionCard: React.FC<SpeechTranscriptionCardProps> = ({
  speechData,
  veoModelMode = 'veo3_basic_8s',
  sceneCount = 1,
  onUpdateSpeech,
  isUpdating = false,
}) => {
  const [editedScript, setEditedScript] = useState(speechData.adaptedScript || '');
  const [showOriginal, setShowOriginal] = useState(false);
  const [showCustomSpeech, setShowCustomSpeech] = useState(Boolean(speechData.hasSpeech));
  const [justSaved, setJustSaved] = useState(false);

  React.useEffect(() => {
    setEditedScript(speechData.adaptedScript || '');
  }, [speechData.adaptedScript]);

  const perSceneMax = veoModelMode === 'veo3_omniflash_10s' ? 252 : 199;
  const count = Math.max(1, sceneCount || 1);
  const totalMax = count * perSceneMax;

  const handleApply = () => {
    onUpdateSpeech(editedScript);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleShorten = () => {
    const trimmed = editedScript.trim();
    if (trimmed.length <= 40) return;
    const targetLen = Math.max(35, trimmed.length - 50);

    let result = trimmed
      .replace(/\s+/g, ' ')
      .replace(/olha só pessoal[,\s]*/gi, '')
      .replace(/presta atenção[,\s]*/gi, '')
      .replace(/corre que tá acabando[,\s]*/gi, '')
      .replace(/é simplesmente perfeito[,\s]*/gi, 'é perfeito, ')
      .replace(/com certeza vale a pena[,\s]*/gi, '')
      .replace(/aproveita essa super oportunidade[,\s]*/gi, 'aproveita ');

    if (result.length > targetLen) {
      const slice = result.slice(0, targetLen + 15);
      const lastPunct = Math.max(
        slice.lastIndexOf('.'),
        slice.lastIndexOf('!'),
        slice.lastIndexOf(','),
        slice.lastIndexOf(' ')
      );
      if (lastPunct > targetLen - 25) {
        result = slice.slice(0, lastPunct).trim();
      } else {
        result = result.slice(0, targetLen).trim();
      }
      if (!/[.!?]$/.test(result)) result += '!';
    }

    setEditedScript(result);
    onUpdateSpeech(result);
  };

  const handleExpand = () => {
    const trimmed = editedScript.trim();
    const target = totalMax;

    const hooks = [
      ' Corre e aproveita essa oferta exclusiva!',
      ' Qualidade premium garantida com envio imediato.',
      ' Não fica sem o seu, toca agora no link!',
      ' Olha cada detalhe incrível desse produto imperdível!',
      ' Super resistente, acabamento impecável e caimento perfeito!',
      ' Garanta o seu com desconto especial antes que acabe!',
    ];

    let expanded = trimmed;
    for (const h of hooks) {
      if ((expanded + h).length <= target) {
        expanded += h;
      }
    }
    if (expanded.length > target) {
      expanded = expanded.slice(0, target - 1).trim();
      if (!/[.!?]$/.test(expanded)) expanded += '!';
    }

    setEditedScript(expanded);
    onUpdateSpeech(expanded);
  };

  const isMusicOnly = !speechData.hasSpeech;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isMusicOnly
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
            }`}
          >
            {isMusicOnly ? <Music className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Áudio do Vídeo Concorrente
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isMusicOnly
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isMusicOnly ? '🎵 Música / Trilha Sonora' : '🗣️ Locução Comercial Identificada'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isMusicOnly
                ? 'O vídeo de referência utiliza apenas música de fundo sem narração comercial.'
                : 'O vídeo contém locução humana explicando/vendendo o produto.'}
            </p>
          </div>
        </div>

        {speechData.originalTranscript && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs text-zinc-400 hover:text-white underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {showOriginal ? 'Ocultar áudio original' : 'Ver áudio transcrito'}
          </button>
        )}
      </div>

      {/* Collapsible Original Transcript */}
      {showOriginal && speechData.originalTranscript && (
        <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Áudio Detectado no Vídeo Concorrente:
          </span>
          <p className="italic text-zinc-400 font-mono">"{speechData.originalTranscript}"</p>
        </div>
      )}

      {/* Music-Only Notification */}
      {isMusicOnly && !showCustomSpeech && (
        <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-300 font-medium">
              Como o vídeo concorrente usa apenas música, os prompts foram formatados para som ambiente autêntico / trilha musical sem falas artificiais.
            </p>
            <button
              onClick={() => setShowCustomSpeech(true)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-purple-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700 shrink-0 ml-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Locução (Opcional)</span>
            </button>
          </div>
        </div>
      )}

      {/* Editable Speech Box (Shown if genuine speech exists OR user clicked to add custom speech) */}
      {(speechData.hasSpeech || showCustomSpeech) && (
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-purple-400" />
              {count > 1
                ? `Roteiro Geral de Falas do Vídeo (${count} Cenas - Editável)`
                : 'Roteiro de Falas para o Seu Produto (Editável)'}
            </span>
            <span className="text-[11px] text-zinc-500 font-normal">
              {count > 1
                ? `Locução completa de todas as cenas • Cada cena possui ${perSceneMax} caracteres máx`
                : 'Insira ou ajuste o que será falado no vídeo'}
            </span>
          </label>

          <textarea
            value={editedScript}
            onChange={(e) => setEditedScript(e.target.value)}
            rows={3}
            placeholder="Digite aqui as falas para o vídeo do seu produto no TikTok Shop..."
            className="w-full p-3.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-sans resize-y leading-relaxed"
          />

          {/* Character Count & pacing indicator */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 px-1 gap-2">
            <span>
              Contagem total de caracteres: <strong className="text-white font-mono">{editedScript.length}</strong> / {totalMax} máx {count > 1 ? `(${perSceneMax} por cena em ${count} cenas)` : `(${perSceneMax} máx)`}
              {speechData.originalTranscript && speechData.originalTranscript.length > 5 && (
                <span className="text-zinc-500 ml-1.5">
                  (Original: {speechData.originalTranscript.length} carac)
                </span>
              )}
            </span>
            {editedScript.length > totalMax ? (
              <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                ⚠️ Ultrapassa o limite total de {totalMax} caracteres! Clique em "Encurtar Falas".
              </span>
            ) : editedScript.length > 0 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                ✓ Ritmo dinâmico e animado ideal para o Veo ({count} cena{count > 1 ? 's' : ''})
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between pt-1 gap-3">
            <span className="text-[11px] text-zinc-400">
              {editedScript.trim().length > 0
                ? '✨ Estas falas serão sincronizadas automaticamente aos prompts do Veo'
                : 'Sem falas (apenas música / som ambiente)'}
            </span>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Botão Encurtar Falas */}
              <button
                type="button"
                onClick={handleShorten}
                disabled={isUpdating || editedScript.trim().length <= 40}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Reduz o texto tornando a fala mais enxuta e rápida"
              >
                <span>✂️ Encurtar Falas</span>
              </button>

              {/* Botão Aumentar Falas (até totalMax) */}
              <button
                type="button"
                onClick={handleExpand}
                disabled={isUpdating || editedScript.trim().length >= totalMax}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title={`Aumenta as falas até ${totalMax} caracteres (${perSceneMax} por cena), mantendo o sentido e deixando mais dinâmico`}
              >
                <span>⚡ Aumentar Falas</span>
              </button>

              {/* Botão Aplicar Atualizações */}
              <button
                onClick={handleApply}
                disabled={isUpdating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/20"
              >
                {isUpdating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : justSaved ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{justSaved ? 'Prompts Atualizados!' : 'Atualizar Prompts com Estas Falas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
