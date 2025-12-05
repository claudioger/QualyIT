'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, X, RotateCcw, Check, ImagePlus, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
  maxSize?: number; // in MB
  quality?: number; // 0-1
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type CameraFacing = 'user' | 'environment';

export function CameraCapture({
  onCapture,
  onCancel,
  maxSize = 5,
  quality = 0.8,
  open,
  onOpenChange,
}: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraFacing>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const controlledOpen = open !== undefined ? open : isOpen;
  const setControlledOpen = onOpenChange || setIsOpen;

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    }).catch(() => {
      setHasMultipleCameras(false);
    });
  }, []);

  const startCamera = useCallback(async (facingMode: CameraFacing) => {
    setError(null);
    setIsLoading(true);

    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permisos de cámara denegados. Por favor, habilite el acceso a la cámara.');
        } else if (err.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara disponible.');
        } else {
          setError('Error al acceder a la cámara: ' + err.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const handleOpen = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setControlledOpen(true);
    // Small delay to ensure dialog is mounted
    setTimeout(() => startCamera(facing), 100);
  }, [facing, startCamera, setControlledOpen]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    setControlledOpen(false);
    onCancel?.();
  }, [stopCamera, setControlledOpen, onCancel]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get data URL
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    setCapturedImage(dataUrl);

    // Stop camera to save resources
    stopCamera();
  }, [quality, stopCamera]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera(facing);
  }, [facing, startCamera]);

  const handleConfirm = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;

    setIsLoading(true);

    try {
      // Convert to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Check size
      const sizeMB = blob.size / (1024 * 1024);
      if (sizeMB > maxSize) {
        setError(`La imagen es muy grande (${sizeMB.toFixed(1)}MB). Máximo: ${maxSize}MB`);
        setIsLoading(false);
        return;
      }

      // Create file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([blob], `photo-${timestamp}.jpg`, { type: 'image/jpeg' });

      onCapture(file);
      handleClose();
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Error al procesar la imagen');
    } finally {
      setIsLoading(false);
    }
  }, [capturedImage, maxSize, onCapture, handleClose]);

  const handleSwitchCamera = useCallback(() => {
    const newFacing = facing === 'environment' ? 'user' : 'environment';
    setFacing(newFacing);
    startCamera(newFacing);
  }, [facing, startCamera]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      setError(`La imagen es muy grande (${sizeMB.toFixed(1)}MB). Máximo: ${maxSize}MB`);
      return;
    }

    // Check type
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    onCapture(file);
    handleClose();
  }, [maxSize, onCapture, handleClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <>
      {/* Hidden file input for gallery selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Trigger button - only show if not controlled */}
      {open === undefined && (
        <Button
          type="button"
          variant="outline"
          onClick={handleOpen}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          Tomar foto
        </Button>
      )}

      {/* Camera dialog */}
      <Dialog open={controlledOpen} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Capturar foto
            </DialogTitle>
            <DialogDescription>
              Toma una foto para documentar o selecciona una de tu galería
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-[4/3] bg-black">
            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Error display */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 z-10">
                <div className="text-center text-white">
                  <p className="mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Seleccionar de galería
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && !capturedImage && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}

            {/* Video preview */}
            {!capturedImage && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Captured image preview */}
            {capturedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}

            {/* Camera controls overlay */}
            {!capturedImage && !error && stream && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-20">
                {/* Gallery button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-6 w-6 text-white" />
                </Button>

                {/* Capture button */}
                <Button
                  type="button"
                  size="icon"
                  className="h-16 w-16 rounded-full bg-white hover:bg-gray-100"
                  onClick={handleCapture}
                >
                  <div className="h-12 w-12 rounded-full border-4 border-gray-800" />
                </Button>

                {/* Switch camera button */}
                {hasMultipleCameras && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30"
                    onClick={handleSwitchCamera}
                  >
                    <RotateCcw className="h-6 w-6 text-white" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 pt-0">
            {capturedImage ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetake}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tomar otra
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Usar foto
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Simpler inline version for forms
interface CameraButtonProps {
  onCapture: (file: File) => void;
  className?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export function CameraButton({
  onCapture,
  className,
  label = 'Tomar foto',
  variant = 'outline',
}: CameraButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Camera className="h-4 w-4 mr-2" />
        {label}
      </Button>
      <CameraCapture
        open={open}
        onOpenChange={setOpen}
        onCapture={onCapture}
      />
    </>
  );
}
