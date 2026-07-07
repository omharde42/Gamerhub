'use client';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Building2, MapPin, Globe, Users, Briefcase, Trophy, Verified } from 'lucide-react';
import Link from 'next/link';

export default function OrganizationDetailPage() {
  const { slug } = useParams();
  const { data: org, isLoading } = useQuery({ queryKey: ['organization', slug], queryFn: () => api.get(`/organizations/${slug}`).then(r => r.data.data) });
  if (isLoading) return <div className="max-w-4xl mx-auto space-y-6"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
  if (!org) return <div className="text-center py-20"><h2>Organization not found</h2></div>;
  return (<div className="max-w-4xl mx-auto space-y-6">
    <Card className="glass-card overflow-hidden"><div className="h-32 bg-gradient-to-r from-gaming-purple to-gaming-pink" /><CardContent className="px-6 pb-6 -mt-12"><div className="flex flex-col md:flex-row md:items-end gap-4 mb-4"><div className="w-20 h-20 rounded-2xl bg-background border-4 border-background flex items-center justify-center text-3xl font-bold shadow-xl">{org.name?.charAt(0)}</div><div className="flex-1"><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{org.name}</h1>{org.verified && <Badge variant="success"><Verified className="h-3 w-3 mr-1" />Verified</Badge>}</div><div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">{org.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{org.location}</span>}{org.website && <a href={org.website} target="_blank" className="flex items-center gap-1 hover:text-primary"><Globe className="h-3 w-3" />Website</a>}</div></div><Button variant="outline">Contact</Button></div>{org.description && <p className="text-sm text-muted-foreground">{org.description}</p>}</CardContent></Card>
    <Tabs defaultValue="about"><TabsList><TabsTrigger value="about">About</TabsTrigger><TabsTrigger value="members"><Users className="h-4 w-4 mr-1" />Members</TabsTrigger><TabsTrigger value="jobs"><Briefcase className="h-4 w-4 mr-1" />Jobs</TabsTrigger><TabsTrigger value="tournaments"><Trophy className="h-4 w-4 mr-1" />Tournaments</TabsTrigger></TabsList>
      <TabsContent value="members"><Card className="glass-card"><CardContent className="p-6"><div className="grid md:grid-cols-2 gap-4">{org.members?.map((m: any, i: number) => (<div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border"><Avatar className="h-10 w-10"><AvatarImage src={m.user?.profile?.avatar || ''} /><AvatarFallback>{m.user?.profile?.username?.charAt(0)}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{m.user?.profile?.username}</p><Badge variant="outline" className="text-xs">{m.role}</Badge></div></div>))}</div></CardContent></Card></TabsContent>
      <TabsContent value="jobs"><Card className="glass-card"><CardContent className="p-6 text-center text-muted-foreground">Jobs from this organization will appear here</CardContent></Card></TabsContent>
      <TabsContent value="tournaments"><Card className="glass-card"><CardContent className="p-6 text-center text-muted-foreground">Tournaments hosted by this organization will appear here</CardContent></Card></TabsContent>
    </Tabs>
  </div>);
}
