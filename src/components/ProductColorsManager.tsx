import React, { useRef } from 'react';
import { Package, Plus, Trash2, Upload, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProductColor } from '../types';
import { MAX_PRODUCT_COLORS } from '../config/models';

interface ProductColorsManagerProps {
  colors: ProductColor[];
  onAddColor: () => void;
  onRemoveColor: (colorId: string) => void;
  onUpdateColorName: (colorId: string, name: string) => void;
  onAddPhotosToColor: (colorId: string, files: FileList | null) => void;
  onRemovePhotoFromColor: (colorId: string, photoIndex: number) => void;
}

export const ProductColorsManager: React.FC<ProductColorsManagerProps> = ({
  colors,
  onAddColor,
  onRemoveColor,
  onUpdateColorName,
  onAddPhotosToColor,
  onRemovePhotoFromColor,
}) => {
  const canAddMore = colors.length < MAX_PRODUCT_COLORS;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl relative space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Passo 2: Fotos do Seu Tênis (Por Cor)
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {colors.length} de {MAX_PRODUCT_COLORS} cores
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Cadastre de 1 a 3 cores do seu produto. Cada cor deve ter o nome e fotos reais com boa iluminação
            </p>
          </div>
        </div>

        {canAddMore && (
          <button
            onClick={onAddColor}
            className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Cor</span>
          </button>
        )}
      </div>

      {/* List of Colors */}
      <div className="space-y-4">
        {colors.map((colorItem, colorIndex) => {
          const inputId = `file-input-${colorItem.id}`;
          const hasPhotos = colorItem.photos.length > 0;

          return (
            <div
              key={colorItem.id}
              className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-3 relative group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {colorIndex + 1}
                  </span>
                  <div className="flex-1 max-w-sm">
                    <input
                      type="text"
                      value={colorItem.name}
                      onChange={(e) => onUpdateColorName(colorItem.id, e.target.value)}
                      placeholder={`Ex: ${colorIndex === 0 ? 'Preto / Rosa' : colorIndex === 1 ? 'Preto / Café' : 'Marrom / Rosa'}`}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 focus:border-emerald-500 text-sm font-semibold text-white rounded-lg focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {hasPhotos && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    {colorItem.photos.length} foto(s) anexada(s)
                  </span>
                )}

                {colors.length > 1 && (
                  <button
                    onClick={() => onRemoveColor(colorItem.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                    title="Remover esta cor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Photos Grid & Upload */}
              <div className="flex flex-wrap gap-2.5 items-center">
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onAddPhotosToColor(colorItem.id, e.target.files)}
                />

                {colorItem.photos.map((photoUrl, pIdx) => (
                  <div
                    key={pIdx}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 group/photo shrink-0 shadow-md"
                  >
                    <img
                      src={photoUrl}
                      alt={`Foto ${pIdx + 1} - ${colorItem.name}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onRemovePhotoFromColor(colorItem.id, pIdx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500/90 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer shadow"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label
                  htmlFor={inputId}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 hover:bg-emerald-500/5 text-zinc-400 hover:text-emerald-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px] font-semibold text-center leading-tight">
                    {hasPhotos ? '+ Fotos' : 'Anexar'}
                  </span>
                </label>

                {!hasPhotos && (
                  <span className="text-xs text-amber-400/90 flex items-center gap-1.5 ml-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Anexe pelo menos 1 foto desta cor
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
