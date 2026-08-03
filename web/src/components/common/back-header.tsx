'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackHeaderProps {
  title?: string;
  onBack?: () => void;
  className?: string;
}

export function BackHeader({ title, onBack, className }: BackHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={`flex items-center gap-2 h-14 px-3 border-b border-border/40 bg-card/30 shrink-0 ${className || ''}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="h-11 w-11 rounded-full shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 focus:ring-1 focus:ring-primary/30"
        aria-label="Navigate back"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      {title && (
        <span className="font-heading font-extrabold text-sm tracking-tight truncate max-w-[200px] text-foreground">
          {title}
        </span>
      )}
    </div>
  );
}
