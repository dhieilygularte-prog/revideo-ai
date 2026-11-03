import { AnaMariaMasterId, AnaMariaPresentationMode } from './types';

export interface AnaMariaMasterPromptItem {
  id: AnaMariaMasterId;
  number: number;
  shortName: string;
  cardTitle: string;
  objective: string;
  videoUrl: string;
  categories: AnaMariaPresentationMode[];
  primaryCategory: AnaMariaPresentationMode;
  preferredScenarioId?: string;
  isPov?: boolean;
  allowsFaceByDefault?: boolean;
  // Blocos de identidade física da modelo (para geração de imagem)
  bodyStandardText: string;
  skinAndRealismText: string;
  hairIdentityText: string;
  faceAndMakeupText?: string;
  accessoriesIdentityText: string;
  lightingAndCameraText: string;
  // Prompt de movimentos original completo da Mestra (para geração do vídeo)
  movementPromptText: string;
}

/**
 * MÓDULO UNIVERSAL SOBERANO — ESTRUTURA CORPORAL FEMININA PLUS SIZE REAL
 * Baseado na foto oficial de referência (Manequim 50 a 54 / US 18-22 / 2XL-3XL):
 * Mulher brasileira com peso corporal pesado evidente, coxas hiper-grossas que se tocam,
 * celulites naturais visíveis nas coxas, braços grossos roliços, quadris muito largos,
 * abdômen arredondado macio com volume evidente no baixo ventre e flancos laterais,
 * pele clara natural NÃO bronzeada e iluminação ambiente de quarto/residência real.
 * REGRA INVIOLÁVEL: TERMINANTEMENTE PROIBIDO GERAR MULHERES MAIS MAGRAS DO QUE ESTA REFERÊNCIA.
 */
export const UNIVERSAL_PLUS_SIZE_MODULE = `## PADRÃO CORPORAL PLUS SIZE — FIDELIDADE MÁXIMA À REFERÊNCIA

Gerar uma mulher adulta brasileira com corpo PLUS SIZE REAL, volumoso, naturalmente curvilíneo e com distribuição de gordura corporal semelhante à referência visual apresentada.

**IMPORTANTE: O corpo deve reproduzir fielmente as proporções e características descritas abaixo. Não gerar uma mulher magra, mediana, fitness, atlética, apenas curvilínea ou com sobrepeso leve. A modelo precisa apresentar um corpo verdadeiramente plus size, com volume corporal expressivo e natural. Não reduzir medidas, não afinar membros e não suavizar artificialmente as características físicas.**

### 1. Estrutura corporal e proporções gerais

Mulher adulta com estrutura corporal larga, corpo robusto e volumoso, apresentando distribuição natural de gordura predominantemente nos seios, braços, abdômen inferior, quadris, glúteos e coxas.

O tronco apresenta largura considerável, com cintura moderadamente definida, mas sem aparência de cintura extremamente fina ou artificialmente desenhada.

A silhueta apresenta curvas naturais, com transição suave entre cintura, quadris e coxas. O quadril é largo e volumoso, proporcional à largura dos ombros e do tronco.

Não criar uma silhueta de ampulheta exagerada. O corpo deve parecer naturalmente pesado, macio e volumoso, sem aparência de corpo esculpido em academia.

### 2. Seios e região do colo

Seios grandes, volumosos, cheios e naturalmente pesados, com bastante projeção frontal e largura considerável.

Apresentam formato arredondado, com volume concentrado tanto na parte superior quanto na inferior, sendo a porção inferior naturalmente mais pesada, com queda anatômica discreta causada pelo próprio peso dos seios.

Os seios não devem apresentar aparência artificial de silicone, rigidez, formato perfeitamente esférico ou sustentação excessivamente elevada.

O colo apresenta volume generoso, com separação natural entre os seios e proporções compatíveis com um busto grande.

A região do tórax é larga, com transição natural entre busto, axilas e braços.

### 3. Braços

Braços grossos, volumosos e macios, especialmente na região superior, entre os ombros e os cotovelos.

A parte posterior dos braços apresenta volume de tecido adiposo subcutâneo, com aparência natural de braços de uma mulher plus size.

Os braços não devem ser definidos muscularmente, nem apresentar bíceps ou tríceps aparentes.

A região próxima às axilas apresenta volume corporal natural, sem criar uma transição artificialmente estreita entre braço e busto.

A pele dos braços deve apresentar textura humana real, com pequenas irregularidades, poros discretamente visíveis e variações naturais de tonalidade.

### 4. Abdômen e cintura

Abdômen de volume moderado a acentuado, com gordura subcutânea natural.

A região abdominal apresenta uma projeção suave para a frente, especialmente na porção inferior, abaixo do umbigo.

A barriga não é completamente reta, não possui definição muscular e não apresenta aparência de abdômen fitness.

A cintura possui uma definição moderada, sem marcação profunda ou estreitamento exagerado.

A região lateral da cintura apresenta continuidade natural com os quadris, sem criar uma silhueta artificial.

O umbigo é naturalmente visível, com profundidade e formato anatômico realistas.

A pele abdominal apresenta pequenas dobras e vincos naturais decorrentes da postura e da distribuição de gordura corporal.

### 5. Quadris e glúteos

Quadris largos, arredondados e volumosos.

A região lateral dos quadris apresenta bastante volume, com uma transição contínua entre cintura, quadril e coxas.

Glúteos naturalmente grandes e volumosos, proporcionais à estrutura corporal, sem aparência artificialmente aumentada.

A região dos quadris deve apresentar largura significativa, mantendo a proporção com o restante do corpo.

Não afinar o quadril e não criar uma estrutura corporal estreita.

### 6. Coxas e pernas

Coxas muito grossas, volumosas e com bastante massa corporal.

A região superior das coxas apresenta grande volume, com a parte interna das coxas naturalmente próxima, podendo apresentar contato entre elas.

As coxas possuem formato arredondado, com volume distribuído na região frontal, lateral e interna.

A parte superior das pernas é larga e apresenta transição contínua com os quadris.

Os joelhos possuem volume natural, sem aparência excessivamente definidos ou ossudos.

As panturrilhas também apresentam volume, mantendo proporção com as coxas e com a estrutura geral do corpo.

As pernas não devem ser afinadas, alongadas artificialmente ou transformadas em pernas de modelo fitness.

### 7. Textura natural da pele

A pele deve apresentar realismo fotográfico extremo, sem filtros de beleza, sem efeito porcelana, sem acabamento plástico e sem suavização artificial.

Tom de pele morena clara a média, com subtom quente, levemente dourado e nuances naturais.

A pele deve apresentar:

- Poros naturais discretamente visíveis.
- Textura cutânea realista e irregularidades microscópicas.
- Pequenas variações de tonalidade entre diferentes regiões do corpo.
- Celulites naturais nas coxas, especialmente nas regiões laterais e posteriores.
- Leve aspecto de pele ondulada em algumas áreas com maior concentração de gordura subcutânea.
- Pequenas depressões e irregularidades naturais na superfície das coxas.
- Discretas marcas e linhas naturais de compressão da pele.
- Dobras suaves nas regiões de articulação e onde há contato entre partes do corpo.
- Textura natural na região dos braços, sem aparência excessivamente lisa.
- Pequenas irregularidades na região dos quadris e abdômen.

**CELULITE: NÃO REMOVER.** A modelo deve apresentar celulite natural e visível, principalmente nas coxas, com pequenas ondulações e depressões distribuídas irregularmente. Não exagerar a ponto de parecer uma textura artificial, mas também não eliminar essas características com retoques digitais.

A pele deve parecer uma pele humana real, fotografada por uma câmera, e não uma superfície digitalmente aperfeiçoada.

### 8. Características de realismo anatômico

Todas as partes do corpo devem apresentar consistência anatômica e proporções realistas.

A gordura corporal deve apresentar comportamento natural, com volume, peso e suavidade compatíveis com um corpo plus size.

Evitar:
- Cintura extremamente fina.
- Braços finos.
- Coxas finas.
- Quadris estreitos.
- Abdômen completamente plano.
- Seios pequenos ou excessivamente firmes.
- Pernas musculosas e definidas.
- Aparência fitness.
- Pele artificialmente lisa.
- Corpo com proporções de modelo convencional.
- Redução automática das medidas corporais.

### 9. REGRA PRINCIPAL — PRESERVAÇÃO DO PADRÃO PLUS SIZE

O padrão corporal descrito deve ser tratado como uma característica fixa da modelo.

Sempre que a inteligência artificial gerar uma nova imagem, deve preservar a mesma estrutura corporal, a mesma distribuição de gordura, a mesma largura dos quadris, o mesmo volume das coxas, a mesma espessura dos braços, o mesmo volume abdominal e as mesmas proporções do busto.

Não interpretar a palavra PLUS SIZE de maneira genérica.

Não reduzir o volume corporal para tornar a modelo mais magra, mais definida ou mais próxima dos padrões convencionais de beleza.

O resultado deve ser uma mulher adulta com corpo plus size autêntico, volumoso, macio, natural e extremamente realista.`;

export const UNIVERSAL_PLUS_SIZE_ENGLISH_DIRECTIVE = `[SOVEREIGN PLUS-SIZE BODY MANDATE - NATURAL BRAZILIAN PLUS SIZE]:
- The model MUST be an authentic, full-figured PLUS-SIZE adult Brazilian woman with natural heavy body mass, voluptuous soft curves, and genuine subcutaneous adipose distribution.
- STRICT PROHIBITION: NEVER GENERATE WOMEN SLIMMER THAN THIS REFERENCE. Absolutely NO mid-size, NO slim-waisted models, NO size 44/46, NO flat-bellied models, NO gym-sculpted or fitness bodies.
- 1. GENERAL PROPORTIONS: Wide, robust, heavy-set frame with natural adipose volume in breasts, arms, lower belly, hips, glutes, and thighs. Soft and naturally heavy body.
- 2. BREASTS & CHEST: Large, full, voluptuous, heavy natural breasts with realistic downward anatomical drape (no rigid silicone or unnatural high lift). Broad natural chest and ribcage.
- 3. ARMS: Noticeably thick, fleshy, soft, rounded arms with evident subcutaneous fat (especially upper arms; no muscular definition or thin arms).
- 4. ABDOMEN & WAIST: Full natural belly with soft subcutaneous fat and gentle outward projection below the navel (never flat, never toned). Moderate natural waist definition with soft rolls on the flanks/sides.
- 5. HIPS & GLUTES: Extra-wide, rounded, voluptuous hips and glutes with smooth natural continuation into the thighs (never narrow hips).
- 6. THIGHS & LEGS: Very thick, massive, heavy thighs that touch and press together at the upper thighs (zero thigh gap). Thick, soft, rounded upper legs and full calves.
- 7. SKIN TEXTURE, TONE & CELLULITE: Light-brown to medium-brown skin with warm, subtly golden undertone. REAL photographic skin with natural pores, subtle tone variations, and natural skin folds. MANDATORY CELLULITE (DO NOT REMOVE): Visible natural cellulite dimpling and subtle wavy texture on the thighs (authentic unretouched human skin; absolutely NO airbrushed smooth plastic look, NO beauty filters).
- 8. ANATOMICAL REALISM: Natural weight, softness, and gravity behavior of plus-size body fat.
- 9. PERMANENT RETENTION: Maintain this exact heavy, voluptuous plus-size body proportions across every generated frame.`;

export const UNIVERSAL_MALE_PLUS_SIZE_MODULE = `## MÓDULO UNIVERSAL — ESTRUTURA CORPORAL MASCULINA PLUS SIZE (PRIORIDADE SOBERANA DE CORPO)
Gerar um homem adulto com estrutura corporal GENUINAMENTE PLUS SIZE (manequim 52 a 56 / XXL), apresentando porte físico grande, pesado e robusto, com volume adiposo evidente:
- Tronco largo e volumoso, peitoral cheio e abdômen arredondado proeminente (nunca barriga tanquinho ou chapada).
- Braços grossos e cheios, ombros largos e pernas grossas e pesadas.
- Textura humana hiper-realista com poros visíveis, dobras naturais de tecido adiposo e caimento real da roupa sobre o corpo grande.`;

export const MASTER_PROMPTS_GALLERY: AnaMariaMasterPromptItem[] = [
  {
    id: 'mestra_ana_maria',
    number: 1,
    shortName: '01. Mestra Ana Maria',
    cardTitle: '01. MESTRA ANA MARIA — FRENTE + ELASTICIDADE + GIRO 3/4',
    objective:
      'Objetivo: mostrar o produto inteiro de frente, demonstrar a elasticidade na cintura e girar 3/4 exibindo a silhueta.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/PROMPT+ANA+MARIA-+BY+GPT+LEU+O+VIDEO+ORIGINAL+OTIMO.mp4',
    categories: ['mirror_selfie'],
    primaryCategory: 'mirror_selfie',
bodyStandardText: `PADRÃO CORPORAL SOBERANO — MESTRA ANA MARIA (CORPO VIOLÃO FITNESS / COXAS HIPER-GROSSAS):
Mulher jovem brasileira (23 a 28 anos, aprox. 1,65m de altura e 66kg a 70kg) com silhueta ampulheta fitness extrema ("corpo violão fitness / coxuda sarada"), com forte contraste anatômico entre a cintura extremamente fina e os membros inferiores muito desenvolvidos:
- CINTURA: Extremamente estreita, finíssima, esculpida e bem marcada ("cintura de pilão"), criando um contraste dramático com os quadris largos.
- QUADRIS: Muito largos, volumosos e arredondados, que se projetam para as laterais com curva violão evidente e marcante.
- GLÚTEOS: Volumosos, redondos, empinados e densos, com grande projeção lateral e posterior, preenchendo com firmeza a peça de roupa.
- COXAS (CARACTERÍSTICA VISUAL MAIS IMPORTANTE): Coxas HIPER-GROSSAS, volumosas, musculosas e muito torneadas de treino de academia (quadríceps desenvolvidos, cheios e volumosos que preenchem completamente a peça). As coxas são maciças e robustas, muito mais largas que a cintura e os braços!
- ABDÔMEN: Plano, reto, liso e enxuto, sem excesso de gordura e sem dobras, cintura fina e bem definida.
- TRONCO E BUSTO: Busto de médio a cheio, proporcional, colo harmônico e firme; tronco e caixa torácica estreitos.
- BRAÇOS E OMBROS: Braços finos, esguios e delicados, ombros simétricos proporcionais, trazendo leveza e delicadeza para a parte superior em contraste com as pernas grossas.
- PERNAS E PANTURRILHAS: Pernas torneadas e musculosas, panturrilhas firmes e proporcionais.
REGRA DE OURO INVIOLÁVEL: É TERMINANTEMENTE PROIBIDO gerar corpos magros, retos, sem cintura ou pernas finas de modelo de passarela (STRICTLY FORBIDDEN: skinny model, thin runway legs, stick legs, flat hips, boyish waistless torso).
NUNCA copiar o corpo magro da modelo da foto do produto do usuário: da foto do produto, copiar rigorosamente APENAS A ROUPA e vesti-la no corpo violão de coxas grossas da Mestra Ana Maria.`,
    skinAndRealismText: `PELE E REALISMO HUMANO — MESTRA ANA MARIA:
- TONALIDADE: Pele clara natural (caucasiana / morena muito clara), com subtom neutro a levemente rosado/quente e aspecto saudável de quem está em casa (sem bronzeamento alaranjado artificial e sem óleo brilhoso).
- TEXTURA: Textura fotográfica humana 100% autêntica, poros naturais discretamente visíveis, microtexturas reais da pele, sem efeito de pele de plástico, sem filtro de porcelana e sem aspecto de boneca.
- ILUMINAÇÃO: Luz ambiente natural e suave de quarto/residência real, com exposição natural, sombras discretas e reflexos luminosos suaves e realistas.`,
    hairIdentityText: `CABELO — MESTRA ANA MARIA: Cabelo feminino humano real longo ou médio, tonalidades naturais (castanho claro, castanho escuro ou loiro natural), fios alinhados com caimento natural sobre os ombros e costas, textura saudável e brilho natural.`,
    accessoriesIdentityText: `ACESSÓRIOS — IDENTIDADE MESTRA ANA MARIA (EXATAMENTE COMO NA FOTO DE REFERÊNCIA):
- COLARES NO COLO: Composição delicada de 2 a 3 correntes douradas finas em camadas no colo (gargantilha choker dourada fina justa ao pescoço + correntinha mais longa com pequenos pingentes metálicos circulares caídos).
- PULSEIRAS: Pulseira fina dourada delicada de elos pequenos no pulso.
- ANÉIS: Anéis dourados finos e discretos nos dedos.
- UNHAS: Comprimento curto a médio, formato arredondado delicado com esmalte nude, rosado claro ou brilho natural, manicure limpa e bem cuidada.
- SMARTPHONE: Smartphone moderno (iPhone com capinha rosada/nude) segurado em uma das mãos diante do espelho, enquadramento estrito do queixo para baixo.`,
    lightingAndCameraText: `Fotografia vertical 9:16 hiper-realista capturada por smartphone diante do espelho (selfie no espelho), enquadramento do queixo para baixo exibindo com perfeição o corpo violão, a cintura finíssima, as coxas grossas e a roupa vestida. Luz ambiente suave e natural, ângulo frontal ou levemente 3/4, postura natural e confiante.`,
    movementPromptText: `Create a 10-second ultra-photorealistic vertical 9:16 mirror-selfie fashion video. Use the attached reference image as the absolute visual starting point.

The animation must reproduce the following exact sequence of movements in one continuous, natural recording.

**IDENTITY AND PRODUCT PRESERVATION**

Preserve exactly the same model, body shape, proportions, skin, hair, clothing, garment color, neckline, fabric, seams, texture, accessories, smartphone, mirror, room and lighting from the reference image.

Do not redesign, modify, replace or reinterpret any part of the clothing. The garment must remain identical throughout the entire video.

**FACE AND CAMERA FRAMING (STRICT CHIN-DOWN & ANTI-UPWARD TILT LOCK)**

Never reveal the model's face. Maintain the original framing strictly from the bottom base of the chin downward throughout all 10 seconds, exactly as shown in the reference image.
The lips, mouth, nose, eyes and upper face MUST REMAIN 100% OUT OF FRAME throughout the entire recording.
The camera must remain anchored at chest level and must NEVER tilt upward or drift above the base of the chin, especially during the 8.5–10s rotation.

She holds the smartphone in one hand throughout the entire recording. The phone remains in front of the mirror, maintaining the original mirror-selfie composition.

**EXACT MOVEMENT CHOREOGRAPHY**

0–1 SECOND:
The woman starts standing naturally in front of the mirror, holding her phone with one hand. Her free arm hangs relaxed beside her body.

1–2 SECONDS:
She slowly raises her free hand toward her chest and gently places her fingers on the upper bust area, making natural contact with the fabric.

2–4 SECONDS:
She slowly slides her open palm down across the front of the garment, moving from the bust toward the abdomen and waist. Her hand continues downward toward the hip and upper thigh, following the body's natural contours.

4–5 SECONDS:
She continues the gentle downward movement, briefly touching the lower abdomen and hip area, demonstrating how the garment fits against the body.

5–7.5 SECONDS:
She brings her free hand back toward the side of her waist, pinches a small section of the garment fabric between her fingers and gently pulls the material outward several times in short, subtle movements, demonstrating the fabric's elasticity and fitted construction. She releases the fabric naturally.

7.5–8.5 SECONDS:
She moves her free arm outward and slightly away from her body while beginning to shift her weight and reposition her feet.

8.5–10 SECONDS:
She gradually rotates her torso and hips into a three-quarter side profile, turning approximately 70–90 degrees relative to her original frontal position. She keeps holding the smartphone and maintains the mirror-selfie posture. Her final position clearly displays the side silhouette, waist, hips and rear fit of the garment. She does not turn completely away from the mirror.

**BODY LANGUAGE AND NATURALISM**

All movements must look like a real woman casually recording a fashion demonstration in front of a mirror.
Maintain realistic body mechanics, natural hand articulation, subtle weight transfers and believable fabric movement.
The woman must not make exaggerated gestures, dance, walk away, or perform additional movements not specified in the choreography.

**CAMERA AND VISUAL STYLE**

Maintain a realistic smartphone mirror recording, with stable framing and only very subtle natural handheld movement.
No cinematic camera movements, no zooms, no cuts, no transitions and no changes in the environment.
The entire sequence must happen in one uninterrupted take.
No visible face, no lips, no speech, no subtitles, no captions, no added graphics, no logos or watermarks.

**FINAL PRIORITY:**
Reproduce the exact movement sequence and timing described above while preserving the original reference image. The movements must be natural, fluid and realistic. The clothing must remain visually identical to the reference image in every frame.`,
  },
  {
    id: 'mestra_iara',
    number: 2,
    shortName: '02. Mestra Iara Vitrine',
    cardTitle: '02. MESTRA IARA — ELASTICIDADE + ALISAMENTO + PERFIL LATERAL',
    objective:
      'Objetivo: puxar lateral mostrando elasticidade, alisar do abdômen ao busto e girar de perfil mostrando caimento.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/VIDEO+MESTRE+IARA+VITRINE.mp4',
    categories: ['mirror_selfie'],
    primaryCategory: 'mirror_selfie',
    bodyStandardText: `PADRÃO CORPORAL — MESTRA IARA (PRIORIDADE MÁXIMA):
Mulher adulta jovem com silhueta feminina CURVILÍNEA E ATLÉTICA, aparência fitness natural e proporções harmoniosas (mulher que pratica atividade física, sem musculatura exagerada ou aparência de fisiculturista).
- Cintura estreita e bem definida; abdômen relativamente plano.
- Quadris arredondados e proporcionais.
- Glúteos naturalmente volumosos e projetados.
- Coxas cheias, torneadas e proporcionais; pernas com aparência atlética e volume natural.
- Busto médio a cheio, proporcional; ombros harmoniosos; braços proporcionais com leve definição muscular.
CARACTERÍSTICA PRINCIPAL: cintura marcada + quadris arredondados + glúteos volumosos + coxas torneadas, com curvas evidentes.
PROIBIDO: mulher extremamente magra, quadris estreitos, pernas finas, corpo reto ou sem curvas; exagerar artificialmente os glúteos; modelo excessivamente musculosa. Preservar proporções anatômicas naturais.
NÃO copiar o corpo da pessoa/manequim da foto do produto: da foto do produto copiar somente a roupa.`,
    skinAndRealismText: `Pele clara a morena-clara com subtom predominantemente QUENTE, tonalidade natural e aparência levemente bronzeada e saudável.
- Textura humana realista, poros discretamente perceptíveis, pequenas variações naturais de tonalidade, pequenas imperfeições e dobras anatômicas preservadas nos braços, pernas, colo e abdômen.
- PROIBIDO: pele de plástico, efeito porcelana, aparência de boneca, pele artificialmente perfeita, brilho exagerado, efeito de óleo bronzeador, reflexos excessivos ou filtros que eliminem as imperfeições.
A modelo deve parecer uma mulher real fotografada com smartphone.`,
    hairIdentityText: `CARACTERÍSTICA FIXA DA MESTRA IARA — CABELO CACHEADO: comprido abaixo dos ombros (preferencialmente até as costas), castanho-escuro a preto, textura CACHEADA com cachos naturais e definidos, volumoso com volume equilibrado, caindo sobre os ombros e costas, fios saudáveis com brilho natural (cachos não artificiais). Proibido como padrão: cabelo curto, loiro, completamente liso ou ondas muito abertas.`,
    faceAndMakeupText: `Quando o rosto estiver visível: aparência adulta jovem, maquiagem discreta, lábios em tons naturais, pele com textura realista, aparência saudável e expressão espontânea (sem aspecto de boneca ou maquiagem carregada).`,
    accessoriesIdentityText: `ACESSÓRIOS EXCLUSIVOS DA MESTRA IARA (OBRIGATÓRIO — estética delicada e dourada):
- COLAR (fixo): SEMPRE exatamente UM ÚNICO colar delicado de corrente fina dourada, com pequeno pingente ou detalhe metálico, minimalista. PROIBIDO colares em camadas, gargantilha combinada com outras correntes ou pingentes grandes.
- PULSEIRAS (fixo): pulseiras delicadas de corrente fina dourada nos DOIS pulsos (uma ou mais discretas em cada), design minimalista, aparência de joias reais. Nunca deixar um pulso visível sem pulseira.
- ANÉIS: PROIBIDOS — zero anéis, zero alianças, dedos sem joias.
- UNHAS: comprimento médio, formato delicado levemente arredondado ou amendoado, esmalte nude rosado, rosa claro ou rosa leitoso, acabamento natural e discretamente brilhante, manicure profissional. Sem unhas muito compridas, pontiagudas, escuras ou decoradas.`,
    lightingAndCameraText: `Fotografia vertical 9:16 espontânea de moda feita com smartphone (selfie no espelho), câmera aproximadamente na altura do tórax, ângulo frontal ou de três quartos (perfil lateral permitido), postura descontraída. Iluminação interna suave, natural e LEVEMENTE QUENTE, exposição equilibrada, sombras naturais, contraste moderado, tons de pele realistas e boa visibilidade dos detalhes da roupa, sem brilho artificial, sem reflexos exagerados na pele e sem iluminação dramática de estúdio.`,
    movementPromptText: `Vídeo vertical 9:16 de 10 segundos hiper-realista. Use a imagem de referência anexada como ponto de partida visual absoluto e reproduza rigorosamente a sequência de movimentos descrita abaixo, respeitando a ordem, o tempo, a continuidade e a naturalidade de cada gesto.

**PRESERVAÇÃO DE IDENTIDADE E PRODUTO:**
Preservar exatamente a mesma modelo da imagem de referência (incluindo seu cabelo longo escuro cacheado, colar único com pingente de coração, uma pulseira dourada em cada pulso e ausência total de anéis), o mesmo cenário e 100% da construção, cor, tecido, costuras e detalhes da roupa anexada.

**REGRA ABSOLUTA DE ENQUADRAMENTO (CORTE NO QUEIXO — SEM ROSTO E SEM LÁBIOS):**
O rosto e os lábios nunca devem aparecer. Manter permanentemente o enquadramento rigoroso da base do queixo para baixo durante todos os 10 segundos, sem revelar boca, lábios, nariz, olhos ou rosto completo. A câmera deve permanecer travada na altura do tórax e jamais inclinar para cima.

**SEQUÊNCIA DE MOVIMENTOS — CRONOLOGIA OBRIGATÓRIA:**

**0s–1,5s — Demonstração de elasticidade:**
Com a mão livre inicialmente posicionada na região do abdômen, deslizar a mão até a lateral da peça. Segurar delicadamente o tecido pela extremidade lateral e puxá-lo horizontalmente para fora, afastando-o do corpo. Manter o tecido esticado por um breve instante e depois soltá-lo suavemente, permitindo que retorne naturalmente à posição original.

**1,5s–3,5s — Demonstração frontal:**
Após soltar o tecido, retornar a mão à região abdominal e deslizá-la lentamente para cima, passando a palma suavemente pela parte frontal da peça em direção à região do busto. Realizar um movimento natural de alisamento do tecido, finalizando com a mão próxima à região central superior da peça.

**3,5s–5,5s — Giro lateral:**
Afastar a mão da parte frontal e iniciar uma rotação gradual do corpo para um ângulo de três quartos, continuando até alcançar uma posição de perfil lateral. O quadril e os ombros devem girar juntos, com pequenos ajustes naturais dos pés para completar a rotação. Deixar os braços relaxados durante o movimento.

**5,5s–6,5s — Apresentação lateral:**
Manter a posição de perfil lateral por aproximadamente um segundo. Fazer uma discreta transferência de peso entre as pernas, mantendo a postura natural e permitindo visualizar o caimento lateral da peça. Evitar movimentos exagerados.

**6,5s–7,5s — Retorno frontal:**
Girar suavemente o corpo de volta para a posição frontal, reposicionando os pés naturalmente. Durante o retorno, levar a mão livre até a região abdominal e deslizar suavemente a palma sobre a parte frontal da peça.

**7,5s–9,5s — Pose frontal:**
Permanecer de frente, relaxar o braço livre ao lado do corpo e realizar pequenos ajustes naturais de postura. Transferir discretamente o peso entre as pernas. Fazer um pequeno movimento com a mão próximo à lateral do quadril, mantendo a pose frontal e valorizando visualmente o caimento da peça.

**9,5s–10s — Pose final:**
Iniciar uma nova rotação suave do corpo para uma posição de três quartos, deixando o quadril acompanhar o movimento. Levar a mão livre novamente à região abdominal e finalizar mantendo a pose levemente lateralizada.

**REGRAS DE EXECUÇÃO:**
- Reproduzir os movimentos na ordem e nos intervalos estabelecidos, em um único take contínuo sem cortes.
- Todos os gestos devem ser suaves, naturais e realistas, com velocidade humana natural.
- Não modificar o enquadramento para revelar o rosto ou lábios.
- Manter a mão que segura o celular em sua posição durante toda a sequência.
- Vídeo 100% silencioso (sem fala, sem locução, sem legendas ou textos na tela).`,
  },
  {
    id: 'mestra_duda',
    number: 3,
    shortName: '03. Mestra Duda',
    cardTitle: '03. MESTRA DUDA — EXPLORAÇÃO TÁTIL ESPONTÂNEA + GIRO SUAVE',
    objective:
      'Objetivo: demonstração comercial fluida explorando frente, cintura e quadril com as mãos e giro lateral suave.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/VIDEO+MESTRE+DUDA+BY+5+VIDEOS.mp4',
    categories: ['mirror_selfie'],
    primaryCategory: 'mirror_selfie',
    bodyStandardText: `PADRÃO CORPORAL — MESTRA DUDA (PRIORIDADE MÁXIMA):
Mulher adulta jovem com corpo feminino ESGUIO, aparência fitness natural e curvas moderadas, silhueta proporcional e aparência saudável e naturalmente atlética.
- Cintura estreita e bem definida.
- Abdômen relativamente plano.
- Quadris arredondados e proporcionais.
- Glúteos naturalmente arredondados.
- Coxas torneadas, com volume moderado; pernas proporcionais e visualmente alongadas.
- Busto proporcional à estrutura corporal.
- Braços delicados e relativamente esguios; ombros proporcionais.
CARACTERÍSTICA PRINCIPAL: cintura definida + abdômen relativamente plano + quadris arredondados + pernas torneadas.
PROIBIDO: modelo extremamente magra, sem curvas ou com corpo reto; modelo excessivamente musculosa; exagerar artificialmente quadris, glúteos ou coxas. NÃO usar a silhueta mais volumosa da Mestra Ana Maria. Preservar proporções anatômicas realistas.
NÃO copiar o corpo da pessoa/manequim da foto do produto: da foto do produto copiar somente a roupa.`,
    skinAndRealismText: `Pele clara a morena-clara com subtom neutro ou levemente quente, aparência saudável e tonalidade natural (leve aspecto bronzeado quando compatível com a iluminação).
- Textura humana realista, poros discretamente perceptíveis, pequenas variações naturais de tonalidade, dobras anatômicas e pequenas imperfeições naturais nas pernas, braços, colo e abdômen.
- PROIBIDO: pele de plástico, efeito porcelana, aparência de boneca, pele excessivamente lisa, brilho artificial de óleo bronzeador, reflexos exagerados ou filtros que eliminem as imperfeições.
A modelo deve parecer uma mulher real fotografada com smartphone.`,
    hairIdentityText: `CABELO — MESTRA DUDA: cabelo comprido abaixo dos ombros, tonalidade castanho-claro a loiro-escuro, predominantemente liso, fios alinhados, caimento natural, divisão central ou levemente lateral, aparência saudável com brilho natural dos fios. Pequenas variações de tom e posição são permitidas; não usar cabelo extremamente curto.`,
    faceAndMakeupText: `Quando o rosto estiver visível: aparência adulta jovem, maquiagem discreta, lábios em tons rosados naturais, pele com textura realista, expressão natural e espontânea (sem maquiagem carregada).`,
    accessoriesIdentityText: `ACESSÓRIOS — IDENTIDADE MESTRA DUDA (delicados, discretos e predominantemente dourados):
- PULSEIRAS (obrigatório): pulseiras finas e delicadas de corrente dourada nos DOIS pulsos, design minimalista, aparência de joias reais (uma ou mais discretas em cada pulso). Sem relógios grandes ou acessórios chamativos.
- ANÉIS: não obrigatórios; não adicionar vários anéis automaticamente.
- COLARES: não obrigatórios (a ausência de colar é compatível); se usados, corrente fina e delicada dourada.
- UNHAS: comprimento médio, formato quadrado suavizado ou levemente arredondado, esmalte nude rosado ou rosa muito claro, acabamento natural ou levemente brilhante, manicure delicada. Sem unhas muito compridas, pontiagudas, escuras ou decoradas.`,
    lightingAndCameraText: `Fotografia vertical 9:16 espontânea de moda feita com smartphone (selfie no espelho), câmera aproximadamente na altura do tórax, ângulo frontal ou de três quartos, postura descontraída. Iluminação clara, suave e equilibrada (luz ambiente natural ou artificial frontal/lateral suave), exposição equilibrada, sombras discretas, cores naturais e tons de pele realistas, sem brilho artificial excessivo nem iluminação dramática de estúdio.`,
    movementPromptText: `Crie um vídeo vertical 9:16 hiper-realista de 10 segundos de demonstração da peça com movimentos naturais, espontâneos e fluidos, seguindo o estilo de demonstração comercial de moda da Mestra Duda. Use a imagem de referência anexada como ponto de partida visual absoluto.

**PRESERVAÇÃO DE IDENTIDADE E PRODUTO:**
Preservar integralmente a mesma modelo da imagem de referência (cabelo comprido liso castanho-claro a médio, colar único delicado, pulseiras e anéis delicados), o mesmo cenário e 100% da roupa original sem modificar cores, modelagem, costuras, estampas ou acabamentos.

**PADRÃO DE DEMONSTRAÇÃO:**
A demonstração deve ser feita principalmente por meio de movimentos delicados das mãos sobre a peça, combinados com pequenas mudanças naturais de postura, quadril e posicionamento corporal.

**1. EXPLORAÇÃO DA PEÇA COM AS MÃOS**
Utilize a mão livre para demonstrar visualmente a roupa. Faça movimentos naturais de contato com o tecido, utilizando a palma e os dedos para percorrer diferentes regiões da peça.
Alterne de forma fluida entre:
- Tocar delicadamente a parte frontal da roupa.
- Deslizar a mão sobre o tecido, em movimentos verticais ou horizontais suaves.
- Percorrer a região superior, central e inferior da peça.
- Passar suavemente pela cintura, quadril e laterais mostrando a modelagem.
- Fazer pequenos gestos de apresentação dos detalhes e do caimento, afastando momentaneamente a mão e reposicionando-a naturalmente.

**2. MOVIMENTAÇÃO CORPORAL**
Enquanto demonstra a peça, realizar pequenas mudanças naturais de postura:
- Transferir suavemente o peso de uma perna para outra.
- Fazer movimentos discretos de quadril e pequenas rotações do tronco.
- Realizar um giro parcial e suave (3/4) para apresentar o caimento lateral da roupa, retornando naturalmente à posição frontal.

**3. NATURALIDADE, CÂMERA E FIDELIDADE**
- Os movimentos devem ser delicados, seguros e naturais; as mãos devem tocar efetivamente o tecido sem deformar ou esticar exageradamente a roupa.
- Manter o enquadramento e a posição da câmera estáveis durante toda a demonstração, em um único take contínuo sem cortes, zooms ou transições.

**4. ÁUDIO — SEM FALA**
- NÃO HÁ FALA, NÃO HÁ DIÁLOGOS, NÃO HÁ NARRAÇÃO E NÃO HÁ LOCUÇÃO.
- O vídeo deve ser exclusivamente uma demonstração visual e silenciosa da peça.`,
  },
  {
    id: 'mestra_nay',
    number: 4,
    shortName: '04. Mestra Nay Vitrine',
    cardTitle: '04. MESTRA NAY — DESLIZAMENTO CONTÍNUO DE CIMA PARA BAIXO',
    objective:
      'Objetivo: demonstração contínua deslizando a mão da parte superior até o quadril e coxa sob iluminação clara.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/VIDEO+MESTRE+NAY+VITRINE.mp4',
    categories: ['mirror_selfie'],
    primaryCategory: 'mirror_selfie',
    bodyStandardText: `PADRÃO CORPORAL — MESTRA NAY (PRIORIDADE MÁXIMA):
Mulher adulta jovem com silhueta feminina AMPULHETA BASTANTE EVIDENTE, curvas naturais e proporções harmoniosas.
- Cintura estreita e bastante definida; região abdominal relativamente estreita, cintura visivelmente menor que a largura dos quadris.
- Quadris largos, arredondados e volumosos, com projeção lateral e posterior natural.
- Glúteos naturalmente volumosos e projetados (projeção posterior evidente no perfil), sem aparência artificial.
- Coxas cheias, grossas e proporcionais aos quadris, com volume consistente da parte superior até a porção média; pernas com volume natural.
- Busto de médio a cheio, proporcional; braços relativamente delicados; ombros harmoniosos em relação aos quadris.
CARACTERÍSTICA MAIS IMPORTANTE: contraste entre a cintura estreita e os quadris largos, com glúteos arredondados e coxas volumosas.
PROIBIDO: modelo extremamente magra, quadris estreitos, pernas finas, silhueta reta ou sem cintura, modelo apenas levemente acima do peso sem curvas evidentes. Não exagerar artificialmente glúteos ou quadris. NÃO é plus size: é uma mulher curvilínea com cintura marcada.
NÃO copiar o corpo da pessoa/manequim da foto do produto: da foto do produto copiar somente a roupa.`,
    skinAndRealismText: `Pele MORENA-CLARA com aparência levemente bronzeada e subtom predominantemente quente, aparência saudável.
- Textura humana realista, poros discretamente perceptíveis, pequenas variações naturais de tonalidade, pequenas imperfeições e dobras anatômicas preservadas nos braços, pernas, colo e abdômen.
- PROIBIDO: pele de plástico, efeito porcelana, aparência de boneca, pele excessivamente lisa, brilho oleoso, efeito artificial de óleo bronzeador, reflexos luminosos exagerados ou filtros que eliminem as imperfeições.
A modelo deve parecer uma mulher real fotografada com smartphone.`,
    hairIdentityText: `CARACTERÍSTICA FIXA DA MESTRA NAY — CABELO: comprido abaixo dos ombros (preferencialmente até as costas), castanho-escuro a preto, predominantemente LISO, divisão central, fios alinhados, caimento reto e natural, brilho natural de cabelo humano real. Proibido como padrão: cabelo curto, loiro, ruivo ou cacheado.`,
    faceAndMakeupText: `Quando o rosto estiver visível: aparência adulta jovem, maquiagem discreta, lábios em tons naturais ou rosados, pele com textura realista, expressão espontânea (sem maquiagem carregada ou aspecto de boneca).`,
    accessoriesIdentityText: `ACESSÓRIOS — IDENTIDADE MESTRA NAY (delicados, predominantemente dourados):
- PULSEIRAS (característica recorrente): pulseiras delicadas de corrente dourada fina nos DOIS pulsos, design minimalista, reflexos metálicos discretos, aparência de joias reais. Sem relógios grandes ou pulseiras chamativas.
- COLARES: não obrigatórios (ausência de colar é compatível); se usados, corrente fina dourada com pequeno pingente minimalista.
- ANÉIS: delicados, finos, preferencialmente dourados, em quantidade moderada.
- UNHAS (característica importante): comprimento médio a médio-longo, formato AMENDOADO com pontas suavemente arredondadas, esmalte rosado, nude rosado ou rosa leitoso, acabamento delicado e levemente brilhante, manicure profissional. Sem unhas extremamente compridas, pontiagudas, escuras ou decoradas.`,
    lightingAndCameraText: `ILUMINAÇÃO PADRÃO CLARO E NATURAL DA MESTRA NAY: fotografia vertical 9:16 espontânea feita com smartphone diante do espelho, câmera na altura do tórax, ângulo frontal ou de três quartos (perfil lateral permitido para valorizar a silhueta). Iluminação clara, suave e equilibrada, exposição equilibrada, sombras discretas, cores naturais, boa visibilidade dos detalhes da roupa, sem reflexos exagerados na pele, sem escurecer a imagem e sem iluminação dramática de estúdio.`,
    movementPromptText: `Crie um vídeo vertical 9:16 hiper-realista de 10 segundos com uma demonstração comercial da peça com movimentos naturais, delicados e contínuos, seguindo o estilo de apresentação da referência Mestra Nay. Use a imagem de referência anexada como ponto de partida visual absoluto.

**PRESERVAÇÃO DE IDENTIDADE E PRODUTO:**
Preservar integralmente a mesma modelo da imagem de referência (cabelo longo escuro e liso, pulseiras douradas delicadas nos dois pulsos, iluminação clara e natural), o mesmo cenário e 100% da peça original sem modificar cores, modelagem, costuras, estampas ou acabamentos.

**SEQUÊNCIA DE DEMONSTRAÇÃO:**
1. Iniciar mantendo uma postura natural de apresentação diante do espelho, com pequenas mudanças de apoio e posicionamento corporal.
2. Elevar gradualmente a mão livre em direção à parte superior frontal da peça.
3. Apoiar delicadamente a palma e os dedos sobre o tecido, realizando um movimento natural de contato e demonstração.
4. Em seguida, deslizar a mão continuamente da região superior em direção ao abdômen, mantendo contato suave com o tecido.
5. Continuar o percurso descendente, passando pela região abdominal inferior e cintura.
6. Prosseguir com a mão em direção ao quadril e à região superior da coxa, demonstrando o caimento da peça por meio de um movimento suave e contínuo.
7. Finalizar afastando naturalmente a mão do tecido, mantendo uma postura descontraída.

**MOVIMENTAÇÃO CORPORAL E ESTILO DOS GESTOS:**
- Fazer pequenas transferências naturais de peso entre as pernas e movimentos discretos de quadril.
- Preservar a orientação predominantemente frontal, evitando giros exagerados ou mudanças bruscas.
- Priorizar movimentos contínuos de cima para baixo com a palma e os dedos, sem puxar ou deformar a roupa.
- Manter a câmera estável em um único take contínuo, sem cortes ou transições.

**ÁUDIO — AUSÊNCIA TOTAL DE FALA:**
- NÃO HÁ FALA, NÃO HÁ DIÁLOGOS, NÃO HÁ NARRAÇÃO E NÃO HÁ LOCUÇÃO.
- NÃO SIMULAR CONVERSAÇÃO E NÃO MOVIMENTAR A BOCA COMO SE ESTIVESSE FALANDO.
- O vídeo deve ser exclusivamente uma demonstração visual e silenciosa.`,
  },
  {
    id: 'mestra_catza',
    number: 5,
    shortName: '05. Mestra Catza (Flash / Com Rosto)',
    cardTitle: '01. MESTRA CATZA — COM ROSTO & FLASH DIRETO NO ESPELHO',
    objective:
      'Objetivo: apresentação UGC no espelho com flash traseiro ligado, fundo mais escuro e foco na parte superior e cintura.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/VIDEO+VITRINE+MESTRE+CATZA+COM+ROSTO.mp4',
    categories: ['com_rosto'],
    primaryCategory: 'com_rosto',
    preferredScenarioId: 'cenario_24',
    allowsFaceByDefault: true,
    bodyStandardText: `PADRÃO CORPORAL — MESTRA CATZA:
Mulher adulta jovem com silhueta feminina ESGUIA E CURVILÍNEA, proporções naturais e aparência saudável.
- Corpo feminino proporcional, cintura definida, abdômen naturalmente definido.
- Quadris arredondados e proporcionais.
- Busto proporcional à estrutura corporal.
- Braços delicados; pernas proporcionais; silhueta harmoniosa.
PROIBIDO: modelo extremamente magra ou excessivamente musculosa; exagerar artificialmente as curvas. Preservar proporções anatômicas realistas.
NÃO copiar o corpo da pessoa/manequim da foto do produto: da foto do produto copiar somente a roupa.`,
    skinAndRealismText: `Pele clara a morena-clara com subtom neutro a quente, aparência natural e tonalidade levemente quente.
- Textura humana realista, poros discretamente perceptíveis, pequenas variações de tonalidade e pequenas imperfeições preservadas no rosto, colo, braços e corpo.
- O flash pode produzir reflexos naturais na pele, mas sem transformar a textura em superfície artificial.
- PROIBIDO: pele de plástico, efeito porcelana, aparência de boneca, pele excessivamente lisa, brilho artificial de óleo, bronzeamento exagerado ou filtros que eliminem as imperfeições.`,
    hairIdentityText: `CARACTERÍSTICA FIXA DA MESTRA CATZA — CABELO: comprido abaixo dos ombros (preferencialmente até as costas), preto ou castanho muito escuro, predominantemente LISO, divisão central, fios alinhados, caimento reto nas laterais do rosto, brilho natural e volume moderado, com fios individuais de cabelo humano real. Proibido como padrão: cabelo curto, loiro ou cacheado.`,
    faceAndMakeupText: `ROSTO E MAQUIAGEM DA MESTRA CATZA (rosto visível no espelho): aparência feminina adulta jovem, rosto delicado e proporcional, maquiagem mais elaborada com acabamento glamouroso porém real — sobrancelhas escuras e bem definidas, olhos destacados, cílios alongados e volumosos, delineado discreto, sombras em tons neutros/marrons, blush suave, lábios naturalmente volumosos com batom nude rosado, malva ou rosa queimado e gloss com brilho delicado. Sem rosto artificialmente perfeito e preservando a textura natural da pele.`,
    accessoriesIdentityText: `MÃOS E ACESSÓRIOS — IDENTIDADE MESTRA CATZA:
- MÃOS: femininas, proporcionais, dedos relativamente compridos e delicados, pele com textura humana, gestos elegantes e espontâneos.
- UNHAS (característica importante): comprimento médio a longo, formato AMENDOADO com pontas suavemente arredondadas, esmalte MARROM, CHOCOLATE ou NUDE ESCURO, acabamento brilhante, manicure profissional. Sem unhas pontiagudas, excessivamente compridas, decoradas ou neon.
- ACESSÓRIOS: discretos, delicados, femininos e realistas, compatíveis com a roupa (sem quantidade obrigatória e sem grandes conjuntos de joias), sem esconder detalhes do produto.`,
    lightingAndCameraText: `ASSINATURA FOTOGRÁFICA OBRIGATÓRIA DA MESTRA CATZA — FLASH FRONTAL INTENSO: selfie vertical 9:16 no espelho feita com smartphone com o FLASH LIGADO — luz frontal intensa, ponto luminoso evidente próximo à câmera com reflexo característico no espelho, iluminação direta sobre rosto, corpo e roupa. Ambiente relativamente MAIS ESCURO que a área iluminada pelo flash, tons quentes e amarelados, fundo discretamente escurecido, contraste entre primeiro plano iluminado e fundo, atmosfera de foto noturna/interna com pouca luz e exposição geral ligeiramente mais escura que uma foto de catálogo. Não clarear o ambiente, não substituir o flash por luz suave de estúdio, não criar foto uniformemente iluminada. Smartphone visível, ângulo frontal ou de três quartos, postura descontraída.`,
    movementPromptText: `Crie um vídeo vertical 9:16 hiper-realista de 10 segundos de demonstração comercial de moda com movimentos naturais, delicados e espontâneos, seguindo o estilo de apresentação da referência Mestra Catza. Use a imagem de referência anexada como ponto de partida visual absoluto.

**PRESERVAÇÃO DE IDENTIDADE, ILUMINAÇÃO COM FLASH E PRODUTO:**
Preservar integralmente a modelo da imagem de referência (cabelo longo escuro e liso, acessórios delicados, iluminação característica com flash direto do smartphone ligado no espelho e ambiente ao fundo ligeiramente mais escuro) e 100% da roupa original sem modificar cores, modelagem, costuras, estampas ou acabamentos.

**HIERARQUIA DE MOVIMENTOS — ORDEM DE PREFERÊNCIA:**

**PRIORIDADE 1 — MOVIMENTOS NA PARTE SUPERIOR (IDENTIDADE PRINCIPAL):**
Privilegiar gestos delicados com a mão livre na parte superior da peça:
- Elevar a mão livre em direção à região superior frontal da roupa.
- Tocar suavemente o tecido com os dedos e a palma, fazendo pequenos deslizamentos sobre o colo, decote, ombros ou acabamento superior da peça.
- Alternar de forma espontânea entre tocar o tecido e afastar momentaneamente a mão, descendo suavemente em direção à cintura.

**PRIORIDADE 2 — MOVIMENTOS COMPLEMENTARES NO ABDÔMEN E CINTURA:**
- Deslizar a mão da região superior em direção ao abdômen e tocar delicadamente a cintura, demonstrando o ajuste e o caimento do tecido no corpo.

**PRIORIDADE 3 — AJUSTES SUTIS NA PARTE INFERIOR:**
- Fazer apenas toques ou ajustes sutis na barra, quadril ou coxa quando adequado à peça, sem puxar ou deformar a roupa.

**MOVIMENTAÇÃO CORPORAL E CÂMERA:**
- Incorporar pequenas mudanças naturais de postura: transferência suave de peso entre as pernas, discretos ajustes de quadril e ombros, privilegiando a apresentação frontal e diagonal suave (sem giros completos).
- Manter a câmera estável em um único take contínuo, sem cortes ou transições.

**ÁUDIO — AUSÊNCIA TOTAL DE FALA:**
- NÃO HÁ FALA, NÃO HÁ DIÁLOGOS, NÃO HÁ NARRAÇÃO E NÃO HÁ LOCUÇÃO.
- NÃO SIMULAR CONVERSAÇÃO E NÃO MOVIMENTAR A BOCA COMO SE ESTIVESSE FALANDO.
- O vídeo deve ser exclusivamente uma demonstração visual e silenciosa.`,
  },
  {
    id: 'pov_cinta_85k',
    number: 6,
    shortName: '01. POV Cinta 85K (Unhas Vermelhas)',
    cardTitle: '01. MESTRA POV 85K — UNBOXING + COMPARAÇÃO DE 2 PEÇAS',
    objective:
      'Objetivo: demonstração POV na cama retirando embalagem plástica, apresentando 2 cores lado a lado e apontando detalhes.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/CINTA+85K.mp4',
    categories: ['pov'],
    primaryCategory: 'pov',
    preferredScenarioId: 'cenario_pov_1',
    isPov: true,
    bodyStandardText: `ENQUADRAMENTO EXCLUSIVO POV (PRIMEIRA PESSOA — SOMENTE MÃOS E ANTEBRAÇOS):
- A modelo NÃO deve aparecer (não mostrar rosto, cabeça, tronco, cabelo ou pernas).
- Mostrar exclusivamente duas mãos femininas adultas jovens e delicadas e parte dos antebraços entrando pela parte inferior do enquadramento sobre a cama.`,
    skinAndRealismText: `Mãos femininas delicadas e proporcionais com dedos relativamente longos, pele clara a morena-clara de subtom levemente quente, textura humana realista com poros e pequenas linhas naturais nas articulações.`,
    hairIdentityText: `Sem cabelo visível (enquadramento POV 90 graus voltado para a cama).`,
    accessoriesIdentityText: `IDENTIDADE VISUAL DAS MÃOS — MESTRA POV 85K:
- UNHAS (PRIORIDADE MÁXIMA): Esmalte VERMELHO VIVO intenso e brilhante, comprimento curto a médio, formato quadrado com cantos suavemente arredondados, manicure impecável.
- PULSEIRAS DOURADAS ASSIMÉTRICAS: No pulso direito, composição de 2 a 3 pulseiras finas douradas delicadas sobrepostas com pequenos pingentes; no pulso esquerdo, 1 pulseira fina dourada minimalista.
- ANÉIS: Anéis finos e delicados dourados em diferentes dedos.
- ZERO TATUAGENS (REGRA OBRIGATÓRIA): É expressamente proibido qualquer tatuagem nas mãos, dedos, punhos ou antebraços. A pele deve ser 100% limpa, sem tatuagens, sem desenhos e sem marcas corporais.`,
    lightingAndCameraText: `Câmera posicionada diretamente acima da cama em ângulo superior POV de 90 graus (formato vertical 9:16), iluminação clara, suave e difusa com sombras naturais.`,
    movementPromptText: `Crie um vídeo vertical hiper-realista 9:16 de 10 segundos, em estilo POV (Point of View em primeira pessoa, câmera fixa a 90 graus acima da cama), reproduzindo fielmente a sequência de unboxing e demonstração manual descrita abaixo. Use a imagem inicial anexada como referência soberana.

**1. PRODUTOS DE REFERÊNCIA E REGRA INEGOCIÁVEL DE CONSTRUÇÃO:**
Reproduzir os dois produtos sobre a cama com fidelidade absoluta às imagens originais.
- Não abrir ou desdobrar partes que não estejam naturalmente abertas na referência.
- Não criar aberturas, compartimentos, botões, fechos, zíperes ou costuras inexistentes.
- Não esticar ou deformar o produto. Manter exatamente a construção original.

**2. MÃOS E ACESSÓRIOS (IDENTIDADE MESTRA POV 85K):**
Mostrar exclusivamente duas mãos femininas e antebraços entrando pela parte inferior do enquadramento:
- Pele clara a morena-clara com textura realista.
- Unhas com esmalte vermelho vivo e brilhante (formato quadrado arredondado).
- Anéis finos dourados nos dedos, 2 a 3 pulseiras douradas delicadas no pulso direito e 1 pulseira fina dourada no pulso esquerdo, com mãos e antebraços completamente limpos sem nenhuma tatuagem.

**3. COREOGRAFIA — 10 SEGUNDOS:**

**0–1,5s — RETIRADA DA EMBALAGEM:**
Começar com os dois produtos sobre a cama. Se houver embalagem plástica transparente sobre eles, uma mão estabiliza os produtos enquanto a outra puxa a embalagem plástica diagonalmente para fora e a afasta para a lateral esquerda; caso já estejam sem plástico na foto inicial, iniciar segurando suavemente os dois produtos pelas laterais no centro da cama.

**1,5–3s — APRESENTAÇÃO DO PRIMEIRO PRODUTO:**
Segurar o primeiro produto pelas extremidades laterais e levantá-lo da superfície, apresentando sua parte frontal à câmera e mantendo sua estrutura original intacta.

**3–4s — POSICIONAMENTO:**
Devolver o primeiro produto à superfície na região esquerda do enquadramento e passar suavemente as mãos sobre sua superfície para alisar o tecido.

**4–5s — DEMONSTRAÇÃO DO PRIMEIRO PRODUTO:**
Segurar delicadamente as laterais do primeiro produto, levantá-lo ligeiramente mostrando seu acabamento original sem esticar ou deformar, e devolvê-lo à superfície.

**5–6,5s — APRESENTAÇÃO DO SEGUNDO PRODUTO:**
Alcançar o segundo produto com as duas mãos e levantá-lo da superfície, apresentando-o de frente para a câmera com sua modelagem e estrutura originais.

**6,5–7,5s — COMPARAÇÃO LADO A LADO:**
Posicionar os dois produtos lado a lado sobre a cama e passar delicadamente as mãos sobre suas superfícies.

**7,5–8,5s — DEMONSTRAÇÃO DOS DETALHES:**
Manter uma mão apoiada sobre o primeiro produto e, com o dedo indicador da outra mão, apontar e percorrer detalhes reais do segundo produto.

**8,5–9s — AFASTAMENTO DO PRIMEIRO PRODUTO:**
Deslocar o primeiro produto para a lateral esquerda mentre a outra mão mantém o segundo produto organizado.

**9–10s — APRESENTAÇÃO FINAL:**
Centralizar o segundo produto sobre a cama, segurar delicadamente suas extremidades laterais fazendo um pequeno ajuste de posicionamento e finalizar com ele centralizado e íntegro.

**4. CÂMERA E ÁUDIO:**
- Vertical 9:16, 10 segundos, câmera fixa em visão superior de 90 graus, sem cortes, sem zoom e sem textos na tela.
- ÁUDIO: 100% silencioso (SEM FALA, sem diálogos, sem narração ou locução).`,
  },
  {
    id: 'pov_blusinhas_13k',
    number: 7,
    shortName: '02. POV 2 Peças 13K (Unhas Vinho Escuro)',
    cardTitle: '02. MESTRA POV 13K — DEMONSTRAÇÃO TÁTIL DE 2 PEÇAS NA CAMA',
    objective:
      'Objetivo: demonstração POV segurando e alternando 2 peças completas na cama com toque tátil no tecido.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/POV+DE+13K.mp4',
    categories: ['pov'],
    primaryCategory: 'pov',
    preferredScenarioId: 'cenario_pov_2',
    isPov: true,
    bodyStandardText: `ENQUADRAMENTO EXCLUSIVO POV (PRIMEIRA PESSOA — SOMENTE MÃOS E ANTEBRAÇOS):
- A modelo NÃO deve aparecer (não mostrar rosto, cabeça, tronco, cabelo ou pernas).
- Mostrar exclusivamente duas mãos femininas adultas delicadas, punhos e parte dos antebraços entrando pela parte inferior do enquadramento sobre a cama.`,
    skinAndRealismText: `Mãos femininas de aparência jovem adulta com dedos relativamente finos e alongados, pele clara a morena-clara com textura humana realista, poros discretos e dobras naturais nas articulações.`,
    hairIdentityText: `Sem cabelo visível (enquadramento POV superior sobre a cama).`,
    accessoriesIdentityText: `IDENTIDADE VISUAL DAS MÃOS — MESTRA POV 13K:
- UNHAS (CARACTERÍSTICA PRINCIPAL): Unhas compridas em formato AMENDOADO ALONGADO com pontas afiladas, esmalte VINHO MUITO ESCURO (bordô profundo próximo do preto) com acabamento brilhante uniforme.
- PULSEIRAS PRATEADAS ASSIMÉTRICAS: Duas pulseiras finas de corrente prateada delicada em um pulso e uma pulseira fina prateada no outro pulso.
- ANÉIS PRATEADOS: Anéis finos e minimalistas prateados nos dedos (sem joias douradas e sem pedras grandes).`,
    lightingAndCameraText: `Câmera posicionada em visão superior POV (formato vertical 9:16) voltada para a cama do cenário selecionado, iluminação natural realista destacando a textura das duas peças e das mãos.`,
    movementPromptText: `Vídeo vertical hiper-realista 9:16, com duração de 10 a 12 segundos, em perspectiva POV (Point of View em primeira pessoa), reproduzindo uma demonstração natural de duas peças de roupa feita exclusivamente pelas mãos de uma pessoa sobre a cama.

**1. REGRA MÁXIMA — FIDELIDADE ABSOLUTA E EXATAMENTE DUAS PEÇAS COMPLETAS:**
A imagem inicial anexada é a referência visual soberana e imutável das duas peças de roupa.
- Durante todo o vídeo devem existir EXATAMENTE DUAS PEÇAS DE ROUPA COMPLETAS, independentes e indivisíveis.
- É terminantemente proibido criar uma terceira peça, deixar retalhos/fragmentos/sobras de tecido sobre a cama ao levantar uma peça, ou modificar cores, corte, decote, costuras e detalhes originais.
- Quando uma peça for levantada pelas mãos, a roupa inteira deve acompanhar o movimento como um único objeto completo.

**2. APARÊNCIA DAS MÃOS E ACESSÓRIOS (IDENTIDADE MESTRA POV 13K):**
Mostrar exclusivamente os antebraços e as mãos femininas em primeira pessoa:
- Pele natural com textura humana realista.
- Unhas compridas em formato amendoado alongado com esmalte vinho muito escuro/preto brilhante.
- Pulseiras finas metálicas prateadas nos dois pulsos (duas em um pulso e uma no outro) e anéis finos prateados.

**3. COREOGRAFIA DOS MOVIMENTOS — SEQUÊNCIA OBRIGATÓRIA:**

**0–2 SEGUNDOS | APRESENTAÇÃO DA PRIMEIRA PEÇA:**
As duas mãos seguram a primeira peça pelas extremidades laterais (polegares na frente e demais dedos apoiando por trás), mantendo a roupa aberta, suspensa e direcionada para a câmera para exibir sua parte frontal com pequenos ajustes naturais sem esticar excessivamente.

**2–4 SEGUNDOS | TROCA E REPOSICIONAMENTO:**
As mãos abaixam suavemente a primeira peça sobre a superfície e se deslocam para segurar a segunda peça pelas extremidades laterais, levantando-a de forma limpa (sem deixar nenhum fragmento de tecido para trás).

**4–7 SEGUNDOS | APRESENTAÇÃO DA SEGUNDA PEÇA:**
As duas mãos trazem a segunda peça para o primeiro plano diante da câmera, ajustando levemente sua abertura com os dedos para exibir sua parte frontal centralizada e íntegra.

**7–9 SEGUNDOS | RETORNO À PRIMEIRA PEÇA:**
As mãos retornam à primeira peça e a levantam integralmente pelas extremidades, aproximando-a suavemente da câmera aberta enquanto a segunda peça permanece íntegra sobre a cama.

**9–11 SEGUNDOS | DEMONSTRAÇÃO TÁTIL DO TECIDO:**
Uma das mãos sustenta de forma estável a extremidade da primeira peça enquanto a outra mão desliza suavemente sobre a superfície do tecido em um movimento contínuo de alisamento e exploração tátil com as pontas dos dedos, demonstrando a maciez e o acabamento real da peça.

**11–12 SEGUNDOS | FINALIZAÇÃO:**
A primeira peça é abaixada naturalmente, deixando a segunda peça completa e visível sobre a cama enquanto as mãos se afastam gradualmente do enquadramento.

**4. RESTRIÇÕES DE ÁUDIO E CÂMERA:**
- Demonstração completamente silenciosa (SEM FALA, sem diálogos, sem narração, sem locução e sem textos na tela).
- Único take contínuo e fluido em visão POV.`,
  },
];

export function getMasterPromptById(id?: AnaMariaMasterId): AnaMariaMasterPromptItem {
  if (!id) return MASTER_PROMPTS_GALLERY[0];
  return MASTER_PROMPTS_GALLERY.find((item) => item.id === id) || MASTER_PROMPTS_GALLERY[0];
}

export function getDefaultMasterForMode(mode: AnaMariaPresentationMode): AnaMariaMasterPromptItem {
  if (mode === 'pov') {
    return MASTER_PROMPTS_GALLERY.find((m) => m.id === 'pov_cinta_85k') || MASTER_PROMPTS_GALLERY[5];
  }
  if (mode === 'com_rosto') {
    return MASTER_PROMPTS_GALLERY.find((m) => m.id === 'mestra_catza') || MASTER_PROMPTS_GALLERY[4];
  }
  return MASTER_PROMPTS_GALLERY[0];
}
