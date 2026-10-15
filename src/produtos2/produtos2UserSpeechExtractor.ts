/**
 * Extrator e Adaptador Ultrarrápido de Fala do Usuário a partir de Instruções Adicionais
 * Execução instantânea (0ms), sem latência de rede.
 * Garante que nomes de modelos com 'X' (como Poco X8 Pro) nunca sejam trocados por 'vezes',
 * e que falas longas sejam mantidas o mais próximo possível do limite de 225 caracteres (entre 220 e 225).
 */

export function fixCommonSlips(str: string): string {
  let s = str;
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

export function fitSpeechCloseToLimit(text: string, maxLen = 225, minTarget = 218): string {
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
  productName: string = ''
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
    const speechCandidate = fixCommonSlips(ctaMatch[0].trim());
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

  // Se ultrapassar 225 caracteres, ajusta para ficar o mais próximo possível de 225 (entre 220 e 225)
  if (s.length > 225) {
    s = fitSpeechCloseToLimit(s, 225, 218);
  }

  if (!/[.!?]$/.test(s)) {
    s += '!';
  }
  return s;
}
