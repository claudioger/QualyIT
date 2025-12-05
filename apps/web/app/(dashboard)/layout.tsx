import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/layout/bottom-nav';
import { OfflineIndicator } from '@/components/layout/offline-indicator';

// Force dynamic rendering for all dashboard pages (they require auth)
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Offline indicator at top */}
      <OfflineIndicator />

      {/* Main content area with bottom padding for nav */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
