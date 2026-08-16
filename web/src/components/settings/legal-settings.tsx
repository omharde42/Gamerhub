'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LEGAL_DOCUMENTS, LEGAL_HUB_ROUTE, LEGAL_HUB_TITLE, formatLegalDate } from '@/config/legal';
import { FileText, ExternalLink, Scale } from 'lucide-react';

/**
 * License & legal documents accessible from Settings. Every entry is driven by
 * the single source of truth in @/config/legal, so titles/routes/dates stay in
 * sync with the footer and the /legal hub automatically.
 */
export function LegalSettingsTab() {
  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            License & Legal Documents
          </CardTitle>
          <CardDescription className="text-xs">
            The agreements, policies, and licenses that govern your use of GamerZ Hub — including the User
            Content License you grant when you post.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {LEGAL_DOCUMENTS.map((doc) => (
            <Link
              key={doc.slug}
              href={doc.route}
              className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/50 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{doc.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{doc.description}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Version {doc.version} · Updated {formatLegalDate(doc.lastUpdated)}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
            </Link>
          ))}

          <Link
            href={LEGAL_HUB_ROUTE}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Scale className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{LEGAL_HUB_TITLE}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  View every legal document in one place.
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
