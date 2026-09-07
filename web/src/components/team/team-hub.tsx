'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Swords, Clock, Settings, Crown, Shield, UserMinus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getInitials, getMediaUrl } from '@/lib/utils';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface TeamMember {
  id: string;
  userId: string;
  role: 'captain' | 'co-captain' | 'member' | 'substitute';
  user: {
    id: string;
    profile: {
      username: string;
      displayName: string;
      avatar?: string;
    };
  };
  joinedAt: string;
}

interface Scrim {
  id: string;
  opponentName: string;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  result?: 'win' | 'loss' | 'draw';
  score?: string;
}

export function TeamHub({ teamId }: { teamId: string }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => api.get(`/teams/${teamId}`).then((r) => r.data.data),
    enabled: !!teamId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => api.get(`/teams/${teamId}/members`).then((r) => r.data.data || []),
    enabled: !!teamId,
  });

  const { data: scrims = [] } = useQuery({
    queryKey: ['team-scrims', teamId],
    queryFn: () => api.get(`/teams/${teamId}/scrims`).then((r) => r.data.data || []).catch(() => []),
    enabled: !!teamId,
  });

  const isCaptain = members.some(
    (m: TeamMember) => m.userId === user?.id && (m.role === 'captain' || m.role === 'co-captain')
  );

  const roleColors: Record<string, string> = {
    captain: 'text-yellow-400',
    'co-captain': 'text-blue-400',
    member: 'text-muted-foreground',
    substitute: 'text-muted-foreground/60',
  };

  const roleIcons: Record<string, any> = {
    captain: Crown,
    'co-captain': Shield,
    member: Users,
    substitute: Clock,
  };

  return (
    <Tabs defaultValue="roster" className="space-y-4">
      <TabsList>
        <TabsTrigger value="roster" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Roster
        </TabsTrigger>
        <TabsTrigger value="scrims" className="gap-1.5">
          <Swords className="h-3.5 w-3.5" />
          Scrims
        </TabsTrigger>
        {isCaptain && (
          <TabsTrigger value="manage" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Manage
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="roster" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
          {isCaptain && (
            <Button size="sm" variant="outline" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Invite
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {members.map((member: TeamMember, i: number) => {
            const RoleIcon = roleIcons[member.role] || Users;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card variant="glass" hover={false}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getMediaUrl(member.user.profile.avatar)} />
                      <AvatarFallback>{getInitials(member.user.profile.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.user.profile.displayName}</p>
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className={`h-3 w-3 ${roleColors[member.role]}`} />
                        <span className={`text-xs capitalize ${roleColors[member.role]}`}>
                          {member.role.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    {isCaptain && member.userId !== user?.id && member.role !== 'captain' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="scrims" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Upcoming & recent scrims</p>
          {isCaptain && (
            <Button size="sm" variant="outline" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Schedule
            </Button>
          )}
        </div>
        {scrims.length === 0 ? (
          <Card variant="glass" hover={false}>
            <CardContent className="p-8 text-center">
              <Swords className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No scrims scheduled yet</p>
            </CardContent>
          </Card>
        ) : (
          scrims.map((scrim: Scrim) => (
            <Card key={scrim.id} variant="glass" hover={false}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">vs {scrim.opponentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(scrim.scheduledAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {scrim.score && <Badge variant="outline">{scrim.score}</Badge>}
                  <Badge
                    variant={
                      scrim.result === 'win'
                        ? 'default'
                        : scrim.result === 'loss'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {scrim.status === 'completed'
                      ? scrim.result?.toUpperCase()
                      : scrim.status.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      {isCaptain && (
        <TabsContent value="manage" className="space-y-3">
          <Card variant="glass" hover={false}>
            <CardHeader>
              <CardTitle className="text-base">Team Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Edit Team Info
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" />
                Availability Grid
              </Button>
              <Button variant="destructive" className="w-full justify-start gap-2">
                <UserMinus className="h-4 w-4" />
                Disband Team
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
