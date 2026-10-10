import React, { useRef } from 'react';
import { Sparkles, Mic, MicOff, CheckCircle2, Package, Layers, Info, RotateCcw } from 'lucide-react';
import { ProdutoFormState, ProdutoFraming, ProdutoScenario, ProdutoSceneCount } from './types';
import { detectGender, extractShortProductName } from '../ania/aniaLibrary';

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

  // Reanalisar Informações do Produto
  const handleProductInfoChange = (text: string) => {
    const inferredGender = detectGender(text);
    const inferredName = extractShortProductName(text) || '';

    onChange((prev) => ({
      ...prev,
      productInfo: text,
      gender: inferredGender !== null ? inferredGender : prev.gender,
      productName: inferredName ? inferredName.charAt(0).toUpperCase() + inferredName.slice(1) : prev.productName,
    }));
  };

  const toggleMic = async (field: 'info' | 'instructions' | 'speech') => {
    if (activeMic === field) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
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
            handleProductInfoChange(form.productInfo ? `${form.productInfo} ${text.trim()}` : text.trim());
          } else if (field === 'instructions') {
            onChange((prev) => ({ ...prev, additionalInstructions: prev.additionalInstructions ? `${prev.additionalInstructions} ${text.trim()}` : text.trim() }));
          } else if (field === 'speech') {
            onChange((prev) => ({ ...prev, customSpeech: prev.customSpeech ? `${prev.customSpeech} ${text.trim()}` : text.trim() }));
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
            onChange={(e) => onChange((prev) => ({ ...prev, scenario: e.target.value as ProdutoScenario }))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c130e] border border-[#52392b] text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="tipico">✨ Cenário típico de uso (padrão inteligente)</option>
            <option value="casa">Casa simples brasileira (aconchegante)</option>
            <option value="ar_livre">Ar livre / Exterior natural</option>
            <option value="estudio_neutro">Estúdio neutro minimalista</option>
          </select>
        </div>

        {/* 6. Quantidade de Cenas (1 cena por padrão) */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 block">
            6. Quantidade de Cenas
          </label>
          <div className="grid grid-cols-3 gap-2 bg-[#1c130e] p-1 rounded-xl border border-[#52392b]">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, sceneCount: 1 }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.sceneCount === 1 ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              1 Cena (3 ref)
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, sceneCount: 2 }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.sceneCount === 2 ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              2 Cenas
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, sceneCount: 3 }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.sceneCount === 3 ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              3 Cenas
            </button>
          </div>
        </div>

        {/* 7. Modelo do Veo (10s por padrão no Modo Produto) */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-[#281b14] border border-[#4a3224] space-y-2">
          <label className="text-xs font-bold text-amber-200 block">
            7. Duração da Cena (Google Veo 3.1)
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#1c130e] p-1 rounded-xl border border-[#52392b]">
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, veoModelMode: 'veo3_omniflash_10s' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.veoModelMode === 'veo3_omniflash_10s' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Omni Flash — 10 s
            </button>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, veoModelMode: 'veo3_basic_8s' }))}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                form.veoModelMode === 'veo3_basic_8s' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Veo 3 Básico — 8 s
            </button>
          </div>
        </div>

        {/* 8. Personalizar Roteiro (com fundo cinza escuro neutro para evitar edição acidental) */}
        <div className="md:col-span-12 p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
            <span>8. Personalizar Roteiro (Opcional)</span>
            <span className="text-[11px] text-zinc-400 font-normal">
              {form.sceneCount === 1 ? 'Máx: 252 caracteres (10s)' : 'Máx: 199 caracteres por cena'}
            </span>
          </label>
          <div className="relative">
            <textarea
              rows={2}
              value={form.customSpeech}
              onChange={(e) => onChange((prev) => ({ ...prev, customSpeech: e.target.value }))}
              placeholder="Deixe em branco para usar a locução persuasiva automática ou dite/digite seu roteiro..."
              className="w-full p-3 pr-12 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none font-sans"
            />
            <button
              type="button"
              onClick={() => toggleMic('speech')}
              className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeMic === 'speech' ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-300'
              }`}
              title="Ditar roteiro"
            >
              {activeMic === 'speech' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
