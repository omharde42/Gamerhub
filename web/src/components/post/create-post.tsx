'use client';
import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ImagePlus, Video, BarChart3, Send, X, Loader2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface CreatePostProps {
  isFullScreen?: boolean;
  onClose?: () => void;
}

export function CreatePost({ isFullScreen = false, onClose }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [media, setMedia] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'FRIENDS' | 'COMMUNITY'>('PUBLIC');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPost = useMutation({
    mutationFn: () => api.post('/posts', {
      content, tags,
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
      toast.success('Posted to the community!');
      onClose?.();
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

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localThumbnails, setLocalThumbnails] = useState<Record<string, string>>({});

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.onloadeddata = () => { video.currentTime = 1; };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          resolve('');
        }
        URL.revokeObjectURL(objectUrl);
      };
      video.onerror = () => { resolve(''); URL.revokeObjectURL(objectUrl); };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      setUploadProgress(0);
      const toastId = toast.loading('Uploading media to network...');
      try {
        let localThumb = '';
        if (file.type.startsWith('video/')) {
          localThumb = await generateVideoThumbnail(file);
        }

        const fd = new FormData();
        fd.append('media', file);
        const { data } = await api.post('/posts/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          }
        });
        const url = data.data.urls[0];
        setMedia([...media, url]);
        if (localThumb) {
          setLocalThumbnails(prev => ({ ...prev, [url]: localThumb }));
        }
        toast.success('Media uploaded successfully!', { id: toastId });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to upload media', { id: toastId });
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const addPollOption = () => { if (pollOptions.length < 5) setPollOptions([...pollOptions, '']); };

  const mainFormContent = (
    <div className="space-y-4">
      {/* User Header & Privacy Selector */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-border shrink-0">
          <AvatarImage src={user?.profile?.avatar || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(user?.profile?.username || 'U')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-bold text-foreground">
            {user?.profile?.displayName || user?.profile?.username}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <select
              value={privacy}
              onChange={(e: any) => setPrivacy(e.target.value)}
              className="text-[11px] bg-muted/50 border border-border/40 text-muted-foreground rounded-lg px-2 py-0.5 focus:outline-none"
            >
              <option value="PUBLIC">🌐 Public</option>
              <option value="FRIENDS">👥 Friends</option>
              <option value="COMMUNITY">🎮 Community</option>
            </select>
          </div>
        </div>
      </div>

      {/* Large Text Area */}
      <Textarea
        placeholder="Share something with the gaming community..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`w-full resize-none border-0 bg-muted/20 rounded-2xl p-4 text-base focus-visible:ring-1 focus-visible:ring-primary/20 ${
          isFullScreen ? 'min-h-[160px]' : 'min-h-[100px]'
        }`}
        autoFocus={isFullScreen}
      />

      {uploading && (
        <div className="space-y-1.5 px-1 py-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading to network...</span>
            <span className="font-semibold text-primary">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1 bg-primary/10" />
        </div>
      )}

      {/* Media Previews */}
      {media.length > 0 && (
        <motion.div className="flex gap-2 flex-wrap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {media.map((url, i) => {
            const isVideoFile = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video/upload/') || url.startsWith('data:video/') || url.startsWith('blob:');
            const thumb = localThumbnails[url] || (url.includes('/video/upload/') ? url.replace(/\/video\/upload\/(v\d+\/)?/, '/video/upload/c_limit,w_100,h_100/').replace(/\.[^/.]+$/, '.jpg') : null);
            return (
              <div key={i} className="relative group">
                {isVideoFile ? (
                  <div className="h-24 w-24 rounded-xl overflow-hidden relative border border-border bg-black flex items-center justify-center shadow-sm">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <video src={url} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Video className="h-6 w-6 text-white/90" />
                    </div>
                  </div>
                ) : (
                  <img src={url} alt="" className="h-24 w-24 rounded-xl object-cover border border-border shadow-sm" />
                )}
                <button
                  onClick={() => setMedia(media.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Poll Creation Box */}
      {showPoll && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2.5 bg-muted/30 rounded-2xl p-4 border border-border/50">
          <Input
            placeholder="Ask a poll question..."
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            className="text-sm font-semibold border-0 bg-background/60 rounded-xl"
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
                className="text-sm flex-1 border-0 bg-background/60 rounded-xl"
              />
              {pollOptions.length > 2 && (
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary font-medium" onClick={addPollOption}>+ Add option</Button>
          )}
        </motion.div>
      )}

      {/* Tag Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="gap-1 text-xs px-2.5 py-1 rounded-lg">
            #{tag}
            <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="text-xs ml-0.5 hover:text-destructive">&times;</button>
          </Badge>
        ))}
      </div>
    </div>
  );

  // Full Screen Mobile Page view
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col h-dvh w-full overflow-hidden">
        {/* Full Screen Top Header */}
        <div className="shrink-0 h-14 border-b border-border/40 px-4 flex items-center justify-between bg-card/40 backdrop-blur-md">
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="font-bold text-base text-foreground">Create Post</h2>
          <Button
            variant="gradient"
            size="sm"
            disabled={(!content.trim() && !media.length && !showPoll) || createPost.isPending || uploading}
            onClick={() => createPost.mutate()}
            className="h-9 px-5 font-bold rounded-xl gap-1.5"
            animate
          >
            {createPost.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </Button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mainFormContent}
        </div>

        {/* Fixed Action Toolbar at Bottom */}
        <div className="shrink-0 border-t border-border/40 p-3 bg-card/60 backdrop-blur-md flex items-center justify-around gap-2">
          <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <Button
            variant="outline"
            size="sm"
            className="h-10 text-xs rounded-xl gap-1.5 flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="h-4 w-4 text-emerald-400" /> Photo/Video
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`h-10 text-xs rounded-xl gap-1.5 flex-1 ${showPoll ? 'border-primary text-primary bg-primary/10' : ''}`}
            onClick={() => setShowPoll(!showPoll)}
            disabled={uploading}
          >
            <BarChart3 className="h-4 w-4 text-purple-400" /> Poll
          </Button>
          <div className="flex items-center gap-1">
            <Input
              placeholder="#tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="h-10 w-20 text-xs rounded-xl border-border/40"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              disabled={uploading}
            />
          </div>
        </div>
      </div>
    );
  }

  // Card view (Desktop / embedded feed)
  return (
    <Card variant="glass">
      <CardContent className="p-4">
        {mainFormContent}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/30 mt-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-8 px-2 text-xs shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <ImagePlus className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Media
            </Button>
            
            <div className="flex items-center gap-1 shrink-0">
              <Input
                placeholder="Media URL"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="h-8 w-20 text-[11px] border-0 bg-muted/30 px-2"
                onKeyDown={(e) => e.key === 'Enter' && addMedia()}
                disabled={uploading}
              />
              <Button variant="ghost" size="icon" className="h-8 w-6" onClick={addMedia} disabled={uploading}>+</Button>
            </div>

            <Button variant="ghost" size="sm" className={`text-muted-foreground hover:text-primary h-8 px-2 text-xs shrink-0 ${showPoll ? 'text-primary' : ''}`} onClick={() => setShowPoll(!showPoll)} disabled={uploading}>
              <BarChart3 className="h-3.5 w-3.5 mr-1 text-purple-400" /> Poll
            </Button>

            <div className="flex items-center gap-1 shrink-0">
              <Input
                placeholder="#tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="h-8 w-16 text-[11px] border-0 bg-muted/30 px-2"
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                disabled={uploading}
              />
            </div>
          </div>

          <Button
            variant="gradient"
            size="sm"
            disabled={(!content.trim() && !media.length && !showPoll) || createPost.isPending || uploading}
            onClick={() => createPost.mutate()}
            className="gap-2 w-full sm:w-auto h-9 font-bold"
            animate
          >
            {createPost.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

