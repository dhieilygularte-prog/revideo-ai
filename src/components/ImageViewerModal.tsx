import React from 'react';
import { X, Download, Maximize2 } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_9x16.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-md w-full flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-slate-300 hover:text-white rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-2 w-full">
          <div className="aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black relative">
            <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white truncate">{title}</p>
              <span className="text-[10px] text-sky-400 font-mono">9:16 Vertical • Alta Definição</span>
            </div>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
