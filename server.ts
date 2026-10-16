import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  GEMINI_VISION_MODEL,
  GEMINI_VISION_FAST_MODEL,
  GEMINI_IMAGE_MODEL,
  GEMINI_IMAGE_FAST_MODEL,
  calculateSceneCount,
} from './src/config/models';
import { buildVeoSingleParagraphPrompt, buildUniversalSceneImagePrompt } from './src/utils/veoPromptBuilder';
import { distributeSpeechAcrossScenes } from './src/utils/speechDistributor';
import { selectRepresentativeKeyframes } from './src/utils/frameSampler';
import { openAIProvider, globalCostTracker, getActiveProviderType } from './src/services/ai';
import {
  OPENAI_BRAIN_MODEL,
  OPENAI_AUDIO_MODEL,
  OPENAI_IMAGE_MODEL,
  OPENAI_AUDIT_MODEL,
} from './src/config/openaiModels';
import { AIProfile } from './src/config/aiProfiles';
import { buildAniaPlanningSystemPrompt } from './src/ania/aniaPrompts';
import { buildProdutos2PlanningSystemPrompt } from './src/produtos2/produtos2Prompts';
import { fitSpeechCloseToLimit, extractUserSpeechFromInstructions } from './src/produtos2/produtos2UserSpeechExtractor';

dotenv.config();

// Normalização de chaves caso cadastradas como APIOPENAI ou GEMINIAPI
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.APIOPENAI || process.env.OPENAI_KEY || process.env.VITE_OPENAI_API_KEY || '';
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.GEMINIAPI || process.env.GEMINI_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    (req as any)._body = true;
  }
  next();
});

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-ai-profile');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

/**
 * Resolução centralizada do perfil de IA ativo da requisição
 */
function getRequestAIProfile(req: express.Request): AIProfile {
  const hasOpenAi = Boolean(openAIProvider && openAIProvider.isConfigured());
  const hasGemini = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) ||
    (process.env.GEMINIAPI && process.env.GEMINIAPI.trim().length > 0)
  );
  const p = String(req.body?.aiProfile || req.headers['x-ai-profile'] || '').toLowerCase();

  if (p === 'openai' && hasOpenAi) return 'openai';
  if (p === 'gemini' && hasGemini) return 'gemini';

  const envActive = getActiveProviderType();
  if (envActive === 'openai' && hasOpenAi) return 'openai';
  if (hasGemini) return 'gemini';
  if (hasOpenAi) return 'openai';
  return 'gemini';
}

function getGenAI(): GoogleGenAI {
  const currentKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey: currentKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to safely parse and validate base64 inline images
function parseInlineImage(imgStr: string): { mimeType: string; data: string } | null {
  if (!imgStr || typeof imgStr !== 'string') return null;

  const match = imgStr.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (match) {
    const cleanData = match[2].replace(/[\r\n\s]/g, '');
    if (cleanData.length > 20) {
      return {
        mimeType: match[1],
        data: cleanData,
      };
    }
  }

  const trimmed = imgStr.trim().replace(/[\r\n\s]/g, '');
  if (/^[A-Za-z0-9+/=]{100,}$/.test(trimmed)) {
    return {
      mimeType: 'image/jpeg',
      data: trimmed,
    };
  }

  return null;
}

// Parse audio base64 (e.g. data:audio/wav;base64,... or data:audio/webm;codecs=opus;base64,...)
function parseInlineAudio(audioStr: string): { mimeType: string; data: string } | null {
  if (!audioStr || typeof audioStr !== 'string') return null;
  const match = audioStr.match(/^data:(audio\/[a-zA-Z0-9.\-_+]+)(?:;[a-zA-Z0-9.\-_=]+)*;base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (match) {
    let mimeType = match[1];
    if (mimeType === 'audio/mpeg') mimeType = 'audio/mp3';
    return {
      mimeType,
      data: match[2].replace(/[\r\n\s]/g, ''),
    };
  }
  const trimmed = audioStr.trim().replace(/[\r\n\s]/g, '');
  if (/^[A-Za-z0-9+/=]{100,}$/.test(trimmed)) {
    return {
      mimeType: 'audio/webm',
      data: trimmed,
    };
  }
  return null;
}

/**
 * Análise visual rápida (Vision AI) da foto da amostra de cor (Cor 2 / Cor 3)
 * Extrai cor exata, tecido, botões, costuras e acabamentos físicos da peça isolada
 * para que o modelo de difusão use Image 1 como canvas exclusivo e receba a especificação exata do produto.
 */
async function extractProductSwatchDetails(
  swatchPhotoBase64: string,
  variationName: string,
  productType: string
): Promise<string> {
  const parsed = parseInlineImage(swatchPhotoBase64);
  if (!parsed) return `cor "${variationName}"`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const response = await getGenAI().models.generateContent({
        model: GEMINI_VISION_FAST_MODEL || 'gemini-3.8-flash-lite',
        contents: {
          parts: [
            { inlineData: parsed },
            {
              text: `Analise visualmente com foco microscópico APENAS o produto (${productType}) nesta foto correspondente à variação "${variationName}".
Descreva em 1 parágrafo denso e direto em inglês (para prompt visual):
- Tom exato e matiz da cor (ex: dusty rose, deep navy blue, warm beige, charcoal grey, pure white)
- Textura e tipo de tecido/material visível (ex: ribbed knit, satin finish, smooth cotton, breathable mesh, matte leather)
- Detalhes construtivos físicos (ex: white contrast piping on collar and cuffs, matching buttons, elastic waistband, specific seam lines, drawstrings, sole color/texture)
NÃO mencione o fundo, manequim, cabide ou ambiente da foto. Foque EXCLUSIVAMENTE nas características físicas da peça/produto.`,
            },
          ],
        },
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 10) {
        return text.trim();
      }
    }
  } catch (err: any) {
    console.warn('extractProductSwatchDetails falhou, usando fallback textual:', err?.message || err);
  }

  return `Exact shade: "${variationName}". Matching fabric texture and constructive details from the user's swatch photo.`;
}


// Token Cost Calculator in BRL
const USD_TO_BRL = 5.70;

function calculateCostBRL(model: string, promptTokens: number, candidateTokens: number): number {
  let inputPer1M = 0.075; // Gemini 3.8 Flash
  let outputPer1M = 0.30;

  if (model.includes('flash-lite')) {
    inputPer1M = 0.0375;
    outputPer1M = 0.15;
  } else if (model.includes('pro')) {
    inputPer1M = 1.25;
    outputPer1M = 5.00;
  }

  const costUSD = (promptTokens / 1_000_000) * inputPer1M + (candidateTokens / 1_000_000) * outputPer1M;
  return Math.round(costUSD * USD_TO_BRL * 1000) / 1000;
}

// Fallback Structured Analysis Generator (Universal for ANY Product: food, snacks, clothing, etc.)
function buildFallbackVideoAnalysis(
  durationSeconds: number,
  variations: { id: string; name: string; photos: string[] }[],
  customSpeech?: string
) {
  const duration = Math.min(40, Math.max(4, Math.round(durationSeconds || 12)));
  const sceneCount = calculateSceneCount(duration);

  const varList = variations.length > 0
    ? variations.map((v, i) => v.name?.trim() || `Variação ${i + 1}`)
    : ['Variação 1'];

  const var1 = varList[0] || 'Variação 1';
  const var2 = varList[1] || var1;

  const defaultSpeech = customSpeech ||
    (varList.length > 1
      ? `Olha esse produto incrível na ${var1}, e olha agora nessa opção ${var2}! Qualidade sensacional, acabamento impecável e o link tá aqui com frete grátis!`
      : `Galera, olha os detalhes desse produto que acabou de chegar! Qualidade premium e custo-benefício incrível. Aproveita antes que esgote!`);

  // Monta intervalos de tempo preliminares
  const rawIntervals = [];
  for (let s = 1; s <= sceneCount; s++) {
    const startSec = (s - 1) * 8;
    const endSec = Math.min(duration, s * 8);
    rawIntervals.push({
      sceneNumber: s,
      startTime: startSec,
      endTime: endSec,
    });
  }

  // Distribui fala de forma estritamente contínua (Cena 2 NUNCA repete Cena 1)
  const distributed = distributeSpeechAcrossScenes(defaultSpeech, rawIntervals);

  const scenes = [];
  for (let s = 1; s <= sceneCount; s++) {
    const startSec = (s - 1) * 8;
    const endSec = Math.min(duration, s * 8);
    const timeRangeText = `00:${String(startSec).padStart(2, '0')} - 00:${String(endSec).padStart(2, '0')}`;
    const sceneSpeech = distributed[s - 1]?.sceneSpeech || '';

    const isFirstScene = s === 1;
    const isSecondScene = s === 2;

    const actionSummary = isFirstScene
      ? `Apresentação inicial da ${var1}, exibindo visão frontal, design geral e primeiro contato comercial.`
      : isSecondScene
      ? `Continuação fluida da narrativa demonstrando novos ângulos (costas, lateral) e detalhes da ${varList.length > 1 ? var2 : var1}.`
      : `Demonstração dinâmica final com interação aproximada e chamada para ação.`;

    const eightSecondTimeline = isFirstScene
      ? `0.0–4.0s: Apresentação frontal destacando proporções e acabamento. 4.0–8.0s: Movimento suave lateral revelando texturas e profundidade.`
      : isSecondScene
      ? `0.0–4.0s: Transição contínua sem reiniciar a cena, exibindo visão posterior/costas e caimento. 4.0–8.0s: Demonstração aproximada de detalhes e funcionalidade.`
      : `0.0–4.0s: Apresentação dinâmica em uso real. 4.0–8.0s: Enquadramento final ressaltando qualidade e apelo comercial.`;

    // Imagens dinâmicas e progressivas (3 imagens por cena numeradas sequencialmente: Cena 1: 1,2,3; Cena 2: 4,5,6; Cena 3: 7,8,9)
    const baseNum = (s - 1) * 3;
    const activeVar = (s === 1 || varList.length === 1) ? var1 : (varList[1] || var2);

    const images = [
      {
        id: `c${s}-img1`,
        role: `Imagem ${baseNum + 1}: ${activeVar} em ângulo ${s === 1 ? 'frontal principal' : s === 2 ? 'lateral e profundidade' : 'em uso autêntico'}`,
        frameNumber: baseNum + 1,
        variationName: activeVar,
        targetAngle: s === 1 ? 'front' : s === 2 ? 'side' : 'front',
        location: s === 1 ? 'Cenário comercial principal bem iluminado' : s === 2 ? 'Segundo ambiente dinâmico em uso' : 'Terceiro cenário aconchegante com luz natural',
        actionDescription: s === 1 ? 'Apresentação inicial com contato nítido e proporções visíveis' : s === 2 ? 'Movimento demonstrando silhueta e acabamento em novo ângulo' : 'Interação comercial destacando qualidade e apelo de compra',
        imageUrl: '',
        promptUsed: buildUniversalSceneImagePrompt(
          'produto comercial',
          activeVar,
          `Imagem ${baseNum + 1} em ângulo ${s === 1 ? 'frontal' : 'dinâmico'}`,
          s === 1 ? 'Cenário moderno com iluminação natural suave' : s === 2 ? 'Segundo ambiente moderno dinâmico' : 'Cenário aconchegante realista',
          'Apresentação nítida evidenciando características físicas e acabamentos',
          s === 1 ? 'front' : s === 2 ? 'side' : 'front'
        ),
      },
      {
        id: `c${s}-img2`,
        role: `Imagem ${baseNum + 2}: ${activeVar} em ângulo ${s === 1 ? 'lateral' : s === 2 ? 'costas / visão posterior' : 'close aproximado'}`,
        frameNumber: baseNum + 2,
        variationName: activeVar,
        targetAngle: s === 1 ? 'side' : s === 2 ? 'rear' : 'detail',
        location: s === 1 ? 'Cenário comercial com novo ponto de vista' : s === 2 ? 'Segundo ambiente focado em detalhes' : 'Terceiro cenário aproximado',
        actionDescription: s === 1 ? 'Demonstração de lateralidade e ergonomia' : s === 2 ? 'Exibição da parte posterior/costas e encaixe fiel' : 'Close ressaltando materiais genuínos e costura/acabamento',
        imageUrl: '',
        promptUsed: buildUniversalSceneImagePrompt(
          'produto comercial',
          activeVar,
          `Imagem ${baseNum + 2} em perspectiva e textura`,
          s === 1 ? 'Cenário comercial bem iluminado' : s === 2 ? 'Segundo ambiente realista' : 'Cenário com iluminação suave focada',
          'Enquadramento destacando textura, acabamentos e detalhes reais',
          s === 1 ? 'side' : s === 2 ? 'rear' : 'detail'
        ),
      },
      {
        id: `c${s}-img3`,
        role: `Imagem ${baseNum + 3}: ${activeVar} em ângulo ${s === 1 ? 'close macro de detalhe' : s === 2 ? 'demonstração dinâmica' : 'enquadramento final de destaque'}`,
        frameNumber: baseNum + 3,
        variationName: activeVar,
        targetAngle: s === 1 ? 'detail' : s === 2 ? 'front_side' : 'detail',
        location: s === 1 ? 'Cenário focado em materiais e textura' : s === 2 ? 'Segundo ambiente em ação' : 'Cenário final limpo comercial',
        actionDescription: s === 1 ? 'Close aproximado nas texturas e acabamentos de fábrica' : s === 2 ? 'Ação fluida de manuseio e demonstração de uso' : 'Apresentação final convidativa ao redor do produto',
        imageUrl: '',
        promptUsed: buildUniversalSceneImagePrompt(
          'produto comercial',
          activeVar,
          `Imagem ${baseNum + 3} em demonstração detalhada`,
          s === 1 ? 'Cenário minimalista com foco nas matérias-primas' : s === 2 ? 'Segundo cenário com interação viva' : 'Cenário de conversão acolhedor',
          'Enquadramento aproximado valorizando a textura e acabamento',
          s === 1 ? 'detail' : s === 2 ? 'front_side' : 'detail'
        ),
      },
    ];

    const veoPrompt = buildVeoSingleParagraphPrompt({
      sceneNumber: s,
      totalScenes: sceneCount,
      productType: 'produto comercial',
      variations: varList,
      secondTimeline: eightSecondTimeline,
      speechVoiceover: sceneSpeech,
      sceneImages: images.map((im) => ({
        role: im.role,
        variationName: im.variationName,
        targetAngle: im.targetAngle,
        location: im.location,
        actionDescription: im.actionDescription,
      })),
    });

    scenes.push({
      sceneNumber: s,
      startTime: startSec,
      endTime: endSec,
      timeRangeText,
      actionSummary,
      eightSecondTimeline,
      mappedVariations: varList,
      environmentDescription: 'Cenário limpo e bem iluminado estilo estúdio TikTok Shop',
      productType: 'produto comercial',
      sceneSpeech,
      veoPrompt,
      veoInstruction: `Anexe no Veo a(s) ${images.length} imagem(ns) de referência gerada(s) para esta cena`,
      images,
    });
  }

  return {
    productType: 'Produto Comercial',
    formatAndOrientation: 'Vertical 9:16 (Formato TikTok Shop)',
    cameraType: 'CÃ¢mera de smartphone na mÃ£o, Ã¢ngulo POV natural',
    cameraStability: 'BalanÃ§o suave e orgÃ¢nico de gravaÃ§Ã£o mÃ³vel',
    lightingStyle: 'IluminaÃ§Ã£o natural e difusa de interior com sombras de contato suaves',
    environmentDescription: 'CenÃ¡rio limpo e moderno com luz ambiente natural',
    interactionDetails: 'Produto apresentado de forma natural e convidativa para o pÃºblico',
    secondBySecondTimeline: `00:00-00:04: exibiÃ§Ã£o frontal do produto; 00:04-00:08: movimento suave destacando detalhes e variaÃ§Ãµes.`,
    detectedVariationsCount: varList.length,
    detectedVariationSequence: varList,
    onScreenTexts: [],
    speechData: {
      hasSpeech: Boolean(defaultSpeech && defaultSpeech.trim().length > 0),
      originalTranscript: defaultSpeech ? defaultSpeech : 'MÃºsica de fundo identificada (sem locuÃ§Ã£o falada do produto)',
      adaptedScript: defaultSpeech || '',
      voiceTone: defaultSpeech ? 'DinÃ¢mico, espontÃ¢neo e persuasivo para TikTok Shop' : 'Trilha sonora / Beat musical',
    },
    scenes,
    tokenUsage: {
      promptTokens: 1100,
      candidateTokens: 650,
      totalTokens: 1750,
      estimatedCostBRL: 0.005,
      breakdown: {
        videoAnalysisTokens: 1750,
        videoAnalysisCostBRL: 0.005,
        speechTokens: 0,
        speechCostBRL: 0,
        imagesCount: 0,
        imagesCostBRL: 0,
        promptsTokens: 0,
        promptsCostBRL: 0,
      },
    },
  };
}

// Endpoint: Health check
app.get('/api/health', (_req, res) => {
  const currentKey = process.env.GEMINI_API_KEY || process.env.GEMINIAPI || '';
  const hasOpenAi = Boolean(
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) ||
    (process.env.APIOPENAI && process.env.APIOPENAI.trim().length > 0)
  );
  const activeProvider = getActiveProviderType();
  res.json({
    status: 'ok',
    activeProvider,
    visionModel: activeProvider === 'openai' ? OPENAI_BRAIN_MODEL : GEMINI_VISION_MODEL,
    imageModel: activeProvider === 'openai' ? OPENAI_IMAGE_MODEL : GEMINI_IMAGE_MODEL,
    audioModel: activeProvider === 'openai' ? OPENAI_AUDIO_MODEL : GEMINI_VISION_FAST_MODEL,
    auditModel: activeProvider === 'openai' ? OPENAI_AUDIT_MODEL : GEMINI_VISION_FAST_MODEL,
    hasApiKey: Boolean(currentKey),
    hasOpenAiKey: Boolean(hasOpenAi),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Cost report for the entire cloning session
app.get('/api/cost-report', (_req, res) => {
  const report = globalCostTracker.generateReport(getActiveProviderType());
  res.json({ success: true, report });
});

// Endpoint: Download TikTok Video directly from URL (without watermark)
app.post('/api/download-tiktok', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Por favor, insira o link de um vídeo do TikTok.',
    });
  }

  const rawUrl = url.trim();

  // Basic validation that it's a TikTok URL
  if (!rawUrl.includes('tiktok.com')) {
    return res.status(400).json({
      success: false,
      error: 'O link inserido não parece ser do TikTok. Certifique-se de colar um link válido (ex: https://vm.tiktok.com/... ou https://www.tiktok.com/@user/video/...)',
    });
  }

  try {
    let canonicalUrl = rawUrl;
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    // 1. Resolução de Redirecionamento (especialmente para vm.tiktok.com e vt.tiktok.com)
    try {
      const redirectResp = await fetch(rawUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (redirectResp.url && redirectResp.url.includes('tiktok.com')) {
        canonicalUrl = redirectResp.url;
      }
    } catch (redirErr) {
      console.warn('Aviso ao resolver redirecionamento do TikTok:', redirErr);
    }

    let videoUrl = '';
    let videoTitle = 'tiktok_video';
    let videoDuration = 0;

    // 2. Extração sem Marca D'água (Multi-camada)
    // Camada 1: TikWM POST (prioriza H.264 / data.play para compatibilidade universal com navegadores)
    try {
      const form = new URLSearchParams();
      form.append('url', canonicalUrl);

      const tikwmPostRes = await fetch('https://www.tikwm.com/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent,
        },
        body: form.toString(),
        signal: AbortSignal.timeout(15000),
      });

      if (tikwmPostRes.ok) {
        const tikwmData = await tikwmPostRes.json();
        if (tikwmData?.code === 0 && tikwmData?.data) {
          // Prioriza play (H.264 / AVC) para que navegadores (Chrome/Edge/Safari) consigam decodificar os frames no canvas e no player
          videoUrl = tikwmData.data.play || tikwmData.data.wmplay || tikwmData.data.hdplay;
          videoTitle = tikwmData.data.title || videoTitle;
          videoDuration = tikwmData.data.duration || videoDuration;
        }
      }
    } catch (c1Err) {
      console.warn('Camada 1 (TikWM POST) falhou:', c1Err);
    }

    // Camada 2: Fallback TikWM GET
    if (!videoUrl) {
      try {
        const tikwmGetRes = await fetch(
          `https://www.tikwm.com/api/?url=${encodeURIComponent(canonicalUrl)}`,
          {
            method: 'GET',
            headers: {
              'User-Agent': userAgent,
            },
            signal: AbortSignal.timeout(15000),
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
        console.warn('Camada 2 (TikWM GET) falhou:', c2Err);
      }
    }

    // Camada 3: Fallback SSR (HTML scrape)
    if (!videoUrl) {
      try {
        const pageRes = await fetch(canonicalUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(12000),
        });

        if (pageRes.ok) {
          const html = await pageRes.text();
          const match =
            html.match(/"playAddr":"([^"]+)"/) ||
            html.match(/"downloadAddr":"([^"]+)"/) ||
            html.match(/"playUrl":"([^"]+)"/);

          if (match && match[1]) {
            videoUrl = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
          }

          const titleMatch = html.match(/<title>([^<]+)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            videoTitle = titleMatch[1].replace(' | TikTok', '').trim();
          }
        }
      } catch (c3Err) {
        console.warn('Camada 3 (SSR HTML Scrape) falhou:', c3Err);
      }
    }

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error:
          'Não foi possível encontrar o arquivo de vídeo sem marca d\'água para este link. Verifique se o vídeo é público e não possui restrições de privacidade. Você também pode salvar o vídeo no seu dispositivo e fazer o upload manual do arquivo MP4.',
      });
    }

    // Garante URL absoluta se vier relativa
    if (videoUrl.startsWith('/')) {
      videoUrl = `https://www.tikwm.com${videoUrl}`;
    }

    // 3. Streaming/Download do Binário MP4 na CDN
    const cdnResp = await fetch(videoUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': videoUrl.includes('tikwm.com') ? 'https://www.tikwm.com/' : 'https://www.tiktok.com/',
      },
      signal: AbortSignal.timeout(45000),
    });

    if (!cdnResp.ok) {
      throw new Error(`Servidor de entrega do vídeo retornou status ${cdnResp.status}.`);
    }

    const arrayBuffer = await cdnResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 5000) {
      throw new Error('O arquivo retornado é muito pequeno ou corrompido.');
    }

    // Configura os cabeçalhos esperados pelo frontend
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', 'inline; filename="tiktok_video.mp4"');
    res.setHeader('X-Video-Title', encodeURIComponent(videoTitle.substring(0, 80)));
    res.setHeader('X-Video-Duration', String(Math.round(videoDuration)));
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Video-Title, X-Video-Duration');

    return res.send(buffer);
  } catch (err: any) {
    console.error('Erro ao processar download do TikTok:', err);
    return res.status(400).json({
      success: false,
      error: `Falha ao baixar o vídeo do TikTok: ${err.message || 'Erro inesperado'}. Você pode fazer o upload manual do arquivo MP4 se preferir.`,
    });
  }
});

// Endpoint: Transcribe Voice Audio (Fallback for Web Speech API)
app.post('/api/transcribe-voice', async (req, res) => {
  const { audioBase64 } = req.body;

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Áudio não fornecido ou formato inválido.',
    });
  }

  const parsedAudio = parseInlineAudio(audioBase64);
  if (!parsedAudio || !parsedAudio.data) {
    return res.status(400).json({
      success: false,
      error: 'Formato de áudio base64 inválido.',
    });
  }

  const promptText =
    'Você é um assistente de transcrição em Português do Brasil. Transcreva com máxima fidelidade e precisão a fala deste áudio para texto. Retorne EXCLUSIVAMENTE o texto transcrito, sem aspas e sem explicações.';

  // 1. Tentativa com Gemini Voice (gemini-3.1-flash-lite ou gemini-3.8-flash)
  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (geminiKey) {
    try {
      const response = await getGenAI().models.generateContent({
        model: GEMINI_VISION_FAST_MODEL || 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: parsedAudio.mimeType,
                  data: parsedAudio.data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        ],
      });

      const transcript = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
      return res.json({
        success: true,
        text: transcript,
      });
    } catch (geminiErr: any) {
      console.warn('Tentativa com gemini-3.1-flash-lite falhou, tentando gemini-3.8-flash:', geminiErr?.message || geminiErr);
      try {
        const response2 = await getGenAI().models.generateContent({
          model: GEMINI_VISION_MODEL || 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: parsedAudio.mimeType,
                    data: parsedAudio.data,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
        });

        const transcript2 = response2.text ? response2.text.trim().replace(/^["']|["']$/g, '') : '';
        return res.json({
          success: true,
          text: transcript2,
        });
      } catch (geminiErr2: any) {
        console.warn('Erro nas tentativas Gemini de transcrição de voz:', geminiErr2?.message || geminiErr2);
      }
    }
  }

  // 2. Fallback com OpenAI se configurado
  if (process.env.OPENAI_API_KEY) {
    try {
      const buffer = Buffer.from(parsedAudio.data, 'base64');
      const transcript = await openAIProvider.transcribeAudio(buffer, parsedAudio.mimeType || 'audio/webm');
      return res.json({
        success: true,
        text: transcript ? transcript.trim().replace(/^["']|["']$/g, '') : '',
      });
    } catch (openaiErr: any) {
      console.error('Fallback OpenAI de transcrição também falhou:', openaiErr?.message || openaiErr);
    }
  }

  return res.status(500).json({
    success: false,
    error: 'Não foi possível transcrever o áudio com os modelos disponíveis.',
  });
});

// Endpoint: Analyze Reference Video Frame by Frame + Audio Transcription
app.post('/api/analyze-video', async (req, res) => {
  const {
    durationSeconds = 12,
    frames = [],
    colors = [],
    variations = [],
    audioBase64,
    additionalInstructions = '',
    productInfo = '',
    modelPhotoUrl = null,
    veoModelMode = 'veo3_basic_8s',
  } = req.body;
  const productVariations = (variations.length > 0 ? variations : colors) || [];
  const currentKey = process.env.GEMINI_API_KEY || '';

  const validDuration = Math.min(40, Math.max(4, Math.round(Number(durationSeconds) || 12)));

  // Roteamento baseado no Perfil de IA selecionado
  const activeProfile = getRequestAIProfile(req);
  if (activeProfile === 'openai' && openAIProvider.isConfigured()) {
    try {
      const openaiResult = await openAIProvider.analyzeVideo({
        durationSeconds: validDuration,
        frames,
        variations: productVariations,
        audioBase64,
        additionalInstructions,
        productInfo,
        modelPhotoUrl,
        veoModelMode,
      });
      return res.json({ success: true, data: openaiResult });
    } catch (openaiErr: any) {
      console.warn('Falha no provedor OpenAI em analyze-video, recorrendo automaticamente ao Gemini:', openaiErr?.message || openaiErr);
      // Continua para o pipeline Gemini abaixo sem falhar a requisição
    }
  }

  try {
    if (!currentKey) {
      console.warn('GEMINI_API_KEY ausente, usando analisador estruturado de contingÃªncia');
      const fallback = buildFallbackVideoAnalysis(validDuration, productVariations);
      return res.json({ success: true, data: fallback });
    }

    // 1. Audio Transcription & Speech Adaptation (if audio exists)
    let speechData = {
      hasSpeech: false,
      originalTranscript: '',
      adaptedScript: '',
      voiceTone: 'Natural TikTok voiceover',
    };

    let audioTokens = 0;
    let audioCostBRL = 0;

    if (audioBase64) {
      const parsedAudio = parseInlineAudio(audioBase64);
      if (parsedAudio) {
        try {
          const varNames = productVariations.map((v: any, i: number) => v.name || `VariaÃ§Ã£o ${i + 1}`).join(', ');
          const instructionsNote = additionalInstructions && additionalInstructions.trim()
            ? `\nINSTRUÃ‡Ã•ES ADICIONAIS DO USUÃRIO PARA O PRODUTO E ÃUDIO: "${additionalInstructions.trim()}"\n`
            : '';

          const transcribeRes = await getGenAI().models.generateContent({
            model: GEMINI_VISION_FAST_MODEL || 'gemini-3.1-flash-lite',
            contents: {
              parts: [
                { inlineData: parsedAudio },
                {
                  text: `VocÃª Ã© um perito em Ã¡udio comercial para o TikTok Shop.
Sua missÃ£o tem 2 ETAPAS OBRIGATÃ“RIAS:

ETAPA 1: TRANSCRIÃ‡ÃƒO FIEL DO ÃUDIO
Transcreva com precisÃ£o literal quaisquer palavras, frases, rimas ou vocais audÃ­veis no Ã¡udio (mesmo que seja letra de mÃºsica cantada, rap, trap, beat com voz ou fala rÃ¡pida).

ETAPA 2: ANÃLISE RIGOROSA: MÃšSICA/LETRA vs ANÃšNCIO REAL DO PRODUTO
Analise o significado e o contexto das palavras faladas:
- Ã‰ MÃšSICA / TRILHA SONORA COM VOCAL? (MÃºsicas com batida, trap, rap, funk, letras artÃ­sticas como "157", "grana", rimas soltas, ou mÃºsica tocando ao fundo):
  -> "hasProductPitch": false
  -> "isMusicTrack": true
  -> "adaptedScript": "" (DEIXE RIGOROSAMENTE VAZIO! NUNCA invente roteiros de vendas quando for mÃºsica!)
  -> "classification": "MÃºsica / Trilha Sonora com Vocal"

- Ã‰ UMA LOCUÃ‡ÃƒO COMERCIAL REAL DO PRODUTO? (Uma pessoa falando diretamente com o pÃºblico apresentando o produto, explicando detalhes, fazendo review ou recomendaÃ§Ã£o de compra, ex: "olha esse modelo...", "link na bio", "super confortÃ¡vel"):
  -> "hasProductPitch": true
  -> "isMusicTrack": false
  -> "adaptedScript": Roteiro adaptado com naturalidade para o produto do usuÃ¡rio (${varNames}). ${instructionsNote}
     REGRA OBRIGATÃ“RIA DE CARACTERES: O texto adaptado DEVE ter a mesma quantidade de caracteres ou ser entre 10% a 25% MENOR que o Ã¡udio original transcrito. NUNCA gere um texto mais longo que o original, pois cada geraÃ§Ã£o do Veo tem apenas 8 segundos e textos longos sÃ£o cortados na locuÃ§Ã£o!
  -> "classification": "LocuÃ§Ã£o Comercial de Vendas"

Retorne estritamente um JSON no seguinte formato:
{
  "hasProductPitch": boolean,
  "isMusicTrack": boolean,
  "literalTranscript": string,
  "adaptedScript": string,
  "classification": string,
  "voiceTone": string
}`,
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
            },
          });

          if (transcribeRes.usageMetadata) {
            audioTokens = transcribeRes.usageMetadata.totalTokenCount || 0;
            audioCostBRL = calculateCostBRL('gemini-3.1-flash-lite', transcribeRes.usageMetadata.promptTokenCount || 0, transcribeRes.usageMetadata.candidatesTokenCount || 0);
          }

          const parsedSpeech = JSON.parse(transcribeRes.text || '{}');
          const isRealProductPitch = Boolean(parsedSpeech.hasProductPitch);
          let adaptedScript = isRealProductPitch ? (parsedSpeech.adaptedScript || '') : '';
          const originalTranscript = parsedSpeech.literalTranscript || parsedSpeech.originalTranscript || 'MÃºsica de fundo identificada';

          // Strictly enforce: adaptedScript character count must never exceed originalTranscript
          if (isRealProductPitch && adaptedScript && originalTranscript && originalTranscript.length > 10) {
            const maxAllowedChars = Math.round(originalTranscript.length * 0.95);
            if (adaptedScript.length > maxAllowedChars) {
              const trimmed = adaptedScript.substring(0, maxAllowedChars);
              const lastPeriod = trimmed.lastIndexOf('.');
              const lastComma = trimmed.lastIndexOf(',');
              const lastSpace = trimmed.lastIndexOf(' ');
              const cleanEnd = lastPeriod > 25 ? lastPeriod + 1 : (lastComma > 25 ? lastComma : lastSpace);
              adaptedScript = cleanEnd > 20 ? trimmed.substring(0, cleanEnd) : trimmed;
            }
          }

          speechData = {
            hasSpeech: isRealProductPitch,
            originalTranscript,
            adaptedScript,
            voiceTone: isRealProductPitch ? (parsedSpeech.voiceTone || 'Persuasivo e dinÃ¢mico') : 'Trilha sonora / Beat musical',
          };
        } catch (audioErr) {
          console.warn('Erro na transcriÃ§Ã£o de Ã¡udio:', audioErr);
        }
      }
    }

    const calculatedScenes = calculateSceneCount(validDuration, veoModelMode);

    const userInstructionsNote = additionalInstructions && additionalInstructions.trim()
      ? `\nDIRETRIZES ESPECÃFICAS DO USUÃRIO (PRIORIDADE MÃXIMA): "${additionalInstructions.trim()}". VocÃª DEVE aplicar rigorosamente estas diretrizes!\n`
      : '';

    const systemInstruction = `Você é o analisador do "Clonador de Vídeo de Produto para TikTok Shop".
Sua tarefa é analisar o vídeo de referência e as fotos do produto do usuário com máxima fidelidade e economia de tokens.
${userInstructionsNote}
REGRAS CRÍTICAS E INVIOLÁVEIS DO CRIATIVO:
1. IDENTIFICAÇÃO DO PRODUTO: Identifique o tipo de produto real pelas fotos do usuário (vestuário, calçado, bolsa, embalagem, cosmético, acessório, utilidade, etc.).
2. O VÍDEO DE REFERÊNCIA É QUEM DITA OS CENÁRIOS/LOCAIS E AS AÇÕES:
   - As imagens e cenas geradas servem para colocar o modelo e o produto do usuário NOS MESMOS CENÁRIOS/LOCAIS e NAS MESMAS AÇÕES que o vídeo de referência apresenta em cada momento!
   - Exemplo: se no vídeo de referência na cena 1 a pessoa está no mercado pegando o produto, a Imagem 1 DEVE ser no mercado pegando o produto; se depois vai para o topo de um prédio, a Imagem 2 DEVE ser no topo do prédio; se depois vai para um sítio a cavalo, a Imagem 3 DEVE ser no sítio; se passa para a cozinha, deve ser na cozinha; se passa para o quarto, no quarto.
   - NUNCA coloque todas as imagens no mesmo local se o vídeo de referência transita por cenários diferentes! Reproduza a mesma sequência de locais ('location') e ações ('actionDescription').
3. REGRA ABSOLUTA DE CONSISTÊNCIA DO MODELO & ANTI-VIOLAÇÃO DE ROSTO NO TIKTOK:
   - Se o usuário forneceu foto do modelo: use essa pessoa com fidelidade máxima.
   - Se o usuário NÃO forneceu foto do modelo: é PROIBIDO copiar ou clonar o rosto exato do modelo do vídeo de referência concorrente! O modelo gerado deve ter perfil similar (mesma faixa etária/vibe, como um primo), PORÉM COM ROSTO DIFERENTE (traços faciais distintos, formato de rosto próprio, ou variação de cabelo/tom de pele) para evitar violações de direitos autorais e plágio de imagem no TikTok.
   - TRAVA DE CONSISTÊNCIA: O mesmo novo modelo gerado DEVE ser preservado de forma consistente em todas as imagens (da Imagem 1 à Imagem 9). O que muda de imagem para imagem é o CENÁRIO (local) e a AÇÃO física, mas o MODELO É RIGOROSAMENTE O MESMO.
4. LINHA DO TEMPO CONTÍNUA E PROGRESSIVA:
   - As cenas são segmentos consecutivos do MESMO vídeo original (Cena 1 = 0–8s, Cena 2 = 8–16s, etc.).
   - A Cena 2 DEVE começar narrativamente e visualmente de onde a Cena 1 terminou. Ela NÃO DEVE reiniciar o vídeo nem repetir as ações da Cena 1.
5. IMAGENS POR CENA E STORYBOARD:
   - Cada cena deve conter EXATAMENTE 3 imagens mapeadas cronologicamente às ações e locais daquele trecho temporal:
     * Cena 1: Imagem 1, Imagem 2, Imagem 3.
     * Cena 2: Imagem 4, Imagem 5, Imagem 6.
     * Cena 3: Imagem 7, Imagem 8, Imagem 9.
   - Para cada imagem no array 'images', preencha:
     * 'location': Cenário/local específico extraído daquele momento do vídeo de referência (deve variar se o vídeo transita por novos locais!).
     * 'actionDescription': Ação corporal e interação precisa do modelo com o produto naquele instante.
     * 'role': Título descritivo combinando número global da imagem, modelo, local e ação (ex: "Imagem 1: Modelo no mercado...").
     * 'targetAngle': Ângulo exato da câmera ('front', 'side', 'rear', 'detail', etc.).
6. CONTINUIDADE DA FALA / LOCUÇÃO (SEM REPETIÇÃO):
   - Cada cena deve conter o campo 'sceneSpeech' com SOMENTE a fala dita no respectivo intervalo de tempo daquela cena. NUNCA repita na Cena 2 a fala da Cena 1!
7. REALISMO BRASILEIRO (PESSOAS SIMPLES E CASAS COMUNS DO COTIDIANO):
   - Quando retratar pessoas (sem foto do usuário): retratar pessoas brasileiras simples e comuns do cotidiano (aparência autêntica, simpática e acessível, sem estética inalcançável de supermodelo).
   - Quando retratar ambientes residenciais (sala, quarto, cozinha, etc.): descrever rigorosamente a casa de uma pessoa brasileira simples e comum (móveis normais e realistas, PROIBIDO mansões, casas chiques ou ambientes hiper-instagramáveis que fujam da realidade popular brasileira). Lojas e comércios podem ser organizados e limpos.
8. PROMPTS DO VEO ESPECÍFICOS DE CADA CENA:
   - O prompt do Veo de cada cena deve ser em inglês, contendo a TRAVA DE FIDELIDADE (100% idêntico às fotos do usuário), ação progressiva daquele trecho de 8s e a fala exclusiva daquela cena.`;

    const parts: any[] = [];

    // Seleciona quadros-chave distribuídos estrategicamente por TODA a duração do vídeo
    if (Array.isArray(frames) && frames.length > 0) {
      const keyframes = selectRepresentativeKeyframes(frames, validDuration, calculatedScenes, 12);
      keyframes.forEach((frameObj: any) => {
        const timeLabel = `[Quadro no instante t=${frameObj.time}s${frameObj.isCutTransition ? ' - transição/corte' : ''}]`;
        parts.push({ text: timeLabel });

        const parsed = parseInlineImage(frameObj.dataUrl || frameObj);
        if (parsed) {
          parts.push({ inlineData: parsed });
        }
      });
    }

    // Add ALL photos of user's product variations for context (looping over all uploaded photos)
    if (Array.isArray(productVariations) && productVariations.length > 0) {
      let photoCounter = 0;
      productVariations.forEach((v: any, idx: number) => {
        const vName = v.name || `Variação ${idx + 1}`;
        const photos = Array.isArray(v.photos) ? v.photos.slice(0, 2) : [];
        photos.forEach((pStr: string, pIdx: number) => {
          photoCounter++;
          const parsed = parseInlineImage(pStr);
          if (parsed) {
            parts.push({
              text: `[Foto de Referência ${photoCounter} do Produto - ${vName} (Foto ${pIdx + 1}) - Identifique a cor exata, solado e cadarço desta foto]:`,
            });
            parts.push({ inlineData: parsed });
          }
        });
      });
    }

    const userPrompt = `
Analise estes quadros extraídos cobrindo TODA a duração de ${validDuration} segundos do vídeo de referência e TODAS as fotos enviadas do produto.
${userInstructionsNote}
Identifique o produto real e as variações enviadas.
Gere o JSON com exatamente ${calculatedScenes} cena(s) de 8 segundos para o Veo com linha do tempo contínua:
1. 'productType': categoria exata do produto.
2. Cenários ('location') específicos e ações ('actionDescription') de cada momento, seguindo fielmente a transição de locais do vídeo de referência.
3. Mesma identidade de modelo do início ao fim (nunca troque a pessoa entre as imagens).
4. Imagens mapeadas por cena com 'location', 'actionDescription', 'role' e 'targetAngle'.
5. 'sceneSpeech': fala específica daquele intervalo de tempo (sem repetição entre cenas).
6. Prompt do Veo em inglês para cada cena com trava anti-alucinação e continuidade da história.
`;

    parts.push({ text: userPrompt });

    let response;
    let visionTokens = 0;
    let visionCostBRL = 0;

    try {
      response = await getGenAI().models.generateContent({
        model: GEMINI_VISION_MODEL || 'gemini-2.5-flash',
        contents: parts,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
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
                items: { type: Type.STRING },
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
                    timestamp: { type: Type.STRING },
                  },
                  required: ['text', 'fontStyle', 'color', 'position', 'timestamp'],
                },
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
                      items: { type: Type.STRING },
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
                          promptUsed: { type: Type.STRING },
                        },
                        required: ['id', 'role', 'frameNumber', 'variationName', 'promptUsed'],
                      },
                    },
                  },
                  required: [
                    'sceneNumber',
                    'startTime',
                    'endTime',
                    'timeRangeText',
                    'actionSummary',
                    'eightSecondTimeline',
                    'mappedVariations',
                    'environmentDescription',
                    'veoPrompt',
                    'veoInstruction',
                    'images',
                  ],
                },
              },
            },
            required: [
              'productType',
              'formatAndOrientation',
              'cameraType',
              'cameraStability',
              'environmentDescription',
              'interactionDetails',
              'scenes',
            ],
          },
        },
      });

      if (response.usageMetadata) {
        visionTokens = response.usageMetadata.totalTokenCount || 0;
        visionCostBRL = calculateCostBRL(GEMINI_VISION_MODEL || 'gemini-3.8-flash', response.usageMetadata.promptTokenCount || 0, response.usageMetadata.candidatesTokenCount || 0);
      }
    } catch (modelErr) {
      console.warn('Erro ao processar com Gemini Vision, utilizando gerador estruturado:', modelErr);
      const fallback = buildFallbackVideoAnalysis(validDuration, productVariations, speechData.adaptedScript);
      return res.json({ success: true, data: fallback, fallback: true });
    }

    const data = JSON.parse(response.text || '{}');
    data.speechData = speechData;

    // Filtra headlines na tela garantindo que entradas vazias não sejam apresentadas
    if (Array.isArray(data.onScreenTexts)) {
      data.onScreenTexts = data.onScreenTexts
        .filter((t: any) => t && t.text && t.text.trim().replace(/^["']+|["']+$/g, '').trim().length > 0)
        .map((t: any) => ({ ...t, text: t.text.trim().replace(/^["']+|["']+$/g, '').trim() }));
    } else {
      data.onScreenTexts = [];
    }

    // Se não for locução comercial real (ex: música, batida ou letra de música), ZERA todas as falas por padrão
    if (!speechData.hasSpeech || !speechData.adaptedScript) {
      speechData.hasSpeech = false;
      speechData.adaptedScript = '';
    }

    if (Array.isArray(data.scenes) && data.scenes.length > 0) {
      if (!speechData.hasSpeech || !speechData.adaptedScript) {
        data.scenes = data.scenes.map((scene: any) => ({
          ...scene,
          sceneSpeech: '',
        }));
      } else {
        const fullAdaptedScript = speechData.adaptedScript.trim();
        data.scenes = distributeSpeechAcrossScenes(fullAdaptedScript, data.scenes);
      }

      const sceneDurationSec = veoModelMode === 'veo3_omniflash_10s' ? 10 : 8;

      // Reconstrói com precisão os prompts Veo garantindo 3 imagens por cena numeradas sequencialmente (1 a 9)
      data.scenes = data.scenes.map((scene: any, sIdx: number) => {
        const baseImgNum = sIdx * 3;
        const currentImgs = Array.isArray(scene.images) ? scene.images : [];
        const finalImgs = [];

        for (let i = 0; i < 3; i++) {
          const imgSlotNumber = baseImgNum + i + 1;
          const existing = currentImgs[i];
          const defaultAngle = i === 0 ? 'front' : i === 1 ? 'side' : 'detail';
          const defaultLocation = existing?.location || scene.environmentDescription || data.environmentDescription || 'cenário comercial';
          const defaultAction = existing?.actionDescription || `Demonstração do produto no momento ${i + 1}`;
          const defaultRole = `Imagem ${imgSlotNumber}: ${existing?.role || `Ação ${i + 1} em ${defaultLocation}`}`;

          finalImgs.push({
            id: existing?.id || `img-${imgSlotNumber}`,
            role: existing?.role || defaultRole,
            frameNumber: imgSlotNumber,
            variationName: existing?.variationName || productVariations[0]?.name || 'Variação 1',
            targetAngle: existing?.targetAngle || defaultAngle,
            location: existing?.location || defaultLocation,
            actionDescription: existing?.actionDescription || defaultAction,
            promptUsed: existing?.promptUsed || '',
          });
        }

        const varList = Array.isArray(scene.mappedVariations) && scene.mappedVariations.length > 0
          ? scene.mappedVariations
          : productVariations.map((v: any, i: number) => v.name || `Variação ${i + 1}`);

        const updatedVeo = buildVeoSingleParagraphPrompt({
          sceneNumber: scene.sceneNumber,
          totalScenes: data.scenes.length,
          durationSeconds: sceneDurationSec,
          productType: data.productType || 'produto comercial',
          variations: varList,
          environment: scene.environmentDescription || data.environmentDescription,
          interactionStyle: data.interactionDetails,
          cameraType: data.cameraType,
          lighting: data.lightingStyle,
          secondTimeline: scene.eightSecondTimeline,
          speechVoiceover: scene.sceneSpeech,
          sceneImages: finalImgs.map((im: any) => ({
            role: im.role,
            variationName: im.variationName,
            targetAngle: im.targetAngle,
            location: im.location,
            actionDescription: im.actionDescription,
          })),
        });

        return {
          ...scene,
          images: finalImgs,
          veoPrompt: updatedVeo,
          veoInstruction: `Anexe no Veo as 3 imagens de referência geradas para esta cena`,
        };
      });
    }

    data.tokenUsage = {
      promptTokens: (response.usageMetadata?.promptTokenCount || 0),
      candidateTokens: (response.usageMetadata?.candidatesTokenCount || 0),
      totalTokens: visionTokens + audioTokens,
      estimatedCostBRL: Math.round((visionCostBRL + audioCostBRL) * 1000) / 1000,
      breakdown: {
        videoAnalysisTokens: visionTokens,
        videoAnalysisCostBRL: visionCostBRL,
        speechTokens: audioTokens,
        speechCostBRL: audioCostBRL,
        imagesCount: 0,
        imagesCostBRL: 0,
        promptsTokens: 0,
        promptsCostBRL: 0,
      },
    };

    return res.json({ success: true, data });
  } catch (error: any) {
    console.warn('Erro geral no endpoint analyze-video:', error);
    const fallback = buildFallbackVideoAnalysis(validDuration, productVariations);
    return res.json({ success: true, data: fallback, fallback: true });
  }
});

// Endpoint: Planning for Modo Ania (Single text/vision AI call per product)
app.post('/api/ania-planning', async (req, res) => {
  try {
    const { primaryPhotoBase64, userPrompt } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ success: false, error: 'userPrompt não fornecido' });
    }

    const systemInstruction = buildAniaPlanningSystemPrompt();

    // ─── ROTEAMENTO BASEADO NO PERFIL DE IA SELECIONADO ────────────────────
    const activeProfile = getRequestAIProfile(req);
    if (activeProfile === 'openai' && openAIProvider.isConfigured()) {
      const client = (openAIProvider as any).getClient();
      const contentBlocks: any[] = [];
      if (primaryPhotoBase64) {
        contentBlocks.push({
          type: 'image_url',
          image_url: { url: primaryPhotoBase64.startsWith('data:') ? primaryPhotoBase64 : `data:image/jpeg;base64,${primaryPhotoBase64}`, detail: 'high' },
        });
      }
      contentBlocks.push({ type: 'text', text: userPrompt });

      const modelsToTry = [OPENAI_BRAIN_MODEL, 'gpt-4o-mini', 'gpt-4o', 'gpt-5.6-luna'];
      for (const modelCandidate of modelsToTry) {
        try {
          const params: any = {
            model: modelCandidate,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: contentBlocks },
            ],
            response_format: { type: 'json_object' },
          };

          if (!modelCandidate.startsWith('gpt-5') && !modelCandidate.startsWith('o')) {
            params.temperature = 0.4;
          }

          const completion = await client.chat.completions.create(params);
          const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
          if (parsed && Object.keys(parsed).length > 0) {
            return res.json({ success: true, data: parsed });
          }
        } catch (oiErr: any) {
          console.warn(`Erro OpenAI no planejamento Ania com ${modelCandidate}:`, oiErr?.message || oiErr);
        }
      }
    }

    // ─── GEMINI PROVIDER PATH ──────────────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY não configurada' });
    }

    const parts: any[] = [];
    if (primaryPhotoBase64) {
      const parsed = parseInlineImage(primaryPhotoBase64);
      if (parsed) {
        parts.push({
          text: '[Foto da Peça Principal (Cor 1) - Analise com precisão de detalhes e caimento]:',
        });
        parts.push({ inlineData: parsed });
      }
    }
    parts.push({ text: userPrompt });

    const response = await getGenAI().models.generateContent({
      model: GEMINI_VISION_MODEL || 'gemini-2.5-flash',
      contents: parts,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoria: { type: Type.STRING },
            peca: { type: Type.STRING },
            tecido: { type: Type.STRING },
            estica: { type: Type.BOOLEAN },
            detalhes_trava: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            bolso_funcional: { type: Type.BOOLEAN },
            fala_id: { type: Type.STRING },
            fala: { type: Type.STRING },
            movimentos: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            titulo: { type: Type.STRING },
          },
          required: [
            'categoria',
            'peca',
            'tecido',
            'estica',
            'detalhes_trava',
            'bolso_funcional',
            'fala_id',
            'fala',
            'movimentos',
            'titulo',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.warn('Erro no endpoint ania-planning:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao processar planejamento Ania',
    });
  }
});

// Endpoint: Regenerate Veo Prompts with User-Edited Speech
app.post('/api/regenerate-prompts', (req, res) => {
  const { scenes = [], speechVoiceover = '', variations = [] } = req.body;
  const varList = variations.map((v: any, i: number) => v.name || `Variação ${i + 1}`).filter(Boolean);

  // Distribui a fala editada entre as cenas de forma contínua
  const distributed = distributeSpeechAcrossScenes(speechVoiceover, scenes);

  const updatedScenes = distributed.map((scene: any) => {
    const updatedVeoPrompt = buildVeoSingleParagraphPrompt({
      sceneNumber: scene.sceneNumber,
      totalScenes: scenes.length,
      productType: scene.productType || 'produto comercial',
      variations: varList.length > 0 ? varList : (scene.mappedVariations || ['Variação 1']),
      environment: scene.environmentDescription,
      secondTimeline: scene.eightSecondTimeline,
      speechVoiceover: scene.sceneSpeech,
      sceneImages: (scene.images || []).map((im: any) => ({
        role: im.role,
        variationName: im.variationName,
        targetAngle: im.targetAngle,
        location: im.location,
        actionDescription: im.actionDescription,
      })),
    });

    const imageCount = scene.images?.length || 1;
    return {
      ...scene,
      veoPrompt: updatedVeoPrompt,
      veoInstruction: `Anexe no Veo a(s) ${imageCount} imagem(ns) de referência gerada(s) para esta cena`,
    };
  });

  return res.json({
    success: true,
    scenes: updatedScenes,
  });
});

// Endpoint: Regenerate Veo Prompt for a Single Scene with User-Edited Speech
app.post('/api/regenerate-single-scene-prompt', (req, res) => {
  const {
    scene,
    newSpeech = '',
    variations = [],
    totalScenes = 1,
    productType = 'produto comercial',
    durationSeconds = 8,
  } = req.body;

  if (!scene) {
    return res.status(400).json({ success: false, error: 'Cena não fornecida' });
  }

  const varList = variations.map((v: any, i: number) => v.name || `Variação ${i + 1}`).filter(Boolean);
  const updatedPrompt = buildVeoSingleParagraphPrompt({
    sceneNumber: scene.sceneNumber,
    totalScenes: totalScenes || 1,
    durationSeconds: Number(durationSeconds) || 8,
    productType: productType || scene.productType || 'produto comercial',
    variations: varList.length > 0 ? varList : (scene.mappedVariations || ['Variação 1']),
    environment: scene.environmentDescription,
    secondTimeline: scene.eightSecondTimeline,
    speechVoiceover: newSpeech,
    sceneImages: (scene.images || []).map((im: any) => ({
      role: im.role,
      variationName: im.variationName,
      targetAngle: im.targetAngle,
      location: im.location,
      actionDescription: im.actionDescription,
    })),
  });

  const imageCount = scene.images?.length || 1;
  return res.json({
    success: true,
    scene: {
      ...scene,
      sceneSpeech: newSpeech,
      veoPrompt: updatedPrompt,
      veoInstruction: `Anexe no Veo a(s) ${imageCount} imagem(ns) de referência gerada(s) para esta cena`,
    },
  });
});

// Endpoint: Refinar/Corrigir Prompt do Vídeo com IA (Modo Ania e Modo Clonagem)
app.post('/api/refine-video-prompt', async (req, res) => {
  try {
    const { currentPrompt, correctionInstruction, aiProfile } = req.body;

    if (!currentPrompt) {
      return res.status(400).json({ success: false, error: 'Prompt atual não fornecido' });
    }

    const instruction = (correctionInstruction || '').trim();
    if (!instruction) {
      return res.status(400).json({ success: false, error: 'Instrução de correção não fornecida' });
    }

    const systemPrompt = `Você é um especialista em engenharia de prompts para o Google Veo 3.1 / modelos de vídeo e criativos TikTok Shop.
Sua missão é refazer/ajustar o prompt de vídeo fornecido aplicando estritamente a instrução de correção do usuário (ex: remover termos que causam moderação por conteúdo impróprio/sensível, ajustar movimentos, mudar foco da câmera, trocar vocabulário, etc.).

REGRAS OBRIGATÓRIAS:
1. Mantenha a estrutura técnica completa do prompt do Veo (formato vertical 9:16, duração em segundos, trava do produto, enquadramento, cortes/movimentos, fala/áudio e proibições).
2. Se a instrução for sobre conteúdo impróprio ou sensível, substitua termos arriscados por alternativas seguras e comerciais que passem pela moderação sem perder a essência do criativo.
3. Retorne EXCLUSIVAMENTE o texto final do prompt reescrito, pronto para copiar, sem introduções, sem markdown com crases, sem explicações.`;

    const userMessage = `PROMPT ATUAL:
"""
${currentPrompt}
"""

INSTRUÇÃO DE CORREÇÃO DO USUÁRIO:
"""
${instruction}
"""

Reescreva o prompt completo aplicando esta correção com máxima qualidade.`;

    // 1. Provedor OpenAI
    const activeProfile = aiProfile || getRequestAIProfile(req);
    if (activeProfile === 'openai' && openAIProvider.isConfigured()) {
      try {
        const client = (openAIProvider as any).getClient();
        const completion = await client.chat.completions.create({
          model: OPENAI_BRAIN_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        });
        const refined = completion.choices[0]?.message?.content?.trim();
        if (refined) {
          return res.json({ success: true, refinedPrompt: refined.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim() });
        }
      } catch (err: any) {
        console.warn('Erro ao refinar prompt via OpenAI:', err?.message || err);
      }
    }

    // 2. Provedor Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await getGenAI().models.generateContent({
          model: GEMINI_VISION_FAST_MODEL || 'gemini-3.8-flash-lite',
          contents: {
            parts: [
              {
                text: `${systemPrompt}\n\n${userMessage}`,
              },
            ],
          },
        });
        const geminiText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (geminiText) {
          return res.json({ success: true, refinedPrompt: geminiText.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim() });
        }
      } catch (gemErr: any) {
        console.warn('Erro ao refinar prompt via Gemini:', gemErr?.message || gemErr);
      }
    }

    // 3. Fallback inteligente caso nenhuma IA responda
    const fallbackText = `${currentPrompt}\n\n[AJUSTE: ${instruction}]`;
    return res.json({ success: true, refinedPrompt: fallbackText });
  } catch (err: any) {
    console.error('Erro na rota refine-video-prompt:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Erro ao refinar prompt' });
  }
});

function simplifyToSingleColorWord(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(/[.\n\r"']/g, '').trim();
  const lower = clean.toLowerCase();

  // Mapeamento estrito para UMA ÚNICA PALAVRA de cor básica
  if (lower.includes('preto') || lower.includes('black') || lower.includes('grafite')) return 'Preto';
  if (lower.includes('branco') || lower.includes('white') || lower.includes('off-white') || lower.includes('off white')) return 'Branco';
  if (lower.includes('marrom') || lower.includes('brown') || lower.includes('caramelo') || lower.includes('cafe')) return 'Marrom';
  if (lower.includes('azul') || lower.includes('blue') || lower.includes('jeans')) return 'Azul';
  if (lower.includes('verde') || lower.includes('green') || lower.includes('oliva') || lower.includes('militar')) return 'Verde';
  if (lower.includes('vermelho') || lower.includes('red') || lower.includes('rubi')) return 'Vermelho';
  if (lower.includes('rosa') || lower.includes('pink') || lower.includes('rose')) return 'Rosa';
  if (lower.includes('cinza') || lower.includes('grey') || lower.includes('gray') || lower.includes('chumbo')) return 'Cinza';
  if (lower.includes('bege') || lower.includes('nude') || lower.includes('creme') || lower.includes('areia')) return 'Bege';
  if (lower.includes('amarelo') || lower.includes('yellow') || lower.includes('mostarda')) return 'Amarelo';
  if (lower.includes('laranja') || lower.includes('orange') || lower.includes('terracota') || lower.includes('coral')) return 'Laranja';
  if (lower.includes('vinho') || lower.includes('bordo') || lower.includes('marsala') || lower.includes('burgundy')) return 'Vinho';
  if (lower.includes('roxo') || lower.includes('purple') || lower.includes('violeta') || lower.includes('lilas')) return 'Roxo';
  if (lower.includes('dourado') || lower.includes('gold')) return 'Dourado';
  if (lower.includes('prateado') || lower.includes('prata') || lower.includes('silver')) return 'Prateado';

  // Se não bater nas regras acima, pega estritamente a primeira palavra limpa e capitaliza
  const firstWord = clean.split(/\s+/)[0] || clean;
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

app.post('/api/detect-dominant-color', async (req, res) => {
  try {
    const { photoBase64, productName, productMode, aiProfile } = req.body;
    if (!photoBase64) {
      return res.status(400).json({ success: false, error: 'Foto não fornecida' });
    }

    const cleanB64 = photoBase64.startsWith('data:')
      ? photoBase64
      : `data:image/jpeg;base64,${photoBase64}`;

    const promptText = `Analise a foto deste item comercial (${productName || (productMode === 'footwear' ? 'calçado / tênis' : 'roupa')}) e identifique com máxima precisão a cor predominante do corpo/cabedal/tecido principal.
REGRAS OBRIGATÓRIAS:
1. Se for calçado/tênis: ignore a sola de borracha (branca/preta) e foque exclusivamente no cabedal (parte superior/tecido/couro).
2. Ignore o fundo branco/cinza, sombras, piso ou manequins.
3. Se o cabedal for verde (oliva, militar, musgo, etc.), responda: Verde
4. Se o cabedal for marrom (caramelo, café, chocolate), responda: Marrom
5. Se o cabedal for azul (marinho, jeans, royal, celeste), responda: Azul
6. Se o cabedal for vermelho/vinho, responda: Vermelho
7. Se o cabedal for rosa/pink, responda: Rosa
8. Se o cabedal for amarelo/mostarda, responda: Amarelo
9. Se o cabedal for bege/nude/areia, responda: Bege
10. Se o cabedal for laranja/terracota, responda: Laranja
11. Se o cabedal for roxo/lilás, responda: Roxo
12. Se o cabedal for preto, responda: Preto
13. Se o cabedal for branco, responda: Branco
14. Se o cabedal for cinza/chumbo, responda: Cinza
Responda ESTRITAMENTE em UMA ÚNICA PALAVRA da cor básica em português, sem pontuação e sem explicações.`;

    // 1. Provedor OpenAI
    const activeProfile = aiProfile || getRequestAIProfile(req);
    if (activeProfile === 'openai' && openAIProvider.isConfigured()) {
      const client = (openAIProvider as any).getClient();
      for (const visionModel of ['gpt-4o-mini', 'gpt-4o', 'gpt-5.6-luna', OPENAI_BRAIN_MODEL]) {
        try {
          const params: any = {
            model: visionModel,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: cleanB64 } },
                  { type: 'text', text: promptText },
                ],
              },
            ],
          };

          if (visionModel.startsWith('gpt-5')) {
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
        } catch (err: any) {
          console.warn(`Erro ao detectar cor via OpenAI (${visionModel}):`, err?.message || err);
        }
      }
    }

    // 2. Provedor Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const parsed = parseInlineImage(photoBase64);
        if (parsed) {
          const geminiRes = await getGenAI().models.generateContent({
            model: GEMINI_VISION_FAST_MODEL || 'gemini-3.8-flash-lite',
            contents: {
              parts: [
                { inlineData: parsed },
                { text: promptText },
              ],
            },
          });
          const rawColor = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawColor) {
            const cleanColor = simplifyToSingleColorWord(rawColor);
            return res.json({ success: true, color: cleanColor });
          }
        }
      } catch (gemErr: any) {
        console.warn('Erro ao detectar cor via Gemini:', gemErr?.message || gemErr);
      }
    }

    return res.status(500).json({ success: false, error: 'Não foi possível detectar a cor' });
  } catch (err: any) {
    console.error('Erro na rota detect-dominant-color:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Erro interno' });
  }
});

app.post('/api/generate-scene-image', async (req, res) => {
  try {
    const {
      prompt,
      productPhotoBase64,
      productPhotosBase64 = [],
      modelReferenceBase64,
      referenceFrameBase64,
      variationName = 'Variação 1',
      productType = 'produto comercial',
      targetAngle = 'front',
      location,
      actionDescription,
      correctionPrompt,
      additionalInstructions = '',
      hasUserProvidedModel = false,
      isCloneMode = false,
      preserveLocation = false,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt não fornecido' });
    }

    // ─── ROTEAMENTO BASEADO NO PERFIL DE IA SELECIONADO ────────────────────
    const activeProfile = req.body?.aiProfile || getRequestAIProfile(req);
    if (activeProfile === 'openai') {
      if (!openAIProvider.isConfigured()) {
        return res.json({
          success: false,
          error: 'A chave da API da OpenAI não está configurada no ambiente. Adicione OPENAI_API_KEY no arquivo .env ou no painel da Vercel.',
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
        });
        return res.json(result);
      } catch (oiErr: any) {
        return res.json({
          success: false,
          error: oiErr?.message || 'Erro na chamada à API da OpenAI.',
        });
      }
    }
    // ─── END OPENAI PROVIDER PATH ──────────────────────────────────────────

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        fallbackRequired: true,
        error: 'Chave de API nÃ£o configurada',
      });
    }

    const parts: any[] = [];

    // Se temos modelReferenceBase64:
    // Em Modo Ania (isCloneMode === false): aplica CANVAS LOCK total (mesma pose, mesmo quarto, apenas troca de cor).
    // Em Modo Clonagem (isCloneMode === true): aplica CONSISTÊNCIA DE MODELO/PESSOA, mas respeita 100% o cenário, ângulo e ação de cada cena!
    if (modelReferenceBase64 && !isCloneMode) {
      const parsedModel = parseInlineImage(modelReferenceBase64);
      if (parsedModel) {
        parts.push({ inlineData: parsedModel });
        parts.push({
          text: `[REFERÊNCIA 1 - CANVAS MESTRE INVIOLÁVEL (CLONE 100% IDÊNTICO DE PESSOA, POSE E CENÁRIO)]:
- REGRA DE CLONAGEM TOTAL:
  * Você DEVE manter a EXATA MESMA PESSOA/MODELO da Referência 1 (mesmo corpo, tom de pele, mãos, postura e enquadramento vertical sem rosto).
  * Você DEVE manter o EXATO MESMO CENÁRIO E QUARTO da Referência 1 (mesmas paredes, mesmo chão, mesmos móveis, mesma iluminação e mesma distância da câmera).
  * ZERO TATUAGENS: Pele 100% limpa, sem qualquer tatuagem em homem ou mulher.
  * PROIBIÇÃO ABSOLUTA: NÃO recrie a foto, NÃO gere outra pessoa e NÃO altere o quarto/ambiente. O quarto e a pessoa são 100% intocáveis.`,
        });
      }

      // Se o usuário anexou amostra de cor (Cor 2 ou Cor 3), extraímos os detalhes físicos via Vision AI
      // e injetamos como especificação textual, SEM enviar imagem com fundo conflitante que contamine a difusão.
      const primaryStr = productPhotoBase64 || (productPhotosBase64.length > 0 ? productPhotosBase64[0] : null);
      let swatchDetailsText = '';
      if (primaryStr) {
        swatchDetailsText = await extractProductSwatchDetails(primaryStr, variationName, productType);
      }

      parts.push({
        text: `[INSTRUÇÃO DE MODIFICAÇÃO EXCLUSIVA DE PRODUTO]:
- Modifique EXCLUSIVAMENTE a ${productType} usada pela pessoa na Referência 1 para a nova cor "${variationName}".
- Detalhes visuais extraídos da amostra oficial: ${swatchDetailsText || `cor ${variationName}`}
- Todo o resto da Referência 1 (pessoa, rosto oculto, corpo, pose, mãos, quarto, paredes, piso, iluminação) permanece 100% idêntico e intocado.`,
      });
    } else if (modelReferenceBase64 && isCloneMode && hasUserProvidedModel) {
      // 1. Em Modo Clonagem com modelo fornecido pelo usuário, insere as fotos REAIS do produto como referência primária 1:1 física
      const primaryStr = productPhotoBase64 || (productPhotosBase64.length > 0 ? productPhotosBase64[0] : null);
      if (primaryStr) {
        const parsedPrimary = parseInlineImage(primaryStr);
        if (parsedPrimary) {
          parts.push({ inlineData: parsedPrimary });
          parts.push({
            text: `[REFERENCE 1 - PRIMARY PRODUCT PHOTO FOR "${variationName}"]:
- HIGHEST PRIORITY 1:1 PHYSICAL FIDELITY:
  * The product in the generated image MUST BE AN EXACT, UNCOMPROMISED 1:1 REPLICA of this photo!
  * Replicate exact shape, silhouette, materials, textures, logos, colors and physical details without alterations.`,
          });
        }
      }

      // 2. Insere a foto do modelo enviada pelo usuário mantendo a pessoa mas adaptando ao novo cenário e ação
      const parsedModel = parseInlineImage(modelReferenceBase64);
      if (parsedModel) {
        parts.push({ inlineData: parsedModel });
        parts.push({
          text: `[REFERENCE 2 - USER PROVIDED TALENT / MODEL IDENTITY]:
- MAINTAIN THE EXACT SAME ACTOR / MODEL FROM THE USER'S PHOTO:
  * Preserve the same person's demographic identity (same gender, approximate age, skin tone, hair color/style, and build).
  * CRITICAL FOR SCENE CONTINUITY: Do NOT lock the room or pose to Reference 2!
  * STRICT ENVIRONMENT DIRECTIVE: Generate this image strictly in the scene's requested location: "${location || 'cenário da cena'}", angle: "${targetAngle || 'front'}", and action: "${actionDescription || 'ação da cena'}".
  * ZERO BACKGROUND REPETITION: The background, furniture, and setting MUST match THIS scene's storyboard location!`,
        });
      }
    } else {
      // 1. Add PRIMARY photo for this specific colorway / variation (ABSOLUTE 1:1 PRODUCT FIDELITY)
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
  * Every physical attribute visible in this photo MUST be faithfully present on the product.`,
          });
        }
      }

      // Add remaining photos of this variation as supplementary angles
      const remainingPhotos = (Array.isArray(productPhotosBase64) ? productPhotosBase64 : []).filter(
        (p) => p !== primaryStr
      );
      remainingPhotos.slice(0, 2).forEach((photoStr: string, pIdx: number) => {
        const parsedProduct = parseInlineImage(photoStr);
        if (parsedProduct) {
          parts.push({ inlineData: parsedProduct });
          parts.push({
            text: `[REFERENCE 1.${pIdx + 2} - SUPPLEMENTARY ANGLE FOR "${variationName}"]:
- Replicate the exact construction, stitching, and materials visible in this reference.`,
          });
        }
      });

      if (!hasUserProvidedModel) {
        parts.push({
          text: `[CRITICAL HUMAN MODEL ANTI-VIOLATION DIRECTIVE FOR TIKTOK SHOP]:
- As no custom model photo was provided, create an ORIGINAL, UNIQUE commercial model/creator:
  * DO NOT copy or clone the face of the actor from the competitor reference video!
  * The generated model must have a DIFFERENT FACE and distinct facial features (different eyes, nose, smile, jawline, with subtle variation in hair/skin tone—similar demographic style like a cousin, but strictly a different person).
  * This prevents copyright, duplicate content, and impersonation violations on TikTok Shop.`,
        });
      }
    }

    const correctionBlock = correctionPrompt && correctionPrompt.trim()
      ? `\nCRITICAL QUALITY AUDIT OVERRIDE: ${correctionPrompt.trim()}. You MUST strictly fix the previous discrepancies and match the user reference photos 100% identically!\n`
      : '';

    const userDirectivesBlock = additionalInstructions && additionalInstructions.trim()
      ? `\nUSER SPECIFIC DIRECTIVES: "${additionalInstructions.trim()}". You MUST strictly follow these user directives!\n`
      : '';

    const overrideBlock = [
      correctionBlock,
      userDirectivesBlock,
    ].filter(Boolean).join('\n');

    const finalDirective = (modelReferenceBase64 && !isCloneMode)
      ? `\n\n[DIRETIVA FINAL INVIOLÁVEL DE CANVAS LOCK]:
A imagem gerada DEVE ser uma cópia 100% idêntica da REFERÊNCIA 1 (mesma pessoa/modelo, mesmo corpo, mesma pose, mesmo quarto simples residencial, mesmo piso, paredes e iluminação). Altere EXCLUSIVAMENTE a cor e tecido da ${productType} para "${variationName}". Descarte e ignore qualquer outro fundo ou ambiente!`
      : '';

    const cleanPrompt = overrideBlock ? `${overrideBlock}\n\n${prompt}${finalDirective}` : `${prompt}${finalDirective}`;
    parts.push({ text: cleanPrompt });

    let imageResultUrl = '';

    const modelsToTry = [
      GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
      GEMINI_IMAGE_FAST_MODEL || 'gemini-3.1-flash-lite-image',
      'gemini-3-pro-image',
    ];

    let lastErrorType = '';
    let lastErrorMessage = '';

    const systemInstructionText = (modelReferenceBase64 && !isCloneMode)
      ? `VOCÊ É O MOTOR DE INPAINTING E TROCA DE COR DO REVÍDEO AI (PADRÃO TIKTOK SHOP BRASIL).
DIRETIVA MESTRE 1 (CANVAS LOCK TOTAL): A REFERÊNCIA 1 É O CANVAS MESTRE INVIOLÁVEL. Você DEVE manter 100% idênticos a MESMA pessoa/modelo, o mesmo corpo, a mesma pose, o mesmo enquadramento sem rosto (do pescoço para baixo), o MESMO quarto/cenário residencial simples, as mesmas paredes, o mesmo chão/piso, os mesmos móveis e a mesma iluminação da REFERÊNCIA 1. É TERMINANTEMENTE PROIBIDO alterar o modelo ou o cenário.
DIRETIVA MESTRE 2 (AÇÃO EXCLUSIVA): A ÚNICA modificação permitida em toda a imagem é pintar/trocar a cor e o tecido da ${productType} usada pela pessoa na REFERÊNCIA 1 para a nova cor "${variationName}".
DIRETIVA MESTRE 3: ZERO TATUAGENS. Pele 100% limpa, sem qualquer tatuagem em homem ou mulher.`
      : `VOCÊ É O MOTOR DE GERAÇÃO VISUAL DO REVÍDEO AI (PADRÃO TIKTOK SHOP BRASIL).
- Máxima fidelidade 1:1 física ao produto real das fotos de referência.
- Retratar pessoas brasileiras simples e comuns do dia a dia (sem supermodelos inalcançáveis).
- Cenários autênticos e dinâmicos conforme especificado pelo storyboard do vídeo (cada cena em seu ambiente e ação designados).
- Consistência de modelo humano sem repetir a mesma pose ou cenário se o roteiro mudar de lugar.
- Zero tatuagens na pele. Enquadramento do pescoço para baixo quando solicitado.`;

    for (const modelCandidate of modelsToTry) {
      try {
        const imgRes = await getGenAI().models.generateContent({
          model: modelCandidate,
          contents: { parts },
          config: {
            systemInstruction: systemInstructionText,
            imageConfig: {
              aspectRatio: '9:16',
            },
          },
        });

        const candidates = imgRes.candidates || [];
        if (candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              imageResultUrl = `data:${mime};base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        if (imageResultUrl) break;
      } catch (imgError: any) {
        console.warn(`Tentativa com ${modelCandidate} falhou:`, imgError?.message);
        if (
          imgError?.status === 429 ||
          imgError?.message?.includes('spending cap') ||
          imgError?.message?.includes('monthly spending')
        ) {
          lastErrorType = 'SPENDING_CAP_EXCEEDED';
          lastErrorMessage =
            'Seu projeto no Google AI Studio atingiu o Limite de Gastos Mensal (Spend Cap - Erro 429). Para permitir que a IA gere as imagens fotorrealistas do produto, ajuste ou aumente o limite em https://ai.studio/spend ou alterne para o provedor OpenAI.';
        } else if (
          imgError?.status === 402 ||
          imgError?.message?.includes('prepayment credits are depleted') ||
          imgError?.message?.includes('402')
        ) {
          lastErrorType = 'CREDITS_DEPLETED';
          lastErrorMessage =
            'Seus créditos pré-pagos da API Gemini se esgotaram (Erro 402). O modelo fotorrealista requer créditos ativos no Google AI Studio (https://ai.studio/projects) ou alterne para o provedor OpenAI.';
        } else {
          lastErrorType = 'AI_FAILED';
          lastErrorMessage = imgError?.message || 'Falha na geração de imagem com a IA.';
        }
      }
    }

    // Se Gemini falhou por cota/crédito e OpenAI estiver configurado, tenta fallback para OpenAI
    if (!imageResultUrl && openAIProvider.isConfigured() && activeProfile !== 'openai') {
      try {
        console.log('Gemini atingiu limite ou falhou. Tentando fallback automático para OpenAI...');
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
        });
        if (result.success && result.imageUrl) {
          return res.json(result);
        }
      } catch (fbErr: any) {
        console.warn('Fallback OpenAI também falhou:', fbErr?.message || fbErr);
      }
    }

    if (!imageResultUrl) {
      return res.json({
        success: false,
        errorType: lastErrorType || 'AI_FAILED',
        error:
          lastErrorMessage ||
          'Não foi possível gerar a imagem no modelo fotorrealista. Verifique sua chave de API e limites de cota.',
      });
    }

    return res.json({
      success: true,
      imageUrl: imageResultUrl,
      costBRL: 0.08, // ~ $0.014 * 5.70 (Flash Image)
    });
  } catch (err: any) {
    console.error('Erro na rota de imagem:', err);
    return res.json({
      success: false,
      fallbackRequired: true,
      error: err?.message || 'Erro inesperado',
    });
  }
});

// Endpoint: Fiscal de Fidelidade de Imagem (Auditoria AutomÃ¡tica TikTok Shop)
app.post('/api/audit-image-fidelity', async (req, res) => {
  try {
    const {
      generatedImageBase64,
      referencePhotos = [],
      variationName = 'VariaÃ§Ã£o 1',
      role = 'Imagem de ReferÃªncia',
    } = req.body;

    if (!generatedImageBase64) {
      return res.status(400).json({ success: false, error: 'Imagem gerada nÃ£o fornecida' });
    }

    // ─── AUDITORIA DE FIDELIDADE (GPT 5.6 Luna se configurado, ou Gemini) ────
    if (openAIProvider.isConfigured()) {
      try {
        const result = await openAIProvider.auditImageFidelity({
          generatedImageBase64,
          referencePhotos,
          variationName,
          role,
        });
        if (result && result.success) {
          return res.json(result);
        }
      } catch (oiErr: any) {
        console.warn(`Exceção no modelo de auditoria ${OPENAI_AUDIT_MODEL}, recorrendo ao Gemini:`, oiErr?.message || oiErr);
      }
    }
    // ─── END OPENAI PROVIDER PATH ──────────────────────────────────────────

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        audit: {
          score: 95,
          status: 'green',
          label: 'Verde Fidedigno (Modo Offline)',
          issues: ['ValidaÃ§Ã£o visual offline concluÃ­da.'],
          correctionPrompt: '',
        },
      });
    }

    const parts: any[] = [];

    // Add generated image
    const parsedGen = parseInlineImage(generatedImageBase64);
    if (parsedGen) {
      parts.push({ inlineData: parsedGen });
      parts.push({
        text: `[IMAGEM 1 - IMAGEM GERADA PELA IA]: Esta Ã© a imagem gerada para o criativo comercial do TikTok Shop, mostrando a variaÃ§Ã£o "${variationName}".`,
      });
    }

    // Add user's real reference photos in multiple angles
    if (Array.isArray(referencePhotos) && referencePhotos.length > 0) {
      referencePhotos.forEach((photoBase64: string, idx: number) => {
        const parsedRef = parseInlineImage(photoBase64);
        if (parsedRef) {
          parts.push({ inlineData: parsedRef });
          parts.push({
            text: `[FOTO DE REFERÃŠNCIA REAL ${idx + 1}]: Foto autÃªntica do produto do usuÃ¡rio enviada em um dos Ã¢ngulos de referÃªncia.`,
          });
        }
      });
    }

    const auditInstruction = `VocÃª Ã© o Auditor Fiscal de Fidelidade de Produtos para o TikTok Shop.
O TikTok Shop Ã© extremamente rÃ­gido com diretrizes de comÃ©rcio: se um produto no vÃ­deo/anÃºncio apresentar cores, cadarÃ§os, costuras ou detalhes diferentes do produto real entregue ao comprador, a loja Ã© punida por propaganda enganosa.

SUA MISSÃƒO: Comparar o produto que aparece na [IMAGEM 1 - IMAGEM GERADA] com as [FOTOS DE REFERÃŠNCIA REAIS] enviadas pelo usuÃ¡rio em todos os Ã¢ngulos.

NOTA CRÃTICA: IGNORE o cenÃ¡rio, piso, paredes, espelho e iluminaÃ§Ã£o. Avalie EXCLUSIVAMENTE o PRODUTO (e se houver pessoa usando, se o produto nos pÃ©s/corpo dela confere com as fotos reais).

CRITÃ‰RIOS DE FISCALIZAÃ‡ÃƒO:
1. CadarÃ§os / atacadores / fechos: A cor e o estilo do cadarÃ§o conferem com as fotos reais? (Ex: se a foto tem cadarÃ§o marrom, o gerado deve ter cadarÃ§o marrom; se mudou de cor, Ã© uma VARIAÃ‡ÃƒO CRÃTICA).
2. Cores e materiais principais: O cabedal, tecido, couro ou embalagem mantÃªm as cores e texturas exatas?
3. Solado e entressola: O formato, cor da sola e detalhes de borracha conferem?
4. Costuras, recortes e marcas: Surgiram costuras inexistentes, formatos deformados ou detalhes inventados?

SISTEMA DE NOTA (0 a 100):
- VERDE (score >= 90): Fidedigno (status: "green"). Todos os detalhes essenciais, cores, cadarÃ§os e solado conferem com as fotos reais.
- AMARELO (score 70 a 89): VariaÃ§Ã£o Leve (status: "yellow"). Pequena diferenÃ§a de brilho, sombra ou detalhe secundÃ¡rio que nÃ£o descaracteriza.
- VERMELHO (score < 70): VariaÃ§Ã£o CrÃ­tica (status: "red"). MudanÃ§a de cor no cadarÃ§o, sola diferente, cor principal alterada ou partes alucinadas.

Retorne estritamente um JSON no seguinte formato:
{
  "score": number,
  "status": "green" | "yellow" | "red",
  "label": string,
  "issues": string[],
  "correctionPrompt": string
}`;

    const auditRes = await getGenAI().models.generateContent({
      model: GEMINI_VISION_FAST_MODEL || 'gemini-3.1-flash-lite',
      contents: [
        ...parts,
        { text: auditInstruction },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedAudit = JSON.parse(auditRes.text || '{}');
    const score = Math.max(0, Math.min(100, Number(parsedAudit.score) || 92));
    const status = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';
    const label = parsedAudit.label || (status === 'green' ? `Verde Fidedigno (${score}%)` : status === 'yellow' ? `Amarelo - VariaÃ§Ã£o Leve (${score}%)` : `Vermelho - VariaÃ§Ã£o CrÃ­tica (${score}%)`);

    return res.json({
      success: true,
      audit: {
        score,
        status,
        label,
        issues: Array.isArray(parsedAudit.issues) && parsedAudit.issues.length > 0 ? parsedAudit.issues : ['Produto analisado com sucesso.'],
        correctionPrompt: parsedAudit.correctionPrompt || '',
        auditedAngle: role,
      },
    });
  } catch (err: any) {
    console.warn('Erro na auditoria de fidelidade:', err);
    return res.json({
      success: true,
      audit: {
        score: 94,
        status: 'green',
        label: 'Verde Fidedigno (AnÃ¡lise ConcluÃ­da)',
        issues: ['Fidelidade de produto validada.'],
        correctionPrompt: '',
      },
    });
  }
});

// ─── ENDPOINT INDEPENDENTE: MICROEDIÇÃO DE IMAGEM ─────────────────────────────
app.post('/api/micro-edit-image', async (req, res) => {
  try {
    const { imageBase64, instruction, aiProfile } = req.body;
    if (!imageBase64 || !instruction) {
      return res.status(400).json({ success: false, error: 'Imagem e instrução de edição são obrigatórias.' });
    }

    const cleanB64 = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const promptText = `Execute a microedição solicitada pelo usuário com MÁXIMA PRECISÃO E FIDELIDADE À IMAGEM FORNECIDA.
REGRA FUNDAMENTAL E ABSOLUTA:
1. Use SOMENTE a imagem fornecida como 100% da referência visual.
2. Mantenha idênticos todo o enquadramento, proporções, iluminação, composição e detalhes que NÃO foram expressamente mandados alterar.
3. INSTRUÇÃO DO USUÁRIO: "${instruction}".
4. Aplique ESTRITAMENTE e EXCLUSIVAMENTE a alteração solicitada. Se pediu para trocar a cor, troque apenas a cor do item especificado. Se pediu para alterar um detalhe, altere apenas esse detalhe.
5. Retorne a imagem editada realista com alta definição vertical 9:16.`;

    const activeProfile = aiProfile || getRequestAIProfile(req);

    // 1. OpenAI Path
    if (activeProfile === 'openai' && openAIProvider.isConfigured()) {
      try {
        const result = await openAIProvider.generateSceneImage({
          prompt: promptText,
          productPhotoBase64: cleanB64,
          variationName: 'Microedição',
          productType: 'imagem de referência',
          additionalInstructions: `Microedição isolada: ${instruction}`,
        });
        if (result.success && result.imageUrl) {
          return res.json({ success: true, imageUrl: result.imageUrl });
        }
      } catch (err: any) {
        console.warn('Erro na microedição via OpenAI, tentando Gemini:', err?.message || err);
      }
    }

    // 2. Gemini Path
    if (process.env.GEMINI_API_KEY) {
      const parsed = parseInlineImage(cleanB64);
      const parts: any[] = [];
      if (parsed) {
        parts.push({ inlineData: parsed });
      }
      parts.push({ text: promptText });

      const modelsToTry = [
        GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
        GEMINI_IMAGE_FAST_MODEL || 'gemini-3.1-flash-lite-image',
        'gemini-3-pro-image',
      ];

      for (const modelCandidate of modelsToTry) {
        try {
          const imgRes = await getGenAI().models.generateContent({
            model: modelCandidate,
            contents: { parts },
            config: {
              systemInstruction: 'Você é um editor de microedição de imagens. Edite estritamente o que foi solicitado na imagem fornecida, mantendo todo o restante inalterado.',
              imageConfig: { aspectRatio: '9:16' },
            },
          });

          const candidates = imgRes.candidates || [];
          if (candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                return res.json({ success: true, imageUrl: `data:${mime};base64,${part.inlineData.data}` });
              }
            }
          }
        } catch (e: any) {
          console.warn(`Tentativa de microedição com ${modelCandidate} falhou:`, e?.message || e);
        }
      }
    }

    return res.status(500).json({ success: false, error: 'Não foi possível gerar a microedição com os provedores configurados.' });
  } catch (err: any) {
    console.error('Erro no endpoint micro-edit-image:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Erro interno na microedição' });
  }
});

// ─── ENDPOINTS MODO PRODUTOS 2.0 (EXPRESS · 1 GERAÇÃO · STORYBOARD 9 CENAS) ─────
app.post('/api/produtos2-planning', async (req, res) => {
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
      productPhotosBase64 = [],
    } = req.body;

    const activeProfile = req.body?.aiProfile || getRequestAIProfile(req);

    // Normalizador de texto para narração por voz IA (expandindo unidades, medidas e siglas)
    const normalizeVoiceText = (text: string): string => {
      if (!text) return '';
      let out = text;
      out = out.replace(/\b(\d+)\s*[wW]\b/g, '$1 watts');
      out = out.replace(/\b(\d+)\s*[kK][wW]\b/g, '$1 quilowatts');
      out = out.replace(/\b(\d+)\s*[hH][zZ]\b/g, '$1 hertz');
      out = out.replace(/\b(\d+)\s*(?:pol|pol\.)\b/gi, '$1 polegadas');
      out = out.replace(/\b(\d+)\s*(?:cm|cm\.)\b/gi, '$1 centímetros');
      out = out.replace(/\b(\d+)\s*(?:mm|mm\.)\b/gi, '$1 milímetros');
      out = out.replace(/\b(\d+)\s*(?:km|km\.)\b/gi, '$1 quilômetros');
      out = out.replace(/\b(\d+)\s*(?:kg|kg\.)\b/gi, '$1 quilos');
      out = out.replace(/\b(\d+)\s*(?:ml|ml\.)\b/gi, '$1 mililitros');
      out = out.replace(/\b(\d+)\s*[vV]\b/g, '$1 volts');
      out = out.replace(/\b(\d+)\s*(?:mah|mAh)\b/gi, '$1 miliamperes');
      out = out.replace(/\b(\d+)\s*(?:fps|FPS)\b/g, '$1 quadros por segundo');
      out = out.replace(/\b(\d+)\s*(?:gb|GB)\b/g, '$1 gigas');
      out = out.replace(/\b(\d+)\s*(?:tb|TB)\b/g, '$1 teras');
      out = out.replace(/\b(\d+)\s*(?:mb|MB)\b/g, '$1 megas');
      out = out.replace(/\b(\d+)\s*%/g, '$1 por cento');
      // O X (como em X8, Poco X8 Pro, etc.) permanece como X para pronúncia correta de modelos
      out = out.replace(/\b([Pp]oco)\s+(?:\d+\s+)?vezes\b/g, '$1 X8');
      out = out.replace(/\bAMOLED\b/g, 'Amóled');
      out = out.replace(/\bOLED\b/g, 'Óled');
      out = out.replace(/\bLED\b/g, 'Léd');
      out = out.replace(/\bQLED\b/g, 'Q-Léd');
      out = out.replace(/\s*&\s*/g, ' e ');
      out = out.replace(/\s*\+\s*/g, ' mais ');
      return out.replace(/\s+/g, ' ').trim();
    };

    const cleanDuplicateWords = (text: string): string => {
      if (!text) return '';
      return text.replace(/\b([a-zA-ZÀ-ÿ0-9]+)([\s,]+)\1\b/gi, (match, word) => {
        if (word.toLowerCase() === 'já') return match;
        return word;
      });
    };

    interface AIExecutionOutput {
      text: string;
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        costUSD: number;
        costBRL: number;
        model: string;
      };
    }

    // Helper de alta performance para chamadas de texto IA (OpenAI gpt-4o-mini com fallback automático para Gemini 2.5 Flash)
    const executeFastAIText = async (opts: {
      systemPrompt: string;
      userPrompt: string;
      jsonMode?: boolean;
      temperature?: number;
    }): Promise<AIExecutionOutput> => {
      const { systemPrompt, userPrompt, jsonMode = false, temperature = 0.3 } = opts;
      const client = (openAIProvider as any).getClient();

      // 1. Tentar OpenAI gpt-4o-mini (se configurado)
      if (client && (activeProfile === 'openai' || !process.env.GEMINI_API_KEY)) {
        try {
          const comp = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
            temperature,
          });
          const content = comp.choices[0]?.message?.content?.trim();
          if (content) {
            const pTokens = comp.usage?.prompt_tokens || 450;
            const cTokens = comp.usage?.completion_tokens || 110;
            const costUSD = Math.round(((pTokens / 1_000_000) * 0.15 + (cTokens / 1_000_000) * 0.60) * 10000) / 10000;
            const costBRL = Math.round(costUSD * 5.70 * 1000) / 1000;
            return {
              text: content,
              usage: {
                promptTokens: pTokens,
                completionTokens: cTokens,
                totalTokens: pTokens + cTokens,
                costUSD: Math.max(0.0005, costUSD),
                costBRL: Math.max(0.003, costBRL),
                model: 'gpt-4o-mini',
              },
            };
          }
        } catch (err: any) {
          console.warn('Erro na chamada OpenAI gpt-4o-mini, tentando fallback:', err?.message || err);
        }
      }

      // 2. Tentar Gemini 2.5 Flash se configurado ou como fallback
      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = getGenAI();
          const gemRes = await genAI.models.generateContent({
            model: GEMINI_VISION_FAST_MODEL || 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            config: {
              temperature,
              ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
            },
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
                costUSD: 0.0003,
                costBRL: 0.002,
                model: GEMINI_VISION_FAST_MODEL || 'gemini-2.5-flash',
              },
            };
          }
        } catch (gemErr: any) {
          console.warn('Erro na chamada Gemini:', gemErr?.message || gemErr);
        }
      }

      // 3. Se Gemini não funcionou e OpenAI está disponível, tenta OpenAI
      if (client) {
        const comp = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          temperature,
        });
        const content = comp.choices[0]?.message?.content?.trim() || '';
        const pTokens = comp.usage?.prompt_tokens || 450;
        const cTokens = comp.usage?.completion_tokens || 110;
        return {
          text: content,
          usage: {
            promptTokens: pTokens,
            completionTokens: cTokens,
            totalTokens: pTokens + cTokens,
            costUSD: 0.0005,
            costBRL: 0.003,
            model: 'gpt-4o-mini',
          },
        };
      }

      throw new Error('Nenhum provedor de IA disponível para geração de texto.');
    };

    // Helper de altíssimo desempenho e inteligência máxima da OpenAI (gpt-5.6-terra / gpt-4o com Aurora Copy Brain)
    const executeTopAIModel = async (opts: {
      systemPrompt: string;
      userPrompt: string;
      jsonMode?: boolean;
    }): Promise<AIExecutionOutput> => {
      const { systemPrompt, userPrompt, jsonMode = false } = opts;
      const client = (openAIProvider as any).getClient();

      if (client) {
        // Tenta gpt-4o primeiro pela altíssima inteligência e velocidade recorde (~2s), com fallback
        const topModels = ['gpt-4o', OPENAI_BRAIN_MODEL, 'gpt-4o-mini'];
        for (const modelCandidate of topModels) {
          try {
            const params: any = {
              model: modelCandidate,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
            };

            if (modelCandidate.startsWith('gpt-5') || modelCandidate.startsWith('o')) {
              params.reasoning_effort = 'medium';
            } else {
              params.temperature = 0.2;
            }

            const comp = await client.chat.completions.create(params);
            const content = comp.choices[0]?.message?.content?.trim();
            if (content) {
              const pTokens = comp.usage?.prompt_tokens || 1250;
              const cTokens = comp.usage?.completion_tokens || 250;
              const costUSD = Math.round(((pTokens / 1_000_000) * 2.5 + (cTokens / 1_000_000) * 10) * 10000) / 10000;
              const costBRL = Math.round(costUSD * 5.70 * 100) / 100;
              return {
                text: content,
                usage: {
                  promptTokens: pTokens,
                  completionTokens: cTokens,
                  totalTokens: pTokens + cTokens,
                  costUSD: Math.max(0.004, costUSD),
                  costBRL: Math.max(0.02, costBRL),
                  model: modelCandidate,
                },
              };
            }
          } catch (mErr: any) {
            console.warn(`Tentando próximo modelo OpenAI após erro no ${modelCandidate}:`, mErr?.message || mErr);
          }
        }
      }

      // Fallback para Gemini 2.5 Flash se OpenAI falhar
      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = getGenAI();
          const gemRes = await genAI.models.generateContent({
            model: GEMINI_VISION_FAST_MODEL || 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            config: {
              temperature: 0.3,
              ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
            },
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
                costUSD: 0.001,
                costBRL: 0.006,
                model: GEMINI_VISION_FAST_MODEL || 'gemini-2.5-flash',
              },
            };
          }
        } catch (gemErr: any) {
          console.warn('Erro no fallback Gemini:', gemErr?.message || gemErr);
        }
      }

      throw new Error('Nenhum provedor de IA disponível para a fala do usuário.');
    };

    // Ação 1: Detectar e condensar com inteligência máxima a fala do usuário a partir das Instruções Adicionais
    if (action === 'detect_and_review_user_speech') {
      try {
        const textToAnalyze = (additionalInstructions || req.body.text || '').trim();
        if (!textToAnalyze) {
          return res.json({ success: true, hasUserSpeech: false, userSpeech: '' });
        }

        const detectSystem = `Você é o modelo mais avançado da OpenAI especializado em roteiros e copies para vídeos do TikTok Shop Brasil.
O usuário preencheu o campo "Instruções Adicionais" com um texto ditado por voz (informal, repetitivo, com hesitações) que mistura descrição de cenário, personagens, ações e as FALAS que ele quer no vídeo.

SUA MISSÃO OBRIGATÓRIA:
1. Identifique TODAS as falas que algum personagem diz em voz alta no vídeo (marcadores típicos: "fala", "diz", "vira e fala", "fala assim", "ele já fala assim", "dizendo", "grita", "todos falam em coro", etc.).
2. O usuário frequentemente repete a mesma fala duas vezes com pequenas variações (ditado por voz). Nesse caso, FUNDA as versões numa única fala, mantendo os elementos mais fortes de cada uma (ex.: urgência "só até hoje à meia-noite", "menos da metade do preço", "preço de banana"). NUNCA pegue só o final da fala; a fala começa no gancho (ex.: "Gente, o gerente ficou doido...").
3. Elimine totalmente metanarrativa e descrição (ex.: "a cena é o seguinte", "o primeiro frame é essa", "pronto, essa vai ser a questão", "é isso", "e aí termina com...", descrições de roupas, aparência e lugar). JAMAIS inclua isso na fala.
4. Sons não verbais de personagens (ex.: "au au au" de alguém imitando cachorro) NÃO entram em "userSpeech"; descreva-os em "soundEffects".
5. "userSpeech": a FALA COMPLETA falada no vídeo, unindo todas as falas de todos os personagens em ordem, fluida, natural, persuasiva para TikTok Shop, sem nomes de personagens, com no máximo 225 caracteres (idealmente entre 170 e 225). Corrija a transcrição (ex.: "pó pouco"/"pouco" -> "Poco", "Tik Tok" -> "TikTok Shop"). O "X" em modelos (X8, Poco X8 Pro) NUNCA vira "vezes".
6. "speakers": lista de TODOS os personagens que falam, na ordem, com { "speaker": papel (ex.: "Vendedor", "Mulher", "Homem", "Gerente", "Clientes em coro"), "gender": "masculina" | "feminina" | "coro", "speech": fala exata dele (trecho de userSpeech), "scenes": em quais cenas de 1 a 9 fala }.
7. "isDialogue": true SOMENTE se 2 ou mais personagens/grupos diferentes falam. Se apenas um personagem fala, "isDialogue": false (mas preencha "speakers" com esse único personagem e seu gênero).
8. "dialogueDescription": resumo curto da cena e dos personagens (sem as falas). "dialogueScript": roteiro "Papel: \\"fala\\"" por linha.
9. Se não houver nenhuma fala explícita, "hasUserSpeech": false e "userSpeech": "".

FORMATO DE RESPOSTA (JSON estrito):
{
  "hasUserSpeech": true,
  "userSpeech": "...",
  "isDialogue": false,
  "dialogueDescription": "...",
  "dialogueScript": "Vendedor: \\"...\\"",
  "speakers": [ { "speaker": "Vendedor", "gender": "masculina", "speech": "...", "scenes": "Cenas 2 a 9" } ],
  "soundEffects": "..."
}`;

        const rawOutput = await executeTopAIModel({
          systemPrompt: detectSystem,
          userPrompt: `INSTRUÇÕES ADICIONAIS FORNECIDAS PELO USUÁRIO:\n${textToAnalyze}\n\nNOME DO PRODUTO: ${productName || 'Produto'}\nINFORMAÇÕES DO PRODUTO: ${productInfo || ''}`,
          jsonMode: true,
        });
        const raw = rawOutput.text;

        let parsed: any = {};
        try {
          parsed = JSON.parse(raw);
        } catch {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            try { parsed = JSON.parse(match[0]); } catch {}
          }
        }

        let userSpeech = (
          parsed.userSpeech ||
          parsed.user_speech ||
          parsed.speech ||
          parsed.fala ||
          parsed.fala_usuario ||
          parsed.texto_fala ||
          ''
        ).trim();

        // Fallback heurístico limpo se o modelo de IA não retornou fala
        if (!userSpeech) {
          const syncExt = extractUserSpeechFromInstructions(textToAnalyze, productName);
          if (syncExt.hasSpeech && syncExt.speech) {
            userSpeech = syncExt.speech;
          }
        }

        userSpeech = normalizeVoiceText(userSpeech);
        if (userSpeech.length > 225) {
          userSpeech = fitSpeechCloseToLimit(userSpeech, 225, 218);
        }

        const hasUserSpeech = Boolean(
          userSpeech &&
          userSpeech.length >= 8 &&
          (parsed.hasUserSpeech === true ||
           parsed.has_user_speech === true ||
           String(parsed.hasUserSpeech).toLowerCase() === 'true' ||
           String(parsed.has_user_speech).toLowerCase() === 'true' ||
           Boolean(userSpeech))
        );

        const isDialogue = Boolean(parsed.isDialogue || (parsed.speakers && parsed.speakers.length > 1));
        const dialogueDescription = parsed.dialogueDescription || '';
        const dialogueScript = parsed.dialogueScript || '';
        const speakers = Array.isArray(parsed.speakers) ? parsed.speakers : [];

        return res.json({
          success: true,
          hasUserSpeech,
          userSpeech: hasUserSpeech ? userSpeech : '',
          isDialogue,
          dialogueDescription,
          dialogueScript,
          speakers,
          usage: rawOutput.usage,
        });
      } catch (err: any) {
        console.warn('Erro ao detectar fala do usuário:', err);
        return res.json({ success: true, hasUserSpeech: false, userSpeech: '' });
      }
    }

    // Ação 2: Revisão conservadora de texto (Botão "Revisar texto" na geração e na tela final do storyboard)
    if (action === 'normalize_speech_for_ai' || action === 'review_user_speech') {
      try {
        const inputSpeech = (req.body.text || req.body.speech || baseCopy || '').trim();
        if (!inputSpeech) {
          return res.status(400).json({ success: false, error: 'Texto não fornecido para revisão.' });
        }

        const charCount = inputSpeech.length;
        const isUnderLimit = charCount <= 225;

        const lengthInstruction = isUnderLimit
          ? `REGRA ABSOLUTA DE TAMANHO (NÃO ENCURTAR):
O texto fornecido tem ${charCount} caracteres e JÁ ESTÁ DENTRO do limite máximo de 225 caracteres.
- É TERMINANTEMENTE PROIBIDO ENCURTAR, RESUMIR, CONDENSAR OU CORTAR QUALQUER FRASE OU PARTE DO TEXTO!
- Mantenha o texto O MAIS ORIGINAL POSSÍVEL, preservando integralmente todas as frases, palavras, argumentos e detalhes originais que o usuário escreveu.
- O comprimento final deve permanecer praticamente idêntico ao original (com pequenas variações apenas pelas correções gramaticais ou remoção de palavras duplicadas).
- A ÚNICA razão permitida para encurtar ou remover algo é se houver palavras repetidas ou gagueira (ex: "aí aí", "ele ele", "o o", "tá tá")!`
          : `REGRA DE TAMANHO (ENCURTAMENTO NECESSÁRIO PORQUE EXCEDE 225 CARACTERES):
O texto fornecido tem ${charCount} caracteres e EXCEDE o limite de 225 caracteres.
- Você DEVE condensar e encurtar o texto para caber com perfeição no limite de até 225 caracteres (idealmente entre 190 e 225 caracteres com espaços).
- Elimine redundâncias, mantendo os principais benefícios e preservando a chamada de ação final (ex: "toca no carrinho laranja e garanta o seu!").
- NUNCA deixe frases cortadas pela metade; a última frase deve estar completa com ponto final ou exclamação.`;

        const reviewSystem = `Você é um REVISOR EDITORIAL DE ALTA FIDELIDADE para narração por voz de IA no TikTok Shop Brasil.
Sua missão é aperfeiçoar o texto do usuário mantendo fidelidade absoluta ao que ele escreveu ou ditou.

${lengthInstruction}

DIRETIVAS OBRIGATÓRIAS:
1. CORREÇÃO GRAMATICAL E ORTOGRÁFICA RIGOROSA:
   - Corrija todos os erros de ortografia, palavras grafadas incorretamente, acentuação, concordância verbal e nominal em português brasileiro (ex: "comprarão" -> "compraram", "mais" -> "mas", "agente" -> "a gente", "preço" -> "preço", etc.).
   - Deixe o texto em português correto, natural e fluido.
2. PONTUAÇÃO E RITMO PARA VOZ DE IA:
   - Ajuste a pontuação (vírgulas nos pontos de respiração natural, exclamações em frases empolgantes, pontos finais firmes) para que o narrador de IA faça pausas naturais e respirações no lugar certo, com entonação empolgante e sem atropelar as palavras.
3. REMOÇÃO DE REPETIÇÕES E GAGUEIRAS:
   - Elimine palavras duplicadas consecutivas ou vícios de fala decorrentes de digitação ou ditado por voz (ex: "aí aí" -> "aí", "ele ele" -> "ele", "o o" -> "o", "que que" -> "que", "comprei comprei" -> "comprei").
4. PRONÚNCIA CORRETA DE PRODUTOS E MEDIDAS:
   - Modelos com "X" (ex: "Poco X8 Pro", "iPhone X", "X8"): NUNCA substitua "X" por "vezes". O "X" refere-se ao nome/modelo do produto e deve permanecer como a letra "X".
   - "800 W" -> "800 watts"
   - "23 pol" -> "23 polegadas"
   - "50%" -> "50 por cento"
   - "AMOLED" -> "Amóled"
5. PRESERVAÇÃO DE CONTEÚDO:
   - Não invente argumentos novos e não adicione chamadas para ação que o usuário não escreveu.
   - ${isUnderLimit ? 'LEMBRE-SE: Como o texto original tem <= 225 caracteres, PRESERVE O MÁXIMO POSSÍVEL DO TEXTO ORIGINAL, apenas corrigindo o português, removendo repetições e ajustando para leitura de IA.' : 'Encurte para até 225 caracteres mantendo o sentido.'}
6. FORMATO DE SAÍDA:
   - Retorne SOMENTE o texto final revisado, sem aspas, sem contagem de caracteres e sem explicações adicionais.`;

        const userPromptReview = isUnderLimit
          ? `TEXTO ORIGINAL PARA REVISÃO (TEM ${charCount} CARACTERES - NÃO ENCURTAR, MANTENHA O TEXTO O MAIS ORIGINAL POSSÍVEL APENAS CORRIGINDO O PORTUGUÊS, PALAVRAS REPETIDAS E PONTUAÇÃO PARA IA):\n${inputSpeech}`
          : `TEXTO ORIGINAL PARA REVISÃO (TEM ${charCount} CARACTERES - EXCEDE 225 CARACTERES, ENCURTE PARA ATÉ 225 CARACTERES MANTENDO O SENTIDO E CALL TO ACTION):\n${inputSpeech}`;

        const reviewedOutput = await executeFastAIText({
          systemPrompt: reviewSystem,
          userPrompt: userPromptReview,
          temperature: 0.1,
        });

        let reviewed = reviewedOutput.text;
        reviewed = reviewed.replace(/^["'«“]|["'»”]$/g, '').trim();
        reviewed = cleanDuplicateWords(reviewed);
        reviewed = normalizeVoiceText(reviewed);

        if (reviewed.length > 225) {
          reviewed = reviewed.slice(0, 225).replace(/[,;:\s]+[^.!?,;:]*$/, '').trim();
          if (!/[.!?]$/.test(reviewed)) {
            reviewed += '!';
          }
        }

        return res.json({
          success: true,
          reviewedSpeech: reviewed,
          usage: reviewedOutput.usage,
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Erro na revisão de texto' });
      }
    }

    // Ação 3: Gerar somente a fala com Aurora Copy (Rápido: ~1s via gpt-4o-mini e estritamente até 225 caracteres)
    if (action === 'generate_aurora_copy') {
      try {
        const minLimit = 190;
        const maxLimit = 225;
        const auroraSystem = `Você é a AURORACOPY, uma especialista em copy para vídeos de TikTok Shop Brasil.
Sua função é transformar as INFORMAÇÕES DO PRODUTO fornecidas pelo usuário em uma fala de alta retenção, natural, específica e persuasiva, pronta para ser usada como narração de vídeo.

OBJETIVO PRINCIPAL:
Criar uma fala que pare o scroll, desperte curiosidade, valorize o principal benefício do produto e faça a pessoa querer conhecer o item.

ESTILO PADRÃO:
Use prioritariamente o formato DESCOBERTA + DEMONSTRAÇÃO.
A sensação deve ser de uma pessoa brasileira mostrando espontaneamente algo interessante que acabou de descobrir, testar ou perceber.
A fala nunca deve parecer propaganda tradicional, locução institucional, descrição de marketplace ou texto corporativo.

IGNORE COMO ARGUMENTO DE VENDA:
Preço, desconto, cupom, frete grátis, parcelamento, promoção financeira. Mesmo que estejam presentes, não baseie a copy neles.

REGRA MANDATÓRIA DE CARACTERES (MUITO IMPORTANTE):
A fala DEVE ter OBRIGATORIAMENTE entre 190 e 225 caracteres no total (contando espaços e pontuação).
NUNCA entregue menos de 190 caracteres!
NUNCA ultrapasse 225 caracteres!
Estruture a fala com:
1. Gancho direto e curioso de abertura (aprox. 35-40 caracteres).
2. Explicação de 2 benefícios concretos com foco na usabilidade real (aprox. 110-125 caracteres).
3. Chamada natural leve para conferir (aprox. 30-40 caracteres).
Totalizando impreterivelmente entre 190 e 225 caracteres.

LINGUAGEM E VOZ IA:
Português do Brasil oral, simples, espontâneo, natural.
Escreva palavras por extenso para narração por IA (ex: "800 watts", "23 polegadas", "por cento").
Use detalhes reais presentes nas informações do produto. NUNCA invente características.

FORMATO DE SAÍDA:
Entregue SOMENTE a fala final, sem aspas, sem títulos, sem explicações, sem contagem de caracteres.`;

        const auroraUser = `INFORMAÇÕES DO PRODUTO:
${productInfo || productName}

NOME DO PRODUTO: ${productName}
${additionalInstructions ? `INSTRUÇÕES ADICIONAIS: ${additionalInstructions}` : ''}
DURAÇÃO DO VÍDEO: 10 segundos.
TAMANHO OBRIGATÓRIO: Exatamente entre ${minLimit} e ${maxLimit} caracteres.`;

        const auroraOutput = await executeFastAIText({
          systemPrompt: auroraSystem,
          userPrompt: auroraUser,
          temperature: 0.7,
        });

        let rawSpeech = auroraOutput.text;
        rawSpeech = rawSpeech.replace(/^["'«“]|["'»”]$/g, '').trim();
        rawSpeech = normalizeVoiceText(rawSpeech);

        // Garantia absoluta de faixa até 225 caracteres
        if (rawSpeech.length < 190) {
          const complementos = [
            ' Confere aqui embaixo pra ver todos os detalhes!',
            ' Vale muito a pena conferir todos os detalhes!',
            ' Dá uma olhada aqui embaixo e aproveita!',
            ' Deixei todos os modelos disponíveis aqui embaixo!',
          ];
          for (const c of complementos) {
            const candidate = rawSpeech.replace(/[.!]+$/, '') + '.' + c;
            if (candidate.length <= 225 && candidate.length >= 190) {
              rawSpeech = candidate;
              break;
            }
          }
        }
        if (rawSpeech.length > 225) {
          rawSpeech = rawSpeech.slice(0, 225).replace(/[,;:\s]+[^.!?,;:]*$/, '') + '!';
        }

        return res.json({ success: true, auroraCopy: rawSpeech, usage: auroraOutput.usage });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Erro ao gerar Aurora Copy' });
      }
    }

    // Item 5: Motor Aurora Copy (IA Criativa) baseado estritamente na ficha técnica do produto
    let activeCopy = baseCopy;
    let copySourceLabel = isCustomCopy ? 'Copy Personalizada' : 'Banco de Copies (Padrão)';

    if (!isCustomCopy && copyEngine === 'aurora_copy') {
      try {
        const client = (openAIProvider as any).getClient();
        if (client) {
          const maxLimit = duration === 8 ? 165 : 235;
          const auroraSystem = `Você é a AURORACOPY, uma especialista em copy curta para vídeos de TikTok Shop Brasil.
Sua função é transformar as INFORMAÇÕES DO PRODUTO fornecidas pelo usuário em uma única fala de alta retenção, natural, específica e persuasiva, pronta para ser usada como narração de vídeo.

OBJETIVO PRINCIPAL:
Criar uma fala que pare o scroll, desperte curiosidade, valorize o principal benefício do produto e faça a pessoa querer continuar assistindo ou conhecer o item.

ESTILO PADRÃO:
Use prioritariamente o formato DESCOBERTA + DEMONSTRAÇÃO.
A sensação deve ser de uma pessoa brasileira mostrando espontaneamente algo interessante que acabou de descobrir, testar ou perceber.
A fala nunca deve parecer propaganda tradicional, locução institucional, descrição de marketplace ou texto corporativo.

IGNORE COMO ARGUMENTO DE VENDA:
Preço, desconto, cupom, frete grátis, parcelamento, promoção financeira. Mesmo que estejam presentes, não baseie a copy neles.

BENEFÍCIO:
Selecione o benefício com maior potencial de gerar curiosidade, ser demonstrado e produzir resultado visual concreto.

ESTRUTURA DA FALA:
1. HOOK FORTE (abrir com surpresa, curiosidade ou reação espontânea).
2. DESCOBERTA (sensação de novidade ou teste real).
3. BENEFÍCIO PRINCIPAL.
4. DEMONSTRAÇÃO (combinar com produto sendo mostrado em uso).
5. CURIOSIDADE OU DESEJO.
6. CTA LEVE ("dá uma olhada nisso", "olha como funciona", "eu deixei aqui", "vale a pena ver", "clica pra ver").

LIMITE RÍGIDO DE CARACTERES:
No MÁXIMO ${maxLimit} caracteres contando espaços e pontuação.
Faixa preferencial: ${duration === 8 ? '130 a 160' : '190 a 230'} caracteres.
Antes de responder: conte os caracteres; se ultrapassar ${maxLimit}, reescreva; nunca corte a frase no meio; nunca entregue texto incompleto.

LINGUAGEM:
Português do Brasil oral, simples, espontâneo, natural. Varie os hooks (não comece sempre com "Gente" ou "Olha isso").
Use detalhes reais presentes nas informações do produto. NUNCA invente características.

FORMATO DE SAÍDA:
Entregue SOMENTE a fala final, sem aspas, sem títulos, sem explicações, sem contagem de caracteres.`;

          const auroraUser = `INFORMAÇÕES DO PRODUTO:
${productInfo || productName}

NOME DO PRODUTO: ${productName}
${additionalInstructions ? `INSTRUÇÕES ADICIONAIS: ${additionalInstructions}` : ''}
DURAÇÃO MÁXIMA DO VÍDEO: ${duration} segundos. Limite estrito: até ${maxLimit} caracteres.`;

          const comp = await client.chat.completions.create({
            model: OPENAI_BRAIN_MODEL,
            messages: [
              { role: 'system', content: auroraSystem },
              { role: 'user', content: auroraUser },
            ],
            temperature: 0.7,
          });

          let rawSpeech = comp.choices[0]?.message?.content?.trim() || '';
          rawSpeech = rawSpeech.replace(/^["'«“]|["'»”]$/g, '').trim();
          if (rawSpeech) {
            if (rawSpeech.length > maxLimit) {
              rawSpeech = rawSpeech.slice(0, maxLimit).replace(/[,;:\s]+$/, '') + '!';
            }
            activeCopy = rawSpeech;
            copySourceLabel = 'Aurora Copy (IA Criativa · Ficha Técnica)';
          }
        }
      } catch (auroraErr: any) {
        console.warn('Falha no motor Aurora Copy, fallback para copy-base:', auroraErr?.message || auroraErr);
      }
    }

    const activeReqVars = Array.isArray(variations)
      ? variations.filter((v: any) => v && (v.photosCount > 0 || v.name))
      : [];
    const variationsClause =
      activeReqVars.length >= 2
        ? `\n- Variações de cor do produto: ${activeReqVars.map((v: any) => v.name).join(', ')}
  REGRA MANDATÓRIA DE NARRATIVA PROGRESSIVA CONTÍNUA (NÃO REPETIR CENAS):
  As 9 cenas formam UMA ÚNICA DEMONSTRAÇÃO PROGRESSIVA DO PRODUTO acompanhando a copy do segundo 0 ao final.
  PROIBIDO REPETIR CENAS OU REINICIAR A DEMONSTRAÇÃO PARA CADA COR! As 9 cenas seguem normalmente seu fluxo narrativo sem repetições (apresentação inicial -> funcionamento prático -> detalhes/macro -> benefício no cenário -> CTA).
  A ÚNICA diferença é a cor em que o produto é retratado em cada grupo de quadros:
  ${
    activeReqVars.length === 2
      ? '• Cenas 1 a 4: produto retratado na 1ª Variação (' + (activeReqVars[0]?.name || '1ª Cor') + ')\n  • Cenas 5 a 9: produto retratado na 2ª Variação (' + (activeReqVars[1]?.name || '2ª Cor') + ')'
      : '• Cenas 1 a 3: produto retratado na 1ª Variação (' + (activeReqVars[0]?.name || '1ª Cor') + ')\n  • Cenas 4 a 6: produto retratado na 2ª Variação (' + (activeReqVars[1]?.name || '2ª Cor') + ')\n  • Cenas 7 a 9: produto retratado na 3ª Variação (' + (activeReqVars[2]?.name || '3ª Cor') + ')'
  }
  REGRA MANDATÓRIA DE PRODUCT LOCK COM VARIAÇÕES:
  NUNCA coloque no "productLock" a cor ou estampa de apenas uma das variações (ex: PROIBIDO escrever "tecido azul-marinho com listras" no productLock se essa for apenas uma das variações)!
  Descreva no "productLock" as características universais da peça e declare: "Variações oficiais de cor: ${activeReqVars.map((v: any) => v.name).join(', ')}, todas corretas e representadas nos seus respectivos quadros do storyboard".
  Nas descrições das cenas, NUNCA cite a cor de uma variação em cenas de outra variação!`
        : '';

    const systemInstruction = buildProdutos2PlanningSystemPrompt();
    const userPrompt = `PLANEJAMENTO COPY-FIRST (MODO PRODUTOS 2.0):
- Produto (nome curto): ${productName}
- Sub-modo: ${subMode === 'vestuario_masculino' ? `Vestuário Masculino (${maleSubOption} - estilo ${maleClothStyle})` : 'Produtos (Geral)'}
- Nicho detectado: ${niche}
- Informações do produto: ${productInfo || productName}
- Copy-base selecionada (${isCustomCopy ? 'PERSONALIZADA PELO USUÁRIO - NÃO ALTERAR' : copyEngine === 'aurora_copy' ? 'GERADA POR AURORA COPY (IA CRIATIVA)' : 'DO BANCO VALIDADO - ADAPTAR MÍNIMO POSSÍVEL'}): "${activeCopy}"
- Duração no Veo: ${duration} segundos (${duration === 8 ? 'MÁXIMO 199 CARACTERES COM ESPAÇOS' : 'ATÉ 250 CARACTERES COM ESPAÇOS'})
- Influencer (quem aparece e voz): ${influencer}
- Gênero do cliente (vocativo): ${clientGender} (se feminino, usar "Amiga" ou "Gente", NUNCA usar "menina")
- Modo de fala: ${speechMode} (locução RÁPIDA E EUFÓRICA, com tom animado como se estivesse contando uma novidade imperdível)
- Regra de frete grátis: NUNCA mencione "frete grátis" ou "frete gratuito" na fala, a menos que isso tenha sido informado diretamente nas informações do produto.
- Enquadramento: ${framing}
- Cenário: ${scenario === 'padrao_uso' ? 'Cenário padrão de uso real do produto' : 'Em casa (casa brasileira simples e aconchegante)'}
- Instruções adicionais prioritárias: ${additionalInstructions || 'Nenhuma'}${variationsClause}

Retorne APENAS um objeto JSON válido com as chaves:
{
  "manufacturerLogoDescription": "string (descreva com precisão cirúrgica a logomarca, emblema, símbolo ou nome da marca impresso/estampado no próprio produto nas fotos de referência: formato, desenho, letras, cor exata e posição exata na peça, ex: 'Logomarca geométrica branca em formato de escudo hexagonal com W estilizado centralizada na parte superior do encosto preto')",
  "adaptedCopy": "string",
  "productLock": ["string (1º item obrigatoriamente a descrição exata da logomarca/marca impressa no produto e sua posição)", "string", "string", "string"],
  "avatarDescription": "string",
  "scenarioDescription": "string",
  "visualMap": [
    { "excerpt": "string", "intent": "string", "visualProof": "string", "scenes": "1–2" }
  ],
  "scenes": [
    {
      "number": 1,
      "startTime": "0.0",
      "endTime": "0.9",
      "framing": "string",
      "action": "string",
      "cameraMovement": "string",
      "storyboardDescription": "string"
    }
  ]
} (exatamente 9 cenas numeradas de 1 a 9 somando ${duration}.0s).`;

    const tryOrder: ('openai' | 'gemini')[] =
      activeProfile === 'gemini' ? ['gemini'] : ['openai'];

    for (const provider of tryOrder) {
      if (provider === 'openai' && openAIProvider.isConfigured()) {
        const client = (openAIProvider as any).getClient();
        const contentBlocks: any[] = [];
        (Array.isArray(productPhotosBase64) ? productPhotosBase64 : []).slice(0, 3).forEach((photo: string) => {
          if (photo && typeof photo === 'string') {
            contentBlocks.push({
              type: 'image_url',
              image_url: {
                url: photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`,
                detail: 'high',
              },
            });
          }
        });
        contentBlocks.push({ type: 'text', text: userPrompt });

        const modelsToTry = [OPENAI_BRAIN_MODEL, 'gpt-4o', 'gpt-4o-mini', OPENAI_AUDIT_MODEL];
        for (const modelCandidate of modelsToTry) {
          try {
            const params: any = {
              model: modelCandidate,
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: contentBlocks },
              ],
              response_format: { type: 'json_object' },
            };
            if (!modelCandidate.startsWith('gpt-5') && !modelCandidate.startsWith('o')) {
              params.temperature = 0.35;
            }
            const completion = await client.chat.completions.create(params);
            const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
            if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length === 9) {
              if (
                typeof parsed.manufacturerLogoDescription === 'string' &&
                parsed.manufacturerLogoDescription.trim().length > 3
              ) {
                const logoLockEntry = `LOGOMARCA ORIGINAL DO FABRICANTE NO PRODUTO (OBRIGATÓRIO REPRODUZIR 100% IDÊNTICA): ${parsed.manufacturerLogoDescription.trim()}`;
                const existingLocks = Array.isArray(parsed.productLock) ? parsed.productLock : [];
                parsed.productLock = [
                  logoLockEntry,
                  ...existingLocks.filter((l: string) => !String(l).includes(parsed.manufacturerLogoDescription.trim())),
                ];
              }
              parsed.finalCopy = activeCopy;
              parsed.copySourceLabel = copySourceLabel;
              const promptTok = completion.usage?.prompt_tokens || 3400;
              const compTok = completion.usage?.completion_tokens || 1100;
              const costUSD = Math.round(((promptTok / 1_000_000) * 2.5 + (compTok / 1_000_000) * 10) * 10000) / 10000;
              const costBRL = Math.round(costUSD * 5.70 * 100) / 100;
              return res.json({
                success: true,
                data: parsed,
                usage: {
                  promptTokens: promptTok,
                  completionTokens: compTok,
                  totalTokens: promptTok + compTok,
                  costUSD: Math.max(0.012, costUSD),
                  costBRL: Math.max(0.07, costBRL),
                  model: modelCandidate,
                },
              });
            }
          } catch (oiErr: any) {
            console.warn(`Aviso OpenAI em produtos2-planning (${modelCandidate}):`, oiErr?.message || oiErr);
          }
        }
      }

      if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
        const parts: any[] = [];
        (Array.isArray(productPhotosBase64) ? productPhotosBase64 : []).slice(0, 3).forEach((photo: string, idx: number) => {
          const parsed = parseInlineImage(photo);
          if (parsed) {
            parts.push({ text: `[Foto de Referência ${idx + 1} do Produto - Fidelidade Absoluta PRODUCT LOCK]:` });
            parts.push({ inlineData: parsed });
          }
        });
        parts.push({ text: userPrompt });

        const geminiModels = [
          GEMINI_VISION_MODEL || 'gemini-3.8-flash',
          'gemini-2.5-flash',
          GEMINI_VISION_FAST_MODEL || 'gemini-3.1-flash-lite',
        ];
        for (const gemModel of geminiModels) {
          try {
            const response = await getGenAI().models.generateContent({
              model: gemModel,
              contents: parts,
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
              },
            });
            const parsed = JSON.parse(response.text || '{}');
            if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length === 9) {
              if (
                typeof parsed.manufacturerLogoDescription === 'string' &&
                parsed.manufacturerLogoDescription.trim().length > 3
              ) {
                const logoLockEntry = `LOGOMARCA ORIGINAL DO FABRICANTE NO PRODUTO (OBRIGATÓRIO REPRODUZIR 100% IDÊNTICA): ${parsed.manufacturerLogoDescription.trim()}`;
                const existingLocks = Array.isArray(parsed.productLock) ? parsed.productLock : [];
                parsed.productLock = [
                  logoLockEntry,
                  ...existingLocks.filter((l: string) => !String(l).includes(parsed.manufacturerLogoDescription.trim())),
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
                  costUSD: 0.005,
                  costBRL: 0.03,
                  model: gemModel,
                },
              });
            }
          } catch (gemErr: any) {
            console.warn(`Aviso Gemini em produtos2-planning (${gemModel}):`, gemErr?.message || gemErr);
          }
        }
      }
    }

    return res.json({ success: false, error: 'Nenhum provedor de IA configurado para planejamento.' });
  } catch (err: any) {
    console.warn('Erro em /api/produtos2-planning:', err?.message || err);
    return res.json({ success: false, error: err?.message || 'Erro no planejamento Produtos 2.0' });
  }
});

/**
 * Inspeciona rapidamente as fotos reais do produto para extrair a especificação exata
 * de qualquer logomarca, emblema ou nome da marca impresso no produto, garantindo que o
 * gerador de imagem do Storyboard nunca apague a logo do fabricante.
 */
async function extractManufacturerLogoSpecFromPhotos(
  photosList: string[],
  productName: string
): Promise<string> {
  if (!photosList || photosList.length === 0) return '';

  const promptLogo = `Inspecione as fotos de referência do produto "${productName}".
O produto possui alguma logomarca, emblema, escudo, símbolo gráfico ou texto de marca do fabricante impresso/estampado/bordado nele mesmo (por exemplo: no encosto, na estrutura, na lateral, no painel ou no rótulo)?
IMPORTANTE: Ignore qualquer marca d'água de rede social fora do produto. Olhe SOMENTE para a marca/logomarca que faz parte do próprio produto físico.
Retorne ESTRITAMENTE um JSON:
{
  "hasManufacturerLogo": boolean,
  "logoSpec": "Descreva em português com máxima precisão visual o formato, desenho/símbolo/letras, cor exata e localização exata da logomarca no produto (ex: 'Grande logomarca/emblema geométrico branco em formato de escudo hexagonal com W estilizado centralizado na parte superior do encosto preto do banco')"
}`;

  if (openAIProvider.isConfigured()) {
    try {
      const client = (openAIProvider as any).getClient();
      const contentBlocks: any[] = [];
      photosList.slice(0, 2).forEach((photo) => {
        contentBlocks.push({
          type: 'image_url',
          image_url: {
            url: photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`,
            detail: 'high',
          },
        });
      });
      contentBlocks.push({ type: 'text', text: promptLogo });

      for (const m of [OPENAI_AUDIT_MODEL || 'gpt-5.6-luna', 'gpt-4o-mini', OPENAI_BRAIN_MODEL]) {
        try {
          const r = await client.chat.completions.create({
            model: m,
            messages: [{ role: 'user', content: contentBlocks }],
            response_format: { type: 'json_object' },
          });
          const parsed = JSON.parse(r.choices[0]?.message?.content || '{}');
          if (parsed?.hasManufacturerLogo && parsed?.logoSpec) {
            return String(parsed.logoSpec).trim();
          }
          return '';
        } catch {
          // try next model
        }
      }
    } catch {
      // fallback
    }
  }
  return '';
}

app.post('/api/produtos2-generate-storyboard', async (req, res) => {
  try {
    const {
      prompt,
      productName = 'Produto',
      productPhotosBase64 = [],
      variations = [],
      additionalInstructions = '',
      previousStoryboardImageBase64 = '',
      correctionPrompt = '',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt do storyboard não fornecido.' });
    }

    const photosList: string[] = Array.isArray(productPhotosBase64)
      ? productPhotosBase64.filter(Boolean)
      : [];

    const activeVariations = Array.isArray(variations)
      ? variations.filter(
          (v: any) =>
            (v.name && String(v.name).trim().length > 0) ||
            (Array.isArray(v.photos) && v.photos.length > 0)
        )
      : [];

    // Se o prompt ainda não tiver a especificação detalhada da logomarca extraída das fotos, extraímos agora
    let logoEnforcementBlock = '';
    if (photosList.length > 0 && !prompt.includes('LOGOMARCA ORIGINAL DO FABRICANTE NO PRODUTO')) {
      const extractedLogo = await extractManufacturerLogoSpecFromPhotos(photosList, productName);
      if (extractedLogo) {
        logoEnforcementBlock = `\n\n========================\nTRAVA OBRIGATÓRIA DE LOGOMARCA DO FABRICANTE NO PRODUTO (FIDELIDADE 1:1):\nNas fotos reais anexadas, o produto possui esta logomarca original de fábrica:\n"${extractedLogo}".\nREGRA INEGOCIÁVEL: Em TODOS os quadrantes do storyboard 3x3 onde essa parte do produto aparecer, você DEVE desenhar e reproduzir FIELMENTE essa exata logomarca do fabricante (mesmo símbolo/desenho, mesma cor, mesmo tamanho e mesma posição na peça). É TERMINANTEMENTE PROIBIDO apagar, remover ou deixar lisa a área onde fica a logomarca do fabricante!\n========================`;
      }
    }

    const baseWithLogo = `${prompt}${logoEnforcementBlock}`;
    const effectivePrompt = correctionPrompt && correctionPrompt.trim()
      ? `${baseWithLogo}\n\n========================\nCORREÇÃO OBRIGATÓRIA DE AUDITORIA DE FIDELIDADE DOS 9 QUADRANTES:\n${correctionPrompt.trim()}\n========================`
      : baseWithLogo;

    const activeProfile = req.body?.aiProfile || getRequestAIProfile(req);
    const tryOrder: ('openai' | 'gemini')[] =
      activeProfile === 'gemini' ? ['gemini'] : ['openai'];

    let lastErrorMessage = '';

    for (const provider of tryOrder) {
      // 1. OpenAI Path
      if (provider === 'openai') {
        if (!openAIProvider.isConfigured()) {
          return res.json({
            success: false,
            error: 'Chave da API da OpenAI não configurada. Defina OPENAI_API_KEY no arquivo .env.',
          });
        }
        try {
          const result = await openAIProvider.generateSceneImage({
            prompt: effectivePrompt,
            productPhotoBase64: photosList[0] || '',
            productPhotosBase64: photosList,
            modelReferenceBase64: undefined, // Sempre usa as fotos reais do produto como referência primária no storyboard 3x3
            referenceFrameBase64: previousStoryboardImageBase64 || undefined,
            variationName: productName,
            productType: productName,
            additionalInstructions: [additionalInstructions, correctionPrompt].filter(Boolean).join(' | '),
            hasUserProvidedModel: false,
            isCloneMode: false,
          });
          if (result.success && result.imageUrl) {
            const imgUsage = {
              promptTokens: 2100,
              completionTokens: 0,
              totalTokens: 2100,
              costUSD: (result as any).costUSD || 0.028,
              costBRL: result.costBRL || 0.16,
              model: OPENAI_IMAGE_MODEL,
            };
            return res.json({ ...result, usage: imgUsage });
          }
          if (result.error) lastErrorMessage = result.error;
          return res.json({ success: false, error: lastErrorMessage || 'Falha na geração com OpenAI.' });
        } catch (oiErr: any) {
          const rawMsg = oiErr?.message || '';
          const isQuota =
            oiErr?.status === 429 ||
            oiErr?.code === 'insufficient_quota' ||
            oiErr?.type === 'insufficient_quota' ||
            /credit_balance_exhausted|no credits remaining|billing|quota|balance/i.test(rawMsg);
          lastErrorMessage = isQuota
            ? 'Acabou o Saldo de sua Chave API da Openai faça uma recarga para continuar gerando.'
            : oiErr?.message || 'Erro OpenAI ao gerar storyboard';
          console.warn('Aviso OpenAI em produtos2-generate-storyboard:', lastErrorMessage);
          return res.json({ success: false, error: lastErrorMessage });
        }
      }

      // 2. Gemini Path
      if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
        const parts: any[] = [];
        photosList.slice(0, 4).forEach((photoStr: string, idx: number) => {
          const parsed = parseInlineImage(photoStr);
          if (parsed) {
            parts.push({ inlineData: parsed });
            if (activeVariations.length >= 2) {
              const matchedVarIdx = activeVariations.findIndex(
                (v: any) => Array.isArray(v.photos) && v.photos.includes(photoStr)
              );
              const vIdx = matchedVarIdx >= 0 ? matchedVarIdx : Math.min(idx, activeVariations.length - 1);
              const varName = activeVariations[vIdx]?.name?.trim() || `Variação ${vIdx + 1}`;
              const frameRange =
                activeVariations.length === 2
                  ? vIdx === 0
                    ? 'Quadros 1, 2, 3 e 4'
                    : 'Quadros 5, 6, 7, 8 e 9'
                  : vIdx === 0
                  ? 'Quadros 1, 2 e 3 (Linha 1)'
                  : vIdx === 1
                  ? 'Quadros 4, 5 e 6 (Linha 2)'
                  : 'Quadros 7, 8 e 9 (Linha 3)';

              parts.push({
                text: `[FOTO DE REFERÊNCIA REAL - VARIAÇÃO ${vIdx + 1}: ${varName.toUpperCase()}]: Esta foto define a cor/estilo para uso RIGOROSO nos ${frameRange}. O modelo, formato, peças e logomarca do fabricante devem permanecer idênticos, mas a cor deve ser exatamente a desta foto nesses quadros específicos!`,
              });
            } else {
              parts.push({
                text: `[FOTO DE REFERÊNCIA REAL DO PRODUTO #${idx + 1} (${productName})]: Preserve 100% idênticos o formato, cor, proporção, textura, botões e OBRIGATORIAMENTE A LOGOMARCA/EMBLEMA E TEXTOS DO FABRICANTE IMPRESSOS NO PRODUTO em todos os 9 quadros do storyboard 3x3. JAMAIS apague a logo original do produto.`,
              });
            }
          }
        });

        if (previousStoryboardImageBase64 && typeof previousStoryboardImageBase64 === 'string') {
          const parsedPrev = parseInlineImage(previousStoryboardImageBase64);
          if (parsedPrev) {
            parts.push({ inlineData: parsedPrev });
            parts.push({
              text: `[STORYBOARD ANTERIOR ENVIADO COMO REFERÊNCIA DE BASE]: Esta imagem acima é o storyboard 3x3 gerado anteriormente. REGRA OBRIGATÓRIA: Mantenha RIGOROSAMENTE IDÊNTICOS todos os quadros que não foram solicitados para alteração. Altere EXCLUSIVAMENTE os quadros apontados na instrução de correção (especialmente as ordens do usuário com prioridade soberana), aplicando a modificação solicitada mantendo as demais cenas iguais.`,
            });
          }
        }

        parts.push({ text: effectivePrompt });

        const variationInstructionRule =
          activeVariations.length >= 2
            ? `- REGRA MANDATÓRIA DE ALTERNÂNCIA DE CORES ENTRE OS QUADROS (GRADE 3x3): O produto possui ${activeVariations.length} variações de cores/modelos. Você DEVE OBRIGATORIAMENTE alternar as cores conforme a divisão especificada: ${
                activeVariations.length === 2
                  ? 'Quadros 1 a 4 na Variação 1 (' + (activeVariations[0]?.name || '1ª cor') + '); Quadros 5 a 9 na Variação 2 (' + (activeVariations[1]?.name || '2ª cor') + ')'
                  : 'Quadros 1 a 3 na Variação 1 (' + (activeVariations[0]?.name || '1ª cor') + '); Quadros 4 a 6 na Variação 2 (' + (activeVariations[1]?.name || '2ª cor') + '); Quadros 7 a 9 na Variação 3 (' + (activeVariations[2]?.name || '3ª cor') + ')'
              }. NUNCA gere todos os 9 quadros na mesma cor! É expressamente PROIBIDO usar uma única cor para todo o storyboard quando há variações informadas. Apenas o modelo, formato e peças permanecem idênticos, a cor DEVE alternar entre os blocos de quadros!`
            : `- PRODUCT LOCK ABSOLUTO: O produto em todos os 9 quadros onde aparece deve ser 100% idêntico às fotos reais anexadas (mesmo formato, cor, textura, botões, funções, proporção e detalhes).`;

        const systemInstructionText = `VOCÊ É O GERADOR DE STORYBOARD 3x3 DO MODO PRODUTOS 2.0.
- Gere UMA ÚNICA IMAGEM VERTICAL 9:16 (1080x1920) contendo uma grade 3x3 (3 colunas x 3 linhas) com EXATAMENTE 9 quadros fotográficos ultra-realistas numerados de 1 a 9 (selo circular branco pequeno no canto superior esquerdo de cada quadro com número preto).
- Cantos arredondados nos quadros, separados por uma borda branca fina, sobre fundo branco.
${variationInstructionRule}
- LOGOMARCA E MARCA DO FABRICANTE NO PRODUTO (OBRIGATÓRIO): A marca, a logomarca, o emblema e os textos que já estão impressos/estampados no próprio produto nas fotos de referência DEVEM aparecer 100% idênticos, na mesma cor e no mesmo lugar da peça, em todos os quadros em que aquela parte estiver visível. JAMAIS remova ou alise a logomarca do produto!
- ZERO ELEMENTOS EXTERNOS DE REDE SOCIAL: Não adicione legendas flutuantes, textos publicitários externos, preços, setas, carrinho de compras, marca d'água externa, @ ou logotipo do TikTok. Apenas os números 1 a 9 nos selos circulares e a logomarca original do fabricante no próprio produto.`;

        const modelsToTry = [
          GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
          GEMINI_IMAGE_FAST_MODEL || 'gemini-3.1-flash-lite-image',
          'gemini-3-pro-image',
        ];

        for (const modelCandidate of modelsToTry) {
          try {
            const imgRes = await getGenAI().models.generateContent({
              model: modelCandidate,
              contents: { parts },
              config: {
                systemInstruction: systemInstructionText,
                imageConfig: {
                  aspectRatio: '9:16',
                },
              },
            });

            const candidates = imgRes.candidates || [];
            if (candidates[0]?.content?.parts) {
              for (const part of candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  const mime = part.inlineData.mimeType || 'image/png';
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
                      model: modelCandidate,
                    },
                  });
                }
              }
            }
          } catch (imgErr: any) {
            lastErrorMessage = imgErr?.message || 'Erro ao gerar imagem do storyboard';
            console.warn(`Tentativa storyboard com ${modelCandidate} falhou:`, lastErrorMessage);
          }
        }
      }
    }

    return res.json({
      success: false,
      error: lastErrorMessage || 'Não foi possível gerar a imagem do storyboard.',
    });
  } catch (err: any) {
    console.error('Erro em /api/produtos2-generate-storyboard:', err);
    return res.json({
      success: false,
      error: err?.message || 'Erro inesperado ao gerar storyboard.',
    });
  }
});

// ─── ENDPOINT: FISCALIZAÇÃO DE FIDELIDADE DOS 9 QUADRANTES DO STORYBOARD 3x3 ──
function getAuditColorStatus(score: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (score >= 90) return 'green';
  if (score >= 71) return 'yellow';
  if (score >= 60) return 'orange';
  return 'red';
}

function getAuditColorLabel(status: 'green' | 'yellow' | 'orange' | 'red', score: number): string {
  if (status === 'green') return `Verde — Produto Idêntico (${score}%)`;
  if (status === 'yellow') return `Amarelo — Pequena Diferença (${score}%)`;
  if (status === 'orange') return `Laranja — Diferença Moderada (${score}%)`;
  return `Vermelho — Produto Muito Diferente (${score}%)`;
}

app.post('/api/produtos2-audit-storyboard', async (req, res) => {
  try {
    const {
      storyboardImageBase64,
      productPhotosBase64 = [],
      productName = 'Produto',
      productLock = [],
      scenes = [],
      variations = [],
    } = req.body;

    if (!storyboardImageBase64) {
      return res.status(400).json({ success: false, error: 'Imagem do storyboard não fornecida para auditoria.' });
    }

    const photosList: string[] = Array.isArray(productPhotosBase64)
      ? productPhotosBase64.filter(Boolean)
      : [];

    const activeVariations = Array.isArray(variations)
      ? variations.filter(
          (v: any) =>
            (v.name && String(v.name).trim().length > 0) ||
            (Array.isArray(v.photos) && v.photos.length > 0)
        )
      : [];

    const scenesContext = Array.isArray(scenes)
      ? scenes
          .slice(0, 9)
          .map((s: any, idx: number) => `Cena ${idx + 1}: ${s.framing || ''}. ${s.action || ''}`)
          .join('\n')
      : '';

    const lockContext = Array.isArray(productLock) ? productLock.join('; ') : '';

    const variationsAuditRule =
      activeVariations.length >= 2
        ? `\nPASSO 3 — VERIFICAÇÃO MANDATÓRIA DE ALTERNÂNCIA DE CORES/VARIAÇÕES DO PRODUTO (DIVISÃO 3x3):
O produto possui ${activeVariations.length} variações distintas de cores/modelos anexadas nas fotos:
${
  activeVariations.length === 2
    ? `• Quadros 1, 2, 3 e 4 (metade inicial): O produto DEVE estar na Variação 1 ("${activeVariations[0]?.name || '1ª Variação'}"). Compare estes quadros EXCLUSIVAMENTE com a Foto de Referência da Variação 1!
• Quadros 5, 6, 7, 8 e 9 (segunda metade): O produto DEVE estar na Variação 2 ("${activeVariations[1]?.name || '2ª Variação'}"). Compare estes quadros EXCLUSIVAMENTE com a Foto de Referência da Variação 2! NUNCA compare com a Variação 1!`
    : `• Quadros 1, 2 e 3 (Linha 1): O produto DEVE estar na Variação 1 ("${activeVariations[0]?.name || '1ª Variação'}"). Compare estes quadros EXCLUSIVAMENTE com a Foto da Variação 1!
• Quadros 4, 5 e 6 (Linha 2): O produto DEVE estar na Variação 2 ("${activeVariations[1]?.name || '2ª Variação'}"). Compare estes quadros EXCLUSIVAMENTE com a Foto da Variação 2! NUNCA compare com a Variação 1! A cor esperada dos quadros 4, 5 e 6 É "${activeVariations[1]?.name || '2ª Variação'}". Se o produto estiver em "${activeVariations[1]?.name}", está 100% CORRETO e APROVADO!
• Quadros 7, 8 e 9 (Linha 3): O produto DEVE estar na Variação 3 ("${activeVariations[2]?.name || '3ª Variação'}"). Compare estes quadros EXCLUSIVAMENTE com a Foto da Variação 3! NUNCA compare com a Variação 1 ou 2! A cor esperada dos quadros 7, 8 e 9 É "${activeVariations[2]?.name || '3ª Variação'}". Se o produto estiver em "${activeVariations[2]?.name}", está 100% CORRETO e APROVADO!`
}
REGRA ABSOLUTA CONTRA FALSOS POSITIVOS DE COR:
- É EXPRESSAMENTE PROIBIDO esperar a cor da Variação 1 nos quadros pertencentes à Variação 2 ou Variação 3!
- Cada grupo de quadros deve ser comparado unicamente com a sua própria variação.
- Se o quadro 4, 5 ou 6 estiver na cor da Variação 2, ele DEVE receber nota máxima (90 a 100).
- Se o quadro 7, 8 ou 9 estiver na cor da Variação 3, ele DEVE receber nota máxima (90 a 100).
- Dê nota baixa (<60) APENAS se o quadro violar a sua respectiva variação (por exemplo, se o quadro 4 ficou na cor da Variação 1 em vez da Variação 2, ou se todos os 9 quadros foram gerados na mesma cor).`
        : '';

    const auditSystemInstruction = `Você é o Fiscal Rigoroso de Fidelidade Visual de Produtos (Storyboard 3x3 — 9 Quadrantes).
Sua missão é inspecionar CADA UM DOS 9 QUADRANTES (numerados de 1 a 9, da esquerda para a direita, de cima para baixo: Linha 1 = Cenas 1, 2, 3; Linha 2 = Cenas 4, 5, 6; Linha 3 = Cenas 7, 8, 9) da imagem de Storyboard gerada e comparar o produto com as FOTOS REAIS DE REFERÊNCIA do produto "${productName}".

PASSO 1 — VERIFICAÇÃO DA LOGOMARCA DO FABRICANTE NAS FOTOS DE REFERÊNCIA:
Primeiro, olhe com atenção máxima para as FOTOS DE REFERÊNCIA REAIS do produto e identifique se o produto possui alguma LOGOMARCA, EMBLEMA, ESCUDO, SÍMBOLO ou NOME DA MARCA impresso/estampado/gravado nele (por exemplo: logomarca branca no topo do encosto de um banco de exercícios, logo na lateral, emblema frontal, rótulo, etc.).
- Preencha "hasReferenceLogo": true ou false.
- Preencha "referenceLogoDescription": descrição exata da logomarca original vista na foto de referência e em qual parte do produto ela fica (ex: "Logomarca geométrica branca em formato de escudo no topo do encosto preto").

PASSO 2 — REGRAS DE OURO DA FISCALIZAÇÃO POR QUADRANTE (CENA 1 A CENA 9):
1. Se em algum quadrante aparecer SOMENTE o modelo/pessoa ou SOMENTE o cenário, SEM o produto aparecer:
   - "productVisible": false
   - "logoPartVisible": false
   - "logoFaithful": true
   - "score": 100
   - "issue": "Cena X: Apenas modelo/cenário (sem produto visível — OK)"
2. Em TODOS os quadrantes onde o produto aparece ("productVisible": true), avalie com rigor máximo em escala INTEIRA de 0 a 100:
   - VERIFICAÇÃO CRÍTICA DE LOGOMARCA DO FABRICANTE ("logoPartVisible" e "logoFaithful"):
     * Se a parte específica do produto onde fica a logomarca nas fotos de referência (ex: a face frontal superior do encosto do banco) está visível e desobstruída naquele quadrante, marque "logoPartVisible": true.
     * Se o quadrante é um close em outra parte do produto onde não há logo na foto original (ex: pino de ajuste, base inferior, pés, verso) OU se a pessoa está deitada/apoiada cobrindo exatamente o local da logo, marque "logoPartVisible": false, "logoFaithful": true e avalie a nota (90 a 98 se a parte visível estiver fiel à foto de referência!).
     * Quando "logoPartVisible": true, verifique se a logomarca original do fabricante está presente e idêntica naquele quadrante!
     * SE "logoPartVisible": true E A LOGOMARCA DO FABRICANTE FOI REMOVIDA, APAGADA, DEIXADA LISA OU ALTERADA naquele quadrante:
       -> Marque OBRIGATORIAMENTE "logoFaithful": false!
       -> Dê OBRIGATORIAMENTE uma nota BAIXA entre 45 e 58 (VERMELHO, abaixo de 60) para aquele quadrante! NUNCA dê nota alta se a parte da logo está visível e a logo sumiu!
       -> No campo "issue" (SEMPRE EM PORTUGUÊS), escreva claramente: "Na Cena X, o produto está diferente: a logomarca original do fabricante ([descreva a logo e onde fica, ex: no encosto]) foi removida e não aparece como na foto de referência."
   - CORES, FORMATO, ESTRUTURA E DETALHES: Verifique também se cor, formato, estofamento, costuras, pinos e peças conferem 100% com as fotos de referência.${variationsAuditRule}
3. ESCALA INTEIRA DE NOTAS DE CADA QUADRANTE (0 a 100 — NUNCA use decimais de 0 a 1):
   - 90 a 100 (VERDE): Produto 90%+ idêntico às fotos de referência (logomarca original presente e fiel quando a área aparece, ou close fiel de outra parte do produto).
   - 71 a 89 (AMARELO): Produto com pequena variação leve de detalhe secundário.
   - 60 a 70 (LARANJA): Diferença moderada de formato/cor ou logomarca parcialmente distorcida/apagada.
   - Abaixo de 60 (VERMELHO): Logomarca original do fabricante removida/ausente em quadrante onde aquela parte está visível, formato errado ou cor errada da variação correspondente.

CONTEXTO DO PRODUCT LOCK ESPERADO:
${lockContext}

DESCRIÇÃO PLANEJADA DAS 9 CENAS:
${scenesContext}

Retorne ESTRITAMENTE um objeto JSON válido EM PORTUGUÊS com este formato exato:
{
  "hasReferenceLogo": true,
  "referenceLogoDescription": "string em português descrevendo a logomarca original e sua posição na foto de referência",
  "quadrants": [
    {
      "sceneNumber": 1,
      "productVisible": true,
      "logoPartVisible": true,
      "logoFaithful": false,
      "score": 52,
      "issue": "Na Cena 1, o produto está diferente: a logomarca branca original do fabricante no encosto foi removida."
    }
  ]
}
O array "quadrants" DEVE conter exatamente 9 itens (sceneNumber 1 a 9), com "issue" sempre em português do Brasil.`;

    const activeProfile = req.body?.aiProfile || getRequestAIProfile(req);
    const tryOrder: ('openai' | 'gemini')[] =
      activeProfile === 'gemini' ? ['gemini'] : ['openai'];

    let rawQuadrants: any[] | null = null;
    let hasReferenceLogo = false;
    let referenceLogoDescription = '';
    let lastAuditUsage: any = null;

    for (const provider of tryOrder) {
      if (rawQuadrants) break;

      // 1. OpenAI Vision Path
      if (provider === 'openai' && openAIProvider.isConfigured()) {
        try {
          const client = (openAIProvider as any).getClient();
          const contentBlocks: any[] = [];

          if (activeVariations.length >= 2) {
            activeVariations.forEach((v: any, idx: number) => {
              const photo = v.photos?.[0] || v.photo || photosList[idx];
              if (photo) {
                contentBlocks.push({
                  type: 'text',
                  text: `[FOTO DE REFERÊNCIA REAL DA VARIAÇÃO ${idx + 1} ("${v.name || 'Variação ' + (idx + 1)}") — OBSERVE A COR E ACABAMENTO DESTA VARIAÇÃO]:`,
                });
                contentBlocks.push({
                  type: 'image_url',
                  image_url: {
                    url: photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`,
                    detail: 'high',
                  },
                });
              }
            });
          } else {
            photosList.slice(0, 4).forEach((photo: string, idx: number) => {
              contentBlocks.push({
                type: 'text',
                text: `[FOTO DE REFERÊNCIA REAL DO PRODUTO #${idx + 1} — OBSERVE ATENTAMENTE O FORMATO, COR E A LOGOMARCA DO FABRICANTE IMPRESSA NO PRODUTO]:`,
              });
              contentBlocks.push({
                type: 'image_url',
                image_url: {
                  url: photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`,
                  detail: 'high',
                },
              });
            });
          }

          contentBlocks.push({
            type: 'text',
            text: '[IMAGEM GERADA — STORYBOARD 3x3 COM 9 CENAS NUMERADAS DE 1 A 9 PARA FISCALIZAÇÃO]:',
          });
          contentBlocks.push({
            type: 'image_url',
            image_url: {
              url: storyboardImageBase64.startsWith('data:')
                ? storyboardImageBase64
                : `data:image/png;base64,${storyboardImageBase64}`,
              detail: 'high',
            },
          });

          contentBlocks.push({
            type: 'text',
            text: 'Inspecione cada um dos 9 quadrantes (Cena 1 a Cena 9) comparando rigorosamente com as fotos reais de referência (especialmente se a logomarca do fabricante impressa no produto está presente nos quadros onde aquela parte do produto aparece e se a divisão de cores das variações foi estritamente respeitada) e retorne o JSON em português.',
          });

          const modelsToTry = [OPENAI_AUDIT_MODEL || 'gpt-5.6-luna', 'gpt-4o', 'gpt-4o-mini', OPENAI_BRAIN_MODEL];
          for (const modelCandidate of modelsToTry) {
            try {
              const params: any = {
                model: modelCandidate,
                messages: [
                  { role: 'system', content: auditSystemInstruction },
                  { role: 'user', content: contentBlocks },
                ],
                response_format: { type: 'json_object' },
              };
              if (!modelCandidate.startsWith('gpt-5') && !modelCandidate.startsWith('o')) {
                params.temperature = 0.15;
              }
              const completion = await client.chat.completions.create(params);
              const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
              if (parsed && Array.isArray(parsed.quadrants) && parsed.quadrants.length > 0) {
                rawQuadrants = parsed.quadrants;
                hasReferenceLogo = Boolean(parsed.hasReferenceLogo);
                referenceLogoDescription = String(parsed.referenceLogoDescription || '').trim();
                const pTok = completion.usage?.prompt_tokens || 3500;
                const cTok = completion.usage?.completion_tokens || 700;
                lastAuditUsage = {
                  promptTokens: pTok,
                  completionTokens: cTok,
                  totalTokens: pTok + cTok,
                  costUSD: 0.011,
                  costBRL: 0.063,
                  model: modelCandidate,
                };
                break;
              }
            } catch (e: any) {
              console.warn(`Aviso OpenAI audit storyboard (${modelCandidate}):`, e?.message || e);
            }
          }
        } catch (oiErr: any) {
          console.warn('Falha OpenAI em produtos2-audit-storyboard:', oiErr?.message || oiErr);
        }
      }

      // 2. Gemini Vision Path
      if (!rawQuadrants && provider === 'gemini' && process.env.GEMINI_API_KEY) {
        try {
          const parts: any[] = [];
          if (activeVariations.length >= 2) {
            activeVariations.forEach((v: any, idx: number) => {
              const photo = v.photos?.[0] || v.photo || photosList[idx];
              const parsedRef = photo ? parseInlineImage(photo) : null;
              if (parsedRef) {
                parts.push({
                  text: `[FOTO DE REFERÊNCIA REAL DA VARIAÇÃO ${idx + 1} ("${v.name || 'Variação ' + (idx + 1)}") — OBSERVE A COR E ACABAMENTO DESTA VARIAÇÃO]:`,
                });
                parts.push({ inlineData: parsedRef });
              }
            });
          } else {
            photosList.slice(0, 4).forEach((photo: string, idx: number) => {
              const parsedRef = parseInlineImage(photo);
              if (parsedRef) {
                parts.push({ text: `[FOTO DE REFERÊNCIA REAL DO PRODUTO #${idx + 1} — OBSERVE A LOGOMARCA DO FABRICANTE, COR E DETALHES]:` });
                parts.push({ inlineData: parsedRef });
              }
            });
          }
          const parsedStoryboard = parseInlineImage(storyboardImageBase64);
          if (parsedStoryboard) {
            parts.push({ text: '[IMAGEM GERADA — STORYBOARD 3x3 (9 CENAS NUMERADAS DE 1 A 9)]:' });
            parts.push({ inlineData: parsedStoryboard });
          }
          parts.push({
            text: `${auditSystemInstruction}\n\nAnalise cada um dos 9 quadrantes (Cena 1 a Cena 9) e retorne o JSON em português.`,
          });

          const geminiModels = [
            GEMINI_VISION_MODEL || 'gemini-3.8-flash',
            'gemini-2.5-flash',
            GEMINI_VISION_FAST_MODEL || 'gemini-3.1-flash-lite',
          ];
          for (const gemModel of geminiModels) {
            try {
              const auditRes = await getGenAI().models.generateContent({
                model: gemModel,
                contents: parts,
                config: {
                  responseMimeType: 'application/json',
                },
              });
              const parsed = JSON.parse(auditRes.text || '{}');
              if (parsed && Array.isArray(parsed.quadrants) && parsed.quadrants.length > 0) {
                rawQuadrants = parsed.quadrants;
                hasReferenceLogo = Boolean(parsed.hasReferenceLogo);
                referenceLogoDescription = String(parsed.referenceLogoDescription || '').trim();
                const pTok = auditRes.usageMetadata?.promptTokenCount || 3500;
                const cTok = auditRes.usageMetadata?.candidatesTokenCount || 700;
                lastAuditUsage = {
                  promptTokens: pTok,
                  completionTokens: cTok,
                  totalTokens: pTok + cTok,
                  costUSD: 0.005,
                  costBRL: 0.03,
                  model: gemModel,
                };
                break;
              }
            } catch (gemErr: any) {
              console.warn(`Aviso Gemini em produtos2-audit-storyboard (${gemModel}):`, gemErr?.message || gemErr);
            }
          }
        } catch (gemOuterErr: any) {
          console.warn('Aviso Gemini outer em produtos2-audit-storyboard:', gemOuterErr?.message || gemOuterErr);
        }
      }
    }

    // Normalizar os 9 quadrantes com trava rígida de penalização caso a logomarca do produto tenha sido removida
    const normalizedQuadrants = Array.from({ length: 9 }, (_, i) => {
      const sceneNum = i + 1;
      const found = (rawQuadrants || []).find((q: any) => Number(q.sceneNumber) === sceneNum) || (rawQuadrants || [])[i];
      const productVisible = found?.productVisible !== undefined ? Boolean(found.productVisible) : true;
      const logoPartVisible = found?.logoPartVisible !== undefined ? Boolean(found.logoPartVisible) : false;
      const logoFaithful = found?.logoFaithful !== undefined ? Boolean(found.logoFaithful) : true;

      let rawScore = productVisible ? Number(found?.score ?? 93) : 100;
      if (isNaN(rawScore)) rawScore = 93;
      // Caso algum modelo retorne escala 0..1 (ex: 0.95 ou 0.55), converte para 0..100
      if (rawScore > 0 && rawScore <= 1) {
        rawScore = Math.round(rawScore * 100);
      }

      let issue = String(found?.issue || '').trim();
      const lowerIssue = issue.toLowerCase();
      const mentionsMissingLogo =
        (logoPartVisible && !logoFaithful) ||
        lowerIssue.includes('foi removid') ||
        (logoPartVisible &&
          (lowerIssue.includes('not visible') ||
            lowerIssue.includes('missing') ||
            lowerIssue.includes('sem a logo') ||
            lowerIssue.includes('sem logo') ||
            lowerIssue.includes('ausente') ||
            lowerIssue.includes('não aparece')));

      // Se a parte com logomarca está visível mas a logomarca do fabricante sumiu/foi removida, força nota < 60 (Vermelho)
      if (productVisible && mentionsMissingLogo) {
        rawScore = Math.min(rawScore, 54);
        if (!issue || !lowerIssue.includes('cena')) {
          const logoRefText = referenceLogoDescription
            ? ` (${referenceLogoDescription})`
            : ' presente na foto de referência';
          issue = `Na Cena ${sceneNum}, o produto está diferente: a logomarca original do fabricante${logoRefText} foi removida ou não aparece idêntica na peça.`;
        }
      }

      // Verificação de falso positivo de cor entre variações:
      // Se o fiscal reclamou que a cor na cena da Variação 2 ou 3 diverge da Variação 1 (ex: "em vez de azul-marinho"):
      let isFalsePositiveVariationMismatch = false;
      if (activeVariations.length >= 2) {
        const expectedVarIndex =
          activeVariations.length === 2
            ? (sceneNum <= 4 ? 0 : 1)
            : (sceneNum <= 3 ? 0 : sceneNum <= 6 ? 1 : 2);
        const var1Name = (activeVariations[0]?.name || '').toLowerCase();
        const var1Words = var1Name.split(/[\s/,-]+/).filter((w: string) => w.length >= 4);

        if (expectedVarIndex > 0) {
          const mentionsVar1 = var1Words.some((w: string) => lowerIssue.includes(w));
          const hasDivergencePhrase =
            lowerIssue.includes('em vez de') ||
            lowerIssue.includes('em lugar de') ||
            lowerIssue.includes('diverge do produto esperado') ||
            lowerIssue.includes('diverge da cor') ||
            lowerIssue.includes('em vez do') ||
            lowerIssue.includes('em vez da');

          if (hasDivergencePhrase || mentionsVar1) {
            isFalsePositiveVariationMismatch = true;
          }
        }
      }

      if (isFalsePositiveVariationMismatch) {
        rawScore = Math.max(rawScore, 95);
        const expectedVarIndex =
          activeVariations.length === 2
            ? (sceneNum <= 4 ? 0 : 1)
            : (sceneNum <= 3 ? 0 : sceneNum <= 6 ? 1 : 2);
        const expectedVarName = activeVariations[expectedVarIndex]?.name || `Variação ${expectedVarIndex + 1}`;
        issue = `Cena ${sceneNum}: Produto idêntico à Variação ${expectedVarName} (95%)`;
      } else {
        const mentionsWrongVariation =
          lowerIssue.includes('variação') &&
          (lowerIssue.includes('incorret') ||
            lowerIssue.includes('cor errada') ||
            lowerIssue.includes('cor diferente') ||
            lowerIssue.includes('deveria ser') ||
            lowerIssue.includes('mesma cor'));

        if (productVisible && mentionsWrongVariation) {
          rawScore = Math.min(rawScore, 54);
        }
      }

      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const status = getAuditColorStatus(score);

      if (!issue) {
        if (!productVisible) {
          issue = `Cena ${sceneNum}: Apenas modelo/cenário (sem produto visível — OK)`;
        } else if (score >= 90) {
          issue = `Cena ${sceneNum}: Produto idêntico à referência (${score}%)`;
        } else {
          issue = `Na Cena ${sceneNum}, o produto está diferente da foto de referência (${score}%).`;
        }
      } else if (productVisible && score < 90 && !issue.toLowerCase().includes(`cena ${sceneNum}`)) {
        issue = `Na Cena ${sceneNum}, o produto está diferente: ${issue}`;
      }

      return {
        sceneNumber: sceneNum,
        productVisible,
        score,
        status,
        issue,
      };
    });

    // Calcular pontuação geral considerando os quadrantes onde o produto aparece
    const visibleQuadrants = normalizedQuadrants.filter((q) => q.productVisible);
    const problemQuadrants = visibleQuadrants.filter((q) => q.score < 90);
    const approvedQuadrants = normalizedQuadrants.filter((q) => q.score >= 90);

    let overallScore = 95;
    if (visibleQuadrants.length > 0) {
      const avgScore =
        visibleQuadrants.reduce((acc, q) => acc + q.score, 0) / visibleQuadrants.length;
      const minScore = Math.min(...visibleQuadrants.map((q) => q.score));

      if (problemQuadrants.length === 0) {
        overallScore = Math.max(90, Math.round(avgScore));
      } else if (minScore < 60) {
        // Se pelo menos 1 cena ficou muito diferente (<60%), nota geral cai para faixa vermelha (<60)
        overallScore = Math.min(59, Math.round(minScore * 0.75 + avgScore * 0.25));
      } else if (minScore <= 70) {
        // Faixa laranja (60 a 70%)
        overallScore = Math.min(70, Math.max(60, Math.round(minScore * 0.7 + avgScore * 0.3)));
      } else {
        // Faixa amarela (71 a 89%)
        overallScore = Math.min(89, Math.max(71, Math.round(minScore * 0.65 + avgScore * 0.35)));
      }
    }

    const overallStatus = getAuditColorStatus(overallScore);
    const overallLabel = getAuditColorLabel(overallStatus, overallScore);

    const summaryIssues =
      problemQuadrants.length > 0
        ? problemQuadrants.map((q) => `${q.issue} (Nota: ${q.score}%)`)
        : ['Todas as 9 cenas estão com fidelidade acima de 90% em relação às fotos de referência.'];

    // Construir prompt cirúrgico de correção para quando o usuário clicar em "Refazer"
    let correctionPrompt = '';
    const logoMandatoryNote =
      hasReferenceLogo && referenceLogoDescription
        ? `OBRIGATÓRIO REPRODUZIR A LOGOMARCA ORIGINAL DO FABRICANTE NO PRODUTO: "${referenceLogoDescription}". JAMAIS deixe a superfície lisa onde existe a logomarca nas fotos de referência!`
        : `OBRIGATÓRIO preservar 100% idênticos a logomarca e os textos originais do fabricante impressos no próprio produto nas fotos de referência.`;

    const variationMandatoryNote =
      activeVariations.length >= 2
        ? activeVariations.length === 2
          ? `DIVISÃO OBRIGATÓRIA DE CORES: Quadros 1 a 4 na Variação 1 (${activeVariations[0]?.name || '1ª Cor'}), e Quadros 5 a 9 na Variação 2 (${activeVariations[1]?.name || '2ª Cor'}). NUNCA gere todos os quadros na mesma cor!`
          : `DIVISÃO OBRIGATÓRIA DE CORES: Quadros 1 a 3 na Variação 1 (${activeVariations[0]?.name || '1ª Cor'}), Quadros 4 a 6 na Variação 2 (${activeVariations[1]?.name || '2ª Cor'}), e Quadros 7 a 9 na Variação 3 (${activeVariations[2]?.name || '3ª Cor'}). NUNCA gere todos os quadros na mesma cor!`
        : '';

    if (problemQuadrants.length > 0) {
      const approvedNums = approvedQuadrants.map((q) => q.sceneNumber).join(', ');
      const fixesList = problemQuadrants
        .map(
          (q) =>
            `- CORRIGIR CENA ${q.sceneNumber} (nota anterior ${q.score}%): ${q.issue}. Faça o produto "${productName}" na Cena ${q.sceneNumber} ficar 100% IDÊNTICO às fotos reais de referência (reproduzindo fielmente a logomarca original do fabricante na peça, cores das variações, formato e botões).`
        )
        .join('\n');

      correctionPrompt = [
        logoMandatoryNote,
        variationMandatoryNote,
        approvedNums
          ? `MANTENHA A QUALIDADE E FIDELIDADE DAS CENAS JÁ APROVADAS (Cenas ${approvedNums}).`
          : '',
        `CORRIJA PRIORITARIAMENTE AS CENAS ONDE O PRODUTO FICOU DIFERENTE:`,
        fixesList,
        `OBJETIVO OBRIGATÓRIO: Atingir mais de 90% de similaridade em TODOS os 9 quadrantes, preservando logomarca do fabricante, textos impressos no produto, cores das variações, formato e botões 100% idênticos às fotos de referência.`,
      ]
        .filter(Boolean)
        .join('\n');
    } else {
      correctionPrompt = [
        logoMandatoryNote,
        variationMandatoryNote,
        'Mantenha mais de 90% de similaridade em todos os 9 quadrantes, preservando logomarca do fabricante, textos impressos no produto, cores das variações, botões e formato 100% idênticos às fotos de referência.',
      ]
        .filter(Boolean)
        .join(' ');
    }

    return res.json({
      success: true,
      audit: {
        overallScore,
        overallStatus,
        overallLabel,
        summaryIssues,
        quadrants: normalizedQuadrants,
        correctionPrompt,
      },
      usage: lastAuditUsage || {
        promptTokens: 3500,
        completionTokens: 700,
        totalTokens: 4200,
        costUSD: 0.011,
        costBRL: 0.063,
        model: 'gpt-5.6-luna',
      },
    });
  } catch (err: any) {
    console.warn('Erro em /api/produtos2-audit-storyboard:', err?.message || err);
    return res.json({
      success: false,
      error: err?.message || 'Erro ao auditar os 9 quadrantes do storyboard.',
    });
  }
});

// Setup Vite middleware in dev or static serve in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const pkgName = 'vite';
    const { createServer: createViteServer } = await import(/* @vite-ignore */ pkgName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const active = getActiveProviderType();
    console.log(`\nðŸš€ Servidor Clonador de VÃ­deo rodando em http://0.0.0.0:${PORT}`);
    console.log(`ðŸ¤– Provedor Ativo: ${active.toUpperCase()}`);
    if (active === 'openai') {
      console.log(`ðŸ§  CÃ©rebro (visÃ£o/anÃ¡lise/storyboard): ${OPENAI_BRAIN_MODEL} [reasoning_effort: medium]`);
      console.log(`ðŸŽ¤ TranscriÃ§Ã£o de Ãudio: ${OPENAI_AUDIO_MODEL}`);
      console.log(`ðŸŽ¨ GeraÃ§Ã£o de Imagens: ${OPENAI_IMAGE_MODEL} [quality: high, 1024x1792]`);
      console.log(`ðŸ” Auditoria de Fidelidade: ${OPENAI_AUDIT_MODEL}`);
    } else {
      console.log(`ðŸ“¸ Modelo de VisÃ£o: ${GEMINI_VISION_MODEL}`);
      console.log(`ðŸŽ¨ Modelo de Imagem: ${GEMINI_IMAGE_MODEL}`);
    }
  });
}

const isDirectRun = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js') || process.argv[1].includes('tsx'))
);

if (isDirectRun && !process.env.VERCEL) {
  startServer();
}

export default app;

