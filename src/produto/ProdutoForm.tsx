import React, { useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  CheckCircle2,
  Package,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import {
  ProdutoFormState,
  ProdutoFraming,
  ProdutoScenario,
  ProdutoSceneCount,
  ProdutoVariation,
} from './types';
import { detectGender, extractShortProductName, compressAndResizeImage } from '../ania/aniaLibrary';

interface ProdutoFormProps {
  form: ProdutoFormState;
  onChange: React.Dispatch<React.SetStateAction<ProdutoFormState>>;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const ProdutoForm: React.FC<ProdutoFormProps> = ({
  form,
  onChange,
  onSubmit,
  isProcessing,
}) => {
  const [activeMic, setActiveMic] = React.useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Reanalisar Informações do Produto
  const handleProductInfoChange = (text: string) => {
    const inferredGender = detectGender(text);
    const inferredName = extractShortProductName(text) || '';

    onChange((prev) => ({
      ...prev,
      productInfo: text,
      gender: inferredGender !== null ? inferredGender : prev.gender,
      productName: inferredName
        ? inferredName.charAt(0).toUpperCase() + inferredName.slice(1)
        : prev.productName,
    }));
  };

  const toggleMic = async (field: 'info' | 'instructions' | 'speech') => {
    if (activeMic === field) {
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
      return;
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

        rec.onresult = (evt: any) => {
          let text = '';
          for (let i = 0; i < evt.results.length; i++) {
            text += evt.results[i][0].transcript + ' ';
          }
          if (field === 'info') {
            handleProductInfoChange(
              form.productInfo ? `${form.productInfo} ${text.trim()}` : text.trim()
            );
          } else if (field === 'instructions') {
            onChange((prev) => ({
              ...prev,
              additionalInstructions: prev.additionalInstructions
                ? `${prev.additionalInstructions} ${text.trim()}`
                : text.trim(),
            }));
          } else if (field === 'speech') {
            onChange((prev) => ({
              ...prev,
              customSpeech: prev.customSpeech
                ? `${prev.customSpeech} ${text.trim()}`
                : text.trim(),
            }));
          }
        };

        rec.onerror = () => setActiveMic(null);
        rec.onend = () => setActiveMic(null);
        rec.start();
        setActiveMic(field);
      }
    } catch {
      setActiveMic(null);
    }
  };

  // Variações e Fotos
  const handleAddVariation = () => {
    const nextIdx = (form.variations?.length || 0) + 1;
    const newVar: ProdutoVariation = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Variação ${nextIdx}`,
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
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressed = await compressAndResizeImage(file, 1536, 0.88);
        if (compressed) {
          newPhotos.push(compressed);
        } else {
          const raw = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
          if (raw) newPhotos.push(raw);
        }
      } catch (err) {
        console.warn('Erro ao processar foto:', err);
        try {
          const raw = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
          if (raw) newPhotos.push(raw);
        } catch {}
      }
    }

    if (newPhotos.length > 0) {
      onChange((prev) => ({
        ...prev,
        variations: (prev.variations || []).map((v) =>
          v.id === varId ? { ...v, photos: [...v.photos, ...newPhotos] } : v
        ),
      }));
    }
  };

  const handleRemovePhotoFromVariation = (varId: string, photoIdx: number) => {
    onChange((prev) => ({
      ...prev,
      variations: (prev.variations || []).map((v) =>
        v.id === varId
          ? { ...v, photos: v.photos.filter((_, idx) => idx !== photoIdx) }
          : v
      ),
    }));
  };

  const canSubmit = Boolean(form.productName.trim() && !isProcessing);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 1. Informações do Produto (Reanalisa em cada edição) */}
        <div className="md:col-span-12 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>1. Informações do Produto (Descrição / Ficha Técnica)</span>
              <strong className="text-rose-400">*</strong>
            </span>
            <span className="text-[11px] text-zinc-400 font-normal">Reanalisa automaticamente</span>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={form.productInfo}
              onChange={(e) => handleProductInfoChange(e.target.value)}
              placeholder="Cole a descrição ou ficha técnica aqui. A IA inferirá nome, gênero e atributos..."
              className="w-full p-3 pr-12 rounded-xl bg-[#1c130e] border border-[#52392b] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
            />
            <button
              type="button"
              onClick={() => toggleMic('info')}
              className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeMic === 'info' ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-800 text-amber-300'
              }`}
              title="Ditar informações do produto"
            >
              {activeMic === 'info' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. Nome do Produto */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 block">
            2. Nome do Produto <strong className="text-rose-400">*</strong>
          </label>
          <input
            type="text"
            value={form.productName}
            onChange={(e) => onChange((prev) => ({ ...prev, productName: e.target.value }))}
            placeholder="Ex.: Fone Bluetooth, Garrafa Térmica, Luminária LED..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c130e] border border-[#52392b] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>

        {/* 3. Gênero (Homem / Mulher / Unissex) */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 flex items-center justify-between">
            <span>3. Gênero do Apresentador</span>
            {form.gender === null && (
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-600/40">
                Unissex (Neutro)
              </span>
            )}
          </label>
          <div className="grid grid-cols-3 gap-2 bg-[#1c130e] p-1 rounded-xl border border-[#52392b]">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, gender: 'Mulher' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.gender === 'Mulher' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mulher
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, gender: 'Homem' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.gender === 'Homem' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Homem
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, gender: null }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.gender === null ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Unissex
            </button>
          </div>
        </div>

        {/* 4. Enquadramento (Sem rosto por padrão) */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 block">
            4. Enquadramento da Câmera
          </label>
          <div className="grid grid-cols-3 gap-2 bg-[#1c130e] p-1 rounded-xl border border-[#52392b]">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, framing: 'sem_rosto' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.framing === 'sem_rosto' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sem rosto
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, framing: 'com_rosto' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.framing === 'com_rosto' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Com rosto
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, framing: 'apenas_produto' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.framing === 'apenas_produto' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Só Produto
            </button>
          </div>
        </div>

        {/* 5. Cenário (Cenário típico por padrão) */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 block">
            5. Cenário
          </label>
          <select
            value={form.scenario}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, scenario: e.target.value as ProdutoScenario }))
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c130e] border border-[#52392b] text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="tipico">✨ Cenário típico de uso (padrão inteligente)</option>
            <option value="casa">Casa simples brasileira (aconchegante)</option>
            <option value="ar_livre">Ar livre / Exterior natural</option>
            <option value="estudio_neutro">Estúdio neutro minimalista</option>
          </select>
        </div>

        {/* 6. Fotos do Produto & Variações (Multi-upload de até 10+ fotos por variação) */}
        <div className="md:col-span-12 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3d271b] pb-3">
            <div>
              <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-400" />
                <span>6. Fotos do Produto & Variações (Cores, Modelos, Ângulos)</span>
              </label>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Você pode anexar quantas fotos quiser (1, 3, 5 ou até 10+ fotos de uma vez: frontal, lateral, detalhes, etc.).
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddVariation}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Variação</span>
            </button>
          </div>

          <div className="space-y-4">
            {(form.variations || []).map((variation, varIdx) => {
              const autoLabel = variation.name || `Variação ${varIdx + 1}`;

              return (
                <div
                  key={variation.id}
                  className="p-3.5 bg-[#1c130e] rounded-xl border border-[#452d1f] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
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
                        placeholder={`Variação ${varIdx + 1}`}
                        className="bg-transparent border-b border-transparent hover:border-[#52392b] focus:border-amber-400 text-xs font-bold text-white focus:outline-none px-1 py-0.5"
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
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remover esta variação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Grid de Fotos e Botão de Multi-Upload */}
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
                        handleAddPhotosToVariation(variation.id, e.target.files);
                        e.target.value = '';
                      }}
                    />

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {/* Botão de Upload Múltiplo */}
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[variation.id]?.click()}
                        className="aspect-square rounded-xl border border-dashed border-[#52392b] hover:border-amber-500 bg-[#281b14]/60 hover:bg-amber-500/10 flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-amber-300 transition-all cursor-pointer p-2 text-center"
                        title="Selecione várias fotos de uma vez (frontal, traseira, detalhes)"
                      >
                        <Upload className="w-5 h-5 text-amber-400" />
                        <span className="text-[10px] font-bold leading-tight">
                          Anexar Fotos (Multi)
                        </span>
                      </button>

                      {/* Miniaturas das Fotos Anexadas */}
                      {variation.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="aspect-square rounded-xl border border-[#3b271b] bg-black relative group/photo overflow-hidden shadow-sm"
                        >
                          <img
                            src={photo}
                            alt={`${autoLabel} foto ${pIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleRemovePhotoFromVariation(variation.id, pIdx)
                            }
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/80 hover:bg-rose-600 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer shadow"
                            title="Remover foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. Quantidade de Cenas (1 cena por padrão) */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 block">
            7. Quantidade de Cenas
          </label>
          <div className="grid grid-cols-3 gap-2 bg-[#1c130e] p-1 rounded-xl border border-[#52392b]">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, sceneCount: 1 }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.sceneCount === 1
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1 Cena (Vídeo Único)
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, sceneCount: 2 }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.sceneCount === 2
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              2 Cenas
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, sceneCount: 3 }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.sceneCount === 3
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              3 Cenas
            </button>
          </div>
        </div>

        {/* 8. Modelo do Veo (10s por padrão no Modo Produto) */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 block">
            8. Duração da Cena (Google Veo 3.1)
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#1c130e] p-1 rounded-xl border border-[#52392b]">
            <button
              type="button"
              onClick={() =>
                onChange((prev) => ({ ...prev, veoModelMode: 'veo3_omniflash_10s' }))
              }
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.veoModelMode === 'veo3_omniflash_10s'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Omni Flash — 10 s
            </button>
            <button
              type="button"
              onClick={() =>
                onChange((prev) => ({ ...prev, veoModelMode: 'veo3_basic_8s' }))
              }
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.veoModelMode === 'veo3_basic_8s'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Veo 3 Básico — 8 s
            </button>
          </div>
        </div>

        {/* 9. Imagens de Referência por Cena (Livre: 1, 2 ou até 3 referências) */}
        <div className="md:col-span-12 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold text-amber-200 block">
              9. Imagens de Referência por Cena (para anexar no Veo)
            </label>
            <span className="text-[11px] text-zinc-400">
              O Veo aceita até 3 imagens. Não é obrigatório colocar três — escolha 1, 2 ou até 3.
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 bg-[#1c130e] p-1.5 rounded-xl border border-[#52392b]">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, refImagesPerScene: 1 }))}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                (form.refImagesPerScene ?? 3) === 1
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>1 Referência</span>
              <span className="text-[10px] font-normal opacity-80">(Foto/Ângulo Principal)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, refImagesPerScene: 2 }))}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                (form.refImagesPerScene ?? 3) === 2
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>2 Referências</span>
              <span className="text-[10px] font-normal opacity-80">(2 Ângulos ou Cores)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, refImagesPerScene: 3 }))}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                (form.refImagesPerScene ?? 3) === 3
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>3 Referências</span>
              <span className="text-[10px] font-normal opacity-80">(Máximo suportado)</span>
            </button>
          </div>
        </div>

        {/* 10. Personalizar Roteiro (com fundo cinza mais claro e aviso de não mexer para evitar edições acidentais) */}
        <div className="md:col-span-12 p-4 rounded-2xl bg-zinc-700/60 hover:bg-zinc-700/75 border-2 border-zinc-500/80 shadow-lg space-y-2.5 transition-all">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-600/70 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-100 uppercase tracking-wide">
                10. Personalizar Roteiro (Opcional)
              </span>
              <span className="text-[11px] text-zinc-300 font-normal">
                {form.sceneCount === 1
                  ? 'Máx: 252 caracteres (10s)'
                  : 'Máx: 199 caracteres por cena'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-[10px] font-bold text-amber-200">
              ⚠️ NÃO MEXER
            </span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-tight font-medium">
            Deixe esta caixa em branco para o aplicativo gerar a <strong>fala persuasiva validada automaticamente</strong>. Só edite se quiser ditar sua própria locução.
          </p>

          <div className="relative">
            <textarea
              rows={2}
              value={form.customSpeech}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, customSpeech: e.target.value }))
              }
              placeholder="Deixe em branco para usar a locução persuasiva automática (não precisa mexer aqui)..."
              className="w-full p-3 pr-12 rounded-xl bg-zinc-800/95 border border-zinc-500/80 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none font-sans"
            />
            <button
              type="button"
              onClick={() => toggleMic('speech')}
              className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeMic === 'speech'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-600 border border-zinc-500'
              }`}
              title="Ditar roteiro"
            >
              {activeMic === 'speech' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-zinc-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Botão de Envio */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-2xl transition-all cursor-pointer ${
            canSubmit
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white scale-[1.01]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-200" />
          <span>GERAR CRIATIVO • MODO PRODUTO</span>
        </button>
      </div>
    </div>
  );
};
