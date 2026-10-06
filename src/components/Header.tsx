import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Sliders, Film, ChevronDown, Check, X, ShieldCheck } from 'lucide-react';
import { TokenCostBadge } from './TokenCostBadge';
import { TokenUsageStats } from '../types';
import { AIProfile, AI_PROFILES } from '../config/aiProfiles';

interface HeaderProps {
  tokenStats?: TokenUsageStats;
  mode?: 'ania' | 'clone';
  onModeChange?: (mode: 'ania' | 'clone') => void;
  aiProfile?: AIProfile;
  onAIProfileChange?: (profile: AIProfile) => void;
}

export const Header: React.FC<HeaderProps> = ({
  tokenStats,
  mode = 'ania',
  onModeChange,
  aiProfile = 'openai',
  onAIProfileChange,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeAI = AI_PROFILES[aiProfile] || AI_PROFILES.openai;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSelectProfile = (p: AIProfile) => {
    if (onAIProfileChange) {
      onAIProfileChange(p);
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="https://media.atomicatmedia.net/u/NJqFB4SgSbf00BL6cx9ujHWo0J33/Pictures/XzEmdQ9119157.png"
            alt="Aurora Clonadora de Vídeos"
            className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Mode Switcher Segmented Control */}
        {onModeChange && (
          <div className="bg-zinc-900/90 p-1 rounded-xl border border-zinc-700/80 flex items-center gap-1 shadow-inner order-3 sm:order-2">
            <button
              type="button"
              onClick={() => onModeChange('ania')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'ania'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Modo Ania</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('clone')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'clone'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-sky-200" />
              <span>Modo Clonagem</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2.5 order-2 sm:order-3 relative" ref={dropdownRef}>
          {tokenStats && <TokenCostBadge stats={tokenStats} />}

          {/* Botão de Perfil de IA */}
          <button
            type="button"
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg bg-zinc-900 border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              showDropdown
                ? 'border-purple-500/80 text-white ring-2 ring-purple-500/20'
                : 'border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white'
            }`}
            title="Clique para alternar o Perfil de IA e ver os modelos ativos"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-zinc-400 hidden sm:inline">Modelo de IA:</span>
            <span className="text-white font-bold">{activeAI.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${showDropdown ? 'rotate-180 text-purple-300' : ''}`} />
          </button>

          {/* Submenu / Popover dos Modelos Ativos */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-zinc-900/98 backdrop-blur-2xl border border-zinc-700 rounded-2xl p-4 text-zinc-200 shadow-2xl z-50 animate-fade-in space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white tracking-wide">Perfil de Inteligência Artificial</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Seletor Segmented Control: OpenAI vs Gemini */}
              <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 grid grid-cols-2 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleSelectProfile('openai')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    aiProfile === 'openai'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {aiProfile === 'openai' && <Check className="w-3.5 h-3.5" />}
                  <span>OpenAI</span>
                  {aiProfile === 'openai' && <span className="text-[9px] bg-purple-900/60 px-1 py-0.5 rounded text-purple-200 uppercase font-mono">Padrão</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectProfile('gemini')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    aiProfile === 'gemini'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {aiProfile === 'gemini' && <Check className="w-3.5 h-3.5" />}
                  <span>Gemini</span>
                </button>
              </div>

              {/* Detalhes dos Modelos Ativos do Perfil Selecionado */}
              <div className="space-y-2.5 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-xs">
                <div>
                  <div className="text-[11px] text-zinc-400 font-semibold mb-0.5">Cérebro:</div>
                  <div className="text-emerald-400 font-mono text-[11px] font-bold">
                    {activeAI.brain.display}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 font-semibold mb-0.5">Transcrição:</div>
                  <div className="text-sky-400 font-mono text-[11px] font-bold">
                    {activeAI.transcription.display}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 font-semibold mb-0.5">Geração de imagem:</div>
                  <div className="text-pink-400 font-mono text-[11px] font-bold">
                    {activeAI.image.display}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 font-semibold mb-0.5">Auditoria de fidelidade:</div>
                  <div className="text-amber-400 font-mono text-[11px] font-bold">
                    {activeAI.fidelityAudit.display}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 leading-relaxed px-1">
                A troca de perfil é 100% instantânea e será aplicada na próxima ação (gerar, refazer ou auditar).
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

