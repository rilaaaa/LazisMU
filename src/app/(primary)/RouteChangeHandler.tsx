'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Loading from '@/components/common/Loading';

export default function RouteChangeHandler() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleRouteChange = () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    };

    handleRouteChange();
  }, [pathname, searchParams]);

  if (loading) {
    return <Loading />;
  }

  return null;
}