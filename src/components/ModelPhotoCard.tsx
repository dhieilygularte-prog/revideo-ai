import React, { useRef } from 'react';
import { User, Upload, X, CheckCircle2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ModelPhotoCardProps {
  modelPhotoUrl: string | null;
  onPhotoSelected: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export const ModelPhotoCard: React.FC<ModelPhotoCardProps> = ({
  modelPhotoUrl,
  onPhotoSelected,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoSelected(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/15 text-pink-400 border border-pink-500/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Foto da sua Modelo</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                Opcional
              </span>
              {modelPhotoUrl && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Modelo Anexada
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Se o vídeo mostrar o rosto da modelo, a foto enviada será usada para representá-la nas poses e ações.
            </p>
          </div>
        </div>

        {modelPhotoUrl && (
          <button
            type="button"
            onClick={() => onPhotoSelected(null)}
            disabled={disabled}
            className="text-xs text-zinc-400 hover:text-rose-400 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Remover Foto
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {modelPhotoUrl ? (
        <div className="flex items-center gap-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
          <div className="w-20 h-24 rounded-lg overflow-hidden border border-zinc-700 bg-black shrink-0 relative group">
            <img
              src={modelPhotoUrl}
              alt="Modelo de Referência"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Modelo ativa para o storyboard
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              As imagens geradas reproduzirão esta modelo usando as peças e interagindo com o produto nas mesmas posições do vídeo de referência.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold underline cursor-pointer"
            >
              Trocar foto da modelo
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target?.result) onPhotoSelected(event.target.result as string);
              };
              reader.readAsDataURL(file);
            }
          }}
          className="border-2 border-dashed border-zinc-800 hover:border-pink-500/50 hover:bg-pink-500/5 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-800 group-hover:bg-pink-500/20 text-zinc-400 group-hover:text-pink-400 flex items-center justify-center transition-colors">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-300 group-hover:text-white">
              Clique ou arraste uma foto nítida da sua modelo (rosto e corpo)
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              JPG, PNG ou WEBP • Opcional (se não enviar, o app usa uma modelo adaptada similar ao vídeo)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
