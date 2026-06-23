'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DollarSign, Check, Info, X, Upload, Image, ExternalLink, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate, COMMISSION_STATUS, PROJECT_STATUS } from '@/lib/utils';

export default function AdminCommissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  // Payment modal
  const [payModal, setPayModal] = useState(null);
  const [payNote, setPayNote] = useState('');
  const [billImage, setBillImage] = useState('');
  const [uploadingBill, setUploadingBill] = useState(false);
  const [paying, setPaying] = useState(false);

  // Detail modal
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

  async function handleUploadBill(file) {
    setUploadingBill(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setBillImage(data.url);
      } else {
        alert('Lỗi upload: ' + (data.error || 'Unknown'));
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi upload file');
    } finally {
      setUploadingBill(false);
    }
  }

  async function handleConfirmPay() {
    if (!payModal) return;
    const commissionId = payModal._id;
    const previousCommissions = [...commissions];

    // Optimistically update local commissions state
    setCommissions(prev => prev.map(c => 
      c._id === commissionId ? { 
        ...c, 
        status: 'paid', 
        paidAt: new Date().toISOString(),
        paidNote: payNote,
        billImage: billImage,
      } : c
    ));

    setPaying(true);
    try {
      const res = await fetch(`/api/commissions/${commissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paidNote: payNote,
          billImage: billImage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayModal(null);
        setPayNote('');
        setBillImage('');
        // Update local state with the saved commission object, merging with populated fields
        setCommissions(prev => prev.map(c => 
          c._id === commissionId ? { ...c, ...data.commission } : c
        ));
      } else {
        setCommissions(previousCommissions);
      }
    } catch (err) {
      console.error(err);
      setCommissions(previousCommissions);
    } finally {
      setPaying(false);
    }
  }


  const pendingCommissions = commissions.filter(c => c.status === 'pending');
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const cancelledCommissions = commissions.filter(c => c.status === 'cancelled');

  const filteredCommissions = filter === 'all' ? commissions :
    commissions.filter(c => c.status === filter);

  // Sort: pending first
  const sortedCommissions = [...filteredCommissions].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (session?.user?.role !== 'admin') {
    return <div className="dash-body"><div className="empty-state"><h3>Bạn không có quyền truy cập</h3></div></div>;
  }

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <DollarSign size={22} /> Quản lý hoa hồng
          </h1>
          <p className="dash-page-subtitle">Theo dõi và thanh toán hoa hồng cho CTV</p>
        </div>
      </div>

      <div className="dash-body">
        {/* Stats */}
        <div className="dash-stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="dash-stat-card">
            <div className="dash-stat-header"><div className="dash-stat-icon" style={{ backgroundColor: 'var(--dt-light-surface-3)', color: 'var(--dt-light-text-secondary)' }}><DollarSign size={20} /></div></div>
            <div className="dash-stat-value">{formatCurrency(pendingCommissions.reduce((s, c) => s + c.amount, 0))}</div>
            <div className="dash-stat-label">Chờ thanh toán ({pendingCommissions.length})</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-header"><div className="dash-stat-icon" style={{ backgroundColor: 'var(--dt-light-surface-3)', color: 'var(--dt-light-text-secondary)' }}><DollarSign size={20} /></div></div>
            <div className="dash-stat-value">{formatCurrency(paidCommissions.reduce((s, c) => s + c.amount, 0))}</div>
            <div className="dash-stat-label">Đã thanh toán ({paidCommissions.length})</div>
          </div>
          {cancelledCommissions.length > 0 && (
            <div className="dash-stat-card">
              <div className="dash-stat-header"><div className="dash-stat-icon" style={{ backgroundColor: 'var(--dt-light-surface-3)', color: 'var(--dt-light-text-secondary)' }}><DollarSign size={20} /></div></div>
              <div className="dash-stat-value">{formatCurrency(cancelledCommissions.reduce((s, c) => s + c.amount, 0))}</div>
              <div className="dash-stat-label">Đã hủy ({cancelledCommissions.length})</div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="dash-filters" style={{ marginBottom: 'var(--space-4)' }}>
          <button className={`dash-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Tất cả ({commissions.length})
          </button>
          <button className={`dash-filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            ⏳ Chờ TT ({pendingCommissions.length})
          </button>
          <button className={`dash-filter-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>
            ✅ Đã TT ({paidCommissions.length})
          </button>
          {cancelledCommissions.length > 0 && (
            <button className={`dash-filter-btn ${filter === 'cancelled' ? 'active' : ''}`} onClick={() => setFilter('cancelled')}>
              ❌ Đã hủy ({cancelledCommissions.length})
            </button>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-page"><div className="loading-spinner"></div></div>
            ) : sortedCommissions.length === 0 ? (
              <div className="empty-state"><DollarSign size={48} /><h3>Chưa có hoa hồng nào</h3></div>
            ) : (
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Dự án</th>
                      <th>CTV</th>
                      <th>Đợt</th>
                      <th>Số tiền</th>
                      <th>Tiến độ DA</th>
                      <th>Trạng thái</th>
                      <th>Ngày TT</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCommissions.map(c => {
                      const isPending = c.status === 'pending';
                      return (
                        <tr key={c._id} style={isPending ? {
                          backgroundColor: '#fef2f2',
                          borderLeft: '3px solid #ef4444',
                        } : {}}>
                          <td><strong style={{ color: 'var(--dt-primary)' }}>{c.orderCode}</strong></td>
                          <td>
                            {c.projectCode ? (
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.projectCode}</span>
                            ) : '—'}
                          </td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.ctvId?.name || '—'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--dt-light-text-muted)' }}>{c.ctvId?.email || ''}</div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700 }}>Đợt {c.phase}</span>
                          </td>
                          <td style={{ color: 'var(--dt-green)', fontWeight: 700, fontSize: '0.95rem' }}>
                            {formatCurrency(c.amount)}
                          </td>
                          <td>
                            {c.projectId ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={`dash-badge ${PROJECT_STATUS[c.projectId.status]?.color}`} style={{ fontSize: '0.7rem' }}>
                                  {PROJECT_STATUS[c.projectId.status]?.label}
                                </span>
                                {c.projectId.progress !== undefined && (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--dt-light-text-muted)' }}>
                                    {c.projectId.progress}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span className={`dash-badge ${COMMISSION_STATUS[c.status]?.color}`}>
                              {COMMISSION_STATUS[c.status]?.label}
                            </span>
                          </td>
                          <td>{c.paidAt ? formatDate(c.paidAt) : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => setSelectedPayout(c)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Info size={12} /> Chi tiết
                              </button>
                              {isPending && (
                                <button className="dash-btn dash-btn-success dash-btn-sm" 
                                  onClick={() => { setPayModal(c); setPayNote(''); setBillImage(''); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={12} /> Thanh toán
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPayout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '550px', width: '100%', animation: 'fadeIn 0.2s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dt-light-border)' }}>
              <h3 className="dash-card-title" style={{ margin: 0 }}>Chi tiết hoa hồng</h3>
              <button type="button" onClick={() => setSelectedPayout(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dt-light-text-muted)' }}><X size={18} /></button>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>CTV:</strong> {selectedPayout.ctvId?.name || '—'} ({selectedPayout.ctvId?.email || '—'})</div>
                <div><strong>Mã đơn:</strong> {selectedPayout.orderCode} • <strong>Đợt:</strong> {selectedPayout.phase}</div>
                <div><strong>Số tiền:</strong> <span style={{ color: 'var(--dt-green)', fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(selectedPayout.amount)}</span></div>
              </div>

              {/* Project Progress */}
              {selectedPayout.projectId && (
                <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 700, color: '#1e40af' }}>📊 Tiến độ dự án</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`dash-badge ${PROJECT_STATUS[selectedPayout.projectId.status]?.color}`}>
                      {PROJECT_STATUS[selectedPayout.projectId.status]?.label}
                    </span>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${selectedPayout.projectId.progress || 0}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                      }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selectedPayout.projectId.progress || 0}%</span>
                  </div>
                  <button
                    className="dash-btn dash-btn-outline dash-btn-sm"
                    onClick={() => {
                      setSelectedPayout(null);
                      router.push('/dashboard/admin/projects');
                    }}
                    style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                  >
                    <ExternalLink size={12} /> Xem dự án
                  </button>
                </div>
              )}

              {/* Bank Info */}
              <div style={{ padding: '14px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', border: '1px solid var(--dt-light-border)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--dt-light-text-muted)' }}>💳 Tài khoản nhận tiền</h4>
                {selectedPayout.ctvId?.bankName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
                    <div><strong>Ngân hàng:</strong> {selectedPayout.ctvId.bankName}</div>
                    <div><strong>STK:</strong> {selectedPayout.ctvId.bankAccountNumber}</div>
                    <div><strong>Chủ TK:</strong> {selectedPayout.ctvId.bankAccountName}</div>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)', fontStyle: 'italic' }}>CTV chưa cập nhật bank info</span>
                )}
              </div>

              {selectedPayout.ctvId?.qrCodeImage && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mã QR:</span>
                  <div style={{ width: '160px', height: '160px', border: '1px solid var(--dt-light-border)', borderRadius: '8px', overflow: 'hidden', padding: '4px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={selectedPayout.ctvId.qrCodeImage} alt="QR" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              )}

              {/* Bill image if paid */}
              {selectedPayout.status === 'paid' && selectedPayout.billImage && (
                <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>🧾 Bill chuyển khoản</h4>
                  <img src={selectedPayout.billImage} alt="Bill CK" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }} />
                  {selectedPayout.paidNote && (
                    <p style={{ fontSize: '0.85rem', color: '#166534', marginTop: '8px', fontStyle: 'italic' }}>📝 {selectedPayout.paidNote}</p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', borderTop: '1px solid var(--dt-light-border)', paddingTop: 'var(--space-4)' }}>
                <button className="dash-btn dash-btn-outline" onClick={() => setSelectedPayout(null)}>Đóng</button>
                {selectedPayout.status === 'pending' && (
                  <button className="dash-btn dash-btn-success" onClick={() => { setPayModal(selectedPayout); setSelectedPayout(null); setPayNote(''); setBillImage(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} /> Xác nhận thanh toán
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {payModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '500px', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dt-light-border)' }}>
              <h3 className="dash-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                💸 Xác nhận thanh toán
              </h3>
              <button type="button" onClick={() => setPayModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dt-light-text-muted)' }}><X size={18} /></button>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', fontSize: '0.9rem' }}>
                <div><strong>CTV:</strong> {payModal.ctvId?.name} • <strong>Đợt:</strong> {payModal.phase}</div>
                <div style={{ marginTop: '4px' }}><strong>Số tiền:</strong> <span style={{ color: 'var(--dt-green)', fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(payModal.amount)}</span></div>
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Ghi chú thanh toán</label>
                <textarea
                  className="dash-form-textarea"
                  placeholder="VD: CK qua Vietcombank lúc 14h..."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Upload bill chuyển khoản (tùy chọn)</label>
                {billImage ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={billImage} alt="Bill" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--dt-light-border)' }} />
                    <button onClick={() => setBillImage('')} style={{
                      position: 'absolute', top: '-8px', right: '-8px',
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: '#ef4444', color: '#fff', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><X size={12} /></button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    padding: '20px', border: '2px dashed var(--dt-light-border)',
                    borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--dt-light-surface-2)',
                    transition: 'background-color 0.2s ease',
                  }}>
                    {uploadingBill ? (
                      <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                    ) : (
                      <>
                        <Upload size={24} color="var(--dt-light-text-muted)" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)', fontWeight: 600 }}>Click để chọn ảnh bill</span>
                      </>
                    )}
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => e.target.files[0] && handleUploadBill(e.target.files[0])} />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--dt-light-border)', paddingTop: 'var(--space-4)' }}>
                <button className="dash-btn dash-btn-outline" onClick={() => setPayModal(null)}>Hủy</button>
                <button className="dash-btn dash-btn-success" disabled={paying} onClick={handleConfirmPay}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {paying ? 'Đang xử lý...' : <><Check size={16} /> Xác nhận đã thanh toán</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
