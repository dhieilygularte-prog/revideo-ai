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
    pattern: /\b(alfaiataria|crepe\s+alfaiataria|crepe\s+de\s+alfaiataria|two\s*way|gabardine|marant|sensoriale|oxfordine)\b/i,
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
    pattern: /\b(crepe(\s+georgette|\s+invictus|\s+malha|\s+bubble|\s+sedinha|\s+twill|\s+amanda|\s+scuba)?)\b/i,
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
    id: 'tactel',
    labelPt: 'Tactel / Nylon',
    pattern: /\b(tactel|nylon|corta\s+vento|poliester|poli[eé]ster|elastano)\b/i,
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

function extractExplicitFabricPhrase(rawText: string): string | null {
  const match = rawText.match(
    /(?:tecido|material|composi[cç][aã]o|confeccionad[oa]\s+em|feit[oa]\s+(?:em|de))\s*[:\-]?\s*([^\n.;|]{2,70})/i
  );
  if (match?.[1]) {
    return match[1].trim();
  }
  const compMatch = rawText.match(/\b(\d{1,3}%\s*[a-zA-ZÀ-ÿ]+(?:\s*(?:e|,|\+|\/)?\s*\d{1,3}%\s*[a-zA-ZÀ-ÿ]+)*)/i);
  if (compMatch?.[1]) {
    return compMatch[1].trim();
  }
  return null;
}

export function extractGarmentFromProductInfo(rawText?: string): string | null {
  if (!rawText || !rawText.trim()) return null;
  const s = rawText
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
    return 'Vestido';
  }
  if (/\bsaia\b/.test(s)) {
    if (/\b(couro|courino|pu)\b/.test(s)) return 'Saia Couro';
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
  if (/\bcamisa\s+social\b/.test(s)) return 'Camisa Social';
  if (/\b(blusa|blusinha|camiseta|t-shirt|tshirt)\b/.test(s)) return 'Blusa Feminina';

  return null;
}

export function analyzeAnaMariaProductInfo(rawProductInfo?: string): AnalyzedAnaMariaProductInfo {
  const rawText = (rawProductInfo || '').trim();
  if (!rawText) {
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

  const cleanedText = cleanRawProductInfoText(rawText);
  const normSearch = rawText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const detectedFabrics = FABRIC_CATALOG.filter(
    (entry) => entry.pattern.test(rawText) || entry.pattern.test(normSearch)
  );

  const explicitPhrase = extractExplicitFabricPhrase(rawText);
  const fallbackShort = rawText.length <= 75 ? rawText.replace(/\s+/g, ' ').trim() : '';

  const fabricSummaryLabel =
    detectedFabrics.length > 0
      ? detectedFabrics.slice(0, 3).map((f) => f.labelPt).join(' + ')
      : explicitPhrase || fallbackShort || 'Conforme especificações informadas';

  const constructionNotes = extractConstructionNotes(rawText);
  const detectedGarmentHint = extractGarmentFromProductInfo(rawText);

  const textureDirectivesPt = detectedFabrics
    .slice(0, 3)
    .map((f) => `- **${f.labelPt}:** ${f.visualPromptPt}.`)
    .join('\n');

  const textureDirectivesEn = detectedFabrics
    .slice(0, 3)
    .map((f) => `- ${f.labelPt}: ${f.visualPromptEn}.`)
    .join(' ');

  const promptBlockPt = `[TECIDO E INFORMAÇÕES REAIS DO PRODUTO — TEXTURA E CONSTRUÇÃO OBRIGATÓRIAS]:
- Especificações reais informadas pelo usuário: "${cleanedText}"
- TECIDO IDENTIFICADO: **${fabricSummaryLabel}**
${textureDirectivesPt ? `${textureDirectivesPt}\n` : ''}${constructionNotes.length > 0 ? `- Detalhes estruturais obrigatórios: ${constructionNotes.join(', ')}.\n` : ''}- REGRA CONTRA FOTO DE REFERÊNCIA COM BAIXA QUALIDADE: Mesmo que a imagem de referência do produto esteja comprimida, desfocada ou com baixa nitidez e não mostre claramente a trama do tecido, você DEVE renderizar fielmente e com nitidez cristalina a textura real, caimento, opacidade/transparência e comportamento físico do tecido especificado acima (**${fabricSummaryLabel}**), preservando 100% a cor exata, estampa e modelagem da foto de referência.`;

  const promptBlockEn = `[MANDATORY FABRIC TEXTURE & PRODUCT SPECIFICATION (READ TEXT SPECS TO RENDER EXACT FABRIC EVEN IF REFERENCE PHOTO IS LOW-RES/BLURRY)]:
- User product info: "${cleanedText}"
- Exact fabric/material: ${fabricSummaryLabel}. ${textureDirectivesEn}${constructionNotes.length > 0 ? ` Construction details: ${constructionNotes.join(', ')}.` : ''} Even if the uploaded product photo has low resolution, compression, or blur that hides the weave, accurately render this exact fabric grain, drape, opacity, and tactile surface finish while keeping 100% the reference photo's exact color, cut, and pattern.`;

  const compactLinePt = `[TECIDO E DETALHES DO PRODUTO: ${fabricSummaryLabel}${explicitPhrase && detectedFabrics.length === 0 ? '' : cleanedText && cleanedText.length <= 220 ? ` — ${cleanedText}` : ''}]`;
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
