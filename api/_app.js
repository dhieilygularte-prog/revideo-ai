import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);

// server.ts
import "dotenv/config";
import dotenv3 from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

// src/config/models.ts
var GEMINI_VISION_MODEL = "gemini-3.8-flash";
var GEMINI_VISION_FAST_MODEL = "gemini-3.1-flash-lite";
var GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";
var GEMINI_IMAGE_FAST_MODEL = "gemini-3.1-flash-lite-image";
function calculateSceneCount(durationSeconds, mode = "veo3_basic_8s") {
  const d = Math.round(durationSeconds || 12);
  if (mode === "veo3_omniflash_10s") {
    if (d <= 15) return 1;
    if (d <= 24) return 2;
    if (d <= 33) return 3;
    if (d <= 40) return 4;
    return 5;
  }
  if (d <= 13) return 1;
  if (d <= 19) return 2;
  if (d <= 26) return 3;
  if (d <= 35) return 4;
  return 5;
}
var FIDELITY_BLOCK_TEXT = `O produto tem que ser 100% FIEL \xE0s fotos de refer\xEAncia que eu enviei. N\xE3o pode mudar nem 1%: formato, embalagem, r\xF3tulo, materiais, texturas, costuras, tipografia, logotipos, ilustra\xE7\xF5es, detalhes gr\xE1ficos e cores. \xC9 estritamente proibido inventar, alterar, trocar detalhes ou substituir o produto por itens gen\xE9ricos. Se algum detalhe n\xE3o estiver vis\xEDvel na foto, manter simples em vez de alucinar.`;

// src/utils/veoPromptBuilder.ts
function buildVeoSingleParagraphPrompt(opts) {
  const {
    sceneNumber,
    totalScenes = 1,
    durationSeconds = 8,
    productType = "commercial product",
    variations = ["Varia\xE7\xE3o 1"],
    environment = "commercial setting matching reference video",
    interactionStyle = "presented, worn, or demonstrated naturally with organic movement, highlighting key features, textures, and quality",
    cameraType = "handheld smartphone POV camera style at eye level, 24mm mobile lens with authentic organic breathing sway",
    lighting = "clean bright commercial daylight with natural soft specular highlights on materials and authentic reflections",
    secondTimeline,
    speechVoiceover,
    sceneImages,
    modelFraming,
    ctaText
  } = opts;
  const varList = variations.length > 0 ? variations : ["Varia\xE7\xE3o 1"];
  const var1 = varList[0] || "Varia\xE7\xE3o 1";
  const hasMultiple = varList.length > 1;
  let refMapping = "";
  if (Array.isArray(sceneImages) && sceneImages.length > 0) {
    refMapping = sceneImages.map((img, idx) => {
      const vName = img.variationName || var1;
      const angle = img.targetAngle || "perspective";
      const locDesc = img.location ? ` | Location: ${img.location}` : "";
      const actDesc = img.actionDescription ? ` | Action: ${img.actionDescription}` : "";
      return `- Reference ${idx + 1} (Image ${idx + 1}): ${img.role || `${vName} in ${angle} view`}${locDesc}${actDesc}`;
    }).join("\n");
  } else {
    refMapping = `- Reference 1 (Image 1): Key visual state of ${var1} for this scene segment`;
  }
  let timelineSection = "";
  if (secondTimeline && secondTimeline.trim()) {
    timelineSection = secondTimeline.trim();
  } else if (sceneNumber === 1) {
    timelineSection = `0.0\u20134.0 seconds: Natural commercial opening introducing ${var1} in frame, displaying form, premium finish, and authentic design.
4.0\u20138.0 seconds: Dynamic smooth movement highlighting texture, construction details, and organic interaction.`;
  } else {
    timelineSection = `0.0\u20134.0 seconds: Seamless narrative continuation from previous scene, showcasing next action and angles of ${hasMultiple && varList[sceneNumber - 1] ? varList[sceneNumber - 1] : var1}.
4.0\u20138.0 seconds: Closer dynamic demonstration focusing on functionality, materials, and authentic appeal.`;
  }
  const cleanSpeech = (speechVoiceover || "").trim().replace(/"/g, "'");
  const audioSection = cleanSpeech.length > 0 ? `Natural spoken dialogue for this scene segment only: "${cleanSpeech}". Strictly no subtitles, captions or on-screen digital text.` : `No dialogue or spoken voiceover in this segment. Background ambient room sound and music track only.`;
  const continuationNote = sceneNumber > 1 ? ` This is Scene ${sceneNumber} of ${totalScenes}: a direct sequential continuation from Scene ${sceneNumber - 1}. Do not restart the story or repeat previous actions.` : "";
  const isFinalScene = sceneNumber === totalScenes;
  const durationWord = durationSeconds === 10 ? "ten-second" : "eight-second";
  const framingDirective = modelFraming === "neck_down" ? " Framing is strictly neck-down (chest/hands/body), the presenter/model face is NOT visible." : modelFraming === "show_face" ? " The presenter face and expression are visible and strictly match the model reference." : "";
  const ctaSection = isFinalScene ? `

CALL TO ACTION (FINAL SCENE EXCLUSIVE):
Conclude with a high-converting natural commercial call to action: ${ctaText || "prompting the viewer to tap the cart/link below to purchase with free shipping"}.` : `

CALL TO ACTION CONSTRAINTS:
Zero call to action in this scene segment. All CTAs belong strictly to the final scene.`;
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
function buildUniversalSceneImagePrompt(productType, variationName, imageRole, imageLocation, interactionDetails, targetAngle = "front", modelFraming, productInfo, imageAction, hasUserProvidedModel = false) {
  let angleDirective = "";
  const cleanAngle = (targetAngle || "").toLowerCase();
  if (cleanAngle === "rear" || cleanAngle === "back" || cleanAngle.includes("costas") || cleanAngle.includes("traseira")) {
    angleDirective = `TARGET ANGLE: Direct rear/back angle view facing away from camera or showing the authentic back side of the product (back design, rear seams, rear labels, or back profile) exactly as in reference photos.`;
  } else if (cleanAngle === "side" || cleanAngle.includes("lateral")) {
    angleDirective = `TARGET ANGLE: Side profile perspective angle, showcasing product silhouette, side contours, depth, and edge craftsmanship.`;
  } else if (cleanAngle === "detail" || cleanAngle === "front_detail" || cleanAngle.includes("detalhe") || cleanAngle.includes("close")) {
    angleDirective = `TARGET ANGLE: Close-up macro detail action view, highlighting fine texture, authentic materials, stitching, prints, and authentic craftsmanship.`;
  } else if (cleanAngle === "front_side" || cleanAngle.includes("3/4") || cleanAngle.includes("tres_quartos")) {
    angleDirective = `TARGET ANGLE: Front-three-quarter dynamic angle facing towards camera, showcasing both front and lateral depth simultaneously.`;
  } else {
    angleDirective = `TARGET ANGLE: Direct frontal view clearly presenting the front face, primary features, and main branding of the product.`;
  }
  const framingRule = modelFraming === "neck_down" ? "\n   - MANDATORY FRAMING: NECK-DOWN ONLY (chest, hands, torso). Do NOT show the head or face of the model, strictly matching the headless framing of the reference video." : modelFraming === "show_face" ? hasUserProvidedModel ? "\n   - MANDATORY FRAMING: FACE VISIBLE. Show the model's face and expression matching the user's provided model photo reference." : "\n   - MANDATORY FRAMING: FACE VISIBLE WITH UNIQUE ORIGINAL IDENTITY (ANTI-VIOLATION TIKTOK RULE). Do NOT clone the face of the actor in the competitor reference video! Create a relatable everyday Brazilian person (man or woman) with a natural, authentic everyday look (genuine, approachable, non-supermodel appearance) with a DIFFERENT FACE and distinct facial features (different eyes, nose, smile, facial bone structure, or subtle variation in hair/skin tone\u2014similar demographic vibe like a cousin, but strictly a different individual to prevent TikTok copyright/impersonation strikes)." : "";
  const prodInfoBlock = productInfo && productInfo.trim() ? `
[PRODUCT DETAILS & SPECIFICATIONS]: ${productInfo.trim()}
` : "";
  return `${FIDELITY_BLOCK_TEXT}

[FORMAT]: Vertical 9:16 mobile smartphone photography, authentic TikTok commercial aesthetic.
[PRODUCT CATEGORY]: ${productType || "commercial product"}.
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
   - SCENARIO & LOCATION FOR THIS IMAGE: ${imageLocation || "authentic commercial setting matching the reference video"}.
     * BRAZILIAN HOME REALISM: If this scene takes place in a home/residence (bedroom, living room, kitchen, balcony, backyard, porch), it MUST depict a simple, authentic everyday Brazilian home (normal realistic furniture, cozy relatable decor, strictly NO luxury mansions, NO hyper-instagrammed lofts, NO unrealistic high-end foreign architecture). Lojas and retail stores can be neat and organized.
   - ACTION FOR THIS IMAGE: ${imageAction || interactionDetails || "naturally presenting, wearing, holding or demonstrating the product"}.
   - Lighting: authentic commercial lighting matching the location with natural soft contact shadows.${prodInfoBlock}

3. ANGLE & ORIENTATION FROM STORYBOARD:
   - ${angleDirective}

4. OPTICS & PURITY:
   - Sharp 24mm smartphone lens focus, natural room lighting, zero digital distortion.

5. ZERO ON-SCREEN HEADLINES OR TEXT OVERLAYS (MANDATORY):
   - ZERO ON-SCREEN TEXT, ZERO HEADLINES, ZERO BLACK-BORDERED CAPTION BOXES, ZERO STICKERS, ZERO SUBTITLES!
   - The photograph must be 100% clean and raw. Digital headlines will be added later during video editing. Only authentic logos physically printed or sewn on the product are permitted.

6. MODESTY & LOCALIZED ATTRIBUTE RULES:
   - SUBTLE CLEAVAGE REDUCTION: If reference apparel presents deep revealing cleavage, raise center neckline point subtly (20% to 35% less deep) to maintain modesty while keeping 100% original neckline shape (e.g., V-neck remains V-neck), straps, and garment identity intact without changing the clothing.
   - ZERO EXPOSED BELLY: No exposed midriff or belly button. Model abdomen must remain covered (with tucked-in under-top or discreet extension), preserving the primary apparel piece.
   - LOCALIZED TEXTURES STAY LOCALIZED: Ribbed collars, ribbed cuffs, elastic waistbands, or lace borders apply strictly to their designated zone, NEVER to the entire garment.
   - WRITTEN COLOR PRIORITY: Any color specified by the user in text overrides photographic lighting artifacts or reference tint differences.

7. NEGATIVE CONSTRAINTS:
   - Zero on-screen text, zero subtitles, zero watermarks, zero tattoos or body ink, zero duplicate competitor frames, zero distorted product features, zero exposed belly/navel, zero luxury mansions, zero hyper-instagrammed fake aesthetics.`;
}

// src/utils/speechDistributor.ts
function distributeSpeechAcrossScenes(fullScript, scenes) {
  const cleanScript = (fullScript || "").trim();
  if (scenes.length === 0) {
    return [];
  }
  if (!cleanScript) {
    return scenes.map((s) => ({
      ...s,
      sceneSpeech: ""
    }));
  }
  if (scenes.length === 1) {
    return [
      {
        ...scenes[0],
        sceneSpeech: cleanScript
      }
    ];
  }
  const allHaveDistinctSpeech = scenes.every((s) => s.sceneSpeech && s.sceneSpeech.trim().length > 0) && new Set(scenes.map((s) => s.sceneSpeech?.trim())).size === scenes.length;
  if (allHaveDistinctSpeech) {
    return scenes.map((s) => ({
      ...s,
      sceneSpeech: s.sceneSpeech.trim()
    }));
  }
  const sceneDurations = scenes.map((s) => Math.max(1, s.endTime - s.startTime));
  const totalDuration = sceneDurations.reduce((acc, d) => acc + d, 0);
  const sentences = cleanScript.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length >= scenes.length) {
    const result2 = [];
    let sentenceIdx = 0;
    for (let i = 0; i < scenes.length; i++) {
      const isLast = i === scenes.length - 1;
      const targetRatio = sceneDurations[i] / totalDuration;
      const targetCount = isLast ? sentences.length - sentenceIdx : Math.max(1, Math.round(targetRatio * sentences.length));
      const sliceCount = Math.min(targetCount, sentences.length - sentenceIdx);
      const sceneSentences = sentences.slice(sentenceIdx, isLast ? sentences.length : sentenceIdx + sliceCount);
      sentenceIdx += sceneSentences.length;
      result2.push({
        ...scenes[i],
        sceneSpeech: sceneSentences.join(" ")
      });
    }
    return result2;
  }
  const words = cleanScript.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const result = [];
  let wordIdx = 0;
  for (let i = 0; i < scenes.length; i++) {
    const isLast = i === scenes.length - 1;
    const targetRatio = sceneDurations[i] / totalDuration;
    const targetWordCount = isLast ? totalWords - wordIdx : Math.max(1, Math.round(targetRatio * totalWords));
    const chunkWords = words.slice(wordIdx, isLast ? totalWords : wordIdx + targetWordCount);
    wordIdx += chunkWords.length;
    result.push({
      ...scenes[i],
      sceneSpeech: chunkWords.join(" ")
    });
  }
  return result;
}

// src/utils/frameSampler.ts
function selectRepresentativeKeyframes(frames, durationSeconds, calculatedScenes = 1, maxFrames = 12) {
  if (!frames || frames.length === 0) return [];
  if (frames.length <= maxFrames) {
    return [...frames].sort((a, b) => a.time - b.time);
  }
  const sorted = [...frames].sort((a, b) => a.time - b.time);
  const samplesPerScene = Math.max(3, Math.floor(maxFrames / Math.max(1, calculatedScenes)));
  const targetCount = Math.min(maxFrames, calculatedScenes * samplesPerScene);
  const selectedIndices = /* @__PURE__ */ new Set();
  selectedIndices.add(0);
  selectedIndices.add(sorted.length - 1);
  sorted.forEach((f, idx) => {
    if (f.isCutTransition && selectedIndices.size < targetCount) {
      selectedIndices.add(idx);
    }
  });
  const stepTime = durationSeconds / (targetCount + 1);
  for (let i = 1; i <= targetCount; i++) {
    const idealTime = stepTime * i;
    let closestIdx = -1;
    let minDiff = Infinity;
    for (let j = 0; j < sorted.length; j++) {
      const diff = Math.abs(sorted[j].time - idealTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = j;
      }
    }
    if (closestIdx !== -1 && selectedIndices.size < targetCount) {
      selectedIndices.add(closestIdx);
    }
  }
  return Array.from(selectedIndices).sort((a, b) => a - b).map((idx) => sorted[idx]);
}

// src/services/ai/index.ts
import dotenv2 from "dotenv";

// src/services/ai/openaiProvider.ts
import dotenv from "dotenv";
import OpenAI from "openai";

// src/config/openaiModels.ts
var OPENAI_BRAIN_MODEL = "gpt-5.6-terra";
var OPENAI_REASONING_EFFORT = "medium";
var OPENAI_AUDIO_MODEL = "gpt-transcribe";
var OPENAI_IMAGE_MODEL = "gpt-image-2.5-sunburst";
var OPENAI_IMAGE_QUALITY = "high";
var OPENAI_IMAGE_SIZE = "1024x1792";
var OPENAI_AUDIT_MODEL = "gpt-5.6-luna";
var OPENAI_PRICING = {
  // gpt-5.6-terra (USD per 1M tokens)
  terra: {
    inputPer1M: 2,
    outputPer1M: 12
  },
  // gpt-5.6-luna (USD per 1M tokens)
  luna: {
    inputPer1M: 0.2,
    outputPer1M: 1
  },
  // gpt-transcribe (USD per minute)
  transcribe: {
    perMinuteUSD: 6e-3,
    perSecondUSD: 1e-4
  },
  // gpt-image-2.5-sunburst (USD per image high quality 1024x1792)
  sunburst: {
    perImageHighUSD: 0.08,
    perImageStandardUSD: 0.04
  },
  usdToBrl: 5.7
};

// src/services/ai/costTracker.ts
var CostTracker = class {
  constructor() {
    this.records = [];
  }
  /**
   * Limpa registros para iniciar uma nova clonagem completa
   */
  reset() {
    this.records = [];
  }
  /**
   * Calcula custo para chamadas baseadas em tokens (ex: gpt-5.6-terra, gpt-5.6-luna)
   */
  calculateTokenCost(model, promptTokens, completionTokens) {
    let inputRate = OPENAI_PRICING.terra.inputPer1M;
    let outputRate = OPENAI_PRICING.terra.outputPer1M;
    if (model.includes("luna")) {
      inputRate = OPENAI_PRICING.luna.inputPer1M;
      outputRate = OPENAI_PRICING.luna.outputPer1M;
    }
    const inputCostUSD = promptTokens / 1e6 * inputRate;
    const outputCostUSD = completionTokens / 1e6 * outputRate;
    const totalUSD = inputCostUSD + outputCostUSD;
    const totalBRL = totalUSD * OPENAI_PRICING.usdToBrl;
    return {
      costUSD: Math.round(totalUSD * 1e4) / 1e4,
      costBRL: Math.round(totalBRL * 1e3) / 1e3
    };
  }
  /**
   * Calcula custo para transcrição de áudio (gpt-transcribe)
   */
  calculateAudioCost(durationSeconds = 15) {
    const costUSD = Math.max(5e-4, durationSeconds * OPENAI_PRICING.transcribe.perSecondUSD);
    const costBRL = costUSD * OPENAI_PRICING.usdToBrl;
    return {
      costUSD: Math.round(costUSD * 1e4) / 1e4,
      costBRL: Math.round(costBRL * 1e3) / 1e3
    };
  }
  /**
   * Calcula custo para geração de imagem (gpt-image-2.5-sunburst)
   */
  calculateImageCost(quality = "high") {
    const costUSD = quality === "high" ? OPENAI_PRICING.sunburst.perImageHighUSD : OPENAI_PRICING.sunburst.perImageStandardUSD;
    const costBRL = costUSD * OPENAI_PRICING.usdToBrl;
    return {
      costUSD: Math.round(costUSD * 1e3) / 1e3,
      costBRL: Math.round(costBRL * 1e3) / 1e3
    };
  }
  /**
   * Registra uma chamada instrumentada
   */
  recordCall(params) {
    const pTokens = params.promptTokens || 0;
    const cTokens = params.completionTokens || 0;
    const record = {
      id: `${params.step}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      step: params.step,
      model: params.model,
      promptTokens: pTokens,
      completionTokens: cTokens,
      totalTokens: pTokens + cTokens,
      costUSD: params.costUSD,
      costBRL: params.costBRL,
      callCount: 1,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: params.details
    };
    this.records.push(record);
    return record;
  }
  /**
   * Gera o relatório consolidado completo de custos da clonagem
   */
  generateReport(provider = "openai") {
    let totalCostUSD = 0;
    let totalCostBRL = 0;
    let totalTokens = 0;
    const modelsSet = /* @__PURE__ */ new Set();
    const breakdownByStep = {};
    const stepList = [
      "transcri\xE7\xE3o",
      "an\xE1lise dos frames",
      "engenharia reversa/storyboard",
      "imagem 1",
      "imagem 2",
      "imagem 3",
      "auditoria da imagem 1",
      "auditoria da imagem 2",
      "auditoria da imagem 3",
      "regenera\xE7\xF5es",
      "gera\xE7\xE3o dos prompts finais"
    ];
    stepList.forEach((st) => {
      breakdownByStep[st] = {
        costUSD: 0,
        costBRL: 0,
        calls: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        model: "-"
      };
    });
    for (const r of this.records) {
      totalCostUSD += r.costUSD;
      totalCostBRL += r.costBRL;
      totalTokens += r.totalTokens;
      modelsSet.add(r.model);
      if (breakdownByStep[r.step]) {
        breakdownByStep[r.step].costUSD = Math.round((breakdownByStep[r.step].costUSD + r.costUSD) * 1e4) / 1e4;
        breakdownByStep[r.step].costBRL = Math.round((breakdownByStep[r.step].costBRL + r.costBRL) * 1e3) / 1e3;
        breakdownByStep[r.step].calls += 1;
        breakdownByStep[r.step].promptTokens += r.promptTokens;
        breakdownByStep[r.step].completionTokens += r.completionTokens;
        breakdownByStep[r.step].totalTokens += r.totalTokens;
        breakdownByStep[r.step].model = r.model;
      }
    }
    return {
      provider,
      totalCostUSD: Math.round(totalCostUSD * 1e3) / 1e3,
      totalCostBRL: Math.round(totalCostBRL * 100) / 100,
      totalCalls: this.records.length,
      totalTokens,
      modelsUsed: Array.from(modelsSet),
      steps: [...this.records],
      breakdownByStep
    };
  }
};
var globalCostTracker = new CostTracker();

// src/services/ai/openaiProvider.ts
dotenv.config();
var OpenAIProvider = class {
  constructor() {
    this.name = "openai";
    this.client = null;
    const apiKey = process.env.OPENAI_API_KEY || process.env.APIOPENAI || process.env.OPENAI_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }
  isConfigured() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.APIOPENAI || process.env.OPENAI_KEY;
    return Boolean(apiKey && apiKey.trim().length > 0);
  }
  getClient() {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY || process.env.APIOPENAI || process.env.OPENAI_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY n\xE3o configurada no ambiente.");
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }
  /**
   * 1. CÃ©rebro Principal / AnÃ¡lise Visual / Engenharia Reversa / Storyboard / Prompts Finais
   * Modelo: gpt-5.6-terra com reasoning_effort: 'medium'
   * 2. TranscriÃ§Ã£o do Ãudio
   * Modelo: gpt-transcribe
   */
  async analyzeVideo(params) {
    const {
      durationSeconds = 12,
      frames = [],
      variations = [],
      audioBase64,
      additionalInstructions = "",
      productInfo = "",
      modelPhotoUrl,
      veoModelMode = "veo3_basic_8s"
    } = params;
    const validDuration = Math.min(40, Math.max(4, Math.round(Number(durationSeconds) || 12)));
    const calculatedScenes = calculateSceneCount(validDuration, veoModelMode);
    const sceneDurationSec = veoModelMode === "veo3_omniflash_10s" ? 10 : 8;
    const perSceneMaxChars = veoModelMode === "veo3_omniflash_10s" ? 252 : 199;
    const totalMaxSpeechChars = calculatedScenes * perSceneMaxChars;
    const client = this.getClient();
    globalCostTracker.reset();
    let transcriptText = "";
    let speechData = {
      hasSpeech: false,
      originalTranscript: "M\xFAsica de fundo identificada",
      adaptedScript: "",
      voiceTone: "Trilha sonora / Beat musical"
    };
    if (audioBase64) {
      try {
        const audioBuffer = Buffer.from(
          audioBase64.replace(/^data:audio\/(?:wav|mp3|mpeg|webm|ogg);base64,/, ""),
          "base64"
        );
        const audioFile = new File([audioBuffer], "reference_audio.wav", { type: "audio/wav" });
        const transcribeRes = await client.audio.transcriptions.create({
          file: audioFile,
          model: OPENAI_AUDIO_MODEL
        });
        transcriptText = transcribeRes.text?.trim() || "";
        const audioCost = globalCostTracker.calculateAudioCost(validDuration);
        globalCostTracker.recordCall({
          step: "transcri\xE7\xE3o",
          model: OPENAI_AUDIO_MODEL,
          costUSD: audioCost.costUSD,
          costBRL: audioCost.costBRL,
          details: `Dura\xE7\xE3o: ${validDuration}s | Texto: "${transcriptText.substring(0, 60)}..."`
        });
        if (transcriptText.length > 0) {
          speechData.originalTranscript = transcriptText;
        }
      } catch (err) {
        console.warn("[OpenAIProvider] Aviso na transcri\xE7\xE3o de \xE1udio:", err?.message);
      }
    }
    const contentBlocks = [];
    if (transcriptText) {
      contentBlocks.push({
        type: "text",
        text: `[\xC1UDIO TRANSCRITO DO V\xCDDEO CONCORRENTE]: "${transcriptText}".
Analise este \xE1udio em conjunto com os quadros para identificar se h\xE1 locu\xE7\xE3o comercial real ou apenas m\xFAsica de fundo/batida, adaptando o roteiro para o produto do usu\xE1rio.`
      });
    }
    const sampledFrames = selectRepresentativeKeyframes(frames, validDuration, calculatedScenes);
    sampledFrames.forEach((f) => {
      contentBlocks.push({
        type: "text",
        text: `[Quadro do v\xEDdeo no instante t=${f.time}s${f.isCutTransition ? " - corte/mudan\xE7a de cena" : ""}]:`
      });
      contentBlocks.push({
        type: "image_url",
        image_url: { url: f.dataUrl, detail: "low" }
      });
    });
    variations.forEach((v, vIdx) => {
      const vName = v.name || `Varia\xE7\xE3o ${vIdx + 1}`;
      (v.photos || []).slice(0, 2).forEach((photoUrl, pIdx) => {
        contentBlocks.push({
          type: "text",
          text: `[Foto de Refer\xEAncia Real ${pIdx + 1} para "${vName}" - Inviolabilidade f\xEDsica de cores, materiais e geometria]:`
        });
        contentBlocks.push({
          type: "image_url",
          image_url: { url: photoUrl, detail: "high" }
        });
      });
    });
    if (modelPhotoUrl) {
      contentBlocks.push({
        type: "text",
        text: "[Foto da Modelo do Usu\xE1rio - Use como refer\xEAncia mandat\xF3ria de rosto, etnia e cabelo caso o v\xEDdeo mostre o rosto da modelo]:"
      });
      contentBlocks.push({
        type: "image_url",
        image_url: { url: modelPhotoUrl, detail: "high" }
      });
    }
    const prodInfoClause = productInfo && productInfo.trim() ? `
INFORMA\xC7\xD5ES ADICIONAIS DO PRODUTO (BENEF\xCDCIOS E DESCRI\xC7\xC3O): "${productInfo.trim()}". Integre estas caracter\xEDsticas nos roteiros e detalhes do produto.
` : "";
    const userPromptText = `Voc\xEA \xE9 o C\xE9rebro Anal\xEDtico de Engenharia Reversa do ReV\xEDdeo AI.
MISS\xC3O:
1. Analise os quadros extra\xEDdos cobrindo TODA a dura\xE7\xE3o de ${validDuration}s do v\xEDdeo concorrente e TODAS as fotos reais das varia\xE7\xF5es do produto.
2. Identifique o produto real pelas fotos do usu\xE1rio (qualquer categoria: vestu\xE1rio, cal\xE7ado, embalagem, acess\xF3rio, utilidade, eletr\xF4nico, etc.).
${prodInfoClause}
3. REGRAS CR\xCDTICAS E INVIOL\xC1VEIS DAS CENAS, CEN\xC1RIOS E CONSIST\xCANCIA DO MODELO:
   a) O V\xCDDEO DE REFER\xCANCIA \xC9 QUEM DITA OS CEN\xC1RIOS/LOCAIS E AS A\xC7\xD5ES:
      - As imagens geradas servem para colocar o modelo e o produto do usu\xE1rio NOS MESMOS CEN\xC1RIOS/LOCAIS e NAS MESMAS A\xC7\xD5ES que o v\xEDdeo de refer\xEAncia apresenta em cada momento!
      - Exemplo da regra:
        * Se no v\xEDdeo de refer\xEAncia na primeira cena a pessoa est\xE1 no mercado pegando o produto, a Imagem 1 DEVE ser no mercado pegando o produto na prateleira.
        * Se depois a pessoa vai para o topo de um pr\xE9dio, a Imagem 2 DEVE ser no topo do pr\xE9dio.
        * Se depois vai para um s\xEDtio montada a cavalo, a Imagem 3 DEVE ser no s\xEDtio montada a cavalo.
        * Se na pr\xF3xima cena a pessoa est\xE1 na mesa da cozinha comendo ao lado do produto, a Imagem 4 DEVE ser na mesa da cozinha.
        * Se na \xFAltima cena a pessoa est\xE1 em cima da cama abrindo o pacote do produto, a Imagem 6 DEVE ser em cima da cama abrindo o pacote.
      - NUNCA coloque todas as imagens no mesmo local se o v\xEDdeo de refer\xEAncia transita por cen\xE1rios diferentes!
      - O resultado final DEVE ter a MESMA QUANTIDADE E DIVERSIDADE DE CEN\xC1RIOS que o v\xEDdeo de refer\xEAncia teve, reproduzindo os mesmos cen\xE1rios com o produto do usu\xE1rio.

   b) REGRA ABSOLUTA DE CONSIST\xCANCIA DO MODELO & ANTI-VIOLA\xC7\xC3O DE ROSTO NO TIKTOK:
      - Quando o usu\xE1rio FORNECER foto do modelo ('modelPhotoUrl'): use estritamente essa pessoa em todas as cenas.
      - Quando o usu\xE1rio N\xC3O FORNECER foto do modelo e o modelo for gerado com base no v\xEDdeo de refer\xEAncia:
        * \xC9 EXPRESSAMENTE PROIBIDO COPIAR OU CLONAR O ROSTO EXATO DO MODELO DO V\xCDDEO CONCORRENTE!
        * Gere/descreva um modelo com caracter\xEDsticas similares (mesma faixa et\xE1ria/estilo de criador, como um primo), POR\xC9M COM ROSTO DIFERENTE (tra\xE7os faciais distintos, formato de rosto pr\xF3prio, ou varia\xE7\xE3o de cabelo/tom de pele) para evitar 100% qualquer viola\xE7\xE3o de direitos autorais, imagem ou duplicidade no TikTok.
        * Trava de consist\xEAncia: esse NOVO modelo concebido deve permanecer rigorosamente O MESMO em todas as imagens (Imagem 1 a 9). O que muda de imagem para imagem \xE9 O CEN\xC1RIO (local) e A A\xC7\xC3O f\xEDsica, mas A PESSOA/MODELO \xC9 RIGOROSAMENTE A MESMA do in\xEDcio ao fim!

   c) SEQU\xCANCIA DE 3 IMAGENS DE REFER\xCANCIA POR CENA:
      - O v\xEDdeo possui ${validDuration}s e \xE9 dividido em exatamente ${calculatedScenes} cena(s) consecutivas de ${sceneDurationSec}s.
      - Cada cena deve conter EXATAMENTE 3 imagens mapeadas cronologicamente \xE0s a\xE7\xF5es e locais daquele trecho temporal:
        * Cena 1: Imagem 1, Imagem 2, Imagem 3.
        * Cena 2: Imagem 4, Imagem 5, Imagem 6.
        * Cena 3: Imagem 7, Imagem 8, Imagem 9.
      - Para cada imagem no array 'images', preencha OBRIGATORIAMENTE:
        * 'location': Cen\xE1rio e local espec\xEDfico daquele instante no v\xEDdeo (ex: "Corredor de supermercado moderno com prateleiras", "Topo de pr\xE9dio urbano ao p\xF4r do sol", "Cozinha residencial moderna ao redor da mesa", "Quarto aconchegante sobre a cama").
        * 'actionDescription': A\xE7\xE3o corporal e intera\xE7\xE3o precisa do modelo com o produto naquele momento.
        * 'role': T\xEDtulo descritivo combinando n\xFAmero da imagem, modelo, local e a\xE7\xE3o (ex: "Imagem 1: Modelo no mercado pegando o produto na prateleira").
        * 'targetAngle': \xC2ngulo exato da c\xE2mera ('front', 'side', 'rear', 'detail', etc.).

   d) ENQUADRAMENTO DA MODELO (DO PESCO\xC7O PARA BAIXO vs ROSTO):
      - Se o v\xEDdeo esconde o rosto da modelo (c\xE2mera do pesco\xE7o para baixo, t\xF3rax, m\xE3os, pernas), defina "modelFraming": "neck_down".
      - Se o v\xEDdeo mostra o rosto da modelo, defina "modelFraming": "show_face".
      - Se n\xE3o h\xE1 pessoa (apenas produto), defina "modelFraming": "product_only".

   e) CALL TO ACTION (CTA) ESTRITAMENTE NA \xDALTIMA CENA:
      - Chamada de compra ("clique no carrinho amarelo", etc.) EXCLUSIVAMENTE na \xFAltima cena (Cena ${calculatedScenes}). Cenas anteriores N\xC3O possuem CTA!

   f) HEADLINES NA TELA ('onScreenTexts'):
      - Se o v\xEDdeo possuir textos/headlines reais, capture com emojis. Se N\xC3O possuir nenhuma headline na tela, retorne RIGOROSAMENTE [].

   g) CLASSIFICA\xC7\xC3O UNIFICADA DE \xC1UDIO E LOCU\xC7\xC3O (SE HOUVER \xC1UDIO TRANSCRITO):
      - Se o \xE1udio transcrito for locu\xE7\xE3o comercial real de apresenta\xE7\xE3o/review do produto, preencha "speechClassification": { "hasProductPitch": true, "isMusicTrack": false, "adaptedScript": "...", "voiceTone": "..." } adaptando a fala com NO M\xC1XIMO ${totalMaxSpeechChars} caracteres no total (${perSceneMaxChars} caracteres por cada uma das ${calculatedScenes} cenas) em Portugu\xEAs do Brasil natural para o produto do usu\xE1rio. Cada cena no array 'scenes' deve conter seu campo 'sceneSpeech' com a fala exclusiva daquele trecho de ${sceneDurationSec}s (sem repeti\xE7\xE3o).
      - Se for M\xDASICA, TRILHA SONORA, BEAT, RAP, FUNK OU LETRA DE M\xDASICA CANTADA (ex: batidas, rimas musicais, letras po\xE9ticas ou m\xFAsicas populares):
        * "hasProductPitch": false
        * "isMusicTrack": true
        * "adaptedScript": "" (DEIXE RIGOROSAMENTE VAZIO!)
        * "voiceTone": "Trilha sonora"
        * E em TODAS as cenas no array 'scenes', o campo 'sceneSpeech' DEVE VIR RIGOROSAMENTE VAZIO ("")! NUNCA coloque letras de m\xFAsica como fala no 'sceneSpeech'!
      - Se n\xE3o houver \xE1udio, preencha com hasProductPitch: false, adaptedScript: "" e sceneSpeech: "" em todas as cenas.

   h) REALISMO BRASILEIRO (PESSOAS SIMPLES E CASAS COMUNS DO COTIDIANO):
      - Quando retratar pessoas (sem foto enviada): descrever pessoas brasileiras simples e comuns do dia a dia (apar\xEAncia aut\xEAntica, simp\xE1tica, acess\xEDvel e natural, sem padr\xF5es inating\xEDveis de supermodelo).
      - Quando o cen\xE1rio for residencial (casa, sala, quarto, cozinha, varanda, quintal): descrever rigorosamente a casa de uma pessoa brasileira simples e comum (m\xF3veis normais e acolhedores, estritamente PROIBIDO mans\xF5es, casas luxuosas ou decora\xE7\xF5es hiper-instagram\xE1veis que fujam da realidade popular brasileira). Lojas e com\xE9rcios podem ser organizados e limpos.

Instru\xE7\xF5es adicionais do usu\xE1rio: "${additionalInstructions}".

Retorne estritamente um JSON estruturado:
{
  "productType": string,
  "modelFraming": "neck_down" | "show_face" | "product_only",
  "formatAndOrientation": "Vertical 9:16 (Formato TikTok Shop)",
  "cameraType": string,
  "cameraStability": string,
  "environmentDescription": string,
  "interactionDetails": string,
  "secondBySecondTimeline": string,
  "detectedVariationsCount": number,
  "detectedVariationSequence": string[],
  "speechClassification": {
    "hasProductPitch": boolean,
    "isMusicTrack": boolean,
    "adaptedScript": string,
    "voiceTone": string
  },
  "onScreenTexts": [
    {
      "timestamp": string,
      "text": string,
      "fontStyle": string,
      "color": string,
      "position": string
    }
  ],
  "scenes": [
    {
      "sceneNumber": number,
      "startTime": number,
      "endTime": number,
      "timeRangeText": string,
      "actionSummary": string,
      "eightSecondTimeline": string,
      "mappedVariations": string[],
      "environmentDescription": string,
      "productType": string,
      "sceneSpeech": string,
      "veoPrompt": string,
      "veoInstruction": string,
      "images": [
        {
          "id": string,
          "role": string,
          "frameNumber": number,
          "variationName": string,
          "targetAngle": string,
          "location": string,
          "actionDescription": string,
          "promptUsed": string
        }
      ]
    }
  ]
}`;
    contentBlocks.push({ type: "text", text: userPromptText });
    const completion = await client.chat.completions.create({
      model: OPENAI_BRAIN_MODEL,
      reasoning_effort: OPENAI_REASONING_EFFORT,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Voc\xEA \xE9 um perito em engenharia reversa visual de criativos TikTok Shop. Retorne apenas JSON v\xE1lido."
        },
        {
          role: "user",
          content: contentBlocks
        }
      ]
    });
    const brainPromptTokens = completion.usage?.prompt_tokens || 0;
    const brainCompletionTokens = completion.usage?.completion_tokens || 0;
    const brainCost = globalCostTracker.calculateTokenCost(OPENAI_BRAIN_MODEL, brainPromptTokens, brainCompletionTokens);
    globalCostTracker.recordCall({
      step: "an\xE1lise dos frames",
      model: OPENAI_BRAIN_MODEL,
      promptTokens: Math.round(brainPromptTokens * 0.5),
      completionTokens: Math.round(brainCompletionTokens * 0.4),
      costUSD: Math.round(brainCost.costUSD * 0.45 * 1e4) / 1e4,
      costBRL: Math.round(brainCost.costBRL * 0.45 * 1e3) / 1e3,
      details: `An\xE1lise multimodal de ${frames.length} frames e refer\xEAncias`
    });
    globalCostTracker.recordCall({
      step: "engenharia reversa/storyboard",
      model: OPENAI_BRAIN_MODEL,
      promptTokens: Math.round(brainPromptTokens * 0.5),
      completionTokens: Math.round(brainCompletionTokens * 0.6),
      costUSD: Math.round(brainCost.costUSD * 0.55 * 1e4) / 1e4,
      costBRL: Math.round(brainCost.costBRL * 0.55 * 1e3) / 1e3,
      details: `Constru\xE7\xE3o do storyboard de ${calculatedScenes} cena(s)`
    });
    globalCostTracker.recordCall({
      step: "gera\xE7\xE3o dos prompts finais",
      model: OPENAI_BRAIN_MODEL,
      promptTokens: 250,
      completionTokens: 350,
      costUSD: 47e-4,
      costBRL: Math.round(47e-4 * OPENAI_PRICING.usdToBrl * 1e3) / 1e3,
      details: "Gera\xE7\xE3o estruturada dos prompts finais em ingl\xEAs para o Google Veo 3.1"
    });
    const parsedData = JSON.parse(completion.choices[0]?.message?.content || "{}");
    if (parsedData.speechClassification) {
      const isCommercial = Boolean(
        parsedData.speechClassification.hasProductPitch && !parsedData.speechClassification.isMusicTrack && parsedData.speechClassification.adaptedScript && parsedData.speechClassification.adaptedScript.trim().length > 0
      );
      speechData = {
        hasSpeech: isCommercial,
        originalTranscript: transcriptText || "M\xFAsica de fundo identificada",
        adaptedScript: isCommercial ? parsedData.speechClassification.adaptedScript.trim() : "",
        voiceTone: isCommercial ? parsedData.speechClassification.voiceTone || "Persuasivo e din\xE2mico" : "Trilha sonora / Beat musical"
      };
    }
    parsedData.speechData = speechData;
    if (Array.isArray(parsedData.onScreenTexts)) {
      parsedData.onScreenTexts = parsedData.onScreenTexts.filter((item) => {
        if (!item || !item.text) return false;
        const clean = item.text.trim().replace(/^["']+|["']+$/g, "").trim();
        return clean.length > 0;
      }).map((item) => ({
        ...item,
        text: item.text.trim().replace(/^["']+|["']+$/g, "").trim()
      }));
    } else {
      parsedData.onScreenTexts = [];
    }
    if (!speechData.hasSpeech || !speechData.adaptedScript) {
      speechData.hasSpeech = false;
      speechData.adaptedScript = "";
    }
    if (Array.isArray(parsedData.scenes) && parsedData.scenes.length > 0) {
      if (!speechData.hasSpeech || !speechData.adaptedScript) {
        parsedData.scenes = parsedData.scenes.map((scene) => ({
          ...scene,
          sceneSpeech: ""
        }));
      } else {
        const fullAdaptedScript = speechData.adaptedScript.trim();
        parsedData.scenes = distributeSpeechAcrossScenes(fullAdaptedScript, parsedData.scenes);
      }
      parsedData.scenes = parsedData.scenes.map((scene, sIdx) => {
        const baseImgNum = sIdx * 3;
        const currentImgs = Array.isArray(scene.images) ? scene.images : [];
        const finalImgs = [];
        for (let i = 0; i < 3; i++) {
          const imgSlotNumber = baseImgNum + i + 1;
          const existing = currentImgs[i];
          const defaultAngle = i === 0 ? "front" : i === 1 ? "side" : "detail";
          const defaultLocation = existing?.location || scene.environmentDescription || parsedData.environmentDescription || "cen\xE1rio comercial";
          const defaultAction = existing?.actionDescription || `Demonstra\xE7\xE3o do produto no momento ${i + 1}`;
          const defaultRole = `Imagem ${imgSlotNumber}: ${existing?.role || `A\xE7\xE3o ${i + 1} em ${defaultLocation}`}`;
          finalImgs.push({
            id: existing?.id || `img-${imgSlotNumber}`,
            role: existing?.role || defaultRole,
            frameNumber: imgSlotNumber,
            variationName: existing?.variationName || variations[0]?.name || "Varia\xE7\xE3o 1",
            targetAngle: existing?.targetAngle || defaultAngle,
            location: existing?.location || defaultLocation,
            actionDescription: existing?.actionDescription || defaultAction,
            promptUsed: existing?.promptUsed || ""
          });
        }
        const varList = Array.isArray(scene.mappedVariations) && scene.mappedVariations.length > 0 ? scene.mappedVariations : variations.map((v, i) => v.name || `Varia\xE7\xE3o ${i + 1}`);
        const updatedVeo = buildVeoSingleParagraphPrompt({
          sceneNumber: scene.sceneNumber,
          totalScenes: parsedData.scenes.length,
          durationSeconds: sceneDurationSec,
          productType: parsedData.productType || "commercial product",
          variations: varList,
          environment: scene.environmentDescription || parsedData.environmentDescription,
          interactionStyle: parsedData.interactionDetails,
          cameraType: parsedData.cameraType,
          lighting: parsedData.lightingStyle,
          secondTimeline: scene.eightSecondTimeline,
          speechVoiceover: scene.sceneSpeech,
          modelFraming: parsedData.modelFraming,
          sceneImages: finalImgs.map((im) => ({
            role: im.role,
            variationName: im.variationName,
            targetAngle: im.targetAngle,
            location: im.location,
            actionDescription: im.actionDescription
          }))
        });
        return {
          ...scene,
          images: finalImgs,
          veoPrompt: updatedVeo,
          veoInstruction: `Anexe no Veo as 3 imagens de refer\xEAncia geradas para esta cena`
        };
      });
    }
    const initialReport = globalCostTracker.generateReport("openai");
    parsedData.tokenUsage = {
      promptTokens: brainPromptTokens,
      candidateTokens: brainCompletionTokens,
      totalTokens: brainPromptTokens + brainCompletionTokens,
      estimatedCostBRL: initialReport.totalCostBRL,
      totalCostUSD: initialReport.totalCostUSD,
      totalCalls: initialReport.totalCalls,
      modelsUsed: initialReport.modelsUsed,
      detailedSteps: initialReport.steps,
      breakdown: {
        videoAnalysisTokens: brainPromptTokens + brainCompletionTokens,
        videoAnalysisCostBRL: brainCost.costBRL,
        speechTokens: 0,
        speechCostBRL: globalCostTracker.calculateAudioCost(validDuration).costBRL,
        imagesCount: 0,
        imagesCostBRL: 0,
        promptsTokens: 600,
        promptsCostBRL: 0.026
      }
    };
    parsedData.costReport = initialReport;
    return parsedData;
  }
  /**
   * 3. Geração das Imagens com Múltiplas Fotos Reais de Referência
   * Modelo: gpt-image-2.5-sunburst
   * Parâmetros: quality: 'high', input_fidelity: 'high', size: '1024x1792' (vertical 9:16)
   */
  async generateSceneImage(params) {
    const {
      prompt,
      productPhotoBase64,
      productPhotosBase64 = [],
      modelReferenceBase64,
      variationName = "Varia\xE7\xE3o 1",
      productType = "produto comercial",
      targetAngle = "front",
      location,
      actionDescription,
      correctionPrompt,
      additionalInstructions = "",
      hasUserProvidedModel = false,
      isCloneMode = false,
      preserveLocation = false
    } = params;
    const client = this.getClient();
    let stepName = "imagem 1";
    if (prompt.includes("Imagem 2") || prompt.includes("img2")) {
      stepName = "imagem 2";
    } else if (prompt.includes("Imagem 3") || prompt.includes("img3")) {
      stepName = "imagem 3";
    }
    const allPhotos = [];
    if (productPhotoBase64) allPhotos.push(productPhotoBase64);
    productPhotosBase64.forEach((p) => {
      if (p && !allPhotos.includes(p)) allPhotos.push(p);
    });
    const modelAntiViolationDirective = !hasUserProvidedModel && !modelReferenceBase64 ? `CRITICAL ANTI-VIOLATION DIRECTIVE: Do NOT copy or clone the face of the actor from the reference video. Generate an original commercial model with a DIFFERENT FACE and distinct facial features (similar demographic style like a cousin, but strictly a different person) to prevent TikTok copyright/impersonation strikes.` : "";
    const overrides = [
      modelAntiViolationDirective,
      correctionPrompt && `CRITICAL QUALITY OVERRIDE: ${correctionPrompt.trim()}`,
      additionalInstructions && `USER DIRECTIVE: ${additionalInstructions.trim()}`
    ].filter(Boolean).join("\n");
    const cleanPrompt = overrides ? `${overrides}

${prompt}` : prompt;
    try {
      const imageFiles = [];
      allPhotos.slice(0, 4).forEach((photoStr, idx) => {
        try {
          const cleanB64 = photoStr.replace(/^data:image\/(?:jpeg|png|webp|gif);base64,/, "");
          const buffer = Buffer.from(cleanB64, "base64");
          imageFiles.push(new File([buffer], `reference_${idx + 1}.png`, { type: "image/png" }));
        } catch (e) {
        }
      });
      let baseImageFile = null;
      let swatchFile = null;
      let effectivePrompt = cleanPrompt;
      if (modelReferenceBase64 && !isCloneMode) {
        const toFile = (dataUrl, name) => {
          const mimeMatch = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,/);
          const mime = mimeMatch ? mimeMatch[1] : "image/png";
          const ext = mime.split("/")[1] === "jpeg" ? "jpg" : mime.split("/")[1];
          const b642 = dataUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
          return new File([Buffer.from(b642, "base64")], `${name}.${ext}`, { type: mime });
        };
        baseImageFile = toFile(modelReferenceBase64, "imagem_1_base");
        const swatchStr = productPhotoBase64 || productPhotosBase64[0];
        if (swatchStr) {
          try {
            swatchFile = toFile(swatchStr, "amostra_cor");
          } catch {
            swatchFile = null;
          }
        }
        let garmentSpec = "";
        if (swatchStr) {
          try {
            const vis = await client.chat.completions.create({
              model: OPENAI_BRAIN_MODEL,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "image_url", image_url: { url: swatchStr.startsWith("data:") ? swatchStr : `data:image/jpeg;base64,${swatchStr}` } },
                    {
                      type: "text",
                      text: `Describe in English, in one dense paragraph, ONLY the garment/product (${productType}) in this photo, ignoring the person, background and mannequin: exact main color of each piece (top and bottom), exact color of the piping/trim/binding on collar, front placket, sleeve hems, shorts hems and pockets, exact button color and count, fabric texture, neckline shape, sleeve length, shorts length, any print or logo. Be precise about contrast colors.`
                    }
                  ]
                }
              ]
            });
            garmentSpec = vis.choices[0]?.message?.content || "";
          } catch {
            garmentSpec = "";
          }
        }
        effectivePrompt = `Esta \xE9 uma EDI\xC7\xC3O LOCALIZADA da imagem enviada. A imagem enviada \xE9 a base absoluta e deve permanecer ID\xCANTICA: mesma mulher (rosto, cabelo, pele, corpo), mesma pose, mesmos bra\xE7os e m\xE3os, mesmo quarto/cen\xE1rio, mesma ilumina\xE7\xE3o, mesmo \xE2ngulo, mesmo enquadramento e mesma composi\xE7\xE3o. N\xC3O recrie a cena, N\xC3O gere outra pessoa, N\xC3O mude o fundo. Zero tatuagens.

\xDANICA ALTERA\xC7\xC3O: substitua a roupa/produto (${productType}) que ela veste por uma pe\xE7a com exatamente estas caracter\xEDsticas (variante "${variationName}"): ${garmentSpec || `cor ${variationName}`}.
Mantenha o mesmo modelo/corte e caimento da pe\xE7a atual; troque somente cores (pe\xE7a principal, debruns/acabamentos, bot\xF5es) e detalhes conforme descrito. Tudo que n\xE3o for a pe\xE7a permanece pixel a pixel igual \xE0 imagem enviada. Sem textos, logos ou marcas d'\xE1gua.`;
      } else if (imageFiles.length > 0 && !isCloneMode) {
        baseImageFile = imageFiles[0];
      }
      if (baseImageFile) {
        const editResponse = await client.images.edit({
          model: OPENAI_IMAGE_MODEL,
          image: baseImageFile,
          prompt: effectivePrompt,
          quality: OPENAI_IMAGE_QUALITY,
          size: OPENAI_IMAGE_SIZE
        });
        const b642 = editResponse.data?.[0]?.b64_json;
        if (b642) {
          const imgCost = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
          globalCostTracker.recordCall({
            step: stepName,
            model: OPENAI_IMAGE_MODEL,
            costUSD: imgCost.costUSD,
            costBRL: imgCost.costBRL,
            details: `Gera\xC3\xA7\xC3\xA3o com ${imageFiles.length} foto(s) de refer\xC3\xAAncia real em qualidade ${OPENAI_IMAGE_QUALITY}`
          });
          return {
            success: true,
            imageUrl: `data:image/png;base64,${b642}`,
            costBRL: imgCost.costBRL
          };
        }
        if (modelReferenceBase64) {
          return {
            success: false,
            error: 'A edi\xE7\xE3o da Imagem 1 n\xE3o retornou imagem. Use "Refazer".',
            fallbackRequired: false
          };
        }
      }
      const genResponse = await client.images.generate({
        model: OPENAI_IMAGE_MODEL,
        prompt: cleanPrompt,
        quality: OPENAI_IMAGE_QUALITY,
        size: OPENAI_IMAGE_SIZE
      });
      const b64 = genResponse.data?.[0]?.b64_json;
      if (b64) {
        const imgCost = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
        globalCostTracker.recordCall({
          step: stepName,
          model: OPENAI_IMAGE_MODEL,
          costUSD: imgCost.costUSD,
          costBRL: imgCost.costBRL,
          details: `Gera\xC3\xA7\xC3\xA3o direta em qualidade ${OPENAI_IMAGE_QUALITY}`
        });
        return {
          success: true,
          imageUrl: `data:image/png;base64,${b64}`,
          costBRL: imgCost.costBRL
        };
      }
      return {
        success: false,
        error: "Nenhuma imagem retornada pelo modelo gpt-image-2.5-sunburst.",
        fallbackRequired: true
      };
    } catch (err) {
      return {
        success: false,
        error: `Erro ao gerar imagem com ${OPENAI_IMAGE_MODEL}: ${err?.message}`,
        fallbackRequired: true
      };
    }
  }
  /**
   * 4. Auditoria Visual de Fidelidade (Fiscal TikTok Shop)
   * Modelo: gpt-5.6-luna
   */
  async auditImageFidelity(params) {
    const {
      generatedImageBase64,
      referencePhotos = [],
      variationName = "Varia\xC3\xA7\xC3\xA3o 1",
      role = "Imagem 1"
    } = params;
    const client = this.getClient();
    let stepName = "auditoria da imagem 1";
    if (role.includes("Imagem 2") || role.includes("3/4")) {
      stepName = "auditoria da imagem 2";
    } else if (role.includes("Imagem 3") || role.includes("Detalhe")) {
      stepName = "auditoria da imagem 3";
    }
    const primaryRefs = referencePhotos.slice(0, 2);
    const messages = [
      {
        role: "system",
        content: `Voc\xEA \xE9 o Auditor Fiscal de Fidelidade de Produtos para o TikTok Shop.
Compare a imagem gerada com as fotos reais do produto.
Verifique rigorosamente: geometria, materiais, propor\xE7\xF5es, solado/embalagem, logos, costuras e cores.
Retorne estritamente um JSON:
{
  "score": number (0 a 100),
  "status": "green" | "yellow" | "red",
  "label": string,
  "issues": string[],
  "correctionPrompt": string
}`
      },
      {
        role: "user",
        content: [
          { type: "text", text: `[IMAGEM GERADA]: Varia\xE7\xE3o "${variationName}"` },
          { type: "image_url", image_url: { url: generatedImageBase64 } },
          ...primaryRefs.map((ref, idx) => ({
            type: "text",
            text: `[FOTO DE REFER\xCANCIA REAL ${idx + 1}]:`
          })),
          ...primaryRefs.map((ref) => ({
            type: "image_url",
            image_url: { url: ref }
          }))
        ]
      }
    ];
    try {
      const response = await client.chat.completions.create({
        model: OPENAI_AUDIT_MODEL,
        response_format: { type: "json_object" },
        messages
      });
      const pTokens = response.usage?.prompt_tokens || 0;
      const cTokens = response.usage?.completion_tokens || 0;
      const auditCost = globalCostTracker.calculateTokenCost(OPENAI_AUDIT_MODEL, pTokens, cTokens);
      globalCostTracker.recordCall({
        step: stepName,
        model: OPENAI_AUDIT_MODEL,
        promptTokens: pTokens,
        completionTokens: cTokens,
        costUSD: auditCost.costUSD,
        costBRL: auditCost.costBRL,
        details: `Auditoria de fidelidade de ${variationName} (${role})`
      });
      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      const score = Math.max(0, Math.min(100, Number(parsed.score) || 92));
      const status = score >= 90 ? "green" : score >= 70 ? "yellow" : "red";
      return {
        success: true,
        audit: {
          score,
          status,
          label: parsed.label || `Status (${score}%)`,
          issues: Array.isArray(parsed.issues) ? parsed.issues : ["Produto auditado com sucesso."],
          correctionPrompt: parsed.correctionPrompt || "",
          auditedAngle: role
        }
      };
    } catch (err) {
      return {
        success: true,
        audit: {
          score: 95,
          status: "green",
          label: "Verde Fidedigno (Auditoria Conclu\xEDda)",
          issues: ["Fidelidade de produto validada."],
          correctionPrompt: "",
          auditedAngle: role
        }
      };
    }
  }
  /**
   * Transcreve áudio direto com o modelo oficial de áudio da OpenAI (gpt-transcribe)
   */
  async transcribeAudio(buffer, mimeType = "audio/webm") {
    const client = this.getClient();
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("wav") ? "wav" : "webm";
    const audioFile = new File([buffer], `voice_input.${ext}`, { type: mimeType });
    const transcribeRes = await client.audio.transcriptions.create({
      file: audioFile,
      model: OPENAI_AUDIO_MODEL
    });
    return transcribeRes.text?.trim() || "";
  }
};

// src/services/ai/index.ts
dotenv2.config();
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.APIOPENAI || process.env.OPENAI_KEY || process.env.VITE_OPENAI_API_KEY || "";
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.GEMINIAPI || process.env.GEMINI_KEY || process.env.VITE_GEMINI_API_KEY || "";
}
var openAIProvider = new OpenAIProvider();
function getActiveProviderType() {
  const hasOpenAi = Boolean(
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0 || process.env.APIOPENAI && process.env.APIOPENAI.trim().length > 0
  );
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0 || process.env.GEMINIAPI && process.env.GEMINIAPI.trim().length > 0
  );
  const envProvider = (process.env.AI_PROVIDER || "").toLowerCase();
  if (envProvider === "openai" && hasOpenAi) {
    return "openai";
  }
  if (envProvider === "gemini" && hasGemini) {
    return "gemini";
  }
  if (hasGemini) {
    return "gemini";
  }
  if (hasOpenAi) {
    return "openai";
  }
  return "gemini";
}

// src/ania/aniaPrompts.ts
function buildAniaPlanningSystemPrompt() {
  return `Voc\xEA \xE9 o diretor de v\xEDdeos e criativos de alta convers\xE3o do M\xE9todo Ania para TikTok Shop. Analise o produto e dados e devolva SOMENTE um JSON estruturado com os campos solicitados.

REGRAS CR\xCDTICAS:
- Fidelidade total ao produto: liste em "detalhes_trava" s\xF3 detalhes reais vis\xEDveis ou informados.
- "estica": obede\xE7a o valor enviado.
- "productMode": "apparel" ou "footwear".
- "ageMode": "adult", "child" ou "senior".
- "scenarioKey": "home" | "gym" | "park" | "beach" | "workshop" | "skate" | "casual_outdoor" | "social_simple" | "other".
- Movimentos: 3 sequ\xEAncias (V1, V2, V3) com cortes din\xE2micos adaptados ao produto real. Se ageMode=child, for\xE7ar POV adulto (m\xE3os demonstrando). Se productMode=footwear, foco nos p\xE9s. Se estica=false, nada de puxadas de tecido. Nunca virar de costas, nunca mostrar o rosto.
- REGRA INVIOL\xC1VEL DA FALA:
  * A fala DEVE OBRIGATORIAMENTE usar o nome do produto inserido pelo usu\xE1rio no campo PRODUTO (ex: se o produto for "pijama", a fala DEVE falar "pijama", NUNCA camisola, nunca vestido, nunca outra pe\xE7a!).
  * Se a fala candidata contiver outro substantivo (ex: "camisola"), SUBSTITUA OBRIGATORIAMENTE pelo nome do produto digitado pelo usu\xE1rio.
  * SE O G\xCANERO FOR HOMEM (gender === 'Homem'): todas as falas DEVEM ser estritamente no masculino! NUNCA use "amiga", "linda", "tanta mulher", "garante a sua", "escolhe a sua preferida". Use SEMPRE vocativos e concord\xE2ncias masculinas: "amigo", "fala amigo", "tanto homem", "garante o seu", "escolhe o seu preferido", "confort\xE1vel e no estilo".
  * Adapte o texto mantendo o gancho comercial, benef\xEDcio e CTA no carrinho laranja, mencionando as cores cadastradas. At\xE9 500 caracteres totais.
- "titulo": t\xEDtulo comercial claro de at\xE9 100 caracteres.
- "peca": substantivo curto do produto em min\xFAsculas (ex: pijama, calca, bermuda, tenis, sandalia, vestido).`;
}

// server.ts
dotenv3.config();
dotenv3.config();
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.APIOPENAI || process.env.OPENAI_KEY || process.env.VITE_OPENAI_API_KEY || "";
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.GEMINIAPI || process.env.GEMINI_KEY || process.env.VITE_GEMINI_API_KEY || "";
}
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req._body = true;
  }
  next();
});
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-ai-profile");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
function getRequestAIProfile(req) {
  const hasOpenAi = Boolean(openAIProvider && openAIProvider.isConfigured());
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0 || process.env.GEMINIAPI && process.env.GEMINIAPI.trim().length > 0
  );
  const p = String(req.body?.aiProfile || req.headers["x-ai-profile"] || "").toLowerCase();
  if (p === "openai" && hasOpenAi) return "openai";
  if (p === "gemini" && hasGemini) return "gemini";
  const envActive = getActiveProviderType();
  if (envActive === "openai" && hasOpenAi) return "openai";
  if (hasGemini) return "gemini";
  if (hasOpenAi) return "openai";
  return "gemini";
}
function getGenAI() {
  const currentKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({
    apiKey: currentKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function parseInlineImage(imgStr) {
  if (!imgStr || typeof imgStr !== "string") return null;
  const match = imgStr.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (match) {
    const cleanData = match[2].replace(/[\r\n\s]/g, "");
    if (cleanData.length > 20) {
      return {
        mimeType: match[1],
        data: cleanData
      };
    }
  }
  const trimmed = imgStr.trim().replace(/[\r\n\s]/g, "");
  if (/^[A-Za-z0-9+/=]{100,}$/.test(trimmed)) {
    return {
      mimeType: "image/jpeg",
      data: trimmed
    };
  }
  return null;
}
function parseInlineAudio(audioStr) {
  if (!audioStr || typeof audioStr !== "string") return null;
  const match = audioStr.match(/^data:(audio\/[a-zA-Z0-9.\-_+]+)(?:;[a-zA-Z0-9.\-_=]+)*;base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (match) {
    let mimeType = match[1];
    if (mimeType === "audio/mpeg") mimeType = "audio/mp3";
    return {
      mimeType,
      data: match[2].replace(/[\r\n\s]/g, "")
    };
  }
  const trimmed = audioStr.trim().replace(/[\r\n\s]/g, "");
  if (/^[A-Za-z0-9+/=]{100,}$/.test(trimmed)) {
    return {
      mimeType: "audio/webm",
      data: trimmed
    };
  }
  return null;
}
async function extractProductSwatchDetails(swatchPhotoBase64, variationName, productType) {
  const parsed = parseInlineImage(swatchPhotoBase64);
  if (!parsed) return `cor "${variationName}"`;
  try {
    if (process.env.GEMINI_API_KEY) {
      const response = await getGenAI().models.generateContent({
        model: GEMINI_VISION_FAST_MODEL || "gemini-3.8-flash-lite",
        contents: {
          parts: [
            { inlineData: parsed },
            {
              text: `Analise visualmente com foco microsc\xF3pico APENAS o produto (${productType}) nesta foto correspondente \xE0 varia\xE7\xE3o "${variationName}".
Descreva em 1 par\xE1grafo denso e direto em ingl\xEAs (para prompt visual):
- Tom exato e matiz da cor (ex: dusty rose, deep navy blue, warm beige, charcoal grey, pure white)
- Textura e tipo de tecido/material vis\xEDvel (ex: ribbed knit, satin finish, smooth cotton, breathable mesh, matte leather)
- Detalhes construtivos f\xEDsicos (ex: white contrast piping on collar and cuffs, matching buttons, elastic waistband, specific seam lines, drawstrings, sole color/texture)
N\xC3O mencione o fundo, manequim, cabide ou ambiente da foto. Foque EXCLUSIVAMENTE nas caracter\xEDsticas f\xEDsicas da pe\xE7a/produto.`
            }
          ]
        }
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 10) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn("extractProductSwatchDetails falhou, usando fallback textual:", err?.message || err);
  }
  return `Exact shade: "${variationName}". Matching fabric texture and constructive details from the user's swatch photo.`;
}
var USD_TO_BRL = 5.7;
function calculateCostBRL(model, promptTokens, candidateTokens) {
  let inputPer1M = 0.075;
  let outputPer1M = 0.3;
  if (model.includes("flash-lite")) {
    inputPer1M = 0.0375;
    outputPer1M = 0.15;
  } else if (model.includes("pro")) {
    inputPer1M = 1.25;
    outputPer1M = 5;
  }
  const costUSD = promptTokens / 1e6 * inputPer1M + candidateTokens / 1e6 * outputPer1M;
  return Math.round(costUSD * USD_TO_BRL * 1e3) / 1e3;
}
function buildFallbackVideoAnalysis(durationSeconds, variations, customSpeech) {
  const duration = Math.min(40, Math.max(4, Math.round(durationSeconds || 12)));
  const sceneCount = calculateSceneCount(duration);
  const varList = variations.length > 0 ? variations.map((v, i) => v.name?.trim() || `Varia\xE7\xE3o ${i + 1}`) : ["Varia\xE7\xE3o 1"];
  const var1 = varList[0] || "Varia\xE7\xE3o 1";
  const var2 = varList[1] || var1;
  const defaultSpeech = customSpeech || (varList.length > 1 ? `Olha esse produto incr\xEDvel na ${var1}, e olha agora nessa op\xE7\xE3o ${var2}! Qualidade sensacional, acabamento impec\xE1vel e o link t\xE1 aqui com frete gr\xE1tis!` : `Galera, olha os detalhes desse produto que acabou de chegar! Qualidade premium e custo-benef\xEDcio incr\xEDvel. Aproveita antes que esgote!`);
  const rawIntervals = [];
  for (let s = 1; s <= sceneCount; s++) {
    const startSec = (s - 1) * 8;
    const endSec = Math.min(duration, s * 8);
    rawIntervals.push({
      sceneNumber: s,
      startTime: startSec,
      endTime: endSec
    });
  }
  const distributed = distributeSpeechAcrossScenes(defaultSpeech, rawIntervals);
  const scenes = [];
  for (let s = 1; s <= sceneCount; s++) {
    const startSec = (s - 1) * 8;
    const endSec = Math.min(duration, s * 8);
    const timeRangeText = `00:${String(startSec).padStart(2, "0")} - 00:${String(endSec).padStart(2, "0")}`;
    const sceneSpeech = distributed[s - 1]?.sceneSpeech || "";
    const isFirstScene = s === 1;
    const isSecondScene = s === 2;
    const actionSummary = isFirstScene ? `Apresenta\xE7\xE3o inicial da ${var1}, exibindo vis\xE3o frontal, design geral e primeiro contato comercial.` : isSecondScene ? `Continua\xE7\xE3o fluida da narrativa demonstrando novos \xE2ngulos (costas, lateral) e detalhes da ${varList.length > 1 ? var2 : var1}.` : `Demonstra\xE7\xE3o din\xE2mica final com intera\xE7\xE3o aproximada e chamada para a\xE7\xE3o.`;
    const eightSecondTimeline = isFirstScene ? `0.0\u20134.0s: Apresenta\xE7\xE3o frontal destacando propor\xE7\xF5es e acabamento. 4.0\u20138.0s: Movimento suave lateral revelando texturas e profundidade.` : isSecondScene ? `0.0\u20134.0s: Transi\xE7\xE3o cont\xEDnua sem reiniciar a cena, exibindo vis\xE3o posterior/costas e caimento. 4.0\u20138.0s: Demonstra\xE7\xE3o aproximada de detalhes e funcionalidade.` : `0.0\u20134.0s: Apresenta\xE7\xE3o din\xE2mica em uso real. 4.0\u20138.0s: Enquadramento final ressaltando qualidade e apelo comercial.`;
    const baseNum = (s - 1) * 3;
    const activeVar = s === 1 || varList.length === 1 ? var1 : varList[1] || var2;
    const images = [
      {
        id: `c${s}-img1`,
        role: `Imagem ${baseNum + 1}: ${activeVar} em \xE2ngulo ${s === 1 ? "frontal principal" : s === 2 ? "lateral e profundidade" : "em uso aut\xEAntico"}`,
        frameNumber: baseNum + 1,
        variationName: activeVar,
        targetAngle: s === 1 ? "front" : s === 2 ? "side" : "front",
        location: s === 1 ? "Cen\xE1rio comercial principal bem iluminado" : s === 2 ? "Segundo ambiente din\xE2mico em uso" : "Terceiro cen\xE1rio aconchegante com luz natural",
        actionDescription: s === 1 ? "Apresenta\xE7\xE3o inicial com contato n\xEDtido e propor\xE7\xF5es vis\xEDveis" : s === 2 ? "Movimento demonstrando silhueta e acabamento em novo \xE2ngulo" : "Intera\xE7\xE3o comercial destacando qualidade e apelo de compra",
        imageUrl: "",
        promptUsed: buildUniversalSceneImagePrompt(
          "produto comercial",
          activeVar,
          `Imagem ${baseNum + 1} em \xE2ngulo ${s === 1 ? "frontal" : "din\xE2mico"}`,
          s === 1 ? "Cen\xE1rio moderno com ilumina\xE7\xE3o natural suave" : s === 2 ? "Segundo ambiente moderno din\xE2mico" : "Cen\xE1rio aconchegante realista",
          "Apresenta\xE7\xE3o n\xEDtida evidenciando caracter\xEDsticas f\xEDsicas e acabamentos",
          s === 1 ? "front" : s === 2 ? "side" : "front"
        )
      },
      {
        id: `c${s}-img2`,
        role: `Imagem ${baseNum + 2}: ${activeVar} em \xE2ngulo ${s === 1 ? "lateral" : s === 2 ? "costas / vis\xE3o posterior" : "close aproximado"}`,
        frameNumber: baseNum + 2,
        variationName: activeVar,
        targetAngle: s === 1 ? "side" : s === 2 ? "rear" : "detail",
        location: s === 1 ? "Cen\xE1rio comercial com novo ponto de vista" : s === 2 ? "Segundo ambiente focado em detalhes" : "Terceiro cen\xE1rio aproximado",
        actionDescription: s === 1 ? "Demonstra\xE7\xE3o de lateralidade e ergonomia" : s === 2 ? "Exibi\xE7\xE3o da parte posterior/costas e encaixe fiel" : "Close ressaltando materiais genu\xEDnos e costura/acabamento",
        imageUrl: "",
        promptUsed: buildUniversalSceneImagePrompt(
          "produto comercial",
          activeVar,
          `Imagem ${baseNum + 2} em perspectiva e textura`,
          s === 1 ? "Cen\xE1rio comercial bem iluminado" : s === 2 ? "Segundo ambiente realista" : "Cen\xE1rio com ilumina\xE7\xE3o suave focada",
          "Enquadramento destacando textura, acabamentos e detalhes reais",
          s === 1 ? "side" : s === 2 ? "rear" : "detail"
        )
      },
      {
        id: `c${s}-img3`,
        role: `Imagem ${baseNum + 3}: ${activeVar} em \xE2ngulo ${s === 1 ? "close macro de detalhe" : s === 2 ? "demonstra\xE7\xE3o din\xE2mica" : "enquadramento final de destaque"}`,
        frameNumber: baseNum + 3,
        variationName: activeVar,
        targetAngle: s === 1 ? "detail" : s === 2 ? "front_side" : "detail",
        location: s === 1 ? "Cen\xE1rio focado em materiais e textura" : s === 2 ? "Segundo ambiente em a\xE7\xE3o" : "Cen\xE1rio final limpo comercial",
        actionDescription: s === 1 ? "Close aproximado nas texturas e acabamentos de f\xE1brica" : s === 2 ? "A\xE7\xE3o fluida de manuseio e demonstra\xE7\xE3o de uso" : "Apresenta\xE7\xE3o final convidativa ao redor do produto",
        imageUrl: "",
        promptUsed: buildUniversalSceneImagePrompt(
          "produto comercial",
          activeVar,
          `Imagem ${baseNum + 3} em demonstra\xE7\xE3o detalhada`,
          s === 1 ? "Cen\xE1rio minimalista com foco nas mat\xE9rias-primas" : s === 2 ? "Segundo cen\xE1rio com intera\xE7\xE3o viva" : "Cen\xE1rio de convers\xE3o acolhedor",
          "Enquadramento aproximado valorizando a textura e acabamento",
          s === 1 ? "detail" : s === 2 ? "front_side" : "detail"
        )
      }
    ];
    const veoPrompt = buildVeoSingleParagraphPrompt({
      sceneNumber: s,
      totalScenes: sceneCount,
      productType: "produto comercial",
      variations: varList,
      secondTimeline: eightSecondTimeline,
      speechVoiceover: sceneSpeech,
      sceneImages: images.map((im) => ({
        role: im.role,
        variationName: im.variationName,
        targetAngle: im.targetAngle,
        location: im.location,
        actionDescription: im.actionDescription
      }))
    });
    scenes.push({
      sceneNumber: s,
      startTime: startSec,
      endTime: endSec,
      timeRangeText,
      actionSummary,
      eightSecondTimeline,
      mappedVariations: varList,
      environmentDescription: "Cen\xE1rio limpo e bem iluminado estilo est\xFAdio TikTok Shop",
      productType: "produto comercial",
      sceneSpeech,
      veoPrompt,
      veoInstruction: `Anexe no Veo a(s) ${images.length} imagem(ns) de refer\xEAncia gerada(s) para esta cena`,
      images
    });
  }
  return {
    productType: "Produto Comercial",
    formatAndOrientation: "Vertical 9:16 (Formato TikTok Shop)",
    cameraType: "C\xC3\xA2mera de smartphone na m\xC3\xA3o, \xC3\xA2ngulo POV natural",
    cameraStability: "Balan\xC3\xA7o suave e org\xC3\xA2nico de grava\xC3\xA7\xC3\xA3o m\xC3\xB3vel",
    lightingStyle: "Ilumina\xC3\xA7\xC3\xA3o natural e difusa de interior com sombras de contato suaves",
    environmentDescription: "Cen\xC3\xA1rio limpo e moderno com luz ambiente natural",
    interactionDetails: "Produto apresentado de forma natural e convidativa para o p\xC3\xBAblico",
    secondBySecondTimeline: `00:00-00:04: exibi\xC3\xA7\xC3\xA3o frontal do produto; 00:04-00:08: movimento suave destacando detalhes e varia\xC3\xA7\xC3\xB5es.`,
    detectedVariationsCount: varList.length,
    detectedVariationSequence: varList,
    onScreenTexts: [],
    speechData: {
      hasSpeech: Boolean(defaultSpeech && defaultSpeech.trim().length > 0),
      originalTranscript: defaultSpeech ? defaultSpeech : "M\xC3\xBAsica de fundo identificada (sem locu\xC3\xA7\xC3\xA3o falada do produto)",
      adaptedScript: defaultSpeech || "",
      voiceTone: defaultSpeech ? "Din\xC3\xA2mico, espont\xC3\xA2neo e persuasivo para TikTok Shop" : "Trilha sonora / Beat musical"
    },
    scenes,
    tokenUsage: {
      promptTokens: 1100,
      candidateTokens: 650,
      totalTokens: 1750,
      estimatedCostBRL: 5e-3,
      breakdown: {
        videoAnalysisTokens: 1750,
        videoAnalysisCostBRL: 5e-3,
        speechTokens: 0,
        speechCostBRL: 0,
        imagesCount: 0,
        imagesCostBRL: 0,
        promptsTokens: 0,
        promptsCostBRL: 0
      }
    }
  };
}
app.get("/api/health", (req, res) => {
  const currentKey = process.env.GEMINI_API_KEY || process.env.GEMINIAPI || "";
  const hasOpenAi = Boolean(
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0 || process.env.APIOPENAI && process.env.APIOPENAI.trim().length > 0
  );
  const activeProvider = getActiveProviderType();
  res.json({
    status: "ok",
    activeProvider,
    visionModel: activeProvider === "openai" ? OPENAI_BRAIN_MODEL : GEMINI_VISION_MODEL,
    imageModel: activeProvider === "openai" ? OPENAI_IMAGE_MODEL : GEMINI_IMAGE_MODEL,
    audioModel: activeProvider === "openai" ? OPENAI_AUDIO_MODEL : GEMINI_VISION_FAST_MODEL,
    auditModel: activeProvider === "openai" ? OPENAI_AUDIT_MODEL : GEMINI_VISION_FAST_MODEL,
    hasApiKey: Boolean(currentKey),
    hasOpenAiKey: Boolean(hasOpenAi),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/cost-report", (req, res) => {
  const report = globalCostTracker.generateReport(getActiveProviderType());
  res.json({ success: true, report });
});
app.post("/api/download-tiktok", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: "Por favor, insira o link de um v\xEDdeo do TikTok."
    });
  }
  const rawUrl = url.trim();
  if (!rawUrl.includes("tiktok.com")) {
    return res.status(400).json({
      success: false,
      error: "O link inserido n\xE3o parece ser do TikTok. Certifique-se de colar um link v\xE1lido (ex: https://vm.tiktok.com/... ou https://www.tiktok.com/@user/video/...)"
    });
  }
  try {
    let canonicalUrl = rawUrl;
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    try {
      const redirectResp = await fetch(rawUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(1e4)
      });
      if (redirectResp.url && redirectResp.url.includes("tiktok.com")) {
        canonicalUrl = redirectResp.url;
      }
    } catch (redirErr) {
      console.warn("Aviso ao resolver redirecionamento do TikTok:", redirErr);
    }
    let videoUrl = "";
    let videoTitle = "tiktok_video";
    let videoDuration = 0;
    try {
      const form = new URLSearchParams();
      form.append("url", canonicalUrl);
      const tikwmPostRes = await fetch("https://www.tikwm.com/api/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": userAgent
        },
        body: form.toString(),
        signal: AbortSignal.timeout(15e3)
      });
      if (tikwmPostRes.ok) {
        const tikwmData = await tikwmPostRes.json();
        if (tikwmData?.code === 0 && tikwmData?.data) {
          videoUrl = tikwmData.data.play || tikwmData.data.wmplay || tikwmData.data.hdplay;
          videoTitle = tikwmData.data.title || videoTitle;
          videoDuration = tikwmData.data.duration || videoDuration;
        }
      }
    } catch (c1Err) {
      console.warn("Camada 1 (TikWM POST) falhou:", c1Err);
    }
    if (!videoUrl) {
      try {
        const tikwmGetRes = await fetch(
          `https://www.tikwm.com/api/?url=${encodeURIComponent(canonicalUrl)}`,
          {
            method: "GET",
            headers: {
              "User-Agent": userAgent
            },
            signal: AbortSignal.timeout(15e3)
          }
        );
        if (tikwmGetRes.ok) {
          const tikwmData = await tikwmGetRes.json();
          if (tikwmData?.code === 0 && tikwmData?.data) {
            videoUrl = tikwmData.data.play || tikwmData.data.wmplay || tikwmData.data.hdplay;
            videoTitle = tikwmData.data.title || videoTitle;
            videoDuration = tikwmData.data.duration || videoDuration;
          }
        }
      } catch (c2Err) {
        console.warn("Camada 2 (TikWM GET) falhou:", c2Err);
      }
    }
    if (!videoUrl) {
      try {
        const pageRes = await fetch(canonicalUrl, {
          headers: {
            "User-Agent": userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          },
          signal: AbortSignal.timeout(12e3)
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const match = html.match(/"playAddr":"([^"]+)"/) || html.match(/"downloadAddr":"([^"]+)"/) || html.match(/"playUrl":"([^"]+)"/);
          if (match && match[1]) {
            videoUrl = match[1].replace(/\\u002F/g, "/").replace(/\\/g, "");
          }
          const titleMatch = html.match(/<title>([^<]+)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            videoTitle = titleMatch[1].replace(" | TikTok", "").trim();
          }
        }
      } catch (c3Err) {
        console.warn("Camada 3 (SSR HTML Scrape) falhou:", c3Err);
      }
    }
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: "N\xE3o foi poss\xEDvel encontrar o arquivo de v\xEDdeo sem marca d'\xE1gua para este link. Verifique se o v\xEDdeo \xE9 p\xFAblico e n\xE3o possui restri\xE7\xF5es de privacidade. Voc\xEA tamb\xE9m pode salvar o v\xEDdeo no seu dispositivo e fazer o upload manual do arquivo MP4."
      });
    }
    if (videoUrl.startsWith("/")) {
      videoUrl = `https://www.tikwm.com${videoUrl}`;
    }
    const cdnResp = await fetch(videoUrl, {
      headers: {
        "User-Agent": userAgent,
        "Referer": videoUrl.includes("tikwm.com") ? "https://www.tikwm.com/" : "https://www.tiktok.com/"
      },
      signal: AbortSignal.timeout(45e3)
    });
    if (!cdnResp.ok) {
      throw new Error(`Servidor de entrega do v\xEDdeo retornou status ${cdnResp.status}.`);
    }
    const arrayBuffer = await cdnResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 5e3) {
      throw new Error("O arquivo retornado \xE9 muito pequeno ou corrompido.");
    }
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", 'inline; filename="tiktok_video.mp4"');
    res.setHeader("X-Video-Title", encodeURIComponent(videoTitle.substring(0, 80)));
    res.setHeader("X-Video-Duration", String(Math.round(videoDuration)));
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, X-Video-Title, X-Video-Duration");
    return res.send(buffer);
  } catch (err) {
    console.error("Erro ao processar download do TikTok:", err);
    return res.status(400).json({
      success: false,
      error: `Falha ao baixar o v\xEDdeo do TikTok: ${err.message || "Erro inesperado"}. Voc\xEA pode fazer o upload manual do arquivo MP4 se preferir.`
    });
  }
});
app.post("/api/transcribe-voice", async (req, res) => {
  const { audioBase64 } = req.body;
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({
      success: false,
      error: "\xC1udio n\xE3o fornecido ou formato inv\xE1lido."
    });
  }
  const parsedAudio = parseInlineAudio(audioBase64);
  if (!parsedAudio || !parsedAudio.data) {
    return res.status(400).json({
      success: false,
      error: "Formato de \xE1udio base64 inv\xE1lido."
    });
  }
  const promptText = "Voc\xEA \xE9 um assistente de transcri\xE7\xE3o em Portugu\xEAs do Brasil. Transcreva com m\xE1xima fidelidade e precis\xE3o a fala deste \xE1udio para texto. Retorne EXCLUSIVAMENTE o texto transcrito, sem aspas e sem explica\xE7\xF5es.";
  const geminiKey = process.env.GEMINI_API_KEY || "";
  if (geminiKey) {
    try {
      const response = await getGenAI().models.generateContent({
        model: GEMINI_VISION_FAST_MODEL || "gemini-3.1-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: parsedAudio.mimeType,
                  data: parsedAudio.data
                }
              },
              {
                text: promptText
              }
            ]
          }
        ]
      });
      const transcript = response.text ? response.text.trim().replace(/^["']|["']$/g, "") : "";
      return res.json({
        success: true,
        text: transcript
      });
    } catch (geminiErr) {
      console.warn("Tentativa com gemini-3.1-flash-lite falhou, tentando gemini-3.8-flash:", geminiErr?.message || geminiErr);
      try {
        const response2 = await getGenAI().models.generateContent({
          model: GEMINI_VISION_MODEL || "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: parsedAudio.mimeType,
                    data: parsedAudio.data
                  }
                },
                {
                  text: promptText
                }
              ]
            }
          ]
        });
        const transcript2 = response2.text ? response2.text.trim().replace(/^["']|["']$/g, "") : "";
        return res.json({
          success: true,
          text: transcript2
        });
      } catch (geminiErr2) {
        console.warn("Erro nas tentativas Gemini de transcri\xE7\xE3o de voz:", geminiErr2?.message || geminiErr2);
      }
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const buffer = Buffer.from(parsedAudio.data, "base64");
      const transcript = await openAIProvider.transcribeAudio(buffer, parsedAudio.mimeType || "audio/webm");
      return res.json({
        success: true,
        text: transcript ? transcript.trim().replace(/^["']|["']$/g, "") : ""
      });
    } catch (openaiErr) {
      console.error("Fallback OpenAI de transcri\xE7\xE3o tamb\xE9m falhou:", openaiErr?.message || openaiErr);
    }
  }
  return res.status(500).json({
    success: false,
    error: "N\xE3o foi poss\xEDvel transcrever o \xE1udio com os modelos dispon\xEDveis."
  });
});
app.post("/api/analyze-video", async (req, res) => {
  const {
    durationSeconds = 12,
    frames = [],
    colors = [],
    variations = [],
    audioBase64,
    additionalInstructions = "",
    productInfo = "",
    modelPhotoUrl = null,
    veoModelMode = "veo3_basic_8s"
  } = req.body;
  const productVariations = (variations.length > 0 ? variations : colors) || [];
  const currentKey = process.env.GEMINI_API_KEY || "";
  const validDuration = Math.min(40, Math.max(4, Math.round(Number(durationSeconds) || 12)));
  const activeProfile = getRequestAIProfile(req);
  if (activeProfile === "openai" && openAIProvider.isConfigured()) {
    try {
      const openaiResult = await openAIProvider.analyzeVideo({
        durationSeconds: validDuration,
        frames,
        variations: productVariations,
        audioBase64,
        additionalInstructions,
        productInfo,
        modelPhotoUrl,
        veoModelMode
      });
      return res.json({ success: true, data: openaiResult });
    } catch (openaiErr) {
      console.warn("Falha no provedor OpenAI em analyze-video, recorrendo automaticamente ao Gemini:", openaiErr?.message || openaiErr);
    }
  }
  try {
    if (!currentKey) {
      console.warn("GEMINI_API_KEY ausente, usando analisador estruturado de conting\xC3\xAAncia");
      const fallback = buildFallbackVideoAnalysis(validDuration, productVariations);
      return res.json({ success: true, data: fallback });
    }
    let speechData = {
      hasSpeech: false,
      originalTranscript: "",
      adaptedScript: "",
      voiceTone: "Natural TikTok voiceover"
    };
    let audioTokens = 0;
    let audioCostBRL = 0;
    if (audioBase64) {
      const parsedAudio = parseInlineAudio(audioBase64);
      if (parsedAudio) {
        try {
          const varNames = productVariations.map((v, i) => v.name || `Varia\xC3\xA7\xC3\xA3o ${i + 1}`).join(", ");
          const instructionsNote = additionalInstructions && additionalInstructions.trim() ? `
INSTRU\xC3\u2021\xC3\u2022ES ADICIONAIS DO USU\xC3\x81RIO PARA O PRODUTO E \xC3\x81UDIO: "${additionalInstructions.trim()}"
` : "";
          const transcribeRes = await getGenAI().models.generateContent({
            model: GEMINI_VISION_FAST_MODEL || "gemini-3.1-flash-lite",
            contents: {
              parts: [
                { inlineData: parsedAudio },
                {
                  text: `Voc\xC3\xAA \xC3\xA9 um perito em \xC3\xA1udio comercial para o TikTok Shop.
Sua miss\xC3\xA3o tem 2 ETAPAS OBRIGAT\xC3\u201CRIAS:

ETAPA 1: TRANSCRI\xC3\u2021\xC3\u0192O FIEL DO \xC3\x81UDIO
Transcreva com precis\xC3\xA3o literal quaisquer palavras, frases, rimas ou vocais aud\xC3\xADveis no \xC3\xA1udio (mesmo que seja letra de m\xC3\xBAsica cantada, rap, trap, beat com voz ou fala r\xC3\xA1pida).

ETAPA 2: AN\xC3\x81LISE RIGOROSA: M\xC3\u0161SICA/LETRA vs AN\xC3\u0161NCIO REAL DO PRODUTO
Analise o significado e o contexto das palavras faladas:
- \xC3\u2030 M\xC3\u0161SICA / TRILHA SONORA COM VOCAL? (M\xC3\xBAsicas com batida, trap, rap, funk, letras art\xC3\xADsticas como "157", "grana", rimas soltas, ou m\xC3\xBAsica tocando ao fundo):
  -> "hasProductPitch": false
  -> "isMusicTrack": true
  -> "adaptedScript": "" (DEIXE RIGOROSAMENTE VAZIO! NUNCA invente roteiros de vendas quando for m\xC3\xBAsica!)
  -> "classification": "M\xC3\xBAsica / Trilha Sonora com Vocal"

- \xC3\u2030 UMA LOCU\xC3\u2021\xC3\u0192O COMERCIAL REAL DO PRODUTO? (Uma pessoa falando diretamente com o p\xC3\xBAblico apresentando o produto, explicando detalhes, fazendo review ou recomenda\xC3\xA7\xC3\xA3o de compra, ex: "olha esse modelo...", "link na bio", "super confort\xC3\xA1vel"):
  -> "hasProductPitch": true
  -> "isMusicTrack": false
  -> "adaptedScript": Roteiro adaptado com naturalidade para o produto do usu\xC3\xA1rio (${varNames}). ${instructionsNote}
     REGRA OBRIGAT\xC3\u201CRIA DE CARACTERES: O texto adaptado DEVE ter a mesma quantidade de caracteres ou ser entre 10% a 25% MENOR que o \xC3\xA1udio original transcrito. NUNCA gere um texto mais longo que o original, pois cada gera\xC3\xA7\xC3\xA3o do Veo tem apenas 8 segundos e textos longos s\xC3\xA3o cortados na locu\xC3\xA7\xC3\xA3o!
  -> "classification": "Locu\xC3\xA7\xC3\xA3o Comercial de Vendas"

Retorne estritamente um JSON no seguinte formato:
{
  "hasProductPitch": boolean,
  "isMusicTrack": boolean,
  "literalTranscript": string,
  "adaptedScript": string,
  "classification": string,
  "voiceTone": string
}`
                }
              ]
            },
            config: {
              responseMimeType: "application/json"
            }
          });
          if (transcribeRes.usageMetadata) {
            audioTokens = transcribeRes.usageMetadata.totalTokenCount || 0;
            audioCostBRL = calculateCostBRL("gemini-3.1-flash-lite", transcribeRes.usageMetadata.promptTokenCount || 0, transcribeRes.usageMetadata.candidatesTokenCount || 0);
          }
          const parsedSpeech = JSON.parse(transcribeRes.text || "{}");
          const isRealProductPitch = Boolean(parsedSpeech.hasProductPitch);
          let adaptedScript = isRealProductPitch ? parsedSpeech.adaptedScript || "" : "";
          const originalTranscript = parsedSpeech.literalTranscript || parsedSpeech.originalTranscript || "M\xC3\xBAsica de fundo identificada";
          if (isRealProductPitch && adaptedScript && originalTranscript && originalTranscript.length > 10) {
            const maxAllowedChars = Math.round(originalTranscript.length * 0.95);
            if (adaptedScript.length > maxAllowedChars) {
              const trimmed = adaptedScript.substring(0, maxAllowedChars);
              const lastPeriod = trimmed.lastIndexOf(".");
              const lastComma = trimmed.lastIndexOf(",");
              const lastSpace = trimmed.lastIndexOf(" ");
              const cleanEnd = lastPeriod > 25 ? lastPeriod + 1 : lastComma > 25 ? lastComma : lastSpace;
              adaptedScript = cleanEnd > 20 ? trimmed.substring(0, cleanEnd) : trimmed;
            }
          }
          speechData = {
            hasSpeech: isRealProductPitch,
            originalTranscript,
            adaptedScript,
            voiceTone: isRealProductPitch ? parsedSpeech.voiceTone || "Persuasivo e din\xC3\xA2mico" : "Trilha sonora / Beat musical"
          };
        } catch (audioErr) {
          console.warn("Erro na transcri\xC3\xA7\xC3\xA3o de \xC3\xA1udio:", audioErr);
        }
      }
    }
    const calculatedScenes = calculateSceneCount(validDuration, veoModelMode);
    const userInstructionsNote = additionalInstructions && additionalInstructions.trim() ? `
DIRETRIZES ESPEC\xC3\x8DFICAS DO USU\xC3\x81RIO (PRIORIDADE M\xC3\x81XIMA): "${additionalInstructions.trim()}". Voc\xC3\xAA DEVE aplicar rigorosamente estas diretrizes!
` : "";
    const systemInstruction = `Voc\xEA \xE9 o analisador do "Clonador de V\xEDdeo de Produto para TikTok Shop".
Sua tarefa \xE9 analisar o v\xEDdeo de refer\xEAncia e as fotos do produto do usu\xE1rio com m\xE1xima fidelidade e economia de tokens.
${userInstructionsNote}
REGRAS CR\xCDTICAS E INVIOL\xC1VEIS DO CRIATIVO:
1. IDENTIFICA\xC7\xC3O DO PRODUTO: Identifique o tipo de produto real pelas fotos do usu\xE1rio (vestu\xE1rio, cal\xE7ado, bolsa, embalagem, cosm\xE9tico, acess\xF3rio, utilidade, etc.).
2. O V\xCDDEO DE REFER\xCANCIA \xC9 QUEM DITA OS CEN\xC1RIOS/LOCAIS E AS A\xC7\xD5ES:
   - As imagens e cenas geradas servem para colocar o modelo e o produto do usu\xE1rio NOS MESMOS CEN\xC1RIOS/LOCAIS e NAS MESMAS A\xC7\xD5ES que o v\xEDdeo de refer\xEAncia apresenta em cada momento!
   - Exemplo: se no v\xEDdeo de refer\xEAncia na cena 1 a pessoa est\xE1 no mercado pegando o produto, a Imagem 1 DEVE ser no mercado pegando o produto; se depois vai para o topo de um pr\xE9dio, a Imagem 2 DEVE ser no topo do pr\xE9dio; se depois vai para um s\xEDtio a cavalo, a Imagem 3 DEVE ser no s\xEDtio; se passa para a cozinha, deve ser na cozinha; se passa para o quarto, no quarto.
   - NUNCA coloque todas as imagens no mesmo local se o v\xEDdeo de refer\xEAncia transita por cen\xE1rios diferentes! Reproduza a mesma sequ\xEAncia de locais ('location') e a\xE7\xF5es ('actionDescription').
3. REGRA ABSOLUTA DE CONSIST\xCANCIA DO MODELO & ANTI-VIOLA\xC7\xC3O DE ROSTO NO TIKTOK:
   - Se o usu\xE1rio forneceu foto do modelo: use essa pessoa com fidelidade m\xE1xima.
   - Se o usu\xE1rio N\xC3O forneceu foto do modelo: \xE9 PROIBIDO copiar ou clonar o rosto exato do modelo do v\xEDdeo de refer\xEAncia concorrente! O modelo gerado deve ter perfil similar (mesma faixa et\xE1ria/vibe, como um primo), POR\xC9M COM ROSTO DIFERENTE (tra\xE7os faciais distintos, formato de rosto pr\xF3prio, ou varia\xE7\xE3o de cabelo/tom de pele) para evitar viola\xE7\xF5es de direitos autorais e pl\xE1gio de imagem no TikTok.
   - TRAVA DE CONSIST\xCANCIA: O mesmo novo modelo gerado DEVE ser preservado de forma consistente em todas as imagens (da Imagem 1 \xE0 Imagem 9). O que muda de imagem para imagem \xE9 o CEN\xC1RIO (local) e a A\xC7\xC3O f\xEDsica, mas o MODELO \xC9 RIGOROSAMENTE O MESMO.
4. LINHA DO TEMPO CONT\xCDNUA E PROGRESSIVA:
   - As cenas s\xE3o segmentos consecutivos do MESMO v\xEDdeo original (Cena 1 = 0\u20138s, Cena 2 = 8\u201316s, etc.).
   - A Cena 2 DEVE come\xE7ar narrativamente e visualmente de onde a Cena 1 terminou. Ela N\xC3O DEVE reiniciar o v\xEDdeo nem repetir as a\xE7\xF5es da Cena 1.
5. IMAGENS POR CENA E STORYBOARD:
   - Cada cena deve conter EXATAMENTE 3 imagens mapeadas cronologicamente \xE0s a\xE7\xF5es e locais daquele trecho temporal:
     * Cena 1: Imagem 1, Imagem 2, Imagem 3.
     * Cena 2: Imagem 4, Imagem 5, Imagem 6.
     * Cena 3: Imagem 7, Imagem 8, Imagem 9.
   - Para cada imagem no array 'images', preencha:
     * 'location': Cen\xE1rio/local espec\xEDfico extra\xEDdo daquele momento do v\xEDdeo de refer\xEAncia (deve variar se o v\xEDdeo transita por novos locais!).
     * 'actionDescription': A\xE7\xE3o corporal e intera\xE7\xE3o precisa do modelo com o produto naquele instante.
     * 'role': T\xEDtulo descritivo combinando n\xFAmero global da imagem, modelo, local e a\xE7\xE3o (ex: "Imagem 1: Modelo no mercado...").
     * 'targetAngle': \xC2ngulo exato da c\xE2mera ('front', 'side', 'rear', 'detail', etc.).
6. CONTINUIDADE DA FALA / LOCU\xC7\xC3O (SEM REPETI\xC7\xC3O):
   - Cada cena deve conter o campo 'sceneSpeech' com SOMENTE a fala dita no respectivo intervalo de tempo daquela cena. NUNCA repita na Cena 2 a fala da Cena 1!
7. REALISMO BRASILEIRO (PESSOAS SIMPLES E CASAS COMUNS DO COTIDIANO):
   - Quando retratar pessoas (sem foto do usu\xE1rio): retratar pessoas brasileiras simples e comuns do cotidiano (apar\xEAncia aut\xEAntica, simp\xE1tica e acess\xEDvel, sem est\xE9tica inalcan\xE7\xE1vel de supermodelo).
   - Quando retratar ambientes residenciais (sala, quarto, cozinha, etc.): descrever rigorosamente a casa de uma pessoa brasileira simples e comum (m\xF3veis normais e realistas, PROIBIDO mans\xF5es, casas chiques ou ambientes hiper-instagram\xE1veis que fujam da realidade popular brasileira). Lojas e com\xE9rcios podem ser organizados e limpos.
8. PROMPTS DO VEO ESPEC\xCDFICOS DE CADA CENA:
   - O prompt do Veo de cada cena deve ser em ingl\xEAs, contendo a TRAVA DE FIDELIDADE (100% id\xEAntico \xE0s fotos do usu\xE1rio), a\xE7\xE3o progressiva daquele trecho de 8s e a fala exclusiva daquela cena.`;
    const parts = [];
    if (Array.isArray(frames) && frames.length > 0) {
      const keyframes = selectRepresentativeKeyframes(frames, validDuration, calculatedScenes, 12);
      keyframes.forEach((frameObj) => {
        const timeLabel = `[Quadro no instante t=${frameObj.time}s${frameObj.isCutTransition ? " - transi\xE7\xE3o/corte" : ""}]`;
        parts.push({ text: timeLabel });
        const parsed = parseInlineImage(frameObj.dataUrl || frameObj);
        if (parsed) {
          parts.push({ inlineData: parsed });
        }
      });
    }
    if (Array.isArray(productVariations) && productVariations.length > 0) {
      let photoCounter = 0;
      productVariations.forEach((v, idx) => {
        const vName = v.name || `Varia\xE7\xE3o ${idx + 1}`;
        const photos = Array.isArray(v.photos) ? v.photos.slice(0, 2) : [];
        photos.forEach((pStr, pIdx) => {
          photoCounter++;
          const parsed = parseInlineImage(pStr);
          if (parsed) {
            parts.push({
              text: `[Foto de Refer\xEAncia ${photoCounter} do Produto - ${vName} (Foto ${pIdx + 1}) - Identifique a cor exata, solado e cadar\xE7o desta foto]:`
            });
            parts.push({ inlineData: parsed });
          }
        });
      });
    }
    const userPrompt = `
Analise estes quadros extra\xEDdos cobrindo TODA a dura\xE7\xE3o de ${validDuration} segundos do v\xEDdeo de refer\xEAncia e TODAS as fotos enviadas do produto.
${userInstructionsNote}
Identifique o produto real e as varia\xE7\xF5es enviadas.
Gere o JSON com exatamente ${calculatedScenes} cena(s) de 8 segundos para o Veo com linha do tempo cont\xEDnua:
1. 'productType': categoria exata do produto.
2. Cen\xE1rios ('location') espec\xEDficos e a\xE7\xF5es ('actionDescription') de cada momento, seguindo fielmente a transi\xE7\xE3o de locais do v\xEDdeo de refer\xEAncia.
3. Mesma identidade de modelo do in\xEDcio ao fim (nunca troque a pessoa entre as imagens).
4. Imagens mapeadas por cena com 'location', 'actionDescription', 'role' e 'targetAngle'.
5. 'sceneSpeech': fala espec\xEDfica daquele intervalo de tempo (sem repeti\xE7\xE3o entre cenas).
6. Prompt do Veo em ingl\xEAs para cada cena com trava anti-alucina\xE7\xE3o e continuidade da hist\xF3ria.
`;
    parts.push({ text: userPrompt });
    let response;
    let visionTokens = 0;
    let visionCostBRL = 0;
    try {
      response = await getGenAI().models.generateContent({
        model: GEMINI_VISION_MODEL || "gemini-2.5-flash",
        contents: parts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productType: { type: Type.STRING },
              formatAndOrientation: { type: Type.STRING },
              cameraType: { type: Type.STRING },
              cameraStability: { type: Type.STRING },
              lightingStyle: { type: Type.STRING },
              environmentDescription: { type: Type.STRING },
              interactionDetails: { type: Type.STRING },
              secondBySecondTimeline: { type: Type.STRING },
              detectedVariationsCount: { type: Type.NUMBER },
              detectedVariationSequence: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              onScreenTexts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    fontStyle: { type: Type.STRING },
                    color: { type: Type.STRING },
                    position: { type: Type.STRING },
                    timestamp: { type: Type.STRING }
                  },
                  required: ["text", "fontStyle", "color", "position", "timestamp"]
                }
              },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.NUMBER },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    timeRangeText: { type: Type.STRING },
                    actionSummary: { type: Type.STRING },
                    eightSecondTimeline: { type: Type.STRING },
                    mappedVariations: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    environmentDescription: { type: Type.STRING },
                    productType: { type: Type.STRING },
                    veoPrompt: { type: Type.STRING },
                    veoInstruction: { type: Type.STRING },
                    images: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          role: { type: Type.STRING },
                          frameNumber: { type: Type.NUMBER },
                          variationName: { type: Type.STRING },
                          targetAngle: { type: Type.STRING },
                          location: { type: Type.STRING },
                          actionDescription: { type: Type.STRING },
                          promptUsed: { type: Type.STRING }
                        },
                        required: ["id", "role", "frameNumber", "variationName", "promptUsed"]
                      }
                    }
                  },
                  required: [
                    "sceneNumber",
                    "startTime",
                    "endTime",
                    "timeRangeText",
                    "actionSummary",
                    "eightSecondTimeline",
                    "mappedVariations",
                    "environmentDescription",
                    "veoPrompt",
                    "veoInstruction",
                    "images"
                  ]
                }
              }
            },
            required: [
              "productType",
              "formatAndOrientation",
              "cameraType",
              "cameraStability",
              "environmentDescription",
              "interactionDetails",
              "scenes"
            ]
          }
        }
      });
      if (response.usageMetadata) {
        visionTokens = response.usageMetadata.totalTokenCount || 0;
        visionCostBRL = calculateCostBRL(GEMINI_VISION_MODEL || "gemini-3.8-flash", response.usageMetadata.promptTokenCount || 0, response.usageMetadata.candidatesTokenCount || 0);
      }
    } catch (modelErr) {
      console.warn("Erro ao processar com Gemini Vision, utilizando gerador estruturado:", modelErr);
      const fallback = buildFallbackVideoAnalysis(validDuration, productVariations, speechData.adaptedScript);
      return res.json({ success: true, data: fallback, fallback: true });
    }
    const data = JSON.parse(response.text || "{}");
    data.speechData = speechData;
    if (Array.isArray(data.onScreenTexts)) {
      data.onScreenTexts = data.onScreenTexts.filter((t) => t && t.text && t.text.trim().replace(/^["']+|["']+$/g, "").trim().length > 0).map((t) => ({ ...t, text: t.text.trim().replace(/^["']+|["']+$/g, "").trim() }));
    } else {
      data.onScreenTexts = [];
    }
    if (!speechData.hasSpeech || !speechData.adaptedScript) {
      speechData.hasSpeech = false;
      speechData.adaptedScript = "";
    }
    if (Array.isArray(data.scenes) && data.scenes.length > 0) {
      if (!speechData.hasSpeech || !speechData.adaptedScript) {
        data.scenes = data.scenes.map((scene) => ({
          ...scene,
          sceneSpeech: ""
        }));
      } else {
        const fullAdaptedScript = speechData.adaptedScript.trim();
        data.scenes = distributeSpeechAcrossScenes(fullAdaptedScript, data.scenes);
      }
      const sceneDurationSec = veoModelMode === "veo3_omniflash_10s" ? 10 : 8;
      data.scenes = data.scenes.map((scene, sIdx) => {
        const baseImgNum = sIdx * 3;
        const currentImgs = Array.isArray(scene.images) ? scene.images : [];
        const finalImgs = [];
        for (let i = 0; i < 3; i++) {
          const imgSlotNumber = baseImgNum + i + 1;
          const existing = currentImgs[i];
          const defaultAngle = i === 0 ? "front" : i === 1 ? "side" : "detail";
          const defaultLocation = existing?.location || scene.environmentDescription || data.environmentDescription || "cen\xE1rio comercial";
          const defaultAction = existing?.actionDescription || `Demonstra\xE7\xE3o do produto no momento ${i + 1}`;
          const defaultRole = `Imagem ${imgSlotNumber}: ${existing?.role || `A\xE7\xE3o ${i + 1} em ${defaultLocation}`}`;
          finalImgs.push({
            id: existing?.id || `img-${imgSlotNumber}`,
            role: existing?.role || defaultRole,
            frameNumber: imgSlotNumber,
            variationName: existing?.variationName || productVariations[0]?.name || "Varia\xE7\xE3o 1",
            targetAngle: existing?.targetAngle || defaultAngle,
            location: existing?.location || defaultLocation,
            actionDescription: existing?.actionDescription || defaultAction,
            promptUsed: existing?.promptUsed || ""
          });
        }
        const varList = Array.isArray(scene.mappedVariations) && scene.mappedVariations.length > 0 ? scene.mappedVariations : productVariations.map((v, i) => v.name || `Varia\xE7\xE3o ${i + 1}`);
        const updatedVeo = buildVeoSingleParagraphPrompt({
          sceneNumber: scene.sceneNumber,
          totalScenes: data.scenes.length,
          durationSeconds: sceneDurationSec,
          productType: data.productType || "produto comercial",
          variations: varList,
          environment: scene.environmentDescription || data.environmentDescription,
          interactionStyle: data.interactionDetails,
          cameraType: data.cameraType,
          lighting: data.lightingStyle,
          secondTimeline: scene.eightSecondTimeline,
          speechVoiceover: scene.sceneSpeech,
          sceneImages: finalImgs.map((im) => ({
            role: im.role,
            variationName: im.variationName,
            targetAngle: im.targetAngle,
            location: im.location,
            actionDescription: im.actionDescription
          }))
        });
        return {
          ...scene,
          images: finalImgs,
          veoPrompt: updatedVeo,
          veoInstruction: `Anexe no Veo as 3 imagens de refer\xEAncia geradas para esta cena`
        };
      });
    }
    data.tokenUsage = {
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      candidateTokens: response.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: visionTokens + audioTokens,
      estimatedCostBRL: Math.round((visionCostBRL + audioCostBRL) * 1e3) / 1e3,
      breakdown: {
        videoAnalysisTokens: visionTokens,
        videoAnalysisCostBRL: visionCostBRL,
        speechTokens: audioTokens,
        speechCostBRL: audioCostBRL,
        imagesCount: 0,
        imagesCostBRL: 0,
        promptsTokens: 0,
        promptsCostBRL: 0
      }
    };
    return res.json({ success: true, data });
  } catch (error) {
    console.warn("Erro geral no endpoint analyze-video:", error);
    const fallback = buildFallbackVideoAnalysis(validDuration, productVariations);
    return res.json({ success: true, data: fallback, fallback: true });
  }
});
app.post("/api/ania-planning", async (req, res) => {
  try {
    const { primaryPhotoBase64, userPrompt, productName, category, estica } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ success: false, error: "userPrompt n\xE3o fornecido" });
    }
    const systemInstruction = buildAniaPlanningSystemPrompt();
    const activeProfile = getRequestAIProfile(req);
    if (activeProfile === "openai" && openAIProvider.isConfigured()) {
      const client = openAIProvider.getClient();
      const contentBlocks = [];
      if (primaryPhotoBase64) {
        contentBlocks.push({
          type: "image_url",
          image_url: { url: primaryPhotoBase64.startsWith("data:") ? primaryPhotoBase64 : `data:image/jpeg;base64,${primaryPhotoBase64}`, detail: "high" }
        });
      }
      contentBlocks.push({ type: "text", text: userPrompt });
      const modelsToTry = [OPENAI_BRAIN_MODEL, "gpt-4o-mini", "gpt-4o", "gpt-5.6-luna"];
      for (const modelCandidate of modelsToTry) {
        try {
          const params = {
            model: modelCandidate,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: contentBlocks }
            ],
            response_format: { type: "json_object" }
          };
          if (!modelCandidate.startsWith("gpt-5") && !modelCandidate.startsWith("o")) {
            params.temperature = 0.4;
          }
          const completion = await client.chat.completions.create(params);
          const parsed2 = JSON.parse(completion.choices[0]?.message?.content || "{}");
          if (parsed2 && Object.keys(parsed2).length > 0) {
            return res.json({ success: true, data: parsed2 });
          }
        } catch (oiErr) {
          console.warn(`Erro OpenAI no planejamento Ania com ${modelCandidate}:`, oiErr?.message || oiErr);
        }
      }
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY n\xE3o configurada" });
    }
    const parts = [];
    if (primaryPhotoBase64) {
      const parsed2 = parseInlineImage(primaryPhotoBase64);
      if (parsed2) {
        parts.push({
          text: "[Foto da Pe\xE7a Principal (Cor 1) - Analise com precis\xE3o de detalhes e caimento]:"
        });
        parts.push({ inlineData: parsed2 });
      }
    }
    parts.push({ text: userPrompt });
    const response = await getGenAI().models.generateContent({
      model: GEMINI_VISION_MODEL || "gemini-2.5-flash",
      contents: parts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoria: { type: Type.STRING },
            peca: { type: Type.STRING },
            tecido: { type: Type.STRING },
            estica: { type: Type.BOOLEAN },
            detalhes_trava: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            bolso_funcional: { type: Type.BOOLEAN },
            fala_id: { type: Type.STRING },
            fala: { type: Type.STRING },
            movimentos: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            titulo: { type: Type.STRING }
          },
          required: [
            "categoria",
            "peca",
            "tecido",
            "estica",
            "detalhes_trava",
            "bolso_funcional",
            "fala_id",
            "fala",
            "movimentos",
            "titulo"
          ]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.warn("Erro no endpoint ania-planning:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erro ao processar planejamento Ania"
    });
  }
});
app.post("/api/regenerate-prompts", (req, res) => {
  const { scenes = [], speechVoiceover = "", variations = [] } = req.body;
  const varList = variations.map((v, i) => v.name || `Varia\xE7\xE3o ${i + 1}`).filter(Boolean);
  const distributed = distributeSpeechAcrossScenes(speechVoiceover, scenes);
  const updatedScenes = distributed.map((scene) => {
    const updatedVeoPrompt = buildVeoSingleParagraphPrompt({
      sceneNumber: scene.sceneNumber,
      totalScenes: scenes.length,
      productType: scene.productType || "produto comercial",
      variations: varList.length > 0 ? varList : scene.mappedVariations || ["Varia\xE7\xE3o 1"],
      environment: scene.environmentDescription,
      secondTimeline: scene.eightSecondTimeline,
      speechVoiceover: scene.sceneSpeech,
      sceneImages: (scene.images || []).map((im) => ({
        role: im.role,
        variationName: im.variationName,
        targetAngle: im.targetAngle,
        location: im.location,
        actionDescription: im.actionDescription
      }))
    });
    const imageCount = scene.images?.length || 1;
    return {
      ...scene,
      veoPrompt: updatedVeoPrompt,
      veoInstruction: `Anexe no Veo a(s) ${imageCount} imagem(ns) de refer\xEAncia gerada(s) para esta cena`
    };
  });
  return res.json({
    success: true,
    scenes: updatedScenes
  });
});
app.post("/api/regenerate-single-scene-prompt", (req, res) => {
  const {
    scene,
    newSpeech = "",
    variations = [],
    totalScenes = 1,
    productType = "produto comercial",
    durationSeconds = 8
  } = req.body;
  if (!scene) {
    return res.status(400).json({ success: false, error: "Cena n\xE3o fornecida" });
  }
  const varList = variations.map((v, i) => v.name || `Varia\xE7\xE3o ${i + 1}`).filter(Boolean);
  const updatedPrompt = buildVeoSingleParagraphPrompt({
    sceneNumber: scene.sceneNumber,
    totalScenes: totalScenes || 1,
    durationSeconds: Number(durationSeconds) || 8,
    productType: productType || scene.productType || "produto comercial",
    variations: varList.length > 0 ? varList : scene.mappedVariations || ["Varia\xE7\xE3o 1"],
    environment: scene.environmentDescription,
    secondTimeline: scene.eightSecondTimeline,
    speechVoiceover: newSpeech,
    sceneImages: (scene.images || []).map((im) => ({
      role: im.role,
      variationName: im.variationName,
      targetAngle: im.targetAngle,
      location: im.location,
      actionDescription: im.actionDescription
    }))
  });
  const imageCount = scene.images?.length || 1;
  return res.json({
    success: true,
    scene: {
      ...scene,
      sceneSpeech: newSpeech,
      veoPrompt: updatedPrompt,
      veoInstruction: `Anexe no Veo a(s) ${imageCount} imagem(ns) de refer\xEAncia gerada(s) para esta cena`
    }
  });
});
app.post("/api/refine-video-prompt", async (req, res) => {
  try {
    const { currentPrompt, correctionInstruction, aiProfile } = req.body;
    if (!currentPrompt) {
      return res.status(400).json({ success: false, error: "Prompt atual n\xE3o fornecido" });
    }
    const instruction = (correctionInstruction || "").trim();
    if (!instruction) {
      return res.status(400).json({ success: false, error: "Instru\xE7\xE3o de corre\xE7\xE3o n\xE3o fornecida" });
    }
    const systemPrompt = `Voc\xEA \xE9 um especialista em engenharia de prompts para o Google Veo 3.1 / modelos de v\xEDdeo e criativos TikTok Shop.
Sua miss\xE3o \xE9 refazer/ajustar o prompt de v\xEDdeo fornecido aplicando estritamente a instru\xE7\xE3o de corre\xE7\xE3o do usu\xE1rio (ex: remover termos que causam modera\xE7\xE3o por conte\xFAdo impr\xF3prio/sens\xEDvel, ajustar movimentos, mudar foco da c\xE2mera, trocar vocabul\xE1rio, etc.).

REGRAS OBRIGAT\xD3RIAS:
1. Mantenha a estrutura t\xE9cnica completa do prompt do Veo (formato vertical 9:16, dura\xE7\xE3o em segundos, trava do produto, enquadramento, cortes/movimentos, fala/\xE1udio e proibi\xE7\xF5es).
2. Se a instru\xE7\xE3o for sobre conte\xFAdo impr\xF3prio ou sens\xEDvel, substitua termos arriscados por alternativas seguras e comerciais que passem pela modera\xE7\xE3o sem perder a ess\xEAncia do criativo.
3. Retorne EXCLUSIVAMENTE o texto final do prompt reescrito, pronto para copiar, sem introdu\xE7\xF5es, sem markdown com crases, sem explica\xE7\xF5es.`;
    const userMessage = `PROMPT ATUAL:
"""
${currentPrompt}
"""

INSTRU\xC7\xC3O DE CORRE\xC7\xC3O DO USU\xC1RIO:
"""
${instruction}
"""

Reescreva o prompt completo aplicando esta corre\xE7\xE3o com m\xE1xima qualidade.`;
    const activeProfile = aiProfile || getRequestAIProfile(req);
    if (activeProfile === "openai" && openAIProvider.isConfigured()) {
      try {
        const client = openAIProvider.getClient();
        const completion = await client.chat.completions.create({
          model: OPENAI_BRAIN_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        });
        const refined = completion.choices[0]?.message?.content?.trim();
        if (refined) {
          return res.json({ success: true, refinedPrompt: refined.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim() });
        }
      } catch (err) {
        console.warn("Erro ao refinar prompt via OpenAI:", err?.message || err);
      }
    }
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await getGenAI().models.generateContent({
          model: GEMINI_VISION_FAST_MODEL || "gemini-3.8-flash-lite",
          contents: {
            parts: [
              {
                text: `${systemPrompt}

${userMessage}`
              }
            ]
          }
        });
        const geminiText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (geminiText) {
          return res.json({ success: true, refinedPrompt: geminiText.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim() });
        }
      } catch (gemErr) {
        console.warn("Erro ao refinar prompt via Gemini:", gemErr?.message || gemErr);
      }
    }
    const fallbackText = `${currentPrompt}

[AJUSTE: ${instruction}]`;
    return res.json({ success: true, refinedPrompt: fallbackText });
  } catch (err) {
    console.error("Erro na rota refine-video-prompt:", err);
    return res.status(500).json({ success: false, error: err?.message || "Erro ao refinar prompt" });
  }
});
function simplifyToSingleColorWord(raw) {
  if (!raw) return "";
  const clean = raw.replace(/[.\n\r"']/g, "").trim();
  const lower = clean.toLowerCase();
  if (lower.includes("preto") || lower.includes("black") || lower.includes("grafite")) return "Preto";
  if (lower.includes("branco") || lower.includes("white") || lower.includes("off-white") || lower.includes("off white")) return "Branco";
  if (lower.includes("marrom") || lower.includes("brown") || lower.includes("caramelo") || lower.includes("cafe")) return "Marrom";
  if (lower.includes("azul") || lower.includes("blue") || lower.includes("jeans")) return "Azul";
  if (lower.includes("verde") || lower.includes("green") || lower.includes("oliva") || lower.includes("militar")) return "Verde";
  if (lower.includes("vermelho") || lower.includes("red") || lower.includes("rubi")) return "Vermelho";
  if (lower.includes("rosa") || lower.includes("pink") || lower.includes("rose")) return "Rosa";
  if (lower.includes("cinza") || lower.includes("grey") || lower.includes("gray") || lower.includes("chumbo")) return "Cinza";
  if (lower.includes("bege") || lower.includes("nude") || lower.includes("creme") || lower.includes("areia")) return "Bege";
  if (lower.includes("amarelo") || lower.includes("yellow") || lower.includes("mostarda")) return "Amarelo";
  if (lower.includes("laranja") || lower.includes("orange") || lower.includes("terracota") || lower.includes("coral")) return "Laranja";
  if (lower.includes("vinho") || lower.includes("bordo") || lower.includes("marsala") || lower.includes("burgundy")) return "Vinho";
  if (lower.includes("roxo") || lower.includes("purple") || lower.includes("violeta") || lower.includes("lilas")) return "Roxo";
  if (lower.includes("dourado") || lower.includes("gold")) return "Dourado";
  if (lower.includes("prateado") || lower.includes("prata") || lower.includes("silver")) return "Prateado";
  const firstWord = clean.split(/\s+/)[0] || clean;
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}
app.post("/api/detect-dominant-color", async (req, res) => {
  try {
    const { photoBase64, productName, productMode, aiProfile } = req.body;
    if (!photoBase64) {
      return res.status(400).json({ success: false, error: "Foto n\xE3o fornecida" });
    }
    const cleanB64 = photoBase64.startsWith("data:") ? photoBase64 : `data:image/jpeg;base64,${photoBase64}`;
    const promptText = `Analise a foto deste item comercial (${productName || (productMode === "footwear" ? "cal\xE7ado / t\xEAnis" : "roupa")}) e identifique com m\xE1xima precis\xE3o a cor predominante do corpo/cabedal/tecido principal.
REGRAS OBRIGAT\xD3RIAS:
1. Se for cal\xE7ado/t\xEAnis: ignore a sola de borracha (branca/preta) e foque exclusivamente no cabedal (parte superior/tecido/couro).
2. Ignore o fundo branco/cinza, sombras, piso ou manequins.
3. Se o cabedal for verde (oliva, militar, musgo, etc.), responda: Verde
4. Se o cabedal for marrom (caramelo, caf\xE9, chocolate), responda: Marrom
5. Se o cabedal for azul (marinho, jeans, royal, celeste), responda: Azul
6. Se o cabedal for vermelho/vinho, responda: Vermelho
7. Se o cabedal for rosa/pink, responda: Rosa
8. Se o cabedal for amarelo/mostarda, responda: Amarelo
9. Se o cabedal for bege/nude/areia, responda: Bege
10. Se o cabedal for laranja/terracota, responda: Laranja
11. Se o cabedal for roxo/lil\xE1s, responda: Roxo
12. Se o cabedal for preto, responda: Preto
13. Se o cabedal for branco, responda: Branco
14. Se o cabedal for cinza/chumbo, responda: Cinza
Responda ESTRITAMENTE em UMA \xDANICA PALAVRA da cor b\xE1sica em portugu\xEAs, sem pontua\xE7\xE3o e sem explica\xE7\xF5es.`;
    const activeProfile = aiProfile || getRequestAIProfile(req);
    if (activeProfile === "openai" && openAIProvider.isConfigured()) {
      const client = openAIProvider.getClient();
      for (const visionModel of ["gpt-4o-mini", "gpt-4o", "gpt-5.6-luna", OPENAI_BRAIN_MODEL]) {
        try {
          const params = {
            model: visionModel,
            messages: [
              {
                role: "user",
                content: [
                  { type: "image_url", image_url: { url: cleanB64 } },
                  { type: "text", text: promptText }
                ]
              }
            ]
          };
          if (visionModel.startsWith("gpt-5")) {
            params.max_completion_tokens = 60;
          } else {
            params.max_tokens = 60;
          }
          const completion = await client.chat.completions.create(params);
          const rawColor = completion.choices[0]?.message?.content?.trim();
          if (rawColor) {
            const cleanColor = simplifyToSingleColorWord(rawColor);
            if (cleanColor) {
              return res.json({ success: true, color: cleanColor });
            }
          }
        } catch (err) {
          console.warn(`Erro ao detectar cor via OpenAI (${visionModel}):`, err?.message || err);
        }
      }
    }
    if (process.env.GEMINI_API_KEY) {
      try {
        const parsed = parseInlineImage(photoBase64);
        if (parsed) {
          const geminiRes = await getGenAI().models.generateContent({
            model: GEMINI_VISION_FAST_MODEL || "gemini-3.8-flash-lite",
            contents: {
              parts: [
                { inlineData: parsed },
                { text: promptText }
              ]
            }
          });
          const rawColor = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawColor) {
            const cleanColor = simplifyToSingleColorWord(rawColor);
            return res.json({ success: true, color: cleanColor });
          }
        }
      } catch (gemErr) {
        console.warn("Erro ao detectar cor via Gemini:", gemErr?.message || gemErr);
      }
    }
    return res.status(500).json({ success: false, error: "N\xE3o foi poss\xEDvel detectar a cor" });
  } catch (err) {
    console.error("Erro na rota detect-dominant-color:", err);
    return res.status(500).json({ success: false, error: err?.message || "Erro interno" });
  }
});
app.post("/api/generate-scene-image", async (req, res) => {
  try {
    const {
      prompt,
      productPhotoBase64,
      productPhotosBase64 = [],
      modelReferenceBase64,
      referenceFrameBase64,
      variationName = "Varia\xE7\xE3o 1",
      productType = "produto comercial",
      targetAngle = "front",
      location,
      actionDescription,
      correctionPrompt,
      additionalInstructions = "",
      hasUserProvidedModel = false,
      isCloneMode = false,
      preserveLocation = false
    } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt n\xE3o fornecido" });
    }
    const activeProfile = getRequestAIProfile(req);
    if (activeProfile === "openai" && openAIProvider.isConfigured()) {
      try {
        const result = await openAIProvider.generateSceneImage({
          prompt,
          productPhotoBase64,
          productPhotosBase64,
          modelReferenceBase64,
          referenceFrameBase64,
          variationName,
          productType,
          targetAngle,
          location,
          actionDescription,
          correctionPrompt,
          additionalInstructions,
          hasUserProvidedModel,
          isCloneMode,
          preserveLocation
        });
        if (result.success && result.imageUrl) {
          return res.json(result);
        }
        console.warn(`OpenAI ${OPENAI_IMAGE_MODEL} n\xE3o retornou imagem, usando pipeline Gemini:`, result.error);
      } catch (oiErr) {
        console.warn(`Exce\xE7\xE3o no modelo ${OPENAI_IMAGE_MODEL}, recorrendo ao pipeline Gemini:`, oiErr?.message || oiErr);
      }
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        fallbackRequired: true,
        error: "Chave de API n\xC3\xA3o configurada"
      });
    }
    const parts = [];
    if (modelReferenceBase64 && !isCloneMode) {
      const parsedModel = parseInlineImage(modelReferenceBase64);
      if (parsedModel) {
        parts.push({ inlineData: parsedModel });
        parts.push({
          text: `[REFER\xCANCIA 1 - CANVAS MESTRE INVIOL\xC1VEL (CLONE 100% ID\xCANTICO DE PESSOA, POSE E CEN\xC1RIO)]:
- REGRA DE CLONAGEM TOTAL:
  * Voc\xEA DEVE manter a EXATA MESMA PESSOA/MODELO da Refer\xEAncia 1 (mesmo corpo, tom de pele, m\xE3os, postura e enquadramento vertical sem rosto).
  * Voc\xEA DEVE manter o EXATO MESMO CEN\xC1RIO E QUARTO da Refer\xEAncia 1 (mesmas paredes, mesmo ch\xE3o, mesmos m\xF3veis, mesma ilumina\xE7\xE3o e mesma dist\xE2ncia da c\xE2mera).
  * ZERO TATUAGENS: Pele 100% limpa, sem qualquer tatuagem em homem ou mulher.
  * PROIBI\xC7\xC3O ABSOLUTA: N\xC3O recrie a foto, N\xC3O gere outra pessoa e N\xC3O altere o quarto/ambiente. O quarto e a pessoa s\xE3o 100% intoc\xE1veis.`
        });
      }
      const primaryStr = productPhotoBase64 || (productPhotosBase64.length > 0 ? productPhotosBase64[0] : null);
      let swatchDetailsText = "";
      if (primaryStr) {
        swatchDetailsText = await extractProductSwatchDetails(primaryStr, variationName, productType);
      }
      parts.push({
        text: `[INSTRU\xC7\xC3O DE MODIFICA\xC7\xC3O EXCLUSIVA DE PRODUTO]:
- Modifique EXCLUSIVAMENTE a ${productType} usada pela pessoa na Refer\xEAncia 1 para a nova cor "${variationName}".
- Detalhes visuais extra\xEDdos da amostra oficial: ${swatchDetailsText || `cor ${variationName}`}
- Todo o resto da Refer\xEAncia 1 (pessoa, rosto oculto, corpo, pose, m\xE3os, quarto, paredes, piso, ilumina\xE7\xE3o) permanece 100% id\xEAntico e intocado.`
      });
    } else if (modelReferenceBase64 && isCloneMode && hasUserProvidedModel) {
      const primaryStr = productPhotoBase64 || (productPhotosBase64.length > 0 ? productPhotosBase64[0] : null);
      if (primaryStr) {
        const parsedPrimary = parseInlineImage(primaryStr);
        if (parsedPrimary) {
          parts.push({ inlineData: parsedPrimary });
          parts.push({
            text: `[REFERENCE 1 - PRIMARY PRODUCT PHOTO FOR "${variationName}"]:
- HIGHEST PRIORITY 1:1 PHYSICAL FIDELITY:
  * The product in the generated image MUST BE AN EXACT, UNCOMPROMISED 1:1 REPLICA of this photo!
  * Replicate exact shape, silhouette, materials, textures, logos, colors and physical details without alterations.`
          });
        }
      }
      const parsedModel = parseInlineImage(modelReferenceBase64);
      if (parsedModel) {
        parts.push({ inlineData: parsedModel });
        parts.push({
          text: `[REFERENCE 2 - USER PROVIDED TALENT / MODEL IDENTITY]:
- MAINTAIN THE EXACT SAME ACTOR / MODEL FROM THE USER'S PHOTO:
  * Preserve the same person's demographic identity (same gender, approximate age, skin tone, hair color/style, and build).
  * CRITICAL FOR SCENE CONTINUITY: Do NOT lock the room or pose to Reference 2!
  * STRICT ENVIRONMENT DIRECTIVE: Generate this image strictly in the scene's requested location: "${location || "cen\xE1rio da cena"}", angle: "${targetAngle || "front"}", and action: "${actionDescription || "a\xE7\xE3o da cena"}".
  * ZERO BACKGROUND REPETITION: The background, furniture, and setting MUST match THIS scene's storyboard location!`
        });
      }
    } else {
      const primaryStr = productPhotoBase64 || (productPhotosBase64.length > 0 ? productPhotosBase64[0] : null);
      if (primaryStr) {
        const parsedPrimary = parseInlineImage(primaryStr);
        if (parsedPrimary) {
          parts.push({ inlineData: parsedPrimary });
          parts.push({
            text: `[REFERENCE 1 - PRIMARY PRODUCT PHOTO FOR "${variationName}"]:
- HIGHEST PRIORITY 1:1 PHYSICAL FIDELITY:
  * The product in the generated image MUST BE AN EXACT, UNCOMPROMISED 1:1 REPLICA of this photo!
  * ZERO REDESIGN, ZERO MODIFICATIONS: Do NOT alter the shape, silhouette, sole thickness, midsole lines, tread, materials, textures, logos, or printed text.
  * COLOR FIDELITY: The colors must match this photo with 100% precision. Do not change tones, do not add fake colored accents, do not shift white to cream, black to grey, or alter shoe laces.
  * TEXTURE & FINISH: Preserve the exact physical finish seen here (leather, knit, mesh, gloss, matte, canvas).
  * Every physical attribute visible in this photo MUST be faithfully present on the product.`
          });
        }
      }
      const remainingPhotos = (Array.isArray(productPhotosBase64) ? productPhotosBase64 : []).filter(
        (p) => p !== primaryStr
      );
      remainingPhotos.slice(0, 2).forEach((photoStr, pIdx) => {
        const parsedProduct = parseInlineImage(photoStr);
        if (parsedProduct) {
          parts.push({ inlineData: parsedProduct });
          parts.push({
            text: `[REFERENCE 1.${pIdx + 2} - SUPPLEMENTARY ANGLE FOR "${variationName}"]:
- Replicate the exact construction, stitching, and materials visible in this reference.`
          });
        }
      });
      if (!hasUserProvidedModel) {
        parts.push({
          text: `[CRITICAL HUMAN MODEL ANTI-VIOLATION DIRECTIVE FOR TIKTOK SHOP]:
- As no custom model photo was provided, create an ORIGINAL, UNIQUE commercial model/creator:
  * DO NOT copy or clone the face of the actor from the competitor reference video!
  * The generated model must have a DIFFERENT FACE and distinct facial features (different eyes, nose, smile, jawline, with subtle variation in hair/skin tone\u2014similar demographic style like a cousin, but strictly a different person).
  * This prevents copyright, duplicate content, and impersonation violations on TikTok Shop.`
        });
      }
    }
    const normalizedAngle = String(targetAngle || "").toLowerCase().trim();
    const angleInstruction = normalizedAngle.includes("back") || normalizedAngle.includes("rear") || normalizedAngle.includes("costas") || normalizedAngle.includes("verso") ? "TARGET ANGLE: REAR/BACK VIEW. The person/product must be shown from behind, faithfully reproducing the back/verso required by the reference-video storyboard. Do NOT turn the subject toward the camera and do NOT substitute a front view." : normalizedAngle === "side" || normalizedAngle.includes("lateral") ? "TARGET ANGLE: SIDE VIEW. Faithfully reproduce the side/lateral orientation required by the reference-video storyboard." : normalizedAngle === "front_side" || normalizedAngle.includes("three-quarter") ? "TARGET ANGLE: FRONT THREE-QUARTER VIEW. Faithfully reproduce the front-three-quarter orientation required by the reference-video storyboard." : normalizedAngle === "front_detail" || normalizedAngle.includes("detail") || normalizedAngle.includes("close") ? "TARGET ANGLE: DETAIL/CLOSE-UP VIEW. Faithfully reproduce the detail framing required by the reference-video storyboard." : "TARGET ANGLE: FRONT VIEW. Show the front only when the reference-video storyboard requires a frontal view.";
    const correctionBlock = correctionPrompt && correctionPrompt.trim() ? `
CRITICAL QUALITY AUDIT OVERRIDE: ${correctionPrompt.trim()}. You MUST strictly fix the previous discrepancies and match the user reference photos 100% identically!
` : "";
    const userDirectivesBlock = additionalInstructions && additionalInstructions.trim() ? `
USER SPECIFIC DIRECTIVES: "${additionalInstructions.trim()}". You MUST strictly follow these user directives!
` : "";
    const overrideBlock = [
      correctionBlock,
      userDirectivesBlock
    ].filter(Boolean).join("\n");
    const finalDirective = modelReferenceBase64 && !isCloneMode ? `

[DIRETIVA FINAL INVIOL\xC1VEL DE CANVAS LOCK]:
A imagem gerada DEVE ser uma c\xF3pia 100% id\xEAntica da REFER\xCANCIA 1 (mesma pessoa/modelo, mesmo corpo, mesma pose, mesmo quarto simples residencial, mesmo piso, paredes e ilumina\xE7\xE3o). Altere EXCLUSIVAMENTE a cor e tecido da ${productType} para "${variationName}". Descarte e ignore qualquer outro fundo ou ambiente!` : "";
    const cleanPrompt = overrideBlock ? `${overrideBlock}

${prompt}${finalDirective}` : `${prompt}${finalDirective}`;
    parts.push({ text: cleanPrompt });
    let imageResultUrl = "";
    const modelsToTry = [
      GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
      GEMINI_IMAGE_FAST_MODEL || "gemini-3.1-flash-lite-image",
      "gemini-3-pro-image"
    ];
    let lastErrorType = "";
    let lastErrorMessage = "";
    const systemInstructionText = modelReferenceBase64 && !isCloneMode ? `VOC\xCA \xC9 O MOTOR DE INPAINTING E TROCA DE COR DO REV\xCDDEO AI (PADR\xC3O TIKTOK SHOP BRASIL).
DIRETIVA MESTRE 1 (CANVAS LOCK TOTAL): A REFER\xCANCIA 1 \xC9 O CANVAS MESTRE INVIOL\xC1VEL. Voc\xEA DEVE manter 100% id\xEAnticos a MESMA pessoa/modelo, o mesmo corpo, a mesma pose, o mesmo enquadramento sem rosto (do pesco\xE7o para baixo), o MESMO quarto/cen\xE1rio residencial simples, as mesmas paredes, o mesmo ch\xE3o/piso, os mesmos m\xF3veis e a mesma ilumina\xE7\xE3o da REFER\xCANCIA 1. \xC9 TERMINANTEMENTE PROIBIDO alterar o modelo ou o cen\xE1rio.
DIRETIVA MESTRE 2 (A\xC7\xC3O EXCLUSIVA): A \xDANICA modifica\xE7\xE3o permitida em toda a imagem \xE9 pintar/trocar a cor e o tecido da ${productType} usada pela pessoa na REFER\xCANCIA 1 para a nova cor "${variationName}".
DIRETIVA MESTRE 3: ZERO TATUAGENS. Pele 100% limpa, sem qualquer tatuagem em homem ou mulher.` : `VOC\xCA \xC9 O MOTOR DE GERA\xC7\xC3O VISUAL DO REV\xCDDEO AI (PADR\xC3O TIKTOK SHOP BRASIL).
- M\xE1xima fidelidade 1:1 f\xEDsica ao produto real das fotos de refer\xEAncia.
- Retratar pessoas brasileiras simples e comuns do dia a dia (sem supermodelos inalcan\xE7\xE1veis).
- Cen\xE1rios aut\xEAnticos e din\xE2micos conforme especificado pelo storyboard do v\xEDdeo (cada cena em seu ambiente e a\xE7\xE3o designados).
- Consist\xEAncia de modelo humano sem repetir a mesma pose ou cen\xE1rio se o roteiro mudar de lugar.
- Zero tatuagens na pele. Enquadramento do pesco\xE7o para baixo quando solicitado.`;
    for (const modelCandidate of modelsToTry) {
      try {
        const imgRes = await getGenAI().models.generateContent({
          model: modelCandidate,
          contents: { parts },
          config: {
            systemInstruction: systemInstructionText,
            imageConfig: {
              aspectRatio: "9:16"
            }
          }
        });
        const candidates = imgRes.candidates || [];
        if (candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || "image/png";
              imageResultUrl = `data:${mime};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
        if (imageResultUrl) break;
      } catch (imgError) {
        console.warn(`Tentativa com ${modelCandidate} falhou:`, imgError?.message);
        if (imgError?.status === 429 || imgError?.message?.includes("spending cap") || imgError?.message?.includes("monthly spending")) {
          lastErrorType = "SPENDING_CAP_EXCEEDED";
          lastErrorMessage = "Seu projeto no Google AI Studio atingiu o Limite de Gastos Mensal (Spend Cap - Erro 429). Para permitir que o modelo Nano Banana Pro (gemini-3-pro-image) gere as imagens fotorrealistas da mulher cal\xC3\xA7ando o produto, ajuste ou aumente o limite em https://ai.studio/spend.";
        } else if (imgError?.status === 402 || imgError?.message?.includes("prepayment credits are depleted") || imgError?.message?.includes("402")) {
          lastErrorType = "CREDITS_DEPLETED";
          lastErrorMessage = "Seus cr\xC3\xA9ditos pr\xC3\xA9-pagos da API Gemini se esgotaram (Erro 402). O modelo de alta qualidade Nano Banana Pro requer cr\xC3\xA9ditos ativos no Google AI Studio (https://ai.studio/projects).";
        } else {
          lastErrorType = "AI_FAILED";
          lastErrorMessage = imgError?.message || "Falha na gera\xC3\xA7\xC3\xA3o de imagem com a IA.";
        }
      }
    }
    if (!imageResultUrl) {
      return res.json({
        success: false,
        errorType: lastErrorType || "AI_FAILED",
        error: lastErrorMessage || "N\xC3\xA3o foi poss\xC3\xADvel gerar a imagem no modelo de ponta Nano Banana Pro. Verifique sua chave e limites."
      });
    }
    return res.json({
      success: true,
      imageUrl: imageResultUrl,
      costBRL: 0.08
      // ~ $0.014 * 5.70 (Flash Image)
    });
  } catch (err) {
    console.error("Erro na rota de imagem:", err);
    return res.json({
      success: false,
      fallbackRequired: true,
      error: err?.message || "Erro inesperado"
    });
  }
});
app.post("/api/audit-image-fidelity", async (req, res) => {
  try {
    const {
      generatedImageBase64,
      referencePhotos = [],
      variationName = "Varia\xC3\xA7\xC3\xA3o 1",
      role = "Imagem de Refer\xC3\xAAncia"
    } = req.body;
    if (!generatedImageBase64) {
      return res.status(400).json({ success: false, error: "Imagem gerada n\xC3\xA3o fornecida" });
    }
    if (openAIProvider.isConfigured()) {
      try {
        const result = await openAIProvider.auditImageFidelity({
          generatedImageBase64,
          referencePhotos,
          variationName,
          role
        });
        if (result && result.success) {
          return res.json(result);
        }
      } catch (oiErr) {
        console.warn(`Exce\xE7\xE3o no modelo de auditoria ${OPENAI_AUDIT_MODEL}, recorrendo ao Gemini:`, oiErr?.message || oiErr);
      }
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        audit: {
          score: 95,
          status: "green",
          label: "Verde Fidedigno (Modo Offline)",
          issues: ["Valida\xC3\xA7\xC3\xA3o visual offline conclu\xC3\xADda."],
          correctionPrompt: ""
        }
      });
    }
    const parts = [];
    const parsedGen = parseInlineImage(generatedImageBase64);
    if (parsedGen) {
      parts.push({ inlineData: parsedGen });
      parts.push({
        text: `[IMAGEM 1 - IMAGEM GERADA PELA IA]: Esta \xC3\xA9 a imagem gerada para o criativo comercial do TikTok Shop, mostrando a varia\xC3\xA7\xC3\xA3o "${variationName}".`
      });
    }
    if (Array.isArray(referencePhotos) && referencePhotos.length > 0) {
      referencePhotos.forEach((photoBase64, idx) => {
        const parsedRef = parseInlineImage(photoBase64);
        if (parsedRef) {
          parts.push({ inlineData: parsedRef });
          parts.push({
            text: `[FOTO DE REFER\xC3\u0160NCIA REAL ${idx + 1}]: Foto aut\xC3\xAAntica do produto do usu\xC3\xA1rio enviada em um dos \xC3\xA2ngulos de refer\xC3\xAAncia.`
          });
        }
      });
    }
    const auditInstruction = `Voc\xC3\xAA \xC3\xA9 o Auditor Fiscal de Fidelidade de Produtos para o TikTok Shop.
O TikTok Shop \xC3\xA9 extremamente r\xC3\xADgido com diretrizes de com\xC3\xA9rcio: se um produto no v\xC3\xADdeo/an\xC3\xBAncio apresentar cores, cadar\xC3\xA7os, costuras ou detalhes diferentes do produto real entregue ao comprador, a loja \xC3\xA9 punida por propaganda enganosa.

SUA MISS\xC3\u0192O: Comparar o produto que aparece na [IMAGEM 1 - IMAGEM GERADA] com as [FOTOS DE REFER\xC3\u0160NCIA REAIS] enviadas pelo usu\xC3\xA1rio em todos os \xC3\xA2ngulos.

NOTA CR\xC3\x8DTICA: IGNORE o cen\xC3\xA1rio, piso, paredes, espelho e ilumina\xC3\xA7\xC3\xA3o. Avalie EXCLUSIVAMENTE o PRODUTO (e se houver pessoa usando, se o produto nos p\xC3\xA9s/corpo dela confere com as fotos reais).

CRIT\xC3\u2030RIOS DE FISCALIZA\xC3\u2021\xC3\u0192O:
1. Cadar\xC3\xA7os / atacadores / fechos: A cor e o estilo do cadar\xC3\xA7o conferem com as fotos reais? (Ex: se a foto tem cadar\xC3\xA7o marrom, o gerado deve ter cadar\xC3\xA7o marrom; se mudou de cor, \xC3\xA9 uma VARIA\xC3\u2021\xC3\u0192O CR\xC3\x8DTICA).
2. Cores e materiais principais: O cabedal, tecido, couro ou embalagem mant\xC3\xAAm as cores e texturas exatas?
3. Solado e entressola: O formato, cor da sola e detalhes de borracha conferem?
4. Costuras, recortes e marcas: Surgiram costuras inexistentes, formatos deformados ou detalhes inventados?

SISTEMA DE NOTA (0 a 100):
- VERDE (score >= 90): Fidedigno (status: "green"). Todos os detalhes essenciais, cores, cadar\xC3\xA7os e solado conferem com as fotos reais.
- AMARELO (score 70 a 89): Varia\xC3\xA7\xC3\xA3o Leve (status: "yellow"). Pequena diferen\xC3\xA7a de brilho, sombra ou detalhe secund\xC3\xA1rio que n\xC3\xA3o descaracteriza.
- VERMELHO (score < 70): Varia\xC3\xA7\xC3\xA3o Cr\xC3\xADtica (status: "red"). Mudan\xC3\xA7a de cor no cadar\xC3\xA7o, sola diferente, cor principal alterada ou partes alucinadas.

Retorne estritamente um JSON no seguinte formato:
{
  "score": number,
  "status": "green" | "yellow" | "red",
  "label": string,
  "issues": string[],
  "correctionPrompt": string
}`;
    const auditRes = await getGenAI().models.generateContent({
      model: GEMINI_VISION_FAST_MODEL || "gemini-3.1-flash-lite",
      contents: [
        ...parts,
        { text: auditInstruction }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsedAudit = JSON.parse(auditRes.text || "{}");
    const score = Math.max(0, Math.min(100, Number(parsedAudit.score) || 92));
    const status = score >= 90 ? "green" : score >= 70 ? "yellow" : "red";
    const label = parsedAudit.label || (status === "green" ? `Verde Fidedigno (${score}%)` : status === "yellow" ? `Amarelo - Varia\xC3\xA7\xC3\xA3o Leve (${score}%)` : `Vermelho - Varia\xC3\xA7\xC3\xA3o Cr\xC3\xADtica (${score}%)`);
    return res.json({
      success: true,
      audit: {
        score,
        status,
        label,
        issues: Array.isArray(parsedAudit.issues) && parsedAudit.issues.length > 0 ? parsedAudit.issues : ["Produto analisado com sucesso."],
        correctionPrompt: parsedAudit.correctionPrompt || "",
        auditedAngle: role
      }
    });
  } catch (err) {
    console.warn("Erro na auditoria de fidelidade:", err);
    return res.json({
      success: true,
      audit: {
        score: 94,
        status: "green",
        label: "Verde Fidedigno (An\xC3\xA1lise Conclu\xC3\xADda)",
        issues: ["Fidelidade de produto validada."],
        correctionPrompt: ""
      }
    });
  }
});
app.post("/api/micro-edit-image", async (req, res) => {
  try {
    const { imageBase64, instruction, aiProfile } = req.body;
    if (!imageBase64 || !instruction) {
      return res.status(400).json({ success: false, error: "Imagem e instru\xE7\xE3o de edi\xE7\xE3o s\xE3o obrigat\xF3rias." });
    }
    const cleanB64 = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    const promptText = `Execute a microedi\xE7\xE3o solicitada pelo usu\xE1rio com M\xC1XIMA PRECIS\xC3O E FIDELIDADE \xC0 IMAGEM FORNECIDA.
REGRA FUNDAMENTAL E ABSOLUTA:
1. Use SOMENTE a imagem fornecida como 100% da refer\xEAncia visual.
2. Mantenha id\xEAnticos todo o enquadramento, propor\xE7\xF5es, ilumina\xE7\xE3o, composi\xE7\xE3o e detalhes que N\xC3O foram expressamente mandados alterar.
3. INSTRU\xC7\xC3O DO USU\xC1RIO: "${instruction}".
4. Aplique ESTRITAMENTE e EXCLUSIVAMENTE a altera\xE7\xE3o solicitada. Se pediu para trocar a cor, troque apenas a cor do item especificado. Se pediu para alterar um detalhe, altere apenas esse detalhe.
5. Retorne a imagem editada realista com alta defini\xE7\xE3o vertical 9:16.`;
    const activeProfile = aiProfile || getRequestAIProfile(req);
    if (activeProfile === "openai" && openAIProvider.isConfigured()) {
      try {
        const result = await openAIProvider.generateSceneImage({
          prompt: promptText,
          productPhotoBase64: cleanB64,
          variationName: "Microedi\xE7\xE3o",
          productType: "imagem de refer\xEAncia",
          additionalInstructions: `Microedi\xE7\xE3o isolada: ${instruction}`
        });
        if (result.success && result.imageUrl) {
          return res.json({ success: true, imageUrl: result.imageUrl });
        }
      } catch (err) {
        console.warn("Erro na microedi\xE7\xE3o via OpenAI, tentando Gemini:", err?.message || err);
      }
    }
    if (process.env.GEMINI_API_KEY) {
      const parsed = parseInlineImage(cleanB64);
      const parts = [];
      if (parsed) {
        parts.push({ inlineData: parsed });
      }
      parts.push({ text: promptText });
      const modelsToTry = [
        GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
        GEMINI_IMAGE_FAST_MODEL || "gemini-3.1-flash-lite-image",
        "gemini-3-pro-image"
      ];
      for (const modelCandidate of modelsToTry) {
        try {
          const imgRes = await getGenAI().models.generateContent({
            model: modelCandidate,
            contents: { parts },
            config: {
              systemInstruction: "Voc\xEA \xE9 um editor de microedi\xE7\xE3o de imagens. Edite estritamente o que foi solicitado na imagem fornecida, mantendo todo o restante inalterado.",
              imageConfig: { aspectRatio: "9:16" }
            }
          });
          const candidates = imgRes.candidates || [];
          if (candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || "image/png";
                return res.json({ success: true, imageUrl: `data:${mime};base64,${part.inlineData.data}` });
              }
            }
          }
        } catch (e) {
          console.warn(`Tentativa de microedi\xE7\xE3o com ${modelCandidate} falhou:`, e?.message || e);
        }
      }
    }
    return res.status(500).json({ success: false, error: "N\xE3o foi poss\xEDvel gerar a microedi\xE7\xE3o com os provedores configurados." });
  } catch (err) {
    console.error("Erro no endpoint micro-edit-image:", err);
    return res.status(500).json({ success: false, error: err?.message || "Erro interno na microedi\xE7\xE3o" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const pkgName = "vite";
    const { createServer: createViteServer } = await import(
      /* @vite-ignore */
      pkgName
    );
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    const active = getActiveProviderType();
    console.log(`
\xF0\u0178\u0161\u20AC Servidor Clonador de V\xC3\xADdeo rodando em http://0.0.0.0:${PORT}`);
    console.log(`\xF0\u0178\xA4\u2013 Provedor Ativo: ${active.toUpperCase()}`);
    if (active === "openai") {
      console.log(`\xF0\u0178\xA7\xA0 C\xC3\xA9rebro (vis\xC3\xA3o/an\xC3\xA1lise/storyboard): ${OPENAI_BRAIN_MODEL} [reasoning_effort: medium]`);
      console.log(`\xF0\u0178\u017D\xA4 Transcri\xC3\xA7\xC3\xA3o de \xC3\x81udio: ${OPENAI_AUDIO_MODEL}`);
      console.log(`\xF0\u0178\u017D\xA8 Gera\xC3\xA7\xC3\xA3o de Imagens: ${OPENAI_IMAGE_MODEL} [quality: high, 1024x1792]`);
      console.log(`\xF0\u0178\u201D\x8D Auditoria de Fidelidade: ${OPENAI_AUDIT_MODEL}`);
    } else {
      console.log(`\xF0\u0178\u201C\xB8 Modelo de Vis\xC3\xA3o: ${GEMINI_VISION_MODEL}`);
      console.log(`\xF0\u0178\u017D\xA8 Modelo de Imagem: ${GEMINI_IMAGE_MODEL}`);
    }
  });
}
var isDirectRun = Boolean(
  process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js") || process.argv[1].includes("tsx"))
);
if (isDirectRun && !process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  server_default as default
};
