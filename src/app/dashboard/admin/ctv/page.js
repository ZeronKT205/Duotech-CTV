'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Lock, Unlock, X, Bell, Inbox, CreditCard, ExternalLink, ChevronRight, ShieldCheck, ShieldOff } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function AdminCTVPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const [pendingAmounts, setPendingAmounts] = useState({});
  const [pendingOrderCounts, setPendingOrderCounts] = useState({});
  const [totalOrderCounts, setTotalOrderCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedCTV, setSelectedCTV] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [ctvOrders, setCtvOrders] = useState([]);
  const [ctvCommissions, setCtvCommissions] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
      setPendingCounts(data.pendingCounts || {});
      setPendingAmounts(data.pendingAmounts || {});
      setPendingOrderCounts(data.pendingOrderCounts || {});
      setTotalOrderCounts(data.totalOrderCounts || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleOpenCTV(ctv, tab = 'orders') {
    setSelectedCTV(ctv);
    setActiveTab(tab);
    setLoadingModal(true);
    try {
      const [ordersRes, commissionsRes] = await Promise.all([
        fetch('/api/orders?all=true'),
        fetch('/api/commissions?all=true'),
      ]);
      const ordersData = await ordersRes.json();
      const commissionsData = await commissionsRes.json();
      
      setCtvOrders((ordersData.orders || []).filter(o => {
        const ctvId = o.ctvId?._id || o.ctvId;
        return ctvId?.toString() === ctv._id && o.status === 'pending';
      }));
      setCtvCommissions((commissionsData.commissions || []).filter(c => 
        c.ctvId?._id === ctv._id && c.status === 'pending'
      ));
    } catch (err) {
      console.error('Error fetching CTV details:', err);
    } finally {
      setLoadingModal(false);
    }
  }

  async function toggleUser(userId, isActive) {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchUsers();
    } catch (err) { console.error(err); }
  }

  async function changeRole(user, newRole) {
    const isPromote = newRole === 'admin';
    const message = isPromote
      ? `Nâng "${user.name}" lên Quản trị viên?\n\nTài khoản này sẽ có toàn quyền quản lý hệ thống.`
      : `Hạ "${user.name}" xuống Cộng tác viên?\n\nTài khoản này sẽ mất quyền quản trị.`;
    if (!window.confirm(message)) return;

    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
        return;
      }
      fetchUsers();
    } catch (err) { console.error(err); }
  }

  if (session?.user?.role !== 'admin') {
    return <div className="dash-body"><div className="empty-state"><h3>Bạn không có quyền truy cập</h3></div></div>;
  }

  // Sort users: those with notes first
  const ctvUsers = users.filter(u => u.role === 'ctv');
  const sortedUsers = [...ctvUsers].sort((a, b) => {
    const aHasNote = (pendingOrderCounts[a._id] || 0) + (pendingCounts[a._id] || 0);
    const bHasNote = (pendingOrderCounts[b._id] || 0) + (pendingCounts[b._id] || 0);
    return bHasNote - aHasNote;
  });
  const adminUsers = users.filter(u => u.role === 'admin');
  const totalCTV = ctvUsers.length;
  const ctvWithOrders = ctvUsers.filter(u => (totalOrderCounts[u._id] || 0) > 0).length;
  const ctvNeedPay = ctvUsers.filter(u => (pendingCounts[u._id] || 0) > 0).length;

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <Users size={22} /> Quản lý Cộng Tác Viên
          </h1>
          <p className="dash-page-subtitle">Tổng quan và quản lý tài khoản CTV</p>
        </div>
      </div>

      <div className="dash-body">
        {/* Stats Cards */}
        <div className="dash-stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="dash-stat-card">
            <div className="dash-stat-header"><div className="dash-stat-icon" style={{ backgroundColor: 'var(--dt-light-surface-3)', color: 'var(--dt-light-text-secondary)' }}><Users size={20} /></div></div>
            <div className="dash-stat-value">{totalCTV}</div>
            <div className="dash-stat-label">Tổng CTV</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-header"><div className="dash-stat-icon" style={{ backgroundColor: 'var(--dt-light-surface-3)', color: 'var(--dt-light-text-secondary)' }}><Inbox size={20} /></div></div>
            <div className="dash-stat-value">{ctvWithOrders}</div>
            <div className="dash-stat-label">CTV có đơn hàng</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-header"><div className="dash-stat-icon" style={{ backgroundColor: 'var(--dt-light-surface-3)', color: 'var(--dt-light-text-secondary)' }}><CreditCard size={20} /></div></div>
            <div className="dash-stat-value">{ctvNeedPay}</div>
            <div className="dash-stat-label">CTV cần thanh toán</div>
          </div>
        </div>

        {/* CTV Table */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Danh sách Cộng Tác Viên ({totalCTV})</h2>
          </div>
          <div className="dash-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-page"><div className="loading-spinner"></div></div>
            ) : (
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Avatar</th>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>SĐT</th>
                      <th>Thông báo</th>
                      <th>Đơn hàng</th>
                      <th>Ngày tham gia</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map(user => {
                      const hasOrderNote = (pendingOrderCounts[user._id] || 0) > 0;
                      const hasPayNote = (pendingCounts[user._id] || 0) > 0;
                      const hasAnyNote = hasOrderNote || hasPayNote;
                      
                      return (
                        <tr 
                          key={user._id} 
                          style={hasAnyNote ? { 
                            backgroundColor: 'rgba(239, 68, 68, 0.04)',
                            borderLeft: '3px solid #ef4444',
                          } : {}}
                        >
                          <td>
                            {user.avatar ? (
                              <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} referrerPolicy="no-referrer" />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--dt-light-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={14} />
                              </div>
                            )}
                          </td>
                          <td><strong>{user.name}</strong></td>
                          <td style={{ fontSize: '0.85rem' }}>{user.email}</td>
                          <td>{user.phone || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {hasOrderNote && (
                                <button
                                  className="dash-btn"
                                  onClick={() => handleOpenCTV(user, 'orders')}
                                  style={{
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    fontSize: '0.72rem',
                                    padding: '3px 8px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderRadius: '20px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Inbox size={11} /> {pendingOrderCounts[user._id]} đơn mới
                                </button>
                              )}
                              {hasPayNote && (
                                <button
                                  className="dash-btn"
                                  onClick={() => handleOpenCTV(user, 'bank')}
                                  style={{
                                    backgroundColor: '#fff7ed',
                                    color: '#ea580c',
                                    border: '1px solid #fed7aa',
                                    fontSize: '0.72rem',
                                    padding: '3px 8px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderRadius: '20px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <CreditCard size={11} /> {formatCurrency(pendingAmounts[user._id] || 0)}
                                </button>
                              )}
                              {!hasAnyNote && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)', fontStyle: 'italic' }}>—</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                              {totalOrderCounts[user._id] || 0} đơn
                            </span>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>
                            <span className={`dash-badge ${user.isActive ? 'green' : 'red'}`}>
                              {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                className="dash-btn dash-btn-outline dash-btn-sm"
                                onClick={() => handleOpenCTV(user, 'orders')}
                                style={{ fontSize: '0.75rem' }}
                              >
                                Chi tiết
                              </button>
                              <button
                                className={`dash-btn dash-btn-sm ${user.isActive ? 'dash-btn-danger' : 'dash-btn-success'}`}
                                onClick={() => toggleUser(user._id, user.isActive)}
                              >
                                {user.isActive ? <><Lock size={12} /> Khóa</> : <><Unlock size={12} /> Mở</>}
                              </button>
                              <button
                                className="dash-btn dash-btn-sm"
                                onClick={() => changeRole(user, 'admin')}
                                title="Nâng lên Quản trị viên"
                                style={{ backgroundColor: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <ShieldCheck size={12} /> Nâng Admin
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Admin users section */}
                    {adminUsers.length > 0 && (
                      <>
                        <tr>
                          <td colSpan="9" style={{
                            backgroundColor: 'var(--dt-light-surface-2)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: 'var(--dt-light-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '8px 16px',
                          }}>
                            👑 Quản trị viên
                          </td>
                        </tr>
                        {adminUsers.map(user => (
                          <tr key={user._id} style={{ opacity: 0.7 }}>
                            <td>
                              {user.avatar ? (
                                <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} referrerPolicy="no-referrer" />
                              ) : (
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--dt-light-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users size={14} />
                                </div>
                              )}
                            </td>
                            <td><strong>{user.name}</strong></td>
                            <td style={{ fontSize: '0.85rem' }}>{user.email}</td>
                            <td>{user.phone || '—'}</td>
                            <td><span className="dash-badge purple">👑 Admin</span></td>
                            <td>—</td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td><span className="dash-badge green">Hoạt động</span></td>
                            <td>
                              {user._id === session?.user?.dbId ? (
                                <span style={{ fontSize: '0.78rem', color: 'var(--dt-light-text-muted)', fontStyle: 'italic' }}>Bạn</span>
                              ) : (
                                <button
                                  className="dash-btn dash-btn-sm dash-btn-outline"
                                  onClick={() => changeRole(user, 'ctv')}
                                  title="Hạ xuống Cộng tác viên"
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                >
                                  <ShieldOff size={12} /> Hạ xuống CTV
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTV Detail Modal with 2 Tabs */}
      {selectedCTV && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '900px', width: '100%', animation: 'fadeIn 0.2s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dt-light-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selectedCTV.avatar ? (
                  <img src={selectedCTV.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} referrerPolicy="no-referrer" />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--dt-light-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} />
                  </div>
                )}
                <div>
                  <h3 className="dash-card-title" style={{ margin: 0 }}>{selectedCTV.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)' }}>{selectedCTV.email} • {selectedCTV.phone || 'Chưa có SĐT'}</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCTV(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dt-light-text-muted)' }}><X size={18} /></button>
            </div>

            {/* Tab Headers */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--dt-light-border)', padding: '0 var(--space-5)' }}>
              <button
                onClick={() => setActiveTab('orders')}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: activeTab === 'orders' ? 'var(--dt-primary)' : 'var(--dt-light-text-muted)',
                  borderBottom: activeTab === 'orders' ? '2px solid var(--dt-primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Inbox size={16} /> Đơn hàng
                {ctvOrders.length > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 800,
                  }}>{ctvOrders.length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('bank')}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: activeTab === 'bank' ? 'var(--dt-primary)' : 'var(--dt-light-text-muted)',
                  borderBottom: activeTab === 'bank' ? '2px solid var(--dt-primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <CreditCard size={16} /> Hoa hồng & Bank
                {ctvCommissions.length > 0 && (
                  <span style={{
                    backgroundColor: '#ea580c',
                    color: '#fff',
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 800,
                  }}>{ctvCommissions.length}</span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="dash-card-body" style={{ paddingTop: 'var(--space-4)' }}>
              {loadingModal ? (
                <div className="loading-page" style={{ minHeight: '150px' }}><div className="loading-spinner"></div></div>
              ) : activeTab === 'orders' ? (
                /* ========== TAB: ĐƠN HÀNG ========== */
                <div>
                  {ctvOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', border: '1px dashed var(--dt-light-border)' }}>
                      <span style={{ fontSize: '32px' }}>📭</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)', margin: '8px 0 0 0', fontWeight: 600 }}>Không có đơn hàng nào cần xử lý.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {ctvOrders.map(order => (
                        <div key={order._id} style={{
                          padding: '14px 16px',
                          backgroundColor: '#fef2f2',
                          borderRadius: '10px',
                          border: '1px solid #fecaca',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <strong style={{ color: 'var(--dt-primary)', fontSize: '0.9rem' }}>{order.orderCode}</strong>
                              <span className="dash-badge yellow" style={{ fontSize: '0.7rem' }}>Cần xử lý</span>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--dt-light-text-secondary)', margin: 0, lineHeight: 1.4, maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {order.description}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--dt-light-text-muted)' }}>
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                          <button
                            className="dash-btn dash-btn-primary dash-btn-sm"
                            onClick={() => {
                              setSelectedCTV(null);
                              router.push('/dashboard/admin/requests');
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                          >
                            Xem chi tiết <ChevronRight size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ========== TAB: HOA HỒNG & BANK ========== */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  {/* Bank Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--dt-light-text-muted)' }}>
                        💳 Thông tin chuyển khoản
                      </h4>
                      <div style={{
                        background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
                        color: '#fff',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '2px solid #000',
                        boxShadow: '4px 4px 0px #000',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '160px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{
                            width: '38px', height: '28px',
                            background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                            borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)', position: 'relative'
                          }}>
                            <div style={{ position: 'absolute', top: '15%', bottom: '15%', left: '30%', right: '30%', borderLeft: '1px solid rgba(0,0,0,0.1)', borderRight: '1px solid rgba(0,0,0,0.1)' }}></div>
                            <div style={{ position: 'absolute', left: '15%', right: '15%', top: '35%', bottom: '35%', borderTop: '1px solid rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}></div>
                          </div>
                          <span style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace', opacity: 0.8 }}>DUOTECH PAY</span>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace', color: '#ffd700', margin: '15px 0 10px 0' }}>
                          {selectedCTV.bankAccountNumber ? selectedCTV.bankAccountNumber.match(/.{1,4}/g)?.join(' ') : '•••• •••• •••• ••••'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ fontSize: '8px', opacity: 0.7, display: 'block', textTransform: 'uppercase' }}>Chủ tài khoản</span>
                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedCTV.bankAccountName || 'CHƯA CẬP NHẬT'}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '8px', opacity: 0.7, display: 'block', textTransform: 'uppercase' }}>Ngân hàng</span>
                            <span style={{ fontWeight: 'bold' }}>{selectedCTV.bankName || 'CHƯA CẬP NHẬT'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--dt-light-text-secondary)', marginBottom: '8px' }}>
                        📸 MÃ QR NHẬN TIỀN
                      </span>
                      {selectedCTV.qrCodeImage ? (
                        <div style={{
                          background: '#fff', padding: '8px',
                          border: '2px solid #000', borderRadius: '8px',
                          boxShadow: '4px 4px 0px #000',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          maxWidth: '180px', width: '100%', height: '180px'
                        }}>
                          <img src={selectedCTV.qrCodeImage} alt="QR Code" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div style={{
                          background: 'var(--dt-light-surface-2)', padding: '20px',
                          border: '2px dashed var(--dt-light-border)', borderRadius: '8px',
                          width: '180px', height: '180px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--dt-light-text-muted)', textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '32px', marginBottom: '8px' }}>📭</span>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>Chưa có QR</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Commission List */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                      Hoa hồng chờ thanh toán ({ctvCommissions.length} đợt)
                    </h4>
                    {ctvCommissions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', border: '1px dashed var(--dt-light-border)' }}>
                        <span style={{ fontSize: '24px' }}>🎉</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)', margin: '8px 0 0 0', fontWeight: 600 }}>Không có hoa hồng nào chờ thanh toán.</p>
                      </div>
                    ) : (
                      <>
                        <div className="dash-table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <table className="dash-table" style={{ fontSize: '0.8rem' }}>
                            <thead>
                              <tr>
                                <th>Mã đơn</th>
                                <th>Dự án</th>
                                <th>Đợt</th>
                                <th>Số tiền</th>
                                <th>Ngày tạo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ctvCommissions.map(c => (
                                <tr key={c._id}>
                                  <td><strong>{c.orderCode}</strong></td>
                                  <td>{c.projectCode || '—'}</td>
                                  <td>Đợt {c.phase}</td>
                                  <td style={{ color: 'var(--dt-green)', fontWeight: 600 }}>{formatCurrency(c.amount)}</td>
                                  <td>{formatDate(c.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--dt-light-border)' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-secondary)' }}>Tổng cần thanh toán:</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dt-green)' }}>
                              {formatCurrency(ctvCommissions.reduce((sum, c) => sum + c.amount, 0))}
                            </div>
                          </div>
                          <button
                            className="dash-btn dash-btn-primary dash-btn-sm"
                            onClick={() => {
                              setSelectedCTV(null);
                              router.push('/dashboard/admin/commissions');
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Quản lý hoa hồng <ChevronRight size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--dt-light-border)' }}>
              <button type="button" className="dash-btn dash-btn-outline" onClick={() => setSelectedCTV(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
