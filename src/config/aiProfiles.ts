import {
  OPENAI_BRAIN_MODEL,
  OPENAI_AUDIO_MODEL,
  OPENAI_IMAGE_MODEL,
  OPENAI_AUDIT_MODEL,
} from './openaiModels';

export type AIProfile = 'openai';

export interface AIProfileDetail {
  model: string;
  effort?: string;
  mode?: string;
  display: string;
}

export interface AIProfileConfig {
  id: AIProfile;
  label: string;
  brain: AIProfileDetail;
  transcription: AIProfileDetail;
  image: AIProfileDetail;
  fidelityAudit: AIProfileDetail;
}

export const AI_PROFILES: Record<AIProfile, AIProfileConfig> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    brain: {
      model: OPENAI_BRAIN_MODEL,
      effort: 'medium',
      display: 'GPT 5.6 Terra — Medium',
    },
    transcription: {
      model: OPENAI_AUDIO_MODEL,
      mode: 'normal',
      display: 'GPT Transcribe — Normal',
    },
    image: {
      model: OPENAI_IMAGE_MODEL,
      display: 'GPT Image 2.5 Surboost',
    },
    fidelityAudit: {
      model: OPENAI_AUDIT_MODEL,
      display: 'GPT 5.6 Luna',
    },
  },
};
