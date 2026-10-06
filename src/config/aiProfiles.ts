import {
  OPENAI_BRAIN_MODEL,
  OPENAI_AUDIO_MODEL,
  OPENAI_IMAGE_MODEL,
  OPENAI_AUDIT_MODEL,
} from './openaiModels';
import {
  GEMINI_VISION_MODEL,
  GEMINI_IMAGE_MODEL,
} from './models';

export type AIProfile = 'openai' | 'gemini';

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
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    brain: {
      model: GEMINI_VISION_MODEL,
      effort: 'medium',
      display: 'Gemini 3.8 Flash — Medium / Thinking',
    },
    transcription: {
      model: OPENAI_AUDIO_MODEL,
      mode: 'normal',
      display: 'GPT Transcribe — Normal',
    },
    image: {
      model: GEMINI_IMAGE_MODEL,
      display: 'Gemini 3.1 Flash Med',
    },
    fidelityAudit: {
      model: OPENAI_AUDIT_MODEL,
      display: 'GPT 5.6 Luna',
    },
  },
};
