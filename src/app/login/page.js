'use client';

import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, DollarSign, ClipboardList, BarChart3, Shield } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="login-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="loading-spinner" style={{ borderTopColor: 'var(--dt-neon)' }}></div>
          <span style={{ color: 'var(--dt-dark-text-secondary)' }}>Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--dt-dark-text-muted)', textDecoration: 'none', marginBottom: 'var(--space-5)', transition: 'color var(--transition-fast)' }} className="back-to-home-link">
          <ArrowLeft size={14} /> Quay lại trang chủ
        </Link>
        <div className="login-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="duotech-logo-svg" style={{ flexShrink: 0 }}>
            <path d="M25 15H42" stroke="#0052cc" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="44" cy="15" r="3" fill="white" stroke="#0052cc" strokeWidth="3" />
            <path d="M25 85H42" stroke="#0052cc" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="44" cy="85" r="3" fill="white" stroke="#0052cc" strokeWidth="3" />
            <path d="M25 20V80M25 20H60C76.5 20 90 33.5 90 50C90 66.5 76.5 80 60 80H25" stroke="#0052cc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M38 35V65M38 35H55C63.2 35 70 41.8 70 50C70 58.2 63.2 65 55 65H38" stroke="#0052cc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 30V48H25" stroke="#0052cc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="15" cy="27" r="2.5" fill="white" stroke="#0052cc" strokeWidth="2.5"/>
            <path d="M15 70V52H25" stroke="#0052cc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="15" cy="73" r="2.5" fill="white" stroke="#0052cc" strokeWidth="2.5"/>
            <path d="M10 50H25" stroke="#0052cc" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="7" cy="50" r="3" fill="white" stroke="#0052cc" strokeWidth="3"/>
            <path d="M38 50H54" stroke="#0052cc" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="56" cy="50" r="2.5" fill="white" stroke="#0052cc" strokeWidth="2.5"/>
          </svg>
          <span style={{ color: 'var(--dt-dark-text)', fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>DUO TECH</span>
        </div>
        <p className="login-subtitle">
          Đăng nhập để bắt đầu kiếm hoa hồng cùng DUOTECH
        </p>

        <button
          className="login-btn-google"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          id="login-google-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.11A6.95 6.95 0 0 1 5.48 12c0-.73.13-1.43.36-2.11V7.05H2.18A11.97 11.97 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.78z" fill="#FBBC05" />
            <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" fill="#EA4335" />
          </svg>
          Đăng nhập bằng Google
        </button>



        <div className="login-divider"><span>Tính năng nổi bật</span></div>

        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon">
              <DollarSign size={18} />
            </div>
            <span style={{ color: 'var(--dt-dark-text-secondary)' }}>Hoa hồng 7% cứng trên mỗi dự án</span>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">
              <ClipboardList size={18} />
            </div>
            <span style={{ color: 'var(--dt-dark-text-secondary)' }}>Báo đơn nhanh, theo dõi trạng thái real-time</span>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">
              <BarChart3 size={18} />
            </div>
            <span style={{ color: 'var(--dt-dark-text-secondary)' }}>Thống kê doanh thu và hoa hồng trực quan</span>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">
              <Shield size={18} />
            </div>
            <span style={{ color: 'var(--dt-dark-text-secondary)' }}>Đăng nhập an toàn bằng tài khoản Google</span>
          </div>
        </div>
      </div>
    </div>
  );
}
