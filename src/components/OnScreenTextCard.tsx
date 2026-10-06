import React, { useState } from 'react';
import { Type, Copy, Check, Scissors, Sparkles, Clock, Palette } from 'lucide-react';
import { OnScreenTextItem } from '../types';

interface OnScreenTextCardProps {
  texts: OnScreenTextItem[];
}

export const OnScreenTextCard: React.FC<OnScreenTextCardProps> = ({ texts }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Filtra headlines válidas, removendo vazias ou com apenas aspas/espaços
  const validTexts = (texts || []).filter((t) => {
    if (!t || !t.text) return false;
    const cleaned = t.text.trim().replace(/^["']+|["']+$/g, '').trim();
    return cleaned.length > 0;
  });

  if (validTexts.length === 0) return null;

  const handleCopyAll = () => {
    const formatted = validTexts
      .map(
        (t, idx) =>
          `[HEADLINE ${idx + 1}] (${t.timestamp})\nTexto: ${t.text.trim().replace(/^["']+|["']+$/g, '').trim()}\nEstilo da Fonte: ${t.fontStyle}\nCor: ${t.color}\nPosição na tela: ${t.position}\n`
      )
      .join('\n-------------------------\n');

    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopySingle = (text: string, index: number) => {
    const clean = text.trim().replace(/^["']+|["']+$/g, '').trim();
    navigator.clipboard.writeText(clean);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-5 shadow-2xl relative space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              Headline a colocar no vídeo
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {validTexts.length} {validTexts.length === 1 ? 'identificada' : 'identificadas'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Copie esta headline para sobrepor diretamente na edição final do vídeo.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        {validTexts.map((item, idx) => (
          <div
            key={idx}
            className="p-4 bg-zinc-950/90 rounded-xl border border-zinc-800 space-y-3 hover:border-amber-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> {item.timestamp}
              </span>

              {/* Big, prominent Copy Headline button placed where the small button was */}
              <button
                onClick={() => handleCopySingle(item.text, idx)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/60 hover:scale-[1.02] active:scale-[0.98]"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-4 h-4 text-zinc-950" />
                    <span>Headline Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-950" />
                    <span>Copiar Headline</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-sm sm:text-base font-bold text-white bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 font-sans tracking-wide">
              {item.text.trim().replace(/^["']+|["']+$/g, '').trim()}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 font-mono pt-1">
              <div>
                <span className="text-zinc-500 block text-[10px]">Fonte:</span>
                <span className="text-zinc-300">{item.fontStyle}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Posição na tela:</span>
                <span className="text-zinc-300">{item.position}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
