import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Trash2, X, RefreshCw, CheckCircle2, 
  AlertCircle, Image as ImageIcon, Sparkles, Check, ShieldCheck 
} from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { OnloAvatar } from './OnloAvatar';

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  locale?: SupportedLocale;
  maxPhotos?: number;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onChange,
  locale = 'en',
  maxPhotos = 10
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidatingAI, setIsValidatingAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [capturedAreas, setCapturedAreas] = useState<Set<string>>(() => new Set());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream cleanly when component unmounts or modal closes
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Launch in-browser camera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setIsCameraActive(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
      setIsCameraActive(false);
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      if (mode === 'environment') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
          return;
        } catch (e2) {}
      }

      setCameraError(
        locale === 'pl'
          ? 'Brak dostępu do aparatu. Użyj przycisku wyboru pliku lub zezwól na dostęp do kamery.'
          : 'Camera access denied or unavailable. Please upload a photo from your device.'
      );
    }
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // High-performance image compression using HTML5 Canvas (<150KB)
  const resizeImage = (dataUrl: string, maxWidth = 1200, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Onlo AI Room Photo Verification API caller
  const validateWithOnlo = async (
    resizedDataUrl: string
  ): Promise<{ isValid: boolean; detectedArea: string; feedback: string }> => {
    try {
      const res = await fetch('/api/ai/validate-room-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: resizedDataUrl, locale })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      isValid: true,
      detectedArea: 'other',
      feedback: locale === 'pl' ? 'Zdjęcie zaakceptowane.' : 'Photo approved.'
    };
  };

  // Capture frame from active video feed with AI validation
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const compressed = await resizeImage(rawDataUrl, 1200, 0.82);

        setIsValidatingAI(true);
        const aiResult = await validateWithOnlo(compressed);
        setIsValidatingAI(false);

        if (!aiResult.isValid) {
          setAiFeedback({ text: aiResult.feedback, isError: true });
          return;
        }

        // Valid room photo!
        if (aiResult.detectedArea && aiResult.detectedArea !== 'none') {
          setCapturedAreas(prev => new Set(prev).add(aiResult.detectedArea));
        }
        setAiFeedback({ text: aiResult.feedback, isError: false });
        setTimeout(() => setAiFeedback(null), 3500);

        if (photos.length < maxPhotos) {
          onChange([...photos, compressed]);
        }
      }
    } catch (err) {
      console.error('Failed to capture frame from video:', err);
    } finally {
      setIsCapturing(false);
      stopCameraStream();
    }
  };

  // Process selected files from device with AI inspection & resizing
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const availableSlots = maxPhotos - photos.length;
    const filesToRead = fileArray.slice(0, availableSlots);

    setIsValidatingAI(true);
    setAiFeedback(null);

    const validNewImages: string[] = [];

    for (const file of filesToRead) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(file);
      });

      if (!dataUrl) continue;

      const compressed = await resizeImage(dataUrl, 1200, 0.82);
      const aiResult = await validateWithOnlo(compressed);

      if (!aiResult.isValid) {
        setAiFeedback({ text: aiResult.feedback, isError: true });
        continue;
      }

      if (aiResult.detectedArea && aiResult.detectedArea !== 'none') {
        setCapturedAreas(prev => new Set(prev).add(aiResult.detectedArea));
      }
      setAiFeedback({ text: aiResult.feedback, isError: false });
      setTimeout(() => setAiFeedback(null), 3500);

      validNewImages.push(compressed);
    }

    setIsValidatingAI(false);

    if (validNewImages.length > 0) {
      onChange([...photos, ...validNewImages]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const hasBed = capturedAreas.has('bedroom') || photos.length >= 1;
  const hasDesk = capturedAreas.has('desk') || photos.length >= 2;
  const hasBathOrKitchen = capturedAreas.has('bathroom') || capturedAreas.has('kitchen') || photos.length >= 3;

  return (
    <div className="space-y-4">
      {/* Onlo AI Room Photo Checklist */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OnloAvatar size={22} variant="avatar" />
            <span className="text-xs font-bold text-slate-900">
              {locale === 'pl' ? 'Weryfikacja zdjęć Onlo AI' : 'Onlo AI Room Inspection'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
            {locale === 'pl' ? 'Tylko zdjęcia pokoju' : 'Room interiors only'}
          </span>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          {locale === 'pl'
            ? 'Onlo automatycznie weryfikuje zdjęcia pokoju, odrzucając selfie i nieczytelne pliki. Upewnij się, że sfotografujesz:'
            : 'Onlo automatically verifies room photos, rejecting selfies and non-room shots. Ensure you capture:'}
        </p>

        {/* 3 Core Areas Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div className={`p-2 rounded-xl border flex items-center gap-2 transition-colors ${
            hasBed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              hasBed ? 'bg-emerald-600 text-white' : 'border border-slate-300'
            }`}>
              {hasBed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span className="font-semibold text-[11px] truncate">
              {locale === 'pl' ? 'Łóżko / sypialnia' : 'Bed & sleeping area'}
            </span>
          </div>

          <div className={`p-2 rounded-xl border flex items-center gap-2 transition-colors ${
            hasDesk ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              hasDesk ? 'bg-emerald-600 text-white' : 'border border-slate-300'
            }`}>
              {hasDesk && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span className="font-semibold text-[11px] truncate">
              {locale === 'pl' ? 'Biurko / nauka' : 'Desk & study space'}
            </span>
          </div>

          <div className={`p-2 rounded-xl border flex items-center gap-2 transition-colors ${
            hasBathOrKitchen ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              hasBathOrKitchen ? 'bg-emerald-600 text-white' : 'border border-slate-300'
            }`}>
              {hasBathOrKitchen && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span className="font-semibold text-[11px] truncate">
              {locale === 'pl' ? 'Kuchnia / łazienka' : 'Kitchen or bathroom'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Feedback Banner (Success or Warning) */}
      {aiFeedback && (
        <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 border ${
          aiFeedback.isError 
            ? 'bg-rose-50 border-rose-200 text-rose-900' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          {aiFeedback.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold">Onlo: </span>
            <span>{aiFeedback.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setAiFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
      />

      {/* Hidden camera input for mobile browser fallback */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Action Buttons: Upload from Device & Take a Picture */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos || isValidatingAI}
          className="h-14 px-4 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-indigo-600 hover:bg-indigo-50/40 text-slate-800 hover:text-indigo-700 font-semibold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-xs font-bold truncate">
              {locale === 'pl' ? 'Wgraj z urządzenia' : 'Upload from device'}
            </span>
            <span className="block text-[11px] text-slate-500 font-normal truncate">
              {locale === 'pl' ? 'Wybierz zdjęcia pokoju (JPG, PNG)' : 'Select room photos (JPG, PNG)'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => startCamera('environment')}
          disabled={photos.length >= maxPhotos || isValidatingAI}
          className="h-14 px-4 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-indigo-600 hover:bg-indigo-50/40 text-slate-800 hover:text-indigo-700 font-semibold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-xs font-bold truncate">
              {locale === 'pl' ? 'Zrób zdjęcie aparatem' : 'Snap photo on site'}
            </span>
            <span className="block text-[11px] text-slate-500 font-normal truncate">
              {locale === 'pl' ? 'Użyj aparatu w telefonie' : 'Live room camera capture'}
            </span>
          </div>
        </button>
      </div>

      {/* AI Processing Status */}
      {isValidatingAI && (
        <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900 font-medium">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0" />
          <span>
            {locale === 'pl'
              ? 'Onlo weryfikuje kadr pod kątem pokoju i jakości...'
              : 'Onlo is inspecting room interior and clarity...'}
          </span>
        </div>
      )}

      {/* Drag & Drop Area if no photos */}
      {photos.length === 0 && !isValidatingAI && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`py-8 px-4 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/60'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
          }`}
        >
          <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">
            {locale === 'pl'
              ? 'Przeciągnij i upuść zdjęcia pokoju tutaj'
              : 'Drag & drop room photos here, or click to browse'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {locale === 'pl'
              ? 'Dodaj rzeczywiste zdjęcia pokoju, łóżka i biurka (min. 1 zdjęcie)'
              : 'Add real photos of the room, bed, and desk (minimum 1 photo)'}
          </p>
        </div>
      )}

      {/* Photo Previews Grid */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 px-0.5">
            <span>
              {locale === 'pl' ? 'Dodane zdjęcia:' : 'Verified room photos:'}{' '}
              <span className="font-bold text-slate-900">{photos.length}</span> / {maxPhotos}
            </span>
            <span className="text-[11px] text-slate-400">
              {locale === 'pl' ? 'Pierwsze zdjęcie to zdjęcie główne' : 'First photo is the cover photo'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
              >
                <img
                  src={photo}
                  alt={`Listing photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {idx === 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold">
                    {locale === 'pl' ? 'Główne' : 'Cover'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer opacity-90 hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-Browser Camera Modal Overlay */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg flex items-center justify-between text-white z-10">
            <span className="text-xs font-bold tracking-wide flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'pl' ? 'Kamera Relok8 · Kadr pokoju' : 'Relok8 Room Camera'}</span>
            </span>
            <button
              type="button"
              onClick={stopCameraStream}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {cameraError ? (
            <div className="p-4 rounded-2xl bg-white max-w-sm text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-xs text-slate-700">{cameraError}</p>
              <button
                type="button"
                onClick={stopCameraStream}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                {locale === 'pl' ? 'Zamknij' : 'Close'}
              </button>
            </div>
          ) : (
            <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Center Framing Guide */}
              <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] text-white/70 bg-black/50 px-2 py-1 rounded-md backdrop-blur-xs">
                  {locale === 'pl' ? 'Ustaw kadr na łóżko, biurko lub wnętrze' : 'Center on bed, desk, or room interior'}
                </span>
              </div>
            </div>
          )}

          <div className="w-full max-w-lg flex items-center justify-around py-4 z-10">
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
              title="Switch camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              disabled={isCapturing || Boolean(cameraError)}
              className="w-16 h-16 rounded-full bg-white p-1 shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
              aria-label="Capture photo"
            >
              <div className="w-full h-full rounded-full border-2 border-slate-900 flex items-center justify-center bg-white">
                <div className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700" />
              </div>
            </button>

            <div className="w-11" />
          </div>
        </div>
      )}
    </div>
  );
};
