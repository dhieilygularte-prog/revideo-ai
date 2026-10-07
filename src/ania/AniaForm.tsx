import React, { useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Layers,
  CheckCircle2,
  TreePine,
  Footprints,
  Shirt,
  User,
  Users,
} from 'lucide-react';
import {
  AniaFormState,
  AniaCategory,
  AniaGender,
  AniaBody,
  ProductMode,
  AgeMode,
} from './types';
import { detectStretch, detectFabric, detectProductMode, extractShortProductName } from './aniaLibrary';
import { VeoModelMode } from '../types';

interface AniaFormProps {
  form: AniaFormState;
  onChange: (updater: (prev: AniaFormState) => AniaFormState) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export function AniaForm({ form, onChange, onSubmit, isProcessing }: AniaFormProps) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleProductNameChange = (val: string) => {
    onChange((prev) => {
      const detectedProdMode = prev.productMode === 'apparel' ? detectProductMode(val, prev.productInfo) : prev.productMode;
      const detectedAutoStretch = prev.stretchSource !== 'manual' ? detectStretch(`${val} ${prev.productInfo}`) : prev.stretch;
      const detectedFabricObj = prev.fabricSource !== 'manual' ? detectFabric(val, undefined, prev.productInfo) : null;
      const defaultBody = detectedProdMode === 'footwear' && prev.body === 'Plus size' ? 'Normal' : prev.body;

      return {
        ...prev,
        productName: val,
        productMode: detectedProdMode,
        body: defaultBody,
        stretch: prev.stretchSource === 'manual' ? prev.stretch : (detectedAutoStretch !== null ? detectedAutoStretch : prev.stretch),
        stretchSource: prev.stretchSource === 'manual' ? 'manual' : (detectedAutoStretch !== null ? 'local_detect' : prev.stretchSource),
        fabric: prev.fabricSource === 'manual' ? prev.fabric : (detectedFabricObj?.key !== 'padrao' ? detectedFabricObj?.key || prev.fabric : prev.fabric),
        fabricSource: prev.fabricSource === 'manual' ? 'manual' : (detectedFabricObj?.key !== 'padrao' ? 'product_info' : prev.fabricSource),
      };
    });
  };

  const handleProductInfoChange = (val: string) => {
    onChange((prev) => {
      const detectedAutoStretch = prev.stretchSource !== 'manual' ? detectStretch(`${prev.productName} ${val}`) : prev.stretch;
      const detectedFabricObj = prev.fabricSource !== 'manual' ? detectFabric(prev.productName, undefined, val) : null;
      const detectedProdMode = prev.productMode === 'apparel' ? detectProductMode(prev.productName, val) : prev.productMode;
      const defaultBody = detectedProdMode === 'footwear' && prev.body === 'Plus size' ? 'Normal' : prev.body;

      // Se o usuário ainda não digitou um nome de produto ou se veio vazio, extrai o nome curto automaticamente da descrição
      let autoProductName = prev.productName;
      if (!prev.productName.trim()) {
        const extracted = extractShortProductName(val);
        if (extracted) {
          autoProductName = extracted;
        }
      }

      return {
        ...prev,
        productName: autoProductName,
        productInfo: val,
        productMode: detectedProdMode,
        body: defaultBody,
        stretch: prev.stretchSource === 'manual' ? prev.stretch : (detectedAutoStretch !== null ? detectedAutoStretch : prev.stretch),
        stretchSource: prev.stretchSource === 'manual' ? 'manual' : (detectedAutoStretch !== null ? 'product_info' : prev.stretchSource),
        fabric: prev.fabricSource === 'manual' ? prev.fabric : (detectedFabricObj?.key !== 'padrao' ? detectedFabricObj?.key || prev.fabric : prev.fabric),
        fabricSource: prev.fabricSource === 'manual' ? 'manual' : (detectedFabricObj?.key !== 'padrao' ? 'product_info' : prev.fabricSource),
      };
    });
  };

  const handleManualStretchClick = (val: boolean) => {
    onChange((prev) => ({
      ...prev,
      stretch: val,
      stretchSource: 'manual',
    }));
  };

  const handleManualFabricChange = (val: string) => {
    onChange((prev) => ({
      ...prev,
      fabric: val,
      fabricSource: 'manual',
    }));
  };

  const handleAddColor = () => {
    if (form.colors.length >= 3) return;
    onChange((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          id: `color-${Date.now()}`,
          name: '',
        },
      ],
    }));
  };

  const handleRemoveColor = (id: string) => {
    if (form.colors.length <= 1) return;
    onChange((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c.id !== id),
    }));
  };

  const handleColorPhotoUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange((prev) => ({
          ...prev,
          colors: prev.colors.map((c) =>
            c.id === id
              ? {
                  ...c,
                  photoBase64: e.target?.result as string,
                  fileName: file.name,
                }
              : c
          ),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleColorNameChange = (id: string, name: string) => {
    onChange((prev) => ({
      ...prev,
      colors: prev.colors.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  };

  // Validation
  const hasProductName = form.productName.trim().length > 0;
  const hasCor1Photo = Boolean(form.colors[0]?.photoBase64);
  const isStretchSelected = form.stretch !== null;
  const areColorNamesFilled = form.colors.every((c) => !c.photoBase64 || c.name.trim().length > 0);
  const canSubmit = hasProductName && hasCor1Photo && isStretchSelected && areColorNamesFilled && !isProcessing;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 rounded-2xl border border-purple-500/20 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Método Ania — Criação Direta Sem Vídeo Concorrente</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 uppercase font-semibold">
                Fórmula Validada TikTok Shop
              </span>
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Gere automaticamente <strong>3 imagens</strong> (mesma modelo sem rosto em cores diferentes) + <strong>3 prompts de vídeo</strong> do Google Veo + <strong>fala campeã</strong> + <strong>descrição com hashtags</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* 1. Nome do Produto (~65-70% largura da linha) */}
        <div className="md:col-span-8 space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>1. Nome do Produto <strong className="text-rose-400">*</strong></span>
            <span className="text-[11px] text-zinc-500 font-normal">Ex.: calça pantalona duna, tênis esportivo</span>
          </label>
          <input
            type="text"
            value={form.productName}
            onChange={(e) => handleProductNameChange(e.target.value)}
            placeholder="Digite o nome do produto..."
            className="w-full max-w-2xl px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
          />
        </div>

        {/* 2. Tipo de Produto (Roupas vs Calçados) */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>2. Tipo de Produto</span>
            <span className="text-[11px] text-zinc-500 font-normal">Modo</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, productMode: 'apparel' }))}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                form.productMode === 'apparel'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Roupas</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  productMode: 'footwear',
                  body: prev.body === 'Plus size' ? 'Normal' : prev.body,
                }))
              }
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                form.productMode === 'footwear'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Calçados</span>
            </button>
          </div>
        </div>

        {/* 3. Categoria de Roupa (quando roupas) */}
        {form.productMode === 'apparel' && (
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
              <span>Categoria</span>
              <span className="text-[11px] text-zinc-500 font-normal">Tipo da peça</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => onChange((prev) => ({ ...prev, category: e.target.value as AniaCategory }))}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
            >
              <option value="AUTO">✨ Automático (IA detecta)</option>
              <option value="SHORT_SAIA">Short saia</option>
              <option value="BERMUDA_SHORT">Bermuda / Short</option>
              <option value="CALCA">Calça</option>
              <option value="SAIA">Saia</option>
              <option value="VESTIDO">Vestido</option>
              <option value="PIJAMA_CAMISOLA">Pijama / Camisola</option>
              <option value="CONJUNTO">Conjunto</option>
              <option value="BLUSA">Blusa / Camisa</option>
              <option value="MACACAO">Macacão</option>
            </select>
          </div>
        )}

        {/* 4. Faixa Etária (Adulto / Infantil / Idoso) */}
        <div className={form.productMode === 'apparel' ? 'md:col-span-4 space-y-1.5' : 'md:col-span-6 space-y-1.5'}>
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>Faixa Etária</span>
            {form.ageMode === 'child' && (
              <span className="text-[10px] text-amber-400 font-medium">Modo POV Adulto</span>
            )}
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, ageMode: 'adult' }))}
              className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                form.ageMode === 'adult'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Adulto (Padrão)
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, ageMode: 'child' }))}
              className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                form.ageMode === 'child'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Apresentação em primeira pessoa (POV) com mãos de adulto, sem retratar crianças"
            >
              Infantil
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, ageMode: 'senior' }))}
              className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                form.ageMode === 'senior'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Idoso
            </button>
          </div>
        </div>

        {/* 5. Gênero (Mulher / Homem) */}
        <div className={form.productMode === 'apparel' ? 'md:col-span-4 space-y-1.5' : 'md:col-span-6 space-y-1.5'}>
          <label className="text-xs font-bold text-zinc-200">Gênero</label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, gender: 'Mulher' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.gender === 'Mulher'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              👩 Mulher (Padrão)
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, gender: 'Homem' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.gender === 'Homem'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              👨 Homem
            </button>
          </div>
        </div>

        {/* 6. Tipo de Corpo (Plus size / Normal / Magro) */}
        {form.ageMode !== 'child' && (
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-zinc-200">Tipo de Corpo do Modelo</label>
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, body: 'Plus size' }))}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  form.body === 'Plus size'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⭐ Plus size
              </button>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, body: 'Normal' }))}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  form.body === 'Normal'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, body: 'Magro' }))}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  form.body === 'Magro'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Magro
              </button>
            </div>
          </div>
        )}

        {/* 7. Controle de Ambiente Natural (Toggle / Checkbox) */}
        <div className={form.ageMode === 'child' ? 'md:col-span-12 space-y-1.5' : 'md:col-span-6 space-y-1.5'}>
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ambiente Natural (Cenário Nativo)</span>
            </span>
            <span className="text-[10px] text-zinc-400">
              {form.naturalEnvironment ? 'Ativo: cenário de uso' : 'Padrão: casa brasileira'}
            </span>
          </label>
          <div
            onClick={() => onChange((prev) => ({ ...prev, naturalEnvironment: !prev.naturalEnvironment }))}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              form.naturalEnvironment
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={form.naturalEnvironment}
                onChange={() => {}} // handled by parent div
                className="w-4 h-4 text-emerald-600 rounded bg-zinc-800 border-zinc-700 cursor-pointer"
              />
              <span className="text-xs font-semibold">
                Usar local natural de uso do produto (academia, praia, praça, oficina, etc.)
              </span>
            </div>
          </div>
        </div>

        {/* 8. Cores do Produto (1 a 3 cores) */}
        <div className="md:col-span-12 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Cores do Produto (1 a 3 cores) <strong className="text-rose-400">*</strong></span>
              </label>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                As 3 imagens manterão a <strong>mesma modelo</strong> no mesmo enquadramento sem rosto, mudando exclusivamente a cor.
              </p>
            </div>
            {form.colors.length < 3 && (
              <button
                type="button"
                onClick={handleAddColor}
                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar cor</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {form.colors.map((colorItem, idx) => {
              const isCor1 = idx === 0;
              return (
                <div
                  key={colorItem.id}
                  className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span>
                      Cor {idx + 1} {isCor1 ? '— Foto Principal *' : '— Amostra / Foto'}
                    </span>
                    {!isCor1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(colorItem.id)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover cor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Photo upload area */}
                  <div
                    onClick={() => fileInputRefs.current[colorItem.id]?.click()}
                    className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-colors cursor-pointer relative overflow-hidden ${
                      colorItem.photoBase64
                        ? 'border-purple-500/40 bg-zinc-950'
                        : isCor1
                        ? 'border-purple-500/50 hover:border-purple-400 bg-purple-500/5'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950/50'
                    }`}
                  >
                    <input
                      ref={(el) => {
                        fileInputRefs.current[colorItem.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleColorPhotoUpload(colorItem.id, file);
                      }}
                    />

                    {colorItem.photoBase64 ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={colorItem.photoBase64}
                          alt={colorItem.name || `Cor ${idx + 1}`}
                          className="max-h-full max-w-full object-contain rounded"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] font-bold text-white rounded">
                          Trocar foto
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5 text-zinc-400">
                        <Upload className="w-4 h-4 mx-auto text-zinc-500" />
                        <p className="text-[10px] font-medium">
                          {isCor1 ? 'Foto da peça principal' : 'Foto ou amostra de cor'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Color name input (compact width) */}
                  <input
                    type="text"
                    value={colorItem.name}
                    onChange={(e) => handleColorNameChange(colorItem.id, e.target.value)}
                    placeholder={`Nome da cor ${idx + 1}...`}
                    className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-sans"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 9. Tecido estica? (Controle Ultra-Destacado com Cores e Rádio-Bolinha) */}
        <div className="md:col-span-6 space-y-2">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-300 font-extrabold text-sm">
              <span>⚡ Tecido/Material estica?</span>
              <strong className="text-rose-400">*</strong>
            </span>
            {form.stretch !== null && (
              <span className="text-[11px] text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {form.stretchSource === 'product_info' ? '(Detectado da descrição) ' : form.stretchSource === 'local_detect' ? '(Detectado do nome) ' : ''}
                {form.stretch ? 'Sim (com elasticidade)' : 'Não (sem elastano / rígido)'}
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-950 rounded-2xl border-2 border-amber-500/40 shadow-lg">
            {/* Botão SIM (Estica) - Verde / Esmeralda Destacado */}
            <button
              type="button"
              onClick={() => handleManualStretchClick(true)}
              className={`py-3 px-3 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 ${
                form.stretch === true
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-300 shadow-lg shadow-emerald-900/50 scale-[1.02]'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:border-emerald-500/60 hover:text-white'
              }`}
            >
              {/* Rádio-Bolinha Indicadora */}
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  form.stretch === true
                    ? 'border-white bg-white'
                    : 'border-zinc-500 bg-zinc-800'
                }`}
              >
                {form.stretch === true && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 block" />
                )}
              </span>
              <span className="tracking-wide">SIM (Estica)</span>
            </button>

            {/* Botão NÃO (Não Estica) - Violeta / Rosa Destacado */}
            <button
              type="button"
              onClick={() => handleManualStretchClick(false)}
              className={`py-3 px-3 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 ${
                form.stretch === false
                  ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white border-purple-300 shadow-lg shadow-purple-900/50 scale-[1.02]'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:border-purple-500/60 hover:text-white'
              }`}
            >
              {/* Rádio-Bolinha Indicadora */}
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  form.stretch === false
                    ? 'border-white bg-white'
                    : 'border-zinc-500 bg-zinc-800'
                }`}
              >
                {form.stretch === false && (
                  <span className="w-2 h-2 rounded-full bg-purple-600 block" />
                )}
              </span>
              <span className="tracking-wide">NÃO (Não estica)</span>
            </button>
          </div>
        </div>

        {/* 10. Tipo de Tecido / Material (Texto Opcional) */}
        <div className="md:col-span-6 space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>Tipo de Tecido / Material (Opcional)</span>
            {form.fabric && (
              <span className="text-[11px] text-emerald-400 font-medium">
                {form.fabricSource === 'product_info' ? 'Detectado' : 'Definido'}
              </span>
            )}
          </label>
          <input
            type="text"
            value={form.fabric}
            onChange={(e) => handleManualFabricChange(e.target.value)}
            placeholder="Ex.: duna, viscolinho, bengaline, suplex, couro, lona..."
            className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-sans"
          />
        </div>

        {/* 11. Informações do Produto (Textarea Opcional) */}
        <div className="md:col-span-6 space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>Informações do Produto (Opcional)</span>
            <span className="text-[11px] text-zinc-500 font-normal">Extração automática</span>
          </label>
          <textarea
            value={form.productInfo}
            onChange={(e) => handleProductInfoChange(e.target.value)}
            rows={3}
            placeholder="Cole aqui a descrição completa da loja (tecido, composição, elasticidade, bolsos, detalhes)..."
            className="w-full p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-y font-sans leading-relaxed"
          />
        </div>

        {/* 12. Instruções Adicionais (Opcional) */}
        <div className="md:col-span-6 space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>Instruções adicionais (opcional)</span>
            <span className="text-[11px] text-zinc-500 font-normal">Instruções específicas que deseja.</span>
          </label>
          <textarea
            value={form.additionalInstructions}
            onChange={(e) => onChange((prev) => ({ ...prev, additionalInstructions: e.target.value }))}
            rows={3}
            placeholder="Instruções específicas que deseja (detalhe visual, ajuste de cenário, idade exata, etc.)..."
            className="w-full p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-y font-sans leading-relaxed"
          />
        </div>

        {/* 13. Personalizar Falas (Compacto) */}
        <div className="md:col-span-6 space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>Personalizar falas (Opcional)</span>
            <span className="text-[11px] text-zinc-500 font-normal">Se vazio, usa acervo validado</span>
          </label>
          <textarea
            value={form.customSpeech}
            onChange={(e) => onChange((prev) => ({ ...prev, customSpeech: e.target.value }))}
            rows={2}
            placeholder="Deixe vazio para usar automaticamente a fala campeã do acervo, ou digite seu texto..."
            className="w-full p-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-y font-sans leading-relaxed"
          />
        </div>

        {/* 14. Modelo do Veo (Botões de Opção Lado a Lado - Padrão Omni Flash 10s) */}
        <div className="md:col-span-6 space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>Modelo do Veo</span>
            <span className="text-[11px] text-zinc-500 font-normal">Duração por cena</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, veoModelMode: 'veo3_basic_8s' }))}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                form.veoModelMode === 'veo3_basic_8s'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${form.veoModelMode === 'veo3_basic_8s' ? 'border-white bg-white' : 'border-zinc-500'}`}>
                {form.veoModelMode === 'veo3_basic_8s' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
              </span>
              <span>Veo 3 Básico — 8 s</span>
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, veoModelMode: 'veo3_omniflash_10s' }))}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                form.veoModelMode === 'veo3_omniflash_10s'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${form.veoModelMode === 'veo3_omniflash_10s' ? 'border-white bg-white' : 'border-zinc-500'}`}>
                {form.veoModelMode === 'veo3_omniflash_10s' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
              </span>
              <span>Omni Flash — 10 s</span>
            </button>
          </div>
        </div>
      </div>

      {/* Botão Gerar */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all ${
            canSubmit
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer hover:shadow-purple-500/25 scale-[1.01]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
          }`}
        >
          <Sparkles className="w-5 h-5 text-purple-300" />
          <span>
            {isProcessing
              ? 'Processando Método Ania...'
              : 'Gerar 3 Imagens + 3 Prompts de Vídeo (Método Ania)'}
          </span>
        </button>

        {!canSubmit && !isProcessing && (
          <p className="text-center text-[11px] text-zinc-500 mt-2">
            {!hasProductName
              ? '⚠️ Preencha o Nome do produto'
              : !hasCor1Photo
              ? '⚠️ Anexe a foto da Cor 1 (peça/calçado)'
              : !isStretchSelected
              ? '⚠️ Selecione se o tecido estica (Sim / Não)'
              : !areColorNamesFilled
              ? '⚠️ Digite o nome de cada cor que possui foto'
              : ''}
          </p>
        )}
      </div>
    </div>
  );
}
