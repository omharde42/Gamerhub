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
  title: 'Refund & Cancellation Policy | GamerZ Hub',
  description:
    'How GamerZ Hub premium subscriptions are billed, cancelled, and refunded — including cancellation at period end and what happens after you cancel.',
};

const toc = [
  { id: 'scope', label: 'What This Policy Covers' },
  { id: 'billing', label: 'Billing & Payment' },
  { id: 'cancellation', label: 'Cancelling Your Subscription' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'statutory', label: 'Your Statutory Rights' },
  { id: 'chargebacks', label: 'Chargebacks & Disputes' },
  { id: 'contact', label: 'Contact' },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      docSlug="refund-policy"
      toc={toc}
      intro={
        <>
          This policy explains how paid {BRAND_NAME} subscriptions are billed, cancelled, and
          refunded. It is part of and incorporated into the{' '}
          <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>.
        </>
      }
    >
      <LegalSection id="scope" title="1. What This Policy Covers">
        <LegalP>
          {BRAND_NAME} offers optional paid subscriptions that unlock premium features (for example,
          premium plans on our Premium page). This policy covers those paid subscriptions. Using the
          free features of the Platform does not require any payment, and nothing in this policy
          affects free access.
        </LegalP>
      </LegalSection>

      <LegalSection id="billing" title="2. Billing & Payment">
        <LegalList
          items={[
            <>Payments are processed by <strong>Stripe</strong>, our payment processor. We do not see or store your full card details.</>,
            <>Subscriptions are recurring: you are billed at the start of each billing period (typically monthly) until you cancel.</>,
            <>The price shown on the Premium page at the time of purchase is the price you pay, unless a pricing change is communicated to you in advance.</>,
            <>If a payment fails, we will make reasonable attempts to notify you; unpaid subscriptions may be downgraded or suspended.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="cancellation" title="3. Cancelling Your Subscription">
        <LegalP>
          You can cancel your subscription at any time from the Premium management page or by
          contacting us. Cancellation takes effect at the end of the current billing period — you
          keep access to premium features until that period ends, and you will not be charged again
          afterward.
        </LegalP>
      </LegalSection>

      <LegalSection id="refunds" title="4. Refunds">
        <LegalP>
          Except where required by applicable law (see Section 5), subscription fees are generally
          non-refundable once the billing period has begun. We may, at our sole discretion, issue a
          partial or full refund on a case-by-case basis — for example, where a service failure
          prevented you from using the features you paid for.
        </LegalP>
        <LegalP>
          To request a refund, contact us at{' '}
          <span className="font-mono text-primary/90">{LEGAL_PLACEHOLDERS.supportEmail}</span> with
          your account email, the plan you purchased, and the reason for your request. We will
          respond as soon as reasonably possible.
        </LegalP>
        <LegalNote tone="warn">
          Any specific refund guarantee (for example, a fixed money-back period) must be added by the{' '}
          {BRAND_NAME} operator and reviewed by legal counsel before being offered. Until then, refunds
          are handled on a case-by-case basis as described above.
        </LegalNote>
      </LegalSection>

      <LegalSection id="statutory" title="5. Your Statutory Rights">
        <LegalP>
          Nothing in this policy limits or excludes rights you may have under the consumer protection
          or other laws of your jurisdiction. In some jurisdictions (for example, within the EU/EEA),
          you may have a statutory right to withdraw from a distance contract within a cooling-off
          period; for digital services, that right may be lost once the service begins to be
          performed with your consent. If you believe a statutory right applies to you, please
          contact us and we will assess your request in accordance with applicable law.
        </LegalP>
      </LegalSection>

      <LegalSection id="chargebacks" title="6. Chargebacks & Disputes">
        <LegalP>
          If you dispute a charge with your bank or card issuer, we will cooperate with the dispute
          process through Stripe. Please contact us before filing a dispute — many issues can be
          resolved directly.
        </LegalP>
      </LegalSection>

      <LegalSection id="contact" title="7. Contact">
        <LegalP>
          Questions about billing, cancellation, or refunds: contact us at{' '}
          <span className="font-mono text-primary/90">{LEGAL_PLACEHOLDERS.supportEmail}</span> or via
          the <Link href="/legal" className="text-primary hover:underline">Legal Contact</Link> page.
        </LegalP>
      </LegalSection>
    </LegalPageShell>
  );
}
