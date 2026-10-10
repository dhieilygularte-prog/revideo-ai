import React, { useState } from 'react';
import { Download, Copy, Check, Eye, AlertCircle, RotateCcw, Sparkles } from 'lucide-react';
import { ProdutoResultState } from './types';
import { exportProdutoZip } from './produtoZipExporter';
import { MicroImageEditor } from '../components/MicroImageEditor';

interface ProdutoResultsProps {
  result: ProdutoResultState;
  onOpenPreview: (url: string, title: string) => void;
  aiProfile?: string;
}

export const ProdutoResults: React.FC<ProdutoResultsProps> = ({
  result,
  onOpenPreview,
  aiProfile = 'openai',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      await exportProdutoZip(result);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Conclusão */}
      <div className="p-5 bg-gradient-to-r from-[#281b14] to-[#1c130e] border border-[#52392b] rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Modo Produto Concluído • {result.productName}
          </h2>
          <p className="text-xs text-amber-200/80 mt-1">
            {result.scenes.length} cena(s) de {result.veoModelMode === 'veo3_omniflash_10s' ? '10s' : '8s'} com prompts prontos para Google Veo 3.1
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isExporting}
          className="py-2.5 px-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Compactando...' : 'Baixar Pacote (.ZIP)'}</span>
        </button>
      </div>

      {/* Cenas e Imagens */}
      <div className="space-y-6">
        {result.scenes.map((scene) => (
          <div
            key={scene.sceneNumber}
            className="p-5 bg-[#231710] border border-[#452d1f] rounded-2xl shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#3b271b] pb-3">
              <h3 className="text-sm font-black text-amber-200">
                Cena {scene.sceneNumber} • {result.veoModelMode === 'veo3_omniflash_10s' ? '10 segundos' : '8 segundos'}
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(`prompt-${scene.sceneNumber}`, scene.prompt)}
                className="py-1 px-3 bg-[#1c130e] hover:bg-[#2c1d15] text-amber-300 text-xs font-semibold rounded-lg border border-[#52392b] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedId === `prompt-${scene.sceneNumber}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Prompt da Cena</span>
                  </>
                )}
              </button>
            </div>

            {/* Instrução explícita de anexar as imagens no Veo */}
            <div className="flex items-center justify-between bg-[#1c130e] px-3.5 py-2 rounded-xl border border-[#3b271b] text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Imagens de Referência Geradas ({scene.images.length})
              </span>
              <span className="text-[11px] text-zinc-400">
                Anexe {scene.images.length === 1 ? 'esta 1 imagem' : `estas ${scene.images.length} imagens`} no Google Veo 3.1
              </span>
            </div>

            {/* Imagens de Referência da Cena */}
            <div className={`grid gap-4 ${scene.images.length === 1 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : scene.images.length === 2 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
              {scene.images.map((img, idx) => (
                <div
                  key={img.id}
                  className="space-y-2 bg-[#1c130e] p-2.5 rounded-xl border border-[#40291c]"
                >
                  <div
                    onClick={() => img.imageUrl && onOpenPreview(img.imageUrl, `Cena ${scene.sceneNumber} - Imagem ${idx + 1}`)}
                    className="relative aspect-[9/16] max-h-[300px] w-full bg-black rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group"
                  >
                    {img.imageUrl ? (
                      <>
                        <img
                          src={img.imageUrl}
                          alt={img.role}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />

                        {/* Top Left: Frame Number Badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 border border-zinc-700 text-[10px] font-bold text-amber-300 z-10 backdrop-blur-sm">
                          Imagem {idx + 1}
                        </div>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="w-4 h-4" />
                          <span>Ampliar</span>
                        </div>

                        {/* Botão de download individual no canto inferior direito sobre a imagem */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = img.imageUrl!;
                            link.download = `cena_${scene.sceneNumber}_img_${idx + 1}_${result.productName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-black text-white hover:text-amber-400 border border-zinc-700 shadow backdrop-blur-sm transition-all cursor-pointer z-10"
                          title="Baixar somente esta imagem"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-rose-400 p-3 text-center">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-[11px]">{img.error || 'Erro ao gerar imagem'}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-amber-200/90 truncate">{img.role}</p>
                </div>
              ))}
            </div>

            {/* Prompt do Veo 3.1 da Cena */}
            <div className="p-3 bg-[#18100b] rounded-xl border border-[#3b271b] space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 block">Prompt Google Veo 3.1:</span>
              <p className="text-xs text-zinc-300 font-mono line-clamp-3 leading-relaxed">
                {scene.prompt}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Roteiro e Descrição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-[#231710] border border-[#452d1f] rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-200">Fala / Locução do Vídeo:</span>
            <button
              type="button"
              onClick={() => handleCopy('speech-full', result.speech)}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'speech-full' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copiar</span>
            </button>
          </div>
          <p className="text-xs text-zinc-300 italic bg-[#18100b] p-3 rounded-xl border border-[#3b271b]">
            "{result.speech}"
          </p>
        </div>

        <div className="p-4 bg-[#231710] border border-[#452d1f] rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-200">Descrição Comercial & Hashtags:</span>
            <button
              type="button"
              onClick={() => handleCopy('desc-full', result.description)}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'desc-full' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copiar</span>
            </button>
          </div>
          <p className="text-xs text-zinc-300 bg-[#18100b] p-3 rounded-xl border border-[#3b271b]">
            {result.description}
          </p>
        </div>
      </div>

      {/* Microedição de Imagem */}
      <MicroImageEditor
        aiProfile={aiProfile}
        onOpenPreview={onOpenPreview}
      />
    </div>
  );
};
