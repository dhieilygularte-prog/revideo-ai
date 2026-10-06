import { OPENAI_PRICING } from '../../config/openaiModels';

export type CloningStepName =
  | 'transcrição'
  | 'análise dos frames'
  | 'engenharia reversa/storyboard'
  | 'imagem 1'
  | 'imagem 2'
  | 'imagem 3'
  | 'auditoria da imagem 1'
  | 'auditoria da imagem 2'
  | 'auditoria da imagem 3'
  | 'regenerações'
  | 'geração dos prompts finais';

export interface StepCostDetail {
  id: string;
  step: CloningStepName;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD: number;
  costBRL: number;
  callCount: number;
  timestamp: string;
  details?: string;
}

export interface CompleteCloningCostReport {
  provider: 'openai' | 'gemini';
  totalCostUSD: number;
  totalCostBRL: number;
  totalCalls: number;
  totalTokens: number;
  modelsUsed: string[];
  steps: StepCostDetail[];
  breakdownByStep: Record<
    CloningStepName,
    {
      costUSD: number;
      costBRL: number;
      calls: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      model: string;
    }
  >;
}

export class CostTracker {
  private records: StepCostDetail[] = [];

  /**
   * Limpa registros para iniciar uma nova clonagem completa
   */
  reset() {
    this.records = [];
  }

  /**
   * Calcula custo para chamadas baseadas em tokens (ex: gpt-5.6-terra, gpt-5.6-luna)
   */
  calculateTokenCost(model: string, promptTokens: number, completionTokens: number): { costUSD: number; costBRL: number } {
    let inputRate = OPENAI_PRICING.terra.inputPer1M;
    let outputRate = OPENAI_PRICING.terra.outputPer1M;

    if (model.includes('luna')) {
      inputRate = OPENAI_PRICING.luna.inputPer1M;
      outputRate = OPENAI_PRICING.luna.outputPer1M;
    }

    const inputCostUSD = (promptTokens / 1_000_000) * inputRate;
    const outputCostUSD = (completionTokens / 1_000_000) * outputRate;
    const totalUSD = inputCostUSD + outputCostUSD;
    const totalBRL = totalUSD * OPENAI_PRICING.usdToBrl;

    return {
      costUSD: Math.round(totalUSD * 10000) / 10000,
      costBRL: Math.round(totalBRL * 1000) / 1000,
    };
  }

  /**
   * Calcula custo para transcrição de áudio (gpt-transcribe)
   */
  calculateAudioCost(durationSeconds: number = 15): { costUSD: number; costBRL: number } {
    const costUSD = Math.max(0.0005, durationSeconds * OPENAI_PRICING.transcribe.perSecondUSD);
    const costBRL = costUSD * OPENAI_PRICING.usdToBrl;
    return {
      costUSD: Math.round(costUSD * 10000) / 10000,
      costBRL: Math.round(costBRL * 1000) / 1000,
    };
  }

  /**
   * Calcula custo para geração de imagem (gpt-image-2.5-sunburst)
   */
  calculateImageCost(quality: 'high' | 'standard' = 'high'): { costUSD: number; costBRL: number } {
    const costUSD = quality === 'high' ? OPENAI_PRICING.sunburst.perImageHighUSD : OPENAI_PRICING.sunburst.perImageStandardUSD;
    const costBRL = costUSD * OPENAI_PRICING.usdToBrl;
    return {
      costUSD: Math.round(costUSD * 1000) / 1000,
      costBRL: Math.round(costBRL * 1000) / 1000,
    };
  }

  /**
   * Registra uma chamada instrumentada
   */
  recordCall(params: {
    step: CloningStepName;
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    costUSD: number;
    costBRL: number;
    details?: string;
  }) {
    const pTokens = params.promptTokens || 0;
    const cTokens = params.completionTokens || 0;

    const record: StepCostDetail = {
      id: `${params.step}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      step: params.step,
      model: params.model,
      promptTokens: pTokens,
      completionTokens: cTokens,
      totalTokens: pTokens + cTokens,
      costUSD: params.costUSD,
      costBRL: params.costBRL,
      callCount: 1,
      timestamp: new Date().toISOString(),
      details: params.details,
    };

    this.records.push(record);
    return record;
  }

  /**
   * Gera o relatório consolidado completo de custos da clonagem
   */
  generateReport(provider: 'openai' | 'gemini' = 'openai'): CompleteCloningCostReport {
    let totalCostUSD = 0;
    let totalCostBRL = 0;
    let totalTokens = 0;
    const modelsSet = new Set<string>();

    const breakdownByStep = {} as CompleteCloningCostReport['breakdownByStep'];

    const stepList: CloningStepName[] = [
      'transcrição',
      'análise dos frames',
      'engenharia reversa/storyboard',
      'imagem 1',
      'imagem 2',
      'imagem 3',
      'auditoria da imagem 1',
      'auditoria da imagem 2',
      'auditoria da imagem 3',
      'regenerações',
      'geração dos prompts finais',
    ];

    stepList.forEach((st) => {
      breakdownByStep[st] = {
        costUSD: 0,
        costBRL: 0,
        calls: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        model: '-',
      };
    });

    for (const r of this.records) {
      totalCostUSD += r.costUSD;
      totalCostBRL += r.costBRL;
      totalTokens += r.totalTokens;
      modelsSet.add(r.model);

      if (breakdownByStep[r.step]) {
        breakdownByStep[r.step].costUSD = Math.round((breakdownByStep[r.step].costUSD + r.costUSD) * 10000) / 10000;
        breakdownByStep[r.step].costBRL = Math.round((breakdownByStep[r.step].costBRL + r.costBRL) * 1000) / 1000;
        breakdownByStep[r.step].calls += 1;
        breakdownByStep[r.step].promptTokens += r.promptTokens;
        breakdownByStep[r.step].completionTokens += r.completionTokens;
        breakdownByStep[r.step].totalTokens += r.totalTokens;
        breakdownByStep[r.step].model = r.model;
      }
    }

    return {
      provider,
      totalCostUSD: Math.round(totalCostUSD * 1000) / 1000,
      totalCostBRL: Math.round(totalCostBRL * 100) / 100,
      totalCalls: this.records.length,
      totalTokens,
      modelsUsed: Array.from(modelsSet),
      steps: [...this.records],
      breakdownByStep,
    };
  }
}

// Instância singleton do rastreador de custos
export const globalCostTracker = new CostTracker();
