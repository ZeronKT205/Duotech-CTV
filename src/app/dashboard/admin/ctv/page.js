'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Lock, Unlock, Coins, X, Check } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function AdminCTVPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPayoutCTV, setSelectedPayoutCTV] = useState(null);
  const [payoutCommissions, setPayoutCommissions] = useState([]);
  const [loadingPayoutCommissions, setLoadingPayoutCommissions] = useState(false);
  const [confirmingPayout, setConfirmingPayout] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
      setPendingCounts(data.pendingCounts || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleOpenPayout(ctv) {
    setSelectedPayoutCTV(ctv);
    setLoadingPayoutCommissions(true);
    try {
      const res = await fetch(`/api/commissions?all=true`);
      const data = await res.json();
      const filtered = (data.commissions || []).filter(c => c.ctvId?._id === ctv._id && c.status === 'pending');
      setPayoutCommissions(filtered);
    } catch (err) {
      console.error('Error fetching commissions for payout:', err);
    } finally {
      setLoadingPayoutCommissions(false);
    }
  }

  async function handleConfirmPayout() {
    if (!selectedPayoutCTV) return;
    setConfirmingPayout(true);
    try {
      const res = await fetch('/api/commissions/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctvId: selectedPayoutCTV._id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Xác nhận thanh toán thành công!');
        fetchUsers();
        setSelectedPayoutCTV(null);
      } else {
        alert(`Lỗi: ${data.error || 'Không thể thanh toán'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối');
    } finally {
      setConfirmingPayout(false);
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

  if (session?.user?.role !== 'admin') {
    return <div className="dash-body"><div className="empty-state"><h3>Bạn không có quyền truy cập</h3></div></div>;
  }

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <Users size={22} /> Quản lý Cộng Tác Viên
          </h1>
          <p className="dash-page-subtitle">Danh sách và quản lý tài khoản CTV</p>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-card">
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
                      <th>Ngân hàng & QR</th>
                      <th>Role</th>
                      <th>Ngày tham gia</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} style={pendingCounts[user._id] > 0 ? { backgroundColor: '#fff1f2' } : {}}>
                        <td>
                          {user.avatar ? (
                            <img src={user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--dt-light-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Users size={14} />
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong>{user.name}</strong>
                            {pendingCounts[user._id] > 0 && (
                              <span className="dash-badge red" style={{ fontSize: '0.7rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                Cần pay
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone || '—'}</td>
                        <td>
                          {user.bankName ? (
                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span><strong>{user.bankName}</strong></span>
                              <span>STK: {user.bankAccountNumber}</span>
                              {user.qrCodeImage ? (
                                <a href={user.qrCodeImage} target="_blank" rel="noreferrer" style={{ color: 'var(--dt-primary)', textDecoration: 'underline', fontSize: '0.75rem', fontWeight: 600 }}>Xem QR Code</a>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--dt-light-text-muted)', fontStyle: 'italic' }}>Chưa có QR</span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)', fontStyle: 'italic' }}>Chưa cập nhật</span>
                          )}
                        </td>
                        <td>
                          <span className={`dash-badge ${user.role === 'admin' ? 'purple' : 'blue'}`}>
                            {user.role === 'admin' ? '👑 Admin' : '🤝 CTV'}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <span className={`dash-badge ${user.isActive ? 'green' : 'red'}`}>
                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td>
                          {user.role !== 'admin' && (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                className="dash-btn"
                                style={{
                                  backgroundColor: pendingCounts[user._id] > 0 ? '#ef4444' : 'var(--dt-light-surface-3)',
                                  color: pendingCounts[user._id] > 0 ? '#fff' : 'var(--dt-light-text)',
                                  border: 'none',
                                  fontSize: '0.75rem',
                                  padding: '4px 10px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  position: 'relative'
                                }}
                                onClick={() => handleOpenPayout(user)}
                                title="Đối soát & Thanh toán hoa hồng"
                              >
                                <Coins size={12} /> Payout
                                {pendingCounts[user._id] > 0 && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-8px',
                                    backgroundColor: '#b91c1c',
                                    color: '#fff',
                                    fontSize: '9px',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    border: '2px solid #fff'
                                  }}>
                                    {pendingCounts[user._id]}
                                  </span>
                                )}
                              </button>
                              <button
                                className={`dash-btn dash-btn-sm ${user.isActive ? 'dash-btn-danger' : 'dash-btn-success'}`}
                                onClick={() => toggleUser(user._id, user.isActive)}
                              >
                                {user.isActive ? <><Lock size={12} /> Khóa</> : <><Unlock size={12} /> Mở</>}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPayoutCTV && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '850px', width: '100%', animation: 'fadeIn 0.2s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dt-light-border)' }}>
              <h3 className="dash-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                💰 Đối soát hoa hồng: {selectedPayoutCTV.name}
              </h3>
              <button type="button" onClick={() => setSelectedPayoutCTV(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dt-light-text-muted)' }}><X size={18} /></button>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', paddingTop: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
                
                {/* Left Side: CTV Info & Bank Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>Họ tên:</strong> {selectedPayoutCTV.name} • <strong>Email:</strong> {selectedPayoutCTV.email}
                  </div>
                  
                  {/* Neobrutalist Bank Card */}
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
                      {/* Gold Card Chip */}
                      <div style={{
                        width: '38px',
                        height: '28px',
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.15)',
                        position: 'relative'
                      }}>
                        <div style={{ position: 'absolute', top: '15%', bottom: '15%', left: '30%', right: '30%', borderLeft: '1px solid rgba(0,0,0,0.1)', borderRight: '1px solid rgba(0,0,0,0.1)' }}></div>
                        <div style={{ position: 'absolute', left: '15%', right: '15%', top: '35%', bottom: '35%', borderTop: '1px solid rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}></div>
                      </div>
                      <span style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace', opacity: 0.8 }}>
                        DUOTECH PAY
                      </span>
                    </div>

                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace', color: '#ffd700', margin: '15px 0 10px 0' }}>
                      {selectedPayoutCTV.bankAccountNumber ? selectedPayoutCTV.bankAccountNumber.match(/.{1,4}/g)?.join(' ') : '•••• •••• •••• ••••'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ fontSize: '8px', opacity: 0.7, display: 'block', textTransform: 'uppercase' }}>Chủ tài khoản</span>
                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedPayoutCTV.bankAccountName || 'CHƯA CẬP NHẬT'}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '8px', opacity: 0.7, display: 'block', textTransform: 'uppercase' }}>Ngân hàng</span>
                        <span style={{ fontWeight: 'bold' }}>{selectedPayoutCTV.bankName || 'CHƯA CẬP NHẬT'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: QR Code Area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--dt-light-text-secondary)', marginBottom: '8px' }}>
                    📸 MÃ QR NHẬN TIỀN
                  </span>
                  {selectedPayoutCTV.qrCodeImage ? (
                    <div style={{
                      background: '#fff',
                      padding: '8px',
                      border: '2px solid #000',
                      borderRadius: '8px',
                      boxShadow: '4px 4px 0px #000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      maxWidth: '180px',
                      width: '100%',
                      height: '180px'
                    }}>
                      <img
                        src={selectedPayoutCTV.qrCodeImage}
                        alt="QR Code"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      background: 'var(--dt-light-surface-2)',
                      padding: '20px',
                      border: '2px dashed var(--dt-light-border)',
                      borderRadius: '8px',
                      width: '180px',
                      height: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--dt-light-text-muted)',
                      textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '32px', marginBottom: '8px' }}>📭</span>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>Chưa có QR</p>
                      <p style={{ fontSize: '0.65rem', margin: '4px 0 0 0' }}>CTV chưa tải mã QR lên hồ sơ</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Area: Commissions List */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Danh sách đợt hoa hồng chờ thanh toán ({payoutCommissions.length} đợt)
                </h4>
                
                {loadingPayoutCommissions ? (
                  <div className="loading-page" style={{ minHeight: '100px' }}><div className="loading-spinner"></div></div>
                ) : payoutCommissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', border: '1px dashed var(--dt-light-border)' }}>
                    <span style={{ fontSize: '24px' }}>🎉</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)', margin: '8px 0 0 0', fontWeight: 600 }}>Không có đơn hoa hồng nào chờ thanh toán.</p>
                  </div>
                ) : (
                  <div className="dash-table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="dash-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Đợt</th>
                          <th>Số tiền</th>
                          <th>Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutCommissions.map(c => (
                          <tr key={c._id}>
                            <td><strong>{c.orderCode}</strong></td>
                            <td>Đợt {c.phase}</td>
                            <td style={{ color: 'var(--dt-green)', fontWeight: 600 }}>{formatCurrency(c.amount)}</td>
                            <td>{formatDate(c.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--dt-light-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-secondary)' }}>Tổng số tiền cần thanh toán:</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dt-green)' }}>
                    {formatCurrency(payoutCommissions.reduce((sum, c) => sum + c.amount, 0))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button type="button" className="dash-btn dash-btn-outline" onClick={() => setSelectedPayoutCTV(null)}>Đóng</button>
                  <button
                    type="button"
                    className="dash-btn dash-btn-success"
                    disabled={payoutCommissions.length === 0 || confirmingPayout}
                    onClick={handleConfirmPayout}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {confirmingPayout ? (
                      <><div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div> Đang xử lý...</>
                    ) : (
                      <><Check size={16} /> 💸 Xác nhận đã trả hoa hồng</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
