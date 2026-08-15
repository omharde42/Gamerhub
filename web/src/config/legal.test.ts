import {
  LEGAL_DOCUMENTS,
  LEGAL_ROUTES,
  LEGAL_PLACEHOLDERS,
  COPYRIGHT_LINE,
  formatLegalDate,
  getLegalDocument,
  getRelatedLegalDocuments,
} from './legal';

describe('legal document registry', () => {
  it('registers every document the site links to', () => {
    expect(LEGAL_DOCUMENTS.map((d) => d.slug)).toEqual(
      expect.arrayContaining([
        'terms',
        'privacy',
        'copyright',
        'license',
        'community-guidelines',
        'disclaimer',
        'cookies',
        'refund-policy',
        'licenses',
      ])
    );
  });

  it('has unique slugs and unique routes', () => {
    const slugs = LEGAL_DOCUMENTS.map((d) => d.slug);
    const routes = LEGAL_DOCUMENTS.map((d) => d.route);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('has complete metadata on every document', () => {
    for (const doc of LEGAL_DOCUMENTS) {
      expect(doc.title.length).toBeGreaterThan(0);
      expect(doc.shortTitle.length).toBeGreaterThan(0);
      expect(doc.version).toMatch(/^\d+\.\d+$/);
      expect(doc.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.description.length).toBeGreaterThan(0);
      expect(typeof doc.applicable).toBe('boolean');
    }
  });

  it('keeps effective and last-updated dates in a sane order', () => {
    for (const doc of LEGAL_DOCUMENTS) {
      expect(doc.lastUpdated >= doc.effectiveDate).toBe(true);
    }
  });

  it('exposes a route for every document plus the hub', () => {
    for (const doc of LEGAL_DOCUMENTS) {
      expect(LEGAL_ROUTES).toContain(doc.route);
    }
    expect(LEGAL_ROUTES).toContain('/legal');
  });

  it('resolves documents by slug and lists related documents', () => {
    const terms = getLegalDocument('terms');
    expect(terms.route).toBe('/terms');
    const related = getRelatedLegalDocuments('terms');
    expect(related).not.toContainEqual(expect.objectContaining({ slug: 'terms' }));
    expect(related.length).toBe(LEGAL_DOCUMENTS.length - 1);
  });

  it('marks unknown contact/legal facts as placeholders', () => {
    // Everything that must be supplied by the operator stays visibly marked
    // until real facts are provided. The patent statement is intentionally
    // final neutral wording, so it is excluded here.
    for (const [key, value] of Object.entries(LEGAL_PLACEHOLDERS)) {
      if (key !== 'patentStatement' && typeof value === 'string') {
        expect(value).toMatch(/\[\[/);
      }
    }
  });

  it('keeps a neutral patent statement without claiming patent status', () => {
    const statement = LEGAL_PLACEHOLDERS.patentStatement.toLowerCase();
    expect(statement).toContain('intellectual property');
    // Must never claim an actual patent or patent-pending status.
    expect(statement).not.toMatch(/\bpatented\b/);
    expect(statement).not.toMatch(/patent pending/);
  });
});

describe('legal helpers', () => {
  it('formats ISO dates as readable dates', () => {
    expect(formatLegalDate('2026-08-15')).toBe('August 15, 2026');
  });

  it('falls back to the raw value for unparseable dates', () => {
    expect(formatLegalDate('not-a-date')).toBe('not-a-date');
  });

  it('builds a dynamic copyright line with the current year', () => {
    expect(COPYRIGHT_LINE).toBe(`© ${new Date().getFullYear()} GamerZ Hub. All rights reserved.`);
  });
});
