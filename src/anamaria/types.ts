import { TokenUsageStats } from '../types';

export type AnaMariaInfluencer = 'Mulher' | 'Homem';
export type AnaMariaBodyType = 'normal' | 'plus_size';
export type AnaMariaImageModel = 'seedream_5_0_pro' | 'kling_3_0' | 'openai';
export type AnaMariaVideoPromptLimit = 'unlimited' | '5000' | '2500';
export type AnaMariaShoeCategory = 'A_CHINELO' | 'B_TENIS' | 'C_OUTRO';
export type AnaMariaPresentationMode = 'mirror_selfie' | 'pov' | 'com_rosto';
export type AnaMariaTheme = 'fogo' | 'ametista';
export type AnaMariaMasterId =
  | 'mestra_ana_maria'
  | 'mestra_iara'
  | 'mestra_duda'
  | 'mestra_nay'
  | 'mestra_catza'
  | 'pov_cinta_85k'
  | 'pov_blusinhas_13k';

export type AnaMariaAuditColorStatus = 'green' | 'yellow' | 'orange' | 'red';

export interface AnaMariaAuditCriterion {
  name: string;
  score: number;
  status: AnaMariaAuditColorStatus;
  issue?: string;
}

export interface AnaMariaAudit {
  score: number;
  status: AnaMariaAuditColorStatus;
  label: string;
  issues: string[];
  criteria?: AnaMariaAuditCriterion[];
  correctionPrompt?: string;
}

export interface AnaMariaFormState {
  productName: string;
  referencePhotos: string[]; // até 10 fotos do mesmo produto
  influencer: AnaMariaInfluencer; // Padrão: 'Mulher'
  bodyType: AnaMariaBodyType; // Padrão: 'normal'
  additionalInstructions: string; // Prioridade máxima
  imageModel: AnaMariaImageModel; // Padrão: 'seedream_5_0_pro'
  videoPromptLimit: AnaMariaVideoPromptLimit; // Padrão: 'unlimited'
  presentationMode?: AnaMariaPresentationMode; // Padrão: 'mirror_selfie'
  selectedMasterId?: AnaMariaMasterId; // Padrão: 'mestra_ana_maria'
  selectedScenarioId?: string; // ID do cenário escolhido da vitrine (ex.: 'cenario_0')
  selectedScenarioNumber?: number; // Número do cenário escolhido (1 a 24)
  selectedScenarioUrl?: string; // URL da imagem cheia
  selectedScenarioBase64?: string; // Base64 da imagem cheia para inpainting
}

export interface AnaMariaResultState {
  id: string;
  timestamp: number;
  imageUrl: string;
  productName: string;
  referencePhotos: string[];
  influencer: AnaMariaInfluencer;
  bodyType: AnaMariaBodyType;
  additionalInstructions: string;
  imageModel: AnaMariaImageModel;
  videoPromptLimit: AnaMariaVideoPromptLimit;
  presentationMode?: AnaMariaPresentationMode;
  selectedMasterId?: AnaMariaMasterId;
  selectedScenarioId?: string;
  selectedScenarioNumber?: number;
  imagePrompt: string;
  videoPrompt: string;
  headline: string;
  hashtags: string;
  shoeCategory: AnaMariaShoeCategory;
  shoeDescription: string;
  audit?: AnaMariaAudit;
  tokenUsage?: TokenUsageStats;
}
