import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  History,
  ArrowLeft,
  Footprints,
  Cpu,
  Scissors,
  Layers,
} from 'lucide-react';
import {
  AnaMariaFormState,
  AnaMariaInfluencer,
  AnaMariaBodyType,
  AnaMariaImageModel,
  AnaMariaVideoPromptLimit,
} from './types';
import { detectShoeCategory } from './anaMariaPrompts';
import { compressAndResizeImage } from '../ania/aniaLibrary';

interface AnaMariaFormProps {
  form: AnaMariaFormState;
  onChange: React.Dispatch<React.SetStateAction<AnaMariaFormState>>;
  onSubmit: () => void;
  isProcessing: boolean;
  progressPercent: number;
  statusMessage: string;
  onOpenHistory?: () => void;
  onNavigateToProdutos2?: () => void;
}

export const AnaMariaForm: React.FC<AnaMariaFormProps> = ({
  form,
  onChange,
  onSubmit,
  isProcessing,
  progressPercent,
  statusMessage,
  onOpenHistory,
  onNavigateToProdutos2,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const shoePreview = detectShoeCategory(form.productName, form.additionalInstructions);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploading(true);
    try {
      const remainingSlots = 10 - form.referencePhotos.length;
      const filesToProcess = fileArray.slice(0, Math.max(0, remainingSlots));

      const newPhotos: string[] = [];
      for (const file of filesToProcess) {
        const compressed = await compressAndResizeImage(file, 1536, 0.88);
        if (compressed) {
          newPhotos.push(compressed);
        }
      }

      if (newPhotos.length > 0) {
        onChange((prev) => ({
          ...prev,
          referencePhotos: [...prev.referencePhotos, ...newPhotos].slice(0, 10),
        }));
      }
    } catch (err) {
      console.warn('Erro ao processar imagens anexadas:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    onChange((prev) => ({
      ...prev,
      referencePhotos: prev.referencePhotos.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleClearAllPhotos = () => {
    onChange((prev) => ({
      ...prev,
      referencePhotos: [],
    }));
  };

  const canSubmit = form.referencePhotos.length > 0 && !isProcessing && !isUploading;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* ─── BANNER PRINCIPAL: MODO ANA MARIA ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#1a120c] via-[#24170e] to-[#120c08] p-5 sm:p-7 shadow-2xl shadow-amber-950/40">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-600/30 text-zinc-950 font-black">
              <Sparkles className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                  Modo Ana Maria
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Vitrine 10s · Selfie Espelho
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-200/80 mt-0.5 max-w-2xl leading-relaxed">
                Gere uma foto hiper-realista vertical 9:16 da modelo usando sua peça no cenário residencial com corte obrigatório no queixo, o prompt de animação de 10s no espelho e headline viral.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 text-amber-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:border-amber-500"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>Histórico</span>
              </button>
            )}
            {onNavigateToProdutos2 && (
              <button
                type="button"
                onClick={onNavigateToProdutos2}
                className="px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Voltar ao Modo Produtos 2.0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                <span>Produtos 2.0</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── CARD 1: FOTOS DE REFERÊNCIA DO PRODUTO (ATÉ 10 FOTOS) ─── */}
      <div className="rounded-2xl border border-amber-900/40 bg-zinc-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                1. Fotos de Referência da Peça (Até 10 fotos)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Anexe fotos de frente, costas, detalhes do tecido e caimento. Todas as fotos devem ser do mesmo produto.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                form.referencePhotos.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {form.referencePhotos.length}/10 fotos
            </span>
            {form.referencePhotos.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllPhotos}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Zona de Upload Drag & Drop */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {form.referencePhotos.length < 10 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900/60 bg-zinc-900/30'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-200">
                Arraste as fotos da peça aqui ou clique para selecionar
              </p>
              <p className="text-[11px] text-zinc-500">
                Suporta PNG, JPG, WEBP. Você pode anexar até 10 fotos da mesma peça para máxima fidelidade.
              </p>
            </div>
          </div>
        )}

        {/* Grade de Fotos Anexadas */}
        {form.referencePhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
            {form.referencePhotos.map((photo, index) => (
              <div
                key={index}
                className="relative group rounded-xl overflow-hidden border border-amber-500/30 bg-zinc-900 aspect-[9/16] max-h-48 flex items-center justify-center"
              >
                <img
                  src={photo}
                  alt={`Referência ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-between items-center">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900/90 text-amber-300 text-[10px] font-bold">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                      className="w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {index === 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/90 text-zinc-950 text-[9px] font-black uppercase text-center">
                      Foto Principal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {form.referencePhotos.length === 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Por favor, anexe ao menos 1 foto da peça para prosseguir com a geração.</span>
          </div>
        )}
      </div>

      {/* ─── CARD 2: NOME DA PEÇA / PRODUTO ─── */}
      <div className="rounded-2xl border border-amber-900/40 bg-zinc-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            2. Nome da Peça / Produto (Opcional)
          </h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          O nome do produto é utilizado internamente para que o aplicativo selecione a headline ideal e as hashtags certas. <strong className="text-amber-300 font-semibold">O nome do produto não será incluído junto às hashtags copiadas.</strong>
        </p>
        <input
          type="text"
          value={form.productName}
          onChange={(e) => onChange((prev) => ({ ...prev, productName: e.target.value }))}
          placeholder="Ex: Macacão Fitness Feminino, Cinta Modeladora Abdominal, Vestido Longo com Decote..."
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* ─── CARD 3: MODELO (INFLUENCER) & TIPO DE CORPO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Influenciador */}
        <div className="rounded-2xl border border-amber-900/40 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              3. Influenciador / Modelo
            </h3>
            <p className="text-[11px] text-zinc-400">Mulher é o padrão do modo</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, influencer: 'Mulher' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                form.influencer === 'Mulher'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 border-amber-400 text-zinc-950 shadow-md shadow-amber-900/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.influencer === 'Mulher' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Mulher (Padrão)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, influencer: 'Homem' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                form.influencer === 'Homem'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 border-amber-400 text-zinc-950 shadow-md shadow-amber-900/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.influencer === 'Homem' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Homem</span>
            </button>
          </div>
        </div>

        {/* Tipo de Corpo */}
        <div className="rounded-2xl border border-amber-900/40 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              4. Tipo de Corpo
            </h3>
            <p className="text-[11px] text-zinc-400">Normal é o padrão do modo</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, bodyType: 'normal' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                form.bodyType === 'normal'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 border-amber-400 text-zinc-950 shadow-md shadow-amber-900/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.bodyType === 'normal' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Normal (Padrão)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, bodyType: 'plus_size' }))}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                form.bodyType === 'plus_size'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 border-amber-400 text-zinc-950 shadow-md shadow-amber-900/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.bodyType === 'plus_size' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Plus Size</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── CARD 4: REGRAS FIXAS VISUAIS (CALÇADO, ROSTO E CENÁRIO) ─── */}
      <div className="rounded-2xl border border-amber-900/40 bg-zinc-950/80 backdrop-blur-sm p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
          <Footprints className="w-4 h-4 text-amber-400" />
          <span>Calçado Selecionado Automaticamente: {shoePreview.name}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-zinc-300">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <span className="font-bold text-amber-300 block">Corte de Rosto Obrigatório</span>
            <p className="text-zinc-400 leading-relaxed">
              Enquadramento fixo da altura do nariz/lábio inferior para baixo. Nunca mostra o rosto inteiro.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <span className="font-bold text-amber-300 block">Proibição de Tatuagens</span>
            <p className="text-zinc-400 leading-relaxed">
              Pele sempre limpa e 100% livre de tatuagens em qualquer parte do corpo.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <span className="font-bold text-amber-300 block">Cenário Residencial Fixo</span>
            <p className="text-zinc-400 leading-relaxed">
              Portas escuras, paredes claras, porcelanato bege marmorizado e smartphone na mão.
            </p>
          </div>
        </div>
      </div>

      {/* ─── CARD 5: INSTRUÇÕES ADICIONAIS (PRIORIDADE MÁXIMA) ─── */}
      <div className="rounded-2xl border-2 border-amber-500/50 bg-[#1c140d]/90 backdrop-blur-sm p-5 sm:p-6 shadow-2xl space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-amber-700/40 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black text-amber-200 uppercase tracking-wide">
              5. Instruções Adicionais
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950 shadow-md">
            Prioridade Máxima
          </span>
        </div>
        <p className="text-xs text-amber-100/80 leading-relaxed">
          O que você escrever aqui sobrepõe qualquer detalhe padrão do prompt (ex.: se informar que a pessoa é ruiva, negra, branca, outro ambiente, outra cor de capa do celular, etc., sua instrução será mandatória).
        </p>
        <textarea
          rows={3}
          value={form.additionalInstructions}
          onChange={(e) => onChange((prev) => ({ ...prev, additionalInstructions: e.target.value }))}
          placeholder="Ex: Modelo ruiva com sardas; cenário em quarto minimalista; celular preto..."
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/95 border border-amber-600/40 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* ─── CARD 6: CONFIGURAÇÕES DE MOTORES (IMAGEM & PROMPT DE VÍDEO) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Seletor de Gerador de Imagem */}
        <div className="rounded-2xl border border-amber-900/40 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                6. Gerador de Imagem
              </h3>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">1 Foto 9:16</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'seedream_5_0_pro' }))}
              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'seedream_5_0_pro'
                  ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>SeaDream 5.0 Pro</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 text-[9px] font-black uppercase">
                    Padrão
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">Até 5.000 caracteres · Máxima fidelidade</div>
              </div>
              {form.imageModel === 'seedream_5_0_pro' && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'kling_3_0' }))}
              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'kling_3_0'
                  ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-white">Kling 3.0</div>
                <div className="text-[10px] text-zinc-400">Compactação para até 2.500 caracteres</div>
              </div>
              {form.imageModel === 'kling_3_0' && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'openai' }))}
              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.imageModel === 'openai'
                  ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-white">OpenAI (ChatGPT)</div>
                <div className="text-[10px] text-zinc-400">DALL-E 3 / GPT-Image</div>
              </div>
              {form.imageModel === 'openai' && <Check className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Seletor de Limite de Caracteres do Prompt de Vídeo */}
        <div className="rounded-2xl border border-amber-900/40 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                7. Prompt de Vídeo
              </h3>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">10 Segundos</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: 'unlimited' }))}
              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.videoPromptLimit === 'unlimited'
                  ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Padrão (Sem Limite)</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 text-[9px] font-black uppercase">
                    Kling Omni
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">Para Kling 3.0 Omni / Veo / OmniFlash</div>
              </div>
              {form.videoPromptLimit === 'unlimited' && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: '5000' }))}
              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.videoPromptLimit === '5000'
                  ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-white">Até 5.000 Caracteres</div>
                <div className="text-[10px] text-zinc-400">Adequado para Pixverse e ferramentas similares</div>
              </div>
              {form.videoPromptLimit === '5000' && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: '2500' }))}
              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                form.videoPromptLimit === '2500'
                  ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-white">Até 2.500 Caracteres</div>
                <div className="text-[10px] text-zinc-400">Adequado para Hailuo e ferramentas curtas</div>
              </div>
              {form.videoPromptLimit === '2500' && <Check className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE PROGRESSO EM TEMPO REAL ─── */}
      {isProcessing && (
        <div className="p-5 rounded-2xl border border-amber-500/40 bg-zinc-950/95 space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>{statusMessage || 'Processando Modo Ana Maria...'}</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── BOTÃO DE AÇÃO: GERAR VÍDEO ─── */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl ${
            canSubmit
              ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-zinc-950 hover:brightness-110 shadow-amber-950/60 ring-2 ring-amber-400/50 hover:scale-[1.01]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>{isProcessing ? 'Gerando Vídeo no Modo Ana Maria...' : 'Gerar Vídeo'}</span>
        </button>
      </div>
    </div>
  );
};
