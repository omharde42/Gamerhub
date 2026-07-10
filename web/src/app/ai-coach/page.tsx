'use client';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Bot, Brain, Target, BookOpen, Sparkles, Loader2, BarChart3, MessageSquare, Send, User, Trophy, TrendingUp, Clock, Zap, Activity, ClipboardList, RefreshCw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AICoachPage() {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([{ role: 'assistant', content: "Hi! I'm your AI Coach. Ask me anything about improving your gameplay, building strategies, or finding teammates!" }]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const { data: analysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({ queryKey: ['ai-profile-analysis'], queryFn: () => api.get('/ai/profile-analysis').then(r => r.data.data).catch(() => null) });
  const { data: matchAnalysis, isLoading: matchLoading, refetch: refetchMatch } = useQuery({ queryKey: ['ai-match-analysis'], queryFn: () => api.get('/ai/match-analysis').then(r => r.data.data).catch(() => null) });
  const { data: trainingPlan, isLoading: planLoading, refetch: refetchPlan } = useQuery({ queryKey: ['ai-training-plan'], queryFn: () => api.get('/ai/training-plan').then(r => r.data.data).catch(() => null) });

  const chatMutation = useMutation({
    mutationFn: (body: { message: string; history: { role: string; content: string }[] }) =>
      api.post('/ai/chat', body).then(r => r.data.data),
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    },
    onError: () => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again!" }]);
    },
    onSettled: () => setIsTyping(false),
  });

  const sendMessage = () => {
    if (!message.trim() || chatMutation.isPending) return;
    const userMsg = message;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setMessage('');
    setIsTyping(true);
    chatMutation.mutate({ message: userMsg, history: chatHistory.slice(-20) });
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isTyping]);

  const quickActions = [
    { label: 'Improve Aim', prompt: 'How can I improve my aim?' },
    { label: 'Rank Up', prompt: 'Tips to rank up fast?' },
    { label: 'Game Strategy', prompt: 'Give me strategy tips' },
    { label: 'Find Teammates', prompt: 'How to find good teammates?' },
    { label: 'Practice Routine', prompt: 'Create a practice routine' },
    { label: 'VOD Review', prompt: 'How to review my VODs?' },
  ];

  return (
    <div className="w-full space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center shadow-lg shadow-gaming-purple/20 glow-purple">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Coach</h1>
            <p className="text-sm text-muted-foreground">Your personal gaming improvement assistant, powered by AI</p>
          </div>
        </div>
        <Badge variant="neon" className="gap-1.5 px-3 py-1.5 glow-sm">
          <Zap className="h-3.5 w-3.5" />
          {chatMutation.isPending ? 'Thinking...' : 'Online'}
        </Badge>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card variant="glass" hover={false} className="border-neon-cyan/20">
            <CardContent className="p-0">
              <Tabs defaultValue="chat" className="w-full">
                <div className="px-6 pt-4 border-b border-primary/20">
                  <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-2">
                    <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg transition-all"><MessageSquare className="h-4 w-4 mr-1.5" />Chat</TabsTrigger>
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"><BarChart3 className="h-4 w-4 mr-1.5" />Analysis</TabsTrigger>
                    <TabsTrigger value="plan" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"><BookOpen className="h-4 w-4 mr-1.5" />Training</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="chat" className="p-0 m-0">
                  <div className="h-[500px] flex flex-col">
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-4">
                        <AnimatePresence>
                          {chatHistory.map((msg, i) => (
                            <motion.div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                              {msg.role === 'assistant' ? (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center shrink-0 shadow-sm">
                                  <Bot className="h-4 w-4 text-white" />
                                </div>
                              ) : (
                                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/30">
                                  <AvatarImage src={user?.profile?.avatar || ''} />
                                  <AvatarFallback className="text-[10px]">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                                  msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md'
                                    : 'bg-muted/50 border border-primary/20 rounded-tl-sm'
                                }`}>
                                  {msg.content}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {isTyping && (
                          <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center shrink-0">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted/50 border border-primary/20">
                              {[0, 150, 300].map((delay, i) => (
                                <span key={i} className="w-2 h-2 bg-primary/60 rounded-full" style={{ animation: 'typing-dot 1.4s ease-in-out infinite', animationDelay: `${delay}ms` }} />
                              ))}
                            </div>
                          </motion.div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>
                    <div className="px-6 py-4 border-t border-primary/20 bg-muted/10">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {quickActions.map((action, i) => (
                          <motion.button
                            key={i}
                            onClick={() => { setMessage(action.prompt); }}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 text-muted-foreground border border-primary/20"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {action.label}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Ask your AI coach anything about gaming..."
                          className="flex-1 h-11 bg-muted/30 border-primary/30"
                          variant="neon"
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                          disabled={chatMutation.isPending}
                        />
                        <Button variant="gradient" onClick={sendMessage} disabled={!message.trim() || chatMutation.isPending} className="h-11 px-4 gap-1.5" animate>
                          {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="p-6 m-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Performance Analysis</h3>
                      <p className="text-xs text-muted-foreground">AI-powered breakdown of your gaming profile</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => { refetchAnalysis(); refetchMatch(); }}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-gaming-purple/5 to-transparent border-gaming-purple/30">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3"><Brain className="h-5 w-5 text-gaming-purple" /><h4 className="font-semibold text-sm">Profile Analysis</h4></div>
                        {analysisLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your profile...</div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis?.analysis || 'Complete your profile with games, rank, and stats for AI analysis.'}</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-gaming-cyan/5 to-transparent border-gaming-cyan/30">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3"><Target className="h-5 w-5 text-gaming-cyan" /><h4 className="font-semibold text-sm">Match Performance</h4></div>
                        {matchLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing matches...</div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{matchAnalysis?.analysis || 'Play more matches and connect your game accounts for detailed match analysis.'}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="plan" className="p-6 m-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Personalized Training Plan</h3>
                      <p className="text-xs text-muted-foreground">Custom drills and routines based on your skill level</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => refetchPlan()}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</Button>
                  </div>
                  {planLoading ? (
                    <Card><CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Generating your training plan...</CardContent></Card>
                  ) : (
                    <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/30">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3"><Activity className="h-5 w-5 text-success" /><h4 className="font-semibold text-sm">7-Day Training Plan</h4></div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{trainingPlan?.plan || 'Connect your game accounts and complete your profile to receive a personalized training plan tailored to your skill level and goals.'}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card variant="glass" className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span>Profile Completeness</span><span className="font-semibold">{user?.profile?.kd ? 75 : 35}%</span></div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-primary/20">
                  <motion.div className="h-full bg-gradient-to-r from-gaming-purple to-gaming-cyan rounded-full" initial={{ width: 0 }} animate={{ width: `${user?.profile?.kd ? 75 : 35}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span>Win Rate</span><span className="font-semibold">{user?.profile?.winRate || 0}%</span></div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-primary/20">
                  <motion.div className="h-full bg-gradient-to-r from-success/70 to-success rounded-full" initial={{ width: 0 }} animate={{ width: `${user?.profile?.winRate || 0}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span>K/D Ratio</span><span className="font-semibold">{user?.profile?.kd || 0}</span></div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-primary/20">
                  <motion.div className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min((user?.profile?.kd || 0) / 5 * 100, 100)}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Take a 5-min break every hour to maintain focus',
                'Review your last match before starting a new one',
                'Communicate with your team even with pings',
                'Master 2-3 agents/champions deeply',
                'Track your stats weekly to see improvement',
              ].map((tip, i) => (
                <motion.div key={i} className="flex items-start gap-2 text-xs text-muted-foreground" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{tip}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card variant="glass" className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Coaching Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-primary/20"><p className="text-lg font-bold text-primary">{chatHistory.filter(m => m.role === 'user').length}</p><p className="text-[10px] text-muted-foreground">Questions Asked</p></div>
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-primary/20"><p className="text-lg font-bold text-success">{user?.profile?.winRate || 0}%</p><p className="text-[10px] text-muted-foreground">Win Rate</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}