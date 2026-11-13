import { TokenUsageStats } from '../types';

export type AnaMariaInfluencer = 'Mulher' | 'Homem';
export type AnaMariaBodyType = 'normal' | 'plus_size';
export type AnaMariaImageModel =
  | 'seedream_5_0_pro'
  | 'seedream_4_5'
  | 'kling_3_0'
  | 'kling_o3_fal'
  | 'flux_2_pro_edit'
  | 'openai';
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
  imageModel: AnaMariaImageModel; // Padrão: 'openai'
  videoPromptLimit: AnaMariaVideoPromptLimit; // Padrão: 'unlimited'
  presentationMode?: AnaMariaPresentationMode; // Padrão: 'mirror_selfie'
  selectedMasterId?: AnaMariaMasterId; // Padrão: 'mestra_ana_maria'
  isManualMasterSelection?: boolean; // true se usuário clicou manualmente na galeria de prompts
  selectedScenarioId?: string; // ID do cenário escolhido da vitrine (ex.: 'cenario_0')
  selectedScenarioNumber?: number; // Número do cenário escolhido (1 a 24)
  selectedScenarioUrl?: string; // URL da imagem cheia
  selectedScenarioBase64?: string; // Base64 da imagem cheia para inpainting
  selectedModelGalleryId?: string; // ID da modelo escolhida no Item 10 (ex.: 'modelo_1_ana_maria')
  selectedModelGalleryNumber?: number; // Número da modelo (1 a 25)
  selectedModelGalleryUrl?: string; // URL da imagem da modelo
  selectedModelGalleryBase64?: string; // Base64 da imagem da modelo
  modelScenarioSource?: 'model' | 'gallery'; // Padrão: 'model' (cenário da própria modelo), 'gallery' (cenário da galeria de cenários)
  generateModelViaPrompt?: boolean; // Se verdadeiro, gera a modelo puramente via prompt (sem foto de referência da modelo)
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
  selectedModelGalleryId?: string;
  selectedModelGalleryNumber?: number;
  selectedModelGalleryUrl?: string;
  modelScenarioSource?: 'model' | 'gallery';
  generateModelViaPrompt?: boolean;
  imagePrompt: string;
  videoPrompt: string;
  conciseVideoPrompt?: string;
  headline: string;
  hashtags: string;
  shoeCategory: AnaMariaShoeCategory;
  shoeDescription: string;
  audit?: AnaMariaAudit;
  tokenUsage?: TokenUsageStats;
}
