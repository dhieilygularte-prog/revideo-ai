import React, { useState, useRef } from 'react';
import {
  Video,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Eye,
  FileVideo,
  RotateCcw,
} from 'lucide-react';
import { VideoFidelityAudit, Produtos2AuditColorStatus } from './types';

interface VideoFidelityAuditorProps {
  productName: string;
  productLock?: string[];
  referencePhotos: string[];
  initialAudit?: VideoFidelityAudit;
  onAuditChange?: (audit: VideoFidelityAudit) => void;
  onAuditComplete?: (audit: VideoFidelityAudit, usage: any) => void;
  onOpenPreview?: (url: string, title: string) => void;
}

function getAuditBoxClasses(status: Produtos2AuditColorStatus) {
  switch (status) {
    case 'green':
      return {
        card: 'border-emerald-500/60 bg-emerald-950/20 shadow-emerald-950/30',
        badge: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
        dot: 'bg-emerald-400',
        text: 'text-emerald-300',
        cell: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200',
      };
    case 'yellow':
      return {
        card: 'border-amber-500/60 bg-amber-950/20 shadow-amber-950/30',
        badge: 'bg-amber-500/20 border-amber-400/50 text-amber-200',
        dot: 'bg-amber-400',
        text: 'text-amber-300',
        cell: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
      };
    case 'orange':
      return {
        card: 'border-orange-500/60 bg-orange-950/20 shadow-orange-950/30',
        badge: 'bg-orange-500/25 border-orange-400/60 text-orange-200',
        dot: 'bg-orange-400',
        text: 'text-orange-300',
        cell: 'bg-orange-950/40 border-orange-500/40 text-orange-200',
      };
    case 'red':
    default:
      return {
        card: 'border-rose-500/70 bg-rose-950/25 shadow-rose-950/40',
        badge: 'bg-rose-500/25 border-rose-400/60 text-rose-200',
        dot: 'bg-rose-400',
        text: 'text-rose-300',
        cell: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
      };
  }
}

/**
 * Extrai 1 frame a cada 2 segundos ao longo de todo o vídeo (ex: 10s = 5 frames, 15s = 8 frames, 20s = 10 frames, 30s = 15 frames)
 * de forma ultra-otimizada (max 512px) para manter custo mínimo de API e auditoria completa do vídeo.
 */
async function extractVideoFramesEvery2s(videoFile: File): Promise<{ second: number; frameBase64: string }[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const fileUrl = URL.createObjectURL(videoFile);
    video.src = fileUrl;

    video.onloadedmetadata = async () => {
      const duration = video.duration || 10;
      const targetTimes: number[] = [];

      // Gera capturas a cada 2 segundos a partir do segundo 1 até o final do vídeo
      for (let sec = 1; sec < duration; sec += 2) {
        targetTimes.push(sec);
      }
      // Se a sobra entre o último frame e o final do vídeo for >= 1.5s, captura também perto do fim
      if (duration >= 2 && targetTimes.length > 0) {
        const lastTarget = targetTimes[targetTimes.length - 1];
        if (duration - lastTarget >= 1.5) {
          targetTimes.push(Math.round((duration - 0.4) * 10) / 10);
        }
      }
      if (targetTimes.length === 0) {
        targetTimes.push(Math.max(0.5, Math.round((duration / 2) * 10) / 10));
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(fileUrl);
        reject(new Error('Canvas não suportado no navegador.'));
        return;
      }

      // Escala para max 512px no lado maior para consumo super baixo de tokens e envio instantâneo
      let w = video.videoWidth || 720;
      let h = video.videoHeight || 1280;
      const maxSide = 512;
      if (w > maxSide || h > maxSide) {
        if (w > h) {
          h = Math.round((h * maxSide) / w);
          w = maxSide;
        } else {
          w = Math.round((w * maxSide) / h);
          h = maxSide;
        }
      }
      canvas.width = w;
      canvas.height = h;

      const extracted: { second: number; frameBase64: string }[] = [];

      for (const time of targetTimes) {
        await new Promise<void>((res) => {
          let isDone = false;
          const onSeeked = () => {
            if (isDone) return;
            isDone = true;
            video.removeEventListener('seeked', onSeeked);
            try {
              ctx.drawImage(video, 0, 0, w, h);
              const b64 = canvas.toDataURL('image/jpeg', 0.85);
              extracted.push({ second: time, frameBase64: b64 });
            } catch (drawErr) {
              console.warn('Erro ao desenhar frame:', drawErr);
            }
            res();
          };

          video.addEventListener('seeked', onSeeked);
          video.currentTime = time;

          // Timeout de segurança caso o navegador trave o seeked
          setTimeout(() => {
            if (!isDone) {
              isDone = true;
              video.removeEventListener('seeked', onSeeked);
              res();
            }
          }, 2500);
        });
      }

      URL.revokeObjectURL(fileUrl);
      resolve(extracted);
    };

    video.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      reject(new Error('Não foi possível ler o arquivo de vídeo. Certifique-se de que é um formato válido (.mp4, .webm ou .mov).'));
    };
  });
}

export const VideoFidelityAuditor: React.FC<VideoFidelityAuditorProps> = ({
  productName,
  productLock,
  referencePhotos,
  initialAudit,
  onAuditChange,
  onAuditComplete,
  onOpenPreview,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [audit, setAudit] = useState<VideoFidelityAudit | null>(initialAudit || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectVideo = (file: File) => {
    if (!file) return;
    setErrorMessage(null);
    setAudit(null);

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreviewUrl(preview);

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = preview;
    tempVideo.onloadedmetadata = () => {
      setVideoDuration(Math.round((tempVideo.duration || 10) * 10) / 10);
    };
  };

  const handleClearVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoDuration(null);
    setAudit(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAuditVideo = async () => {
    if (!videoFile) return;

    if (!referencePhotos || referencePhotos.length === 0) {
      setErrorMessage('Nenhuma foto de referência do produto foi encontrada na etapa anterior para comparação.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Extraindo frames a cada 2 segundos do vídeo...');

    try {
      // 1. Extração no cliente de 1 frame a cada 2s
      const frames = await extractVideoFramesEvery2s(videoFile);
      if (frames.length === 0) {
        throw new Error('Falha ao extrair frames do vídeo.');
      }

      setStatusMessage(`Fiscalizando ${frames.length} frames com OpenAI (gpt-4o-mini)...`);

      // 2. Envio para a rota de auditoria (enviando no máximo as 5 primeiras fotos para economia e agilidade)
      const res = await fetch('/api/produtos2-audit-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoFrames: frames,
          productPhotosBase64: referencePhotos.slice(0, 5),
          productName,
          productLock,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `Erro no servidor (Status ${res.status})`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (text && !text.includes('<!DOCTYPE')) {
            errMsg += `: ${text.slice(0, 150)}`;
          }
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (!data.success || !data.audit) {
        throw new Error(data.error || 'Falha ao auditar vídeo.');
      }

      setAudit(data.audit);
      onAuditChange?.(data.audit);
      onAuditComplete?.(data.audit, data.usage);
    } catch (err: any) {
      console.error('Erro na auditoria de vídeo:', err);
      setErrorMessage(err?.message || 'Erro durante a auditoria do vídeo.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const boxStyles = audit ? getAuditBoxClasses(audit.overallStatus) : null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 shadow-xl space-y-4 ${
        boxStyles ? boxStyles.card : 'bg-zinc-900/90 border-zinc-800'
      }`}
    >
      {/* Cabeçalho do Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Verificação de Fidelidade do Vídeo (Veo 3)</span>
              {audit && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-black ${boxStyles?.badge}`}
                >
                  {audit.overallScore}%
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Audita o vídeo frame a frame (1 captura a cada 2s — ex: 10s = 5 frames, 20s = 10 frames, 30s = 15 frames) comparando com as fotos reais do produto.
            </p>
          </div>
        </div>

        {videoFile && !isProcessing && (
          <button
            type="button"
            onClick={handleClearVideo}
            className="text-[11px] text-zinc-400 hover:text-rose-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Trocar Vídeo</span>
          </button>
        )}
      </div>

      {/* Input de Arquivo Oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/mov"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSelectVideo(file);
        }}
      />

      {/* Mensagem de Erro (se houver) */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* ÁREA DE ANEXAR VÍDEO (Quando ainda não anexou) */}
      {!videoFile && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 border-2 border-dashed border-zinc-700 hover:border-sky-500/70 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900/50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all group shadow-inner"
        >
          <div className="p-3 rounded-2xl bg-zinc-800/80 group-hover:bg-sky-500/20 text-zinc-400 group-hover:text-sky-300 transition-colors">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
              Anexe aqui o vídeo para verificação
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Clique para selecionar o vídeo gerado no Veo 3 (.mp4 ou .mov)
            </p>
          </div>
        </div>
      )}

      {/* QUANDO O VÍDEO ESTÁ ANEXADO */}
      {videoFile && (
        <div className="space-y-3.5">
          {/* Card com Detalhes do Vídeo Anexado + Botão Analisar */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                {videoPreviewUrl ? (
                  <video
                    src={videoPreviewUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <FileVideo className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {videoFile.name}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {videoDuration ? `${videoDuration}s de duração` : 'Carregando...'} • {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAuditVideo}
              disabled={isProcessing}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
                audit
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isProcessing
                  ? statusMessage || 'Analisando vídeo...'
                  : audit
                  ? 'Reanalisar Vídeo'
                  : 'Analisar Vídeo'}
              </span>
            </button>
          </div>

          {/* PAINEL DE RESULTADO DA AUDITORIA */}
          {audit && (
            <div className="space-y-3 pt-1">
              {/* Box de Veredito Geral */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${boxStyles?.cell}`}>
                <div className="flex items-center gap-2.5">
                  {audit.overallStatus === 'green' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : audit.overallStatus === 'yellow' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <AlertCircle
                      className={`w-5 h-5 shrink-0 ${
                        audit.overallStatus === 'orange' ? 'text-orange-400' : 'text-rose-400'
                      }`}
                    />
                  )}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide leading-tight">
                      {audit.overallLabel}
                    </h4>
                    <p className="text-[11px] opacity-90 leading-snug mt-0.5">
                      {audit.summary}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-base font-black block">
                    {audit.overallScore}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-80 block">
                    Fidelidade
                  </span>
                </div>
              </div>

              {/* Grade com os Frames Analisados a cada 2s */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 px-0.5">
                  <span>{audit.frames.length} Frames Analisados (1 a cada 2 segundos):</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    Meta rigorosa TikTok Shop &ge; 90%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {audit.frames.map((frame) => {
                    const fStyles = getAuditBoxClasses(frame.status);
                    return (
                      <div
                        key={frame.frameNumber}
                        className={`p-2 rounded-xl border flex flex-col justify-between gap-2 transition-all ${fStyles.cell}`}
                      >
                        {/* Thumbnail do Frame com botão de preview */}
                        <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black/60 border border-white/10 group">
                          {frame.frameThumbnail ? (
                            <img
                              src={frame.frameThumbnail}
                              alt={`Frame ${frame.frameNumber}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                              Frame {frame.frameNumber}
                            </div>
                          )}

                          {frame.frameThumbnail && onOpenPreview && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenPreview(
                                  frame.frameThumbnail!,
                                  `Frame ${frame.frameNumber} (${frame.second}s) • ${productName}`
                                )
                              }
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                              title="Ampliar Frame"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white border border-white/20">
                            {frame.second}s
                          </div>

                          <div
                            className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-black border ${fStyles.badge}`}
                          >
                            {frame.score}%
                          </div>
                        </div>

                        {/* Detalhes do Frame */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-extrabold">
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${fStyles.dot}`} />
                              Frame {frame.frameNumber}
                            </span>
                            <span className="font-mono">{frame.score}%</span>
                          </div>
                          <p className="text-[10px] leading-tight opacity-90 line-clamp-3" title={frame.issue}>
                            {frame.issue}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legenda de Cores */}
              <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-white/10 text-[9px] text-zinc-400">
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> &ge;90% Aprovado (Vídeo Liberado)
                </span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  ● 71–89% Pode Passar (Razoável)
                </span>
                <span className="text-orange-300 font-bold flex items-center gap-1">
                  ● 60–70% Cuidado (Variação Moderada)
                </span>
                <span className="text-rose-300 font-bold flex items-center gap-1">
                  ● &lt;60% Risco de Restrição (Reprovado)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
