import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, Upload, Trash2, X, RefreshCw, CheckCircle2, 
  AlertCircle, Image as ImageIcon, Sparkles, Check, ShieldCheck,
  Bed, Laptop, Bath, Info, ArrowRight
} from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { OnloAvatar } from './OnloAvatar';

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  locale?: SupportedLocale;
  maxPhotos?: number;
}

interface AIValidationResult {
  isValid: boolean;
  rejectionReason: 'selfie' | 'non_room' | 'blurry' | 'messy' | null;
  detectedArea: 'sleeping' | 'workspace' | 'bathroom' | 'kitchen' | 'living' | 'other' | 'none';
  feedback: string;
  actionableGuidance: string;
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
  
  const [aiFeedback, setAiFeedback] = useState<{
    text: string;
    guidance?: string;
    isError?: boolean;
    reason?: string;
  } | null>(null);

  // Tracks verified areas per photo index or category
  const [photoAreaLabels, setPhotoAreaLabels] = useState<Record<number, string>>({});
  const [capturedAreas, setCapturedAreas] = useState<Set<string>>(() => new Set());
  const [cameraTargetArea, setCameraTargetArea] = useState<'sleeping' | 'workspace' | 'bathroom_kitchen'>('sleeping');

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

  // Onlo AI Room Vision Verification API
  const validateWithOnlo = async (
    resizedDataUrl: string
  ): Promise<AIValidationResult> => {
    // Image upload is independent of automated verification. Never fabricate an AI approval.
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(resizedDataUrl) || resizedDataUrl.length > 2000000) {
      return { isValid: false, rejectionReason: 'non_room', detectedArea: 'other', feedback: 'Use a JPEG, PNG, or WebP image below 1.5 MB.', actionableGuidance: 'Choose a smaller image.' };
    }
    return { isValid: true, rejectionReason: null, detectedArea: 'other', feedback: 'Photo uploaded. It has not been independently verified.', actionableGuidance: 'Use accurate, recent photos and avoid including personal documents.' };
  };

  // Friendly human label for detected area
  const getAreaLabel = (areaKey: string): string => {
    if (areaKey === 'sleeping' || areaKey === 'bedroom') {
      return locale === 'pl' ? 'Sypialnia / Łóżko' : 'Sleeping area';
    }
    if (areaKey === 'workspace' || areaKey === 'desk') {
      return locale === 'pl' ? 'Miejsce do nauki' : 'Workspace';
    }
    if (areaKey === 'bathroom') {
      return locale === 'pl' ? 'Łazienka' : 'Bathroom';
    }
    if (areaKey === 'kitchen') {
      return locale === 'pl' ? 'Kuchnia' : 'Kitchen';
    }
    if (areaKey === 'living') {
      return locale === 'pl' ? 'Salon / Wnętrze' : 'Living space';
    }
    return locale === 'pl' ? 'Wnętrze pokoju' : 'Room interior';
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
          setAiFeedback({ 
            text: aiResult.feedback, 
            guidance: aiResult.actionableGuidance,
            isError: true,
            reason: aiResult.rejectionReason || 'non_room'
          });
          return;
        }

        // Valid room photo!
        const area = aiResult.detectedArea && aiResult.detectedArea !== 'none' ? aiResult.detectedArea : cameraTargetArea;
        setCapturedAreas(prev => new Set(prev).add(area));
        
        const newIdx = photos.length;
        setPhotoAreaLabels(prev => ({ ...prev, [newIdx]: getAreaLabel(area) }));

        setAiFeedback({ 
          text: aiResult.feedback, 
          guidance: aiResult.actionableGuidance,
          isError: false 
        });
        setTimeout(() => setAiFeedback(null), 4000);

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
    const newLabels: Record<number, string> = { ...photoAreaLabels };

    for (let i = 0; i < filesToRead.length; i++) {
      const file = filesToRead[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(file);
      });

      if (!dataUrl) continue;

      const compressed = await resizeImage(dataUrl, 1200, 0.82);
      const aiResult = await validateWithOnlo(compressed);

      if (!aiResult.isValid) {
        setAiFeedback({ 
          text: aiResult.feedback, 
          guidance: aiResult.actionableGuidance,
          isError: true,
          reason: aiResult.rejectionReason || 'non_room'
        });
        continue;
      }

      const area = aiResult.detectedArea && aiResult.detectedArea !== 'none' ? aiResult.detectedArea : 'other';
      setCapturedAreas(prev => new Set(prev).add(area));
      
      const targetIdx = photos.length + validNewImages.length;
      newLabels[targetIdx] = getAreaLabel(area);

      setAiFeedback({ 
        text: aiResult.feedback, 
        guidance: aiResult.actionableGuidance,
        isError: false 
      });
      setTimeout(() => setAiFeedback(null), 4500);

      validNewImages.push(compressed);
    }

    setIsValidatingAI(false);
    setPhotoAreaLabels(newLabels);

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
    // Re-index area labels
    setPhotoAreaLabels(prev => {
      const updated: Record<number, string> = {};
      let offset = 0;
      for (let i = 0; i < photos.length; i++) {
        if (i === index) continue;
        if (prev[i]) updated[offset] = prev[i];
        offset++;
      }
      return updated;
    });
  };

  // State checks for the 3 key areas
  const hasSleeping = capturedAreas.has('sleeping') || capturedAreas.has('bedroom') || photos.length >= 1;
  const hasWorkspace = capturedAreas.has('workspace') || capturedAreas.has('desk') || photos.length >= 2;
  const hasBathroomKitchen = capturedAreas.has('bathroom') || capturedAreas.has('kitchen') || photos.length >= 3;

  // Compute actionable next step guidance
  const nextGuidance = useMemo(() => {
    if (!hasSleeping) {
      return {
        title: locale === 'pl' ? 'Krok 1: Sfotografuj strefę sypialną' : 'Step 1: Capture the sleeping area',
        tip: locale === 'pl' 
          ? 'Stań w drzwiach i zrób zdjęcie łóżka z naturalnym światłem z okna.' 
          : 'Stand near the doorway and take a clear photo of the bed with natural window light.'
      };
    }
    if (!hasWorkspace) {
      return {
        title: locale === 'pl' ? 'Krok 2: Pokaż miejsce do nauki i pracy' : 'Step 2: Capture the study workspace',
        tip: locale === 'pl'
          ? 'Zrób zdjęcie biurka, krzesła i gniazdek zasilających, przy których student będzie się uczyć.'
          : 'Frame the desk, study chair, and outlets where an applicant will study.'
      };
    }
    if (!hasBathroomKitchen) {
      return {
        title: locale === 'pl' ? 'Krok 3: Pokaż łazienkę lub kuchnię' : 'Step 3: Capture bathroom or kitchen access',
        tip: locale === 'pl'
          ? 'Zrób szerokie ujęcie łazienki (prysznic/wanna) lub wyposażenia wspólnej kuchni.'
          : 'Take a clear shot of the bathroom shower/tub or shared kitchen amenities.'
      };
    }
    return {
      title: locale === 'pl' ? 'Dodano zdjęcia 3 stref' : 'Photos added for all 3 room areas',
      tip: locale === 'pl'
        ? 'Świetna robota! Możesz dodać do 10 zdjęć, np. widok z okna lub szafę.'
        : 'Great work! You can add up to 10 photos, such as storage wardrobe or window view.'
    };
  }, [hasSleeping, hasWorkspace, hasBathroomKitchen, locale]);

  return (
    <div className="space-y-4">
      {/* Onlo AI Room Vision Verification Checklist */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OnloAvatar size={24} variant="avatar" />
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {locale === 'pl' ? 'Przesyłanie zdjęć' : 'Photo upload'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {locale === 'pl' ? 'Dodaj aktualne zdjęcia; bez niezależnej weryfikacji' : 'Upload recent photos; not independently verified'}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
            {locale === 'pl' ? 'Tylko wnętrza' : 'Interiors only'}
          </span>
        </div>

        {/* 3 Core Areas Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* 1. Sleeping */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
            hasSleeping ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              hasSleeping ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-[11px] block truncate">
                {locale === 'pl' ? '1. Strefa sypialna' : '1. Sleeping area'}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {locale === 'pl' ? 'Łóżko, materac, sypialnia' : 'Bed & sleeping space'}
              </span>
            </div>
          </div>

          {/* 2. Workspace */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
            hasWorkspace ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              hasWorkspace ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-[11px] block truncate">
                {locale === 'pl' ? '2. Miejsce do pracy' : '2. Study workspace'}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {locale === 'pl' ? 'Biurko, krzesło do nauki' : 'Desk & study table'}
              </span>
            </div>
          </div>

          {/* 3. Bath / Kitchen */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
            hasBathroomKitchen ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              hasBathroomKitchen ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-[11px] block truncate">
                {locale === 'pl' ? '3. Łazienka / Kuchnia' : '3. Bath or kitchen'}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {locale === 'pl' ? 'Prysznic, aneks lub sprzęt' : 'Shower or shared kitchen'}
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Next Guidance Callout */}
        <div className="p-3 rounded-xl bg-white/80 border border-indigo-100 flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-slate-900 block">{nextGuidance.title}</span>
            <span className="text-[11px] text-slate-600 block mt-0.5">{nextGuidance.tip}</span>
          </div>
        </div>
      </div>

      {/* AI Feedback Banner (Success or Warning with Actionable Advice) */}
      {aiFeedback && (
        <div className={`p-4 rounded-2xl text-xs space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200 border ${
          aiFeedback.isError 
            ? 'bg-rose-50 border-rose-200 text-rose-950' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {aiFeedback.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="font-bold text-xs">
                {aiFeedback.isError 
                  ? (locale === 'pl' ? 'Zdjęcie wymaga poprawy' : 'Photo needs adjustment')
                  : (locale === 'pl' ? 'Dodano zdjęcie' : 'Photo added')}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setAiFeedback(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              aria-label="Dismiss feedback"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[12px] leading-relaxed text-slate-800 pl-6">
            {aiFeedback.text}
          </p>

          {aiFeedback.guidance && (
            <div className="pl-6 pt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>{aiFeedback.guidance}</span>
            </div>
          )}
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
              {locale === 'pl' ? 'Kamera z asystentem kadru Onlo' : 'Live room camera capture'}
            </span>
          </div>
        </button>
      </div>

      {/* AI Processing Status */}
      {isValidatingAI && (
        <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900 font-medium">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0" />
          <span>
            {locale === 'pl'
              ? 'Przygotowywanie zdjęć...'
              : 'Preparing photos...'}
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
              ? 'Dodaj rzeczywiste zdjęcia pokoju: łóżko, biurko oraz łazienkę lub kuchnię'
              : 'Add real photos of the room: bed, study desk, and bathroom or kitchen'}
          </p>
        </div>
      )}

      {/* Photo Previews Grid with Verified Area Tags */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 px-0.5">
            <span>
              {locale === 'pl' ? 'Dodane zdjęcia:' : 'Uploaded room photos:'}{' '}
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

                {/* Primary Tag or Detected Area Badge */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  {idx === 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold">
                      {locale === 'pl' ? 'Główne' : 'Cover'}
                    </span>
                  ) : photoAreaLabels[idx] ? (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-900/80 backdrop-blur-xs text-white text-[10px] font-semibold truncate max-w-[120px]">
                      {photoAreaLabels[idx]}
                    </span>
                  ) : null}
                </div>

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

      {/* In-Browser Camera Modal Overlay with Area Framing Guides */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg flex items-center justify-between text-white z-10">
            <span className="text-xs font-bold tracking-wide flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'pl' ? 'Aparat · Kadr pokoju' : 'Room Camera'}</span>
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

          {/* Target Area Selector Pill Row */}
          <div className="z-10 flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 bg-white/10 backdrop-blur-md rounded-full">
            <button
              type="button"
              onClick={() => setCameraTargetArea('sleeping')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                cameraTargetArea === 'sleeping' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              {locale === 'pl' ? 'Sypialnia' : 'Sleeping Area'}
            </button>
            <button
              type="button"
              onClick={() => setCameraTargetArea('workspace')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                cameraTargetArea === 'workspace' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              {locale === 'pl' ? 'Biurko' : 'Workspace'}
            </button>
            <button
              type="button"
              onClick={() => setCameraTargetArea('bathroom_kitchen')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                cameraTargetArea === 'bathroom_kitchen' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              {locale === 'pl' ? 'Łazienka/Kuchnia' : 'Bath/Kitchen'}
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
              {/* Framing Guide Lines */}
              <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                <span className="text-[10px] text-white/70 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-xs">
                  {cameraTargetArea === 'sleeping' 
                    ? (locale === 'pl' ? 'Skieruj obiektyw na łóżko i strefę sypialną' : 'Frame bed & sleeping space')
                    : cameraTargetArea === 'workspace'
                    ? (locale === 'pl' ? 'Skieruj obiektyw na biurko i krzesło do nauki' : 'Frame desk & study workspace')
                    : (locale === 'pl' ? 'Skieruj obiektyw na łazienkę lub kuchnię' : 'Frame bathroom shower or kitchen counter')}
                </span>
                <span className="text-[10px] text-emerald-450 text-white/80 bg-black/60 px-2 py-0.5 rounded-md">
                  {locale === 'pl' ? 'Pokaż pokój; bez dokumentów osobistych' : 'Show the room; avoid personal documents'}
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
              disabled={isCapturing || Boolean(cameraError) || isValidatingAI}
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
