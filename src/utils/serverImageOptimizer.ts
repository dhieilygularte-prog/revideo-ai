import crypto from 'crypto';
import sharp from 'sharp';

/**
 * Cache LRU simples com tamanho máximo limitado para evitar crescimento ilimitado
 * de memória em servidores de longa duração ou funções serverless reutilizadas.
 */
export function createBoundedMap<K, V>(maxEntries = 80) {
  const store = new Map<K, V>();

  return {
    get(key: K): V | undefined {
      if (!store.has(key)) return undefined;
      const val = store.get(key) as V;
      // Promove para o fim (mais recente)
      store.delete(key);
      store.set(key, val);
      return val;
    },
    set(key: K, value: V): void {
      if (store.has(key)) {
        store.delete(key);
      } else if (store.size >= maxEntries) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }
      store.set(key, value);
    },
    has(key: K): boolean {
      return store.has(key);
    },
    get size(): number {
      return store.size;
    },
    clear(): void {
      store.clear();
    },
  };
}

const generationImageCache = createBoundedMap<string, string>(90);
const visionImageCache = createBoundedMap<string, string>(140);
const remoteFetchCache = createBoundedMap<string, { buffer: Buffer; mimeType: string }>(60);

function hashKey(prefix: string, input: string): string {
  const digest = crypto.createHash('sha256').update(input).digest('hex').slice(0, 24);
  return `${prefix}:${digest}:${input.length}`;
}

/**
 * Converte data URI ou base64 puro para Buffer + mimeType.
 */
export function decodeImageInputToBase64(input: string): { buffer: Buffer; mimeType: string } | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return null;
  }
  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/s);
  if (match) {
    return {
      mimeType: match[1].toLowerCase(),
      buffer: Buffer.from(match[2].replace(/[\r\n\s]/g, ''), 'base64'),
    };
  }
  return {
    mimeType: 'image/jpeg',
    buffer: Buffer.from(trimmed.replace(/[\r\n\s]/g, ''), 'base64'),
  };
}

/**
 * Baixa uma URL HTTP/HTTPS de imagem com cache em memória (evita downloads duplicados
 * da mesma imagem em auditorias, retries ou proxies de ZIP).
 */
export async function fetchImageUrlCached(
  url: string,
  timeoutMs = 15000
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return null;
  }
  const cached = remoteFetchCache.get(url);
  if (cached) return cached;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length === 0) return null;
    const rawCt = resp.headers.get('content-type') || 'image/jpeg';
    const mimeType = rawCt.split(';')[0].trim().toLowerCase() || 'image/jpeg';
    const entry = { buffer: buf, mimeType };
    remoteFetchCache.set(url, entry);
    return entry;
  } catch {
    return null;
  }
}

async function resolveInputToBuffer(input: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return fetchImageUrlCached(trimmed);
  }
  return decodeImageInputToBase64(trimmed);
}

/**
 * Otimiza um Buffer de imagem com `sharp` reduzindo dimensões excessivas e convertendo PNGs
 * opacos pesados para JPEG mozjpeg de alta definição, mantendo transparência real se houver alfa.
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  inputMime: string,
  options: {
    maxDim: number;
    quality: number;
    chroma444?: boolean;
    skipIfUnderBytes?: number;
  }
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { maxDim, quality, chroma444 = false, skipIfUnderBytes = 160_000 } = options;

  try {
    const meta = await sharp(inputBuffer, { failOn: 'none' }).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    const needsResize = (w > 0 && w > maxDim) || (h > 0 && h > maxDim);
    const isJpeg = meta.format === 'jpeg' || inputMime === 'image/jpeg' || inputMime === 'image/jpg';

    if (!needsResize && isJpeg && inputBuffer.length <= skipIfUnderBytes) {
      return { buffer: inputBuffer, mimeType: 'image/jpeg' };
    }

    let pipeline = sharp(inputBuffer, { failOn: 'none' }).rotate();
    if (needsResize) {
      pipeline = pipeline.resize({
        width: maxDim,
        height: maxDim,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Verifica se possui canal alfa com transparência real antes de converter para JPEG
    let hasTransparency = false;
    if (meta.hasAlpha) {
      try {
        const stats = await sharp(inputBuffer, { failOn: 'none' }).stats();
        const alphaChannel = stats.channels[3];
        if (alphaChannel && alphaChannel.min < 252) {
          hasTransparency = true;
        }
      } catch {
        hasTransparency = false;
      }
    }

    if (hasTransparency) {
      const pngBuf = await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
      if (pngBuf.length < inputBuffer.length || needsResize) {
        return { buffer: pngBuf, mimeType: 'image/png' };
      }
      return { buffer: inputBuffer, mimeType: 'image/png' };
    }

    const jpegBuf = await pipeline
      .jpeg({
        quality,
        mozjpeg: true,
        chromaSubsampling: chroma444 ? '4:4:4' : '4:2:0',
      })
      .toBuffer();

    // Só troca pelo JPEG se ele for realmente menor (ou se houve resize) ou se a entrada não era JPEG compacta
    if (needsResize || !isJpeg || jpegBuf.length < inputBuffer.length) {
      return { buffer: jpegBuf, mimeType: 'image/jpeg' };
    }
    return { buffer: inputBuffer, mimeType: 'image/jpeg' };
  } catch {
    return { buffer: inputBuffer, mimeType: inputMime || 'image/jpeg' };
  }
}

/**
 * Otimiza imagem de referência antes do envio para geração (BytePlus Seedream 5.0 Pro ou OpenAI images.edit).
 * Converte PNGs pesados de 2-3MB da galeria ou câmera para JPEG q90 4:4:4 (~120-180KB) sem perda visual.
 */
export async function optimizeImageDataUriForGeneration(
  input: string,
  maxDim = 1280,
  quality = 90
): Promise<string> {
  if (!input || typeof input !== 'string') return input;
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const key = hashKey(`gen:${maxDim}:${quality}`, trimmed);
  const cached = generationImageCache.get(key);
  if (cached) return cached;

  const resolved = await resolveInputToBuffer(trimmed);
  if (!resolved) return trimmed;

  const optimized = await optimizeImageBuffer(resolved.buffer, resolved.mimeType, {
    maxDim,
    quality,
    chroma444: true,
    skipIfUnderBytes: 180_000,
  });

  const outUri = `data:${optimized.mimeType};base64,${optimized.buffer.toString('base64')}`;
  generationImageCache.set(key, outUri);
  return outUri;
}

/**
 * Converte qualquer entrada (base64, data URI ou URL remota Seedream) para Buffer otimizado
 * pronto para upload multipart em `OpenAI.images.edit`.
 */
export async function optimizeImageToBufferForGeneration(
  input: string,
  maxDim = 1280,
  quality = 90
): Promise<{ buffer: Buffer; mimeType: string; ext: 'jpg' | 'png' } | null> {
  const dataUri = await optimizeImageDataUriForGeneration(input, maxDim, quality);
  const parsed = decodeImageInputToBase64(dataUri);
  if (!parsed) return null;
  const isPng = parsed.mimeType === 'image/png';
  return {
    buffer: parsed.buffer,
    mimeType: isPng ? 'image/png' : 'image/jpeg',
    ext: isPng ? 'png' : 'jpg',
  };
}

/**
 * Otimiza imagem para endpoints OpenAI Vision (`/chat/completions` com image_url):
 * - `detail: 'low'`: redimensiona para <= 512px JPEG q80 (~20-35KB), ideal para 85 tokens fixos.
 * - `detail: 'high'`: redimensiona para <= 1024px JPEG q86 4:4:4 (~80-130KB), preservando
 *   logos, costuras, estampa e botões para auditoria sem trafegar PNGs de 2-4MB ou URLs lentas.
 */
export async function optimizeImageDataUriForVision(
  input: string,
  detail: 'low' | 'high' = 'high'
): Promise<string> {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  const maxDim = detail === 'low' ? 512 : 1536;
  const quality = detail === 'low' ? 80 : 92;
  const key = hashKey(`vis:${detail}:${maxDim}:${quality}`, trimmed);
  const cached = visionImageCache.get(key);
  if (cached) return cached;

  const resolved = await resolveInputToBuffer(trimmed);
  if (!resolved) {
    // Caso seja URL externa inacessível localmente, normaliza prefixo se for raw base64
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')
      ? trimmed
      : `data:image/jpeg;base64,${trimmed}`;
  }

  const optimized = await optimizeImageBuffer(resolved.buffer, resolved.mimeType, {
    maxDim,
    quality,
    chroma444: detail === 'high',
    skipIfUnderBytes: detail === 'low' ? 35_000 : 120_000,
  });

  const outUri = `data:${optimized.mimeType};base64,${optimized.buffer.toString('base64')}`;
  visionImageCache.set(key, outUri);
  return outUri;
}

/**
 * Garante que uma imagem gerada (ex: OpenAI 1024x1792) saia exatamente na resolução vertical desejada
 * (1080x1920 padrão ou 1440x2560 em modo 2K), respeitando o limite de payload da Vercel (<3.6MB base64).
 */
export async function calibrateOutputDataUri(
  input: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  if (!input || typeof input !== 'string') return input;
  const trimmed = input.trim();
  if (!trimmed || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const parsed = decodeImageInputToBase64(trimmed);
  if (!parsed) return trimmed;

  try {
    const meta = await sharp(parsed.buffer, { failOn: 'none' }).metadata();
    if (
      meta.width === targetWidth &&
      meta.height === targetHeight &&
      parsed.buffer.length <= 1_950_000 &&
      parsed.mimeType !== 'image/png'
    ) {
      return trimmed.startsWith('data:')
        ? trimmed
        : `data:${parsed.mimeType};base64,${parsed.buffer.toString('base64')}`;
    }

    const calibratedPipeline = sharp(parsed.buffer, { failOn: 'none' })
      .rotate()
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'centre',
        kernel: sharp.kernel.lanczos3,
      })
      // Micro-nitidez óptica controlada para recuperar definição de trama e bordas ao ampliar sem criar halos
      .sharpen({ sigma: 0.6, m1: 0.4, m2: 1.3 });

    // JPEG 4:4:4 (sem subamostragem de croma) com qualidade adaptativa para entregar máxima nitidez
    // no zoom mantendo o arquivo leve (~1.0 a 1.95 MB, nunca ~2.8-3.8 MB em PNG redundante).
    const maxTargetBytes = targetWidth >= 1440 ? 2_100_000 : 1_950_000;
    const qualityLadder = [100, 99, 97, 95, 92];
    let bestJpgBuf: Buffer | null = null;

    for (const q of qualityLadder) {
      const candidate = await calibratedPipeline
        .clone()
        .jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:4:4' })
        .toBuffer();
      bestJpgBuf = candidate;
      if (candidate.length <= maxTargetBytes) {
        return `data:image/jpeg;base64,${candidate.toString('base64')}`;
      }
    }

    return `data:image/jpeg;base64,${bestJpgBuf!.toString('base64')}`;
  } catch {
    return trimmed;
  }
}

const productPrepCache = createBoundedMap<string, string>(60);

/**
 * Detecta de forma conservadora se uma imagem horizontal/quadrada é uma colagem lado a lado
 * (ex.: Frente à esquerda + Costas à direita) verificando se a faixa vertical central (~46%..54%)
 * é composta essencialmente por fundo/linha divisória uniforme enquanto as duas metades laterais
 * contêm sujeitos distintos. Nunca recorta fotos únicas centralizadas.
 */
async function detectSideBySideSplitX(buffer: Buffer, width: number, height: number): Promise<number | null> {
  if (width < 200 || height < 200) return null;
  const ratio = width / height;
  if (ratio < 0.92 || ratio > 2.2) return null;

  try {
    const sampleW = 160;
    const sampleH = 160;
    const { data } = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize(sampleW, sampleH, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colStdAndEdge = (x: number): { std: number; mean: number; darkCount: number } => {
      let sum = 0;
      let sumSq = 0;
      let darkCount = 0;
      const yStart = Math.floor(sampleH * 0.12);
      const yEnd = Math.floor(sampleH * 0.88);
      const n = yEnd - yStart;
      for (let y = yStart; y < yEnd; y++) {
        const v = data[y * sampleW + x];
        sum += v;
        sumSq += v * v;
        if (v < 95) darkCount++;
      }
      const mean = sum / n;
      const variance = Math.max(0, sumSq / n - mean * mean);
      return { std: Math.sqrt(variance), mean, darkCount };
    };

    const regionContrast = (xFrom: number, xTo: number): number => {
      let totalStd = 0;
      let count = 0;
      for (let x = xFrom; x <= xTo; x++) {
        totalStd += colStdAndEdge(x).std;
        count++;
      }
      return count > 0 ? totalStd / count : 0;
    };

    const leftContrast = regionContrast(Math.floor(sampleW * 0.15), Math.floor(sampleW * 0.40));
    const rightContrast = regionContrast(Math.floor(sampleW * 0.60), Math.floor(sampleW * 0.85));

    // Ambos os lados precisam ter conteúdo visual relevante
    if (leftContrast < 16 || rightContrast < 16) return null;

    // Procura coluna no centro (46%..54%) que seja claramente fundo/divisória uniforme (sem peça atravessando o meio)
    let bestCenterX = -1;
    let lowestCenterStd = Infinity;
    for (let x = Math.floor(sampleW * 0.46); x <= Math.floor(sampleW * 0.54); x++) {
      const stats = colStdAndEdge(x);
      if (stats.std < lowestCenterStd && stats.darkCount <= 6) {
        lowestCenterStd = stats.std;
        bestCenterX = x;
      }
    }

    // Só considera colagem se o centro for visivelmente mais liso/uniforme que os dois sujeitos laterais
    const minSideContrast = Math.min(leftContrast, rightContrast);
    if (bestCenterX >= 0 && lowestCenterStd <= Math.min(20, minSideContrast * 0.55)) {
      const splitRatio = Math.min(0.53, Math.max(0.49, (bestCenterX + 1.5) / sampleW));
      return Math.round(width * splitRatio);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Pré-tratamento local (0 tokens extras) de fotos de referência do produto antes da geração:
 * 1) Quando é colagem lado a lado (Frente + Costas) e a geração é frontal, recorta apenas a frente para dobrar os pixels úteis da peça.
 * 2) Quando a foto é de baixa resolução ou muito comprimida, limpa blocos JPEG e aplica upscale + nitidez controlada preservando 100% da cor original.
 */
export async function prepareProductReferenceDataUriForGeneration(
  input: string,
  options?: { cropFrontFromSideBySide?: boolean }
): Promise<string> {
  if (!input || typeof input !== 'string') return input;
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const cropFront = options?.cropFrontFromSideBySide !== false;
  const key = hashKey(`prodprep:${cropFront ? 'front' : 'full'}`, trimmed);
  const cached = productPrepCache.get(key);
  if (cached) return cached;

  const resolved = await resolveInputToBuffer(trimmed);
  if (!resolved) return trimmed;

  try {
    const rotatedBuf = await sharp(resolved.buffer, { failOn: 'none' }).rotate().toBuffer();
    const meta = await sharp(rotatedBuf, { failOn: 'none' }).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    if (w < 64 || h < 64) return trimmed;

    let workBuf = rotatedBuf;
    let workW = w;
    let workH = h;
    let didCropFront = false;

    if (cropFront) {
      const splitX = await detectSideBySideSplitX(rotatedBuf, w, h);
      if (splitX && splitX >= Math.round(w * 0.45) && splitX <= Math.round(w * 0.56)) {
        workBuf = await sharp(rotatedBuf, { failOn: 'none' })
          .extract({ left: 0, top: 0, width: splitX, height: h })
          .toBuffer();
        workW = splitX;
        workH = h;
        didCropFront = true;
      }
    }

    const bytesPerPixel = resolved.buffer.length / Math.max(1, w * h);
    const isLowResOrCompressed = workW < 1000 || workH < 1000 || bytesPerPixel < 0.24;

    if (!didCropFront && !isLowResOrCompressed) {
      productPrepCache.set(key, trimmed);
      return trimmed;
    }

    let pipeline = sharp(workBuf, { failOn: 'none' });
    if (workW < 1280 && workH < 1280) {
      pipeline = pipeline.resize({
        width: 1280,
        height: 1280,
        fit: 'inside',
        kernel: sharp.kernel.lanczos3,
      });
    } else if (workW > 1536 || workH > 1536) {
      pipeline = pipeline.resize({
        width: 1536,
        height: 1536,
        fit: 'inside',
        kernel: sharp.kernel.lanczos3,
      });
    }

    if (isLowResOrCompressed) {
      // Deblock sub-pixel leve remove artefatos 8x8 JPEG antes de restaurar nitidez de costuras/bordas, sem alterar cor/matiz
      pipeline = pipeline
        .blur(0.35)
        .sharpen({ sigma: 0.7, m1: 0.5, m2: 1.4 });
    } else {
      pipeline = pipeline.sharpen({ sigma: 0.5, m1: 0.3, m2: 1.1 });
    }

    const outBuf = await pipeline
      .jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer();

    const outUri = `data:image/jpeg;base64,${outBuf.toString('base64')}`;
    productPrepCache.set(key, outUri);
    return outUri;
  } catch {
    return trimmed;
  }
}
