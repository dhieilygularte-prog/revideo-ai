import React, { useState, useRef } from 'react';
import {
  Video,
  Upload,
  Layers,
  Filter,
  Copy,
  Check,
  Sparkles,
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
  Download,
  Search,
} from 'lucide-react';
import {
  VideoFidelityAudit,
  VideoAuditFinding,
  Produtos2AuditColorStatus,
  BatchVideoFidelityAudit,
  BatchVideoAuditResultItem,
} from './types';

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

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Extrai frames de 1 em 1 segundo (0s, 1s, 2s, 3s, 4s, 5s, 6s, 7s, 8s, 9s...)
 * em ALTA DEFINIÇÃO (até 960px no lado maior, qualidade JPEG 0.90) para que nenhum detalhe
 * (como número de lentes de câmera, flash, botões ou textos) fique borrado ou pequeno.
 */
async function extractHighResVideoFrames1fps(
  videoFile: File
): Promise<{
  frames: { second: number; frameBase64: string }[];
  durationSeconds: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const fileUrl = URL.createObjectURL(videoFile);
    video.src = fileUrl;

    video.onloadedmetadata = async () => {
      const rawDuration = video.duration || 10;
      const durationSeconds = Math.round(rawDuration * 10) / 10;
      const targetTimes: number[] = [];

      // Para vídeos até 15s (99% dos vídeos do Veo: 8s, 10s, 12s, 15s), extrai de 1 em 1 segundo (0s, 1s, 2s...)
      const step = durationSeconds <= 15.5 ? 1 : 2;
      const maxSecond = Math.max(0, Math.floor(durationSeconds - 0.15));

      for (let sec = 0; sec <= maxSecond; sec += step) {
        targetTimes.push(sec);
      }

      if (targetTimes.length === 0) {
        targetTimes.push(0);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(fileUrl);
        reject(new Error('Canvas não suportado no navegador.'));
        return;
      }

      // Alta resolução por frame (até 1280px no lado maior, ex: 720x1280px HD) para nitidez máxima das lentes/componentes
      let w = video.videoWidth || 720;
      let h = video.videoHeight || 1280;
      const maxSide = 1280;
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
        const seekTarget = time === 0 ? 0.08 : time;
        await new Promise<void>((res) => {
          let isDone = false;
          const onSeeked = () => {
            if (isDone) return;
            isDone = true;
            video.removeEventListener('seeked', onSeeked);
            try {
              ctx.drawImage(video, 0, 0, w, h);
              const b64 = canvas.toDataURL('image/jpeg', 0.88);
              extracted.push({ second: time, frameBase64: b64 });
            } catch (drawErr) {
              console.warn('Erro ao desenhar frame:', drawErr);
            }
            res();
          };

          video.addEventListener('seeked', onSeeked);
          video.currentTime = seekTarget;

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
      resolve({ frames: extracted, durationSeconds });
    };

    video.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      reject(
        new Error(
          'Não foi possível ler o arquivo de vídeo. Certifique-se de que é um formato válido (.mp4, .webm ou .mov).'
        )
      );
    };
  });
}

/**
 * Gera a imagem PNG "COMPARAÇÃO VISUAL — [COMPONENTE]" lado a lado:
 * Lado esquerdo: REFERÊNCIA ORIGINAL (recorte focado no componente sem distorcer proporção)
 * Lado direito: CAPTURA REAL DO VÍDEO — 00:XX (recorte focado no mesmo componente no frame do vídeo)
 */
async function buildVisualComparisonBanner(params: {
  finding: VideoAuditFinding;
  referencePhotoUrl: string;
  videoFrameUrl: string;
  second: number;
}): Promise<string> {
  const { finding, referencePhotoUrl, videoFrameUrl, second } = params;
  if (!referencePhotoUrl || !videoFrameUrl) return '';

  try {
    const [refImg, vidImg] = await Promise.all([
      loadImageElement(referencePhotoUrl),
      loadImageElement(videoFrameUrl),
    ]);

    const W = 1200;
    const H = 650;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Cabeçalho superior (idêntico à prancha pericial 1200x650)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const titleUpper = (finding.title || 'COMPONENTE ANALISADO').toUpperCase();
    ctx.fillText(`COMPARAÇÃO VISUAL — ${titleUpper}`, 32, 26);

    ctx.fillStyle = '#3f3f46';
    ctx.font = '16px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(
      'Recortes de imagens reais fornecidas; recortes mantêm o conteúdo original.',
      32,
      62
    );

    // Rótulos das duas colunas e caixas quadradas periciais (1:1)
    const colY = 114;
    const boxSize = 470;
    const leftX = 65;
    const rightX = 665;
    const imgTopY = 148;

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 21px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('REFERÊNCIA ORIGINAL', leftX, colY);

    const formattedSec = `00:${String(Math.max(0, Math.round(second))).padStart(2, '0')}`;
    ctx.fillText(`CAPTURA REAL DO VÍDEO — ${formattedSec}`, rightX, colY);

    // Função para recortar um QUADRADO perfeito (1:1) centralizado no componente
    // com margem de respito suficiente para NUNCA cortar lentes ou detalhes pela metade
    const drawSquareCropped = (
      img: HTMLImageElement,
      cropBox: [number, number, number, number] | undefined,
      destX: number,
      destY: number,
      destSize: number
    ) => {
      const iw = img.naturalWidth || img.width || 600;
      const ih = img.naturalHeight || img.height || 600;

      let cx = iw / 2;
      let cy = ih / 2;
      let boxW = iw * 0.45;
      let boxH = ih * 0.45;

      if (cropBox && Array.isArray(cropBox) && cropBox.length === 4) {
        let [ymin, xmin, ymax, xmax] = cropBox;
        if (ymax <= 100 && xmax <= 100 && (ymax > 1 || xmax > 1)) {
          ymin *= 10;
          xmin *= 10;
          ymax *= 10;
          xmax *= 10;
        }
        const pxX1 = (Math.max(0, Math.min(1000, xmin)) / 1000) * iw;
        const pxY1 = (Math.max(0, Math.min(1000, ymin)) / 1000) * ih;
        const pxX2 = (Math.max(0, Math.min(1000, xmax)) / 1000) * iw;
        const pxY2 = (Math.max(0, Math.min(1000, ymax)) / 1000) * ih;

        cx = (pxX1 + pxX2) / 2;
        cy = (pxY1 + pxY2) / 2;
        boxW = Math.max(40, Math.abs(pxX2 - pxX1));
        boxH = Math.max(40, Math.abs(pxY2 - pxY1));
      } else if (ih > iw) {
        // Para vídeos verticais (9:16), o produto/celular nas mãos fica na metade superior
        cx = iw * 0.38;
        cy = ih * 0.38;
        boxW = iw * 0.55;
        boxH = ih * 0.40;
      }

      // Expande com 45% de margem em torno do componente para enquadrar completamente sem cortar nada na lateral ou na vertical
      const targetSide = Math.max(boxW, boxH) * 1.45;
      const maxPossible = Math.min(iw, ih);
      const minPossible = Math.min(maxPossible, Math.max(160, maxPossible * 0.35));
      const squareSide = Math.max(minPossible, Math.min(maxPossible, targetSide));

      let sx = Math.round(cx - squareSide / 2);
      let sy = Math.round(cy - squareSide / 2);

      if (sx < 0) sx = 0;
      if (sy < 0) sy = 0;
      if (sx + squareSide > iw) sx = Math.max(0, iw - Math.round(squareSide));
      if (sy + squareSide > ih) sy = Math.max(0, ih - Math.round(squareSide));

      const sw = Math.min(iw - sx, Math.round(squareSide));
      const sh = Math.min(ih - sy, Math.round(squareSide));

      // Fundo cinza suave neutro antes de desenhar a imagem
      ctx.fillStyle = '#f4f4f5';
      ctx.fillRect(destX, destY, destSize, destSize);

      ctx.drawImage(img, sx, sy, sw, sh, destX, destY, destSize, destSize);

      // Borda sutil pericial ao redor do quadrado
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(destX, destY, destSize, destSize);
    };

    drawSquareCropped(refImg, finding.refCropBox, leftX, imgTopY, boxSize);
    drawSquareCropped(vidImg, finding.videoCropBox, rightX, imgTopY, boxSize);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Erro ao gerar imagem de comparação visual:', err);
    return '';
  }
}


/**
 * Extrai 5 frames-chave representativos de cada vídeo do lote (0s, 2s, 4s, 7s, 9s)
 * em resolução compacta e nítida (480px, JPEG 0.78), otimizando a transmissão
 * para permitir até 25 vídeos por requisição com velocidade máxima e custo mínimo de tokens.
 */
async function extractKeyFramesForBatchVideo(
  videoFile: File,
  frameCount = 5
): Promise<{
  frames: { second: number; frameBase64: string }[];
  durationSeconds: number;
  thumbnail: string;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const fileUrl = URL.createObjectURL(videoFile);
    video.src = fileUrl;

    video.onloadedmetadata = async () => {
      const rawDuration = video.duration || 10;
      const durationSeconds = Math.round(rawDuration * 10) / 10;

      const targetTimes: number[] = [];
      const startT = Math.min(1.0, Math.max(0.6, durationSeconds * 0.08));
      const endT = Math.max(startT + 1, durationSeconds - 0.5);
      const step = (endT - startT) / Math.max(1, frameCount - 1);
      for (let i = 0; i < frameCount; i++) {
        targetTimes.push(Math.round((startT + step * i) * 10) / 10);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(fileUrl);
        reject(new Error('Canvas indisponível.'));
        return;
      }

      let w = video.videoWidth || 720;
      let h = video.videoHeight || 1280;
      // 640px para 9:16 vertical = 360x640px (máxima resolução e nitidez na cintura/barriga e costuras de entrepernas mantendo payload seguro <1.3MB por lote de 10 vídeos)
      const maxSide = 640;
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
              const b64 = canvas.toDataURL('image/jpeg', 0.76);
              extracted.push({ second: time, frameBase64: b64 });
            } catch (drawErr) {
              console.warn('Erro ao desenhar frame do lote:', drawErr);
            }
            res();
          };

          video.addEventListener('seeked', onSeeked);
          video.currentTime = Math.max(0.08, time);

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
      const thumbnail = extracted[0]?.frameBase64 || '';
      resolve({ frames: extracted, durationSeconds, thumbnail });
    };

    video.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      reject(new Error(`Erro ao carregar o vídeo ${videoFile.name}.`));
    };
  });
}

/**
 * Mantém as fotos de referência em ALTA DEFINIÇÃO (até 1024px JPEG 0.90)
 * para preservar cada detalhe das lentes, botões, texturas e logotipos.
 */
async function compressPhotoForVideoAudit(
  dataUrl: string,
  maxSide = 1024,
  quality = 0.9
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.width || 800;
        let h = img.height || 800;
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

function downloadDataUrlFile(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  const [videoDuration, setVideoDuration] = useState<number | null>(
    initialAudit?.videoDurationSeconds || null
  );
  const [customReferencePhotos, setCustomReferencePhotos] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [audit, setAudit] = useState<VideoFidelityAudit | null>(initialAudit || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refPhotosInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Estados do Modo em Lote (Até 25 Vídeos)
  const [auditMode, setAuditMode] = useState<'single' | 'batch'>('single');
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchAudit, setBatchAudit] = useState<BatchVideoFidelityAudit | null>(null);
  const [batchFilter, setBatchFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [copiedBatchApproved, setCopiedBatchApproved] = useState(false);

  // Se o usuário anexou imagens neste campo, usa ELAS como referência; caso contrário, usa as da página anterior
  const effectiveReferencePhotos =
    customReferencePhotos.length > 0 ? customReferencePhotos : referencePhotos;

  const handleSelectReferencePhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    const fileArray = Array.from(files);
    Promise.all(
      fileArray.map(
        (f: any) =>
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
    setStatusMessage('Extraindo capturas de 1 em 1 segundo em alta resolução...');

    try {
      // 1. Extração de 1 em 1 segundo em alta resolução (960px) + fotos de referência em alta definição (1024px)
      const [extractionResult, compressedRefs] = await Promise.all([
        extractHighResVideoFrames1fps(fileToAudit),
        Promise.all(
          effectiveReferencePhotos.slice(0, 6).map((p) => compressPhotoForVideoAudit(p, 1024, 0.9))
        ),
      ]);

      const { frames, durationSeconds } = extractionResult;
      setVideoDuration(durationSeconds);

      if (frames.length === 0) {
        throw new Error('Falha ao extrair frames do vídeo.');
      }

      setStatusMessage(
        `Inspecionando capturas de 1 em 1 segundo (${frames.length} frames) contra ${compressedRefs.length} imagem(ns) de referência...`
      );

      // Envia TODOS os frames (0s..9s) compactados para o servidor (garantindo que o segundo exato do erro, ex: 4s, esteja sempre presente para inspeção e recorte pericial!),
      // mantendo os frames em resolução máxima (720x1280) na memória do navegador para montar a Comparação Visual.
      const allFramesPayload = await Promise.all(
        frames.map(async (f: any) => ({
          second: f.second,
          frameBase64: await compressPhotoForVideoAudit(f.frameBase64, 720, 0.8),
        }))
      );

      const payloadBody = JSON.stringify({
        videoFrames: allFramesPayload,
        productPhotosBase64: compressedRefs,
        productName,
        productLock,
        videoFileName: fileToAudit.name,
        videoDurationSeconds: durationSeconds,
      });

      const endpoints = ['/api/produtos2-audit-video', '/api/produtos2-audit-storyboard'];
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
          if (
            !rawText ||
            rawText.trim().startsWith('<!DOCTYPE') ||
            rawText.trim().startsWith('<html')
          ) {
            lastErrorMsg = `Rota indisponível (${res.status})`;
            continue;
          }

          const json = JSON.parse(rawText);
          if (res.ok && json && json.success && json.audit) {
            parsedData = json;
            break;
          } else if (json && json.error) {
            lastErrorMsg = json.error;
          }
        } catch (fetchErr: any) {
          lastErrorMsg = fetchErr?.message || lastErrorMsg;
        }
      }

      if (!parsedData || !parsedData.success || !parsedData.audit) {
        throw new Error(lastErrorMsg || 'Falha ao auditar vídeo.');
      }

      // Hidrata cada frame retornado com a captura em ALTA DEFINIÇÃO (720x1280px) que já está na memória do navegador
      // e garante que nenhum frame com diagnóstico limpo ("Produto consistente...") fique vermelho!
      const hydratedFrames = Array.isArray(parsedData.audit.frames)
        ? parsedData.audit.frames.map((af: any, idx: number) => {
            const matchedLocal =
              frames.find((lf) => Math.abs(lf.second - Number(af.second)) < 0.3) || frames[idx];
            const cleanIssue = String(af.issue || '')
              .replace(/^(?:frame|captura|quadro|cena)\s*\d+\s*(?:\(\s*\d+\s*s\s*\))?\s*[:\-–—]\s*/i, '')
              .replace(/^\(\s*\d+\s*s\s*\)\s*[:\-–—]\s*/i, '')
              .trim();
            const isExplicitlyClean =
              /sem inconsist|sem diverg|sem distor|sem erro|consistente com a|consistente com as|produto consistente|fiel à referência|correto|aprovado/i.test(
                cleanIssue
              );
            const finalScore = isExplicitlyClean ? 94 : Number(af.score ?? 94);
            const finalStatus =
              finalScore >= 90
                ? 'green'
                : finalScore >= 71
                ? 'yellow'
                : finalScore >= 60
                ? 'orange'
                : 'red';
            return {
              ...af,
              second: matchedLocal?.second ?? Number(af.second ?? idx),
              score: finalScore,
              status: finalStatus,
              issue: cleanIssue,
              frameThumbnail: matchedLocal?.frameBase64 || af.frameThumbnail,
            };
          })
        : [];

      let finalAudit: VideoFidelityAudit = {
        ...parsedData.audit,
        frames: hydratedFrames,
        contactSheetUrl: undefined,
        videoFileName: fileToAudit.name,
        videoDurationSeconds: durationSeconds,
      };

      // Gerar os cartões PNG de "COMPARAÇÃO VISUAL REAL" (Referência Original vs Captura Real do Vídeo) para cada achado
      // Seguindo estritamente as Etapas A–F do protocolo: vincula a comparação ao frame real reprovado onde o defeito aparece!
      if (Array.isArray(finalAudit.findings) && finalAudit.findings.length > 0) {
        setStatusMessage('Gerando recortes de comparação visual real lado a lado...');
        // REGRA DE OURO DEFINITIVA DO USUÁRIO:
        // Quem manda na imagem que aparece em "CAPTURA REAL DO VÍDEO" é ESTRITAMENTE o frame em VERMELHO
        // (reprovado) das 10 Capturas Individuais abaixo!
        const redFramesList = hydratedFrames.filter(
          (f: any) =>
            f.status === 'red' ||
            f.score < 60 ||
            (f.score < 75 &&
              !/sem inconsist|consistente com a|consistente com as|produto consistente/i.test(
                f.issue || ''
              ))
        );
        const defectFramesList =
          redFramesList.length > 0 ? redFramesList : hydratedFrames.filter((f: any) => f.score < 80);

        const enrichedFindings = await Promise.all(
          finalAudit.findings.map(async (finding, fIdx) => {
            const refIdx = Math.max(
              0,
              Math.min(compressedRefs.length - 1, (Number(finding.bestRefIndex) || 1) - 1)
            );
            const refUrl = compressedRefs[refIdx] || compressedRefs[0];

            // 1. O frame com erro em vermelho nas 10 capturas individuais manda na captura real:
            const chosenDefect = defectFramesList[fIdx] || defectFramesList[0];
            const targetSec = chosenDefect ? chosenDefect.second : Number(finding.bestFrameSecond ?? 4);

            // 2. Localiza no array local de frames o frame exato do erro em vermelho (ex: Frame 5 aos 4s)
            const matchedFrame =
              (chosenDefect &&
                (frames.find((f: any) => Math.abs(f.second - chosenDefect.second) < 0.5) ||
                  frames[chosenDefect.frameNumber - 1])) ||
              frames.find((f: any) => Math.abs(f.second - targetSec) < 0.5) ||
              frames.reduce(
                (best, curr) =>
                  Math.abs(curr.second - targetSec) < Math.abs(best.second - targetSec) ? curr : best,
                frames[0]
              );

            const improvedTitle =
              !finding.title || /^ponto de inspe[çc][ãa]o/i.test(finding.title.trim())
                ? chosenDefect?.issue?.replace(/\.$/, '') || finding.title
                : finding.title;

            const improvedWhat =
              finding.whatAppearsInVideo || chosenDefect?.issue || '';

            const formattedTime = `00:${String(Math.max(0, Math.round(matchedFrame.second))).padStart(2, '0')}`;
            const improvedWhere = chosenDefect
              ? `Frame ${chosenDefect.frameNumber} (${matchedFrame.second}s — ${formattedTime})`
              : finding.whereItAppears || `${matchedFrame.second}s (${formattedTime})`;

            const updatedFinding: VideoAuditFinding = {
              ...finding,
              title: improvedTitle,
              whatAppearsInVideo: improvedWhat,
              whereItAppears: improvedWhere,
              bestFrameSecond: matchedFrame.second,
            };

            if (refUrl && matchedFrame?.frameBase64) {
              const compUrl = await buildVisualComparisonBanner({
                finding: updatedFinding,
                referencePhotoUrl: refUrl,
                videoFrameUrl: matchedFrame.frameBase64,
                second: matchedFrame.second,
              });
              return {
                ...updatedFinding,
                comparisonImageUrl: compUrl || undefined,
              };
            }
            return updatedFinding;
          })
        );
        finalAudit = {
          ...finalAudit,
          findings: enrichedFindings,
        };
      }

      setAudit(finalAudit);
      onAuditChange?.(finalAudit);
      onAuditComplete?.(finalAudit, parsedData.usage);
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

  const handleSelectBatchFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    const newFiles = Array.from(files).filter((f) =>
      /\.(mp4|webm|mov|quicktime)$/i.test(f.name) || f.type.startsWith('video/')
    );
    if (newFiles.length === 0) {
      setErrorMessage('Nenhum formato de vídeo válido detectado (.mp4, .webm ou .mov).');
      return;
    }
    setBatchFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 25) {
        setErrorMessage('Limite máximo de 25 vídeos atingido. Foram mantidos os 25 primeiros.');
        return combined.slice(0, 25);
      }
      return combined;
    });
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
  };

  const handleRemoveBatchFile = (index: number) => {
    setBatchFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearBatchFiles = () => {
    setBatchFiles([]);
    setBatchAudit(null);
    setErrorMessage(null);
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
  };

  const handleAuditBatch = async () => {
    if (batchFiles.length === 0) {
      setErrorMessage('Selecione de 1 a 25 vídeos para realizar a auditoria em lote.');
      return;
    }
    if (!effectiveReferencePhotos || effectiveReferencePhotos.length === 0) {
      setErrorMessage(
        'Nenhuma foto de referência de cores foi encontrada. Anexe fotos das cores do produto no campo de referência.'
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setBatchAudit(null);

    try {
      const compressedRefs = await Promise.all(
        effectiveReferencePhotos.slice(0, 10).map((p) => compressPhotoForVideoAudit(p, 600, 0.76))
      );

      const batchPayloadVideos: any[] = [];
      const localThumbnailsMap = new Map<string, string>();

      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const vId = `vid_${i + 1}_${file.name.replace(/[^a-z0-9]/gi, '_')}`;
        setStatusMessage(`Extraindo frames: Vídeo ${i + 1} de ${batchFiles.length} (${file.name})...`);

        try {
          const { frames, durationSeconds, thumbnail } = await extractKeyFramesForBatchVideo(file, 5);
          localThumbnailsMap.set(vId, thumbnail);
          batchPayloadVideos.push({
            id: vId,
            videoFileName: file.name,
            videoDurationSeconds: durationSeconds,
            frames,
          });
        } catch (vidErr) {
          console.warn(`Erro ao extrair frames de ${file.name}:`, vidErr);
        }
      }

      if (batchPayloadVideos.length === 0) {
        throw new Error('Falha ao extrair frames dos vídeos anexados.');
      }

      // Chunking automático para garantir que a requisição NUNCA estoure o limite de payload (HTTP 413)
      // Cada chunk de até 10 vídeos consome ~1.1MB de transferência, ficando muito abaixo do limite do servidor
      const CHUNK_SIZE = 10;
      const totalChunks = Math.ceil(batchPayloadVideos.length / CHUNK_SIZE);

      const aggregatedResults: any[] = [];
      const executiveSummaries: string[] = [];
      const allCommonPatterns: string[] = [];
      let totalApproved = 0;
      let totalRejected = 0;
      let totalFlagged = 0;
      let totalTokensUsed = 0;
      let totalCostEstimated = 0;

      for (let c = 0; c < totalChunks; c++) {
        const start = c * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, batchPayloadVideos.length);
        const chunkVideos = batchPayloadVideos.slice(start, end);

        if (totalChunks > 1) {
          setStatusMessage(
            `Auditando com IA: Parte ${c + 1} de ${totalChunks} (Vídeos ${start + 1} a ${end} de ${batchPayloadVideos.length})...`
          );
        } else {
          setStatusMessage(
            `Auditando lote de ${batchPayloadVideos.length} vídeos contra as ${compressedRefs.length} fotos de cores/referência com IA...`
          );
        }

        const payloadBody = JSON.stringify({
          isBatch: true,
          productName,
          productLock,
          productPhotosBase64: compressedRefs,
          batchVideos: chunkVideos,
        });

        const res = await fetch('/api/produtos2-audit-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadBody,
        });

        const rawText = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(rawText);
        } catch {
          if (res.status === 413 || (rawText && rawText.toLowerCase().includes('entity too large'))) {
            throw new Error(
              'O lote de vídeos excedeu o limite máximo de dados da rede (HTTP 413 Request Entity Too Large). Tente auditar em grupos menores de vídeos.'
            );
          }
          throw new Error(`Resposta inválida do servidor de auditoria (${res.status}): ${rawText.slice(0, 100)}`);
        }

        if (!res.ok || !json.success || !json.results) {
          throw new Error(json.error || `Falha ao processar parte ${c + 1} da auditoria em lote.`);
        }

        aggregatedResults.push(...json.results);

        if (json.batchSummary) {
          totalApproved += json.batchSummary.approvedCount || 0;
          totalRejected += json.batchSummary.rejectedCount || 0;
          totalFlagged += json.batchSummary.flaggedCount || 0;
          if (json.batchSummary.overview) {
            executiveSummaries.push(json.batchSummary.overview);
          } else if (json.batchSummary.executiveConclusion) {
            executiveSummaries.push(json.batchSummary.executiveConclusion);
          }
          if (Array.isArray(json.batchSummary.commonPatterns)) {
            allCommonPatterns.push(...json.batchSummary.commonPatterns);
          }
        }

        if (json.usage) {
          totalTokensUsed += json.usage.totalTokens || 0;
          totalCostEstimated += json.usage.estimatedCostUsd || 0;
        }
      }

      const hydratedResults: BatchVideoAuditResultItem[] = aggregatedResults.map((r: any) => ({
        ...r,
        thumbnail: localThumbnailsMap.get(r.id),
      }));

      const finalBatchAudit: BatchVideoFidelityAudit = {
        batchSummary: {
          totalVideos: hydratedResults.length,
          approvedCount: totalApproved,
          rejectedCount: totalRejected,
          overview:
            executiveSummaries.join(' | ') ||
            (totalRejected === 0
              ? `Todos os ${hydratedResults.length} vídeos foram aprovados com fidelidade total ao corte/modelo.`
              : `${totalRejected} de ${hydratedResults.length} vídeos foram reprovados por alteração crítica de corte ou modelagem.`),
        },
        results: hydratedResults,
        usage:
          totalTokensUsed > 0
            ? {
                promptTokens: Math.round(totalTokensUsed * 0.8),
                completionTokens: Math.round(totalTokensUsed * 0.2),
                totalTokens: totalTokensUsed,
                estimatedCostUsd: Math.round(totalCostEstimated * 1000) / 1000,
              }
            : undefined,
      };

      setBatchAudit(finalBatchAudit);
    } catch (err: any) {
      console.error('Erro na auditoria em lote:', err);
      setErrorMessage(err?.message || 'Erro durante a auditoria em lote.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleCopyApprovedBatch = async () => {
    if (!batchAudit) return;
    const approved = batchAudit.results.filter((r) => r.approved);
    const text = approved.map((r) => r.videoFileName).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedBatchApproved(true);
    setTimeout(() => setCopiedBatchApproved(false), 2500);
  };

  const handleDownloadBatchReport = () => {
    if (!batchAudit) return;
    const lines = [
      `RELATÓRIO DE AUDITORIA EM LOTE — ${productName.toUpperCase()}`,
      `Data: ${new Date().toLocaleString('pt-BR')}`,
      `Total de Vídeos: ${batchAudit.batchSummary.totalVideos}`,
      `Aprovados para TikTok Shop: ${batchAudit.batchSummary.approvedCount}`,
      `Reprovados / Atenção: ${batchAudit.batchSummary.rejectedCount}`,
      `------------------------------------------------------------`,
      `VISÃO GERAL:`,
      batchAudit.batchSummary.overview,
      `------------------------------------------------------------`,
      `DETALHAMENTO DOS VÍDEOS:`,
      ...batchAudit.results.map(
        (r, idx) =>
          `#${idx + 1} [${r.approved ? 'APROVADO' : 'REPROVADO'}] ${r.videoFileName} — Cor: ${r.detectedColor || 'N/A'} — Score: ${r.score}%\nParecer: ${r.issue}${r.defectSecond ? ` (Defeito aos ${r.defectSecond}s)` : ''}\n`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-lote-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const boxStyles = audit ? getAuditBoxClasses(audit.overallStatus) : null;
  const activeVideoName = videoFile?.name || audit?.videoFileName || 'vídeo enviado';
  const activeDuration = videoDuration || audit?.videoDurationSeconds || 10;

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
              <span>Detector de Inconsistências do Vídeo (Veo 3)</span>
              {audit && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-black ${boxStyles?.badge}`}
                >
                  {audit.overallScore}%
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Inspeção pericial em alta definição com suporte a análise individual e auditoria em lote de até 25 vídeos de uma vez.
            </p>
          </div>
        </div>
      </div>

      {/* SELETOR DE MODO: VÍDEO INDIVIDUAL vs LOTE DE ATÉ 25 VÍDEOS */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setAuditMode('single')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              auditMode === 'single'
                ? 'bg-sky-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Vídeo Individual</span>
          </button>

          <button
            type="button"
            onClick={() => setAuditMode('batch')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              auditMode === 'batch'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-300" />
            <span>Auditoria em Lote (Até 25 Vídeos)</span>
            <span className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded font-black border border-emerald-400/40">
              ATÉ 25
            </span>
          </button>
        </div>

        {auditMode === 'batch' ? (
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reutiliza fotos de cores para economizar até 70% de tokens</span>
          </div>
        ) : (
          <div className="text-[11px] text-zinc-400">
            Perícia segundo a segundo com recortes lado a lado
          </div>
        )}
      </div>

      <input
        ref={batchFileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/mov"
        multiple
        className="hidden"
        onChange={(e) => handleSelectBatchFiles(e.target.files)}
      />

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

      
      {/* ========================================================================= */}
      {/* MODO AUDITORIA EM LOTE (ATÉ 25 VÍDEOS COM DETECÇÃO DE CORES)              */}
      {/* ========================================================================= */}
      {auditMode === 'batch' && (
        <div className="space-y-4">
          {/* Linha de Upload do Lote + Fotos de Cores */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
            {/* Coluna Esquerda: Anexar até 25 vídeos */}
            <div className="sm:col-span-7 flex flex-col">
              <div
                onClick={() => batchFileInputRef.current?.click()}
                className="flex-1 p-5 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl bg-zinc-950/70 hover:bg-zinc-900/60 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all group shadow-inner"
              >
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                    Clique aqui para selecionar até 25 vídeos (.mp4 ou .mov)
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Selecione todos os vídeos gerados do produto de uma só vez para validação em massa
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                  Suporta de 1 até 25 vídeos
                </span>
              </div>
            </div>

            {/* Coluna Direita: Fotos de Cores do Produto */}
            <div className="sm:col-span-5 p-3 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <ImagePlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fotos de Cores ({effectiveReferencePhotos.length})</span>
                </span>
                {customReferencePhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCustomPhotos}
                    className="text-[10px] text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Restaurar Padrão
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
                {effectiveReferencePhotos.slice(0, 10).map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-900 border border-white/15 shrink-0 group"
                  >
                    <img src={photo} alt={`Cor ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-zinc-300 font-mono py-0.5">
                      #{idx + 1}
                    </span>
                    {customReferencePhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomPhoto(idx);
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => refPhotosInputRef.current?.click()}
                  className="w-12 h-16 rounded-lg border-2 border-dashed border-zinc-700 hover:border-emerald-500/70 bg-zinc-900/60 hover:bg-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-emerald-300 transition-all shrink-0 cursor-pointer"
                  title="Adicionar fotos das cores disponíveis"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-[8px] font-bold">+ Cor</span>
                </button>
              </div>

              <p className="text-[10px] text-zinc-400 leading-tight">
                Anexe as fotos de cada uma das cores disponíveis (até 9-10 cores). A IA cruzará automaticamente cada vídeo com a cor correspondente.
              </p>
            </div>
          </div>

          {/* Lista de Vídeos Selecionados e Botão de Disparo */}
          {batchFiles.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileVideo className="w-4 h-4 text-emerald-400" />
                    <span>Lote Carregado: {batchFiles.length} de 25 Vídeos</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                    Pronto para análise
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {batchFiles.length < 25 && (
                    <button
                      type="button"
                      onClick={() => batchFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Adicionar Vídeos</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearBatchFiles}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpar Lote</span>
                  </button>
                </div>
              </div>

              {/* Badges dos Arquivos do Lote */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {batchFiles.map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 font-mono"
                  >
                    <span className="text-emerald-400 font-bold">#{idx + 1}</span>
                    <span className="truncate max-w-[160px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBatchFile(idx)}
                      className="hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Botão de Disparo da Auditoria em Lote */}
              <button
                type="button"
                onClick={handleAuditBatch}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Processando Lote...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>🚀 Iniciar Auditoria em Lote de {batchFiles.length} Vídeos (Ultra Econômico)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* DASHBOARD EXECUTIVO DO LOTE (QUANDO PRONTO) */}
          {batchAudit && !isProcessing && (
            <div className="space-y-4 pt-2">
              {/* Placar de Resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Auditado</span>
                    <span className="text-2xl font-black text-white font-mono">
                      {batchAudit.batchSummary.totalVideos} vídeos
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-800/80 text-zinc-300">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Aprovados TikTok</span>
                    <span className="text-2xl font-black text-emerald-300 font-mono">
                      {batchAudit.batchSummary.approvedCount} liberados
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-400 block">Com Inconsistência</span>
                    <span className="text-2xl font-black text-rose-300 font-mono">
                      {batchAudit.batchSummary.rejectedCount} com erro
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Visão Geral da IA */}
              <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider block">
                  Visão Geral do Perito Visual:
                </span>
                <p className="leading-relaxed">{batchAudit.batchSummary.overview}</p>
                {batchAudit.usage && (
                  <p className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                    Consumo: {batchAudit.usage.totalTokens?.toLocaleString()} tokens • Custo estimado: R$ {batchAudit.usage.costBRL} ({batchAudit.usage.model})
                  </p>
                )}
              </div>

              {/* Barra de Filtro e Exportação */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-zinc-500" /> Filtro:
                  </span>
                  <button
                    type="button"
                    onClick={() => setBatchFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      batchFilter === 'all'
                        ? 'bg-zinc-700 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Todos ({batchAudit.results.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchFilter('approved')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      batchFilter === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                    }`}
                  >
                    🟢 Aprovados ({batchAudit.batchSummary.approvedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchFilter('rejected')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      batchFilter === 'rejected'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
                    }`}
                  >
                    🔴 Com Erro ({batchAudit.batchSummary.rejectedCount})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyApprovedBatch}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedBatchApproved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Nomes Copiados ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copiar Aprovados</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBatchReport}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Relatório (.txt)</span>
                  </button>
                </div>
              </div>

              {/* Grid dos Cards de Vídeo do Lote */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {batchAudit.results
                  .filter((r) =>
                    batchFilter === 'all'
                      ? true
                      : batchFilter === 'approved'
                      ? r.approved
                      : !r.approved
                  )
                  .map((item, idx) => {
                    const itemStyles = getAuditBoxClasses(item.status);
                    return (
                      <div
                        key={item.id || idx}
                        className={`p-2.5 rounded-2xl border flex flex-col justify-between gap-2 transition-all shadow-md ${itemStyles.card}`}
                      >
                        <div className="space-y-2">
                          {/* Miniatura do Vídeo */}
                          <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black/60 border border-white/10 group">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.videoFileName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                                Sem thumbnail
                              </div>
                            )}

                            {/* Badge de Status no topo da miniatura */}
                            <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 pointer-events-none">
                              <span
                                className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded shadow border ${itemStyles.badge}`}
                              >
                                {item.score}%
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow ${
                                  item.approved
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {item.approved ? 'Aprovado' : 'Reprovado'}
                              </span>
                            </div>

                            {/* Botão de Ampliar no hover */}
                            {item.thumbnail && onOpenPreview && (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenPreview(
                                      item.thumbnail!,
                                      `${item.videoFileName} • ${item.detectedColor || 'Produto'}`
                                    )
                                  }
                                  className="p-2 rounded-xl bg-black/80 hover:bg-sky-600 text-white cursor-pointer transition-colors"
                                  title="Ampliar captura do vídeo"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Dados do Vídeo */}
                          <div>
                            <p className="text-xs font-bold text-white truncate" title={item.videoFileName}>
                              {item.videoFileName}
                            </p>
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                              🎨 Cor: {item.detectedColor || 'Padrão'}
                            </span>
                          </div>

                          {/* Laudo Forense Estruturado */}
                          <div className="text-[11px] text-zinc-300 whitespace-pre-line leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5 select-text">
                            {item.issue}
                          </div>

                          {item.defectSecond !== null && item.defectSecond !== undefined && (
                            <span className="inline-block text-[10px] font-black text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded">
                              ⚠️ Divergência aos {item.defectSecond}s
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO VÍDEO INDIVIDUAL (ORIGINAL DETALHADO 1 A 1 SEGUNDO)                   */}
      {/* ========================================================================= */}
      {auditMode === 'single' && (
        <div className="space-y-4">
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
                  Ao selecionar o vídeo (.mp4 ou .mov), a análise pericial de 1 em 1 segundo inicia automaticamente
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
                  } else {
                    handleClearVideo();
                  }
                }}
                disabled={isProcessing}
                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
                  isProcessing
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 shadow-amber-950/30'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{statusMessage || 'Analisando...'}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Trocar Vídeo</span>
                  </>
                )}
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

      {/* PAINEL DE RESULTADO COMPLETO DO DETECTOR DE INCONSISTÊNCIAS */}
      {audit && (
        <div className="space-y-4 pt-1">
          {/* 1. CABEÇALHO DO DIAGNÓSTICO E SUMÁRIO EXECUTIVO */}
          <div className={`p-4 rounded-2xl border space-y-2.5 ${boxStyles?.cell}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
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
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide leading-tight text-white">
                    {audit.overallLabel}
                  </h4>
                </div>

                <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 pt-0.5">
                  <Search className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>🔎 Detector de Inconsistências</span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed">
                  Analisei o vídeo <span className="font-bold text-white">"{activeVideoName}"</span>, com duração de{' '}
                  <span className="font-bold text-white">{activeDuration} segundos</span>, comparando capturas reais (de 1 em 1 segundo) com as{' '}
                  <span className="font-bold text-white">{effectiveReferencePhotos.length}</span> imagem(ns) de referência fornecida(s).
                </p>

                {audit.overviewText ? (
                  <p className="text-xs sm:text-[13px] font-semibold text-white leading-relaxed pt-1">
                    {audit.overviewText}
                  </p>
                ) : (
                  <p className="text-xs opacity-95 leading-relaxed pt-1">{audit.summary}</p>
                )}
              </div>

              <div className="text-right shrink-0 bg-black/35 px-3 py-2 rounded-xl border border-white/10">
                <span className="font-mono text-lg font-black block leading-none">
                  {audit.overallScore}%
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-80 block mt-1">
                  Fidelidade
                </span>
              </div>
            </div>
          </div>

          {/* 3. RELATÓRIO DETALHADO DE ACHADOS COM COMPARAÇÃO VISUAL REAL (ESTILO PERICIAL COMPLETO) */}
          {Array.isArray(audit.findings) && audit.findings.length > 0 && (
            <div className="space-y-4">
              {audit.findings.map((finding) => {
                const preferredRefIdx = Number(finding.bestRefIndex) || 1;
                const refNotesToRender =
                  Array.isArray(finding.referenceNotes) && finding.referenceNotes.length > 0
                    ? finding.referenceNotes.map((rn, idx) =>
                        idx === 0 && finding.referenceNotes!.length === 1
                          ? { ...rn, refIndex: preferredRefIdx }
                          : rn
                      )
                    : [
                        {
                          refIndex: preferredRefIdx,
                          label: `Referência: foto original do produto`,
                          description:
                            'Imagem original utilizada como base de comparação para verificar a estrutura e os detalhes deste componente.',
                        },
                      ];

                return (
                  <div
                    key={finding.number}
                    className="p-4 sm:p-5 rounded-2xl bg-black/85 border border-zinc-800 space-y-4 text-zinc-100 shadow-xl"
                  >
                    {/* Título Numerado do Achado */}
                    <h4 className="text-sm sm:text-base font-black text-white">
                      {finding.number}. {finding.title}
                    </h4>

                    {/* Cartões das Imagens de Referência analisadas neste item */}
                    {finding.severity !== 'observation' && refNotesToRender.length > 0 && (
                      <div className="space-y-3">
                        {refNotesToRender.map((rn, rIdx) => {
                          const photoUrl =
                            effectiveReferencePhotos[
                              Math.max(0, Math.min(effectiveReferencePhotos.length - 1, (rn.refIndex || rIdx + 1) - 1))
                            ] || effectiveReferencePhotos[0];

                          return (
                            <div
                              key={rIdx}
                              className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 pb-3 border-b border-zinc-800/80 last:border-b-0 last:pb-0"
                            >
                              {photoUrl && (
                                <div
                                  onClick={() =>
                                    onOpenPreview?.(photoUrl, `${rn.label} • ${productName}`)
                                  }
                                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 border border-zinc-700 shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                                >
                                  <img
                                    src={photoUrl}
                                    alt={rn.label}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-black text-white">
                                  {rn.label}
                                </p>
                                <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                                  {rn.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* O que aparece no vídeo */}
                    {finding.whatAppearsInVideo && (
                      <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
                        <span className="font-black text-white">O que aparece no vídeo: </span>
                        {finding.whatAppearsInVideo.replace(/^o que aparece no vídeo:\s*/i, '')}
                      </p>
                    )}

                    {/* Onde aparece */}
                    {finding.whereItAppears && (
                      <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
                        <span className="font-black text-white">📍 Onde aparece: </span>
                        {finding.whereItAppears.replace(/^onde aparece:\s*/i, '')}
                      </p>
                    )}

                    {/* Comparação Visual Real (Lado a Lado: Referência Original vs Captura Real do Vídeo) */}
                    {finding.comparisonImageUrl && finding.severity !== 'observation' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-[13px] font-black text-white flex items-center gap-1.5">
                            <span>📸 Comparação visual real</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              downloadDataUrlFile(
                                finding.comparisonImageUrl!,
                                `comparacao_0${finding.number}_${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] font-bold text-zinc-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-sky-400" />
                            <span>Baixar Comparação</span>
                          </button>
                        </div>

                        <div
                          onClick={() =>
                            onOpenPreview?.(
                              finding.comparisonImageUrl!,
                              `Comparação Visual — ${finding.title}`
                            )
                          }
                          className="rounded-xl overflow-hidden border border-zinc-700 bg-white cursor-pointer hover:opacity-95 transition-opacity"
                        >
                          <img
                            src={finding.comparisonImageUrl}
                            alt={`Comparação visual - ${finding.title}`}
                            className="w-full h-auto object-contain max-h-[380px] mx-auto"
                          />
                        </div>
                      </div>
                    )}

                    {/* Como corrigir */}
                    {finding.howToFix && (
                      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
                        <span className="font-black text-amber-300">💡 Como corrigir: </span>
                        {finding.howToFix.replace(/^como corrigir:\s*/i, '')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. RESULTADO FINAL RECOMENDADO */}
          <div className="p-4 rounded-2xl bg-black/80 border border-zinc-800 space-y-1.5">
            <h5 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
              Resultado final
            </h5>
            <p className="text-xs sm:text-[13px] font-semibold text-zinc-100 leading-relaxed">
              {audit.finalRecommendation || audit.summary}
            </p>
            {audit.coverageNote && (
              <p className="text-[11px] text-zinc-400 pt-1">
                {audit.coverageNote} • Aviso: Esta análise preventiva ajuda a identificar incoerências visuais antes da publicação, mas não substitui a revisão oficial da plataforma.
              </p>
            )}
          </div>

          {/* 5. GRADE INDIVIDUAL COM OS FRAMES EXTRAÍDOS EM ALTA DEFINIÇÃO (540x960px) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 px-0.5">
              <span>
                {audit.frames.length} Capturas Individuais em Alta Definição (de 1 em 1 segundo):
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">
                Meta rigorosa TikTok Shop &ge; 90%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {audit.frames.map((frame) => {
                const fStyles = getAuditBoxClasses(frame.status);
                return (
                  <div
                    key={frame.frameNumber}
                    className={`p-2 rounded-xl border flex flex-col justify-between gap-2 transition-all ${fStyles.cell}`}
                  >
                    {/* Thumbnail do Frame com botões de Ampliar e Baixar */}
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

                      {frame.frameThumbnail && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white transition-opacity">
                          {onOpenPreview && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenPreview(
                                  frame.frameThumbnail!,
                                  `Captura ${frame.second}s (Frame ${frame.frameNumber}) • ${productName}`
                                )
                              }
                              className="p-2 rounded-lg bg-black/80 hover:bg-sky-600 text-white cursor-pointer transition-colors"
                              title="Ampliar Captura em Alta Resolução"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              downloadDataUrlFile(
                                frame.frameThumbnail!,
                                `frame_${frame.second}s_${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
                              )
                            }
                            className="p-2 rounded-lg bg-black/80 hover:bg-emerald-600 text-white cursor-pointer transition-colors"
                            title="Baixar Captura em Alta Resolução"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
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
                          Frame {frame.frameNumber} ({frame.second}s)
                        </span>
                        <span className="font-mono">{frame.score}%</span>
                      </div>
                      <p
                        className="text-[10px] leading-snug opacity-95"
                        title={frame.issue}
                      >
                        {String(frame.issue || '')
                          .replace(/^(?:frame|captura|quadro|cena)\s*\d+\s*(?:\(\s*\d+\s*s\s*\))?\s*[:\-–—]\s*/i, '')
                          .replace(/^\(\s*\d+\s*s\s*\)\s*[:\-–—]\s*/i, '')
                          .trim()}
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
