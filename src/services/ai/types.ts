import { VideoAnalysisResult, FidelityAuditResult } from '../../types';

export type AIProviderType = 'gemini' | 'openai';

export interface FrameInput {
  time: number;
  dataUrl: string;
  isCutTransition?: boolean;
}

export interface VariationInput {
  id: string;
  name: string;
  photos: string[];
}

export interface AnalyzeVideoParams {
  durationSeconds: number;
  frames: FrameInput[];
  variations: VariationInput[];
  audioBase64?: string;
  additionalInstructions?: string;
  productInfo?: string;
  modelPhotoUrl?: string;
  veoModelMode?: 'veo3_basic_8s' | 'veo3_omniflash_10s';
}

export interface GenerateSceneImageParams {
  prompt: string;
  productPhotoBase64?: string;
  productPhotosBase64?: string[];
  modelReferenceBase64?: string;
  referenceFrameBase64?: string;
  variationName?: string;
  productType?: string;
  targetAngle?: string;
  location?: string;
  actionDescription?: string;
  correctionPrompt?: string;
  additionalInstructions?: string;
  hasUserProvidedModel?: boolean;
}

export interface GenerateSceneImageResult {
  success: boolean;
  imageUrl?: string;
  costBRL?: number;
  error?: string;
  errorType?: string;
  fallbackRequired?: boolean;
}

export interface AuditFidelityParams {
  generatedImageBase64: string;
  referencePhotos: string[];
  variationName?: string;
  role?: string;
}

export interface AuditFidelityResultResponse {
  success: boolean;
  audit: FidelityAuditResult;
}

export interface IAIProvider {
  readonly name: AIProviderType;
  isConfigured(): boolean;
  analyzeVideo(params: AnalyzeVideoParams): Promise<VideoAnalysisResult>;
  generateSceneImage(params: GenerateSceneImageParams): Promise<GenerateSceneImageResult>;
  auditImageFidelity(params: AuditFidelityParams): Promise<AuditFidelityResultResponse>;
  transcribeAudio?(buffer: Buffer, mimeType?: string): Promise<string>;
}

