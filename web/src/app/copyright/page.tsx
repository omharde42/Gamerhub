import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LegalPageShell,
  LegalSection,
  LegalP,
  LegalList,
  LegalNote,
} from '@/components/legal/legal-page-shell';
import { BRAND_NAME, COPYRIGHT_LINE, LEGAL_PLACEHOLDERS } from '@/config/legal';

export const metadata: Metadata = {
  title: 'Copyright & Intellectual Property | GamerZ Hub',
  description:
    'Who owns the GamerZ Hub software, design, and content; how user-generated content is treated; and how to report alleged copyright infringement.',
};

const toc = [
  { id: 'overview', label: 'Overview' },
  { id: 'platform', label: 'GamerZ Hub Platform & Brand' },
  { id: 'user-content', label: 'User-Generated Content' },
  { id: 'third-party', label: 'Third-Party & Open-Source Assets' },
  { id: 'infringement', label: 'Reporting Copyright Infringement' },
  { id: 'patents', label: 'Patent Status' },
];

export default function CopyrightPage() {
  return (
    <LegalPageShell
      docSlug="copyright"
      toc={toc}
      intro={
        <>
          This page explains who owns what on {BRAND_NAME}, how third-party assets are attributed,
          and how to report alleged copyright infringement. {COPYRIGHT_LINE}
        </>
      }
    >
      <LegalSection id="overview" title="1. Overview">
        <LegalP>
          The Platform is a community and competitive-gaming network. Its intellectual property
          falls into three buckets: (a) what {BRAND_NAME} owns, (b) what its users own, and (c) what
          third parties own. This page explains each.
        </LegalP>
      </LegalSection>

      <LegalSection id="platform" title="2. GamerZ Hub Platform & Brand">
        <LegalP>
          Unless stated otherwise, the following are owned by or licensed to the operator of{' '}
          {BRAND_NAME} and are protected by applicable intellectual property laws:
        </LegalP>
        <LegalList
          items={[
            <>The GamerZ Hub software, including its source code, application architecture, and underlying systems,</>,
            <>The website design, layout, user interface, and visual identity,</>,
            <>Graphics, logos, icons, and branding elements used by the Platform,</>,
            <>Original content produced by {BRAND_NAME}, including documentation and marketing materials,</>,
            <>The structure and organization of the Platform’s databases, where protectable.</>,
          ]}
        />
        <LegalP>
          The {BRAND_NAME} name and logo are proprietary to the Platform. Nothing in this page or
          elsewhere on the Platform grants you any right to use them except to identify the Platform
          as required for linking. The Platform does not currently assert registered trademark
          rights; this statement does not limit rights that may exist or arise under applicable law.
        </LegalP>
        <LegalP>
          You may not copy, reproduce, modify, distribute, display, or create derivative works from
          the Platform’s proprietary materials except as expressly permitted by these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection id="user-content" title="3. User-Generated Content">
        <LegalP>
          Users retain ownership of the content they post, upload, or share on the Platform — posts,
          comments, media, messages, and profile content. By posting content, users grant the
          Platform a limited license to operate the service, as described in the{' '}
          <Link href="/license" className="text-primary hover:underline">User Content License Agreement</Link>.
        </LegalP>
        <LegalP>
          The Platform does not claim ownership of user content. However, by posting content you
          represent that you have the right to do so — see the User Content License Agreement for
          details.
        </LegalP>
      </LegalSection>

      <LegalSection id="third-party" title="4. Third-Party & Open-Source Assets">
        <LegalP>
          The Platform is built on open-source software and integrates third-party services. The
          copyrights in those components belong to their respective owners and are used under their
          respective licenses. A curated list of major dependencies and licenses is available on our{' '}
          <Link href="/licenses" className="text-primary hover:underline">Open-Source Licenses</Link> page.
        </LegalP>
        <LegalP>
          Game names, marks, and related assets (for example, Valorant, CS2, Clash of Clans, PUBG,
          Steam) are the property of their respective owners. Their mention on the Platform is for
          identification and community purposes only and does not imply endorsement or affiliation.
        </LegalP>
      </LegalSection>

      <LegalSection id="infringement" title="5. Reporting Copyright Infringement">
        <LegalP>
          We respect the intellectual property rights of others and expect our users to do the same.
          If you believe in good faith that content on the Platform infringes a copyright you own or
          control, you may submit a notice to us containing:
        </LegalP>
        <LegalList
          ordered
          items={[
            <>Identification of the copyrighted work claimed to be infringed (or a representative list),</>,
            <>The exact location of the allegedly infringing content on the Platform (URL or profile),</>,
            <>Your contact information (name, email address),</>,
            <>A statement that you have a good-faith belief the use is not authorized by the rights owner, its agent, or the law, and</>,
            <>A statement, under penalty of perjury where applicable, that the information in your notice is accurate and that you are authorized to act on behalf of the rights owner.</>,
          ]}
        />
        <LegalP>
          Send notices to <span className="font-mono text-primary/90">{LEGAL_PLACEHOLDERS.legalContactEmail}</span>.
          We review notices and may remove or disable access to content we reasonably believe to be
          infringing, and may terminate the accounts of repeat infringers where appropriate.
        </LegalP>
        <LegalNote tone="warn">
          Filing a knowingly false or abusive copyright notice may expose you to liability in some
          jurisdictions (for example, under 17 U.S.C. § 512(f) in the United States or equivalent
          laws elsewhere). Consult qualified legal counsel before submitting a notice.
        </LegalNote>
      </LegalSection>

      <LegalSection id="patents" title="6. Patent Status">
        <LegalP>{LEGAL_PLACEHOLDERS.patentStatement}</LegalP>
        <LegalNote>
          {BRAND_NAME} has not claimed any patent or “patent pending” status. This statement should
          only be changed after actual patent filings or registrations are provided and verified.
        </LegalNote>
      </LegalSection>
    </LegalPageShell>
  );
}
