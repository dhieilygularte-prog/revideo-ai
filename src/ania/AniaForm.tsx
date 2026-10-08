import React, { useState, useRef, useEffect } from 'react';
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
  Mic,
  MicOff,
} from 'lucide-react';
import {
  AniaFormState,
  AniaCategory,
  AniaGender,
  AniaBody,
  ProductMode,
  AgeMode,
} from './types';
import {
  detectStretch,
  detectFabric,
  detectProductMode,
  extractShortProductName,
  detectGender,
  detectAgeMode,
  detectBody,
  detectCategory,
  extractDominantColorFromImage,
  compressAndResizeImage,
} from './aniaLibrary';
import { VeoModelMode } from '../types';

interface AniaFormProps {
  form: AniaFormState;
  onChange: (updater: (prev: AniaFormState) => AniaFormState) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export function AniaForm({ form, onChange, onSubmit, isProcessing }: AniaFormProps) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [detectingColorIds, setDetectingColorIds] = useState<{ [key: string]: boolean }>({});
  const [activeSpeechField, setActiveSpeechField] = useState<'instructions' | 'speech' | null>(null);
  const recognitionRef = useRef<any>(null);
  const instructionsTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const speechTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-expansão dinâmica das caixas de texto conforme o conteúdo cresce
  useEffect(() => {
    if (instructionsTextareaRef.current) {
      instructionsTextareaRef.current.style.height = 'auto';
      instructionsTextareaRef.current.style.height = `${Math.max(64, instructionsTextareaRef.current.scrollHeight)}px`;
    }
  }, [form.additionalInstructions]);

  useEffect(() => {
    if (speechTextareaRef.current) {
      speechTextareaRef.current.style.height = 'auto';
      speechTextareaRef.current.style.height = `${Math.max(64, speechTextareaRef.current.scrollHeight)}px`;
    }
  }, [form.customSpeech]);

  // Função para alternar gravação de voz (Ditado)
  const toggleSpeechRecognition = (field: 'instructions' | 'speech') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('O recurso de reconhecimento de voz não é suportado pelo seu navegador.');
      return;
    }

    if (activeSpeechField === field) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setActiveSpeechField(null);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }

        if (finalTranscript) {
          if (field === 'instructions') {
            onChange((prev) => ({
              ...prev,
              additionalInstructions: (prev.additionalInstructions ? prev.additionalInstructions.trim() + ' ' : '') + finalTranscript.trim(),
            }));
          } else {
            onChange((prev) => ({
              ...prev,
              customSpeech: (prev.customSpeech ? prev.customSpeech.trim() + ' ' : '') + finalTranscript.trim(),
            }));
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setActiveSpeechField(null);
      };

      recognition.onend = () => {
        setActiveSpeechField((current) => (current === field ? null : current));
      };

      recognitionRef.current = recognition;
      recognition.start();
      setActiveSpeechField(field);
    } catch (err) {
      console.error('Erro ao iniciar reconhecimento de voz:', err);
      setActiveSpeechField(null);
    }
  };

  const handleProductNameChange = (val: string) => {
    onChange((prev) => {
      const detectedProdMode = detectProductMode(val, prev.productInfo);
      const isFootwear = (prev.productModeSource === 'manual' ? prev.productMode : (detectedProdMode || prev.productMode)) === 'footwear';
      const defaultBody = isFootwear && prev.body === 'Plus size' ? 'Normal' : prev.body;
      const detectedGen = detectGender(val, prev.productInfo);
      const detectedAge = detectAgeMode(val, prev.productInfo);
      const detectedBodyVal = detectBody(val, prev.productInfo);
      const detectedAutoStretch = isFootwear ? false : detectStretch(`${val} ${prev.productInfo}`);
      const detectedFabricObj = detectFabric(val, undefined, prev.productInfo);
      const detectedCatResult = detectCategory(val, prev.productInfo);

      let newCategory = prev.category;
      let newCategorySource = prev.categorySource;
      if (prev.categorySource !== 'manual') {
        if (detectedCatResult.category !== 'AUTO' && detectedCatResult.category !== 'CALCADO') {
          newCategory = detectedCatResult.category;
          newCategorySource = 'local_detect';
        } else {
          newCategory = 'AUTO';
          newCategorySource = undefined;
        }
      }

      return {
        ...prev,
        productName: val,
        productNameSource: val.trim() ? 'manual' : undefined,
        category: newCategory,
        categorySource: newCategorySource,
        productMode: prev.productModeSource === 'manual' ? prev.productMode : (detectedProdMode || prev.productMode),
        productModeSource: prev.productModeSource === 'manual' ? 'manual' : (detectedProdMode ? 'local_detect' : undefined),
        gender: prev.genderSource === 'manual' ? prev.gender : (detectedGen || prev.gender),
        genderSource: prev.genderSource === 'manual' ? 'manual' : (detectedGen ? 'local_detect' : undefined),
        ageMode: prev.ageModeSource === 'manual' ? prev.ageMode : (detectedAge || prev.ageMode),
        ageModeSource: prev.ageModeSource === 'manual' ? 'manual' : (detectedAge ? 'local_detect' : undefined),
        body: prev.bodySource === 'manual' ? prev.body : (isFootwear ? 'Normal' : (detectedBodyVal || 'Plus size')),
        bodySource: prev.bodySource === 'manual' ? 'manual' : (isFootwear || detectedProdMode || detectedBodyVal ? 'local_detect' : undefined),
        naturalEnvironment: isFootwear && prev.naturalEnvSource !== 'manual' ? true : prev.naturalEnvironment,
        naturalEnvSource: isFootwear && prev.naturalEnvSource !== 'manual' ? 'local_detect' : prev.naturalEnvSource,
        stretch: prev.stretchSource === 'manual' ? prev.stretch : (isFootwear ? false : (detectedAutoStretch !== null ? detectedAutoStretch : prev.stretch)),
        stretchSource: prev.stretchSource === 'manual' ? 'manual' : (isFootwear ? 'local_detect' : (detectedAutoStretch !== null ? 'local_detect' : undefined)),
        fabric: prev.fabricSource === 'manual' ? prev.fabric : (detectedFabricObj.detected ? detectedFabricObj.key : prev.fabric),
        fabricSource: prev.fabricSource === 'manual' ? 'manual' : (detectedFabricObj.detected ? 'product_info' : undefined),
      };
    });
  };

  const handleProductInfoChange = (val: string) => {
    onChange((prev) => {
      // 1. Extrai o nome curto APENAS se for um produto reconhecido
      const extractedProdName = extractShortProductName(val);
      let autoProductName = prev.productName;
      let newProductNameSource = prev.productNameSource;
      if (prev.productNameSource !== 'manual') {
        autoProductName = extractedProdName;
        newProductNameSource = extractedProdName ? 'local_detect' : undefined;
      }

      // 2. Detecta Tipo de Produto (Calçados vs Roupas)
      const detectedProdMode = detectProductMode(autoProductName, val);
      let newProductMode = prev.productMode;
      let newProductModeSource = prev.productModeSource;
      if (prev.productModeSource !== 'manual') {
        if (detectedProdMode !== null) {
          newProductMode = detectedProdMode;
          newProductModeSource = 'local_detect';
        } else {
          newProductMode = 'apparel';
          newProductModeSource = undefined;
        }
      }
      const isFootwear = newProductMode === 'footwear';

      // 3. Detecta Categoria
      const detectedCatResult = detectCategory(autoProductName, val);
      let newCategory = prev.category;
      let newCategorySource = prev.categorySource;
      if (prev.categorySource !== 'manual') {
        if (detectedCatResult.category !== 'AUTO' && detectedCatResult.category !== 'CALCADO') {
          newCategory = detectedCatResult.category;
          newCategorySource = 'local_detect';
        } else {
          newCategory = 'AUTO';
          newCategorySource = undefined;
        }
      }

      // 4. Detecta Gênero
      const detectedGen = detectGender(autoProductName, val);
      let newGender = prev.gender;
      let newGenderSource = prev.genderSource;
      if (prev.genderSource !== 'manual') {
        if (detectedGen !== null) {
          newGender = detectedGen;
          newGenderSource = 'local_detect';
        } else {
          newGender = 'Mulher';
          newGenderSource = undefined;
        }
      }

      // 5. Detecta Faixa Etária
      const detectedAge = detectAgeMode(autoProductName, val);
      let newAgeMode = prev.ageMode;
      let newAgeModeSource = prev.ageModeSource;
      if (prev.ageModeSource !== 'manual') {
        if (detectedAge !== null) {
          newAgeMode = detectedAge;
          newAgeModeSource = 'local_detect';
        } else {
          newAgeMode = 'adult';
          newAgeModeSource = undefined;
        }
      }

      // 6. Detecta Tipo de Corpo
      const detectedBodyVal = detectBody(autoProductName, val);
      let newBody = isFootwear ? 'Normal' : 'Plus size';
      let newBodySource = prev.bodySource;
      if (prev.bodySource !== 'manual') {
        if (isFootwear) {
          newBody = 'Normal';
          newBodySource = 'local_detect';
        } else if (detectedProdMode === 'apparel' || detectedBodyVal !== null) {
          newBody = detectedBodyVal || 'Plus size';
          newBodySource = 'local_detect';
        } else {
          newBody = 'Plus size';
          newBodySource = undefined;
        }
      }

      // 7. Detecta Cenário Natural
      let newNaturalEnv = prev.naturalEnvironment;
      let newNaturalEnvSource = prev.naturalEnvSource;
      if (prev.naturalEnvSource !== 'manual') {
        if (isFootwear && detectedProdMode === 'footwear') {
          newNaturalEnv = true;
          newNaturalEnvSource = 'local_detect';
        } else {
          newNaturalEnv = false;
          newNaturalEnvSource = undefined;
        }
      }

      // 8. Detecta Elasticidade
      const detectedAutoStretch = isFootwear ? false : detectStretch(`${autoProductName} ${val}`);
      let newStretch = prev.stretch;
      let newStretchSource = prev.stretchSource;
      if (prev.stretchSource !== 'manual') {
        if (isFootwear && detectedProdMode === 'footwear') {
          newStretch = false;
          newStretchSource = 'local_detect';
        } else if (detectedAutoStretch !== null) {
          newStretch = detectedAutoStretch;
          newStretchSource = 'local_detect';
        } else {
          newStretch = null;
          newStretchSource = undefined;
        }
      }

      // 9. Detecta Tecido
      const detectedFabricObj = detectFabric(autoProductName, undefined, val);
      let newFabric = prev.fabric;
      let newFabricSource = prev.fabricSource;
      if (prev.fabricSource !== 'manual') {
        if (detectedFabricObj.detected && detectedFabricObj.key !== 'padrao') {
          newFabric = detectedFabricObj.key;
          newFabricSource = 'product_info';
        } else {
          newFabric = '';
          newFabricSource = undefined;
        }
      }

      return {
        ...prev,
        productName: autoProductName,
        productNameSource: newProductNameSource,
        productInfo: val,
        category: newCategory,
        categorySource: newCategorySource,
        productMode: newProductMode,
        productModeSource: newProductModeSource,
        gender: newGender,
        genderSource: newGenderSource,
        ageMode: newAgeMode,
        ageModeSource: newAgeModeSource,
        body: newBody,
        bodySource: newBodySource,
        naturalEnvironment: newNaturalEnv,
        naturalEnvSource: newNaturalEnvSource,
        stretch: newStretch,
        stretchSource: newStretchSource,
        fabric: newFabric,
        fabricSource: newFabricSource,
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

  const handleColorPhotoUpload = async (id: string, file: File) => {
    try {
      const base64 = await compressAndResizeImage(file, 1536, 0.88);
      if (!base64) return;

      // 1. Atualiza a foto imediatamente no estado
      onChange((prev) => ({
        ...prev,
        colors: prev.colors.map((c) =>
          c.id === id
            ? {
                ...c,
                photoBase64: base64,
                fileName: file.name,
              }
            : c
        ),
      }));

      // 2. Extração instantânea de cor no navegador (fallback garantido em 50ms)
      try {
        const instantColor = await extractDominantColorFromImage(base64);
        if (instantColor) {
          onChange((prev) => ({
            ...prev,
            colors: prev.colors.map((c) =>
              c.id === id
                ? {
                    ...c,
                    name: c.name.trim() ? c.name : instantColor,
                  }
                : c
            ),
          }));
        }
      } catch (colorErr) {
        console.warn('Falha na extração de cor local:', colorErr);
      }

      // 3. Refinamento via IA de visão em background
      setDetectingColorIds((prev) => ({ ...prev, [id]: true }));
      try {
        const res = await fetch('/api/detect-dominant-color', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoBase64: base64,
            productName: form.productName,
            productMode: form.productMode,
          }),
        });
        if (res.ok) {
          const raw = await res.text();
          try {
            const data = JSON.parse(raw);
            if (data.success && data.color) {
              onChange((prev) => ({
                ...prev,
                colors: prev.colors.map((c) =>
                  c.id === id
                    ? {
                        ...c,
                        name: data.color,
                      }
                    : c
                ),
              }));
            }
          } catch (jsonErr) {
            console.warn('Resposta não-JSON na detecção de cor:', raw);
          }
        }
      } catch (err) {
        console.warn('Detecção de cor via IA finalizada com fallback local:', err);
      } finally {
        setDetectingColorIds((prev) => ({ ...prev, [id]: false }));
      }
    } catch (err) {
      console.error('Erro ao processar imagem de cor:', err);
    }
  };

  const handleColorNameChange = (id: string, name: string) => {
    onChange((prev) => ({
      ...prev,
      colors: prev.colors.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  };

  // Validation & Identification Booleans
  const hasProductInfo = form.productInfo.trim().length > 0;
  const hasProductName = form.productName.trim().length > 0;
  const isProductNameIdentified = form.productName.trim().length > 0 && (form.productNameSource === 'manual' || form.productNameSource === 'local_detect' || form.productNameSource === 'product_info');
  const isProductModeIdentified = form.productModeSource === 'manual' || (form.productModeSource === 'local_detect' && detectProductMode(form.productName, form.productInfo) !== null);
  const isCategoryIdentified = form.categorySource === 'manual' || (form.categorySource === 'local_detect' && form.category !== 'AUTO');
  const isAgeModeIdentified = form.ageModeSource === 'manual' || (form.ageModeSource === 'local_detect' && detectAgeMode(form.productName, form.productInfo) !== null);
  const isGenderIdentified = form.genderSource === 'manual' || (form.genderSource === 'local_detect' && detectGender(form.productName, form.productInfo) !== null);
  const isBodyIdentified = form.bodySource === 'manual' || (form.bodySource === 'local_detect' && (form.productMode === 'footwear' || detectBody(form.productName, form.productInfo) !== null));
  const isNaturalEnvIdentified = form.naturalEnvSource === 'manual' || (form.naturalEnvSource === 'local_detect' && form.naturalEnvironment);
  const isStretchIdentified = form.stretch !== null && (form.stretchSource === 'manual' || form.stretchSource === 'local_detect' || form.stretchSource === 'product_info');
  const isFabricIdentified = form.fabric.trim().length > 0 && (form.fabricSource === 'manual' || form.fabricSource === 'product_info' || form.fabricSource === 'local_detect');
  const isInstructionsIdentified = form.additionalInstructions.trim().length > 0;
  const isCustomSpeechIdentified = form.customSpeech.trim().length > 0;
  const hasCor1Photo = Boolean(form.colors[0]?.photoBase64);
  const isStretchSelected = form.stretch !== null;
  const areColorNamesFilled = form.colors.every((c) => !c.photoBase64 || c.name.trim().length > 0);
  const canSubmit = form.productName.trim().length > 0 && hasCor1Photo && isStretchSelected && areColorNamesFilled && !isProcessing;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* 1. Informações do Produto (Descrição da Loja - Topo para Auto-Preenchimento) */}
        <div
          className={`md:col-span-12 p-4 rounded-2xl transition-all duration-300 space-y-1.5 ${
            hasProductInfo
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40'
              : 'bg-zinc-700/80 border-2 border-zinc-400/90 shadow-lg shadow-zinc-950/20'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={hasProductInfo ? 'text-white font-extrabold' : 'text-zinc-100 font-extrabold'}>1. Informações do Produto (Cole aqui a descrição da loja)</span>
              {hasProductInfo && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2.5 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Preenchido ✓
                </span>
              )}
            </span>
            <span className={`text-[11px] font-medium ${hasProductInfo ? 'text-sky-200/90' : 'text-zinc-200'}`}>
              Preenche nome, categoria, faixa etária e elasticidade automaticamente
            </span>
          </label>
          <textarea
            value={form.productInfo}
            onChange={(e) => handleProductInfoChange(e.target.value)}
            rows={3}
            placeholder="Cole aqui a descrição do produto (ex: 'Tênis Esportivo Masculino Confortável...', 'Vestido infantil floral...', 'Calça pantalona duna com elastano')..."
            className={`w-full p-2.5 rounded-xl text-xs text-white placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-y font-sans leading-relaxed transition-colors ${
              hasProductInfo
                ? 'bg-slate-950/80 border border-sky-400/60 focus:border-sky-300'
                : 'bg-zinc-800/90 border border-zinc-400 focus:border-sky-300'
            }`}
          />
        </div>

        {/* 2. Nome do Produto */}
        <div
          className={`md:col-span-8 p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isProductNameIdentified
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40'
              : 'bg-zinc-900/70 border border-zinc-800/90'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={isProductNameIdentified ? 'text-white' : 'text-zinc-200'}>2. Nome do Produto <strong className="text-rose-400">*</strong></span>
              {isProductNameIdentified && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Preenchido ✓
                </span>
              )}
            </span>
            <span className={`text-[11px] font-normal ${isProductNameIdentified ? 'text-sky-200/90' : 'text-zinc-400'}`}>Nome curto (editável)</span>
          </label>
          <input
            type="text"
            value={form.productName}
            onChange={(e) => handleProductNameChange(e.target.value)}
            placeholder="Digite ou confira o nome do produto..."
            className={`w-full px-3.5 py-2 rounded-xl text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors ${
              isProductNameIdentified
                ? 'bg-slate-950/80 border border-sky-400/60 focus:border-sky-300'
                : 'bg-zinc-950 border border-zinc-700/80 focus:border-purple-500'
            }`}
          />
        </div>

        {/* 3. Tipo de Produto (Roupas vs Calçados) */}
        <div
          className={`md:col-span-4 p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isProductModeIdentified
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40 text-white'
              : 'bg-zinc-900/70 border border-zinc-800/90 text-zinc-200'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={isProductModeIdentified ? 'text-white' : 'text-zinc-200'}>3. Tipo de Produto</span>
              {isProductModeIdentified && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Ativo ✓
                </span>
              )}
            </span>
            <span className={`text-[11px] font-normal ${isProductModeIdentified ? 'text-sky-200/90' : 'text-zinc-400'}`}>Modo</span>
          </label>
          <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
            isProductModeIdentified ? 'bg-slate-950/80 border-sky-400/40' : 'bg-zinc-950 border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, productMode: 'apparel', productModeSource: 'manual' }))}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                form.productMode === 'apparel'
                  ? (isProductModeIdentified ? 'bg-sky-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
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
                  productModeSource: 'manual',
                  body: prev.body === 'Plus size' ? 'Normal' : prev.body,
                  bodySource: prev.body === 'Plus size' ? 'manual' : prev.bodySource,
                  naturalEnvironment: true,
                  naturalEnvSource: 'manual',
                  stretch: false,
                  stretchSource: 'manual',
                }))
              }
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                form.productMode === 'footwear'
                  ? (isProductModeIdentified ? 'bg-sky-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Calçados</span>
            </button>
          </div>
        </div>

        {/* 4. Categoria de Roupa (quando roupas) */}
        {form.productMode === 'apparel' && (
          <div
            className={`md:col-span-4 p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
              isCategoryIdentified
                ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40 text-white'
                : 'bg-zinc-900/70 border border-zinc-800/90 text-zinc-200'
            }`}
          >
            <label className="text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className={isCategoryIdentified ? 'text-white' : 'text-zinc-200'}>4. Categoria</span>
                {isCategoryIdentified && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Ativo ✓
                  </span>
                )}
              </span>
              <span className={`text-[11px] font-normal ${isCategoryIdentified ? 'text-sky-200/90' : 'text-zinc-400'}`}>Tipo da peça</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => onChange((prev) => ({ ...prev, category: e.target.value as AniaCategory, categorySource: 'manual' }))}
              className={`w-full px-3 py-2 rounded-xl text-xs text-white focus:outline-none cursor-pointer border ${
                isCategoryIdentified
                  ? 'bg-slate-950/80 border-sky-400/60 focus:border-sky-300 focus:ring-1 focus:ring-sky-400'
                  : 'bg-zinc-950 border-zinc-700/80 focus:border-purple-500'
              }`}
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

        {/* 5. Faixa Etária (Adulto / Infantil / Idoso) */}
        <div
          className={`${form.productMode === 'apparel' ? 'md:col-span-4' : 'md:col-span-6'} p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isAgeModeIdentified
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40 text-white'
              : 'bg-zinc-900/70 border border-zinc-800/90 text-zinc-200'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={isAgeModeIdentified ? 'text-white' : 'text-zinc-200'}>5. Faixa Etária</span>
              {isAgeModeIdentified && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Definido ✓
                </span>
              )}
            </span>
            {form.ageMode === 'child' ? (
              <span className="text-[10px] text-amber-300 font-bold">
                {form.productMode === 'footwear' ? 'Pés e pernas infantis (sem rosto)' : 'Modo POV Adulto'}
              </span>
            ) : (
              <span className={`text-[11px] font-normal ${isAgeModeIdentified ? 'text-sky-200/90' : 'text-zinc-400'}`}>Público</span>
            )}
          </label>
          <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl border ${
            isAgeModeIdentified ? 'bg-slate-950/80 border-sky-400/40' : 'bg-zinc-950 border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, ageMode: 'adult', ageModeSource: 'manual' }))}
              className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                form.ageMode === 'adult'
                  ? (isAgeModeIdentified ? 'bg-sky-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Adulto
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, ageMode: 'child', ageModeSource: 'manual' }))}
              className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                form.ageMode === 'child'
                  ? (isAgeModeIdentified ? 'bg-sky-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={form.productMode === 'footwear' ? 'Pés e pernas infantis sem mostrar rosto' : 'Apresentação em primeira pessoa (POV) com mãos de adulto'}
            >
              Infantil
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, ageMode: 'senior', ageModeSource: 'manual' }))}
              className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                form.ageMode === 'senior'
                  ? (isAgeModeIdentified ? 'bg-sky-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Idoso
            </button>
          </div>
        </div>

        {/* 6. Gênero (Mulher / Homem) */}
        <div
          className={`${form.productMode === 'apparel' ? 'md:col-span-4' : 'md:col-span-6'} p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isGenderIdentified
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40 text-white'
              : 'bg-zinc-900/70 border border-zinc-800/90 text-zinc-200'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={isGenderIdentified ? 'text-white' : 'text-zinc-200'}>6. Gênero</span>
              {isGenderIdentified && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Definido ✓
                </span>
              )}
            </span>
            <span className={`text-[11px] font-normal ${isGenderIdentified ? 'text-sky-200/90' : 'text-zinc-400'}`}>{form.gender === 'Homem' ? 'Masculino' : 'Feminino'}</span>
          </label>
          <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
            isGenderIdentified ? 'bg-slate-950/80 border-sky-400/40' : 'bg-zinc-950 border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, gender: 'Mulher', genderSource: 'manual' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.gender === 'Mulher'
                  ? (isGenderIdentified ? 'bg-sky-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              👩 Mulher (Padrão)
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, gender: 'Homem', genderSource: 'manual' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.gender === 'Homem'
                  ? (isGenderIdentified ? 'bg-sky-500 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              👨 Homem
            </button>
          </div>
        </div>

        {/* 7. Tipo de Corpo (Plus size / Normal / Magro) */}
        {form.ageMode !== 'child' && (
          <div
            className={`md:col-span-6 p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
              isBodyIdentified
                ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40 text-white'
                : 'bg-zinc-900/70 border border-zinc-800/90 text-zinc-200'
            }`}
          >
            <label className="text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className={isBodyIdentified ? 'text-white' : 'text-zinc-200'}>7. Tipo de Corpo do Modelo</span>
                {isBodyIdentified && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Definido ✓
                  </span>
                )}
              </span>
              <span className={`text-[11px] font-normal ${isBodyIdentified ? 'text-sky-200/90' : 'text-zinc-400'}`}>{form.body}</span>
            </label>
            <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl border ${
              isBodyIdentified ? 'bg-slate-950/80 border-sky-400/40' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, body: 'Plus size', bodySource: 'manual' }))}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  form.body === 'Plus size'
                    ? (isBodyIdentified ? 'bg-emerald-600 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⭐ Plus size
              </button>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, body: 'Normal', bodySource: 'manual' }))}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  form.body === 'Normal'
                    ? (isBodyIdentified ? 'bg-emerald-600 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, body: 'Magro', bodySource: 'manual' }))}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  form.body === 'Magro'
                    ? (isBodyIdentified ? 'bg-emerald-600 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Magro
              </button>
            </div>
          </div>
        )}

        {/* 8. Controle de Ambiente Natural (Toggle / Checkbox com Destaque Visual) */}
        <div
          className={`${form.ageMode === 'child' ? 'md:col-span-12' : 'md:col-span-6'} p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isNaturalEnvIdentified
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40 text-white'
              : 'bg-zinc-900/70 border border-zinc-800/90 text-zinc-200'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span className={isNaturalEnvIdentified ? 'text-white font-bold' : 'text-zinc-200 font-bold'}>8. Ambiente Natural (Cenário Nativo)</span>
              {isNaturalEnvIdentified && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Definido ✓
                </span>
              )}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
              form.naturalEnvironment
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {form.naturalEnvironment ? '🌿 Cenário de Uso Ativo' : '🏠 Casa Brasileira (Padrão)'}
            </span>
          </label>
          <div
            onClick={() => onChange((prev) => ({ ...prev, naturalEnvironment: !prev.naturalEnvironment, naturalEnvSource: 'manual' }))}
            className={`p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all shadow-sm ${
              form.naturalEnvironment
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100 shadow-emerald-950/40 scale-[1.01]'
                : isNaturalEnvIdentified
                ? 'bg-slate-950/80 border-sky-400/60 text-white hover:border-emerald-500/40'
                : 'bg-zinc-950 border-zinc-700/80 text-zinc-300 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  form.naturalEnvironment
                    ? 'border-emerald-400 bg-emerald-500 text-white'
                    : 'border-zinc-500 bg-zinc-800'
                }`}
              >
                {form.naturalEnvironment && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
              </div>
              <span className="text-xs font-semibold">
                Usar local natural de uso do produto (academia, praia, praça, oficina, etc.)
              </span>
            </div>
          </div>
        </div>

        {/* 9. Cores do Produto (1 a 3 cores) */}
        <div
          className={`md:col-span-12 p-4 rounded-2xl transition-all duration-300 space-y-2.5 ${
            hasCor1Photo
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40'
              : 'bg-zinc-900/70 border border-zinc-800/90'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Layers className={`w-4 h-4 ${hasCor1Photo ? 'text-sky-300' : 'text-purple-400'}`} />
                <span className={hasCor1Photo ? 'text-white' : 'text-zinc-200'}>
                  9. Cores do Produto (1 a 3 cores) <strong className="text-rose-400">*</strong>
                </span>
                {hasCor1Photo && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Foto Anexada ✓
                  </span>
                )}
              </label>
              <p className={`text-[11px] mt-0.5 ${hasCor1Photo ? 'text-sky-200/90' : 'text-zinc-400'}`}>
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
              const isColorFilled = Boolean(colorItem.photoBase64 && colorItem.name.trim());
              return (
                <div
                  key={colorItem.id}
                  className={`p-3 rounded-xl border space-y-2.5 relative group transition-all duration-200 ${
                    isColorFilled
                      ? 'bg-slate-900/90 border-2 border-sky-400/80 shadow-md shadow-sky-950/40 ring-1 ring-sky-400/30'
                      : 'bg-zinc-950/90 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <span className={isColorFilled ? 'text-white' : ''}>
                        Cor {idx + 1} {isCor1 ? '— Foto Principal *' : '— Amostra / Foto'}
                      </span>
                      {isColorFilled && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
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
                        ? 'border-sky-400/70 bg-zinc-950'
                        : isCor1
                        ? 'border-sky-400/70 hover:border-sky-300 bg-sky-500/10'
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

                  {/* Color name input with auto-detection feedback */}
                  <div className="relative">
                    <input
                      type="text"
                      value={colorItem.name}
                      onChange={(e) => handleColorNameChange(colorItem.id, e.target.value)}
                      placeholder={
                        detectingColorIds[colorItem.id]
                          ? 'Detectando cor...'
                          : `Nome da cor ${idx + 1}...`
                      }
                      className={`w-full px-2 py-1.5 bg-zinc-950 border rounded-lg text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-sans transition-all ${
                        detectingColorIds[colorItem.id]
                          ? 'border-sky-400/80 pr-7 text-sky-200 animate-pulse bg-sky-950/30'
                          : colorItem.name.trim()
                          ? 'border-sky-400/60'
                          : 'border-zinc-700/80'
                      }`}
                    />
                    {detectingColorIds[colorItem.id] && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sky-400">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 10. Tecido estica? (Controle Compacto e Claro) */}
        <div
          className={`md:col-span-6 p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isStretchSelected
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40'
              : 'bg-zinc-900/70 border border-zinc-800/90'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={isStretchSelected ? 'text-white' : 'text-zinc-200'}>10. Tecido/Material estica?</span>
              <strong className="text-rose-400">*</strong>
              {isStretchSelected && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Definido ✓
                </span>
              )}
            </span>
            {form.stretch !== null && (
              <span className="text-[11px] text-sky-100 font-semibold bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-400/40">
                {form.stretch ? 'Sim (com elasticidade)' : 'Não (sem elastano / rígido)'}
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-700/80">
            {/* Botão SIM (Estica) */}
            <button
              type="button"
              onClick={() => handleManualStretchClick(true)}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                form.stretch === true
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                  form.stretch === true
                    ? 'border-white bg-white'
                    : 'border-zinc-500 bg-zinc-800'
                }`}
              >
                {form.stretch === true && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                )}
              </span>
              <span>SIM (Estica)</span>
            </button>

            {/* Botão NÃO (Não Estica) */}
            <button
              type="button"
              onClick={() => handleManualStretchClick(false)}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                form.stretch === false
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                  form.stretch === false
                    ? 'border-white bg-white'
                    : 'border-zinc-500 bg-zinc-800'
                }`}
              >
                {form.stretch === false && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 block" />
                )}
              </span>
              <span>NÃO (Não estica)</span>
            </button>
          </div>
        </div>

        {/* 11. Tipo de Tecido / Material (Texto Opcional) */}
        <div
          className={`md:col-span-6 p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isFabricIdentified
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40'
              : 'bg-zinc-900/70 border border-zinc-800/90'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={isFabricIdentified ? 'text-white' : 'text-zinc-200'}>11. Tipo de Tecido / Material (Opcional)</span>
              {isFabricIdentified && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> {form.fabricSource === 'product_info' ? 'Identificado ✓' : 'Definido ✓'}
                </span>
              )}
            </span>
            <span className={`text-[11px] font-normal ${isFabricIdentified ? 'text-sky-200/90' : 'text-zinc-500'}`}>
              {isFabricIdentified ? 'Auto-detectado da descrição' : 'Ex: duna, alfaiataria, linho...'}
            </span>
          </label>
          <input
            type="text"
            value={form.fabric}
            onChange={(e) => handleManualFabricChange(e.target.value)}
            placeholder="Ex.: duna, alfaiataria, viscolinho, bengaline, suplex, couro, lona..."
            className={`w-full px-3.5 py-2 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none font-sans transition-all ${
              isFabricIdentified
                ? 'bg-slate-950/80 border border-sky-400/60 focus:border-sky-300 focus:ring-1 focus:ring-sky-400'
                : 'bg-zinc-950 border border-zinc-700/80 focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
            }`}
          />
        </div>

        {/* 12. Instruções Adicionais (Opcional) */}
        <div
          className={`md:col-span-6 p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isInstructionsIdentified
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40'
              : 'bg-zinc-900/70 border border-zinc-800/90'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={isInstructionsIdentified ? 'text-white' : 'text-zinc-200'}>12. Instruções adicionais (Opcional)</span>
              {isInstructionsIdentified && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Preenchido ✓
                </span>
              )}
            </span>
            <span className={`text-[11px] font-normal ${isInstructionsIdentified ? 'text-sky-200/90' : 'text-zinc-500'}`}>Ajustes específicos</span>
          </label>
          <div className="relative">
            <textarea
              ref={instructionsTextareaRef}
              value={form.additionalInstructions}
              onChange={(e) => {
                onChange((prev) => ({ ...prev, additionalInstructions: e.target.value }));
              }}
              rows={2}
              placeholder="Instruções específicas que deseja (detalhe visual, ajuste de cenário, idade exata, etc.)..."
              className={`w-full p-2.5 pr-11 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400 font-sans leading-relaxed transition-all resize-none overflow-hidden ${
                isInstructionsIdentified
                  ? 'bg-slate-950/80 border border-sky-400/60 focus:border-sky-300'
                  : 'bg-zinc-950 border border-zinc-700/80 focus:border-sky-400'
              }`}
              style={{ minHeight: '64px' }}
            />
            <button
              type="button"
              onClick={() => toggleSpeechRecognition('instructions')}
              className={`absolute right-2 top-2 p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                activeSpeechField === 'instructions'
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400 scale-105'
                  : 'bg-zinc-800/90 text-purple-400 hover:text-white hover:bg-zinc-700 border border-zinc-700/80'
              }`}
              title={activeSpeechField === 'instructions' ? 'Ouvindo... Clique para parar' : 'Ditar instruções por voz'}
            >
              {activeSpeechField === 'instructions' ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-purple-400" />
              )}
            </button>
          </div>
        </div>

        {/* 13. Personalizar ROTEIRO (opcional) */}
        <div
          className={`md:col-span-6 p-3.5 rounded-2xl transition-all duration-300 space-y-1.5 ${
            isCustomSpeechIdentified
              ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40'
              : 'bg-zinc-900/70 border border-zinc-800/90'
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={isCustomSpeechIdentified ? 'text-white' : 'text-zinc-200'}>13. Personalizar ROTEIRO (opcional)</span>
              {isCustomSpeechIdentified && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> Personalizado ✓
                </span>
              )}
            </span>
            <span className={`text-[11px] font-normal ${isCustomSpeechIdentified ? 'text-sky-200/90' : 'text-zinc-500'}`}>Se vazio, usa acervo validado</span>
          </label>
          <div className="relative">
            <textarea
              ref={speechTextareaRef}
              value={form.customSpeech}
              onChange={(e) => {
                onChange((prev) => ({ ...prev, customSpeech: e.target.value }));
              }}
              rows={2}
              placeholder="Deixe vazio para usar automaticamente a fala campeã do acervo, ou dite/digite seu roteiro..."
              className={`w-full p-2.5 pr-11 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400 font-sans leading-relaxed transition-all resize-none overflow-hidden ${
                isCustomSpeechIdentified
                  ? 'bg-slate-950/80 border border-sky-400/60 focus:border-sky-300'
                  : 'bg-zinc-950 border border-zinc-700/80 focus:border-sky-400'
              }`}
              style={{ minHeight: '64px' }}
            />
            <button
              type="button"
              onClick={() => toggleSpeechRecognition('speech')}
              className={`absolute right-2 top-2 p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                activeSpeechField === 'speech'
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400 scale-105'
                  : 'bg-zinc-800/90 text-purple-400 hover:text-white hover:bg-zinc-700 border border-zinc-700/80'
              }`}
              title={activeSpeechField === 'speech' ? 'Ouvindo... Clique para parar' : 'Ditar roteiro por voz'}
            >
              {activeSpeechField === 'speech' ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-purple-400" />
              )}
            </button>
          </div>
        </div>

        {/* 14. Modelo do Veo (Duração por cena) */}
        <div className="md:col-span-12 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
            <span>14. Modelo do Veo</span>
            <span className="text-[11px] text-zinc-500 font-normal">Duração por cena</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
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
