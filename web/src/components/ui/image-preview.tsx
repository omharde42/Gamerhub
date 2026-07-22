'use client';
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Minus, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface ImagePreviewProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreview({ images, initialIndex = 0, isOpen, onClose }: ImagePreviewProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[index];

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
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleRotate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 select-none" onClick={onClose}>
        {/* Controls Header */}
        <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-6 z-[110] bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-sm font-semibold text-white/80">
            {images.length > 1 ? `${index + 1} / ${images.length}` : 'Image Preview'}
          </span>
          <div className="flex items-center gap-3">
            <button 
              className="p-2 text-white/75 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button 
              className="p-2 text-white/75 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button 
              className="p-2 text-white/75 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              onClick={handleRotate}
              title="Rotate"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button 
              className="p-2 text-white/75 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors ml-2"
              onClick={onClose}
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            <button 
              className="absolute left-6 p-3 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-[110]"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              className="absolute right-6 p-3 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-[110]"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Content Container */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <Skeleton className="w-full max-w-2xl aspect-video rounded-xl bg-white/10" />
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3 z-10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <X className="h-8 w-8 text-white/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">Failed to load image</p>
                <p className="text-xs text-white/40">The image URL could not be resolved</p>
              </div>
            </div>
          ) : (
            <motion.img
              key={currentImage}
              src={currentImage}
              alt="Preview"
              className="max-w-[90vw] max-h-[80vh] object-contain rounded shadow-2xl origin-center pointer-events-auto"
              style={{
                scale: zoom,
                rotate: `${rotation}deg`,
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              onClick={(e) => e.stopPropagation()}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.5}
            />
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
