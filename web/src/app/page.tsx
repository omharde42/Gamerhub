'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gamepad2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function EnterPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/anon-login', { username: username.trim() });
      setUser(data.data.user);
      setTokens(data.data.accessToken, data.data.refreshToken);
      toast.success(`Welcome, ${data.data.profile?.username || username.trim()}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to join. Try another username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gaming-purple/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gaming-pink/20 rounded-full blur-[128px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gaming-purple/10 flex items-center justify-center">
              <Gamepad2 className="h-8 w-8 text-gaming-purple" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gradient">Welcome to GamerHub</h1>
            <p className="text-muted-foreground">Choose a username to get started</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 text-center text-lg"
                maxLength={30}
                autoFocus
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Pick a unique username — this will be your identity on GamerHub</p>
            </div>
            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full h-12 text-lg"
              disabled={loading || !username.trim()}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enter GamerHub'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}