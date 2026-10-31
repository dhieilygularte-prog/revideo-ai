import {
  AnaMariaFormState,
  AnaMariaInfluencer,
  AnaMariaBodyType,
  AnaMariaShoeCategory,
  AnaMariaVideoPromptLimit,
} from './types';

/**
 * Detecta a categoria de calçado conforme o produto e instruções adicionais
 */
export function detectShoeCategory(
  productName: string,
  additionalInstructions: string = ''
): { category: AnaMariaShoeCategory; description: string; name: string } {
  const combined = `${productName} ${additionalInstructions}`.toLowerCase();

  // A) Chinelo Branco - Roupas domésticas
  const isDomestic =
    /\b(ficar em casa|babydoll|baby doll|pijama|camisola|cinta|modeladora|abdominal|dormir|conforto casa|loungewear|roupa de casa)\b/i.test(
      combined
    );

  // B) Tênis Branco - Roupas fitness e esportivas ou calças
  const isFitness =
    /\b(fitness|academia|treino|gym|legging|calca|calça|macacao fitness|macacão fitness|macaquinho fitness|esportiv|suplex|poliamida fitness|anarruga fitness)\b/i.test(
      combined
    );

  if (isFitness) {
    return {
      category: 'B_TENIS',
      name: 'Tênis Branco Esportivo Casual',
      description:
        'Tênis feminino esportivo casual de cano baixo, inteiramente branco e com design robusto. Cabedal com painéis sobrepostos, costuras delicadas, biqueira arredondada com pequenas perfurações, cadarços brancos tradicionais, meia branca cano médio, língua acolchoada e colarinho estofado. Solado branco espesso, levemente elevado, com laterais em camadas e acabamento texturizado. Sem detalhes coloridos.',
    };
  }

  if (isDomestic) {
    return {
      category: 'A_CHINELO',
      name: 'Chinelo Branco Tradicional de Dedo',
      description:
        'Chinelo feminino tradicional de dedo, branco, com duas tiras finas em Y, acabamento levemente brilhante e pequenos detalhes metálicos dourados ou estrela dourada próximos à junção das tiras. Palmilha branca anatômica e levemente contornada. Solado baixo, plano, levemente espesso e com bordas arredondadas.',
    };
  }

  // C) Outras roupas - calçado compatível
  return {
    category: 'C_OUTRO',
    name: 'Calçado Compatível Discreto (Sandália Neutra / Chinelo Branco)',
    description:
      'Chinelo branco feminino delicado com detalhes metálicos ou sandália neutra discreta de salto baixo que combine perfeitamente com a finalidade da roupa.',
  };
}

export type AnaMariaRoomType = 'hall_espelho' | 'quarto' | 'sala' | 'closet';

export const SCENARIO_DESCRIPTIONS: Record<AnaMariaRoomType, string> = {
  hall_espelho:
    'Ambiente residencial autêntico diante do espelho de corpo inteiro no hall/corredor com banheiro integrado (fiel à foto de referência do cenário): no primeiro plano onde a modelo pisa, piso de porcelanato/cerâmica bege rajado com manchas marmorizadas em tons caramelo, areia e marrom suave brilhante. No lado esquerdo, porta de madeira maciça escura envernizada (tom mogno/nogueira com frisos horizontais em baixo relevo) com batente de madeira combinando e maçaneta reta tipo alavanca em aço inox/cromado escovado. No lado direito, parede com azulejos brancos lisos brilhantes, interruptor/espelho duplo vertical branco com teclas retangulares e estrutura de perfil de alumínio fosco com folha de vidro temperado transparente (box de banheiro). Ao fundo, vão de porta aberto revelando cômodo/corredor interno com piso bege claro fosco liso e parede neutra off-white/cinza claro sob iluminação indireta mais fraca. A iluminação natural clara frontal incide diretamente sobre a modelo, a roupa e o piso rajado da frente, enquanto o cômodo ao fundo permanece em suave penumbra acolhedora, garantindo contraste nítido e foco visual 100% absoluto no corpo da modelo e na peça anunciada.',
  quarto:
    'Quarto da mesma residência em frente ao espelho de corpo inteiro: ambiente limpo e aconchegante, piso de porcelanato bege claro, cabeceira de cama estofada neutra e porta de madeira escura visíveis discretamente ao fundo. Iluminação frontal natural suave que ilumina a frente da modelo com perfeição, enquanto o fundo do quarto permanece com iluminação indireta mais baixa e suave para que o foco fique total na modelo e na roupa. Espaço limpo e sem distrações.',
  sala:
    'Canto da sala de estar da mesma residência em frente ao espelho de corpo inteiro: piso de porcelanato bege rajado brilhante, parede neutra clara e porta/painel de madeira escura ao fundo. Iluminação frontal natural bem distribuída realçando a textura e o caimento da peça, com o fundo mais carente de iluminação, destacando a silhueta da modelo de forma nítida e natural.',
  closet:
    'Área de closet/quarto de vestir da mesma residência em frente ao espelho de corpo inteiro: armários com portas de madeira escura ao fundo, piso de porcelanato bege claro. Iluminação frontal direta e suave destacando o tecido e as curvas da modelo, com o fundo discreto e em penumbra suave, sem excesso de objetos.',
};

/**
 * Constrói o Prompt Mestre de Imagem para o Modo Ana Maria
 */
export function buildAnaMariaImagePrompt(
  form: AnaMariaFormState,
  scenarioRoom: AnaMariaRoomType = 'hall_espelho'
): {
  prompt: string;
  shoeCategory: AnaMariaShoeCategory;
  shoeDescription: string;
} {
  const shoeInfo = detectShoeCategory(form.productName, form.additionalInstructions);
  const isMale = form.influencer === 'Homem';
  const isPlusSize = form.bodyType === 'plus_size';

  // Descrição corporal com curvas hiper-acentuadas (atendendo ao feedback 3 e às fotos 4 e 9)
  const modelDescription = isMale
    ? `Homem brasileiro adulto, entre 25 e 35 anos, aparência natural e cotidiana. Pele morena-clara de subtom quente, com textura real e poros naturais. Corpo masculino ${
        isPlusSize ? 'plus size proporcional e forte' : 'atlético, ombros largos, cintura alinhada e pernas definidas'
      }. Cabelo castanho-escuro curto alinhado.`
    : `Mulher brasileira adulta, entre 25 e 35 anos, aparência natural e cotidiana. Pele morena-clara de subtom quente, com textura real de pele e poros naturais. Corpo feminino com CURVAS HIPER-ACENTUADAS E PRONUNCIADAS (silhueta violão marcante): cintura extremamente fina, estreita e desenhada, quadris visivelmente largos, proeminentes e bem arredondados, coxas grossas, torneadas e volumosas, e bumbum empinado e curvilíneo. A modelagem da roupa fica perfeitamente assentada ao corpo, valorizando intensamente a cintura fina e os quadris arredondados ${
        isPlusSize ? 'em proporção plus size voluptuosa e harmônica' : 'em formato violão escultural natural'
      }. Cabelos longos castanho-escuros levemente ondulados caindo sobre os ombros e costas.`;

  const phoneDescription = isMale
    ? 'O modelo segura um smartphone moderno com uma das mãos na altura do queixo/peito, simulando selfie diante do espelho de corpo inteiro. Unhas curtas e limpas.'
    : 'A modelo segura um smartphone moderno com capa rosa-clara com uma das mãos na altura do peito/queixo, simulando selfie espontânea diante do espelho de corpo inteiro. Unhas cuidadas com esmalte nude ou rosa-claro.';

  const accessoriesDescription = isMale
    ? 'Relógio de pulso masculino discreto com pulseira escura ou metálica. Aparência cotidiana e limpa.'
    : 'Colar dourado fino com pequeno pingente dourado no colo, pulseiras delicadas nos pulsos e anéis discretos. Aparência cotidiana elegante sem ostentação excessiva.';

  const additionalBlock =
    form.additionalInstructions && form.additionalInstructions.trim().length > 0
      ? `INSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${form.additionalInstructions.trim()}\n(Qualquer preferência acima sobrepõe detalhes padrão de modelo ou cenário)\n\n`
      : '';

  const scenarioText = SCENARIO_DESCRIPTIONS[scenarioRoom] || SCENARIO_DESCRIPTIONS.hall_espelho;

  const prompt = `${additionalBlock}Crie uma fotografia hiper-realista vertical 9:16 de ${
    isMale ? 'um homem brasileiro adulto' : 'uma mulher brasileira adulta com curvas acentuadas'
  } apresentando a roupa da imagem de referência, em uma selfie diante do espelho de corpo inteiro, reproduzindo fielmente o cenário residencial.

## 1. MODELO E SILHUETA CORPORAL
${modelDescription}
**REGRA OBRIGATÓRIA: ${isMale ? 'o modelo' : 'a modelo'} não pode ter NENHUMA tatuagem em qualquer parte do corpo (pele 100% limpa).**

## 2. ROSTO — CORTE OBRIGATÓRIO NO QUEIXO
Enquadrar a cabeça RIGOROSAMENTE DA ALTURA DA BASE DO QUEIXO PARA BAIXO. Olhos, sobrancelhas, testa, nariz e boca devem ficar COMPLETAMENTE FORA da imagem. Mostrar somente a base do queixo, o pescoço, o colo e todo o corpo para baixo. Nunca mostrar o rosto inteiro nem a boca. O corte deve parecer uma selfie espontânea natural tirada no espelho.

## 3. CENÁRIO E ILUMINAÇÃO
${scenarioText}
A parte da frente onde a modelo aparece deve ser iluminada de forma natural e clara, e o fundo do cômodo mais carente de iluminação (em penumbra suave) para que o foco visual fique integralmente na modelo e na roupa. Cenário residencial limpo e sem distrações.

## 4. CÂMERA E ENQUADRAMENTO
Fotografia vertical 9:16 de espelho de corpo inteiro. Perspectiva frontal, natural, sem distorção. Enquadrar da altura do queixo até os pés, mostrando a roupa integralmente dos ombros/colo até os dois pés com o calçado correto apoiado no piso. Não cortar a roupa, pernas ou pés.

## 5. CELULAR E POSTURA
${phoneDescription}
Postura em pé em frente ao espelho, peso apoiado principalmente em uma perna com leve projeção natural do quadril destacando a silhueta violão, braço livre relaxado ou tocando suavemente a lateral do corpo sem esconder a peça de roupa.

## 6. ACESSÓRIOS
${accessoriesDescription}

## 7. CALÇADO CONDICIONAL OBRIGATÓRIO
Calçado: ${shoeInfo.name}.
Detalhes: ${shoeInfo.description}
O mesmo calçado escolhido deve aparecer posicionado corretamente nos dois pés da modelo.

## 8. FIDELIDADE ABSOLUTA À ROUPA
A roupa da imagem de referência deve ser reproduzida exatamente 1:1: mesma cor, tonalidade, tecido, textura, costuras, decote, alças, comprimento e caimento justo moldando o corpo com curvas acentuadas.

RESULTADO: ${isMale ? 'brasileiro real' : 'brasileira real com curvas marcantes'} em selfie no espelho, corte estrito da altura do queixo para baixo, sem tatuagens, calçado correto e iluminação destacando a roupa.`;

  return {
    prompt: prompt.trim(),
    shoeCategory: shoeInfo.category,
    shoeDescription: shoeInfo.name,
  };
}

/**
 * Constrói o Prompt de Vídeo do Modo Ana Maria (Vitrine Estática 10s no Espelho)
 * Sem o título '🎥 PROMPT DE VÍDEO...' no texto (item 24)
 * Corte do queixo para baixo (item 2)
 */
export function buildAnaMariaVideoPrompt(params: {
  productName: string;
  influencer?: AnaMariaInfluencer;
  limit?: AnaMariaVideoPromptLimit;
  additionalInstructions?: string;
}): string {
  const isMale = params.influencer === 'Homem';
  const limit = params.limit || 'unlimited';
  const personWord = isMale ? 'O homem' : 'A mulher';
  const personObj = isMale ? 'ele' : 'ela';

  // Base integral limpa (sem o cabeçalho 🎥 PROMPT DE VÍDEO...)
  const fullPrompt = `Vídeo vertical 1080x1920, câmera totalmente estática presa em tripé ou apoiada, sem nenhum movimento de câmera, nenhum corte de cena, plano sequência único de 8 a 10 segundos.

REGRA OBRIGATÓRIA DE ENQUADRAMENTO: O enquadramento é estritamente do queixo para baixo, nunca mostrando os lábios, boca, olhos ou o rosto. Preservar o corte frontal natural da selfie no espelho.

${personWord} está em pé diante do espelho, parada no mesmo lugar em pose que valoriza as curvas da roupa, segurando o celular na altura do peito/queixo como se estivesse tirando uma selfie contínua.

Cronologia dos movimentos (10 segundos):
- 0 a 2 segundos: ${personWord} está parada em pose neutra, olhando para o próprio reflexo no espelho com postura elegante e natural destacando a cintura e os quadris.
- 2 a 4 segundos: ${personObj} leva lentamente a mão livre até a lateral do corpo ou até o tecido da roupa, tocando-o suavemente como se estivesse sentindo a textura ou ajustando o caimento da peça.
- 4 a 6 segundos: ${personObj} levanta levemente o braço livre até a altura do ombro ou da alça da roupa, com os dedos relaxados, mantendo o corpo com uma leve inclinação lateral sutil e confiante.
- 6 a 8 segundos: ${personObj} move a mesma mão até a cintura, apoiando-a suavemente, mantendo os ombros retos e o peso do corpo levemente deslocado para uma perna, criando uma pose natural e envolvente que valoriza a silhueta.
- 8 a 10 segundos: mantém a pose final harmônica diante do espelho, com respiração calma e caimento natural do tecido, finalizando o take de vitrine estática perfeitamente.

Detalhes visuais e continuidade:
Iluminação residencial constante com frente bem iluminada e fundo suavemente penumbroso, sem flicker. Nenhuma mudança de enquadramento, zoom ou corte — tudo acontece dentro do mesmo plano fixo mostrando ${personWord.toLowerCase()} da altura do queixo aos pés refletida no espelho. Movimentos lentos, fluidos e naturais, sem tremores.
ZERO TATUAGENS. Zero alterações na modelagem, cor, costuras ou detalhes da roupa apresentada.`;

  if (limit === 'unlimited') {
    return fullPrompt.trim();
  }

  if (limit === '5000') {
    if (fullPrompt.length <= 5000) return fullPrompt.trim();
    return fullPrompt.slice(0, 4980).trim();
  }

  // Até 2.500 caracteres
  const compact2500 = `Vídeo vertical 1080x1920, câmera estática sem cortes, plano sequência único de 10s diante do espelho.
REGRA INVIOLÁVEL: Corte estrito da altura do queixo para baixo, SEM MOSTRAR O ROSTO OU BOCA. ZERO TATUAGENS.
${personWord} segura smartphone na selfie no espelho apresentando a roupa colada ao corpo com curvas acentuadas.
- 0-2s: Pose neutra parada diante do espelho, postura alinhada destacando cintura e quadris.
- 2-4s: Leva a mão livre até a lateral da roupa, tocando suavemente o tecido para demonstrar caimento e textura.
- 4-6s: Levanta a mão livre até a alça/ombro com dedos relaxados, leve inclinação do corpo.
- 6-8s: Apoia a mão na cintura com peso deslocado para uma perna em pose harmônica que valoriza a silhueta.
- 8-10s: Pose final estável, respiração natural, luz frontal suave destacando a peça.
Câmera estática no espelho, sem zoom, iluminação residencial estável sem flicker, movimentos lentos e fluidos, fidelidade 100% à roupa.`.trim();

  return compact2500.slice(0, 2500).trim();
}
