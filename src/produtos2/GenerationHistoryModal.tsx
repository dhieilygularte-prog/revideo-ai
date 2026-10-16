import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Download,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Eye,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  HistoryCreativeItem,
  getCreativesHistory,
  deleteCreativeFromHistory,
  clearAllCreativesHistory,
} from '../utils/historyStorage';
import { exportProdutos2Zip } from './produtos2ZipExporter';

interface GenerationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreative: (item: HistoryCreativeItem) => void;
  onOpenPreview: (url: string, title: string) => void;
}

export const GenerationHistoryModal: React.FC<GenerationHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCreative,
  onOpenPreview,
}) => {
  const [items, setItems] = useState<HistoryCreativeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportingZipId, setIsExportingZipId] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const historyList = await getCreativesHistory();
      setItems(historyList);
    } catch (err) {
      console.warn('Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja remover este criativo do histórico?')) {
      await deleteCreativeFromHistory(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja apagar todo o histórico de criativos?')) {
      await clearAllCreativesHistory();
      setItems([]);
    }
  };

  const handleCopyText = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadZip = async (e: React.MouseEvent, item: HistoryCreativeItem) => {
    e.stopPropagation();
    setIsExportingZipId(item.id);
    try {
      await exportProdutos2Zip(item.result);
    } catch (err) {
      console.error('Erro ao baixar ZIP do histórico:', err);
      alert('Falha ao exportar pacote ZIP.');
    } finally {
      setIsExportingZipId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Histórico de Gerações</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {items.length}/10
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Seus últimos 10 criativos salvos no navegador. Reabra ou baixe o ZIP sem gastar créditos de API.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Criativos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Carregando histórico...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-500">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">Nenhum criativo salvo ainda</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Assim que você gerar um criativo no Modo Produtos 2.0, ele será guardado automaticamente aqui com o Storyboard, fala, prompt do Veo e tags.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  {/* Lado Esquerdo: Miniatura do Storyboard + Informações */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 group/thumb">
                      {item.storyboardImageUrl ? (
                        <>
                          <img
                            src={item.storyboardImageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPreview(item.storyboardImageUrl!, `Storyboard • ${item.productName}`);
                            }}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                            title="Ampliar Storyboard"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                          Sem img
                        </div>
                      )}
                    </div>

                    {/* Dados do Criativo */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                          {item.productName}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-400/20 font-bold">
                          {item.duration}s
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {item.dateFormatted}
                        </span>
                      </div>

                      {/* Trecho da Fala */}
                      {item.finalCopy && (
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed bg-black/30 p-2 rounded-lg border border-white/5 font-sans">
                          <span className="text-amber-400 font-bold mr-1">Fala:</span>
                          "{item.finalCopy}"
                        </p>
                      )}

                      {/* Botões rápidos de cópia */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {item.finalCopy && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyText(e, item.finalCopy, `speech_${item.id}`)}
                            className="text-[10px] font-bold text-zinc-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `speech_${item.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">Fala Copiada!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar Fala</span>
                              </>
                            )}
                          </button>
                        )}

                        {item.veoPrompt && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyText(e, item.veoPrompt, `prompt_${item.id}`)}
                            className="text-[10px] font-bold text-zinc-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `prompt_${item.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">Prompt Copiado!</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                <span>Copiar Prompt Veo 3</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Ações Principais */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCreative(item);
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/20 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                      <span>Reabrir Criativo</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadZip(e, item)}
                        disabled={isExportingZipId === item.id}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700 shrink-0"
                        title="Baixar pacote ZIP completo"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isExportingZipId === item.id ? 'Baixando...' : 'Baixar ZIP'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Remover do histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/60">
          {items.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-zinc-400 hover:text-rose-400 transition-colors font-medium cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar todo o histórico</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
