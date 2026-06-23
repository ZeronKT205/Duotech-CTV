'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import OnboardingTour from '@/components/dashboard/OnboardingTour';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="dashboard-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--dt-light-text-muted)', fontSize: '0.9rem' }}>Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="dashboard-wrapper">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="dash-main">
        {children}
      </main>
      
      {/* Floating Mobile Toggle */}
      <button
        className="dash-mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
        id="sidebar-toggle"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Onboarding tour for first-time users */}
      <OnboardingTour />
    </div>
  );
}


