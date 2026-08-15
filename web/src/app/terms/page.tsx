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
  title: 'Terms & Conditions | GamerZ Hub',
  description:
    'The terms and conditions that govern your use of the GamerZ Hub platform — accounts, acceptable use, user content, payments, liability, and more.',
};

const toc = [
  { id: 'acceptance', label: 'Acceptance of these Terms' },
  { id: 'eligibility', label: 'Eligibility & Age Requirements' },
  { id: 'accounts', label: 'Accounts & Security' },
  { id: 'responsibilities', label: 'User Responsibilities' },
  { id: 'acceptable-use', label: 'Acceptable Use & Prohibited Activities' },
  { id: 'behavior', label: 'Gaming & Community Behavior' },
  { id: 'content', label: 'User-Generated Content' },
  { id: 'moderation', label: 'Content Moderation & Enforcement' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'third-party', label: 'Third-Party Services & External Links' },
  { id: 'payments', label: 'Payments, Subscriptions & Refunds' },
  { id: 'termination', label: 'Suspension & Termination' },
  { id: 'availability', label: 'Service Availability & Changes' },
  { id: 'changes', label: 'Changes to These Terms' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'law', label: 'Governing Law & Dispute Resolution' },
  { id: 'general', label: 'Severability & Entire Agreement' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      docSlug="terms"
      toc={toc}
      intro={
        <>
          These Terms &amp; Conditions (“<strong>Terms</strong>”) form a legally binding agreement
          between you and the operator of {BRAND_NAME} (the “<strong>Platform</strong>”). By
          creating an account, accessing, or using the Platform, you agree to be bound by these
          Terms. If you do not agree, please do not use the Platform.
        </>
      }
    >
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <LegalP>
          By accessing or using the Platform — including browsing public pages, creating an account,
          posting content, joining teams or tournaments, sending messages, or purchasing a
          subscription — you accept and agree to these Terms, our{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, and
          our <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>.
          These documents together form the entire agreement between you and the Platform.
        </LegalP>
        <LegalP>
          If you use the Platform on behalf of an organization, you represent that you have
          authority to bind that organization to these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility & Age Requirements">
        <LegalP>
          You must be at least {LEGAL_PLACEHOLDERS.minimumAge} years old to create an account on the
          Platform, and you must have the legal capacity to enter into these Terms in your
          jurisdiction. If you are under the age of majority where you live, a parent or legal
          guardian must review and accept these Terms on your behalf.
        </LegalP>
        <LegalP>
          We do not knowingly collect personal information from children below the applicable
          minimum age. If you believe a child has provided us with personal information, please
          contact us using the details in the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </LegalP>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts & Security">
        <LegalP>
          Some features require an account. When you register, you agree to provide accurate,
          current, and complete information, and to keep it up to date.
        </LegalP>
        <LegalList
          ordered
          items={[
            <>You are responsible for maintaining the confidentiality of your login credentials (email, password, and any connected third-party sign-in such as Google, Discord, or Steam).</>,
            <>You are responsible for all activity that occurs under your account, whether or not authorized by you.</>,
            <>You must notify us promptly if you suspect unauthorized access to your account or any breach of security.</>,
            <>You may not sell, rent, lease, or otherwise transfer your account to another person.</>,
            <>We offer optional two-factor authentication (2FA) and encourage you to enable it.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="responsibilities" title="4. User Responsibilities">
        <LegalP>When using the Platform, you agree to:</LegalP>
        <LegalList
          items={[
            <>Comply with these Terms, the <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>, and all applicable laws and regulations.</>,
            <>Provide truthful information about yourself, including any gaming stats, ranks, and achievements you submit or verify.</>,
            <>Respect the rights of other users and of third parties.</>,
            <>Use the Platform only for its intended purpose: connecting, competing, and communicating within the gaming community.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="acceptable-use" title="5. Acceptable Use & Prohibited Activities">
        <LegalP>
          You may not use the Platform to engage in any of the following (this list is not
          exhaustive):
        </LegalP>
        <LegalList
          items={[
            <>Harass, bully, threaten, or intimidate any person.</>,
            <>Post hateful, discriminatory, or abusive content, or content that promotes violence.</>,
            <>Post spam, unsolicited advertising, or fraudulent or misleading content.</>,
            <>Impersonate another person, organization, or entity.</>,
            <>Attempt to access another user’s account, credentials, or private data.</>,
            <>Attempt to gain unauthorized access to the Platform’s systems, servers, or databases, or interfere with their operation (including denial-of-service attacks, probing, or scanning).</>,
            <>Distribute malware, viruses, or other harmful code.</>,
            <>Exploit bugs, errors, or vulnerabilities in the Platform for unfair advantage, and fail to report them when discovered.</>,
            <>Cheat, hack, or use unauthorized third-party software in connection with games or competitions organized through the Platform.</>,
            <>Engage in any illegal activity, or encourage others to do so.</>,
            <>Post content that is unlawful, obscene, or otherwise prohibited by the <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>.</>,
            <>Use automated tools (bots, scrapers) to access the Platform in ways that violate our rules or disrupt the service.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="behavior" title="6. Gaming & Community Behavior">
        <LegalP>
          The Platform hosts competitive gaming features: teams, tournaments, challenges,
          matchmaking, and leaderboards. You agree to compete honestly, follow tournament and match
          rules set by organizers, and treat opponents with respect. Manipulating match outcomes,
          win-trading, smurfing where prohibited by tournament rules, or abusing reporting tools may
          result in enforcement action as described in the{' '}
          <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>.
        </LegalP>
      </LegalSection>

      <LegalSection id="content" title="7. User-Generated Content">
        <LegalP>
          You retain ownership of the content you post, upload, or share on the Platform (posts,
          comments, media, messages, profiles, and similar). By posting content you grant the
          Platform the limited license described in our{' '}
          <Link href="/license" className="text-primary hover:underline">User Content License Agreement</Link>.
        </LegalP>
        <LegalP>
          You are solely responsible for the content you submit and for ensuring it does not violate
          these Terms, the <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>,
          or the rights of any third party. We may remove content that violates these rules.
        </LegalP>
      </LegalSection>

      <LegalSection id="moderation" title="8. Content Moderation & Enforcement">
        <LegalP>
          We monitor and moderate content and behavior on the Platform to keep the community safe.
          Depending on the severity and frequency of a violation, we may take any of the following
          actions, in our reasonable discretion and without prior notice:
        </LegalP>
        <LegalList
          items={[
            <>Issue a warning,</>,
            <>Remove or hide content,</>,
            <>Temporarily restrict access to features or your account,</>,
            <>Suspend or permanently terminate your account, and/or</>,
            <>Report unlawful activity to the appropriate authorities.</>,
          ]}
        />
        <LegalP>
          You may report content or users you believe violate the rules using the Platform’s
          reporting features or by contacting us as described in{' '}
          <Link href="/legal" className="text-primary hover:underline">Legal Contact</Link>.
        </LegalP>
      </LegalSection>

      <LegalSection id="ip" title="9. Intellectual Property">
        <LegalP>
          The Platform — including its software, design, graphics, logos, original content, and
          documentation — is owned by or licensed to the operator of {BRAND_NAME} and is protected by
          intellectual property laws. You may not copy, modify, distribute, sell, or create
          derivative works from the Platform except as expressly permitted. See our{' '}
          <Link href="/copyright" className="text-primary hover:underline">Copyright &amp; Intellectual Property</Link>{' '}
          page for details.
        </LegalP>
        <LegalP>
          You retain all rights in your own content, as described in Section 7 and the{' '}
          <Link href="/license" className="text-primary hover:underline">User Content License Agreement</Link>.
        </LegalP>
      </LegalSection>

      <LegalSection id="third-party" title="10. Third-Party Services & External Links">
        <LegalP>
          The Platform integrates with third-party services, including Supabase (authentication and
          database hosting), Stripe (payment processing), Cloudinary (media hosting), OpenAI (AI
          features), and official game APIs (Steam, Supercell, PUBG) used to verify game data. These
          services operate under their own terms and privacy policies, which we encourage you to
          review.
        </LegalP>
        <LegalP>
          The Platform may contain links to external websites or services that we do not control. We
          are not responsible for the content, policies, or practices of any third-party website or
          service.
        </LegalP>
      </LegalSection>

      <LegalSection id="payments" title="11. Payments, Subscriptions & Refunds">
        <LegalP>
          The Platform offers optional paid subscriptions that unlock premium features. Payments are
          processed by Stripe; the Platform does not store your full card details. By purchasing a
          subscription you agree to the applicable billing terms, including recurring charges until
          you cancel.
        </LegalP>
        <LegalP>
          Cancellation and refunds are handled as described in our{' '}
          <Link href="/refund-policy" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>.
        </LegalP>
      </LegalSection>

      <LegalSection id="termination" title="12. Suspension & Termination">
        <LegalP>
          We may suspend or terminate your access to the Platform, in whole or in part, if you
          violate these Terms or the Community Guidelines, if required by law, or if we believe your
          continued use poses a risk to the Platform or its users.
        </LegalP>
        <LegalP>
          You may stop using the Platform at any time. To delete your account and associated data,
          contact us using the details in the Contact section below; we will process your request in
          accordance with applicable law and our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </LegalP>
      </LegalSection>

      <LegalSection id="availability" title="13. Service Availability & Changes">
        <LegalP>
          We work to keep the Platform available around the clock, but we do not guarantee
          uninterrupted or error-free operation. The Platform may be temporarily unavailable for
          maintenance, upgrades, or reasons beyond our control.
        </LegalP>
        <LegalP>
          We may modify, add, or remove features of the Platform at any time. Where changes
          materially affect your rights, we will make reasonable efforts to notify you (for example,
          through announcements on the Platform).
        </LegalP>
      </LegalSection>

      <LegalSection id="changes" title="14. Changes to These Terms">
        <LegalP>
          We may update these Terms from time to time to reflect changes in the service, the law, or
          our practices. The current version, with its effective and last-updated dates, is always
          available on this page. If changes are material, we will take reasonable steps to notify
          you. Your continued use of the Platform after changes take effect constitutes acceptance
          of the updated Terms.
        </LegalP>
      </LegalSection>

      <LegalSection id="disclaimer" title="15. Disclaimer">
        <LegalP>
          The Platform is provided “as is” and “as available,” without warranties of any kind, whether
          express or implied, including implied warranties of merchantability, fitness for a
          particular purpose, and non-infringement. To the fullest extent permitted by law, we make
          no warranties that the Platform will meet your requirements, be uninterrupted, secure, or
          error-free. See the <Link href="/disclaimer" className="text-primary hover:underline">Disclaimer</Link>{' '}
          for further detail.
        </LegalP>
      </LegalSection>

      <LegalSection id="liability" title="16. Limitation of Liability">
        <LegalP>
          To the maximum extent permitted by applicable law, neither the operator of {BRAND_NAME} nor
          its officers, employees, or agents will be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits, data, or goodwill, arising out
          of or relating to your use of, or inability to use, the Platform.
        </LegalP>
        <LegalP>
          Our total aggregate liability arising out of or relating to these Terms or your use of the
          Platform will not exceed the greater of (a) the amounts you have paid to us in the twelve
          (12) months preceding the claim, or (b) one hundred US dollars (US$100). Nothing in these
          Terms limits liability that cannot be limited under applicable law.
        </LegalP>
      </LegalSection>

      <LegalSection id="indemnification" title="17. Indemnification">
        <LegalP>
          To the extent permitted by applicable law, you agree to indemnify and hold harmless the
          operator of {BRAND_NAME} and its affiliates, officers, and employees from and against any
          claims, damages, liabilities, and expenses (including reasonable attorneys’ fees) arising
          out of or related to your use of the Platform, your content, or your violation of these
          Terms or of any rights of a third party.
        </LegalP>
        <LegalNote>
          Indemnification clauses are subject to local law and may not be enforceable in every
          jurisdiction. This clause does not affect any rights you may have under mandatory consumer
          protection law where you live.
        </LegalNote>
      </LegalSection>

      <LegalSection id="law" title="18. Governing Law & Dispute Resolution">
        <LegalP>
          These Terms are governed by the laws of {LEGAL_PLACEHOLDERS.governingLaw}, without regard to
          conflict-of-law principles. Any dispute arising out of or relating to these Terms or your
          use of the Platform will be resolved through {LEGAL_PLACEHOLDERS.disputeResolution}.
        </LegalP>
        <LegalNote tone="warn">
          The governing law and dispute resolution forum are configuration placeholders. They must be
          completed by the {BRAND_NAME} operator and reviewed by qualified legal counsel before these
          Terms are relied upon. Different jurisdictions may impose mandatory rules that take
          precedence over this clause.
        </LegalNote>
      </LegalSection>

      <LegalSection id="general" title="19. Severability & Entire Agreement">
        <LegalP>
          If any provision of these Terms is held to be invalid or unenforceable, that provision will
          be modified to the minimum extent necessary to make it enforceable, and the remaining
          provisions will remain in full force and effect.
        </LegalP>
        <LegalP>
          These Terms, together with the{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>,{' '}
          <Link href="/license" className="text-primary hover:underline">User Content License Agreement</Link>,{' '}
          <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>, and{' '}
          <Link href="/refund-policy" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>,
          constitute the entire agreement between you and the Platform regarding your use of the
          service and supersede any prior agreements.
        </LegalP>
      </LegalSection>

      <LegalSection id="contact" title="20. Contact">
        <LegalP>
          Questions about these Terms can be sent to <span className="font-mono text-primary/90">{LEGAL_PLACEHOLDERS.legalContactEmail}</span>.
          For all other inquiries, see the <Link href="/legal" className="text-primary hover:underline">Legal Contact</Link>{' '}
          section.
        </LegalP>
      </LegalSection>
    </LegalPageShell>
  );
}
