import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LegalPageShell,
  LegalSection,
  LegalP,
  LegalList,
  LegalNote,
} from '@/components/legal/legal-page-shell';
import { BRAND_NAME, LEGAL_PLACEHOLDERS } from '@/config/legal';

export const metadata: Metadata = {
  title: 'User Content License Agreement | GamerZ Hub',
  description:
    'The narrow, limited license users grant GamerZ Hub when they post, upload, or share content — you keep ownership of your content.',
};

const toc = [
  { id: 'overview', label: 'Overview' },
  { id: 'ownership', label: 'You Own Your Content' },
  { id: 'license', label: 'License You Grant to GamerZ Hub' },
  { id: 'purpose', label: 'Purpose of the License' },
  { id: 'responsibility', label: 'Your Responsibility for Submitted Content' },
  { id: 'moderation', label: 'Moderation & Removal' },
  { id: 'termination', label: 'Termination & What Happens After Deletion' },
  { id: 'infringement', label: 'Copyright Infringement & Third-Party Rights' },
];

export default function LicensePage() {
  return (
    <LegalPageShell
      docSlug="license"
      toc={toc}
      intro={
        <>
          This agreement explains the rights you grant to {BRAND_NAME} when you upload, submit, post,
          or otherwise provide content to the Platform. It is intentionally narrow: you keep
          ownership of your content, and we only receive the rights needed to run the service.
        </>
      }
    >
      <LegalSection id="overview" title="1. Overview">
        <LegalP>
          “Content” means anything you upload, submit, post, transmit, or otherwise make available
          on the Platform, including posts, comments, images, videos, messages, profile information,
          game statistics, and any other material. This agreement is part of and incorporated into
          the <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>.
        </LegalP>
      </LegalSection>

      <LegalSection id="ownership" title="2. You Own Your Content">
        <LegalP>
          You retain all ownership rights and intellectual property rights in your Content. The
          Platform claims no ownership over it. Nothing in this agreement transfers your rights to
          {BRAND_NAME}; you only grant the limited license described below.
        </LegalP>
      </LegalSection>

      <LegalSection id="license" title="3. License You Grant to GamerZ Hub">
        <LegalP>
          By providing Content to the Platform, you grant {BRAND_NAME} a worldwide, non-exclusive,
          royalty-free, transferable (only to service providers and successors who operate the
          Platform), sublicensable (only to the service providers who help us operate the Platform)
          license to use, reproduce, host, store, format, translate, display, distribute, and
          publicly perform your Content — but only for the purposes described in Section 4.
        </LegalP>
        <LegalNote>
          This license is limited to what is necessary to operate the Platform. It does not give{' '}
          {BRAND_NAME} the right to sell your Content, use it in advertising without your consent, or
          license it to third parties beyond the service providers who help run the Platform.
        </LegalNote>
      </LegalSection>

      <LegalSection id="purpose" title="4. Purpose of the License">
        <LegalP>The license exists solely to allow the Platform to:</LegalP>
        <LegalList
          items={[
            <>Display your Content to other users in the manner you intended (feeds, profiles, teams, tournaments, servers),</>,
            <>Store, back up, and deliver your Content (including resizing and re-encoding media for different devices),</>,
            <>Allow the Platform’s moderation and safety systems to review Content against our rules,</>,
            <>Provide Content to our service providers (for example, Cloudinary for media hosting) to the extent needed to operate the service, and</>,
            <>Maintain, secure, and improve the Platform.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="responsibility" title="5. Your Responsibility for Submitted Content">
        <LegalP>
          You are solely responsible for the Content you provide. You represent and warrant that:
        </LegalP>
        <LegalList
          items={[
            <>You own your Content or have all necessary rights, licenses, and permissions to provide it,</>,
            <>Your Content does not infringe the intellectual property, privacy, or other rights of any third party, and</>,
            <>Your Content complies with the <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link> and the <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>.</>,
          ]}
        />
        <LegalP>
          If you do not have the right to post something — for example, content you copied from
          another creator — do not post it.
        </LegalP>
      </LegalSection>

      <LegalSection id="moderation" title="6. Moderation & Removal">
        <LegalP>
          We may remove, hide, or restrict access to Content that violates our rules, the law, or
          the rights of others, as described in the Terms &amp; Conditions. We may also remove
          Content upon a valid takedown request — see the{' '}
          <Link href="/copyright" className="text-primary hover:underline">Copyright &amp; IP</Link> page
          for the reporting process. Removal does not affect your ownership of the Content.
        </LegalP>
      </LegalSection>

      <LegalSection id="termination" title="7. Termination & What Happens After Deletion">
        <LegalP>
          The license you grant continues for as long as your Content remains on the Platform. When
          you delete Content, or when your account is deleted or terminated, the license ends with
          respect to that Content, and we will stop using it, except:
        </LegalP>
        <LegalList
          items={[
            <>Content already shared with or displayed to other users may remain visible to them (for example, in conversations or re-shared posts),</>,
            <>Copies may persist temporarily in backups and security logs, and</>,
            <>We may retain Content where required by law or for legitimate documented purposes such as investigating abuse or fraud.</>,
          ]}
        />
        <LegalP>
          The license is granted to the Platform itself, not to other users: other users do not
          receive a license to reuse your Content beyond normal platform usage (viewing, liking,
          commenting, and sharing within the Platform as its features allow).
        </LegalP>
      </LegalSection>

      <LegalSection id="infringement" title="8. Copyright Infringement & Third-Party Rights">
        <LegalP>
          If you believe your copyright has been infringed by Content on the Platform, follow the
          process on our <Link href="/copyright" className="text-primary hover:underline">Copyright &amp; IP</Link>{' '}
          page. Reports can be sent to{' '}
          <span className="font-mono text-primary/90">{LEGAL_PLACEHOLDERS.legalContactEmail}</span>.
        </LegalP>
      </LegalSection>
    </LegalPageShell>
  );
}
