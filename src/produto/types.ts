export type ProdutoFraming = 'sem_rosto' | 'com_rosto' | 'apenas_produto';

export type ProdutoScenario = 'tipico' | 'casa' | 'ar_livre' | 'estudio_neutro';

export type ProdutoSceneCount = 1 | 2 | 3;

export interface ProdutoVariation {
  id: string;
  name: string;
  photos: string[];
}

export interface ProdutoFormState {
  productName: string;
  productInfo: string;
  gender: 'Mulher' | 'Homem' | null;
  framing: ProdutoFraming;
  scenario: ProdutoScenario;
  sceneCount: ProdutoSceneCount;
  veoModelMode: 'veo3_omniflash_10s' | 'veo3_basic_8s';
  variations: ProdutoVariation[];
  additionalInstructions: string;
  customSpeech: string;
}

export interface ProdutoImageItem {
  id: string;
  imageUrl?: string;
  promptUsed: string;
  isRegenerating?: boolean;
  hasError?: boolean;
  error?: string;
  role: string;
}

export interface ProdutoSceneResult {
  sceneNumber: number;
  prompt: string;
  speech: string;
  images: ProdutoImageItem[];
}

export interface ProdutoResultState {
  productName: string;
  productInfo: string;
  gender: 'Mulher' | 'Homem' | null;
  framing: ProdutoFraming;
  scenario: ProdutoScenario;
  sceneCount: ProdutoSceneCount;
  veoModelMode: 'veo3_omniflash_10s' | 'veo3_basic_8s';
  scenes: ProdutoSceneResult[];
  speech: string;
  description: string;
}
