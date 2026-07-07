'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bot, Brain, Target, BookOpen, Sparkles, Loader2, BarChart3, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AICoachPage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([{ role: 'assistant', content: "Hi! I'm your AI Coach. I can help analyze your gameplay, create training plans, and give improvement tips. What would you like help with?" }]);
  const { data: analysis, isLoading: analysisLoading } = useQuery({ queryKey: ['ai-profile-analysis'], queryFn: () => api.get('/ai/profile-analysis').then(r => r.data.data).catch(() => null) });
  const { data: matchAnalysis, isLoading: matchLoading } = useQuery({ queryKey: ['ai-match-analysis'], queryFn: () => api.get('/ai/match-analysis').then(r => r.data.data).catch(() => null) });
  const { data: trainingPlan, isLoading: planLoading } = useQuery({ queryKey: ['ai-training-plan'], queryFn: () => api.get('/ai/training-plan').then(r => r.data.data).catch(() => null) });

  const sendMessage = () => { if (!message.trim()) return; setChatHistory([...chatHistory, { role: 'user', content: message }]); setMessage(''); setTimeout(() => { setChatHistory(prev => [...prev, { role: 'assistant', content: "Great question! Based on your profile, I recommend focusing on your aim training and game sense. Try spending 30 minutes daily in aim trainers, and review your VODs to identify positioning mistakes. Would you like a detailed training plan?" }]); }, 1000); };

  return (<div className="space-y-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center"><Bot className="h-6 w-6 text-white" /></div><div><h1 className="text-2xl font-bold">AI Coach</h1><p className="text-muted-foreground">Your personal gaming improvement assistant</p></div></div>

    <Tabs defaultValue="chat" className="w-full"><TabsList className="w-full justify-start"><TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1" />Chat</TabsTrigger><TabsTrigger value="analysis"><BarChart3 className="h-4 w-4 mr-1" />Analysis</TabsTrigger><TabsTrigger value="plan"><BookOpen className="h-4 w-4 mr-1" />Training Plan</TabsTrigger></TabsList>
      <TabsContent value="chat"><Card className="glass-card h-[500px] flex flex-col"><CardContent className="flex-1 p-4 overflow-y-auto space-y-4">{chatHistory.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}><p className="text-sm">{msg.content}</p></div></div>))}</CardContent><div className="p-4 border-t"><div className="flex gap-2"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask your AI coach anything..." className="min-h-[40px] max-h-[120px]" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())} /><Button variant="gradient" onClick={sendMessage} className="shrink-0"><Sparkles className="h-4 w-4" /></Button></div></div></Card></TabsContent>
      <TabsContent value="analysis"><div className="grid md:grid-cols-2 gap-6"><Card className="glass-card"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-gaming-purple" />Profile Analysis</CardTitle></CardHeader><CardContent>{analysisLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : <div className="text-sm whitespace-pre-wrap">{analysis?.analysis || 'Complete your profile for analysis'}</div>}</CardContent></Card><Card className="glass-card"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-gaming-blue" />Match Performance</CardTitle></CardHeader><CardContent>{matchLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : <div className="text-sm whitespace-pre-wrap">{matchAnalysis?.analysis || 'Play more matches for analysis'}</div>}</CardContent></Card></div></TabsContent>
      <TabsContent value="plan"><Card className="glass-card"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-green-500" />Personalized Training Plan</CardTitle></CardHeader><CardContent>{planLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : <div className="text-sm whitespace-pre-wrap">{trainingPlan?.plan || 'Set up your profile to get a training plan'}</div>}</CardContent></Card></TabsContent>
    </Tabs>
  </div>);
}
