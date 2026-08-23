'use client';
import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Minus, RotateCw, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { getMediaUrl } from '@/lib/utils';

interface ImagePreviewProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreview({ images = [], initialIndex = 0, isOpen, onClose }: ImagePreviewProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const touchStartRef = useRef<{ dist: number; zoom: number } | null>(null);
  // Parents pass inline `onClose` closures (unstable across renders); route the
  // keydown handler through a ref so the listener effect never re-subscribes on
  // parent re-renders while still always calling the latest callback.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex);
      setZoom(1);
      setRotation(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [index]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'ArrowRight' && images.length > 1) {
        setZoom(1);
        setRotation(0);
        setIndex((prev) => (prev + 1) % images.length);
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        setZoom(1);
        setRotation(0);
        setIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = getMediaUrl(images[index]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setRotation(0);
    setIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setRotation(0);
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.2, 4));
    } else {
      setZoom((prev) => Math.max(prev - 0.2, 0.5));
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (zoom > 1) return;
    const threshold = 50;
    if (info.offset.x < -threshold && images.length > 1) {
      handleNext();
    } else if (info.offset.x > threshold && images.length > 1) {
      handlePrev();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { dist, zoom };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartRef.current.dist;
      const newZoom = Math.min(Math.max(touchStartRef.current.zoom * factor, 0.5), 4);
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 select-none backdrop-blur-md"
        onClick={onClose}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Controls Header */}
        <div
          className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-4 sm:px-6 z-[110] bg-gradient-to-b from-black/80 via-black/40 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm font-semibold text-white/90">
            {images.length > 1 ? `${index + 1} / ${images.length}` : 'Image Viewer'}
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            {zoom !== 1 && (
              <button
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                onClick={handleResetZoom}
                title="Reset Zoom"
              >
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            <button
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              onClick={handleRotate}
              title="Rotate"
            >
              <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              className="p-2 text-white/90 hover:text-white bg-white/15 hover:bg-white/30 rounded-full transition-colors ml-1"
              onClick={onClose}
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 rounded-full transition-colors z-[110]"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>
            <button
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 rounded-full transition-colors z-[110]"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>
          </>
        )}

        {/* Content Container */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <Skeleton className="w-full max-w-2xl aspect-video rounded-xl bg-white/10 animate-pulse" />
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3 z-10 p-6 bg-black/60 rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <ImageIcon className="h-8 w-8 text-white/40" />
              </div>
              <div>
                <p className="text-base font-semibold text-white/90">Image Failed to Load</p>
                <p className="text-xs text-white/50 mt-1 max-w-xs break-all">{currentImage}</p>
              </div>
            </div>
          ) : (
            <motion.img
              key={currentImage}
              src={currentImage}
              alt={`Image ${index + 1}`}
              className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg shadow-2xl origin-center cursor-grab active:cursor-grabbing"
              style={{
                scale: zoom,
                rotate: `${rotation}deg`,
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: loading ? 0 : 1, scale: zoom }}
              transition={{ duration: 0.2 }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={() => setZoom((prev) => (prev === 1 ? 2 : 1))}
              drag={zoom === 1 ? 'x' : true}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.4}
              onDragEnd={handleDragEnd}
            />
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}

