'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GapAnalysisPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/map');
  }, [router]);
  return null;
}
