'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface GameConnectFormProps {
  gameKey: string;
  placeholder: string;
  fieldName?: string;
  gameLabel: string;
  accent?: 'blue' | 'red' | 'amber' | 'emerald';
}

const ACCENT_STYLES = {
  blue: { border: 'border-blue-500/40', focus: 'focus:border-blue-500', button: 'from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500', text: 'text-blue-300' },
  red: { border: 'border-red-500/40', focus: 'focus:border-red-500', button: 'from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500', text: 'text-red-300' },
  amber: { border: 'border-amber-500/40', focus: 'focus:border-amber-500', button: 'from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500', text: 'text-amber-300' },
  emerald: { border: 'border-emerald-500/40', focus: 'focus:border-emerald-500', button: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500', text: 'text-emerald-300' },
};

export function GameConnectForm({ gameKey, placeholder, fieldName = 'uid', gameLabel, accent = 'emerald' }: GameConnectFormProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const style = ACCENT_STYLES[accent];

  const connectMutation = useMutation({
    mutationFn: async (input: string) => {
      const res = await api.post(`/game/${gameKey}/connect`, { [fieldName]: input });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`${gameLabel} Connected!`);
      queryClient.invalidateQueries({ queryKey: ['user-game-connections'] });
      queryClient.invalidateQueries({ queryKey: ['game-profile', gameKey] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || `Failed to connect ${gameLabel}. Please check your ID.`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.error(`Please enter your ${gameLabel} ID`);
      return;
    }
    connectMutation.mutate(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
      <div className="flex items-center gap-2">
        <Link className={`h-5 w-5 ${style.text}`} />
        <h4 className="font-extrabold text-sm text-white">Connect your {gameLabel} account</h4>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-300">{gameLabel} ID</label>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`bg-black/80 ${style.border} ${style.focus} text-white font-mono text-sm placeholder:text-gray-500 h-11`}
        />
      </div>
      {gameKey === 'valorant' && (
        <div className="pt-2 pb-1 border-t border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">Official Riot Sign-On (RSO)</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
              App ID: 871157 • RSO Ready
            </span>
          </div>
          <Button
            type="button"
            onClick={() => {
              // External OAuth redirect to the backend's Riot Sign-On endpoint —
              // full navigation is required (the browser must leave the app).
              window.location.href = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/auth/riot';
            }}
            className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold rounded-xl h-11 gap-2 shadow-lg"
          >
            <Link className="h-4 w-4" /> Connect with Riot Sign On
          </Button>
        </div>
      )}
      <Button
        type="submit"
        disabled={connectMutation.isPending}
        className={`bg-gradient-to-r ${style.button} text-white font-extrabold px-6 rounded-xl h-10 gap-2`}
      >
        {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
        {connectMutation.isPending ? 'Connecting...' : 'Connect'}
      </Button>
    </form>
  );
}
