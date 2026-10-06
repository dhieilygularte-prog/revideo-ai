import React, { useRef, useState } from 'react';
import {
  Film,
  AlertTriangle,
  Clock,
  Scissors,
  CheckCircle2,
  Link2,
  Upload,
  Clipboard,
  Loader2,
  Sparkles,
  AlertCircle,
  Video,
} from 'lucide-react';
import { ReferenceVideoData, VeoModelMode } from '../types';
import { MAX_VIDEO_DURATION_SECONDS, calculateSceneCount } from '../config/models';

interface VideoInputCardProps {
  videoData: ReferenceVideoData | null;
  isExtractingFrames: boolean;
  extractionProgress: { current: number; total: number };
  veoModelMode?: VeoModelMode;
  onVeoModelModeChange?: (mode: VeoModelMode) => void;
  onVideoSelected: (file: File) => void;
  onClearVideo: () => void;
}

export const VideoInputCard: React.FC<VideoInputCardProps> = ({
  videoData,
  isExtractingFrames,
  extractionProgress,
  veoModelMode = 'veo3_basic_8s',
  onVeoModelModeChange,
  onVideoSelected,
  onClearVideo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'tiktok' | 'upload'>('tiktok');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoSelected(file);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setTiktokUrl(text.trim());
        setDownloadError(null);
      }
    } catch (err) {
      console.warn('Não foi possível acessar a área de transferência:', err);
    }
  };

  const handleDownloadTikTok = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = tiktokUrl.trim();
    if (!trimmed) {
      setDownloadError('Por favor, cole o link do vídeo do TikTok antes de continuar.');
      return;
    }

    if (!trimmed.includes('tiktok.com')) {
      setDownloadError(
        'O link informado não parece ser do TikTok. Certifique-se de colar uma URL válida (ex: https://vm.tiktok.com/... ou https://www.tiktok.com/@user/video/...)'
      );
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadStatus("Conectando ao TikTok e localizando vídeo sem marca d'água...");

    try {
      const statusTimer = setTimeout(() => {
        setDownloadStatus('Baixando o vídeo original em alta definição...');
      }, 1500);

      const response = await fetch('/api/download-tiktok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmed }),
      });

      clearTimeout(statusTimer);

      if (!response.ok) {
        let errorMsg = 'Falha ao baixar o vídeo do TikTok.';
        try {
          const errData = await response.json();
          if (errData?.error) {
            errorMsg = errData.error;
          }
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      setDownloadStatus('Processando arquivo e iniciando análise...');

      const blob = await response.blob();
      const rawTitle = response.headers.get('X-Video-Title');
      let filename = 'tiktok_video.mp4';
      if (rawTitle) {
        try {
          const cleanTitle = decodeURIComponent(rawTitle)
            .replace(/[\\/:*?"<>|]/g, '')
            .replace(/\s+/g, '_')
            .trim();
          if (cleanTitle) {
            filename = `${cleanTitle.slice(0, 40)}.mp4`;
          }
        } catch {
          // fallback filename
        }
      }

      const file = new File([blob], filename, { type: 'video/mp4' });
      onVideoSelected(file);
    } catch (err: any) {
      console.error('Erro no download do TikTok:', err);
      setDownloadError(err.message || 'Erro inesperado ao baixar o vídeo do TikTok.');
    } finally {
      setIsDownloading(false);
      setDownloadStatus(null);
    }
  };

  const isTooLong = videoData && videoData.duration > MAX_VIDEO_DURATION_SECONDS;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Passo 1: Vídeo de Referência do Concorrente
              {videoData && !isTooLong && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {Math.round(videoData.duration)}s carregado
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              Cole o link direto do TikTok ou faça upload do arquivo MP4 do vídeo concorrente
            </p>
          </div>
        </div>

        {videoData && (
          <button
            onClick={onClearVideo}
            className="text-xs text-zinc-400 hover:text-rose-400 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Trocar Vídeo
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/mov,video/webm"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Frame extraction loading indicator (when videoData is not yet populated) */}
      {!videoData && isExtractingFrames ? (
        <div className="p-8 bg-zinc-950/90 rounded-2xl border border-zinc-800 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-sky-400 font-semibold">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span>Processando vídeo e extraindo quadros (1 por segundo)...</span>
          </div>
          <div className="max-w-md mx-auto w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-sky-500 h-full transition-all duration-200"
              style={{
                width: `${extractionProgress.total > 0 ? (extractionProgress.current / extractionProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            {extractionProgress.total > 0
              ? `Quadro ${extractionProgress.current} de ${extractionProgress.total}`
              : 'Iniciando decodificação do vídeo...'}
          </p>
        </div>
      ) : !videoData ? (
        <div className="space-y-4">
          {/* Segmented Control Tabs */}
          <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('tiktok');
                setDownloadError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tiktok'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Link do TikTok</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                Novo
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                setDownloadError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Upload de Arquivo (MP4/MOV)</span>
            </button>
          </div>

          {/* Tab 1: TikTok Link */}
          {activeTab === 'tiktok' ? (
            <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-5 space-y-4">
              <form onSubmit={handleDownloadTikTok} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <label htmlFor="tiktok-url-input">Cole o link do vídeo do TikTok:</label>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Clipboard className="w-3 h-3" />
                      Colar do teclado
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 pointer-events-none text-zinc-500">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <input
                      id="tiktok-url-input"
                      type="url"
                      value={tiktokUrl}
                      onChange={(e) => {
                        setTiktokUrl(e.target.value);
                        if (downloadError) setDownloadError(null);
                      }}
                      placeholder="Ex: https://www.tiktok.com/@usuario/video/123456789 ou https://vm.tiktok.com/..."
                      disabled={isDownloading}
                      className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-10 pr-20 py-3 text-xs text-white placeholder-zinc-500 transition-all outline-none"
                    />
                    {tiktokUrl && !isDownloading && (
                      <button
                        type="button"
                        onClick={() => setTiktokUrl('')}
                        className="absolute right-3 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Botão de Ação com gradiente e feedback de loading */}
                <button
                  type="submit"
                  disabled={isDownloading || !tiktokUrl.trim()}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:via-indigo-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{downloadStatus || 'Baixando vídeo sem marca d\'água...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-sky-200" />
                      <span>Baixar e Analisar Vídeo</span>
                    </>
                  )}
                </button>

                {/* Exibição de status dinâmico durante o download */}
                {isDownloading && downloadStatus && (
                  <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl flex items-center gap-2.5 text-xs text-sky-300 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-sky-400" />
                    <span>{downloadStatus}</span>
                  </div>
                )}

                {/* Alerta de erro com dica de contingência */}
                {downloadError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <p className="font-semibold">{downloadError}</p>
                        <div className="p-2.5 bg-rose-950/50 rounded-lg border border-rose-900/40 text-[11px] text-zinc-300">
                          💡 <strong className="text-white">Dica de contingência:</strong> Você também pode salvar o vídeo no seu dispositivo e arrastá-lo na aba{' '}
                          <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            className="text-sky-300 font-semibold hover:underline inline cursor-pointer"
                          >
                            "Upload de Arquivo (MP4/MOV)"
                          </button>
                          !
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rodapé informativo com vantagens */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 text-center">
                  <div className="flex items-center justify-center gap-1.5 p-2 bg-zinc-950 rounded-lg border border-zinc-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-medium">Sem marca d'água</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 p-2 bg-zinc-950 rounded-lg border border-zinc-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-medium">Qualidade HD original</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 p-2 bg-zinc-950 rounded-lg border border-zinc-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-medium">Pronto em 1 clique</span>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* Tab 2: Upload de Arquivo (MP4/MOV) */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) onVideoSelected(file);
              }}
              className="border-2 border-dashed border-zinc-700/80 hover:border-sky-500/70 hover:bg-sky-500/5 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 group-hover:bg-sky-500/20 text-zinc-400 group-hover:text-sky-400 flex items-center justify-center transition-colors">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-200 group-hover:text-white">
                  Arraste seu vídeo de referência aqui ou clique para selecionar
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Formatos suportados: MP4, MOV • Duração máxima recomendada: até 40s
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Video Loaded State (Preview + Details + Extracted Frames) */
        <div className="space-y-4">
          {/* Warning if duration exceeds 40s */}
          {isTooLong && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Vídeo muito longo ({Math.round(videoData.duration)} segundos)!</p>
                <p className="mt-0.5 text-[11px] text-rose-200/90">
                  O limite máximo suportado para clonagem é de 40 segundos (equivalente a 5 gerações de 8s no Veo). Por favor, corte o vídeo para no máximo 40 segundos e anexe novamente.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Player Preview */}
            <div className="md:col-span-4 bg-black rounded-2xl overflow-hidden border border-zinc-800 aspect-[9/16] max-h-80 mx-auto relative flex items-center justify-center shadow-2xl">
              <video
                src={videoData.previewUrl}
                controls
                playsInline
                style={{ colorScheme: 'dark' }}
                className="w-full h-full object-cover bg-black"
              />
            </div>

            {/* Video Details & Extraction Stats */}
            <div className="md:col-span-8 space-y-3">
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800/90 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">Arquivo / Origem:</span>
                  <span className="font-mono text-white truncate max-w-[220px]" title={videoData.fileName}>
                    {videoData.fileName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">Duração detectada:</span>
                  <span className="font-bold text-sky-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" /> {videoData.duration.toFixed(1)} segundos
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">Divisão estimada no Veo 3.1:</span>
                  <span className="font-bold text-indigo-400">
                    {calculateSceneCount(videoData.duration, veoModelMode)} cena{calculateSceneCount(videoData.duration, veoModelMode) > 1 ? 's' : ''} de {veoModelMode === 'veo3_omniflash_10s' ? '10s' : '8s'}
                  </span>
                </div>
              </div>

              {/* Extracted Frames Filmstrip */}
              {videoData.extractedFrames.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <div className="p-1 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <Film className="w-3.5 h-3.5" />
                      </div>
                      Quadros Extraídos ({videoData.extractedFrames.length} quadros analisados)
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">1 quadro/segundo + transições</span>
                  </div>

                  {/* Horizontal Filmstrip */}
                  <div className="flex gap-2.5 overflow-x-auto pb-2.5 pt-1 scrollbar-thin scrollbar-thumb-zinc-700">
                    {videoData.extractedFrames.map((frame, idx) => (
                      <div
                        key={idx}
                        className="relative shrink-0 w-24 aspect-[9/16] rounded-xl overflow-hidden border border-zinc-700/80 bg-black group shadow-md"
                      >
                        <img
                          src={frame.dataUrl}
                          alt={`Quadro ${frame.time}s`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1 inset-x-1 bg-black/85 backdrop-blur-xs rounded-md px-1.5 py-0.5 text-[10px] font-mono text-center text-zinc-200 flex items-center justify-center gap-1 border border-zinc-800/80">
                          {frame.isCutTransition && <Scissors className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                          <span>{frame.time}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seletor de Modelo de Geração Veo 3 */}
      <div className="pt-4 mt-2 border-t border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            Modelo de Geração no Google Veo:
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            {veoModelMode === 'veo3_omniflash_10s' ? '10s por cena • máx 252 caracteres' : '8s por cena • máx 199 caracteres'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
          <button
            type="button"
            onClick={() => onVeoModelModeChange?.('veo3_basic_8s')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              veoModelMode === 'veo3_basic_8s'
                ? 'bg-zinc-800 text-white shadow border border-sky-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${veoModelMode === 'veo3_basic_8s' ? 'bg-sky-400 shadow-sm shadow-sky-400' : 'bg-zinc-600'}`} />
            <span>Veo3 Básico (8s)</span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">199c</span>
          </button>

          <button
            type="button"
            onClick={() => onVeoModelModeChange?.('veo3_omniflash_10s')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              veoModelMode === 'veo3_omniflash_10s'
                ? 'bg-zinc-800 text-white shadow border border-indigo-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${veoModelMode === 'veo3_omniflash_10s' ? 'bg-indigo-400 shadow-sm shadow-indigo-400' : 'bg-zinc-600'}`} />
            <span>Veo3 Omni Flash (10s)</span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">252c</span>
          </button>
        </div>
      </div>
    </div>
  );
};
