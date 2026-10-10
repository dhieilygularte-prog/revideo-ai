import React, { useState, useRef } from 'react';
import { Upload, Mic, MicOff, Wand2, Download, AlertCircle, RefreshCw, X, Image as ImageIcon } from 'lucide-react';
import { compressAndResizeImage } from '../ania/aniaLibrary';

interface MicroImageEditorProps {
  aiProfile?: string;
  onOpenPreview?: (url: string, title: string) => void;
}

export const MicroImageEditor: React.FC<MicroImageEditorProps> = ({
  aiProfile = 'openai',
  onOpenPreview,
}) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawBase64 = event.target?.result as string;
        try {
          const compressed = await compressAndResizeImage(rawBase64, 1024, 1792, 0.85);
          setSourceImage(compressed);
          setResultImage(null);
          setErrorMessage(null);
        } catch {
          setSourceImage(rawBase64);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage('Erro ao carregar a imagem.');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
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
          setInstruction((prev) => (prev ? `${prev.trim()} ${text.trim()}` : text.trim()));
        };

        rec.onerror = () => {
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        rec.start();
        setIsRecording(true);
      } else {
        alert('Reconhecimento de voz não suportado neste navegador.');
      }
    } catch (err) {
      console.warn('Erro ao acessar microfone:', err);
      setIsRecording(false);
    }
  };

  const handleEdit = async () => {
    if (!sourceImage) {
      setErrorMessage('Por favor, anexe uma imagem para editar.');
      return;
    }
    if (!instruction.trim()) {
      setErrorMessage('Digite ou dite uma instrução de edição.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/micro-edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: sourceImage,
          instruction: instruction.trim(),
          aiProfile,
        }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setResultImage(data.imageUrl);
      } else {
        setErrorMessage(data.error || 'Não foi possível realizar a edição.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `edicao_micro_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 p-6 bg-zinc-950/90 border border-zinc-800 rounded-3xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            Edição de Imagem (Módulo Independente)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            100% isolado: usa estritamente a imagem anexada abaixo e sua instrução específica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Lado Esquerdo: Upload & Instrução */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-2">
              1. Anexe a Imagem de Referência
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {sourceImage ? (
              <div className="relative aspect-[9/16] max-h-[300px] w-full rounded-2xl overflow-hidden border border-zinc-700 bg-black flex items-center justify-center group">
                <img src={sourceImage} alt="Referência da Edição" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setSourceImage(null);
                    setResultImage(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="Remover imagem"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[16/9] border-2 border-dashed border-zinc-700 hover:border-purple-500 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer bg-zinc-900/50 hover:bg-zinc-900 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-zinc-200">Clique para anexar a imagem</p>
                <p className="text-[11px] text-zinc-500 mt-1">Qualquer imagem (será usada como 100% da referência)</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>2. Instrução de Edição</span>
              <span className="text-[11px] text-zinc-500 font-normal">Digite ou use o microfone</span>
            </label>
            <div className="relative">
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder='Ex.: "Troque somente a cor do pijama para preto.", "Ajuste o comprimento", "Mude o fundo para um quarto branco"'
                rows={3}
                className="w-full p-3 pr-12 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-purple-400'
                }`}
                title={isRecording ? 'Parar gravação' : 'Ditar instrução por voz'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleEdit}
            disabled={isProcessing || !sourceImage || !instruction.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando Edição...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Editar Imagem</span>
              </>
            )}
          </button>
        </div>

        {/* Lado Direito: Imagem Resultante */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 block">
            Resultado da Edição
          </label>
          <div className="relative aspect-[9/16] max-h-[420px] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60 flex items-center justify-center">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400 p-4 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                <span className="text-xs font-bold text-zinc-200">Gerando microedição...</span>
                <span className="text-[11px] text-zinc-500">Mantendo 100% da referência intacta</span>
              </div>
            ) : resultImage ? (
              <div className="relative h-full w-full group">
                <img
                  src={resultImage}
                  alt="Resultado da Microedição"
                  className="h-full w-full object-cover cursor-pointer"
                  onClick={() => onOpenPreview && onOpenPreview(resultImage, 'Resultado da Microedição')}
                />
                <button
                  type="button"
                  onClick={handleDownload}
                  className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-zinc-950/85 hover:bg-black text-white hover:text-emerald-400 border border-zinc-700 shadow-xl backdrop-blur-sm transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Baixar imagem editada"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Baixar Imagem</span>
                </button>
              </div>
            ) : (
              <div className="text-center p-6 text-zinc-600">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Nenhuma imagem editada ainda</p>
                <p className="text-[10px] mt-1 text-zinc-500">Anexe a imagem e clique em Editar Imagem</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
