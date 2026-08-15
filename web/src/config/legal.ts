/**
 * GamerZ Hub — Centralized Legal / Documentation Configuration
 * =============================================================
 *
 * This is the SINGLE SOURCE OF TRUTH for legal document metadata
 * (titles, routes, versions, effective dates, last-updated dates) used
 * across the website:
 *
 *   - the global footer ("Legal" section)
 *   - the /legal hub page
 *   - every legal document page (metadata bar)
 *   - sitemap generation
 *
 * To update a date, version, or title, change it HERE — every page and
 * link updates automatically. Do not edit dates/versions inside the
 * individual page files.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ⚠️ PLACEHOLDER POLICY
 * ─────────────────────────────────────────────────────────────────────
 * Anything the project does not actually know (registered company name,
 * registered address, contact emails, governing law, GSTIN, CIN, patent
 * status, etc.) is represented below as a clearly marked placeholder of
 * the form [[...]]. Replace placeholders with verified facts only.
 *
 * This is website/legal documentation, NOT legal advice. Have the final
 * documents reviewed by qualified legal counsel before relying on them.
 * ─────────────────────────────────────────────────────────────────────
 */

export const BRAND_NAME = 'GamerZ Hub';
export const BRAND_LEGAL_NAME = 'GamerZ Hub';

/** Dynamic copyright line — year is always the current year. */
export const COPYRIGHT_LINE = `© ${new Date().getFullYear()} ${BRAND_LEGAL_NAME}. All rights reserved.`;

export interface LegalDocument {
  /** Stable machine key, used as the page's metadata `docSlug`. */
  slug: string;
  /** Public route (App Router path). */
  route: string;
  /** Full document title. */
  title: string;
  /** Short label used in the footer / hub cards. */
  shortTitle: string;
  /** Human-readable version number. */
  version: string;
  /** ISO date (YYYY-MM-DD) the document takes effect. */
  effectiveDate: string;
  /** ISO date (YYYY-MM-DD) of the most recent revision. */
  lastUpdated: string;
  /** One-sentence summary shown on the /legal hub. */
  description: string;
  /** Whether the document currently applies to GamerZ Hub. */
  applicable: boolean;
}

/**
 * Every legal document on the site. Add/remove entries here to add or
 * retire documents site-wide (footer, hub, sitemap).
 */
export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: 'terms',
    route: '/terms',
    title: 'Terms & Conditions',
    shortTitle: 'Terms & Conditions',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'The agreement governing your use of the GamerZ Hub platform, your account, and the services we provide.',
    applicable: true,
  },
  {
    slug: 'privacy',
    route: '/privacy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy Policy',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'How GamerZ Hub collects, uses, stores, and protects the personal data you share with us.',
    applicable: true,
  },
  {
    slug: 'copyright',
    route: '/copyright',
    title: 'Copyright & Intellectual Property',
    shortTitle: 'Copyright & IP',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'Who owns what on GamerZ Hub, and how to report alleged copyright infringement.',
    applicable: true,
  },
  {
    slug: 'license',
    route: '/license',
    title: 'User Content License Agreement',
    shortTitle: 'Content License',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'The narrow license you grant GamerZ Hub when you post, upload, or share content on the platform.',
    applicable: true,
  },
  {
    slug: 'community-guidelines',
    route: '/community-guidelines',
    title: 'Community Guidelines & Acceptable Use Policy',
    shortTitle: 'Community Guidelines',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'The rules of the road for the GamerZ Hub community, and what happens when they are broken.',
    applicable: true,
  },
  {
    slug: 'disclaimer',
    route: '/disclaimer',
    title: 'Disclaimer',
    shortTitle: 'Disclaimer',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'Limits on GamerZ Hub’s liability for service availability, third-party data, and user-generated content.',
    applicable: true,
  },
  {
    slug: 'cookies',
    route: '/cookies',
    title: 'Cookie Policy',
    shortTitle: 'Cookie Policy',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'The cookies and local storage GamerZ Hub uses, and the controls available to you.',
    applicable: true,
  },
  {
    slug: 'refund-policy',
    route: '/refund-policy',
    title: 'Refund & Cancellation Policy',
    shortTitle: 'Refunds & Cancellation',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'How paid GamerZ Hub subscriptions are billed, cancelled, and refunded.',
    applicable: true,
  },
  {
    slug: 'licenses',
    route: '/licenses',
    title: 'Third-Party & Open-Source Licenses',
    shortTitle: 'Open-Source Licenses',
    version: '1.0',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-08-15',
    description:
      'Attribution for the open-source software and third-party services that power GamerZ Hub.',
    applicable: true,
  },
];

/** Hub page itself (not a standalone document, but linked everywhere). */
export const LEGAL_HUB_ROUTE = '/legal';
export const LEGAL_HUB_TITLE = 'Legal & Policies';

/** Routes considered "legal/documentation" — used by the layout to treat them as public. */
export const LEGAL_ROUTES: string[] = LEGAL_DOCUMENTS.map((d) => d.route).concat([LEGAL_HUB_ROUTE]);

/**
 * ⚠️ CONFIGURATION PLACEHOLDERS
 * -----------------------------
 * Replace the [[...]] values below with verified facts as they become
 * available. Nothing here is a legal claim — it is configuration that the
 * legal pages render. Until replaced, pages display the placeholder text
 * so nothing is ever silently invented.
 */
export const LEGAL_PLACEHOLDERS = {
  /**
   * Legal entity that operates GamerZ Hub (registered company name,
   * registration number, etc.). If GamerZ Hub is operated by an
   * individual or unregistered entity, state that here instead.
   */
  legalEntityName: '[[Legal entity name / operator of GamerZ Hub — to be provided]]',

  /** Registered / principal business address. */
  registeredAddress: '[[Registered office address — to be provided]]',

  /** Company registration / CIN number where applicable. */
  companyRegistrationNumber: '[[Company registration / CIN number — to be provided]]',

  /** GST registration number where applicable. */
  gstin: '[[GSTIN — to be provided]]',

  /** Public support / general contact email. */
  supportEmail: '[[support@gamerzhub.example — to be provided]]',

  /** Legal / policy correspondence email. */
  legalContactEmail: '[[legal@gamerzhub.example — to be provided]]',

  /** Security vulnerability reporting email (see SECURITY.md). */
  securityContactEmail: '[[security@gamerzhub.example — to be provided]]',

  /** Jurisdiction whose law governs the Terms. */
  governingLaw: '[[Governing law / jurisdiction — to be specified by GamerZ Hub’s legal counsel]]',

  /** Forum for dispute resolution. */
  disputeResolution: '[[Dispute resolution forum — to be specified by GamerZ Hub’s legal counsel]]',

  /** Minimum age for account creation (policy default; not legally verified). */
  minimumAge: 13,

  /**
   * Patent status. Neutral by default — do NOT claim a patent or
   * patent-pending status unless verified filing information exists.
   */
  patentStatement:
    'Certain GamerZ Hub technologies and developments may be subject to intellectual property protection.',
};

/** Format an ISO date as a readable date string used across legal pages. */
export function formatLegalDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Look up a document by slug (throws if unknown — fail fast on typos). */
export function getLegalDocument(slug: string): LegalDocument {
  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);
  if (!doc) throw new Error(`Unknown legal document slug: ${slug}`);
  return doc;
}

/** Related documents (everything except the current one) for cross-linking. */
export function getRelatedLegalDocuments(slug: string): LegalDocument[] {
  return LEGAL_DOCUMENTS.filter((d) => d.slug !== slug);
}
