'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DollarSign, Check, Info, X } from 'lucide-react';
import { formatCurrency, formatDate, COMMISSION_STATUS } from '@/lib/utils';

export default function AdminCommissionsPage() {
  const { data: session } = useSession();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState(null);

  useEffect(() => { fetchCommissions(); }, []);

  async function fetchCommissions() {
    try {
      const res = await fetch('/api/commissions?all=true');
      const data = await res.json();
      setCommissions(data.commissions || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function markAsPaid(commissionId) {
    try {
      await fetch(`/api/commissions/${commissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      fetchCommissions();
    } catch (err) { console.error(err); }
  }

  if (session?.user?.role !== 'admin') {
    return <div className="dash-body"><div className="empty-state"><h3>Bạn không có quyền truy cập</h3></div></div>;
  }

  const pendingCommissions = commissions.filter(c => c.status === 'pending');
  const paidCommissions = commissions.filter(c => c.status === 'paid');

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <DollarSign size={22} /> Quản lý hoa hồng
          </h1>
          <p className="dash-page-subtitle">Đánh dấu thanh toán cho CTV</p>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="dash-stat-card">
            <div className="dash-stat-header"><div className="dash-stat-icon orange"><DollarSign size={20} /></div></div>
            <div className="dash-stat-value">{formatCurrency(pendingCommissions.reduce((s, c) => s + c.amount, 0))}</div>
            <div className="dash-stat-label">Chờ thanh toán ({pendingCommissions.length})</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-header"><div className="dash-stat-icon green"><DollarSign size={20} /></div></div>
            <div className="dash-stat-value">{formatCurrency(paidCommissions.reduce((s, c) => s + c.amount, 0))}</div>
            <div className="dash-stat-label">Đã thanh toán ({paidCommissions.length})</div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header"><h2 className="dash-card-title">Tất cả hoa hồng</h2></div>
          <div className="dash-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-page"><div className="loading-spinner"></div></div>
            ) : commissions.length === 0 ? (
              <div className="empty-state"><DollarSign size={48} /><h3>Chưa có hoa hồng nào</h3></div>
            ) : (
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>CTV</th>
                      <th>Đợt</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày TT</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(c => (
                      <tr key={c._id}>
                        <td><strong>{c.orderCode}</strong></td>
                        <td>{c.ctvId?.email || c.ctvId?.name || '—'}</td>
                        <td>Đợt {c.phase}</td>
                        <td style={{ color: 'var(--dt-green)', fontWeight: 600 }}>{formatCurrency(c.amount)}</td>
                        <td>
                          <span className={`dash-badge ${COMMISSION_STATUS[c.status]?.color}`}>
                            {COMMISSION_STATUS[c.status]?.label}
                          </span>
                        </td>
                        <td>{c.paidAt ? formatDate(c.paidAt) : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => setSelectedPayout(c)}>
                              <Info size={12} /> Chi tiết
                            </button>
                            {c.status === 'pending' && (
                              <button className="dash-btn dash-btn-success dash-btn-sm" onClick={() => markAsPaid(c._id)}>
                                <Check size={12} /> Đã thanh toán
                              </button>
                            )}
                          </div>
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

      {selectedPayout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '500px', width: '100%', animation: 'fadeIn 0.2s ease-out', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dt-light-border)', paddingBottom: 'var(--space-4)' }}>
              <h3 className="dash-card-title" style={{ margin: 0, fontSize: '1.1rem' }}>Thông tin thanh toán CTV</h3>
              <button type="button" onClick={() => setSelectedPayout(null)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dt-light-text-muted)' }}><X size={18} /></button>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.9rem' }}>
                <strong>Cộng tác viên:</strong> {selectedPayout.ctvId?.name || '—'} ({selectedPayout.ctvId?.email || '—'})
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <strong>Số tiền hoa hồng:</strong> <span style={{ color: 'var(--dt-green)', fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(selectedPayout.amount)}</span>
              </div>
              
              <div style={{ background: 'var(--dt-light-surface-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--dt-light-border)' }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dt-light-text-muted)' }}>Chi tiết tài khoản nhận tiền:</h4>
                {selectedPayout.ctvId?.bankName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                    <div><strong>Ngân hàng:</strong> {selectedPayout.ctvId.bankName}</div>
                    <div><strong>Số tài khoản:</strong> {selectedPayout.ctvId.bankAccountNumber}</div>
                    <div><strong>Tên tài khoản:</strong> {selectedPayout.ctvId.bankAccountName}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)', fontStyle: 'italic' }}>
                    CTV chưa cập nhật thông tin ngân hàng.
                  </div>
                )}
              </div>

              {selectedPayout.ctvId?.qrCodeImage && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mã QR ngân hàng của CTV:</span>
                  <div style={{ width: '200px', height: '200px', border: '1px solid var(--dt-light-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', padding: '6px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={selectedPayout.ctvId.qrCodeImage} alt="Bank QR" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)', borderTop: '1px solid var(--dt-light-border)', paddingTop: 'var(--space-4)' }}>
                <button type="button" className="dash-btn dash-btn-outline" onClick={() => setSelectedPayout(null)}>Đóng</button>
                {selectedPayout.status === 'pending' && (
                  <button type="button" className="dash-btn dash-btn-success" onClick={() => { markAsPaid(selectedPayout._id); setSelectedPayout(null); }}>
                    <Check size={16} /> Xác nhận đã thanh toán
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
