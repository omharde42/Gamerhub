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
  title: 'Disclaimer | GamerZ Hub',
  description:
    'The GamerZ Hub disclaimer — service availability, accuracy of information, third-party services, user-generated content, and limits of liability.',
};

const toc = [
  { id: 'general', label: 'General Disclaimer' },
  { id: 'availability', label: 'Service Availability' },
  { id: 'accuracy', label: 'Accuracy of Information' },
  { id: 'ugc', label: 'User-Generated Content' },
  { id: 'third-party', label: 'Third-Party Services & External Links' },
  { id: 'interruptions', label: 'Technical Interruptions' },
  { id: 'security', label: 'Security Limitations' },
  { id: 'compatibility', label: 'Game & Software Compatibility' },
  { id: 'not-advice', label: 'Not Professional or Financial Advice' },
];

export default function DisclaimerPage() {
  return (
    <LegalPageShell
      docSlug="disclaimer"
      toc={toc}
      intro={
        <>
          This disclaimer limits the liability of {BRAND_NAME} and clarifies what the Platform does
          and does not promise. It is part of and incorporated into the{' '}
          <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>.
        </>
      }
    >
      <LegalSection id="general" title="1. General Disclaimer">
        <LegalP>
          The Platform is provided “as is” and “as available,” without warranties of any kind,
          whether express or implied, including implied warranties of merchantability, fitness for a
          particular purpose, title, and non-infringement. To the fullest extent permitted by
          applicable law, {BRAND_NAME} makes no representations or warranties about the Platform, its
          features, or its content.
        </LegalP>
      </LegalSection>

      <LegalSection id="availability" title="2. Service Availability">
        <LegalP>
          We aim to keep the Platform available, but we do not guarantee uninterrupted or
          error-free operation. The Platform may be unavailable from time to time for maintenance,
          upgrades, outages, or factors beyond our control. We are not liable for any loss caused by
          downtime or interruptions.
        </LegalP>
      </LegalSection>

      <LegalSection id="accuracy" title="3. Accuracy of Information">
        <LegalP>
          We work hard to keep information accurate — particularly game statistics, which we verify
          through official game APIs where supported. However:
        </LegalP>
        <LegalList
          items={[
            <>Game data shown on the Platform depends on the accuracy and availability of third-party APIs, which may change or become unavailable.</>,
            <>Statistics, ranks, and leaderboard positions are provided for informational purposes and may contain errors or be out of date.</>,
            <>We do not warrant that any data, content, or information on the Platform is complete, accurate, current, or reliable.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="ugc" title="4. User-Generated Content">
        <LegalP>
          The Platform displays content created by its users. That content is the responsibility of
          the users who post it, not {BRAND_NAME}. We do not endorse, verify, or guarantee the
          accuracy, quality, or legality of user-generated content. If you rely on information posted
          by other users, you do so at your own risk.
        </LegalP>
      </LegalSection>

      <LegalSection id="third-party" title="5. Third-Party Services & External Links">
        <LegalP>
          The Platform integrates third-party services (including Supabase, Stripe, Cloudinary,
          OpenAI, and official game APIs) and may link to external websites. We do not control these
          services or sites and are not responsible for their content, policies, availability, or
          practices. Your use of third-party services is governed by their own terms.
        </LegalP>
      </LegalSection>

      <LegalSection id="interruptions" title="6. Technical Interruptions">
        <LegalP>
          Real-time features (messaging, presence, notifications) depend on network connections,
          socket connections, and infrastructure that we do not fully control. Messages, calls, or
          notifications may be delayed, lost, or fail to deliver. We are not liable for such
          technical interruptions or for any resulting loss.
        </LegalP>
      </LegalSection>

      <LegalSection id="security" title="7. Security Limitations">
        <LegalP>
          We apply reasonable security measures (see the{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>), but no
          system is impenetrable. We cannot guarantee that the Platform, its servers, or data
          transmitted to or from it are free from unauthorized access, malware, or other harmful
          components.
        </LegalP>
      </LegalSection>

      <LegalSection id="compatibility" title="8. Game & Software Compatibility">
        <LegalP>
          The Platform supports a changing set of games and integrations. A game’s presence in our
          lists, or the availability of a verification integration, does not constitute an
          endorsement, a compatibility guarantee, or an affiliation with the game’s publisher. We may
          add or remove game integrations at any time.
        </LegalP>
      </LegalSection>

      <LegalSection id="not-advice" title="9. Not Professional or Financial Advice">
        <LegalP>
          AI-assisted features (such as the AI Coach) provide general gaming insights based on data
          you provide. They are informational only and do not constitute professional, financial,
          legal, or career advice. Decisions you make based on such information are your own
          responsibility.
        </LegalP>
        <LegalNote>
          Nothing in this disclaimer limits liability that cannot be excluded or limited under
          applicable law, including mandatory consumer protection rights.
        </LegalNote>
      </LegalSection>
    </LegalPageShell>
  );
}
