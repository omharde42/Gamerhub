import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollDirection() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Only apply scroll hide/show to content-heavy scrolling routes (Feed, Profile, Tournaments, Communities, news)
    const isFeedPage =
      pathname === '/feed' ||
      pathname === '/news' ||
      pathname === '/explore' ||
      pathname?.startsWith('/profile/') ||
      pathname?.startsWith('/tournaments') ||
      pathname?.startsWith('/communities') ||
      pathname?.startsWith('/servers');

    if (!isFeedPage) {
      setVisible(true);
      return;
    }

    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let scrollTimeout: NodeJS.Timeout | null = null;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const deltaY = currentScrollY - lastScrollY;

          // Always visible at the very top of the viewport
          if (currentScrollY < 50) {
            setVisible(true);
          } else if (Math.abs(deltaY) > 8) {
            // Scroll down -> hide, Scroll up -> show
            if (deltaY > 0) {
              setVisible(false);
            } else {
              setVisible(true);
            }
          }

          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }

      // Automatically show when scrolling stops for approximately 400ms
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setVisible(true);
      }, 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [pathname]);

  return visible;
}
