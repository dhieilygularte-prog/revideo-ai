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

  const maxDim = detail === 'low' ? 512 : 1024;
  const quality = detail === 'low' ? 80 : 86;
  const key = hashKey(`vis:${detail}`, trimmed);
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
