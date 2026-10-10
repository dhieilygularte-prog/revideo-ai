import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Layers,
  Maximize2,
  Compass,
  Wand2,
  Package,
  Mic,
  Square,
  MapPin,
  Volume2,
} from 'lucide-react';
import { SceneDetail, SceneImage, VeoModelMode } from '../types';
import { downloadSceneImagesZip } from '../utils/zipExporter';

interface SceneCardProps {
  scene: SceneDetail;
  productType?: string;
  veoModelMode?: VeoModelMode;
  totalScenes?: number;
  onUpdateSceneSpeech?: (sceneNumber: number, newSpeech: string) => void;
  onRegenerateImage: (sceneNumber: number, imageId: string, customCorrection?: string) => void;
  onPreviewImage: (imageUrl: string, title: string) => void;
  onDownloadImagesOnly?: () => void;
  onDownloadAllZip?: () => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  productType = 'produto',
  veoModelMode = 'veo3_basic_8s',
  totalScenes = 1,
  onUpdateSceneSpeech,
  onRegenerateImage,
  onPreviewImage,
  onDownloadImagesOnly,
  onDownloadAllZip,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [customCorrections, setCustomCorrections] = useState<Record<string, string>>({});
  const [activeRecordingImgId, setActiveRecordingImgId] = useState<string | null>(null);
  const [interimCorrection, setInterimCorrection] = useState('');
  const [sceneSpeech, setSceneSpeech] = useState(scene.sceneSpeech || '');
  const [justUpdatedPrompt, setJustUpdatedPrompt] = useState(false);

  React.useEffect(() => {
    setSceneSpeech(scene.sceneSpeech || '');
  }, [scene.sceneSpeech]);

  const maxSceneChars = veoModelMode === 'veo3_omniflash_10s' ? 252 : 199;
  const sceneDurationSec = veoModelMode === 'veo3_omniflash_10s' ? 10 : 8;

  const handleShortenSceneSpeech = () => {
    const trimmed = sceneSpeech.trim();
    if (trimmed.length <= 25) return;
    const targetLen = Math.max(20, trimmed.length - 40);

    let result = trimmed
      .replace(/\s+/g, ' ')
      .replace(/olha só pessoal[,\s]*/gi, '')
      .replace(/presta atenção[,\s]*/gi, '')
      .replace(/corre que tá acabando[,\s]*/gi, '')
      .replace(/é simplesmente perfeito[,\s]*/gi, 'é perfeito, ')
      .replace(/com certeza vale a pena[,\s]*/gi, '')
      .replace(/com certeza[,\s]*/gi, '')
      .replace(/aproveita essa super oportunidade[,\s]*/gi, 'aproveita ');

    if (result.length > targetLen) {
      const slice = result.slice(0, targetLen + 15);
      const lastPunct = Math.max(
        slice.lastIndexOf('.'),
        slice.lastIndexOf('!'),
        slice.lastIndexOf(','),
        slice.lastIndexOf(' ')
      );
      if (lastPunct > targetLen - 20) {
        result = slice.slice(0, lastPunct).trim();
      } else {
        result = result.slice(0, targetLen).trim();
      }
      if (!/[.!?]$/.test(result)) result += '!';
    }

    setSceneSpeech(result);
    if (onUpdateSceneSpeech) {
      onUpdateSceneSpeech(scene.sceneNumber, result);
    }
  };

  const handleExpandSceneSpeech = () => {
    const trimmed = sceneSpeech.trim();
    const isFinalScene = scene.sceneNumber === totalScenes;

    const hooks = isFinalScene
      ? [
          ' Não perde tempo, clica no link abaixo e garante o seu com desconto exclusivo!',
          ' Estoque super limitado com frete grátis, toca no botão agora!',
          ' Aproveita essa condição única de hoje no link aqui embaixo!',
        ]
      : [
          ' Olha cada detalhe incrível e a qualidade impecável deste produto.',
          ' O acabamento é de alto padrão e o design é super moderno.',
          ' Sensação premium que faz toda a diferença no seu dia a dia.',
          ' Super versátil e resistente para você usar em qualquer ocasião.',
        ];

    let expanded = trimmed;
    for (const h of hooks) {
      if ((expanded + h).length <= maxSceneChars) {
        expanded += h;
      }
    }

    if (expanded.length > maxSceneChars) {
      expanded = expanded.slice(0, maxSceneChars - 1).trim();
      if (!/[.!?]$/.test(expanded)) expanded += '!';
    }

    setSceneSpeech(expanded);
    if (onUpdateSceneSpeech) {
      onUpdateSceneSpeech(scene.sceneNumber, expanded);
    }
  };

  const handleApplySceneSpeech = () => {
    if (onUpdateSceneSpeech) {
      onUpdateSceneSpeech(scene.sceneNumber, sceneSpeech);
      setJustUpdatedPrompt(true);
      setTimeout(() => setJustUpdatedPrompt(false), 2200);
    }
  };

  const recognitionRef = React.useRef<any>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const handleToggleMic = async (imgId: string) => {
    if (activeRecordingImgId === imgId) {
      // Parar gravação
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setActiveRecordingImgId(null);
      setInterimCorrection('');
      return;
    }

    // Iniciar gravação para imgId
    setActiveRecordingImgId(imgId);
    setInterimCorrection('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          if (final) {
            setCustomCorrections((prev) => ({
              ...prev,
              [imgId]: (prev[imgId] ? `${prev[imgId]} ${final}` : final).trim(),
            }));
          }
          setInterimCorrection(interim);
        };

        recognition.onerror = () => {
          setActiveRecordingImgId(null);
        };

        recognition.onend = () => {
          if (activeRecordingImgId === imgId) {
            setActiveRecordingImgId(null);
          }
        };

        recognition.start();
      }
    } catch (err) {
      console.warn('Erro ao acessar microfone para correção de imagem:', err);
      setActiveRecordingImgId(null);
    }
  };


  const cleanProd = (productType || 'produto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .split('_')
    .filter(Boolean)[0] || 'produto';

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(scene.veoPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleDownloadImage = (img: SceneImage, index: number) => {
    const link = document.createElement('a');
    link.href = img.imageUrl;
    const slotNumber = index + 1; // 1, 2, or 3
    link.download = `${slotNumber}_${cleanProd}.jpg`; // e.g. "1_tenis.jpg", "2_tenis.jpg", "3_tenis.jpg"
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAngleLabel = (img: SceneImage) => {
    const a = (img.targetAngle || '').toLowerCase();
    if (a === 'rear' || a === 'back' || a.includes('costas') || a.includes('traseira')) return 'Vista Traseira / Costas';
    if (a === 'side' || a.includes('lateral')) return 'Vista Lateral / Perfil';
    if (a === 'front_side' || a.includes('3/4')) return 'Vista Frontal 3/4';
    if (a === 'detail' || a === 'front_detail' || a.includes('detalhe') || a.includes('close')) return 'Vista de Detalhe / Close';
    if (a === 'lifestyle' || a.includes('uso') || a.includes('acao')) return 'Demonstração em Uso';
    if (a === 'front') return 'Vista Frontal Direta';
    return img.role || 'Ângulo de Referência';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 transition-all">
      {/* Scene Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-sm">
            {scene.sceneNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Cena {scene.sceneNumber} (Geração Veo 3.1)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-800 text-sky-300 border border-zinc-700">
                {scene.timeRangeText}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{scene.actionSummary}</p>
          </div>
        </div>

        {/* Veo Attachment Directive */}
        <div className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs font-semibold text-indigo-300 flex items-center gap-2 shrink-0">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>{scene.veoInstruction || `Anexe no Veo a(s) ${scene.images.length} imagem(ns) de referência`}</span>
        </div>
      </div>

      {/* Reference Images Generated Side-by-Side */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Imagens de Referência Geradas ({scene.images.length})
          </span>
          <span className="text-[11px] text-zinc-500">
            Formato vertical 9:16 • Anexe no Google Veo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {scene.images.map((img, imgIdx) => {
            const angleLabel = getAngleLabel(img);
            const audit = img.fidelityAudit;

            return (
              <div
                key={img.id}
                className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col group relative shadow-md"
              >
                {/* Image Preview 9:16 */}
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  {img.imageUrl ? (
                    <>
                      <img
                        src={img.imageUrl}
                        alt={img.role}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <button
                        onClick={() => onPreviewImage(img.imageUrl, img.role)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow z-10"
                        title="Expandir Imagem"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                      <span className="text-xs">Gerando imagem com Nano Banana Pro...</span>
                    </div>
                  )}

                  {/* Top Left: Frame Number Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-950/85 border border-zinc-700/80 text-[10px] font-bold text-sky-300">
                    Imagem {imgIdx + 1}
                  </div>

                  {/* Bottom Left: Angle Badge */}
                  <div className="absolute bottom-2 left-2 flex items-center pointer-events-none">
                    <span className="px-2 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-zinc-700 text-[10px] font-bold text-white flex items-center gap-1">
                      <Compass className="w-3 h-3 text-pink-400" />
                      {angleLabel}
                    </span>
                  </div>

                  {/* Bottom Right: Direct Download Button Overlaid on Image */}
                  {img.imageUrl && !img.isRegenerating && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(img, imgIdx);
                      }}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-zinc-950/85 hover:bg-black text-white hover:text-emerald-400 border border-zinc-700/80 hover:border-emerald-500/60 shadow-lg backdrop-blur-sm transition-all cursor-pointer z-10 flex items-center justify-center"
                      title={`Baixar ${imgIdx + 1}_${cleanProd}.jpg`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Card Meta & Actions */}
                <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white line-clamp-1">{img.role}</p>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-[11px] text-pink-400 font-mono">{img.variationName}</p>
                      {img.location && (
                        <span
                          className="text-[10px] text-amber-300 font-medium truncate max-w-[130px] flex items-center gap-0.5"
                          title={img.location}
                        >
                          <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate">{img.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real Fiscal Quality Audit Badge (TikTok Shop Standard) */}
                  {audit ? (
                    <div
                      className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                        audit.status === 'green'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : audit.status === 'yellow'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          {audit.status === 'green' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : audit.status === 'yellow' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span>{audit.label}</span>
                        </span>
                        <span className="font-mono text-[10px]">{audit.score}/100</span>
                      </div>

                      {audit.issues && audit.issues.length > 0 && (
                        <p className="text-[10px] opacity-90 leading-tight">
                          {audit.issues.slice(0, 2).join(' • ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Fidelidade 100% conferida</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-1.5 pt-1 border-t border-zinc-900">
                    {/* Auto-Heal / Correction Button if deviation was detected */}
                    {audit && audit.status !== 'green' && (
                      <button
                        onClick={() => onRegenerateImage(scene.sceneNumber, img.id, audit.correctionPrompt)}
                        disabled={img.isRegenerating}
                        className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                        title="Refaz a imagem aplicando as correções identificadas pelo fiscal de qualidade"
                      >
                        <Wand2 className="w-3 h-3 text-white" />
                        <span>Regenerar Corrigindo Erros</span>
                      </button>
                    )}

                    {/* Dictated Correction Banner / Feedback */}
                    {(activeRecordingImgId === img.id || customCorrections[img.id]) && (
                      <div className="p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                          <span className="flex items-center gap-1.5">
                            {activeRecordingImgId === img.id ? (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            ) : (
                              <Mic className="w-3.5 h-3.5 text-purple-400" />
                            )}
                            {activeRecordingImgId === img.id ? 'Ouvindo alterações...' : 'Alterações para refazer:'}
                          </span>
                          {customCorrections[img.id] && (
                            <button
                              type="button"
                              onClick={() => setCustomCorrections(prev => {
                                const next = { ...prev };
                                delete next[img.id];
                                return next;
                              })}
                              className="text-zinc-400 hover:text-rose-400 text-[10px] cursor-pointer"
                              title="Limpar alteração"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-200 break-words">
                          {customCorrections[img.id] || ''}
                          {activeRecordingImgId === img.id && interimCorrection && (
                            <span className="italic text-purple-300 opacity-70"> {interimCorrection}</span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadImage(img, imgIdx)}
                        disabled={!img.imageUrl || img.isRegenerating}
                        className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title={`Baixar como: ${imgIdx + 1}_${cleanProd}.jpg`}
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Baixar ({imgIdx + 1}_{cleanProd}.jpg)</span>
                      </button>

                      {/* Botão de Microfone para Ditar Correções */}
                      <button
                        type="button"
                        onClick={() => handleToggleMic(img.id)}
                        disabled={img.isRegenerating}
                        className={`p-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          activeRecordingImgId === img.id
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                            : customCorrections[img.id]
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
                        }`}
                        title={
                          activeRecordingImgId === img.id
                            ? 'Parar gravação'
                            : 'Ditar alterações para esta imagem por voz'
                        }
                      >
                        {activeRecordingImgId === img.id ? (
                          <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                        ) : (
                          <Mic className="w-3.5 h-3.5 text-purple-400" />
                        )}
                      </button>

                      <button
                        onClick={() => onRegenerateImage(scene.sceneNumber, img.id, customCorrections[img.id])}
                        disabled={img.isRegenerating}
                        className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title={
                          customCorrections[img.id]
                            ? `Refazer imagem aplicando: "${customCorrections[img.id]}"`
                            : "Refazer imagem no modelo Nano Banana Pro"
                        }
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${img.isRegenerating ? 'animate-spin text-sky-400' : ''}`} />
                        <span className="hidden sm:inline">Refazer</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Download Action Buttons (Positioned directly below the 3 generated images and above the Google Veo prompt) */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <button
          onClick={onDownloadImagesOnly || (() => downloadSceneImagesZip(scene, productType))}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/30 ring-2 ring-purple-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          title="Baixar as imagens geradas"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Baixar as imagens</span>
        </button>

        {onDownloadAllZip && (
          <button
            onClick={onDownloadAllZip}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 ring-2 ring-emerald-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            title="Baixar tudo: imagens, prompts e headlines"
          >
            <Package className="w-4 h-4 text-white" />
            <span>Baixar tudo</span>
          </button>
        )}
      </div>

      {/* Roteiro de Fala da Cena (Cena 1, Cena 2, etc.) */}
      <div className="p-4 sm:p-5 bg-zinc-950/90 rounded-xl border border-zinc-800 space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
          <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            <span>Roteiro de Fala da Cena {scene.sceneNumber} ({sceneDurationSec}s) (Editável)</span>
          </label>
          <span className="text-[11px] text-zinc-500 font-normal">
            Fala exclusiva para a Cena {scene.sceneNumber} • Sincroniza diretamente ao prompt do Veo abaixo
          </span>
        </div>

        <textarea
          value={sceneSpeech}
          onChange={(e) => setSceneSpeech(e.target.value)}
          rows={2}
          placeholder={`Digite ou ajuste as falas desta Cena ${scene.sceneNumber} (${scene.timeRangeText})...`}
          className="w-full p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-sans resize-y leading-relaxed"
        />

        {/* Contagem de Caracteres da Cena */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 px-0.5 gap-2">
          <span>
            Caracteres da Cena {scene.sceneNumber}:{' '}
            <strong className={`font-mono ${sceneSpeech.length > maxSceneChars ? 'text-rose-400 font-bold' : 'text-white'}`}>
              {sceneSpeech.length}
            </strong>{' '}
            / {maxSceneChars} máx
          </span>

          {sceneSpeech.length > maxSceneChars ? (
            <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
              ⚠️ Ultrapassa o limite de {maxSceneChars} caracteres da cena! Clique em "Encurtar Falas".
            </span>
          ) : sceneSpeech.trim().length > 0 ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              ✓ Ritmo ideal para geração de {sceneDurationSec}s
            </span>
          ) : (
            <span className="text-zinc-500 italic">
              Sem falas nesta cena (música / som ambiente)
            </span>
          )}
        </div>

        {/* Botões de Ação da Fala da Cena */}
        <div className="flex flex-wrap items-center justify-between pt-1 gap-2 border-t border-zinc-800/80">
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Ajuste a locução desta cena individualmente
          </span>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* Botão Encurtar Falas da Cena */}
            <button
              type="button"
              onClick={handleShortenSceneSpeech}
              disabled={sceneSpeech.trim().length <= 25}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={`Reduz o texto da Cena ${scene.sceneNumber} tornando a fala mais rápida e enxuta`}
            >
              <span>✂️ Encurtar Falas</span>
            </button>

            {/* Botão Aumentar Falas da Cena */}
            <button
              type="button"
              onClick={handleExpandSceneSpeech}
              disabled={sceneSpeech.trim().length >= maxSceneChars}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={`Expande as falas da Cena ${scene.sceneNumber} até ${maxSceneChars} caracteres com argumentos persuasivos`}
            >
              <span>⚡ Aumentar Falas</span>
            </button>

            {/* Botão Atualizar Prompt com Estas Falas */}
            <button
              type="button"
              onClick={handleApplySceneSpeech}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20 active:scale-95"
              title={`Atualiza imediatamente o prompt do Veo da Cena ${scene.sceneNumber} com estas falas`}
            >
              {justUpdatedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-100">Prompt Atualizado!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>Atualizar Prompt com Estas Falas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Google Veo Prompt Box */}
      <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Prompt para o Google Veo
            </h4>
          </div>

          <span className="text-emerald-400 font-bold font-mono text-xs">
            Duração: {sceneDurationSec}.0s • Vertical 9:16
          </span>
        </div>

        <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-900/95 p-3.5 rounded-xl border border-zinc-800 select-all shadow-inner">
          {scene.veoPrompt}
        </p>

        {/* High-Emphasis Copy Prompt Button */}
        <button
          onClick={handleCopyPrompt}
          className="w-full py-4 px-5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:via-indigo-400 hover:to-purple-500 text-white font-black text-sm sm:text-base rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl shadow-indigo-600/30 ring-2 ring-sky-400/50 hover:scale-[1.01] active:scale-[0.99]"
        >
          {copiedPrompt ? (
            <>
              <Check className="w-5 h-5 text-emerald-300" />
              <span className="text-emerald-100">Prompt do Vídeo Copiado com Sucesso!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 text-sky-200" />
              <span>Copiar prompt do vídeo</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-zinc-400 text-center">
          Cole no Google Veo 3.1 com as Imagens 1, 2 e 3 anexadas como referências visuais
        </p>
      </div>
    </div>
  );
};
