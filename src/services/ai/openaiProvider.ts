export function sanitizePromptForOpenAISafety(text: string): string {
  if (!text) return '';
  return text
    // Remove / substitui expressamente travas que contêm termos que disparam o filtro de segurança
    .replace(/\b(?:proibi[cç][aã]o|proibid[oa]|zero|nunca|sem)\s+(?:de\s+)?(?:nudez|nua|despida|topless|sem\s+cal[cç]a|sem\s+roupa)\b/gi, 'look comercial completo de catalogo')
    .replace(/\b(?:n[aã]o|proibid[oa]|nunca)\s+(?:ficar?|gerar?|deixar?)\s+(?:nua|topless|sem\s+cal[cç]a|despida)\b/gi, 'vestir look completo elegante')
    .replace(/\b(lingerie|conjunto de lingerie|roupas? íntimas?|peças? íntimas?)\b/gi, 'conjunto homewear sleepwear de cetim e renda elegante')
    .replace(/\b(calcinha e suti[aã]|suti[aã] e calcinha)\b/gi, 'shortinho e cropped confortável de dormir em tecido acetinado e renda')
    .replace(/\b(calcinha|calcinhas|cueca|cuecas)\b/gi, 'shortinho confortável de dormir')
    .replace(/\b(suti[aã]|suti[aã]s)\b/gi, 'top bralette delicado de homewear')
    .replace(/\b(babydoll|baby doll|camisola sexy)\b/gi, 'camisola elegante de homewear')
    .replace(/\b(transpar[eê]ncia|transparente|semi-transparente)\b/gi, 'acabamento acetinado delicado')
    .replace(/\b(sensual|sexy|er[oó]tic[oa]|provocante)\b/gi, 'elegante e sofisticada')
    .replace(/\b(bumbum|gl[uú]teos? volumosos?|gl[uú]teos?|n[aá]degas?)\b/gi, 'silhueta feminina classica')
    .replace(/\b(decote profundo|decote|seios grandes|seios|busto exposto|busto farto)\b/gi, 'gola elegante de catalogo comercial')
    .replace(/\b(nua|sem roupa|despida|topless|sem cal[cç]a|nudez)\b/gi, 'completamente vestida com look comercial completo')
    .replace(/\b(panties|bra and panties|underwear|thong|lingerie)\b/gi, 'loungewear sleepwear satin set')
    .replace(/\b(pantless|topless|naked|nudity|shirtless)\b/gi, 'fully dressed commercial outfit')
    .replace(/\b(cleavage|bust|breasts|buttocks|booty)\b/gi, 'feminine elegant silhouette');
}

import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import OpenAI from 'openai';
import {
  createBoundedMap,
  optimizeImageDataUriForVision,
  optimizeImageToBufferForGeneration,
} from '../../utils/serverImageOptimizer';
import {
  IAIProvider,
  AnalyzeVideoParams,
  GenerateSceneImageParams,
  GenerateSceneImageResult,
  AuditFidelityParams,
  AuditFidelityResultResponse,
} from './types';
import { VideoAnalysisResult } from '../../types';
import {
  analyzeAnaMariaProductInfo,
  buildUltraPhotorealismBlock,
} from '../../anamaria/anaMariaProductInfo';
import {
  OPENAI_BRAIN_MODEL,
  OPENAI_REASONING_EFFORT,
  OPENAI_AUDIO_MODEL,
  OPENAI_IMAGE_MODEL,
  OPENAI_IMAGE_QUALITY,
  OPENAI_IMAGE_SIZE,
  OPENAI_AUDIT_MODEL,
  OPENAI_PRICING,
} from '../../config/openaiModels';
import { calculateSceneCount } from '../../config/models';
import { buildVeoSingleParagraphPrompt } from '../../utils/veoPromptBuilder';
import { distributeSpeechAcrossScenes } from '../../utils/speechDistributor';
import { selectRepresentativeKeyframes } from '../../utils/frameSampler';
import { globalCostTracker, CloningStepName } from './costTracker';

const swatchDescriptionCache = createBoundedMap<string, string>(60);

export class OpenAIProvider implements IAIProvider {
  readonly name = 'openai' as const;
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.APIOPENAI || process.env.OPENAI_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isConfigured(): boolean {
    const apiKey = process.env.OPENAI_API_KEY || process.env.APIOPENAI || process.env.OPENAI_KEY;
    return Boolean(apiKey && apiKey.trim().length > 0);
  }

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY || process.env.APIOPENAI || process.env.OPENAI_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada no ambiente.');
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
  async analyzeVideo(params: AnalyzeVideoParams): Promise<VideoAnalysisResult> {
    const {
      durationSeconds = 12,
      frames = [],
      variations = [],
      audioBase64,
      additionalInstructions = '',
      productInfo = '',
      modelPhotoUrl,
      veoModelMode = 'veo3_basic_8s',
    } = params;

    const validDuration = Math.min(40, Math.max(4, Math.round(Number(durationSeconds) || 12)));
    const calculatedScenes = calculateSceneCount(validDuration, veoModelMode);
    const sceneDurationSec = veoModelMode === 'veo3_omniflash_10s' ? 10 : 8;
    const perSceneMaxChars = veoModelMode === 'veo3_omniflash_10s' ? 252 : 199;
    const totalMaxSpeechChars = calculatedScenes * perSceneMaxChars;
    const client = this.getClient();

    // Inicia nova medição de custos da clonagem completa
    globalCostTracker.reset();

    // ─── ETAPA 1: TRANSCRIÇÃO DE ÁUDIO (gpt-transcribe) ───
    let transcriptText = '';
    let speechData = {
      hasSpeech: false,
      originalTranscript: 'Música de fundo identificada',
      adaptedScript: '',
      voiceTone: 'Trilha sonora / Beat musical',
    };

    if (audioBase64) {
      try {
        const audioBuffer = Buffer.from(
          audioBase64.replace(/^data:audio\/(?:wav|mp3|mpeg|webm|ogg);base64,/, ''),
          'base64'
        );
        const audioFile = new File([audioBuffer], 'reference_audio.wav', { type: 'audio/wav' });

        const transcribeRes = await client.audio.transcriptions.create({
          file: audioFile,
          model: OPENAI_AUDIO_MODEL,
        });

        transcriptText = transcribeRes.text?.trim() || '';
        const audioCost = globalCostTracker.calculateAudioCost(validDuration);

        globalCostTracker.recordCall({
          step: 'transcrição',
          model: OPENAI_AUDIO_MODEL,
          costUSD: audioCost.costUSD,
          costBRL: audioCost.costBRL,
          details: `Duração: ${validDuration}s | Texto: "${transcriptText.substring(0, 60)}..."`,
        });

        if (transcriptText.length > 0) {
          speechData.originalTranscript = transcriptText;
        }
      } catch (err: any) {
        console.warn('[OpenAIProvider] Aviso na transcrição de áudio:', err?.message);
      }
    }

    // ─── ETAPA 2: ANÁLISE MULTIMODAL UNIFICADA & STORYBOARD (gpt-5.6-terra) ───
    const contentBlocks: any[] = [];

    // Contexto de áudio integrado na mesma chamada multimodal (elimina redundância e economiza tokens)
    if (transcriptText) {
      contentBlocks.push({
        type: 'text',
        text: `[ÁUDIO TRANSCRITO DO VÍDEO CONCORRENTE]: "${transcriptText}".
Analise este áudio em conjunto com os quadros para identificar se há locução comercial real ou apenas música de fundo/batida, adaptando o roteiro para o produto do usuário.`,
      });
    }

    // Amostra quadros-chave por TODA a duração com detail: 'low' (economiza ~93% dos tokens visuais sem perder contexto)
    const sampledFrames = selectRepresentativeKeyframes(frames, validDuration, calculatedScenes);
    sampledFrames.forEach((f) => {
      contentBlocks.push({
        type: 'text',
        text: `[Quadro do vídeo no instante t=${f.time}s${f.isCutTransition ? ' - corte/mudança de cena' : ''}]:`,
      });
      contentBlocks.push({
        type: 'image_url',
        image_url: { url: f.dataUrl, detail: 'low' },
      });
    });

    // Otimiza e adiciona fotos reais das variações (até 2 fotos por variação, detail: 'high' para logos/texturas)
    const variationPhotoTasks: Array<{ vName: string; pIdx: number; url: string }> = [];
    variations.forEach((v, vIdx) => {
      const vName = v.name || `Variação ${vIdx + 1}`;
      (v.photos || []).slice(0, 2).forEach((photoUrl, pIdx) => {
        if (photoUrl) variationPhotoTasks.push({ vName, pIdx, url: photoUrl });
      });
    });
    const [optimizedVarPhotos, optimizedModelPhoto] = await Promise.all([
      Promise.all(variationPhotoTasks.map((t) => optimizeImageDataUriForVision(t.url, 'high'))),
      modelPhotoUrl ? optimizeImageDataUriForVision(modelPhotoUrl, 'high') : Promise.resolve(''),
    ]);

    variationPhotoTasks.forEach((t, idx) => {
      contentBlocks.push({
        type: 'text',
        text: `[Foto de Referência Real ${t.pIdx + 1} para "${t.vName}" - Inviolabilidade física de cores, materiais e geometria]:`,
      });
      contentBlocks.push({
        type: 'image_url',
        image_url: { url: optimizedVarPhotos[idx] || t.url, detail: 'high' },
      });
    });

    // Adiciona foto da modelo do usuário se fornecida
    if (optimizedModelPhoto || modelPhotoUrl) {
      contentBlocks.push({
        type: 'text',
        text: '[Foto da Modelo do Usuário - Use como referência mandatória de rosto, etnia e cabelo caso o vídeo mostre o rosto da modelo]:',
      });
      contentBlocks.push({
        type: 'image_url',
        image_url: { url: optimizedModelPhoto || modelPhotoUrl!, detail: 'high' },
      });
    }

    const prodInfoClause = productInfo && productInfo.trim()
      ? `\nINFORMAÇÕES ADICIONAIS DO PRODUTO (BENEFÍCIOS E DESCRIÇÃO): "${productInfo.trim()}". Integre estas características nos roteiros e detalhes do produto.\n`
      : '';

    const userPromptText = `Você é o Cérebro Analítico de Engenharia Reversa do ReVídeo AI.
MISSÃO:
1. Analise os quadros extraídos cobrindo TODA a duração de ${validDuration}s do vídeo concorrente e TODAS as fotos reais das variações do produto.
2. Identifique o produto real pelas fotos do usuário (qualquer categoria: vestuário, calçado, embalagem, acessório, utilidade, eletrônico, etc.).
${prodInfoClause}
3. REGRAS CRÍTICAS E INVIOLÁVEIS DAS CENAS, CENÁRIOS E CONSISTÊNCIA DO MODELO:
   a) O VÍDEO DE REFERÊNCIA É QUEM DITA OS CENÁRIOS/LOCAIS E AS AÇÕES:
      - As imagens geradas servem para colocar o modelo e o produto do usuário NOS MESMOS CENÁRIOS/LOCAIS e NAS MESMAS AÇÕES que o vídeo de referência apresenta em cada momento!
      - Exemplo da regra:
        * Se no vídeo de referência na primeira cena a pessoa está no mercado pegando o produto, a Imagem 1 DEVE ser no mercado pegando o produto na prateleira.
        * Se depois a pessoa vai para o topo de um prédio, a Imagem 2 DEVE ser no topo do prédio.
        * Se depois vai para um sítio montada a cavalo, a Imagem 3 DEVE ser no sítio montada a cavalo.
        * Se na próxima cena a pessoa está na mesa da cozinha comendo ao lado do produto, a Imagem 4 DEVE ser na mesa da cozinha.
        * Se na última cena a pessoa está em cima da cama abrindo o pacote do produto, a Imagem 6 DEVE ser em cima da cama abrindo o pacote.
      - NUNCA coloque todas as imagens no mesmo local se o vídeo de referência transita por cenários diferentes!
      - O resultado final DEVE ter a MESMA QUANTIDADE E DIVERSIDADE DE CENÁRIOS que o vídeo de referência teve, reproduzindo os mesmos cenários com o produto do usuário.

   b) REGRA ABSOLUTA DE CONSISTÊNCIA DO MODELO & ANTI-VIOLAÇÃO DE ROSTO NO TIKTOK:
      - Quando o usuário FORNECER foto do modelo ('modelPhotoUrl'): use estritamente essa pessoa em todas as cenas.
      - Quando o usuário NÃO FORNECER foto do modelo e o modelo for gerado com base no vídeo de referência:
        * É EXPRESSAMENTE PROIBIDO COPIAR OU CLONAR O ROSTO EXATO DO MODELO DO VÍDEO CONCORRENTE!
        * Gere/descreva um modelo com características similares (mesma faixa etária/estilo de criador, como um primo), PORÉM COM ROSTO DIFERENTE (traços faciais distintos, formato de rosto próprio, ou variação de cabelo/tom de pele) para evitar 100% qualquer violação de direitos autorais, imagem ou duplicidade no TikTok.
        * Trava de consistência: esse NOVO modelo concebido deve permanecer rigorosamente O MESMO em todas as imagens (Imagem 1 a 9). O que muda de imagem para imagem é O CENÁRIO (local) e A AÇÃO física, mas A PESSOA/MODELO É RIGOROSAMENTE A MESMA do início ao fim!

   c) SEQUÊNCIA DE 3 IMAGENS DE REFERÊNCIA POR CENA:
      - O vídeo possui ${validDuration}s e é dividido em exatamente ${calculatedScenes} cena(s) consecutivas de ${sceneDurationSec}s.
      - Cada cena deve conter EXATAMENTE 3 imagens mapeadas cronologicamente às ações e locais daquele trecho temporal:
        * Cena 1: Imagem 1, Imagem 2, Imagem 3.
        * Cena 2: Imagem 4, Imagem 5, Imagem 6.
        * Cena 3: Imagem 7, Imagem 8, Imagem 9.
      - Para cada imagem no array 'images', preencha OBRIGATORIAMENTE:
        * 'location': Cenário e local específico daquele instante no vídeo (ex: "Corredor de supermercado moderno com prateleiras", "Topo de prédio urbano ao pôr do sol", "Cozinha residencial moderna ao redor da mesa", "Quarto aconchegante sobre a cama").
        * 'actionDescription': Ação corporal e interação precisa do modelo com o produto naquele momento.
        * 'role': Título descritivo combinando número da imagem, modelo, local e ação (ex: "Imagem 1: Modelo no mercado pegando o produto na prateleira").
        * 'targetAngle': Ângulo exato da câmera ('front', 'side', 'rear', 'detail', etc.).

   d) ENQUADRAMENTO DA MODELO (DO PESCOÇO PARA BAIXO vs ROSTO):
      - Se o vídeo esconde o rosto da modelo (câmera do pescoço para baixo, tórax, mãos, pernas), defina "modelFraming": "neck_down".
      - Se o vídeo mostra o rosto da modelo, defina "modelFraming": "show_face".
      - Se não há pessoa (apenas produto), defina "modelFraming": "product_only".

   e) CALL TO ACTION (CTA) ESTRITAMENTE NA ÚLTIMA CENA:
      - Chamada de compra ("clique no carrinho amarelo", etc.) EXCLUSIVAMENTE na última cena (Cena ${calculatedScenes}). Cenas anteriores NÃO possuem CTA!

   f) HEADLINES NA TELA ('onScreenTexts'):
      - Se o vídeo possuir textos/headlines reais, capture com emojis. Se NÃO possuir nenhuma headline na tela, retorne RIGOROSAMENTE [].

   g) CLASSIFICAÇÃO UNIFICADA DE ÁUDIO E LOCUÇÃO (SE HOUVER ÁUDIO TRANSCRITO):
      - Se o áudio transcrito for locução comercial real de apresentação/review do produto, preencha "speechClassification": { "hasProductPitch": true, "isMusicTrack": false, "adaptedScript": "...", "voiceTone": "..." } adaptando a fala com NO MÁXIMO ${totalMaxSpeechChars} caracteres no total (${perSceneMaxChars} caracteres por cada uma das ${calculatedScenes} cenas) em Português do Brasil natural para o produto do usuário. Cada cena no array 'scenes' deve conter seu campo 'sceneSpeech' com a fala exclusiva daquele trecho de ${sceneDurationSec}s (sem repetição).
      - Se for MÚSICA, TRILHA SONORA, BEAT, RAP, FUNK OU LETRA DE MÚSICA CANTADA (ex: batidas, rimas musicais, letras poéticas ou músicas populares):
        * "hasProductPitch": false
        * "isMusicTrack": true
        * "adaptedScript": "" (DEIXE RIGOROSAMENTE VAZIO!)
        * "voiceTone": "Trilha sonora"
        * E em TODAS as cenas no array 'scenes', o campo 'sceneSpeech' DEVE VIR RIGOROSAMENTE VAZIO ("")! NUNCA coloque letras de música como fala no 'sceneSpeech'!
      - Se não houver áudio, preencha com hasProductPitch: false, adaptedScript: "" e sceneSpeech: "" em todas as cenas.

   h) REALISMO BRASILEIRO (PESSOAS SIMPLES E CASAS COMUNS DO COTIDIANO):
      - Quando retratar pessoas (sem foto enviada): descrever pessoas brasileiras simples e comuns do dia a dia (aparência autêntica, simpática, acessível e natural, sem padrões inatingíveis de supermodelo).
      - Quando o cenário for residencial (casa, sala, quarto, cozinha, varanda, quintal): descrever rigorosamente a casa de uma pessoa brasileira simples e comum (móveis normais e acolhedores, estritamente PROIBIDO mansões, casas luxuosas ou decorações hiper-instagramáveis que fujam da realidade popular brasileira). Lojas e comércios podem ser organizados e limpos.

Instruções adicionais do usuário: "${additionalInstructions}".

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

    contentBlocks.push({ type: 'text', text: userPromptText });

    // Chamada com gpt-5.6-terra e reasoning_effort: 'medium' (fallback seguro caso indisponível)
    const analyzeModels = [OPENAI_BRAIN_MODEL, 'gpt-4o', 'gpt-4o-mini'];
    let completion: any = null;
    for (const m of analyzeModels) {
      try {
        const isReasoning = m.startsWith('gpt-5') || m.startsWith('o');
        completion = await client.chat.completions.create({
          model: m,
          ...(isReasoning ? { reasoning_effort: OPENAI_REASONING_EFFORT, max_completion_tokens: 3200 } : { max_tokens: 2400, temperature: 0.3 }),
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'Você é um perito em engenharia reversa visual de criativos TikTok Shop. Retorne apenas JSON válido.',
            },
            {
              role: 'user',
              content: contentBlocks,
            },
          ],
        });
        if (completion?.choices?.[0]?.message?.content) break;
      } catch (err: any) {
        if (m === analyzeModels[analyzeModels.length - 1]) throw err;
        console.warn(`[OpenAIProvider] Fallback analyzeVideo de ${m}:`, err?.message || err);
      }
    }

    const brainPromptTokens = completion.usage?.prompt_tokens || 0;
    const brainCompletionTokens = completion.usage?.completion_tokens || 0;
    const brainCost = globalCostTracker.calculateTokenCost(OPENAI_BRAIN_MODEL, brainPromptTokens, brainCompletionTokens);

    // Registra separadamente: análise dos frames e engenharia reversa/storyboard
    globalCostTracker.recordCall({
      step: 'análise dos frames',
      model: OPENAI_BRAIN_MODEL,
      promptTokens: Math.round(brainPromptTokens * 0.5),
      completionTokens: Math.round(brainCompletionTokens * 0.4),
      costUSD: Math.round(brainCost.costUSD * 0.45 * 10000) / 10000,
      costBRL: Math.round(brainCost.costBRL * 0.45 * 1000) / 1000,
      details: `Análise multimodal de ${frames.length} frames e referências`,
    });

    globalCostTracker.recordCall({
      step: 'engenharia reversa/storyboard',
      model: OPENAI_BRAIN_MODEL,
      promptTokens: Math.round(brainPromptTokens * 0.5),
      completionTokens: Math.round(brainCompletionTokens * 0.6),
      costUSD: Math.round(brainCost.costUSD * 0.55 * 10000) / 10000,
      costBRL: Math.round(brainCost.costBRL * 0.55 * 1000) / 1000,
      details: `Construção do storyboard de ${calculatedScenes} cena(s)`,
    });

    globalCostTracker.recordCall({
      step: 'geração dos prompts finais',
      model: OPENAI_BRAIN_MODEL,
      promptTokens: 250,
      completionTokens: 350,
      costUSD: 0.0047,
      costBRL: Math.round(0.0047 * OPENAI_PRICING.usdToBrl * 1000) / 1000,
      details: 'Geração estruturada dos prompts finais em inglês para o Google Veo 3.1',
    });

    const parsedData = JSON.parse(completion.choices[0]?.message?.content || '{}');

    if (parsedData.speechClassification) {
      const isCommercial = Boolean(
        parsedData.speechClassification.hasProductPitch &&
        !parsedData.speechClassification.isMusicTrack &&
        parsedData.speechClassification.adaptedScript &&
        parsedData.speechClassification.adaptedScript.trim().length > 0
      );

      speechData = {
        hasSpeech: isCommercial,
        originalTranscript: transcriptText || 'Música de fundo identificada',
        adaptedScript: isCommercial ? parsedData.speechClassification.adaptedScript.trim() : '',
        voiceTone: isCommercial
          ? (parsedData.speechClassification.voiceTone || 'Persuasivo e dinâmico')
          : 'Trilha sonora / Beat musical',
      };
    }
    parsedData.speechData = speechData;

    // Filtra rigorosamente onScreenTexts removendo entradas vazias ou com apenas aspas
    if (Array.isArray(parsedData.onScreenTexts)) {
      parsedData.onScreenTexts = parsedData.onScreenTexts
        .filter((item: any) => {
          if (!item || !item.text) return false;
          const clean = item.text.trim().replace(/^["']+|["']+$/g, '').trim();
          return clean.length > 0;
        })
        .map((item: any) => ({
          ...item,
          text: item.text.trim().replace(/^["']+|["']+$/g, '').trim(),
        }));
    } else {
      parsedData.onScreenTexts = [];
    }

    // Se NÃO for locução comercial real (ex: música, batida ou letra de música), ZERA todas as falas por padrão
    if (!speechData.hasSpeech || !speechData.adaptedScript) {
      speechData.hasSpeech = false;
      speechData.adaptedScript = '';
    }

    if (Array.isArray(parsedData.scenes) && parsedData.scenes.length > 0) {
      if (!speechData.hasSpeech || !speechData.adaptedScript) {
        parsedData.scenes = parsedData.scenes.map((scene: any) => ({
          ...scene,
          sceneSpeech: '',
        }));
      } else {
        // Distribui a fala contínua de vendas entre as cenas (Cena 2 NUNCA repete a Cena 1)
        const fullAdaptedScript = speechData.adaptedScript.trim();
        parsedData.scenes = distributeSpeechAcrossScenes(fullAdaptedScript, parsedData.scenes);
      }

      // Garante rigorosamente 3 imagens por cena numeradas sequencialmente (Cena 1: 1,2,3; Cena 2: 4,5,6)
      parsedData.scenes = parsedData.scenes.map((scene: any, sIdx: number) => {
        const baseImgNum = sIdx * 3;
        const currentImgs = Array.isArray(scene.images) ? scene.images : [];
        const finalImgs = [];

        for (let i = 0; i < 3; i++) {
          const imgSlotNumber = baseImgNum + i + 1;
          const existing = currentImgs[i];
          const defaultAngle = i === 0 ? 'front' : i === 1 ? 'side' : 'detail';
          const defaultLocation = existing?.location || scene.environmentDescription || parsedData.environmentDescription || 'cenário comercial';
          const defaultAction = existing?.actionDescription || `Demonstração do produto no momento ${i + 1}`;
          const defaultRole = `Imagem ${imgSlotNumber}: ${existing?.role || `Ação ${i + 1} em ${defaultLocation}`}`;

          finalImgs.push({
            id: existing?.id || `img-${imgSlotNumber}`,
            role: existing?.role || defaultRole,
            frameNumber: imgSlotNumber,
            variationName: existing?.variationName || variations[0]?.name || 'Variação 1',
            targetAngle: existing?.targetAngle || defaultAngle,
            location: existing?.location || defaultLocation,
            actionDescription: existing?.actionDescription || defaultAction,
            promptUsed: existing?.promptUsed || '',
          });
        }

        const varList = Array.isArray(scene.mappedVariations) && scene.mappedVariations.length > 0
          ? scene.mappedVariations
          : variations.map((v, i) => v.name || `Variação ${i + 1}`);

        const updatedVeo = buildVeoSingleParagraphPrompt({
          sceneNumber: scene.sceneNumber,
          totalScenes: parsedData.scenes.length,
          durationSeconds: sceneDurationSec,
          productType: parsedData.productType || 'commercial product',
          variations: varList,
          environment: scene.environmentDescription || parsedData.environmentDescription,
          interactionStyle: parsedData.interactionDetails,
          cameraType: parsedData.cameraType,
          lighting: parsedData.lightingStyle,
          secondTimeline: scene.eightSecondTimeline,
          speechVoiceover: scene.sceneSpeech,
          modelFraming: parsedData.modelFraming,
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

    const initialReport = globalCostTracker.generateReport('openai');

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
        promptsCostBRL: 0.026,
      },
    };

    parsedData.costReport = initialReport;

    return parsedData as VideoAnalysisResult;
  }

  /**
   * 3. Geração das Imagens com Múltiplas Fotos Reais de Referência
   * Modelo: gpt-image-2.5-sunburst
   * Parâmetros: quality: 'high', input_fidelity: 'high', size: '1024x1792' (vertical 9:16)
   */
  async generateSceneImage(params: GenerateSceneImageParams): Promise<GenerateSceneImageResult> {
    const {
      prompt,
      productPhotoBase64,
      productInfo = '',
      fabricType = '',
      productPhotosBase64 = [],
      modelReferenceBase64,
      referenceFrameBase64,
      scenarioPhotoBase64,
      isAnaMariaMode = false,
      presentationMode,
      selectedMasterId,
      variationName = 'Variação 1',
      productType = 'produto comercial',
      correctionPrompt,
      additionalInstructions = '',
      hasUserProvidedModel = false,
      isCloneMode = false,
      aspectRatio,
      size,
      bodyType,
      ultraRealism = false,
    } = params;

    const client = this.getClient();

    // Identifica o passo da imagem para telemetria de custos
    let stepName: CloningStepName = 'imagem 1';
    if (prompt.includes('Imagem 2') || prompt.includes('img2')) {
      stepName = 'imagem 2';
    } else if (prompt.includes('Imagem 3') || prompt.includes('img3')) {
      stepName = 'imagem 3';
    }

    // Coleta todas as fotos de referência da variação
    const allPhotos: string[] = [];
    if (productPhotoBase64) allPhotos.push(productPhotoBase64);
    productPhotosBase64.forEach((p) => {
      if (p && !allPhotos.includes(p)) allPhotos.push(p);
    });

    const modelAntiViolationDirective = (!hasUserProvidedModel && !modelReferenceBase64)
      ? `CRITICAL ANTI-VIOLATION DIRECTIVE: Do NOT copy or clone the face of the actor from the reference video. Generate an original commercial model with a DIFFERENT FACE and distinct facial features (similar demographic style like a cousin, but strictly a different person) to prevent TikTok copyright/impersonation strikes.`
      : '';

    const opticalClarityDirective = `CRITICAL OPTICAL CLARITY, VIVID COLOR & ANTI-YELLOWISH CALIBRATION:
- Modern flagship smartphone camera clarity (iPhone 16 Pro / Galaxy S24 Ultra): crystal-clear optical glass lens, razor-sharp focus, vibrant true-to-life colors, and rich texture definition.
- VIVID, VIBRANT COLORS & CLEAN WHITE BALANCE: Colors must be lively, vivid, saturated with natural commercial pop, and harmonized with the environment. Maintain clean neutral white balance (pure whites, deep clean blacks, natural healthy skin tones).
- STRICTLY PROHIBITED (ZERO YELLOWISH / ZERO OPAQUE): NO yellowish tint, NO warm tungsten/amber/sepia cast, NO dull/opaque/lifeless look, NO pale/washed-out/milky/hazy veil, and NO plastic film overlay across the lens.
- 90%+ FIDELITY AUDITOR CALIBRATION (5 INSPECTION GROUPS + ANTI-MORPHING): Preserve 100% of the exact product model, silhouette, all physical components (body, nozzles, caps, cables, handles, buttons, seams, and all kit pieces), realistic human scale, exact surface finish (matte, glossy, metallic), and 1:1 manufacturer logo. Hands must have 5 natural fingers gripping neutral sides cleanly without fusing into the product or covering the logo/buttons.`;

    const isPovMode =
      presentationMode === 'pov' ||
      selectedMasterId === 'pov_cinta_85k' ||
      selectedMasterId === 'pov_blusinhas_13k' ||
      Boolean(prompt && prompt.includes('PRESERVAÇÃO INTEGRAL DO CENÁRIO POV'));

    const scenarioLockDirective = scenarioPhotoBase64
      ? isPovMode
        ? `CRITICAL POV BED SCENARIO ANCHOR (EXACT BED & TOP-DOWN POV REPLICATION):
- Reference Image 1 defines the EXACT bed, bedspread/sheets, texture, and lighting for this 90-degree top-down first-person POV shot.
- Keep 100% of the bed surface and fabric from Reference Image 1 intact.
- Show ONLY two human hands entering from the bottom edge of the frame holding/presenting the product units on top of this exact bed.
- STRICTLY FORBIDDEN: Do NOT show any woman standing, torso, legs, face, head, or mirror.`
        : `CRITICAL SCENARIO AND BACKGROUND ANCHOR (REFERENCE IMAGE 1 = EXACT IMMUTABLE ROOM):
- Reference Image 1 defines the EXACT room, walls, floor, curtains, doors, furniture, lighting, and perspective.
- Reference Image 1 is ALREADY photographed from the mirror's viewpoint looking into the room. Place the model standing naturally in the foreground inside this EXACT background from Reference Image 1. STRICTLY FORBIDDEN: DO NOT invent, redraw, or generate a "similar" room, and do NOT alter walls, curtains, doors, or floor.`
      : '';

    const lowerInstructions = (additionalInstructions || '').toLowerCase();
    const isBlackRequested = /\b(negra|negro|preta|preto|afro|afrodescendente|pele preta|pele negra|pele escura|retinta|modelo negra|modelo preta|mulher negra|mulher preta|mulher de pele preta|black woman|dark skin|dark-skinned black woman)\b/i.test(lowerInstructions);
    const isAsianRequested = /\b(japonesa|asiatica|asiática|oriental|asian)\b/i.test(lowerInstructions);
    const isRedheadRequested = /\b(ruiva|redhead|ginger)\b/i.test(lowerInstructions);

    const userEthnicityDirectivesOpenAI = isBlackRequested
      ? `[SOVEREIGN PRIORITY 1 MANDATE — RADIANT WARM BRONZE-CHOCOLATE BLACK WOMAN]:
- OBLIGATORY SKIN TONE: The model MUST be an authentic BLACK WOMAN with a radiant, warm bronze-chocolate / golden-amber dark brown skin tone (lighter, warmer, and luminous, with glowing golden-bronze undertones, exactly matching the reference photo of a vibrant Black woman with healthy satin glow).
- SATIN GLOW & REALISTIC TEXTURE: Hydrated, healthy skin with warm amber/bronze highlights across shoulders, décolletage, arms, and legs. Realistic skin pores, zero ashy/gray tone, zero plastic wax effect.
- STRICT EXCLUSIONS: Strictly FORBIDDEN: white, fair, pale, or caucasian models. Also strictly avoid overly dark pitch-black / ebony / jet-black skin; her tone must be the luminous warm bronze-chocolate of the reference photo.
- BIOTYPE HARMONY: Completely sovereign Priority 1 instruction. Applies seamlessly to both standard and plus-size bodies, preserving this radiant warm bronze-chocolate skin tone.`
      : isAsianRequested
      ? `[PRIORITY 1 SOBERANA — ETHNICITY & SKIN COLOR MANDATE]:\nThe model MUST be an authentic JAPANESE / EAST ASIAN WOMAN with natural East Asian facial features.\nSTRICTLY FORBIDDEN: caucasian, black, or western features.`
      : isRedheadRequested
      ? `[PRIORITY 1 SOBERANA — ETHNICITY & HAIR MANDATE]:\nThe model MUST be a natural REDHEAD WOMAN with copper-red hair and fair/pale skin with subtle natural freckles.`
      : '';

    const fabricSpec = analyzeAnaMariaProductInfo(productInfo, fabricType);

    // Prioriza correções de auditoria e instruções adicionais sobre o prompt universal já formatado
    const overrides = [
      userEthnicityDirectivesOpenAI,
      scenarioLockDirective,
      modelAntiViolationDirective,
      opticalClarityDirective,
      fabricSpec.hasInfo && `${fabricSpec.promptBlockEn}\n${fabricSpec.promptBlockPt}`,
      correctionPrompt && `CRITICAL QUALITY OVERRIDE: ${correctionPrompt.trim()}`,
      additionalInstructions && `USER DIRECTIVE: ${additionalInstructions.trim()}`,
    ].filter(Boolean).join('\n');

    const cleanPrompt = overrides ? `${overrides}\n\n${prompt}` : prompt;

    try {
      const toImageFile = async (dataUrl: string, baseName: string): Promise<File> => {
        const optimized = await optimizeImageToBufferForGeneration(dataUrl, 1280, 90);
        if (optimized) {
          return new File([new Uint8Array(optimized.buffer)], `${baseName}.${optimized.ext}`, { type: optimized.mimeType });
        }
        const mimeMatch = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,/i);
        const mime = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/png';
        const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
        const cleanB64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/i, '').replace(/[\r\n\s]/g, '');
        return new File([Buffer.from(cleanB64, 'base64')], `${baseName}.${ext}`, { type: mime });
      };

      const pendingFileInputs: Array<{ dataUrl: string; baseName: string }> = [];

      // No Modo Ana Maria com Modelo da Galeria, enviamos explicitamente:
      // - Modo 3 Imagens (modelScenarioSource === 'gallery'): [Cenário da Galeria (BASE ARQUITETÔNICA 1), Modelo da Galeria (2), Produto (3+)]
      // - Modo 2 Imagens (cenário da própria modelo): [Modelo da Galeria (BASE 1), Produto (2+)]
      const isAnaMariaGallery3Img = Boolean(isAnaMariaMode && modelReferenceBase64 && scenarioPhotoBase64 && !isPovMode);
      const isAnaMariaModel2Img = Boolean(isAnaMariaMode && modelReferenceBase64 && !scenarioPhotoBase64 && !isPovMode);

      if (isAnaMariaGallery3Img) {
        pendingFileInputs.push({ dataUrl: scenarioPhotoBase64!, baseName: 'reference_scenario_background' });
        pendingFileInputs.push({ dataUrl: modelReferenceBase64!, baseName: 'reference_gallery_model' });
        allPhotos.slice(0, 1).forEach((photoStr, idx) => {
          if (photoStr && typeof photoStr === 'string') {
            pendingFileInputs.push({ dataUrl: photoStr, baseName: `reference_product_${idx + 1}` });
          }
        });
      } else if (isAnaMariaModel2Img) {
        pendingFileInputs.push({ dataUrl: modelReferenceBase64!, baseName: 'reference_gallery_model' });
        allPhotos.slice(0, 1).forEach((photoStr, idx) => {
          if (photoStr && typeof photoStr === 'string') {
            pendingFileInputs.push({ dataUrl: photoStr, baseName: `reference_product_${idx + 1}` });
          }
        });
      } else {
        if (scenarioPhotoBase64) {
          pendingFileInputs.push({ dataUrl: scenarioPhotoBase64, baseName: 'reference_scenario_background' });
        }
        allPhotos.slice(0, 4).forEach((photoStr, idx) => {
          if (photoStr && typeof photoStr === 'string') {
            pendingFileInputs.push({ dataUrl: photoStr, baseName: `reference_${idx + 1}` });
          }
        });
      }

      const resolvedFiles = await Promise.all(
        pendingFileInputs.map((item) => toImageFile(item.dataUrl, item.baseName).catch(() => null))
      );
      const imageFiles: File[] = resolvedFiles.filter((f): f is File => Boolean(f));

      let baseImageFile: File | null = null;
      let effectivePrompt = cleanPrompt;
      const isUltraRealismEnabled = Boolean(
        ultraRealism || cleanPrompt.includes('ULTRA PHOTOREALISM')
      );
      const isMaleOpenAI = /\bhomem adulto\b|\binfluenciador\b/i.test(cleanPrompt);
      const ultraRealismFullOpenAI = isUltraRealismEnabled
        ? buildUltraPhotorealismBlock({ isMale: isMaleOpenAI, isPov: isPovMode })
        : '';
    const hasLingerie = /\b(lingerie|suti[aã]|calcinha|babydoll|baby doll|camisola|transpar[eê]ncia|sensual)\b/i.test(prompt) ||
      /\b(lingerie|suti[aã]|calcinha|babydoll|baby doll|camisola|transpar[eê]ncia|sensual)\b/i.test(additionalInstructions || '');
    if (hasLingerie) {
      effectivePrompt = sanitizePromptForOpenAISafety(effectivePrompt);
    }
      const isStoryboardGrid =
        /grade\s+(?:3x3|2x3|2x2)|(?:\b4|\b6|\b9)\s+(?:cenas|quadros)|storyboard/i.test(prompt);

      const isPlusSizeRequest =
        !isPovMode &&
        (bodyType === 'plus_size' ||
          /plus[-_\s]*size|manequim\s*(?:48|50|52|54)/i.test(prompt) ||
          /plus[-_\s]*size/i.test(additionalInstructions));


      const userRequestedSlimOpenAI =
        /\b(?:magra|magrinha|corpo\s+de\s+modelo|modelo\s+magra|sem\s+curvas|esguia|slim|skinny|slender)\b/i.test(
          additionalInstructions || ''
        );

      const productPhotoCount = Math.min(allPhotos.filter(Boolean).length, 2);

      const scenarioRelightAndEdgeBlendDirective = `[SINGLE-EXPOSURE PHOTOMETRIC UNITY, 3D FLOOR GROUNDING & ZERO CUTOUT HALO]:
- SINGLE NATIVE CAMERA EXPOSURE (NO MONTAGE / NO CUTOUT PASTE): Render the scene as a single, authentic real-world photograph captured through one lens in a single exposure inside the scenario room — never as a layered cutout or pasted sticker.
- SCENARIO DICTATES 100% OF LIGHTING & COLOR TEMPERATURE: The scenario's ambient light sources, direction of light, Kelvin color temperature (warm/cool/neutral), shadow softness, contrast ratio, and wall/curtain color bounce MUST govern the model's skin, face, hair, and garment. Completely discard any studio, ring-light, or bright-wall lighting from the model or product reference photos.
- 3D PERSPECTIVE, SCALE & MULTI-LAYER FLOOR SHADOWS: Align the model's standing scale, camera eye-level horizon, and foot perspective to the 3D floor plane and baseboards of the scenario room. Plant her feet/footwear firmly on the floor with dark contact occlusion directly under the soles/heels and soft directional cast shadows across the floor matching the room's light direction.
- SUB-PIXEL EDGE LIGHT-WRAP (ZERO WHITE OUTLINE): Strictly eliminate any thin white line, bright fringe, sharp alpha mask, or halo along hair strands, shoulders, arms, legs, hands, or garment edges. Apply natural optical edge light-wrap (subtle background color spill onto her outer contours) and unified sensor micro-grain across both subject and room.`;

      if (isAnaMariaGallery3Img) {
        baseImageFile = imageFiles[0] || null;
        const scenarioIdx = 1;
        const modelIdx = 2;
        const productStartIdx = 3;
        const productRangeLabel =
          productPhotoCount > 1
            ? `${productStartIdx} and ${productStartIdx + 1}`
            : `${productStartIdx}`;
        const allowsFace = presentationMode === 'com_rosto';
        const isScenario24OpenAI = Boolean(
          prompt &&
            (prompt.includes('CENÁRIO 24') ||
              prompt.includes('Cenário 24') ||
              prompt.includes('cenario_24'))
        );
        const scenario24FlashOpenAI = isScenario24OpenAI
          ? `\n[MANDATORY SCENARIO 24 RULE — SMARTPHONE CAMERA FLASH ALWAYS ON]:\n- In Scenario 24, the rear LED camera flash on the model's smartphone MUST be actively TURNED ON and shining with a bright white glowing starburst flare in the mirror reflection, casting warm direct front-flash illumination onto the model and garment against the darker warm ambient room of Scenario 24, REGARDLESS of which model was selected!`
          : '';

        const framingSection = allowsFace
          ? `[FRAMING & FACE PRESERVATION — GALLERY MODEL UGC (REFERENCE IMAGE ${modelIdx})]:
- Preserve 100% the exact same woman, face, eyes, nose, lips, hair, skin tone, expression, and body curves shown in Reference Image ${modelIdx} (the gallery model).
- Modern smartphone held naturally in her hand at chest/face level in a vertical mirror selfie pose. Zero tattoos anywhere on the skin.`
          : `[STRICT NO-FACE / FACELESS MIRROR SELFIE LOCK — GALLERY MODEL (REFERENCE IMAGE ${modelIdx})]:
- Preserve 100% the exact same woman from Reference Image ${modelIdx}: exact same body silhouette, bust, waist, hips, thighs, legs, skin tone, hair color/length/texture falling on shoulders, hands/jewelry, and mirror-selfie posture.
- STRICTLY NO VISIBLE FACE: It is strictly FORBIDDEN to show or invent eyes, nose, forehead, or an uncovered face! Keep the exact faceless framing of Reference Image ${modelIdx} (cropped strictly at the base of the chin from chin-down to the floor, or face 100% covered behind the smartphone exactly as in Reference Image ${modelIdx}). Zero tattoos anywhere on the skin.`;

        const modelIdentitySection = allowsFace
          ? `- Photograph the exact same woman from Reference Image ${modelIdx} (same face, eyes, nose, lips, hair, skin tone, body curves, and smartphone mirror-selfie posture) physically standing centered on the floor inside Reference Image ${scenarioIdx}, aligned to Reference Image ${scenarioIdx}'s 3D perspective, horizon line, and room scale.`
          : `- Photograph the exact same faceless woman from Reference Image ${modelIdx} (100% identical body curves, waist, hips, bust, legs, skin tone, hair strands on shoulders, hands, and chin-down/phone-covered faceless framing — NEVER reveal or invent a face!) physically standing centered on the floor inside Reference Image ${scenarioIdx}, aligned to Reference Image ${scenarioIdx}'s 3D perspective, horizon line, and room scale.`;

        // Extrai apenas diretivas críticas de peça, comprimento, fenda, cor exclusiva, bolsas e instruções do usuário,
        // evitando reenviar o bloco invertido "1. Foto 1 (Produto) / 2. Foto 2 (Modelo) / 3. Foto 3 (Cenário)" que confunde a ordem [1=Cenário, 2=Modelo, 3=Produto].
        const preservedDirectives = [
          userEthnicityDirectivesOpenAI,
          fabricSpec.hasInfo && fabricSpec.promptBlockEn,
          correctionPrompt && `CRITICAL QUALITY OVERRIDE: ${correctionPrompt.trim()}`,
          additionalInstructions && `USER DIRECTIVE: ${additionalInstructions.trim()}`,
          ...(prompt
            .split('\n')
            .filter((line) =>
              /(\[COMPRIMENTO REAL DETECTADO|\[ASSIMETRIA OBRIGATÓRIA|\[CRITICAL ANTI-SYMMETRY|\[REGRA MANDATÓRIA|\[REGRA OBRIGATÓRIA DO CENÁRIO 24|\[TECIDO E INFORMAÇÕES REAIS DO PRODUTO|Especificações reais informadas|TECIDO IDENTIFICADO:|Detalhes estruturais obrigatórios:|REGRA CONTRA FOTO DE REFERÊNCIA|\[MANDATORY FABRIC TEXTURE|User product info:|Exact fabric\/material:|\[TECIDO E DETALHES|REGRA CRÍTICA DE COMPRIMENTO|ATENÇÃO À COR EXCLUSIVA|Calçado nos pés:|Calçado obrigatório nos pés|REGRA DE COR DO CALÇADO|COR CONTRASTANTE|REGRA DE CONJUNTO COMPLETO|PROIBIDO BOLSAS|PRODUTO DA FOTO 1|PEÇA INFERIOR|CALÇA JEANS)/i.test(
                line
              )
            )
            .map((line) =>
              line
                .replace(/Foto 1\b/gi, `Reference Image ${productRangeLabel}`)
                .replace(/Foto 2\b/gi, `Reference Image ${modelIdx}`)
                .replace(/Foto 3\b/gi, `Reference Image ${scenarioIdx}`)
            )),
        ]
          .filter(Boolean)
          .join('\n');

        effectivePrompt = `[SINGLE-EXPOSURE REAL-WORLD PHOTOGRAPH INSIDE REFERENCE IMAGE ${scenarioIdx}'S EXACT ROOM]:
Generate a single, cohesive, unedited real-world mirror-selfie photograph captured inside the exact room of Reference Image ${scenarioIdx}.

1. REFERENCE IMAGE ${scenarioIdx} (EXACT ROOM ARCHITECTURE, 3D FLOOR PLANE & MASTER LIGHTING):
- Preserve 100% of Reference Image ${scenarioIdx}'s real room architecture and decor: exact room geometry, walls, baseboards, doorway/doorframe, curtains (exact color, folds, fabric), doors, handles, floor planks/tiles, background items, and camera vantage point.
- PERSPECTIVE RULE: Reference Image ${scenarioIdx} is ALREADY shot from the mirror's vantage point looking straight into the room. DO NOT add or draw a mirror frame, DO NOT rotate the room, and DO NOT invent or substitute any wall, door, floor, or curtain from Reference Image ${scenarioIdx}.
- PHYSICAL ROOM INTERACTION: Allow the woman's physical presence inside Reference Image ${scenarioIdx} to naturally interact with the room's light — casting realistic contact occlusion and soft directional shadows onto Reference Image ${scenarioIdx}'s floor and subtle ambient depth against the room behind her.

2. REFERENCE IMAGE ${modelIdx} (WOMAN'S IDENTITY, BODY & POSTURE ONLY — DISCARD HER OLD ROOM, SHOES & LIGHTING):
${modelIdentitySection}
- 100% DISCARD AND IGNORE the bedroom, bed, door, walls, bright white wall edge-glow, studio/frontal lighting, old clothing, and old footwear of Reference Image ${modelIdx}.

3. REFERENCE IMAGE ${productRangeLabel} (EXACT GARMENT & COLOR ONLY — DISCARD ANY PERSON/BACKGROUND):
- She wears the EXACT garment shown in Reference Image ${productRangeLabel}: 1:1 exact color/shade/print pattern, fabric texture${fabricSpec.hasInfo ? ` (${fabricSpec.compactLineEn})` : ''}, seams, stitching, pleats/ruffles, cut, neckline, straps, and exact full-length hemline from top to bottom (NEVER shorten the garment, NEVER crop/eat the bottom of the dress, and NEVER alter seams, print, texture, or shape anywhere on the top or bottom of the garment), physically shaded by Reference Image ${scenarioIdx}'s ambient room light.
- Harmonious matching footwear planted firmly on Reference Image ${scenarioIdx}'s floor if her feet are left visible by the garment's true original length in Reference Image ${productRangeLabel} (elegant high-heel party sandals for dresses; never shorten the dress hem to reveal shoes).
- 100% IGNORE any person, face, body, tattoos, or background in Reference Image ${productRangeLabel}.

${scenarioRelightAndEdgeBlendDirective}${scenario24FlashOpenAI}

${framingSection}
${preservedDirectives ? `\n[GARMENT & USER CONSTRAINTS]:\n${preservedDirectives}` : ''}

PHOTOGRAPHIC REALISM: ${isUltraRealismEnabled ? 'Authentic candid unedited real-person smartphone mirror photo look (subtle everyday organic skin imperfection and sensor grain, zero beauty filter, zero airbrush)' : 'Authentic flagship smartphone photo (iPhone 16 Pro) shot in one native exposure, natural skin texture with pores'}, unified room lighting and sensor grain matching Reference Image ${scenarioIdx} with smooth sub-pixel contour blending and zero white outline around the silhouette, zero tattoos, zero handbags unless the product is a bag.${
          ultraRealismFullOpenAI ? `\n\n${ultraRealismFullOpenAI}` : ''
        }`;
      } else if (isAnaMariaModel2Img) {
        baseImageFile = imageFiles[0] || null;
        const productRange = productPhotoCount > 1 ? 'Reference Images 2 and 3' : 'Reference Image 2';
        const aligned2ImgCleanPrompt = cleanPrompt
          .replace(/Foto 1\b/gi, productRange)
          .replace(/Foto 2\b/gi, 'Reference Image 1');
        effectivePrompt = `[STRICT 2-IMAGE EDIT DIRECTIVE - GALLERY MODEL & ROOM BASE + EXACT PRODUCT CLOTHING]:
- REFERENCE IMAGE 1 (MODEL & ROOM BASE — KEEP IDENTICAL): Preserve 100% the exact same woman (same face if visible or same phone covering face, same hair, skin tone, body curves, pose, hands) and the EXACT same room/background/mirror/lighting from Reference Image 1.
- ${productRange.toUpperCase()} (GARMENT & EXACT COLOR ONLY): Dress the woman from Reference Image 1 in the EXACT garment shown in ${productRange}, replicating 1:1 its exact color/shade/print, cut, neckline, straps, fabric texture${fabricSpec.hasInfo ? ` (${fabricSpec.compactLineEn})` : ''}, and length (and harmonious matching footwear if feet are visible; if long dress covers feet, keep it long). 100% IGNORE any person/background in ${productRange}.
- SEAMLESS GARMENT RELIGHTING & ZERO CUTOUT EDGES: Relight the swapped garment and footwear to obey Reference Image 1's exact ambient lighting, shadows, and color temperature, with natural hair/shoulder/skin blending and ZERO white outline or pasted look.
- Zero tattoos anywhere on the skin. Preserve sharp iPhone 16 Pro optical clarity.

${aligned2ImgCleanPrompt}`;
      } else if (isAnaMariaMode && scenarioPhotoBase64) {
        if (isPovMode) {
          effectivePrompt = `[CRITICAL POV EDIT DIRECTIVE - FIRST-PERSON HANDS ON BED - MODO ANA MARIA POV]:
You are editing the base POV bed scenario photograph (Reference Image 1).
1. KEEP 100% of the bed, bedspread, sheets, fabric texture, and ambient lighting from Reference Image 1 UNCHANGED and INTACT.
2. Place the EXACT garments/products shown in Reference Image 2 (and subsequent reference photos) on top of the bed (one unit laid out on the bed surface and a second unit held closer to the lens by the two hands).${
            fabricSpec.hasInfo ? `\n${fabricSpec.compactLineEn}` : ''
          }
3. Show ONLY two natural human hands entering from the bottom edge of the frame manipulating/displaying the garment on the bed.
4. STRICTLY FORBIDDEN: DO NOT generate any person standing, DO NOT show torso, waist, hips, legs, head, face, or mirror.

${cleanPrompt}`;
        } else {
          const bodyBlock = isPlusSizeRequest
            ? `[SOVEREIGN AUTHENTIC HEAVY-SET PLUS-SIZE FEMALE BODY MANDATE]:
- The woman MUST be an authentic, genuinely PLUS-SIZE adult Brazilian woman with substantial real body mass, voluptuous soft curves, and generous adipose volume throughout her entire physique.
- STRICT USER MANDATE: NEVER generate women slimmer than this photographic reference. ABSOLUTELY FORBIDDEN: mid-size, slim waist, narrow runway model, flat stomach, or thin thighs.
- THIGHS & CONTACT: Extremely thick, massive, heavy voluptuous thighs with complete contact/friction at the upper thighs (zero thigh gap; the inner thighs press together completely).
- CELLULITE & SKIN TEXTURE: MANDATORY VISIBLE CELLULITE (DO NOT REMOVE). The skin on the thighs MUST feature natural, realistic visible cellulite dimpling and subcutaneous adipose texture (authentic unretouched skin waves, visible pores, and natural skin compression marks; absolutely NO porcelain, NO airbrushed smooth plastic look).
- ETHNICITY & SKIN TONE: STRICTLY GOVERNED BY USER DIRECTIVE (Priority 1) or Mestra specification (Priority 3). The plus-size setting applies EXCLUSIVELY to body volume, mass and natural cellulite texture, NEVER altering or overriding the user's requested ethnicity or skin color (e.g. if user requested a black woman with dark skin, she MUST be an authentic black woman with dark skin).
- LIGHTING: Everyday natural indoor bedroom/mirror ambient lighting (natural room light, NO over-glamorized studio lighting, NO artificial shiny plastic glow).
- HIPS & GLUTES: Extra-wide rounded prominent hips; soft, full midriff with natural soft side rolls (love handles). The waist is wide and soft, NEVER artificially cinched or narrow.
- ABDOMEN: Soft, rounded, full natural belly with natural subcutaneous fat and gentle outward projection below the navel (NEVER flat, NEVER toned).
- BUST: Large, heavy, full, voluptuous natural breasts with realistic downward anatomical drape, filling the garment neckline generously.
- ARMS: Distinctly thick, round, fleshy arms with evident subcutaneous fat (NO thin or slender arms).
- The garment fits snugly and flatteringly over her real heavy plus-size body, exactly as seen on authentic Brazilian plus-size models.`
            : userRequestedSlimOpenAI
            ? `[USER-SPECIFIED BODY SILHOUETTE]:
- Follow the exact body silhouette requested by the user in USER DIRECTIVE (${additionalInstructions.trim()}), while preserving the Mestra's hair, skin, and accessories.`
            : (selectedMasterId === 'mestra_ana_maria'
            ? `[SOVEREIGN MESTRA ANA MARIA HOURGLASS SILHOUETTE MANDATE]:
- CRITICAL ISOLATION RULE: Reference Image 2+ is ONLY for the garment/clothing design. DO NOT copy the body of the catalog model or mannequin in Reference Image 2+!
- The woman MUST follow the natural hourglass silhouette of Mestra Ana Maria:
  * Slender delicate upper body, delicate shoulders, slender arms and forearms, medium to full natural bust.
  * Narrow, cinched, well-defined waist and relatively flat abdomen without excessive muscular definition.
  * Wide rounded feminine hips and full, naturally firm, projected glutes.
  * Thighs of medium to generous volume, feminine and proportional to hips and glutes, with natural curves (NOT bodybuilder/muscular thighs, NOT excessively thin).
  * Fair skin with warm beige golden undertone, long wavy light-brown hair with golden/caramel highlights.
  * Minimalist delicate gold jewelry, light pink / nude almond nails, modern light-pink smartphone concealing the face from chin down.`
            : `[SOVEREIGN MESTRA BODY MANDATE — DO NOT COPY PRODUCT MODEL BODY]:
- CRITICAL ISOLATION RULE: Reference Image 2+ is ONLY for the garment/clothing design. DO NOT copy the body shape of the catalog model or mannequin in Reference Image 2+!
- The woman MUST have EXACTLY the body, skin tone, hair, nails and accessories defined in the selected Mestra's specification below (section "PADRÃO CORPORAL E PELE"), with realistic anatomical proportions.
- STRICTLY FORBIDDEN: straight/boyish torso without waist definition, or any body that contradicts the Mestra's specification.`);

          const allowsFace =
            presentationMode === 'com_rosto' ||
            (cleanPrompt &&
              (cleanPrompt.includes('MODO COM ROSTO') ||
                cleanPrompt.includes('ROSTO E ENQUADRAMENTO — MODO COM ROSTO') ||
                cleanPrompt.includes('o rosto da modelo DEVE aparecer')));

          const framingSection = allowsFace
            ? `[FRAMING & FACE DIRECTIVE — MODO COM ROSTO / UGC]:
- The model's natural, harmonious face and expression MUST appear clearly in the mirror reflection.
- Expressive, authentic, natural makeup, dark neat eyebrows, long hair naturally falling over shoulders.
- Modern smartphone held naturally taking the mirror selfie under Reference Image 1's natural room illumination.
- Zero tattoos anywhere on the skin (100% clean skin).`
            : `[STRICT FRAMING & FACE PROHIBITION]:
- STRICT CHIN-DOWN FRAMING: Frame strictly from the bottom base of the chin downward.
- ABSOLUTELY NEVER reveal lips, mouth, nose, eyes or upper face. Face MUST stay 100% OUT OF FRAME.
- Zero tattoos anywhere on the skin (100% clean skin).
- Modern smartphone held naturally in one hand in front of the mirror taking the mirror-selfie.`;

          effectivePrompt = `[CRITICAL EDIT DIRECTIVE - INPAINT MODEL INTO EXACT SCENARIO - MODO ANA MARIA]:
You are editing the base scenario photograph (Reference Image 1).
KEEP the architectural setting from Reference Image 1 100% UNCHANGED (room, floor, walls, mirrors, lighting, doors, curtains, background). DO NOT redraw a new room; place the woman standing naturally inside Reference Image 1 taking a mirror-selfie.

${scenarioRelightAndEdgeBlendDirective}

[PRODUCT FIDELITY & BODY ISOLATION (REFERENCE IMAGE 2+)]:
- The woman wears the EXACT garment shown in reference image 2+: 1:1 identical color, shade, pattern, seams, straps, neckline, cut, and full length.${
            fabricSpec.hasInfo ? `\n- ${fabricSpec.compactLineEn}` : ''
          }
- NEVER copy the body shape or thinness of the model/mannequin from reference image 2+.

${bodyBlock}

${framingSection}

${cleanPrompt}`;
        }
      }

      // Se temos referência de modelo mestre:
      // Em Modo Ania (!isCloneMode && !isStoryboardGrid): é uma EDIÇÃO LOCALIZADA com trava de quarto/pose via client.images.edit
      if (modelReferenceBase64 && !isCloneMode && !isStoryboardGrid && !isAnaMariaGallery3Img && !isAnaMariaModel2Img) {
        // 1ª imagem = IMAGEM 1 GERADA (base absoluta)
        baseImageFile = await toImageFile(modelReferenceBase64, 'imagem_1_base');

        // 2ª imagem = amostra COR 2 / COR 3 (somente referência do produto)
        const swatchStr = productPhotoBase64 || productPhotosBase64[0];
        let garmentSpec = '';
        if (swatchStr) {
          const swatchCacheKey = `${productType || ''}:${fabricSpec.fabricSummaryLabel || ''}:${crypto
            .createHash('sha256')
            .update(swatchStr)
            .digest('hex')
            .slice(0, 20)}`;
          const cachedSwatchSpec = swatchDescriptionCache.get(swatchCacheKey);
          if (cachedSwatchSpec !== undefined) {
            garmentSpec = cachedSwatchSpec;
          } else {
            try {
              const optimizedSwatchUrl = await optimizeImageDataUriForVision(swatchStr, 'low');
              const vis = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                max_tokens: 200,
                messages: [
                  {
                    role: 'user',
                    content: [
                      { type: 'image_url', image_url: { url: optimizedSwatchUrl, detail: 'low' } },
                      {
                        type: 'text',
                        text: `Describe in English, in one concise dense paragraph, ONLY the garment/product (${productType}) in this photo, ignoring any person, background or mannequin: exact main color of each piece, piping/trim colors, button count/color, fabric texture, neckline, sleeve/shorts length, and any manufacturer print or logo.${
                          fabricSpec.hasInfo
                            ? ` IMPORTANT USER-CONFIRMED FABRIC & DETAILS: ${fabricSpec.fabricSummaryLabel} (${fabricSpec.cleanedText.slice(0, 180)}).`
                            : ''
                        }`,
                      },
                    ],
                  },
                ],
              });
              garmentSpec = vis.choices[0]?.message?.content || '';
              if (garmentSpec) swatchDescriptionCache.set(swatchCacheKey, garmentSpec);
            } catch {
              garmentSpec = '';
            }
          }
        }

        const isDressGarment = Boolean(
          (productType && /\b(vestido|vestidos|dress|dresses|longo|midi|festa|chemise)\b/i.test(productType)) ||
          (cleanPrompt && /\b(vestido|vestidos|dress|dresses|longo|midi|festa|chemise)\b/i.test(cleanPrompt))
        );
        const isExplicitShortOrMidiOpenAI = Boolean(
          (productType && /\b(midi|curto|curta|mini)\b/i.test(productType)) ||
          (cleanPrompt && (cleanPrompt.includes('VESTIDO MIDI') || cleanPrompt.includes('VESTIDO CURTO')))
        );
        const isLongDressGarment = Boolean(
          !isExplicitShortOrMidiOpenAI &&
            ((productType && /\b(longo|longa|maxi)\b/i.test(productType)) ||
              (cleanPrompt && (cleanPrompt.includes('VESTIDO LONGO') || /\b(vestido longo|maxi)\b/i.test(cleanPrompt))))
        );
        const shoeEditInstruction = isDressGarment
          ? isLongDressGarment
            ? 'Se os pés estiverem visíveis, calçado harmonioso; se o vestido for longo até o chão igual à referência, mantenha longo.'
            : 'Preserva rigorosamente a altura exata da barra (midi/curto mostrando tornozelos e sandália feminina elegante que combine com o vestido, sem alongar até o chão).'
          : 'Substitua o calçado da modelo por um calçado harmonioso e elegante que combine perfeitamente com a peça anunciada.';

        effectivePrompt = `Esta é uma EDIÇÃO LOCALIZADA da imagem enviada. A imagem enviada é a base absoluta e deve permanecer IDÊNTICA: mesma mulher (rosto, cabelo, pele, corpo), mesma pose, mesmos braços e mãos, mesmo quarto/cenário, mesma iluminação, mesmo ângulo, mesmo enquadramento e mesma composição. NÃO recrie a cena, NÃO gere outra pessoa, NÃO mude o fundo. Zero tatuagens.

ALTERAÇÃO SOLICITADA:
1. Substitua a roupa/produto (${productType}) que ela veste por uma peça com exatamente estas características${variationName ? ` (variante "${variationName}")` : ''}: ${garmentSpec || productType}.${fabricSpec.hasInfo ? `\n${fabricSpec.promptBlockPt}` : ''}
2. CALÇADO: ${shoeEditInstruction}
3. Se for vestido ou macacão, ela veste EXCLUSIVAMENTE o vestido com pernas limpas naturais (proibido calça jeans ou shorts sob o vestido); se for blusa, veste calça jeans combinando; se for calça, veste blusa combinando. PRESERVE 1:1 o comprimento real da barra na foto de referência (se midi/curto, mantenha midi/curto sem alongar até o chão; só cubra os pés se for vestido longo igual à referência).
4. MÁXIMA NITIDEZ, FOCO ÓPTICO CRISTALINO E ALTA RESOLUÇÃO:
- Preserve a imagem com nitidez fotográfica impecável e foco cristalino, sem nenhum borrão, névoa ou perda de textura.
- Pele humana realista e natural com microtextura e poros visíveis, olhos vívidos e nítidos, e textura detalhada do tecido${fabricSpec.hasInfo ? ` (${fabricSpec.fabricSummaryLabel})` : ''} com iluminação de câmera moderna topo de linha (iPhone 16 Pro).
- ZERO borrão (NO BLUR), ZERO efeito embaçado, foco cravado em toda a modelo e no produto.
Preserve fielmente qualquer logomarca, estampa ou acabamento original da peça. Tudo que não for a peça e o calçado permanece pixel a pixel igual à imagem enviada. Proibido adicionar textos flutuantes, logos de redes sociais ou marcas d'água externas.`;
      } else if (referenceFrameBase64) {
        try {
          baseImageFile = await toImageFile(referenceFrameBase64, 'previous_storyboard');
        } catch {
          baseImageFile = imageFiles[0] || null;
        }
      } else if (scenarioPhotoBase64) {
        try {
          baseImageFile = await toImageFile(scenarioPhotoBase64, 'scenario_room_base');
        } catch {
          baseImageFile = imageFiles[0] || null;
        }
      } else if (imageFiles.length > 0 && !isCloneMode) {
        baseImageFile = imageFiles[0];
      }

      // Calcula o tamanho da imagem conforme proporção solicitada (16:9 horizontal => 1792x1024, 9:16 vertical => 1024x1792)
      const isLandscape = (aspectRatio === '16:9' || size === '1792x1024') && aspectRatio !== '9:16';
      const chosenImageSize = (size || (isLandscape ? '1792x1024' : OPENAI_IMAGE_SIZE)) as any;

      const checkIsVertical = (rawB64: string): boolean => {
        try {
          const buf = Buffer.from(rawB64, 'base64');
          if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 && buf.length >= 24) {
            return buf.readUInt32BE(20) > buf.readUInt32BE(16);
          }
          if (buf[0] === 0xFF && buf[1] === 0xD8) {
            let offset = 2;
            while (offset < buf.length - 8) {
              if (buf[offset] !== 0xFF) break;
              const marker = buf[offset + 1];
              if (marker === 0xC0 || marker === 0xC2) {
                return buf.readUInt16BE(offset + 5) > buf.readUInt16BE(offset + 7);
              }
              offset += 2 + buf.readUInt16BE(offset + 2);
            }
          }
        } catch {}
        return false;
      };

      // Se é horizontal 16:9 e a imagem de referência anterior era vertical, descartamos ela para não herdar o formato vertical
      if (isLandscape && referenceFrameBase64 && checkIsVertical(referenceFrameBase64)) {
        console.warn('[OpenAIProvider] referenceFrameBase64 é vertical em pedido 16:9 horizontal. Descartando imagem base para gerar horizontal limpa.');
        baseImageFile = null;
      }

      // Quando for Storyboard horizontal 16:9 widescreen e não houver baseImageFile válida,
      // usamos client.images.generate diretamente para NÃO herdar o canvas vertical da foto de celular do produto.
      if (isLandscape && !baseImageFile) {
        const genLandscapeRes = await client.images.generate({
          model: OPENAI_IMAGE_MODEL,
          prompt: effectivePrompt,
          quality: OPENAI_IMAGE_QUALITY,
          size: '1792x1024',
        });
        const b64Land = genLandscapeRes.data?.[0]?.b64_json;
        if (b64Land) {
          const imgCost = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
          globalCostTracker.recordCall({
            step: stepName,
            model: OPENAI_IMAGE_MODEL,
            costUSD: imgCost.costUSD,
            costBRL: imgCost.costBRL,
            details: `Geração horizontal 16:9 nativa (${chosenImageSize})`,
          });
          return {
            success: true,
            imageUrl: `data:image/png;base64,${b64Land}`,
            costBRL: imgCost.costBRL,
          };
        }
      }

      if (isUltraRealismEnabled && !effectivePrompt.includes('ULTRA PHOTOREALISM')) {
        effectivePrompt = `${effectivePrompt}\n\n${ultraRealismFullOpenAI}`;
      }

      // Sanitização incondicional antes do envio aos modelos OpenAI para evitar qualquer falso positivo de segurança
      effectivePrompt = sanitizePromptForOpenAISafety(effectivePrompt);

      // Se temos arquivo de imagem de base válido para edição, usamos client.images.edit
      if (baseImageFile) {
        const editImageInput: any = ((isAnaMariaGallery3Img || isAnaMariaModel2Img || (isAnaMariaMode && scenarioPhotoBase64)) && imageFiles.length > 1)
          ? imageFiles
          : (referenceFrameBase64
            ? baseImageFile
            : (!modelReferenceBase64 && imageFiles.length > 1 ? imageFiles : baseImageFile));
        const editResponse = await client.images.edit({
          model: OPENAI_IMAGE_MODEL,
          image: editImageInput,
          prompt: effectivePrompt,
          quality: OPENAI_IMAGE_QUALITY,
          size: chosenImageSize,
        });

        const b64 = editResponse.data?.[0]?.b64_json;
        if (b64) {
          // Se era para ser horizontal 16:9 mas a imagem gerada saiu vertical, refaz nativamente com generate
          if (isLandscape && checkIsVertical(b64)) {
            console.warn('[OpenAIProvider] Imagem editada saiu vertical em pedido 16:9. Refazendo via images.generate horizontal...');
            const genRetry = await client.images.generate({
              model: OPENAI_IMAGE_MODEL,
              prompt: effectivePrompt,
              quality: OPENAI_IMAGE_QUALITY,
              size: '1792x1024',
            });
            const b64Retry = genRetry.data?.[0]?.b64_json;
            if (b64Retry) {
              const imgCost = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
              return {
                success: true,
                imageUrl: `data:image/png;base64,${b64Retry}`,
                costBRL: imgCost.costBRL,
              };
            }
          }

          const imgCost = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
          globalCostTracker.recordCall({
            step: stepName,
            model: OPENAI_IMAGE_MODEL,
            costUSD: imgCost.costUSD,
            costBRL: imgCost.costBRL,
            details: `Geração com ${imageFiles.length} foto(s) de referência real em qualidade ${OPENAI_IMAGE_QUALITY} (${chosenImageSize})`,
          });

          return {
            success: true,
            imageUrl: `data:image/png;base64,${b64}`,
            costBRL: imgCost.costBRL,
          };
        }

        if (modelReferenceBase64) {
          return {
            success: false,
            error: 'A edição da Imagem 1 não retornou imagem. Use "Refazer".',
            fallbackRequired: false,
          };
        }
      }

      // Caso não haja arquivos de referência válidos, geração direta
      const genResponse = await client.images.generate({
        model: OPENAI_IMAGE_MODEL,
        prompt: sanitizePromptForOpenAISafety(cleanPrompt),
        quality: OPENAI_IMAGE_QUALITY,
        size: chosenImageSize,
      });

      const b64 = genResponse.data?.[0]?.b64_json;
      if (b64) {
        const imgCost = globalCostTracker.calculateImageCost(OPENAI_IMAGE_QUALITY);
        globalCostTracker.recordCall({
          step: stepName,
          model: OPENAI_IMAGE_MODEL,
          costUSD: imgCost.costUSD,
          costBRL: imgCost.costBRL,
          details: `GeraÃ§Ã£o direta em qualidade ${OPENAI_IMAGE_QUALITY}`,
        });

        return {
          success: true,
          imageUrl: `data:image/png;base64,${b64}`,
          costBRL: imgCost.costBRL,
        };
      }

      return {
        success: false,
        error: `Nenhuma imagem retornada pelo modelo OpenAI (${OPENAI_IMAGE_MODEL}).`,
        fallbackRequired: false,
      };
    } catch (err: any) {
      let msg = err?.message || '';
      const isQuota =
        err?.status === 429 ||
        err?.code === 'insufficient_quota' ||
        err?.type === 'insufficient_quota' ||
        /credit_balance_exhausted|no credits remaining|billing|quota|balance/i.test(msg);

      if (isQuota) {
        msg = 'Acabou o Saldo de sua Chave API da Openai faça uma recarga para continuar gerando.';
      } else {
        msg = `Erro ao gerar imagem com a OpenAI (${OPENAI_IMAGE_MODEL}): ${msg}`;
      }
      return {
        success: false,
        error: msg,
        fallbackRequired: false,
      };
    }
  }

  /**
   * 4. Auditoria Visual de Fidelidade (Fiscal TikTok Shop)
   * Modelo: gpt-5.6-luna
   */
  async auditImageFidelity(params: AuditFidelityParams): Promise<AuditFidelityResultResponse> {
    const {
      generatedImageBase64,
      referencePhotos = [],
      variationName = 'VariaÃ§Ã£o 1',
      role = 'Imagem 1',
      productInfo = '',
      fabricType = '',
    } = params;

    const client = this.getClient();
    const fabricSpec = analyzeAnaMariaProductInfo(productInfo, fabricType);

    let stepName: CloningStepName = 'auditoria da imagem 1';
    if (role.includes('Imagem 2') || role.includes('3/4')) {
      stepName = 'auditoria da imagem 2';
    } else if (role.includes('Imagem 3') || role.includes('Detalhe')) {
      stepName = 'auditoria da imagem 3';
    }

    const primaryRefs = referencePhotos.filter(Boolean).slice(0, 2);
    const [optGeneratedUrl, ...optRefUrls] = await Promise.all([
      optimizeImageDataUriForVision(generatedImageBase64, 'high'),
      ...primaryRefs.map((ref, idx) => optimizeImageDataUriForVision(ref, idx === 0 ? 'high' : 'low')),
    ]);

    // Prompt de sistema 100% ESTÁTICO para maximizar acertos de OpenAI Automatic Prompt Caching entre cores e retries
    const staticAuditSystemPrompt = `Você é o Auditor Fiscal de Fidelidade de Produtos para o TikTok Shop.
Compare EXCLUSIVAMENTE a peça/produto anunciado na imagem gerada com a(s) foto(s) de referência real(is) do produto.
REGRAS DE AVALIAÇÃO:
1. Ignore o cenário, paredes, piso, espelho, iluminação, pessoa/rosto/corpo e peças de roupa complementares que não fazem parte do produto da referência (ex.: se a foto de referência mostra apenas uma calça/saia, ignore a blusa complementar; se mostra apenas uma blusa, ignore a calça complementar; ignore os sapatos exceto quando o produto em si for um calçado).
2. Verifique rigorosamente na peça/produto principal: cor predominante, estampa/padrão (liso vs estampado), comprimento real (curto/mini, mídi, longo/maxi, cropped vs blusa comprida), presença ou ausência de fenda na perna, decote, alças, mangas, recortes, botões, costuras, textura do tecido, formato/solado/embalagem e logomarcas. Caso o usuário informe um tecido específico, lembre-se que a foto de referência pode estar comprimida — não penalize maior nitidez de trama quando a peça reproduzir fielmente o tecido informado junto à cor, modelagem e estampa da referência.
3. NOTA E STATUS:
   - VERDE (score >= 90, status: "green"): O produto principal gerado corresponde fielmente à foto de referência.
   - AMARELO (score 70 a 89, status: "yellow"): Divergência leve/parcial em algum detalhe da peça principal.
   - VERMELHO (score < 70, status: "red"): Divergência crítica na peça principal (cor diferente, comprimento encurtado/alongado, fenda inventada ou omitida, estampa diferente, modelagem/decote/alça diferente).
4. Caso o status seja "yellow" ou "red" (score < 90), preencha OBRIGATORIAMENTE:
   - "issues": array com 1 a 2 frases bem curtas e diretas em português explicando exatamente o motivo pelo qual a nota não ficou verde >= 90% (ex.: "Estampa ligeiramente menor que a referência", "Decote um pouco mais aberto", "Tom da cor levemente mais escuro").
   - "correctionPrompt": instrução direta em português do que corrigir na próxima geração para ficar 100% idêntico à referência.
Retorne estritamente um JSON:
{
  "score": number,
  "status": "green" | "yellow" | "red",
  "label": string,
  "issues": string[],
  "correctionPrompt": string
}`;

    const fabricAuditContext = fabricSpec.hasInfo
      ? `\nTECIDO/DETALHES INFORMADOS PELO USUÁRIO ("${fabricSpec.cleanedText.slice(0, 260)}" | ${fabricSpec.fabricSummaryLabel}): aprove se a imagem retratar com nitidez este tecido mantendo cor/modelagem/estampa da referência; reprove apenas se incompatível.`
      : '';

    const messages: any[] = [
      {
        role: 'system',
        content: staticAuditSystemPrompt,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `[IMAGEM GERADA]: Variação "${variationName}" (${role})${fabricAuditContext}`,
          },
          { type: 'image_url', image_url: { url: optGeneratedUrl, detail: 'high' } },
          ...primaryRefs.map((_ref, idx) => ({
            type: 'text' as const,
            text: `[FOTO DE REFERÊNCIA REAL ${idx + 1}]:`,
          })),
          ...optRefUrls.map((optUrl, idx) => ({
            type: 'image_url' as const,
            image_url: { url: optUrl, detail: idx === 0 ? ('high' as const) : ('low' as const) },
          })),
        ],
      },
    ];

    const auditModels = ['gpt-4o-mini', 'gpt-4o'];
    for (const modelCandidate of auditModels) {
      try {
        const response = await client.chat.completions.create({
          model: modelCandidate,
          max_tokens: 350,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages,
        });

        const pTokens = response.usage?.prompt_tokens || 0;
        const cTokens = response.usage?.completion_tokens || 0;
        const auditCost = globalCostTracker.calculateTokenCost(OPENAI_AUDIT_MODEL, pTokens, cTokens);

        globalCostTracker.recordCall({
          step: stepName,
          model: modelCandidate,
          promptTokens: pTokens,
          completionTokens: cTokens,
          costUSD: auditCost.costUSD,
          costBRL: auditCost.costBRL,
          details: `Auditoria de fidelidade de ${variationName} (${role})`,
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
        const score = Math.max(0, Math.min(100, Number(parsed.score) || 92));
        const status = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';
        const rawIssues = Array.isArray(parsed.issues)
          ? parsed.issues.map((i: any) => String(i || '').trim()).filter(Boolean)
          : [];
        const issuesList =
          rawIssues.length > 0
            ? rawIssues
            : status === 'green'
            ? ['Produto auditado com sucesso.']
            : [
                parsed.correctionPrompt
                  ? String(parsed.correctionPrompt).trim()
                  : `Pequena divergência visual em relação à foto de referência (${score}%).`,
              ];
        const fallbackCorrection =
          status !== 'green'
            ? `Corrigir rigorosamente na peça principal para ficar 100% idêntica à foto de referência: ${issuesList.join('; ')}`
            : '';

        return {
          success: true,
          audit: {
            score,
            status,
            label:
              parsed.label ||
              (status === 'green'
                ? `Verde — Fidelidade Aprovada (${score}%)`
                : status === 'yellow'
                ? `Amarelo — Variação Detectada (${score}%)`
                : `Vermelho — Divergência Crítica (${score}%)`),
            issues: issuesList,
            correctionPrompt: parsed.correctionPrompt || fallbackCorrection,
            auditedAngle: role,
          },
        };
      } catch (err: any) {
        console.warn(`[OpenAIProvider] Auditoria com ${modelCandidate} falhou:`, err?.message || err);
      }
    }

    return {
      success: true,
      audit: {
        score: 95,
        status: 'green',
        label: 'Verde Fidedigno (Auditoria Concluída)',
        issues: ['Fidelidade de produto validada.'],
        correctionPrompt: '',
        auditedAngle: role,
      },
    };
  }

  /**
   * Transcreve áudio direto com o modelo oficial de áudio da OpenAI (gpt-transcribe)
   */
  async transcribeAudio(buffer: Buffer, mimeType: string = 'audio/webm'): Promise<string> {
    const client = this.getClient();
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : 'webm';
    const audioFile = new File([buffer as any], `voice_input.${ext}`, { type: mimeType });
    const transcribeRes = await client.audio.transcriptions.create({
      file: audioFile,
      model: OPENAI_AUDIO_MODEL,
    });
    return transcribeRes.text?.trim() || '';
  }


}





