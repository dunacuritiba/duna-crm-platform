import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, Check, AlertCircle, ImagePlus } from 'lucide-react';

interface PhotoUploaderProps {
  value: string;
  onChange: (base64OrUrl: string) => void;
  label?: string;
  helperText?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  value,
  onChange,
  label = 'Foto de Perfil',
  helperText = 'Formatos suportados: JPG, PNG ou WebP (máx. 3MB)',
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Start live webcam stream
  const startCamera = async () => {
    setCameraError(null);
    setCapturedPreview(null);
    setIsCameraOpen(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste dispositivo/navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      setCameraError(
        'Não foi possível inicializar a câmera do navegador. Você pode usar a câmera nativa do seu celular ou subir uma foto salva.'
      );
    }
  };

  // Capture current video frame to canvas
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight) || 400;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop center square
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPreview(dataUrl);
    stopCameraStream();
  };

  // Confirm captured photo
  const handleConfirmCaptured = () => {
    if (capturedPreview) {
      onChange(capturedPreview);
      closeCameraModal();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPreview(null);
    startCamera();
  };

  // Close camera modal
  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCapturedPreview(null);
    setCameraError(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Main Upload / Preview Box */}
      {value ? (
        /* State 1: Photo is selected/uploaded */
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl">
          <div className="relative shrink-0">
            <img
              src={value}
              alt="Prévia da foto"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-emerald-200 bg-white"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <p className="text-xs font-semibold text-emerald-950 flex items-center justify-center sm:justify-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Foto selecionada com sucesso
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Você pode trocar por outro arquivo ou tirar uma nova foto a qualquer momento.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                Subir Outra Foto
              </button>

              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                Usar Câmera
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-1.5 text-slate-400 hover:text-rose-600 text-xs font-medium rounded-xl transition"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* State 2: No photo yet -> Clean Drag and Drop / Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/70'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-indigo-600">
              <ImagePlus className="w-7 h-7 stroke-[1.5]" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Suba sua foto de perfil
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Arraste o arquivo até aqui ou utilize um dos botões abaixo:
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {/* Upload file button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Selecionar Arquivo
              </button>

              {/* Camera button */}
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                Tirar Foto com Câmera
              </button>

              {/* Mobile native camera trigger */}
              <button
                type="button"
                onClick={() => mobileCameraInputRef.current?.click()}
                className="sm:hidden px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                Câmera do Celular
              </button>
            </div>

            <p className="text-[10px] text-slate-400">{helperText}</p>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-4 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  {capturedPreview ? 'Foto Capturada' : 'Tirar Foto com a Câmera'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                aria-label="Fechar câmera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewfinder or Preview */}
            <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {capturedPreview ? (
                <img
                  src={capturedPreview}
                  alt="Foto capturada"
                  className="w-full h-full object-cover"
                />
              ) : cameraError ? (
                <div className="p-6 text-center text-white space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs leading-relaxed text-slate-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      mobileCameraInputRef.current?.click();
                      closeCameraModal();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Abrir Câmera Nativa
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  {/* Target guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-white/60 border-dashed" />
                  </div>
                </>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={closeCameraModal}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>

              {capturedPreview ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tirar Outra
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCaptured}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Usar Esta Foto
                  </button>
                </div>
              ) : !cameraError ? (
                <button
                  type="button"
                  onClick={captureSnapshot}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Capturar Foto
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
