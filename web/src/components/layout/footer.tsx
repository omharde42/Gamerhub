import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Gavel } from 'lucide-react';
import {
  BRAND_NAME,
  COPYRIGHT_LINE,
  LEGAL_DOCUMENTS,
  LEGAL_HUB_ROUTE,
} from '@/config/legal';

const exploreLinks = [
  { href: '/feed', label: 'Feed' },
  { href: '/news', label: 'News' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/teams', label: 'Teams' },
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/games', label: 'Games' },
  { href: '/jobs', label: 'Jobs' },
];

const communityLinks = [
  { href: '/servers', label: 'Servers' },
  { href: '/friends', label: 'Friends' },
  { href: '/organizations', label: 'Organizations' },
  { href: '/partnership', label: 'Partnerships' },
  { href: '/ai-coach', label: 'AI Coach' },
  { href: '/passport', label: 'Gamer Passport' },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-[#05070E]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label={`${BRAND_NAME} home`}>
              <span className="w-10 h-10 rounded-xl overflow-hidden border border-primary/20 shadow-sm shrink-0 group-hover:border-primary/40 transition-colors relative block">
                <Image src="/logo.webp" alt="GamerZ Hub Platform Logo" width={40} height={40} className="w-full h-full object-cover" priority />
              </span>
              <span className="text-base font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {BRAND_NAME}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[26ch]">
              Connect, compete, and level up. The professional AAA network for gamers.
            </p>
          </div>

          {/* Explore */}
          <FooterColumn title="Explore" links={exploreLinks} />

          {/* Community */}
          <FooterColumn title="Community" links={communityLinks} />

          {/* Legal & Policies */}
          <nav aria-label="Legal and policies" className="col-span-2 md:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-4 flex items-center gap-1.5">
              <Gavel className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
              Legal & Policies
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={LEGAL_HUB_ROUTE}
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Legal Hub
                </Link>
              </li>
              {LEGAL_DOCUMENTS.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    href={doc.route}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {doc.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{COPYRIGHT_LINE}</p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href={LEGAL_HUB_ROUTE} className="hover:text-primary transition-colors">
              Legal Hub
            </Link>
            <Link href="/licenses" className="hover:text-primary transition-colors">
              Open-Source Licenses
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <Gamepad2 className="h-3.5 w-3.5 text-primary/60" aria-hidden="true" />
              Made for gamers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
