'use client';

import { Suspense, useState } from 'react';
import Loading from '@/components/common/Loading';
import Sidebar from '@/components/layout/Sidebar';
import SidebarTrigger from '@/components/layout/SidebarTrigger';
import dynamic from 'next/dynamic';

const RouteChangeHandler = dynamic(() => import('./RouteChangeHandler'), { ssr: false });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Suspense fallback={<Loading />}>
          <RouteChangeHandler />
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </Suspense>
      </div>
      <SidebarTrigger isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
    </div>
  );
}