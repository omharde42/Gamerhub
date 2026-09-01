'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Download, Gamepad2, Trophy, Verified, Sparkles, MapPin, CheckCircle2, Star, Award, Loader2, QrCode } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PassportCardExporterProps {
  passport: any;
  trigger?: React.ReactNode;
}

export function PassportCardExporter({ passport, trigger }: PassportCardExporterProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const p = passport || {};
  const username = p.username || 'Gamer';
  const gamerScore = p.gamerScore || 85;
  const connectedGames = p.connectedGames || [];
  const publicProfileUrl = `https://gamerhub.com/passport/${encodeURIComponent(username)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicProfileUrl)}`;

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      toast.loading('Generating Gamer Passport...', { id: 'pdf-toast' });

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = pdfRef.current;
      if (!element) {
        toast.error('Unable to generate passport. Please try again.', { id: 'pdf-toast' });
        setIsGenerating(false);
        return;
      }

      // Clone or render the capture container
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#060913',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `GamerHub_Passport_${username}.pdf`;
      pdf.save(filename);

      toast.success('✓ Gamer Passport downloaded', { id: 'pdf-toast' });
    } catch (error) {
      console.error('PDF Generation error:', error);
      toast.error('Unable to generate passport. Please try again.', { id: 'pdf-toast' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2 font-bold shadow-md max-w-full text-xs sm:text-sm">
            <Download className="h-4 w-4 shrink-0" /> <span className="truncate">Download Gamer Passport</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-3xl bg-[#060913] text-foreground border-primary/30 max-h-[92vh] overflow-y-auto p-3 sm:p-6 rounded-xl">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <DialogTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-primary shrink-0">
            <Shield className="h-5 w-5 shrink-0" />
            <span className="truncate">Official Gamer Passport</span>
          </DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="gap-1.5 font-bold shadow-sm h-8 text-xs sm:h-9 sm:text-sm w-full sm:w-auto"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Download className="h-4 w-4 shrink-0" />}
              <span>{isGenerating ? 'Generating...' : 'Download Gamer Passport'}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable/Exportable Card Container */}
        <div className="py-2 overflow-x-hidden">
          <div
            ref={pdfRef}
            className="passport-card rounded-2xl bg-gradient-to-br from-[#0c1222] via-[#060913] to-[#04060c] border-2 border-primary/40 p-4 sm:p-6 shadow-2xl relative overflow-hidden text-white w-full max-w-full box-border"
            style={{ width: '100%', minWidth: '0px' }}
          >
            {/* Header */}
            <div className="header-bar flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/30 pb-4 mb-4">
              <div className="brand flex items-center gap-2 text-lg sm:text-xl font-black text-primary tracking-wider uppercase">
                <Shield className="h-6 w-6 text-primary shrink-0" />
                <span className="break-words">GAMERHUB OFFICIAL GAMER PASSPORT</span>
              </div>
              <div className="badge-verified flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold w-fit">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> VERIFIED GAMER
              </div>
            </div>

            {/* Profile Information */}
            <div className="profile-row flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-5 w-full">
              <Avatar className="h-20 w-20 border-2 border-primary ring-2 ring-primary/20 shrink-0">
                <AvatarImage src={p.avatar || ''} />
                <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">{getInitials(p.displayName || p.username)}</AvatarFallback>
              </Avatar>

              <div className="user-info min-w-0 flex-1 text-center sm:text-left w-full break-words">
                <h1 className="text-xl sm:text-2xl font-black text-white break-words">{p.displayName || p.username}</h1>
                <p className="text-xs text-slate-400 font-mono break-all mt-0.5">
                  @{p.username} {p.country ? `• ${p.country}` : ''} {p.city ? `(${p.city})` : ''}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                    GH ID: {p.id || p.userId || 'GH-PASSPORT'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
                    Level {p.level || p.gamerLevel || 12}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                    Status: {p.verified ? '✓ Verified Gamer' : 'Member'}
                  </Badge>
                  {p.createdAt && (
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                      Member since {new Date(p.createdAt).getFullYear()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Score & QR Code */}
              <div className="flex items-center gap-3 shrink-0 self-center sm:self-start mt-2 sm:mt-0">
                <div className="score-box text-center bg-primary/10 border-2 border-primary rounded-2xl px-3.5 py-2">
                  <div className="num text-2xl sm:text-3xl font-black text-primary leading-none">{gamerScore}</div>
                  <div className="lbl text-[9px] font-bold text-slate-400 uppercase mt-1">GAMER SCORE</div>
                </div>

                <div className="qr-container bg-white p-1.5 rounded-xl text-center shadow-md border border-white/20">
                  <img src={qrCodeUrl} alt="GamerHub QR" className="w-14 h-14 object-contain mx-auto" />
                  <span className="text-[8px] text-slate-900 font-extrabold block mt-0.5">SCAN PROFILE</span>
                </div>
              </div>
            </div>

            {/* Achievements / Badges Section */}
            {p.achievements?.length > 0 && (
              <div className="mb-5">
                <div className="section-title text-xs font-extrabold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4 shrink-0" /> Achievements & Credentials ({p.achievements.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.achievements.map((a: any, idx: number) => (
                    <div key={a.id || idx} className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 px-2.5 py-1.5 rounded-lg text-xs">
                      <span>{a.icon || '🏆'}</span>
                      <span className="font-semibold text-white">{a.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Game Profiles Section */}
            <div className="mb-5">
              <div className="section-title text-xs font-extrabold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 shrink-0" /> CONNECTED GAME PROFILES ({connectedGames.length})
              </div>

              {connectedGames.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-400">
                  No connected game accounts linked yet.
                </div>
              ) : (
                <div className="games-grid grid grid-cols-1 md:grid-cols-2 gap-3">
                  {connectedGames.map((game: any, idx: number) => (
                    <div key={game.id || idx} className="game-card bg-white/[0.04] border border-white/10 rounded-xl p-3.5 space-y-2 break-words">
                      <div className="game-title flex items-center justify-between font-bold text-sm text-white border-b border-white/10 pb-2 gap-2">
                        <span className="truncate flex items-center gap-1.5 text-emerald-400 font-extrabold">
                          <Gamepad2 className="h-4 w-4 text-emerald-400 shrink-0" /> {game.gameName || game.game}
                        </span>
                        <span className="game-rank bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0">
                          {game.verified ? '✓ Verified' : game.dataSource || 'Connected'}
                        </span>
                      </div>

                      <div className="game-detail text-[11px] text-slate-300 space-y-1">
                        {(game.playerId || game.inGameName) && (
                          <div><strong className="text-white">IGN:</strong> {game.playerId || game.inGameName}</div>
                        )}
                        {(game.uid || game.inGameUid) && (
                          <div><strong className="text-white">UID/Player Tag:</strong> <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-400">{game.uid || game.inGameUid}</code></div>
                        )}
                        {game.rank && <div><strong className="text-white">Rank:</strong> {game.rank}</div>}
                        {game.level && <div><strong className="text-white">XP Level:</strong> {game.level}</div>}
                        {game.server && <div><strong className="text-white">Server/Region:</strong> {game.server}</div>}
                        {game.townHall && <div><strong className="text-white">Town Hall:</strong> {game.townHall}</div>}
                        {game.clan && <div><strong className="text-white">Clan:</strong> {game.clan} {game.clanRole ? `(${game.clanRole})` : ''}</div>}
                      </div>

                      {/* Dynamic Stats Badges */}
                      <div className="game-stats flex items-center gap-1.5 pt-2 border-t border-white/5 flex-wrap">
                        {game.trophies && <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded">Trophies: {game.trophies}</span>}
                        {game.kdRatio > 0 && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">K/D: {game.kdRatio}</span>}
                        {game.winRate > 0 && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">Win Rate: {game.winRate}%</span>}
                        {game.matchesPlayed > 0 && <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded">Matches: {game.matchesPlayed}</span>}
                        {game.score && <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded">Score: {game.score}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Summary / Evaluation */}
            {p.aiSummary && !p.aiSummary.startsWith('{') && (
              <div className="mb-4 bg-primary/[0.04] border border-primary/20 rounded-xl p-3.5">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Player Evaluation
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">&ldquo;{p.aiSummary}&rdquo;</p>
              </div>
            )}

            {/* Footer */}
            <div className="footer-bar flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] text-slate-400 font-mono">
              <span>GamerHub ID: {p.id || p.userId || 'GH-PASS-2026'}</span>
              <span>Official GamerHub Gaming Credentials</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
