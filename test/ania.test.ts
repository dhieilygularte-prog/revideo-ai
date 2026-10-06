import {
  detectCategory,
  detectFabric,
  detectStretch,
  detectProductMode,
  detectScenarioKey,
  getScenarioDescription,
  filterMoves,
  pickFalas,
  splitFala,
  ensureProductNameInSpeech,
  generateDescriptionHashtags,
  FALAS,
} from '../src/ania/aniaLibrary';
import {
  buildAniaImage1Prompt,
  buildAniaColorSwapPrompt,
  buildAniaVideoPrompt,
} from '../src/ania/aniaPrompts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[TEST FAILED] ${msg}`);
  }
}

console.log('🧪 Iniciando testes unitários do Método Ania (Patch V3 + Correções de Consistência e Fala)...\n');

// ─── TESTE 1: detectCategory & Subtipos ────────────────────────────────────
console.log('▶ Teste 1: detectCategory');
const cat1 = detectCategory('Calça pantalona duna');
assert(cat1.category === 'CALCA', `Esperava CALCA, obteve ${cat1.category}`);
assert(cat1.subtype === 'PERNA_LARGA', `Esperava PERNA_LARGA, obteve ${cat1.subtype}`);

const cat2 = detectCategory('Bermuda bengaline cintura alta');
assert(cat2.category === 'BERMUDA_SHORT', `Esperava BERMUDA_SHORT, obteve ${cat2.category}`);

const cat3 = detectCategory('Short saia fitness');
assert(cat3.category === 'SHORT_SAIA', `Esperava SHORT_SAIA, obteve ${cat3.category}`);

const cat4 = detectCategory('Pijama de botões manga curta');
assert(cat4.category === 'PIJAMA_CAMISOLA', `Esperava PIJAMA_CAMISOLA, obteve ${cat4.category}`);

const cat5 = detectCategory('Vestido midi viscolinho');
assert(cat5.category === 'VESTIDO', `Esperava VESTIDO, obteve ${cat5.category}`);

const cat6 = detectCategory('Calça alfaiataria social');
assert(cat6.category === 'CALCA', `Esperava CALCA, obteve ${cat6.category}`);
assert(cat6.subtype === 'SOCIAL', `Esperava SOCIAL, obteve ${cat6.subtype}`);

console.log('  ✓ detectCategory passou com sucesso!');

// ─── TESTE 2: detectStretch & detectFabric ─────────────────────────────────
console.log('▶ Teste 2: detectStretch & detectFabric com Precedência');
assert(detectStretch('tecido bengaline com elastano') === true, 'Esperava true para elastano');
assert(detectStretch('malha canelada super confortável') === true, 'Esperava true para canelada');
assert(detectStretch('100% algodão alfaiataria sem elastano') === false, 'Esperava false para 100% algodão sem elastano');
assert(detectStretch('vestido lindo') === null, 'Esperava null para sem indícios');

const fab1 = detectFabric('Calça pantalona duna', undefined, 'tecido leve e fluido');
assert(fab1.key === 'duna', `Esperava duna, obteve ${fab1.key}`);

const fab2 = detectFabric('Camisa linho', 'viscolinho', 'informação da loja');
assert(fab2.key === 'viscolinho', `Precedência manual vence, esperava viscolinho, obteve ${fab2.key}`);

console.log('  ✓ detectStretch & detectFabric passaram com sucesso!');

// ─── TESTE 3: detectProductMode (Calçados vs Roupas) ──────────────────────
console.log('▶ Teste 3: detectProductMode');
assert(detectProductMode('Tênis esportivo running') === 'footwear', 'Esperava footwear para tênis');
assert(detectProductMode('Sandália salto bloco') === 'footwear', 'Esperava footwear para sandália');
assert(detectProductMode('Sapato social couro') === 'footwear', 'Esperava footwear para sapato');
assert(detectProductMode('Calça jeans cargo') === 'apparel', 'Esperava apparel para calça');
assert(detectProductMode('Vestido floral') === 'apparel', 'Esperava apparel para vestido');
console.log('  ✓ detectProductMode passou com sucesso!');

// ─── TESTE 4: detectScenarioKey & getScenarioDescription (Ambiente Natural) 
console.log('▶ Teste 4: Cenários e Ambiente Natural');
assert(detectScenarioKey('Conjunto fitness academia suplex') === 'gym', 'Esperava gym para academia');
assert(detectScenarioKey('Short praia biquíni sol') === 'beach', 'Esperava beach para praia');
assert(detectScenarioKey('Tênis corrida parque caminhada') === 'park', 'Esperava park para caminhada');
assert(detectScenarioKey('Uniforme mecânico oficina') === 'workshop', 'Esperava workshop para oficina');
assert(detectScenarioKey('Pijama baby doll') === 'home', 'Esperava home para pijama');

const homeDesc = getScenarioDescription('gym', false); // naturalEnv = false -> sempre casa simples
assert(homeDesc.includes('quarto simples e aconchegante de uma casa brasileira real'), 'Ambiente Natural OFF deve manter quarto residencial');

const gymDesc = getScenarioDescription('gym', true); // naturalEnv = true -> academia
assert(gymDesc.includes('academia comum e limpa'), 'Ambiente Natural ON deve usar academia sem pessoas concorrentes');
assert(gymDesc.includes('sem outras pessoas em primeiro plano'), 'Deve evitar pessoas concorrentes no fundo');

console.log('  ✓ Cenários e Ambiente Natural passaram com sucesso!');

// ─── TESTE 5: filterMoves (Calçados, Infantil POV, Roupas) ─────────────────
console.log('▶ Teste 5: filterMoves com Calçados e Infantil');
// Calçado Esportivo
const movesTenis = filterMoves({
  category: 'CALCADO',
  productMode: 'footwear',
  productName: 'Tênis esportivo corrida',
});
assert(movesTenis.v1.includes('focado nos pés'), 'Movimento de calçado deve focar nos pés');
assert(movesTenis.v1.includes('amortecimento') || movesTenis.v1.includes('corridinha'), 'Tênis esportivo deve ter amortecimento/passos');

// Calçado Social (sem corridinha/pulinhos)
const movesSapatoSocial = filterMoves({
  category: 'CALCADO',
  productMode: 'footwear',
  productName: 'Sapato social couro fino',
});
assert(!movesSapatoSocial.v1.includes('corridinha'), 'Sapato social NÃO deve ter corridinha');
assert(movesSapatoSocial.v1.includes('passos calmos e elegantes') || movesSapatoSocial.v1.includes('salto'), 'Sapato social deve ter passos elegantes');

// Modo Infantil (POV Adulto Obrigatório)
const movesInfantil = filterMoves({
  category: 'CONJUNTO',
  ageMode: 'child',
  productName: 'Conjuntinho infantil bebê',
});
assert(movesInfantil.v1.includes('POV adulto'), 'Modo infantil deve forçar POV adulto');
assert(movesInfantil.v1.includes('mãos de adulto seguram'), 'Modo infantil deve mostrar mãos de adulto');

console.log('  ✓ filterMoves passou com sucesso!');

// ─── TESTE 6: pickFalas & ensureProductNameInSpeech ───────────────────────
console.log('▶ Teste 6: pickFalas & ensureProductNameInSpeech');
const pick1 = pickFalas({
  category: 'CALCA',
  estica: false,
  body: 'Plus size',
  productName: 'Calça pantalona duna',
  fabric: 'duna',
});
assert(Boolean(pick1.selected), 'Deve retornar fala selecionada');
assert(pick1.candidates.length > 0, 'Deve retornar candidatas');

// Teste de Adaptação de Nome do Produto e Cores na Fala (Exemplos do Patch 4)
// Exemplo 1: Pijama
const copyBase1 = 'Amiga, eu peguei logo três: rosa, azul e preto! Olha o caimento dessa camisola. Ela fica soltinha no corpo e é uma delícia pra dormir. Escolhe a sua preferida no carrinho laranja aqui embaixo.';
const falaAdaptadaPijama = ensureProductNameInSpeech(
  copyBase1,
  'pijama',
  [{ name: 'Rosa' }, { name: 'Preto' }, { name: 'Bege' }]
);
assert(!falaAdaptadaPijama.toLowerCase().includes('camisola'), 'A fala adaptada NÃO pode conter a palavra camisola');
assert(falaAdaptadaPijama.toLowerCase().includes('pijama'), 'A fala adaptada DEVE conter a palavra pijama');
assert(falaAdaptadaPijama.includes('desse pijama'), 'Deve trocar dessa camisola por desse pijama');
assert(falaAdaptadaPijama.includes('Ele fica'), 'Deve trocar Ela fica por Ele fica para pijama');
assert(falaAdaptadaPijama.includes('soltinho no corpo'), 'Deve trocar soltinha por soltinho para pijama');
assert(falaAdaptadaPijama.includes('rosa, preto e bege'), 'Deve adaptar as 3 cores na fala');

// Exemplo 2: Calça flare
const copyBase2 = 'Essa bermuda está linda e super confortável. Se aparecer no carrinho laranja, aproveita!';
const falaAdaptadaCalca = ensureProductNameInSpeech(copyBase2, 'calça flare');
assert(falaAdaptadaCalca.includes('Essa calça flare está linda'), `Esperava 'Essa calça flare está linda', obteve '${falaAdaptadaCalca}'`);

// Exemplo 3: Short saia
const copyBase3 = 'Esse conjunto é maravilhoso, não aperta nada. Clica no link!';
const falaAdaptadaShortSaia = ensureProductNameInSpeech(copyBase3, 'short saia');
assert(falaAdaptadaShortSaia.includes('Esse short saia é maravilhoso'), `Esperava 'Esse short saia é maravilhoso', obteve '${falaAdaptadaShortSaia}'`);

// Exemplo 4: Gênero Homem (Concordância e vocativos 100% masculinos)
const copyBase4 = 'Amiga, eu peguei logo três, preta, azul e cinza. Olha o caimento dessa bermuda, ela é linda e confortável. Garante a sua no carrinho!';
const falaHomem = ensureProductNameInSpeech(
  copyBase4,
  'bermuda masculina',
  [{ name: 'Preta' }, { name: 'Azul' }, { name: 'Cinza' }],
  'Homem'
);
assert(!falaHomem.toLowerCase().includes('amiga'), 'Fala masculina NÃO pode conter amiga');
assert(falaHomem.toLowerCase().includes('amigo'), 'Fala masculina DEVE conter amigo');
assert(falaHomem.includes('garante o seu'), 'Fala masculina deve trocar garante a sua por garante o seu');
assert(falaHomem.includes('confortável e no estilo'), 'Fala masculina deve trocar linda e confortável');

console.log('  ✓ pickFalas e ensureProductNameInSpeech passaram com sucesso!');

// ─── TESTE 7: splitFala (2 partes padrão, 3 partes para longas) ───────────
console.log('▶ Teste 7: splitFala');
const falaF11 = FALAS.find((f) => f.id === 'F11')!.t;
const partsF11 = splitFala(falaF11, 250);
assert(partsF11.length === 2, `F11 deveria ter 2 partes, teve ${partsF11.length}`);
assert(partsF11[0] !== partsF11[1], 'Partes não podem ser iguais');

const falaF26 = FALAS.find((f) => f.id === 'F26')!.t;
const partsF26 = splitFala(falaF26, 200);
assert(partsF26.length === 3, `F26 deveria ter 3 partes para limite 200, teve ${partsF26.length}`);
console.log('  ✓ splitFala passou com sucesso!');

// ─── TESTE 8: Prompts de Imagem 1 (Child POV, Footwear, Senior, Slim) ──────
console.log('▶ Teste 8: buildAniaImage1Prompt');
// 8.1: Modo Infantil
const imgChild = buildAniaImage1Prompt({
  productName: 'Vestido infantil floral',
  category: 'VESTIDO',
  ageMode: 'child',
  gender: 'Mulher',
  body: 'Normal',
  colorName: 'Rosa',
  fabricDescription: 'algodão macio',
});
assert(imgChild.includes('PROIBIDO GERAR CRIANÇAS'), 'Deve proibir expressamente gerar crianças');
assert(imgChild.includes('mãos adultas'), 'Deve descrever mãos adultas em POV');

// 8.2: Modo Calçado
const imgFootwear = buildAniaImage1Prompt({
  productName: 'Tênis esportivo amortecimento',
  category: 'CALCADO',
  productMode: 'footwear',
  gender: 'Homem',
  body: 'Normal',
  colorName: 'Preto',
  fabricDescription: 'tecido respirável com solado emborrachado',
});
assert(imgFootwear.includes('do joelho para baixo'), 'Calçado deve ter enquadramento do joelho para baixo');
assert(imgFootwear.includes('foco total e nítido no calçado'), 'Calçado deve ter foco no calçado');

// 8.3: Modo Idoso
const imgSenior = buildAniaImage1Prompt({
  productName: 'Calça alfaiataria confortável',
  category: 'CALCA',
  ageMode: 'senior',
  gender: 'Mulher',
  body: 'Plus size',
  colorName: 'Cinza',
  fabricDescription: 'crepe encorpado',
});
assert(imgSenior.includes('senhora brasileira idosa de terceira idade'), 'Deve descrever senhora idosa');

// 8.4: Modo Magro
const imgSlim = buildAniaImage1Prompt({
  productName: 'Calça skinny',
  category: 'CALCA',
  ageMode: 'adult',
  gender: 'Mulher',
  body: 'Magro',
  colorName: 'Azul',
  fabricDescription: 'jeans com elastano',
});
assert(imgSlim.includes('porte magro/esguio'), 'Deve descrever porte magro');

console.log('  ✓ buildAniaImage1Prompt passou com sucesso!');

// ─── TESTE 9: buildAniaColorSwapPrompt (Derivação das Imagens 2 e 3) ─────────
console.log('▶ Teste 9: buildAniaColorSwapPrompt');
const swapPrompt2 = buildAniaColorSwapPrompt({
  productName: 'pijama',
  peca: 'pijama',
  colorName: 'Azul Marinho',
  imageSlot: 2,
  hasColorPhoto: true,
  productMode: 'apparel',
  ageMode: 'adult',
});
assert(swapPrompt2.includes('Use a PRIMEIRA imagem como base absoluta.'), 'Deve conter base absoluta');
assert(swapPrompt2.includes('Troque SOMENTE a peça principal (pijama) da pessoa pela peça/cor mostrada na SEGUNDA imagem de referência: Azul Marinho.'), 'Deve conter comando exato de troca de cor');
assert(swapPrompt2.includes('NÃO gere outra modelo.'), 'Deve proibir trocar de modelo');
assert(swapPrompt2.includes('Azul Marinho'), 'Deve conter o nome da cor');
assert(swapPrompt2.includes('Sem textos, logos ou marcas d\'água'), 'Deve proibir marcas d\'água');

const swapPrompt3 = buildAniaColorSwapPrompt({
  productName: 'tênis',
  peca: 'tênis',
  colorName: 'Branco com Rosa',
  imageSlot: 3,
  hasColorPhoto: true,
  productMode: 'footwear',
  ageMode: 'adult',
});
assert(swapPrompt3.includes('Use a PRIMEIRA imagem como base absoluta.'), 'Deve conter base absoluta no calçado');
assert(swapPrompt3.includes('Troque SOMENTE o calçado dos pés pelo calçado/cor mostrada na TERCEIRA imagem de referência: Branco com Rosa.'), 'Deve conter comando de calçado na imagem 3');
assert(swapPrompt3.includes('NÃO altere cenário, piso, pernas, pose ou iluminação.'), 'Deve preservar pernas e piso');
console.log('  ✓ buildAniaColorSwapPrompt passou com sucesso!');

// ─── TESTE 10: buildAniaVideoPrompt (Google Veo) ───────────────────────────
console.log('▶ Teste 10: buildAniaVideoPrompt');
const vidPrompt = buildAniaVideoPrompt({
  durationSeconds: 10,
  gender: 'Mulher',
  body: 'Plus size',
  category: 'CALCA',
  productMode: 'apparel',
  ageMode: 'adult',
  peca: 'calca',
  colorName: 'Bordô',
  fabricDescription: 'tecido duna',
  detalhes: 'cintura alta, 2 botões',
  bolsoFuncional: true,
  movimento: 'Começa de frente com corte no cós...',
  speechPart: 'Amiga, olha essa calça maravilhosa.',
});
assert(vidPrompt.includes('Duração: 10 segundos'), 'Duração deve ser 10 segundos');
assert(vidPrompt.includes('Amiga, olha essa calça maravilhosa.'), 'Deve conter a fala exata');
assert(vidPrompt.includes('NUNCA virar de costas'), 'Deve proibir virar de costas');
console.log('  ✓ buildAniaVideoPrompt passou com sucesso!');

// ─── TESTE 11: AI_PROFILES (OpenAI & Gemini Profiles) ──────────────────────
console.log('▶ Teste 11: AI_PROFILES');
import { AI_PROFILES } from '../src/config/aiProfiles';

assert(AI_PROFILES.openai.label === 'OpenAI', 'OpenAI label correta');
assert(AI_PROFILES.openai.brain.model === 'gpt-5.6-terra', 'Cérebro OpenAI gpt-5.6-terra');
assert(AI_PROFILES.openai.transcription.model === 'gpt-transcribe', 'Transcrição OpenAI gpt-transcribe');
assert(AI_PROFILES.openai.image.model === 'gpt-image-2.5-sunburst', 'Imagem OpenAI gpt-image-2.5-sunburst');
assert(AI_PROFILES.openai.fidelityAudit.model === 'gpt-5.6-luna', 'Auditoria OpenAI gpt-5.6-luna');

assert(AI_PROFILES.gemini.label === 'Gemini', 'Gemini label correta');
assert(AI_PROFILES.gemini.brain.model === 'gemini-3.8-flash', 'Cérebro Gemini gemini-3.8-flash');
assert(AI_PROFILES.gemini.transcription.model === 'gpt-transcribe', 'Transcrição Gemini mantém gpt-transcribe');
assert(AI_PROFILES.gemini.image.model === 'gemini-3.1-flash-image', 'Imagem Gemini gemini-3.1-flash-image');
assert(AI_PROFILES.gemini.fidelityAudit.model === 'gpt-5.6-luna', 'Auditoria Gemini mantém gpt-5.6-luna');
console.log('  ✓ AI_PROFILES passou com sucesso!\n');

console.log('🎉 TODOS OS TESTES UNITÁRIOS PASSARAM COM 100% DE SUCESSO! 🎉');
