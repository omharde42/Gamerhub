import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LegalPageShell,
  LegalSection,
  LegalP,
  LegalList,
  LegalNote,
} from '@/components/legal/legal-page-shell';
import { BRAND_NAME } from '@/config/legal';

export const metadata: Metadata = {
  title: 'Cookie Policy | GamerZ Hub',
  description:
    'The cookies and browser storage GamerZ Hub uses — essential security cookies, sign-in storage, and your controls. No advertising or analytics trackers.',
};

const toc = [
  { id: 'overview', label: 'Overview' },
  { id: 'cookies', label: 'Cookies We Use' },
  { id: 'storage', label: 'Browser Storage (localStorage & sessionStorage)' },
  { id: 'third-party', label: 'Third-Party Technologies' },
  { id: 'controls', label: 'Your Controls' },
  { id: 'retention', label: 'Retention' },
  { id: 'changes', label: 'Changes to This Policy' },
];

export default function CookiesPage() {
  return (
    <LegalPageShell
      docSlug="cookies"
      toc={toc}
      intro={
        <>
          This Cookie Policy explains how {BRAND_NAME} uses cookies and similar browser storage
          technologies, and the controls available to you. It is part of and incorporated into the{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </>
      }
    >
      <LegalSection id="overview" title="1. Overview">
        <LegalP>
          The Platform uses a small number of <strong>essential</strong> cookies and browser storage
          entries needed for security and sign-in. We do <strong>not</strong> use advertising
          cookies, analytics cookies, or third-party tracking cookies of any kind.
        </LegalP>
      </LegalSection>

      <LegalSection id="cookies" title="2. Cookies We Use">
        <LegalList
          items={[
            <><strong>XSRF-TOKEN (essential, first-party)</strong> — a security token our API sets to protect against cross-site request forgery (CSRF). It is required for safe operation of the service and is sent with requests to our API. It has no expiry set and is cleared when you close your browser or clear site data. This cookie cannot be disabled without breaking the service.</>,
            <><strong>Supabase Auth storage (essential during sign-in)</strong> — when you sign in using our Supabase-powered flows (Google or Discord), Supabase may store session data in your browser as part of the authentication process. This is required for those sign-in methods to work.</>,
          ]}
        />
        <LegalP>
          We do not set any cookies for advertising, analytics, personalization, or social media
          tracking.
        </LegalP>
      </LegalSection>

      <LegalSection id="storage" title="3. Browser Storage (localStorage & sessionStorage)">
        <LegalP>
          In addition to cookies, the Platform uses browser storage to keep you signed in and to
          remember your preferences. This data stays in your browser and is not sent to third
          parties:
        </LegalP>
        <LegalList
          items={[
            <><strong>Authentication tokens</strong> (localStorage) — your access and refresh tokens, used to keep you signed in between visits. Cleared when you sign out.</>,
            <><strong>Auth session store</strong> (localStorage) — the saved authentication state used to restore your session on return visits.</>,
            <><strong>End-to-end encryption keys</strong> (localStorage / device preferences) — cryptographic key pairs used to encrypt and decrypt private messages. Keys never leave your device.</>,
            <><strong>Recent searches</strong> (localStorage) — the last searches you performed, stored only on your device so we can show them when you return to Search.</>,
            <><strong>Dismissed update notices &amp; reload tracking</strong> (localStorage / sessionStorage) — small flags that remember which notices you dismissed and prevent duplicate page reloads.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="third-party" title="4. Third-Party Technologies">
        <LegalP>
          Some third-party services we integrate with may set their own storage or cookies when you
          interact with them:
        </LegalP>
        <LegalList
          items={[
            <><strong>Supabase</strong> — session storage for OAuth sign-in (see Section 2).</>,
            <><strong>Stripe</strong> — when you are redirected to Stripe Checkout to pay for a subscription, Stripe may set its own cookies on its domains, governed by Stripe’s privacy policy.</>,
          ]}
        />
        <LegalP>
          We do not control third-party cookies. Please review the privacy policies of these
          providers for details.
        </LegalP>
      </LegalSection>

      <LegalSection id="controls" title="5. Your Controls">
        <LegalList
          items={[
            <><strong>Signing out</strong> removes your authentication tokens from browser storage.</>,
            <><strong>Browser settings</strong> — you can view, block, or delete cookies and site data through your browser’s settings. Blocking essential cookies or clearing storage may sign you out or prevent the service from working.</>,
            <><strong>Clearing site data</strong> removes all {BRAND_NAME} cookies and storage, including your end-to-end encryption keys (which cannot be recovered, though the Platform can generate new ones).</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="retention" title="6. Retention">
        <LegalP>
          Cookies and storage entries persist until you sign out, clear your browser data, or until
          they expire as described above. Authentication tokens expire on the schedule set by our
          servers (currently up to 90 days for refresh tokens) and are refreshed as you use the
          service.
        </LegalP>
      </LegalSection>

      <LegalSection id="changes" title="7. Changes to This Policy">
        <LegalP>
          We may update this Cookie Policy if our use of cookies or storage changes. The current
          version, with its effective and last-updated dates, is always available on this page.
        </LegalP>
        <LegalNote>
          Questions about this policy? Contact us via the{' '}
          <Link href="/legal" className="text-primary hover:underline">Legal Contact</Link> page.
        </LegalNote>
      </LegalSection>
    </LegalPageShell>
  );
}
