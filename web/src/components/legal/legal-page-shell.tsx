import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  FileText,
  Gavel,
  Hash,
  Info,
} from 'lucide-react';
import {
  BRAND_NAME,
  COPYRIGHT_LINE,
  LEGAL_HUB_ROUTE,
  LEGAL_HUB_TITLE,
  formatLegalDate,
  getLegalDocument,
  getRelatedLegalDocuments,
} from '@/config/legal';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────────
 * Primitives used by every legal document page.
 * ──────────────────────────────────────────────────────────────────── */

/** A numbered/titled section of a legal document. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2 id={`${id}-heading`} className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-primary/70 shrink-0" aria-hidden="true" />
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

/** A paragraph inside a legal section. */
export function LegalP({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

/** An ordered or unordered list inside a legal section. */
export function LegalList({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={cn('space-y-2 pl-5', ordered ? 'list-decimal marker:text-primary/60' : 'list-disc marker:text-primary/60')}>
      {items.map((item, i) => (
        <li key={i} className="pl-1">{item}</li>
      ))}
    </Tag>
  );
}

/** A highlighted note — used for placeholders and important caveats. */
export function LegalNote({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <div
      role="note"
      className={cn(
        'flex gap-3 rounded-xl border p-4 text-sm leading-relaxed',
        tone === 'warn'
          ? 'border-warning/40 bg-warning/10 text-warning-foreground'
          : 'border-primary/25 bg-primary/5 text-foreground/90'
      )}
    >
      <Info className={cn('h-4 w-4 shrink-0 mt-0.5', tone === 'warn' ? 'text-warning' : 'text-primary')} aria-hidden="true" />
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Shared page shell — header, metadata bar, optional TOC, body, and
 * related-document navigation.
 * ──────────────────────────────────────────────────────────────────── */

export interface LegalPageShellProps {
  /** Slug of the document in `@/config/legal` (drives titles, dates, versions). */
  docSlug: string;
  /** Optional short introduction shown under the title. */
  intro?: ReactNode;
  /** Optional table of contents: anchor id → visible label. */
  toc?: { id: string; label: string }[];
  /** The document body (LegalSection primitives). */
  children: ReactNode;
}

export function LegalPageShell({ docSlug, intro, toc, children }: LegalPageShellProps) {
  const doc = getLegalDocument(docSlug);
  const related = getRelatedLegalDocuments(docSlug);

  return (
    <article className="max-w-3xl mx-auto space-y-8 py-6 md:py-10">
      {/* Back to hub */}
      <Link
        href={LEGAL_HUB_ROUTE}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {LEGAL_HUB_TITLE}
      </Link>

      {/* Document header */}
      <header className="gaming-card p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary/80">
          <Gavel className="h-3.5 w-3.5" aria-hidden="true" />
          GamerZ Hub Legal
        </div>
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-foreground">
          <span className="bg-gradient-to-r from-emerald-400 via-primary to-violet-400 bg-clip-text text-transparent">
            {doc.title}
          </span>
        </h1>
        {intro && <div className="text-[15px] leading-relaxed text-muted-foreground">{intro}</div>}

        {/* Version / dates metadata bar */}
        <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            <dt className="font-semibold text-foreground/80">Version:</dt>
            <dd>v{doc.version}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            <dt className="font-semibold text-foreground/80">Effective:</dt>
            <dd>{formatLegalDate(doc.effectiveDate)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            <dt className="font-semibold text-foreground/80">Last updated:</dt>
            <dd>{formatLegalDate(doc.lastUpdated)}</dd>
          </div>
        </dl>
      </header>

      {/* Table of contents */}
      {toc && toc.length > 0 && (
        <nav aria-label={`Contents of ${doc.title}`} className="glass-card p-5 md:p-6">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            On this page
          </h2>
          <ol className="grid gap-1.5 text-sm">
            {toc.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="inline-flex items-baseline gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="text-primary/60 font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Document body */}
      <div className="space-y-8">{children}</div>

      {/* Related documents */}
      <footer aria-label="Related legal documents" className="glass-card p-5 md:p-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          Related legal documents
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {related.map((r) => (
            <Link
              key={r.slug}
              href={r.route}
              className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3 text-sm text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <FileText className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
              <span className="font-medium">{r.shortTitle}</span>
            </Link>
          ))}
          <Link
            href={LEGAL_HUB_ROUTE}
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3 text-sm text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <Gavel className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
            <span className="font-medium">All legal documents</span>
          </Link>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/70">
          {BRAND_NAME} · {COPYRIGHT_LINE}
        </p>
      </footer>
    </article>
  );
}
