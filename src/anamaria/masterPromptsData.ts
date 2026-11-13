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

A tonalidade de pele e a etnia da modelo seguem rigorosamente a Prioridade 1 (instruções adicionais do usuário) ou Prioridade 3 (padrão da Mestra). A configuração Plus Size aplica-se estritamente ao biotipo corporal (proporções, volume adiposo, peso natural) e à textura da pele com celulite natural visível.

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
- 7. SKIN TEXTURE & MANDATORY CELLULITE: REAL photographic unretouched skin with natural pores, subtle skin folds and MANDATORY VISIBLE CELLULITE on the heavy thighs (DO NOT REMOVE; authentic cellulite dimpling and natural skin waves). Note: Skin tone and ethnicity are governed strictly by User Directives (Priority 1) or selected Mestra (Priority 3).
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
    shortName: '01. Conjunto Thai',
    cardTitle: '01. CONJUNTO THAI — PUXADA NO TOP + GIRO LATERAL 90°',
    objective:
      'Objetivo: iniciar já puxando a barra inferior do top, girar 80–90° de lado, retornar frontal e deslizar a mão pelo abdômen.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/vip/1Thai+Conjunto+by+flow+completo+v5.mp4',
    categories: ['mirror_selfie', 'com_rosto'],
    primaryCategory: 'mirror_selfie',
    bodyStandardText: `## 1. APARÊNCIA GERAL E BIOTIPO — MESTRA ANA MARIA
Gerar uma mulher adulta, de aparência jovem adulta, com características femininas delicadas, cabelos longos castanho-claros iluminados e corpo curvilíneo com silhueta ampulheta.
A modelo possui aparência naturalmente elegante, com estrutura corporal relativamente esguia na parte superior e curvas mais pronunciadas na região dos quadris e glúteos.
Sua aparência deve ser fotográfica e natural, sem aspecto artificial de modelo 3D.

## 4. FORMATO DO CORPO — BIOTIPO AMPULHETA
A modelo apresenta uma silhueta ampulheta curvilínea, com estrutura corporal relativamente esguia e curvas concentradas na região inferior.
Não é uma mulher extremamente magra, nem possui estrutura plus size. Seu corpo combina uma parte superior delicada com quadris largos e glúteos volumosos.

### Cintura e abdômen
- Cintura estreita, fina e bastante marcada.
- Abdômen relativamente plano.
- Laterais da cintura bem definidas.
- Tronco de comprimento médio.
- Curvatura natural entre a cintura e os quadris.
- Região abdominal sem definição muscular exagerada.

### Quadril e glúteos
- Quadril largo, arredondado e bastante evidente.
- Glúteos grandes, cheios e com projeção posterior acentuada.
- Bumbum arredondado, volumoso e naturalmente firme.
- Projeção lateral e posterior bastante perceptível.
- Curva acentuada entre a cintura estreita e a região mais larga dos quadris.
- Região glútea com volume concentrado na parte posterior.
- Transição natural entre quadril, glúteos e coxas.
O bumbum deve ser uma característica visual importante da modelo, apresentando volume e projeção sem parecer artificial.

### Coxas
- Coxas de volume médio a generoso.
- Parte superior das pernas arredondada e preenchida.
- Volume proporcional ao quadril e aos glúteos.
- Curvas naturais na região externa das coxas.
- Não gerar pernas excessivamente finas.
- Não aumentar exageradamente o volume das coxas a ponto de alterar a silhueta original (PROIBIDO coxas musculosas de academia ou hipertrofiadas).

### Pernas
- Pernas visualmente alongadas.
- Comprimento médio a longo em relação ao tronco.
- Joelhos delicados e proporcionais.
- Panturrilhas de volume moderado.
- Tornozelos relativamente finos.
- Estrutura das pernas feminina e proporcional.

### Tronco, busto e braços
- Ombros de largura média, com aparência delicada.
- Busto de volume médio a cheio, proporcional ao corpo.
- Braços relativamente esguios.
- Antebraços delicados.
- Tronco relativamente estreito.
- Parte superior visualmente mais esguia que os quadris.`,
    skinAndRealismText: `## 2. TOM DE PELE E CARACTERÍSTICAS NATURAIS — MESTRA ANA MARIA
- Pele clara natural com tonalidade bege suave, realista e fosca (matte natural).
- NÃO DOURADA e NÃO BRONZEADA: Proibido subtom dourado artificial, proibido aspecto bronzeado de sol/praia e proibido efeito de óleo bronzeador ou pele molhada/brilhosa.
- Textura cutânea humana autêntica e realista, com microtextura de poros reais, micro-relevo natural e imperfeições orgânicas da pele verdadeira.
- Pequenas variações naturais de tonalidade anatômica nos cotovelos, joelhos, juntas e dobras corporais.
- Iluminação ambiente residencial natural, suave e difusa, SEM iluminação de estúdio publicitário perfeitinha, SEM brilho oleoso e SEM reflexos estourados.
- Aparência de fotografia cotidiana de celular sem filtros de embelezamento, sem efeito de pele de porcelana, sem plastificação e sem aspecto de boneca 3D.
- Pele verdadeiramente humana, natural, fosca com textura real.

## 10. APARÊNCIA FOTOGRÁFICA
A imagem deve apresentar:
- Fotografia ultrarrealista.
- Anatomia feminina natural.
- Textura de pele verdadeira.
- Cabelos com fios individualizados.
- Reflexos naturais nos acessórios.
- Mãos e dedos anatomicamente corretos.
- Proporções corporais consistentes.
- Aparência de selfie real feita com smartphone.
- Sem efeito de ilustração, boneca ou renderização 3D.`,
    hairIdentityText: `## 3. CABELO — COR, COMPRIMENTO E TEXTURA — MESTRA ANA MARIA
A modelo possui cabelos longos, volumosos e levemente ondulados:
- Base castanho-claro.
- Mechas iluminadas em tons de loiro escuro, caramelo, mel e bege dourado.
- Raiz ligeiramente mais escura.
- Comprimento longo, ultrapassando a linha dos seios.
- Ondulações largas e naturais.
- Algumas mechas apresentam cachos suaves nas pontas.
- Cabelo com volume moderado a abundante.
- Fios com aparência saudável, movimento natural e brilho discreto.
- Distribuição assimétrica, com mechas caindo sobre os dois lados do tronco.
- Parte do cabelo acompanha a lateral das costas e dos ombros.
O cabelo deve apresentar iluminação dimensional, com contraste natural entre a raiz e as mechas mais claras.`,
    accessoriesIdentityText: `## 5. PESCOÇO, COLO E ACESSÓRIOS — MESTRA ANA MARIA
- Pescoço de comprimento médio, delicado e proporcional.
- Gargantilha fina em tom dourado ou escuro, rente à base do pescoço.
- Colar delicado dourado com pequeno pingente.
- Corrente fina, com acabamento metálico discreto.
- Acessórios elegantes e minimalistas.
### Pulseiras
- Pulseira dourada fina em um dos pulsos.
- Pulseira delicada com pequeno detalhe pendente.
- Corrente metálica fina, sem peças volumosas.
### Anéis
- Anéis delicados nos dedos.
- Predominância de acabamento metálico prateado.
- Um ou mais anéis finos.
- Aparência elegante e discreta.
Não acrescentar brincos grandes, piercings, tatuagens ou acessórios que não estejam presentes na referência.

## 6. MÃOS E UNHAS
- Mãos delicadas e femininas.
- Dedos compridos e proporcionais.
- Unhas de comprimento médio.
- Formato amendoado, levemente alongado.
- Esmalte rosa-claro ou nude rosado.
- Acabamento brilhante.
- Manicure bem feita, com cutículas discretas.
- Dedos com posicionamento natural e anatômico.

## 8. CELULAR E SELFIE
- Smartphone moderno de acabamento rosa-claro.
- Câmeras traseiras múltiplas, visíveis.
- Celular segurado verticalmente por uma das mãos.
- Aparelho posicionado na altura do rosto/queixo.
- Dedos naturalmente distribuídos nas laterais do aparelho.
- Anéis delicados visíveis na mão que segura o celular.
O celular deve permanecer diante da face, ocultando completamente a identidade facial.`,
    lightingAndCameraText: `## 7. POSE CORPORAL — PERFIL LATERAL
A pose deve reproduzir fielmente a posição corporal da referência: selfie no espelho com o corpo em posição predominantemente lateral.
- Posicionamento do tronco: Corpo girado aproximadamente 70 a 80 graus em relação à câmera. Predominância da visão lateral do corpo. Parte superior do tronco levemente girada em direção ao espelho. Ombros naturalmente posicionados. Tronco alongado, sem inclinação exagerada. Coluna em posição natural.
- Posicionamento da cintura e quadril: Cintura suavemente inclinada. Quadril deslocado para trás. Glúteos projetados naturalmente na direção posterior. Região lombar com curvatura anatômica natural. Contraste visual acentuado entre cintura e quadril. Silhueta lateral bastante evidente. A projeção dos glúteos deve ser produzida pela anatomia e pela posição corporal, não por deformação artificial.
- Posicionamento dos braços: Um braço elevado, segurando o celular diante do espelho. Cotovelo flexionado. Antebraço posicionado próximo à região superior do tronco. Outro braço relaxado ao lado do corpo ou parcialmente acompanhando a lateral do quadril. Mãos com aparência natural.
- Posicionamento das pernas: Pernas próximas uma da outra. Uma perna ligeiramente posicionada à frente. Joelhos suavemente flexionados. Peso corporal distribuído predominantemente sobre uma das pernas. Pés em posições ligeiramente diferentes. Postura descontraída e feminina.

## 9. ÂNGULO, ENQUADRAMENTO E COMPOSIÇÃO
PRIORIDADE MÁXIMA: REPRODUZIR O MESMO ENQUADRAMENTO DA REFERÊNCIA.
- Fotografia vertical em proporção 9:16.
- Enquadramento de corpo praticamente inteiro.
- Corte superior na região inferior do queixo, sem mostrar o rosto.
- Parte inferior incluindo os pés.
- Modelo posicionada predominantemente de perfil.
- Visão lateral de aproximadamente 70 a 80 graus.
- Quadril e glúteos ocupando posição visual de destaque.
- Corpo ocupando a maior parte da imagem.
- Perspectiva natural de smartphone, sem distorção de grande-angular, sem ângulo excessivamente baixo ou alto.
- A câmera deve registrar claramente o contorno lateral da cintura, a projeção dos glúteos, as coxas e o comprimento das pernas.
- NÃO MOSTRAR O ROSTO: o enquadramento deve começar abaixo do queixo ou na base do pescoço. Não mostrar olhos, nariz ou boca. O celular também não deve deixar a face visível.

## 11. REGRAS DE CONSISTÊNCIA E INSTRUÇÃO FINAL
Manter permanentemente:
1. O mesmo tom de pele bege natural fosco e realista (sem bronzeamento artificial).
2. O mesmo cabelo longo castanho-claro com mechas iluminadas.
3. A mesma estrutura corporal ampulheta.
4. A mesma cintura estreita.
5. O mesmo quadril largo.
6. Os mesmos glúteos volumosos e projetados.
7. A mesma proporção entre tronco e pernas.
8. Os mesmos acessórios delicados.
9. As mesmas características das mãos e unhas.
10. A mesma posição lateral de selfie.
11. O mesmo enquadramento sem mostrar o rosto.

INSTRUÇÃO FINAL: Reproduzir a identidade visual e corporal descrita nesta referência, sem reinterpretar ou modificar suas características. A fotografia do produto anexada em cada geração deve ser utilizada exclusivamente para determinar a peça que será vestida pela modelo. Não modificar a anatomia, o cabelo, a pele, os acessórios ou a pose para adaptar o corpo ao produto. A peça deve se ajustar naturalmente à modelo, preservando integralmente suas características originais.`,
    movementPromptText: `# MASTER PROMPT — THAI TWO-PIECE OUTFIT | IMMEDIATE TOP PULL & CLEAR SIDE TURN

Create a 10-second ultra-realistic vertical 9:16 mirror-selfie fashion video.

Reproduce the choreography below with deliberate, clearly visible and natural movements. Start the action immediately. Do not waste time holding an initial pose.

## 1. MOVEMENT CHOREOGRAPHY — FOLLOW THIS SEQUENCE EXACTLY

**0.0–1.8 seconds — IMMEDIATE TOP HEM PULL AND STRETCH**

From the very first frame, the model is already holding the bottom hem of her TOP (the upper garment of the two-piece outfit) with her free hand.

She immediately pulls the lower edge of the top gently outward, away from her abdomen, stretching the fabric visibly to demonstrate its elasticity, fit and drape.

IMPORTANT: She must pull ONLY the bottom hem of the TOP, which is the upper garment covering her torso. Her hand must make direct contact with the lower edge of the blouse, around the waist area.

DO NOT touch, pull, lift or stretch the skirt. The skirt must remain completely untouched during this opening movement.

The pulling action must be clearly visible, with the bottom edge of the top moving away from the body. No initial pause or preliminary gesture.

**1.8–3.0 seconds — RELEASE THE TOP AND PREPARE FOR THE TURN**

The model gradually releases the bottom hem of the top, allowing the fabric to return naturally to its original position. Her free hand moves away from the blouse as she shifts her body weight in preparation for the side turn.

**3.0–5.2 seconds — CLEAR AND PRONOUNCED SIDE TURN**

The model performs a clearly visible rotation of her hips, waist, shoulders and torso toward the side.

IMPORTANT: Make this turn substantially more pronounced than a subtle three-quarter movement. She must rotate far enough to present a genuine side profile, approximately 80–90 degrees from the original frontal position.

Her body must visibly change orientation, allowing the viewer to see the complete side silhouette of the two-piece outfit, including how the top and skirt fit around the waist, hips and body.

Hold the side-facing position briefly so the silhouette can be clearly appreciated.

Do not make a tiny hip twist or a barely noticeable rotation.

**5.2–6.8 seconds — RETURN COMPLETELY TO THE FRONT**

The model smoothly rotates her hips, torso and shoulders back toward the mirror until she is fully facing forward again.

The return movement must be just as noticeable as the initial turn.

Do not stop halfway or remain in a three-quarter position. Finish facing the mirror directly.

**6.8–8.3 seconds — HAND SWEEP ACROSS THE WAIST AND ABDOMEN**

Once facing forward, the model raises her free hand to her waist and makes a clearly visible sweeping movement across the front of her abdomen, gently gliding her palm over the fabric.

The movement must be continuous, deliberate and easy to distinguish.

**8.3–10.0 seconds — FINAL GARMENT PRESENTATION**

The model moves her free hand down toward the hip and upper skirt area, briefly presenting the garment's fit. She makes a subtle natural weight transfer between her legs and settles into a frontal presentation, allowing the outfit to remain fully visible until the final frame.

## 2. MOVEMENT CLARITY — CRITICAL

- The video MUST begin with the model already pulling the bottom hem of the TOP.
- No initial standing pose or waiting period.
- The first pulling action must be visible from the first frame.
- She must pull the lower edge of the blouse outward, away from her abdomen.
- NEVER pull the skirt during the opening movement.
- The skirt must remain untouched until the final garment presentation.
- The side turn must reach approximately 80–90 degrees.
- Show a genuine side profile, not merely a slight hip rotation.
- Briefly maintain the side-facing position before returning.
- The return to the frontal position must be complete and unmistakable.
- All hand movements must involve visible arm and hand travel.
- No micro-movements, incomplete gestures or frozen poses.
- Preserve natural transitions without rushing.

## 3. ABSOLUTE CAMERA AND FRAMING LOCK

MAINTAIN THE EXACT CAMERA ANGLE OF THE ATTACHED REFERENCE PHOTOGRAPH.

- Preserve exact camera height, angle, distance, perspective and framing.
- Camera remains completely stationary throughout the video.
- No zooming, panning, tilting or changes in viewpoint.
- Preserve the original mirror-selfie composition.
- Preserve the exact visible body area and face crop.
- Do not reveal more of the model's face than the reference photograph.

The model moves within the frame. The camera does not move.

## 4. SMARTPHONE POSITION LOCK

The smartphone must remain in exactly the same hand and position as in the reference photograph throughout the entire video.

- Never lower or reposition the smartphone.
- Never switch hands or rotate the phone.
- The phone-holding hand remains occupied.
- Only the free hand may touch or present the outfit.

## 5. ABSOLUTE OUTFIT FIDELITY

The attached outfit photograph is the single source of truth.

Reproduce the exact two-piece set shown in the reference image, preserving:

- Exact original color, saturation and color temperature.
- Top design, neckline and straps.
- Exact bottom hem of the top, including its original shape and construction.
- Waistline and proportions.
- Skirt design, length and silhouette.
- Original lace, embroidery and decorative details.
- Seams, trims, patterns and fabric construction.
- Exact fit and relationship between the top and skirt.

Do not redesign, recolor, morph or invent garment details.

Do not change the outfit's color at any point. Do not reproduce any color transitions from the original video.

The outfit must remain visually identical from the first frame to the last frame.

## 6. NATURAL HUMAN AND FABRIC PHYSICS

Maintain realistic human anatomy and coordinated body mechanics.

The fabric must respond naturally when the model pulls and releases the top, preserving its original texture, weight, elasticity and drape.

The top must return naturally to its original position after being released.

No distorted fingers, deformed limbs, unnatural joints, artificial body transformations or floating fabric.

## 7. STRICT SILENCE — NO SPEECH

THE VIDEO MUST BE COMPLETELY SILENT.

Absolutely no:
- Speech or dialogue.
- Narration or voice-over.
- Whispering, singing, humming or laughing.
- Vocalizations or human sounds.
- Lip-sync or mouth movements suggesting speech.
- Music or sound effects.

The model must not speak at any moment.

## 8. CLEAN VIDEO — NO GRAPHIC ELEMENTS

- No text, captions or subtitles.
- No emojis, stickers or graphic overlays.
- Do not reproduce text from the original video.
- No transitions, cuts or scene changes.
- One continuous mirror-selfie shot.
- Vertical 9:16 format.
- Exactly 10 seconds.

**FINAL PRIORITY:** Start immediately with the model pulling and stretching ONLY the bottom hem of the TOP (the blouse), never the skirt. Make the side turn a genuine, pronounced 80–90-degree rotation, followed by a complete return to the frontal position. Preserve the exact camera angle, smartphone position, absolute outfit fidelity and complete silence.`,
  },
  {
    id: 'mestra_iara',
    number: 2,
    shortName: '02. Calça Thai',
    cardTitle: '02. CALÇA THAI — PUXADA NA COXA + PASSO LATERAL + PERFIL',
    objective:
      'Objetivo: puxar o tecido lateral da calça na coxa mostrando largura/caimento, abrir a base e girar em 3/4.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/vip/4++Thai+cal%C3%A7a+by+flow.mp4',
    categories: ['mirror_selfie', 'com_rosto'],
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
    movementPromptText: `# MASTER PROMPT — THAI WIDE-LEG TROUSERS
## EXACT MOVEMENT REPLICATION | MIRROR SELFIE | 10 SECONDS

### 1. PRIMARY OBJECTIVE — EXACT CHOREOGRAPHY REPLICATION

Create a 10-second ultra-realistic mirror-selfie clothing showcase video.

The absolute highest priority is reproducing the exact movement choreography described below, including hand gestures, fabric interaction, leg positioning, foot movements, hip rotation, body orientation, weight shifts and natural transitions.

The attached model photograph determines the model's appearance, body proportions, initial posture, smartphone position, camera angle, mirror perspective, environment and framing.

The attached product photograph determines the exact trousers to be worn.

Reproduce the original choreography as faithfully as possible.

Do not replace the original movements with generic fashion-model posing.

### 2. EXACT MOVEMENT CHOREOGRAPHY — HIGHEST PRIORITY

**0.0–0.6 SECONDS — INITIAL FRONTAL POSITION**

The model begins standing naturally in front of the mirror, facing forward.

Her legs are relatively close together, with one foot slightly positioned ahead of the other.

The free arm hangs naturally alongside the trousers, with relaxed fingers.

The smartphone is already raised in the opposite hand, maintaining its exact original position.

Maintain a relaxed posture with subtle breathing.

**0.6–1.0 SECONDS — FREE HAND APPROACHES THE SIDE FABRIC**

The free hand gradually moves toward the outer side of the trousers, around the thigh area.

The elbow bends naturally as the fingers approach the fabric.

The smartphone remains completely stationary.

**1.0–1.5 SECONDS — GRASP AND OUTWARD FABRIC PULL**

CRITICAL SIGNATURE MOVEMENT:

The free hand grasps the fabric on the outer side of the trousers.

The fingers gently pinch the material and pull it horizontally outward, away from the leg.

The fabric visibly separates from the body, demonstrating the generous width, loose fit and flowing construction of the trousers.

The pull must be clearly visible and natural.

Do not stretch the material excessively or deform the garment.

**1.5–2.0 SECONDS — RELEASE AND TRANSITION TO THE WAIST**

The fingers gradually release the fabric.

The material falls naturally back into its original position.

The free hand moves upward and briefly approaches the lateral waistband area.

The movement must be continuous and fluid.

**2.0–2.5 SECONDS — HAND DESCENDS ALONG THE THIGH**

The free hand leaves the waistband area and travels downward along the side and upper portion of the trousers.

The fingers lightly follow the fabric, demonstrating its loose construction.

Maintain natural hand positioning.

**2.5–3.0 SECONDS — FRONT THIGH PRESENTATION**

The hand continues its downward movement, gently brushing the front portion of the upper thigh.

The palm follows the fabric without compressing or pulling it.

The gesture highlights the natural drape and width of the trousers.

**3.0–3.5 SECONDS — HAND MOVES TOWARD THE ABDOMEN**

The free hand transitions upward toward the front waist and lower abdominal area.

The palm briefly touches the front of the waistband and abdomen, making a smooth presentation gesture.

The movement is subtle and controlled.

**3.5–4.0 SECONDS — HAND RELEASES AND DESCENDS**

The hand gradually leaves the abdominal area and returns toward the side of the body.

The arm relaxes naturally.

The model maintains her frontal orientation.

**4.0–4.5 SECONDS — FRONTAL POSTURE STABILIZATION**

The model briefly stabilizes her posture.

The trousers hang naturally, with realistic folds and fabric movement.

Her legs remain relaxed and slightly separated.

**4.5–5.0 SECONDS — FIRST LEG REPOSITIONING**

The model begins a subtle change of weight between her legs.

One foot starts moving outward, gradually increasing the distance between the feet.

The movement is natural and controlled.

**5.0–5.5 SECONDS — LATERAL FOOT MOVEMENT**

The model moves one leg slightly outward to the side.

The foot makes a small, natural lateral step.

The wide trouser legs move and sway naturally with the movement, showing the garment's generous volume.

Do not exaggerate the step.

**5.5–6.0 SECONDS — OPEN STANCE AND FABRIC MOVEMENT**

The model completes the small foot repositioning.

Her legs are now more separated, creating a wider and balanced standing position.

The trousers respond naturally to the movement, with the fabric gently swinging and settling.

**6.0–6.5 SECONDS — WEIGHT SHIFT**

The model gently transfers her body weight between the legs.

Her hips move naturally as the body stabilizes.

The wide fabric follows the leg movement with realistic inertia.

Maintain the frontal presentation momentarily.

**6.5–7.0 SECONDS — BEGIN BODY ROTATION**

The model initiates a smooth rotation of her hips and torso.

She gradually turns away from the direct frontal position toward a three-quarter side presentation.

The movement begins with a natural weight shift and small foot adjustments.

The free arm remains relaxed alongside the body.

**7.0–7.5 SECONDS — SIDE AND REAR SILHOUETTE PRESENTATION**

The model continues rotating her torso and hips.

Present the trousers from a more lateral and slightly rearward perspective, naturally revealing the side and rear silhouette.

The wide trouser legs follow the rotation, creating realistic fabric movement.

This rotation is an essential part of the original choreography.

Do not replace it with a simple frontal pose.

**7.5–8.0 SECONDS — COMPLETE THE ANGLED PRESENTATION**

The model briefly maintains the angled body position.

Make a subtle foot and hip adjustment to stabilize the posture.

The trousers settle naturally around the legs.

Keep the smartphone in exactly the same hand and original position.

**8.0–8.5 SECONDS — FINAL BODY STABILIZATION**

The model maintains the three-quarter presentation, with her body relaxed.

Allow only subtle breathing and minimal natural postural adjustments.

The fabric hangs freely, displaying the garment's natural silhouette.

**8.5–10.0 SECONDS — NATURAL FINAL HOLD**

Maintain the final angled presentation.

The model remains naturally positioned in front of the mirror, allowing the side and rear drape of the trousers to remain visible.

The free arm stays relaxed.

No additional gestures, exaggerated movements or unnecessary turns.

End with a stable, realistic mirror-selfie composition.

### 3. ABSOLUTE SMARTPHONE AND CAMERA POSITION LOCK

CRITICAL INSTRUCTION:

The smartphone must remain in exactly the same hand and position established by the attached reference photograph throughout the entire video.

The smartphone must NEVER:
- Change hands.
- Be lowered.
- Be raised to another height.
- Move sideways.
- Rotate to a different angle.
- Be removed from its original position.
- Be repositioned to reveal more of the face.
- Be used to touch or demonstrate the trousers.

The smartphone-holding arm must maintain its original natural posture.

ONLY THE FREE HAND may interact with the clothing.

The camera perspective must remain fixed.

No zoom, panning, tilting, reframing or artificial camera shake.

### 4. REFERENCE FRAMING AND FACE VISIBILITY LOCK

The attached model photograph is the absolute authority for the original composition.

Preserve exactly:
- Original camera angle.
- Original crop.
- Mirror perspective.
- Smartphone position.
- Distance from the mirror.
- Visible body area.
- Initial model positioning.

Do not independently change how much of the face is visible.

If the reference photograph shows only the area below the chin, preserve that exact framing.

If the smartphone obscures part of the face, maintain the same arrangement.

Never expand the frame to reveal additional facial features.

### 5. ABSOLUTE TROUSER PRODUCT FIDELITY

The attached product photograph is the single source of truth.

Reproduce the trousers with maximum possible fidelity.

Preserve exactly:
- Original color and color temperature.
- Fabric material and texture.
- Waistband construction.
- Original drawstring and cord details, if present.
- Original leg width.
- Original silhouette.
- Original length.
- Side seams and stitching.
- Pockets and their exact positions, if present.
- Original folds and fabric characteristics.
- Every structural detail visible in the product reference.

Do not redesign, reinterpret, simplify or improve the trousers.

Do not invent additional pockets, seams, openings or decorative elements.

The trousers must remain identical throughout the entire video.

The choreography must adapt to the actual garment, NEVER the opposite.

### 6. NATURAL HUMAN MOVEMENT AND FABRIC PHYSICS

All movements must look like genuine human movements recorded in a real mirror-selfie video.

Prioritize:
- Natural finger articulation.
- Realistic elbow and wrist movement.
- Smooth hand transitions.
- Anatomically correct hand positioning.
- Realistic foot placement.
- Natural hip rotation.
- Believable body-weight distribution.
- Correct leg movement.
- Authentic wide-leg fabric dynamics.
- Realistic fabric inertia and gravity.

When the model pulls the fabric sideways, it must visibly separate from the leg.

When she releases it, the fabric must naturally fall back into position.

When she moves her legs, the wide trouser fabric must follow the movement with realistic swinging and settling.

Avoid robotic movements, exaggerated dancing, unnatural hip swaying, artificial fabric stretching and sudden acceleration.

### 7. AUDIO AND VISUAL RESTRICTIONS

ABSOLUTELY NO SPEECH.

No dialogue, narration, voice-over, spoken words or lip-sync.

No music is required.

No subtitles, captions, headlines, promotional text, stickers or graphic overlays.

Do not reproduce any text appearing in the original video.

Generate a clean, realistic clothing demonstration.

### 8. FINAL GENERATION REQUIREMENTS

Duration: exactly 10 seconds.

Aspect ratio: vertical 9:16.

Visual style: ultra-photorealistic mirror-selfie clothing showcase.

Camera: fixed mirror perspective.

Smartphone: permanently locked in its original position.

Free hand: performs all garment interactions.

Garment: exact fidelity to the attached product reference.

Framing: exact fidelity to the attached model photograph.

Movement priority: maximum choreography accuracy.

FINAL DIRECTIVE:

Reproduce the original movement sequence in the exact order described.

The most important actions are:

1. Grasping and pulling the lateral trouser fabric outward.
2. Releasing the material naturally.
3. Touching the waistband and presenting the upper thigh.
4. Moving the free hand across the abdominal area.
5. Repositioning the feet to create a wider stance.
6. Shifting body weight to demonstrate the garment's movement.
7. Rotating the hips and torso into a three-quarter side and rear presentation.
8. Maintaining the final angled pose to display the trouser silhouette.

Do not replace these movements with generic fashion poses.

The final video must look like the same model performing the same natural choreography, from the same mirror-selfie perspective, while wearing the exact trousers supplied in the product reference photograph.`,
  },
  {
    id: 'mestra_duda',
    number: 3,
    shortName: '03. Vestido Thai',
    cardTitle: '03. VESTIDO THAI — PUXADA LATERAL SUAVE + MOVIMENTO DE PERNAS',
    objective:
      'Objetivo: demonstrar vestido longo/midi com extensão frontal da perna, deslize da mão e puxada lateral suave sem levantar a barra.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/vip/9+Thai+vestido+flow+v2.mp4',
    categories: ['mirror_selfie', 'com_rosto'],
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
    movementPromptText: `# MASTER PROMPT — THAI LONG DRESS
## EXACT MOVEMENT REPLICATION | GENTLE SIDEWAYS FABRIC PULL | STRICT CAMERA LOCK | 10 SECONDS

Create a 10-second ultra-realistic vertical 9:16 mirror-selfie clothing showcase video.

The highest priority is reproducing the movement choreography described below, especially the leg positioning, foot repositioning, natural weight transfers, hand movements along the dress and the gentle fabric-pulling gesture.

Every movement must be clearly visible, deliberate, natural and fluid.

**MAINTAIN THE EXACT CAMERA ANGLE OF THE ATTACHED REFERENCE PHOTOGRAPH.**

The attached model photograph is the absolute authority for the model's appearance, body proportions, camera angle, camera height, mirror perspective, framing, crop, smartphone position and initial posture.

The attached product photograph defines the exact dress that must be worn throughout the entire video.

Reproduce the choreography faithfully. Do not replace the original actions with generic fashion-model posing.

## 1. EXACT MOVEMENT CHOREOGRAPHY — FOLLOW THIS SEQUENCE

**0.0–0.7 SECONDS — INITIAL BENT-LEG POSE**

The model begins facing the mirror in a frontal position.

One leg is visibly bent at the knee and positioned slightly forward, creating a natural asymmetrical posture.

Her hip is subtly displaced to one side.

The free hand rests gently on the upper portion of the thigh, touching the dress fabric.

The other hand holds the smartphone in its original position.

Maintain a natural and elegant posture.

**0.7–1.4 SECONDS — LEG GRADUALLY STRAIGHTENS**

The model begins extending the previously bent leg.

The knee gradually straightens as the foot returns toward the floor.

At the same time, the free hand gently leaves the thigh and descends alongside the dress.

The leg movement must be clearly visible.

The dress fabric follows the movement naturally.

**1.4–2.0 SECONDS — LEGS RETURN CLOSER TOGETHER**

The model brings the previously advanced leg closer to the supporting leg.

Her feet become relatively close together.

The dress falls naturally over the legs.

The free arm remains relaxed alongside the body.

Maintain the frontal mirror-facing position.

**2.0–2.6 SECONDS — SUBTLE FOOT REPOSITIONING**

The model makes a small but visible adjustment to one foot.

The foot moves slightly while the opposite leg supports her weight.

The torso remains frontal.

The dress follows the movement with subtle natural fabric displacement.

**2.6–3.2 SECONDS — FREE HAND APPROACHES THE DRESS**

The free hand gradually moves toward the upper lateral portion of the thigh, touching the fabric of the dress.

The elbow bends naturally.

The fingertips approach the side of the skirt.

This is a deliberate garment-presentation gesture.

**3.2–3.8 SECONDS — HAND GLIDES ALONG THE DRESS**

The free hand gently follows the upper lateral portion of the thigh, moving along the dress fabric.

The fingers move smoothly over the material, emphasizing the garment's texture, fit and silhouette.

The movement must be visible and continuous.

Keep the smartphone completely stationary.

**3.8–4.4 SECONDS — BEGIN FORWARD LEG EXTENSION**

The model begins advancing one leg forward.

The foot moves forward while the knee gradually extends.

The dress fabric naturally follows the leg movement.

This movement must be clearly recognizable.

**4.4–5.0 SECONDS — CLEAR FORWARD LEG PRESENTATION**

The model extends the leg farther forward and slightly diagonally.

The knee becomes more extended and the foot remains naturally grounded.

The dress fabric moves naturally around the leg.

The movement must be clearly visible.

**5.0–5.6 SECONDS — LATERAL FOOT DISPLACEMENT**

The model moves the extended foot slightly outward and diagonally to the side.

The hips shift naturally to maintain balance.

The free hand returns gently to the upper portion of the dress, near the thigh.

The movement must be clearly visible and controlled.

**5.6–6.2 SECONDS — NATURAL WEIGHT TRANSFER**

The model briefly maintains the extended-leg position.

The supporting leg carries most of the body weight.

The opposite leg remains slightly displaced outward.

The hips adjust naturally to the change in support.

The dress fabric follows the body's position.

**6.2–6.8 SECONDS — HAND GLIDES DOWN THE DRESS**

The free hand makes a gentle downward movement along the upper lateral portion of the skirt.

The fingers remain naturally relaxed.

The palm visibly travels over the fabric, highlighting the dress's texture and fit.

Do not make this a stationary touch.

**6.8–8.2 SECONDS — GENTLE SIDEWAYS DRESS FABRIC PULL**

IMPORTANT: The model gently grasps a small section of the dress fabric around the upper thigh area with her free hand.

She pulls the fabric slightly outward and sideways, away from her body.

The movement must be exclusively lateral and horizontal, creating a small but clearly visible displacement of the material.

The fingers hold the fabric gently, producing natural folds and showing the fabric's flexibility and drape.

The pulling action must be clearly recognizable as a real grasp-and-pull gesture, not merely touching or brushing the material.

Hold the fabric momentarily, then release it naturally.

The fabric returns to its original position under natural gravity.

**CRITICAL: THE MODEL MUST NEVER LIFT THE DRESS.**

The hand must pull only sideways, never upward.

Keep the original hemline at exactly the same height throughout the gesture.

**8.2–10.0 SECONDS — FINAL NATURAL DRESS PRESENTATION**

After releasing the fabric, the model makes a natural adjustment to her foot and hips.

One leg remains slightly extended diagonally outward while the other supports most of her body weight.

The free hand rests naturally near the side of the dress or alongside the thigh.

The dress hangs naturally, preserving its original shape, length and silhouette.

Allow realistic fabric movement and settling.

End with a stable frontal mirror-selfie composition.

## 2. MOVEMENT CLARITY — EVERY ACTION MUST BE VISIBLE

IMPORTANT:

The movements must be sufficiently pronounced to be easily recognized.

Do not reduce the choreography to barely visible micro-movements.

Prioritize:

1. Clearly visible initial bent-knee pose.
2. Hand resting on the upper thigh.
3. Gradual straightening of the bent leg.
4. Feet returning closer together.
5. Free hand approaching the dress.
6. Hand following the upper lateral thigh.
7. Forward leg extension.
8. Diagonal lateral foot movement.
9. Visible changes in body-weight distribution.
10. Hand gliding along the dress.
11. Actual grasping of the dress fabric.
12. Visible sideways fabric pull.
13. Natural release of the fabric.
14. Final dress presentation.

Each movement must have a recognizable beginning, execution and completion.

Do not merge different leg movements into a single vague action.

The model must look like a real woman naturally demonstrating a long dress in front of a mirror.

## 3. DRESS FABRIC PULL — STRICT NO-LIFT RULE

The fabric-pulling gesture must demonstrate the dress's flexibility and drape WITHOUT lifting the garment.

The model must:

- Approach the dress with her free hand.
- Grasp a small section of fabric around the upper thigh.
- Pull the fabric a few centimeters outward and slightly sideways.
- Keep the movement horizontal and lateral.
- Make the fabric displacement clearly visible.
- Hold the fabric briefly.
- Release it and allow it to return naturally.

**ABSOLUTELY NO LIFTING THE DRESS.**

STRICTLY FORBIDDEN:

- Do not lift the dress upward.
- Do not raise the hemline.
- Do not pull the skirt toward the waist.
- Do not pull the fabric diagonally upward.
- Do not expose additional portions of the legs.
- Do not gather or bunch the dress upward.
- Do not lift the skirt with the fingers.
- Do not create any movement resembling lifting or raising the skirt.
- Do not change the original length or coverage of the dress.

The hand must pull the fabric ONLY horizontally outward and slightly sideways.

The hemline must remain at its original height.

The dress must maintain exactly the same length, coverage and construction throughout the entire video.

**FINAL RULE: THE MODEL MAY PULL THE DRESS SIDEWAYS, BUT MUST NEVER LIFT, RAISE OR PULL IT UPWARD.**

## 4. ABSOLUTE CAMERA ANGLE LOCK — NON-NEGOTIABLE

**MAINTAIN THE EXACT CAMERA ANGLE OF THE ATTACHED REFERENCE PHOTOGRAPH.**

The attached reference photograph determines the camera viewpoint.

Preserve exactly:

- Original camera height.
- Original camera tilt.
- Original camera orientation.
- Original camera-to-mirror distance.
- Original mirror perspective.
- Original horizontal alignment.
- Original vertical framing.
- Original crop.
- Original visible body area.
- Original smartphone position.
- Original model positioning.

DO NOT:

- Change the camera angle.
- Raise or lower the virtual camera.
- Tilt the camera upward or downward.
- Change the mirror perspective.
- Move the camera closer or farther away.
- Expand or reduce the crop.
- Introduce cinematic angles.
- Switch to a side camera.
- Use a second camera.
- Follow the model with the camera.
- Reframe during the movements.

The model moves naturally in front of the mirror.

**THE MODEL MOVES. THE CAMERA NEVER CHANGES ITS ORIGINAL ANGLE OR POSITION.**

## 5. ABSOLUTE SMARTPHONE POSITION LOCK

The smartphone must remain in exactly the same hand and position established by the attached reference photograph throughout the entire video.

The smartphone must NEVER:

- Change hands.
- Be lowered.
- Be raised to another height.
- Move sideways.
- Rotate to another angle.
- Leave its original position.
- Be repositioned to reveal more of the face.
- Be used to touch or demonstrate the dress.

The smartphone-holding arm maintains its original natural posture.

ONLY THE FREE HAND may interact with the clothing.

The smartphone must remain visually stable throughout the entire video.

## 6. REFERENCE FRAMING AND FACE VISIBILITY LOCK

The attached model photograph is the absolute authority for framing and face visibility.

Preserve exactly:

- Original crop.
- Visible body area.
- Mirror perspective.
- Smartphone position.
- Model positioning.
- Original camera distance.

If the reference photograph shows only the body below the chin, maintain exactly that framing.

If the face is partially obscured by the smartphone, preserve the same arrangement.

Do not reveal additional facial features.

Do not expand the frame to show more of the head or face.

The model must remain within the original composition throughout the entire video.

## 7. ABSOLUTE DRESS PRODUCT FIDELITY

The attached product photograph is the single source of truth for the dress.

Reproduce the exact dress with maximum possible visual fidelity.

Preserve:

- Original dress color and color temperature.
- Fabric texture and material.
- Original neckline.
- Shoulder straps and their construction.
- Original bodice shape.
- Waist and hip fit.
- Original skirt construction.
- Original skirt length.
- Original silhouette.
- Original fabric volume and drape.
- Side seams and stitching.
- Hemline and finishing.
- Every visible decorative detail.

Do not redesign, reinterpret, simplify or improve the dress.

Do not invent additional openings, straps, seams, pockets or decorative details.

The dress must remain identical from the first frame to the last.

The model's movements must adapt to the actual garment, NEVER the opposite.

## 8. NATURAL HUMAN MOVEMENT AND FABRIC PHYSICS

All movements must look like genuine human movements recorded in a real mirror-selfie video.

Prioritize:

- Natural knee articulation.
- Realistic foot placement.
- Smooth leg extension.
- Believable weight distribution.
- Natural hip adjustments.
- Correct ankle positioning.
- Realistic finger articulation.
- Smooth hand movement along the dress.
- Realistic fabric tension during the sideways pull.
- Natural fabric folds.
- Authentic fabric gravity and movement.

When the model pulls the dress sideways, the fabric must respond naturally, showing realistic lateral tension and folds.

The fabric must not move upward or cause the hemline to rise.

After release, the fabric must return naturally to its original position.

The fabric must never become distorted, change length or transform its original construction.

Avoid robotic gestures, exaggerated leg extensions, unnatural hip swaying, artificial fabric stretching and sudden movements.

## 9. ABSOLUTE SILENCE — NO SPEECH, NO VOICE, NO AUDIO

**THIS VIDEO MUST BE COMPLETELY SILENT FROM THE FIRST FRAME TO THE LAST FRAME.**

THE MODEL MUST NEVER SPEAK UNDER ANY CIRCUMSTANCES.

STRICTLY PROHIBITED:

- NO SPEECH.
- NO TALKING.
- NO SPOKEN WORDS.
- NO DIALOGUE.
- NO CONVERSATION.
- NO HUMAN VOICE.
- NO VOICE-OVER.
- NO NARRATION.
- NO WHISPERING.
- NO SINGING.
- NO HUMMING.
- NO LAUGHING.
- NO VOCALIZATIONS.
- NO BREATHING SOUNDS.
- NO LIP-SYNC.
- NO MOUTH MOVEMENTS SUGGESTING SPEECH.
- NO BACKGROUND VOICES.
- NO MUSIC.
- NO SOUND EFFECTS.
- NO AMBIENT AUDIO.

The model performs only silent physical clothing-presentation movements.

Her mouth must remain naturally still, with no talking or speech-like facial movements.

**DO NOT GENERATE, SYNTHESIZE OR ADD ANY HUMAN VOICE OR AUDIO WHATSOEVER.**

The final video must contain absolutely no audible content: no voice, no speech, no music and no sounds.

## 10. CLEAN VIDEO — NO GRAPHIC ELEMENTS

- No text.
- No captions.
- No subtitles.
- No emojis.
- No stickers.
- No graphic overlays.
- No transitions.
- No cuts.
- No scene changes.

One continuous mirror-selfie shot.

## 11. FINAL GENERATION REQUIREMENTS

Duration: exactly 10 seconds.

Aspect ratio: vertical 9:16.

Visual style: ultra-photorealistic mirror-selfie clothing showcase.

Audio: completely silent, absolutely no speech or human voice.

Camera angle: EXACTLY the same as the attached reference photograph.

Camera position: completely fixed.

Smartphone: permanently locked in its original position.

Free hand: performs the thigh and dress-fabric presentation.

Legs: perform the prescribed bending, straightening, forward extension and lateral displacement.

Dress: exact fidelity to the attached product reference.

Fabric interaction: clearly visible grasp, gentle sideways pull and natural release.

Hemline: permanently maintained at its original height.

Framing: absolute fidelity to the attached model photograph.

Movement priority: maximum choreography accuracy and visual clarity.

**FINAL DIRECTIVE:**

Reproduce the clothing demonstration in the exact order described.

The most important actions are the initial bent-leg pose, the hand resting on the upper thigh, the gradual leg straightening, the return of the feet toward each other, the hand approaching the dress, the forward leg extension, the diagonal lateral foot movement, the visible hand passage along the fabric and the final dress-pulling gesture.

The model must actually grasp the dress fabric and pull it gently outward and sideways.

The fabric pull must be clearly visible, but the dress must NEVER be lifted.

**NO UPWARD MOVEMENT OF THE SKIRT. NO RAISING THE HEMLINE. NO LIFTING THE DRESS.**

The original dress length and coverage must remain unchanged throughout the entire video.

Do not invent additional choreography, exaggerated movements or unnecessary turns.

**NEVER CHANGE THE CAMERA ANGLE FROM THE ATTACHED REFERENCE PHOTOGRAPH.**

The model may move naturally, but the camera viewpoint, camera height, camera tilt, mirror perspective and original framing must remain unchanged throughout the entire video.

**ABSOLUTELY NO SPEECH, NO TALKING, NO DIALOGUE, NO NARRATION, NO HUMAN VOICE, NO MUSIC AND NO SOUND EFFECTS.**

**THE VIDEO MUST BE COMPLETELY SILENT FROM BEGINNING TO END. THE MODEL MUST NEVER SPEAK.**

The final result must look like the same model performing the same natural choreography, from the exact same reference camera angle, while wearing the exact dress supplied in the product reference photograph.`,
  },
  {
    id: 'mestra_nay',
    number: 4,
    shortName: '04. Saia Thai',
    cardTitle: '04. SAIA THAI — TROCA DE PESO ÁGIL + CINTURA + PUXADA NA SAIA',
    objective:
      'Objetivo: movimentos ágeis alternando o peso nas pernas, apresentação da cintura/cinto e puxada lateral nítida na saia.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/vip/8+Thai+saia+by+flow+v2.mp4',
    categories: ['mirror_selfie', 'com_rosto'],
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
    movementPromptText: `# MASTER PROMPT — THAI SKIRT v3
## FASTER MOVEMENTS | PRONOUNCED WEIGHT SHIFTS | CLEAR SKIRT PULL | ABSOLUTE SILENCE | 10 SECONDS

Create a 10-second ultra-realistic vertical 9:16 mirror-selfie clothing showcase video.

The highest priority is reproducing the choreography with faster, more evident and clearly distinguishable movements.

The model must perform the actions with natural speed and confidence. Avoid slow-motion gestures, excessive pauses and barely noticeable movements.

**MAINTAIN THE EXACT CAMERA ANGLE OF THE ATTACHED REFERENCE PHOTOGRAPH.**

## 1. EXACT MOVEMENT CHOREOGRAPHY — FOLLOW THIS SEQUENCE

**0.0–0.5 SECONDS — INITIAL CROSSED-LEG POSE**

The model begins facing the mirror with one foot slightly crossed in front of the other. Her hips are naturally displaced to one side.

Immediately begin a subtle but visible adjustment of her body weight.

**0.5–1.2 SECONDS — QUICK FOOT ADJUSTMENT AND WEIGHT TRANSFER**

The model quickly repositions one foot, shifting her body weight onto the opposite leg.

Make the change of support clearly visible: one leg becomes the supporting leg while the other relaxes slightly, with a corresponding movement of the hips.

Do not make this merely a small ankle movement.

**1.2–2.0 SECONDS — HAND MOVES TOWARD THE WAIST**

The free hand rises naturally toward the front waistband of the skirt.

The palm makes contact with the fabric and moves horizontally across the waistband in a clear, deliberate gesture.

**2.0–2.7 SECONDS — BELT AND BUCKLE PRESENTATION**

The fingers move across the center-front belt and buckle, briefly highlighting the detail.

The gesture must be visible and fluid. Do not unfasten or deform the belt.

**2.7–3.3 SECONDS — HAND RELEASE AND DESCENT**

The free hand leaves the waistband and descends naturally along the side of the skirt.

The movement must be continuous and clearly visible.

**3.3–4.2 SECONDS — FIRST PRONOUNCED WEIGHT TRANSFER**

The model transfers her body weight decisively from one leg to the other.

The supporting leg changes visibly. Her hips shift toward the newly supporting leg, while the opposite knee relaxes.

The movement must involve the feet, knees and hips together.

**4.2–5.0 SECONDS — QUICK LATERAL FOOT REPOSITIONING**

The model moves one foot outward to the side, visibly opening her stance.

As the foot lands, her body weight adjusts naturally. The skirt responds with a noticeable but realistic fabric swing.

**5.0–5.8 SECONDS — SECOND WEIGHT TRANSFER**

The model transfers her weight back toward the opposite leg.

Make the alternating support unmistakable: one leg supports the body, then the other takes over.

Her hips must visibly move from one side to the other as a natural consequence of the weight transfer.

**5.8–6.6 SECONDS — HAND PASSES DOWN THE SKIRT**

The free hand moves toward the upper portion of the skirt and glides down along the fabric.

The palm visibly travels over the garment, demonstrating its texture, fit and drape.

Do not make this a stationary touch.

**6.6–8.3 SECONDS — CLEAR AND PRONOUNCED SKIRT PULL**

IMPORTANT: The model uses her free hand to grasp a small section of the skirt fabric around the upper thigh area.

She pulls the fabric outward and slightly sideways, away from her leg, making the pulling action clearly visible.

The pull must be more pronounced than a simple fabric touch or tiny adjustment.

The fabric must visibly move away from the body, creating a noticeable change in its position and folds.

Hold the fabric briefly, then release it naturally.

Do not lift the skirt excessively, expose additional body areas or change the garment's original length and construction.

**8.3–10.0 SECONDS — FINAL FRONTAL PRESENTATION AND WEIGHT ADJUSTMENT**

After releasing the skirt, the model makes one final visible weight transfer between her legs.

She settles into a natural asymmetrical frontal stance, with one foot slightly ahead of the other.

The skirt moves naturally and gradually settles.

Finish facing the mirror, presenting the garment clearly.

## 2. MOVEMENT SPEED AND INTENSITY — VERY IMPORTANT

The choreography must be performed at a moderately fast, natural pace.

- Reduce unnecessary pauses between movements.
- Avoid slow-motion gestures.
- Make each action more decisive and visually evident.
- The feet must visibly change position.
- The supporting leg must clearly alternate.
- The hips must respond to each weight transfer.
- The hand must travel visibly across the waistband and skirt.
- The skirt pull must create a noticeable outward displacement of the fabric.
- Do not replace the pulling action with simply touching the skirt.
- Do not freeze between movements.

Each movement must be distinct, but transitions must remain fluid.

## 3. BODY-WEIGHT TRANSFER — CRITICAL

The alternation of support between the legs is one of the most important elements of this choreography.

The model must visibly transfer her body weight from one supporting leg to the other.

When transferring weight:

- The supporting foot remains grounded.
- The opposite knee relaxes.
- The hips shift toward the supporting leg.
- The torso makes a subtle natural adjustment.
- The legs visibly change their relationship and positioning.

The viewer must be able to recognize that the model has changed which leg supports her body.

Do not simulate weight transfer using only hip swaying while both legs remain in exactly the same position.

## 4. SKIRT PULL — CLEAR FABRIC INTERACTION

The skirt-pulling gesture must be stronger and more evident than the other fabric-touching movements.

The model must actually grasp the skirt fabric with her fingers and pull it outward, away from the thigh.

Show three distinct stages:

1. Her hand approaches and grasps the fabric.
2. She pulls the fabric outward, visibly displacing it.
3. She releases it and allows it to return naturally.

The pulling action must be unmistakable.

Do not pull the waistband, belt or upper clothing.

Do not lift the skirt upward.

Preserve the original skirt length, shape, color and construction.

## 5. ABSOLUTE CAMERA ANGLE LOCK

MAINTAIN THE EXACT CAMERA ANGLE OF THE ATTACHED REFERENCE PHOTOGRAPH.

Preserve exactly:

- Original camera height.
- Original camera tilt.
- Original camera orientation.
- Original mirror perspective.
- Original camera-to-mirror distance.
- Original framing and crop.
- Original visible body area.
- Original model positioning.

The camera must remain completely stationary.

No zooming, panning, tilting, reframing or camera movement.

The model moves within the frame. The camera does not move.

## 6. SMARTPHONE POSITION LOCK

The smartphone must remain in exactly the same hand and position established by the attached reference photograph.

- Never change hands.
- Never lower or reposition the phone.
- Never rotate the smartphone.
- Never use the phone-holding hand to touch the clothing.

Only the free hand may interact with the skirt.

## 7. ABSOLUTE SKIRT PRODUCT FIDELITY

The attached product photograph is the single source of truth.

Preserve exactly:

- Original skirt color and color temperature.
- Original fabric material and texture.
- Original waistband construction.
- Belt and buckle details, if present.
- Original skirt length.
- Original silhouette.
- Original flare and volume.
- Original hemline.
- Side seams and stitching.
- Pockets and decorative details, if present.

Do not redesign, recolor, simplify or invent garment details.

The skirt must remain visually identical throughout the entire video.

## 8. NATURAL HUMAN MOVEMENT AND FABRIC PHYSICS

All movements must look like genuine human movements.

Prioritize:

- Natural finger articulation.
- Realistic wrist and elbow movement.
- Clear foot placement.
- Visible changes in leg support.
- Believable weight transfers.
- Natural hip displacement.
- Realistic fabric tension when pulling.
- Natural fabric folds and recovery.

The skirt must respond visibly when pulled and return naturally after release.

Avoid robotic movements, stiff joints, exaggerated dancing, artificial fabric stretching and sudden acceleration.

## 9. ABSOLUTE SILENCE — NO SPEECH, NO VOICE, NO AUDIO

**THE VIDEO MUST BE COMPLETELY SILENT FROM THE FIRST FRAME TO THE LAST FRAME.**

The model MUST NOT SPEAK UNDER ANY CIRCUMSTANCES.

STRICTLY FORBIDDEN:

- NO SPEECH.
- NO TALKING.
- NO SPOKEN WORDS.
- NO DIALOGUE.
- NO CONVERSATION.
- NO HUMAN VOICE.
- NO VOICE-OVER.
- NO NARRATION.
- NO WHISPERING.
- NO SINGING.
- NO HUMMING.
- NO LAUGHING.
- NO VOCALIZATIONS.
- NO BREATHING SOUNDS.
- NO LIP-SYNC.
- NO MOUTH MOVEMENTS SUGGESTING SPEECH.
- NO BACKGROUND VOICES.
- NO MUSIC.
- NO SOUND EFFECTS.
- NO AMBIENT AUDIO.

The model performs only silent physical clothing-presentation movements.

Her mouth must remain naturally still, with no talking or speech-like facial movements.

**DO NOT GENERATE, SYNTHESIZE OR ADD ANY HUMAN VOICE OR AUDIO WHATSOEVER.**

The final video must contain absolutely no audible content: no voice, no speech, no music and no sounds.

## 10. CLEAN VIDEO — NO GRAPHIC ELEMENTS

- No text.
- No captions.
- No subtitles.
- No emojis.
- No stickers.
- No graphic overlays.
- No transitions.
- No cuts.
- No scene changes.

One continuous mirror-selfie shot.

## 11. FINAL GENERATION REQUIREMENTS

Duration: exactly 10 seconds.

Aspect ratio: vertical 9:16.

Visual style: ultra-photorealistic mirror-selfie clothing showcase.

Camera: fixed, exact reference angle.

Smartphone: permanently locked in its original position.

Movement speed: moderately fast, natural and continuous.

Legs: clearly alternate supporting weight.

Hips: visibly respond to changes in support.

Free hand: performs distinct waistband and skirt gestures.

Skirt pull: clearly grasps and pulls fabric outward at upper-thigh level.

Garment: absolute fidelity to the attached product photograph.

Audio: COMPLETE SILENCE.

**FINAL DIRECTIVE:**

Prioritize faster and more evident movements without making them robotic.

The alternating support between the legs must be unmistakable, with visible changes in foot positioning, knees and hips.

The hand must clearly travel over the waistband and down the skirt.

The final skirt pull must be a real grasp-and-pull action, visibly moving the fabric outward from the upper thigh. Do not replace it with a simple touch.

Use the entire 10-second duration efficiently. Avoid unnecessary static poses and pauses.

Maintain absolute camera stability, smartphone position and skirt fidelity throughout the video.

**ABSOLUTELY NO SPEECH. NO TALKING. NO HUMAN VOICE. NO NARRATION. NO MUSIC. NO SOUND EFFECTS. NO BACKGROUND AUDIO. NO AUDIO OF ANY KIND.**

**THE MODEL MUST NEVER SPEAK. THE VIDEO MUST BE COMPLETELY SILENT FROM BEGINNING TO END.**`,
  },
  {
    id: 'mestra_catza',
    number: 5,
    shortName: '05. Macacão Thai',
    cardTitle: '05. MACACÃO THAI — TROCA DE APOIO + DUAS PUXADAS + GIRO 70–90°',
    objective:
      'Objetivo: alternar apoio entre pernas, percorrer coxa e abdômen com duas puxadas suaves e girar 70–90° de perfil.',
    videoUrl:
      'https://excursaomdr.s3.sa-east-1.amazonaws.com/VIDEOS+GALERIA+AURORA/vip/6+Thai+macacao+BY+FLOW+COMPLETO+v3.mp4',
    categories: ['mirror_selfie', 'com_rosto'],
    primaryCategory: 'mirror_selfie',
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
    movementPromptText: `# MASTER PROMPT — THAI 6 MACACÃO v3

## CLEAR MOVEMENT REPLICATION | MIRROR SELFIE | 10 SECONDS

Create a 10-second ultra-realistic vertical 9:16 mirror-selfie clothing showcase video.

The absolute highest priority is reproducing the choreography below with clearly visible, deliberate and natural movements.

Every gesture must have a recognizable beginning, execution and completion. Do not reduce movements to barely perceptible micro-movements.

The attached model photograph defines the model's appearance, body proportions, initial posture, smartphone position, camera framing, mirror perspective and environment.

The attached product photograph defines the exact jumpsuit that must be worn throughout the entire video.

## 1. EXACT MOVEMENT CHOREOGRAPHY — FOLLOW THIS SEQUENCE

**0.0–0.7 SECONDS — INITIAL ASYMMETRICAL STANCE AND WEIGHT TRANSFER**

The model begins facing the mirror in a relaxed frontal position.

One leg is slightly bent and positioned ahead of the other. Her body weight rests predominantly on one supporting leg, creating a natural asymmetrical silhouette.

She makes a clearly perceptible weight adjustment, transferring part of her body weight from one leg to the other. The hips move naturally in response to the change of support.

The movement must be visible in the positioning of her hips, knees and legs, not just a subtle torso movement.

**0.7–1.6 SECONDS — HAND TOUCHES AND GLIDES OVER THE UPPER THIGH**

The free hand moves downward and makes contact with the upper lateral portion of the thigh.

The palm gently touches the jumpsuit fabric and glides along the upper thigh in a smooth downward-to-diagonal movement.

The fingers remain naturally extended and relaxed.

Make the hand movement sufficiently wide and visible to clearly demonstrate the fabric and fit of the jumpsuit.

**1.6–2.3 SECONDS — GENTLE FABRIC PULL AT THE UPPER THIGH**

The model gently catches a small section of the jumpsuit fabric at the upper thigh, slightly below the hip.

She makes a soft outward pull, moving the fabric a short distance away from her leg to demonstrate its drape and flexibility.

This must be a delicate but clearly visible pulling action.

Do not pull aggressively, deform the garment or change its original construction.

Release the fabric naturally.

**2.3–3.2 SECONDS — HAND MOVES UP TOWARD THE ABDOMEN**

The free hand leaves the thigh and travels diagonally upward toward the front abdominal area.

The elbow bends naturally.

The palm makes visible contact with the fabric around the waist and abdomen.

The entire transition must be visible. Do not teleport the hand between positions.

**3.2–4.2 SECONDS — CLEAR HAND PASSAGE ACROSS THE ABDOMEN AND WAIST**

The palm glides horizontally across the front of the abdomen, following the natural waistline of the jumpsuit.

The hand travels visibly from one side toward the other, gently following the contours of the garment.

The fingers remain relaxed and naturally separated.

This must be a complete, deliberate hand-passing gesture, not a stationary touch.

Briefly emphasize the waist construction through natural contact with the fabric.

**4.2–5.0 SECONDS — HAND DESCENDS ALONG THE GARMENT**

After completing the abdominal movement, the hand travels downward from the waist toward the hip and upper thigh.

The palm gently passes over the jumpsuit fabric, following the line of the body.

The hand must visibly travel along the garment.

Do not skip this movement or abruptly lower the arm.

**5.0–5.8 SECONDS — ALTERNATING LEG SUPPORT**

The model clearly transfers her body weight onto the opposite supporting leg.

One knee relaxes while the other leg becomes more firmly grounded.

The hips shift naturally toward the supporting leg, creating a visible change in the body's silhouette.

This must look like a genuine change of support between the legs, not exaggerated dancing.

**5.8–6.5 SECONDS — FOOT REPOSITIONING AND SECOND WEIGHT TRANSFER**

The model makes a small but noticeable adjustment with one foot, moving it slightly forward or outward.

As the foot lands, her body weight transfers naturally.

The opposite leg relaxes and the hips adjust to the new supporting position.

The jumpsuit fabric follows the movement naturally.

**6.5–7.3 SECONDS — FINAL FRONTAL GARMENT PRESENTATION**

The model remains facing the mirror.

Her free hand moves toward the lower portion of the jumpsuit, approaching the fabric around the upper leg area.

She makes another natural, visible hand passage over the garment, preparing to demonstrate the lower fabric.

**7.3–8.5 SECONDS — GENTLE PULL ON THE LOWER JUMPSUIT FABRIC**

IMPORTANT: Before performing the turn, the model gently holds a small section of the lower jumpsuit fabric around the upper thigh area.

She pulls the fabric slightly outward and away from her leg, creating a visible but delicate stretch.

The pulling action must be clearly distinguishable from simply touching or brushing the fabric.

Hold the fabric momentarily, then gently release it.

The fabric returns naturally to its original position.

Do not pull the garment excessively, do not lift it and do not change its length or construction.

**8.5–10.0 SECONDS — CLEAR SIDE TURN**

Immediately after releasing the fabric, the model begins a noticeable side rotation.

She rotates her hips, waist, shoulders and torso together toward the side.

The turn must be clearly visible and more pronounced than a simple three-quarter pose.

She should reach approximately 70–90 degrees from her original frontal position, showing a genuine side profile of the jumpsuit.

The side silhouette must be recognizable, allowing the viewer to appreciate the garment's fit around the waist, hips and legs.

Do not perform a full spin.

End with the model visibly turned to the side.

## 2. MOVEMENT INTENSITY — CRITICAL

All movements must be more evident and perceptible than subtle everyday micro-adjustments.

Pay special attention to:

- Clearly alternating body weight between the supporting legs.
- Visible hip displacement when changing leg support.
- Noticeable changes in knee positioning.
- Natural but clearly visible foot repositioning.
- Complete hand passages over the jumpsuit fabric.
- The hand traveling from the upper thigh toward the abdomen.
- The palm gliding across the waist and abdomen.
- The hand descending along the garment.
- A gentle, visible fabric pull at the upper thigh.
- A second gentle fabric pull immediately before the final side turn.
- A pronounced side rotation.

Each action must be visually distinct.

Do not merge multiple gestures into one vague movement.

Do not make the model freeze between actions.

Maintain continuous, fluid transitions while preserving the individual identity of every gesture.

## 3. SMARTPHONE POSITION — ABSOLUTE LOCK

The smartphone must remain in exactly the same hand and position established by the attached reference photograph throughout the entire video.

The smartphone must NEVER:

- Change hands.
- Be lowered.
- Be raised to a different height.
- Move sideways.
- Rotate to another angle.
- Leave its original position.
- Be used to interact with the garment.

The smartphone-holding arm maintains its original natural posture.

ONLY THE FREE HAND may touch or demonstrate the jumpsuit.

## 4. REFERENCE FRAMING AND CAMERA LOCK

MAINTAIN THE EXACT CAMERA ANGLE OF THE ATTACHED MODEL PHOTOGRAPH.

The reference camera angle is BELOW THE CHIN.

Preserve exactly:

- Original camera height.
- Original camera angle.
- Original crop below the chin.
- Original mirror perspective.
- Smartphone position.
- Distance from the mirror.
- Visible body area.
- Model positioning.

Do not reveal more of the model's face than the reference photograph.

The camera must remain completely stationary.

No zoom, panning, tilting, reframing, camera movement or artificial camera shake.

The model moves within the frame. The camera does not move.

## 5. ABSOLUTE JUMPSUIT PRODUCT FIDELITY

The attached product photograph is the single source of truth.

Reproduce the exact jumpsuit with maximum possible visual fidelity.

Preserve:

- Original garment color and color temperature.
- Fabric texture and material.
- Neckline and straps.
- Bodice construction.
- Original waistline.
- Front cutouts, if present.
- Original silhouette and proportions.
- Waist shaping.
- Trouser construction.
- Leg width and volume.
- Original length.
- Cuffs and ankle finishing, if present.
- Seams, stitching and decorative details.
- Every visible structural feature.

Do not redesign, reinterpret, simplify or improve the garment.

Do not invent additional cutouts, straps, seams, openings or decorative elements.

The jumpsuit must remain identical from the first frame to the last frame.

The model's movements must adapt to the actual garment, NEVER the opposite.

## 6. NATURAL HUMAN MOVEMENT AND FABRIC PHYSICS

All movements must look like genuine human movements recorded in a real mirror-selfie video.

Prioritize:

- Natural finger articulation.
- Realistic elbow and wrist movement.
- Smooth hand movement across the fabric.
- Anatomically correct hand positioning.
- Natural leg articulation.
- Realistic foot placement.
- Clearly perceptible weight transfers.
- Natural hip movement.
- Realistic fabric folds.
- Authentic jumpsuit fabric behavior.

When the model pulls the fabric, it must respond naturally and return to its original position after release.

Do not allow the fabric to become rigid, stretch unnaturally, change its volume or transform its original construction.

Avoid robotic movements, exaggerated dancing, stiff joints and sudden acceleration.

## 7. AUDIO AND VISUAL RESTRICTIONS

ABSOLUTELY NO SPEECH.

No dialogue, narration, voice-over, spoken words or lip-sync.

No music, sound effects or vocalizations.

No subtitles, captions, headlines, promotional text, stickers or graphic overlays.

Generate a clean, realistic fashion showcase.

## 8. FINAL GENERATION REQUIREMENTS

Duration: exactly 10 seconds.

Aspect ratio: vertical 9:16.

Visual style: ultra-photorealistic mirror-selfie clothing showcase.

Camera: fixed mirror perspective, below-chin framing.

Smartphone: permanently locked in its original position.

Free hand: performs all clothing interactions.

Legs: perform visible and natural repositioning.

Weight distribution: clearly alternates between the supporting legs.

Fabric interaction: visible hand passages and two gentle pulling gestures.

Final movement: pronounced side turn after releasing the lower fabric.

Garment: absolute fidelity to the attached jumpsuit reference.

Framing: absolute fidelity to the attached model photograph.

**FINAL DIRECTIVE:**

Do not replace the described choreography with generic fashion posing.

The weight shifts must be clearly visible through the legs and hips. The hand must visibly travel over the jumpsuit, touching the upper thigh, moving across the abdomen and descending along the garment.

Include the first gentle fabric pull at the upper thigh and the second gentle pull on the lower jumpsuit fabric immediately before the side turn.

The final turn must be clearly perceptible, showing the side silhouette rather than a barely noticeable hip adjustment.

Every movement must be anatomically realistic, deliberate, clearly recognizable and smoothly connected.

Maintain the exact reference camera angle BELOW THE CHIN, the original smartphone position and absolute jumpsuit product fidelity.`,
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

/**
 * Seleciona automaticamente o prompt de movimento ideal de acordo com o nome da peça:
 * - Vestido -> Prompt 3 (Vestido Thai)
 * - Calça -> Prompt 2 (Calça Thai)
 * - Saia -> Prompt 4 (Saia Thai)
 * - Macacão / Macaquinho -> Prompt 5 (Macacão Thai)
 * - Conjunto ou qualquer outra peça -> Prompt 1 (Conjunto Thai)
 */
export function resolveMasterPromptByProductName(productName?: string): AnaMariaMasterId {
  const norm = (productName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (!norm) return 'mestra_ana_maria';

  if (/\bconjunto(s)?\b/.test(norm)) {
    return 'mestra_ana_maria';
  }
  if (/\bvestid(o|os|inho|inhos)\b/.test(norm)) {
    return 'mestra_duda';
  }
  if (/\bmacac(ao|oes|o|os|inho|inhos|a|inha)\b|\bjumpsuit\b/.test(norm)) {
    return 'mestra_catza';
  }
  if (/\bsaia(s)?\b/.test(norm)) {
    return 'mestra_nay';
  }
  if (/\bcalc(a|as)\b/.test(norm)) {
    return 'mestra_iara';
  }
  return 'mestra_ana_maria';
}

export function getDefaultMasterForMode(
  mode: AnaMariaPresentationMode,
  productName?: string
): AnaMariaMasterPromptItem {
  if (mode === 'pov') {
    return MASTER_PROMPTS_GALLERY.find((m) => m.id === 'pov_cinta_85k') || MASTER_PROMPTS_GALLERY[5];
  }
  return getMasterPromptById(resolveMasterPromptByProductName(productName));
}
