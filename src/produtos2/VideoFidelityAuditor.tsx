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
  Download,
  Search,
} from 'lucide-react';
import {
  VideoFidelityAudit,
  VideoAuditFinding,
  Produtos2AuditColorStatus,
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
 * Constrói uma única imagem em formato Storyboard Contact Sheet de alta definição (1200x660 / 1500x825)
 * contendo todos os frames de 1 em 1 segundo (0s, 1s, 2s, 3s, 4s...) organizados em grade sobre fundo branco,
 * exatamente como o storyboard pericial de referência.
 */
async function buildVideoContactSheetStoryboard(
  frames: { second: number; frameBase64: string }[]
): Promise<string> {
  if (!frames || frames.length === 0) return '';
  try {
    const loadedImages = await Promise.all(
      frames.map(async (f) => ({
        second: f.second,
        img: await loadImageElement(f.frameBase64),
      }))
    );

    const cols = Math.min(5, loadedImages.length);
    const rows = Math.ceil(loadedImages.length / cols);

    // Dimensões base de alta definição (proporcional a 1200x660 para 5x2, ou mais nítida em 1400x770)
    const canvasWidth = 1400;
    const padX = 24;
    const padY = 18;
    const labelHeight = 26;
    const colGap = 28;
    const rowGap = 20;

    const cellWidth = Math.floor((canvasWidth - padX * 2 - colGap * (cols - 1)) / cols);
    const firstImg = loadedImages[0].img;
    const imgAspect = (firstImg.height || 1280) / (firstImg.width || 720);
    const cellImgHeight = Math.round(cellWidth * Math.min(1.85, Math.max(0.75, imgAspect)));
    const rowHeight = labelHeight + cellImgHeight;
    const canvasHeight = padY * 2 + rows * rowHeight + (rows - 1) * rowGap;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Fundo branco limpo para alto contraste pericial
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    loadedImages.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padX + col * (cellWidth + colGap);
      const y = padY + row * (rowHeight + rowGap);

      // Rótulo do segundo ("0s", "1s", "2s"...)
      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 16px Inter, system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${item.second}s`, x, y + 2);

      // Desenha o frame preservando a proporção exata sem esticar
      const imgY = y + labelHeight;
      const iw = item.img.width || 720;
      const ih = item.img.height || 1280;
      const scale = Math.min(cellWidth / iw, cellImgHeight / ih);
      const drawW = Math.round(iw * scale);
      const drawH = Math.round(ih * scale);
      const drawX = x;
      const drawY = imgY + Math.round((cellImgHeight - drawH) / 2);

      ctx.drawImage(item.img, drawX, drawY, drawW, drawH);
    });

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (err) {
    console.warn('Aviso ao montar storyboard de capturas do vídeo:', err);
    return '';
  }
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

    // Rótulos das duas colunas
    const colY = 114;
    const leftX = 32;
    const rightX = 650;
    const boxW = 500;
    const boxH = 485;
    const imgTopY = 148;

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 21px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText('REFERÊNCIA ORIGINAL', leftX, colY);

    const formattedSec = `00:${String(Math.max(0, Math.round(second))).padStart(2, '0')}`;
    ctx.fillText(`CAPTURA REAL DO VÍDEO — ${formattedSec}`, rightX, colY);

    // Função auxiliar para recortar com margem de segurança mantendo a proporção original sem esticar
    const drawCroppedPreservingAspect = (
      img: HTMLImageElement,
      cropBox: [number, number, number, number] | undefined,
      destX: number,
      destY: number,
      maxW: number,
      maxH: number
    ) => {
      const iw = img.width || 600;
      const ih = img.height || 600;

      let sx = 0;
      let sy = 0;
      let sw = iw;
      let sh = ih;

      if (cropBox && cropBox.length === 4) {
        let [ymin, xmin, ymax, xmax] = cropBox;
        // Se vier em escala 0..100 em vez de 0..1000, normaliza para 0..1000
        if (ymax <= 100 && xmax <= 100 && (ymax > 1 || xmax > 1)) {
          ymin *= 10;
          xmin *= 10;
          ymax *= 10;
          xmax *= 10;
        }
        // Adiciona 6% de respiro para manter o recorte bem focado apenas no componente (ex: apenas as lentes da câmera)
        const padH = (ymax - ymin) * 0.06;
        const padW = (xmax - xmin) * 0.06;
        const y1 = Math.max(0, Math.min(950, ymin - padH));
        const x1 = Math.max(0, Math.min(950, xmin - padW));
        const y2 = Math.min(1000, Math.max(y1 + 80, ymax + padH));
        const x2 = Math.min(1000, Math.max(x1 + 80, xmax + padW));

        sx = Math.round((x1 / 1000) * iw);
        sy = Math.round((y1 / 1000) * ih);
        sw = Math.max(60, Math.min(iw - sx, Math.round(((x2 - x1) / 1000) * iw)));
        sh = Math.max(60, Math.min(ih - sy, Math.round(((y2 - y1) / 1000) * ih)));
      }

      const scale = Math.min(maxW / sw, maxH / sh);
      const drawW = Math.round(sw * scale);
      const drawH = Math.round(sh * scale);
      const offsetX = destX + Math.round((maxW - drawW) / 2);
      const offsetY = destY;

      ctx.drawImage(img, sx, sy, sw, sh, offsetX, offsetY, drawW, drawH);
    };

    drawCroppedPreservingAspect(refImg, finding.refCropBox, leftX, imgTopY, boxW, boxH);
    drawCroppedPreservingAspect(vidImg, finding.videoCropBox, rightX, imgTopY, boxW, boxH);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Erro ao gerar imagem de comparação visual:', err);
    return '';
  }
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

      setStatusMessage('Gerando Storyboard de Capturas (1 em 1s) e inspecionando detalhes...');
      const contactSheetDataUrl = await buildVideoContactSheetStoryboard(frames);

      setStatusMessage(
        `Analisando Storyboard HD (${frames.length} capturas) contra ${compressedRefs.length} imagem(ns) de referência...`
      );

      // Para economizar tokens (~65% de redução) e evitar payloads pesados na rede:
      // Enviamos a Prancha Única do Storyboard em Alta Definição (0s..9s) + apenas 4 capturas estratégicas de zoom (1s, 2s, 6s, 7s)
      const zoomSecondsSet = new Set([1, 2, 6, 7]);
      const lightweightFramesPayload = frames.map((f, idx) => ({
        second: f.second,
        frameBase64:
          !contactSheetDataUrl || zoomSecondsSet.has(Math.round(f.second)) || frames.length <= 4 || idx === Math.floor(frames.length / 2)
            ? f.frameBase64
            : '',
      }));

      const payloadBody = JSON.stringify({
        videoFrames: lightweightFramesPayload,
        contactSheetBase64: contactSheetDataUrl,
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
      const hydratedFrames = Array.isArray(parsedData.audit.frames)
        ? parsedData.audit.frames.map((af: any, idx: number) => {
            const matchedLocal =
              frames.find((lf) => Math.abs(lf.second - Number(af.second)) < 0.3) || frames[idx];
            const cleanIssue = String(af.issue || '')
              .replace(/^(?:frame|captura|quadro|cena)\s*\d+\s*(?:\(\s*\d+\s*s\s*\))?\s*[:\-–—]\s*/i, '')
              .replace(/^\(\s*\d+\s*s\s*\)\s*[:\-–—]\s*/i, '')
              .trim();
            return {
              ...af,
              issue: cleanIssue,
              frameThumbnail: matchedLocal?.frameBase64 || af.frameThumbnail,
            };
          })
        : [];

      let finalAudit: VideoFidelityAudit = {
        ...parsedData.audit,
        frames: hydratedFrames,
        contactSheetUrl: contactSheetDataUrl || parsedData.audit.contactSheetUrl,
        videoFileName: fileToAudit.name,
        videoDurationSeconds: durationSeconds,
      };

      // Gerar os cartões PNG de "COMPARAÇÃO VISUAL REAL" (Referência Original vs Captura Real do Vídeo) para cada achado
      if (Array.isArray(finalAudit.findings) && finalAudit.findings.length > 0) {
        setStatusMessage('Gerando recortes de comparação visual real lado a lado...');
        const enrichedFindings = await Promise.all(
          finalAudit.findings.map(async (finding) => {
            const refIdx = Math.max(
              0,
              Math.min(compressedRefs.length - 1, (Number(finding.bestRefIndex) || 1) - 1)
            );
            const refUrl = compressedRefs[refIdx] || compressedRefs[0];

            // Localiza o frame mais próximo do segundo indicado no achado
            const targetSec =
              finding.bestFrameSecond !== undefined ? Number(finding.bestFrameSecond) : 1;
            const matchedFrame =
              frames.reduce((best, curr) =>
                Math.abs(curr.second - targetSec) < Math.abs(best.second - targetSec) ? curr : best
              , frames[0]) || frames[0];

            if (refUrl && matchedFrame?.frameBase64) {
              const compUrl = await buildVisualComparisonBanner({
                finding,
                referencePhotoUrl: refUrl,
                videoFrameUrl: matchedFrame.frameBase64,
                second: matchedFrame.second,
              });
              return {
                ...finding,
                bestFrameSecond: matchedFrame.second,
                comparisonImageUrl: compUrl || undefined,
              };
            }
            return finding;
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
              Inspeção pericial em alta definição (Storyboard de 1 em 1 segundo + Comparação Visual Real lado a lado com as fotos de referência).
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

          {/* 2. STORYBOARD DE CAPTURAS DO VÍDEO (1 EM 1 SEGUNDO — 1400x770 HD) */}
          {audit.contactSheetUrl && (
            <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h5 className="text-xs font-black text-white uppercase tracking-wide">
                    Storyboard de Análise do Vídeo (Capturas Reais de 1 em 1 Segundo)
                  </h5>
                  <p className="text-[11px] text-zinc-400">
                    Grade pericial em alta resolução ({audit.frames.length} capturas: 0s a{' '}
                    {audit.frames[audit.frames.length - 1]?.second ?? 9}s) — clique na imagem para ampliar
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenPreview && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPreview(
                          audit.contactSheetUrl!,
                          `Storyboard de Análise do Vídeo (1 em 1s) • ${productName}`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>Ampliar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      downloadDataUrlFile(
                        audit.contactSheetUrl!,
                        `storyboard-analise-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Storyboard de Análise</span>
                  </button>
                </div>
              </div>

              <div
                onClick={() =>
                  onOpenPreview?.(
                    audit.contactSheetUrl!,
                    `Storyboard de Análise do Vídeo (1 em 1s) • ${productName}`
                  )
                }
                className="rounded-xl overflow-hidden border border-white/15 bg-white cursor-pointer group relative"
              >
                <img
                  src={audit.contactSheetUrl}
                  alt="Storyboard de Análise 1 em 1 segundo"
                  className="w-full h-auto object-contain max-h-[420px] mx-auto"
                />
              </div>
            </div>
          )}

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
  );
};
