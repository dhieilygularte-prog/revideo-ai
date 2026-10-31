import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  Trash2,
  Check,
  AlertCircle,
  History,
  ArrowRight,
  Layers,
  Cpu,
  Scissors,
} from 'lucide-react';
import {
  AnaMariaFormState,
  AnaMariaInfluencer,
  AnaMariaBodyType,
  AnaMariaImageModel,
  AnaMariaVideoPromptLimit,
} from './types';
import { compressAndResizeImage } from '../ania/aniaLibrary';

interface AnaMariaFormProps {
  form: AnaMariaFormState;
  onChange: React.Dispatch<React.SetStateAction<AnaMariaFormState>>;
  onSubmit: () => void;
  isProcessing: boolean;
  progressPercent: number;
  statusMessage: string;
  hasExistingResult?: boolean;
  onGoToResults?: () => void;
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
  hasExistingResult = false,
  onGoToResults,
  onOpenHistory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploading(true);
    try {
      const remainingSlots = 10 - form.referencePhotos.length;
      const filesToProcess = fileArray.slice(0, Math.max(0, remainingSlots));

      const newPhotos: string[] = [];
      for (const file of filesToProcess) {
        // Reduz para 1280px e qualidade 0.82 para upload 3x mais leve e rápido sem perda visual
        const compressed = await compressAndResizeImage(file, 1280, 0.82);
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
      {/* ─── BANNER PRINCIPAL (PALETA AZUL PRODUTOS 2.0 - ITENS 1, 2 E 3) ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-950/60 via-zinc-950 to-zinc-950 p-5 sm:p-7 shadow-2xl shadow-sky-950/40">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-950/60 text-white font-black">
              <Sparkles className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                  Modo Ana Maria
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  Vitrine 10s · Selfie Espelho
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-sky-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:border-sky-500/50"
              >
                <History className="w-4 h-4 text-sky-400" />
                <span>Histórico</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOTÃO DE AVANÇAR PARA A PÁGINA DE RESULTADOS (PADRÃO PRODUTOS 2.0) ─── */}
      {hasExistingResult && onGoToResults && (
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-sky-950/40 border border-sky-500/50 rounded-2xl shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs font-bold text-sky-200">
              Você já possui uma imagem gerada neste modo.
            </span>
          </div>
          <button
            type="button"
            onClick={onGoToResults}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-sky-950/40"
          >
            <span>Avançar para a página com a imagem gerada</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── CARD 1: FOTOS DE REFERÊNCIA DO PRODUTO (ATÉ 10 FOTOS) ─── */}
      <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                1. Fotos de Referência da Peça (Até 10 fotos)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Anexe fotos de frente, costas, detalhes do tecido e caimento. Todas as fotos devem ser do mesmo produto e na mesma cor.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                form.referencePhotos.length > 0
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
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
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-900/60 bg-zinc-900/30'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
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
                className="relative group rounded-xl overflow-hidden border border-sky-500/30 bg-zinc-900 aspect-[9/16] max-h-48 flex items-center justify-center"
              >
                <img
                  src={photo}
                  alt={`Referência ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-between items-center">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900/90 text-sky-300 text-[10px] font-bold">
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
                    <span className="px-1.5 py-0.5 rounded bg-sky-600/90 text-white text-[9px] font-black uppercase text-center">
                      Foto Principal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {form.referencePhotos.length === 0 && (
          <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Por favor, anexe ao menos 1 foto da peça para prosseguir com a geração.</span>
          </div>
        )}
      </div>

      {/* ─── CARD 2: NOME DA PEÇA / PRODUTO ─── */}
      <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
          <Layers className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            2. Nome da Peça / Produto (Opcional)
          </h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          O nome da peça é usado pelo aplicativo para selecionar a melhor headline e as hashtags correspondentes.
        </p>
        <input
          type="text"
          value={form.productName}
          onChange={(e) => onChange((prev) => ({ ...prev, productName: e.target.value }))}
          placeholder="Ex: Macacão Fitness Feminino, Cinta Modeladora Abdominal, Vestido Longo com Decote..."
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </div>

      {/* ─── CARD 3: MODELO (INFLUENCER) & TIPO DE CORPO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Influenciador */}
        <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
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
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40 font-black'
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
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.influencer === 'Homem' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Homem</span>
            </button>
          </div>
        </div>

        {/* Tipo de Corpo */}
        <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
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
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40 font-black'
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
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40 font-black'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {form.bodyType === 'plus_size' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Plus Size</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── CARD 5: INSTRUÇÕES ADICIONAIS ─── */}
      <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-xl space-y-3">
        <div className="border-b border-zinc-800/80 pb-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            5. Instruções Adicionais
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            Espaço opcional para descrever características específicas (ex.: modelo ruiva, outro ambiente da casa, etc.).
          </p>
        </div>
        <textarea
          rows={3}
          value={form.additionalInstructions}
          onChange={(e) => onChange((prev) => ({ ...prev, additionalInstructions: e.target.value }))}
          placeholder="Ex: Modelo ruiva; cenário em quarto com luz natural..."
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/95 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </div>

      {/* ─── CARD 6: CONFIGURAÇÕES DE MOTORES (VISUAL LIMPO) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Seletor de Gerador de Imagem */}
        <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                6. Gerador de Imagem
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'seedream_5_0_pro' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.imageModel === 'seedream_5_0_pro'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>SeaDream 5.0 Pro</span>
              {form.imageModel === 'seedream_5_0_pro' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'kling_3_0' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.imageModel === 'kling_3_0'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Kling 3.0</span>
              {form.imageModel === 'kling_3_0' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, imageModel: 'openai' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.imageModel === 'openai'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>OpenAI (ChatGPT)</span>
              {form.imageModel === 'openai' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>
          </div>
        </div>

        {/* Seletor de Prompt de Vídeo */}
        <div className="rounded-2xl border border-sky-950/60 bg-zinc-950/80 backdrop-blur-sm p-5 shadow-xl space-y-3">
          <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                7. Prompt de Vídeo
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: 'unlimited' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.videoPromptLimit === 'unlimited'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Padrão (Sem Limite)</span>
              {form.videoPromptLimit === 'unlimited' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: '5000' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.videoPromptLimit === '5000'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Até 5.000 Caracteres</span>
              {form.videoPromptLimit === '5000' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, videoPromptLimit: '2500' }))}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                form.videoPromptLimit === '2500'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 border-sky-400 text-white shadow shadow-sky-950/60 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Até 2.500 Caracteres</span>
              {form.videoPromptLimit === '2500' && <Check className="w-4 h-4 text-sky-200 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE PROGRESSO EM TEMPO REAL ─── */}
      {isProcessing && (
        <div className="p-5 rounded-2xl border border-sky-500/40 bg-zinc-950/95 space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-sky-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 animate-spin" />
              <span>{statusMessage || 'Processando Modo Ana Maria...'}</span>
            </span>
            <span className="font-mono text-sky-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── BOTÃO DE AÇÃO: GERAR VÍDEO (PADRÃO PRODUTOS 2.0) ─── */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl ${
            canSubmit
              ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white hover:brightness-110 shadow-sky-950/60 ring-2 ring-sky-400/50 hover:scale-[1.01]'
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
