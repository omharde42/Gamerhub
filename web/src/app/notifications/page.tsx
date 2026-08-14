'use client';
import { useState } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Heart, MessageCircle, UserPlus, Trophy, Calendar, Briefcase, Flag, CheckCircle, Loader2, Swords, Ban, Check, Film } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BackHeader } from '@/components/common/back-header';

const NOTIFICATION_ICONS: Record<string, any> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  FOLLOW: UserPlus,
  TEAM_INVITE: Trophy,
  TOURNAMENT_START: Calendar,
  TOURNAMENT_RESULT: Trophy,
  JOB_APPLICATION: Briefcase,
  ACHIEVEMENT: Flag,
  SYSTEM: Bell,
  MATCH_FOUND: Trophy,
  CHALLENGE_RECEIVED: Swords,
  CHALLENGE_ACCEPTED: Swords,
  CHALLENGE_DECLINED: Swords,
  CHALLENGE_CANCELLED: Swords,
  CHALLENGE_EXPIRED: Swords,
  CHALLENGE_COMPLETED: Trophy,
  VIDEO_RENDER: Film,
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast.success('All marked as read');
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const filtered = tab === 'all' ? notifications : notifications?.filter((n: any) => n.type === tab.toUpperCase());

  // ── Challenge actions (Accept / Decline) ──────────────────────────
  const challengeAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) => api.post(`/challenges/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-counts'] });
      toast.success('Challenge updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-0 space-y-4">
      {/* Dynamic Back Header */}
      <BackHeader title="Notifications" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-400" />
            Inbox
          </h1>
          <p className="text-xs text-muted-foreground">Stay updated with your activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" onClick={() => markAllRead.mutate()}>
            <CheckCircle className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <Card variant="glass">
        <CardContent className="p-0">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="px-4 pt-4">
              <TabsList className="w-full bg-card/60 border border-white/10 p-1 rounded-2xl gap-1">
                <TabsTrigger value="all" className="flex-1 rounded-xl data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/50 font-bold">All</TabsTrigger>
                <TabsTrigger value="like" className="flex-1 rounded-xl data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/50 font-bold">Likes</TabsTrigger>
                <TabsTrigger value="comment" className="flex-1 rounded-xl data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/50 font-bold">Comments</TabsTrigger>
                <TabsTrigger value="follow" className="flex-1 rounded-xl data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/50 font-bold">Follows</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={tab} className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filtered?.length === 0 ? (
                <div className="py-8">
                  <EmptyState 
                    title="No notifications yet" 
                    description="You are all caught up! When you get invites or likes, they'll appear here." 
                    icon={Bell} 
                    actionText="Check Activities"
                    onAction={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
                  />
                </div>
              ) : (
                <div className="divide-y">
                  {filtered?.map((notif: any, i: number) => {
                    const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex items-start gap-3 p-4 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''} hover:bg-muted/50 cursor-pointer`}
                        onClick={() => { if (!notif.isRead) markRead.mutate(notif.id); }}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            {notif.link ? (
                              <Link href={notif.link} className="hover:underline">
                                {notif.title}
                              </Link>
                            ) : (
                              notif.title
                            )}
                          </p>
                          {notif.message && (
                            <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                          )}
                          {notif.type === 'CHALLENGE_RECEIVED' && notif.metadata?.challengeId && notif.metadata?.status === 'PENDING' && (
                            <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 gap-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500"
                                onClick={() => challengeAction.mutate({ id: notif.metadata.challengeId, action: 'accept' })}
                                disabled={challengeAction.isPending}
                              >
                                <Check className="h-3 w-3" /> Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-[10px] border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => challengeAction.mutate({ id: notif.metadata.challengeId, action: 'decline' })}
                                disabled={challengeAction.isPending}
                              >
                                <Ban className="h-3 w-3" /> Decline
                              </Button>
                              <Link href="/challenges" className="text-[10px] text-primary hover:underline font-semibold">
                                View all
                              </Link>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                        {notif.image && (
                          <img src={notif.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" decoding="async" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
