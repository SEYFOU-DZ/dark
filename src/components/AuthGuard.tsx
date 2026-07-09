'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isAdmin } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (requireAdmin && !isAdmin()) {
      router.push('/dashboard');
      return;
    }
  }, [router, requireAdmin]);

  if (!isAuthenticated()) {
    return null;
  }

  if (requireAdmin && !isAdmin()) {
    return null;
  }

  return <>{children}</>;
}
