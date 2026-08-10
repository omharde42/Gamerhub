'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Search, MapPin, Building2, Clock, DollarSign, Bookmark, Send, Sparkles, Shield } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

const FEATURED_JOBS = [
  {
    id: 'job-1',
    title: 'Head Coach - Valorant Pro Division',
    type: 'COACH',
    game: 'Valorant',
    location: 'Remote / Los Angeles',
    salary: '$75,000 - $110,000 / yr',
    description: 'Leading strategic roster prep, VOD analysis, and matchplay strategy for VCT Americas 2026 circuit.',
    organization: { name: 'Sentinels Esports', verified: true, avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'job-2',
    title: 'Esports Video Producer & Motion Designer',
    type: 'PRODUCER',
    game: 'CS2 & Esports',
    location: 'Berlin, Germany',
    salary: '€55,000 - €70,000 / yr',
    description: 'Creating high-energy frag movies, tournament promo teasers, and broadcast graphics overlays.',
    organization: { name: 'Fnatic Gaming', verified: true, avatar: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80' },
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'job-3',
    title: 'Senior 3D Character Artist',
    type: 'ARTIST',
    game: 'Unreal Engine 5',
    location: 'Remote (Worldwide)',
    salary: '$90,000 - $130,000 / yr',
    description: 'Modeling high-poly cybernetic character models, weapons skins, and procedural textures.',
    organization: { name: 'GamerZ Studio', verified: true, avatar: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=80' },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  
  const { data: jobsData } = useQuery({ 
    queryKey: ['jobs', search, typeFilter, gameFilter], 
    queryFn: () => api.get(`/jobs?search=${search}&type=${typeFilter}&game=${gameFilter}`).then(r => r.data) 
  });
  
  const saveMut = useMutation({ 
    mutationFn: (jobId: string) => api.post(`/jobs/${jobId}/save`), 
    onSuccess: () => toast.success('Job saved to your Passport!') 
  });

  const displayJobs = (jobsData?.data && jobsData.data.length > 0) ? jobsData.data : FEATURED_JOBS;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-400" />
            Esports Careers & Job Board
          </h1>
          <p className="text-xs text-muted-foreground">Find pro gaming contracts, coaching roles, design gigs, and studio jobs.</p>
        </div>

        <Link href="/jobs/post">
          <Button variant="gradient" size="sm" className="gap-2 text-sm font-extrabold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 h-10 px-4">
            <Briefcase className="h-4 w-4" /> Post a Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search job titles, skills, organizations..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10 h-10 rounded-2xl bg-card/60 border-white/10" 
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[160px] h-10 rounded-2xl bg-card/60 border-white/10">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent className="glass-popup border-emerald-500/30">
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="COACH">Coach</SelectItem>
            <SelectItem value="PRODUCER">Producer</SelectItem>
            <SelectItem value="ARTIST">Artist</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-full md:w-[160px] h-10 rounded-2xl bg-card/60 border-white/10">
            <SelectValue placeholder="Game" />
          </SelectTrigger>
          <SelectContent className="glass-popup border-emerald-500/30">
            <SelectItem value="">All Games</SelectItem>
            <SelectItem value="Valorant">Valorant</SelectItem>
            <SelectItem value="CS2">CS2</SelectItem>
            <SelectItem value="Unreal Engine">Unreal Engine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {displayJobs.map((job: any, i: number) => (
          <motion.div key={job.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card variant="glass" className="hover:border-emerald-500/50 transition-all rounded-[28px] overflow-hidden group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-md">
                      <Building2 className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-extrabold text-lg text-foreground truncate group-hover:text-emerald-400 transition-colors">{job.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-bold text-foreground">{job.organization?.name || 'Pro Organization'}</span>
                        {job.organization?.verified && (
                          <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-2 py-0.5 gap-1">
                            <Shield className="h-3 w-3 text-emerald-400" /> Verified Org
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-emerald-500/20 text-emerald-400 shrink-0" onClick={() => saveMut.mutate(job.id)} title="Save Job">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{job.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-2.5 py-1 font-bold">
                      {job.type}
                    </Badge>
                    {job.game && (
                      <Badge variant="secondary" className="text-[10px] font-mono bg-card text-slate-300 border border-white/10 px-2.5 py-1 font-bold">
                        {job.game}
                      </Badge>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" /> {job.location}
                      </span>
                    )}
                    {job.salary && (
                      <span className="flex items-center gap-1 font-bold text-emerald-400 font-mono">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> {job.salary}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mr-2">
                      <Clock className="h-3 w-3" /> {formatRelativeTime(job.createdAt)}
                    </span>
                    <Link href={`/jobs/${job.id}/apply`}>
                      <Button variant="gradient" size="sm" className="h-8 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md">
                        <Send className="h-3.5 w-3.5 mr-1" /> Quick Apply
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
