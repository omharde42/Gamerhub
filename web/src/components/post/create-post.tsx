'use client';
import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ImagePlus, Video, BarChart3, Send, X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

export function CreatePost() {
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [media, setMedia] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPost = useMutation({
    mutationFn: () => api.post('/posts', {
      content,
      tags,
      media: media.length > 0 ? media : undefined,
      type: media.length > 0 ? 'CLIP' : 'POST',
      poll: showPoll && pollQuestion && pollOptions.filter(Boolean).length >= 2 ? {
        question: pollQuestion,
        options: pollOptions.filter(Boolean),
      } : undefined,
    }),
    onSuccess: () => {
      setContent(''); setTags([]); setMedia([]); setShowPoll(false); setPollQuestion(''); setPollOptions(['', '']);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Posted!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to post'),
  });

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(''); }
  };

  const addMedia = () => {
    if (mediaUrl.trim()) { setMedia([...media, mediaUrl.trim()]); setMediaUrl(''); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMedia([...media, url]);
    }
  };

  const addPollOption = () => { if (pollOptions.length < 5) setPollOptions([...pollOptions, '']); };

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-border shrink-0">
            <AvatarImage src={user?.profile?.avatar || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(user?.profile?.username || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Share something with the gaming community..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-0 bg-muted/50 rounded-xl p-3 text-sm"
            />

            {media.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {media.map((url, i) => (
                  <div key={i} className="relative group">
                    {url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={url} className="h-20 w-20 rounded-lg object-cover" />
                    ) : (
                      <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    )}
                    <button
                      onClick={() => setMedia(media.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showPoll && (
              <div className="space-y-2 bg-muted/30 rounded-xl p-3">
                <Input
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="text-sm"
                />
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      className="text-sm flex-1"
                    />
                    {pollOptions.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={addPollOption}>+ Add option</Button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="gap-1 text-xs">
                  #{tag}
                  <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="text-xs ml-0.5 hover:text-destructive">&times;</button>
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-1" /> Media
                </Button>
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="Media URL"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="h-8 w-24 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && addMedia()}
                  />
                  <Button variant="ghost" size="sm" className="h-8" onClick={addMedia}>+</Button>
                </div>
                <Button variant="ghost" size="sm" className={`text-muted-foreground ${showPoll ? 'text-primary' : ''}`} onClick={() => setShowPoll(!showPoll)}>
                  <BarChart3 className="h-4 w-4 mr-1" /> Poll
                </Button>
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="#tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="h-8 w-20 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  />
                </div>
              </div>
              <Button
                variant="gradient"
                size="sm"
                disabled={!content.trim() || createPost.isPending}
                onClick={() => createPost.mutate()}
                className="gap-2"
              >
                {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
