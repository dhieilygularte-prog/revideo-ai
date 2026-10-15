export type Produtos2SubMode = 'produtos_geral' | 'vestuario_masculino';
export type Produtos2MaleSubOption = 'calcados' | 'roupas';
export type Produtos2Duration = 8 | 10;
export type Produtos2Influencer = 'Homem' | 'Mulher' | null;
export type Produtos2ClientGender = 'Masculino' | 'Feminino' | 'Unissex';
export type Produtos2SpeechMode = 'com_fala' | 'sem_fala';
export type Produtos2Framing = 'com_rosto' | 'sem_rosto' | 'pov';
export type Produtos2Scenario = 'padrao_uso' | 'em_casa';
export type Produtos2MaleClothStyle = 'storyboard' | 'pov' | 'espelho';
export type Produtos2CopyEngine = 'banco' | 'aurora_copy';

export type CopyArchetype =
  | 'Achado/Demonstração'
  | 'Dor→Solução'
  | 'Choque de preço/Urgência'
  | 'Especificação'
  | 'Emoção/Presente'
  | 'Kit/Valor'
  | 'Unboxing/Chegou'
  | 'Provocação/Comparação';

export interface CopyBankEntry {
  id: string;
  bank: 'geral' | 'calcados_masculinos' | 'roupas_masculinas';
  niche: string;
  productType: string;
  keywords: string[];
  archetype: CopyArchetype;
  audience: Produtos2ClientGender;
  charCount: number;
  fits8s?: boolean;
  isStarred?: boolean;
  notes?: string;
  text: string;
  requiredFeatures?: string[];
}

export interface Produtos2Variation {
  id: string;
  name: string;
  photos: string[];
}

export interface Produtos2FormState {
  subMode: Produtos2SubMode;
  maleSubOption: Produtos2MaleSubOption;
  productInfo: string;
  productName: string;
  productNameAutoFilled?: boolean;
  detectedNiche?: string;
  duration: Produtos2Duration;
  customCopy?: string;
  copyEngine?: Produtos2CopyEngine;
  // Fluxo de falas: Fala do usuário (se fornecida) + Banco 1 + Banco 2 + Aurora Copy
  speechesGenerated?: boolean;
  hasUserSpeech?: boolean;
  userSpeech?: string;
  bancoCopy?: string;
  bancoCopy2?: string;
  auroraCopy?: string;
  selectedSpeechOption?: 'user_speech' | 'banco1' | 'banco2' | 'aurora_copy';
  finalSelectedSpeech?: string;
  isDialogue?: boolean;
  dialogueDescription?: string;
  dialogueScript?: string;
  speakers?: Array<{ speaker: string; gender?: string; speech: string }>;
  additionalInstructions: string;
  influencer: Produtos2Influencer;
  influencerAutoFilled?: boolean;
  clientGender: Produtos2ClientGender;
  clientGenderAutoFilled?: boolean;
  speechMode: Produtos2SpeechMode;
  useSpeechIntro?: boolean;
  framing: Produtos2Framing;
  scenario: Produtos2Scenario;
  variations: Produtos2Variation[];
  maleClothStyle: Produtos2MaleClothStyle;
}

export interface Produtos2VisualMapItem {
  excerpt: string;
  intent: string;
  visualProof: string;
  scenes: string;
}

export interface Produtos2SceneItem {
  number: number;
  startTime: string;
  endTime: string;
  framing: string;
  action: string;
  cameraMovement: string;
  storyboardDescription: string;
  variationName?: string;
}

export type Produtos2AuditColorStatus = 'green' | 'yellow' | 'orange' | 'red';

export interface Produtos2QuadrantAuditItem {
  sceneNumber: number;
  productVisible: boolean;
  score: number;
  status: Produtos2AuditColorStatus;
  issue: string;
}

export interface Produtos2StoryboardAudit {
  overallScore: number;
  overallStatus: Produtos2AuditColorStatus;
  overallLabel: string;
  summaryIssues: string[];
  quadrants: Produtos2QuadrantAuditItem[];
  correctionPrompt: string;
}

export interface Produtos2ResultState {
  productName: string;
  productInfo?: string;
  detectedNiche: string;
  subMode: Produtos2SubMode;
  maleSubOption: Produtos2MaleSubOption;
  duration: Produtos2Duration;
  speechMode: Produtos2SpeechMode;
  useSpeechIntro?: boolean;
  framing: Produtos2Framing;
  scenario: Produtos2Scenario;
  influencerResolved: 'Homem' | 'Mulher';
  clientGender: Produtos2ClientGender;
  finalCopy: string;
  copySourceLabel: string;
  copyId: string;
  copyEngine?: Produtos2CopyEngine;
  productLock: string[];
  avatarDescription: string;
  scenarioDescription: string;
  visualMap: Produtos2VisualMapItem[];
  scenes: Produtos2SceneItem[];
  storyboardPrompt: string;
  storyboardImageUrl?: string;
  storyboardError?: string;
  isRegeneratingStoryboard?: boolean;
  isAuditingStoryboard?: boolean;
  storyboardAudit?: Produtos2StoryboardAudit;
  veoPrompt: string;
  variations?: Produtos2Variation[];
  additionalInstructions?: string;
  isDialogue?: boolean;
  dialogueDescription?: string;
  dialogueScript?: string;
  speakers?: Array<{ speaker: string; gender?: string; speech: string }>;
  description?: string;
  hashtags?: string[];
}

