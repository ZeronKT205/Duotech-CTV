'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, Check, X, FolderPlus, AlertCircle, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import { formatDate, WEBSITE_TYPES, ORDER_STATUS } from '@/lib/utils';

export default function AdminRequestsPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'

  // Create project modal
  const [createModal, setCreateModal] = useState(null);
  const [createForm, setCreateForm] = useState({
    customerName: '',
    zaloGroupLink: '',
    contractValue: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Expandable row
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders?all=true');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleCreateProject() {
    if (!createModal) return;
    const orderId = createModal._id;
    const previousOrders = [...orders];

    // Optimistically update local order status to approved
    setOrders(prev => prev.map(o => 
      o._id === orderId ? { ...o, status: 'approved' } : o
    ));

    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          customerName: createForm.customerName,
          zaloGroupLink: createForm.zaloGroupLink,
          contractValue: Number(createForm.contractValue) || 0,
          description: createForm.description || createModal.description,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Tạo dự án thành công!');
        setCreateModal(null);
        setCreateForm({ customerName: '', zaloGroupLink: '', contractValue: '', description: '' });
        
        // Update list state with exact backend order data
        setOrders(prev => prev.map(o => 
          o._id === orderId ? { ...o, status: 'approved', projectId: data.project } : o
        ));
      } else {
        alert(`Lỗi: ${data.error || 'Không thể tạo dự án'}`);
        setOrders(previousOrders);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối');
      setOrders(previousOrders);
    } finally {
      setCreating(false);
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    const orderId = rejectModal._id;
    const previousOrders = [...orders];

    // Optimistically update local order status to rejected
    setOrders(prev => prev.map(o => 
      o._id === orderId ? { ...o, status: 'rejected', rejectionReason } : o
    ));

    setRejecting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason }),
      });
      if (res.ok) {
        const data = await res.json();
        setRejectModal(null);
        setRejectionReason('');
        // Update local state with exact data from server
        setOrders(prev => prev.map(o => 
          o._id === orderId ? { ...o, ...data.order } : o
        ));
      } else {
        setOrders(previousOrders);
      }
    } catch (err) {
      console.error(err);
      setOrders(previousOrders);
    } finally {
      setRejecting(false);
    }
  }


  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (session?.user?.role !== 'admin') {
    return <div className="dash-body"><div className="empty-state"><h3>Bạn không có quyền truy cập</h3></div></div>;
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const approvedCount = orders.filter(o => o.status === 'approved').length;
  const rejectedCount = orders.filter(o => o.status === 'rejected').length;

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <Inbox size={22} /> Đơn yêu cầu
          </h1>
          <p className="dash-page-subtitle">Quản lý các đơn báo từ CTV, duyệt và tạo dự án</p>
        </div>
      </div>

      <div className="dash-body">
        {/* Filters and Layout Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-5)',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}>
          <div className="dash-filters" style={{ margin: 0 }}>
            <button className={`dash-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              Tất cả ({orders.length})
            </button>
            <button className={`dash-filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
              Cần xử lý ({pendingCount})
            </button>
            <button className={`dash-filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
              Thành công ({approvedCount})
            </button>
            <button className={`dash-filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
              Thất bại ({rejectedCount})
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--dt-light-surface-2)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--dt-light-border)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <button
              onClick={() => setViewMode('list')}
              className="dash-btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: 'auto',
                backgroundColor: viewMode === 'list' ? 'var(--dt-light-surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--dt-light-text)' : 'var(--dt-light-text-secondary)',
                border: viewMode === 'list' ? '1px solid var(--dt-light-border)' : 'none',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                fontWeight: viewMode === 'list' ? 700 : 500,
                borderRadius: '6px',
              }}
            >
              <List size={14} /> Danh sách
            </button>
            <button
              onClick={() => setViewMode('card')}
              className="dash-btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: 'auto',
                backgroundColor: viewMode === 'card' ? 'var(--dt-light-surface)' : 'transparent',
                color: viewMode === 'card' ? 'var(--dt-light-text)' : 'var(--dt-light-text-secondary)',
                border: viewMode === 'card' ? '1px solid var(--dt-light-border)' : 'none',
                boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                fontWeight: viewMode === 'card' ? 700 : 500,
                borderRadius: '6px',
              }}
            >
              <LayoutGrid size={14} /> Dạng thẻ
            </button>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-page"><div className="loading-spinner"></div></div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <Inbox size={48} />
                <h3>Không có đơn yêu cầu nào</h3>
              </div>
            ) : viewMode === 'list' ? (
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Mã đơn</th>
                      <th>CTV</th>
                      <th>SĐT CTV</th>
                      <th>Loại web</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <Fragment key={order._id}>
                        <tr style={order.status === 'pending' ? { backgroundColor: '#fffbeb' } : {}}>
                          <td>
                            <button
                              onClick={() => setExpandedRow(expandedRow === order._id ? null : order._id)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'var(--dt-light-text-muted)' }}
                            >
                              {expandedRow === order._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                          <td><strong style={{ color: 'var(--dt-primary)' }}>{order.orderCode}</strong></td>
                          <td>{order.ctvEmail}</td>
                          <td>{order.ctvPhone}</td>
                          <td style={{ fontSize: '0.82rem' }}>{WEBSITE_TYPES[order.websiteType]}</td>
                          <td>
                            <span className={`dash-badge ${ORDER_STATUS[order.status]?.color}`}>
                              {ORDER_STATUS[order.status]?.label}
                            </span>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            {order.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="dash-btn dash-btn-success dash-btn-sm"
                                  onClick={() => {
                                    setCreateModal(order);
                                    setCreateForm({
                                      customerName: '',
                                      zaloGroupLink: '',
                                      contractValue: '',
                                      description: order.description,
                                    });
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <FolderPlus size={13} /> Tạo dự án
                                </button>
                                <button
                                  className="dash-btn dash-btn-danger dash-btn-sm"
                                  onClick={() => { setRejectModal(order); setRejectionReason(''); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <X size={13} /> Từ chối
                                </button>
                              </div>
                            )}
                            {order.status === 'approved' && order.projectId && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)' }}>
                                → Dự án đã tạo
                              </span>
                            )}
                            {order.status === 'rejected' && (
                              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic' }}>
                                {order.rejectionReason || 'Đã từ chối'}
                              </span>
                            )}
                          </td>
                        </tr>
                        {/* Expanded Row */}
                        {expandedRow === order._id && (
                          <tr key={`${order._id}-detail`}>
                            <td colSpan="8" style={{ backgroundColor: 'var(--dt-light-surface-2)', padding: '16px 24px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                  <strong style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)', textTransform: 'uppercase' }}>Mô tả nhu cầu:</strong>
                                  <p style={{ fontSize: '0.9rem', margin: '4px 0 0 0', lineHeight: 1.5 }}>{order.description}</p>
                                </div>
                                {order.note && (
                                  <div>
                                    <strong style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)', textTransform: 'uppercase' }}>Ghi chú CTV:</strong>
                                    <p style={{ fontSize: '0.9rem', margin: '4px 0 0 0', lineHeight: 1.5 }}>{order.note}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ========== CARD VIEW ========== */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)'
              }}>
                {filteredOrders.map(order => (
                  <div
                    key={order._id}
                    className="bento-card"
                    style={{
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: order.status === 'pending' ? '4px solid #eab308' : '2px solid var(--dt-dark-border)',
                      padding: 'var(--space-4)',
                      minHeight: '280px',
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <strong style={{ color: 'var(--dt-primary)', fontSize: '0.95rem' }}>{order.orderCode}</strong>
                        <span className={`dash-badge ${ORDER_STATUS[order.status]?.color}`} style={{ fontSize: '0.68rem' }}>
                          {ORDER_STATUS[order.status]?.label}
                        </span>
                      </div>

                      {/* CTV Info */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--dt-light-text-secondary)', marginBottom: '8px' }}>
                        <div>👤 CTV: <strong>{order.ctvEmail}</strong></div>
                        <div style={{ marginTop: '2px' }}>📞 SĐT: {order.ctvPhone}</div>
                      </div>

                      {/* Web Type */}
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--dt-light-text)' }}>
                        🌐 {WEBSITE_TYPES[order.websiteType]}
                      </div>

                      {/* Description & notes */}
                      <div style={{
                        background: 'var(--dt-light-surface-2)',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        marginBottom: '12px',
                        lineHeight: 1.45,
                        border: '1px solid var(--dt-light-border)'
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--dt-light-text-secondary)', marginBottom: '4px' }}>Mô tả:</div>
                        <p style={{ margin: 0, maxHeight: '80px', overflowY: 'auto', color: 'var(--dt-light-text)' }}>{order.description}</p>
                        {order.note && (
                          <div style={{ marginTop: '8px', borderTop: '1px dashed var(--dt-light-border)', paddingTop: '6px', color: 'var(--dt-light-text-secondary)' }}>
                            <span style={{ fontWeight: 600 }}>Ghi chú CTV:</span> {order.note}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer / Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--dt-light-border)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--dt-light-text-muted)' }}>
                        <span>Ngày tạo:</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>

                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <button
                            className="dash-btn dash-btn-success dash-btn-sm"
                            onClick={() => {
                              setCreateModal(order);
                              setCreateForm({
                                customerName: '',
                                zaloGroupLink: '',
                                contractValue: '',
                                description: order.description,
                              });
                            }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.72rem' }}
                          >
                            <FolderPlus size={12} /> Tạo dự án
                          </button>
                          <button
                            className="dash-btn dash-btn-danger dash-btn-sm"
                            onClick={() => { setRejectModal(order); setRejectionReason(''); }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.72rem' }}
                          >
                            <X size={12} /> Từ chối
                          </button>
                        </div>
                      )}

                      {order.status === 'approved' && order.projectId && (
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--dt-light-text-muted)', background: '#ecfdf5', padding: '4px', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
                          ✓ Dự án đã tạo thành công
                        </div>
                      )}

                      {order.status === 'rejected' && (
                        <div style={{ fontSize: '0.72rem', color: '#ef4444', fontStyle: 'italic', background: '#fef2f2', padding: '6px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                          <strong>Lý do từ chối:</strong> {order.rejectionReason || 'Không có lý do'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {createModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '600px', width: '100%', animation: 'fadeIn 0.2s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dt-light-border)' }}>
              <h3 className="dash-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={20} /> Tạo dự án từ đơn {createModal.orderCode}
              </h3>
              <button type="button" onClick={() => setCreateModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dt-light-text-muted)' }}><X size={18} /></button>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Auto-filled info */}
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>CTV:</strong> {createModal.ctvEmail} • <strong>SĐT:</strong> {createModal.ctvPhone}</div>
                <div><strong>Loại web:</strong> {WEBSITE_TYPES[createModal.websiteType]}</div>
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Tên khách hàng</label>
                <input
                  type="text" className="dash-form-input"
                  placeholder="VD: Anh Minh - Công ty ABC"
                  value={createForm.customerName}
                  onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                />
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Mô tả dự án</label>
                <textarea
                  className="dash-form-textarea"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Link nhóm Zalo</label>
                <input
                  type="url" className="dash-form-input"
                  placeholder="https://zalo.me/..."
                  value={createForm.zaloGroupLink}
                  onChange={(e) => setCreateForm({ ...createForm, zaloGroupLink: e.target.value })}
                />
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Giá trị hợp đồng dự kiến (VNĐ)</label>
                <input
                  type="number" className="dash-form-input"
                  placeholder="VD: 15000000"
                  value={createForm.contractValue}
                  onChange={(e) => setCreateForm({ ...createForm, contractValue: e.target.value })}
                />
                <span className="dash-form-helper">Có thể cập nhật sau khi ký hợp đồng</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--dt-light-border)', paddingTop: 'var(--space-4)' }}>
                <button type="button" className="dash-btn dash-btn-outline" onClick={() => setCreateModal(null)}>Hủy</button>
                <button
                  type="button" className="dash-btn dash-btn-success"
                  disabled={creating}
                  onClick={handleCreateProject}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {creating ? (
                    <><div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div> Đang tạo...</>
                  ) : (
                    <><Check size={16} /> Tạo dự án</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '450px', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dt-light-border)' }}>
              <h3 className="dash-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <AlertCircle size={20} /> Từ chối đơn {rejectModal.orderCode}
              </h3>
              <button type="button" onClick={() => setRejectModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dt-light-text-muted)' }}><X size={18} /></button>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="dash-form-group">
                <label className="dash-form-label">Lý do từ chối</label>
                <textarea
                  className="dash-form-textarea"
                  placeholder="VD: Khách hàng hủy, không liên lạc được,..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button type="button" className="dash-btn dash-btn-outline" onClick={() => setRejectModal(null)}>Hủy</button>
                <button
                  type="button" className="dash-btn dash-btn-danger"
                  disabled={rejecting}
                  onClick={handleReject}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {rejecting ? 'Đang xử lý...' : <><X size={16} /> Xác nhận từ chối</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
