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

export const UNIVERSAL_PLUS_SIZE_ENGLISH_DIRECTIVE = `CORPO PLUS SIZE REAL OBRIGATÓRIO (SOBRESCRITA CORPORAL — PROIBIDO MULHER MAGRA, MEDIANA, MIDSIZE OU CINTURA FINA): Mulher brasileira adulta com corpo verdadeiramente PLUS SIZE pesado, robusto, macio e volumoso: seios grandes, cheios e pesados com queda anatômica natural; braços grossos, roliços e macios com gordura subcutânea; abdômen volumoso com projeção suave abaixo do umbigo e dobras naturais; cintura larga sem afinar; quadris muito largos e glúteos grandes; coxas muito grossas e pesadas que se tocam na parte interna (zero vão) com CELULITE NATURAL VISÍVEL nas coxas (NÃO REMOVER CELULITE, manter ondulações reais da pele); pele morena clara a média com subtom quente e poros reais, zero tatuagens.`;

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
    bodyStandardText: `Silhueta brasileira ampulheta (corpo violão) bem curvilínea e feminina (Padrão Mestra Ana Maria): cintura estreita, fina e bem marcada; quadris largos, arredondados e proeminentes em forte contraste com a cintura; glúteos volumosos e arredondados; coxas cheias, grossas, volumosas e torneadas; busto de médio a cheio proporcional e abdômen natural. PROIBIDO corpo magro de passarela, cintura reta ou quadris estreitos (NÃO copie o corpo magro da foto do produto!).`,
    skinAndRealismText: `Pele clara a morena-clara com subtom levemente quente, textura humana real com poros discretos e dobras naturais (proibido pele plástica/porcelana e zero tatuagens).`,
    hairIdentityText: `Cabelos longos castanho-escuros levemente ondulados caindo sobre os ombros e costas com fios naturais.`,
    accessoriesIdentityText: `2 a 3 colares dourados finos em camadas no pescoço/colo (choker fina + corrente média + corrente longa com medalhinha oval dourada), pulseiras douradas finas nos dois pulsos, anéis dourados discretos e unhas curtas/médias em esmalte nude ou rosado claro.`,
    lightingAndCameraText: `Selfie vertical 9:16 diante do espelho com smartphone na altura do tórax, iluminação ambiente suave e realista.`,
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
    bodyStandardText: `Silhueta brasileira ampulheta (corpo violão) bem curvilínea (Padrão Mestra Iara): cintura fina e estreita em relação aos quadris; quadris largos, arredondados e bem definidos; glúteos volumosos; coxas grossas, cheias e volumosas; busto de médio a cheio e abdômen natural. PROIBIDO corpo magro de passarela, corpo reto ou sem cintura (NÃO copie o corpo magro da foto do produto!).`,
    skinAndRealismText: `Pele clara a morena-clara com subtom levemente quente, textura humana realista com poros discretos (proibido pele plástica/porcelana e zero tatuagens).`,
    hairIdentityText: `Cabelo comprido abaixo dos ombros, castanho-escuro a preto, com cachos naturais bem definidos e volumosos.`,
    accessoriesIdentityText: `Exatamente UM único colar fino dourado com pequeno pingente de coração centralizado no colo (proibido colares em camadas), UMA pulseira fina dourada em CADA pulso (nos dois pulsos), AUSÊNCIA TOTAL DE ANÉIS nos dedos (zero anéis) e unhas curtas/médias em esmalte nude ou rosado.`,
    lightingAndCameraText: `Selfie vertical 9:16 diante do espelho com smartphone, iluminação ambiente suave e equilibrada.`,
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
    bodyStandardText: `Silhueta brasileira ampulheta (corpo violão) bem curvilínea (Padrão Mestra Duda): cintura fina e bem marcada visivelmente mais estreita que os quadris; quadris largos, arredondados e definidos; glúteos volumosos; coxas cheias, grossas e volumosas; busto de médio a cheio, abdômen natural e braços proporcionais. PROIBIDO corpo magro de passarela, cintura reta ou quadris estreitos (NÃO copie o corpo magro da foto do produto!).`,
    skinAndRealismText: `Pele clara a clara-média com subtom levemente quente, textura humana real com poros discretos (proibido pele plástica e zero tatuagens).`,
    hairIdentityText: `Cabelo comprido abaixo dos ombros, liso com leve ondulação nas pontas, castanho-claro a castanho-médio com reflexos discretos.`,
    accessoriesIdentityText: `Um único colar fino dourado com pequeno pingente delicado na base do pescoço, pulseiras finas douradas nos pulsos, anéis dourados discretos e unhas curtas/médias em esmalte nude ou rosado.`,
    lightingAndCameraText: `Selfie vertical 9:16 diante do espelho com smartphone, iluminação ambiente suave e realista.`,
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
    bodyStandardText: `Silhueta brasileira ampulheta (corpo violão) com forte contraste entre cintura e quadril (Padrão Mestra Nay): cintura estreita, fina e bastante marcada; quadris largos, arredondados e bem desenhados; glúteos volumosos; coxas cheias, grossas e volumosas; busto de médio a cheio e braços proporcionais. PROIBIDO corpo magro de passarela, cintura reta ou quadris estreitos (NÃO copie o corpo magro da foto do produto!).`,
    skinAndRealismText: `Pele clara a morena-clara com subtom levemente quente, textura humana real com poros discretos (proibido pele plástica e zero tatuagens).`,
    hairIdentityText: `Cabelo comprido abaixo dos ombros, castanho-escuro a preto, liso alinhado com divisão central.`,
    accessoriesIdentityText: `Pulseiras finas de corrente dourada obrigatoriamente nos DOIS pulsos, anéis finos dourados nos dedos, colo limpo sem colar chamativo, e unhas médias ovais/amendoadas em esmalte rosado ou nude.`,
    lightingAndCameraText: `Selfie vertical 9:16 diante do espelho sob iluminação interna clara, frontal suave e natural.`,
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
    bodyStandardText: `Silhueta brasileira ampulheta curvilínea (Padrão Mestra Catza): cintura fina e bem marcada; quadris arredondados, largos e bem desenhados; glúteos arredondados; coxas cheias e torneadas; busto de médio a cheio e abdômen natural. PROIBIDO corpo extremamente magro sem curvas ou cintura reta (NÃO copie o corpo magro da foto do produto!).`,
    skinAndRealismText: `Pele clara-média a morena-clara com subtom quente e textura humana realista iluminada pelo flash (zero tatuagens).`,
    hairIdentityText: `Cabelo comprido abaixo dos ombros, preto ou castanho muito escuro, liso com divisão central.`,
    faceAndMakeupText: `Rosto feminino jovem, delicado e harmonioso visível no espelho: sobrancelhas escuras definidas, cílios e delineado marcados, lábios volumosos com batom nude/rosado e gloss discreto.`,
    accessoriesIdentityText: `Um único colar fino dourado com pequeno pingente centralizado, pulseiras finas douradas nos pulsos, anéis dourados discretos e unhas curtas/médias em esmalte nude, rosado ou vermelho.`,
    lightingAndCameraText: `Selfie vertical 9:16 no espelho com FLASH TRASEIRO DO SMARTPHONE ATIVADO (reflexo luminoso do flash visível no espelho iluminando a modelo em primeiro plano e fundo levemente mais escuro).`,
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
    bodyStandardText: `Enquadramento exclusivo POV (primeira pessoa, somente duas mãos femininas jovens e parte dos antebraços entrando pela borda inferior sobre a cama; proibido mostrar rosto, cabeça, tronco ou pernas).`,
    skinAndRealismText: `Mãos femininas delicadas, pele clara a morena-clara com textura realista.`,
    hairIdentityText: `Sem cabelo visível.`,
    accessoriesIdentityText: `Unhas curtas/médias quadradas com cantos arredondados em esmalte VERMELHO VIVO intenso e brilhante; 2 a 3 pulseiras finas douradas no pulso direito e 1 pulseira fina dourada no pulso esquerdo; anéis finos dourados nos dedos e discretas micro-tatuagens geométricas de traço fino no punho/mão esquerda.`,
    lightingAndCameraText: `Visão superior POV de 90 graus diretamente acima da cama (9:16), iluminação clara e natural.`,
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
- Anéis finos dourados nos dedos, 2 a 3 pulseiras douradas delicadas no pulso direito e 1 pulseira fina dourada no pulso esquerdo, além de pequenas tatuagens minimalistas de traço fino próximas ao pulso/mão esquerda.

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
    bodyStandardText: `Enquadramento exclusivo POV (primeira pessoa, somente duas mãos femininas jovens e parte dos antebraços entrando pela borda inferior sobre a cama; proibido mostrar rosto, cabeça, tronco ou pernas).`,
    skinAndRealismText: `Mãos femininas delicadas com dedos finos e alongados, pele clara a morena-clara realista.`,
    hairIdentityText: `Sem cabelo visível.`,
    accessoriesIdentityText: `Unhas compridas em formato AMENDOADO ALONGADO com esmalte VINHO MUITO ESCURO (bordô profundo quase preto) brilhante; duas pulseiras finas prateadas em um pulso e uma pulseira fina prateada no outro; anéis finos prateados nos dedos (zero dourado).`,
    lightingAndCameraText: `Visão superior POV de 90 graus acima da cama (9:16), iluminação natural realista.`,
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
