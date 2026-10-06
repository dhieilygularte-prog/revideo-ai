import { ExtractedFrame } from '../types';

/**
 * Seleciona quadros-chave estrategicamente distribuídos por TODA a extensão temporal do vídeo,
 * garantindo cobertura completa de todas as cenas (Cena 1: 0-8s, Cena 2: 8-16s, etc.) e priorizando
 * momentos de corte/transição e mudanças de cenário.
 *
 * @param frames Array de frames extraídos do vídeo com timestamp e dataUrl
 * @param durationSeconds Duração total do vídeo em segundos
 * @param calculatedScenes Quantidade total de cenas (ex: 1, 2, 3...)
 * @param maxFrames Quantidade máxima de frames a retornar (padrão: 12)
 */
export function selectRepresentativeKeyframes(
  frames: ExtractedFrame[],
  durationSeconds: number,
  calculatedScenes: number = 1,
  maxFrames: number = 12
): ExtractedFrame[] {
  if (!frames || frames.length === 0) return [];

  // Se a quantidade de frames for menor ou igual ao limite, retorna todos ordenados por tempo
  if (frames.length <= maxFrames) {
    return [...frames].sort((a, b) => a.time - b.time);
  }

  // Ordena cronologicamente
  const sorted = [...frames].sort((a, b) => a.time - b.time);

  // Divide o vídeo em fatias temporais uniformes
  // Cada cena ganha fatias proporcionais (ex: 2 cenas de 8s -> 6 amostras por cena)
  const samplesPerScene = Math.max(3, Math.floor(maxFrames / Math.max(1, calculatedScenes)));
  const targetCount = Math.min(maxFrames, calculatedScenes * samplesPerScene);

  const selectedIndices = new Set<number>();

  // 1. Sempre inclui o primeiro e o último frame
  selectedIndices.add(0);
  selectedIndices.add(sorted.length - 1);

  // 2. Prioriza frames marcados como transição/corte de cena (isCutTransition)
  sorted.forEach((f, idx) => {
    if (f.isCutTransition && selectedIndices.size < targetCount) {
      selectedIndices.add(idx);
    }
  });

  // 3. Distribui pontos ideais ao longo de toda a duração [0, durationSeconds]
  const stepTime = durationSeconds / (targetCount + 1);
  for (let i = 1; i <= targetCount; i++) {
    const idealTime = stepTime * i;

    // Encontra o frame com timestamp mais próximo do instante ideal
    let closestIdx = -1;
    let minDiff = Infinity;

    for (let j = 0; j < sorted.length; j++) {
      const diff = Math.abs(sorted[j].time - idealTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = j;
      }
    }

    if (closestIdx !== -1 && selectedIndices.size < targetCount) {
      selectedIndices.add(closestIdx);
    }
  }

  // Converte os índices selecionados de volta para lista ordenada de frames
  return Array.from(selectedIndices)
    .sort((a, b) => a - b)
    .map((idx) => sorted[idx]);
}
