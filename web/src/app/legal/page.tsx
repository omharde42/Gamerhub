import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Gavel,
  FileText,
  ShieldAlert,
  Mail,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import {
  BRAND_NAME,
  COPYRIGHT_LINE,
  LEGAL_DOCUMENTS,
  LEGAL_PLACEHOLDERS,
  formatLegalDate,
} from '@/config/legal';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Legal & Policies | GamerZ Hub',
  description:
    'All GamerZ Hub legal documents in one place: Terms & Conditions, Privacy Policy, Copyright & IP, User Content License, Community Guidelines, Disclaimer, Cookie Policy, and Refund Policy.',
};

const categoryIcons = {
  core: Gavel,
  content: FileText,
  compliance: ShieldAlert,
  operations: AlertCircle,
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core agreement',
  content: 'Content & IP',
  compliance: 'Compliance',
  operations: 'Operations',
};

// Simple category assignment (kept local so the registry stays data-only).
const DOC_CATEGORY: Record<string, keyof typeof categoryIcons> = {
  terms: 'core',
  privacy: 'compliance',
  copyright: 'content',
  license: 'content',
  'community-guidelines': 'compliance',
  disclaimer: 'core',
  cookies: 'compliance',
  'refund-policy': 'operations',
  licenses: 'operations',
};

export default function LegalHubPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 md:py-10">
      <header className="gaming-card p-6 md:p-10 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary/80">
          <Gavel className="h-4 w-4" aria-hidden="true" />
          GamerZ Hub Legal
        </div>
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-emerald-400 via-primary to-violet-400 bg-clip-text text-transparent">
            Legal & Policies
          </span>
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground max-w-2xl">
          Everything about how {BRAND_NAME} works, what you agree to when you use it, how we handle
          your data, and what you can expect from the community. These documents are reviewed
          together with the rest of the platform — changes are announced here.
        </p>
        <p className="text-xs text-muted-foreground/70">{COPYRIGHT_LINE}</p>
      </header>

      <section aria-label="Legal documents" className="grid sm:grid-cols-2 gap-4">
        {LEGAL_DOCUMENTS.map((doc) => {
          const Icon = categoryIcons[DOC_CATEGORY[doc.slug] ?? 'core'];
          const category = CATEGORY_LABELS[DOC_CATEGORY[doc.slug] ?? 'core'];
          return (
            <Link
              key={doc.slug}
              href={doc.route}
              className={cn(
                'gaming-card group p-5 md:p-6 space-y-3',
                !doc.applicable && 'opacity-70'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                {doc.applicable ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success bg-success/10 border border-success/30 rounded-full px-2 py-0.5">
                    <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    Not applicable
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <h2 className="font-bold text-foreground group-hover:text-primary transition-colors">
                  {doc.shortTitle}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{doc.description}</p>
              </div>
              <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground/70 uppercase tracking-wide">
                <span>v{doc.version}</span>
                <span aria-hidden="true">·</span>
                <span>{category}</span>
                <span aria-hidden="true">·</span>
                <span>Updated {formatLegalDate(doc.lastUpdated)}</span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Legal contact */}
      <section aria-label="Legal contact" className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
          Legal Contact
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>
            For legal, policy, copyright, or privacy questions — including requests to exercise
            your data rights — contact the {BRAND_NAME} team at:
          </p>
          <p className="font-mono text-primary/90">{LEGAL_PLACEHOLDERS.legalContactEmail}</p>
          <p className="text-xs text-muted-foreground/70">
            For security vulnerabilities, please use the process described in{' '}
            <span className="font-medium">SECURITY.md</span> or contact{' '}
            <span className="font-mono">{LEGAL_PLACEHOLDERS.securityContactEmail}</span>.
          </p>
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-muted-foreground/60">
        These documents are informational website/legal documentation. They do not constitute
        legal advice and have not been reviewed by counsel for {BRAND_NAME} unless otherwise
        stated. {LEGAL_PLACEHOLDERS.legalEntityName} operates {BRAND_NAME}.
      </p>
    </div>
  );
}
