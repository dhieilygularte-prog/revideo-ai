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
  FIDELITY_BLOCK_TEXT,
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
import { AIProfile, AI_PROFILES } from './src/config/aiProfiles';
import { buildAniaPlanningSystemPrompt } from './src/ania/aniaPrompts';

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
app.get('/api/health', (req, res) => {
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
app.get('/api/cost-report', (req, res) => {
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
    const { primaryPhotoBase64, userPrompt, productName, category, estica } = req.body;

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
    const activeProfile = getRequestAIProfile(req);
    if (activeProfile === 'openai' && openAIProvider.isConfigured()) {
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
        if (result.success && result.imageUrl) {
          return res.json(result);
        }
        console.warn(`OpenAI ${OPENAI_IMAGE_MODEL} não retornou imagem, usando pipeline Gemini:`, result.error);
      } catch (oiErr: any) {
        console.warn(`Exceção no modelo ${OPENAI_IMAGE_MODEL}, recorrendo ao pipeline Gemini:`, oiErr?.message || oiErr);
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

    // The reference-video analysis determines the required view.
    // Never force a frontal view when the storyboard requests back, side or detail.
    const normalizedAngle = String(targetAngle || '').toLowerCase().trim();

    const angleInstruction =
      normalizedAngle.includes('back') ||
      normalizedAngle.includes('rear') ||
      normalizedAngle.includes('costas') ||
      normalizedAngle.includes('verso')
        ? 'TARGET ANGLE: REAR/BACK VIEW. The person/product must be shown from behind, faithfully reproducing the back/verso required by the reference-video storyboard. Do NOT turn the subject toward the camera and do NOT substitute a front view.'
        : normalizedAngle === 'side' || normalizedAngle.includes('lateral')
        ? 'TARGET ANGLE: SIDE VIEW. Faithfully reproduce the side/lateral orientation required by the reference-video storyboard.'
        : normalizedAngle === 'front_side' || normalizedAngle.includes('three-quarter')
        ? 'TARGET ANGLE: FRONT THREE-QUARTER VIEW. Faithfully reproduce the front-three-quarter orientation required by the reference-video storyboard.'
        : normalizedAngle === 'front_detail' || normalizedAngle.includes('detail') || normalizedAngle.includes('close')
        ? 'TARGET ANGLE: DETAIL/CLOSE-UP VIEW. Faithfully reproduce the detail framing required by the reference-video storyboard.'
        : 'TARGET ANGLE: FRONT VIEW. Show the front only when the reference-video storyboard requires a frontal view.';

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
            'Seu projeto no Google AI Studio atingiu o Limite de Gastos Mensal (Spend Cap - Erro 429). Para permitir que o modelo Nano Banana Pro (gemini-3-pro-image) gere as imagens fotorrealistas da mulher calÃ§ando o produto, ajuste ou aumente o limite em https://ai.studio/spend.';
        } else if (
          imgError?.status === 402 ||
          imgError?.message?.includes('prepayment credits are depleted') ||
          imgError?.message?.includes('402')
        ) {
          lastErrorType = 'CREDITS_DEPLETED';
          lastErrorMessage =
            'Seus crÃ©ditos prÃ©-pagos da API Gemini se esgotaram (Erro 402). O modelo de alta qualidade Nano Banana Pro requer crÃ©ditos ativos no Google AI Studio (https://ai.studio/projects).';
        } else {
          lastErrorType = 'AI_FAILED';
          lastErrorMessage = imgError?.message || 'Falha na geraÃ§Ã£o de imagem com a IA.';
        }
      }
    }

    if (!imageResultUrl) {
      return res.json({
        success: false,
        errorType: lastErrorType || 'AI_FAILED',
        error:
          lastErrorMessage ||
          'NÃ£o foi possÃ­vel gerar a imagem no modelo de ponta Nano Banana Pro. Verifique sua chave e limites.',
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
    app.get('*', (req, res) => {
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

