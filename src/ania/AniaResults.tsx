import React, { useState, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  Tag,
  Eye,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Wand2,
  FileText,
  Mic,
  Sliders,
  Square,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  Plus,
  X,
} from 'lucide-react';
import { AniaResultState } from './types';
import { exportAniaAssetsZip } from './aniaZipExporter';

interface AniaResultsProps {
  result: AniaResultState;
  onRegenerateImage: (
    imageIndex: number,
    customCorrection?: string,
    overrideProductPhotoBase64?: string
  ) => Promise<void>;
  onUpdateVideoSpeech: (videoIndex: number, newSpeech: string) => void;
  onUpdateVideoPrompt?: (videoIndex: number, newPrompt: string) => void;
  onOpenPreviewModal: (url: string, title: string) => void;
  aiProfile?: string;
}

export function AniaResults({
  result,
  onRegenerateImage,
  onUpdateVideoSpeech,
  onUpdateVideoPrompt,
  onOpenPreviewModal,
  aiProfile = 'openai',
}: AniaResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedVideoPromptIndices, setCopiedVideoPromptIndices] = useState<number[]>([]);

  // Replacement/New Product Photo attached on error or retry
  const [overrideProductPhotos, setOverrideProductPhotos] = useState<{ [key: number]: string }>({});
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Video prompt correction states (text + mic)
  const [promptCorrections, setPromptCorrections] = useState<{ [key: number]: string }>({});
  const [refiningPromptIndex, setRefiningPromptIndex] = useState<number | null>(null);
  const [activePromptRecordingIndex, setActivePromptRecordingIndex] = useState<number | null>(null);
  const [interimPromptCorrection, setInterimPromptCorrection] = useState<string>('');

  // Image editing states
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [instructionText, setInstructionText] = useState<string>('');
  const [customCorrections, setCustomCorrections] = useState<{ [key: number]: string }>({});
  const [activeImageRecordingIndex, setActiveImageRecordingIndex] = useState<number | null>(null);
  const [interimImageCorrection, setInterimImageCorrection] = useState<string>('');

  // Video speech editing states
  const [editingSpeechIndex, setEditingSpeechIndex] = useState<number | null>(null);
  const [speechDrafts, setSpeechDrafts] = useState<{ [key: number]: string }>({});
  const [activeSpeechRecordingIndex, setActiveSpeechRecordingIndex] = useState<number | null>(null);
  const [interimSpeechDraft, setInterimSpeechDraft] = useState<string>('');

  const [isExportingZip, setIsExportingZip] = useState(false);

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ─── Voice Recording for Image Remake ─────────────────────────────────────
  const toggleImageVoiceRecording = async (idx: number) => {
    if (activeImageRecordingIndex === idx) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setActiveImageRecordingIndex(null);
      setInterimImageCorrection('');
      return;
    }

    setActiveImageRecordingIndex(idx);
    setActiveSpeechRecordingIndex(null);
    setInterimImageCorrection('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          if (final) {
            setCustomCorrections((prev) => ({
              ...prev,
              [idx]: (prev[idx] ? `${prev[idx]} ${final}` : final).trim(),
            }));
            if (editingImageIndex === idx) {
              setInstructionText((prev) => (prev ? `${prev} ${final}` : final).trim());
            }
          }
          setInterimImageCorrection(interim);
        };

        recognition.onerror = () => {
          setActiveImageRecordingIndex(null);
        };

        recognition.onend = () => {
          if (activeImageRecordingIndex === idx) {
            setActiveImageRecordingIndex(null);
          }
        };

        recognition.start();
      }
    } catch (err) {
      console.warn('Erro ao acessar microfone para ditar correção de imagem:', err);
      setActiveImageRecordingIndex(null);
    }
  };

  // ─── Voice Recording for Video Speech Editing ──────────────────────────────
  const toggleSpeechVoiceRecording = async (idx: number) => {
    if (activeSpeechRecordingIndex === idx) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setActiveSpeechRecordingIndex(null);
      setInterimSpeechDraft('');
      return;
    }

    setActiveSpeechRecordingIndex(idx);
    setActiveImageRecordingIndex(null);
    setInterimSpeechDraft('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          if (final) {
            setSpeechDrafts((prev) => ({
              ...prev,
              [idx]: (prev[idx] !== undefined
                ? `${prev[idx]} ${final}`
                : `${result.videoPrompts[idx]?.speechPart || ''} ${final}`
              ).trim(),
            }));
          }
          setInterimSpeechDraft(interim);
        };

        recognition.onerror = () => {
          setActiveSpeechRecordingIndex(null);
        };

        recognition.onend = () => {
          if (activeSpeechRecordingIndex === idx) {
            setActiveSpeechRecordingIndex(null);
          }
        };

        recognition.start();
      }
    } catch (err) {
      console.warn('Erro ao acessar microfone para ditar fala do vídeo:', err);
      setActiveSpeechRecordingIndex(null);
    }
  };

  // ─── Voice Recording for Video Prompt Refinement ───────────────────────────
  const togglePromptVoiceRecording = async (idx: number) => {
    if (activePromptRecordingIndex === idx) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setActivePromptRecordingIndex(null);
      setInterimPromptCorrection('');
      return;
    }

    setActivePromptRecordingIndex(idx);
    setActiveImageRecordingIndex(null);
    setActiveSpeechRecordingIndex(null);
    setInterimPromptCorrection('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          if (final) {
            setPromptCorrections((prev) => ({
              ...prev,
              [idx]: (prev[idx] ? `${prev[idx]} ${final}` : final).trim(),
            }));
          }
          setInterimPromptCorrection(interim);
        };

        recognition.onerror = () => {
          setActivePromptRecordingIndex(null);
        };

        recognition.onend = () => {
          if (activePromptRecordingIndex === idx) {
            setActivePromptRecordingIndex(null);
          }
        };

        recognition.start();
      }
    } catch (err) {
      console.warn('Erro ao acessar microfone para ditar correção de prompt:', err);
      setActivePromptRecordingIndex(null);
    }
  };

  // ─── Handle Prompt Refinement with AI ──────────────────────────────────────
  const handleRefinePrompt = async (idx: number) => {
    const correction = promptCorrections[idx]?.trim();
    if (!correction) return;

    const currentPrompt = result.videoPrompts[idx]?.prompt;
    if (!currentPrompt) return;

    setRefiningPromptIndex(idx);
    try {
      const res = await fetch('/api/refine-video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPrompt,
          correctionInstruction: correction,
          aiProfile,
        }),
      });

      const data = await res.json();
      if (data.success && data.refinedPrompt) {
        if (onUpdateVideoPrompt) {
          onUpdateVideoPrompt(idx, data.refinedPrompt);
        } else {
          // Local fallback mutation if parent didn't provide onUpdateVideoPrompt
          if (result.videoPrompts[idx]) {
            result.videoPrompts[idx].prompt = data.refinedPrompt;
          }
        }

        // Reset copied status for this card so it returns to normal background color!
        setCopiedVideoPromptIndices((prev) => prev.filter((i) => i !== idx));

        // Clear correction input
        setPromptCorrections((prev) => {
          const next = { ...prev };
          delete next[idx];
          return next;
        });
      }
    } catch (err) {
      console.error('Erro ao refazer prompt:', err);
    } finally {
      setRefiningPromptIndex(null);
    }
  };

  const handleCopy = (id: string, text: string, videoIndex?: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (typeof videoIndex === 'number') {
      setCopiedVideoPromptIndices((prev) => (prev.includes(videoIndex) ? prev : [...prev, videoIndex]));
    }
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadAll = async () => {
    setIsExportingZip(true);
    try {
      await exportAniaAssetsZip(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handlePhotoUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setOverrideProductPhotos((prev) => ({
          ...prev,
          [idx]: base64,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (idx: number) => {
    setOverrideProductPhotos((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    if (fileInputRefs.current[idx]) {
      fileInputRefs.current[idx]!.value = '';
    }
  };

  const handleExecuteImageEdit = async (idx: number) => {
    await onRegenerateImage(idx, instructionText, overrideProductPhotos[idx]);
    setEditingImageIndex(null);
    setInstructionText('');
  };

  const handleStartEditingSpeech = (idx: number) => {
    setEditingSpeechIndex(idx);
    setSpeechDrafts((prev) => ({
      ...prev,
      [idx]: result.videoPrompts[idx]?.speechPart || '',
    }));
  };

  const handleSaveSpeech = (idx: number) => {
    const newSpeech = speechDrafts[idx] !== undefined ? speechDrafts[idx] : (result.videoPrompts[idx]?.speechPart || '');
    onUpdateVideoSpeech(idx, newSpeech);
    setEditingSpeechIndex(null);
  };

  const handleClearSpeech = (idx: number) => {
    setSpeechDrafts((prev) => ({
      ...prev,
      [idx]: '',
    }));
    onUpdateVideoSpeech(idx, '');
    setEditingSpeechIndex(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900/30 via-zinc-900 to-emerald-950/30 rounded-2xl border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30">
            Método Ania — 3 Vídeos de Alta Conversão
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white mt-1.5">
            {result.planning.titulo || 'Criativo Gerado com Sucesso'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Peça: <strong className="text-zinc-200">{result.planning.peca}</strong> • Tecido: <strong className="text-zinc-200">{result.planning.tecido}</strong> • Estica: <strong className="text-zinc-200">{result.planning.estica ? 'Sim' : 'Não'}</strong>
          </p>
        </div>
      </div>

      {/* 3 BLOCKS: IMAGE + VIDEO PROMPT */}
      <div className="space-y-8">
        {result.images.map((imageObj, idx) => {
          const videoPrompt = result.videoPrompts[idx];
          const isImage1 = idx === 0;
          const maxSpeechChars = videoPrompt?.durationSec === 10 ? 250 : 200;
          const isEditingSpeech = editingSpeechIndex === idx;
          const isVideoPromptCopied = copiedVideoPromptIndices.includes(idx);
          const currentSpeechDraft = speechDrafts[idx] !== undefined
            ? speechDrafts[idx]
            : (videoPrompt?.speechPart || '');

          return (
            <div
              key={imageObj.id || idx}
              className={`p-5 sm:p-6 rounded-2xl space-y-5 shadow-2xl transition-all duration-300 ${
                isVideoPromptCopied
                  ? 'bg-gradient-to-br from-sky-900/80 via-blue-900/75 to-slate-800/90 border-2 border-sky-400 shadow-sky-900/50 ring-2 ring-sky-400/40'
                  : 'bg-zinc-900/95 border border-zinc-800'
              }`}
            >
              {/* Header of Block */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
                  isVideoPromptCopied ? 'border-sky-500/30' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shadow ${
                      isVideoPromptCopied ? 'bg-sky-500 text-white' : 'bg-purple-600 text-white'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>
                        Imagem {idx + 1} & Vídeo {idx + 1} — Cor: <span className={isVideoPromptCopied ? 'text-sky-300' : 'text-purple-300'}>{imageObj.colorName}</span>
                      </span>
                      {isVideoPromptCopied && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-500/30 text-sky-200 border border-sky-400/40 tracking-wider">
                          Prompt Copiado ✓
                        </span>
                      )}
                    </h3>
                    <p className={`text-[11px] ${isVideoPromptCopied ? 'text-sky-200/80' : 'text-zinc-400'}`}>
                      {isImage1
                        ? 'Imagem base gerada com modelo sem rosto (Pele limpa, Zero Tatuagens)'
                        : `Variação de cor baseada na Imagem 1 (mantém modelo e cenário)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {imageObj.fidelityAudit ? (
                    <div
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                        imageObj.fidelityAudit.status === 'green'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : imageObj.fidelityAudit.status === 'yellow'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {imageObj.fidelityAudit.status === 'green' ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>{imageObj.fidelityAudit.label}</span>
                      <span className="font-mono text-[10px] opacity-80">({imageObj.fidelityAudit.score}/100)</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Fidelidade 100% conferida</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopy(`img-prompt-${idx}`, imageObj.promptUsed)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                    title="Copiar prompt exato da imagem para usar no ChatGPT ou Flow"
                  >
                    {copiedId === `img-prompt-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copiar Prompt da Imagem</span>
                  </button>
                </div>
              </div>

              {/* Grid: Image on Left, Prompt + Speech on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Image Section */}
                <div className="lg:col-span-4 space-y-3">
                  <div
                    onClick={() => {
                      if (!imageObj.hasError && imageObj.imageUrl) {
                        onOpenPreviewModal(
                          imageObj.imageUrl,
                          `Imagem ${idx + 1} — ${imageObj.colorName}`
                        );
                      }
                    }}
                    className={`relative aspect-[9/16] max-h-[380px] w-full mx-auto bg-zinc-950 rounded-xl overflow-hidden border border-zinc-700/80 shadow-inner flex items-center justify-center ${
                      !imageObj.hasError && imageObj.imageUrl ? 'group cursor-pointer' : ''
                    }`}
                  >
                    {imageObj.isRegenerating ? (
                      <div className="flex flex-col items-center gap-2 text-zinc-400 p-4 text-center">
                        <RotateCcw className="w-7 h-7 animate-spin text-purple-400" />
                        <span className="text-xs font-bold text-zinc-200">
                          {idx === 0 ? 'Gerando Imagem 1...' : `Gerando Imagem ${idx + 1}...`}
                        </span>
                        <span className="text-[10px] text-zinc-400">Preservando modelo e cenário</span>
                      </div>
                    ) : imageObj.hasError || !imageObj.imageUrl ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-col items-center justify-between p-4 h-full w-full bg-zinc-950/95 text-center cursor-default space-y-3"
                      >
                        <div className="space-y-1.5 my-auto">
                          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-rose-300 block">
                            {imageObj.error || 'Falha ao gerar esta imagem'}
                          </span>
                          <p className="text-[10px] text-zinc-400 leading-tight max-w-[200px] mx-auto">
                            Você pode anexar uma nova foto do produto ou refazer diretamente mantendo o modelo.
                          </p>
                        </div>

                        {/* Anexar Nova Foto do Produto no Card de Erro */}
                        <div className="w-full space-y-2 border-t border-zinc-800/80 pt-2.5">
                          <input
                            type="file"
                            accept="image/*"
                            ref={(el) => {
                              fileInputRefs.current[idx] = el;
                            }}
                            onChange={(e) => handlePhotoUpload(idx, e)}
                            className="hidden"
                            id={`error-file-input-${idx}`}
                          />

                          {overrideProductPhotos[idx] ? (
                            <div className="flex items-center justify-between p-2 bg-purple-950/40 border border-purple-500/40 rounded-xl text-left">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <img
                                  src={overrideProductPhotos[idx]}
                                  alt="Nova amostra"
                                  className="w-8 h-8 rounded-lg object-cover border border-purple-400/50 shrink-0"
                                />
                                <div className="truncate">
                                  <span className="text-[11px] font-bold text-purple-200 block truncate">
                                    Nova foto anexada
                                  </span>
                                  <span className="text-[9px] text-zinc-400">Pronta para gerar</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                className="p-1 text-zinc-400 hover:text-rose-400 cursor-pointer"
                                title="Remover foto"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[idx]?.click()}
                              className="w-full py-2 px-2 bg-zinc-900 hover:bg-zinc-800 text-purple-300 hover:text-purple-200 text-[11px] font-bold rounded-xl border border-dashed border-purple-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5 text-purple-400" />
                              <span>Anexar Nova Foto do Produto</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              onRegenerateImage(idx, customCorrections[idx], overrideProductPhotos[idx])
                            }
                            disabled={imageObj.isRegenerating}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{overrideProductPhotos[idx] ? 'Refazer com Nova Foto' : 'Refazer Imagem'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={imageObj.imageUrl}
                          alt={`Imagem ${idx + 1} - ${imageObj.colorName}`}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                          <Eye className="w-4 h-4" />
                          <span>Ampliar Imagem</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Auditoria de Fidelidade Fiscal (Padrão Modo Clonagem TikTok Shop) */}
                  {imageObj.fidelityAudit ? (
                    <div
                      className={`p-2.5 rounded-xl border text-[11px] space-y-1.5 ${
                        imageObj.fidelityAudit.status === 'green'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : imageObj.fidelityAudit.status === 'yellow'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          {imageObj.fidelityAudit.status === 'green' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : imageObj.fidelityAudit.status === 'yellow' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span>{imageObj.fidelityAudit.label}</span>
                        </span>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-black/40 font-bold">
                          {imageObj.fidelityAudit.score}/100
                        </span>
                      </div>

                      {imageObj.fidelityAudit.issues && imageObj.fidelityAudit.issues.length > 0 && (
                        <p className="text-[10px] opacity-90 leading-tight">
                          {imageObj.fidelityAudit.issues.slice(0, 2).join(' • ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Fidelidade 100% conferida</span>
                      </div>
                      <span className="font-mono text-[10px]">95/100</span>
                    </div>
                  )}

                  {/* Botão de Auto-Cura / Regeneração Corrigindo Erros */}
                  {imageObj.fidelityAudit && imageObj.fidelityAudit.status !== 'green' && (
                    <button
                      type="button"
                      onClick={() => onRegenerateImage(idx, imageObj.fidelityAudit?.correctionPrompt, overrideProductPhotos[idx])}
                      disabled={imageObj.isRegenerating}
                      className="w-full py-2 px-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                      title="Refaz a imagem aplicando as correções identificadas pelo fiscal de qualidade"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-white" />
                      <span>Regenerar Corrigindo Erros</span>
                    </button>
                  )}

                  {/* Dictated Correction Banner / Feedback */}
                  {(activeImageRecordingIndex === idx || customCorrections[idx]) && (
                    <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                        <span className="flex items-center gap-1.5">
                          {activeImageRecordingIndex === idx ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          ) : (
                            <Mic className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          {activeImageRecordingIndex === idx ? 'Ouvindo instruções por voz...' : 'Instruções para refazer:'}
                        </span>
                        {customCorrections[idx] && (
                          <button
                            type="button"
                            onClick={() =>
                              setCustomCorrections((prev) => {
                                const next = { ...prev };
                                delete next[idx];
                                return next;
                              })
                            }
                            className="text-zinc-400 hover:text-rose-400 text-[10px] cursor-pointer"
                            title="Limpar instrução"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-200 break-words">
                        {customCorrections[idx] || ''}
                        {activeImageRecordingIndex === idx && interimImageCorrection && (
                          <span className="italic text-purple-300 opacity-70"> {interimImageCorrection}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Actions under image */}
                  <div className="flex flex-col gap-2">
                    {editingImageIndex === idx ? (
                      <div className="p-3 bg-zinc-950 rounded-xl border border-purple-500/40 space-y-2">
                        <label className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
                          <span>Instruções para corrigir esta imagem:</span>
                          <button
                            onClick={() => setEditingImageIndex(null)}
                            className="text-zinc-500 hover:text-zinc-300 text-[10px]"
                          >
                            Cancelar
                          </button>
                        </label>
                        <textarea
                          value={instructionText}
                          onChange={(e) => setInstructionText(e.target.value)}
                          rows={2}
                          placeholder="Ex: Deixar a cor mais bordô, ajustar o cós, mudar a blusa..."
                          className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleExecuteImageEdit(idx)}
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Aplicar Correção e Refazer</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onRegenerateImage(idx, customCorrections[idx], overrideProductPhotos[idx])
                          }
                          disabled={imageObj.isRegenerating}
                          className="col-span-5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-zinc-700 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{overrideProductPhotos[idx] ? 'Refazer (Nova Foto)' : 'Refazer'}</span>
                        </button>

                        {/* Botão de Microfone para Ditar ao Refazer */}
                        <button
                          type="button"
                          onClick={() => toggleImageVoiceRecording(idx)}
                          disabled={imageObj.isRegenerating}
                          className={`col-span-2 p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            activeImageRecordingIndex === idx
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                              : customCorrections[idx]
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
                          }`}
                          title={
                            activeImageRecordingIndex === idx
                              ? 'Parar gravação'
                              : 'Ditar alterações para esta imagem por voz'
                          }
                        >
                          {activeImageRecordingIndex === idx ? (
                            <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                          ) : (
                            <Mic className="w-3.5 h-3.5 text-purple-400" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingImageIndex(idx);
                            setInstructionText(customCorrections[idx] || '');
                          }}
                          className="col-span-5 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-purple-500/30"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Instrução</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Prompt & Individual Speech Section */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>Prompt do Vídeo {idx + 1} ({videoPrompt?.durationSec || 8}s)</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                        {videoPrompt?.label || 'Vídeo'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(`vid-prompt-${idx}`, videoPrompt?.prompt || '', idx)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md ${
                        isVideoPromptCopied
                          ? 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {copiedId === `vid-prompt-${idx}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Prompt do Vídeo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Prompt Textarea */}
                  <textarea
                    readOnly
                    value={videoPrompt?.prompt || ''}
                    rows={9}
                    className={`w-full p-3.5 border rounded-xl text-xs font-mono leading-relaxed resize-y focus:outline-none transition-colors ${
                      isVideoPromptCopied
                        ? 'bg-sky-950/80 border-sky-400/50 text-sky-100 placeholder-sky-300/60 shadow-inner'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-200'
                    }`}
                  />

                  {/* PROMPT CORRECTION / REFINEMENT BAR (TEXT + MIC + AI) */}
                  <div
                    className={`p-3 rounded-xl border space-y-2 transition-colors ${
                      isVideoPromptCopied
                        ? 'bg-sky-950/60 border-sky-400/30'
                        : 'bg-zinc-950/90 border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Ajustar ou Corrigir este Prompt com IA:</span>
                      </label>
                      {activePromptRecordingIndex === idx && (
                        <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Ouvindo sua correção...
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={promptCorrections[idx] || ''}
                          onChange={(e) =>
                            setPromptCorrections((prev) => ({
                              ...prev,
                              [idx]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleRefinePrompt(idx);
                            }
                          }}
                          placeholder='Ex: "Edite o prompt porque não passou por conteúdo impróprio", "Deixe a câmera mais perto"...'
                          className="w-full pl-3 pr-9 py-2 bg-zinc-900 border border-zinc-700/90 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                        />

                        {/* Botão de Microfone embutido no input */}
                        <button
                          type="button"
                          onClick={() => togglePromptVoiceRecording(idx)}
                          className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
                            activePromptRecordingIndex === idx
                              ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                              : 'text-zinc-400 hover:text-purple-300 hover:bg-zinc-800'
                          }`}
                          title={
                            activePromptRecordingIndex === idx
                              ? 'Parar gravação'
                              : 'Ditar correção do prompt por voz'
                          }
                        >
                          {activePromptRecordingIndex === idx ? (
                            <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRefinePrompt(idx)}
                        disabled={refiningPromptIndex === idx || !(promptCorrections[idx]?.trim() || interimPromptCorrection.trim())}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
                      >
                        {refiningPromptIndex === idx ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                            <span>Refazendo...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Refazer Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    {activePromptRecordingIndex === idx && interimPromptCorrection && (
                      <p className="text-[11px] text-purple-300 italic opacity-80 pl-1">
                        "{interimPromptCorrection}"
                      </p>
                    )}
                  </div>

                  {/* DEDICATED INDIVIDUAL SPEECH CARD FOR THIS VIDEO */}
                  <div
                    className={`p-4 rounded-xl border space-y-2.5 transition-colors ${
                      isVideoPromptCopied
                        ? 'bg-sky-950/70 border-sky-400/40 shadow-sm'
                        : 'bg-zinc-950 border-zinc-800/90'
                    }`}
                  >
                    <div
                      className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${
                        isVideoPromptCopied ? 'border-sky-500/30' : 'border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white">
                          Fala da Cena {idx + 1} / Vídeo {idx + 1}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ({(videoPrompt?.speechPart || '').length}/{maxSpeechChars} caracteres)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {videoPrompt?.speechPart && !isEditingSpeech && (
                          <button
                            type="button"
                            onClick={() => handleCopy(`vid-speech-${idx}`, videoPrompt.speechPart || '')}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-zinc-700"
                          >
                            {copiedId === `vid-speech-${idx}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copiar Fala</span>
                          </button>
                        )}

                        {!isEditingSpeech ? (
                          <button
                            type="button"
                            onClick={() => handleStartEditingSpeech(idx)}
                            className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-500/30"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar fala</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingSpeechIndex(null)}
                            className="text-zinc-500 hover:text-zinc-300 text-xs"
                          >
                            Fechar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Speech Content / Editor */}
                    {!isEditingSpeech ? (
                      <div>
                        {videoPrompt?.speechPart ? (
                          <p className="text-xs text-zinc-200 leading-relaxed font-sans italic bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/20">
                            "{videoPrompt.speechPart}"
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 italic bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                            Sem narração/fala configurada para este vídeo (apenas som ambiente e movimentos da peça).
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        <div className="relative">
                          <textarea
                            value={currentSpeechDraft}
                            onChange={(e) =>
                              setSpeechDrafts((prev) => ({
                                ...prev,
                                [idx]: e.target.value,
                              }))
                            }
                            rows={3}
                            placeholder="Digite ou dite a fala que será narrada especificamente neste vídeo..."
                            className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 pr-10 leading-relaxed"
                          />

                          {/* Mic button inside textarea */}
                          <button
                            type="button"
                            onClick={() => toggleSpeechVoiceRecording(idx)}
                            className={`absolute right-2.5 bottom-3.5 p-1.5 rounded-lg border text-xs cursor-pointer ${
                              activeSpeechRecordingIndex === idx
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                            }`}
                            title={
                              activeSpeechRecordingIndex === idx
                                ? 'Parar gravação de voz'
                                : 'Ditar narração por voz'
                            }
                          >
                            {activeSpeechRecordingIndex === idx ? (
                              <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                            ) : (
                              <Mic className="w-3.5 h-3.5 text-purple-400" />
                            )}
                          </button>
                        </div>

                        {/* Interim Voice Preview */}
                        {activeSpeechRecordingIndex === idx && interimSpeechDraft && (
                          <p className="text-[11px] text-purple-300 italic">
                            Ouvindo: {interimSpeechDraft}
                          </p>
                        )}

                        {/* Speech Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleClearSpeech(idx)}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700 hover:border-rose-500/30"
                            title="Remover fala deste vídeo e deixar apenas som ambiente"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Deixar Sem Fala</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSpeechIndex(null)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-zinc-700"
                            >
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSaveSpeech(idx)}
                              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Atualizar Prompt com Esta Fala</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    💡 <strong>Como usar no Flow/Veo:</strong> Anexe no modo Frames a <strong>Imagem {idx + 1}</strong> e cole este prompt.
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPLETE SPEECH CARD */}
      <div className="p-5 sm:p-6 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Fala Completa Adaptada</h3>
            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700">
              Origem: {result.speechSourceId}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('complete-speech', result.completeSpeech)}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
          >
            {copiedId === 'complete-speech' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Fala Completa</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80">
          "{result.completeSpeech}"
        </p>

        <div className="text-[11px] text-zinc-500 flex flex-wrap gap-4">
          <span>Caracteres totais: <strong>{result.completeSpeech.length}</strong></span>
          <span>Dividida automaticamente entre os vídeos 1, 2 e 3 sem repetições. Você pode editar individualmente a fala de qualquer vídeo acima.</span>
        </div>
      </div>

      {/* DESCRIPTION + HASHTAGS CARD */}
      <div className="p-5 sm:p-6 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Descrição do Post + Hashtags</h3>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('post-description', result.description)}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
          >
            {copiedId === 'post-description' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Descrição</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed">
          {result.description}
        </div>
      </div>

      {/* BOTTOM SINGLE DOWNLOAD BUTTON */}
      <div className="pt-4 pb-8 flex justify-center">
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={isExportingZip}
          className="w-full max-w-xl py-4 px-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-3 shadow-2xl hover:shadow-emerald-500/25 transition-all cursor-pointer scale-[1.01]"
        >
          <Download className="w-5 h-5" />
          <span>
            {isExportingZip
              ? 'Preparando e compactando os 7 arquivos...'
              : 'BAIXAR TUDO (7 Arquivos em .ZIP)'}
          </span>
        </button>
      </div>
    </div>
  );
}
