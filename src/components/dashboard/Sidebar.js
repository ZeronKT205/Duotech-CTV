'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
// React imports
import {
  LayoutDashboard, PlusCircle, ClipboardList, DollarSign, User,
  Users, Settings, BarChart3, LogOut, Menu, X, ShieldCheck,
  Inbox, FolderKanban
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'admin';

  const ctvLinks = [
    { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Tổng quan' },
    { href: '/dashboard/new-order', icon: <PlusCircle size={18} />, label: 'Báo đơn mới' },
    { href: '/dashboard/orders', icon: <ClipboardList size={18} />, label: 'Đơn hàng của tôi' },
    { href: '/dashboard/commissions', icon: <DollarSign size={18} />, label: 'Hoa hồng' },
    { href: '/dashboard/profile', icon: <User size={18} />, label: 'Thông tin cá nhân' },
  ];

  const adminLinks = [
    { href: '/dashboard/admin/requests', icon: <Inbox size={18} />, label: 'Đơn yêu cầu' },
    { href: '/dashboard/admin/projects', icon: <FolderKanban size={18} />, label: 'Quản lý Dự án' },
    { href: '/dashboard/admin/ctv', icon: <Users size={18} />, label: 'Quản lý CTV' },
    { href: '/dashboard/admin/commissions', icon: <DollarSign size={18} />, label: 'Quản lý hoa hồng' },
    { href: '/dashboard/admin/settings', icon: <Settings size={18} />, label: 'Cài đặt' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="dash-sidebar-overlay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 39 }}
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-header">
          <Link href="/" className="dash-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M25 15H42" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="44" cy="15" r="3" fill="white" stroke="#60a5fa" strokeWidth="3" />
              <path d="M25 85H42" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="44" cy="85" r="3" fill="white" stroke="#60a5fa" strokeWidth="3" />
              <path d="M25 20V80M25 20H60C76.5 20 90 33.5 90 50C90 66.5 76.5 80 60 80H25" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M38 35V65M38 35H55C63.2 35 70 41.8 70 50C70 58.2 63.2 65 55 65H38" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 30V48H25" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="15" cy="27" r="2.5" fill="white" stroke="#60a5fa" strokeWidth="2.5"/>
              <path d="M15 70V52H25" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="15" cy="73" r="2.5" fill="white" stroke="#60a5fa" strokeWidth="2.5"/>
              <path d="M10 50H25" stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="7" cy="50" r="3" fill="white" stroke="#60a5fa" strokeWidth="3"/>
              <path d="M38 50H54" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="56" cy="50" r="2.5" fill="white" stroke="#60a5fa" strokeWidth="2.5"/>
            </svg>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: '#ffffff' }}>
              DUO TECH
            </span>
          </Link>
        </div>

        <nav className="dash-sidebar-nav">
          <div className="dash-nav-section-title">Menu</div>
          {ctvLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`dash-nav-link ${pathname === link.href ? 'active' : ''}`}
              onClick={onClose}
              id={`nav-${link.href.replace(/\//g, '-')}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="dash-nav-section-title" style={{ marginTop: 'var(--space-4)' }}>
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Admin
              </div>
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`dash-nav-link ${pathname === link.href ? 'active' : ''}`}
                  onClick={onClose}
                  id={`nav-${link.href.replace(/\//g, '-')}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-info">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className="dash-user-avatar"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <div className="dash-user-name">{session?.user?.name}</div>
              <div className="dash-user-role">
                {isAdmin ? '👑 Admin' : '🤝 CTV'}
              </div>
            </div>
          </div>
          <button
            className="dash-logout-btn"
            onClick={() => signOut({ callbackUrl: '/' })}
            id="logout-btn"
          >
            <LogOut size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
