import React from 'react';
import { FileText, HelpCircle, Sparkles } from 'lucide-react';

interface ProductInfoCardProps {
  productInfo: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  productInfo,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Informações do Produto</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                Opcional
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Adicione a descrição, benefícios e diferenciais do produto para enriquecer o roteiro falado e os prompts visuais.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={productInfo}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Ex: Tênis ergonômico com amortecimento em gel, solado antiderrapante, respirável e ultraleve. Ideal para caminhada e uso diário. Frete grátis e garantia de 30 dias..."
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all resize-y"
        />

        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Estes detalhes são integrados à copy e ao roteiro comercial da locução adaptada.</span>
          </div>
          {productInfo && (
            <span className="font-mono text-zinc-600 text-[10px]">
              {productInfo.length} caracteres
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
