/**
 * Extrator e Adaptador Ultrarrápido de Fala do Usuário a partir de Instruções Adicionais
 * Execução instantânea (0ms), sem latência de rede.
 * Garante que nomes de modelos com 'X' (como Poco X8 Pro) nunca sejam trocados por 'vezes',
 * e que falas longas sejam mantidas o mais próximo possível do limite de 225 caracteres (entre 220 e 225).
 */

export function fixCommonSlips(str: string): string {
  let s = str;
  // Remove palavras duplicadas consecutivas por gagueira/ditado (ex: "trabalhar, trabalhar" -> "trabalhar")
  s = s.replace(/\b([a-záàâãéêíóôõúç]{2,})(?:\s*,\s*|\s+)\1\b/gi, '$1');
  // Corrige falhas comuns de fala para texto no nome do produto
  s = s.replace(/\bp[óo]\s*pouco\b/gi, 'Poco');
  s = s.replace(/\bpopouco\b/gi, 'Poco');
  // Se por ventura gerou "Poco vezes" ou "Poco 8 vezes", restaura imediatamente para "Poco X8"
  s = s.replace(/\bpoco\s+(?:\d+\s+)?vezes\b/gi, 'Poco X8');
  s = s.replace(/\bn[ãa]o\s+(tik\s*tok\s*shop|tiktok\s*shop)\b/gi, 'na TikTok Shop');
  s = s.replace(/\btik\s*tok\s*shop\b/gi, 'TikTok Shop');
  s = s.replace(/\btoca\s+no\s+carrinho\b/gi, 'toca no carrinho');
  s = s.replace(/\b800\s*w\b/gi, '800 watts');
  s = s.replace(/\b23\s*pol\b/gi, '23 polegadas');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Reduz o MÍNIMO POSSÍVEL uma fala que passou de 225 caracteres,
 * preservando começo, meio e CTA final, parando assim que atingir <= 225 chars (idealmente 215..225).
 */
export function condenseSpeechMinimallyTo225(text: string, maxLen = 225, minTarget = 215): string {
  let s = fixCommonSlips(text).replace(/\s+/g, ' ').trim();
  if (s.length <= maxLen) {
    return s;
  }

  // Lista de micro-enxugamentos progressivos (do mais sutil ao moderado),
  // aplicados um a um SOMENTE até entrar no limite <= 225 sem derrubar abaixo de minTarget
  const microReplacements: [RegExp, string][] = [
    [/,?\s*\bn[ée]\b\s*,?/gi, ', '],
    [/,?\s*\btipo\s+assim\b\s*,?/gi, ' '],
    [/\bque\s+eu\s+/gi, 'que '],
    [/\beu\s+tenho\s+que\b/gi, 'tenho que'],
    [/\beu\s+vou\s+deixar\b/gi, 'vou deixar'],
    [/\beu\s+j[áa]\s+/gi, 'já '],
    [/\bent[ãa]o\s+j[áa]\s+/gi, 'já '],
    [/\be\s+j[áa]\s+/gi, 'e '],
    [/\bvoc[êe]\s+sabe\s+que\b/gi, 'sabe que'],
    [/\baqui\s+no\s+carrinho\s+laranja\b/gi, 'no carrinho laranja'],
    [/\baqui\s+embaixo\s+no\s+carrinho\b/gi, 'no carrinho'],
    [/\baqui\s+no\s+carrinho\b/gi, 'no carrinho'],
    [/\bpor\s+um\s+valor\s+muito\s+barato\b/gi, 'muito barato'],
    [/\bvalor\s+muito\s+barato\b/gi, 'muito barato'],
    [/\bdois\s+dias\b/gi, '2 dias'],
    [/\btr[êe]s\s+dias\b/gi, '3 dias'],
    [/\bquatro\b/gi, '4'],
    [/\bcinco\b/gi, '5'],
  ];

  for (const [pattern, replacement] of microReplacements) {
    if (s.length <= maxLen) break;
    const next = s
      .replace(pattern, replacement)
      .replace(/\s+,/g, ',')
      .replace(/,{2,}/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
    if (next.length < s.length && (next.length >= minTarget || s.length > maxLen)) {
      s = next;
    }
  }

  if (s.length <= maxLen) {
    return s;
  }

  return fitSpeechCloseToLimit(s, maxLen, minTarget);
}

export function fitSpeechCloseToLimit(text: string, maxLen = 225, minTarget = 215): string {
  let s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= maxLen && s.length >= minTarget) {
    return s;
  }
  if (s.length <= maxLen) {
    return s;
  }

  // Se passou de 225 caracteres:
  const slice225 = s.slice(0, maxLen);

  // 1. Ponto final, exclamação ou interrogação no intervalo (218..225)
  for (let i = maxLen; i >= minTarget; i--) {
    const ch = slice225[i - 1];
    if (ch === '.' || ch === '!' || ch === '?') {
      return slice225.slice(0, i).trim();
    }
  }

  // 2. Vírgula ou ponto-e-vírgula no intervalo
  for (let i = maxLen - 1; i >= minTarget; i--) {
    const ch = slice225[i - 1];
    if (ch === ',' || ch === ';') {
      let candidate = slice225.slice(0, i - 1).trim();
      candidate = cleanDanglingEnds(candidate);
      return candidate + '!';
    }
  }

  // 3. Quebra em palavra no intervalo (218..225)
  for (let i = maxLen - 1; i >= minTarget; i--) {
    if (slice225[i - 1] === ' ') {
      let candidate = slice225.slice(0, i - 1).trim();
      candidate = cleanDanglingEnds(candidate);
      if (!/[.!?]$/.test(candidate)) candidate += '!';
      if (candidate.length <= maxLen && candidate.length >= minTarget) {
        return candidate;
      }
    }
  }

  // 4. Último espaço antes de maxLen
  const lastSpace = slice225.lastIndexOf(' ');
  if (lastSpace > 0) {
    let candidate = slice225.slice(0, lastSpace).trim();
    candidate = cleanDanglingEnds(candidate);
    if (!/[.!?]$/.test(candidate)) candidate += '!';
    return candidate;
  }

  return cleanDanglingEnds(slice225.trim()) + '!';
}

function cleanDanglingEnds(text: string): string {
  let s = text.trim();
  // Remove preposições ou conjunções soltas no final antes da pontuação
  s = s.replace(/\s+(?:e|de|do|da|dos|das|o|a|os|as|com|em|no|na|nos|nas|que|para|pra|por|um|uma)\s*([.!?,;:]*)$/i, '$1');
  return s.trim();
}

export function extractUserSpeechFromInstructions(
  rawText: string,
  _productName: string = ''
): { hasSpeech: boolean; speech: string } {
  if (!rawText || !rawText.trim()) {
    return { hasSpeech: false, speech: '' };
  }

  const text = rawText.trim();

  // 1. Falas explícitas entre aspas ("...", '...', «...», “...”)
  const quoteMatches: string[] = [];
  const quoteRegex = /["'«“]([^"'»”]{8,350})["'»”]/g;
  let qm: RegExpExecArray | null;
  while ((qm = quoteRegex.exec(text)) !== null) {
    if (qm[1]?.trim()) {
      quoteMatches.push(qm[1].trim());
    }
  }

  if (quoteMatches.length > 0) {
    let combined = quoteMatches.join(' ');
    combined = fixCommonSlips(combined);
    return {
      hasSpeech: true,
      speech: formatFinalSpeech(combined),
    };
  }

  // 1.2. Falas introduzidas por verbo + dois-pontos ou vírgula (ex: "e ele fala assim, cara, encontrei..." ou "diz assim: Gente, ...")
  const colonRegex = /\b(?:(?:ele|ela|pai|m[ãa]e|homem|mulher|vendedor|cliente|personagem)\s+)?(?:(?:fala|diz|disse|falou|grita|gritam|falam|dizem|responde|pergunta)\s+assim\s*[:,]|(?:fala|diz|disse|falou|grita|gritam|falam|dizem|responde|pergunta)\s*:)\s*([\s\S]+?)(?=\s+(?:E\s+a[íi]\s+termina|E\s+a[íi]\s+j[áa]\s+corta|E\s+a[íi]\s+corta|Pronto\b|[ÉE]\s+isso\b|Ent[ãa]o\s+come[çc]a|A[íi]\s+a\s+primeira\s+cena|[ÉE]\s+uma\s+loja|O\s+cen[áa]rio|E\s+nessas\s+falas)|$)/gi;
  const colonSegments: string[] = [];
  let cm: RegExpExecArray | null;
  while ((cm = colonRegex.exec(text)) !== null) {
    let seg = (cm[1] || '').trim();
    // Se houver um novo marcador dentro do trecho ("Gente, gente... ele já fala assim: Gente, ..."), fica com o que vem depois do último
    const inner = seg.split(/\b(?:fala|diz|disse|falou)(?:\s+assim)?\s*[:,]\s*/i);
    seg = inner[inner.length - 1].trim();
    seg = seg
      .replace(/,?\s*n[ée]\?/gi, '!')
      .replace(/\s+/g, ' ')
      .trim();
    seg = fixCommonSlips(seg);
    // Ignora onomatopeias ("au au au") e trechos curtos demais
    if (seg.length >= 20 && !/^(?:au\s*)+/i.test(seg)) {
      colonSegments.push(seg);
    }
  }
  if (colonSegments.length > 0) {
    // A última reformulação do usuário costuma ser a versão final desejada
    const chosen = colonSegments[colonSegments.length - 1];
    return { hasSpeech: true, speech: formatFinalSpeech(chosen) };
  }

  // 1.5. Detecção e Extração Limpa de Diálogo entre Personagens (ex: mulher e homem, encontro)
  const isDialoguePattern =
    (text.toLowerCase().includes('homem') || text.toLowerCase().includes('rapaz')) &&
    (text.toLowerCase().includes('mulher') || text.toLowerCase().includes('moça')) &&
    /(?:fala|diz|falou|pergunt)/i.test(text);

  if (isDialoguePattern) {
    const womanMatch = text.match(
      /(?:ela|mulher|moça)\s+(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|no\s+encontro\s+)?(?:fala|diz|falou|pergunta)[:\s]+([^.]+?)(?=\s+(?:a[íi]|ele|homem|rapaz)\s+(?:ele\s+)?(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|pega\s+)?(?:fala|diz|falou|responde)|$)/i
    );
    const manMatch = text.match(
      /(?:ele|homem|rapaz)\s+(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|pega\s+o\s+celular\s+(?:dele\s+)?(?:e\s+)?)?(?:fala|diz|falou|responde)[:\s]+([^.]+?)(?=\s+(?:e\s+nessas\s+falas|nessas\s+falas|essa\s+vai\s+terminar|como\s+eu\s+disse|o\s+cen[áa]rio|e\s+[ée]\s+isso)|$)/i
    );

    let womanSpeech = womanMatch ? womanMatch[1].trim() : '';
    let manSpeech = manMatch ? manMatch[1].trim() : '';

    womanSpeech = fixCommonSlips(womanSpeech).replace(/^[.!?,;:\s]+|[.!?,;:\s]+$/g, '');
    manSpeech = fixCommonSlips(manSpeech).replace(/^[.!?,;:\s]+|[.!?,;:\s]+$/g, '');

    // Limpa metanarrativas internas se sobrarem
    manSpeech = manSpeech.replace(/\s+(?:e\s+nessas\s+falas|nessas\s+falas|essa\s+vai\s+terminar|como\s+eu\s+disse)[\s\S]*$/i, '').trim();

    if (womanSpeech && manSpeech) {
      womanSpeech = womanSpeech.charAt(0).toUpperCase() + womanSpeech.slice(1);
      manSpeech = manSpeech.charAt(0).toUpperCase() + manSpeech.slice(1);
      const combined = `${womanSpeech}! ${manSpeech}!`;
      return {
        hasSpeech: true,
        speech: formatFinalSpeech(combined),
      };
    }
  }

  // 2. Extração semântica de falas por marcadores verbais e diálogos
  const regex = /(?:ele\s+termina\s+n[ée]\s+ele\s+olha\s+para\s+c[âa]mera\s+e\s+fala|olha\s+(?:para|pra)\s+c[âa]mera\s+e\s+fala|olha\s+e\s+fala|(?:ele|ela)\s+(?:fala|diz|falou|disse|vai falar|vai dizer)|falando|dizendo)[:\s]+([\s\S]*?)(?=(?:a[íi]\s+(?:ele|ela|j[áa])|ela\s+fala|ele\s+fala|ele\s+falou|ele\s+termina|ela\s+termina|e\s+[ée]\s+um\s+homem|e\s+acontece|$|\.))/gi;

  let m: RegExpExecArray | null;
  const segments: string[] = [];
  while ((m = regex.exec(text)) !== null) {
    let seg = m[1]?.trim();
    if (seg) {
      seg = seg.replace(/^(?:assim|que|isso)[:\s]*/i, '').trim();
      seg = seg.replace(/^(?:ele|ela)\s+(?:fala|diz|falou|disse)[:\s]*/i, '').trim();
      seg = fixCommonSlips(seg);
      if (seg.length >= 8) {
        segments.push(seg);
      }
    }
  }

  if (segments.length > 0) {
    // 1. Hook / Pergunta / Elogio inicial (ex: "nossa que celular bonito")
    const rawHook = segments.find((s) =>
      /que\s+celular|bonito|lindo|incr[íi]vel|maravilhoso|nossa|olha\s+s[óo]|olha\s+isso/i.test(s) &&
      !/comprei|carrinho|adquir|shop/i.test(s)
    );

    // Se o hook tiver uma pergunta adicional curta ou exclamação, seleciona de forma limpa
    let hookSeg = '';
    if (rawHook) {
      const firstSentence = rawHook.split(/(?<=[.!?])\s+/)[0] || rawHook;
      hookSeg = firstSentence.replace(/[.!?,;:\s]+$/, '').trim();
    }

    // 2. Apresentação do Produto
    const productSeg = segments.find((s) =>
      /esse\s+aqui|novo|lan[çc]amento|celular|qualidade|benef[íi]cio|poco/i.test(s) &&
      s !== rawHook
    );

    // 3. Chamada para Ação (CTA)
    // Prefere o que tem a menção de onde comprou + toca no carrinho
    const fullCta = segments.find((s) => /comprei|compra/i.test(s) && /carrinho/i.test(s));
    const ctaSeg = fullCta || segments.slice().reverse().find((s) =>
      /comprei|compra|carrinho|adquir|shop|link/i.test(s)
    );

    let combined = '';
    if (hookSeg && productSeg && ctaSeg) {
      let p = productSeg.replace(/^[.!?,;:\s]+|[.!?,;:\s]+$/g, '').trim();
      let c = ctaSeg.replace(/^[.!?,;:\s]+/, '').trim();
      // Capitaliza primeira letra de cada frase
      p = p.charAt(0).toUpperCase() + p.slice(1);
      c = c.charAt(0).toUpperCase() + c.slice(1);
      combined = `${hookSeg}! ${p}. ${c}`;
    } else if (productSeg && ctaSeg) {
      let p = productSeg.replace(/[.!?,;:\s]+$/, '').trim();
      let c = ctaSeg.replace(/^[.!?,;:\s]+/, '').trim();
      p = p.charAt(0).toUpperCase() + p.slice(1);
      c = c.charAt(0).toUpperCase() + c.slice(1);
      combined = `${p}. ${c}`;
    } else {
      combined = segments.join('. ');
    }

    return {
      hasSpeech: true,
      speech: formatFinalSpeech(combined),
    };
  }

  // 3. Menção direta a CTA ou recomendação
  const ctaMatch = text.match(/(?:compra|comprei|toca no carrinho|adquira|pega o seu|aproveita)[^.!?]+(?:carrinho|shop|link|aqui)[^.!?]*/i);
  if (ctaMatch) {
    let speechCandidate = fixCommonSlips(ctaMatch[0].trim());
    speechCandidate = speechCandidate.replace(/\s+(?:e\s+nessas\s+falas|nessas\s+falas|essa\s+vai\s+terminar|como\s+eu\s+disse|o\s+cen[áa]rio|e\s+[ée]\s+isso)[\s\S]*$/i, '').trim();
    return {
      hasSpeech: true,
      speech: formatFinalSpeech(speechCandidate),
    };
  }

  // 4. Se o usuário colocou instruções adicionais e há qualquer menção de fala ou produto
  if (text.length >= 10) {
    let cleaned = text
      .replace(/o cenário vai ser assim/gi, '')
      .replace(/eu quero um homem/gi, '')
      .replace(/num jantar romântico/gi, '')
      .replace(/restaurante/gi, '')
      .replace(/tudo ultra realista/gi, '')
      .replace(/e acontece toda essa situação/gi, '')
      .trim();

    cleaned = fixCommonSlips(cleaned);
    if (cleaned.length >= 15) {
      return {
        hasSpeech: true,
        speech: formatFinalSpeech(cleaned),
      };
    }
  }

  return { hasSpeech: false, speech: '' };
}

export function formatFinalSpeech(raw: string): string {
  let s = raw.trim();
  if (!s) return '';
  s = s.replace(/^["'«“]|["'»”]$/g, '').trim();
  s = s.charAt(0).toUpperCase() + s.slice(1);
  s = s.replace(/\.{2,}/g, '.');
  s = s.replace(/\s+([.,!?])/g, '$1');
  s = s.replace(/([.!?]\s+)([a-záàâãéêíóôõúç])/g, (_m, p, c) => p + c.toUpperCase());

  // Se ultrapassar 225 caracteres, enxuga o MÍNIMO POSSÍVEL para ficar colado em 225 (entre 215 e 225)
  if (s.length > 225) {
    s = condenseSpeechMinimallyTo225(s, 225, 215);
  }

  if (!/[.!?]$/.test(s)) {
    s += '!';
  }
  return s;
}
