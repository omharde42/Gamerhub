'use client';
import { useEffect, useState } from 'react';
import { Download, Sparkles, X, Shield, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const CURRENT_APP_VERSION = '1.0.0';

export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(latest);
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parse(current);

  if (lMajor !== cMajor) return lMajor > cMajor;
  if (lMinor !== cMinor) return lMinor > cMinor;
  return lPatch > cPatch;
}

export function UpdateChecker() {
  const [updateData, setUpdateData] = useState<{
    latestVersion: string;
    apkUrl: string;
    releaseNotes: string[];
    isForceUpdate?: boolean;
    minSupportedVersion?: string;
  } | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const { data } = await api.get('/app/version');
        const info = data.data;

        if (info && info.latestVersion && isNewerVersion(info.latestVersion, CURRENT_APP_VERSION)) {
          setUpdateData(info);
          
          // Check if user dismissed optional update in this session
          const dismissedVersion = sessionStorage.getItem('dismissed_update_version');
          if (!info.isForceUpdate && dismissedVersion === info.latestVersion) {
            return;
          }
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('App version check failed:', err);
      }
    };

    checkVersion();
  }, []);

  if (!isOpen || !updateData) return null;

  const handleUpdate = () => {
    if (updateData.apkUrl) {
      window.open(updateData.apkUrl, '_blank');
    }
  };

  const handleDismiss = () => {
    if (updateData.latestVersion) {
      sessionStorage.setItem('dismissed_update_version', updateData.latestVersion);
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card border border-primary/30 p-6 shadow-2xl space-y-5"
        >
          {/* Top Gradient Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-gaming-cyan to-primary" />

          {/* Dismiss button */}
          {!updateData.isForceUpdate && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-start gap-4 pt-1">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">New GamerHub Update Available</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A newer version of GamerHub is available with new features, improvements, and bug fixes.
              </p>
            </div>
          </div>

          {/* Version Badge Row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Installed:</span>
              <Badge variant="outline" className="font-mono text-[11px] bg-background">
                v{CURRENT_APP_VERSION}
              </Badge>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Latest:</span>
              <Badge variant="default" className="font-mono text-[11px] bg-primary text-primary-foreground font-bold">
                v{updateData.latestVersion}
              </Badge>
            </div>
          </div>

          {/* Release Notes */}
          {updateData.releaseNotes && updateData.releaseNotes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-gaming-cyan" /> What's New:
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-background border border-border/40 text-xs text-muted-foreground scrollbar-thin">
                {updateData.releaseNotes.map((note, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-primary font-bold select-none">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {!updateData.isForceUpdate && (
              <Button
                variant="outline"
                className="flex-1 text-xs h-10 border-border/60 hover:bg-muted"
                onClick={handleDismiss}
              >
                Later
              </Button>
            )}
            <Button
              className="flex-1 text-xs h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 gap-2"
              onClick={handleUpdate}
            >
              <Download className="h-4 w-4" /> Update Now
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
