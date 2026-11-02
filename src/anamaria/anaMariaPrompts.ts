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
    'Ambiente residencial autêntico diante do espelho de corpo inteiro no hall/corredor com banheiro integrado (UTILIZAR EXATAMENTE A FOTO DE REFERÊNCIA DO CENÁRIO ANEXADA): A foto de referência do cenário é o ambiente real obrigatório e inviolável. No primeiro plano onde a modelo pisa, reproduza exatamente o mesmo piso de porcelanato/cerâmica bege rajado com manchas marmorizadas brilhantes da foto de referência. No lado esquerdo, a mesma porta de madeira escura com frisos horizontais em baixo relevo, batente escuro e maçaneta reta de inox da foto. No lado direito, a mesma parede com azulejos claros, interruptor duplo branco e perfil com folha de vidro da foto. Ao fundo, o mesmo vão aberto revelando o corredor interno sob iluminação suave. Posicione a modelo em pé EXATAMENTE neste cenário da foto anexada. É expressamente proibido criar outro cômodo ou alterar a arquitetura, o piso e as portas da foto de referência.',
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

  // Descrição corporal com curvas hiper-acentuadas ou Plus Size autêntico (manequim 48-52)
  const modelDescription = isMale
    ? isPlusSize
      ? 'Homem brasileiro adulto PLUS SIZE REAL (manequim 50 a 54 / XXL, porte físico grande, encorpado, forte e pesado). Pele morena-clara de subtom quente, com textura real e poros naturais. Cabelo castanho-escuro curto alinhado.'
      : 'Homem brasileiro adulto, entre 25 e 35 anos, aparência natural e cotidiana. Pele morena-clara de subtom quente, com textura real e poros naturais. Corpo masculino atlético, ombros largos, cintura alinhada e pernas definidas. Cabelo castanho-escuro curto alinhado.'
    : isPlusSize
      ? `Mulher brasileira adulta PLUS SIZE REAL E AUTÊNTICA (manequim 48 a 52 / US 16-18, corpo plus size encorpado, voluptuoso, carnudo e curvilíneo):
- Silhueta plus size real com volume e peso naturais, exatamente como em modelos plus size autênticas de moda feminina.
- Coxas bem grossas, carnudas, cheias e fartas; quadris visivelmente largos, proeminentes e bem arredondados.
- Cintura curvilínea suave proporcional a uma mulher plus size real (TERMINANTEMENTE PROIBIDO cintura fina ou estreita de modelo magra; abdômen suavemente arredondado, macio e natural, sem barriga chapada ou atlética).
- Busto volumoso e colo farto com decote natural bem preenchido.
- Braços cheios, carnudos e naturais (sem magreza).
- Pele morena-clara de subtom quente com textura real de pele, viço natural e poros visíveis, sem imperfeições pesadas. Cabelos longos castanho-escuros caindo sobre os ombros.
- A peça de roupa assenta perfeitamente justa no corpo plus size, valorizando as curvas cheias e o volume encorpado exatamente como em modelos plus size reais.`
      : `Mulher brasileira adulta, entre 25 e 35 anos, aparência natural e cotidiana. Pele morena-clara de subtom quente, com textura real de pele e poros naturais. Corpo feminino com CURVAS HIPER-ACENTUADAS E PRONUNCIADAS (silhueta violão marcante): cintura fina, estreita e desenhada, quadris visivelmente largos, proeminentes e bem arredondados, coxas grossas, torneadas e volumosas, e bumbum empinado e curvilíneo em formato violão escultural natural. Cabelos longos castanho-escuros levemente ondulados caindo sobre os ombros e costas.`;

  const phoneDescription = isMale
    ? 'O modelo segura um smartphone moderno com uma das mãos na altura do queixo/peito, simulando selfie diante do espelho de corpo inteiro. Unhas curtas e limpas.'
    : 'A modelo segura um smartphone moderno com capa rosa-clara com uma das mãos na altura do peito/queixo, simulando selfie espontânea diante do espelho de corpo inteiro. Unhas cuidadas com esmalte nude ou rosa-claro.';

  const accessoriesDescription = isMale
    ? 'Relógio de pulso masculino discreto com pulseira escura ou metálica. Aparência cotidiana e limpa. Zero tatuagens.'
    : `**WOMEN'S MODEL — FIXED SIGNATURE JEWELRY (APLICADO EXCLUSIVAMENTE PARA MODELO FEMININA)**:
A modelo feminina deve usar OBRIGATORIAMENTE o seguinte conjunto de jóias fixas em todas as imagens geradas:

1. TRÊS COLARES DOURADOS EM CAMADAS (EXACTLY THREE LAYERED GOLD NECKLACES):
- 1º colar: Choker de corrente dourada bem fina e delicada, rente à base do pescoço, sem pingente visível.
- 2º colar: Corrente dourada fina um pouco mais longa, com pequenos detalhes decorativos pendentes distribuídos na parte frontal.
- 3º colar: Corrente dourada delicada mais longa com um pequeno pingente medalhão oval dourado.
Os três colares devem ser usados juntos no colo, com espaçamento natural, delicados e sobrepostos.

2. PULSEIRAS DOURADAS — UMA EM CADA PULSO (BRACELETS — ONE ON EACH WRIST):
- Exatamente uma pulseira de corrente dourada fina e delicada em CADA pulso.
- Elo metálico muito fino e leve, com pequeno fecho e uma correntinha extensora pendurada delicadamente para baixo seguindo a gravidade.
- Visual de jóia cotidiana delicada e realista (não usar braceletes grossos ou algemas rígidas).

3. ANÉIS PRATEADOS — EXATAMENTE TRÊS ANÉIS (THREE DELICATE SILVER-TONE RINGS):
- 1 anel prateado ligeiramente mais largo com pequeno detalhe central decorativo brilhante na mão livre.
- 1 anel prateado fino e liso na mão que segura o smartphone.
- 1 anel prateado delicado com pequenas pedrinhas brilhantes também na mão que segura o smartphone.

4. CORES E MATERIAIS DAS JÓIAS:
- Colares e pulseiras: metal dourado fino e delicado.
- Anéis: metal prateado com brilho realista.

5. CONSISTÊNCIA PERMANENTE DE JÓIAS (ALTA PRIORIDADE):
Conjunto permanente da identidade visual da modelo feminina. Jamais remova, substitua ou adicione brincos grandes, colares grossos, relógio feminino ou jóias pesadas.`;

  const additionalBlock =
    form.additionalInstructions && form.additionalInstructions.trim().length > 0
      ? `INSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${form.additionalInstructions.trim()}\n(Qualquer preferência acima sobrepõe detalhes padrão de modelo ou cenário)\n\n`
      : '';

  const hasSelectedScenario = Boolean(form.selectedScenarioId);
  const scenarioTitle = form.selectedScenarioNumber ? `Cenário ${form.selectedScenarioNumber}` : 'cenário selecionado';

  const promptIntro = hasSelectedScenario
    ? `Crie uma fotografia hiper-realista vertical 9:16 de ${
        isMale
          ? (isPlusSize ? 'um homem brasileiro adulto PLUS SIZE (porte grande, manequim 50-54)' : 'um homem brasileiro adulto')
          : (isPlusSize ? 'uma mulher brasileira adulta autêntica PLUS SIZE (corpo voluptuoso e encorpado, coxas grossas, quadris largos, manequim 48 a 52)' : 'uma mulher brasileira adulta com curvas acentuadas')
      } apresentando a roupa da imagem de referência, inserida de forma natural e integrada na fotografia do ${scenarioTitle} anexada, em uma selfie diante do espelho de corpo inteiro.`
    : `Crie uma fotografia hiper-realista vertical 9:16 de ${
        isMale
          ? (isPlusSize ? 'um homem brasileiro adulto PLUS SIZE (porte grande, manequim 50-54)' : 'um homem brasileiro adulto')
          : (isPlusSize ? 'uma mulher brasileira adulta autêntica PLUS SIZE (corpo voluptuoso e encorpado, coxas grossas, quadris largos, manequim 48 a 52)' : 'uma mulher brasileira adulta com curvas acentuadas')
      } apresentando a roupa da imagem de referência, em uma selfie diante do espelho de corpo inteiro, reproduzindo fielmente o cenário residencial.`;

  const scenarioSection = hasSelectedScenario
    ? `## 3. PRESERVAÇÃO INTEGRAL DO CENÁRIO ANEXADO (${scenarioTitle.toUpperCase()})
A foto de cenário anexada é a autoridade visual absoluta do ambiente.
Preserve integralmente e sem modificações todo o cômodo da foto de referência: piso, paredes, iluminação, reflexos, portas, espelho e elementos arquitetônicos.
NÃO redesenhe, NÃO altere e NÃO gere um ambiente diferente. Insira a modelo perfeitamente integrada e em pé diante do espelho dentro deste exato cômodo real.`
    : `## 3. CENÁRIO REAL FIXO E ILUMINAÇÃO (BASE NA FOTO ANEXADA)
${scenarioText}
A parte da frente onde a modelo aparece deve ser iluminada de forma natural e clara, e o fundo do cômodo mais carente de iluminação (em penumbra suave) para que o foco visual fique integralmente na modelo e na roupa. Cenário residencial limpo e sem distrações.`;

  const prompt = `${additionalBlock}${promptIntro}

## 1. MODELO E SILHUETA CORPORAL
${modelDescription}
${isPlusSize ? '**REGRA OBRIGATÓRIA DE PLUS SIZE: O corpo DEVE ser verdadeiramente PLUS SIZE (manequim 48 a 52 / US 16-18), com coxas grossas e carnudas, quadris bem largos e curvas naturais de mulher plus size real (TERMINANTEMENTE PROIBIDO gerar modelo magra, PROIBIDO cintura fina ou estreita de passarela, PROIBIDO barriga chapada/seca). O corpo deve ter volume, peso e curvas generosas e fartas.**\n' : ''}**REGRA OBRIGATÓRIA: ${isMale ? 'o modelo' : 'a modelo'} não pode ter NENHUMA tatuagem em qualquer parte do corpo (pele 100% limpa).**

## 2. ROSTO — CORTE OBRIGATÓRIO ESTRITO NO QUEIXO (SEM LÁBIOS E SEM NARIZ)
Enquadrar a cabeça RIGOROSAMENTE DA ALTURA DA BASE DO QUEIXO PARA BAIXO.
É TERMINANTEMENTE PROIBIDO MOSTRAR LÁBIOS, BOCA, NARIZ OU OLHOS EM QUALQUER MOMENTO OU PARTE DO ENQUADRAMENTO.
Os lábios, a boca, o nariz e os olhos devem ficar 100% FORA da imagem em todas as circunstâncias. Mostrar somente a ponta inferior do queixo, o pescoço, o colo e todo o corpo para baixo. Nunca mostrar o rosto inteiro, nunca mostrar a boca e nunca mostrar o nariz. O corte deve parecer uma selfie espontânea natural tirada no espelho com corte exato no queixo.

${scenarioSection}

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

RESULTADO: ${isMale ? (isPlusSize ? 'brasileiro real plus size (manequim 50-54)' : 'brasileiro real') : (isPlusSize ? 'brasileira real autêntica plus size (manequim 48 a 52, corpo voluptuoso e encorpado)' : 'brasileira real com curvas marcantes')} em selfie no espelho, corte estrito da altura do queixo para baixo, sem tatuagens, calçado correto e iluminação destacando a roupa.`;

  return {
    prompt: prompt.trim(),
    shoeCategory: shoeInfo.category,
    shoeDescription: shoeInfo.name,
  };
}

/**
 * Prompt Mestre de Movimentos Padrão do Modo Ana Maria
 * Nome: "Vencedor by GPT" (Choreografia exata de 10 segundos no espelho)
 */
export const VENCEDOR_BY_GPT_PROMPT = `Create a 10-second ultra-photorealistic vertical 9:16 mirror-selfie fashion video. Use the attached reference image as the absolute visual starting point.

The animation must reproduce the following exact sequence of movements in one continuous, natural recording.

**IDENTITY AND PRODUCT PRESERVATION**

Preserve exactly the same woman, body shape, proportions, skin, hair, clothing, garment color, neckline, fabric, seams, texture, accessories, smartphone, mirror, room and lighting from the reference image.

FEMALE MODEL SIGNATURE JEWELRY:
The female model consistently wears three layered gold necklaces (choker, medium dangling chain, long chain with small oval gold medallion), two delicate gold chain bracelets with dangling extenders (one on each wrist), and three delicate silver-tone rings.

Do not redesign, modify, replace or reinterpret any part of the clothing or accessories. The garment must remain identical throughout the entire video.

**FACE AND CAMERA FRAMING (STRICT CHIN-DOWN & ANTI-UPWARD TILT LOCK)**

The camera framing is strictly and permanently from the bottom base of the chin downward throughout all 10 seconds.
NEVER reveal the woman's face, lips, mouth, or nose at any point or frame in this video.
The lips, mouth, nose, eyes and upper face MUST REMAIN 100% OUT OF FRAME throughout the entire 10-second recording.

CRITICAL CAMERA HEIGHT LOCK & ANTI-LIP PROHIBITION:
- The camera must remain anchored at mid-chest/torso level. It must NEVER tilt upward, pan upward, or drift up above the base of the chin at any point, especially during the 8.5–10 second profile rotation or the end of the video.
- STRICTLY FORBIDDEN: Any visible lips, swollen or puffy lips, cosmetic botox-style lips, mouth, or facial features.
- The lower edge of the chin is the absolute hard ceiling of the camera frame.
Only the base of the chin, neck, collarbone, torso, hips, and legs are visible.
She holds the smartphone in one hand throughout the entire recording. The phone remains in front of the mirror, maintaining the original mirror-selfie composition.

**EXACT MOVEMENT CHOREOGRAPHY**

0–1 SECOND:
The woman starts standing naturally in front of the mirror, holding her phone with one hand. Her free arm hangs relaxed beside her body.

1–2 SECONDS:
She slowly raises her free hand toward her chest and gently places her fingers on the upper bust area, making natural contact with the fabric.

2–4 SECONDS:
She slowly slides her open palm down across the front of the dress, moving from the bust toward the abdomen and waist. Her hand continues downward toward the hip and upper thigh, following the body's natural contours.

4–5 SECONDS:
She continues the gentle downward movement, briefly touching the lower abdomen and hip area, demonstrating how the dress fits against the body.

5–7.5 SECONDS:
She brings her free hand back toward the side of her waist, pinches a small section of the dress fabric between her fingers and gently pulls the material outward several times in short, subtle movements, demonstrating the fabric's elasticity and fitted construction. She releases the fabric naturally.

7.5–8.5 SECONDS:
She moves her free arm outward and slightly away from her body while beginning to shift her weight and reposition her feet.

8.5–10 SECONDS:
She gradually rotates her torso and hips into a three-quarter side profile, turning approximately 70–90 degrees relative to her original frontal position.
CAMERA LOCK: The camera remains strictly at mid-chest level and MUST NOT tilt upward during or after the rotation. The framing remains anchored strictly below the chin (never showing lips, mouth or botox-style lips).
She keeps holding the smartphone and maintains the mirror-selfie posture. Her final position clearly displays the side silhouette, waist, hips and rear fit of the garment. She does not turn completely away from the mirror.

**BODY LANGUAGE AND NATURALISM**

All movements must look like a real woman casually recording a fashion demonstration in front of a mirror.

Maintain realistic body mechanics, natural hand articulation, subtle weight transfers and believable fabric movement.

The woman must not make exaggerated gestures, dance, walk away, or perform additional movements not specified in the choreography.

**CAMERA AND VISUAL STYLE**

Maintain a realistic smartphone mirror recording, with stable framing and only very subtle natural handheld movement.

Strict chin-down framing: Absolutely NO visible face, NO lips, NO mouth, NO nose, and NO eyes in any frame.

No cinematic camera movements, no zooms, no cuts, no transitions and no changes in the environment.

The entire sequence must happen in one uninterrupted take.

No visible face, no speech, no subtitles, no captions, no added graphics, no logos or watermarks.

**FINAL PRIORITY:**
Strict no-face rule: The camera framing is strictly from the base of the chin down. Under NO circumstances should the lips, mouth, nose, or eyes appear in any frame of the video. Reproduce the exact movement sequence and timing described above while preserving the original reference image. The woman's movements must be natural, fluid and realistic. The clothing must remain visually identical to the reference image in every frame.`;

/**
 * Prompt Mestre de Movimentos Padrão quando o usuário seleciona um cenário da vitrine
 * Nome: "Vencedor by GPT - Cenário Selecionado"
 */
export const VENCEDOR_BY_GPT_SCENARIO_PROMPT = `Create a 10-second ultra-photorealistic vertical 9:16 fashion mirror-selfie video.

**1. SCENARIO INSERTION**

Insert the generated model into the scenario selected and provided by the user.

Use the selected scenario image as the absolute reference. Preserve its original appearance and composition. Do not recreate, redesign, replace, modify or generate a different environment. Only insert the model naturally into the selected scenario, maintaining realistic scale, positioning, perspective and visual integration.

**2. MODEL CREATION — DEFAULT APPEARANCE**

When no alternative physical characteristics are specified by the user, create an ultra-photorealistic Brazilian woman, approximately 25–35 years old, with:

- Light warm tan skin tone.
- Naturally curvy, proportional and realistic body.
- Long, dark brown, naturally wavy hair.
- Realistic skin texture, natural body proportions and anatomically correct features.
- Natural, elegant and believable physical appearance.
- No tattoos anywhere on the body.
- No artificial-looking skin, excessive retouching or exaggerated body proportions.

The model must look like a real Brazilian woman, not a CGI character or artificial mannequin.

**USER-DEFINED MODEL CHARACTERISTICS:**

If the user specifies different characteristics, those instructions take priority over the default appearance described above.

Respect all selected characteristics, including:
- Gender: male or female.
- Body type: slim, average, athletic, curvy, plus-size or any other specified type.
- Age range, when specified.
- Skin tone.
- Hair color, length and hairstyle.
- Other physical characteristics requested by the user.

Never ignore or override the user's selections.

**3. CLOTHING AND ACCESSORIES**

The attached product image is the absolute reference for the clothing worn by the model.

The model must wear the exact product provided as reference.

Preserve the original garment with maximum fidelity:
- Exact color, saturation and color temperature.
- Exact design, cut, modeling and fit.
- Original neckline, sleeves and length.
- Fabric texture, thickness and appearance.
- Seams, stitching, buttons, prints and every visible detail.
- Original proportions and construction.

Never redesign, beautify, modify, simplify or reinterpret the product.

Accessories must remain natural and consistent with the visual references. Preserve any accessories explicitly shown or requested by the user. Do not invent additional accessories.

**WOMEN'S MODEL — FIXED SIGNATURE JEWELRY (APPLY ONLY TO FEMALE MODELS)**:
The female model consistently wears the following signature jewelry set:
- Three layered gold necklaces (delicate choker close to neck base, medium chain with tiny dangling details, long chain with small oval gold medallion).
- Two delicate gold chain bracelets (one on each wrist, with delicate dangling extender chain hanging naturally).
- Three delicate silver-tone rings (one wider ring with central detail on free hand, one smooth thin band on phone hand, one with sparkling stones on phone hand).
- No large earrings, chunky necklaces, thick bracelets, oversized rings or watches on female model.

The model must have no tattoos.

The garment must remain visually identical throughout the entire animation, even when touched, stretched or moved.

**4. FACE AND CAMERA FRAMING (STRICT CAMERA HEIGHT LOCK & ANTI-LIP PROHIBITION)**

The model's face must NEVER be visible at any moment.

Maintain framing strictly from below the chin or neck down throughout the entire 10-second video.

Do not show the mouth, lips, nose, eyes or any part of the face.

CAMERA ANCHOR & ANTI-UPWARD TILT MANDATE:
- The camera framing is strictly locked at chest level and must NEVER tilt upward, pan upward, or drift above the lower chin at any point, especially during the 8.5–10 second profile rotation or the end of the video.
- Strictly forbidden: Any visible lips, swollen or puffy lips, cosmetic botox-style lip appearance, mouth, or facial features.
- The lower edge of the chin is the absolute hard ceiling of the camera frame. The camera must never move higher than the base of the chin.

The model holds a smartphone with one hand throughout the recording, maintaining a natural mirror-selfie posture.

**5. EXACT MOVEMENT CHOREOGRAPHY**

Reproduce the following sequence of movements in one continuous, uninterrupted recording.

**0–1 SECOND:**

The model starts standing naturally, holding the smartphone with one hand. Her free arm hangs relaxed beside her body.

**1–2 SECONDS:**

She slowly raises her free hand toward her chest and gently places her fingers on the upper bust area, with fingers slightly spread.

**2–4 SECONDS:**

She slowly slides her open palm down across the front of the garment, moving from the bust toward the abdomen and waist. Her hand continues downward toward the hip and upper thigh, following the body's natural contours.

**4–5 SECONDS:**

She continues the downward movement, briefly touching the lower abdomen and hip area, demonstrating how the garment fits against her body.

**5–7.5 SECONDS:**

She brings her free hand back toward the side of her waist, pinches a small section of the garment fabric between her fingers and gently pulls the material outward exactly TWO times.

Both pulls must be subtle, short and realistic, demonstrating the fabric's elasticity and fit without deforming or changing the garment.

After the second pull, she naturally releases the fabric.

**7.5–8.5 SECONDS:**

She moves her free arm outward and slightly away from her body while beginning to shift her weight and reposition her feet.

**8.5–10 SECONDS:**

She gradually rotates her torso and hips into a three-quarter side profile, turning approximately 70–90 degrees relative to her original frontal position.

CAMERA LOCK: The camera remains strictly at mid-chest level and MUST NOT tilt upward during or after the rotation. Framing remains anchored strictly below the chin (never showing lips, mouth, or swollen lips).

She maintains the smartphone mirror-selfie posture while displaying the side silhouette, waist, hips and rear fit of the garment.

She must not turn completely away from the mirror.

**6. BODY LANGUAGE AND NATURAL MOVEMENT**

All movements must look like a real woman casually recording a fashion demonstration in front of a mirror.

Maintain:
- Realistic body mechanics.
- Natural hand articulation and finger movements.
- Subtle weight transfers.
- Believable posture changes.
- Physically accurate fabric interaction.
- Natural coordination between the torso, arms, hips and legs.

Movements must be fluid, continuous, realistic and correctly timed.

Do not introduce exaggerated gestures, dancing, walking away or additional movements not specified in the choreography.

**7. CAMERA MOVEMENT**

Maintain a realistic smartphone mirror-selfie recording perspective.

Allow subtle, natural handheld camera movement, with minimal framing adjustments accompanying the model's movements, as if she were genuinely recording herself in front of the mirror.

No cinematic camera movements, no artificial zooms, no cuts, no transitions and no sudden camera changes.

**8. FINAL REQUIREMENTS AND PRIORITIES**

The entire sequence must happen in one uninterrupted take.

No visible face, no speech, no subtitles, no captions, no added graphics, no additional people and no watermarks.

Prioritize:

1. Exact preservation of the selected scenario image.
2. Maximum fidelity to the attached clothing product.
3. Compliance with all physical characteristics selected by the user.
4. Preservation of the model's natural appearance and accessories.
5. Exact reproduction of the specified movement choreography.
6. Photorealistic anatomy, natural body mechanics and fluid animation.

The final result must look like an authentic fashion mirror-selfie video, with the model naturally integrated into the selected scenario, wearing the exact referenced product and performing the specified movements.`;

/**
 * Constrói o Prompt de Vídeo do Modo Ana Maria
 * Suporta dois modos:
 * 1. Padrão (sem cenário selecionado) -> VENCEDOR_BY_GPT_PROMPT
 * 2. Com Cenário Selecionado -> VENCEDOR_BY_GPT_SCENARIO_PROMPT
 */
export function buildAnaMariaVideoPrompt(params: {
  productName: string;
  influencer?: AnaMariaInfluencer;
  limit?: AnaMariaVideoPromptLimit;
  additionalInstructions?: string;
  hasSelectedScenario?: boolean;
}): string {
  const isMale = params.influencer === 'Homem';
  const limit = params.limit || 'unlimited';

  let base = params.hasSelectedScenario
    ? VENCEDOR_BY_GPT_SCENARIO_PROMPT
    : VENCEDOR_BY_GPT_PROMPT;

  if (isMale) {
    base = base
      .replace(/\bwoman\b/g, 'man')
      .replace(/\bwoman's\b/g, "man's")
      .replace(/\bShe\b/g, 'He')
      .replace(/\bshe\b/g, 'he')
      .replace(/\bHer\b/g, 'His')
      .replace(/\bher\b/g, 'his')
      .replace(/\bbust\b/g, 'chest')
      .replace(/\bdress\b/g, 'garment');
  }

  if (params.additionalInstructions && params.additionalInstructions.trim().length > 0) {
    base += `\n\n**ADDITIONAL INSTRUCTIONS:**\n${params.additionalInstructions.trim()}`;
  }

  if (limit === 'unlimited') {
    return base.trim();
  }

  if (limit === '5000') {
    if (base.length <= 5000) return base.trim();
    return base.slice(0, 4980).trim();
  }

  // Até 2.500 caracteres
  if (base.length <= 2500) return base.trim();
  return base.slice(0, 2480).trim();
}
