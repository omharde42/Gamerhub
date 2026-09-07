'use client';

import { useRouter } from 'next/navigation';
import { SearchOverlay } from '@/components/search/search-overlay';

export default function SearchPage() {
  const router = useRouter();

  return (
    <SearchOverlay
      isOpen={true}
      onClose={() => router.back()}
      isStandalonePage={true}
    />
  );
}
