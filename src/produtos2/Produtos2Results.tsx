import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  RefreshCw,
  FileText,
  Sparkles,
  CheckCircle2,
  Eye,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Tag,
  Edit3,
  Wand2,
  Mic,
  Square,
  RotateCcw,
  Gavel,
} from 'lucide-react';
import { Produtos2AuditColorStatus, Produtos2ResultState, VideoFidelityAudit } from './types';
import {
  downloadProdutos2StoryboardImage,
  exportProdutos2Zip,
  sanitizeProductFileName,
} from './produtos2ZipExporter';
import { buildProdutos2VeoPrompt } from './produtos2Prompts';
import { selectAndAdaptProdutos2Copy } from './produtos2CopyBank';
import { VideoFidelityAuditor } from './VideoFidelityAuditor';
import { LeilaoBlockSection } from './LeilaoBlockSection';
import { AchadinhosBlockSection } from './AchadinhosBlockSection';
import { MicroImageEditor } from '../components/MicroImageEditor';
import { AIProfile } from '../config/aiProfiles';
import { TokenUsageStats } from '../types';

interface Produtos2ResultsProps {
  result: Produtos2ResultState;
  onUpdateResult: React.Dispatch<React.SetStateAction<Produtos2ResultState | null>>;
  onRegenerateStoryboard: (
    customCorrection?: string,
    sceneTarget?: 1 | 2 | 3,
    imageIndex?: number
  ) => void;
  onRecreateStoryboardWithCopy?: (
    newCopy: string,
    copySourceLabel?: string,
    sceneTarget?: 1 | 2
  ) => void;
  isRecreatingFullStoryboard?: boolean;
  recreateProgressPercent?: number;
  recreateStatusMessage?: string;
  onOpenPreview: (url: string, title: string) => void;
  aiProfile?: AIProfile;
  onTokenUsageChange?: (stats: TokenUsageStats) => void;
  referencePhotos?: string[];
}

function getStatusClasses(status: Produtos2AuditColorStatus) {
  switch (status) {
    case 'green':
      return {
        box: 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300',
        badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200',
        cell: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
        dot: 'bg-emerald-400',
      };
    case 'yellow':
      return {
        box: 'bg-amber-500/10 border-amber-500/40 text-amber-200',
        badge: 'bg-amber-500/20 border-amber-400/50 text-amber-200',
        cell: 'bg-amber-950/60 border-amber-500/50 text-amber-200',
        dot: 'bg-amber-400',
      };
    case 'orange':
      return {
        box: 'bg-orange-500/15 border-orange-500/50 text-orange-200',
        badge: 'bg-orange-500/25 border-orange-400/60 text-orange-200',
        cell: 'bg-orange-950/70 border-orange-500/60 text-orange-200',
        dot: 'bg-orange-400',
      };
    case 'red':
    default:
      return {
        box: 'bg-rose-500/15 border-rose-500/50 text-rose-200',
        badge: 'bg-rose-500/25 border-rose-400/60 text-rose-200',
        cell: 'bg-rose-950/70 border-rose-500/60 text-rose-200',
        dot: 'bg-rose-500',
      };
  }
}

export const Produtos2Results: React.FC<Produtos2ResultsProps> = ({
  result,
  onUpdateResult,
  onRegenerateStoryboard,
  onRecreateStoryboardWithCopy,
  isRecreatingFullStoryboard = false,
  recreateProgressPercent = 0,
  recreateStatusMessage = '',
  onOpenPreview,
  aiProfile = 'openai',
  onTokenUsageChange,
  referencePhotos = [],
}) => {
  const sceneMode = result.sceneMode || (result.duration === 15 ? '1_cena_15s' : '1_cena_10s');
  const is4Scenes = sceneMode === '1_cena_10s_4f' || (result.scenes && result.scenes.length === 4);
  const isTwoScenes = sceneMode === '2_cenas_10s' && Boolean(result.scene2);
  const is15sSingle = sceneMode === '1_cena_15s';
  const maxCharsScene1 = is15sSingle ? 335 : 225;
  const minCharsScene1 = is15sSingle ? 310 : 200;

  const allReferencePhotos = React.useMemo(() => {
    const combined: string[] = [];
    if (result.variations && result.variations.length > 0) {
      result.variations.forEach((v) => {
        (v.photos || []).forEach((p) => {
          if (p && !combined.includes(p)) combined.push(p);
        });
      });
    }
    if (referencePhotos && referencePhotos.length > 0) {
      referencePhotos.forEach((p) => {
        if (p && !combined.includes(p)) combined.push(p);
      });
    }
    return combined;
  }, [referencePhotos, result.variations]);

  const [promptCopied, setPromptCopied] = useState(false);
  const [hasCopiedPromptOnce, setHasCopiedPromptOnce] = useState(false);
  const [copyCopied, setCopyCopied] = useState(false);
  const [descriptionCopied, setDescriptionCopied] = useState(false);
  const [hasCopiedDescriptionOnce, setHasCopiedDescriptionOnce] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Modo Leilão
  const isLeilao = result.sceneMode === 'modo_leilao';

  // Trocar fala / Revisar texto / Geradores de Copy e Refazer Prompt (Cena 1 / Principal)
  const [speechInput, setSpeechInput] = useState(result.finalCopy || '');
  const [isReviewingSpeech, setIsReviewingSpeech] = useState(false);
  const [isGeneratingAuroraCopy, setIsGeneratingAuroraCopy] = useState(false);
  const [isGeneratingBankCopy, setIsGeneratingBankCopy] = useState(false);
  const [previousAuroraCopies, setPreviousAuroraCopies] = useState<string[]>(() =>
    result.finalCopy ? [result.finalCopy] : []
  );
  const [usedBankCopyIds, setUsedBankCopyIds] = useState<string[]>([]);
  const [generatedCopySourceLabel, setGeneratedCopySourceLabel] = useState<string | undefined>(undefined);
  const [isSpeechMicRecording, setIsSpeechMicRecording] = useState(false);
  const [speechAppliedSuccess, setSpeechAppliedSuccess] = useState(false);
  const speechRecRef = useRef<any>(null);
  const speechStreamRef = useRef<MediaStream | null>(null);
  const prevVeoPromptRef = useRef<string>(result.veoPrompt);

  // Estados independentes da Cena 2 (quando no modo "Duas cenas — 10 segundos cada")
  const [speechInput2, setSpeechInput2] = useState(result.scene2?.finalCopy || '');
  const [isReviewingSpeech2, setIsReviewingSpeech2] = useState(false);
  const [isGeneratingAuroraCopy2, setIsGeneratingAuroraCopy2] = useState(false);
  const [isGeneratingBankCopy2, setIsGeneratingBankCopy2] = useState(false);
  const [generatedCopySourceLabel2, setGeneratedCopySourceLabel2] = useState<string | undefined>(undefined);
  const [speech2AppliedSuccess, setSpeech2AppliedSuccess] = useState(false);
  const [copy2Copied, setCopy2Copied] = useState(false);
  const [prompt2Copied, setPrompt2Copied] = useState(false);
  const [hasCopiedPrompt2Once, setHasCopiedPrompt2Once] = useState(false);
  const [promptCorrection2, setPromptCorrection2] = useState('');
  const [isRefiningPrompt2, setIsRefiningPrompt2] = useState(false);
  const [storyboardCorrection2, setStoryboardCorrection2] = useState('');
  const prevVeoPrompt2Ref = useRef<string>(result.scene2?.veoPrompt || '');

  useEffect(() => {
    setSpeechInput(result.finalCopy || '');
  }, [result.finalCopy]);

  useEffect(() => {
    setSpeechInput2(result.scene2?.finalCopy || '');
  }, [result.scene2?.finalCopy]);

  // Sempre que houver edição/atualização no prompt do Veo 3, remove o destaque azul de "Copiado"
  useEffect(() => {
    if (prevVeoPromptRef.current !== result.veoPrompt) {
      prevVeoPromptRef.current = result.veoPrompt;
      setHasCopiedPromptOnce(false);
      setPromptCopied(false);
    }
  }, [result.veoPrompt]);

  useEffect(() => {
    const currentP2 = result.scene2?.veoPrompt || '';
    if (prevVeoPrompt2Ref.current !== currentP2) {
      prevVeoPrompt2Ref.current = currentP2;
      setHasCopiedPrompt2Once(false);
      setPrompt2Copied(false);
    }
  }, [result.scene2?.veoPrompt]);

  const appendTokenAuditStep = (stepName: string, usage: any) => {
    if (!onTokenUsageChange || !usage) return;
    const curr = result.tokenUsage || {
      promptTokens: 0,
      candidateTokens: 0,
      totalTokens: 0,
      estimatedCostBRL: 0,
      totalCostUSD: 0,
      breakdown: {
        videoAnalysisTokens: 0,
        videoAnalysisCostBRL: 0,
        speechTokens: 0,
        speechCostBRL: 0,
        imagesCount: 0,
        imagesCostBRL: 0,
        promptsTokens: 0,
        promptsCostBRL: 0,
      },
      detailedSteps: [],
      modelsUsed: [],
    };
    onTokenUsageChange({
      ...curr,
      detailedSteps: [
        ...(curr.detailedSteps || []),
        {
          step: stepName,
          model: usage.model || 'gemini-2.5-flash',
          costUSD: usage.costUSD || 0.005,
          costBRL: usage.costBRL || 0.03,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
        },
      ],
    });
  };

  const stopSpeechMicrophone = () => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }
    if (speechStreamRef.current) {
      speechStreamRef.current.getTracks().forEach((track) => track.stop());
      speechStreamRef.current = null;
    }
    setIsSpeechMicRecording(false);
  };

  const toggleSpeechMicrophone = async () => {
    if (isSpeechMicRecording) {
      stopSpeechMicrophone();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      speechStreamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        speechRecRef.current = rec;
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;

        const initialText = speechInput;

        rec.onresult = (evt: any) => {
          let transcript = '';
          for (let i = 0; i < evt.results.length; i++) {
            transcript += evt.results[i][0].transcript + ' ';
          }
          const combined = initialText
            ? `${initialText.trim()} ${transcript.trim()}`
            : transcript.trim();
          setSpeechInput(combined);
        };

        rec.onerror = () => stopSpeechMicrophone();
        rec.onend = () => stopSpeechMicrophone();
        rec.start();
        setIsSpeechMicRecording(true);
      }
    } catch (err) {
      console.warn('Erro ao acessar microfone para fala:', err);
      stopSpeechMicrophone();
    }
  };

  const applyNewSpeech = (newSpeech: string, isAuroraCopy = false) => {
    const trimmed = newSpeech.trim();
    if (!trimmed) return;

    setHasCopiedPromptOnce(false);
    setPromptCopied(false);

    onUpdateResult((prev) => {
      if (!prev) return null;

      let updatedPrompt = prev.veoPrompt;
      const speechRegex = /(FALAR EXATAMENTE UMA VEZ:\s*\n)("[^"]*"|'[^']*'|[^\n]+)/i;
      if (speechRegex.test(updatedPrompt)) {
        updatedPrompt = updatedPrompt.replace(speechRegex, `$1"${trimmed}"`);
        updatedPrompt = buildProdutos2VeoPrompt({
          productName: prev.productName,
          duration: prev.duration,
          speechMode: prev.speechMode,
          useSpeechIntro: prev.useSpeechIntro,
          finalCopy: trimmed,
          influencerResolved: prev.influencerResolved,
          framing: prev.framing,
          productLock: prev.productLock,
          avatarDescription: prev.avatarDescription,
          scenarioDescription: prev.scenarioDescription,
          scenes: prev.scenes,
          sceneCount: is4Scenes ? 4 : prev.sceneMode === '2_cenas_10s' ? 6 : 9,
          scenePartIndex: prev.sceneMode === '2_cenas_10s' ? 1 : undefined,
          additionalInstructions: prev.additionalInstructions,
          variations: prev.variations,
          isDialogue: prev.isDialogue,
          dialogueDescription: prev.dialogueDescription,
          dialogueScript: prev.dialogueScript,
          speakers: prev.speakers,
        });
      }

      return {
        ...prev,
        finalCopy: trimmed,
        copySourceLabel:
          generatedCopySourceLabel ||
          (isAuroraCopy ? 'Criada por IA (Aurora Copy)' : 'Personalizada / Editada'),
        veoPrompt: updatedPrompt,
      };
    });

    setSpeechAppliedSuccess(true);
    setTimeout(() => setSpeechAppliedSuccess(false), 3000);
  };

  const applyNewSpeechScene2 = (newSpeech: string, isAuroraCopy = false) => {
    const trimmed = newSpeech.trim();
    if (!trimmed) return;

    setHasCopiedPrompt2Once(false);
    setPrompt2Copied(false);

    onUpdateResult((prev) => {
      if (!prev || !prev.scene2) return prev;

      const updatedPrompt2 = buildProdutos2VeoPrompt({
        productName: prev.productName,
        duration: 10,
        speechMode: prev.speechMode,
        useSpeechIntro: false,
        finalCopy: trimmed,
        influencerResolved: prev.influencerResolved,
        framing: prev.framing,
        productLock: prev.productLock,
        avatarDescription: prev.avatarDescription,
        scenarioDescription: prev.scenarioDescription,
        scenes: prev.scene2.scenes,
        scenePartIndex: 2,
        additionalInstructions: prev.additionalInstructions,
        variations: prev.variations,
        isDialogue: prev.isDialogue,
        dialogueDescription: prev.dialogueDescription,
        dialogueScript: prev.dialogueScript,
        speakers: prev.speakers,
      });

      return {
        ...prev,
        scene2: {
          ...prev.scene2,
          finalCopy: trimmed,
          copySourceLabel:
            generatedCopySourceLabel2 ||
            (isAuroraCopy ? 'Criada por IA (Aurora Copy)' : 'Personalizada / Editada'),
          veoPrompt: updatedPrompt2,
        },
      };
    });

    setSpeech2AppliedSuccess(true);
    setTimeout(() => setSpeech2AppliedSuccess(false), 3000);
  };

  const recordSpeechStepUsage = (usage: any, stepTitle: string, stepDetails: string) => {
    if (!usage) return;
    const revP = usage.promptTokens || 450;
    const revC = usage.completionTokens || 90;
    const revT = usage.totalTokens || revP + revC;
    const revUSD = usage.costUSD || 0.001;
    const revBRL = usage.costBRL || 0.006;
    const revM = usage.model || 'gpt-4o-mini';

    onUpdateResult((prev) => {
      if (!prev) return null;
      const curr = prev.tokenUsage || {
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        estimatedCostBRL: 0,
        totalCostUSD: 0,
        breakdown: {
          videoAnalysisTokens: 0,
          videoAnalysisCostBRL: 0,
          speechTokens: 0,
          speechCostBRL: 0,
          imagesCount: 0,
          imagesCostBRL: 0,
          promptsTokens: 0,
          promptsCostBRL: 0,
        },
        detailedSteps: [],
        modelsUsed: [],
      };

      const updatedSteps = [
        ...(curr.detailedSteps || []),
        {
          step: stepTitle,
          model: revM,
          promptTokens: revP,
          completionTokens: revC,
          totalTokens: revT,
          costUSD: revUSD,
          costBRL: revBRL,
          timestamp: new Date().toISOString(),
          details: stepDetails,
        },
      ];

      const updatedStats: TokenUsageStats = {
        ...curr,
        promptTokens: curr.promptTokens + revP,
        candidateTokens: curr.candidateTokens + revC,
        totalTokens: curr.totalTokens + revT,
        totalCostUSD: Math.round(((curr.totalCostUSD || 0) + revUSD) * 1000) / 1000,
        estimatedCostBRL: Math.round((curr.estimatedCostBRL + revBRL) * 100) / 100,
        breakdown: {
          ...curr.breakdown,
          speechTokens: (curr.breakdown?.speechTokens || 0) + revT,
          speechCostBRL: Math.round(((curr.breakdown?.speechCostBRL || 0) + revBRL) * 100) / 100,
        },
        detailedSteps: updatedSteps,
        modelsUsed: Array.from(new Set([...(curr.modelsUsed || []), revM])),
        totalCalls: ((curr.totalCalls || curr.detailedSteps?.length) || 0) + 1,
      };

      onTokenUsageChange?.(updatedStats);

      return {
        ...prev,
        tokenUsage: updatedStats,
      };
    });
  };

  const handleGenerateWithAuroraCopy = async (targetScene: 1 | 2 = 1) => {
    const isScene2 = targetScene === 2;
    if (isScene2) {
      if (isGeneratingAuroraCopy2 || isGeneratingBankCopy2) return;
      setIsGeneratingAuroraCopy2(true);
    } else {
      if (isGeneratingAuroraCopy || isGeneratingBankCopy) return;
      setIsGeneratingAuroraCopy(true);
    }

    const reqMin = isScene2 ? 200 : minCharsScene1;
    const reqMax = isScene2 ? 225 : maxCharsScene1;
    const reqMode = isScene2 ? '1_cena_10s' : is15sSingle ? '1_cena_15s' : '1_cena_10s';

    try {
      const res = await fetch('/api/produtos2-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_aurora_copy',
          productName: result.productName,
          productInfo: result.productInfo || result.productName,
          duration: is15sSingle && !isScene2 ? 15 : 10,
          sceneMode: reqMode,
          targetMinChars: reqMin,
          targetMaxChars: reqMax,
          additionalInstructions: result.additionalInstructions,
          previousCopies: previousAuroraCopies,
          aiProfile,
        }),
      });
      const data = await res.json();
      if (data.success && data.auroraCopy) {
        if (isScene2) {
          setSpeechInput2(data.auroraCopy);
          setGeneratedCopySourceLabel2('Criada por IA (Aurora Copy)');
        } else {
          setSpeechInput(data.auroraCopy);
          setGeneratedCopySourceLabel('Criada por IA (Aurora Copy)');
        }
        setPreviousAuroraCopies((prev) => [...prev.slice(-8), data.auroraCopy]);
        if (data.usage) {
          recordSpeechStepUsage(
            data.usage,
            `Geração de Copy (Aurora Copy — Trocar fala${isTwoScenes ? ` Cena ${targetScene}` : ''})`,
            `Nova copy de ${reqMin} a ${reqMax} caracteres com hook inédito`
          );
        }
      } else {
        alert(`Erro ao gerar com Aurora Copy: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error('Erro ao gerar com Aurora Copy:', err);
      alert(`Falha ao gerar com Aurora Copy: ${err?.message || err}`);
    } finally {
      if (isScene2) setIsGeneratingAuroraCopy2(false);
      else setIsGeneratingAuroraCopy(false);
    }
  };

  const handleGenerateWithBankCopy = async (targetScene: 1 | 2 = 1) => {
    const isScene2 = targetScene === 2;
    if (isScene2) {
      if (isGeneratingBankCopy2 || isGeneratingAuroraCopy2) return;
      setIsGeneratingBankCopy2(true);
    } else {
      if (isGeneratingBankCopy || isGeneratingAuroraCopy) return;
      setIsGeneratingBankCopy(true);
    }

    const reqMin = isScene2 ? 200 : minCharsScene1;
    const reqMax = isScene2 ? 225 : maxCharsScene1;
    const reqMode = isScene2 ? '1_cena_10s' : is15sSingle ? '1_cena_15s' : '1_cena_10s';

    try {
      const localPick = selectAndAdaptProdutos2Copy({
        subMode: result.subMode || 'produtos_geral',
        maleSubOption: result.maleSubOption || 'calcados',
        productName: result.productName,
        productInfo: result.productInfo || result.productName,
        duration: 10,
        clientGender: result.clientGender || 'Unissex',
        influencer: result.influencerResolved || null,
        excludeCopyIds: usedBankCopyIds,
      });

      setUsedBankCopyIds((prev) => {
        const next = [...prev, localPick.copyId];
        return next.length >= 50 ? [localPick.copyId] : next;
      });

      const res = await fetch('/api/produtos2-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adapt_bank_copies',
          productName: result.productName,
          productInfo: result.productInfo || result.productName,
          clientGender: result.clientGender || 'Unissex',
          influencer: result.influencerResolved,
          enforceRange200To225: reqMax === 225,
          sceneMode: reqMode,
          targetMinChars: reqMin,
          targetMaxChars: reqMax,
          copy1: {
            id: localPick.copyId,
            originalText: localPick.baseEntry?.text || localPick.finalCopy,
            originalProductType: localPick.baseEntry?.productType || '',
            isSameProduct: false,
            localAdaptedText: localPick.finalCopy,
          },
          aiProfile,
        }),
      });

      const data = await res.json();
      const adapted = (data?.success && data?.adaptedCopy1) ? data.adaptedCopy1 : localPick.finalCopy;
      if (isScene2) {
        setSpeechInput2(adapted);
        setGeneratedCopySourceLabel2('Adaptada do Banco de Copies');
      } else {
        setSpeechInput(adapted);
        setGeneratedCopySourceLabel('Adaptada do Banco de Copies');
      }

      if (data?.usage) {
        recordSpeechStepUsage(
          data.usage,
          `Geração de Copy (Banco de Copies — Trocar fala${isTwoScenes ? ` Cena ${targetScene}` : ''})`,
          `Adaptação da copy #${localPick.copyId} do banco para o produto (${reqMin} a ${reqMax} caracteres)`
        );
      }
    } catch (err: any) {
      console.error('Erro ao gerar com Banco de Copies:', err);
      alert(`Falha ao gerar com Banco de Copies: ${err?.message || err}`);
    } finally {
      if (isScene2) setIsGeneratingBankCopy2(false);
      else setIsGeneratingBankCopy(false);
    }
  };

  const handleReviewSpeech = async (targetScene: 1 | 2 = 1) => {
    const isScene2 = targetScene === 2;
    const trimmed = (isScene2 ? speechInput2 : speechInput).trim();
    if (!trimmed) return;
    if (isScene2 ? isReviewingSpeech2 : isReviewingSpeech) return;

    if (isScene2) setIsReviewingSpeech2(true);
    else setIsReviewingSpeech(true);

    const reqMin = isScene2 ? 200 : minCharsScene1;
    const reqMax = isScene2 ? 225 : maxCharsScene1;
    const reqMode = isScene2 ? '1_cena_10s' : is15sSingle ? '1_cena_15s' : '1_cena_10s';

    try {
      const res = await fetch('/api/produtos2-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'normalize_speech_for_ai',
          text: trimmed,
          sceneMode: reqMode,
          targetMinChars: reqMin,
          targetMaxChars: reqMax,
          aiProfile,
        }),
      });

      const data = await res.json();
      if (data.success && data.reviewedSpeech) {
        if (isScene2) setSpeechInput2(data.reviewedSpeech);
        else setSpeechInput(data.reviewedSpeech);

        if (data.usage) {
          recordSpeechStepUsage(
            data.usage,
            `Revisão de Fala (Trocar fala${isTwoScenes ? ` Cena ${targetScene}` : ''})`,
            `Revisão conservadora do texto mantendo originalidade <= ${reqMax} caracteres`
          );
        }
      } else {
        alert(`Erro ao revisar fala: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error('Erro ao revisar fala:', err);
      alert(`Falha de conexão ao revisar fala: ${err?.message || err}`);
    } finally {
      if (isScene2) setIsReviewingSpeech2(false);
      else setIsReviewingSpeech(false);
    }
  };

  // Ajuste do prompt com IA (Refinamento geral de prompt / cenas)
  const [promptCorrection, setPromptCorrection] = useState('');
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);
  const [isPromptVoiceRecording, setIsPromptVoiceRecording] = useState(false);
  const [interimPromptCorrection, setInterimPromptCorrection] = useState('');
  const promptRecRef = useRef<any>(null);
  const promptStreamRef = useRef<MediaStream | null>(null);

  const stopPromptVoiceRecording = () => {
    if (promptRecRef.current) {
      try {
        promptRecRef.current.stop();
      } catch {}
      promptRecRef.current = null;
    }
    if (promptStreamRef.current) {
      promptStreamRef.current.getTracks().forEach((t) => t.stop());
      promptStreamRef.current = null;
    }
    setIsPromptVoiceRecording(false);
  };

  const togglePromptVoiceRecording = async () => {
    if (isPromptVoiceRecording) {
      stopPromptVoiceRecording();
      return;
    }

    setIsPromptVoiceRecording(true);
    setInterimPromptCorrection('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      promptStreamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        promptRecRef.current = rec;
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;

        const initialText = promptCorrection;

        rec.onresult = (evt: any) => {
          let transcript = '';
          for (let i = 0; i < evt.results.length; i++) {
            transcript += evt.results[i][0].transcript + ' ';
          }
          const combined = initialText
            ? `${initialText.trim()} ${transcript.trim()}`
            : transcript.trim();
          setPromptCorrection(combined);
        };

        rec.onerror = () => {
          stopPromptVoiceRecording();
        };

        rec.onend = () => {
          stopPromptVoiceRecording();
        };

        rec.start();
      }
    } catch (err) {
      console.warn('Erro ao acessar microfone para correção de prompt:', err);
      stopPromptVoiceRecording();
    }
  };

  // Ajuste do Storyboard por voz ou texto (Instrução direta do usuário para alterar quadros específicos)
  const [storyboardCorrection, setStoryboardCorrection] = useState('');
  const [isStoryboardVoiceRecording, setIsStoryboardVoiceRecording] = useState(false);
  const storyboardRecRef = useRef<any>(null);
  const storyboardStreamRef = useRef<MediaStream | null>(null);

  const stopStoryboardVoiceRecording = () => {
    if (storyboardRecRef.current) {
      try {
        storyboardRecRef.current.stop();
      } catch {}
      storyboardRecRef.current = null;
    }
    if (storyboardStreamRef.current) {
      storyboardStreamRef.current.getTracks().forEach((t) => t.stop());
      storyboardStreamRef.current = null;
    }
    setIsStoryboardVoiceRecording(false);
  };

  const toggleStoryboardVoiceRecording = async () => {
    if (isStoryboardVoiceRecording) {
      stopStoryboardVoiceRecording();
      return;
    }

    setIsStoryboardVoiceRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      storyboardStreamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        storyboardRecRef.current = rec;
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;

        const initialText = storyboardCorrection;

        rec.onresult = (evt: any) => {
          let transcript = '';
          for (let i = 0; i < evt.results.length; i++) {
            transcript += evt.results[i][0].transcript + ' ';
          }
          const combined = initialText
            ? `${initialText.trim()} ${transcript.trim()}`
            : transcript.trim();
          setStoryboardCorrection(combined);
        };

        rec.onerror = () => {
          stopStoryboardVoiceRecording();
        };

        rec.onend = () => {
          stopStoryboardVoiceRecording();
        };

        rec.start();
      }
    } catch (err) {
      console.warn('Erro ao acessar microfone para alteração do storyboard:', err);
      stopStoryboardVoiceRecording();
    }
  };

  useEffect(() => {
    return () => {
      stopSpeechMicrophone();
      stopPromptVoiceRecording();
      stopStoryboardVoiceRecording();
    };
  }, []);

  // Referência e efeito de rolagem automática suave até a imagem do storyboard gerada
  const storyboardSectionRef = useRef<HTMLDivElement>(null);
  const prevImgUrlRef = useRef<string | undefined>(undefined);
  const prevIsRegenRef = useRef<boolean>(Boolean(result.isRegeneratingStoryboard));

  useEffect(() => {
    const hasImageNow = Boolean(result.storyboardImageUrl);
    const hadNoImageBefore = !prevImgUrlRef.current;
    const imageChanged = Boolean(
      result.storyboardImageUrl && result.storyboardImageUrl !== prevImgUrlRef.current
    );
    const finishedRegenerating = prevIsRegenRef.current && !result.isRegeneratingStoryboard;

    if (hasImageNow && (hadNoImageBefore || imageChanged || finishedRegenerating)) {
      const timer = setTimeout(() => {
        storyboardSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 300);

      prevImgUrlRef.current = result.storyboardImageUrl;
      prevIsRegenRef.current = Boolean(result.isRegeneratingStoryboard);
      return () => clearTimeout(timer);
    }

    prevImgUrlRef.current = result.storyboardImageUrl;
    prevIsRegenRef.current = Boolean(result.isRegeneratingStoryboard);
  }, [result.storyboardImageUrl, result.isRegeneratingStoryboard]);

  const handleRefinePrompt = async (targetScene: 1 | 2 = 1) => {
    const isScene2 = targetScene === 2;
    const correction = isScene2
      ? promptCorrection2.trim()
      : (promptCorrection || interimPromptCorrection).trim();
    if (!correction) return;
    const targetPrompt = isScene2 ? result.scene2?.veoPrompt : result.veoPrompt;
    if (!targetPrompt) return;

    if (!isScene2) stopPromptVoiceRecording();
    if (isScene2) setIsRefiningPrompt2(true);
    else setIsRefiningPrompt(true);

    try {
      const res = await fetch('/api/refine-video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPrompt: targetPrompt,
          correctionInstruction: correction,
          aiProfile,
        }),
      });

      const data = await res.json();
      if (data.success && data.refinedPrompt) {
        if (isScene2) {
          setHasCopiedPrompt2Once(false);
          setPrompt2Copied(false);
          onUpdateResult((prev) =>
            prev && prev.scene2
              ? { ...prev, scene2: { ...prev.scene2, veoPrompt: data.refinedPrompt } }
              : prev
          );
          setPromptCorrection2('');
        } else {
          setHasCopiedPromptOnce(false);
          setPromptCopied(false);
          onUpdateResult((prev) => (prev ? { ...prev, veoPrompt: data.refinedPrompt } : null));
          setPromptCorrection('');
          setInterimPromptCorrection('');
        }
      } else if (data.error) {
        alert(`Erro ao refazer prompt: ${data.error}`);
      }
    } catch (err: any) {
      console.error('Erro ao refazer prompt:', err);
      alert(`Falha ao conectar com o serviço de refinamento: ${err?.message || err}`);
    } finally {
      if (isScene2) setIsRefiningPrompt2(false);
      else setIsRefiningPrompt(false);
    }
  };

  const handleVideoAuditComplete = (
    vAudit: VideoFidelityAudit,
    usageData: any,
    targetScene: 1 | 2 = 1
  ) => {
    onUpdateResult((prev) => {
      if (!prev) return null;

      const curr = prev.tokenUsage || {
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        estimatedCostBRL: 0,
        totalCostUSD: 0,
        breakdown: {
          videoAnalysisTokens: 0,
          videoAnalysisCostBRL: 0,
          speechTokens: 0,
          speechCostBRL: 0,
          imagesCount: 0,
          imagesCostBRL: 0,
          promptsTokens: 0,
          promptsCostBRL: 0,
        },
        detailedSteps: [],
        modelsUsed: [],
      };

      const pTok = usageData?.promptTokens || 3500;
      const cTok = usageData?.completionTokens || 350;
      const tTok = usageData?.totalTokens || pTok + cTok;
      const cUSD = usageData?.costUSD || 0.001;
      const cBRL = usageData?.costBRL || 0.01;
      const mUsed = usageData?.model || 'gpt-4o-mini';

      const newStep = {
        step: `Auditoria de Fidelidade do Vídeo${isTwoScenes ? ` (Cena ${targetScene})` : ''}`,
        model: mUsed,
        promptTokens: pTok,
        completionTokens: cTok,
        totalTokens: tTok,
        costUSD: cUSD,
        costBRL: cBRL,
        timestamp: new Date().toISOString(),
        details: `Auditoria de ${vAudit.frames.length} frames (1 a cada 2s) contra fotos reais`,
      };

      const updatedStats: TokenUsageStats = {
        ...curr,
        promptTokens: curr.promptTokens + pTok,
        candidateTokens: curr.candidateTokens + cTok,
        totalTokens: curr.totalTokens + tTok,
        totalCostUSD: Math.round(((curr.totalCostUSD || 0) + cUSD) * 1000) / 1000,
        estimatedCostBRL: Math.round((curr.estimatedCostBRL + cBRL) * 100) / 100,
        breakdown: {
          ...curr.breakdown,
          videoAnalysisTokens: (curr.breakdown?.videoAnalysisTokens || 0) + tTok,
          videoAnalysisCostBRL:
            Math.round(((curr.breakdown?.videoAnalysisCostBRL || 0) + cBRL) * 100) / 100,
        },
        detailedSteps: [...(curr.detailedSteps || []), newStep],
        modelsUsed: Array.from(new Set([...(curr.modelsUsed || []), mUsed])),
        totalCalls: ((curr.totalCalls || curr.detailedSteps?.length) || 0) + 1,
      };

      onTokenUsageChange?.(updatedStats);

      if (targetScene === 2 && prev.scene2) {
        return {
          ...prev,
          scene2: {
            ...prev.scene2,
            videoAudit: vAudit,
          },
          tokenUsage: updatedStats,
        };
      }

      return {
        ...prev,
        videoAudit: vAudit,
        tokenUsage: updatedStats,
      };
    });
  };

  const safeFileName = sanitizeProductFileName(result.productName);
  const audit = result.storyboardAudit;
  const auditStyles = getStatusClasses(audit?.overallStatus || 'green');
  const quadrantLimit1 = is4Scenes ? 4 : isTwoScenes ? 6 : 9;
  const problemQuadrants = (audit?.quadrants || [])
    .slice(0, quadrantLimit1)
    .filter((q) => q.productVisible && q.score < 90);

  const scene2 = result.scene2;
  const audit2 = scene2?.storyboardAudit;
  const auditStyles2 = getStatusClasses(audit2?.overallStatus || 'green');
  const problemQuadrants2 = (audit2?.quadrants || [])
    .slice(0, 6)
    .filter((q) => q.productVisible && q.score < 90);

  const handleCopyVeoPrompt = () => {
    navigator.clipboard.writeText(result.veoPrompt);
    setPromptCopied(true);
    setHasCopiedPromptOnce(true);
    setTimeout(() => setPromptCopied(false), 2500);
  };

  const handleCopyVeoPrompt2 = () => {
    if (!scene2?.veoPrompt) return;
    navigator.clipboard.writeText(scene2.veoPrompt);
    setPrompt2Copied(true);
    setHasCopiedPrompt2Once(true);
    setTimeout(() => setPrompt2Copied(false), 2500);
  };

  const handleCopyFinalSpeech = () => {
    navigator.clipboard.writeText(result.finalCopy);
    setCopyCopied(true);
    setTimeout(() => setCopyCopied(false), 2000);
  };

  const handleCopyFinalSpeech2 = () => {
    if (!scene2?.finalCopy) return;
    navigator.clipboard.writeText(scene2.finalCopy);
    setCopy2Copied(true);
    setTimeout(() => setCopy2Copied(false), 2000);
  };

  const handleCopyDescription = () => {
    if (result.description) {
      navigator.clipboard.writeText(result.description);
      setDescriptionCopied(true);
      setHasCopiedDescriptionOnce(true);
      setTimeout(() => setDescriptionCopied(false), 2500);
    }
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      await exportProdutos2Zip(result);
    } finally {
      setIsExportingZip(false);
    }
  };

  // O mesmo azul do Modo Ania quando o prompt do Veo 3 é copiado
  const copiedBlueSectionClass =
    'bg-gradient-to-br from-sky-900/85 via-blue-900/80 to-slate-900/95 border-2 border-sky-400 shadow-xl shadow-sky-950/60 ring-2 ring-sky-400/40';
  const defaultSectionClass = 'bg-zinc-900/90 border border-zinc-800 shadow-xl';

  if (isLeilao && result.leilao) {
    const leilao = result.leilao;
    const bids = leilao.bids || {
      l1: leilao.l1 || 0,
      l2: leilao.l2 || 0,
      l1Text: leilao.l1Text || '',
      l2Text: leilao.l2Text || '',
    };

    return (
      <div
        className="space-y-6 animate-fade-in p-4 sm:p-6 rounded-3xl"
        style={{ backgroundColor: '#391503' }}
      >
        {/* CABEÇALHO DO MODO LEILÃO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-stone-900 border border-amber-500/50 shadow-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <Gavel className="w-3.5 h-3.5" />
                <span>Modo Leilão</span>
              </span>
              <h2 className="text-sm sm:text-base font-black text-white">
                {result.productName} — 3 Blocos de Criativo (30s)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold flex-wrap">
              <span className="text-zinc-200 bg-black/70 px-2.5 py-1 rounded-lg border border-amber-900/60">
                1º Lance: R$ {bids.l1.toLocaleString('pt-BR')} ({bids.l1Text})
              </span>
              <span className="text-emerald-300 bg-black/70 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                2º Lance: R$ {bids.l2.toLocaleString('pt-BR')} ({bids.l2Text})
              </span>
            </div>
          </div>
          <p className="text-xs text-amber-200/90">
            Cada bloco possui seu Storyboard, campo para editar a fala, refinamento do Prompt com IA e análise de fidelidade do vídeo. Copie o prompt e anexe o storyboard de cada bloco para gerar no Veo 3.
          </p>
        </div>

        {/* ================================================================= */}
        {/* BLOCO 1: SALÃO DE LEILÃO (0–12s | 2 Imagens Verticais 1080x1920)   */}
        {/* ================================================================= */}
        <LeilaoBlockSection
          blockNumber={1}
          title="Bloco 1 (0–12s) — Salão de Leilão"
          subtitle="2 imagens verticais 9:16 independentes (1080 × 1920 px) · Salão aberto (Img 1) & Leiloeiro chocado com smartphone (Img 2)"
          downloadFileName="leilao_cena1"
          images={leilao.bloco1?.images}
          storyboardImageUrl={leilao.bloco1?.storyboardImageUrl}
          isRegeneratingStoryboard={Boolean(result.isRegeneratingStoryboard)}
          veoPrompt={leilao.bloco1?.veoPrompt || ''}
          speechText={leilao.bloco1?.speechText || leilao.speeches?.cena1 || ''}
          productName={result.productName}
          productLock={result.productLock}
          referencePhotos={allReferencePhotos}
          videoAudit={leilao.bloco1?.videoAudit}
          aiProfile={aiProfile}
          onUpdateVeoPrompt={(newPrompt) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              return {
                ...prev,
                veoPrompt: newPrompt,
                leilao: {
                  ...prev.leilao,
                  bloco1: {
                    ...prev.leilao.bloco1,
                    veoPrompt: newPrompt,
                  },
                },
              };
            });
          }}
          onUpdateSpeech={(newSpeech) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              const updatedLeilao = { ...prev.leilao };
              if (updatedLeilao.bloco1) {
                updatedLeilao.bloco1 = { ...updatedLeilao.bloco1, speechText: newSpeech };
              }
              if (updatedLeilao.speeches) {
                updatedLeilao.speeches = { ...updatedLeilao.speeches, cena1: newSpeech };
              }
              const full = `[Cena 1 | 0-12s]\n${newSpeech}\n\n[Cena 2 | 12-24s]\n${updatedLeilao.bloco2?.speechText || updatedLeilao.speeches?.cena2 || ''}\n\n[Cena 3 | 24-30s]\n${updatedLeilao.bloco3?.speechText || updatedLeilao.speeches?.cena3 || ''}`;
              return {
                ...prev,
                copy: full,
                finalCopy: full,
                leilao: updatedLeilao,
              };
            });
          }}
          onRegenerateImage={(instruction, imgIdx) => onRegenerateStoryboard(instruction, 1, imgIdx)}
          onAuditChange={(vAudit) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              return {
                ...prev,
                leilao: {
                  ...prev.leilao,
                  bloco1: {
                    ...prev.leilao.bloco1,
                    videoAudit: vAudit,
                  },
                },
              };
            });
          }}
          onAuditComplete={(_vAudit, usage) => {
            appendTokenAuditStep('Auditoria de Vídeo Modo Leilão (Bloco 1)', usage);
          }}
          onOpenPreview={onOpenPreview}
          onUpdateImage={(newUrl) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              const updatedLeilao = { ...prev.leilao };
              if (updatedLeilao.bloco1) {
                updatedLeilao.bloco1 = { ...updatedLeilao.bloco1, storyboardImageUrl: newUrl };
              }
              const updatedResult = {
                ...prev,
                storyboardImageUrl: newUrl,
                leilao: updatedLeilao,
              };
              import('../utils/historyStorage')
                .then(({ saveCreativeToHistory }) => {
                  saveCreativeToHistory(updatedResult);
                })
                .catch(() => {});
              return updatedResult;
            });
          }}
        />

        {/* ================================================================= */}
        {/* BLOCO 2: APRESENTAÇÃO & CLOSES (12–24s | 3 Imagens 1080x1920)     */}
        {/* ================================================================= */}
        <LeilaoBlockSection
          blockNumber={2}
          title="Bloco 2 (12–24s) — Apresentação & Closes do Produto"
          subtitle="3 imagens verticais 9:16 independentes (1080 × 1920 px) · Apresentador (Img 3), Close Benefício 1 (Img 4), Close Benefício 2 (Img 5)"
          downloadFileName="leilao_cena2"
          images={leilao.bloco2?.images}
          storyboardImageUrl={leilao.bloco2?.storyboardImageUrl}
          isRegeneratingStoryboard={Boolean(result.isRegeneratingStoryboard)}
          veoPrompt={leilao.bloco2?.veoPrompt || ''}
          speechText={leilao.bloco2?.speechText || leilao.speeches?.cena2 || ''}
          productName={result.productName}
          productLock={result.productLock}
          referencePhotos={allReferencePhotos}
          videoAudit={leilao.bloco2?.videoAudit}
          aiProfile={aiProfile}
          onUpdateVeoPrompt={(newPrompt) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              return {
                ...prev,
                leilao: {
                  ...prev.leilao,
                  bloco2: {
                    ...prev.leilao.bloco2,
                    veoPrompt: newPrompt,
                  },
                },
              };
            });
          }}
          onUpdateSpeech={(newSpeech) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              const updatedLeilao = { ...prev.leilao };
              if (updatedLeilao.bloco2) {
                updatedLeilao.bloco2 = { ...updatedLeilao.bloco2, speechText: newSpeech };
              }
              if (updatedLeilao.speeches) {
                updatedLeilao.speeches = { ...updatedLeilao.speeches, cena2: newSpeech };
              }
              const full = `[Cena 1 | 0-12s]\n${updatedLeilao.bloco1?.speechText || updatedLeilao.speeches?.cena1 || ''}\n\n[Cena 2 | 12-24s]\n${newSpeech}\n\n[Cena 3 | 24-30s]\n${updatedLeilao.bloco3?.speechText || updatedLeilao.speeches?.cena3 || ''}`;
              return {
                ...prev,
                copy: full,
                finalCopy: full,
                leilao: updatedLeilao,
              };
            });
          }}
          onRegenerateImage={(instruction, imgIdx) => onRegenerateStoryboard(instruction, 2, imgIdx)}
          onAuditChange={(vAudit) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              return {
                ...prev,
                leilao: {
                  ...prev.leilao,
                  bloco2: {
                    ...prev.leilao.bloco2,
                    videoAudit: vAudit,
                  },
                },
              };
            });
          }}
          onAuditComplete={(_vAudit, usage) => {
            appendTokenAuditStep('Auditoria de Vídeo Modo Leilão (Bloco 2)', usage);
          }}
          onOpenPreview={onOpenPreview}
          onUpdateImage={(newUrl) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              const updatedLeilao = { ...prev.leilao };
              if (updatedLeilao.bloco2) {
                updatedLeilao.bloco2 = { ...updatedLeilao.bloco2, storyboardImageUrl: newUrl };
              }
              const updatedResult = {
                ...prev,
                leilao: updatedLeilao,
              };
              import('../utils/historyStorage')
                .then(({ saveCreativeToHistory }) => {
                  saveCreativeToHistory(updatedResult);
                })
                .catch(() => {});
              return updatedResult;
            });
          }}
        />

        {/* ================================================================= */}
        {/* BLOCO 3: LEILOEIRO NO TELÃO (24–30s | 1 Imagem 1080x1920)          */}
        {/* ================================================================= */}
        <LeilaoBlockSection
          blockNumber={3}
          title="Bloco 3 (24–30s) — Chamada no Carrinho Laranja"
          subtitle="Imagem única vertical 9:16 independente (1080 × 1920 px, sem número) · Leiloeiro apontando com produto no telão (Img 6)"
          downloadFileName="leilao_cena3"
          images={leilao.bloco3?.images}
          storyboardImageUrl={leilao.bloco3?.storyboardImageUrl}
          isRegeneratingStoryboard={Boolean(result.isRegeneratingStoryboard)}
          veoPrompt={leilao.bloco3?.veoPrompt || ''}
          speechText={leilao.bloco3?.speechText || leilao.speeches?.cena3 || ''}
          productName={result.productName}
          productLock={result.productLock}
          referencePhotos={allReferencePhotos}
          videoAudit={leilao.bloco3?.videoAudit}
          aiProfile={aiProfile}
          onUpdateVeoPrompt={(newPrompt) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              return {
                ...prev,
                leilao: {
                  ...prev.leilao,
                  bloco3: {
                    ...prev.leilao.bloco3,
                    veoPrompt: newPrompt,
                  },
                },
              };
            });
          }}
          onUpdateSpeech={(newSpeech) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              const updatedLeilao = { ...prev.leilao };
              if (updatedLeilao.bloco3) {
                updatedLeilao.bloco3 = { ...updatedLeilao.bloco3, speechText: newSpeech };
              }
              if (updatedLeilao.speeches) {
                updatedLeilao.speeches = { ...updatedLeilao.speeches, cena3: newSpeech };
              }
              const full = `[Cena 1 | 0-12s]\n${updatedLeilao.bloco1?.speechText || updatedLeilao.speeches?.cena1 || ''}\n\n[Cena 2 | 12-24s]\n${updatedLeilao.bloco2?.speechText || updatedLeilao.speeches?.cena2 || ''}\n\n[Cena 3 | 24-30s]\n${newSpeech}`;
              return {
                ...prev,
                copy: full,
                finalCopy: full,
                leilao: updatedLeilao,
              };
            });
          }}
          onRegenerateImage={(instruction, imgIdx) => onRegenerateStoryboard(instruction, 3, imgIdx)}
          onAuditChange={(vAudit) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.leilao) return prev;
              return {
                ...prev,
                leilao: {
                  ...prev.leilao,
                  bloco3: {
                    ...prev.leilao.bloco3,
                    videoAudit: vAudit,
                  },
                },
              };
            });
          }}
          onAuditComplete={(_vAudit, usage) => {
            appendTokenAuditStep('Auditoria de Vídeo Modo Leilão (Bloco 3)', usage);
          }}
          onOpenPreview={onOpenPreview}
        />

        {/* DESCRIÇÃO DO POST + HASHTAGS */}
        <div
          className={`p-4 sm:p-5 rounded-2xl transition-all ${
            hasCopiedDescriptionOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-black text-white">
                Descrição do Post + Hashtags (TikTok & Reels)
              </span>
              {hasCopiedDescriptionOnce && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" />
                  <span>COPIADO</span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopyDescription}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                descriptionCopied
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
              }`}
            >
              {descriptionCopied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Descrição</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={result.descriptionHashtags || result.description || ''}
            onChange={(e) => {
              const val = e.target.value;
              setHasCopiedDescriptionOnce(false);
              onUpdateResult((prev) => (prev ? { ...prev, description: val, descriptionHashtags: val } : null));
            }}
            rows={4}
            className="w-full p-3 bg-black/60 border border-zinc-700/80 focus:border-emerald-400 rounded-xl text-xs text-zinc-200 font-sans leading-relaxed resize-y"
          />
        </div>

        {/* BOTÃO BAIXAR TUDO (.ZIP) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            {isExportingZip ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Compactando 3 Imagens e 3 Prompts...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>BAIXAR TUDO (.ZIP COM 3 IMAGENS + 3 PROMPTS TXT)</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO AURORA ACHADINHOS (3 CENAS DE 10S) — VERSÃO 5.0
  // Cor de fundo: Verde escuro quase preto (#021a0d)
  // =========================================================================
  const isAchadinhos = result.sceneMode === 'modo_achadinhos' && Boolean(result.achadinhos);
  if (isAchadinhos && result.achadinhos) {
    const achadinhos = result.achadinhos;

    return (
      <div
        className="space-y-6 animate-fade-in p-4 sm:p-6 rounded-3xl"
        style={{ backgroundColor: '#021a0d' }}
      >
        {/* CABEÇALHO DO MODO ACHADINHOS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-teal-950/90 to-zinc-950 border border-emerald-500/50 shadow-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950/50">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modo Aurora Achadinhos</span>
              </span>
              <h2 className="text-sm sm:text-base font-black text-white">
                {result.productName} — 3 Cenas de 10s (30s no Total)
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-black/70 px-2.5 py-1 rounded-lg border border-emerald-500/40">
              3 Storyboards 16:9 (9 Quadros Verticais) · 3 Vídeos OmniFlash / Veo 3
            </span>
          </div>
          <p className="text-xs text-emerald-200/90">
            Cada cena possui seu Storyboard horizontal 16:9 (composto por 3 quadros verticais A, B e C), campo individual para edição da fala (até 225 caracteres), refinamento de prompt com IA e análise de fidelidade do vídeo.
          </p>
        </div>

        {/* ================================================================= */}
        {/* CENA 1: HOOK & DESCOBERTA (0–10s | 3 Quadros A, B, C em 16:9)     */}
        {/* ================================================================= */}
        <AchadinhosBlockSection
          blockNumber={1}
          title="Cena 1 (0–10s) — Hook & Descoberta"
          subtitle="Storyboard horizontal 16:9 contendo 3 quadros verticais (A: Início, B: Transição, C: Destaque) · Descoberta e Apresentação"
          downloadFileName="achadinhos_storyboard_1"
          storyboardImageUrl={achadinhos.bloco1?.storyboardImageUrl}
          isRegeneratingStoryboard={Boolean(result.isRegeneratingStoryboard)}
          veoPrompt={achadinhos.bloco1?.veoPrompt || ''}
          speechText={achadinhos.bloco1?.speechText || achadinhos.speeches?.cena1 || ''}
          productName={result.productName}
          productLock={result.productLock}
          referencePhotos={allReferencePhotos}
          videoAudit={achadinhos.bloco1?.videoAudit}
          aiProfile={aiProfile}
          onUpdateVeoPrompt={(newPrompt) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              return {
                ...prev,
                veoPrompt: newPrompt,
                achadinhos: {
                  ...prev.achadinhos,
                  bloco1: {
                    ...prev.achadinhos.bloco1,
                    veoPrompt: newPrompt,
                  },
                },
              };
            });
          }}
          onUpdateSpeech={(newSpeech) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              const updated = { ...prev.achadinhos };
              if (updated.bloco1) updated.bloco1 = { ...updated.bloco1, speechText: newSpeech };
              if (updated.speeches) updated.speeches = { ...updated.speeches, cena1: newSpeech };
              const full = `[Cena 1 | 0-10s]\n${newSpeech}\n\n[Cena 2 | 10-20s]\n${updated.bloco2?.speechText || updated.speeches?.cena2 || ''}\n\n[Cena 3 | 20-30s]\n${updated.bloco3?.speechText || updated.speeches?.cena3 || ''}`;
              return {
                ...prev,
                copy: full,
                finalCopy: full,
                achadinhos: updated,
              };
            });
          }}
          onRegenerateImage={(instruction) => onRegenerateStoryboard(instruction, 1)}
          onAuditChange={(vAudit) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              return {
                ...prev,
                achadinhos: {
                  ...prev.achadinhos,
                  bloco1: {
                    ...prev.achadinhos.bloco1,
                    videoAudit: vAudit,
                  },
                },
              };
            });
          }}
          onAuditComplete={(_vAudit, usage) => {
            appendTokenAuditStep('Auditoria de Vídeo Modo Achadinhos (Cena 1)', usage);
          }}
          onOpenPreview={onOpenPreview}
        />

        {/* ================================================================= */}
        {/* CENA 2: DEMONSTRAÇÃO & BENEFÍCIO (10–20s | 3 Quadros em 16:9)    */}
        {/* ================================================================= */}
        <AchadinhosBlockSection
          blockNumber={2}
          title="Cena 2 (10–20s) — Demonstração & Benefício"
          subtitle="Storyboard horizontal 16:9 contendo 3 quadros verticais (A: Preparação, B: Ação em uso, C: Resultado visual) · Utilidade Prática"
          downloadFileName="achadinhos_storyboard_2"
          storyboardImageUrl={achadinhos.bloco2?.storyboardImageUrl}
          isRegeneratingStoryboard={Boolean(result.isRegeneratingStoryboard)}
          veoPrompt={achadinhos.bloco2?.veoPrompt || ''}
          speechText={achadinhos.bloco2?.speechText || achadinhos.speeches?.cena2 || ''}
          productName={result.productName}
          productLock={result.productLock}
          referencePhotos={allReferencePhotos}
          videoAudit={achadinhos.bloco2?.videoAudit}
          aiProfile={aiProfile}
          onUpdateVeoPrompt={(newPrompt) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              return {
                ...prev,
                achadinhos: {
                  ...prev.achadinhos,
                  bloco2: {
                    ...prev.achadinhos.bloco2,
                    veoPrompt: newPrompt,
                  },
                },
              };
            });
          }}
          onUpdateSpeech={(newSpeech) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              const updated = { ...prev.achadinhos };
              if (updated.bloco2) updated.bloco2 = { ...updated.bloco2, speechText: newSpeech };
              if (updated.speeches) updated.speeches = { ...updated.speeches, cena2: newSpeech };
              const full = `[Cena 1 | 0-10s]\n${updated.bloco1?.speechText || updated.speeches?.cena1 || ''}\n\n[Cena 2 | 10-20s]\n${newSpeech}\n\n[Cena 3 | 20-30s]\n${updated.bloco3?.speechText || updated.speeches?.cena3 || ''}`;
              return {
                ...prev,
                copy: full,
                finalCopy: full,
                achadinhos: updated,
              };
            });
          }}
          onRegenerateImage={(instruction) => onRegenerateStoryboard(instruction, 2)}
          onAuditChange={(vAudit) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              return {
                ...prev,
                achadinhos: {
                  ...prev.achadinhos,
                  bloco2: {
                    ...prev.achadinhos.bloco2,
                    videoAudit: vAudit,
                  },
                },
              };
            });
          }}
          onAuditComplete={(_vAudit, usage) => {
            appendTokenAuditStep('Auditoria de Vídeo Modo Achadinhos (Cena 2)', usage);
          }}
          onOpenPreview={onOpenPreview}
        />

        {/* ================================================================= */}
        {/* CENA 3: FECHAMENTO & CTA NO CARRINHO (20–30s | 3 Quadros em 16:9) */}
        {/* ================================================================= */}
        <AchadinhosBlockSection
          blockNumber={3}
          title="Cena 3 (20–30s) — Fechamento & CTA no Carrinho"
          subtitle="Storyboard horizontal 16:9 contendo 3 quadros verticais (A: Retomada, B: Conclusão, C: Indicação natural do carrinho)"
          downloadFileName="achadinhos_storyboard_3"
          storyboardImageUrl={achadinhos.bloco3?.storyboardImageUrl}
          isRegeneratingStoryboard={Boolean(result.isRegeneratingStoryboard)}
          veoPrompt={achadinhos.bloco3?.veoPrompt || ''}
          speechText={achadinhos.bloco3?.speechText || achadinhos.speeches?.cena3 || ''}
          productName={result.productName}
          productLock={result.productLock}
          referencePhotos={allReferencePhotos}
          videoAudit={achadinhos.bloco3?.videoAudit}
          aiProfile={aiProfile}
          onUpdateVeoPrompt={(newPrompt) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              return {
                ...prev,
                achadinhos: {
                  ...prev.achadinhos,
                  bloco3: {
                    ...prev.achadinhos.bloco3,
                    veoPrompt: newPrompt,
                  },
                },
              };
            });
          }}
          onUpdateSpeech={(newSpeech) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              const updated = { ...prev.achadinhos };
              if (updated.bloco3) updated.bloco3 = { ...updated.bloco3, speechText: newSpeech };
              if (updated.speeches) updated.speeches = { ...updated.speeches, cena3: newSpeech };
              const full = `[Cena 1 | 0-10s]\n${updated.bloco1?.speechText || updated.speeches?.cena1 || ''}\n\n[Cena 2 | 10-20s]\n${updated.bloco2?.speechText || updated.speeches?.cena2 || ''}\n\n[Cena 3 | 20-30s]\n${newSpeech}`;
              return {
                ...prev,
                copy: full,
                finalCopy: full,
                achadinhos: updated,
              };
            });
          }}
          onRegenerateImage={(instruction) => onRegenerateStoryboard(instruction, 3)}
          onAuditChange={(vAudit) => {
            onUpdateResult((prev) => {
              if (!prev || !prev.achadinhos) return prev;
              return {
                ...prev,
                achadinhos: {
                  ...prev.achadinhos,
                  bloco3: {
                    ...prev.achadinhos.bloco3,
                    videoAudit: vAudit,
                  },
                },
              };
            });
          }}
          onAuditComplete={(_vAudit, usage) => {
            appendTokenAuditStep('Auditoria de Vídeo Modo Achadinhos (Cena 3)', usage);
          }}
          onOpenPreview={onOpenPreview}
        />

        {/* DESCRIÇÃO DO POST + HASHTAGS */}
        <div
          className={`p-4 sm:p-5 rounded-2xl transition-all ${
            hasCopiedDescriptionOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-black text-white">
                Descrição do Post + Hashtags (TikTok & Reels)
              </span>
              {hasCopiedDescriptionOnce && (
                <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-300" />
                  <span>COPIADO</span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopyDescription}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                descriptionCopied
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
              }`}
            >
              {descriptionCopied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Descrição</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={result.descriptionHashtags || result.description || ''}
            onChange={(e) => {
              const val = e.target.value;
              setHasCopiedDescriptionOnce(false);
              onUpdateResult((prev) => (prev ? { ...prev, description: val, descriptionHashtags: val } : null));
            }}
            rows={4}
            className="w-full p-3 bg-black/60 border border-zinc-700/80 focus:border-emerald-400 rounded-xl text-xs text-zinc-200 font-sans leading-relaxed resize-y"
          />
        </div>

        {/* BOTÃO BAIXAR TUDO (.ZIP) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            {isExportingZip ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Compactando 3 Storyboards e 3 Prompts...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>BAIXAR TUDO (.ZIP COM 3 IMAGENS + 3 PROMPTS TXT)</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CABEÇALHO DE IDENTIFICAÇÃO DA CENA 1 (Apenas no modo Duas Cenas — 10s cada) */}
      {isTwoScenes && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-zinc-900 border border-emerald-500/40 shadow-lg flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider">
              Primeira Seção — Cena 1
            </span>
            <span className="text-xs sm:text-sm font-black text-white">
              Cena 1 (10 segundos · Grade 2×3 com 6 Quadros — Gancho e Desenvolvimento Inicial)
            </span>
          </div>
          <span className="text-[11px] text-emerald-300 font-semibold">
            Parte 1 de 2 da narrativa contínua
          </span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CARD DA COPY FINAL USADA E SUA ORIGEM (Cena 1 / Principal)            */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/95 border border-emerald-500/40 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
              {isTwoScenes ? 'Copy Final Usada no Criativo — Cena 1' : 'Copy Final Usada no Criativo'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-bold text-emerald-200">
              {result.copySourceLabel}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                result.finalCopy.length > maxCharsScene1
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {result.finalCopy.length} / {maxCharsScene1} caracteres (máx. {maxCharsScene1})
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyFinalSpeech}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copyCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copy Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copiar Só a Fala</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed select-text">
          {result.finalCopy}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CARD: TROCAR FALA · REVISAR TEXTO · GERADORES DE COPY E RECRIAR       */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/95 border border-purple-500/40 shadow-xl space-y-3">
        {/* 1. Título "Trocar fala" na parte superior e contador à direita */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs sm:text-sm font-black text-white">
              {isTwoScenes ? 'Trocar fala — Cena 1' : 'Trocar fala'}
            </h3>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {speechAppliedSuccess && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-xs font-bold text-emerald-300 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Prompt do Veo 3 e fala atualizados com sucesso!
              </span>
            )}

            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                speechInput.length > maxCharsScene1
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-zinc-800/90 text-zinc-300 border border-zinc-700'
              }`}
            >
              {speechInput.length}/{maxCharsScene1} caracteres
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="relative">
            <textarea
              rows={3}
              value={speechInput}
              onChange={(e) => {
                setSpeechInput(e.target.value);
                setGeneratedCopySourceLabel('Personalizada / Editada');
              }}
              placeholder="Digite aqui a nova fala do vídeo ou use o microfone..."
              className={`w-full p-3.5 pr-12 rounded-xl bg-zinc-950 border text-xs sm:text-sm placeholder-zinc-500 focus:outline-none leading-relaxed font-sans shadow-inner resize-y transition-colors ${
                speechInput.length > maxCharsScene1
                  ? 'text-rose-400 border-rose-500 focus:border-rose-400 font-semibold'
                  : 'text-zinc-100 border-zinc-700 focus:border-purple-400'
              }`}
            />

            {/* Botão Microfone */}
            <button
              type="button"
              onClick={toggleSpeechMicrophone}
              className={`absolute right-2.5 top-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                isSpeechMicRecording
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-600'
              }`}
              title={isSpeechMicRecording ? 'Parar gravação' : 'Ditar fala por voz'}
            >
              {isSpeechMicRecording ? (
                <Square className="w-4 h-4 fill-white" />
              ) : (
                <Mic className="w-4 h-4 text-zinc-300" />
              )}
            </button>
          </div>

          {/* Contador posicionado logo abaixo da caixa de texto, próximo à sua borda inferior, sem ocupar a linha dos botões */}
          <div className="flex items-center justify-between px-1">
            <span
              className={`text-[11px] font-mono ${
                speechInput.length > maxCharsScene1 ? 'text-rose-400 font-bold' : 'text-zinc-400'
              }`}
            >
              {speechInput.length}/{maxCharsScene1} caracteres
            </span>
            {isSpeechMicRecording && (
              <span className="text-[11px] text-rose-400 flex items-center gap-1.5 font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Gravando sua fala... clique no quadrado vermelho para parar.
              </span>
            )}
          </div>
        </div>

        {/* Linha dos botões de ação já existentes (Revisar texto e Refazer Prompt) */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
          {/* Botão Revisar texto (Amarelo) */}
          <button
            type="button"
            onClick={() => handleReviewSpeech(1)}
            disabled={isReviewingSpeech || !speechInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-950/20"
          >
            {isReviewingSpeech ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>Revisando texto...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>Revisar texto</span>
              </>
            )}
          </button>

          {/* Botão Refazer Prompt */}
          <button
            type="button"
            onClick={() => applyNewSpeech(speechInput, generatedCopySourceLabel === 'Criada por IA (Aurora Copy)')}
            disabled={!speechInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Refazer Prompt</span>
          </button>
        </div>

        {/* 2. Seleção do gerador de copy + Recriar Storyboard */}
        <div className="pt-2.5 border-t border-zinc-800/90 space-y-2">
          <span className="text-xs font-bold text-zinc-200 block">
            Escolha seu gerador de copy
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Botão 1 — Aurora Copy (Cor: lilás) */}
            <button
              type="button"
              onClick={() => handleGenerateWithAuroraCopy(1)}
              disabled={isGeneratingAuroraCopy || isGeneratingBankCopy || Boolean(isRecreatingFullStoryboard)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 border border-purple-400/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-950/40"
            >
              {isGeneratingAuroraCopy ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando com Aurora Copy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar com Aurora Copy</span>
                </>
              )}
            </button>

            {/* Botão 2 — Banco de Copies (Cor: verde-azulado / teal) */}
            <button
              type="button"
              onClick={() => handleGenerateWithBankCopy(1)}
              disabled={isGeneratingBankCopy || isGeneratingAuroraCopy || Boolean(isRecreatingFullStoryboard)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 border border-teal-400/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-950/40"
            >
              {isGeneratingBankCopy ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando com Banco de Copies...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Gerar com Banco de Copies</span>
                </>
              )}
            </button>

            {/* Botão 3 — Recriar Storyboard (Cor: laranja) */}
            <button
              type="button"
              onClick={() => {
                if (!speechInput.trim() || isRecreatingFullStoryboard) return;
                setHasCopiedPromptOnce(false);
                setPromptCopied(false);
                onRecreateStoryboardWithCopy?.(speechInput.trim(), generatedCopySourceLabel, 1);
              }}
              disabled={
                !speechInput.trim() ||
                Boolean(isRecreatingFullStoryboard) ||
                Boolean(result.isRegeneratingStoryboard)
              }
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 border border-orange-400/50 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-orange-950/40"
            >
              {isRecreatingFullStoryboard ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recriando Storyboard ({recreateProgressPercent}%)...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isTwoScenes ? 'Recriar Storyboard (Cena 1)' : 'Recriar Storyboard'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* LADO A LADO: IMAGEM DO STORYBOARD (1080x1920) + PROMPT DO VEO 3       */}
      {/* ===================================================================== */}
      <div
        ref={storyboardSectionRef}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start scroll-mt-6"
      >
        {/* COLUNA ESQUERDA: IMAGEM DO STORYBOARD (1080x1920) + FISCALIZAÇÃO */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                {isTwoScenes
                  ? 'Storyboard da Cena 1 (Grade 2×3 · 6 Quadros · 1080×1920)'
                  : is4Scenes
                  ? 'Storyboard 2×2 (4 Cenas · 1080×1920)'
                  : 'Storyboard 3×3 (9 Cenas · 1080×1920)'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Arquivo:{' '}
                <span className="text-zinc-200 font-mono">
                  {isTwoScenes ? `${safeFileName} - Storyboard - Cena 1.png` : `${safeFileName}.png`}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRegenerateStoryboard(storyboardCorrection.trim() || undefined, 1)}
              disabled={Boolean(result.isRegeneratingStoryboard || isRecreatingFullStoryboard)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Corrigir e gerar novamente a imagem do storyboard"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-sky-400 ${
                  result.isRegeneratingStoryboard || isRecreatingFullStoryboard ? 'animate-spin' : ''
                }`}
              />
              <span>
                {result.isRegeneratingStoryboard || isRecreatingFullStoryboard ? 'Refazendo...' : 'Refazer'}
              </span>
            </button>
          </div>

          <div className="relative aspect-[9/16] w-full max-w-[360px] mx-auto rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-800 shadow-2xl group">
            {result.isRegeneratingStoryboard || isRecreatingFullStoryboard ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3">
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="text-xs font-bold text-zinc-200">
                  {isRecreatingFullStoryboard
                    ? recreateStatusMessage || 'Recriando Storyboard e Prompt do Veo 3 com a nova fala...'
                    : 'Refazendo Storyboard e corrigindo cenas apontadas...'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Preservando logomarca, textos impressos, cores e formato reais do produto
                </p>
              </div>
            ) : result.storyboardImageUrl ? (
              <>
                <img
                  src={result.storyboardImageUrl}
                  alt={`Storyboard - ${result.productName}`}
                  onClick={() =>
                    onOpenPreview(
                      result.storyboardImageUrl!,
                      isTwoScenes
                        ? `Storyboard Cena 1 (6 Quadros) — ${result.productName}`
                        : is4Scenes
                        ? `Storyboard 4 Cenas — ${result.productName}`
                        : `Storyboard 9 Cenas — ${result.productName}`
                    )
                  }
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                />
                {/* Botão Ampliar no canto superior direito */}
                <button
                  type="button"
                  onClick={() =>
                    onOpenPreview(
                      result.storyboardImageUrl!,
                      isTwoScenes
                        ? `Storyboard Cena 1 (6 Quadros) — ${result.productName}`
                        : is4Scenes
                        ? `Storyboard 4 Cenas — ${result.productName}`
                        : `Storyboard 9 Cenas — ${result.productName}`
                    )
                  }
                  className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-black/75 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                  title="Visualizar em tela cheia"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {/* Ícone de download individual no canto inferior direito sobre a própria imagem */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadProdutos2StoryboardImage(
                      result.storyboardImageUrl!,
                      result.productName,
                      isTwoScenes ? 'Storyboard - Cena 1' : undefined
                    );
                  }}
                  className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/80 hover:bg-emerald-600 text-white border border-white/25 shadow-lg transition-all cursor-pointer flex items-center justify-center"
                  title={`Baixar ${isTwoScenes ? `${safeFileName} - Storyboard - Cena 1.png` : `${safeFileName}.png`}`}
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-2">
                <p className="text-xs font-bold text-rose-400">
                  {result.storyboardError || 'Imagem não disponível'}
                </p>
                <button
                  type="button"
                  onClick={() => onRegenerateStoryboard(storyboardCorrection.trim() || undefined, 1)}
                  className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* PAINEL DE FISCALIZAÇÃO DE FIDELIDADE DOS QUADRANTES               */}
          {/* ================================================================= */}
          {audit ? (
            <div className={`p-3.5 rounded-xl border space-y-3 ${auditStyles.box}`}>
              {/* Cabeçalho com Nota Geral e Semáforo de 4 Cores */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {audit.overallStatus === 'green' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : audit.overallStatus === 'yellow' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <AlertCircle
                      className={`w-4 h-4 shrink-0 ${
                        audit.overallStatus === 'orange' ? 'text-orange-400' : 'text-rose-400'
                      }`}
                    />
                  )}
                  <div>
                    <span className="text-xs font-black block leading-tight">
                      {audit.overallLabel}
                    </span>
                    <span className="text-[10px] opacity-80 block">
                      Fiscalização por quadrante (Logo, Texto, Cor, Formato e Botões)
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-black shrink-0 ${auditStyles.badge}`}
                >
                  {audit.overallScore}%
                </span>
              </div>

              {/* Grade dos Quadrantes (4 no modo 4F, 6 no modo Duas Cenas, 9 nos modos de 1 cena) */}
              <div className={`grid ${is4Scenes ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5`}>
                {audit.quadrants.slice(0, quadrantLimit1).map((q) => {
                  const qStyle = getStatusClasses(q.status);
                  return (
                    <div
                      key={q.sceneNumber}
                      title={q.issue}
                      className={`px-2 py-1.5 rounded-lg border text-[10px] flex items-center justify-between gap-1 ${qStyle.cell}`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${qStyle.dot}`} />
                        Cena {q.sceneNumber}
                      </span>
                      <span className="font-mono font-black">
                        {q.productVisible ? `${q.score}%` : 'OK'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Textos explicativos das cenas onde o produto ficou diferente */}
              {problemQuadrants.length > 0 ? (
                <div className="p-2.5 rounded-lg bg-black/35 border border-white/10 space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">
                    Cenas que precisam de correção (meta &ge; 90%):
                  </p>
                  {problemQuadrants.map((q) => (
                    <p key={q.sceneNumber} className="text-[11px] leading-snug font-medium">
                      • {q.issue}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] leading-snug opacity-95 font-medium">
                  ✓ Produto acima de 90% idêntico às fotos de referência em todos os quadrantes onde aparece (logomarca, textos, cores e formato preservados).
                </p>
              )}

              {/* Legenda rápida das faixas de cores */}
              <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-white/10 text-[9px] opacity-80">
                <span className="text-emerald-300 font-bold">● &ge;90% Verde</span>
                <span className="text-amber-300 font-bold">● 71–89% Amarelo</span>
                <span className="text-orange-300 font-bold">● 60–70% Laranja</span>
                <span className="text-rose-300 font-bold">● &lt;60% Vermelho</span>
              </div>

              {/* CAMPO DE ALTERAÇÃO PERSONALIZADA DO STORYBOARD (VOZ OU TEXTO) */}
              <div className="pt-2.5 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deseja mudar alguma imagem do Storyboard? (Voz ou Texto)</span>
                  </label>
                  {storyboardCorrection && (
                    <button
                      type="button"
                      onClick={() => setStoryboardCorrection('')}
                      className="text-[10px] text-zinc-400 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={storyboardCorrection}
                    onChange={(e) => setStoryboardCorrection(e.target.value)}
                    placeholder='Dite ou digite o que mudar (ex: "Refaz a imagem 5 do storyboard e mantém as outras iguais" ou "Na imagem 1 coloque o homem sorrindo com o produto")...'
                    className="w-full p-2.5 pr-11 bg-black/40 border border-white/15 focus:border-amber-400/80 rounded-xl text-xs text-white placeholder-zinc-400/80 focus:outline-none resize-none leading-relaxed transition-all shadow-inner"
                  />

                  <button
                    type="button"
                    onClick={toggleStoryboardVoiceRecording}
                    className={`absolute right-2 top-2.5 p-2 rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center ${
                      isStoryboardVoiceRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10'
                    }`}
                    title={
                      isStoryboardVoiceRecording
                        ? 'Parar gravação de voz'
                        : 'Ditar mudança do storyboard por voz'
                    }
                  >
                    {isStoryboardVoiceRecording ? (
                      <Square className="w-3.5 h-3.5 text-white fill-white" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {isStoryboardVoiceRecording && (
                  <p className="text-[10px] text-rose-300 font-bold animate-pulse flex items-center gap-1.5 pl-0.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-ping" />
                    Gravando voz... Fale a mudança desejada e clique no botão vermelho para parar.
                  </p>
                )}

                <p className="text-[10px] text-zinc-400/90 leading-tight">
                  <span className="text-amber-300 font-bold">Prioridade Máxima:</span> A IA manterá todas as outras imagens rigorosamente iguais e alterará apenas o que você solicitar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRegenerateStoryboard(storyboardCorrection.trim() || undefined, 1)}
                disabled={Boolean(result.isRegeneratingStoryboard)}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                  storyboardCorrection.trim()
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-black'
                    : problemQuadrants.length > 0
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                }`}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${result.isRegeneratingStoryboard ? 'animate-spin' : ''}`}
                />
                <span>
                  {result.isRegeneratingStoryboard
                    ? 'Refazendo Storyboard com sua Alteração...'
                    : storyboardCorrection.trim()
                    ? 'Refazer Storyboard com Minha Alteração'
                    : problemQuadrants.length > 0
                    ? `Refazer Corrigindo Cena${problemQuadrants.length > 1 ? 's' : ''} ${problemQuadrants
                        .map((q) => q.sceneNumber)
                        .join(', ')}`
                    : 'Refazer Imagem do Storyboard'}
                </span>
              </button>
            </div>
          ) : result.storyboardImageUrl ? (
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/90 space-y-3 shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deseja mudar alguma imagem do Storyboard? (Voz ou Texto)</span>
                  </label>
                  {storyboardCorrection && (
                    <button
                      type="button"
                      onClick={() => setStoryboardCorrection('')}
                      className="text-[10px] text-zinc-400 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={storyboardCorrection}
                    onChange={(e) => setStoryboardCorrection(e.target.value)}
                    placeholder='Dite ou digite o que mudar (ex: "Refaz a imagem 5 do storyboard e mantém as outras iguais" ou "Na imagem 1 coloque o homem sorrindo com o produto")...'
                    className="w-full p-2.5 pr-11 bg-black/40 border border-white/15 focus:border-amber-400/80 rounded-xl text-xs text-white placeholder-zinc-400/80 focus:outline-none resize-none leading-relaxed transition-all shadow-inner"
                  />

                  <button
                    type="button"
                    onClick={toggleStoryboardVoiceRecording}
                    className={`absolute right-2 top-2.5 p-2 rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center ${
                      isStoryboardVoiceRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10'
                    }`}
                    title={
                      isStoryboardVoiceRecording
                        ? 'Parar gravação de voz'
                        : 'Ditar mudança do storyboard por voz'
                    }
                  >
                    {isStoryboardVoiceRecording ? (
                      <Square className="w-3.5 h-3.5 text-white fill-white" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {isStoryboardVoiceRecording && (
                  <p className="text-[10px] text-rose-300 font-bold animate-pulse flex items-center gap-1.5 pl-0.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-ping" />
                    Gravando voz... Fale a mudança desejada e clique no botão vermelho para parar.
                  </p>
                )}

                <p className="text-[10px] text-zinc-400/90 leading-tight">
                  <span className="text-amber-300 font-bold">Prioridade Máxima:</span> A IA manterá todas as outras imagens rigorosamente iguais e alterará apenas o que você solicitar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRegenerateStoryboard(storyboardCorrection.trim() || undefined, 1)}
                disabled={Boolean(result.isRegeneratingStoryboard)}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                  storyboardCorrection.trim()
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-black'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                }`}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${result.isRegeneratingStoryboard ? 'animate-spin' : ''}`}
                />
                <span>
                  {result.isRegeneratingStoryboard
                    ? 'Refazendo Storyboard com sua Alteração...'
                    : storyboardCorrection.trim()
                    ? 'Refazer Storyboard com Minha Alteração'
                    : 'Refazer Imagem do Storyboard'}
                </span>
              </button>
            </div>
          ) : null}
        </div>

        {/* COLUNA DIREITA: PROMPT COMPLETO DO VEO 3 (Fica com fundo azul ao copiar!) */}
        <div
          className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl transition-all duration-300 space-y-3 ${
            hasCopiedPromptOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>
                  {isTwoScenes
                    ? 'Prompt do Veo 3 — Cena 1 (10s · 6 Micro-Cenas)'
                    : is4Scenes
                    ? 'Prompt do Veo 3 (10s · 4 Cenas)'
                    : `Prompt do Veo 3 (${result.duration}s · 9 Micro-Cenas)`}
                </span>
                {hasCopiedPromptOnce && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" /> Copiado ✓
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-sky-200/80 mt-0.5">
                Arquivo no pacote:{' '}
                <span className="font-mono text-white">
                  {isTwoScenes ? `${safeFileName} - Prompt - Cena 1.txt` : `${safeFileName}.txt`}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyVeoPrompt}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                promptCopied
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                  : hasCopiedPromptOnce
                  ? 'bg-sky-500 hover:bg-sky-400 text-white'
                  : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white'
              }`}
            >
              {promptCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Prompt Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Prompt</span>
                </>
              )}
            </button>
          </div>

          <textarea
            rows={22}
            value={result.veoPrompt}
            onChange={(e) => {
              const val = e.target.value;
              setHasCopiedPromptOnce(false);
              setPromptCopied(false);
              onUpdateResult((prev) => (prev ? { ...prev, veoPrompt: val } : null));
            }}
            className={`w-full p-3.5 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-400 resize-y ${
              hasCopiedPromptOnce
                ? 'bg-slate-950/90 border border-sky-400/60 text-sky-50'
                : 'bg-zinc-950 border border-zinc-800 text-zinc-200'
            }`}
          />

          {/* Ajustar ou Corrigir esse Prompt com IA */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl space-y-2.5 transition-all ${
              hasCopiedPromptOnce
                ? 'bg-slate-900/90 border border-sky-400/50'
                : 'bg-zinc-900/95 border border-zinc-700/80 shadow-inner'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Ajustar ou Corrigir este Prompt com IA:</span>
              </label>
              {isPromptVoiceRecording && (
                <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Ouvindo sua correção...
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promptCorrection}
                  onChange={(e) => setPromptCorrection(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRefinePrompt(1);
                    }
                  }}
                  placeholder='Ex: "Remova termos sensíveis", "Mude o ângulo da câmera", "Troque o vocabulário"...'
                  className="w-full pl-3 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 transition-colors shadow-inner font-sans"
                />

                {/* Botão Microfone embutido */}
                <button
                  type="button"
                  onClick={togglePromptVoiceRecording}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
                    isPromptVoiceRecording
                      ? 'bg-rose-500/20 text-rose-400 animate-pulse ring-2 ring-rose-400'
                      : 'text-zinc-400 hover:text-purple-300 hover:bg-zinc-800'
                  }`}
                  title={
                    isPromptVoiceRecording
                      ? 'Parar gravação'
                      : 'Ditar correção do prompt por voz'
                  }
                >
                  {isPromptVoiceRecording ? (
                    <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleRefinePrompt(1)}
                disabled={isRefiningPrompt || !(promptCorrection.trim() || interimPromptCorrection.trim())}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
              >
                {isRefiningPrompt ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Refazendo...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Refazer Prompt</span>
                  </>
                )}
              </button>
            </div>

            {isPromptVoiceRecording && interimPromptCorrection && (
              <p className="text-[11px] text-purple-300 italic opacity-80 pl-1">
                "{interimPromptCorrection}"
              </p>
            )}
          </div>

          {/* BOTÃO BAIXAR TUDO (.ZIP COM NOME DO PRODUTO) — Exibido aqui nos modos de 1 cena; no modo 2 cenas fica ao final das duas seções */}
          {!isTwoScenes && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isExportingZip}
                className="w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingZip ? 'Gerando .ZIP...' : `Baixar Tudo (${safeFileName}.zip)`}</span>
              </button>
            </div>
          )}

          {/* VERIFICAÇÃO DE FIDELIDADE DO VÍDEO DO VEO (1 CAPTURA A CADA 2S) */}
          <VideoFidelityAuditor
            productName={isTwoScenes ? `${result.productName} (Cena 1)` : result.productName}
            productLock={result.productLock}
            referencePhotos={allReferencePhotos}
            initialAudit={result.videoAudit}
            onAuditChange={(vAudit) => {
              onUpdateResult((prev) => (prev ? { ...prev, videoAudit: vAudit } : null));
            }}
            onAuditComplete={(vAudit, usage) => handleVideoAuditComplete(vAudit, usage, 1)}
            onOpenPreview={onOpenPreview}
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SEGUNDA SEÇÃO — CENA 2 (APENAS NO MODO "DUAS CENAS — 10 SEGUNDOS CADA") */}
      {/* ===================================================================== */}
      {isTwoScenes && scene2 && (
        <div className="space-y-6 pt-6 border-t-2 border-teal-500/30">
          {/* Cabeçalho de identificação da Cena 2 */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/80 via-cyan-950/60 to-zinc-900 border border-teal-500/40 shadow-lg flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider">
                Segunda Seção — Cena 2
              </span>
              <span className="text-xs sm:text-sm font-black text-white">
                Cena 2 (10 segundos · Grade 2×3 com 6 Quadros — Continuação, Benefícios e Fechamento)
              </span>
            </div>
            <span className="text-[11px] text-teal-300 font-semibold">
              Parte 2 de 2 da narrativa contínua
            </span>
          </div>

          {/* Copy Final Usada no Criativo — Cena 2 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/95 border border-teal-500/40 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                  Copy Final Usada no Criativo — Cena 2
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/50 text-[11px] font-bold text-teal-200">
                  {scene2.copySourceLabel}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    scene2.finalCopy.length > 225
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {scene2.finalCopy.length} / 225 caracteres (máx. 225)
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyFinalSpeech2}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copy2Copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copy Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copiar Só a Fala</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-xs sm:text-sm text-teal-100 font-medium leading-relaxed select-text">
              {scene2.finalCopy}
            </div>
          </div>

          {/* Campo "Trocar fala" — Cena 2 (100% independente da Cena 1) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/95 border border-purple-500/40 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs sm:text-sm font-black text-white">
                  Trocar fala — Cena 2
                </h3>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {speech2AppliedSuccess && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-xs font-bold text-emerald-300 flex items-center gap-1.5 animate-fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Prompt da Cena 2 e fala atualizados com sucesso!
                  </span>
                )}

                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    speechInput2.length > 225
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-zinc-800/90 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {speechInput2.length}/225 caracteres
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <textarea
                  rows={3}
                  value={speechInput2}
                  onChange={(e) => {
                    setSpeechInput2(e.target.value);
                    setGeneratedCopySourceLabel2('Personalizada / Editada');
                  }}
                  placeholder="Digite aqui a nova fala da Cena 2..."
                  className={`w-full p-3.5 rounded-xl bg-zinc-950 border text-xs sm:text-sm placeholder-zinc-500 focus:outline-none leading-relaxed font-sans shadow-inner resize-y transition-colors ${
                    speechInput2.length > 225
                      ? 'text-rose-400 border-rose-500 focus:border-rose-400 font-semibold'
                      : 'text-zinc-100 border-zinc-700 focus:border-purple-400'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between px-1">
                <span
                  className={`text-[11px] font-mono ${
                    speechInput2.length > 225 ? 'text-rose-400 font-bold' : 'text-zinc-400'
                  }`}
                >
                  {speechInput2.length}/225 caracteres
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleReviewSpeech(2)}
                disabled={isReviewingSpeech2 || !speechInput2.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-950/20"
              >
                {isReviewingSpeech2 ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Revisando texto...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                    <span>Revisar texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  applyNewSpeechScene2(
                    speechInput2,
                    generatedCopySourceLabel2 === 'Criada por IA (Aurora Copy)'
                  )
                }
                disabled={!speechInput2.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Refazer Prompt</span>
              </button>
            </div>

            <div className="pt-2.5 border-t border-zinc-800/90 space-y-2">
              <span className="text-xs font-bold text-zinc-200 block">
                Escolha seu gerador de copy (Cena 2)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleGenerateWithAuroraCopy(2)}
                  disabled={
                    isGeneratingAuroraCopy2 ||
                    isGeneratingBankCopy2 ||
                    Boolean(isRecreatingFullStoryboard)
                  }
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 border border-purple-400/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-950/40"
                >
                  {isGeneratingAuroraCopy2 ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando com Aurora Copy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gerar com Aurora Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateWithBankCopy(2)}
                  disabled={
                    isGeneratingBankCopy2 ||
                    isGeneratingAuroraCopy2 ||
                    Boolean(isRecreatingFullStoryboard)
                  }
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 border border-teal-400/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-950/40"
                >
                  {isGeneratingBankCopy2 ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando com Banco de Copies...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Gerar com Banco de Copies</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!speechInput2.trim() || isRecreatingFullStoryboard) return;
                    setHasCopiedPrompt2Once(false);
                    setPrompt2Copied(false);
                    onRecreateStoryboardWithCopy?.(speechInput2.trim(), generatedCopySourceLabel2, 2);
                  }}
                  disabled={
                    !speechInput2.trim() ||
                    Boolean(isRecreatingFullStoryboard) ||
                    Boolean(scene2.isRegeneratingStoryboard)
                  }
                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 border border-orange-400/50 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-orange-950/40"
                >
                  {isRecreatingFullStoryboard ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recriando Storyboard ({recreateProgressPercent}%)...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Recriar Storyboard (Cena 2)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Lado a Lado da Cena 2: Storyboard Cena 2 (6 Quadros) + Prompt Veo 3 Cena 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUNA ESQUERDA: STORYBOARD DA CENA 2 */}
            <div className="lg:col-span-5 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                    Storyboard da Cena 2 (Grade 2×3 · 6 Quadros · 1080×1920)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Arquivo:{' '}
                    <span className="text-zinc-200 font-mono">
                      {safeFileName} - Storyboard - Cena 2.png
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRegenerateStoryboard(storyboardCorrection2.trim() || undefined, 2)}
                  disabled={Boolean(scene2.isRegeneratingStoryboard || isRecreatingFullStoryboard)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Corrigir e gerar novamente a imagem do storyboard da Cena 2"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-sky-400 ${
                      scene2.isRegeneratingStoryboard || isRecreatingFullStoryboard
                        ? 'animate-spin'
                        : ''
                    }`}
                  />
                  <span>
                    {scene2.isRegeneratingStoryboard || isRecreatingFullStoryboard
                      ? 'Refazendo...'
                      : 'Refazer'}
                  </span>
                </button>
              </div>

              <div className="relative aspect-[9/16] w-full max-w-[360px] mx-auto rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-800 shadow-2xl group">
                {scene2.isRegeneratingStoryboard || isRecreatingFullStoryboard ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3">
                    <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="text-xs font-bold text-zinc-200">
                      Refazendo Storyboard da Cena 2 (6 quadros)...
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Preservando logomarca, textos impressos, cores e formato reais do produto
                    </p>
                  </div>
                ) : scene2.storyboardImageUrl ? (
                  <>
                    <img
                      src={scene2.storyboardImageUrl}
                      alt={`Storyboard Cena 2 - ${result.productName}`}
                      onClick={() =>
                        onOpenPreview(
                          scene2.storyboardImageUrl!,
                          `Storyboard Cena 2 (6 Quadros) — ${result.productName}`
                        )
                      }
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPreview(
                          scene2.storyboardImageUrl!,
                          `Storyboard Cena 2 (6 Quadros) — ${result.productName}`
                        )
                      }
                      className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-black/75 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                      title="Visualizar em tela cheia"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadProdutos2StoryboardImage(
                          scene2.storyboardImageUrl!,
                          result.productName,
                          'Storyboard - Cena 2'
                        );
                      }}
                      className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/80 hover:bg-emerald-600 text-white border border-white/25 shadow-lg transition-all cursor-pointer flex items-center justify-center"
                      title={`Baixar ${safeFileName} - Storyboard - Cena 2.png`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-2">
                    <p className="text-xs font-bold text-rose-400">
                      {scene2.storyboardError || 'Imagem da Cena 2 não disponível'}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onRegenerateStoryboard(storyboardCorrection2.trim() || undefined, 2)
                      }
                      className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </div>

              {/* Painel de Fiscalização de Fidelidade dos 6 Quadrantes da Cena 2 */}
              {audit2 ? (
                <div className={`p-3.5 rounded-xl border space-y-3 ${auditStyles2.box}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {audit2.overallStatus === 'green' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : audit2.overallStatus === 'yellow' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <AlertCircle
                          className={`w-4 h-4 shrink-0 ${
                            audit2.overallStatus === 'orange' ? 'text-orange-400' : 'text-rose-400'
                          }`}
                        />
                      )}
                      <div>
                        <span className="text-xs font-black block leading-tight">
                          {audit2.overallLabel}
                        </span>
                        <span className="text-[10px] opacity-80 block">
                          Fiscalização dos 6 quadrantes da Cena 2
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-black shrink-0 ${auditStyles2.badge}`}
                    >
                      {audit2.overallScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {audit2.quadrants.slice(0, 6).map((q) => {
                      const qStyle = getStatusClasses(q.status);
                      return (
                        <div
                          key={q.sceneNumber}
                          title={q.issue}
                          className={`px-2 py-1.5 rounded-lg border text-[10px] flex items-center justify-between gap-1 ${qStyle.cell}`}
                        >
                          <span className="font-bold flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${qStyle.dot}`} />
                            Cena {q.sceneNumber}
                          </span>
                          <span className="font-mono font-black">
                            {q.productVisible ? `${q.score}%` : 'OK'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {problemQuadrants2.length > 0 ? (
                    <div className="p-2.5 rounded-lg bg-black/35 border border-white/10 space-y-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">
                        Quadros da Cena 2 que precisam de correção (meta &ge; 90%):
                      </p>
                      {problemQuadrants2.map((q) => (
                        <p key={q.sceneNumber} className="text-[11px] leading-snug font-medium">
                          • {q.issue}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] leading-snug opacity-95 font-medium">
                      ✓ Produto acima de 90% idêntico às fotos de referência nos 6 quadrantes da Cena 2.
                    </p>
                  )}

                  <div className="pt-2.5 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Deseja mudar alguma imagem da Cena 2?</span>
                      </label>
                      {storyboardCorrection2 && (
                        <button
                          type="button"
                          onClick={() => setStoryboardCorrection2('')}
                          className="text-[10px] text-zinc-400 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      value={storyboardCorrection2}
                      onChange={(e) => setStoryboardCorrection2(e.target.value)}
                      placeholder='Ex: "Refaz o quadro 4 da Cena 2 e mantém os outros iguais"...'
                      className="w-full p-2.5 bg-black/40 border border-white/15 focus:border-amber-400/80 rounded-xl text-xs text-white placeholder-zinc-400/80 focus:outline-none resize-none leading-relaxed transition-all shadow-inner"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onRegenerateStoryboard(storyboardCorrection2.trim() || undefined, 2)
                    }
                    disabled={Boolean(scene2.isRegeneratingStoryboard)}
                    className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                      storyboardCorrection2.trim()
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-black'
                        : problemQuadrants2.length > 0
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                    }`}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        scene2.isRegeneratingStoryboard ? 'animate-spin' : ''
                      }`}
                    />
                    <span>
                      {scene2.isRegeneratingStoryboard
                        ? 'Refazendo Storyboard da Cena 2...'
                        : storyboardCorrection2.trim()
                        ? 'Refazer Storyboard da Cena 2 com Minha Alteração'
                        : 'Refazer Imagem do Storyboard (Cena 2)'}
                    </span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* COLUNA DIREITA: PROMPT DO VEO 3 DA CENA 2 */}
            <div
              className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl transition-all duration-300 space-y-3 ${
                hasCopiedPrompt2Once ? copiedBlueSectionClass : defaultSectionClass
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>Prompt do Veo 3 — Cena 2 (10s · 6 Micro-Cenas)</span>
                    {hasCopiedPrompt2Once && (
                      <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-sky-300" /> Copiado ✓
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-sky-200/80 mt-0.5">
                    Arquivo no pacote:{' '}
                    <span className="font-mono text-white">
                      {safeFileName} - Prompt - Cena 2.txt
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyVeoPrompt2}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    prompt2Copied
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                      : hasCopiedPrompt2Once
                      ? 'bg-sky-500 hover:bg-sky-400 text-white'
                      : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white'
                  }`}
                >
                  {prompt2Copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Prompt Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Prompt (Cena 2)</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={22}
                value={scene2.veoPrompt}
                onChange={(e) => {
                  const val = e.target.value;
                  setHasCopiedPrompt2Once(false);
                  setPrompt2Copied(false);
                  onUpdateResult((prev) =>
                    prev && prev.scene2
                      ? { ...prev, scene2: { ...prev.scene2, veoPrompt: val } }
                      : prev
                  );
                }}
                className={`w-full p-3.5 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-400 resize-y ${
                  hasCopiedPrompt2Once
                    ? 'bg-slate-950/90 border border-sky-400/60 text-sky-50'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200'
                }`}
              />

              {/* Ajustar ou Corrigir este Prompt com IA — Cena 2 */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl space-y-2.5 transition-all ${
                  hasCopiedPrompt2Once
                    ? 'bg-slate-900/90 border border-sky-400/50'
                    : 'bg-zinc-900/95 border border-zinc-700/80 shadow-inner'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ajustar ou Corrigir este Prompt da Cena 2 com IA:</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promptCorrection2}
                      onChange={(e) => setPromptCorrection2(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRefinePrompt(2);
                        }
                      }}
                      placeholder='Ex: "Mude o ângulo da câmera", "Destaque mais o fechamento"...'
                      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 transition-colors shadow-inner font-sans"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRefinePrompt(2)}
                    disabled={isRefiningPrompt2 || !promptCorrection2.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
                  >
                    {isRefiningPrompt2 ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Refazendo...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Refazer Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Verificação de Fidelidade do Vídeo da Cena 2 (1 captura a cada 2s) */}
              <VideoFidelityAuditor
                productName={`${result.productName} (Cena 2)`}
                productLock={result.productLock}
                referencePhotos={allReferencePhotos}
                initialAudit={scene2.videoAudit}
                onAuditChange={(vAudit) => {
                  onUpdateResult((prev) =>
                    prev && prev.scene2
                      ? { ...prev, scene2: { ...prev.scene2, videoAudit: vAudit } }
                      : prev
                  );
                }}
                onAuditComplete={(vAudit, usage) => handleVideoAuditComplete(vAudit, usage, 2)}
                onOpenPreview={onOpenPreview}
              />
            </div>
          </div>

          {/* BOTÃO ÚNICO "BAIXAR TUDO (.ZIP)" POSICIONADO AO FINAL DA PÁGINA APÓS AS DUAS SEÇÕES (CENA 1 E CENA 2) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>
                {isExportingZip
                  ? 'Gerando pacote completo (.ZIP)...'
                  : `Baixar tudo (${safeFileName}.zip — Storyboards e Prompts das Cenas 1 e 2)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DESCRIÇÃO DO POST + HASHTAGS (Fica com o mesmo destaque ao copiar!)   */}
      {/* ===================================================================== */}
      {result.description && (
        <div
          className={`p-5 sm:p-6 rounded-2xl transition-all duration-300 space-y-3 ${
            hasCopiedDescriptionOnce ? copiedBlueSectionClass : defaultSectionClass
          }`}
        >
          <div
            className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${
              hasCopiedDescriptionOnce ? 'border-sky-400/40' : 'border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Descrição do Post + Hashtags (TikTok & Reels)</span>
                {hasCopiedDescriptionOnce && (
                  <span className="text-[10px] text-sky-100 font-extrabold bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-300" /> Copiado ✓
                  </span>
                )}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopyDescription}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                descriptionCopied
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                  : hasCopiedDescriptionOnce
                  ? 'bg-sky-500 hover:bg-sky-400 text-white'
                  : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white'
              }`}
            >
              {descriptionCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Descrição Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Descrição</span>
                </>
              )}
            </button>
          </div>

          <div
            className={`p-3.5 rounded-xl text-xs sm:text-sm font-sans leading-relaxed select-all transition-colors ${
              hasCopiedDescriptionOnce
                ? 'bg-slate-950/90 border border-sky-400/60 text-sky-50'
                : 'bg-zinc-950 border border-zinc-800/80 text-zinc-200'
            }`}
          >
            {result.description}
          </div>
        </div>
      )}

      {/* Módulo Independente de Microedição de Imagem */}
      <MicroImageEditor aiProfile={aiProfile} onOpenPreview={onOpenPreview} />
    </div>
  );
};

