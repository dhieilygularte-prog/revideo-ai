import { TokenUsageStats } from '../types';

export type AnaMariaInfluencer = 'Mulher' | 'Homem';
export type AnaMariaBodyType = 'normal' | 'plus_size';
export type AnaMariaImageModel = 'seedream_5_0_pro' | 'kling_3_0' | 'openai';
export type AnaMariaVideoPromptLimit = 'unlimited' | '5000' | '2500';
export type AnaMariaShoeCategory = 'A_CHINELO' | 'B_TENIS' | 'C_OUTRO';

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
  imagePrompt: string;
  videoPrompt: string;
  headline: string;
  hashtags: string;
  shoeCategory: AnaMariaShoeCategory;
  shoeDescription: string;
  audit?: AnaMariaAudit;
  tokenUsage?: TokenUsageStats;
}
