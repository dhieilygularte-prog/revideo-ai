import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareText,
  HelpCircle,
  Mic,
  Square,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AdditionalInstructionsCardProps {
  instructions: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const AdditionalInstructionsCard: React.FC<AdditionalInstructionsCardProps> = ({
  instructions,
  onChange,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingFallback, setIsTranscribingFallback] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const initialTextRef = useRef<string>('');
  const finalTranscriptAccRef = useRef<string>('');
  const speechCapturedRef = useRef<boolean>(false);

  // Limpa streams e reconhecedor se o componente for desmontado
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startRecording = async () => {
    if (disabled || isRecording || isTranscribingFallback) return;

    setMicPermissionError(null);
    setInterimTranscript('');
    audioChunksRef.current = [];
    finalTranscriptAccRef.current = '';
    speechCapturedRef.current = false;
    initialTextRef.current = instructions;

    let stream: MediaStream;
    try {
      // 1. FORÇA a solicitação explícita nativa da permissão do microfone
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err: any) {
      console.warn('Erro ao solicitar microfone:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('Permission denied')
      ) {
        setMicPermissionError(
          'Permissão de microfone bloqueada pelo navegador. Para habilitar, clique no ícone de cadeado (🔒) ou configurações ao lado da URL na barra de endereços e altere o Microfone para "Permitir". Depois, tente novamente.'
        );
      } else {
        setMicPermissionError(
          'Não foi possível acessar o microfone. Verifique se o dispositivo de áudio está conectado e funcionando.'
        );
      }
      return;
    }

    setIsRecording(true);

    // 2. Gravação em paralelo via MediaRecorder (para fallback de alta fidelidade)
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(250);
    } catch (recErr) {
      console.warn('MediaRecorder não pôde ser iniciado em paralelo:', recErr);
    }

    // 3. Transcrição em Tempo Real (Web Speech API - pt-BR)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interim = '';
          let newlyFinal = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              newlyFinal += text + ' ';
            } else {
              interim += text;
            }
          }

          if (newlyFinal) {
            speechCapturedRef.current = true;
            finalTranscriptAccRef.current += newlyFinal;

            const base = initialTextRef.current.trim();
            const added = finalTranscriptAccRef.current.trim();
            const combined = base ? `${base} ${added}` : added;
            onChange(combined);
          }

          if (interim) {
            speechCapturedRef.current = true;
          }
          setInterimTranscript(interim);
        };

        recognition.onerror = (e: any) => {
          console.warn('Web Speech API aviso/erro:', e.error);
        };

        recognition.onend = () => {
          // Se ainda estiver no estado gravando, tenta reiniciar se não foi explicitamente parado
          if (mediaStreamRef.current && mediaStreamRef.current.active) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognition.start();
      } catch (speechErr) {
        console.warn('Erro ao inicializar Web Speech API:', speechErr);
      }
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setInterimTranscript('');

    // Para Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // Para stream de microfone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Para MediaRecorder
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }

    // Se a Web Speech API capturou com sucesso e acumulou texto, encerra sem precisar de fallback
    if (speechCapturedRef.current && finalTranscriptAccRef.current.trim()) {
      return;
    }

    // Caso o navegador não tenha Web Speech API ou não capturou texto, dispara o fallback Gemini
    await new Promise((resolve) => setTimeout(resolve, 300));
    const chunks = audioChunksRef.current;
    if (!chunks || chunks.length === 0) return;

    const recordedBlob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
    if (recordedBlob.size < 1500) return; // áudio muito curto / sem dados

    setIsTranscribingFallback(true);
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(recordedBlob);
      });

      const res = await fetch('/api/transcribe-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64Audio }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        const transcript = data.text.trim();
        const base = initialTextRef.current.trim();
        const combined = base ? `${base} ${transcript}` : transcript;
        onChange(combined);
      }
    } catch (fallbackErr) {
      console.error('Erro no fallback de transcrição por IA:', fallbackErr);
    } finally {
      setIsTranscribingFallback(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Instruções adicionais</h3>
            <p className="text-xs text-zinc-400">
              Oriente detalhes específicos de cores, roupas da modelo, falas ou acabamentos que você quer priorizar.
            </p>
          </div>
        </div>

        {/* Botão de Ditar Instrução por Voz no Cabeçalho */}
        <div className="shrink-0">
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-500/30 animate-pulse border border-rose-400"
              title="Clique para parar a gravação e finalizar transcrição"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Parar Gravação</span>
            </button>
          ) : isTranscribingFallback ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-purple-300 text-xs font-semibold flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Transcrevendo fala...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Ditar instruções por voz em tempo real (Português do Brasil)"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Falar Instrução</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Permissão Bloqueada com Guia do Cadeado */}
      {micPermissionError && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start justify-between gap-2.5 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">Permissão do Microfone Bloqueada</p>
              <p className="text-[11px] text-zinc-300 leading-relaxed">{micPermissionError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMicPermissionError(null)}
            className="text-zinc-500 hover:text-zinc-300 text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra Animada de Gravação Ativa ("🔴 Ouvindo... [texto provisório]") */}
      {isRecording && (
        <div className="p-2.5 bg-rose-950/40 border border-rose-800/40 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 animate-pulse">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <span className="font-bold text-rose-300">🔴 Ouvindo...</span>
          <span className="text-zinc-300 italic truncate flex-1 font-mono text-[11px]">
            {interimTranscript ? `"${interimTranscript}"` : 'Fale claramente ao microfone (pt-BR)...'}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="text-[10px] text-rose-300 hover:text-white underline underline-offset-2 ml-auto cursor-pointer"
          >
            Concluir
          </button>
        </div>
      )}

      {/* Container Textarea com Microfone Flutuante */}
      <div className="space-y-2 relative">
        <div className="relative">
          <textarea
            value={instructions}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="Ex: O tênis possui 3 cores anexadas (preto, marrom e branco) e cada imagem gerada deve exibir uma cor diferente. Manter o cadarço na cor original exata, sem costuras inventadas e com a mesma calça do vídeo..."
            className={`w-full bg-zinc-950 border ${
              isRecording
                ? 'border-rose-500 ring-2 ring-rose-500/20'
                : 'border-zinc-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'
            } rounded-xl p-3.5 pr-12 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all resize-y`}
          />

          {/* Ícone de Microfone Flutuante no canto inferior direito dentro da textarea */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isTranscribingFallback}
            className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
              isRecording
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                : isTranscribingFallback
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-800/80 hover:bg-purple-600 text-zinc-400 hover:text-white border border-zinc-700/60 hover:border-purple-500 shadow-sm'
            }`}
            title={isRecording ? 'Parar Gravação' : 'Ditar por voz (pt-BR)'}
          >
            {isRecording ? (
              <Square className="w-3.5 h-3.5 fill-white text-white" />
            ) : isTranscribingFallback ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Estas instruções são inseridas diretamente nos prompts do Google Veo e do modelo de imagem.</span>
          </div>
          {instructions && (
            <span className="font-mono text-zinc-600 text-[10px]">
              {instructions.length} caracteres
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
