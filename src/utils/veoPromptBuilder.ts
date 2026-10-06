import { FIDELITY_BLOCK_TEXT } from '../config/models';

export interface SceneImageRefInfo {
  role: string;
  variationName?: string;
  targetAngle?: string;
  location?: string;
  actionDescription?: string;
}

export interface UniversalVeoPromptOptions {
  sceneNumber: number;
  totalScenes?: number;
  durationSeconds?: number; // 8s (Veo 3 Básico) ou 10s (Veo 3 Omni Flash)
  productType?: string; // Universal: roupas, calçados, utensílios, cosméticos, eletrônicos, etc.
  variations: string[]; // e.g. ["Variação 1", "Variação 2"]
  environment?: string; // e.g. "modern clean interior room with soft natural daylight"
  interactionStyle?: string; // e.g. "naturally held, demonstrated or worn with organic micro-movements"
  cameraType?: string;
  lighting?: string;
  secondTimeline?: string; // Linha do tempo ESPECÍFICA deste trecho temporal
  speechVoiceover?: string; // Fala ESPECÍFICA desta cena (sem repetição de cenas anteriores)
  sceneImages?: SceneImageRefInfo[]; // Imagens reais desta cena (3 imagens consecutivas)
  modelFraming?: 'neck_down' | 'show_face' | 'product_only';
  ctaText?: string;
}

/**
 * Constrói o prompt profissional em inglês para o Google Veo 3.1
 * Linha do tempo contínua por cena, sem repetição de ações ou falas,
 * universal para qualquer categoria de produto.
 * CTA estritamente na ÚLTIMA cena.
 */
export function buildVeoSingleParagraphPrompt(opts: UniversalVeoPromptOptions): string {
  const {
    sceneNumber,
    totalScenes = 1,
    durationSeconds = 8,
    productType = 'commercial product',
    variations = ['Variação 1'],
    environment = 'commercial setting matching reference video',
    interactionStyle = 'presented, worn, or demonstrated naturally with organic movement, highlighting key features, textures, and quality',
    cameraType = 'handheld smartphone POV camera style at eye level, 24mm mobile lens with authentic organic breathing sway',
    lighting = 'clean bright commercial daylight with natural soft specular highlights on materials and authentic reflections',
    secondTimeline,
    speechVoiceover,
    sceneImages,
    modelFraming,
    ctaText,
  } = opts;

  const varList = variations.length > 0 ? variations : ['Variação 1'];
  const var1 = varList[0] || 'Variação 1';
  const hasMultiple = varList.length > 1;

  // 1. Mapeamento dinâmico de referências conforme as imagens REAIS desta cena
  let refMapping = '';
  if (Array.isArray(sceneImages) && sceneImages.length > 0) {
    refMapping = sceneImages
      .map((img, idx) => {
        const vName = img.variationName || var1;
        const angle = img.targetAngle || 'perspective';
        const locDesc = img.location ? ` | Location: ${img.location}` : '';
        const actDesc = img.actionDescription ? ` | Action: ${img.actionDescription}` : '';
        return `- Reference ${idx + 1} (Image ${idx + 1}): ${img.role || `${vName} in ${angle} view`}${locDesc}${actDesc}`;
      })
      .join('\n');
  } else {
    // Fallback universal dinâmico
    refMapping = `- Reference 1 (Image 1): Key visual state of ${var1} for this scene segment`;
  }

  // 2. Linha do tempo contínua da cena
  let timelineSection = '';
  if (secondTimeline && secondTimeline.trim()) {
    timelineSection = secondTimeline.trim();
  } else if (sceneNumber === 1) {
    timelineSection = `0.0–4.0 seconds: Natural commercial opening introducing ${var1} in frame, displaying form, premium finish, and authentic design.
4.0–8.0 seconds: Dynamic smooth movement highlighting texture, construction details, and organic interaction.`;
  } else {
    timelineSection = `0.0–4.0 seconds: Seamless narrative continuation from previous scene, showcasing next action and angles of ${hasMultiple && varList[sceneNumber - 1] ? varList[sceneNumber - 1] : var1}.
4.0–8.0 seconds: Closer dynamic demonstration focusing on functionality, materials, and authentic appeal.`;
  }

  // 3. Fala/locução EXCLUSIVA desta cena (sem repetição global)
  const cleanSpeech = (speechVoiceover || '').trim().replace(/"/g, "'");
  const audioSection = cleanSpeech.length > 0
    ? `Natural spoken dialogue for this scene segment only: "${cleanSpeech}". Strictly no subtitles, captions or on-screen digital text.`
    : `No dialogue or spoken voiceover in this segment. Background ambient room sound and music track only.`;

  const continuationNote = sceneNumber > 1
    ? ` This is Scene ${sceneNumber} of ${totalScenes}: a direct sequential continuation from Scene ${sceneNumber - 1}. Do not restart the story or repeat previous actions.`
    : '';

  const isFinalScene = sceneNumber === totalScenes;
  const durationWord = durationSeconds === 10 ? 'ten-second' : 'eight-second';

  const framingDirective = modelFraming === 'neck_down'
    ? ' Framing is strictly neck-down (chest/hands/body), the presenter/model face is NOT visible.'
    : modelFraming === 'show_face'
    ? ' The presenter face and expression are visible and strictly match the model reference.'
    : '';

  const ctaSection = isFinalScene
    ? `\n\nCALL TO ACTION (FINAL SCENE EXCLUSIVE):\nConclude with a high-converting natural commercial call to action: ${ctaText || 'prompting the viewer to tap the cart/link below to purchase with free shipping'}.`
    : `\n\nCALL TO ACTION CONSTRAINTS:\nZero call to action in this scene segment. All CTAs belong strictly to the final scene.`;

  return `Create a ${durationWord} photorealistic vertical 9:16 TikTok Shop product video.${continuationNote}

Use the attached reference images to preserve exact product identity with microscopic fidelity. The product must retain the same shape, silhouette, packaging, labels, logos, materials, physical textures, seams, components, and colors shown in the references. Do not redesign, simplify, alter, recolor or hallucinate any detail.

REFERENCE MAPPING FOR THIS SCENE:
${refMapping}

SCENE, ENVIRONMENT AND MODEL CONTINUITY (BRAZILIAN RELATABLE REALISM):
Vertical 9:16 aspect ratio, ${durationWord} duration. Framing: ${cameraType}.${framingDirective} Lighting: ${lighting}. Setting: ${environment}. If set in a residential/home environment (living room, bedroom, kitchen, porch, etc.), it must depict a normal, simple everyday Brazilian home with realistic, cozy, relatable everyday interior decor (strictly non-luxury, non-mansion, non-hyper-instagrammed). If a model/presenter is featured, portray a relatable everyday Brazilian person (man or woman) with natural, authentic everyday appearance (approachable, genuine, relatable persona, non-supermodel), maintaining the EXACT SAME person's identity (identical face, hair, skin tone, body type) across all scenes and images. The model dynamically moves through the authentic sequence of locations and actions established in the reference video storyboard.

ACTION PROGRESSION FOR THIS SCENE SEGMENT:
${timelineSection}

UNIVERSAL PRODUCT FIDELITY & PHYSICALITY:
100% faithful to the real product references. Natural physics, authentic weight and material behavior (e.g. fabric drape, rigid packaging, metallic reflections, leather grain, or matte surface). Never morph colors in-place mid-shot; any variation transition must happen via physical steps or cuts between takes.

AUDIO & DIALOGUE (THIS SCENE ONLY):
${audioSection}${ctaSection}

RESTRICTIONS & NEGATIVES:
Zero on-screen text overlays, zero subtitles, zero black caption boxes, zero digital badges, zero UI elements, zero watermarks, zero tattoos or body ink, zero distorted anatomy, zero hallucinated logos or fake details, zero luxury mansion aesthetics.`;
}

/**
 * Constrói o prompt para geração de imagem de referência da cena,
 * suportando qualquer ângulo dinâmico (frente, costas/rear, lateral, detalhe, demonstração)
 * para qualquer categoria de produto, travando o mesmo modelo e dinamizando o cenário conforme o vídeo de referência.
 */
export function buildUniversalSceneImagePrompt(
  productType: string,
  variationName: string,
  imageRole: string,
  imageLocation: string,
  interactionDetails: string,
  targetAngle: string = 'front',
  modelFraming?: 'neck_down' | 'show_face' | 'product_only',
  productInfo?: string,
  imageAction?: string,
  hasUserProvidedModel: boolean = false
): string {
  // Tradução e diretriz precisa do ângulo solicitado pelo storyboard
  let angleDirective = '';
  const cleanAngle = (targetAngle || '').toLowerCase();

  if (cleanAngle === 'rear' || cleanAngle === 'back' || cleanAngle.includes('costas') || cleanAngle.includes('traseira')) {
    angleDirective = `TARGET ANGLE: Direct rear/back angle view facing away from camera or showing the authentic back side of the product (back design, rear seams, rear labels, or back profile) exactly as in reference photos.`;
  } else if (cleanAngle === 'side' || cleanAngle.includes('lateral')) {
    angleDirective = `TARGET ANGLE: Side profile perspective angle, showcasing product silhouette, side contours, depth, and edge craftsmanship.`;
  } else if (cleanAngle === 'detail' || cleanAngle === 'front_detail' || cleanAngle.includes('detalhe') || cleanAngle.includes('close')) {
    angleDirective = `TARGET ANGLE: Close-up macro detail action view, highlighting fine texture, authentic materials, stitching, prints, and authentic craftsmanship.`;
  } else if (cleanAngle === 'front_side' || cleanAngle.includes('3/4') || cleanAngle.includes('tres_quartos')) {
    angleDirective = `TARGET ANGLE: Front-three-quarter dynamic angle facing towards camera, showcasing both front and lateral depth simultaneously.`;
  } else {
    angleDirective = `TARGET ANGLE: Direct frontal view clearly presenting the front face, primary features, and main branding of the product.`;
  }

  const framingRule = modelFraming === 'neck_down'
    ? '\n   - MANDATORY FRAMING: NECK-DOWN ONLY (chest, hands, torso). Do NOT show the head or face of the model, strictly matching the headless framing of the reference video.'
    : modelFraming === 'show_face'
    ? (hasUserProvidedModel
        ? '\n   - MANDATORY FRAMING: FACE VISIBLE. Show the model\'s face and expression matching the user\'s provided model photo reference.'
        : '\n   - MANDATORY FRAMING: FACE VISIBLE WITH UNIQUE ORIGINAL IDENTITY (ANTI-VIOLATION TIKTOK RULE). Do NOT clone the face of the actor in the competitor reference video! Create a relatable everyday Brazilian person (man or woman) with a natural, authentic everyday look (genuine, approachable, non-supermodel appearance) with a DIFFERENT FACE and distinct facial features (different eyes, nose, smile, facial bone structure, or subtle variation in hair/skin tone—similar demographic vibe like a cousin, but strictly a different individual to prevent TikTok copyright/impersonation strikes).')
    : '';

  const prodInfoBlock = productInfo && productInfo.trim()
    ? `\n[PRODUCT DETAILS & SPECIFICATIONS]: ${productInfo.trim()}\n`
    : '';

  return `${FIDELITY_BLOCK_TEXT}

[FORMAT]: Vertical 9:16 mobile smartphone photography, authentic TikTok commercial aesthetic.
[PRODUCT CATEGORY]: ${productType || 'commercial product'}.
[VARIATION]: "${variationName}".
[SCENE ROLE]: ${imageRole}.

[CRITICAL INVIOLABLE FIDELITY DIRECTIVES]:
1. 1:1 PHYSICAL PRODUCT FIDELITY FOR "${variationName}":
   - The product featured MUST match the reference photos for "${variationName}" with microscopic fidelity (exact geometry, packaging, labels, logos, typography, materials, textures, and colors).
   - ZERO INVENTED DETAILS: Do NOT invent or add elements that do not exist in the reference photos.
   - ZERO COLOR MIXING: Match the solid colors and finishes of the reference photo for "${variationName}".

2. MANDATORY SAME MODEL LOCK, BRAZILIAN REALISM & DYNAMIC SCENARIO FROM REFERENCE VIDEO:
   - MODEL IDENTITY & ANTI-VIOLATION RULE:
     * If user uploaded a model photo: feature that exact person with 100% fidelity.
     * If NO model photo was provided: generate an original commercial talent featuring a RELATABLE EVERYDAY BRAZILIAN PERSON (man or woman) with a natural, authentic everyday look (approachable, genuine, non-supermodel, realistic everyday appearance) and a DIFFERENT FACE than the competitor's reference video (similar demographic vibe/cousin-like, but strictly a different individual with distinct facial features to avoid TikTok copyright/impersonation strikes).
     * ZERO TATTOOS: Clean natural skin, strictly zero tattoos, zero body ink, and zero body art on the model (man or woman).
     * SAME MODEL CONSISTENCY: Once this talent is created, maintain the EXACT SAME human individual (identical face, eyes, hair, skin tone, body type) across all images generated for this video. Never switch models between scenes or images.${framingRule}
   - SCENARIO & LOCATION FOR THIS IMAGE: ${imageLocation || 'authentic commercial setting matching the reference video'}.
     * BRAZILIAN HOME REALISM: If this scene takes place in a home/residence (bedroom, living room, kitchen, balcony, backyard, porch), it MUST depict a simple, authentic everyday Brazilian home (normal realistic furniture, cozy relatable decor, strictly NO luxury mansions, NO hyper-instagrammed lofts, NO unrealistic high-end foreign architecture). Lojas and retail stores can be neat and organized.
   - ACTION FOR THIS IMAGE: ${imageAction || interactionDetails || 'naturally presenting, wearing, holding or demonstrating the product'}.
   - Lighting: authentic commercial lighting matching the location with natural soft contact shadows.${prodInfoBlock}

3. ANGLE & ORIENTATION FROM STORYBOARD:
   - ${angleDirective}

4. OPTICS & PURITY:
   - Sharp 24mm smartphone lens focus, natural room lighting, zero digital distortion.

5. ZERO ON-SCREEN HEADLINES OR TEXT OVERLAYS (MANDATORY):
   - ZERO ON-SCREEN TEXT, ZERO HEADLINES, ZERO BLACK-BORDERED CAPTION BOXES, ZERO STICKERS, ZERO SUBTITLES!
   - The photograph must be 100% clean and raw. Digital headlines will be added later during video editing. Only authentic logos physically printed or sewn on the product are permitted.

6. NEGATIVE CONSTRAINTS:
   - Zero on-screen text, zero subtitles, zero watermarks, zero tattoos or body ink, zero duplicate competitor frames, zero distorted product features, zero luxury mansions, zero hyper-instagrammed fake aesthetics.`;
}
