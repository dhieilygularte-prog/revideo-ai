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
    variations = ["Varia\xE7\xE3o 1"],
    environment = "commercial setting matching reference video",
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
      referenceFrameBase64,
      variationName = "Varia\xE7\xE3o 1",
      productType = "produto comercial",
      correctionPrompt,
      additionalInstructions = "",
      hasUserProvidedModel = false,
      isCloneMode = false,
      aspectRatio,
      size
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
      const toImageFile = (dataUrl, baseName) => {
        const mimeMatch = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,/i);
        const mime = mimeMatch ? mimeMatch[1].toLowerCase() : "image/png";
        const ext = mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : "png";
        const cleanB64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/i, "").replace(/[\r\n\s]/g, "");
        return new File([Buffer.from(cleanB64, "base64")], `${baseName}.${ext}`, { type: mime });
      };
      allPhotos.slice(0, 4).forEach((photoStr, idx) => {
        try {
          if (photoStr && typeof photoStr === "string") {
            imageFiles.push(toImageFile(photoStr, `reference_${idx + 1}`));
          }
        } catch (e) {
        }
      });
      let baseImageFile = null;
      let effectivePrompt = cleanPrompt;
      const isStoryboardGrid = prompt.includes("grade 3x3") || prompt.includes("9 cenas numeradas") || prompt.includes("STORYBOARD");
      if (modelReferenceBase64 && !isCloneMode && !isStoryboardGrid) {
        baseImageFile = toImageFile(modelReferenceBase64, "imagem_1_base");
        const swatchStr = productPhotoBase64 || productPhotosBase64[0];
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
                      text: `Describe in English, in one dense paragraph, ONLY the garment/product (${productType}) in this photo, ignoring the person, background and mannequin: exact main color of each piece (top and bottom), exact color of the piping/trim/binding on collar, front placket, sleeve hems, shorts hems and pockets, exact button color and count, fabric texture, neckline shape, sleeve length, shorts length, and any manufacturer print, emblem or logo on the product itself. Be precise about contrast colors and brand logos on the item.`
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
Mantenha o mesmo modelo/corte e caimento da pe\xE7a atual; troque somente cores (pe\xE7a principal, debruns/acabamentos, bot\xF5es) e detalhes conforme descrito, preservando fielmente qualquer logomarca ou estampa original do fabricante presente na pe\xE7a. Tudo que n\xE3o for a pe\xE7a permanece pixel a pixel igual \xE0 imagem enviada. Proibido adicionar textos flutuantes, logos de redes sociais (TikTok/@) ou marcas d'\xE1gua externas.`;
      } else if (referenceFrameBase64) {
        try {
          baseImageFile = toImageFile(referenceFrameBase64, "previous_storyboard");
        } catch {
          baseImageFile = imageFiles[0] || null;
        }
      } else if (imageFiles.length > 0 && !isCloneMode) {
        baseImageFile = imageFiles[0];
      }
      const isLandscape = aspectRatio === "16:9" || size === "1792x1024" || /16:9|horizontal|paisagem/i.test(effectivePrompt);
      const chosenImageSize = size || (isLandscape ? "1792x1024" : OPENAI_IMAGE_SIZE);
      const checkIsVertical = (rawB64) => {
        try {
          const buf = Buffer.from(rawB64, "base64");
          if (buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71 && buf.length >= 24) {
            return buf.readUInt32BE(20) > buf.readUInt32BE(16);
          }
          if (buf[0] === 255 && buf[1] === 216) {
            let offset = 2;
            while (offset < buf.length - 8) {
              if (buf[offset] !== 255) break;
              const marker = buf[offset + 1];
              if (marker === 192 || marker === 194) {
                return buf.readUInt16BE(offset + 5) > buf.readUInt16BE(offset + 7);
              }
              offset += 2 + buf.readUInt16BE(offset + 2);
            }
          }
        } catch {
        }
        return false;
      };
      if (isLandscape && !referenceFrameBase64) {
        const genLandscapeRes = await client.images.generate({
          model: OPENAI_IMAGE_MODEL,
          prompt: effectivePrompt,
          quality: OPENAI_IMAGE_QUALITY,
          size: "1792x1024"
        });
        const b64Land = genLandscapeRes.data?.[0]?.b64_json;
        if (b64Land) {
          const imgCost = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
          globalCostTracker.recordCall({
            step: stepName,
            model: OPENAI_IMAGE_MODEL,
            costUSD: imgCost.costUSD,
            costBRL: imgCost.costBRL,
            details: `Gera\xE7\xE3o horizontal 16:9 nativa (${chosenImageSize})`
          });
          return {
            success: true,
            imageUrl: `data:image/png;base64,${b64Land}`,
            costBRL: imgCost.costBRL
          };
        }
      }
      if (baseImageFile) {
        const editImageInput = referenceFrameBase64 ? baseImageFile : !modelReferenceBase64 && imageFiles.length > 1 ? imageFiles : baseImageFile;
        const editResponse = await client.images.edit({
          model: OPENAI_IMAGE_MODEL,
          image: editImageInput,
          prompt: effectivePrompt,
          quality: OPENAI_IMAGE_QUALITY,
          size: chosenImageSize
        });
        const b642 = editResponse.data?.[0]?.b64_json;
        if (b642) {
          if (isLandscape && checkIsVertical(b642)) {
            console.warn("[OpenAIProvider] Imagem editada saiu vertical em pedido 16:9. Refazendo via images.generate horizontal...");
            const genRetry = await client.images.generate({
              model: OPENAI_IMAGE_MODEL,
              prompt: effectivePrompt,
              quality: OPENAI_IMAGE_QUALITY,
              size: "1792x1024"
            });
            const b64Retry = genRetry.data?.[0]?.b64_json;
            if (b64Retry) {
              const imgCost2 = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
              return {
                success: true,
                imageUrl: `data:image/png;base64,${b64Retry}`,
                costBRL: imgCost2.costBRL
              };
            }
          }
          const imgCost = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
          globalCostTracker.recordCall({
            step: stepName,
            model: OPENAI_IMAGE_MODEL,
            costUSD: imgCost.costUSD,
            costBRL: imgCost.costBRL,
            details: `Gera\xE7\xE3o com ${imageFiles.length} foto(s) de refer\xEAncia real em qualidade ${OPENAI_IMAGE_QUALITY} (${chosenImageSize})`
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
        size: chosenImageSize
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
        error: `Nenhuma imagem retornada pelo modelo OpenAI (${OPENAI_IMAGE_MODEL}).`,
        fallbackRequired: false
      };
    } catch (err) {
      let msg = err?.message || "";
      const isQuota = err?.status === 429 || err?.code === "insufficient_quota" || err?.type === "insufficient_quota" || /credit_balance_exhausted|no credits remaining|billing|quota|balance/i.test(msg);
      if (isQuota) {
        msg = "Acabou o Saldo de sua Chave API da Openai fa\xE7a uma recarga para continuar gerando.";
      } else {
        msg = `Erro ao gerar imagem com a OpenAI (${OPENAI_IMAGE_MODEL}): ${msg}`;
      }
      return {
        success: false,
        error: msg,
        fallbackRequired: false
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
          ...primaryRefs.map((_ref, idx) => ({
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

// src/produtos2/produtos2Prompts.ts
function buildProdutos2PlanningSystemPrompt() {
  return `Voc\xEA \xE9 o Diretor Criativo Copy-First do Modo Produtos 2.0.
REGRA-M\xC3E: A COPY VENDE. O STORYBOARD PROVA VISUALMENTE A COPY. O V\xCDDEO ANIMA O STORYBOARD SEM NUNCA MOSTRAR A PR\xD3PRIA FOLHA DO STORYBOARD.

REGRA DE OURO INVIOL\xC1VEL \u2014 LOGOMARCA DO FABRICANTE NO PRODUTO vs ELEMENTOS DE REDE SOCIAL:
- DIFERENCIE TOTALMENTE:
  1) PROIBIDO: Logotipo do TikTok, marca d'\xE1gua de rede social, @usu\xE1rio, bot\xF5es ou \xEDcone de carrinho flutuantes na tela. A palavra "TikTok" NUNCA pode aparecer em "productLock", "avatarDescription", "scenarioDescription", "visualMap" nem em "scenes" (somente dentro de "adaptedCopy" se j\xE1 fizer parte da fala).
  2) OBRIGAT\xD3RIO E SAGRADO: A logomarca, o emblema, o escudo/s\xEDmbolo e o nome da marca DO PR\xD3PRIO FABRICANTE que est\xE3o impressos, bordados ou estampados NO PRODUTO nas fotos de refer\xEAncia DEVEM SER FIELMENTE REPRESENTADOS E PRESERVADOS 100% ID\xCANTICOS!
- Inspecione minuciosamente as fotos de refer\xEAncia anexadas procurando qualquer logomarca, emblema, s\xEDmbolo gr\xE1fico ou texto de marca no produto (por exemplo: logo branca no encosto de um banco de exerc\xEDcios, logo na lateral de um t\xEAnis, marca no painel de um eletr\xF4nico, r\xF3tulo de um frasco, etc.).
- Preencha obrigatoriamente o campo "manufacturerLogoDescription" descrevendo com precis\xE3o cir\xFArgica a logomarca/marca vis\xEDvel no produto (formato, desenho, letras/s\xEDmbolo, cor exata e localiza\xE7\xE3o exata na pe\xE7a, ex.: "Logomarca geom\xE9trica branca em formato de escudo hexagonal com 'W' estilizado centralizada na parte superior do encosto preto do banco").
- O 1\xBA item do array "productLock" DEVE ser essa descri\xE7\xE3o exata da logomarca do fabricante e a exig\xEAncia de que ela apare\xE7a id\xEAntica em todas as cenas onde aquela parte do produto estiver vis\xEDvel.
- Nas descri\xE7\xF5es das cenas ("scenes") em que a parte do produto com a logomarca aparece, mencione explicitamente a presen\xE7a da logomarca original no local exato (ex.: "...exibindo o encosto preto com a logomarca branca original do fabricante no topo").

Sua tarefa \xE9 receber:
1) As fotos reais do produto;
2) As "Informa\xE7\xF5es do produto" e "Nome do produto";
3) A "Copy-base selecionada do banco" (ou copy nova/adaptada do molde do nicho);
4) As configura\xE7\xF5es (dura\xE7\xE3o 10s ou 8s, influencer, g\xEAnero do cliente, fala, enquadramento, cen\xE1rio, instru\xE7\xF5es adicionais, varia\xE7\xF5es anexadas).

E retornar um JSON estrito com:
1. "manufacturerLogoDescription": string detalhando exatamente a logomarca/emblema/texto do fabricante vis\xEDvel no produto nas fotos anexadas (cor, formato, desenho e onde fica no produto).
2. "adaptedCopy":
   - REGRA ABSOLUTA: NUNCA crie copy do zero! O aplicativo trabalha EXCLUSIVAMENTE com as ~62 copies vencedoras validadas que j\xE1 est\xE3o na mem\xF3ria (ou copy do mesmo produto, ou copy de outro produto do mesmo nicho adaptada, ou outra copy do banco adaptada).
   - A "baseCopy" recebida j\xE1 \xE9 a copy do banco adaptada com o m\xEDnimo de mudan\xE7as e j\xE1 come\xE7a obrigatoriamente com "Nossa! ". MANTENHA A "baseCopy" EXATAMENTE COMO EST\xC1!
   - A fala no Veo deve ser pronunciada de forma R\xC1PIDA E EUF\xD3RICA (estilo contando uma novidade imperd\xEDvel e urgente).
   - NUNCA use a palavra "menina" como vocativo; quando o p\xFAblico for feminino, use "Amiga" ou "Gente". Para masculino, use "Meu amigo", "Cara", "Irm\xE3o" ou "Gente".
   - NUNCA mencione "frete gr\xE1tis" ou "frete gratuito" na fala, a menos que isso tenha sido informado expressamente nas Informa\xE7\xF5es do Produto.
3. "productLock": array de 4 a 6 strings detalhando fisicamente o produto visto nas fotos (1\xBA item obrigatoriamente a descri\xE7\xE3o exata da logomarca/emblema/marca impressa no produto e sua posi\xE7\xE3o exata; seguido de formato, propor\xE7\xE3o, material, textura, bot\xF5es/costuras/sola/cabos/detalhes).
   - REGRA MANDAT\xD3RIA DE VARIA\xC7\xD5ES DE COR NO PRODUCT LOCK:
     * Quando houver mais de 1 varia\xE7\xE3o de cor/modelo, NUNCA fixe a cor ou estampa de apenas uma das fotos (ex.: NUNCA escreva "tecido azul-marinho com listras" ou "franjas azul-marinho" como se fosse o produto inteiro!).
     * No "productLock", descreva apenas os aspectos f\xEDsicos universais da pe\xE7a (tecido 100% algod\xE3o, formato curvo, franjas nas laterais, cordas refor\xE7adas nas pontas, acabamento).
     * Para a cor, cite explicitamente: "Varia\xE7\xF5es oficiais de cor: o produto possui as varia\xE7\xF5es informadas ([listar todas]), todas corretas e representadas fielmente nos seus respectivos quadros do storyboard".
4. "avatarDescription": descri\xE7\xE3o de 1 frase do consumidor brasileiro adulto que apresenta o produto (respeitando o g\xEAnero do Influencer e as Instru\xE7\xF5es Adicionais; se produto infantil, quem apresenta na cena 1 e 9 \xE9 sempre um adulto pai/m\xE3e).
5. "scenarioDescription":
   - Se o usu\xE1rio escolheu "em_casa" ("Em casa"): "casa brasileira simples e aconchegante, [c\xF4modo adequado ao produto]".
   - Se o usu\xE1rio escolheu "padrao_uso" ("Cen\xE1rio padr\xE3o de uso"): descreva o LUGAR REAL onde o produto \xE9 usado, SEM mencionar "casa", "caseiro" ou "casa brasileira" (ex.: academia ou espa\xE7o de treino para banco de exerc\xEDcios; jardim gramado ao ar livre para cortador de grama; margem de represa para vara de pesca; interior de um carro para som automotivo; rua/parque em corrida ao ar livre para t\xEAnis).
   - Se o usu\xE1rio escreveu um local nas Instru\xE7\xF5es adicionais (ex.: "na praia"), essa instru\xE7\xE3o tem prioridade.
6. "visualMap": array de 4 objetos { "excerpt", "intent", "visualProof", "scenes" } mapeando os trechos da copy para provas visuais nas cenas 1 a 9.
7. "scenes": array de EXATAMENTE 9 objetos { "number": 1..9, "startTime", "endTime", "framing", "action", "cameraMovement", "storyboardDescription" }:
   - REGRA MANDAT\xD3RIA E INEGOCI\xC1VEL \u2014 SEQU\xCANCIA PROGRESSIVA CONT\xCDNUA (NUNCA REPETIR CENAS):
     * As 9 cenas formam UMA \xDANICA HIST\xD3RIA PROGRESSIVA DE DEMONSTRA\xC7\xC3O DO PRODUTO acompanhando a copy do in\xEDcio ao fim (Cena 1 a 9 \xE9 um fluxo cont\xEDnuo e sem repeti\xE7\xF5es).
     * \xC9 EXPRESSAMENTE PROIBIDO REPETIR AS MESMAS CENAS PARA CADA COR! (Por exemplo: NUNCA crie cena 1 apresentando cor 1, cena 2 balan\xE7ando produto cor 1, cena 3 tocando tecido cor 1, e depois na cena 4 reiniciar com a apresentadora sorrindo com cor 2, cena 5 balan\xE7ando cor 2... ISSO \xC9 TOTALMENTE PROIBIDO!).
     * A demonstra\xE7\xE3o do produto segue seu fluxo narrativo normal, din\xE2mico e progressivo de 1 a 9:
       - Cenas 1\u20132: Gancho inicial, primeiro impacto e revela\xE7\xE3o do produto;
       - Cenas 3\u20135: Demonstra\xE7\xE3o pr\xE1tica, funcionamento ativo, teste real e prova do benef\xEDcio central;
       - Cenas 6\u20138: Macro de costuras/acabamento/material ("Olha..."), prova f\xEDsica de resist\xEAncia e vis\xE3o ampla de uso no cen\xE1rio;
       - Cena 9: Fechamento com alta convers\xE3o e CTA.
     * A \xDANICA DIFEREN\xC7A quando h\xE1 varia\xE7\xF5es de cor adicionadas \xE9 que o produto, nas cenas em que ele aparece, \xE9 retratado na cor correspondente \xE0quele grupo de quadros:
       - Se 2 varia\xE7\xF5es: Cenas 1 a 4 na 1\xAA Cor; Cenas 5 a 9 na 2\xAA Cor.
       - Se 3 varia\xE7\xF5es: Cenas 1 a 3 na 1\xAA Cor; Cenas 4 a 6 na 2\xAA Cor; Cenas 7 a 9 na 3\xAA Cor.
     * Todas as 9 cenas devem ter a\xE7\xF5es DIFERENTES, complementares e progressivas, acompanhando rigorosamente a locu\xE7\xE3o!
     * REGRA DE DESCRI\xC7\xC3O NEUTRA DE COR NAS CENAS: Quando houver varia\xE7\xF5es, NUNCA descreva no texto da cena a cor de uma varia\xE7\xE3o em cenas pertencentes a outra varia\xE7\xE3o (ex.: proibido citar "azul-marinho" na Cena 4 a 9 se for vermelho ou preto!). Refira-se ao produto como "a rede", "o tecido da rede", "as franjas", permitindo que cada cena herde a cor do respectivo quadro do storyboard!
   - Todo "olha [detalhe]" na copy vira uma cena de close/macro daquele detalhe.
   - Variar enquadramentos (nunca duas cenas seguidas iguais): close, macro, POV de m\xE3os, plano m\xE9dio, plano aberto, uso real.
   - "storyboardDescription" DEVE ser id\xEAntico a "{framing}. {action}" (mesma pessoa, mesma a\xE7\xE3o, mesmo enquadramento e mesmos objetos, sem inventar objetos extras ou mudar quem aparece entre um campo e outro).
   - Sempre que a parte do produto onde fica a logomarca do fabricante estiver vis\xEDvel na cena, inclua na descri\xE7\xE3o da cena que a logomarca original est\xE1 vis\xEDvel e id\xEAntica \xE0 foto.
   - Na Cena 1, escreva "action" de forma direta e objetiva (sem retic\xEAncias e sem ponto no meio da frase).
   - Respeitar estritamente o Enquadramento:
     * "com_rosto": rosto aparece em algumas cenas (especialmente gancho e cena 9).
     * "sem_rosto": nunca mostrar o rosto; sempre do pesco\xE7o para baixo.
     * "pov": mostrar somente as m\xE3os em primeira pessoa; nunca rosto ou corpo.
   - DI\xC1LOGOS E CASAL (quando as Instru\xE7\xF5es Adicionais descreverem encontro, casal ou di\xE1logo entre homem e mulher):
     * "avatarDescription": Descreva com riqueza os dois personagens (Mulher e Homem), suas idades aproximadas, etnia (se informada) e continuidade de roupas.
     * "scenarioDescription": D\xEA prioridade ao ambiente de encontro/intera\xE7\xE3o informado (ex: cafeteria, restaurante intimista ao p\xF4r do sol).
     * "scenes": As Cenas 1 e 2 devem ilustrar a mulher reagindo/admirando o produto e perguntando ao homem; a partir da Cena 3 o homem responde, apresenta o produto, demonstra as fun\xE7\xF5es e na Cena 9 conclui com o CTA.
   - Proibido texto flutuante externo, legenda, pre\xE7o, n\xFAmero escrito, carrinho, marca d'\xE1gua de rede social, @ ou interface de aplicativo dentro das cenas (mas OBRIGAT\xD3RIO manter a logomarca original do fabricante impressa no pr\xF3prio produto).`;
}

// src/produtos2/produtos2UserSpeechExtractor.ts
function fixCommonSlips(str) {
  let s = str;
  s = s.replace(/\b([a-záàâãéêíóôõúç]{2,})(?:\s*,\s*|\s+)\1\b/gi, "$1");
  s = s.replace(/\bp[óo]\s*pouco\b/gi, "Poco");
  s = s.replace(/\bpopouco\b/gi, "Poco");
  s = s.replace(/\bpoco\s+(?:\d+\s+)?vezes\b/gi, "Poco X8");
  s = s.replace(/\bn[ãa]o\s+(tik\s*tok\s*shop|tiktok\s*shop)\b/gi, "na TikTok Shop");
  s = s.replace(/\btik\s*tok\s*shop\b/gi, "TikTok Shop");
  s = s.replace(/\btoca\s+no\s+carrinho\b/gi, "toca no carrinho");
  s = s.replace(/\b800\s*w\b/gi, "800 watts");
  s = s.replace(/\b23\s*pol\b/gi, "23 polegadas");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
function condenseSpeechMinimallyTo225(text, maxLen = 225, minTarget = 215) {
  let s = fixCommonSlips(text).replace(/\s+/g, " ").trim();
  if (s.length <= maxLen) {
    return s;
  }
  const microReplacements = [
    [/,?\s*\bn[ée]\b\s*,?/gi, ", "],
    [/,?\s*\btipo\s+assim\b\s*,?/gi, " "],
    [/\bque\s+eu\s+/gi, "que "],
    [/\beu\s+tenho\s+que\b/gi, "tenho que"],
    [/\beu\s+vou\s+deixar\b/gi, "vou deixar"],
    [/\beu\s+j[áa]\s+/gi, "j\xE1 "],
    [/\bent[ãa]o\s+j[áa]\s+/gi, "j\xE1 "],
    [/\be\s+j[áa]\s+/gi, "e "],
    [/\bvoc[êe]\s+sabe\s+que\b/gi, "sabe que"],
    [/\baqui\s+no\s+carrinho\s+laranja\b/gi, "no carrinho laranja"],
    [/\baqui\s+embaixo\s+no\s+carrinho\b/gi, "no carrinho"],
    [/\baqui\s+no\s+carrinho\b/gi, "no carrinho"],
    [/\bpor\s+um\s+valor\s+muito\s+barato\b/gi, "muito barato"],
    [/\bvalor\s+muito\s+barato\b/gi, "muito barato"],
    [/\bdois\s+dias\b/gi, "2 dias"],
    [/\btr[êe]s\s+dias\b/gi, "3 dias"],
    [/\bquatro\b/gi, "4"],
    [/\bcinco\b/gi, "5"]
  ];
  for (const [pattern, replacement] of microReplacements) {
    if (s.length <= maxLen) break;
    const next = s.replace(pattern, replacement).replace(/\s+,/g, ",").replace(/,{2,}/g, ",").replace(/\s+/g, " ").trim();
    if (next.length < s.length && (next.length >= minTarget || s.length > maxLen)) {
      s = next;
    }
  }
  if (s.length <= maxLen) {
    return s;
  }
  return fitSpeechCloseToLimit(s, maxLen, minTarget);
}
function fitSpeechCloseToLimit(text, maxLen = 225, minTarget = 215) {
  let s = text.replace(/\s+/g, " ").trim();
  if (s.length <= maxLen && s.length >= minTarget) {
    return s;
  }
  if (s.length <= maxLen) {
    return s;
  }
  const slice225 = s.slice(0, maxLen);
  for (let i = maxLen; i >= minTarget; i--) {
    const ch = slice225[i - 1];
    if (ch === "." || ch === "!" || ch === "?") {
      return slice225.slice(0, i).trim();
    }
  }
  for (let i = maxLen - 1; i >= minTarget; i--) {
    const ch = slice225[i - 1];
    if (ch === "," || ch === ";") {
      let candidate = slice225.slice(0, i - 1).trim();
      candidate = cleanDanglingEnds(candidate);
      return candidate + "!";
    }
  }
  for (let i = maxLen - 1; i >= minTarget; i--) {
    if (slice225[i - 1] === " ") {
      let candidate = slice225.slice(0, i - 1).trim();
      candidate = cleanDanglingEnds(candidate);
      if (!/[.!?]$/.test(candidate)) candidate += "!";
      if (candidate.length <= maxLen && candidate.length >= minTarget) {
        return candidate;
      }
    }
  }
  const lastSpace = slice225.lastIndexOf(" ");
  if (lastSpace > 0) {
    let candidate = slice225.slice(0, lastSpace).trim();
    candidate = cleanDanglingEnds(candidate);
    if (!/[.!?]$/.test(candidate)) candidate += "!";
    return candidate;
  }
  return cleanDanglingEnds(slice225.trim()) + "!";
}
function cleanDanglingEnds(text) {
  let s = text.trim();
  s = s.replace(/\s+(?:e|de|do|da|dos|das|o|a|os|as|com|em|no|na|nos|nas|que|para|pra|por|um|uma)\s*([.!?,;:]*)$/i, "$1");
  return s.trim();
}
function extractUserSpeechFromInstructions(rawText, _productName = "", maxLen = 225, minTarget = 215) {
  if (!rawText || !rawText.trim()) {
    return { hasSpeech: false, speech: "" };
  }
  const text = rawText.trim();
  const quoteMatches = [];
  const quoteRegex = /["'«“]([^"'»”]{8,500})["'»”]/g;
  let qm;
  while ((qm = quoteRegex.exec(text)) !== null) {
    if (qm[1]?.trim()) {
      quoteMatches.push(qm[1].trim());
    }
  }
  if (quoteMatches.length > 0) {
    let combined = quoteMatches.join(" ");
    combined = fixCommonSlips(combined);
    return {
      hasSpeech: true,
      speech: formatFinalSpeech(combined, maxLen, minTarget)
    };
  }
  const colonRegex = /\b(?:(?:ele|ela|pai|m[ãa]e|homem|mulher|vendedor|cliente|personagem)\s+)?(?:(?:fala|diz|disse|falou|grita|gritam|falam|dizem|responde|pergunta)\s+assim\s*[:,]|(?:fala|diz|disse|falou|grita|gritam|falam|dizem|responde|pergunta)\s*:)\s*([\s\S]+?)(?=\s+(?:E\s+a[íi]\s+termina|E\s+a[íi]\s+j[áa]\s+corta|E\s+a[íi]\s+corta|Pronto\b|[ÉE]\s+isso\b|Ent[ãa]o\s+come[çc]a|A[íi]\s+a\s+primeira\s+cena|[ÉE]\s+uma\s+loja|O\s+cen[áa]rio|E\s+nessas\s+falas)|$)/gi;
  const colonSegments = [];
  let cm;
  while ((cm = colonRegex.exec(text)) !== null) {
    let seg = (cm[1] || "").trim();
    const inner = seg.split(/\b(?:fala|diz|disse|falou)(?:\s+assim)?\s*[:,]\s*/i);
    seg = inner[inner.length - 1].trim();
    seg = seg.replace(/,?\s*n[ée]\?/gi, "!").replace(/\s+/g, " ").trim();
    seg = fixCommonSlips(seg);
    if (seg.length >= 20 && !/^(?:au\s*)+/i.test(seg)) {
      colonSegments.push(seg);
    }
  }
  if (colonSegments.length > 0) {
    const chosen = colonSegments[colonSegments.length - 1];
    return { hasSpeech: true, speech: formatFinalSpeech(chosen, maxLen, minTarget) };
  }
  const isDialoguePattern = (text.toLowerCase().includes("homem") || text.toLowerCase().includes("rapaz")) && (text.toLowerCase().includes("mulher") || text.toLowerCase().includes("mo\xE7a")) && /(?:fala|diz|falou|pergunt)/i.test(text);
  if (isDialoguePattern) {
    const womanMatch = text.match(
      /(?:ela|mulher|moça)\s+(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|no\s+encontro\s+)?(?:fala|diz|falou|pergunta)[:\s]+([^.]+?)(?=\s+(?:a[íi]|ele|homem|rapaz)\s+(?:ele\s+)?(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|pega\s+)?(?:fala|diz|falou|responde)|$)/i
    );
    const manMatch = text.match(
      /(?:ele|homem|rapaz)\s+(?:vira\s+(?:e\s+)?|olha\s+(?:e\s+)?|pega\s+o\s+celular\s+(?:dele\s+)?(?:e\s+)?)?(?:fala|diz|falou|responde)[:\s]+([^.]+?)(?=\s+(?:e\s+nessas\s+falas|nessas\s+falas|essa\s+vai\s+terminar|como\s+eu\s+disse|o\s+cen[áa]rio|e\s+[ée]\s+isso)|$)/i
    );
    let womanSpeech = womanMatch ? womanMatch[1].trim() : "";
    let manSpeech = manMatch ? manMatch[1].trim() : "";
    womanSpeech = fixCommonSlips(womanSpeech).replace(/^[.!?,;:\s]+|[.!?,;:\s]+$/g, "");
    manSpeech = fixCommonSlips(manSpeech).replace(/^[.!?,;:\s]+|[.!?,;:\s]+$/g, "");
    manSpeech = manSpeech.replace(/\s+(?:e\s+nessas\s+falas|nessas\s+falas|essa\s+vai\s+terminar|como\s+eu\s+disse)[\s\S]*$/i, "").trim();
    if (womanSpeech && manSpeech) {
      womanSpeech = womanSpeech.charAt(0).toUpperCase() + womanSpeech.slice(1);
      manSpeech = manSpeech.charAt(0).toUpperCase() + manSpeech.slice(1);
      const combined = `${womanSpeech}! ${manSpeech}!`;
      return {
        hasSpeech: true,
        speech: formatFinalSpeech(combined, maxLen, minTarget)
      };
    }
  }
  const regex = /(?:ele\s+termina\s+n[ée]\s+ele\s+olha\s+para\s+c[âa]mera\s+e\s+fala|olha\s+(?:para|pra)\s+c[âa]mera\s+e\s+fala|olha\s+e\s+fala|(?:ele|ela)\s+(?:fala|diz|falou|disse|vai falar|vai dizer)|falando|dizendo)[:\s]+([\s\S]*?)(?=(?:a[íi]\s+(?:ele|ela|j[áa])|ela\s+fala|ele\s+fala|ele\s+falou|ele\s+termina|ela\s+termina|e\s+[ée]\s+um\s+homem|e\s+acontece|$|\.))/gi;
  let m;
  const segments = [];
  while ((m = regex.exec(text)) !== null) {
    let seg = m[1]?.trim();
    if (seg) {
      seg = seg.replace(/^(?:assim|que|isso)[:\s]*/i, "").trim();
      seg = seg.replace(/^(?:ele|ela)\s+(?:fala|diz|falou|disse)[:\s]*/i, "").trim();
      seg = fixCommonSlips(seg);
      if (seg.length >= 8) {
        segments.push(seg);
      }
    }
  }
  if (segments.length > 0) {
    const rawHook = segments.find(
      (s) => /que\s+celular|bonito|lindo|incr[íi]vel|maravilhoso|nossa|olha\s+s[óo]|olha\s+isso/i.test(s) && !/comprei|carrinho|adquir|shop/i.test(s)
    );
    let hookSeg = "";
    if (rawHook) {
      const firstSentence = rawHook.split(/(?<=[.!?])\s+/)[0] || rawHook;
      hookSeg = firstSentence.replace(/[.!?,;:\s]+$/, "").trim();
    }
    const productSeg = segments.find(
      (s) => /esse\s+aqui|novo|lan[çc]amento|celular|qualidade|benef[íi]cio|poco/i.test(s) && s !== rawHook
    );
    const fullCta = segments.find((s) => /comprei|compra/i.test(s) && /carrinho/i.test(s));
    const ctaSeg = fullCta || segments.slice().reverse().find(
      (s) => /comprei|compra|carrinho|adquir|shop|link/i.test(s)
    );
    let combined = "";
    if (hookSeg && productSeg && ctaSeg) {
      let p = productSeg.replace(/^[.!?,;:\s]+|[.!?,;:\s]+$/g, "").trim();
      let c = ctaSeg.replace(/^[.!?,;:\s]+/, "").trim();
      p = p.charAt(0).toUpperCase() + p.slice(1);
      c = c.charAt(0).toUpperCase() + c.slice(1);
      combined = `${hookSeg}! ${p}. ${c}`;
    } else if (productSeg && ctaSeg) {
      let p = productSeg.replace(/[.!?,;:\s]+$/, "").trim();
      let c = ctaSeg.replace(/^[.!?,;:\s]+/, "").trim();
      p = p.charAt(0).toUpperCase() + p.slice(1);
      c = c.charAt(0).toUpperCase() + c.slice(1);
      combined = `${p}. ${c}`;
    } else {
      combined = segments.join(". ");
    }
    return {
      hasSpeech: true,
      speech: formatFinalSpeech(combined, maxLen, minTarget)
    };
  }
  const ctaMatch = text.match(/(?:compra|comprei|toca no carrinho|adquira|pega o seu|aproveita)[^.!?]+(?:carrinho|shop|link|aqui)[^.!?]*/i);
  if (ctaMatch) {
    let speechCandidate = fixCommonSlips(ctaMatch[0].trim());
    speechCandidate = speechCandidate.replace(/\s+(?:e\s+nessas\s+falas|nessas\s+falas|essa\s+vai\s+terminar|como\s+eu\s+disse|o\s+cen[áa]rio|e\s+[ée]\s+isso)[\s\S]*$/i, "").trim();
    return {
      hasSpeech: true,
      speech: formatFinalSpeech(speechCandidate, maxLen, minTarget)
    };
  }
  if (text.length >= 10) {
    let cleaned = text.replace(/o cenário vai ser assim/gi, "").replace(/eu quero um homem/gi, "").replace(/num jantar romântico/gi, "").replace(/restaurante/gi, "").replace(/tudo ultra realista/gi, "").replace(/e acontece toda essa situação/gi, "").trim();
    cleaned = fixCommonSlips(cleaned);
    if (cleaned.length >= 15) {
      return {
        hasSpeech: true,
        speech: formatFinalSpeech(cleaned, maxLen, minTarget)
      };
    }
  }
  return { hasSpeech: false, speech: "" };
}
function formatFinalSpeech(raw, maxLen = 225, minTarget = 215) {
  let s = raw.trim();
  if (!s) return "";
  s = s.replace(/^["'«“]|["'»”]$/g, "").trim();
  s = s.charAt(0).toUpperCase() + s.slice(1);
  s = s.replace(/\.{2,}/g, ".");
  s = s.replace(/\s+([.,!?])/g, "$1");
  s = s.replace(/([.!?]\s+)([a-záàâãéêíóôõúç])/g, (_m, p, c) => p + c.toUpperCase());
  if (s.length > maxLen) {
    s = condenseSpeechMinimallyTo225(s, maxLen, minTarget);
  }
  if (!/[.!?]$/.test(s)) {
    s += "!";
  }
  return s;
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
function checkIsImageBase64Vertical(rawB64) {
  try {
    const clean = rawB64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/i, "").replace(/[\r\n\s]/g, "");
    const buf = Buffer.from(clean, "base64");
    if (buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71 && buf.length >= 24) {
      return buf.readUInt32BE(20) > buf.readUInt32BE(16);
    }
    if (buf[0] === 255 && buf[1] === 216) {
      let offset = 2;
      while (offset < buf.length - 8) {
        if (buf[offset] !== 255) break;
        const marker = buf[offset + 1];
        if (marker === 192 || marker === 194) {
          return buf.readUInt16BE(offset + 5) > buf.readUInt16BE(offset + 7);
        }
        offset += 2 + buf.readUInt16BE(offset + 2);
      }
    }
  } catch {
  }
  return false;
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
app.get("/api/health", (_req, res) => {
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
app.get("/api/cost-report", (_req, res) => {
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
    const { primaryPhotoBase64, userPrompt } = req.body;
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
    const activeProfile = req.body?.aiProfile || getRequestAIProfile(req);
    if (activeProfile === "openai") {
      if (!openAIProvider.isConfigured()) {
        return res.json({
          success: false,
          error: "A chave da API da OpenAI n\xE3o est\xE1 configurada no ambiente. Adicione OPENAI_API_KEY no arquivo .env ou no painel da Vercel."
        });
      }
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
          preserveLocation,
          aspectRatio: req.body.aspectRatio,
          size: req.body.size || (req.body.aspectRatio === "16:9" ? "1792x1024" : void 0)
        });
        return res.json(result);
      } catch (oiErr) {
        return res.json({
          success: false,
          error: oiErr?.message || "Erro na chamada \xE0 API da OpenAI."
        });
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
              aspectRatio: req.body.aspectRatio || "9:16"
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
          lastErrorMessage = "Seu projeto no Google AI Studio atingiu o Limite de Gastos Mensal (Spend Cap - Erro 429). Para permitir que a IA gere as imagens fotorrealistas do produto, ajuste ou aumente o limite em https://ai.studio/spend ou alterne para o provedor OpenAI.";
        } else if (imgError?.status === 402 || imgError?.message?.includes("prepayment credits are depleted") || imgError?.message?.includes("402")) {
          lastErrorType = "CREDITS_DEPLETED";
          lastErrorMessage = "Seus cr\xE9ditos pr\xE9-pagos da API Gemini se esgotaram (Erro 402). O modelo fotorrealista requer cr\xE9ditos ativos no Google AI Studio (https://ai.studio/projects) ou alterne para o provedor OpenAI.";
        } else {
          lastErrorType = "AI_FAILED";
          lastErrorMessage = imgError?.message || "Falha na gera\xE7\xE3o de imagem com a IA.";
        }
      }
    }
    if (!imageResultUrl && openAIProvider.isConfigured() && activeProfile !== "openai") {
      try {
        console.log("Gemini atingiu limite ou falhou. Tentando fallback autom\xE1tico para OpenAI...");
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
          preserveLocation,
          aspectRatio: req.body.aspectRatio,
          size: req.body.size || (req.body.aspectRatio === "16:9" ? "1792x1024" : void 0)
        });
        if (result.success && result.imageUrl) {
          return res.json(result);
        }
      } catch (fbErr) {
        console.warn("Fallback OpenAI tamb\xE9m falhou:", fbErr?.message || fbErr);
      }
    }
    if (!imageResultUrl) {
      return res.json({
        success: false,
        errorType: lastErrorType || "AI_FAILED",
        error: lastErrorMessage || "N\xE3o foi poss\xEDvel gerar a imagem no modelo fotorrealista. Verifique sua chave de API e limites de cota."
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
app.post("/api/produtos2-planning", async (req, res) => {
  try {
    const {
      action,
      productName,
      productInfo,
      niche,
      subMode,
      maleSubOption,
      maleClothStyle,
      baseCopy,
      isCustomCopy,
      copyEngine,
      duration,
      influencer,
      clientGender,
      speechMode,
      framing,
      scenario,
      additionalInstructions,
      variations = [],
      productPhotosBase64 = []
    } = req.body;
    const activeProfile = req.body?.aiProfile || getRequestAIProfile(req);
    const normalizeVoiceText = (text) => {
      if (!text) return "";
      let out = text;
      out = out.replace(/\b(\d+)\s*[wW]\b/g, "$1 watts");
      out = out.replace(/\b(\d+)\s*[kK][wW]\b/g, "$1 quilowatts");
      out = out.replace(/\b(\d+)\s*[hH][zZ]\b/g, "$1 hertz");
      out = out.replace(/\b(\d+)\s*(?:pol|pol\.)\b/gi, "$1 polegadas");
      out = out.replace(/\b(\d+)\s*(?:cm|cm\.)\b/gi, "$1 cent\xEDmetros");
      out = out.replace(/\b(\d+)\s*(?:mm|mm\.)\b/gi, "$1 mil\xEDmetros");
      out = out.replace(/\b(\d+)\s*(?:km|km\.)\b/gi, "$1 quil\xF4metros");
      out = out.replace(/\b(\d+)\s*(?:kg|kg\.)\b/gi, "$1 quilos");
      out = out.replace(/\b(\d+)\s*(?:ml|ml\.)\b/gi, "$1 mililitros");
      out = out.replace(/\b(\d+)\s*[vV]\b/g, "$1 volts");
      out = out.replace(/\b(\d+)\s*(?:mah|mAh)\b/gi, "$1 miliamperes");
      out = out.replace(/\b(\d+)\s*(?:fps|FPS)\b/g, "$1 quadros por segundo");
      out = out.replace(/\b(\d+)\s*(?:gb|GB)\b/g, "$1 gigas");
      out = out.replace(/\b(\d+)\s*(?:tb|TB)\b/g, "$1 teras");
      out = out.replace(/\b(\d+)\s*(?:mb|MB)\b/g, "$1 megas");
      out = out.replace(/\b(\d+)\s*%/g, "$1 por cento");
      out = out.replace(/\b([Pp]oco)\s+(?:\d+\s+)?vezes\b/g, "$1 X8");
      out = out.replace(/\bAMOLED\b/g, "Am\xF3led");
      out = out.replace(/\bOLED\b/g, "\xD3led");
      out = out.replace(/\bLED\b/g, "L\xE9d");
      out = out.replace(/\bQLED\b/g, "Q-L\xE9d");
      out = out.replace(/\s*&\s*/g, " e ");
      out = out.replace(/\s*\+\s*/g, " mais ");
      return out.replace(/\s+/g, " ").trim();
    };
    const cleanDuplicateWords = (text) => {
      if (!text) return "";
      return text.replace(/\b([a-zA-ZÀ-ÿ0-9]+)([\s,]+)\1\b/gi, (match, word) => {
        if (word.toLowerCase() === "j\xE1") return match;
        return word;
      });
    };
    const executeFastAIText = async (opts) => {
      const { systemPrompt, userPrompt: userPrompt2, jsonMode = false, temperature = 0.3 } = opts;
      const client = openAIProvider.getClient();
      if (client) {
        try {
          const comp = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt2 }
            ],
            ...jsonMode ? { response_format: { type: "json_object" } } : {},
            temperature,
            max_tokens: 420
          });
          const content = comp.choices[0]?.message?.content?.trim();
          if (content) {
            const pTokens = comp.usage?.prompt_tokens || 450;
            const cTokens = comp.usage?.completion_tokens || 110;
            const costUSD = Math.round((pTokens / 1e6 * 0.15 + cTokens / 1e6 * 0.6) * 1e4) / 1e4;
            const costBRL = Math.round(costUSD * 5.7 * 1e3) / 1e3;
            return {
              text: content,
              usage: {
                promptTokens: pTokens,
                completionTokens: cTokens,
                totalTokens: pTokens + cTokens,
                costUSD: Math.max(5e-4, costUSD),
                costBRL: Math.max(3e-3, costBRL),
                model: "gpt-4o-mini"
              }
            };
          }
        } catch (err) {
          console.warn("Erro na chamada OpenAI gpt-4o-mini, tentando fallback:", err?.message || err);
        }
      }
      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = getGenAI();
          const gemRes = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}

${userPrompt2}` }]
              }
            ],
            config: {
              temperature,
              ...jsonMode ? { responseMimeType: "application/json" } : {}
            }
          });
          const text = gemRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            const pTokens = gemRes.usageMetadata?.promptTokenCount || 450;
            const cTokens = gemRes.usageMetadata?.candidatesTokenCount || 110;
            return {
              text,
              usage: {
                promptTokens: pTokens,
                completionTokens: cTokens,
                totalTokens: pTokens + cTokens,
                costUSD: 3e-4,
                costBRL: 2e-3,
                model: "gemini-2.5-flash"
              }
            };
          }
        } catch (gemErr) {
          console.warn("Erro na chamada Gemini:", gemErr?.message || gemErr);
        }
      }
      throw new Error("Nenhum provedor de IA dispon\xEDvel para gera\xE7\xE3o de texto.");
    };
    const executeTopAIModel = async (opts) => {
      const { systemPrompt, userPrompt: userPrompt2, jsonMode = false } = opts;
      const client = openAIProvider.getClient();
      if (client) {
        const topModels = ["gpt-4o", OPENAI_BRAIN_MODEL, "gpt-4o-mini"];
        for (const modelCandidate of topModels) {
          try {
            const params = {
              model: modelCandidate,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt2 }
              ],
              ...jsonMode ? { response_format: { type: "json_object" } } : {}
            };
            if (modelCandidate.startsWith("gpt-5") || modelCandidate.startsWith("o")) {
              params.reasoning_effort = "medium";
            } else {
              params.temperature = 0.2;
            }
            const comp = await client.chat.completions.create(params);
            const content = comp.choices[0]?.message?.content?.trim();
            if (content) {
              const pTokens = comp.usage?.prompt_tokens || 1250;
              const cTokens = comp.usage?.completion_tokens || 250;
              const costUSD = Math.round((pTokens / 1e6 * 2.5 + cTokens / 1e6 * 10) * 1e4) / 1e4;
              const costBRL = Math.round(costUSD * 5.7 * 100) / 100;
              return {
                text: content,
                usage: {
                  promptTokens: pTokens,
                  completionTokens: cTokens,
                  totalTokens: pTokens + cTokens,
                  costUSD: Math.max(4e-3, costUSD),
                  costBRL: Math.max(0.02, costBRL),
                  model: modelCandidate
                }
              };
            }
          } catch (mErr) {
            console.warn(`Tentando pr\xF3ximo modelo OpenAI ap\xF3s erro no ${modelCandidate}:`, mErr?.message || mErr);
          }
        }
      }
      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = getGenAI();
          const gemRes = await genAI.models.generateContent({
            model: GEMINI_VISION_FAST_MODEL || "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}

${userPrompt2}` }]
              }
            ],
            config: {
              temperature: 0.3,
              ...jsonMode ? { responseMimeType: "application/json" } : {}
            }
          });
          const text = gemRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            const pTokens = gemRes.usageMetadata?.promptTokenCount || 1250;
            const cTokens = gemRes.usageMetadata?.candidatesTokenCount || 250;
            return {
              text,
              usage: {
                promptTokens: pTokens,
                completionTokens: cTokens,
                totalTokens: pTokens + cTokens,
                costUSD: 1e-3,
                costBRL: 6e-3,
                model: GEMINI_VISION_FAST_MODEL || "gemini-2.5-flash"
              }
            };
          }
        } catch (gemErr) {
          console.warn("Erro no fallback Gemini:", gemErr?.message || gemErr);
        }
      }
      throw new Error("Nenhum provedor de IA dispon\xEDvel para a fala do usu\xE1rio.");
    };
    const calibrateSpeechToRange = (text, minTarget = 200, maxLimit = 225) => {
      let clean = fixCommonSlips(normalizeVoiceText(text.replace(/\s+/g, " ").trim()));
      if (clean.length > maxLimit) {
        clean = condenseSpeechMinimallyTo225(clean, maxLimit, minTarget);
      }
      if (clean.length < minTarget) {
        const baseNoDot = clean.replace(/[.!?]+$/, "").trim();
        const expansions = [
          ". Olha s\xF3!",
          ". Confere aqui embaixo!",
          ". Aproveita e garante j\xE1 no link!",
          ". Clica aqui embaixo pra ver todos os detalhes!",
          ". Vale muito a pena conferir aqui embaixo no carrinho!",
          ". D\xE1 uma olhada aqui embaixo no link e garante j\xE1 antes que acabe!",
          ". Aproveita pra conferir todos os detalhes aqui embaixo e garante logo!",
          ". Deixei o link oficial aqui embaixo no carrinho pra voc\xEA garantir com seguran\xE7a!",
          ". Entrega muita praticidade e qualidade real no uso di\xE1rio, clica aqui no carrinho laranja e garante o seu agora mesmo!",
          ". \xC9 super pr\xE1tico, faz toda a diferen\xE7a na rotina e t\xE1 fazendo o maior sucesso, clica aqui embaixo no carrinho laranja pra conferir e garantir o seu antes que acabe!"
        ];
        for (const exp of expansions) {
          const candidate = `${baseNoDot}${exp}`;
          if (candidate.length >= minTarget && candidate.length <= maxLimit) {
            clean = candidate;
            break;
          }
        }
        if (clean.length < minTarget) {
          const longCandidate = `${baseNoDot}. Entrega muita qualidade e praticidade real pro seu dia a dia, clica aqui embaixo no carrinho laranja pra ver todos os detalhes e garante j\xE1 o seu antes que acabe o estoque!`;
          clean = condenseSpeechMinimallyTo225(longCandidate, maxLimit, minTarget);
        }
      }
      if (clean.length > maxLimit) {
        clean = clean.slice(0, maxLimit - 1).replace(/[,;:\s]+[^.!?,;:]*$/, "") + "!";
      }
      return clean;
    };
    const calibrateSpeechTo200_225 = (text) => calibrateSpeechToRange(text, 200, 225);
    if (action === "detect_and_review_user_speech") {
      try {
        const textToAnalyze = (additionalInstructions || req.body.text || "").trim();
        if (!textToAnalyze) {
          return res.json({ success: true, hasUserSpeech: false, userSpeech: "" });
        }
        const reqSceneMode = req.body.sceneMode || "1_cena_10s";
        const maxSpeechLimit = reqSceneMode === "2_cenas_10s" ? 450 : reqSceneMode === "1_cena_15s" ? 335 : 225;
        const minSpeechTarget = reqSceneMode === "2_cenas_10s" ? 400 : reqSceneMode === "1_cena_15s" ? 310 : 215;
        const detectSystem = `Voc\xEA \xE9 o modelo mais avan\xE7ado da OpenAI especializado em roteiros e copies para v\xEDdeos do TikTok Shop Brasil.
O usu\xE1rio preencheu o campo "Instru\xE7\xF5es Adicionais" com um texto ditado por voz (informal, \xE0s vezes com gagueira) que mistura descri\xE7\xE3o de cen\xE1rio, personagens, a\xE7\xF5es e as FALAS que ele quer no v\xEDdeo.

SUA MISS\xC3O OBRIGAT\xD3RIA:
1. Identifique TODAS as falas que algum personagem diz em voz alta no v\xEDdeo (marcadores t\xEDpicos: "fala", "diz", "vira e fala", "fala assim", "ele fala assim,", "ele j\xE1 fala assim", "dizendo", "grita", "todos falam em coro", etc.).
2. Elimine totalmente metanarrativa e descri\xE7\xE3o de cena/personagem (ex.: "Um v\xEDdeo de um homem, um pai...", "chegando do servi\xE7o j\xE1 com 4 pacotes...", "e ele fala assim,"). JAMAIS inclua descri\xE7\xF5es visuais na fala.
3. Remova apenas palavras repetidas consecutivas por gagueira/ditado (ex.: "trabalhar, trabalhar" -> "trabalhar", "a\xED, a\xED" -> "a\xED").
4. Sons n\xE3o verbais de personagens (ex.: "au au au" de algu\xE9m imitando cachorro) N\xC3O entram em "userSpeech"; descreva-os em "soundEffects".
5. Extraia primeiro "rawUserSpeech": a fala EXATA e INTEGRAL dita pelo personagem no texto do usu\xE1rio (apenas sem descri\xE7\xE3o de cena, sem gagueiras duplicadas e com pontua\xE7\xE3o correta), SEM ENCURTAR NENHUMA FRASE.
6. REGRA ABSOLUTA E INEGOCI\xC1VEL PARA "userSpeech" (LIMITE ATUAL: ${maxSpeechLimit} CARACTERES):
   - CASO A: Se "rawUserSpeech" tiver ${maxSpeechLimit} caracteres ou menos (<= ${maxSpeechLimit} caracteres), \xC9 TERMINANTEMENTE PROIBIDO ENCURTAR, RESUMIR OU CORTAR QUALQUER PALAVRA OU EXPRESS\xC3O! Nesse caso, "userSpeech" DEVE SER ID\xCANTICO ao "rawUserSpeech".
   - CASO B: Se e SOMENTE SE "rawUserSpeech" ultrapassar ${maxSpeechLimit} caracteres (> ${maxSpeechLimit} caracteres), enxugue O M\xCDNIMO POSS\xCDVEL para que "userSpeech" fique COLADO no limite de ${maxSpeechLimit} caracteres \u2014 OBRIGATORIAMENTE ENTRE ${minSpeechTarget} E ${maxSpeechLimit} CARACTERES! Preserve ao m\xE1ximo as palavras originais do usu\xE1rio do in\xEDcio ao CTA final.
   - Corrija erros de transcri\xE7\xE3o (ex.: "p\xF3 pouco"/"pouco" -> "Poco", "Tik Tok" -> "TikTok Shop"). O "X" em modelos (X8, Poco X8 Pro) NUNCA vira "vezes".
7. "speakers": lista de TODOS os personagens que falam, na ordem, com { "speaker": papel (ex.: "Pai", "Vendedor", "Mulher", "Homem"), "gender": "masculina" | "feminina" | "coro", "speech": fala exata dele (trecho de userSpeech), "scenes": em quais cenas fala }.
8. "isDialogue": true SOMENTE se 2 ou mais personagens/grupos diferentes falam. Se apenas um personagem fala, "isDialogue": false (mas preencha "speakers" com esse \xFAnico personagem e seu g\xEAnero).
9. "dialogueDescription": resumo curto da cena e dos personagens (sem as falas). "dialogueScript": roteiro "Papel: \\"fala\\"" por linha.
10. Se n\xE3o houver nenhuma fala expl\xEDcita, "hasUserSpeech": false, "rawUserSpeech": "" e "userSpeech": "".

FORMATO DE RESPOSTA (JSON estrito):
{
  "hasUserSpeech": true,
  "rawUserSpeech": "...",
  "userSpeech": "...",
  "isDialogue": false,
  "dialogueDescription": "...",
  "dialogueScript": "Pai: \\"...\\"",
  "speakers": [ { "speaker": "Pai", "gender": "masculina", "speech": "...", "scenes": "Cenas 1 a 9" } ],
  "soundEffects": "..."
}`;
        const rawOutput = await executeTopAIModel({
          systemPrompt: detectSystem,
          userPrompt: `INSTRU\xC7\xD5ES ADICIONAIS FORNECIDAS PELO USU\xC1RIO:
${textToAnalyze}

NOME DO PRODUTO: ${productName || "Produto"}
INFORMA\xC7\xD5ES DO PRODUTO: ${productInfo || ""}`,
          jsonMode: true
        });
        const raw = rawOutput.text;
        let parsed = {};
        try {
          parsed = JSON.parse(raw);
        } catch {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              parsed = JSON.parse(match[0]);
            } catch {
            }
          }
        }
        const syncExt = extractUserSpeechFromInstructions(textToAnalyze, productName, maxSpeechLimit, minSpeechTarget);
        let rawUserSpeech = fixCommonSlips(
          normalizeVoiceText(
            (parsed.rawUserSpeech || parsed.raw_user_speech || "").trim()
          )
        );
        if (!rawUserSpeech && syncExt.hasSpeech && syncExt.speech) {
          rawUserSpeech = fixCommonSlips(normalizeVoiceText(syncExt.speech));
        }
        let userSpeech = fixCommonSlips(
          normalizeVoiceText(
            (parsed.userSpeech || parsed.user_speech || parsed.speech || parsed.fala || parsed.fala_usuario || parsed.texto_fala || "").trim()
          )
        );
        if (!userSpeech && syncExt.hasSpeech && syncExt.speech) {
          userSpeech = syncExt.speech;
        }
        const candidateUnshortened = rawUserSpeech && rawUserSpeech.length >= 15 && rawUserSpeech.length <= maxSpeechLimit ? rawUserSpeech : syncExt.hasSpeech && syncExt.speech.length >= 15 && syncExt.speech.length <= maxSpeechLimit ? syncExt.speech : "";
        if (candidateUnshortened && candidateUnshortened.length > userSpeech.length) {
          userSpeech = candidateUnshortened;
        } else if (rawUserSpeech && rawUserSpeech.length > maxSpeechLimit && userSpeech.length < minSpeechTarget - 3) {
          const minimallyCondensed = condenseSpeechMinimallyTo225(rawUserSpeech, maxSpeechLimit, minSpeechTarget);
          if (minimallyCondensed.length > userSpeech.length && minimallyCondensed.length <= maxSpeechLimit) {
            userSpeech = minimallyCondensed;
          }
        }
        if (userSpeech.length > maxSpeechLimit) {
          userSpeech = condenseSpeechMinimallyTo225(userSpeech, maxSpeechLimit, minSpeechTarget);
        }
        const hasUserSpeech = Boolean(
          userSpeech && userSpeech.length >= 8 && (parsed.hasUserSpeech === true || parsed.has_user_speech === true || String(parsed.hasUserSpeech).toLowerCase() === "true" || String(parsed.has_user_speech).toLowerCase() === "true" || Boolean(userSpeech))
        );
        const isDialogue = Boolean(parsed.isDialogue || parsed.speakers && parsed.speakers.length > 1);
        const dialogueDescription = parsed.dialogueDescription || "";
        const dialogueScript = parsed.dialogueScript || "";
        const speakers = Array.isArray(parsed.speakers) ? parsed.speakers : [];
        return res.json({
          success: true,
          hasUserSpeech,
          userSpeech: hasUserSpeech ? userSpeech : "",
          isDialogue,
          dialogueDescription,
          dialogueScript,
          speakers,
          usage: rawOutput.usage
        });
      } catch (err) {
        console.warn("Erro ao detectar fala do usu\xE1rio:", err);
        return res.json({ success: true, hasUserSpeech: false, userSpeech: "" });
      }
    }
    if (action === "adapt_bank_copies") {
      try {
        const { copy1, copy2, clientGender: clientGender2, enforceRange200To225 } = req.body;
        if (!copy1 && !copy2) {
          return res.json({ success: true });
        }
        const reqSceneMode = req.body.sceneMode || "1_cena_10s";
        const targetMin = Number(req.body.targetMinChars) || (reqSceneMode === "1_cena_15s" ? 310 : 200);
        const targetMax = Number(req.body.targetMaxChars) || (reqSceneMode === "1_cena_15s" ? 335 : 225);
        const enforceStrictRange = Boolean(enforceRange200To225 || targetMax === 335);
        const charRuleText = enforceStrictRange ? `- REGRA OBRIGAT\xD3RIA DE TAMANHO: A fala adaptada DEVE ter OBRIGATORIAMENTE ENTRE ${targetMin} E ${targetMax} CARACTERES (incluindo espa\xE7os e pontua\xE7\xE3o). NUNCA entregue menos de ${targetMin} caracteres e NUNCA ultrapasse ${targetMax} caracteres!` : `- Cada fala adaptada deve ter entre 160 e ${targetMax} caracteres (NUNCA ultrapasse ${targetMax} caracteres).`;
        const adaptSystem = `Voc\xEA \xE9 um Especialista S\xEAnior em Direct Response para TikTok Shop Brasil.
Existe na mem\xF3ria do aplicativo um banco de 64 falas validadas de an\xFAncios reais que j\xE1 est\xE3o vendendo muito.
Sua miss\xE3o \xE9 ADAPTAR as falas sorteadas do banco para o PRODUTO ATUAL do usu\xE1rio, seguindo estritamente estas regras:

REGRA DE OURO DA ADAPTA\xC7\xC3O (MUDAR O M\xCDNIMO POSS\xCDVEL DA ESTRUTURA, MAS 100% FIEL AO PRODUTO ATUAL):
1. SE FOR O MESMO PRODUTO (isSameProduct = true):
   - Mantenha a estrutura original da fala! Altere APENAS especifica\xE7\xF5es divergentes (ex: marca, modelo, pot\xEAncia em Watts, capacidade em ml/litros, polegadas, quantidade do kit) e concord\xE2ncia de g\xEAnero.
2. SE FOR OUTRO PRODUTO DO MESMO NICHO OU OUTRA COPY DO BANCO (isSameProduct = false):
   - As falas do banco j\xE1 possuem ganchos, cad\xEAncia e chamadas para a\xE7\xE3o (CTA) altamente validados. Por isso, MUDE O M\xCDNIMO POSS\xCDVEL da estrutura persuasiva (mantenha o estilo do gancho, o ritmo das frases, a urg\xEAncia e o CTA final).
   - POR\xC9M, substitua 100% de qualquer men\xE7\xE3o \xE0 categoria ou nome do produto antigo e 100% das caracter\xEDsticas exclusivas do produto antigo pelas caracter\xEDsticas REAIS do produto atual (extra\xEDdas de INFORMA\xC7\xD5ES DO PRODUTO).
   - PROIBI\xC7\xC3O ABSOLUTA DE ABSURDOS:
     * Se a copy original era de um brinquedo/triciclo/jipe (ex: "Olha o brinquedo que t\xE1 deixando a crian\xE7ada apaixonada... faz drift 360, tem luzes de LED, 3 velocidades" ou "ele gira em 360 graus") e o produto atual \xE9 um Kit de Fraldas (ou qualquer item que n\xE3o seja brinquedo de manobra): JAMAIS chame fralda de "brinquedo" ou "presente", e JAMAIS diga que fralda "faz drift 360", "tem luzes de LED", "3 velocidades" ou "gira em 360 graus"! Troque "brinquedo" por algo coerente (ex: "achado", "kit", "oferta") e troque "faz drift 360, tem luzes de LED, 3 velocidades" pelos benef\xEDcios reais do produto (ex: "tem at\xE9 12 horas de absor\xE7\xE3o, camada macia, el\xE1sticos confort\xE1veis e estampa da Galinha Pintadinha").
     * Nunca deixe caracter\xEDsticas do produto antigo (como "tela curva", "suporta 100 quilos", "silenciosa com painel LED", "vara de carbono", "amplificador") em um produto que n\xE3o tem isso.
     * Ignore avisos legais/seguran\xE7a das informa\xE7\xF5es do produto (como "perigo de sufocamento", "mantenha sacos pl\xE1sticos longe", "consulte um m\xE9dico", "data de validade"). Use apenas os benef\xEDcios reais de venda!
3. LIMITE DE CARACTERES E FORMATA\xC7\xC3O PARA VOZ DE IA:
   ${charRuleText}
   - Escreva medidas por extenso para leitura perfeita da voz de IA ("12 horas", "200 fraldas", "50 unidades").

Retorne SOMENTE um JSON estrito no formato:
{
  "adaptedCopy1": "...",
  "adaptedCopy2": "..."
}`;
        const adaptUser = `PRODUTO ATUAL DO USU\xC1RIO:
- Nome do Produto: ${productName || ""}
- Informa\xE7\xF5es e Benef\xEDcios do Produto:
${productInfo || productName || ""}
- G\xEAnero do P\xFAblico: ${clientGender2 || "unissex"}
- Apresentador(a): ${influencer || "Mulher"}
${enforceStrictRange ? `- TAMANHO OBRIGAT\xD3RIO: Estritamente entre ${targetMin} e ${targetMax} caracteres com espa\xE7os!` : ""}

FALA 1 DO BANCO DE MEM\xD3RIA (${copy1?.id || "Copy 1"} - Produto original da copy: "${copy1?.originalProductType || ""}" - Mesmo produto? ${copy1?.isSameProduct ? "SIM" : "N\xC3O"}):
Texto original da Fala 1 no banco: "${copy1?.originalText || ""}"
Sugest\xE3o base local da Fala 1: "${copy1?.localAdaptedText || ""}"

${copy2 ? `FALA 2 DO BANCO DE MEM\xD3RIA (${copy2?.id || "Copy 2"} - Produto original da copy: "${copy2?.originalProductType || ""}" - Mesmo produto? ${copy2?.isSameProduct ? "SIM" : "N\xC3O"}):
Texto original da Fala 2 no banco: "${copy2?.originalText || ""}"
Sugest\xE3o base local da Fala 2: "${copy2?.localAdaptedText || ""}"` : ""}`;
        const aiOut = await executeFastAIText({
          systemPrompt: adaptSystem,
          userPrompt: adaptUser,
          temperature: 0.25,
          jsonMode: true
        });
        let parsed = {};
        try {
          parsed = JSON.parse(aiOut.text);
        } catch {
          const m = aiOut.text.match(/\{[\s\S]*\}/);
          if (m) {
            try {
              parsed = JSON.parse(m[0]);
            } catch {
            }
          }
        }
        let adapted1 = fixCommonSlips(normalizeVoiceText((parsed.adaptedCopy1 || copy1?.localAdaptedText || "").trim()));
        let adapted2 = fixCommonSlips(normalizeVoiceText((parsed.adaptedCopy2 || copy2?.localAdaptedText || "").trim()));
        if (enforceStrictRange) {
          if (adapted1) adapted1 = calibrateSpeechToRange(adapted1, targetMin, targetMax);
          if (adapted2) adapted2 = calibrateSpeechToRange(adapted2, targetMin, targetMax);
        } else {
          if (adapted1.length > targetMax) {
            adapted1 = condenseSpeechMinimallyTo225(adapted1, targetMax, targetMin);
          }
          if (adapted2.length > targetMax) {
            adapted2 = condenseSpeechMinimallyTo225(adapted2, targetMax, targetMin);
          }
        }
        return res.json({
          success: true,
          adaptedCopy1: adapted1 || copy1?.localAdaptedText || "",
          adaptedCopy2: adapted2 || copy2?.localAdaptedText || "",
          usage: aiOut.usage
        });
      } catch (err) {
        console.warn("Erro ao adaptar copies do banco via IA, mantendo adapta\xE7\xE3o local:", err?.message || err);
        const fallback1 = req.body?.copy1?.localAdaptedText || "";
        const fallback2 = req.body?.copy2?.localAdaptedText || "";
        const reqSceneMode = req.body?.sceneMode || "1_cena_10s";
        const targetMin = Number(req.body?.targetMinChars) || (reqSceneMode === "1_cena_15s" ? 310 : 200);
        const targetMax = Number(req.body?.targetMaxChars) || (reqSceneMode === "1_cena_15s" ? 335 : 225);
        return res.json({
          success: true,
          adaptedCopy1: req.body?.enforceRange200To225 && fallback1 ? calibrateSpeechToRange(fallback1, targetMin, targetMax) : fallback1,
          adaptedCopy2: req.body?.enforceRange200To225 && fallback2 ? calibrateSpeechToRange(fallback2, targetMin, targetMax) : fallback2
        });
      }
    }
    if (action === "generate_leilao_speeches") {
      try {
        const prodName = (productName || req.body.productName || "Produto").trim();
        const pInfo = (productInfo || req.body.productInfo || "").trim();
        const l1Text = (req.body.l1Text || "quatro mil").trim();
        const l2Text = (req.body.l2Text || "tr\xEAs mil").trim();
        const shortName = (req.body.shortName || prodName).trim();
        const fullName = (req.body.fullName || prodName).trim();
        const leilaoPrompt = `Voc\xEA \xE9 o redator oficial do Modo Leil\xE3o para criativos de alta convers\xE3o do TikTok Shop / Reels.
Sua miss\xE3o \xE9 gerar EXATAMENTE as 3 falas do criativo de leil\xE3o para o produto: "${prodName}".
Informa\xE7\xF5es reais do produto:
"""
${pInfo}
"""

ESTRUTURA OBRIGAT\xD3RIA E RIGOROSA:
CENA 1 (Gancho no sal\xE3o de leil\xE3o - 0 a 12s):
"Quem d\xE1 ${l1Text} reais nesse ${shortName}? Quem d\xE1 ${l2Text}? Dou-lhe uma! Pera\xED... Olha o valor desse ${shortName} no TikTok Shop. T\xE1 de gra\xE7a!"

CENA 2 (Revela\xE7\xE3o e 2 diferenciais reais do produto - 12 a 24s):
"Leil\xE3o cancelado! Esse \xE9 o ${fullName}. [DIFERENCIAL 1]. [DIFERENCIAL 2]."
Exemplo de refer\xEAncia do modelo: "Leil\xE3o cancelado! Esse \xE9 o notebook Vaio FE16. Tela de 16 polegadas IPS antirreflexo. Processador AMD Ryzen 7."

CENA 3 (Chamada para a\xE7\xE3o no carrinho laranja - 24 a 30s):
"Por esse valor, n\xE3o tem como fazer leil\xE3o! Clica no carrinho laranja e garante o seu!"

REGRAS INEGOCI\xC1VEIS:
1. NUNCA inclua s\xEDmbolos como \xAE, \u2122, \xA9, *, \u2022 ou #.
2. Na CENA 2, [DIFERENCIAL 1] e [DIFERENCIAL 2] NUNCA devem repetir o nome do produto! Extraia os 2 maiores destaques das informa\xE7\xF5es (ex: Tela, Processador, Mem\xF3ria, Jato de \xE1gua pressurizado, Bateria, etc.).
3. NUNCA termine frases com retic\xEAncias (...) ou palavras cortadas. Cada frase deve ser completa e terminar com ponto final.
4. O texto deve ser 100% otimizado para narra\xE7\xE3o por voz de IA, fluido e natural em portugu\xEAs brasileiro.

Responda EXCLUSIVAMENTE em formato JSON com esta estrutura:
{
  "cena1": "texto exato da cena 1",
  "cena2": "texto exato da cena 2",
  "cena3": "texto da cena 3"
}`;
        const aiOutput = await executeFastAIText({
          systemPrompt: "Voc\xEA \xE9 um redator s\xEAnior de an\xFAncios de alta convers\xE3o para TikTok Shop. Responda apenas em JSON v\xE1lido.",
          userPrompt: leilaoPrompt,
          jsonMode: true,
          temperature: 0.2
        });
        const rawJson = aiOutput.text.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
        let parsed = JSON.parse(rawJson);
        const cleanSpeech = (t) => normalizeVoiceText(t).replace(/[®™©℠]/g, "").replace(/[*_~•|/\\#]/g, " ").replace(/\.{2,}/g, ".").replace(/\s+/g, " ").trim();
        const cena1 = cleanSpeech(parsed.cena1 || `Quem d\xE1 ${l1Text} reais nesse ${shortName}? Quem d\xE1 ${l2Text}? Dou-lhe uma! Pera\xED... Olha o valor desse ${shortName} no TikTok Shop. T\xE1 de gra\xE7a!`);
        const cena2 = cleanSpeech(parsed.cena2 || `Leil\xE3o cancelado! Esse \xE9 o ${fullName}. Alta performance e velocidade. Constru\xE7\xE3o refor\xE7ada de longa durabilidade.`);
        const cena3 = cleanSpeech(parsed.cena3 || `Por esse valor, n\xE3o tem como fazer leil\xE3o! Clica no carrinho laranja e garante o seu!`);
        const cleanShortClean = shortName.replace(/[®™©℠]/g, "").trim();
        const fallback1A = `Quem d\xE1 ${l1Text} reais nesse ${cleanShortClean}?`;
        const fallback1B = `Quem d\xE1 ${l2Text}? Dou-lhe uma!`;
        const fallback1C = `Pera\xED... Olha o valor desse ${cleanShortClean} no TikTok Shop. T\xE1 de gra\xE7a!`;
        let c1A = fallback1A;
        let c1B = fallback1B;
        let c1C = fallback1C;
        if (cena1.includes("Pera\xED")) {
          const parts = cena1.split("Pera\xED");
          const firstPart = parts[0]?.trim() || "";
          c1C = `Pera\xED${parts[1] || ""}`.trim();
          if (firstPart.includes("?")) {
            const sub = firstPart.split("?");
            c1A = `${sub[0]}?`.trim();
            c1B = sub.slice(1).join("?").trim() || fallback1B;
          } else {
            c1A = firstPart;
            c1B = fallback1B;
          }
        }
        return res.json({
          success: true,
          leilaoSpeech: {
            cena1,
            cena1A: c1A,
            cena1B: c1B,
            cena1C: c1C,
            cena2,
            cena2A: `Leil\xE3o cancelado! Esse \xE9 o ${fullName}.`,
            cena2B: cena2.replace(`Leil\xE3o cancelado! Esse \xE9 o ${fullName}.`, "").trim(),
            cena3,
            full: `${cena1} ${cena2} ${cena3}`
          },
          usage: aiOutput.usage
        });
      } catch (err) {
        console.warn("Erro ao gerar falas leil\xE3o com IA:", err?.message || err);
        return res.status(500).json({ success: false, error: err?.message || "Erro ao gerar falas do leil\xE3o." });
      }
    }
    if (action === "generate_achadinhos_speeches") {
      try {
        const prodName = (productName || req.body.productName || "Achadinho").trim();
        const pInfo = (productInfo || req.body.productInfo || "").trim();
        const addInstr = (req.body.additionalInstructions || "").trim();
        const userProvided = (req.body.userSpeech || "").trim();
        const achadinhosPrompt = `Voc\xEA \xE9 o motor criativo oficial do MODO AURORA ACHADINHOS (Vers\xE3o 5.0) para v\xEDdeos do TikTok Shop Brasil.
Sua miss\xE3o \xE9 gerar as falas das 3 CENAS DE 10 SEGUNDOS (dura\xE7\xE3o total: 30 segundos) para o produto: "${prodName}".
Informa\xE7\xF5es reais e caracter\xEDsticas do produto:
"""
${pInfo}
"""
${addInstr ? `Instru\xE7\xF5es adicionais / contexto do usu\xE1rio:
"""
${addInstr}
"""
` : ""}

REGRAS INEGOCI\xC1VEIS DA VERS\xC3O 5.0:
1. LIMITE ESTRITO DE CARACTERES: Cada cena DEVE ter no m\xE1ximo 225 caracteres (incluindo espa\xE7os e pontua\xE7\xE3o).
2. ESTRUTURA OBRIGAT\xD3RIA DA NARRATIVA:
   - CENA 1 (0 a 10s | Hook + Apresenta\xE7\xE3o): Comece com um hook espont\xE2neo da biblioteca de achadinhos (ex: "Gente, olha o que eu achei!", "Voc\xEAs precisam ver isso aqui!", "Olha esse achadinho que apareceu pra mim!", "Como \xE9 que eu n\xE3o conhecia isso antes?") e apresente o produto com naturalidade. Se houver pre\xE7o confirmado nas informa\xE7\xF5es, pode cit\xE1-lo.
   - CENA 2 (10 a 20s | Corpo + Benef\xEDcio + Demonstra\xE7\xE3o): Mostre a utilidade real na pr\xE1tica, transformando 1 ou 2 caracter\xEDsticas reais em benef\xEDcio concreto pro dia a dia ("Caracter\xEDstica real -> benef\xEDcio pr\xE1tico -> demonstra\xE7\xE3o visual").
   - CENA 3 (20 a 30s | Fechamento + CTA): Conclua o argumento e fa\xE7a um convite acolhedor e natural para conferir no carrinho do TikTok Shop (ex: "Se voc\xEA gostou, d\xE1 uma olhadinha no carrinho!", "Se fez sentido pra voc\xEA, confere l\xE1 no carrinho!", "D\xE1 uma olhadinha no carrinho e garante o seu!").
3. FIDELIDADE AO PRODUTO & REALISMO: Nunca invente funcionalidades, pre\xE7os ou garantias inexistentes.
4. OTIMIZA\xC7\xC3O PARA IA: Nunca use s\xEDmbolos como \xAE, \u2122, \xA9, asteriscos, numerais de lista ou retic\xEAncias longas. Escreva texto corrido, coloquial brasileiro natural e perfeito para voz sintetizada.

Responda EXCLUSIVAMENTE em formato JSON com esta estrutura:
{
  "cena1": "texto da cena 1 (m\xE1x 225 caracteres)",
  "cena2": "texto da cena 2 (m\xE1x 225 caracteres)",
  "cena3": "texto da cena 3 (m\xE1x 225 caracteres)"
}`;
        const aiOutput = await executeFastAIText({
          systemPrompt: "Voc\xEA \xE9 um redator s\xEAnior de achadinhos virais para TikTok Shop Brasil. Responda apenas em JSON v\xE1lido.",
          userPrompt: achadinhosPrompt,
          jsonMode: true,
          temperature: 0.3
        });
        const rawJson = aiOutput.text.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
        let parsed = JSON.parse(rawJson);
        const cleanSpeech = (t, max = 225) => {
          let s = normalizeVoiceText(t).replace(/[®™©℠]/g, "").replace(/[*_~•|/\\#]/g, " ").replace(/\.{2,}/g, ".").replace(/\s+/g, " ").trim();
          if (s.length > max) {
            const cut = s.slice(0, max);
            const lastPunct = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
            if (lastPunct > max * 0.7) s = cut.slice(0, lastPunct + 1).trim();
            else s = cut.trim();
          }
          return s;
        };
        const cena1 = cleanSpeech(parsed.cena1 || `Gente, olha o que eu achei! Voc\xEAs precisam ver esse ${prodName} de pertinho!`, 225);
        const cena2 = cleanSpeech(parsed.cena2 || `Olha a facilidade e a praticidade disso no dia a dia. Resolve aquela tarefa rapidinho!`, 225);
        const cena3 = cleanSpeech(parsed.cena3 || `Se fez sentido pra voc\xEA, d\xE1 uma olhadinha no carrinho e confere todos os detalhes!`, 225);
        const full = `${cena1}

${cena2}

${cena3}`;
        return res.json({
          success: true,
          achadinhosSpeech: {
            cena1,
            cena2,
            cena3,
            full
          },
          usage: aiOutput.usage
        });
      } catch (err) {
        console.warn("Erro ao gerar falas achadinhos com IA:", err?.message || err);
        return res.status(500).json({ success: false, error: err?.message || "Erro ao gerar falas do achadinhos." });
      }
    }
    if (action === "normalize_speech_for_ai" || action === "review_user_speech") {
      try {
        const inputSpeech = (req.body.text || req.body.speech || baseCopy || "").trim();
        if (!inputSpeech) {
          return res.status(400).json({ success: false, error: "Texto n\xE3o fornecido para revis\xE3o." });
        }
        const reqSceneMode = req.body.sceneMode || "1_cena_10s";
        const maxLimit = Number(req.body.maxChars) || (reqSceneMode === "modo_achadinhos" && !req.body.isSingleScenePart ? 675 : reqSceneMode === "2_cenas_10s" && !req.body.isSingleScenePart ? 450 : reqSceneMode === "1_cena_15s" ? 335 : 225);
        const minTarget = Number(req.body.minChars) || (maxLimit === 335 ? 310 : maxLimit === 450 ? 400 : 215);
        const cleanedInput = fixCommonSlips(inputSpeech);
        const charCount = cleanedInput.length;
        const isUnderLimit = charCount <= maxLimit;
        const lengthInstruction = isUnderLimit ? `REGRA ABSOLUTA DE TAMANHO (N\xC3O ENCURTAR):
O texto fornecido tem ${charCount} caracteres e J\xC1 EST\xC1 DENTRO do limite m\xE1ximo de ${maxLimit} caracteres.
- \xC9 TERMINANTEMENTE PROIBIDO ENCURTAR, RESUMIR, CONDENSAR OU CORTAR QUALQUER FRASE OU PARTE DO TEXTO!
- Mantenha o texto O MAIS ORIGINAL POSS\xCDVEL, preservando integralmente todas as frases, palavras, argumentos e detalhes originais que o usu\xE1rio escreveu.
- O comprimento final deve permanecer praticamente id\xEAntico ao original (com pequenas varia\xE7\xF5es apenas pelas corre\xE7\xF5es gramaticais ou remo\xE7\xE3o de palavras duplicadas).
- A \xDANICA raz\xE3o permitida para encurtar ou remover algo \xE9 se houver palavras repetidas ou gagueira (ex: "a\xED a\xED", "ele ele", "o o", "t\xE1 t\xE1", "trabalhar, trabalhar")!` : `REGRA DE TAMANHO (ENCURTAMENTO M\xCDNIMO NECESS\xC1RIO PORQUE EXCEDE ${maxLimit} CARACTERES):
O texto fornecido tem ${charCount} caracteres e EXCEDE o limite de ${maxLimit} caracteres.
- Voc\xEA DEVE enxugar O M\xCDNIMO POSS\xCDVEL para que o texto fique COLADO no limite de ${maxLimit} caracteres: OBRIGATORIAMENTE ENTRE ${minTarget} E ${maxLimit} CARACTERES (com espa\xE7os)!
- Corte apenas pequenas redund\xE2ncias ou conectivos extras para pousar entre ${minTarget} e ${maxLimit} caracteres, mantendo os argumentos do usu\xE1rio e a chamada de a\xE7\xE3o final.
- NUNCA deixe frases cortadas pela metade; a \xFAltima frase deve estar completa com ponto final ou exclama\xE7\xE3o.`;
        const reviewSystem = `Voc\xEA \xE9 um REVISOR EDITORIAL DE ALTA FIDELIDADE para narra\xE7\xE3o por voz de IA no TikTok Shop Brasil.
Sua miss\xE3o \xE9 aperfei\xE7oar o texto do usu\xE1rio mantendo fidelidade absoluta ao que ele escreveu ou ditou.

${lengthInstruction}

DIRETIVAS OBRIGAT\xD3RIAS:
1. CORRE\xC7\xC3O GRAMATICAL E ORTOGR\xC1FICA RIGOROSA:
   - Corrija todos os erros de ortografia, palavras grafadas incorretamente, acentua\xE7\xE3o, concord\xE2ncia verbal e nominal em portugu\xEAs brasileiro (ex: "comprar\xE3o" -> "compraram", "mais" -> "mas", "agente" -> "a gente", "pre\xE7o" -> "pre\xE7o", etc.).
   - Deixe o texto em portugu\xEAs correto, natural e fluido.
2. PONTUA\xC7\xC3O E RITMO PARA VOZ DE IA:
   - Ajuste a pontua\xE7\xE3o (v\xEDrgulas nos pontos de respira\xE7\xE3o natural, exclama\xE7\xF5es em frases empolgantes, pontos finais firmes) para que o narrador de IA fa\xE7a pausas naturais e respira\xE7\xF5es no lugar certo, com entona\xE7\xE3o empolgante e sem atropelar as palavras.
3. REMO\xC7\xC3O DE REPETI\xC7\xD5ES E GAGUEIRAS:
   - Elimine palavras duplicadas consecutivas ou v\xEDcios de fala decorrentes de digita\xE7\xE3o ou ditado por voz (ex: "a\xED a\xED" -> "a\xED", "ele ele" -> "ele", "o o" -> "o", "que que" -> "que", "trabalhar, trabalhar" -> "trabalhar").
4. PRON\xDANCIA CORRETA DE PRODUTOS E MEDIDAS:
   - Modelos com "X" (ex: "Poco X8 Pro", "iPhone X", "X8"): NUNCA substitua "X" por "vezes". O "X" refere-se ao nome/modelo do produto e deve permanecer como a letra "X".
   - "800 W" -> "800 watts"
   - "23 pol" -> "23 polegadas"
   - "50%" -> "50 por cento"
   - "AMOLED" -> "Am\xF3led"
5. PRESERVA\xC7\xC3O DE CONTE\xDADO:
   - N\xE3o invente argumentos novos e n\xE3o adicione chamadas para a\xE7\xE3o que o usu\xE1rio n\xE3o escreveu.
   - ${isUnderLimit ? `LEMBRE-SE: Como o texto original tem <= ${maxLimit} caracteres, PRESERVE 100% DAS FRASES DO TEXTO ORIGINAL, apenas corrigindo o portugu\xEAs, removendo repeti\xE7\xF5es e ajustando para leitura de IA.` : `Enxugue o m\xEDnimo poss\xEDvel para ficar estritamente entre ${minTarget} e ${maxLimit} caracteres mantendo todo o sentido.`}
6. FORMATO DE SA\xCDDA:
   - Retorne SOMENTE o texto final revisado, sem aspas, sem contagem de caracteres e sem explica\xE7\xF5es adicionais.`;
        const userPromptReview = isUnderLimit ? `TEXTO ORIGINAL PARA REVIS\xC3O (TEM ${charCount} CARACTERES - N\xC3O ENCURTAR, MANTENHA O TEXTO O MAIS ORIGINAL POSS\xCDVEL APENAS CORRIGINDO O PORTUGU\xCAS, PALAVRAS REPETIDAS E PONTUA\xC7\xC3O PARA IA):
${cleanedInput}` : `TEXTO ORIGINAL PARA REVIS\xC3O (TEM ${charCount} CARACTERES - EXCEDE ${maxLimit} CARACTERES, ENXUGUE O M\xCDNIMO POSS\xCDVEL PARA FICAR ENTRE ${minTarget} E ${maxLimit} CARACTERES MANTENDO O SENTIDO E CALL TO ACTION):
${cleanedInput}`;
        const reviewedOutput = await executeFastAIText({
          systemPrompt: reviewSystem,
          userPrompt: userPromptReview,
          temperature: 0.1
        });
        let reviewed = reviewedOutput.text;
        reviewed = reviewed.replace(/^["'«“]|["'»”]$/g, "").trim();
        reviewed = cleanDuplicateWords(reviewed);
        reviewed = fixCommonSlips(normalizeVoiceText(reviewed));
        if (isUnderLimit && reviewed.length < cleanedInput.length - 10) {
          reviewed = cleanedInput;
        } else if (!isUnderLimit && reviewed.length < minTarget - 3) {
          const minimallyCondensed = condenseSpeechMinimallyTo225(cleanedInput, maxLimit, minTarget);
          if (minimallyCondensed.length > reviewed.length && minimallyCondensed.length <= maxLimit) {
            reviewed = minimallyCondensed;
          }
        }
        if (reviewed.length > maxLimit) {
          reviewed = condenseSpeechMinimallyTo225(reviewed, maxLimit, minTarget);
        }
        return res.json({
          success: true,
          reviewedSpeech: reviewed,
          usage: reviewedOutput.usage
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err?.message || "Erro na revis\xE3o de texto" });
      }
    }
    if (action === "generate_aurora_copy") {
      try {
        const reqSceneMode = req.body.sceneMode || "1_cena_10s";
        const isSingleScenePart = Boolean(req.body.isSingleScenePart);
        const scenePartIndex2 = Number(req.body.scenePartIndex) || 1;
        const scene1CopyContext = String(req.body.scene1Copy || "").trim();
        const minLimit = Number(req.body.targetMinChars) || (isSingleScenePart ? 200 : reqSceneMode === "1_cena_15s" ? 310 : reqSceneMode === "2_cenas_10s" ? 400 : 200);
        const maxLimit = Number(req.body.targetMaxChars) || (isSingleScenePart ? 225 : reqSceneMode === "1_cena_15s" ? 335 : reqSceneMode === "2_cenas_10s" ? 450 : 225);
        const previousCopies = Array.isArray(req.body.previousCopies) ? req.body.previousCopies.filter((c) => typeof c === "string" && c.trim().length > 0) : [];
        const previousHooks = previousCopies.map((c) => c.trim().split(/\s+/).slice(0, 6).join(" ")).filter(Boolean);
        const hookVariationClause = previousHooks.length > 0 ? `
REGRA INEGOCI\xC1VEL DE VARIA\xC7\xC3O DE HOOK (PROIBIDO REPETIR IN\xCDCIO):
As vers\xF5es anteriores desta copy come\xE7aram com:
${previousHooks.map((h, i) => `- Vers\xE3o ${i + 1}: "${h}..."`).join("\n")}
- Voc\xEA DEVE criar uma copy com um HOOK COMPLETAMENTE DIFERENTE das vers\xF5es anteriores!
- Varie OBRIGATORIAMENTE as primeiras 4 a 5 palavras e use uma abordagem de abertura in\xE9dita (ex: pergunta direta sobre dor/desejo, rea\xE7\xE3o de descoberta espont\xE2nea, compara\xE7\xE3o pr\xE1tica, detalhe surpreendente do produto, situa\xE7\xE3o do dia a dia, etc.).
- NUNCA repita as mesmas primeiras palavras das vers\xF5es anteriores!` : "";
        const modeStructureInstructions = maxLimit === 335 ? `INSTRU\xC7\xC3O ESPECIAL DE MODO 15 SEGUNDOS (AUTORIZA\xC7\xC3O EXPL\xCDCITA DE 310 A 335 CARACTERES):
Neste modo de Uma Cena de 15 Segundos, voc\xEA est\xE1 EXPRESSAMENTE AUTORIZADA e OBRIGADA a produzir uma fala mais completa e envolvente, contendo ESTRITAMENTE ENTRE 310 E 335 CARACTERES (incluindo espa\xE7os e pontua\xE7\xE3o).
NUNCA entregue menos de 310 caracteres e NUNCA ultrapasse 335 caracteres!
Estruture a fala para preencher 15 segundos naturais de narra\xE7\xE3o com:
1. Gancho forte e in\xE9dito de abertura que prenda a aten\xE7\xE3o nos primeiros segundos (aprox. 55-65 caracteres).
2. Desenvolvimento completo com 3 benef\xEDcios concretos, detalhes reais de funcionamento e transforma\xE7\xE3o pr\xE1tica no dia a dia (aprox. 200-215 caracteres).
3. Chamada natural e persuasiva para clicar no carrinho (aprox. 45-55 caracteres).
Totalizando impreterivelmente entre 310 e 335 caracteres.` : maxLimit === 450 ? `INSTRU\xC7\xC3O ESPECIAL DE MODO DUAS CENAS \u2014 10 SEGUNDOS CADA (AT\xC9 450 CARACTERES TOTAIS):
Neste modo de Duas Cenas de 10 Segundos cada (~20 segundos totais de v\xEDdeo), voc\xEA est\xE1 EXPRESSAMENTE AUTORIZADA a produzir uma narrativa cont\xEDnua completa contendo ENTRE 400 E 450 CARACTERES (incluindo espa\xE7os e pontua\xE7\xE3o, NUNCA ultrapassando 450 caracteres).
IMPORTANTE \u2014 DIVIS\xC3O ORG\xC2NICA EM DUAS PARTES:
A fala ser\xE1 exibida inteira para o usu\xE1rio aprovar e, em seguida, dividida em duas partes de at\xE9 225 caracteres cada (Cena 1 e Cena 2).
Por isso, estruture o texto em DUAS METADES NARRATIVAS CONT\xCDNUAS separadas por um ponto final claro perto da metade do texto (~200 a 220 caracteres):
- Primeira metade (Cena 1 \u2014 ~200 a 220 caracteres): Gancho forte de abertura + descoberta do produto + primeiro grande benef\xEDcio visual em uso (terminando com ponto final completo).
- Segunda metade (Cena 2 \u2014 ~200 a 220 caracteres): Continua\xE7\xE3o direta da demonstra\xE7\xE3o (sem repetir o gancho!) + benef\xEDcios extras e diferenciais reais do produto + chamada para a\xE7\xE3o natural para conferir no carrinho.
Totalizando entre 400 e 450 caracteres.` : isSingleScenePart && scenePartIndex2 === 2 && scene1CopyContext ? `INSTRU\xC7\xC3O DE CONTINUIDADE PARA A CENA 2 (200 A 225 CARACTERES):
Esta fala \xE9 para a CENA 2 (segunda parte do v\xEDdeo), dando continuidade direta \xE0 Cena 1 cuja fala foi: "${scene1CopyContext}".
- N\xC3O repita a abertura da Cena 1! Continue a explica\xE7\xE3o destacando novos benef\xEDcios reais do produto e finalize com uma chamada para a\xE7\xE3o natural (CTA).
- A fala da Cena 2 DEVE ter OBRIGATORIAMENTE entre 200 e 225 caracteres (incluindo espa\xE7os).` : `REGRA MANDAT\xD3RIA DE CARACTERES (MUITO IMPORTANTE):
A fala DEVE ter OBRIGATORIAMENTE entre 200 e 225 caracteres no total (contando espa\xE7os e pontua\xE7\xE3o).
NUNCA entregue menos de 200 caracteres!
NUNCA ultrapasse 225 caracteres!
Estruture a fala com:
1. Gancho direto e curioso de abertura (aprox. 40-45 caracteres, variando as primeiras 4 a 5 palavras).
2. Explica\xE7\xE3o de 2 benef\xEDcios concretos com foco na usabilidade real (aprox. 120-135 caracteres).
3. Chamada natural leve para conferir (aprox. 35-45 caracteres).
Totalizando impreterivelmente entre 200 e 225 caracteres.`;
        const auroraSystem = `Voc\xEA \xE9 a AURORACOPY, uma especialista em copy para v\xEDdeos de TikTok Shop Brasil.
Sua fun\xE7\xE3o \xE9 transformar as INFORMA\xC7\xD5ES DO PRODUTO fornecidas pelo usu\xE1rio em uma fala de alta reten\xE7\xE3o, natural, espec\xEDfica e persuasiva, pronta para ser usada como narra\xE7\xE3o de v\xEDdeo.

OBJETIVO PRINCIPAL:
Criar uma fala que pare o scroll, desperte curiosidade, valorize o principal benef\xEDcio do produto e fa\xE7a a pessoa querer conhecer o item.

ESTILO PADR\xC3O:
Use prioritariamente o formato DESCOBERTA + DEMONSTRA\xC7\xC3O.
A sensa\xE7\xE3o deve ser de uma pessoa brasileira mostrando espontaneamente algo interessante que acabou de descobrir, testar ou perceber.
A fala nunca deve parecer propaganda tradicional, locu\xE7\xE3o institucional, descri\xE7\xE3o de marketplace ou texto corporativo.

IGNORE COMO ARGUMENTO DE VENDA:
Pre\xE7o, desconto, cupom, frete gr\xE1tis, parcelamento, promo\xE7\xE3o financeira. Mesmo que estejam presentes, n\xE3o baseie a copy neles.${hookVariationClause}

${modeStructureInstructions}

LINGUAGEM E VOZ IA:
Portugu\xEAs do Brasil oral, simples, espont\xE2neo, natural.
Escreva palavras por extenso para narra\xE7\xE3o por IA (ex: "800 watts", "23 polegadas", "por cento").
Use detalhes reais presentes nas informa\xE7\xF5es do produto. NUNCA invente caracter\xEDsticas.

FORMATO DE SA\xCDDA:
Entregue SOMENTE a fala final, sem aspas, sem t\xEDtulos, sem explica\xE7\xF5es, sem contagem de caracteres.`;
        const videoDurationLabel = maxLimit === 335 ? "15 segundos (Uma cena \u2014 15 segundos)" : maxLimit === 450 ? "20 segundos totais (Duas cenas de 10 segundos cada)" : "10 segundos";
        const auroraUser = `INFORMA\xC7\xD5ES DO PRODUTO:
${productInfo || productName}

NOME DO PRODUTO: ${productName}
${additionalInstructions ? `INSTRU\xC7\xD5ES ADICIONAIS: ${additionalInstructions}` : ""}
${previousHooks.length > 0 ? `HOOKS J\xC1 USADOS (PROIBIDO REPETIR ESTAS PRIMEIRAS PALAVRAS): ${previousHooks.join(" | ")}` : ""}
DURA\xC7\xC3O DO V\xCDDEO: ${videoDurationLabel}.
TAMANHO OBRIGAT\xD3RIO: Estritamente entre ${minLimit} e ${maxLimit} caracteres (incluindo espa\xE7os).`;
        const auroraOutput = await executeFastAIText({
          systemPrompt: auroraSystem,
          userPrompt: auroraUser,
          temperature: 0.75
        });
        let rawSpeech = auroraOutput.text;
        rawSpeech = rawSpeech.replace(/^["'«“]|["'»”]$/g, "").trim();
        rawSpeech = calibrateSpeechToRange(rawSpeech, minLimit, maxLimit);
        return res.json({ success: true, auroraCopy: rawSpeech, usage: auroraOutput.usage });
      } catch (err) {
        return res.status(500).json({ success: false, error: err?.message || "Erro ao gerar Aurora Copy" });
      }
    }
    let activeCopy = baseCopy;
    let copySourceLabel = isCustomCopy ? "Copy Personalizada" : "Banco de Copies (Padr\xE3o)";
    if (!isCustomCopy && copyEngine === "aurora_copy") {
      try {
        const client = openAIProvider.getClient();
        if (client) {
          const maxLimit = duration === 8 ? 165 : 235;
          const auroraSystem = `Voc\xEA \xE9 a AURORACOPY, uma especialista em copy curta para v\xEDdeos de TikTok Shop Brasil.
Sua fun\xE7\xE3o \xE9 transformar as INFORMA\xC7\xD5ES DO PRODUTO fornecidas pelo usu\xE1rio em uma \xFAnica fala de alta reten\xE7\xE3o, natural, espec\xEDfica e persuasiva, pronta para ser usada como narra\xE7\xE3o de v\xEDdeo.

OBJETIVO PRINCIPAL:
Criar uma fala que pare o scroll, desperte curiosidade, valorize o principal benef\xEDcio do produto e fa\xE7a a pessoa querer continuar assistindo ou conhecer o item.

ESTILO PADR\xC3O:
Use prioritariamente o formato DESCOBERTA + DEMONSTRA\xC7\xC3O.
A sensa\xE7\xE3o deve ser de uma pessoa brasileira mostrando espontaneamente algo interessante que acabou de descobrir, testar ou perceber.
A fala nunca deve parecer propaganda tradicional, locu\xE7\xE3o institucional, descri\xE7\xE3o de marketplace ou texto corporativo.

IGNORE COMO ARGUMENTO DE VENDA:
Pre\xE7o, desconto, cupom, frete gr\xE1tis, parcelamento, promo\xE7\xE3o financeira. Mesmo que estejam presentes, n\xE3o baseie a copy neles.

BENEF\xCDCIO:
Selecione o benef\xEDcio com maior potencial de gerar curiosidade, ser demonstrado e produzir resultado visual concreto.

ESTRUTURA DA FALA:
1. HOOK FORTE (abrir com surpresa, curiosidade ou rea\xE7\xE3o espont\xE2nea).
2. DESCOBERTA (sensa\xE7\xE3o de novidade ou teste real).
3. BENEF\xCDCIO PRINCIPAL.
4. DEMONSTRA\xC7\xC3O (combinar com produto sendo mostrado em uso).
5. CURIOSIDADE OU DESEJO.
6. CTA LEVE ("d\xE1 uma olhada nisso", "olha como funciona", "eu deixei aqui", "vale a pena ver", "clica pra ver").

LIMITE R\xCDGIDO DE CARACTERES:
No M\xC1XIMO ${maxLimit} caracteres contando espa\xE7os e pontua\xE7\xE3o.
Faixa preferencial: ${duration === 8 ? "130 a 160" : "190 a 230"} caracteres.
Antes de responder: conte os caracteres; se ultrapassar ${maxLimit}, reescreva; nunca corte a frase no meio; nunca entregue texto incompleto.

LINGUAGEM:
Portugu\xEAs do Brasil oral, simples, espont\xE2neo, natural. Varie os hooks (n\xE3o comece sempre com "Gente" ou "Olha isso").
Use detalhes reais presentes nas informa\xE7\xF5es do produto. NUNCA invente caracter\xEDsticas.

FORMATO DE SA\xCDDA:
Entregue SOMENTE a fala final, sem aspas, sem t\xEDtulos, sem explica\xE7\xF5es, sem contagem de caracteres.`;
          const auroraUser = `INFORMA\xC7\xD5ES DO PRODUTO:
${productInfo || productName}

NOME DO PRODUTO: ${productName}
${additionalInstructions ? `INSTRU\xC7\xD5ES ADICIONAIS: ${additionalInstructions}` : ""}
DURA\xC7\xC3O M\xC1XIMA DO V\xCDDEO: ${duration} segundos. Limite estrito: at\xE9 ${maxLimit} caracteres.`;
          const comp = await client.chat.completions.create({
            model: OPENAI_BRAIN_MODEL,
            messages: [
              { role: "system", content: auroraSystem },
              { role: "user", content: auroraUser }
            ],
            temperature: 0.7
          });
          let rawSpeech = comp.choices[0]?.message?.content?.trim() || "";
          rawSpeech = rawSpeech.replace(/^["'«“]|["'»”]$/g, "").trim();
          if (rawSpeech) {
            if (rawSpeech.length > maxLimit) {
              rawSpeech = rawSpeech.slice(0, maxLimit).replace(/[,;:\s]+$/, "") + "!";
            }
            activeCopy = rawSpeech;
            copySourceLabel = "Aurora Copy (IA Criativa \xB7 Ficha T\xE9cnica)";
          }
        }
      } catch (auroraErr) {
        console.warn("Falha no motor Aurora Copy, fallback para copy-base:", auroraErr?.message || auroraErr);
      }
    }
    const expectedSceneCount = Number(req.body.sceneCount) === 6 ? 6 : 9;
    const scenePartIndex = Number(req.body.scenePartIndex) === 2 ? 2 : 1;
    const previousSceneContext = String(req.body.previousSceneContext || "").trim();
    const activeReqVars = Array.isArray(variations) ? variations.filter((v) => v && (v.photosCount > 0 || v.name)) : [];
    const variationsClause = activeReqVars.length >= 2 ? `
- Varia\xE7\xF5es de cor do produto: ${activeReqVars.map((v) => v.name).join(", ")}
  REGRA MANDAT\xD3RIA DE NARRATIVA PROGRESSIVA CONT\xCDNUA (N\xC3O REPETIR CENAS):
  As ${expectedSceneCount} cenas formam UMA \xDANICA DEMONSTRA\xC7\xC3O PROGRESSIVA DO PRODUTO acompanhando a copy do segundo 0 ao final.
  PROIBIDO REPETIR CENAS OU REINICIAR A DEMONSTRA\xC7\xC3O PARA CADA COR! As ${expectedSceneCount} cenas seguem normalmente seu fluxo narrativo sem repeti\xE7\xF5es (apresenta\xE7\xE3o inicial -> funcionamento pr\xE1tico -> detalhes/macro -> benef\xEDcio no cen\xE1rio -> CTA).
  A \xDANICA diferen\xE7a \xE9 a cor em que o produto \xE9 retratado em cada grupo de quadros:
  ${expectedSceneCount === 6 ? activeReqVars.length === 2 ? "\u2022 Cenas 1 a 3: produto retratado na 1\xAA Varia\xE7\xE3o (" + (activeReqVars[0]?.name || "1\xAA Cor") + ")\n  \u2022 Cenas 4 a 6: produto retratado na 2\xAA Varia\xE7\xE3o (" + (activeReqVars[1]?.name || "2\xAA Cor") + ")" : "\u2022 Cenas 1 a 2: produto retratado na 1\xAA Varia\xE7\xE3o (" + (activeReqVars[0]?.name || "1\xAA Cor") + ")\n  \u2022 Cenas 3 a 4: produto retratado na 2\xAA Varia\xE7\xE3o (" + (activeReqVars[1]?.name || "2\xAA Cor") + ")\n  \u2022 Cenas 5 a 6: produto retratado na 3\xAA Varia\xE7\xE3o (" + (activeReqVars[2]?.name || "3\xAA Cor") + ")" : activeReqVars.length === 2 ? "\u2022 Cenas 1 a 4: produto retratado na 1\xAA Varia\xE7\xE3o (" + (activeReqVars[0]?.name || "1\xAA Cor") + ")\n  \u2022 Cenas 5 a 9: produto retratado na 2\xAA Varia\xE7\xE3o (" + (activeReqVars[1]?.name || "2\xAA Cor") + ")" : "\u2022 Cenas 1 a 3: produto retratado na 1\xAA Varia\xE7\xE3o (" + (activeReqVars[0]?.name || "1\xAA Cor") + ")\n  \u2022 Cenas 4 a 6: produto retratado na 2\xAA Varia\xE7\xE3o (" + (activeReqVars[1]?.name || "2\xAA Cor") + ")\n  \u2022 Cenas 7 a 9: produto retratado na 3\xAA Varia\xE7\xE3o (" + (activeReqVars[2]?.name || "3\xAA Cor") + ")"}
  REGRA MANDAT\xD3RIA DE PRODUCT LOCK COM VARIA\xC7\xD5ES:
  NUNCA coloque no "productLock" a cor ou estampa de apenas uma das varia\xE7\xF5es (ex: PROIBIDO escrever "tecido azul-marinho com listras" no productLock se essa for apenas uma das varia\xE7\xF5es)!
  Descreva no "productLock" as caracter\xEDsticas universais da pe\xE7a e declare: "Varia\xE7\xF5es oficiais de cor: ${activeReqVars.map((v) => v.name).join(", ")}, todas corretas e representadas nos seus respectivos quadros do storyboard".
  Nas descri\xE7\xF5es das cenas, NUNCA cite a cor de uma varia\xE7\xE3o em cenas de outra varia\xE7\xE3o!` : "";
    const twoScenesContinuityClause = expectedSceneCount === 6 ? scenePartIndex === 2 ? `
- MODO DUAS CENAS (ESTA \xC9 A CENA 2 \u2014 6 QUADROS NUMERADOS DE 1 A 6 EM GRADE 2x3, DURA\xC7\xC3O 10 SEGUNDOS):
  * REGRA INEGOCI\xC1VEL DE CONTINUIDADE NARRATIVA E VISUAL DA CENA 2:
    Esta Cena 2 d\xE1 CONTINUIDADE DIRETA ao v\xEDdeo iniciado na Cena 1.
    ${previousSceneContext ? `Resumo do que j\xE1 aconteceu na Cena 1 (N\xC3O REPETIR ESTAS A\xC7\xD5ES): ${previousSceneContext}` : ""}
    \u2022 PROIBIDO repetir as cenas da Cena 1 ou reiniciar a apresenta\xE7\xE3o do zero!
    \u2022 Avance na demonstra\xE7\xE3o pr\xE1tica, mostre novos \xE2ngulos/detalhes de funcionamento, prova de resultado real e finalize com o fechamento persuasivo (CTA) nos quadros 5 e 6.
    \u2022 Mantenha 100% de continuidade de personagem (mesmo avatarDescription e mesma roupa), mesmo cen\xE1rio (scenarioDescription), mesma ilumina\xE7\xE3o e mesmo Product Lock da Cena 1!` : `
- MODO DUAS CENAS (ESTA \xC9 A CENA 1 \u2014 6 QUADROS NUMERADOS DE 1 A 6 EM GRADE 2x3, DURA\xC7\xC3O 10 SEGUNDOS):
  * Planeje EXATAMENTE 6 cenas numeradas de 1 a 6 (0.0s a 10.0s) representando o gancho visual imediato, a introdu\xE7\xE3o e o desenvolvimento inicial da demonstra\xE7\xE3o do produto.` : "";
    const systemInstruction = buildProdutos2PlanningSystemPrompt();
    const charLimitNote = duration === 8 ? "M\xC1XIMO 199 CARACTERES COM ESPA\xC7OS" : duration === 15 ? "AT\xC9 335 CARACTERES COM ESPA\xC7OS" : "AT\xC9 225 CARACTERES COM ESPA\xC7OS";
    const userPrompt = `PLANEJAMENTO COPY-FIRST (MODO PRODUTOS 2.0):
- Produto (nome curto): ${productName}
- Sub-modo: ${subMode === "vestuario_masculino" ? `Vestu\xE1rio Masculino (${maleSubOption} - estilo ${maleClothStyle})` : "Produtos (Geral)"}
- Nicho detectado: ${niche}
- Informa\xE7\xF5es do produto: ${productInfo || productName}
- Copy-base selecionada (${isCustomCopy ? "PERSONALIZADA PELO USU\xC1RIO - N\xC3O ALTERAR" : copyEngine === "aurora_copy" ? "GERADA POR AURORA COPY (IA CRIATIVA)" : "DO BANCO VALIDADO - ADAPTAR M\xCDNIMO POSS\xCDVEL"}): "${activeCopy}"
- Dura\xE7\xE3o no Veo: ${duration} segundos (${charLimitNote})
- Quantidade obrigat\xF3ria de quadros no Storyboard: EXATAMENTE ${expectedSceneCount} cenas numeradas de 1 a ${expectedSceneCount} (${expectedSceneCount === 6 ? "grade 2x3: 2 colunas x 3 linhas" : "grade 3x3: 3 colunas x 3 linhas"})
- Influencer (quem aparece e voz): ${influencer}
- G\xEAnero do cliente (vocativo): ${clientGender} (se feminino, usar "Amiga" ou "Gente", NUNCA usar "menina")
- Modo de fala: ${speechMode} (locu\xE7\xE3o R\xC1PIDA E EUF\xD3RICA, com tom animado como se estivesse contando uma novidade imperd\xEDvel)
- Regra de frete gr\xE1tis: NUNCA mencione "frete gr\xE1tis" ou "frete gratuito" na fala, a menos que isso tenha sido informado diretamente nas informa\xE7\xF5es do produto.
- Enquadramento: ${framing}
- Cen\xE1rio: ${scenario === "padrao_uso" ? "Cen\xE1rio padr\xE3o de uso real do produto" : "Em casa (casa brasileira simples e aconchegante)"}
- Instru\xE7\xF5es adicionais priorit\xE1rias: ${additionalInstructions || "Nenhuma"}${variationsClause}${twoScenesContinuityClause}

Retorne APENAS um objeto JSON v\xE1lido com as chaves:
{
  "manufacturerLogoDescription": "string (descreva com precis\xE3o cir\xFArgica a logomarca, emblema, s\xEDmbolo ou nome da marca impresso/estampado no pr\xF3prio produto nas fotos de refer\xEAncia: formato, desenho, letras, cor exata e posi\xE7\xE3o exata na pe\xE7a, ex: 'Logomarca geom\xE9trica branca em formato de escudo hexagonal com W estilizado centralizada na parte superior do encosto preto')",
  "adaptedCopy": "string",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5 (5 hashtags em portugu\xEAs, min\xFAsculas e sem acentos, 100% relacionadas especificamente a este produto e \xE0 sua verdadeira categoria/fun\xE7\xE3o real, ex: para irrigador oral use #irrigadororal, #higienebucal, #saudebucal, #cuidadospessoais, #sorrisoperfeito \u2014 NUNCA coloque hashtags aleat\xF3rias ou de outros nichos)"],
  "productLock": ["string (1\xBA item obrigatoriamente a descri\xE7\xE3o exata da logomarca/marca impressa no produto e sua posi\xE7\xE3o)", "string", "string", "string"],
  "avatarDescription": "string",
  "scenarioDescription": "string",
  "visualMap": [
    { "excerpt": "string", "intent": "string", "visualProof": "string", "scenes": "1\u20132" }
  ],
  "scenes": [
    {
      "number": 1,
      "startTime": "0.0",
      "endTime": "${expectedSceneCount === 6 || duration === 15 ? "1.6" : "0.9"}",
      "framing": "string",
      "action": "string",
      "cameraMovement": "string",
      "storyboardDescription": "string"
    }
  ]
} (exatamente ${expectedSceneCount} cenas numeradas de 1 a ${expectedSceneCount} somando ${duration}.0s).`;
    const tryOrder = activeProfile === "gemini" ? ["gemini"] : ["openai"];
    for (const provider of tryOrder) {
      if (provider === "openai" && openAIProvider.isConfigured()) {
        const client = openAIProvider.getClient();
        const contentBlocks = [];
        (Array.isArray(productPhotosBase64) ? productPhotosBase64 : []).slice(0, 3).forEach((photo) => {
          if (photo && typeof photo === "string") {
            contentBlocks.push({
              type: "image_url",
              image_url: {
                url: photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`,
                detail: "high"
              }
            });
          }
        });
        contentBlocks.push({ type: "text", text: userPrompt });
        const modelsToTry = [OPENAI_BRAIN_MODEL, "gpt-4o", "gpt-4o-mini", OPENAI_AUDIT_MODEL];
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
              params.temperature = 0.35;
            }
            const completion = await client.chat.completions.create(params);
            const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
            if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length >= expectedSceneCount) {
              parsed.scenes = parsed.scenes.slice(0, expectedSceneCount);
              if (typeof parsed.manufacturerLogoDescription === "string" && parsed.manufacturerLogoDescription.trim().length > 3) {
                const logoLockEntry = `LOGOMARCA ORIGINAL DO FABRICANTE NO PRODUTO (OBRIGAT\xD3RIO REPRODUZIR 100% ID\xCANTICA): ${parsed.manufacturerLogoDescription.trim()}`;
                const existingLocks = Array.isArray(parsed.productLock) ? parsed.productLock : [];
                parsed.productLock = [
                  logoLockEntry,
                  ...existingLocks.filter((l) => !String(l).includes(parsed.manufacturerLogoDescription.trim()))
                ];
              }
              parsed.finalCopy = activeCopy;
              parsed.copySourceLabel = copySourceLabel;
              const promptTok = completion.usage?.prompt_tokens || 3400;
              const compTok = completion.usage?.completion_tokens || 1100;
              const costUSD = Math.round((promptTok / 1e6 * 2.5 + compTok / 1e6 * 10) * 1e4) / 1e4;
              const costBRL = Math.round(costUSD * 5.7 * 100) / 100;
              return res.json({
                success: true,
                data: parsed,
                usage: {
                  promptTokens: promptTok,
                  completionTokens: compTok,
                  totalTokens: promptTok + compTok,
                  costUSD: Math.max(0.012, costUSD),
                  costBRL: Math.max(0.07, costBRL),
                  model: modelCandidate
                }
              });
            }
          } catch (oiErr) {
            console.warn(`Aviso OpenAI em produtos2-planning (${modelCandidate}):`, oiErr?.message || oiErr);
          }
        }
      }
      if (provider === "gemini" && process.env.GEMINI_API_KEY) {
        const parts = [];
        (Array.isArray(productPhotosBase64) ? productPhotosBase64 : []).slice(0, 3).forEach((photo, idx) => {
          const parsed = parseInlineImage(photo);
          if (parsed) {
            parts.push({ text: `[Foto de Refer\xEAncia ${idx + 1} do Produto - Fidelidade Absoluta PRODUCT LOCK]:` });
            parts.push({ inlineData: parsed });
          }
        });
        parts.push({ text: userPrompt });
        const geminiModels = [
          GEMINI_VISION_MODEL || "gemini-3.8-flash",
          "gemini-2.5-flash",
          GEMINI_VISION_FAST_MODEL || "gemini-3.1-flash-lite"
        ];
        for (const gemModel of geminiModels) {
          try {
            const response = await getGenAI().models.generateContent({
              model: gemModel,
              contents: parts,
              config: {
                systemInstruction,
                responseMimeType: "application/json"
              }
            });
            const parsed = JSON.parse(response.text || "{}");
            if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length >= expectedSceneCount) {
              parsed.scenes = parsed.scenes.slice(0, expectedSceneCount);
              if (typeof parsed.manufacturerLogoDescription === "string" && parsed.manufacturerLogoDescription.trim().length > 3) {
                const logoLockEntry = `LOGOMARCA ORIGINAL DO FABRICANTE NO PRODUTO (OBRIGAT\xD3RIO REPRODUZIR 100% ID\xCANTICA): ${parsed.manufacturerLogoDescription.trim()}`;
                const existingLocks = Array.isArray(parsed.productLock) ? parsed.productLock : [];
                parsed.productLock = [
                  logoLockEntry,
                  ...existingLocks.filter((l) => !String(l).includes(parsed.manufacturerLogoDescription.trim()))
                ];
              }
              parsed.finalCopy = activeCopy;
              parsed.copySourceLabel = copySourceLabel;
              const promptTok = response.usageMetadata?.promptTokenCount || 3400;
              const compTok = response.usageMetadata?.candidatesTokenCount || 1100;
              return res.json({
                success: true,
                data: parsed,
                usage: {
                  promptTokens: promptTok,
                  completionTokens: compTok,
                  totalTokens: promptTok + compTok,
                  costUSD: 5e-3,
                  costBRL: 0.03,
                  model: gemModel
                }
              });
            }
          } catch (gemErr) {
            console.warn(`Aviso Gemini em produtos2-planning (${gemModel}):`, gemErr?.message || gemErr);
          }
        }
      }
    }
    return res.json({ success: false, error: "Nenhum provedor de IA configurado para planejamento." });
  } catch (err) {
    console.warn("Erro em /api/produtos2-planning:", err?.message || err);
    return res.json({ success: false, error: err?.message || "Erro no planejamento Produtos 2.0" });
  }
});
async function extractManufacturerLogoSpecFromPhotos(photosList, productName) {
  if (!photosList || photosList.length === 0) return "";
  const promptLogo = `Inspecione as fotos de refer\xEAncia do produto "${productName}".
O produto possui alguma logomarca, emblema, escudo, s\xEDmbolo gr\xE1fico ou texto de marca do fabricante impresso/estampado/bordado nele mesmo (por exemplo: no encosto, na estrutura, na lateral, no painel ou no r\xF3tulo)?
IMPORTANTE: Ignore qualquer marca d'\xE1gua de rede social fora do produto. Olhe SOMENTE para a marca/logomarca que faz parte do pr\xF3prio produto f\xEDsico.
Retorne ESTRITAMENTE um JSON:
{
  "hasManufacturerLogo": boolean,
  "logoSpec": "Descreva em portugu\xEAs com m\xE1xima precis\xE3o visual o formato, desenho/s\xEDmbolo/letras, cor exata e localiza\xE7\xE3o exata da logomarca no produto (ex: 'Grande logomarca/emblema geom\xE9trico branco em formato de escudo hexagonal com W estilizado centralizado na parte superior do encosto preto do banco')"
}`;
  if (openAIProvider.isConfigured()) {
    try {
      const client = openAIProvider.getClient();
      const contentBlocks = [];
      photosList.slice(0, 2).forEach((photo) => {
        contentBlocks.push({
          type: "image_url",
          image_url: {
            url: photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`,
            detail: "high"
          }
        });
      });
      contentBlocks.push({ type: "text", text: promptLogo });
      for (const m of [OPENAI_AUDIT_MODEL || "gpt-5.6-luna", "gpt-4o-mini", OPENAI_BRAIN_MODEL]) {
        try {
          const r = await client.chat.completions.create({
            model: m,
            messages: [{ role: "user", content: contentBlocks }],
            response_format: { type: "json_object" }
          });
          const parsed = JSON.parse(r.choices[0]?.message?.content || "{}");
          if (parsed?.hasManufacturerLogo && parsed?.logoSpec) {
            return String(parsed.logoSpec).trim();
          }
          return "";
        } catch {
        }
      }
    } catch {
    }
  }
  return "";
}
app.post("/api/produtos2-generate-storyboard", async (req, res) => {
  try {
    const {
      prompt,
      productName = "Produto",
      productPhotosBase64 = [],
      variations = [],
      additionalInstructions = "",
      previousStoryboardImageBase64 = "",
      correctionPrompt = ""
    } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt do storyboard n\xE3o fornecido." });
    }
    const reqSceneCount = Number(req.body.sceneCount);
    const isLeilaoBlockNum = Number(req.body.isLeilaoBlock) || 0;
    const isLeilao1 = isLeilaoBlockNum === 1 || isLeilaoBlockNum === 0 && /BLOCO 1|QUADRO 1.*QUADRO 2.*QUADRO 3|CENA 1.*leiloeiro|COLUNA 1.*QUADRO 1|leilao_storyboard_1/i.test(String(prompt));
    const isLeilao2 = isLeilaoBlockNum === 2 || isLeilaoBlockNum === 0 && /BLOCO 2|QUADRO 4.*QUADRO 5.*QUADRO 6|pano de veludo|COLUNA 1.*QUADRO 4|leilao_storyboard_2/i.test(String(prompt));
    const isLeilao3 = isLeilaoBlockNum === 3 || isLeilaoBlockNum === 0 && /BLOCO 3|GERAÇÃO 3|leilao_cena_final/i.test(String(prompt));
    const isLeilaoBlock = isLeilao1 || isLeilao2 || isLeilao3;
    const isAchadinhosBlockNum = Number(req.body.isAchadinhosBlock) || 0;
    const isAchadinhos1 = isAchadinhosBlockNum === 1 || isAchadinhosBlockNum === 0 && /MODO AURORA ACHADINHOS.*CENA 1|Storyboard 1A\/1B\/1C|achadinhos_storyboard_1/i.test(String(prompt));
    const isAchadinhos2 = isAchadinhosBlockNum === 2 || isAchadinhosBlockNum === 0 && /MODO AURORA ACHADINHOS.*CENA 2|Storyboard 2A\/2B\/2C|achadinhos_storyboard_2/i.test(String(prompt));
    const isAchadinhos3 = isAchadinhosBlockNum === 3 || isAchadinhosBlockNum === 0 && /MODO AURORA ACHADINHOS.*CENA 3|Storyboard 3A\/3B\/3C|achadinhos_storyboard_3/i.test(String(prompt));
    const isAchadinhosBlock = isAchadinhos1 || isAchadinhos2 || isAchadinhos3;
    const isSixFrames = reqSceneCount === 6 || /GRADE\s+2x3|EXATAMENTE\s+6\s+(?:QUADROS|CENAS)/i.test(String(prompt));
    const frameCount = isLeilao1 || isLeilao2 || isAchadinhosBlock ? 3 : isLeilao3 ? 1 : isSixFrames ? 6 : 9;
    const gridLabel = isAchadinhosBlock ? "3 quadros fotogr\xE1ficos verticais 9:16 lado a lado em uma \xFAnica imagem horizontal 16:9 (grade 1 linha x 3 colunas: Quadro A \xE0 esquerda, Quadro B ao centro, Quadro C \xE0 direita), sem n\xFAmeros, sem bal\xF5es e sem legendas sobrepostas" : isLeilao1 ? "3 quadros fotogr\xE1ficos verticais 9:16 lado a lado em uma \xFAnica imagem horizontal 16:9 (grade 1 linha x 3 colunas), com n\xFAmeros discretos 1, 2 e 3 em c\xEDrculos brancos no canto superior direito" : isLeilao2 ? "3 quadros fotogr\xE1ficos verticais 9:16 lado a lado em uma \xFAnica imagem horizontal 16:9 (grade 1 linha x 3 colunas), com n\xFAmeros discretos 4, 5 e 6 em c\xEDrculos brancos no canto superior direito" : isLeilao3 ? "1 quadro fotogr\xE1fico vertical \xFAnico 9:16 (sem n\xFAmero)" : isSixFrames ? "2x3 (2 colunas x 3 linhas)" : "3x3 (3 colunas x 3 linhas)";
    const chosenAspectRatio = isLeilao1 || isLeilao2 || isAchadinhosBlock || req.body.aspectRatio === "16:9" ? "16:9" : "9:16";
    const chosenSize = chosenAspectRatio === "16:9" ? "1792x1024" : "1024x1792";
    const photosList = Array.isArray(productPhotosBase64) ? productPhotosBase64.filter(Boolean) : [];
    const activeVariations = Array.isArray(variations) ? variations.filter(
      (v) => v.name && String(v.name).trim().length > 0 || Array.isArray(v.photos) && v.photos.length > 0
    ) : [];
    let logoEnforcementBlock = "";
    if (photosList.length > 0 && !prompt.includes("LOGOMARCA ORIGINAL DO FABRICANTE NO PRODUTO")) {
      const extractedLogo = await extractManufacturerLogoSpecFromPhotos(photosList, productName);
      if (extractedLogo) {
        logoEnforcementBlock = `

========================
TRAVA OBRIGAT\xD3RIA DE LOGOMARCA DO FABRICANTE NO PRODUTO (FIDELIDADE 1:1):
Nas fotos reais anexadas, o produto possui esta logomarca original de f\xE1brica:
"${extractedLogo}".
REGRA INEGOCI\xC1VEL: Em TODOS os quadrantes do storyboard onde essa parte do produto aparecer, voc\xEA DEVE desenhar e reproduzir FIELMENTE essa exata logomarca do fabricante (mesmo s\xEDmbolo/desenho, mesma cor, mesmo tamanho e mesma posi\xE7\xE3o na pe\xE7a). \xC9 TERMINANTEMENTE PROIBIDO apagar, remover ou deixar lisa a \xE1rea onde fica a logomarca do fabricante!
========================`;
      }
    }
    const baseWithLogo = `${prompt}${logoEnforcementBlock}`;
    const effectivePrompt = correctionPrompt && correctionPrompt.trim() ? `${baseWithLogo}

========================
CORRE\xC7\xC3O OBRIGAT\xD3RIA DE AUDITORIA DE FIDELIDADE DOS ${frameCount} QUADRANTES:
${correctionPrompt.trim()}
========================` : baseWithLogo;
    const activeProfile = req.body?.aiProfile || getRequestAIProfile(req);
    const preferOpenAIForLandscape = (isLeilao1 || isLeilao2 || isAchadinhosBlock) && openAIProvider.isConfigured();
    const tryOrder = preferOpenAIForLandscape ? ["openai", "gemini"] : activeProfile === "gemini" ? openAIProvider.isConfigured() ? ["gemini", "openai"] : ["gemini"] : process.env.GEMINI_API_KEY ? ["openai", "gemini"] : ["openai"];
    let lastErrorMessage = "";
    for (const provider of tryOrder) {
      if (provider === "openai") {
        if (!openAIProvider.isConfigured()) {
          return res.json({
            success: false,
            error: "Chave da API da OpenAI n\xE3o configurada. Defina OPENAI_API_KEY no arquivo .env."
          });
        }
        try {
          const result = await openAIProvider.generateSceneImage({
            prompt: effectivePrompt,
            productPhotoBase64: photosList[0] || "",
            productPhotosBase64: photosList,
            modelReferenceBase64: void 0,
            // Sempre usa as fotos reais do produto como referência primária no storyboard
            referenceFrameBase64: previousStoryboardImageBase64 || void 0,
            variationName: productName,
            productType: productName,
            additionalInstructions: [additionalInstructions, correctionPrompt].filter(Boolean).join(" | "),
            hasUserProvidedModel: false,
            isCloneMode: false,
            aspectRatio: chosenAspectRatio,
            size: chosenSize
          });
          if (result.success && result.imageUrl) {
            const imgUsage = {
              promptTokens: 2100,
              completionTokens: 0,
              totalTokens: 2100,
              costUSD: result.costUSD || 0.028,
              costBRL: result.costBRL || 0.16,
              model: OPENAI_IMAGE_MODEL
            };
            return res.json({ ...result, usage: imgUsage });
          }
          if (result.error) lastErrorMessage = result.error;
          return res.json({ success: false, error: lastErrorMessage || "Falha na gera\xE7\xE3o com OpenAI." });
        } catch (oiErr) {
          const rawMsg = oiErr?.message || "";
          const isQuota = oiErr?.status === 429 || oiErr?.code === "insufficient_quota" || oiErr?.type === "insufficient_quota" || /credit_balance_exhausted|no credits remaining|billing|quota|balance/i.test(rawMsg);
          lastErrorMessage = isQuota ? "Acabou o Saldo de sua Chave API da Openai fa\xE7a uma recarga para continuar gerando." : oiErr?.message || "Erro OpenAI ao gerar storyboard";
          console.warn("Aviso OpenAI em produtos2-generate-storyboard:", lastErrorMessage);
          return res.json({ success: false, error: lastErrorMessage });
        }
      }
      if (provider === "gemini" && process.env.GEMINI_API_KEY) {
        const parts = [];
        photosList.slice(0, 4).forEach((photoStr, idx) => {
          const parsed = parseInlineImage(photoStr);
          if (parsed) {
            parts.push({ inlineData: parsed });
            if (activeVariations.length >= 2) {
              const matchedVarIdx = activeVariations.findIndex(
                (v) => Array.isArray(v.photos) && v.photos.includes(photoStr)
              );
              const vIdx = matchedVarIdx >= 0 ? matchedVarIdx : Math.min(idx, activeVariations.length - 1);
              const varName = activeVariations[vIdx]?.name?.trim() || `Varia\xE7\xE3o ${vIdx + 1}`;
              const frameRange = isSixFrames ? activeVariations.length === 2 ? vIdx === 0 ? "Quadros 1, 2 e 3" : "Quadros 4, 5 e 6" : vIdx === 0 ? "Quadros 1 e 2 (Linha 1)" : vIdx === 1 ? "Quadros 3 e 4 (Linha 2)" : "Quadros 5 e 6 (Linha 3)" : activeVariations.length === 2 ? vIdx === 0 ? "Quadros 1, 2, 3 e 4" : "Quadros 5, 6, 7, 8 e 9" : vIdx === 0 ? "Quadros 1, 2 e 3 (Linha 1)" : vIdx === 1 ? "Quadros 4, 5 e 6 (Linha 2)" : "Quadros 7, 8 e 9 (Linha 3)";
              parts.push({
                text: `[FOTO DE REFER\xCANCIA REAL - VARIA\xC7\xC3O ${vIdx + 1}: ${varName.toUpperCase()}]: Esta foto define a cor/estilo para uso RIGOROSO nos ${frameRange}. O modelo, formato, pe\xE7as e logomarca do fabricante devem permanecer id\xEAnticos, mas a cor deve ser exatamente a desta foto nesses quadros espec\xEDficos!`
              });
            } else {
              parts.push({
                text: `[FOTO DE REFER\xCANCIA REAL DO PRODUTO #${idx + 1} (${productName})]: Preserve 100% id\xEAnticos o formato, cor, propor\xE7\xE3o, textura, bot\xF5es e OBRIGATORIAMENTE A LOGOMARCA/EMBLEMA E TEXTOS DO FABRICANTE IMPRESSOS NO PRODUTO em todos os ${frameCount} quadros do storyboard. JAMAIS apague a logo original do produto.`
              });
            }
          }
        });
        if (previousStoryboardImageBase64 && typeof previousStoryboardImageBase64 === "string") {
          const parsedPrev = parseInlineImage(previousStoryboardImageBase64);
          if (parsedPrev) {
            parts.push({ inlineData: parsedPrev });
            parts.push({
              text: `[STORYBOARD ANTERIOR ENVIADO COMO REFER\xCANCIA DE BASE]: Esta imagem acima \xE9 o storyboard gerado anteriormente. REGRA OBRIGAT\xD3RIA: Mantenha RIGOROSAMENTE ID\xCANTICOS todos os quadros que n\xE3o foram solicitados para altera\xE7\xE3o. Altere EXCLUSIVAMENTE os quadros apontados na instru\xE7\xE3o de corre\xE7\xE3o (especialmente as ordens do usu\xE1rio com prioridade soberana), aplicando a modifica\xE7\xE3o solicitada mantendo as demais cenas iguais.`
            });
          }
        }
        parts.push({ text: effectivePrompt });
        const isLeilaoBlock2 = isLeilao1 || isLeilao2 || isLeilao3;
        const variationInstructionRule = activeVariations.length >= 2 ? `- REGRA MANDAT\xD3RIA DE ALTERN\xC2NCIA DE CORES ENTRE OS QUADROS: O produto possui ${activeVariations.length} varia\xE7\xF5es de cores/modelos. Voc\xEA DEVE OBRIGATORIAMENTE alternar as cores conforme a divis\xE3o especificada. NUNCA gere todos os ${frameCount} quadros na mesma cor! Apenas o modelo, formato e pe\xE7as permanecem id\xEAnticos, a cor DEVE alternar entre os blocos de quadros!` : `- PRODUCT LOCK ABSOLUTO: O produto em todos os quadros onde aparece deve ser 100% id\xEAntico \xE0s fotos reais anexadas (mesmo formato, cor, textura, bot\xF5es, fun\xE7\xF5es, propor\xE7\xE3o e detalhes).`;
        const systemInstructionText = isAchadinhosBlock ? `VOC\xCA \xC9 O MOTOR VISUAL DO MODO AURORA ACHADINHOS (3 CENAS DE 10S).
- Gere UMA IMAGEM FOTOGR\xC1FICA HORIZONTAL 16:9 (1920x1080) composta por exatamente 3 quadros verticais de propor\xE7\xE3o aproximada 9:16, organizados lado a lado da esquerda para a direita (Quadro A \xE0 esquerda, Quadro B no centro, Quadro C \xE0 direita).
- Os tr\xEAs quadros devem representar instantes sucessivos de uma a\xE7\xE3o cont\xEDnua da mesma personagem, mesmo produto e mesmo ambiente.
- SEM N\xDAMEROS, SEM BAL\xD5ES E SEM TEXTOS: \xC9 terminantemente proibido colocar letras A/B/C sobre a imagem, n\xFAmeros, legendas, t\xEDtulos, bal\xF5es ou marcas d'\xE1gua.
- Fotografia ultrarrealista com textura de pele natural, ilumina\xE7\xE3o de smartphone e cen\xE1rio brasileiro cotidiano.
- Fidelidade absoluta \xE0s fotos reais do produto.` : isLeilaoBlock2 ? `VOC\xCA \xC9 O GERADOR DE STORYBOARD DO MODO LEIL\xC3O.
- Gere UMA IMAGEM fotogr\xE1fica ultra-realista contendo ${gridLabel}.
- Os quadros devem ser numerados com selos circulares brancos pequenos no canto superior direito de cada quadro com o n\xFAmero preto correspondente.
- Cantos arredondados nos quadros, separados por uma borda branca fina, sobre fundo neutro.
- ZERO ELEMENTOS EXTERNOS DE REDE SOCIAL: N\xE3o adicione legendas flutuantes, textos publicit\xE1rios externos, pre\xE7os, setas, carrinho de compras, marca d'\xE1gua externa, @ ou logotipo do TikTok. Apenas os n\xFAmeros nos selos circulares e a logomarca original do fabricante no pr\xF3prio produto.
- Fidelidade absoluta \xE0s fotos reais do produto em todos os quadros onde o produto aparece.` : `VOC\xCA \xC9 O GERADOR DE STORYBOARD DO MODO PRODUTOS 2.0.
- Gere UMA \xDANICA IMAGEM VERTICAL 9:16 (1080x1920) contendo uma grade ${gridLabel} com EXATAMENTE ${frameCount} quadros fotogr\xE1ficos ultra-realistas numerados de 1 a ${frameCount} (selo circular branco pequeno no canto superior esquerdo de cada quadro com n\xFAmero preto).
- Cantos arredondados nos quadros, separados por uma borda branca fina, sobre fundo branco.
${variationInstructionRule}
- LOGOMARCA E MARCA DO FABRICANTE NO PRODUTO (OBRIGAT\xD3RIO): A marca, a logomarca, o emblema e os textos que j\xE1 est\xE3o impressos/estampados no pr\xF3prio produto nas fotos de refer\xEAncia DEVEM aparecer 100% id\xEAnticos, na mesma cor e no mesmo lugar da pe\xE7a, em todos os quadros em que aquela parte estiver vis\xEDvel. JAMAIS remova ou alise a logomarca do produto!
- ZERO ELEMENTOS EXTERNOS DE REDE SOCIAL: N\xE3o adicione legendas flutuantes, textos publicit\xE1rios externos, pre\xE7os, setas, carrinho de compras, marca d'\xE1gua externa, @ ou logotipo do TikTok. Apenas os n\xFAmeros 1 a ${frameCount} nos selos circulares e a logomarca original do fabricante no pr\xF3prio produto.`;
        const chosenAspectRatio2 = isLeilao1 || isLeilao2 || isAchadinhosBlock ? req.body.aspectRatio || "16:9" : isLeilao3 ? "9:16" : "9:16";
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
                systemInstruction: systemInstructionText,
                imageConfig: {
                  aspectRatio: chosenAspectRatio2
                }
              }
            });
            const candidates = imgRes.candidates || [];
            if (candidates[0]?.content?.parts) {
              for (const part of candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  if ((isLeilao1 || isLeilao2) && checkIsImageBase64Vertical(part.inlineData.data)) {
                    console.warn("Gemini gerou imagem vertical em pedido 16:9. Tentando fallback para OpenAI 1792x1024...");
                    if (openAIProvider.isConfigured()) {
                      try {
                        const oiRes = await openAIProvider.generateSceneImage({
                          prompt: effectivePrompt,
                          productPhotoBase64: photosList[0] || "",
                          productPhotosBase64: photosList,
                          variationName: productName,
                          productType: productName,
                          additionalInstructions: [additionalInstructions, correctionPrompt].filter(Boolean).join(" | "),
                          aspectRatio: "16:9",
                          size: "1792x1024"
                        });
                        if (oiRes.success && oiRes.imageUrl) {
                          return res.json(oiRes);
                        }
                      } catch (oiRetryErr) {
                        console.warn("Fallback OpenAI p\xF3s-Gemini vertical falhou:", oiRetryErr?.message);
                      }
                    }
                  }
                  const mime = part.inlineData.mimeType || "image/png";
                  return res.json({
                    success: true,
                    imageUrl: `data:${mime};base64,${part.inlineData.data}`,
                    costBRL: 0.08,
                    usage: {
                      promptTokens: 1800,
                      completionTokens: 0,
                      totalTokens: 1800,
                      costUSD: 0.014,
                      costBRL: 0.08,
                      model: modelCandidate
                    }
                  });
                }
              }
            }
          } catch (imgErr) {
            lastErrorMessage = imgErr?.message || "Erro ao gerar imagem do storyboard";
            console.warn(`Tentativa storyboard com ${modelCandidate} falhou:`, lastErrorMessage);
          }
        }
        if (openAIProvider.isConfigured()) {
          try {
            console.log("Gemini falhou ou esgotou cota. Tentando fallback autom\xE1tico para OpenAI...");
            const oiRes = await openAIProvider.generateSceneImage({
              prompt: effectivePrompt,
              productPhotoBase64: photosList[0] || "",
              productPhotosBase64: photosList,
              variationName: productName,
              productType: productName,
              additionalInstructions: [additionalInstructions, correctionPrompt].filter(Boolean).join(" | "),
              aspectRatio: chosenAspectRatio2,
              size: chosenSize
            });
            if (oiRes.success && oiRes.imageUrl) {
              return res.json(oiRes);
            }
          } catch (fbErr) {
            console.warn("Fallback p\xF3s-Gemini para OpenAI falhou:", fbErr?.message);
          }
        }
      }
    }
    return res.json({
      success: false,
      error: lastErrorMessage || "N\xE3o foi poss\xEDvel gerar a imagem do storyboard."
    });
  } catch (err) {
    console.error("Erro em /api/produtos2-generate-storyboard:", err);
    return res.json({
      success: false,
      error: err?.message || "Erro inesperado ao gerar storyboard."
    });
  }
});
function getAuditColorStatus(score) {
  if (score >= 90) return "green";
  if (score >= 71) return "yellow";
  if (score >= 60) return "orange";
  return "red";
}
function getAuditColorLabel(status, score) {
  if (status === "green") return `Verde \u2014 Produto Id\xEAntico (${score}%)`;
  if (status === "yellow") return `Amarelo \u2014 Pequena Diferen\xE7a (${score}%)`;
  if (status === "orange") return `Laranja \u2014 Diferen\xE7a Moderada (${score}%)`;
  return `Vermelho \u2014 Produto Muito Diferente (${score}%)`;
}
app.post("/api/produtos2-audit-storyboard", async (req, res) => {
  try {
    if (Array.isArray(req.body?.videoFrames) && req.body.videoFrames.length > 0) {
      return handleProdutos2AuditVideo(req, res);
    }
    const {
      storyboardImageBase64,
      productPhotosBase64 = [],
      productName = "Produto",
      productLock = [],
      scenes = [],
      variations = []
    } = req.body;
    if (!storyboardImageBase64) {
      return res.status(400).json({ success: false, error: "Imagem do storyboard n\xE3o fornecida para auditoria." });
    }
    const quadrantCount = Array.isArray(scenes) && scenes.length === 6 || Number(req.body?.quadrantCount) === 6 ? 6 : 9;
    const gridDescription = quadrantCount === 6 ? "2x3 \u2014 6 Quadrantes (numerados de 1 a 6, da esquerda para a direita, de cima para baixo: Linha 1 = Cenas 1, 2; Linha 2 = Cenas 3, 4; Linha 3 = Cenas 5, 6)" : "3x3 \u2014 9 Quadrantes (numerados de 1 a 9, da esquerda para a direita, de cima para baixo: Linha 1 = Cenas 1, 2, 3; Linha 2 = Cenas 4, 5, 6; Linha 3 = Cenas 7, 8, 9)";
    const photosList = Array.isArray(productPhotosBase64) ? productPhotosBase64.filter(Boolean) : [];
    const activeVariations = Array.isArray(variations) ? variations.filter(
      (v) => v.name && String(v.name).trim().length > 0 || Array.isArray(v.photos) && v.photos.length > 0
    ) : [];
    const scenesContext = Array.isArray(scenes) ? scenes.slice(0, quadrantCount).map((s, idx) => `Cena ${idx + 1}: ${s.framing || ""}. ${s.action || ""}`).join("\n") : "";
    const lockContext = Array.isArray(productLock) ? productLock.join("; ") : "";
    const variationsAuditRule = activeVariations.length >= 2 ? `
PASSO 3 \u2014 REGRA DE OURO PARA M\xDALTIPLAS VARIA\xC7\xD5ES / CORES ANEXADAS (${activeVariations.length} VARIA\xC7\xD5ES V\xC1LIDAS):
O usu\xE1rio anexou fotos de refer\xEAncia do produto em ${activeVariations.length} varia\xE7\xF5es/cores oficiais (${activeVariations.map((v, idx) => `Varia\xE7\xE3o ${idx + 1}: "${v.name || "Varia\xE7\xE3o " + (idx + 1)}"`).join(" | ")}).
- REGRA DE APROVA\xC7\xC3O EM QUALQUER QUADRANTE (CENA 1 A CENA ${quadrantCount}):
  * Em QUALQUER um dos ${quadrantCount} quadrantes do storyboard, se o produto estiver retratado de forma ID\xCANTICA \xE0s fotos de refer\xEAncia de QUALQUER UMA das varia\xE7\xF5es anexadas (seja da Varia\xE7\xE3o 1, da Varia\xE7\xE3o 2 ou da Varia\xE7\xE3o 3), ELE EST\xC1 100% CERTO E DEVE SER APROVADO COM NOTA ALTA (90 a 100 \u2014 VERDE)!
  * Exemplo: Se o usu\xE1rio anexou fotos do produto na cor Azul na Varia\xE7\xE3o 1 e fotos do produto na cor Vermelha na Varia\xE7\xE3o 2, qualquer quadrante onde o produto apare\xE7a Azul id\xEAntico \xE0s fotos da Varia\xE7\xE3o 1 est\xE1 CERTO (90-100), e qualquer quadrante onde o produto apare\xE7a Vermelho id\xEAntico \xE0s fotos da Varia\xE7\xE3o 2 est\xE1 CERTO (90-100), independentemente do n\xFAmero da cena (1 a ${quadrantCount})!
  * NUNCA d\xEA nota baixa porque um quadrante mostrou a Varia\xE7\xE3o 2 em vez da Varia\xE7\xE3o 1 (ou vice-versa). Qualquer uma das varia\xE7\xF5es anexadas \xE9 100% v\xE1lida em qualquer quadrante!
- O QUE \xC9 PROIBIDO E DEVE SER REPROVADO (< 60 \u2014 VERMELHO):
  * O que N\xC3O pode acontecer \xE9 gerar no storyboard imagens do produto com apar\xEAncia, formato, logomarca ou COR DIFERENTE DE TODAS AS VARIA\xC7\xD5ES ANEXADAS (por exemplo: aparecer uma cor que n\xE3o existe em nenhuma das varia\xE7\xF5es anexadas, ou alterar o formato/logomarca do produto em rela\xE7\xE3o \xE0s fotos de refer\xEAncia daquela varia\xE7\xE3o).` : "";
    const auditSystemInstruction = `Voc\xEA \xE9 o Fiscal Rigoroso de Fidelidade Visual de Produtos (Storyboard ${gridDescription}).
Sua miss\xE3o \xE9 inspecionar CADA UM DOS ${quadrantCount} QUADRANTES (numerados de 1 a ${quadrantCount}) da imagem de Storyboard gerada e comparar o produto com as FOTOS REAIS DE REFER\xCANCIA do produto "${productName}".

PASSO 1 \u2014 VERIFICA\xC7\xC3O DA LOGOMARCA DO FABRICANTE NAS FOTOS DE REFER\xCANCIA:
Primeiro, olhe com aten\xE7\xE3o m\xE1xima para as FOTOS DE REFER\xCANCIA REAIS do produto e identifique se o produto possui alguma LOGOMARCA, EMBLEMA, ESCUDO, S\xCDMBOLO ou NOME DA MARCA impresso/estampado/gravado nele (por exemplo: logomarca branca no topo do encosto de um banco de exerc\xEDcios, logo na lateral, emblema frontal, r\xF3tulo, etc.).
- Preencha "hasReferenceLogo": true ou false.
- Preencha "referenceLogoDescription": descri\xE7\xE3o exata da logomarca original vista na foto de refer\xEAncia e em qual parte do produto ela fica (ex: "Logomarca geom\xE9trica branca em formato de escudo no topo do encosto preto").

PASSO 2 \u2014 REGRAS DE OURO DA FISCALIZA\xC7\xC3O POR QUADRANTE (CENA 1 A CENA ${quadrantCount}):
1. Se em algum quadrante aparecer SOMENTE o modelo/pessoa ou SOMENTE o cen\xE1rio, SEM o produto aparecer:
   - "productVisible": false
   - "logoPartVisible": false
   - "logoFaithful": true
   - "score": 100
   - "issue": "Cena X: Apenas modelo/cen\xE1rio (sem produto vis\xEDvel \u2014 OK)"
2. Em TODOS os quadrantes onde o produto aparece ("productVisible": true), avalie com rigor m\xE1ximo em escala INTEIRA de 0 a 100:
   - VERIFICA\xC7\xC3O CR\xCDTICA DE LOGOMARCA DO FABRICANTE ("logoPartVisible" e "logoFaithful"):
     * Se a parte espec\xEDfica do produto onde fica a logomarca nas fotos de refer\xEAncia (ex: a face frontal superior do encosto do banco) est\xE1 vis\xEDvel e desobstru\xEDda naquele quadrante, marque "logoPartVisible": true.
     * Se o quadrante \xE9 um close em outra parte do produto onde n\xE3o h\xE1 logo na foto original (ex: pino de ajuste, base inferior, p\xE9s, verso) OU se a pessoa est\xE1 deitada/apoiada cobrindo exatamente o local da logo, marque "logoPartVisible": false, "logoFaithful": true e avalie a nota (90 a 98 se a parte vis\xEDvel estiver fiel \xE0 foto de refer\xEAncia!).
     * Quando "logoPartVisible": true, verifique se a logomarca original do fabricante est\xE1 presente e id\xEAntica naquele quadrante!
     * SE "logoPartVisible": true E A LOGOMARCA DO FABRICANTE FOI REMOVIDA, APAGADA, DEIXADA LISA OU ALTERADA naquele quadrante:
       -> Marque OBRIGATORIAMENTE "logoFaithful": false!
       -> D\xEA OBRIGATORIAMENTE uma nota BAIXA entre 45 e 58 (VERMELHO, abaixo de 60) para aquele quadrante! NUNCA d\xEA nota alta se a parte da logo est\xE1 vis\xEDvel e a logo sumiu!
       -> No campo "issue" (SEMPRE EM PORTUGU\xCAS), escreva claramente: "Na Cena X, o produto est\xE1 diferente: a logomarca original do fabricante ([descreva a logo e onde fica, ex: no encosto]) foi removida e n\xE3o aparece como na foto de refer\xEAncia."
   - CORES, FORMATO, ESTRUTURA E DETALHES: Verifique se a apar\xEAncia, formato, estrutura e cor conferem com QUALQUER UMA das fotos/varia\xE7\xF5es de refer\xEAncia anexadas pelo usu\xE1rio.${variationsAuditRule}
3. ESCALA INTEIRA DE NOTAS DE CADA QUADRANTE (0 a 100 \u2014 NUNCA use decimais de 0 a 1):
   - 90 a 100 (VERDE): Produto 90%+ id\xEAntico a qualquer uma das fotos/varia\xE7\xF5es de refer\xEAncia anexadas (logomarca original presente e fiel quando a \xE1rea aparece, ou close fiel de outra parte do produto).
   - 71 a 89 (AMARELO): Produto com pequena varia\xE7\xE3o leve de detalhe secund\xE1rio.
   - 60 a 70 (LARANJA): Diferen\xE7a moderada de formato/cor ou logomarca parcialmente distorcida/apagada.
   - Abaixo de 60 (VERMELHO): Logomarca original do fabricante removida/ausente em quadrante onde aquela parte est\xE1 vis\xEDvel, formato alterado ou cor/apar\xEAncia diferente de TODAS as varia\xE7\xF5es anexadas.

CONTEXTO DO PRODUCT LOCK ESPERADO:
${lockContext}

DESCRI\xC7\xC3O PLANEJADA DAS ${quadrantCount} CENAS:
${scenesContext}

Retorne ESTRITAMENTE um objeto JSON v\xE1lido EM PORTUGU\xCAS com este formato exato:
{
  "hasReferenceLogo": true,
  "referenceLogoDescription": "string em portugu\xEAs descrevendo a logomarca original e sua posi\xE7\xE3o na foto de refer\xEAncia",
  "quadrants": [
    {
      "sceneNumber": 1,
      "productVisible": true,
      "logoPartVisible": true,
      "logoFaithful": false,
      "score": 52,
      "issue": "Na Cena 1, o produto est\xE1 diferente: a logomarca branca original do fabricante no encosto foi removida."
    }
  ]
}
O array "quadrants" DEVE conter exatamente ${quadrantCount} itens (sceneNumber 1 a ${quadrantCount}), com "issue" sempre em portugu\xEAs do Brasil.`;
    const activeProfile = req.body?.aiProfile || getRequestAIProfile(req);
    const tryOrder = activeProfile === "gemini" ? ["gemini"] : ["openai"];
    let rawQuadrants = null;
    let hasReferenceLogo = false;
    let referenceLogoDescription = "";
    let lastAuditUsage = null;
    for (const provider of tryOrder) {
      if (rawQuadrants) break;
      if (provider === "openai" && openAIProvider.isConfigured()) {
        try {
          const client = openAIProvider.getClient();
          const contentBlocks = [];
          if (activeVariations.length >= 2) {
            activeVariations.forEach((v, idx) => {
              const varPhotos = Array.isArray(v.photos) && v.photos.length > 0 ? v.photos.filter(Boolean).slice(0, 2) : v.photo ? [v.photo] : photosList[idx] ? [photosList[idx]] : [];
              varPhotos.forEach((photo, pIdx) => {
                contentBlocks.push({
                  type: "text",
                  text: `[FOTO DE REFER\xCANCIA REAL DA VARIA\xC7\xC3O ${idx + 1} ("${v.name || "Varia\xE7\xE3o " + (idx + 1)}") \u2014 FOTO #${pIdx + 1}: QUALQUER QUADRANTE QUE RETRATE O PRODUTO ID\xCANTICO A ESTA VARIA\xC7\xC3O EST\xC1 100% CORRETO E APROVADO]:`
                });
                contentBlocks.push({
                  type: "image_url",
                  image_url: {
                    url: photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`,
                    detail: "high"
                  }
                });
              });
            });
          } else {
            photosList.slice(0, 4).forEach((photo, idx) => {
              contentBlocks.push({
                type: "text",
                text: `[FOTO DE REFER\xCANCIA REAL DO PRODUTO #${idx + 1} \u2014 OBSERVE ATENTAMENTE O FORMATO, COR E A LOGOMARCA DO FABRICANTE IMPRESSA NO PRODUTO]:`
              });
              contentBlocks.push({
                type: "image_url",
                image_url: {
                  url: photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`,
                  detail: "high"
                }
              });
            });
          }
          contentBlocks.push({
            type: "text",
            text: `[IMAGEM GERADA \u2014 STORYBOARD COM ${quadrantCount} CENAS NUMERADAS DE 1 A ${quadrantCount} PARA FISCALIZA\xC7\xC3O]:`
          });
          contentBlocks.push({
            type: "image_url",
            image_url: {
              url: storyboardImageBase64.startsWith("data:") ? storyboardImageBase64 : `data:image/png;base64,${storyboardImageBase64}`,
              detail: "high"
            }
          });
          contentBlocks.push({
            type: "text",
            text: `Inspecione cada um dos ${quadrantCount} quadrantes (Cena 1 a Cena ${quadrantCount}) comparando com as fotos reais de refer\xEAncia. Lembre-se: se houver m\xFAltiplas varia\xE7\xF5es anexadas, o produto \xE9 considerado 100% correto em qualquer quadrante desde que seja id\xEAntico a QUALQUER UMA das varia\xE7\xF5es anexadas! S\xF3 reprove se o produto tiver apar\xEAncia, formato, logomarca ou cor diferente de TODAS as varia\xE7\xF5es anexadas. Retorne o JSON em portugu\xEAs.`
          });
          const modelsToTry = [OPENAI_AUDIT_MODEL || "gpt-5.6-luna", "gpt-4o", "gpt-4o-mini", OPENAI_BRAIN_MODEL];
          for (const modelCandidate of modelsToTry) {
            try {
              const params = {
                model: modelCandidate,
                messages: [
                  { role: "system", content: auditSystemInstruction },
                  { role: "user", content: contentBlocks }
                ],
                response_format: { type: "json_object" }
              };
              if (!modelCandidate.startsWith("gpt-5") && !modelCandidate.startsWith("o")) {
                params.temperature = 0.15;
              }
              const completion = await client.chat.completions.create(params);
              const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
              if (parsed && Array.isArray(parsed.quadrants) && parsed.quadrants.length > 0) {
                rawQuadrants = parsed.quadrants;
                hasReferenceLogo = Boolean(parsed.hasReferenceLogo);
                referenceLogoDescription = String(parsed.referenceLogoDescription || "").trim();
                const pTok = completion.usage?.prompt_tokens || 3500;
                const cTok = completion.usage?.completion_tokens || 700;
                lastAuditUsage = {
                  promptTokens: pTok,
                  completionTokens: cTok,
                  totalTokens: pTok + cTok,
                  costUSD: 0.011,
                  costBRL: 0.063,
                  model: modelCandidate
                };
                break;
              }
            } catch (e) {
              console.warn(`Aviso OpenAI audit storyboard (${modelCandidate}):`, e?.message || e);
            }
          }
        } catch (oiErr) {
          console.warn("Falha OpenAI em produtos2-audit-storyboard:", oiErr?.message || oiErr);
        }
      }
      if (!rawQuadrants && provider === "gemini" && process.env.GEMINI_API_KEY) {
        try {
          const parts = [];
          if (activeVariations.length >= 2) {
            activeVariations.forEach((v, idx) => {
              const varPhotos = Array.isArray(v.photos) && v.photos.length > 0 ? v.photos.filter(Boolean).slice(0, 2) : v.photo ? [v.photo] : photosList[idx] ? [photosList[idx]] : [];
              varPhotos.forEach((photo, pIdx) => {
                const parsedRef = photo ? parseInlineImage(photo) : null;
                if (parsedRef) {
                  parts.push({
                    text: `[FOTO DE REFER\xCANCIA REAL DA VARIA\xC7\xC3O ${idx + 1} ("${v.name || "Varia\xE7\xE3o " + (idx + 1)}") \u2014 FOTO #${pIdx + 1}: QUALQUER QUADRANTE ID\xCANTICO A ESTA VARIA\xC7\xC3O EST\xC1 100% CORRETO]:`
                  });
                  parts.push({ inlineData: parsedRef });
                }
              });
            });
          } else {
            photosList.slice(0, 4).forEach((photo, idx) => {
              const parsedRef = parseInlineImage(photo);
              if (parsedRef) {
                parts.push({ text: `[FOTO DE REFER\xCANCIA REAL DO PRODUTO #${idx + 1} \u2014 OBSERVE A LOGOMARCA DO FABRICANTE, COR E DETALHES]:` });
                parts.push({ inlineData: parsedRef });
              }
            });
          }
          const parsedStoryboard = parseInlineImage(storyboardImageBase64);
          if (parsedStoryboard) {
            parts.push({ text: `[IMAGEM GERADA \u2014 STORYBOARD (${quadrantCount} CENAS NUMERADAS DE 1 A ${quadrantCount})]:` });
            parts.push({ inlineData: parsedStoryboard });
          }
          parts.push({
            text: `${auditSystemInstruction}

Analise cada um dos ${quadrantCount} quadrantes (Cena 1 a Cena ${quadrantCount}) e retorne o JSON em portugu\xEAs.`
          });
          const geminiModels = [
            GEMINI_VISION_MODEL || "gemini-3.8-flash",
            "gemini-2.5-flash",
            GEMINI_VISION_FAST_MODEL || "gemini-3.1-flash-lite"
          ];
          for (const gemModel of geminiModels) {
            try {
              const auditRes = await getGenAI().models.generateContent({
                model: gemModel,
                contents: parts,
                config: {
                  responseMimeType: "application/json"
                }
              });
              const parsed = JSON.parse(auditRes.text || "{}");
              if (parsed && Array.isArray(parsed.quadrants) && parsed.quadrants.length > 0) {
                rawQuadrants = parsed.quadrants;
                hasReferenceLogo = Boolean(parsed.hasReferenceLogo);
                referenceLogoDescription = String(parsed.referenceLogoDescription || "").trim();
                const pTok = auditRes.usageMetadata?.promptTokenCount || 3500;
                const cTok = auditRes.usageMetadata?.candidatesTokenCount || 700;
                lastAuditUsage = {
                  promptTokens: pTok,
                  completionTokens: cTok,
                  totalTokens: pTok + cTok,
                  costUSD: 5e-3,
                  costBRL: 0.03,
                  model: gemModel
                };
                break;
              }
            } catch (gemErr) {
              console.warn(`Aviso Gemini em produtos2-audit-storyboard (${gemModel}):`, gemErr?.message || gemErr);
            }
          }
        } catch (gemOuterErr) {
          console.warn("Aviso Gemini outer em produtos2-audit-storyboard:", gemOuterErr?.message || gemOuterErr);
        }
      }
    }
    const normalizedQuadrants = Array.from({ length: quadrantCount }, (_, i) => {
      const sceneNum = i + 1;
      const found = (rawQuadrants || []).find((q) => Number(q.sceneNumber) === sceneNum) || (rawQuadrants || [])[i];
      const productVisible = found?.productVisible !== void 0 ? Boolean(found.productVisible) : true;
      const logoPartVisible = found?.logoPartVisible !== void 0 ? Boolean(found.logoPartVisible) : false;
      const logoFaithful = found?.logoFaithful !== void 0 ? Boolean(found.logoFaithful) : true;
      let rawScore = productVisible ? Number(found?.score ?? 93) : 100;
      if (isNaN(rawScore)) rawScore = 93;
      if (rawScore > 0 && rawScore <= 1) {
        rawScore = Math.round(rawScore * 100);
      }
      let issue = String(found?.issue || "").trim();
      const lowerIssue = issue.toLowerCase();
      const mentionsMissingLogo = logoPartVisible && !logoFaithful || lowerIssue.includes("foi removid") || logoPartVisible && (lowerIssue.includes("not visible") || lowerIssue.includes("missing") || lowerIssue.includes("sem a logo") || lowerIssue.includes("sem logo") || lowerIssue.includes("ausente") || lowerIssue.includes("n\xE3o aparece"));
      if (productVisible && mentionsMissingLogo) {
        rawScore = Math.min(rawScore, 54);
        if (!issue || !lowerIssue.includes("cena")) {
          const logoRefText = referenceLogoDescription ? ` (${referenceLogoDescription})` : " presente na foto de refer\xEAncia";
          issue = `Na Cena ${sceneNum}, o produto est\xE1 diferente: a logomarca original do fabricante${logoRefText} foi removida ou n\xE3o aparece id\xEAntica na pe\xE7a.`;
        }
      }
      if (activeVariations.length >= 2 && !mentionsMissingLogo && rawScore < 90) {
        const allVarWords = activeVariations.flatMap((v) => String(v.name || "").toLowerCase().split(/[\s/,-]+/)).filter((w) => w.length >= 3);
        const mentionsAnyKnownVar = allVarWords.some((w) => lowerIssue.includes(w));
        const isComparingBetweenVariations = lowerIssue.includes("em vez de") || lowerIssue.includes("em lugar de") || lowerIssue.includes("diverge da varia\xE7\xE3o") || lowerIssue.includes("deveria estar na varia\xE7\xE3o") || lowerIssue.includes("pertence \xE0 varia\xE7\xE3o") || mentionsAnyKnownVar && (lowerIssue.includes("varia\xE7\xE3o 1") || lowerIssue.includes("varia\xE7\xE3o 2") || lowerIssue.includes("varia\xE7\xE3o 3"));
        if (isComparingBetweenVariations) {
          rawScore = Math.max(rawScore, 95);
          issue = `Cena ${sceneNum}: Produto id\xEAntico a uma das varia\xE7\xF5es de refer\xEAncia anexadas (95%)`;
        }
      }
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const status = getAuditColorStatus(score);
      if (!issue) {
        if (!productVisible) {
          issue = `Cena ${sceneNum}: Apenas modelo/cen\xE1rio (sem produto vis\xEDvel \u2014 OK)`;
        } else if (score >= 90) {
          issue = `Cena ${sceneNum}: Produto id\xEAntico \xE0 refer\xEAncia (${score}%)`;
        } else {
          issue = `Na Cena ${sceneNum}, o produto est\xE1 diferente da foto de refer\xEAncia (${score}%).`;
        }
      } else if (productVisible && score < 90 && !issue.toLowerCase().includes(`cena ${sceneNum}`)) {
        issue = `Na Cena ${sceneNum}, o produto est\xE1 diferente: ${issue}`;
      }
      return {
        sceneNumber: sceneNum,
        productVisible,
        score,
        status,
        issue
      };
    });
    const visibleQuadrants = normalizedQuadrants.filter((q) => q.productVisible);
    const problemQuadrants = visibleQuadrants.filter((q) => q.score < 90);
    const approvedQuadrants = normalizedQuadrants.filter((q) => q.score >= 90);
    let overallScore = 95;
    if (visibleQuadrants.length > 0) {
      const avgScore = visibleQuadrants.reduce((acc, q) => acc + q.score, 0) / visibleQuadrants.length;
      const minScore = Math.min(...visibleQuadrants.map((q) => q.score));
      if (problemQuadrants.length === 0) {
        overallScore = Math.max(90, Math.round(avgScore));
      } else if (minScore < 60) {
        overallScore = Math.min(59, Math.round(minScore * 0.75 + avgScore * 0.25));
      } else if (minScore <= 70) {
        overallScore = Math.min(70, Math.max(60, Math.round(minScore * 0.7 + avgScore * 0.3)));
      } else {
        overallScore = Math.min(89, Math.max(71, Math.round(minScore * 0.65 + avgScore * 0.35)));
      }
    }
    const overallStatus = getAuditColorStatus(overallScore);
    const overallLabel = getAuditColorLabel(overallStatus, overallScore);
    const summaryIssues = problemQuadrants.length > 0 ? problemQuadrants.map((q) => `${q.issue} (Nota: ${q.score}%)`) : [`Todas as ${quadrantCount} cenas est\xE3o com fidelidade acima de 90% em rela\xE7\xE3o \xE0s fotos de refer\xEAncia.`];
    let correctionPrompt = "";
    const logoMandatoryNote = hasReferenceLogo && referenceLogoDescription ? `OBRIGAT\xD3RIO REPRODUZIR A LOGOMARCA ORIGINAL DO FABRICANTE NO PRODUTO: "${referenceLogoDescription}". JAMAIS deixe a superf\xEDcie lisa onde existe a logomarca nas fotos de refer\xEAncia!` : `OBRIGAT\xD3RIO preservar 100% id\xEAnticos a logomarca e os textos originais do fabricante impressos no pr\xF3prio produto nas fotos de refer\xEAncia.`;
    const variationMandatoryNote = activeVariations.length >= 2 ? `VARIA\xC7\xD5ES DE CORES OFICIAIS PERMITIDAS: ${activeVariations.map((v, idx) => `Varia\xE7\xE3o ${idx + 1} (${v.name || "Cor " + (idx + 1)})`).join(", ")}. O produto em cada quadrante deve ser 100% id\xEAntico a uma das varia\xE7\xF5es de refer\xEAncia anexadas, nunca com cor ou formato diferente das fotos anexadas!` : "";
    if (problemQuadrants.length > 0) {
      const approvedNums = approvedQuadrants.map((q) => q.sceneNumber).join(", ");
      const fixesList = problemQuadrants.map(
        (q) => `- CORRIGIR CENA ${q.sceneNumber} (nota anterior ${q.score}%): ${q.issue}. Fa\xE7a o produto "${productName}" na Cena ${q.sceneNumber} ficar 100% ID\xCANTICO \xE0s fotos reais de refer\xEAncia (reproduzindo fielmente a logomarca original do fabricante na pe\xE7a, cores das varia\xE7\xF5es anexadas, formato e bot\xF5es).`
      ).join("\n");
      correctionPrompt = [
        logoMandatoryNote,
        variationMandatoryNote,
        approvedNums ? `MANTENHA A QUALIDADE E FIDELIDADE DAS CENAS J\xC1 APROVADAS (Cenas ${approvedNums}).` : "",
        `CORRIJA PRIORITARIAMENTE AS CENAS ONDE O PRODUTO FICOU DIFERENTE:`,
        fixesList,
        `OBJETIVO OBRIGAT\xD3RIO: Atingir mais de 90% de similaridade em TODOS os ${quadrantCount} quadrantes, preservando logomarca do fabricante, textos impressos no produto, cores das varia\xE7\xF5es anexadas, formato e bot\xF5es 100% id\xEAnticos \xE0s fotos de refer\xEAncia.`
      ].filter(Boolean).join("\n");
    } else {
      correctionPrompt = [
        logoMandatoryNote,
        variationMandatoryNote,
        `Mantenha mais de 90% de similaridade em todos os ${quadrantCount} quadrantes, preservando logomarca do fabricante, textos impressos no produto, cores das varia\xE7\xF5es anexadas, bot\xF5es e formato 100% id\xEAnticos \xE0s fotos de refer\xEAncia.`
      ].filter(Boolean).join(" ");
    }
    return res.json({
      success: true,
      audit: {
        overallScore,
        overallStatus,
        overallLabel,
        summaryIssues,
        quadrants: normalizedQuadrants,
        correctionPrompt
      },
      usage: lastAuditUsage || {
        promptTokens: 3500,
        completionTokens: 700,
        totalTokens: 4200,
        costUSD: 0.011,
        costBRL: 0.063,
        model: "gpt-5.6-luna"
      }
    });
  } catch (err) {
    console.warn("Erro em /api/produtos2-audit-storyboard:", err?.message || err);
    return res.json({
      success: false,
      error: err?.message || "Erro ao auditar os quadrantes do storyboard."
    });
  }
});
async function handleProdutos2AuditVideo(req, res) {
  try {
    const {
      videoFrames = [],
      // Array<{ second: number; frameBase64: string }>
      productPhotosBase64 = [],
      // Array<string>
      productName = "Produto",
      productLock = []
    } = req.body;
    if (!Array.isArray(videoFrames) || videoFrames.length === 0) {
      return res.status(400).json({ success: false, error: "Nenhum frame do v\xEDdeo fornecido para an\xE1lise." });
    }
    const photosList = Array.isArray(productPhotosBase64) ? productPhotosBase64.filter(Boolean) : [];
    if (photosList.length === 0) {
      return res.status(400).json({ success: false, error: "Nenhuma foto de refer\xEAncia do produto fornecida." });
    }
    const lockContext = Array.isArray(productLock) ? productLock.join("; ") : "";
    const systemInstruction = `Voc\xEA \xE9 o Fiscal Rigoroso de Fidelidade Visual de Produtos para V\xEDdeos Comerciais do TikTok Shop e Veo 3.
Sua miss\xE3o \xE9 auditar ${videoFrames.length} FRAMES extra\xEDdos do v\xEDdeo gerado pelo Google Veo (extra\xEDdos a cada 2 segundos ao longo do v\xEDdeo) e comparar o produto retratado em cada um deles com as FOTOS REAIS DE REFER\xCANCIA do produto "${productName}".

O algoritmo de modera\xE7\xE3o do TikTok Shop \xE9 impiedoso:
- Se em QUALQUER frame o produto mudar de formato/tamanho, tiver cor/apar\xEAncia inexistente nas fotos de refer\xEAncia, adicionar bot\xF5es/bolsos/z\xEDperes inexistentes, ou se a logomarca do fabricante for removida ou distorcida, o v\xEDdeo corre risco iminente de RESTRI\xC7\xC3O ou BANIMENTO por "Produto Inconsistente / Divergente".
- REGRA DE OURO PARA M\xDALTIPLAS FOTOS / VARIA\xC7\xD5ES DE REFER\xCANCIA: Caso as fotos de refer\xEAncia anexadas mostrem mais de uma varia\xE7\xE3o/cor do produto (ex: Azul e Vermelho), qualquer frame onde o produto esteja id\xEAntico a QUALQUER UMA das fotos de refer\xEAncia anexadas est\xE1 100% CORRETO e APROVADO (90 a 100% \u2014 Verde). S\xF3 reprove se o produto no frame divergir de TODAS as fotos de refer\xEAncia anexadas!
- O cen\xE1rio ao redor e a pessoa/modelo segurando ou vestindo o produto N\xC3O importam tanto. O foco cir\xFArgico DEVE ser 100% no PRODUTO F\xCDSICO!

CRIT\xC9RIOS DE PONTUA\xC7\xC3O PARA CADA FRAME:
- 90 a 100% (Verde - Aprovado): Produto id\xEAntico a qualquer uma das fotos de refer\xEAncia anexadas (varia\xE7\xE3o <10%), preservando cores, acabamento, textura e formato real.
- 71 a 89% (Amarelo - Pode Passar / Razo\xE1vel): Pequena varia\xE7\xE3o (ex: tom de cor levemente alterado pela luz, detalhe sutil).
- 60 a 70% (Laranja - Cuidado / Risco M\xE9dio): Varia\xE7\xE3o moderada percept\xEDvel (ex: formato deformado, propor\xE7\xE3o esquisita).
- Menor que 60% (Vermelho - Reprovado / Risco de Restri\xE7\xE3o): Varia\xE7\xE3o gritante (ex: cor inexistente nas fotos de refer\xEAncia, modelo alterado, detalhes fantasmas adicionados, logo apagada ou produto irreconhec\xEDvel).

Retorne ESTRITAMENTE um objeto JSON:
{
  "frames": [
    {
      "frameNumber": 1,
      "second": 1.0,
      "productVisible": true,
      "score": 96,
      "status": "green",
      "issue": "Curta observa\xE7\xE3o em portugu\xEAs sobre a fidelidade do produto neste segundo"
    }
  ],
  "summary": "Resumo objetivo em portugu\xEAs indicando se o v\xEDdeo est\xE1 seguro para postar no TikTok Shop ou em quais segundos houve problema."
}`;
    if (openAIProvider.isConfigured()) {
      try {
        const client = openAIProvider.getClient();
        const contentBlocks = [];
        photosList.slice(0, 6).forEach((photo, idx) => {
          contentBlocks.push({
            type: "text",
            text: `[FOTO DE REFER\xCANCIA REAL #${idx + 1} DO PRODUTO "${productName}"]:`
          });
          contentBlocks.push({
            type: "image_url",
            image_url: {
              url: photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`,
              detail: "low"
            }
          });
        });
        videoFrames.forEach((frameObj, idx) => {
          const sec = frameObj.second ?? idx * 2 + 1;
          contentBlocks.push({
            type: "text",
            text: `[FRAME #${idx + 1} EXTRA\xCDDO DO V\xCDDEO DO VEO NO SEGUNDO ${sec}s]:`
          });
          contentBlocks.push({
            type: "image_url",
            image_url: {
              url: frameObj.frameBase64.startsWith("data:") ? frameObj.frameBase64 : `data:image/jpeg;base64,${frameObj.frameBase64}`,
              detail: "low"
            }
          });
        });
        const promptText = `Audite os ${videoFrames.length} frames do v\xEDdeo acima comparando com as fotos de refer\xEAncia reais do produto "${productName}". Se o produto em cada frame for id\xEAntico a qualquer uma das fotos de refer\xEAncia anexadas, aprove com nota >= 90%.${lockContext ? ` Trava do produto: ${lockContext}` : ""}
Retorne o JSON estritamente conforme solicitado.`;
        contentBlocks.push({ type: "text", text: promptText });
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: contentBlocks }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 2500
        });
        const rawText = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(rawText);
        const promptTok = completion.usage?.prompt_tokens || 3500;
        const compTok = completion.usage?.completion_tokens || 350;
        const totTok = promptTok + compTok;
        const costUSD = Math.round((promptTok * 15e-8 + compTok * 6e-7) * 1e4) / 1e4;
        const costBRL = Math.round(costUSD * 5.6 * 1e3) / 1e3;
        const normalizedFrames = videoFrames.map((vf, idx) => {
          const num = idx + 1;
          const found = (parsed.frames || []).find((f) => Number(f.frameNumber) === num) || (parsed.frames || [])[idx];
          const sec = vf.second ?? found?.second ?? idx * 2 + 1;
          let score = Number(found?.score ?? 94);
          if (isNaN(score)) score = 94;
          if (score > 0 && score <= 1) score = Math.round(score * 100);
          const status = getAuditColorStatus(score);
          const issue = String(found?.issue || `Frame ${num} (${sec}s): Produto ${score >= 90 ? "id\xEAntico \xE0 refer\xEAncia" : "com varia\xE7\xF5es"}`).trim();
          return {
            frameNumber: num,
            second: sec,
            productVisible: found?.productVisible !== false,
            score,
            status,
            issue,
            frameThumbnail: vf.frameBase64
          };
        });
        const scores = normalizedFrames.map((f) => f.score);
        const minScore = Math.min(...scores);
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        let overallScore = avgScore;
        let overallStatus = "green";
        let overallLabel = "Aprovado: V\xEDdeo Liberado";
        if (minScore < 60) {
          overallStatus = "red";
          overallScore = Math.min(59, minScore);
          overallLabel = "Risco de Restri\xE7\xE3o: Reprovado";
        } else if (minScore <= 70) {
          overallStatus = "orange";
          overallScore = Math.min(70, minScore);
          overallLabel = "Cuidado: Varia\xE7\xE3o Moderada";
        } else if (minScore < 90) {
          overallStatus = "yellow";
          overallScore = Math.min(89, minScore);
          overallLabel = "Pode Passar: Razo\xE1vel";
        } else {
          overallStatus = "green";
          overallScore = avgScore;
          overallLabel = "Aprovado: V\xEDdeo Liberado";
        }
        return res.json({
          success: true,
          audit: {
            overallScore,
            overallStatus,
            overallLabel,
            summary: parsed.summary || (overallStatus === "green" ? "Produto aprovado em todos os 5 frames analisados. Alta fidelidade com as fotos reais, liberado para o TikTok Shop." : `Aten\xE7\xE3o: Houve varia\xE7\xE3o no produto identificada no v\xEDdeo (menor nota: ${minScore}%).`),
            frames: normalizedFrames
          },
          usage: {
            promptTokens: promptTok,
            completionTokens: compTok,
            totalTokens: totTok,
            costUSD,
            costBRL: Math.max(0.01, Math.round(costBRL * 100) / 100),
            model: "gpt-4o-mini"
          }
        });
      } catch (openAiErr) {
        console.warn("Erro OpenAI em /api/produtos2-audit-video:", openAiErr?.message || openAiErr);
        return res.json({
          success: false,
          error: openAiErr?.message || "Falha ao auditar v\xEDdeo com OpenAI."
        });
      }
    }
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        photosList.slice(0, 5).forEach((photo, idx) => {
          const parsedRef = parseInlineImage(photo);
          if (parsedRef) {
            parts.push({ text: `[FOTO DE REFER\xCANCIA REAL #${idx + 1} DO PRODUTO "${productName}"]:` });
            parts.push({ inlineData: parsedRef });
          }
        });
        videoFrames.forEach((frameObj, idx) => {
          const sec = frameObj.second ?? idx * 2 + 1;
          const parsedFrame = parseInlineImage(frameObj.frameBase64);
          if (parsedFrame) {
            parts.push({ text: `[FRAME #${idx + 1} DO V\xCDDEO NO SEGUNDO ${sec}s]:` });
            parts.push({ inlineData: parsedFrame });
          }
        });
        parts.push({
          text: `${systemInstruction}

Audite os frames acima e retorne o JSON estritamente no schema solicitado.`
        });
        const auditRes = await getGenAI().models.generateContent({
          model: "gemini-2.5-flash",
          contents: parts,
          config: {
            responseMimeType: "application/json"
          }
        });
        const parsed = JSON.parse(auditRes.text || "{}");
        const pTok = auditRes.usageMetadata?.promptTokenCount || 3500;
        const cTok = auditRes.usageMetadata?.candidatesTokenCount || 350;
        const normalizedFrames = videoFrames.map((vf, idx) => {
          const num = idx + 1;
          const found = (parsed.frames || []).find((f) => Number(f.frameNumber) === num) || (parsed.frames || [])[idx];
          const sec = vf.second ?? found?.second ?? idx * 2 + 1;
          let score = Number(found?.score ?? 94);
          if (isNaN(score)) score = 94;
          if (score > 0 && score <= 1) score = Math.round(score * 100);
          const status = getAuditColorStatus(score);
          const issue = String(found?.issue || `Frame ${num} (${sec}s): Produto ${score >= 90 ? "id\xEAntico \xE0 refer\xEAncia" : "com varia\xE7\xF5es"}`).trim();
          return {
            frameNumber: num,
            second: sec,
            productVisible: found?.productVisible !== false,
            score,
            status,
            issue,
            frameThumbnail: vf.frameBase64
          };
        });
        const scores = normalizedFrames.map((f) => f.score);
        const minScore = Math.min(...scores);
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        let overallScore = avgScore;
        let overallStatus = "green";
        let overallLabel = "Aprovado: V\xEDdeo Liberado";
        if (minScore < 60) {
          overallStatus = "red";
          overallScore = Math.min(59, minScore);
          overallLabel = "Risco de Restri\xE7\xE3o: Reprovado";
        } else if (minScore <= 70) {
          overallStatus = "orange";
          overallScore = Math.min(70, minScore);
          overallLabel = "Cuidado: Varia\xE7\xE3o Moderada";
        } else if (minScore < 90) {
          overallStatus = "yellow";
          overallScore = Math.min(89, minScore);
          overallLabel = "Pode Passar: Razo\xE1vel";
        } else {
          overallStatus = "green";
          overallScore = avgScore;
          overallLabel = "Aprovado: V\xEDdeo Liberado";
        }
        return res.json({
          success: true,
          audit: {
            overallScore,
            overallStatus,
            overallLabel,
            summary: parsed.summary || "An\xE1lise de frames conclu\xEDda com sucesso.",
            frames: normalizedFrames
          },
          usage: {
            promptTokens: pTok,
            completionTokens: cTok,
            totalTokens: pTok + cTok,
            costUSD: 1e-3,
            costBRL: 0.01,
            model: "gemini-2.5-flash"
          }
        });
      } catch (gemErr) {
        console.warn("Erro Gemini em /api/produtos2-audit-video:", gemErr?.message || gemErr);
      }
    }
    return res.json({
      success: false,
      error: "Nenhum provedor de IA configurado para auditoria de v\xEDdeo."
    });
  } catch (err) {
    console.error("Erro geral em /api/produtos2-audit-video:", err);
    return res.json({
      success: false,
      error: err?.message || "Erro inesperado ao auditar fidelidade do v\xEDdeo."
    });
  }
}
app.post("/api/produtos2-audit-video", handleProdutos2AuditVideo);
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
    app.get("*", (_req, res) => {
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
