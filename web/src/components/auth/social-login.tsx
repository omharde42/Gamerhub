'use client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface SocialLoginProps {
  onGoogle?: () => void;
  onDiscord?: () => void;
  onSteam?: () => void;
  loading?: boolean;
}

export function SocialLogin({ onGoogle, onDiscord, onSteam, loading }: SocialLoginProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={onGoogle}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-xs">Google</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={onDiscord}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#5865F2">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
            <span className="text-xs">Discord</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={onSteam}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#171A21">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 2.03.6 3.92 1.64 5.5l3.76-1.56a3.24 3.24 0 0 1-.28-1.3c0-1.79 1.45-3.24 3.24-3.24.94 0 1.79.4 2.38 1.04l5.7-2.27A6.96 6.96 0 0 0 12 2zm7.96 9.72l-5.46 2.18c.07.25.11.52.11.79 0 1.79-1.45 3.24-3.24 3.24-.5 0-.97-.12-1.39-.32l-3.78 1.57A6 6 0 0 0 12 22c5.52 0 10-4.48 10-10 0-.87-.11-1.72-.32-2.53-.06-.25-.13-.5-.22-.75zM7.08 14.4l-2.48 1.02A5.96 5.96 0 0 0 6 18.4c.48.73 1.1 1.34 1.83 1.82l-.75-2.5a1.26 1.26 0 0 1-.7-.22 1.32 1.32 0 0 1-.5-1.43c.11-.35.33-.65.63-.85.29-.2.64-.28.99-.23.19.03.37.1.52.2l.75-2.5a4.73 4.73 0 0 0-2.29-.08zm1.8-1.31c-.65 0-1.18-.53-1.18-1.18s.53-1.18 1.18-1.18 1.18.53 1.18 1.18-.53 1.18-1.18 1.18zm3.72 5.72c1.37 0 2.48-1.11 2.48-2.48s-1.11-2.48-2.48-2.48-2.48 1.11-2.48 2.48 1.11 2.48 2.48 2.48z" />
            </svg>
            <span className="text-xs">Steam</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
