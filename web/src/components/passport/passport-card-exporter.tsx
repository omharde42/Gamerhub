'use client';
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Download, FileText, Share2, Gamepad2, Trophy, Verified, Sparkles, MapPin, CheckCircle2, Star } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PassportCardExporterProps {
  passport: any;
  trigger?: React.ReactNode;
}

export function PassportCardExporter({ passport, trigger }: PassportCardExporterProps) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const p = passport || {};
  const gamerScore = p.gamerScore || 85;
  const connectedGames = p.connectedGames || [];

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print your Gamer Passport');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GamerZ Hub Official Passport - ${p.displayName || p.username}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background: #060913; color: #ffffff; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .passport-card { width: 100%; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #0b101d 0%, #060913 100%); border: 2px solid #10b981; border-radius: 20px; padding: 28px; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(16, 185, 129, 0.3); padding-bottom: 16px; margin-bottom: 20px; }
            .brand { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 900; color: #10b981; text-transform: uppercase; tracking: 1px; }
            .badge-verified { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
            .profile-row { display: flex; gap: 20px; align-items: center; margin-bottom: 24px; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); }
            .avatar { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #10b981; object-fit: cover; }
            .user-info h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
            .user-info p { font-size: 13px; color: #94a3b8; }
            .score-box { margin-left: auto; text-align: center; background: rgba(16, 185, 129, 0.1); border: 2px solid #10b981; padding: 10px 18px; border-radius: 16px; }
            .score-box .num { font-size: 28px; font-weight: 900; color: #10b981; }
            .score-box .lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
            .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #10b981; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; letter-spacing: 0.5px; }
            .games-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
            .game-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px; }
            .game-title { font-size: 15px; font-weight: 700; color: #ffffff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
            .game-rank { background: #10b981; color: #000000; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
            .game-detail { font-size: 11px; color: #cbd5e1; margin-bottom: 4px; }
            .game-stats { display: flex; gap: 8px; margin-top: 8px; font-size: 10px; font-weight: 700; color: #10b981; }
            .stat-pill { background: rgba(16, 185, 129, 0.15); padding: 3px 8px; border-radius: 6px; }
            .footer-bar { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); pt: 14px; margin-top: 20px; font-size: 11px; color: #64748b; }
            @media print {
              body { background: #060913 !important; }
              .passport-card { box-shadow: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2 font-bold shadow-md">
            <Download className="h-4 w-4" /> Download Gamer Passport
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-[#060913] text-foreground border-primary/30 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40 pr-8">
          <DialogTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-primary shrink-0">
            <Shield className="h-5 w-5 shrink-0" />
            <span className="truncate">Official Gamer Passport</span>
          </DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 font-bold shadow-sm h-8 text-xs sm:h-9 sm:text-sm">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Card Area */}
        <div ref={printRef} className="py-2">
          <div className="passport-card rounded-2xl bg-gradient-to-br from-[#0c1222] via-[#060913] to-[#04060c] border-2 border-primary/40 p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Watermark Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-white/[0.015] pointer-events-none select-none tracking-tighter">
              GAMERZ HUB
            </div>

            {/* Header */}
            <div className="header-bar flex items-center justify-between border-b border-primary/30 pb-4 mb-5">
              <div className="brand flex items-center gap-2 text-xl font-black text-primary tracking-wider uppercase">
                <Shield className="h-6 w-6 text-primary" /> GamerZ Hub Passport
              </div>
              <div className="badge-verified flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED GAMER PASSPORT
              </div>
            </div>

            {/* Player Info Row */}
            <div className="profile-row flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-5">
              <Avatar className="h-20 w-20 border-2 border-primary ring-2 ring-primary/20 shrink-0">
                <AvatarImage src={p.avatar || ''} />
                <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">{getInitials(p.displayName || p.username)}</AvatarFallback>
              </Avatar>
              <div className="user-info min-w-0 flex-1">
                <h1 className="text-xl font-black text-foreground truncate">{p.displayName || p.username}</h1>
                <p className="text-xs text-muted-foreground font-mono">@{p.username} {p.country ? `• ${p.country}` : ''}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {p.rank && <Badge variant="secondary" className="text-[10px] font-extrabold">{p.rank}</Badge>}
                  {p.role && <Badge variant="outline" className="text-[10px]">{p.role}</Badge>}
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                    Connected Games: {connectedGames.length}
                  </Badge>
                </div>
              </div>
              <div className="score-box shrink-0 text-center bg-primary/10 border-2 border-primary rounded-2xl px-4 py-2.5">
                <div className="num text-3xl font-black text-primary leading-none">{gamerScore}</div>
                <div className="lbl text-[9px] font-bold text-muted-foreground uppercase mt-1">GAMER SCORE</div>
              </div>
            </div>

            {/* Connected Games Section */}
            <div className="mb-5">
              <div className="section-title text-xs font-extrabold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" /> Connected Game Profiles ({connectedGames.length})
              </div>

              {connectedGames.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-muted-foreground">
                  No connected game accounts added yet.
                </div>
              ) : (
                <div className="games-grid grid grid-cols-1 md:grid-cols-2 gap-3">
                  {connectedGames.map((game: any, idx: number) => (
                    <div key={game.id || idx} className="game-card bg-white/[0.04] border border-white/10 rounded-xl p-3.5 hover:border-primary/30 transition-colors">
                      <div className="game-title flex items-center justify-between font-bold text-sm text-foreground mb-1">
                        <span className="truncate flex items-center gap-1.5">
                          <Gamepad2 className="h-4 w-4 text-primary shrink-0" /> {game.gameName}
                        </span>
                        {game.rank && <span className="game-rank bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-md">{game.rank}</span>}
                      </div>

                      <div className="game-detail text-[11px] text-muted-foreground space-y-0.5">
                        {game.playerId && <div><strong className="text-foreground">IGN:</strong> {game.playerId}</div>}
                        {game.uid && <div><strong className="text-foreground">UID:</strong> <code className="bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono text-emerald-400">{game.uid}</code></div>}
                        {game.server && <div><strong className="text-foreground">Server:</strong> {game.server}</div>}
                        {game.level && <div><strong className="text-foreground">Level:</strong> {game.level}</div>}
                      </div>

                      <div className="game-stats flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/5 flex-wrap">
                        {game.kdRatio > 0 && <span className="stat-pill bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">KD: {game.kdRatio}</span>}
                        {game.winRate > 0 && <span className="stat-pill bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">Win: {game.winRate}%</span>}
                        {game.matchesPlayed > 0 && <span className="stat-pill bg-white/10 text-foreground text-[10px] font-bold px-2 py-0.5 rounded">Matches: {game.matchesPlayed}</span>}
                        {game.preferredRole && <span className="stat-pill bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded">Role: {game.preferredRole}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Summary Section */}
            {p.aiSummary && !p.aiSummary.startsWith('{') && (
              <div className="mb-4 bg-primary/[0.04] border border-primary/20 rounded-xl p-3.5">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Player Evaluation
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">&ldquo;{p.aiSummary}&rdquo;</p>
              </div>
            )}

            {/* Footer */}
            <div className="footer-bar flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-muted-foreground font-mono">
              <span>GamerZ Hub ID: {p.id || 'GH-PASS-2026'}</span>
              <span>Official Gaming Passport System</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
