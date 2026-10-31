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
        'Tênis feminino esportivo casual de cano baixo, inteiramente branco e com design robusto. Cabedal com painéis sobrepostos, costuras delicadas, biqueira arredondada com pequenas perfurações, cadarços brancos tradicionais, língua acolchoada e colarinho estofado. Símbolo curvo branco em relevo nas laterais, tom sobre tom. Solado branco espesso, levemente elevado, com laterais em camadas e acabamento texturizado. Sem detalhes coloridos.',
    };
  }

  if (isDomestic) {
    return {
      category: 'A_CHINELO',
      name: 'Chinelo Branco Tradicional de Dedo',
      description:
        'Chinelo feminino tradicional de dedo, branco, com duas tiras finas em Y, acabamento levemente brilhante e pequenos detalhes metálicos dourados próximos à junção. Palmilha branca anatômica e levemente contornada. Solado baixo, plano, levemente espesso e com bordas arredondadas.',
    };
  }

  // C) Outras roupas - calçado compatível
  return {
    category: 'C_OUTRO',
    name: 'Calçado Compatível Discreto (Sandália Neutra / Tênis Casual)',
    description:
      'Sandália feminina neutra e discreta ou tênis casual branco minimalista compatível com o estilo da roupa, elegante e refinado, sem chamar atenção excessiva.',
  };
}

/**
 * Constrói o Prompt Mestre de Imagem para o Modo Ana Maria (SeaDream 5.0 Pro / Kling / OpenAI)
 */
export function buildAnaMariaImagePrompt(form: AnaMariaFormState): {
  prompt: string;
  shoeCategory: AnaMariaShoeCategory;
  shoeDescription: string;
} {
  const shoeInfo = detectShoeCategory(form.productName, form.additionalInstructions);
  const isMale = form.influencer === 'Homem';
  const isPlusSize = form.bodyType === 'plus_size';

  const modelDescription = isMale
    ? `Homem brasileiro adulto, entre 25 e 35 anos, aparência natural e cotidiana. Pele morena-clara de subtom quente, com textura real e poros naturais. Corpo masculino ${
        isPlusSize ? 'plus size, proporcional e robusto' : 'natural, porte normal e proporcional'
      }. Cabelo castanho-escuro curto, corte alinhado e natural.`
    : `Mulher brasileira adulta, entre 25 e 35 anos, aparência natural e cotidiana. Pele morena-clara de subtom quente, com textura real e poros naturais. Corpo feminino ${
        isPlusSize
          ? 'plus size curvilíneo, cintura marcada, quadris arredondados e coxas volumosas'
          : 'curvilíneo e proporcional, cintura marcada, quadris arredondados e coxas volumosas'
      }. Cabelos longos castanho-escuros, levemente ondulados.`;

  const phoneDescription = isMale
    ? 'O modelo segura um smartphone moderno com capa escura ou neutra, na altura do rosto, usando uma das mãos. O aparelho encobre parte da região superior da face. Unhas curtas e limpas.'
    : 'A modelo segura um smartphone moderno com capa rosa-clara, na altura do rosto, usando uma das mãos. O aparelho encobre parte da região superior da face. Unhas cuidadas com esmalte nude ou rosa-claro.';

  const accessoriesDescription = isMale
    ? 'Relógio de pulso masculino discreto com pulseira escura ou metálica. Aparência cotidiana, sem ostentação.'
    : 'Colar dourado fino com pequeno pingente, pulseira discreta, dois ou três anéis delicados e pequenos brincos, se visíveis. Aparência cotidiana, sem luxo exagerado. Normalmente utilizar pulseiras nos dois pulsos e um ou mais colares.';

  const additionalBlock = form.additionalInstructions && form.additionalInstructions.trim().length > 0
    ? `🚨 INSTRUÇÕES ADICIONAIS DO USUÁRIO COM PRIORIDADE MÁXIMA ABSOLUTA:\n${form.additionalInstructions.trim()}\n(Qualquer preferência acima sobrepõe as diretrizes padrão de cenário, modelo ou iluminação)\n\n`
    : '';

  const prompt = `${additionalBlock}Crie uma fotografia hiper-realista vertical 9:16 de ${
    isMale ? 'um homem brasileiro adulto' : 'uma mulher brasileira adulta'
  } apresentando a roupa da imagem de referência, em uma selfie diante do espelho, utilizando obrigatoriamente o cenário da outra imagem de referência.

## 1. MODELO
${modelDescription}
**REGRA OBRIGATÓRIA: ${isMale ? 'o modelo' : 'a modelo'} não pode ter nenhuma tatuagem em qualquer parte do corpo.**

## 2. ROSTO — CORTE OBRIGATÓRIO
Enquadrar a cabeça de modo que apareça somente da altura do nariz para baixo: base do nariz, boca, lábios, queixo e, no máximo, parte inferior das bochechas. Olhos, sobrancelhas, testa e parte superior do nariz devem ficar completamente fora da imagem. Não mostrar o rosto inteiro. O corte deve parecer natural.

## 3. CENÁRIO — REFERÊNCIA OBRIGATÓRIA
Reproduzir fielmente o ambiente da imagem de cenário: portas e batentes de madeira escura, paredes com revestimento claro, interruptor, porta de vidro à direita e piso de porcelanato marmorizado bege. Preservar arquitetura, proporções, perspectiva, iluminação e disposição dos elementos. Não acrescentar móveis ou objetos nem modificar o ambiente.

## 4. CÂMERA E ENQUADRAMENTO
Fotografia vertical 9:16, simulando selfie espontânea de smartphone diante de espelho de corpo inteiro. Perspectiva frontal, natural, sem distorção de grande-angular. Enquadrar da altura do nariz até os pés, mostrando a roupa integralmente e os dois pés com o calçado selecionado conforme a categoria da roupa. ${
    isMale ? 'O modelo' : 'A modelo'
  } deve ocupar aproximadamente 75% a 85% da altura da imagem. Não cortar a roupa, pernas ou pés.

## 5. CELULAR E POSTURA
${phoneDescription}
Postura em pé, de frente para o espelho, com leve rotação natural do quadril e peso apoiado principalmente em uma perna. A outra pode ficar ligeiramente à frente. Braço livre relaxado ao lado do corpo ou tocando suavemente a cintura, sem esconder a roupa.

## 6. ACESSÓRIOS
${accessoriesDescription}

## 7. CALÇADO — ESCOLHA CONDICIONAL OBRIGATÓRIA
Calçado selecionado para esta peça: ${shoeInfo.name}.
Modelo detalhado: ${shoeInfo.description}
REGRA DE PRIORIDADE ABSOLUTA: A finalidade da roupa determina o calçado. O mesmo calçado escolhido deve aparecer nos dois pés, perfeitamente alinhado no piso.

## 8. FIDELIDADE ABSOLUTA À ROUPA
A imagem da roupa é a referência soberana. Reproduzir exatamente a peça, preservando cor, tonalidade, modelagem, estrutura, comprimento, proporções, tecido, textura, decote, mangas, costuras, recortes, acabamentos e caimento.
Não redesenhar, estilizar, simplificar, substituir ou acrescentar detalhes. Não alterar cor, transparência, decote ou comprimento. Adaptar o corpo à roupa, nunca modificar a roupa para adaptá-la ao corpo.

## 9. REALISMO FINAL
A imagem deve parecer uma fotografia autêntica de smartphone, com iluminação residencial coerente, pele natural, cabelos detalhados, mãos e pés anatomicamente corretos e dobras de tecido realistas.
Evitar aparência artificial, pele plastificada, anatomia deformada, retoques excessivos ou iluminação de estúdio.

RESULTADO: ${isMale ? 'um brasileiro real' : 'uma brasileira real'} apresentando a roupa em uma selfie de espelho, no cenário fornecido, com acessórios discretos, sem tatuagens, rosto cortado obrigatoriamente na altura do nariz e calçado escolhido automaticamente conforme a categoria e a finalidade da roupa.`;

  return {
    prompt: prompt.trim(),
    shoeCategory: shoeInfo.category,
    shoeDescription: shoeInfo.name,
  };
}

/**
 * Constrói o Prompt de Vídeo do Modo Ana Maria (Vitrine Estática 10s no Espelho)
 * Respeita a limitação de caracteres solicitada:
 * - 'unlimited': texto integral mestre (Kling 3.0 Omni / Veo / OmniFlash)
 * - '5000': ajustado até 5.000 caracteres com espaço (Pixverse)
 * - '2500': ajustado até 2.500 caracteres com espaço (Hailuo)
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

  // Base integral do Prompt A — Vitrine Estática
  const fullPrompt = `🎥 PROMPT DE VÍDEO — "Vitrine Estática" (Selfie no Espelho · 10 Segundos)
Vídeo vertical 1080x1920, câmera totalmente estática presa em tripé ou apoiada, sem nenhum movimento de câmera, nenhum corte de cena, plano sequência único de 8 a 10 segundos.

REGRA OBRIGATÓRIA DE ENQUADRAMENTO: O enquadramento é estritamente do lábio inferior ou queixo para baixo, nunca mostrando os olhos ou o rosto inteiro. Preservar o corte frontal natural da selfie no espelho.

${personWord} está em pé, parada quase no mesmo lugar em frente ao espelho, segurando o celular com uma mão na altura do rosto como se estivesse tirando uma selfie contínua.

Cronologia dos movimentos (10 segundos):
- 0 a 2 segundos: ${personWord} está parada em pose neutra, olhando para o próprio reflexo no espelho com postura elegante e natural.
- 2 a 4 segundos: ${personObj} leva lentamente a mão livre até a lateral do corpo ou até o tecido da roupa, tocando-o suavemente como se estivesse sentindo a textura ou ajustando o caimento da peça.
- 4 a 6 segundos: ${personObj} levanta levemente o braço livre até a altura do ombro ou da alça da roupa, com os dedos relaxados, mantendo o corpo com uma leve inclinação lateral sutil e confiante.
- 6 a 8 segundos: ${personObj} move a mesma mão até a cintura, apoiando-a suavemente, mantendo os ombros retos e o peso do corpo levemente deslocado para uma perna, criando uma pose natural e envolvente sem exageros.
- 8 a 10 segundos: mantém a pose final harmônica, com respiração calma e respiração sutil do tecido, finalizando o take de vitrine estática perfeitamente.

Detalhes visuais e continuidade:
O cabelo balança muito sutilmente com a respiração e o movimento dos braços, mas não há giro brusco do corpo nem deslocamento dos pés no chão. A expressão evolui de neutra para um sorriso sutil e genuíno ao longo do vídeo. A iluminação residencial no ambiente permanece rigorosamente constante, sem flicker nem mudanças bruscas de luz. Nenhuma mudança de enquadramento, zoom ou corte — tudo acontece dentro do mesmo plano médio fixo mostrando ${personWord.toLowerCase()} da altura do queixo aos pés refletida no espelho. Movimentos lentos, fluidos e naturais, sem tremores bruscos, mantendo o realismo fotográfico de vídeo gravado com smartphone em modo retrato vertical.
ZERO TATUAGENS. Zero alterações na modelagem, cor, costuras ou detalhes da roupa apresentada.`;

  if (limit === 'unlimited') {
    return fullPrompt;
  }

  if (limit === '5000') {
    // Para Pixverse (até 5.000 caracteres)
    if (fullPrompt.length <= 5000) return fullPrompt;
    return fullPrompt.slice(0, 4980).trim();
  }

  // Para Hailuo (até 2.500 caracteres)
  const compact2500 = `Vídeo vertical 1080x1920, câmera estática sem cortes, plano sequência único de 10s diante do espelho.
REGRA INVIOLÁVEL: Corte estrito do lábio inferior/queixo para baixo, SEM MOSTRAR O ROSTO. ZERO TATUAGENS.
${personWord} segura smartphone na altura do rosto em selfie no espelho apresentando a roupa.
- 0-2s: Pose neutra parada olhando o reflexo no espelho, postura alinhada.
- 2-4s: Leva a mão livre até a lateral da roupa, tocando suavemente o tecido para demonstrar caimento e textura.
- 4-6s: Levanta a mão livre até o ombro/alça com dedos relaxados, leve inclinação do corpo.
- 6-8s: Apoia a mão na cintura com peso deslocado para uma perna em pose natural e harmônica.
- 8-10s: Pose final estável, respiração natural, sorriso sutil.
Câmera estática no espelho, sem zoom, iluminação residencial estável sem flicker, movimentos lentos e fluidos, fidelidade 100% à roupa.`.trim();

  return compact2500.slice(0, 2500).trim();
}
