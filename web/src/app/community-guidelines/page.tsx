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
  title: 'Community Guidelines & Acceptable Use Policy | GamerZ Hub',
  description:
    'The rules for the GamerZ Hub community — harassment, hate speech, spam, cheating, impersonation, doxxing, and more — and how violations are enforced.',
};

const toc = [
  { id: 'principles', label: 'Our Principles' },
  { id: 'rules', label: 'The Rules' },
  { id: 'gaming', label: 'Gaming Integrity' },
  { id: 'reporting', label: 'Reporting Violations' },
  { id: 'enforcement', label: 'Enforcement Actions' },
  { id: 'appeals', label: 'Appeals' },
];

export default function CommunityGuidelinesPage() {
  return (
    <LegalPageShell
      docSlug="community-guidelines"
      toc={toc}
      intro={
        <>
          These Community Guidelines (“Guidelines”) describe what is and is not acceptable on the{' '}
          {BRAND_NAME} Platform. They apply to everything you do on the Platform — posts, comments,
          messages, profiles, teams, tournaments, servers, and games. The Guidelines are part of and
          incorporated into the <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>.
        </>
      }
    >
      <LegalSection id="principles" title="1. Our Principles">
        <LegalList
          items={[
            <><strong>Respect.</strong> Treat every player the way you want to be treated.</>,
            <><strong>Integrity.</strong> Compete honestly, and never misrepresent your skill or results.</>,
            <><strong>Safety.</strong> Help keep the Platform free of harassment, hate, and harm.</>,
            <><strong>Fairness.</strong> Report violations in good faith; do not weaponize the reporting system.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="rules" title="2. The Rules">
        <LegalP>You may not use the Platform to engage in any of the following:</LegalP>
        <LegalList
          items={[
            <><strong>Harassment & bullying</strong> — targeting, intimidating, mocking, or repeatedly contacting someone against their wishes.</>,
            <><strong>Hate & abusive content</strong> — content that attacks or demeans people based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics.</>,
            <><strong>Threats</strong> — threatening violence, self-harm, or other harm to any person or group.</>,
            <><strong>Spam</strong> — mass, repetitive, or unsolicited posting or messaging.</>,
            <><strong>Scams & fraud</strong> — phishing, fake giveaways, pyramid schemes, or any attempt to deceive users for money or credentials.</>,
            <><strong>Impersonation</strong> — pretending to be another person, organization, public figure, or the Platform itself.</>,
            <><strong>Cheating</strong> — using cheats, hacks, or unauthorized software in games, or manipulating matches, tournaments, or leaderboards.</>,
            <><strong>Exploitation of bugs</strong> — exploiting errors or vulnerabilities in the Platform for unfair advantage instead of reporting them.</>,
            <><strong>Hacking attempts</strong> — attempting unauthorized access to accounts, systems, or data.</>,
            <><strong>Malware</strong> — distributing viruses, worms, ransomware, or other harmful code or links.</>,
            <><strong>Account theft</strong> — stealing, buying, selling, or trading accounts, or assisting others to do so.</>,
            <><strong>Illegal activity</strong> — anything unlawful, or encouraging others to break the law.</>,
            <><strong>NSFW / adult content</strong> — the Platform is a gaming community; sexually explicit or adult content is not permitted anywhere on it.</>,
            <><strong>Doxxing & private information</strong> — sharing another person’s real name, address, phone number, or other private information without consent.</>,
            <><strong>Platform manipulation</strong> — inflating stats, win-trading, vote manipulation, or other actions that distort fair competition or rankings.</>,
            <><strong>Abuse of reporting systems</strong> — filing false, retaliatory, or spam reports.</>,
            <><strong>Evading enforcement</strong> — creating new accounts to bypass a suspension or ban.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="gaming" title="3. Gaming Integrity">
        <LegalP>
          Because {BRAND_NAME} hosts competitive features — tournaments, challenges, matchmaking, and
          leaderboards — we take gaming integrity seriously:
        </LegalP>
        <LegalList
          items={[
            <>Play by the rules set by tournament and match organizers.</>,
            <>Do not win-trade, throw matches for compensation, or coordinate to manipulate rankings.</>,
            <>Only claim statistics that are true, and only connect game accounts you actually own and control.</>,
            <>Report players who cheat or exploit bugs; do not join them.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="reporting" title="4. Reporting Violations">
        <LegalP>
          If you see content or behavior that violates these Guidelines, report it using the
          Platform’s reporting features (available on posts, profiles, and messages) or contact us
          via the <Link href="/legal" className="text-primary hover:underline">Legal Contact</Link> page.
          Reports are reviewed by our moderation team. Please report in good faith.
        </LegalP>
      </LegalSection>

      <LegalSection id="enforcement" title="5. Enforcement Actions">
        <LegalP>
          When we find a violation, we consider its severity, impact, and whether it is repeated.
          Possible enforcement actions include, alone or in combination:
        </LegalP>
        <LegalList
          ordered
          items={[
            <><strong>Warning</strong> — a notice explaining the violation and what to avoid next time.</>,
            <><strong>Content removal</strong> — deleting or hiding the violating content.</>,
            <><strong>Temporary restriction</strong> — limiting features (posting, messaging, team participation) for a period of time.</>,
            <><strong>Suspension</strong> — temporarily suspending your account.</>,
            <><strong>Permanent termination</strong> — permanently banning your account, including preventing new accounts.</>,
          ]}
        />
        <LegalP>
          Serious violations — including threats, illegal activity, hacking attempts, or malware —
          may result in immediate permanent termination, and may be reported to the appropriate
          authorities.
        </LegalP>
        <LegalNote>
          We aim to be consistent and fair, but every situation is evaluated on its own facts.
          Enforcement decisions are made at our reasonable discretion, and this list does not limit
          the actions we may take under the{' '}
          <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>.
        </LegalNote>
      </LegalSection>

      <LegalSection id="appeals" title="6. Appeals">
        <LegalP>
          If you believe an enforcement decision was made in error, you may appeal by contacting us
          with your username and details of the action taken. We will review the decision as soon as
          reasonably possible. Contact: see the{' '}
          <Link href="/legal" className="text-primary hover:underline">Legal Contact</Link> page.
        </LegalP>
      </LegalSection>
    </LegalPageShell>
  );
}
