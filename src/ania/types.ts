import { VeoModelMode, TokenUsageStats } from '../types';

export type AniaCategory =
  | 'SHORT_SAIA'
  | 'BERMUDA_SHORT'
  | 'CALCA'
  | 'SAIA'
  | 'VESTIDO'
  | 'PIJAMA_CAMISOLA'
  | 'CONJUNTO'
  | 'BLUSA'
  | 'MACACAO'
  | 'CALCADO'
  | 'AUTO';

export type AniaCalcaSubtype = 'PERNA_LARGA' | 'SOCIAL' | 'AJUSTADA' | 'NORMAL';

export type AniaGender = 'Mulher' | 'Homem';

export type AniaBody = 'Plus size' | 'Normal' | 'Magro';

export type ProductMode = 'apparel' | 'footwear';

export type AgeMode = 'adult' | 'child' | 'senior';

export type ScenarioMode = 'home_default' | 'native';

export type ScenarioKey =
  | 'home'
  | 'gym'
  | 'park'
  | 'beach'
  | 'workshop'
  | 'skate'
  | 'casual_outdoor'
  | 'social_simple'
  | 'other';

export type PocketState = 'functional' | 'fake' | 'none' | 'unknown';

export type ValueSource = 'manual' | 'product_info' | 'local_detect' | 'ai' | 'unknown';

export interface AniaColorItem {
  id: string;
  name: string;
  photoBase64?: string;
  fileName?: string;
}

export interface AniaFormState {
  productName: string;
  category: AniaCategory;
  productMode: ProductMode;
  ageMode: AgeMode;
  gender: AniaGender;
  body: AniaBody;
  colors: AniaColorItem[];
  stretch: boolean | null; // null = unselected/auto, true = Sim, false = Não
  stretchSource?: ValueSource;
  fabric: string;
  fabricSource?: ValueSource;
  naturalEnvironment: boolean; // false = home_default, true = native
  productInfo: string;
  additionalInstructions: string;
  customSpeech: string;
  veoModelMode: VeoModelMode;
}

export interface AniaPlanningResult {
  categoria: AniaCategory;
  peca: string;
  productMode: ProductMode;
  ageMode: AgeMode;
  scenarioKey: ScenarioKey;
  tecido: string;
  estica: boolean;
  detalhes_trava: string[];
  bolso_funcional: boolean;
  bolso_estado?: PocketState;
  fala_id: string;
  fala: string;
  movimentos: string[];
  titulo: string;
}

export interface AniaFidelityAudit {
  score: number;
  status: 'green' | 'yellow' | 'red';
  label: string;
  issues: string[];
  correctionPrompt?: string;
  autoHealed?: boolean;
}

export interface AniaGeneratedImage {
  id: string;
  colorName: string;
  imageUrl: string;
  promptUsed: string;
  fidelityAudit?: AniaFidelityAudit;
  isRegenerating?: boolean;
  isCopiedFrom?: string;
  error?: string;
  hasError?: boolean;
}

export interface AniaGeneratedVideoPrompt {
  id: string;
  label: string; // e.g. "com fala – parte 1", "com fala – parte 2", "só movimento"
  prompt: string;
  colorName: string;
  speechPart?: string;
  durationSec: number;
}

export interface AniaResultState {
  planning: AniaPlanningResult;
  images: AniaGeneratedImage[];
  videoPrompts: AniaGeneratedVideoPrompt[];
  completeSpeech: string;
  speechSourceId: string;
  description: string;
  hashtags: string[];
  tokenUsage?: TokenUsageStats;
}
