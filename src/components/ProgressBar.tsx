import React from 'react';
import { Film, Eye, Layers, Image as ImageIcon, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { ProcessingStep } from '../types';

interface ProgressBarProps {
  currentStep: ProcessingStep;
  progressPercent: number;
  statusMessage: string;
}

const STEPS = [
  { key: 'extracting_frames', label: 'Extraindo quadros', icon: Film },
  { key: 'analyzing_video', label: 'Analisando vídeo', icon: Eye },
  { key: 'splitting_scenes', label: 'Dividindo em cenas', icon: Layers },
  { key: 'generating_images', label: 'Gerando imagens', icon: ImageIcon },
  { key: 'checking_fidelity', label: 'Conferindo fidelidade', icon: ShieldCheck },
  { key: 'writing_prompts', label: 'Escrevendo prompts', icon: Sparkles },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  progressPercent,
  statusMessage,
}) => {
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <h3 className="text-sm font-bold text-white">Processando clonagem do vídeo</h3>
        </div>
        <span className="text-xs font-mono font-bold text-sky-400">{Math.round(progressPercent)}%</span>
      </div>

      {/* Main Bar */}
      <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
        <div
          className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = currentStepIndex > idx || currentStep === 'completed';
          const isCurrent = currentStepIndex === idx;

          return (
            <div
              key={step.key}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-md shadow-sky-500/10'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-500'
              }`}
            >
              <div className="flex justify-center mb-1">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse text-sky-400' : ''}`} />
                )}
              </div>
              <span className="text-[11px] font-semibold block leading-tight">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
