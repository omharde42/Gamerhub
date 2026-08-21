'use client';

import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  variant?: 'error' | 'network' | 'not-found';
}

export function ErrorState({
  title,
  description,
  icon,
  action,
  variant = 'error',
}: ErrorStateProps) {
  const defaults = {
    error: {
      title: 'Something went wrong',
      description: 'An unexpected error occurred. Please try again.',
      icon: <AlertTriangle className="h-8 w-8 text-destructive" />,
    },
    network: {
      title: 'No connection',
      description: "You appear to be offline. Check your internet and retry.",
      icon: <WifiOff className="h-8 w-8 text-muted-foreground" />,
    },
    'not-found': {
      title: 'Not found',
      description: "The page you're looking for doesn't exist or has been moved.",
      icon: <AlertTriangle className="h-8 w-8 text-warning" />,
    },
  };

  const d = defaults[variant];

  return (
    <div className="min-h-[40vh] flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto">
          {icon || d.icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">{title || d.title}</h3>
          <p className="text-sm text-muted-foreground">{description || d.description}</p>
        </div>
        {action && (
          <Button onClick={action.onClick} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
