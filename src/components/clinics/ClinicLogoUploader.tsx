import React, { useRef, useState } from 'react';
import { Upload, X, Building2, Image as ImageIcon } from 'lucide-react';

interface ClinicLogoUploaderProps {
  logo?: string;
  onChange: (base64OrUrl: string) => void;
  clinicName?: string;
}

export const ClinicLogoUploader: React.FC<ClinicLogoUploaderProps> = ({
  logo,
  onChange,
  clinicName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG ou WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
        {/* Logo Preview or Placeholder */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden p-1.5">
            {logo ? (
              <img
                src={logo}
                alt={clinicName || 'Logo da clínica'}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <Building2 className="w-8 h-8" />
                <span className="text-[10px] text-slate-400 font-medium mt-1">Sem Logo</span>
              </div>
            )}
          </div>

          {logo && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs hover:bg-rose-700 transition"
              title="Remover logotipo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Drop zone / Buttons */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex-1 w-full border-2 border-dashed rounded-xl p-3 text-center transition flex flex-col items-center justify-center cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-white bg-slate-50/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs">
            <Upload className="w-4 h-4" />
            <span>{logo ? 'Trocar Logotipo da Clínica' : 'Carregar Logotipo Oficial'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Arraste e solte o arquivo aqui ou clique para selecionar (PNG, JPG, WebP até 5MB)
          </p>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> {errorMsg}
        </p>
      )}
    </div>
  );
};
