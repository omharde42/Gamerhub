'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Search, MapPin, Building2, Clock, DollarSign, Bookmark, Send } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const { data: jobsData } = useQuery({ queryKey: ['jobs', search, typeFilter, gameFilter], queryFn: () => api.get(`/jobs?search=${search}&type=${typeFilter}&game=${gameFilter}`).then(r => r.data) });
  const saveMut = useMutation({ mutationFn: (jobId: string) => api.post(`/jobs/${jobId}/save`), onSuccess: () => toast.success('Job saved!') });

  return (<div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Jobs</h1><Link href="/jobs/post"><Button variant="default" className="gap-2"><Briefcase className="h-4 w-4" />Post a Job</Button></Link></div>
    <div className="flex flex-col md:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Job Type" /></SelectTrigger><SelectContent><SelectItem value="">All Types</SelectItem><SelectItem value="PLAYER">Player</SelectItem><SelectItem value="COACH">Coach</SelectItem><SelectItem value="ANALYST">Analyst</SelectItem><SelectItem value="MANAGER">Manager</SelectItem><SelectItem value="CASTER">Caster</SelectItem></SelectContent></Select><Select value={gameFilter} onValueChange={setGameFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Game" /></SelectTrigger><SelectContent><SelectItem value="">All Games</SelectItem><SelectItem value="Valorant">Valorant</SelectItem><SelectItem value="CS2">CS2</SelectItem><SelectItem value="League of Legends">League of Legends</SelectItem></SelectContent></Select></div>
    <div className="space-y-4">{jobsData?.data?.map((job: any, i: number) => (<motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><Card className="glass-card hover:border-gaming-purple/50 transition-all"><CardContent className="p-6"><div className="flex items-start justify-between"><div className="flex gap-4"><div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0"><Building2 className="h-6 w-6 text-muted-foreground" /></div><div><h3 className="font-semibold text-lg">{job.title}</h3><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.organization?.name}</span>{job.organization?.verified && <Badge variant="success" className="text-[10px] px-1">Verified</Badge>}</div></div></div><Button variant="ghost" size="icon" onClick={() => saveMut.mutate(job.id)}><Bookmark className="h-4 w-4" /></Button></div><p className="text-sm text-muted-foreground mt-3 line-clamp-2">{job.description}</p><div className="flex flex-wrap gap-3 mt-4 text-sm"><Badge variant="outline">{job.type}</Badge>{job.game && <Badge variant="secondary">{job.game}</Badge>}{job.location && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{job.location}</span>}{job.salary && <span className="flex items-center gap-1 text-muted-foreground"><DollarSign className="h-3 w-3" />{job.salary}</span>}<span className="flex items-center gap-1 text-muted-foreground ml-auto"><Clock className="h-3 w-3" />{formatRelativeTime(job.createdAt)}</span></div><div className="flex gap-2 mt-4"><Link href={`/jobs/${job.id}/apply`}><Button size="sm" variant="default" className="gap-1"><Send className="h-3 w-3" />Apply Now</Button></Link><Button size="sm" variant="outline">View Details</Button></div></CardContent></Card></motion.div>))}</div></div>);
}
