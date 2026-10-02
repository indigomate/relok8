import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, X, RefreshCw, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

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
      // Fallback: trigger standard mobile capture input
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
      setIsCameraActive(false);
      return;
    }

    // Stop existing stream if switching facingMode
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
      // If environment camera fails, try user camera
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
          ? 'Brak dostępu do aparatu. Użyj przycisku wyboru pliku lub zezwól na dostęp do kamery w przeglądarce.'
          : 'Camera access denied or unavailable. Please upload a photo from your device or allow camera permissions.'
      );
    }
  };

  // Flip between back and front camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from active video feed
  const capturePhoto = () => {
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

        if (photos.length < maxPhotos) {
          onChange([...photos, dataUrl]);
        }
      }
    } catch (err) {
      console.error('Failed to capture frame from video:', err);
    } finally {
      setTimeout(() => {
        setIsCapturing(false);
        stopCameraStream();
      }, 300);
    }
  };

  // Process selected files from device
  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const availableSlots = maxPhotos - photos.length;
    const filesToRead = fileArray.slice(0, availableSlots);

    const readers: Promise<string>[] = filesToRead.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((newImages) => {
      onChange([...photos, ...newImages]);
    });
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

  return (
    <div className="space-y-4">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Action Buttons: Upload from Device & Take a Picture */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos}
          className="h-13 px-4 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-indigo-600 hover:bg-indigo-50/40 text-slate-800 hover:text-indigo-700 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold">
              {locale === 'pl' ? 'Wgraj z urządzenia' : 'Upload from device'}
            </span>
            <span className="block text-[11px] text-slate-500 font-normal">
              {locale === 'pl' ? 'Wybierz zdjęcia JPG, PNG z dysku' : 'Select JPG or PNG photos'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => startCamera('environment')}
          disabled={photos.length >= maxPhotos}
          className="h-13 px-4 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-indigo-600 hover:bg-indigo-50/40 text-slate-800 hover:text-indigo-700 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Camera className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold">
              {locale === 'pl' ? 'Zrób zdjęcie aparatem' : 'Take a picture on site'}
            </span>
            <span className="block text-[11px] text-slate-500 font-normal">
              {locale === 'pl' ? 'Użyj kamery telefonu lub laptopa' : 'Use phone or webcam camera'}
            </span>
          </div>
        </button>
      </div>

      {/* Drag & Drop Area if no photos */}
      {photos.length === 0 && (
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
              ? 'Dodaj rzeczywiste zdjęcia pokoju, kuchni i łazienki (min. 1 zdjęcie)'
              : 'Add real photos of the room, kitchen, and bathroom (minimum 1 photo)'}
          </p>
        </div>
      )}

      {/* Photo Previews Grid */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 px-0.5">
            <span>
              {locale === 'pl' ? 'Dodane zdjęcia:' : 'Added photos:'}{' '}
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
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Camera Modal Viewfinder */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col text-left">
            
            {/* Camera Viewfinder Header */}
            <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold tracking-tight">
                  {locale === 'pl' ? 'Zrób zdjęcie pokoju' : 'Take a Room Photo'}
                </span>
              </div>
              <button
                type="button"
                onClick={stopCameraStream}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Feed / Error Container */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-slate-300 space-y-3 max-w-sm">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-xs leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {locale === 'pl' ? 'Otwórz aparat w telefonie' : 'Open Device Camera'}
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Grid lines overlay for framing */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>
                </>
              )}
            </div>

            {/* Viewfinder Controls */}
            {!cameraError && (
              <div className="px-6 py-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Switch camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 p-1.5 transition-all active:scale-95 cursor-pointer shadow-lg flex items-center justify-center"
                  aria-label="Capture photo"
                >
                  <div className="w-full h-full rounded-full border-2 border-slate-900 bg-white" />
                </button>

                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-2"
                >
                  {locale === 'pl' ? 'Anuluj' : 'Cancel'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
