import React, { useRef, useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Package,
  Shirt,
  Footprints,
  Lock,
  Check,
  Wand2,
} from 'lucide-react';
import {
  Produtos2FormState,
  Produtos2Variation,
  Produtos2SubMode,
  Produtos2MaleSubOption,
} from './types';
import {
  analyzeProductInfoForProdutos2,
  selectAndAdaptProdutos2Copy,
} from './produtos2CopyBank';
import { AIProfile } from '../config/aiProfiles';

interface Produtos2FormProps {
  form: Produtos2FormState;
  onChange: React.Dispatch<React.SetStateAction<Produtos2FormState>>;
  onSubmit: () => void;
  isProcessing: boolean;
  aiProfile?: AIProfile;
}

/**
 * Compressor de imagem independente para o Modo Produtos 2.0 (Regra Zero: isolado do Modo Ania)
 */
async function compressImageForProdutos2(
  file: File,
  maxDimension = 1536,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || '';
      if (!dataUrl) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export const Produtos2Form: React.FC<Produtos2FormProps> = ({
  form,
  onChange,
  onSubmit,
  isProcessing,
  aiProfile = 'openai',
}) => {
  const [activeMic, setActiveMic] = useState<'info' | 'copy' | 'instructions' | 'banco' | 'aurora' | null>(null);
  const [isGeneratingSpeeches, setIsGeneratingSpeeches] = useState(false);
  const [speechesError, setSpeechesError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const debounceTimerRef = useRef<number | null>(null);
  const copyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const instructionsTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleGenerateSpeeches = async () => {
    setIsGeneratingSpeeches(true);
    setSpeechesError(null);

    try {
      const finalProductName = (form.productName.trim() || 'Produto').trim();

      // 1. Fala 1 — Banco de Copies (adaptada para o produto e duração)
      const copySelection = selectAndAdaptProdutos2Copy({
        subMode: form.subMode,
        maleSubOption: form.maleSubOption,
        productName: finalProductName,
        productInfo: form.productInfo,
        duration: form.duration,
        customCopy: form.customCopy,
        clientGender: form.clientGender,
        influencer: form.influencer,
        useSpeechIntro: form.useSpeechIntro,
      });
      const bancoResult = copySelection.finalCopy;

      // 2. Fala 2 — Aurora Copy (gerada com IA estritamente nas especificações do produto)
      let auroraResult = '';
      try {
        const res = await fetch('/api/produtos2-planning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_aurora_copy',
            productName: finalProductName,
            productInfo: form.productInfo || finalProductName,
            duration: form.duration,
            additionalInstructions: form.additionalInstructions,
            aiProfile,
          }),
        });
        const data = await res.json();
        if (data.success && data.auroraCopy) {
          auroraResult = data.auroraCopy;
        } else {
          auroraResult = `Gente, olha esse lançamento! O ${finalProductName} é super prático e perfeito para o dia a dia. Confere aqui embaixo!`;
        }
      } catch (err) {
        console.warn('Erro ao requisitar Aurora Copy:', err);
        auroraResult = `Gente, olha esse lançamento! O ${finalProductName} é super prático e perfeito para o dia a dia. Confere aqui embaixo!`;
      }

      onChange((prev) => ({
        ...prev,
        speechesGenerated: true,
        bancoCopy: bancoResult,
        auroraCopy: auroraResult,
        selectedSpeechOption: 'banco', // Banco de copies selecionado por padrão (Item 8)
        finalSelectedSpeech: bancoResult,
        copyEngine: 'banco',
      }));
    } catch (err: any) {
      console.error('Erro ao gerar falas:', err);
      setSpeechesError(err?.message || 'Erro ao gerar as opções de fala.');
    } finally {
      setIsGeneratingSpeeches(false);
    }
  };

  // Auto-expansão dos campos de copy personalizada e instruções adicionais
  useEffect(() => {
    if (copyTextareaRef.current) {
      copyTextareaRef.current.style.height = 'auto';
      copyTextareaRef.current.style.height = `${Math.max(68, copyTextareaRef.current.scrollHeight)}px`;
    }
  }, [form.customCopy]);

  useEffect(() => {
    if (instructionsTextareaRef.current) {
      instructionsTextareaRef.current.style.height = 'auto';
      instructionsTextareaRef.current.style.height = `${Math.max(68, instructionsTextareaRef.current.scrollHeight)}px`;
    }
  }, [form.additionalInstructions]);

  // Reanalisa o texto de Informações do Produto (com debounce ~550ms e atualização inteligente)
  const applyAnalysisFromText = (text: string) => {
    // Item 3: Ao limpar as informações do produto, reseta o nome do produto e reabilita o autopreenchimento
    if (!text.trim()) {
      onChange((prev) => ({
        ...prev,
        detectedNiche: undefined,
        productName: '',
        productNameAutoFilled: true,
      }));
      return;
    }

    const specs = analyzeProductInfoForProdutos2(text);

    onChange((prev) => {
      // Decisão manual do usuário (Item 2): NUNCA muda o subMode automaticamente.
      // Se o usuário selecionou Produtos Geral, fica Produtos Geral. Se selecionou Vestuário, fica Vestuário.
      const nextSubMode = prev.subMode;
      const nextMaleSubOption = prev.subMode === 'vestuario_masculino'
        ? (specs.maleSubOption || prev.maleSubOption)
        : prev.maleSubOption;

      // Item 3: Sempre que cola novas informações do produto, extrai e preenche o nome do produto
      const newProductName = specs.shortName || prev.productName;

      return {
        ...prev,
        subMode: nextSubMode,
        maleSubOption: nextMaleSubOption,
        detectedNiche: specs.niche,
        productName: newProductName,
        productNameAutoFilled: Boolean(specs.shortName),
        influencer: specs.influencer,
        influencerAutoFilled: specs.influencer !== null,
        clientGender: specs.clientGender,
        clientGenderAutoFilled: true,
      };
    });
  };

  const handleProductInfoChange = (text: string) => {
    onChange((prev) => ({
      ...prev,
      productInfo: text,
    }));

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      applyAnalysisFromText(text);
    }, 550);
  };

  // Controle de Microfone ao vivo (Seção 2 itens 4, 5 e 13)
  const stopMicrophone = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActiveMic(null);
  };

  const toggleMic = async (field: 'info' | 'copy' | 'instructions' | 'banco' | 'aurora') => {
    if (activeMic === field) {
      stopMicrophone();
      return;
    }
    if (activeMic !== null) {
      stopMicrophone();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        recognitionRef.current = rec;
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;

        const initialText =
          field === 'info'
            ? form.productInfo
            : field === 'copy'
            ? form.customCopy
            : field === 'instructions'
            ? form.additionalInstructions
            : field === 'banco'
            ? form.bancoCopy || ''
            : form.auroraCopy || '';

        rec.onresult = (evt: any) => {
          let transcript = '';
          for (let i = 0; i < evt.results.length; i++) {
            transcript += evt.results[i][0].transcript + ' ';
          }
          const combined = initialText
            ? `${initialText.trim()} ${transcript.trim()}`
            : transcript.trim();

          if (field === 'info') {
            handleProductInfoChange(combined);
          } else if (field === 'copy') {
            onChange((prev) => ({ ...prev, customCopy: combined }));
          } else if (field === 'instructions') {
            onChange((prev) => ({ ...prev, additionalInstructions: combined }));
          } else if (field === 'banco') {
            onChange((prev) => ({
              ...prev,
              bancoCopy: combined,
              finalSelectedSpeech: prev.selectedSpeechOption === 'banco' ? combined : prev.finalSelectedSpeech,
            }));
          } else if (field === 'aurora') {
            onChange((prev) => ({
              ...prev,
              auroraCopy: combined,
              finalSelectedSpeech: prev.selectedSpeechOption === 'aurora_copy' ? combined : prev.finalSelectedSpeech,
            }));
          }
        };

        rec.onerror = () => stopMicrophone();
        rec.onend = () => setActiveMic(null);
        rec.start();
        setActiveMic(field);
      }
    } catch {
      stopMicrophone();
    }
  };

  // Variações e Upload Múltiplo de Fotos (Seção 2 item 11)
  const handleAddVariation = () => {
    const nextIdx = (form.variations?.length || 0) + 1;
    const newVar: Produtos2Variation = {
      id: `p2-var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Cor / Variação ${nextIdx}`,
      photos: [],
    };
    onChange((prev) => ({
      ...prev,
      variations: [...(prev.variations || []), newVar],
    }));
  };

  const handleRemoveVariation = (id: string) => {
    onChange((prev) => ({
      ...prev,
      variations: (prev.variations || []).filter((v) => v.id !== id),
    }));
  };

  const handleAddPhotosToVariation = async (varId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const processed = await Promise.all(
      fileArray.map(async (file) => {
        try {
          const compressed = await compressImageForProdutos2(file, 1536, 0.88);
          if (compressed) return compressed;
        } catch {}
        return '';
      })
    );

    const validPhotos = processed.filter((p): p is string => Boolean(p && p.trim()));
    if (validPhotos.length > 0) {
      onChange((prev) => ({
        ...prev,
        variations: (prev.variations || []).map((v) =>
          v.id === varId ? { ...v, photos: [...v.photos, ...validPhotos] } : v
        ),
      }));
    }
  };

  const handleRemovePhoto = (varId: string, photoIdx: number) => {
    onChange((prev) => ({
      ...prev,
      variations: (prev.variations || []).map((v) =>
        v.id === varId
          ? { ...v, photos: v.photos.filter((_, idx) => idx !== photoIdx) }
          : v
      ),
    }));
  };

  const handleSubModeSelect = (newSubMode: Produtos2SubMode, maleOpt?: Produtos2MaleSubOption) => {
    onChange((prev) => {
      const nextMaleOpt = maleOpt || prev.maleSubOption;
      const isMaleMode = newSubMode === 'vestuario_masculino';
      return {
        ...prev,
        subMode: newSubMode,
        maleSubOption: nextMaleOpt,
        influencer: isMaleMode ? 'Homem' : prev.influencer,
        influencerAutoFilled: isMaleMode ? true : prev.influencerAutoFilled,
        clientGender: isMaleMode ? 'Masculino' : prev.clientGender,
        clientGenderAutoFilled: isMaleMode ? true : prev.clientGenderAutoFilled,
        detectedNiche: isMaleMode
          ? nextMaleOpt === 'calcados'
            ? 'Calçados masculinos'
            : 'Roupas masculinas'
          : prev.detectedNiche,
      };
    });
  };

  const totalPhotosCount = (form.variations || []).reduce(
    (acc, v) => acc + (v.photos?.length || 0),
    0
  );

  const isMaleVestuario = form.subMode === 'vestuario_masculino';

  // Item 12: Em Vestuário Masculino, toda a paleta vira verde escuro e destaques em verde esmeralda.
  // Em Produto Geral, mantém o padrão azul.
  const activeAutoCardClass = isMaleVestuario
    ? 'bg-gradient-to-br from-emerald-950/90 via-emerald-900/80 to-zinc-950/95 border-2 border-emerald-500 shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-500/35'
    : 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-lg shadow-sky-900/50 ring-2 ring-sky-400/40';

  const normalCardClass = isMaleVestuario
    ? 'bg-zinc-900/90 border border-emerald-900/50'
    : 'bg-zinc-900/80 border border-zinc-800/90';

  const accentBtnClass = isMaleVestuario
    ? 'bg-emerald-600 text-white shadow shadow-emerald-950/60'
    : 'bg-sky-500 text-white shadow shadow-sky-950/50';

  const accentBadgeClass = isMaleVestuario
    ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-100'
    : 'bg-sky-500/30 border-sky-400/50 text-sky-100';

  const accentBorderClass = isMaleVestuario
    ? 'border-emerald-500/50'
    : 'border-sky-400/50';

  const accentTextClass = isMaleVestuario
    ? 'text-emerald-300'
    : 'text-sky-300';

  const isInfoFilled = Boolean(form.productInfo.trim().length > 0);
  const isNameFilled = Boolean(form.productName.trim().length > 0);
  const isInfluencerFilled = form.influencer !== null;
  const isPhotosFilled = totalPhotosCount > 0;
  const isInstructionsFilled = Boolean(form.additionalInstructions.trim().length > 0);

  // Seção 2 item 13: Bloqueado se algum microfone estiver gravando ou se faltar "Informações do produto" ou imagens
  const isMicRecording = activeMic !== null;
  const canGenerateSpeeches =
    !isProcessing &&
    !isGeneratingSpeeches &&
    !isMicRecording &&
    Boolean(form.productInfo.trim() || form.productName.trim());

  const hasSelectedSpeech = Boolean(
    (form.selectedSpeechOption === 'aurora_copy'
      ? form.auroraCopy?.trim()
      : form.bancoCopy?.trim()) ||
    form.finalSelectedSpeech?.trim()
  );

  const canGenerateVideo =
    !isProcessing &&
    !isMicRecording &&
    Boolean(form.speechesGenerated || form.bancoCopy || form.auroraCopy) &&
    hasSelectedSpeech &&
    totalPhotosCount > 0;

  return (
    <div
      className={`space-y-6 rounded-3xl transition-colors duration-500 ${
        isMaleVestuario
          ? 'bg-gradient-to-b from-emerald-950/30 via-zinc-950/80 to-zinc-950 p-3 sm:p-5 border border-emerald-600/30 shadow-2xl shadow-emerald-950/40'
          : ''
      }`}
    >
      {/* ===================================================================== */}
      {/* SEÇÃO 1 — ESTRUTURA DOS MODOS (Produtos Geral vs Vestuário Masculino) */}
      {/* ===================================================================== */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border shadow-xl space-y-4 transition-colors ${
          isMaleVestuario
            ? 'bg-zinc-900/95 border-emerald-500/40'
            : 'bg-zinc-900/90 border-zinc-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>MODO PRODUTOS 2.0 (EXPRESS · 1 GERAÇÃO · STORYBOARD 9 CENAS)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Copy-First: escolhe a copy campeã validada → monta o Storyboard 3×3 (9 cenas) que prova a fala → gera o prompt contínuo do Veo 3.
            </p>
          </div>
          {form.detectedNiche && (
            <span
              className={`px-3 py-1 rounded-full border text-xs font-extrabold flex items-center gap-1.5 ${
                isMaleVestuario
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-sky-500/20 border-sky-400/50 text-sky-200'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  isMaleVestuario ? 'text-emerald-300' : 'text-sky-300'
                }`}
              />
              Nicho: {form.detectedNiche}
            </span>
          )}
        </div>

        {/* Seletor de Sub-Modos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleSubModeSelect('produtos_geral')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              form.subMode === 'produtos_geral'
                ? 'bg-gradient-to-r from-sky-600/90 to-blue-700/90 border-sky-400 text-white shadow-lg shadow-sky-950/50'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <Package className="w-5 h-5 shrink-0 text-sky-300" />
            <div>
              <div className="text-xs font-black uppercase tracking-wide">Produtos (Geral)</div>
              <div className="text-[11px] opacity-80">Banco 63 Copies Validadas + Fórmula</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSubModeSelect('vestuario_masculino', form.maleSubOption)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              form.subMode === 'vestuario_masculino'
                ? 'bg-gradient-to-r from-emerald-600 to-green-700 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/40'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <Shirt className="w-5 h-5 shrink-0 text-emerald-300" />
            <div>
              <div className="text-xs font-black uppercase tracking-wide">Vestuário Masculino</div>
              <div className="text-[11px] opacity-80">Calçados Masculinos e Roupas</div>
            </div>
          </button>

          <div
            className="p-3 rounded-xl border border-zinc-800/60 bg-zinc-950/40 text-zinc-500 flex items-center justify-between gap-2 opacity-60 cursor-not-allowed"
            title="Vestuário Feminino no Modo Produtos 2.0 será liberado em breve (use o Modo Ania para roupas femininas)"
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 shrink-0 text-zinc-500" />
              <div>
                <div className="text-xs font-bold">Vestuário Feminino</div>
                <div className="text-[10px]">Storyboard + Espelho</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase">
              Em breve
            </span>
          </div>
        </div>

        {/* Sub-opção de Vestuário Masculino: Calçados vs Roupas (Item 12: verde em Vestuário Masculino) */}
        {form.subMode === 'vestuario_masculino' && (
          <div className="pt-2 border-t border-emerald-900/50 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-emerald-300">Sub-opção Masculina:</span>
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-emerald-800/60">
              <button
                type="button"
                onClick={() => handleSubModeSelect('vestuario_masculino', 'calcados')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  form.maleSubOption === 'calcados'
                    ? 'bg-emerald-600 text-white shadow shadow-emerald-950/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Calçados Masculinos</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubModeSelect('vestuario_masculino', 'roupas')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  form.maleSubOption === 'roupas'
                    ? 'bg-emerald-600 text-white shadow shadow-emerald-950/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Roupas Masculinas</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SEÇÃO 2 — PAINEL DE CAMPOS (Fundo azul para campos autopreenchidos)   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 1. Informações do Produto */}
        <div
          className={`md:col-span-12 p-4 rounded-2xl transition-all duration-300 space-y-2 ${
            isInfoFilled ? activeAutoCardClass : normalCardClass
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-white">1. Informações do produto (Colar descrição / ficha técnica)</span>
              <strong className="text-rose-400">*</strong>
              {isInfoFilled && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" /> Analisado ✓
                </span>
              )}
            </span>
            <span className="text-[11px] text-sky-200/80 font-normal">
              Reanalisa automaticamente (~600ms) e preenche os campos
            </span>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={form.productInfo}
              onChange={(e) => handleProductInfoChange(e.target.value)}
              placeholder="Cole aqui o título e a descrição completa do anúncio (watts, ml, tamanho, material, cor, benefícios)..."
              className={`w-full p-3 pr-12 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none font-sans ${
                isInfoFilled
                  ? 'bg-slate-950/85 border border-sky-400/60'
                  : 'bg-zinc-950 border border-zinc-700/80'
              }`}
            />
            <button
              type="button"
              onClick={() => toggleMic('info')}
              className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeMic === 'info'
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-zinc-800 text-sky-300 hover:bg-zinc-700 border border-zinc-700'
              }`}
              title={activeMic === 'info' ? 'Parar gravação' : 'Ditar informações do produto'}
            >
              {activeMic === 'info' ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. Nome do Produto (curto e falável) */}
        <div
          className={`md:col-span-6 p-4 rounded-2xl transition-all duration-300 space-y-2 ${
            isNameFilled ? activeAutoCardClass : normalCardClass
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-white">2. Nome do produto (curto e falável)</span>
              <strong className="text-rose-400">*</strong>
              {isNameFilled && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" /> {form.productNameAutoFilled ? 'Autopreenchido ✓' : 'Definido ✓'}
                </span>
              )}
            </span>
            <span className="text-[10px] text-sky-200/80 font-normal">Usado na fala e no .zip/.png/.txt</span>
          </label>
          <input
            type="text"
            value={form.productName}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                productName: e.target.value,
                productNameAutoFilled: false,
              }))
            }
            placeholder="Ex.: Roçadeira 2000 W, Vara de Carbono, Tênis Masculino..."
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-400 font-sans ${
              isNameFilled
                ? 'bg-slate-950/85 border border-sky-400/60'
                : 'bg-zinc-950 border border-zinc-700/80'
            }`}
          />
        </div>

        {/* 3. Duração no Veo (10 s padrão | 8 s) */}
        <div className={`md:col-span-6 p-4 rounded-2xl space-y-2 ${activeAutoCardClass}`}>
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span>3. Duração no Veo</span>
            <span className="text-[10px] text-sky-200 font-semibold">
              {form.duration === 10 ? '10 s (Máx. 235 caracteres c/ espaços)' : '8 s (Máx. 165 caracteres c/ espaços)'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950/90 p-1 rounded-xl border border-sky-400/50">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, duration: 10 }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.duration === 10
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              10 s (Até 235 caracteres)
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, duration: 8 }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.duration === 8
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              8 s (Até 165 caracteres)
            </button>
          </div>
        </div>

        {/* 6. Influencer (Homem / Mulher / vazio quando ambíguo) */}
        <div
          className={`md:col-span-6 p-4 rounded-2xl transition-all duration-300 space-y-2 ${
            isInfluencerFilled ? activeAutoCardClass : normalCardClass
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-white">6. Influencer (Quem aparece e voz)</span>
              {isInfluencerFilled ? (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" /> {form.influencer} ✓
                </span>
              ) : (
                <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                  Ambíguo (Escolha ou automático pela copy)
                </span>
              )}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950/90 p-1 rounded-xl border border-zinc-700/80">
            <button
              type="button"
              onClick={() =>
                onChange((prev) => ({ ...prev, influencer: 'Mulher', influencerAutoFilled: false }))
              }
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.influencer === 'Mulher'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mulher
            </button>
            <button
              type="button"
              onClick={() =>
                onChange((prev) => ({ ...prev, influencer: 'Homem', influencerAutoFilled: false }))
              }
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.influencer === 'Homem'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Homem
            </button>
            <button
              type="button"
              onClick={() =>
                onChange((prev) => ({ ...prev, influencer: null, influencerAutoFilled: false }))
              }
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.influencer === null
                  ? 'bg-zinc-700 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Automático
            </button>
          </div>
        </div>

        {/* 7. Gênero do Cliente (Masculino / Feminino / Unissex) */}
        <div className={`md:col-span-6 p-4 rounded-2xl transition-all duration-300 space-y-2 ${activeAutoCardClass}`}>
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-white">7. Gênero do cliente (Vocativo da fala)</span>
              <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-sky-300" /> {form.clientGender} ✓
              </span>
            </span>
            <span className="text-[10px] text-sky-200/80 font-normal">
              {form.clientGender === 'Feminino'
                ? 'Usa "Amiga" / "Gente"'
                : form.clientGender === 'Masculino'
                ? 'Usa "Meu amigo" / "Cara"'
                : 'Usa "Gente" (Neutro)'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950/90 p-1 rounded-xl border border-sky-400/50">
            {(['Masculino', 'Feminino', 'Unissex'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() =>
                  onChange((prev) => ({ ...prev, clientGender: g, clientGenderAutoFilled: false }))
                }
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  form.clientGender === g
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 8. Fala (Com fala / Sem fala) e Opção de Intro */}
        <div className={`md:col-span-4 p-4 rounded-2xl space-y-2.5 ${activeAutoCardClass}`}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white block">8. Fala</label>
            <span className="text-[10px] text-zinc-400">Locução Veo 3</span>
          </div>
          <div className="grid grid-cols-2 gap-2 bg-slate-950/90 p-1 rounded-xl border border-zinc-700/60">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, speechMode: 'com_fala' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.speechMode === 'com_fala'
                  ? accentBtnClass
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Com fala (Padrão)
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, speechMode: 'sem_fala' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.speechMode === 'sem_fala'
                  ? accentBtnClass
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sem fala
            </button>
          </div>

          {/* Opção Intro ("Nossa!") */}
          {form.speechMode === 'com_fala' && (
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-bold ${accentTextClass}`}>Intro da Fala</label>
                <span className="text-[10px] text-zinc-400">
                  {form.useSpeechIntro ? 'Com palavra extra ("Nossa!")' : 'Sem palavra extra (Direto)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/90 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, useSpeechIntro: false }))}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !form.useSpeechIntro
                      ? accentBtnClass
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Não adiciona 'Nossa!' no início da fala (fala direta)"
                >
                  Não Usar intro (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, useSpeechIntro: true }))}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    form.useSpeechIntro
                      ? accentBtnClass
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Adiciona 'Nossa!' no início de todas as falas para margem de corte"
                >
                  Usar Intro
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 9. Enquadramento (Com rosto / Sem rosto / POV) */}
        <div className={`md:col-span-4 p-4 rounded-2xl space-y-2 flex flex-col justify-between ${activeAutoCardClass}`}>
          <div>
            <label className="text-xs font-bold text-white block">9. Enquadramento</label>
            <p className="text-[11px] text-zinc-300 mt-1 leading-snug">
              Como a pessoa ou criador aparece no vídeo
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-zinc-700/60">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, framing: 'com_rosto' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.framing === 'com_rosto'
                  ? accentBtnClass
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Com rosto
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, framing: 'sem_rosto' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.framing === 'sem_rosto'
                  ? accentBtnClass
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sem rosto
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, framing: 'pov' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.framing === 'pov'
                  ? accentBtnClass
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              POV (Mãos)
            </button>
          </div>
        </div>

        {/* 10. Cenário */}
        <div className={`md:col-span-4 p-4 rounded-2xl space-y-2 flex flex-col justify-between ${activeAutoCardClass}`}>
          <div>
            <label className="text-xs font-bold text-white block">10. Cenário</label>
            <p className="text-[11px] text-zinc-300 mt-1 leading-snug">
              Ambiente de gravação das cenas
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-zinc-700/60">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, scenario: 'padrao_uso' }))}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.scenario === 'padrao_uso'
                  ? accentBtnClass
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Padrão de uso
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, scenario: 'em_casa' }))}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.scenario === 'em_casa'
                  ? accentBtnClass
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Em casa
            </button>
          </div>
        </div>

        {/* 12. Estilo (Só Vestuário Masculino -> Roupas) */}
        {form.subMode === 'vestuario_masculino' && form.maleSubOption === 'roupas' && (
          <div className={`md:col-span-12 p-4 rounded-2xl space-y-2 ${activeAutoCardClass}`}>
            <label className="text-xs font-bold text-white flex items-center justify-between">
              <span>12. Estilo (Vestuário Masculino — Roupas)</span>
              <span className="text-[11px] text-sky-200 font-normal">
                Escolha como apresentar a peça masculina
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-950/90 p-1 rounded-xl border border-sky-400/50">
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, maleClothStyle: 'storyboard' }))}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  form.maleClothStyle === 'storyboard'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Storyboard (Padrão)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange((prev) => ({ ...prev, maleClothStyle: 'pov', framing: 'pov' }))
                }
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  form.maleClothStyle === 'pov'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                POV (Só mãos mostrando a peça)
              </button>
              <button
                type="button"
                disabled
                className="py-2 text-xs font-bold rounded-lg bg-zinc-900/60 text-zinc-500 cursor-not-allowed flex items-center justify-center gap-1.5"
                title="Modo Espelho masculino será liberado em breve"
              >
                <Lock className="w-3 h-3" />
                <span>Espelho (Em breve)</span>
              </button>
            </div>
          </div>
        )}

        {/* 11. Imagens do Produto (Upload múltiplo + Variações/Cores) */}
        <div
          className={`md:col-span-12 p-4 rounded-2xl transition-all duration-300 space-y-3 ${
            isPhotosFilled ? activeAutoCardClass : normalCardClass
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>11. Imagens do produto (Upload Múltiplo)</span>
                <strong className="text-rose-400">*</strong>
                {isPhotosFilled && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" /> {totalPhotosCount}{' '}
                    {totalPhotosCount === 1 ? 'foto anexada' : 'fotos anexadas'} ✓
                  </span>
                )}
              </label>
              <p className="text-[11px] text-sky-200/80 mt-0.5">
                Selecione várias fotos de uma vez (frente, lado, costas, detalhes) para travar o PRODUCT LOCK 1:1.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddVariation}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Variação / Cor</span>
            </button>
          </div>

          <div className="space-y-3">
            {(form.variations || []).map((variation, varIdx) => (
              <div
                key={variation.id}
                className="p-3.5 rounded-xl bg-slate-950/85 border border-sky-500/30 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase">
                      Variação {varIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={variation.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange((prev) => ({
                          ...prev,
                          variations: (prev.variations || []).map((v) =>
                            v.id === variation.id ? { ...v, name: val } : v
                          ),
                        }));
                      }}
                      placeholder={`Ex.: Cor Preta, Vermelha, Kit Completo...`}
                      className="bg-transparent border-b border-zinc-700 focus:border-sky-400 text-xs font-bold text-white focus:outline-none px-1 py-0.5"
                    />
                    <span className="text-[11px] text-zinc-400 font-mono">
                      ({variation.photos.length}{' '}
                      {variation.photos.length === 1 ? 'foto' : 'fotos'})
                    </span>
                  </div>

                  {(form.variations || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(variation.id)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remover variação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={(el) => {
                    fileInputRefs.current[variation.id] = el;
                  }}
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    handleAddPhotosToVariation(variation.id, e.target.files);
                    e.target.value = '';
                  }}
                />

                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[variation.id]?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-sky-500/50 hover:border-sky-400 bg-sky-950/30 hover:bg-sky-900/40 flex flex-col items-center justify-center gap-1.5 text-sky-200 transition-all cursor-pointer p-2 text-center"
                  >
                    <Upload className="w-5 h-5 text-sky-400" />
                    <span className="text-[10px] font-bold leading-tight">
                      Anexar Fotos (Multi)
                    </span>
                  </button>

                  {variation.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      className="relative aspect-square rounded-xl overflow-hidden border border-sky-500/40 bg-zinc-900 group"
                    >
                      <img
                        src={photo}
                        alt={`${variation.name} ${pIdx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(variation.id, pIdx)}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-black/80 text-zinc-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white">
                        #{pIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Instruções Adicionais (Opcional, tem prioridade sobre padrões) */}
        <div
          className={`md:col-span-12 p-4 rounded-2xl transition-all duration-300 space-y-2 ${
            isInstructionsFilled ? activeAutoCardClass : normalCardClass
          }`}
        >
          <label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-white">5. Instruções adicionais (Opcional — Prioridade Máxima)</span>
              {isInstructionsFilled && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" /> Preenchido ✓
                </span>
              )}
            </span>
            <span className="text-[11px] text-zinc-400 font-normal">
              Ex.: "vídeo na praia", "pessoa idosa falando", "roupa vermelha", "sotaque nordestino"
            </span>
          </label>
          <div className="relative">
            <textarea
              ref={instructionsTextareaRef}
              rows={2}
              value={form.additionalInstructions}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, additionalInstructions: e.target.value }))
              }
              placeholder="Digite ou dite instruções específicas de cenário, idade do avatar, roupa ou sotaque..."
              className={`w-full p-3 pr-12 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none overflow-hidden font-sans ${
                isInstructionsFilled
                  ? 'bg-slate-950/85 border border-sky-400/60'
                  : 'bg-zinc-950 border border-zinc-700/80'
              }`}
              style={{ minHeight: '68px' }}
            />
            <button
              type="button"
              onClick={() => toggleMic('instructions')}
              className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeMic === 'instructions'
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-zinc-800 text-sky-300 hover:bg-zinc-700 border border-zinc-700'
              }`}
              title={activeMic === 'instructions' ? 'Parar gravação' : 'Ditar instruções adicionais'}
            >
              {activeMic === 'instructions' ? (
                <Square className="w-4 h-4 fill-white" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* 4. Adicionar Copy Personalizada (Com fundo cinza claro e aviso de não mexer por engano) */}
        <div className="md:col-span-12 p-4 rounded-2xl bg-zinc-700/60 hover:bg-zinc-700/75 border-2 border-zinc-500/80 shadow-lg space-y-2.5 transition-all">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-600/70 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-zinc-100 uppercase tracking-wide">
                4. Adicionar Copy Personalizada (Personalizar Copy do Vídeo ou seja o que é falado nele) (Opcional)
              </span>
              {form.customCopy.trim().length > 0 && (
                <span className="text-[10px] text-zinc-900 font-extrabold bg-zinc-300 px-2 py-0.5 rounded-md border border-zinc-400">
                  {form.customCopy.trim().length} caracteres
                </span>
              )}
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-[10px] font-bold text-amber-200 shrink-0">
              ⚠️ NÃO MEXER
            </span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-tight font-medium">
            Deixe esta caixa em branco para o aplicativo sortear e adaptar automaticamente uma <strong>copy campeã validada do banco</strong>. Só preencha se quiser substituir o banco pela sua própria fala.
          </p>

          <div className="relative">
            <textarea
              ref={copyTextareaRef}
              rows={2}
              value={form.customCopy}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, customCopy: e.target.value }))
              }
              placeholder="Deixe vazio para usar o Banco de Copies Validadas automaticamente (não precisa mexer aqui)..."
              className="w-full p-3 pr-12 rounded-xl bg-zinc-800/95 border border-zinc-500/80 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none overflow-hidden font-sans"
              style={{ minHeight: '68px' }}
            />
            <button
              type="button"
              onClick={() => toggleMic('copy')}
              className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeMic === 'copy'
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-600 border border-zinc-500'
              }`}
              title={activeMic === 'copy' ? 'Parar gravação' : 'Ditar copy personalizada'}
            >
              {activeMic === 'copy' ? (
                <Square className="w-4 h-4 fill-white" />
              ) : (
                <Mic className="w-4 h-4 text-zinc-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 13. BOTÃO GERAR FALAS (Banco de Copies + Aurora Copy)                  */}
      {/* ===================================================================== */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={handleGenerateSpeeches}
          disabled={!canGenerateSpeeches || isGeneratingSpeeches || isMicRecording}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-xl shadow-purple-950/50 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          {isGeneratingSpeeches ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Gerando 2 Opções de Fala (Banco de Copies + Aurora Copy)...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>
                {form.speechesGenerated
                  ? 'REGERAR FALAS (Banco de Copies + Aurora Copy)'
                  : 'GERAR FALAS (Banco de Copies + Aurora Copy)'}
              </span>
            </>
          )}
        </button>

        {!canGenerateSpeeches && (
          <p className="text-center text-[11px] text-amber-300/90">
            * Preencha as Informações do Produto ou o Nome do Produto acima para liberar a geração das falas.
          </p>
        )}

        {speechesError && (
          <p className="text-center text-xs text-rose-400 font-semibold">
            {speechesError}
          </p>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 14. ESCOLHA SUA FALA PREFERIDA (Banco de Copies vs Aurora Copy)       */}
      {/* ===================================================================== */}
      {(form.speechesGenerated || form.bancoCopy || form.auroraCopy) && (
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/90 border border-sky-500/40 shadow-2xl space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  Escolha sua fala preferida
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Ambas as falas são 100% editáveis. Edite diretamente no texto ou dite pelo microfone. Clique no card ou botão para selecionar a fala oficial do seu vídeo.
              </p>
            </div>
            <div className="text-[11px] font-bold text-sky-300 bg-sky-500/10 border border-sky-400/30 px-3 py-1.5 rounded-xl self-start sm:self-auto shrink-0">
              {form.selectedSpeechOption === 'aurora_copy' ? '✓ Aurora Copy Selecionada' : '✓ Banco de Copies Selecionado'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1 — BANCO DE COPIES */}
            <div
              onClick={() => {
                onChange((prev) => ({
                  ...prev,
                  selectedSpeechOption: 'banco',
                  copyEngine: 'banco',
                  finalSelectedSpeech: prev.bancoCopy || '',
                }));
              }}
              className={`p-4 sm:p-5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                form.selectedSpeechOption === 'banco'
                  ? 'bg-gradient-to-br from-sky-950/70 via-blue-950/60 to-slate-900 border-2 border-sky-400 shadow-xl shadow-sky-950/50 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 shadow-lg'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        form.selectedSpeechOption === 'banco'
                          ? 'bg-sky-400 text-slate-950'
                          : 'border-2 border-zinc-600 bg-zinc-800'
                      }`}
                    >
                      {form.selectedSpeechOption === 'banco' && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                        <span>Fala 1 — Banco de Copies</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                          Validada
                        </span>
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      (form.duration === 8 && (form.bancoCopy?.length || 0) > 165) ||
                      (form.duration === 10 && (form.bancoCopy?.length || 0) > 235)
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {form.bancoCopy?.length || 0} carac. ({form.duration}s · máx. {form.duration === 8 ? 165 : 235})
                  </span>
                </div>

                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    rows={4}
                    value={form.bancoCopy || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange((prev) => ({
                        ...prev,
                        bancoCopy: val,
                        finalSelectedSpeech: prev.selectedSpeechOption === 'banco' ? val : prev.finalSelectedSpeech,
                      }));
                    }}
                    placeholder="Fala adaptada do Banco de Copies..."
                    className="w-full p-3.5 pr-12 rounded-xl bg-zinc-950/90 border border-zinc-700 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-400 leading-relaxed font-sans shadow-inner resize-y"
                  />

                  {/* Microfone Banco */}
                  <button
                    type="button"
                    onClick={() => toggleMic('banco')}
                    className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                      activeMic === 'banco'
                        ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-600'
                    }`}
                    title={activeMic === 'banco' ? 'Parar gravação' : 'Ditar fala por voz'}
                  >
                    {activeMic === 'banco' ? (
                      <Square className="w-4 h-4 fill-white" />
                    ) : (
                      <Mic className="w-4 h-4 text-zinc-300" />
                    )}
                  </button>
                </div>

                {activeMic === 'banco' && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Ouvindo sua voz para a Fala 1... clique no quadrado vermelho para parar.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange((prev) => ({
                    ...prev,
                    selectedSpeechOption: 'banco',
                    copyEngine: 'banco',
                    finalSelectedSpeech: prev.bancoCopy || '',
                  }));
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  form.selectedSpeechOption === 'banco'
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black shadow-md shadow-sky-950/40'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {form.selectedSpeechOption === 'banco' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>✓ Fala Selecionada para o Vídeo</span>
                  </>
                ) : (
                  <span>Usar Esta Fala (Banco de Copies)</span>
                )}
              </button>
            </div>

            {/* CARD 2 — AURORA COPY */}
            <div
              onClick={() => {
                onChange((prev) => ({
                  ...prev,
                  selectedSpeechOption: 'aurora_copy',
                  copyEngine: 'aurora_copy',
                  finalSelectedSpeech: prev.auroraCopy || '',
                }));
              }}
              className={`p-4 sm:p-5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                form.selectedSpeechOption === 'aurora_copy'
                  ? 'bg-gradient-to-br from-sky-950/70 via-blue-950/60 to-slate-900 border-2 border-sky-400 shadow-xl shadow-sky-950/50 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 shadow-lg'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        form.selectedSpeechOption === 'aurora_copy'
                          ? 'bg-sky-400 text-slate-950'
                          : 'border-2 border-zinc-600 bg-zinc-800'
                      }`}
                    >
                      {form.selectedSpeechOption === 'aurora_copy' && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                        <span>Fala 2 — Aurora Copy</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/40">
                          IA Criativa
                        </span>
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      (form.duration === 8 && (form.auroraCopy?.length || 0) > 165) ||
                      (form.duration === 10 && (form.auroraCopy?.length || 0) > 235)
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {form.auroraCopy?.length || 0} carac. ({form.duration}s · máx. {form.duration === 8 ? 165 : 235})
                  </span>
                </div>

                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    rows={4}
                    value={form.auroraCopy || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange((prev) => ({
                        ...prev,
                        auroraCopy: val,
                        finalSelectedSpeech: prev.selectedSpeechOption === 'aurora_copy' ? val : prev.finalSelectedSpeech,
                      }));
                    }}
                    placeholder="Fala criada pela Aurora Copy..."
                    className="w-full p-3.5 pr-12 rounded-xl bg-zinc-950/90 border border-zinc-700 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-400 leading-relaxed font-sans shadow-inner resize-y"
                  />

                  {/* Microfone Aurora */}
                  <button
                    type="button"
                    onClick={() => toggleMic('aurora')}
                    className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                      activeMic === 'aurora'
                        ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-600'
                    }`}
                    title={activeMic === 'aurora' ? 'Parar gravação' : 'Ditar fala por voz'}
                  >
                    {activeMic === 'aurora' ? (
                      <Square className="w-4 h-4 fill-white" />
                    ) : (
                      <Mic className="w-4 h-4 text-zinc-300" />
                    )}
                  </button>
                </div>

                {activeMic === 'aurora' && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Ouvindo sua voz para a Fala 2... clique no quadrado vermelho para parar.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange((prev) => ({
                    ...prev,
                    selectedSpeechOption: 'aurora_copy',
                    copyEngine: 'aurora_copy',
                    finalSelectedSpeech: prev.auroraCopy || '',
                  }));
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  form.selectedSpeechOption === 'aurora_copy'
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black shadow-md shadow-sky-950/40'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {form.selectedSpeechOption === 'aurora_copy' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>✓ Fala Selecionada para o Vídeo</span>
                  </>
                ) : (
                  <span>Usar Esta Fala (Aurora Copy)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 15. BOTÃO GERAR VÍDEO (Storyboard 9 Cenas + Prompt Veo 3)              */}
      {/* ===================================================================== */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canGenerateVideo}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          {isMicRecording ? (
            <>
              <Square className="w-5 h-5 fill-rose-400 text-rose-400 animate-pulse" />
              <span>Gravação de voz ativa — Pare o microfone (⏹) para liberar o botão</span>
            </>
          ) : isProcessing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Gerando Storyboard 9 Cenas + Prompt do Veo 3 com a Fala Escolhida...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>
                Gerar Vídeo com a Fala Selecionada ({form.selectedSpeechOption === 'aurora_copy' ? 'Aurora Copy' : 'Banco de Copies'})
              </span>
            </>
          )}
        </button>

        {!form.speechesGenerated && !form.bancoCopy && !form.auroraCopy && (
          <p className="text-center text-[11px] text-zinc-400 mt-2">
            * Clique primeiro em <strong>"GERAR FALAS"</strong> acima para comparar e selecionar a fala preferida do seu vídeo.
          </p>
        )}
        {(form.speechesGenerated || form.bancoCopy || form.auroraCopy) && !isPhotosFilled && (
          <p className="text-center text-[11px] text-amber-300/90 mt-2">
            * Anexe pelo menos 1 foto do produto nas variações para liberar a geração do vídeo.
          </p>
        )}
      </div>
    </div>
  );
};
