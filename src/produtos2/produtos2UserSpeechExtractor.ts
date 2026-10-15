/**
 * Extrator e Adaptador Ultrarrápido de Fala do Usuário a partir de Instruções Adicionais
 * Execução instantânea (0ms), sem latência de rede.
 */

export function extractUserSpeechFromInstructions(
  rawText: string,
  productName: string = ''
): { hasSpeech: boolean; speech: string } {
  if (!rawText || !rawText.trim()) {
    return { hasSpeech: false, speech: '' };
  }

  const text = rawText.trim();

  // Correção de falhas comuns de digitação por voz e normalização para IA
  const fixCommonSlips = (str: string): string => {
    let s = str;
    s = s.replace(/\bp[óo]\s*pouco\b/gi, 'Poco');
    s = s.replace(/\bn[ãa]o\s+(tik\s*tok\s*shop|tiktok\s*shop)\b/gi, 'na TikTok Shop');
    s = s.replace(/\btik\s*tok\s*shop\b/gi, 'TikTok Shop');
    s = s.replace(/\btoca\s+no\s+carrinho\b/gi, 'toca no carrinho');
    s = s.replace(/\b800\s*w\b/gi, '800 watts');
    s = s.replace(/\b23\s*pol\b/gi, '23 polegadas');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  };

  // 1. Falas explícitas entre aspas ("...", '...', «...», “...”)
  const quoteMatches: string[] = [];
  const quoteRegex = /["'«“]([^"'»”]{8,225})["'»”]/g;
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

  // 2. Extração semântica de falas por marcadores verbais
  // Padrões como: "ele fala...", "ele falou...", "ele diz...", "ela fala...", "dizendo que...", "olha para câmera e fala..."
  const regex = /(?:ele\s+termina\s+n[ée]\s+ele\s+olha\s+para\s+c[âa]mera\s+e\s+fala|olha\s+(?:para|pra)\s+c[âa]mera\s+e\s+fala|(?:ele|ela)\s+(?:fala|diz|falou|disse|vai falar|vai dizer))[:\s]+([\s\S]*?)(?=(?:a[íi]\s+(?:ele|ela|j[áa])|ela\s+fala|ele\s+fala|ele\s+falou|ele\s+termina|ela\s+termina|e\s+[ée]\s+um\s+homem|e\s+acontece|$|\.))/gi;

  let m: RegExpExecArray | null;
  const segments: string[] = [];
  while ((m = regex.exec(text)) !== null) {
    let seg = m[1]?.trim();
    if (seg) {
      seg = seg.replace(/^(?:assim|que|isso)[:\s]*/i, '').trim();
      seg = seg.replace(/^(?:ele|ela)\s+(?:fala|diz|falou|disse)[:\s]*/i, '').trim();
      if (seg.length >= 8) {
        segments.push(fixCommonSlips(seg));
      }
    }
  }

  if (segments.length > 0) {
    const mainProduct = segments.find((s) =>
      /esse\s+aqui|novo|produto|lan[çc]amento|celular|qualidade|benef[íi]cio/i.test(s)
    );
    const mainCta = segments.find((s) =>
      /comprei|compra|carrinho|adquir|shop/i.test(s)
    );

    let combined = '';
    if (mainProduct && mainCta && mainProduct !== mainCta) {
      combined = `${mainProduct}. ${mainCta}`;
    } else if (mainProduct) {
      combined = mainProduct;
    } else if (mainCta) {
      combined = mainCta;
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
    // Tenta limpar marcadores de descrição de cena para extrair a intenção do criador
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
  // Remove aspas no início/fim
  s = s.replace(/^["'«“]|["'»”]$/g, '').trim();
  // Capitaliza primeira letra
  s = s.charAt(0).toUpperCase() + s.slice(1);
  // Remove pontos duplicados ou sequências feias
  s = s.replace(/\.{2,}/g, '.');
  s = s.replace(/\s+([.,!?])/g, '$1');
  // Se não termina com pontuação
  if (!/[.!?]$/.test(s)) {
    s += '!';
  }
  // Limita estritamente a 225 caracteres
  if (s.length > 225) {
    s = s.slice(0, 225).replace(/[,;:\s]+[^.!?,;:]*$/, '') + '!';
  }
  return s;
}
