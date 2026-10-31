import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Download,
  Trash2,
  Copy,
  Check,
  Eye,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AnaMariaResultState } from './types';
import { getAnaMariaHistory } from './anaMariaPipeline';
import { downloadAnaMariaSingleImage, exportAnaMariaZip } from './anaMariaZipExporter';

interface AnaMariaHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreative: (item: AnaMariaResultState) => void;
  onOpenPreview: (url: string, title: string) => void;
}

const STORAGE_KEY = 'aurora_ana_maria_history_v1';

export const AnaMariaHistoryModal: React.FC<AnaMariaHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCreative,
  onOpenPreview,
}) => {
  const [items, setItems] = useState<AnaMariaResultState[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItems(getAnaMariaHistory());
    }
  }, [isOpen]);

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleClearAll = () => {
    if (!window.confirm('Tem certeza que deseja apagar todo o histórico do Modo Ana Maria?')) return;
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleCopyPrompt = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-sky-500/40 bg-zinc-950 text-zinc-100 shadow-2xl">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Histórico de Gerações — Modo Ana Maria
              </h2>
              <p className="text-[11px] text-zinc-400">
                {items.length} {items.length === 1 ? 'geração gravada' : 'gerações gravadas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Sparkles className="w-8 h-8 text-sky-500/40 mx-auto" />
              <p className="text-xs font-bold text-zinc-400">Nenhuma geração anterior encontrada.</p>
              <p className="text-[11px] text-zinc-600">
                Gere fotos e vídeos no Modo Ana Maria para acessá-los aqui a qualquer momento.
              </p>
            </div>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="p-4 rounded-xl border border-sky-500/30 bg-zinc-900/60 hover:border-sky-500/60 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                {/* Thumbnail e dados */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    onClick={() =>
                      onOpenPreview(
                        it.imageUrl,
                        `Modo Ana Maria - ${it.productName || 'Peça'}`
                      )
                    }
                    className="w-14 h-24 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-800 cursor-pointer relative group"
                  >
                    <img
                      src={it.imageUrl}
                      alt={it.productName || 'Modo Ana Maria'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white truncate max-w-xs">
                        {it.productName || 'Peça Sem Nome'}
                      </h3>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {it.influencer} · {it.bodyType === 'plus_size' ? 'Plus' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-200/90 truncate max-w-sm">
                      {it.headline}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(it.timestamp).toLocaleString('pt-BR')} · {it.shoeDescription}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(it.id, it.videoPrompt)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    title="Copiar prompt do vídeo"
                  >
                    {copiedId === it.id ? (
                      <Check className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadAnaMariaSingleImage(it.imageUrl, it.productName)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    title="Baixar Imagem"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectCreative(it);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Carregar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(it.id)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-300 transition-all cursor-pointer"
                    title="Apagar do histórico"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
