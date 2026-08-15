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
  title: 'Privacy Policy | GamerZ Hub',
  description:
    'How GamerZ Hub collects, uses, stores, and protects your personal data — account details, profile information, game data, messages, payments, and more.',
};

const toc = [
  { id: 'scope', label: 'Scope of this Policy' },
  { id: 'collect', label: 'Information We Collect' },
  { id: 'use', label: 'How We Use Your Information' },
  { id: 'legal-bases', label: 'Legal Bases for Processing' },
  { id: 'storage', label: 'Storage & Security' },
  { id: 'sharing', label: 'Data Sharing & Third-Party Processors' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'rights', label: 'Your Rights & Choices' },
  { id: 'children', label: 'Children’s Privacy' },
  { id: 'transfers', label: 'International Data Transfers' },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      docSlug="privacy"
      toc={toc}
      intro={
        <>
          This Privacy Policy explains what personal information {BRAND_NAME} (“we”, “us”) collects,
          why we collect it, how it is used and protected, and the choices you have. It reflects the
          way the Platform is actually built today. If you do not agree with this Policy, please do
          not use the Platform.
        </>
      }
    >
      <LegalSection id="scope" title="1. Scope of this Policy">
        <LegalP>
          This Policy applies to the {BRAND_NAME} website and platform (the “Platform”), including
          accounts, profiles, posts, messaging, teams, tournaments, game connections, and paid
          subscriptions. It does not apply to third-party services we integrate with, each of which
          has its own privacy policy.
        </LegalP>
      </LegalSection>

      <LegalSection id="collect" title="2. Information We Collect">
        <LegalP>
          <strong>Information you provide when you register and use the Platform:</strong>
        </LegalP>
        <LegalList
          items={[
            <><strong>Account information</strong> — your email address, username, and password (stored only as a one-way hash, never in plain text). Email verification and optional two-factor authentication (2FA) settings.</>,
            <><strong>Profile information (voluntary)</strong> — display name, avatar, banner, bio, country, city, languages, age, timezone, gaming preferences (play style, communication style, availability, preferred gaming time), main games, ranks, achievements, certifications, tournament history, skills, endorsements, and links to your accounts on other platforms (Twitch, YouTube, Discord, Steam, X/Twitter, Instagram, Kick, Facebook Gaming, or a personal website).</>,
            <><strong>Content you create</strong> — posts, comments, media you upload (images and videos), direct messages (including end-to-end encrypted messages), server messages, and profile content.</>,
            <><strong>Communications</strong> — messages you send us (support inquiries), job applications, and partnership/sponsorship applications (which include your contact name, email, and organization details).</>,
          ]}
        />
        <LegalP>
          <strong>Information we collect when you connect accounts or games:</strong>
        </LegalP>
        <LegalList
          items={[
            <><strong>Connected sign-in accounts</strong> — when you sign in or link Google, Discord, or Steam, we receive the profile data those providers share with us (provider ID, email, username/display name, avatar), and store connection tokens so the link keeps working.</>,
            <><strong>Game data</strong> — when you connect a supported game (for example, Clash of Clans, PUBG, or Steam), we store your in-game ID/name, region, rank, level, and statistics such as kills/deaths, win rate, accuracy, matches played, and achievements. Where you authorize it, this data is retrieved from the official game APIs (Supercell, PUBG, Steam).</>,
          ]}
        />
        <LegalP>
          <strong>Information collected automatically:</strong>
        </LegalP>
        <LegalList
          items={[
            <><strong>Technical data</strong> — your IP address and browser user-agent are recorded in session and security audit records to protect your account and the Platform.</>,
            <><strong>Payment information</strong> — when you purchase a subscription, Stripe processes your payment. We do not see or store your full card number. We store only the subscription tier, status, billing period, and a Stripe reference identifier.</>,
            <><strong>Cookies and local storage</strong> — we set an essential security cookie (CSRF token) and, during certain sign-in flows, Supabase Auth storage. The Platform also uses browser local storage to keep you signed in (access/refresh tokens), remember preferences, store your end-to-end encryption keys, and remember recent searches. See our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.</>,
          ]}
        />
        <LegalP>
          <strong>What we do not collect:</strong> the Platform does not use third-party advertising,
          analytics, or tracking cookies, and we do not sell your personal information.
        </LegalP>
      </LegalSection>

      <LegalSection id="use" title="3. How We Use Your Information">
        <LegalP>We use the information we collect to:</LegalP>
        <LegalList
          items={[
            <>Operate, maintain, and improve the Platform — including accounts, profiles, feeds, messaging, teams, tournaments, matchmaking, leaderboards, and game connections.</>,
            <>Verify game data through official APIs so that ranks and statistics shown on the Platform are accurate, and to display your profile and stats to the community as you intend.</>,
            <>Send you service communications — account verification, password resets, security alerts, and (where you have chosen to receive them) notifications about activity on the Platform.</>,
            <>Process subscriptions and payments through Stripe.</>,
            <>Provide AI-assisted features (such as the AI Coach and AI resume summaries) using OpenAI, based on the profile and game data you provide.</>,
            <>Detect, prevent, and respond to fraud, abuse, security incidents, and violations of our Terms and Community Guidelines.</>,
            <>Comply with legal obligations and enforce our rights.</>,
          ]}
        />
        <LegalP>
          Some of your profile information and content is <strong>public</strong> by design: other
          members of the community can see your public profile, posts, teams, and tournament
          participation. Please consider this before sharing personal details.
        </LegalP>
      </LegalSection>

      <LegalSection id="legal-bases" title="4. Legal Bases for Processing">
        <LegalP>
          We process personal information on the following bases, depending on the activity and your
          location: (a) performance of the contract with you (these Terms), (b) your consent, which
          you may withdraw at any time, (c) our legitimate interests in operating and securing the
          Platform, and (d) compliance with legal obligations. Where the EU General Data Protection
          Regulation (GDPR) or similar law applies to you, these bases are relied upon accordingly.
        </LegalP>
      </LegalSection>

      <LegalSection id="storage" title="5. Storage & Security">
        <LegalP>We use a combination of technical and organizational measures to protect your data:</LegalP>
        <LegalList
          items={[
            <>Data is stored in a PostgreSQL database hosted on Supabase, with media (images, videos) stored on Cloudinary.</>,
            <>Traffic to and from the Platform is encrypted in transit (HTTPS/TLS).</>,
            <>Passwords are hashed with bcrypt and never stored in plain text; 2FA secrets are encrypted at rest; session tokens are stored securely.</>,
            <>Private messages support end-to-end encryption: message keys are generated and stored on your own device, so encrypted messages cannot be read by the Platform.</>,
            <>Access to production data is restricted to authorized personnel, and security fixes are addressed as described in SECURITY.md.</>,
          ]}
        />
        <LegalNote>
          No method of transmission or storage is completely secure. While we work hard to protect
          your data, we cannot guarantee absolute security. See the{' '}
          <Link href="/disclaimer" className="text-primary hover:underline">Disclaimer</Link>.
        </LegalNote>
      </LegalSection>

      <LegalSection id="sharing" title="6. Data Sharing & Third-Party Processors">
        <LegalP>
          We do not sell your personal information. We share data only with the service providers
          needed to run the Platform, and only to the extent necessary:
        </LegalP>
        <LegalList
          items={[
            <><strong>Supabase</strong> — database hosting and OAuth sign-in (Google/Discord flows).</>,
            <><strong>Stripe</strong> — payment processing and subscription billing.</>,
            <><strong>Cloudinary</strong> — media storage and delivery.</>,
            <><strong>OpenAI</strong> — AI Coach and AI-assisted features.</>,
            <><strong>Official game API providers</strong> (Steam, Supercell, PUBG) — verifying connected game accounts and statistics.</>,
            <><strong>Email/SMTP provider</strong> — sending account verification, password reset, and notification emails.</>,
            <><strong>Redis / hosting providers</strong> — caching and infrastructure that powers real-time features.</>,
          ]}
        />
        <LegalP>
          We may also disclose information where required by law, regulation, or legal process, or
          where necessary to protect the rights, property, or safety of the Platform, our users, or
          the public. Our full dependency and attribution list is on the{' '}
          <Link href="/licenses" className="text-primary hover:underline">Open-Source Licenses</Link> page.
        </LegalP>
      </LegalSection>

      <LegalSection id="retention" title="7. Data Retention">
        <LegalP>
          We retain your information for as long as your account is active and for as long as needed
          to provide the Platform, comply with legal obligations, resolve disputes, and enforce our
          agreements. Specifically:
        </LegalP>
        <LegalList
          items={[
            <>Account and profile data are retained while your account exists.</>,
            <>Security logs (including IP addresses) are retained for a limited period for abuse and fraud prevention.</>,
            <>Content you delete is removed from public view; copies may persist temporarily in backups or in content already distributed to others.</>,
            <>Subscription records are retained for accounting and tax purposes as required by law.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="rights" title="8. Your Rights & Choices">
        <LegalP>Depending on where you live, you may have the right to:</LegalP>
        <LegalList
          items={[
            <><strong>Access</strong> — request a copy of the personal information we hold about you.</>,
            <><strong>Correction</strong> — update or correct inaccurate information (you can also edit most profile data yourself in Settings).</>,
            <><strong>Deletion</strong> — request deletion of your account and associated data.</>,
            <><strong>Restriction and objection</strong> — ask us to limit or stop certain processing, where applicable.</>,
            <><strong>Portability</strong> — receive your data in a structured, machine-readable format, where applicable.</>,
            <><strong>Withdraw consent</strong> — where processing is based on consent, you may withdraw it at any time.</>,
          ]}
        />
        <LegalP>
          To exercise any of these rights, contact us using the details in the Contact section
          below. We will respond within the timeframe required by applicable law. Where your request
          is made under the GDPR or similar law, you may also have the right to lodge a complaint
          with your local data protection authority.
        </LegalP>
        <LegalNote>
          Self-service account deletion is not yet available inside the app. If you request account
          deletion, we will process your request and delete or anonymize your personal information,
          except where we are required to retain it by law or for legitimate, documented business
          purposes (for example, fraud prevention records).
        </LegalNote>
      </LegalSection>

      <LegalSection id="children" title="9. Children’s Privacy">
        <LegalP>
          The Platform is not directed at children under {LEGAL_PLACEHOLDERS.minimumAge}. We do not
          knowingly collect personal information from children below that age. If you believe a child
          has provided us with personal information, please contact us and we will take steps to
          delete it.
        </LegalP>
      </LegalSection>

      <LegalSection id="transfers" title="10. International Data Transfers">
        <LegalP>
          The Platform and its service providers operate in multiple countries. Your personal
          information may be transferred to, and processed in, countries other than the one where
          you reside, including countries that may not offer the same level of data protection. Where
          such transfers occur, we rely on appropriate safeguards (such as standard contractual
          clauses) where required by applicable law.
        </LegalP>
      </LegalSection>

      <LegalSection id="changes" title="11. Changes to This Policy">
        <LegalP>
          We may update this Privacy Policy from time to time. The current version, with its
          effective and last-updated dates, is always available on this page. If we make material
          changes, we will take reasonable steps to notify you, such as an announcement on the
          Platform.
        </LegalP>
      </LegalSection>

      <LegalSection id="contact" title="12. Contact Us">
        <LegalP>
          If you have questions about this Privacy Policy or wish to exercise your data rights,
          contact us at <span className="font-mono text-primary/90">{LEGAL_PLACEHOLDERS.legalContactEmail}</span>.
          {LEGAL_PLACEHOLDERS.legalEntityName} is the entity responsible for the personal information
          described in this Policy. {LEGAL_PLACEHOLDERS.registeredAddress}
        </LegalP>
      </LegalSection>
    </LegalPageShell>
  );
}
