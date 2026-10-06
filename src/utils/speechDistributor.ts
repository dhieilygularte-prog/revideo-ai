/**
 * Utilitário para distribuição contínua de falas entre cenas
 * Garante que cada cena receba SOMENTE o trecho temporal que lhe pertence,
 * sem nunca repetir a fala inteira ou partes de cenas anteriores.
 */

export interface SceneTimeInterval {
  sceneNumber: number;
  startTime: number;
  endTime: number;
  sceneSpeech?: string;
}

/**
 * Divide o roteiro falado em segmentos contínuos, preservando frases e pontuação,
 * proporcionalmente ao tempo de cada cena.
 */
export function distributeSpeechAcrossScenes<T extends SceneTimeInterval>(
  fullScript: string,
  scenes: T[]
): (T & { sceneSpeech: string })[] {
  const cleanScript = (fullScript || '').trim();

  if (scenes.length === 0) {
    return [];
  }

  // Se não houver roteiro falado (ex: vídeo musical sem locução comercial), todas as cenas ficam RIGOROSAMENTE vazias
  if (!cleanScript) {
    return scenes.map((s) => ({
      ...s,
      sceneSpeech: '',
    }));
  }

  // Se houver apenas 1 cena, toda a fala fica nela
  if (scenes.length === 1) {
    return [
      {
        ...scenes[0],
        sceneSpeech: cleanScript,
      },
    ];
  }

  // Se todas as cenas já vierem com falas individualizadas e distintas da IA, preserva
  const allHaveDistinctSpeech =
    scenes.every((s) => s.sceneSpeech && s.sceneSpeech.trim().length > 0) &&
    new Set(scenes.map((s) => s.sceneSpeech?.trim())).size === scenes.length;

  if (allHaveDistinctSpeech) {
    return scenes.map((s) => ({
      ...s,
      sceneSpeech: s.sceneSpeech!.trim(),
    }));
  }

  // Calcula duração de cada cena
  const sceneDurations = scenes.map((s) => Math.max(1, s.endTime - s.startTime));
  const totalDuration = sceneDurations.reduce((acc, d) => acc + d, 0);

  // Divide o texto em sentenças ou orações
  const sentences = cleanScript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Se tivermos sentenças suficientes (>= número de cenas), distribuímos sentenças
  if (sentences.length >= scenes.length) {
    const result: (T & { sceneSpeech: string })[] = [];
    let sentenceIdx = 0;

    for (let i = 0; i < scenes.length; i++) {
      const isLast = i === scenes.length - 1;
      const targetRatio = sceneDurations[i] / totalDuration;
      const targetCount = isLast
        ? sentences.length - sentenceIdx
        : Math.max(1, Math.round(targetRatio * sentences.length));

      const sliceCount = Math.min(targetCount, sentences.length - sentenceIdx);
      const sceneSentences = sentences.slice(sentenceIdx, isLast ? sentences.length : sentenceIdx + sliceCount);
      sentenceIdx += sceneSentences.length;

      result.push({
        ...scenes[i],
        sceneSpeech: sceneSentences.join(' '),
      });
    }

    return result;
  }

  // Se tiver poucas sentenças (ex: texto curto ou sem pontuação forte), divide por orações ou palavras
  const words = cleanScript.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const result: (T & { sceneSpeech: string })[] = [];
  let wordIdx = 0;

  for (let i = 0; i < scenes.length; i++) {
    const isLast = i === scenes.length - 1;
    const targetRatio = sceneDurations[i] / totalDuration;
    const targetWordCount = isLast
      ? totalWords - wordIdx
      : Math.max(1, Math.round(targetRatio * totalWords));

    const chunkWords = words.slice(wordIdx, isLast ? totalWords : wordIdx + targetWordCount);
    wordIdx += chunkWords.length;

    result.push({
      ...scenes[i],
      sceneSpeech: chunkWords.join(' '),
    });
  }

  return result;
}
