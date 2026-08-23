import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Globe } from 'lucide-react';
import {
  LegalPageShell,
  LegalSection,
  LegalP,
  LegalNote,
} from '@/components/legal/legal-page-shell';
import { BRAND_NAME } from '@/config/legal';

export const metadata: Metadata = {
  title: 'Third-Party & Open-Source Licenses | GamerZ Hub',
  description:
    'Attribution for the open-source software and third-party services that power GamerZ Hub, with license links for every major dependency.',
};

interface Dependency {
  name: string;
  license: string;
  copyright: string;
  url: string;
}

const webDependencies: Dependency[] = [
  { name: 'Next.js', license: 'MIT', copyright: 'Vercel, Inc.', url: 'https://github.com/vercel/next.js/blob/canary/LICENSE' },
  { name: 'React / React DOM', license: 'MIT', copyright: 'Meta Platforms, Inc.', url: 'https://github.com/facebook/react/blob/main/LICENSE' },
  { name: '@supabase/supabase-js', license: 'MIT', copyright: 'Supabase, Inc.', url: 'https://github.com/supabase/supabase-js/blob/master/LICENSE' },
  { name: 'Tailwind CSS', license: 'MIT', copyright: 'Tailwind Labs', url: 'https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE' },
  { name: '@tanstack/react-query', license: 'MIT', copyright: 'TanStack', url: 'https://github.com/TanStack/query/blob/main/LICENSE' },
  { name: 'framer-motion', license: 'MIT', copyright: 'Framer B.V.', url: 'https://github.com/framer/motion/blob/main/LICENSE' },
  { name: 'lucide-react', license: 'ISC', copyright: 'Lucide Contributors', url: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE' },
  { name: 'react-hook-form', license: 'MIT', copyright: 'React Hook Form contributors', url: 'https://github.com/react-hook-form/react-hook-form/blob/master/LICENSE' },
  { name: 'Zod', license: 'MIT', copyright: 'Colin McDonnell', url: 'https://github.com/colinhacks/zod/blob/master/LICENSE' },
  { name: 'Zustand', license: 'MIT', copyright: 'pmndrs contributors', url: 'https://github.com/pmndrs/zustand/blob/main/LICENSE' },
  { name: 'Axios', license: 'MIT', copyright: 'Axios contributors', url: 'https://github.com/axios/axios/blob/v1.x/LICENSE' },
  { name: 'Recharts', license: 'MIT', copyright: 'Recharts contributors', url: 'https://github.com/recharts/recharts/blob/master/LICENSE' },
  { name: 'next-themes', license: 'MIT', copyright: 'Paco Coursey', url: 'https://github.com/pacocoursey/next-themes/blob/master/LICENSE' },
  { name: 'react-hot-toast', license: 'MIT', copyright: 'Timo Lins', url: 'https://github.com/timolins/react-hot-toast/blob/main/LICENSE' },
  { name: 'Radix UI (@radix-ui/*)', license: 'MIT', copyright: 'WorkOS / Radix UI', url: 'https://github.com/radix-ui/primitives/blob/main/LICENSE' },
  { name: 'class-variance-authority', license: 'Apache-2.0', copyright: 'Joe Bell', url: 'https://github.com/joe-bell/cva/blob/main/LICENSE' },
  { name: 'tailwind-merge', license: 'MIT', copyright: 'Dany Castillo', url: 'https://github.com/dcastil/tailwind-merge/blob/main/LICENSE' },
  { name: 'clsx', license: 'MIT', copyright: 'Luke Edwards', url: 'https://github.com/lukeed/clsx/blob/master/license' },
  { name: 'socket.io-client', license: 'MIT', copyright: 'OpenJS Foundation', url: 'https://github.com/socketio/socket.io-client/blob/main/LICENSE' },
  { name: 'Firebase (JS SDK)', license: 'Apache-2.0', copyright: 'Google LLC', url: 'https://github.com/firebase/firebase-js-sdk/blob/master/LICENSE' },
  { name: 'Capacitor (@capacitor/*)', license: 'MIT', copyright: 'Ionic', url: 'https://github.com/ionic-team/capacitor/blob/main/LICENSE' },
];

const serverDependencies: Dependency[] = [
  { name: 'Express', license: 'MIT', copyright: 'OpenJS Foundation', url: 'https://github.com/expressjs/express/blob/master/LICENSE' },
  { name: 'Prisma / @prisma/client', license: 'Apache-2.0', copyright: 'Prisma Data, Inc.', url: 'https://github.com/prisma/prisma/blob/main/LICENSE' },
  { name: 'Socket.IO', license: 'MIT', copyright: 'OpenJS Foundation', url: 'https://github.com/socketio/socket.io/blob/main/LICENSE' },
  { name: 'Stripe (Node)', license: 'MIT', copyright: 'Stripe, Inc.', url: 'https://github.com/stripe/stripe-node/blob/master/LICENSE' },
  { name: 'jsonwebtoken', license: 'MIT', copyright: 'Auth0 / OpenID Foundation', url: 'https://github.com/auth0/node-jsonwebtoken/blob/master/LICENSE' },
  { name: 'bcryptjs', license: 'MIT', copyright: 'Nevins Bartolomeo', url: 'https://github.com/dcodeIO/bcrypt.js/blob/master/LICENSE' },
  { name: 'Cloudinary', license: 'MIT', copyright: 'Cloudinary', url: 'https://github.com/cloudinary/cloudinary_npm/blob/master/LICENSE' },
  { name: 'Nodemailer', license: 'MIT', copyright: 'Andris Reinman', url: 'https://github.com/nodemailer/nodemailer/blob/master/LICENSE' },
  { name: 'Helmet', license: 'MIT', copyright: 'Adam Baldwin', url: 'https://github.com/helmetjs/helmet/blob/main/LICENSE' },
  { name: 'express-rate-limit', license: 'MIT', copyright: 'Nathan Friedly', url: 'https://github.com/express-rate-limit/express-rate-limit/blob/main/LICENSE' },
  { name: 'express-validator', license: 'MIT', copyright: 'express-validator contributors', url: 'https://github.com/express-validator/express-validator/blob/master/LICENSE' },
  { name: 'Morgan', license: 'MIT', copyright: 'Express.js contributors', url: 'https://github.com/expressjs/morgan/blob/master/LICENSE' },
  { name: 'Multer', license: 'MIT', copyright: 'Express.js contributors', url: 'https://github.com/expressjs/multer/blob/master/LICENSE' },
  { name: 'cookie-parser', license: 'MIT', copyright: 'Express.js contributors', url: 'https://github.com/expressjs/cookie-parser/blob/master/LICENSE' },
  { name: 'compression', license: 'MIT', copyright: 'Express.js contributors', url: 'https://github.com/expressjs/compression/blob/master/LICENSE' },
  { name: 'cors', license: 'MIT', copyright: 'Express.js contributors', url: 'https://github.com/expressjs/cors/blob/master/LICENSE' },
  { name: 'ioredis', license: 'MIT', copyright: 'Zihua Li (luin)', url: 'https://github.com/redis/ioredis/blob/main/LICENSE' },
  { name: 'dotenv', license: 'BSD-2-Clause', copyright: 'dotenv contributors', url: 'https://github.com/motdotla/dotenv/blob/master/LICENSE' },
  { name: 'OpenAI (Node)', license: 'Apache-2.0', copyright: 'OpenAI', url: 'https://github.com/openai/openai-node/blob/master/LICENSE' },
  { name: 'speakeasy', license: 'MIT', copyright: 'Mark Bao', url: 'https://github.com/speakeasyjs/speakeasy/blob/main/LICENSE' },
  { name: 'uuid', license: 'MIT', copyright: 'uuid contributors', url: 'https://github.com/uuidjs/uuid/blob/main/LICENSE.md' },
  { name: 'TypeScript', license: 'Apache-2.0', copyright: 'Microsoft', url: 'https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt' },
  { name: 'firebase-admin', license: 'Apache-2.0', copyright: 'Google LLC', url: 'https://github.com/firebase/firebase-admin-node/blob/master/LICENSE' },
];

const thirdPartyServices = [
  { name: 'Supabase', purpose: 'PostgreSQL database hosting & OAuth sign-in', url: 'https://supabase.com' },
  { name: 'Stripe', purpose: 'Payment processing & subscription billing', url: 'https://stripe.com' },
  { name: 'Cloudinary', purpose: 'Media storage & delivery', url: 'https://cloudinary.com' },
  { name: 'OpenAI', purpose: 'AI Coach & AI-assisted features', url: 'https://openai.com' },
  { name: 'Redis', purpose: 'Caching & real-time infrastructure', url: 'https://redis.io' },
  { name: 'Steam Web API', purpose: 'Steam account & game-data verification', url: 'https://steamcommunity.com/dev' },
  { name: 'Supercell API', purpose: 'Clash of Clans account verification', url: 'https://developer.clashofclans.com' },
  { name: 'PUBG API', purpose: 'PUBG account & game-data verification', url: 'https://developer.pubg.com' },
];

function LicenseTable({ deps }: { deps: Dependency[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-semibold">Package</th>
            <th scope="col" className="px-4 py-3 font-semibold">License</th>
            <th scope="col" className="px-4 py-3 font-semibold">Copyright holder</th>
            <th scope="col" className="px-4 py-3 font-semibold text-right">License text</th>
          </tr>
        </thead>
        <tbody>
          {deps.map((dep) => (
            <tr key={dep.name} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">{dep.name}</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {dep.license}
                </span>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{dep.copyright}</td>
              <td className="px-4 py-2.5 text-right">
                <a
                  href={dep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  View <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LicensesPage() {
  return (
    <LegalPageShell
      docSlug="licenses"
      intro={
        <>
          {BRAND_NAME} is built on the shoulders of open-source software. This page credits the major
          open-source libraries used by the Platform and lists the third-party services it
          integrates with. Each entry links to its license text.
        </>
      }
    >
      <LegalSection id="web" title="Web Application (Next.js frontend)">
        <LegalP>
          The following open-source packages are used in the {BRAND_NAME} web application:
        </LegalP>
        <LicenseTable deps={webDependencies} />
      </LegalSection>

      <LegalSection id="server" title="Server & API (Express backend)">
        <LegalP>
          The following open-source packages are used in the {BRAND_NAME} server and API:
        </LegalP>
        <LicenseTable deps={serverDependencies} />
      </LegalSection>

      <LegalSection id="services" title="Third-Party Services">
        <LegalP>
          The Platform also relies on the following third-party services. Each is governed by its
          own terms of service and privacy policy:
        </LegalP>
        <ul className="space-y-2 pl-5 list-disc marker:text-primary/60">
          {thirdPartyServices.map((svc) => (
            <li key={svc.name} className="pl-1">
              <a
                href={svc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                {svc.name}
              </a>{' '}
              <span className="text-muted-foreground">— {svc.purpose}</span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="notes" title="Notes on Compliance">
        <LegalP>
          This page is a curated summary of the Platform’s major dependencies. The complete set of
          third-party licenses (including full license texts and copyright notices for transitive
          dependencies) is distributed inside the application’s dependency tree (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">node_modules</code>{' '}
          license files) and can be exported to a machine-readable{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">THIRD_PARTY_NOTICES</code> file
          using standard tooling (for example, <code className="rounded bg-muted px-1.5 py-0.5 text-xs">license-checker</code> or{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">license-report</code>).
        </LegalP>
        <LegalNote>
          Licenses are listed to the best of our knowledge from the published metadata of each
          package at the versions in use. If you believe a required attribution is missing or
          incorrect, contact us via the <Link href="/legal" className="text-primary hover:underline">Legal Contact</Link> page
          and we will correct it promptly.
        </LegalNote>
      </LegalSection>
    </LegalPageShell>
  );
}
