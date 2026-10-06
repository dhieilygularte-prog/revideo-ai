export interface ProductVariation {
  id: string;
  name: string; // Ex: "Variação 1", "Variação 2", "Variação 3"
  photos: string[]; // Base64 data URLs
}

// Backwards compatibility alias
export type ProductColor = ProductVariation;

export interface ExtractedFrame {
  time: number; // e.g. 0.2, 1.0, 2.0
  dataUrl: string;
  isCutTransition?: boolean;
}

export interface ReferenceVideoData {
  file: File | null;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  duration: number; // seconds
  extractedFrames: ExtractedFrame[];
  audioBase64?: string; // Mono WAV base64 if audio detected
}

export interface OnScreenTextItem {
  text: string;
  fontStyle: string; // Ex: "Serifada itálica fina", "Sans-serif bold caixa alta"
  color: string; // Ex: "Branco com sombra suave", "Preto fosco"
  position: string; // Ex: "Centro superior", "Canto inferior direito"
  timestamp: string; // Ex: "00:01 - 00:03"
}

export interface FidelityAuditResult {
  score: number; // 0 to 100
  status: 'green' | 'yellow' | 'red';
  label: string; // Ex: "Verde Fidedigno (98%)"
  issues: string[]; // Lista de inconsistências encontradas
  correctionPrompt?: string; // Diretriz de correção em inglês
  auditedAngle?: string;
  autoHealed?: boolean;
}

export type VeoModelMode = 'veo3_basic_8s' | 'veo3_omniflash_10s';

export interface SceneImage {
  id: string;
  role: string; // Ex: "Imagem 1: Vista Frontal e Entrada", "Imagem 2: Vista Traseira / Costas"
  frameNumber: number; // 1, 2, 3...
  variationName: string; // "Variação 1", "Variação 2", etc.
  colorName?: string; // For backward compatibility
  targetAngle?: 'front' | 'side' | 'rear' | 'detail' | 'front_side' | 'front_detail' | string;
  location?: string; // Cenário/local específico extraído do frame do vídeo de referência
  actionDescription?: string; // Ação específica do modelo com o produto neste momento
  imageUrl: string;
  promptUsed: string;
  fidelityScore?: 'perfect' | 'warning';
  fidelityNotes?: string;
  fidelityAudit?: FidelityAuditResult;
  isRegenerating?: boolean;
  customCorrection?: string;
}


export interface SceneDetail {
  sceneNumber: number;
  startTime: number;
  endTime: number;
  timeRangeText: string; // Ex: "00:00 - 00:08"
  actionSummary: string;
  eightSecondTimeline: string;
  mappedVariations: string[];
  mappedColors?: string[]; // Backwards compatibility
  environmentDescription: string;
  productType: string; // e.g. "salgadinho/snack", "tênis", "vestido", "bolsa", "calça"
  veoPrompt: string; // English single-paragraph Veo 3.1 prompt
  veoInstruction: string; // Ex: "Anexe no Veo as imagens de referência geradas para esta cena"
  images: SceneImage[];
  sceneSpeech?: string; // Fala/locução correspondente especificamente a este trecho temporal da cena
}

export interface SpeechData {
  hasSpeech: boolean;
  originalTranscript: string;
  adaptedScript: string;
  voiceTone?: string;
}

export interface TokenUsageStats {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  estimatedCostBRL: number;
  totalCostUSD?: number;
  totalCalls?: number;
  modelsUsed?: string[];
  provider?: 'openai' | 'gemini';
  detailedSteps?: Array<{
    id?: string;
    step: string;
    model: string;
    costUSD: number;
    costBRL: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    timestamp: string;
    details?: string;
  }>;
  breakdown: {
    videoAnalysisTokens: number;
    videoAnalysisCostBRL: number;
    speechTokens: number;
    speechCostBRL: number;
    imagesCount: number;
    imagesCostBRL: number;
    promptsTokens: number;
    promptsCostBRL: number;
  };
}

export interface VideoAnalysisResult {
  productType: string; // Identified automatically from user photos + video
  formatAndOrientation: string;
  cameraType: string;
  cameraStability: string;
  lightingStyle: string;
  environmentDescription: string; // Piso, mesa, fundo, paredes, etc.
  interactionDetails: string; // Como o produto é segurado, vestido ou apoiado
  secondBySecondTimeline: string;
  detectedVariationsCount: number;
  detectedVariationSequence: string[];
  onScreenTexts: OnScreenTextItem[];
  speechData: SpeechData;
  scenes: SceneDetail[];
  modelFraming?: 'neck_down' | 'show_face' | 'product_only';
  tokenUsage?: TokenUsageStats;
  costReport?: any;
}

export type ProcessingStep =
  | 'idle'
  | 'extracting_frames'
  | 'analyzing_video'
  | 'splitting_scenes'
  | 'generating_images'
  | 'checking_fidelity'
  | 'writing_prompts'
  | 'completed'
  | 'error';
