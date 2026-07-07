'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { ReactNode, useState } from 'react';
export function Providers({ children }: { children: ReactNode }) { const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1, refetchOnWindowFocus: false } } })); return (<QueryClientProvider client={queryClient}><ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}><Toaster position="top-right" toastOptions={{ style: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }, duration: 4000 }} />{children}</ThemeProvider></QueryClientProvider>); }
