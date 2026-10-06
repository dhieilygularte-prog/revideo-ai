import { FIDELITY_BLOCK_TEXT } from '../config/models';

export interface UniversalVeoPromptOptions {
  sceneNumber: number;
  productType?: string; // e.g. "snack bag / packaging", "dress", "pants", "handbag", "footwear", "general product"
  variations: string[]; // e.g. ["Variação 1", "Variação 2"]
  environment?: string; // e.g. "clean studio kitchen countertop with soft natural morning light"
  interactionStyle?: string; // e.g. "held naturally by two hands displaying the front and side packaging"
  cameraType?: string;
  lighting?: string;
  secondTimeline?: string;
  speechVoiceover?: string;
}

/**
 * Builds the ultra-detailed structured English prompt for Google Veo
 * based on the master creative director production standards (ChatGPT/Claude guidelines)
 * completely eliminating hallucinations, locking wardrobe, floor, and exact product fidelity.
 */
export function buildVeoSingleParagraphPrompt(opts: UniversalVeoPromptOptions): string {
  const {
    sceneNumber,
    productType = 'commercial product',
    variations = ['Variação 1'],
    environment = 'modern indoor setting with natural room daylight, clean tile floor and full-length floor mirror with soft contact shadows',
    interactionStyle = 'worn or held naturally in frame with organic micro-movements, showing key details and textures from the front',
    cameraType = 'handheld smartphone POV camera style at eye level, 24mm mobile lens with authentic organic breathing sway',
    lighting = 'clean bright commercial daylight with natural soft specular highlights on materials and authentic reflections',
    secondTimeline,
    speechVoiceover,
  } = opts;

  const var1 = variations[0] || 'Variation 1';
  const var2 = variations[1] || var1;
  const var3 = variations[2] || (variations.length >= 3 ? variations[2] : var1);
  const hasMultiple = variations.length > 1;

  // Reference mapping block
  let refMapping = '';
  if (variations.length >= 3) {
    refMapping = `- Reference 1 (Image 1): Direct front camera-facing view of ${var1}
- Reference 2 (Image 2): Front three-quarter angle of ${var2}
- Reference 3 (Image 3): Front dynamic view of ${var3}`;
  } else if (hasMultiple) {
    refMapping = `- Reference 1 (Image 1): Direct front entrance view of ${var1}
- Reference 2 (Image 2): Front three-quarter angle of ${var2}
- Reference 3 (Image 3): Front dynamic movement of ${var2} on the same floor`;
  } else {
    refMapping = `- Reference 1 (Image 1): Direct front camera-facing angle of ${var1}
- Reference 2 (Image 2): Front three-quarter dynamic angle of ${var1}
- Reference 3 (Image 3): Front action close-up detail of ${var1}`;
  }

  // Timeline block
  let timelineSection = '';
  if (secondTimeline && secondTimeline.trim()) {
    timelineSection = secondTimeline.trim();
  } else if (hasMultiple) {
    timelineSection = `0.0–3.5 seconds: ${var1} showcased in full frontal detail with natural organic motion facing the camera/mirror.
3.5–4.5 seconds: Hard cut to a new independent take as the wearer steps forward, presenting ${var2} on the exact same floor.
4.5–8.0 seconds: ${var2} showcased clearly in the same environment with pristine focus and realistic physics.`;
  } else {
    timelineSection = `0.0–4.0 seconds: ${var1} showcased prominently facing forward towards camera, highlighting front toe box, upper, tongue, and solid shoelaces.
4.0–8.0 seconds: Gentle organic step and movement displaying front-three-quarter perspective, textures, and premium build.`;
  }

  const audioSection = speechVoiceover && speechVoiceover.trim()
    ? `Natural Brazilian Portuguese spoken dialogue only: "${speechVoiceover.trim().replace(/"/g, "'")}". No subtitles, captions or on-screen text.`
    : `No dialogue, no voiceover and no generated music. Music will be added later in editing.`;

  return `Create an eight-second photorealistic vertical 9:16 TikTok Shop product video.

Use the attached reference images to preserve the exact product identity. The product must retain the same shape, proportions, materials, texture, color placement, stitching, accessories, packaging and visible markings shown in the references. Do not redesign, simplify, replace, recolor or invent any product detail.

REFERENCE MAPPING:
${refMapping}

SCENE AND CAMERA:
Vertical 9:16 aspect ratio, eight seconds duration. Framing: eye-level mobile smartphone camera POV (${cameraType}), authentic room lighting (${lighting}). Environment: ${environment}. Model & Wardrobe: The exact person/model from reference image 2 is present in the scene, wearing the identical outfit throughout (exact pants style, exact pants fabric, cut, and color, exact socks and top). Zero outfit changes, zero color shifts in pants or clothing between scenes, zero alterations in model identity.

ACTION TIMELINE:
${timelineSection}

CONTINUITY & INVIOLABLE FIDELITY:
The product must be 100% identical to the reference photos: exact shoelace color, exact sole thickness, color and tread, exact eyelets, tongue, and upper materials. Zero invented stitching, zero contrast seams that do not exist in the reference. Real weight, natural physical contact with floor, realistic human anatomy. ${hasMultiple ? 'Never morph or change product colors in-place mid-shot; color changes happen strictly through hard cuts between takes or natural physical steps.' : ''}

RESTRICTIONS & NEGATIVES:
No face (when obscured in reference), no extra hands, no extra limbs, no floating objects, no distorted product, no hallucinated stitching, no shifted shoelace colors, no pink lace accents, no text overlay, no captions, no subtitles, no watermark, no interface.

AUDIO & DIALOGUE:
${audioSection}`;
}

/**
 * Builds the image generation prompt for Nano Banana Pro (gemini-3-pro-image)
 * with strict wardrobe, floor, and product consistency locks, eliminating fake stitching and wrong lace colors.
 */
export function buildUniversalSceneImagePrompt(
  productType: string,
  variationName: string,
  imageRole: string,
  environmentDescription: string,
  interactionDetails: string
): string {
  return `${FIDELITY_BLOCK_TEXT}

[FORMAT]: Vertical 9:16 mobile smartphone photography, authentic TikTok commercial product aesthetic.
[PRODUCT CATEGORY]: ${productType || 'commercial product'}.
[VARIATION]: "${variationName}".
[SCENE ROLE]: ${imageRole}.

[CRITICAL INVIOLABLE FIDELITY DIRECTIVES]:
1. PRODUCT FIDELITY FOR "${variationName}":
   - The product featured MUST match the reference photos for "${variationName}" with 100% microscopic precision (exact shape, packaging, label, logos, colors, materials and details).
   - ZERO INVENTED DETAILS: Do NOT add decorative stitching, fake textures, or extra elements that do not exist in the reference photo.
   - ZERO COLOR BLENDING: This image represents "${variationName}". Do not blend colors from other variations.

2. FRESH COMMERCIAL MODEL & LIFESTYLE CONTINUITY:
   - Present a fresh, stylish commercial model/person naturally interacting with or wearing the product (e.g. natural lifestyle TikTok aesthetic).
   - Never copy or clone competitor video frames or competitor identity. This must be an authentic, original high-quality commercial creative.
   - Natural, flattering attire that complements the product without distracting from it.

3. ENVIRONMENT & LIGHTING:
   - Setting: ${environmentDescription || 'modern clean lifestyle room with soft natural daylight'}.
   - Lighting: clean commercial daylight with natural soft contact shadows.

4. CAMERA-FACING PRODUCT ORIENTATION:
   - The product must be shown facing forward towards the camera/viewer, showcasing its main face, texture, and distinctive features clearly.

5. OPTICS & PURITY:
   - Authentic 24mm smartphone camera lens, sharp natural focus, authentic room specular highlights, zero digital post-processing artifacts.

6. ZERO ON-SCREEN HEADLINES, TEXT BOXES OR SUBTITLES (MANDATORY):
   - ZERO ON-SCREEN TEXT, ZERO HEADLINES, ZERO BLACK-BORDERED CAPTION BOXES, ZERO STICKERS, ZERO SUBTITLES!
   - The generated image must be a 100% clean, raw photograph with zero graphic text overlays (only authentic logos physically printed or sewn on the product are permitted).

7. NEGATIVE CONSTRAINTS:
   - Zero on-screen text, zero subtitles, zero graphic watermarks, zero distortion, zero competitor frame duplication.`;
}
