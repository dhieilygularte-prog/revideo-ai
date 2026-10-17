import { useState, useEffect, useRef } from 'react';

export const LOADING_GIFS: string[] = [
  'https://adhieily.s3.sa-east-1.amazonaws.com/gifs+aurora/agua.gif',
  'https://adhieily.s3.sa-east-1.amazonaws.com/gifts+prontos+2/alongamento+bra%C3%A7os.gif',
  'https://adhieily.s3.sa-east-1.amazonaws.com/gifts+prontos+2/cafe.gif',
  'https://adhieily.s3.sa-east-1.amazonaws.com/gifts+prontos+2/fruta.gif',
  'https://adhieily.s3.sa-east-1.amazonaws.com/gifts+prontos+2/sol.gif',
  'https://adhieily.s3.sa-east-1.amazonaws.com/gifts+prontos+2/alongamento+pesco%C3%A7o+novo.gif',
  'https://adhieily.s3.sa-east-1.amazonaws.com/gifts+prontos+2/xixi.gif',
  'https://adhieily.s3.sa-east-1.amazonaws.com/gifts+prontos+2/ch%C3%A1+curto.gif',
];

let gifQueue: string[] = [];
let lastShownGif: string | null = null;
let preloaded = false;

function shuffleArray(arr: string[]): string[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function preloadLoadingGifs(): void {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  LOADING_GIFS.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

// Inicia o preload imediatamente no carregamento do módulo no navegador
if (typeof window !== 'undefined') {
  preloadLoadingGifs();
}

export function getNextLoadingGif(): string {
  preloadLoadingGifs();

  if (gifQueue.length === 0) {
    let shuffled = shuffleArray(LOADING_GIFS);
    // Garante que o primeiro GIF do novo embaralhamento nunca seja igual ao último GIF exibido anteriormente
    if (lastShownGif && shuffled.length > 1 && shuffled[0] === lastShownGif) {
      const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1));
      [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
    }
    gifQueue = shuffled;
  }

  const nextGif = gifQueue.shift() || LOADING_GIFS[0];
  lastShownGif = nextGif;
  return nextGif;
}

/**
 * Hook que retorna um novo GIF da fila embaralhada sempre que `isLoading` muda para `true`.
 */
export function useLoadingGif(isLoading: boolean): string {
  const [currentGif, setCurrentGif] = useState<string>(() => getNextLoadingGif());
  const prevLoadingRef = useRef<boolean>(isLoading);

  useEffect(() => {
    if (isLoading && !prevLoadingRef.current) {
      setCurrentGif(getNextLoadingGif());
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  return currentGif;
}
