'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ExternalLink, RefreshCw, Newspaper, Sparkles, Loader2, Search, Globe, Zap, ChevronRight, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

// NOTE: There is intentionally NO fabricated fallback news list here.
// When the live feed is unavailable the page renders a clear empty state
// with a retry action instead of showing invented headlines.

export default function NewsPage() {
  const [search, setSearch] = useState('');

  const { data: apiNews, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.get('/news').then(r => r.data.data).catch(() => null),
    refetchInterval: 300000, // refresh at most every 5 minutes - no spam
  });

  // `null` => the request itself failed; `[]` => sources returned nothing.
  const fetchFailed = isError || (Array.isArray(apiNews) && apiNews.length === 0 && !isLoading);
  const news = Array.isArray(apiNews) ? apiNews : [];

  const { data: aiSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-news-summary'],
    queryFn: () => api.post('/ai/summarize-news', { articles: news || [] }).then(r => r.data.data).catch(() => null),
    enabled: !!news && news.length > 0,
  });

  const filteredNews = news?.filter((item: any) =>
    !search || item.title?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="w-full space-y-6">
      <motion.div className="flex items-center justify-between flex-wrap gap-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Gaming News</h1>
            <p className="text-xs text-muted-foreground">Latest esports and gaming headlines</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground border-border/50">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {news?.length || 0} Stories
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </motion.div>

      {aiSummary?.summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/60 bg-muted/15 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary animate-twinkle" />
                <h3 className="font-semibold text-sm text-foreground">AI News Summary</h3>
                {summaryLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{aiSummary.summary}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!fetchFailed && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 bg-muted/10 border-border/80 focus-visible:ring-primary/30"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : fetchFailed ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold mb-1">News is temporarily unavailable</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            We could not reach the news sources right now. Please try again in a moment - we never show made-up stories.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Try Again
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredNews.map((item: any, i: number) => (
            <motion.div
              key={item.url || i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group h-full">
                <Card variant="glass" className="h-full border-border/60 hover:border-border/80 shadow-sm transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 h-full">
                      <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 border border-border/40 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <Globe className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">{item.source}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Read story</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && !fetchFailed && filteredNews.length === 0 && news.length > 0 && (
        <div className="text-center py-16">
          <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-1">No news found</h3>
          <p className="text-sm text-muted-foreground">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
