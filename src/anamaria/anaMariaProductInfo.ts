/**
 * Extrai o código numérico do produto de links de compartilhamento do TikTok Shop
 * (ex.: https://www.tiktok.com/view/product/1738033535848712115?_d=... -> "1738033535848712115").
 * Também aceita o código numérico colado diretamente.
 */
export function extractTikTokProductCode(rawInput?: string): string {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return '';

  const viewProductMatch = trimmed.match(/tiktok\.com\/view\/product\/(\d{6,32})/i);
  if (viewProductMatch?.[1]) {
    return viewProductMatch[1];
  }

  const genericViewMatch = trimmed.match(/\/view\/product\/(\d{6,32})/i);
  if (genericViewMatch?.[1]) {
    return genericViewMatch[1];
  }

  const directDigitsMatch = trimmed.match(/^(\d{6,32})$/);
  if (directDigitsMatch?.[1]) {
    return directDigitsMatch[1];
  }

  return '';
}

export interface FabricCatalogEntry {
  id: string;
  labelPt: string;
  pattern: RegExp;
  visualPromptPt: string;
  visualPromptEn: string;
}

export interface AnalyzedAnaMariaProductInfo {
  hasInfo: boolean;
  rawText: string;
  cleanedText: string;
  detectedFabrics: FabricCatalogEntry[];
  fabricSummaryLabel: string;
  constructionNotes: string[];
  detectedGarmentHint: string | null;
  promptBlockPt: string;
  promptBlockEn: string;
  compactLinePt: string;
  compactLineEn: string;
}

const FABRIC_CATALOG: FabricCatalogEntry[] = [
  {
    id: 'canelado',
    labelPt: 'Malha Canelada / Ribana',
    pattern: /\b(canelad[oa]s?|ribana|malha\s+rib|malha\s+canelada|cotton\s+canelado|viscolycra\s+canelada|tricot?\s+canelado|ribbed\s+knit)\b/i,
    visualPromptPt: 'malha canelada autêntica com frisos/listras verticais finas em relevo nítido na trama, toque macio com elastano, ajuste anatômico confortável e acabamento fosco natural sem brilho artificial',
    visualPromptEn: 'authentic ribbed knit fabric with crisp fine vertical rib wales and subtle 3D texture ridges, matte soft stretch cotton/viscose finish, realistic close-up weave clarity',
  },
  {
    id: 'viscolinho',
    labelPt: 'Viscolinho',
    pattern: /\b(visco\s*linho|viscolinho)\b/i,
    visualPromptPt: 'tecido viscolinho autêntico com trama natural visível de fios mesclados estilo linho-viscose leve, textura fosca orgânica suavemente rústica, caimento fluido e arejado sem brilho plástico',
    visualPromptEn: 'authentic viscolinho linen-viscose blend fabric with visible delicate organic slub yarns, soft matte woven texture, natural breezy fluid drape with zero plastic gloss',
  },
  {
    id: 'linho',
    labelPt: 'Linho',
    pattern: /\b(linho(\s+puro|\s+misto|\s+r[uú]stico|\s+cru)?|linen)\b/i,
    visualPromptPt: 'tecido de linho natural com fibras entrelaçadas visíveis (irregularidades orgânicas sutis da trama), superfície fosca respirável e dobras estruturadas elegantes',
    visualPromptEn: 'authentic woven flax linen fabric with distinct natural interlaced slub fibers, crisp breathable matte finish, structured yet relaxed natural folds',
  },
  {
    id: 'alfaiataria',
    labelPt: 'Alfaiataria',
    pattern: /\b(alfaiataria|crepe\s+alfaiataria|crepe\s+de\s+alfaiataria|two\s*way|gabardine|marant|marrant|sensoriale|oxfordine)\b/i,
    visualPromptPt: 'tecido de alfaiataria encorpado e estruturado de trama fina fechada, superfície lisa fosca de acabamento refinado, vincos limpos e caimento elegante que não marca nem amassa',
    visualPromptEn: 'structured tailored suiting fabric with smooth tight fine-grain weave, clean matte medium-weight drape, crisp tailoring seams and structured silhouette',
  },
  {
    id: 'duna',
    labelPt: 'Tecido Duna',
    pattern: /\b(tecido\s+duna|crepe\s+duna|duna)\b/i,
    visualPromptPt: 'tecido Duna original (crepe micro-granulado fino) com leve textura creponada fosca ao toque, caimento solto leve e fluido sem amassar e sem brilho sintético',
    visualPromptEn: 'authentic Brazilian Duna micro-pebbled crepe fabric with fine subtle crinkled matte surface grain and lightweight flowy anti-wrinkle drape',
  },
  {
    id: 'anarruga',
    labelPt: 'Anarruga',
    pattern: /\b(anarruga|tecido\s+anarruga|malha\s+anarruga)\b/i,
    visualPromptPt: 'tecido anarruga com textura enrugada uniforme em micro-relevos tridimensionais franzidos em toda a superfície, alta elasticidade e ajuste ao corpo',
    visualPromptEn: 'authentic textured anarruga crinkled honeycomb-smocked stretch fabric with uniform raised 3D puckered texture across the entire garment',
  },
  {
    id: 'suplex_poliamida',
    labelPt: 'Suplex / Poliamida Fitness',
    pattern: /\b(suplex|supplex|poliamida|trilobal|wonder|zero\s+transpar[eê]ncia|lycra|dry\s*fit|dryfit|aerodry)\b/i,
    visualPromptPt: 'malha fitness encorpada de poliamida / suplex de alta compressão, trama densa e opaca sem transparência, superfície extremamente lisa e uniforme com elasticidade firme',
    visualPromptEn: 'dense high-compression polyamide/suplex activewear knit, thick completely opaque non-see-through matte-satin surface with smooth supportive stretch fit',
  },
  {
    id: 'cire',
    labelPt: 'Cirê',
    pattern: /\b(cir[eê]|cire)\b/i,
    visualPromptPt: 'tecido cirê com acabamento acetinado levemente brilhante de compressão, superfície lisa com reflexo suave metálico/glossy elegante',
    visualPromptEn: 'sleek glossy cire stretch fabric with smooth characteristic satin-sheen coating and sculpted elastic fit',
  },
  {
    id: 'trico_modal',
    labelPt: 'Tricô / Tricot Modal',
    pattern: /\b(tric[oô](\s+modal|\s+mousse)?|tricot(\s+modal|\s+mousse)?|fio\s+modal|ponto\s+tric[oô]|mousse|l[aã]|croch[eê]|crochet)\b/i,
    visualPromptPt: 'trama autêntica de tricô / fio modal com pontos de malha visíveis em relevo nítido (pontos entrelaçados ou trançados), textura aconchegante, macia e caimento encorpado flexível',
    visualPromptEn: 'authentic knitted modal tricot / crochet fabric with clearly visible interlocked knit stitch texture, soft plush yarn definition and supple knitted drape',
  },
  {
    id: 'cetim_seda',
    labelPt: 'Cetim / Seda Acetinada',
    pattern: /\b(cetim|acetinad[oa]|seda|gloss\s+satin|crepe\s+satin|satin)\b/i,
    visualPromptPt: 'cetim / seda acetinada de trama fechada ultra-macia com brilho acetinado luxuoso suave, reflexos líquidos naturais de luz nas dobras e caimento fluido',
    visualPromptEn: 'lustrous liquid silk satin weave with smooth soft reflective sheen, fluid luminous light highlights along gentle folds and delicate drape',
  },
  {
    id: 'couro_courino',
    labelPt: 'Couro Sintético / Courino PU',
    pattern: /\b(courino|couro(\s+sint[eé]tico|\s+ecol[oó]gico|\s+fake|\s+pu|\s+leg[ií]timo)?|napa|faux\s+leather|pu\s+leather|eco\s*couro)\b/i,
    visualPromptPt: 'couro sintético / courino PU autêntico com micro-textura granulada natural de couro, brilho semi-fosco elegante nos vincos e estrutura firme que sustenta o corte da peça',
    visualPromptEn: 'authentic supple PU faux-leather texture with realistic fine leather grain, subtle semi-matte specular sheen on creases and structured tailored shape',
  },
  {
    id: 'jeans_denim',
    labelPt: 'Jeans / Denim',
    pattern: /\b(jeans|denim)\b/i,
    visualPromptPt: 'jeans / denim autêntico de algodão encorpado com trama diagonal sarjada visível, costuras pespontadas nítidas e textura caracteristicamente estruturada',
    visualPromptEn: 'authentic woven cotton denim fabric with crisp diagonal twill weave, realistic topstitching seams and sturdy structured denim weight',
  },
  {
    id: 'sarja_brim',
    labelPt: 'Sarja / Brim',
    pattern: /\b(sarja|brim|twill|cotel[eê])\b/i,
    visualPromptPt: 'tecido de sarja / brim resistente com trama diagonal fina e nítida, acabamento fosco natural de algodão encorpado e ótimo caimento estruturado',
    visualPromptEn: 'authentic heavy cotton twill / brim fabric with crisp fine diagonal weave texture, matte natural cotton finish and clean tailored structure',
  },
  {
    id: 'renda_guipir',
    labelPt: 'Renda / Guipir',
    pattern: /\b(renda(\s+guipir|\s+chantilly|\s+poliamida)?|guipir|gripir|guipure|lace)\b/i,
    visualPromptPt: 'renda / guipir delicada com bordados florais ou geométricos bem definidos em relevo e áreas vazadas sutis com forro interno preservado exatamente como na referência',
    visualPromptEn: 'intricate floral or geometric openwork guipure/chantilly lace embroidery with crisp raised thread relief and delicate lined/sheer contrast matching reference',
  },
  {
    id: 'laise',
    labelPt: 'Laise (Lese)',
    pattern: /\b(laise|lese|lesie|broderie)\b/i,
    visualPromptPt: 'tecido laise 100% algodão com bordados vazados delicados estilo inglês (ilhoses e motivos florais bordados em relevo), toque fresco e estrutura leve',
    visualPromptEn: 'authentic cotton eyelet embroidery laise (broderie anglaise) fabric with crisp perforated floral cutout patterns and delicate raised stitching',
  },
  {
    id: 'tule',
    labelPt: 'Tule / Mesh',
    pattern: /\b(tule(\s+bordado|\s+com\s+elastano|\s+franc[eê]s)?|mesh|fil[oó])\b/i,
    visualPromptPt: 'tule fino translúcido de malha micro-telada leve e delicada sobre forro interno, com fluidez etérea nos movimentos e dobras',
    visualPromptEn: 'fine sheer delicate mesh tulle overlay fabric with subtle translucent airy weave over matching lining',
  },
  {
    id: 'crepe',
    labelPt: 'Crepe',
    pattern: /\b(crepe(\s+georgette|\s+invictus|\s+prada|\s+dior|\s+moss|\s+suede|\s+malha|\s+de\s+malha|\s+bubble|\s+sedinha|\s+twill|\s+amanda|\s+scuba)?)\b/i,
    visualPromptPt: 'tecido crepe de textura levemente granulada fosca e toque seco elegante, com caimento fluido encorpado e excelente definição nas costuras',
    visualPromptEn: 'authentic crepe woven fabric with refined fine pebble-grain matte texture, fluid structured drape and clean crisp seams',
  },
  {
    id: 'scuba_neoprene',
    labelPt: 'Scuba / Neoprene / Bengaline',
    pattern: /\b(scuba|neoprene|bengaline)\b/i,
    visualPromptPt: 'tecido encorpado estruturado estilo scuba / bengaline / neoprene de superfície lisa fosca firme, excelente sustentação corporal e modelagem definida',
    visualPromptEn: 'firm structured double-knit scuba/bengaline fabric with smooth clean matte surface and sculpted shape-holding drape',
  },
  {
    id: 'viscolycra_malha',
    labelPt: 'Viscolycra / Malha Fria',
    pattern: /\b(viscolycra|visco\s*lycra|malha\s+fria|fluity|liganete|microfibra|jersey)\b/i,
    visualPromptPt: 'malha fina extremamente macia e maleável (viscolycra / poliamida fluity) com caimento leve e geladinho acompanhando as curvas com naturalidade',
    visualPromptEn: 'ultra-soft supple viscose-elastane jersey / fluity knit with smooth fine matte weave and natural fluid curve-skimming drape',
  },
  {
    id: 'malha_romantic',
    labelPt: 'Malha Romantic',
    pattern: /\b(malha\s+romantic|tecido\s+romantic|romantic)\b/i,
    visualPromptPt: 'malha romantic encorpada de poliéster com elastano, toque macio e sedoso ao vestir, textura leve com leve elasticidade e caimento estruturado elegante sem marcar',
    visualPromptEn: 'authentic Brazilian Malha Romantic heavyweight smooth interlock stretch knit fabric with soft silky matte finish and structured fluid drape',
  },
  {
    id: 'malha_montaria',
    labelPt: 'Malha Montaria / Helanca',
    pattern: /\b(malha\s+montaria|montaria|helanca|suplex\s+light)\b/i,
    visualPromptPt: 'malha encorpada de trama firme e estruturada (montaria / helanca) com elasticidade confortável, zero transparência e ajuste limpo ao corpo',
    visualPromptEn: 'firm structured heavyweight double-knit ponte/montaria/helanca fabric with smooth opaque surface and sculpted supportive fit',
  },
  {
    id: 'viscose',
    labelPt: 'Viscose',
    pattern: /\b(viscose|visup|100%\s*viscose)\b/i,
    visualPromptPt: 'tecido plano de viscose leve e fresco com trama fina fosca natural, movimento fluido e caimento solto sem rigidez',
    visualPromptEn: 'lightweight breathable plain-woven viscose fabric with soft fine matte finish and natural effortless flowy movement',
  },
  {
    id: 'algodao_tricoline',
    labelPt: 'Tricoline / Algodão',
    pattern: /\b(tricoline|100%\s*algod[aã]o|algod[aã]o|cotton|menegotti|malha\s+30\.1|fio\s+30\.1|suedine|popeline|cambraia)\b/i,
    visualPromptPt: 'tecido / malha de algodão puro (tricoline ou malha penteada 30.1) com trama natural fosca respirável, textura nítida de fibra de algodão e zero brilho sintético',
    visualPromptEn: 'authentic breathable 100% cotton / crisp poplin tricoline woven texture with crisp matte natural cotton fibers and zero synthetic sheen',
  },
  {
    id: 'chiffon_musseline',
    labelPt: 'Chiffon / Musseline',
    pattern: /\b(chiffon|musseline|mousseline|organza|voal|voil)\b/i,
    visualPromptPt: 'tecido chiffon / musseline ultraleve, esvoaçante e delicado de trama fina semitransparente nas camadas soltas (com forro no corpo) e movimento fluido leve',
    visualPromptEn: 'ultra-lightweight airy sheer chiffon/mousseline woven drape with delicate translucent flowing layers over opaque body lining',
  },
  {
    id: 'moletom',
    labelPt: 'Moletom / Moletinho',
    pattern: /\b(moletom|moletinho|molecotton|flanelad[oa]|fleece)\b/i,
    visualPromptPt: 'malha de moletom / moletinho encorpado de algodão com textura fosca confortável de peso médio-alto e caimento casual estruturado',
    visualPromptEn: 'thick cozy cotton fleece / French terry moletom knit texture with soft matte brushed cotton hand-feel and relaxed structured drape',
  },
  {
    id: 'veludo_suede',
    labelPt: 'Veludo / Suede',
    pattern: /\b(veludo(\s+molhado|\s+cristal)?|plush|suede|camur[cç]a)\b/i,
    visualPromptPt: 'tecido aveludado (veludo / suede) com micro-pelúcia macia e sombreado direcional rico característico sob a luz ambiente do cenário',
    visualPromptEn: 'rich plush velvet / brushed suede micro-pile fabric texture with authentic directional light-and-shadow nap depth',
  },
  {
    id: 'plissado',
    labelPt: 'Plissado',
    pattern: /\b(plissad[oa]|tecido\s+plissado|crepe\s+plissado)\b/i,
    visualPromptPt: 'tecido plissado com pregas sanfonadas verticais finas, contínuas e perfeitamente definidas ao longo de toda a peça',
    visualPromptEn: 'crisp uniform vertical accordion-pleated fabric texture with sharp continuous pleat ridges along the garment',
  },
  {
    id: 'paete_lurex',
    labelPt: 'Paetê / Lurex',
    pattern: /\b(paet[eê]|lantejoula|lurex|fio\s+met[aá]lico)\b/i,
    visualPromptPt: 'acabamento com paetês costurados / fios metálicos de lurex com reflexos cintilantes nítidos e realistas sob a luz do ambiente',
    visualPromptEn: 'intricate sewn sequin paete / shimmering metallic lurex knit weave texture with realistic ambient sparkle highlights',
  },
  {
    id: 'tweed_jacquard',
    labelPt: 'Tweed / Jacquard',
    pattern: /\b(tweed|boucl[eê]|jacquard|matelass[eê]|pied\s*de\s*poule)\b/i,
    visualPromptPt: 'tecido estruturado de tweed / jacquard com trama texturizada de fios entrelaçados em alto-relevo nítido e acabamento nobre',
    visualPromptEn: 'textured woven tweed/jacquard brocade fabric with detailed raised multi-thread weave pattern and refined tailored weight',
  },
  {
    id: 'zibeline',
    labelPt: 'Zibeline / Tafetá',
    pattern: /\b(zibeline|zibelini|tafet[aá]|mikado)\b/i,
    visualPromptPt: 'tecido estruturado de zibeline / tafetá encorpado com brilho acetinado discreto elegante e volume arquitetônico limpo nas dobras',
    visualPromptEn: 'structured heavyweight zibeline / taffeta satin-sheen woven fabric with crisp architectural pleats and refined semi-lustrous finish',
  },
  {
    id: 'tactel',
    labelPt: 'Tactel / Nylon',
    pattern: /\b(tactel|nylon|corta\s+vento)\b/i,
    visualPromptPt: 'tecido leve de fibra sintética/tactel de trama fechada lisa e resistente, acabamento fosco-acetinado sutil e secagem rápida',
    visualPromptEn: 'smooth tightly-woven synthetic/tactel matte weave fabric with crisp lightweight drape',
  },
];

const SPAM_LINE_PATTERNS: RegExp[] = [
  /\b(envio\s+imediato|pronta\s+entrega|frete\s+gr[aá]tis|despacho\s+em\s+\d+h|postamos\s+em)\b/i,
  /\b(parcelamos|cart[aã]o|pix|boleto|promo[cç][aã]o|oferta|imperd[ií]vel|garantia|devolu[cç][aã]o|troca\s+gr[aá]tis|qualifica[cç][aã]o)\b/i,
  /\b(tabela\s+de\s+medidas|guia\s+de\s+tamanhos|d[uú]vidas\s+frequentes|fale\s+conosco|chame\s+no\s+chat|clique\s+aqui|boas\s+compras|obrigad[oa]\s+pela\s+prefer[eê]ncia)\b/i,
  /\b(as\s+cores\s+podem\s+sofrer|varia[cç][aã]o\s+de\s+tela|ilumina[cç][aã]o\s+do\s+monitor)\b/i,
  /^(?:tamanhos?\s*[:\-]?\s*)?(?:p|m|g|gg|g1|g2|g3|pp|xg|u|[uú]nico)\s*(?:veste|\(|\/|-|:)\s*(?:\d{2})/i,
  /^(?:busto|cintura|quadril|comprimento)\s*[:\-]\s*\d+\s*cm/i,
  /^https?:\/\//i,
];

const RELEVANT_KEYWORD_LINE_PATTERNS: RegExp[] = [
  /\b(tecido|material|composi[cç][aã]o|fibra|malha|trama|textura|gramatura)\b/i,
  /\b(forro|forrad[oa]|bojo|transpar[eê]ncia|transparente|elastano|estica|elasticidade|lastex|el[aá]stico)\b/i,
  /\b(decote|al[cç]a|manga|fenda|z[ií]per|bot[aã]o|bot[oõ]es|bolso|cintura|c[oó]s|barra|bainha|babado|prega|recorte|cinto|amarra[cç][aã]o)\b/i,
  /\b(caimento|modelagem|acabamento|costura|detalhe|curto|midi|longo|cropped|oversized|pantalona|alfaiataria|conjunto|vestido|cal[cç]a|saia|blusa|macac[aã]o|macaquinho|bermuda|short)\b/i,
  /\d{1,3}\s*%/i,
];

function cleanRawProductInfoText(rawText: string): string {
  const normalized = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[#@][\wÀ-ÿ_]+/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!normalized) return '';
  if (normalized.length <= 220) {
    return normalized.replace(/\n+/g, '; ').replace(/\s{2,}/g, ' ').trim();
  }

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-*✔✓✅🔹🔸▪️➤►]+/, '').trim())
    .filter((line) => line.length >= 2);

  const prioritized: string[] = [];
  const neutral: string[] = [];

  lines.forEach((line, idx) => {
    const isSpam = SPAM_LINE_PATTERNS.some((rx) => rx.test(line));
    if (isSpam) return;

    const hasRelevantKeyword =
      RELEVANT_KEYWORD_LINE_PATTERNS.some((rx) => rx.test(line)) ||
      FABRIC_CATALOG.some((f) => f.pattern.test(line));

    if (hasRelevantKeyword || idx === 0) {
      prioritized.push(line);
    } else if (line.length <= 120) {
      neutral.push(line);
    }
  });

  const merged = (prioritized.length > 0 ? prioritized : neutral).join(' | ').trim();
  const fallbackMerged = merged || normalized.replace(/\n+/g, ' | ');
  return fallbackMerged.slice(0, 680).trim();
}

function extractConstructionNotes(text: string): string[] {
  const notes: string[] = [];
  const checks: Array<{ rx: RegExp; label: string }> = [
    { rx: /\b(nao\s+fica\s+transparente|zero\s+transpar[eê]ncia|n[aã]o\s+[eé]\s+transparente|sem\s+transpar[eê]ncia)\b/i, label: 'Tecido opaco (não fica transparente)' },
    { rx: /\b(possui\s+forro|com\s+forro|forrad[oa])\b/i, label: 'Possui forro interno' },
    { rx: /\b(sem\s+bojo|n[aã]o\s+possui\s+bojo)\b/i, label: 'Sem bojo' },
    { rx: /\b(com\s+bojo|possui\s+bojo)\b/i, label: 'Com bojo estruturado' },
    { rx: /\b(lastex|el[aá]stico\s+nas\s+costas|el[aá]stico\s+na\s+cintura)\b/i, label: 'Com lastex / elástico ajustado' },
    { rx: /\b(al[cç]a\s+regul[aá]vel|al[cç]as\s+regul[aá]veis|al[cç]a\s+fina)\b/i, label: 'Alças definidas conforme especificação' },
    { rx: /\b(fenda\s+lateral|fenda\s+frontal|com\s+fenda)\b/i, label: 'Com fenda' },
    { rx: /\b(cintura\s+alta|c[oó]s\s+alto)\b/i, label: 'Cintura alta' },
    { rx: /\b(bolso|bolsos)\b/i, label: 'Com bolsos' },
    { rx: /\b(bot[oõ]es|bot[aã]o)\b/i, label: 'Com botões' },
    { rx: /\b(z[ií]per)\b/i, label: 'Com zíper' },
  ];

  const norm = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  for (const item of checks) {
    if (item.rx.test(text) || item.rx.test(norm)) {
      notes.push(item.label);
    }
  }
  return notes;
}

function applyReplacementWithCase(match: string, replacementLower: string): string {
  if (!match) return replacementLower;
  if (match === match.toUpperCase() && match.length > 1) {
    return replacementLower.toUpperCase();
  }
  const firstChar = match.charAt(0);
  if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
    return replacementLower.charAt(0).toUpperCase() + replacementLower.slice(1);
  }
  return replacementLower;
}

const PORTUGUESE_FASHION_TYPO_RULES: Array<[RegExp, string]> = [
  [/\blond([oa]s?)\b/gi, 'long$1'],
  [/\b(vetido|vestdo|vestidp|vesitdo|vestdio|vestidio)(s?)\b/gi, 'vestido$2'],
  [/\b(calsa|cauca|calssa|calca)(s?)\b/gi, 'calça$2'],
  [/\b(pantolona|pantalonha|pantallona)(s?)\b/gi, 'pantalona$2'],
  [/\b(conjuto|cojunto|congjunto|comjunto)(s?)\b/gi, 'conjunto$2'],
  [/\b(macaquino|macaqunho|macachinho)(s?)\b/gi, 'macaquinho$2'],
  [/\bmacacao\b/gi, 'macacão'],
  [/\b(alfaiatria|alfeiataria|alfaetaria|alfaiatari)\b/gi, 'alfaiataria'],
  [/\b(viscolino|visculinho|viscolhino)\b/gi, 'viscolinho'],
  [/\bviscolicra\b/gi, 'viscolycra'],
  [/\b(calenad|canaled)([oa]s?)\b/gi, 'canelad$2'],
  [/\b(croped|cropedd|croppd|cropeed|crooped)(s?)\b/gi, 'cropped$2'],
  [/\bcamizet(a|as|e|es)\b/gi, 'camiset$1'],
  [/\b(blusina|bluzinha)(s?)\b/gi, 'blusinha$2'],
  [/\bbluz(a|as)\b/gi, 'blus$1'],
  [/\bjaqeta(s?)\b/gi, 'jaqueta$1'],
  [/\b(blaser|bleizer|blaiser)(es|s?)\b/gi, 'blazer$2'],
  [/\bbiquin[ie](s?)\b/gi, 'biquíni$1'],
  [/\b(femimino|femenino|femino)\b/gi, 'feminino'],
  [/\b(femimina|femenina|feminia)\b/gi, 'feminina'],
  [/\b(acadenia|acdemia)\b/gi, 'academia'],
  [/\bcrepi\b/gi, 'crepe'],
  [/\bmussiline\b/gi, 'musseline'],
  [/\btricolini\b/gi, 'tricoline'],
  [/\bbengalini\b/gi, 'bengaline'],
  [/\blecido\b/gi, 'tecido'],
  [/\b(romantci|romantc|romanric|romantick|romantik)\b/gi, 'romantic'],
  [/\bcontorto\b/gi, 'conforto'],
  [/\bpoliester\b/gi, 'poliéster'],
  [/\balgodao\b/gi, 'algodão'],
  [/\bjacard\b/gi, 'jacquard'],
];

const PT_GARMENT_MID_CONTEXT_REGEX =
  /\b(vestido|saia|macac[aã]o|conjunto|comprimento|modelo|estilo)\s+mid\b/gi;

export function unwrapSoftLineBreaks(text: string): string {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/([^\n.!?:;])\n([^\n\-•*✔✓✅🔹🔸▪️➤►])/g, '$1 $2');
}

export function normalizePortugueseFashionText(text: string): string {
  if (!text) return '';
  let result = text;

  for (const [regex, replacementTemplate] of PORTUGUESE_FASHION_TYPO_RULES) {
    result = result.replace(regex, (fullMatch, ...args) => {
      let resolved = replacementTemplate;
      for (let i = 0; i < args.length - 2; i++) {
        const groupVal = typeof args[i] === 'string' ? args[i] : '';
        resolved = resolved.replace(new RegExp(`\\$${i + 1}`, 'g'), groupVal.toLowerCase());
      }
      return applyReplacementWithCase(fullMatch, resolved);
    });
  }

  result = result.replace(PT_GARMENT_MID_CONTEXT_REGEX, (fullMatch, prefix: string) => {
    const midStart = fullMatch.length - 3;
    const midWord = fullMatch.slice(midStart);
    return `${prefix} ${applyReplacementWithCase(midWord, 'midi')}`;
  });

  return result;
}

const LOWERCASE_PT_WORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'em', 'com', 'para', 'no', 'na']);

export function normalizeIdentifiedGarmentName(rawName: string): string {
  const cleaned = (rawName || '')
    .replace(/["'""'']/g, '')
    .replace(/\.+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';

  let fixed = normalizePortugueseFashionText(cleaned)
    .replace(/(?<![-])\bmid\b(?![-])/gi, (m) => applyReplacementWithCase(m, 'midi'))
    .replace(/\bmaio\b/gi, (m) => applyReplacementWithCase(m, 'maiô'));

  fixed = fixed
    .split(/\s+/)
    .map((word, idx) => {
      if (!word) return word;
      const lower = word.toLowerCase();
      if (idx > 0 && LOWERCASE_PT_WORDS.has(lower)) {
        return lower;
      }
      if (/^[A-Z0-9]{2,4}$/.test(word)) {
        return word;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');

  return fixed.trim();
}

function cleanFabricPhrase(rawPhrase: string): string {
  return normalizePortugueseFashionText(rawPhrase)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:de\s+(?:toque|caimento)|com\s+toque|n[aã]o\s+(?:amassa|encolhe|desbota|marca|fica\s+transparente|d[aá]\s+bolinha)|zero\s+transpar[eê]ncia|super\s+confort[aá]vel|de\s+(?:alta|excelente|[oó]tima)\s+qualidade)\b.*$/i, '')
    .split(/[,.;|\n]/)[0]
    .replace(/^[\s:\-]+|[\s:\-,]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripLiningClauses(rawText: string): string {
  const lines = (rawText || '')
    .split(/\n+/)
    .filter((line) => !/^\s*(?:com\s+|possui\s+)?forro\b/i.test(line));
  return lines.join('\n').replace(/\b(?:com|possui)\s+forro\s+(?:em|de|100%|\d+%)\s+[^.;|\n]+/gi, ' ');
}

function extractExplicitFabricPhrase(rawText: string, preferMainClothOnly = false): { phrase: string; isExplicitLabel: boolean } | null {
  const unwrapped = unwrapSoftLineBreaks(rawText);
  const sourceText = preferMainClothOnly ? stripLiningClauses(unwrapped) : unwrapped;
  const labelMatch = sourceText.match(
    /(?:tecido(?:\s+principal)?|material|composi[cç][aã]o)\s*[:\-]\s*([^\n.;|]{2,70})/i
  );
  if (labelMatch?.[1]) {
    const cleaned = cleanFabricPhrase(labelMatch[1]);
    if (cleaned.length >= 2) {
      return { phrase: cleaned, isExplicitLabel: true };
    }
  }

  const colonDashBulletMatch = sourceText.match(
    /(?:^|[\n•\-*])\s*tecido\s+([a-zA-ZÀ-ÿ0-9 ]{2,45})(?=\s*[:\-]|$)/im
  );
  if (colonDashBulletMatch?.[1]) {
    const cleaned = cleanFabricPhrase(colonDashBulletMatch[1]);
    if (cleaned.length >= 2) {
      return { phrase: cleaned, isExplicitLabel: true };
    }
  }

  const inlineMatch = sourceText.match(
    /(?:confeccionad[oa]\s+(?:em|com)|feit[oa]\s+(?:em|de|com)|no\s+tecido|em\s+tecido)\s+([^\n.,;|]{2,50})/i
  );
  if (inlineMatch?.[1]) {
    const cleaned = cleanFabricPhrase(inlineMatch[1]);
    if (cleaned.length >= 2) {
      return { phrase: cleaned, isExplicitLabel: true };
    }
  }

  const compMatch = sourceText.match(
    /\b(\d{1,3}\s*%\s*[a-zA-ZÀ-ÿ]+(?:\s*(?:e|,|\+|\/)?\s*\d{1,3}\s*%\s*[a-zA-ZÀ-ÿ]+)*)/i
  );
  if (compMatch?.[1]) {
    return { phrase: cleanFabricPhrase(compMatch[1]), isExplicitLabel: false };
  }
  return null;
}

function capitalizeLeadingChar(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const PURE_FABRIC_DISQUALIFY_GARMENTS_RX =
  /\b(vestido|vestdo|cal[cç]a|calsa|pantalona|saia|blusa|blusinha|camisa|camiseta|t-shirt|tshirt|cropped|top|conjunto|conjuto|macac[aã]o|macaquinho|short|shorts|bermuda|body|pijama|camisola|babydoll|jaqueta|blazer|biqu[ií]ni|mai[oô]|cinta|cardigan|casaco|colete|kimono|regata|legging|cal[cç]ado|sand[aá]lia|t[eê]nis|salto|bota|rasteirinha|sapatilha)\b/i;

const PURE_FABRIC_DISQUALIFY_LISTING_RX =
  /\b(feminin[oa]s?|masculin[oa]s?|lond[oa]|long[oa]|mid|midi|curt[oa]|possui|cont[eé]m|detalhe|decote|fenda|bojo|forro|z[ií]per|bot[oõ]es|bot[aã]o|bolso|cinto|tamanho|tamanhos|veste|medidas|busto|cintura|quadril|comprimento|envio|entrega|modelo|refer[eê]ncia|descri[cç][aã]o|lan[cç]amento|promo[cç][aã]o|tabela)\b/i;

export function extractFabricFieldSuggestion(rawProductInfo?: string): string {
  const raw = (rawProductInfo || '').trim();
  if (!raw) return '';

  const unwrappedRaw = unwrapSoftLineBreaks(raw);
  const normalizedRaw = normalizePortugueseFashionText(unwrappedRaw);
  const singleLine = normalizedRaw.replace(/[ \t]+/g, ' ').trim();
  const isSingleLine = !/\n/.test(raw.replace(/\r\n/g, '\n'));

  // Caso 1: Usuário digitou apenas o tecido sem colar descrição completa -> auto-preenche com a mesma informação
  if (isSingleLine && singleLine.length <= 70 && !/[•✅✔✓➤►|]|https?:\/\//i.test(singleLine)) {
    const strippedPrefix = singleLine.replace(/^(?:tecido|material)\s*[:\-]\s*/i, '').replace(/[.!?,;:]+$/g, '').trim();
    const asciiCheck = strippedPrefix
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (
      strippedPrefix.length >= 2 &&
      !PURE_FABRIC_DISQUALIFY_GARMENTS_RX.test(strippedPrefix) &&
      !PURE_FABRIC_DISQUALIFY_GARMENTS_RX.test(asciiCheck) &&
      !PURE_FABRIC_DISQUALIFY_LISTING_RX.test(strippedPrefix) &&
      !PURE_FABRIC_DISQUALIFY_LISTING_RX.test(asciiCheck)
    ) {
      return capitalizeLeadingChar(strippedPrefix);
    }
  }

  // Caso 2: Usuário colou uma descrição de produto -> extrai o tecido principal ignorando linhas de forro
  const mainClothText = stripLiningClauses(normalizedRaw);
  const explicit = extractExplicitFabricPhrase(normalizedRaw, true);

  if (
    explicit?.isExplicitLabel &&
    explicit.phrase &&
    explicit.phrase.length <= 48 &&
    !/^\d{1,3}\s*%/.test(explicit.phrase) &&
    !/^(?:alta|ótima|otima|excelente|boa)\s+qualidade$/i.test(explicit.phrase)
  ) {
    return capitalizeLeadingChar(explicit.phrase);
  }

  const normMain = mainClothText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  let detected = FABRIC_CATALOG.filter(
    (entry) => entry.pattern.test(mainClothText) || entry.pattern.test(normMain)
  );

  if (detected.length === 0) {
    const normFull = normalizedRaw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    detected = FABRIC_CATALOG.filter(
      (entry) => entry.pattern.test(normalizedRaw) || entry.pattern.test(normFull)
    );
  }

  // Evita duplicidade "Alfaiataria + Crepe" quando o texto diz "Crepe de Alfaiataria"
  if (detected.length > 1 && /\bcrepe\s+(?:de\s+)?alfaiataria\b/i.test(normMain)) {
    detected = detected.filter((d) => d.id !== 'crepe');
  }

  if (detected.length > 0) {
    return detected.slice(0, 2).map((d) => d.labelPt).join(' + ');
  }

  if (explicit?.phrase) {
    return capitalizeLeadingChar(explicit.phrase);
  }

  // Fallback para qualquer menção a "Malha <nome>" ou "Malha" genérica
  const genericMalhaMatch = mainClothText.match(
    /\bmalha(?:\s+(?!de\b|com\b|em\b|para\b|super\b|leve\b|maci[oa]\b|confort[aá]vel\b|que\b|e\b)[a-zA-ZÀ-ÿ]{3,18})?\b/i
  );
  if (genericMalhaMatch?.[0]) {
    return genericMalhaMatch[0]
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // Fallback para fibras genéricas se nenhum tecido específico do catálogo foi citado
  if (/\bpoli[eé]ster\b/i.test(mainClothText) && /\belastano\b/i.test(mainClothText)) {
    return 'Poliéster com Elastano';
  }
  if (/\bpoli[eé]ster\b/i.test(mainClothText)) {
    return 'Poliéster';
  }

  return '';
}

export function extractGarmentFromProductInfo(rawText?: string): string | null {
  if (!rawText || !rawText.trim()) return null;
  const fixedRaw = normalizePortugueseFashionText(rawText);
  const s = fixedRaw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (/\b(conjunto\s+(?:de\s+)?academia|conjunto\s+fitness|conjunto\s+treino|top\s+e\s+legging|short\s+e\s+top\s+fitness)\b/.test(s)) {
    return 'Conjunto de Academia';
  }
  if (/\b(cinta\s+modeladora|modelador\s+corporal)\b/.test(s)) {
    return 'Cinta Modeladora';
  }
  if (/\b(roupa\s+(?:de\s+)?academia|legging\s+academia|fitness|suplex)\b/.test(s) && !/\bvestido\b/.test(s)) {
    return 'Roupa de Academia';
  }
  if (/\b(conjunto|conjuntinho|duas\s+pecas|2\s+pecas)\b/.test(s)) {
    return 'Conjunto';
  }
  if (/\b(baby\s*doll|babydoll|camisola)\b/.test(s)) {
    return 'Camisola Baby Doll';
  }
  if (/\bpijama\b/.test(s)) {
    return 'Pijama';
  }
  if (/\bmacaquinho\b/.test(s)) {
    return 'Macaquinho';
  }
  if (/\bmacacao\b/.test(s)) {
    return 'Macacão';
  }
  if (/\bvestido\b/.test(s)) {
    const hasLongo = /\blong[oa]\b/.test(s);
    const hasMidi = /\bmidi\b/.test(s) || /\bvestido\s+mid\b/.test(s);
    const hasCurto = /\bcurt[oa]\b/.test(s);
    const lengthCount = [hasLongo, hasMidi, hasCurto].filter(Boolean).length;
    if (lengthCount === 1) {
      if (hasLongo) return 'Vestido Longo';
      if (hasMidi) return 'Vestido Midi';
      if (hasCurto) return 'Vestido Curto';
    }
    return 'Vestido';
  }
  if (/\bsaia\b/.test(s)) {
    if (/\b(couro|courino|pu)\b/.test(s)) return 'Saia Couro';
    if (/\blong[oa]\b/.test(s) && !/\bcurt[oa]\b/.test(s) && !/\bmidi\b/.test(s)) return 'Saia Longa';
    if (/\bmidi\b/.test(s) && !/\bcurt[oa]\b/.test(s) && !/\blong[oa]\b/.test(s)) return 'Saia Midi';
    return 'Saia';
  }
  if (/\b(calca|pantalona|wide\s*leg|flare)\b/.test(s)) {
    if (/\b(pantalona|folgada|wide\s*leg|palazzo|linho)\b/.test(s)) return 'Calça Pantalona';
    if (/\bjeans\b/.test(s)) return 'Calça Jeans';
    if (/\b(social|alfaiataria|two\s*way)\b/.test(s)) return 'Calça Social';
    return 'Calça Social';
  }
  if (/\b(bermuda|shorts?)\b/.test(s) && !/\bconjunto\b/.test(s)) {
    if (/\bjeans\b/.test(s)) return 'Short Jeans';
    if (/\balfaiataria\b/.test(s)) return 'Short Alfaiataria';
    return 'Bermuda';
  }
  if (/\b(biquini|maio|saida\s+de\s+praia)\b/.test(s)) {
    return 'Biquíni';
  }
  if (/\bbody\b/.test(s) && !/\bbody\s+splash\b/.test(s)) {
    return 'Body';
  }
  if (/\bjaqueta\b/.test(s)) return 'Jaqueta';
  if (/\bblazer\b/.test(s)) return 'Blazer';
  if (/\btop\s+cropped|cropped\b/.test(s)) return 'Top Cropped';
  if (/\b(camiseta|camisetas|t-shirt|tshirt)\b/.test(s)) return 'Camiseta';
  if (/\bcamisa\s+polo\b/.test(s)) return 'Camisa Polo';
  if (/\bcamisa\s+social\b/.test(s)) return 'Camisa Social';
  if (/\bcamisa\b/.test(s)) return 'Camisa';
  if (/\b(sueter|sweater|cardiga|cardigan)\b/.test(s)) return 'Suéter';
  if (/\b(blusa|blusinha)\b/.test(s)) {
    return /\bmasculin[oa]\b/.test(s) ? 'Camiseta' : 'Blusa Feminina';
  }

  return null;
}

export function analyzeAnaMariaProductInfo(
  rawProductInfo?: string,
  overrideFabricType?: string
): AnalyzedAnaMariaProductInfo {
  const rawText = normalizePortugueseFashionText((rawProductInfo || '').trim());
  const normalizedOverride = normalizePortugueseFashionText((overrideFabricType || '').trim());

  if (!rawText && !normalizedOverride) {
    return {
      hasInfo: false,
      rawText: '',
      cleanedText: '',
      detectedFabrics: [],
      fabricSummaryLabel: '',
      constructionNotes: [],
      detectedGarmentHint: null,
      promptBlockPt: '',
      promptBlockEn: '',
      compactLinePt: '',
      compactLineEn: '',
    };
  }

  const unwrappedRawText = unwrapSoftLineBreaks(rawText);
  const cleanedText = cleanRawProductInfoText(rawText || normalizedOverride);
  const normSearch = (unwrappedRawText || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  let detectedFabrics: FabricCatalogEntry[] = [];
  if (normalizedOverride) {
    const normOverride = normalizedOverride
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    detectedFabrics = FABRIC_CATALOG.filter(
      (entry) => entry.pattern.test(normalizedOverride) || entry.pattern.test(normOverride)
    );
  } else {
    detectedFabrics = FABRIC_CATALOG.filter(
      (entry) => entry.pattern.test(unwrappedRawText) || entry.pattern.test(normSearch)
    );
  }

  const explicitPhrase = extractExplicitFabricPhrase(rawText, true)?.phrase || null;
  const fallbackShort = rawText.length <= 75 ? rawText.replace(/\s+/g, ' ').trim() : '';

  const fabricSummaryLabel =
    normalizedOverride ||
    (detectedFabrics.length > 0
      ? detectedFabrics.slice(0, 3).map((f) => f.labelPt).join(' + ')
      : explicitPhrase || fallbackShort || 'Conforme especificações informadas');

  const constructionNotes = extractConstructionNotes(rawText || normalizedOverride);
  const detectedGarmentHint = extractGarmentFromProductInfo(rawText);

  const textureDirectivesPt = detectedFabrics
    .slice(0, 3)
    .map((f) => `- **${f.labelPt}:** ${f.visualPromptPt}.`)
    .join('\n');

  const textureDirectivesEn = detectedFabrics
    .slice(0, 3)
    .map((f) => `- ${f.labelPt}: ${f.visualPromptEn}.`)
    .join(' ');

  const fabricHeaderPt = normalizedOverride
    ? `- TECIDO CONFIRMADO PELO USUÁRIO: **${fabricSummaryLabel}**`
    : `- TECIDO IDENTIFICADO: **${fabricSummaryLabel}**`;

  const promptBlockPt = `[TECIDO E INFORMAÇÕES REAIS DO PRODUTO — TEXTURA E CONSTRUÇÃO OBRIGATÓRIAS]:
- Especificações reais informadas pelo usuário: "${cleanedText}"
${fabricHeaderPt}
${textureDirectivesPt ? `${textureDirectivesPt}\n` : ''}${constructionNotes.length > 0 ? `- Detalhes estruturais obrigatórios: ${constructionNotes.join(', ')}.\n` : ''}- REGRA CONTRA FOTO DE REFERÊNCIA COM BAIXA QUALIDADE: Mesmo que a imagem de referência do produto esteja comprimida, desfocada ou com baixa nitidez e não mostre claramente a trama do tecido, você DEVE renderizar fielmente e com nitidez cristalina a textura real, caimento, opacidade/transparência e comportamento físico do tecido especificado acima (**${fabricSummaryLabel}**), preservando 100% a cor exata, estampa e modelagem da foto de referência.`;

  const promptBlockEn = `[MANDATORY FABRIC TEXTURE & PRODUCT SPECIFICATION (READ TEXT SPECS TO RENDER EXACT FABRIC EVEN IF REFERENCE PHOTO IS LOW-RES/BLURRY)]:
- User product info: "${cleanedText}"
- Exact ${normalizedOverride ? 'user-confirmed' : 'identified'} fabric/material: ${fabricSummaryLabel}. ${textureDirectivesEn}${constructionNotes.length > 0 ? ` Construction details: ${constructionNotes.join(', ')}.` : ''} Even if the uploaded product photo has low resolution, compression, or blur that hides the weave, accurately render this exact fabric grain, drape, opacity, and tactile surface finish while keeping 100% the reference photo's exact color, cut, and pattern.`;

  const compactLinePt = `[TECIDO${normalizedOverride ? ' CONFIRMADO' : ''} E DETALHES DO PRODUTO: ${fabricSummaryLabel}${explicitPhrase && detectedFabrics.length === 0 ? '' : cleanedText && cleanedText.length <= 220 && cleanedText.toLowerCase() !== fabricSummaryLabel.toLowerCase() ? ` — ${cleanedText}` : ''}]`;
  const compactLineEn = `[FABRIC: ${fabricSummaryLabel}${textureDirectivesEn ? ` (${textureDirectivesEn})` : ''} | INFO: ${cleanedText.slice(0, 220)}]`;

  return {
    hasInfo: true,
    rawText,
    cleanedText,
    detectedFabrics,
    fabricSummaryLabel,
    constructionNotes,
    detectedGarmentHint,
    promptBlockPt,
    promptBlockEn,
    compactLinePt,
    compactLineEn,
  };
}

export const ULTRA_PHOTOREALISM_FEMALE_PROMPT = `ULTRA PHOTOREALISM — SKIN OVERRIDE & RAW CANDID REALISM:

CRITICAL SKIN TEXTURE OVERRIDE (MAKE IMPROVEMENTS CLEARLY VISIBLE): Even if any reference model photo has smooth, retouched, or airbrushed skin, DO NOT copy that smoothed finish — actively re-render ALL visible skin areas as authentic unretouched living human skin.
unretouched RAW candid photo, natural skin texture, subtle visible pores, fine micro-texture, fine vellus hair (peach fuzz), delicate body vellus hair, natural fine lines and skin creases, subtle skin micro-imperfections (tiny scattered freckles/beauty marks and light natural stretch lines on hips, thighs or upper arms), uneven organic skin tone with slight natural redness and warmth over knees, elbows, knuckles and collarbones, subsurface scattering, realistic controlled skin sheen under ambient indoor light, natural window daylight, shot on smartphone 35mm lens, subtle film grain.
Keep the same single framing, pose, body proportions, clothing, fabric, colors, lighting and composition. No smoothing, no beauty filter, no plastic or waxy skin, no airbrushed finish, no CGI appearance.`;

/**
 * Retorna o bloco de hiper-realismo humano corporal para fotos geradas quando ativado no Item 10.
 */
export function buildUltraPhotorealismBlock(options?: {
  isMale?: boolean;
  isPov?: boolean;
  allowsFace?: boolean;
}): string {
  if (options?.isPov) {
    return `ULTRA PHOTOREALISM — HANDS & SKIN OVERRIDE (RAW CANDID PHOTO):

CRITICAL SKIN TEXTURE OVERRIDE: Actively render authentic unretouched RAW human skin on the visible hands, fingers, knuckles and forearms: unretouched RAW candid photo, natural skin texture, subtle visible pores, fine micro-texture, fine vellus hair (peach fuzz), natural fine lines and knuckle creases, subtle skin micro-imperfections, uneven organic skin tone with slight warmth at knuckles, subsurface scattering, realistic controlled skin sheen, natural window daylight, shot on smartphone 35mm lens, subtle film grain. Keep the bed, background, products, fabric, colors, lighting and composition unchanged. No smoothing, no beauty filter, no plastic or waxy skin, no airbrushed finish, no CGI appearance.`;
  }

  if (options?.allowsFace) {
    return `ULTRA PHOTOREALISM — SKIN OVERRIDE & RAW CANDID FACE/BODY REALISM (MAKE IMPROVEMENTS CLEARLY VISIBLE):

CRITICAL SKIN TEXTURE OVERRIDE: Even if any reference model photo has smooth, retouched, or airbrushed skin, DO NOT keep or copy that smoothed finish — actively re-render the face, neck, chest, arms, hands and legs with authentic unretouched RAW human skin.
Add authentic unretouched human skin: unretouched RAW candid photo, natural skin texture, subtle visible pores, fine micro-texture, fine vellus hair (peach fuzz), delicate facial hair, natural fine lines around the eyes and smile, subtle skin micro-imperfections (tiny natural freckles/moles and light natural stretch lines where appropriate), uneven organic skin tone with slight natural redness around the cheeks and nose (and over knees, elbows and collarbones), subsurface scattering, soft natural oil sheen on T-zone and realistic controlled skin sheen, natural eye reflections and believable facial asymmetry. Natural window daylight, shot on smartphone 35mm lens, subtle film grain.
Keep the exact same face, identity, expression, pose, body proportions, clothing, fabric, colors, lighting and single mirror composition. No smoothing, no beauty filter, no airbrushed finish, no plastic or waxy skin, no CGI appearance.`;
  }

  if (options?.isMale) {
    return ULTRA_PHOTOREALISM_FEMALE_PROMPT
      .replace('hips, thighs or upper arms', 'shoulders, upper arms or torso')
      .replace('reference model photo', 'reference male model photo');
  }

  return ULTRA_PHOTOREALISM_FEMALE_PROMPT;
}
