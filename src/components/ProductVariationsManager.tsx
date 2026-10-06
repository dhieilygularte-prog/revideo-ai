import React, { useRef } from 'react';
import { Package, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { ProductVariation } from '../types';

interface ProductVariationsManagerProps {
  variations: ProductVariation[];
  onAddVariation: () => void;
  onRemoveVariation: (id: string) => void;
  onAddPhotosToVariation: (id: string, files: FileList | null) => void;
  onRemovePhotoFromVariation: (variationId: string, photoIndex: number) => void;
}

export const ProductVariationsManager: React.FC<ProductVariationsManagerProps> = ({
  variations,
  onAddVariation,
  onRemoveVariation,
  onAddPhotosToVariation,
  onRemovePhotoFromVariation,
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Passo 2: Fotos do Produto</h3>
            <p className="text-xs text-zinc-300 mt-0.5">
              Anexe fotos do produto de cada variação, cores, sabores, estampas ou modelos <strong className="text-emerald-400">em todos os ângulos possíveis</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Angle Guidance Banner */}
      <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 flex flex-wrap items-center gap-2">
        <span className="text-zinc-300 font-bold">Ângulos essenciais para o Veo 3.1:</span>
        <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300">Vista Frontal</span>
        <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300">Vista Lateral / Perfil</span>
        <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300">Vista Traseira / Calcanhar</span>
        <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300">Solado & Detalhes</span>
      </div>

      {/* Variations List */}
      <div className="space-y-4">
        {variations.map((variation, index) => {
          const autoLabel = `Variação ${index + 1}`;

          return (
            <div
              key={variation.id}
              className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/90 space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50" />
                  <span className="text-sm font-bold text-white tracking-wide">
                    {autoLabel}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ({variation.photos.length} {variation.photos.length === 1 ? 'foto' : 'fotos'})
                  </span>
                </div>

                {variations.length > 1 && (
                  <button
                    onClick={() => onRemoveVariation(variation.id)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remover esta variação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Photos Grid & Upload Button */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={(el) => {
                    fileInputRefs.current[variation.id] = el;
                  }}
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    onAddPhotosToVariation(variation.id, e.target.files);
                    e.target.value = '';
                  }}
                />

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {/* Upload Drop Button */}
                  <button
                    onClick={() => fileInputRefs.current[variation.id]?.click()}
                    className="aspect-square rounded-xl border border-dashed border-zinc-700 hover:border-pink-500 bg-zinc-900/60 hover:bg-pink-500/5 flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-pink-300 transition-all cursor-pointer p-2 text-center"
                    title="Anexe fotos reais do produto nesta variação"
                  >
                    <Upload className="w-5 h-5 text-pink-400" />
                    <span className="text-[11px] font-bold leading-tight">Anexar Fotos</span>
                  </button>

                  {/* Thumbnail Cards */}
                  {variation.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      className="aspect-square rounded-xl border border-zinc-800 bg-black relative group/photo overflow-hidden shadow-sm"
                    >
                      <img
                        src={photo}
                        alt={`${autoLabel} foto ${pIdx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => onRemovePhotoFromVariation(variation.id, pIdx)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/80 hover:bg-rose-600 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer shadow"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {variation.photos.length === 0 && (
                  <p className="text-[11px] text-zinc-500 italic pt-1">
                    Nenhuma foto anexada ainda. Clique em "Anexar Fotos" (você pode selecionar 10 ou mais fotos de uma vez).
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Single Green Add Variation Button at the bottom */}
        {variations.length < 5 && (
          <button
            onClick={onAddVariation}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            Adicionar variação
          </button>
        )}
      </div>
    </div>
  );
};
