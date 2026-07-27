'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
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
import { useKeyboard, scrollInputIntoView } from '@/hooks/useKeyboard';

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
    mutationFn: () => {
      const hasVideo = media.some(m => m.match(/\.(mp4|webm|ogg|mov)$/i) || m.includes('/video/'));
      const postType = showPoll ? 'POLL' : hasVideo ? 'VIDEO' : 'POST';
      return api.post('/posts', {
        content: content.trim(),
        tags,
        media: media.length > 0 ? media : undefined,
        type: postType,
        poll: showPoll && pollQuestion && pollOptions.filter(Boolean).length >= 2 ? {
          question: pollQuestion,
          options: pollOptions.filter(Boolean),
        } : undefined,
      });
    },
    onSuccess: () => {
      setContent(''); setTags([]); setMedia([]); setShowPoll(false); setPollQuestion(''); setPollOptions(['', '']);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Posted to the community!');
      onClose?.();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create post. Please try again.';
      toast.error(msg);
    },
  });

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(''); }
  };

  const addMedia = () => {
    if (mediaUrl.trim()) { setMedia([...media, mediaUrl.trim()]); setMediaUrl(''); }
  };

  const { keyboardHeight, isKeyboardOpen } = useKeyboard();
  const contentBodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaFocus = useCallback(() => {
    scrollInputIntoView(textareaRef.current);
  }, []);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localThumbnails, setLocalThumbnails] = useState<Record<string, string>>({});
  const [videoMeta, setVideoMeta] = useState<Record<string, { duration: number; width: number; height: number }>>({});
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => {
        try { URL.revokeObjectURL(url); } catch {}
      });
      blobUrlsRef.current.clear();
    };
  }, []);

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

  const getVideoMetadata = (file: File): Promise<{ duration: number; width: number; height: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(objectUrl);
      };
      video.onerror = () => { resolve({ duration: 0, width: 0, height: 0 }); URL.revokeObjectURL(objectUrl); };
    });
  };

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isAllowedImage = /image\/(jpeg|jpg|png|gif|webp)/i.test(file.type) || /\.(jpeg|jpg|png|gif|webp)$/i.test(file.name);

    if (!isVideo && !isAllowedImage) {
      toast.error('Unsupported file type. Allowed: JPG, PNG, GIF, WEBP.');
      if (e.target) e.target.value = '';
      return;
    }

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    if (!isVideo && file.size > MAX_IMAGE_SIZE) {
      toast.error('Image exceeds the maximum size (10 MB).');
      if (e.target) e.target.value = '';
      return;
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      toast.error('Video exceeds maximum size of 50 MB.');
      if (e.target) e.target.value = '';
      return;
    }

    // 1. Instant local preview
    const localUrl = URL.createObjectURL(file);
    blobUrlsRef.current.add(localUrl);

    // Immediately show local preview in UI
    setMedia(prev => [...prev, localUrl]);

    if (isVideo) {
      const meta = await getVideoMetadata(file);
      if (meta.duration === 0) {
        toast.error('Could not read video file. Try a different file.');
        setMedia(prev => prev.filter(m => m !== localUrl));
        URL.revokeObjectURL(localUrl);
        blobUrlsRef.current.delete(localUrl);
        if (e.target) e.target.value = '';
        return;
      }
      setVideoMeta(prev => ({ ...prev, [localUrl]: meta }));
      const localThumb = await generateVideoThumbnail(file);
      if (localThumb) setLocalThumbnails(prev => ({ ...prev, [localUrl]: localThumb }));
    }

    setUploading(true);
    setUploadProgress(0);
    const toastId = toast.loading(isVideo ? 'Uploading video...' : 'Uploading image...');

    try {
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

      const serverUrl = data?.data?.urls?.[0];
      if (!serverUrl) {
        throw new Error('Upload succeeded but server did not return a valid URL.');
      }

      // Replace local preview URL with the server public URL
      setMedia(prev => prev.map(m => (m === localUrl ? serverUrl : m)));

      if (localThumbnails[localUrl]) {
        setLocalThumbnails(prev => {
          const next: Record<string, string> = { ...prev, [serverUrl]: prev[localUrl] };
          delete next[localUrl];
          return next;
        });
      }

      toast.success(isVideo ? 'Video uploaded successfully!' : 'Image uploaded successfully!', { id: toastId });
    } catch (err: any) {
      // Remove failed local preview item on error
      setMedia(prev => prev.filter(m => m !== localUrl));
      const msg = err.response?.data?.message || err.message || 'Unable to upload image. Please try again.';
      toast.error(msg, { id: toastId });
    } finally {
      URL.revokeObjectURL(localUrl);
      blobUrlsRef.current.delete(localUrl);
      setUploading(false);
      setUploadProgress(0);
      if (e.target) e.target.value = '';
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
        ref={textareaRef as any}
        placeholder="Share something with the gaming community..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={handleTextareaFocus}
        className={`w-full resize-none rounded-2xl p-4 text-base focus-visible:ring-1 focus-visible:ring-primary/20 ${
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
        <motion.div className="flex gap-3 flex-wrap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {media.map((url, i) => {
            const isVideoFile = url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) || url.includes('/video/upload/') || url.startsWith('data:video/') || url.startsWith('blob:');
            const thumb = localThumbnails[url] || (url.includes('/video/upload/') ? url.replace(/\/video\/upload\/(v\d+\/)?/, '/video/upload/c_limit,w_100,h_100/').replace(/\.[^/.]+$/, '.jpg') : null);
            const meta = videoMeta[url];
            return (
              <div key={i} className="relative group">
                {isVideoFile ? (
                  <div className="w-32 h-24 rounded-xl overflow-hidden relative border border-border bg-black flex items-center justify-center shadow-sm cursor-pointer group/vid">
                    {thumb ? (
                      <img src={thumb} alt="Video preview" className="h-full w-full object-cover" />
                    ) : (
                      <video src={url} className="h-full w-full object-cover" />
                    )}
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/vid:bg-black/40 transition-all">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover/vid:scale-110 transition-transform">
                        <Video className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    {meta?.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md">
                        {formatDuration(meta.duration)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border shadow-sm group/img">
                    <img src={url} alt="" className="h-full w-full object-cover group-hover/img:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <button
                  onClick={() => setMedia(media.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive/90 text-white flex items-center justify-center shadow-md hover:bg-destructive transition-all hover:scale-110"
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
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 bg-background flex flex-col h-dvh w-full overflow-hidden text-foreground"
      >
        {/* Full Screen Sticky Header */}
        <div className="shrink-0 h-14 border-b border-border/40 px-4 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-10 pt-[env(safe-area-inset-top,0px)]">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground p-1 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
            <span>Cancel</span>
          </button>
          <h2 className="font-bold text-base text-foreground">Create Post</h2>
          <Button
            variant="gradient"
            size="sm"
            disabled={(!content.trim() && !media.length && !showPoll) || createPost.isPending || uploading}
            onClick={() => createPost.mutate()}
            className="h-9 px-5 font-bold rounded-xl gap-1.5 shadow-md shadow-primary/20"
            animate
          >
            {createPost.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </Button>
        </div>

        {/* Scrollable Content Body */}
        <div 
          ref={contentBodyRef}
          className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe"
          style={{ paddingBottom: isKeyboardOpen ? `${keyboardHeight + 16}px` : undefined }}
        >
          {/* User Profile & Rank Badge Header */}
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20 shrink-0">
              <AvatarImage src={user?.profile?.avatar || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {getInitials(user?.profile?.username || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground truncate">
                  {user?.profile?.displayName || user?.profile?.username}
                </p>
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20 px-2 py-0.5">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  {user?.profile?.rank || 'Pro Gamer'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <select
                  value={privacy}
                  onChange={(e: any) => setPrivacy(e.target.value)}
                  className="text-xs bg-muted/60 border border-border/40 text-muted-foreground rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="PUBLIC">🌐 Public (Everyone)</option>
                  <option value="FRIENDS">👥 Friends Only</option>
                  <option value="COMMUNITY">🎮 Community Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expanded Text Area (Min height 250px on mobile) */}
          <Textarea
            placeholder="What's happening in your gaming world? Share your clips, achievements, screenshots, or thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none border-0 bg-muted/20 rounded-2xl p-4 text-base focus-visible:ring-1 focus-visible:ring-primary/20 min-h-[250px] placeholder:text-muted-foreground/50 leading-relaxed"
            autoFocus
          />

          {uploading && (
            <div className="space-y-1.5 px-1 py-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading media to network...</span>
                <span className="font-semibold text-primary">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5 bg-primary/10" />
            </div>
          )}

          {/* Media Previews (Photo & Video with Play Icon) */}
          {media.length > 0 && (
            <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Media Attachments</p>
              <div className="flex gap-3 flex-wrap">
                {media.map((url, i) => {
                  const isVideoFile = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video/upload/') || url.startsWith('data:video/') || url.startsWith('blob:');
                  const thumb = localThumbnails[url] || (url.includes('/video/upload/') ? url.replace(/\/video\/upload\/(v\d+\/)?/, '/video/upload/c_limit,w_150,h_150/').replace(/\.[^/.]+$/, '.jpg') : null);
                  return (
                    <div key={i} className="relative group">
                      {isVideoFile ? (
                        <div className="h-28 w-28 rounded-2xl overflow-hidden relative border border-border/60 bg-black flex items-center justify-center shadow-md">
                          {thumb ? (
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <video src={url} className="h-full w-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="h-7 w-7 text-white/90 drop-shadow-md" />
                          </div>
                        </div>
                      ) : (
                        <img src={url} alt="" className="h-28 w-28 rounded-2xl object-cover border border-border/60 shadow-md" />
                      )}
                      <button
                        onClick={() => setMedia(media.filter((_, j) => j !== i))}
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Poll UI */}
          {showPoll && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 bg-card/60 rounded-2xl p-4 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-purple-400" /> Create a Community Poll
                </p>
                <button onClick={() => setShowPoll(false)} className="text-muted-foreground hover:text-destructive p-1 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="text-sm font-semibold border-0 bg-muted/40 rounded-xl"
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
                    className="text-sm flex-1 border-0 bg-muted/40 rounded-xl"
                  />
                  {pollOptions.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <Button variant="ghost" size="sm" className="text-xs text-primary font-semibold" onClick={addPollOption}>+ Add option</Button>
              )}
            </motion.div>
          )}

          {/* Hashtag Chips */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="gap-1 text-xs px-3 py-1 rounded-xl bg-primary/10 text-primary border-primary/20">
                  #{tag}
                  <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="text-xs ml-0.5 hover:text-destructive">&times;</button>
                </Badge>
              ))}
            </div>
          )}

          {/* Live Post Feed Preview Box */}
          {(content.trim() || media.length > 0 || showPoll) && (
            <div className="space-y-2 pt-3 border-t border-border/30">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" /> Live Feed Preview
              </p>
              <Card variant="glass" className="p-4 rounded-2xl bg-card/40 border-border/40">
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={user?.profile?.avatar || ''} />
                    <AvatarFallback>{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{user?.profile?.displayName || user?.profile?.username}</span>
                      <span className="text-[10px] text-muted-foreground">Just now</span>
                    </div>
                    {content && <p className="text-xs text-foreground/90 whitespace-pre-wrap">{content}</p>}
                    {media.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {media.map((url, idx) => (
                          <img key={idx} src={url} alt="" className="rounded-xl h-24 w-full object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Fixed Action Toolbar at Bottom */}
        <div className="shrink-0 border-t border-border/40 p-3 bg-card/80 backdrop-blur-md flex items-center justify-around gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <Button
            variant="outline"
            size="sm"
            className="h-10 text-xs rounded-2xl gap-1.5 flex-1 border-border/50 hover:border-primary/40"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="h-4 w-4 text-emerald-400" /> Photo/Video
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`h-10 text-xs rounded-2xl gap-1.5 flex-1 border-border/50 ${showPoll ? 'border-primary text-primary bg-primary/10' : ''}`}
            onClick={() => setShowPoll(!showPoll)}
            disabled={uploading}
          >
            <BarChart3 className="h-4 w-4 text-purple-400" /> Poll
          </Button>
          <div className="flex items-center gap-1 flex-1">
            <Input
              placeholder="#tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="h-10 w-full text-xs rounded-2xl border-border/50 bg-muted/30"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              disabled={uploading}
            />
          </div>
        </div>
      </motion.div>
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

