'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageBackButtonProps {
  fallbackHref?: string;
  className?: string;
  'aria-label'?: string;
}

export function PageBackButton({ fallbackHref = '/dashboard', className, ...props }: PageBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label={props['aria-label'] || 'Go back'}
      className={cn(
        'flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95 transition-all shrink-0',
        className
      )}
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );
}
