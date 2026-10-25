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
  ImagePlus,
  X,
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

/**
 * Extrai frames adicionais em segundos específicos (Etapa 2: Amostragem Adaptativa 1 frame/s nas regiões suspeitas)
 */
async function extractTargetedVideoFrames(
  videoFile: File,
  targetTimestamps: number[]
): Promise<{ second: number; frameBase64: string }[]> {
  if (!targetTimestamps || targetTimestamps.length === 0) return [];
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const fileUrl = URL.createObjectURL(videoFile);
    video.src = fileUrl;

    video.onloadedmetadata = async () => {
      const duration = video.duration || 10;
      const validTimes = targetTimestamps
        .map((t) => Math.round(t * 10) / 10)
        .filter((t) => t >= 0.2 && t <= Math.max(0.5, duration - 0.1));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx || validTimes.length === 0) {
        URL.revokeObjectURL(fileUrl);
        resolve([]);
        return;
      }

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

      for (const time of validTimes) {
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
              console.warn('Erro ao desenhar frame extra:', drawErr);
            }
            res();
          };

          video.addEventListener('seeked', onSeeked);
          video.currentTime = time;

          setTimeout(() => {
            if (!isDone) {
              isDone = true;
              video.removeEventListener('seeked', onSeeked);
              res();
            }
          }, 2000);
        });
      }

      URL.revokeObjectURL(fileUrl);
      resolve(extracted);
    };

    video.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      resolve([]);
    };
  });
}

/**
 * Redimensiona fotos de referência para max 600px JPEG 0.80 antes do envio,
 * evitando estourar o limite de 4.5MB da Vercel e acelerando a resposta.
 */
async function compressPhotoForVideoAudit(
  dataUrl: string,
  maxSide = 600,
  quality = 0.80
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.width || 600;
        let h = img.height || 600;
        if (w > maxSide || h > maxSide) {
          if (w > h) {
            h = Math.round((h * maxSide) / w);
            w = maxSide;
          } else {
            w = Math.round((w * maxSide) / h);
            h = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
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
  const [customReferencePhotos, setCustomReferencePhotos] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [audit, setAudit] = useState<VideoFidelityAudit | null>(initialAudit || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refPhotosInputRef = useRef<HTMLInputElement>(null);

  // Se o usuário anexou imagens neste campo, usa ELAS como referência; caso contrário, usa as da página anterior
  const effectiveReferencePhotos =
    customReferencePhotos.length > 0 ? customReferencePhotos : referencePhotos;

  const handleSelectReferencePhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    const fileArray = Array.from(files);
    Promise.all(
      fileArray.map(
        (f) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(f);
          })
      )
    ).then((loaded) => {
      const valid = loaded.filter(Boolean);
      if (valid.length > 0) {
        setCustomReferencePhotos((prev) => [...prev, ...valid].slice(0, 10));
      }
      if (refPhotosInputRef.current) {
        refPhotosInputRef.current.value = '';
      }
    });
  };

  const handleRemoveCustomPhoto = (index: number) => {
    setCustomReferencePhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearCustomPhotos = () => {
    setCustomReferencePhotos([]);
    if (refPhotosInputRef.current) {
      refPhotosInputRef.current.value = '';
    }
  };

  const handleAuditVideo = async (overrideFile?: File) => {
    const fileToAudit = overrideFile || videoFile;
    if (!fileToAudit) return;

    if (!effectiveReferencePhotos || effectiveReferencePhotos.length === 0) {
      setErrorMessage(
        'Nenhuma foto de referência do produto foi encontrada. Anexe fotos no campo ao lado ou na etapa anterior.'
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Extraindo frames a cada 2 segundos do vídeo...');

    try {
      // 1. Extração no cliente de 1 frame a cada 2s + compressão das fotos de referência (priorizando as anexadas aqui, ou da etapa anterior)
      const [frames, compressedRefs] = await Promise.all([
        extractVideoFramesEvery2s(fileToAudit),
        Promise.all(
          effectiveReferencePhotos.slice(0, 6).map((p) => compressPhotoForVideoAudit(p, 600, 0.80))
        ),
      ]);

      if (frames.length === 0) {
        throw new Error('Falha ao extrair frames do vídeo.');
      }

      setStatusMessage(`Fiscalizando ${frames.length} frames com OpenAI (gpt-4o-mini)...`);

      const payloadBody = JSON.stringify({
        videoFrames: frames,
        productPhotosBase64: compressedRefs,
        productName,
        productLock,
      });

      // 2. Envio para a rota de auditoria (tenta /api/produtos2-audit-storyboard e fallback /api/produtos2-audit-video)
      const endpoints = ['/api/produtos2-audit-storyboard', '/api/produtos2-audit-video'];
      let parsedData: any = null;
      let lastErrorMsg = 'Falha ao conectar com o servidor de auditoria de vídeo.';

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payloadBody,
          });

          const rawText = await res.text();
          if (!rawText || rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
            lastErrorMsg = `Rota indisponível (${res.status})`;
            continue;
          }

          const json = JSON.parse(rawText);
          if (res.ok && json && json.success && json.audit) {
            parsedData = json;
            break;
          } else if (json && json.error) {
            lastErrorMsg = json.error;
            if (!String(json.error).toLowerCase().includes('storyboard')) {
              break;
            }
          }
        } catch (fetchErr: any) {
          lastErrorMsg = fetchErr?.message || lastErrorMsg;
        }
      }

      if (!parsedData || !parsedData.success || !parsedData.audit) {
        throw new Error(lastErrorMsg || 'Falha ao auditar vídeo.');
      }

      let finalAudit: VideoFidelityAudit = parsedData.audit;
      let finalUsage: any = parsedData.usage;

      // ETAPA 2 (AMOSTRAGEM ADAPTATIVA): Se houver frames suspeitos (<90%), extrai 1 frame/s na região suspeita
      const stage1Frames = Array.isArray(finalAudit.frames) ? finalAudit.frames : [];
      const suspiciousFrames = stage1Frames.filter((f) => Number(f.score) < 90);

      if (suspiciousFrames.length > 0) {
        const existingSeconds = stage1Frames.map((f) => Number(f.second));
        const candidateTimesSet = new Set<number>();

        suspiciousFrames.forEach((sf) => {
          const s = Number(sf.second);
          // Adiciona 1s antes e 1s depois (passando a frequência de 2s para 1 frame/s no trecho suspeito)
          [s - 1, s + 1].forEach((cand) => {
            const rounded = Math.round(cand * 10) / 10;
            if (
              rounded >= 0.4 &&
              !existingSeconds.some((ex) => Math.abs(ex - rounded) < 0.4)
            ) {
              candidateTimesSet.add(rounded);
            }
          });
        });

        const extraTimes = Array.from(candidateTimesSet).sort((a, b) => a - b).slice(0, 6);

        if (extraTimes.length > 0) {
          const suspLabel = suspiciousFrames.map((f) => `${f.second}s`).join(', ');
          setStatusMessage(
            `Sinal suspeito em ${suspLabel} — inspecionando 1 frame/s no trecho para confirmação...`
          );

          const extraExtracted = await extractTargetedVideoFrames(fileToAudit, extraTimes);

          if (extraExtracted.length > 0) {
            // Monta janela direcionada: frames originais próximos aos pontos suspeitos + novos frames de 1f/s
            const contextOriginals = frames.filter((orig) =>
              suspiciousFrames.some((sf) => Math.abs(orig.second - Number(sf.second)) <= 2.2)
            );

            const targetedFramesInput = [...contextOriginals, ...extraExtracted].sort(
              (a, b) => a.second - b.second
            );

            const stage2Payload = JSON.stringify({
              videoFrames: targetedFramesInput,
              productPhotosBase64: compressedRefs,
              productName,
              productLock,
              isTargetedPass: true,
              suspiciousSeconds: suspiciousFrames.map((f) => f.second),
            });

            for (const endpoint of endpoints) {
              try {
                const res2 = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: stage2Payload,
                });
                const raw2 = await res2.text();
                if (!raw2 || raw2.trim().startsWith('<')) continue;
                const json2 = JSON.parse(raw2);
                if (res2.ok && json2?.success && json2?.audit?.frames) {
                  // Mescla os frames da Etapa 1 com os frames refinados/adicionais da Etapa 2
                  const refinedMap = new Map<number, any>();
                  stage1Frames.forEach((f) => refinedMap.set(Math.round(Number(f.second) * 10), f));
                  json2.audit.frames.forEach((f2: any) => {
                    refinedMap.set(Math.round(Number(f2.second) * 10), f2);
                  });

                  const mergedFrames = Array.from(refinedMap.values())
                    .sort((a, b) => Number(a.second) - Number(b.second))
                    .map((item, idx) => ({
                      ...item,
                      frameNumber: idx + 1,
                    }));

                  const scores = mergedFrames.map((f) => Number(f.score));
                  const minScore = Math.min(...scores);
                  const avgScore = Math.round(
                    scores.reduce((a, b) => a + b, 0) / scores.length
                  );

                  let overallScore = avgScore;
                  let overallStatus: Produtos2AuditColorStatus = 'green';
                  let overallLabel = 'Aprovado: Vídeo Liberado';

                  if (minScore < 60) {
                    overallStatus = 'red';
                    overallScore = Math.min(59, minScore);
                    overallLabel = 'Risco de Restrição: Reprovado';
                  } else if (minScore <= 70) {
                    overallStatus = 'orange';
                    overallScore = Math.min(70, minScore);
                    overallLabel = 'Cuidado: Variação Moderada';
                  } else if (minScore < 90) {
                    overallStatus = 'yellow';
                    overallScore = Math.min(89, minScore);
                    overallLabel = 'Pode Passar: Razoável';
                  } else {
                    overallStatus = 'green';
                    overallScore = avgScore;
                    overallLabel = 'Aprovado: Vídeo Liberado';
                  }

                  finalAudit = {
                    overallScore,
                    overallStatus,
                    overallLabel,
                    summary: json2.audit.summary || finalAudit.summary,
                    frames: mergedFrames,
                  };

                  if (finalUsage && json2.usage) {
                    finalUsage = {
                      ...finalUsage,
                      promptTokens: (finalUsage.promptTokens || 0) + (json2.usage.promptTokens || 0),
                      completionTokens:
                        (finalUsage.completionTokens || 0) + (json2.usage.completionTokens || 0),
                      totalTokens: (finalUsage.totalTokens || 0) + (json2.usage.totalTokens || 0),
                      costUSD:
                        Math.round(((finalUsage.costUSD || 0) + (json2.usage.costUSD || 0)) * 10000) /
                        10000,
                      costBRL:
                        Math.round(((finalUsage.costBRL || 0) + (json2.usage.costBRL || 0)) * 100) /
                        100,
                    };
                  }
                  break;
                }
              } catch (stage2Err) {
                console.warn('Aviso na Etapa 2 adaptativa (mantendo Etapa 1):', stage2Err);
              }
            }
          }
        }
      }

      setAudit(finalAudit);
      onAuditChange?.(finalAudit);
      onAuditComplete?.(finalAudit, finalUsage);
    } catch (err: any) {
      console.error('Erro na auditoria de vídeo:', err);
      setErrorMessage(err?.message || 'Erro durante a auditoria do vídeo.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

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

    // Inicia automaticamente a análise assim que o vídeo é anexado
    void handleAuditVideo(file);
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
              Varredura adaptativa (1 frame a cada 2s; se detectar trecho suspeito, aprofunda para 1 frame/s na região) comparando com as fotos reais.
            </p>
          </div>
        </div>
      </div>

      {/* Inputs de Arquivo Ocultos */}
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
      <input
        ref={refPhotosInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleSelectReferencePhotos(e.target.files)}
      />

      {/* Mensagem de Erro (se houver) */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* LINHA LADO A LADO: CAMPO DE ANEXAR VÍDEO + CAMPO DISCRETO DE FOTOS DE REFERÊNCIA (OPCIONAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
        {/* Coluna Esquerda (7 cols): Anexar Vídeo ou Detalhes do Vídeo Anexado */}
        <div className="sm:col-span-7 flex flex-col">
          {!videoFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 p-5 border-2 border-dashed border-zinc-700 hover:border-sky-500/70 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900/50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all group shadow-inner"
            >
              <div className="p-2.5 rounded-2xl bg-zinc-800/80 group-hover:bg-sky-500/20 text-zinc-400 group-hover:text-sky-300 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                  Anexe aqui o vídeo para verificação
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Ao selecionar o vídeo (.mp4 ou .mov), a análise inicia automaticamente
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-3 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
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
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">
                    {videoFile.name}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {videoDuration ? `${videoDuration}s de duração` : 'Carregando...'} •{' '}
                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-300 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 text-slate-950 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>
                  {isProcessing
                    ? statusMessage || 'Analisando...'
                    : 'Trocar Vídeo'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Coluna Direita (5 cols): Campo Discreto de Anexar Imagens de Referência (Opcional) */}
        <div className="sm:col-span-5 flex flex-col">
          <div
            className={`flex-1 p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
              customReferencePhotos.length > 0
                ? 'bg-sky-950/25 border-sky-500/40'
                : 'bg-zinc-950/40 border-zinc-800/90 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <ImagePlus className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-[11px] font-bold text-zinc-300 truncate">
                  Fotos de referência (opcional)
                </span>
              </div>
              {customReferencePhotos.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearCustomPhotos}
                  className="text-[10px] text-zinc-400 hover:text-rose-400 font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Limpar ({customReferencePhotos.length})
                </button>
              ) : (
                <span className="text-[9px] text-zinc-500 font-medium shrink-0">
                  Padrão: fotos anteriores ({referencePhotos?.length || 0})
                </span>
              )}
            </div>

            {customReferencePhotos.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {customReferencePhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative w-9 h-9 rounded-lg overflow-hidden border border-sky-400/40 bg-zinc-900 group shrink-0"
                  >
                    <img
                      src={photo}
                      alt={`Ref ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomPhoto(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-300 transition-opacity cursor-pointer"
                      title="Remover foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => refPhotosInputRef.current?.click()}
                  className="w-9 h-9 rounded-lg border border-dashed border-sky-400/40 hover:border-sky-400 bg-sky-500/10 hover:bg-sky-500/20 flex items-center justify-center text-sky-300 transition-colors cursor-pointer shrink-0"
                  title="Adicionar mais fotos de referência"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => refPhotosInputRef.current?.click()}
                className="w-full py-2 px-2.5 rounded-xl border border-dashed border-zinc-700/80 hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-900 text-[10px] text-zinc-400 hover:text-zinc-200 font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5 text-zinc-400" />
                <span>Anexar fotos específicas para este vídeo</span>
              </button>
            )}

            <p className="text-[9px] text-zinc-500 leading-tight">
              {customReferencePhotos.length > 0
                ? `Usando ${customReferencePhotos.length} foto(s) anexada(s) aqui como referência.`
                : 'Se não anexar aqui, usa automaticamente as fotos do produto da página anterior.'}
            </p>
          </div>
        </div>
      </div>

      {/* STATUS DE PROCESSAMENTO DURANTE A ANÁLISE DO VÍDEO */}
      {isProcessing && (
        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-sky-500/30 flex items-center justify-center gap-2 text-center animate-fade-in">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          <p className="text-xs font-bold text-sky-300">
            {statusMessage || 'Analisando fidelidade do vídeo...'}
          </p>
        </div>
      )}

      {/* QUANDO O VÍDEO ESTÁ ANEXADO E JÁ TEM AUDITORIA */}
      {videoFile && (
        <div className="space-y-3.5">
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
