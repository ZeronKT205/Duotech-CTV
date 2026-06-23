'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ClipboardList, Save } from 'lucide-react';
import { formatCurrency, formatDate, ORDER_STATUS, WEBSITE_TYPES } from '@/lib/utils';

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewMode, setViewMode] = useState('kanban'); // Default to kanban

  useEffect(() => { fetchOrders(); }, []);

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }

  const handleDrop = async (e, status) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (!orderId) return;

    const order = orders.find(o => o._id === orderId);
    if (order && order.status !== status) {
      await updateOrderStatus(orderId, status);
    }
  };

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders?all=true');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function updateOrder(orderId) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingOrder(null);
        fetchOrders();
      }
    } catch (err) { console.error(err); }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (session?.user?.role !== 'admin') {
    return <div className="dash-body"><div className="empty-state"><h3>Bạn không có quyền truy cập trang này</h3></div></div>;
  }

  return (
    <>
      <div className="dash-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="dash-page-title">
            <ClipboardList size={22} /> Quản lý đơn hàng & Dự án
          </h1>
          <p className="dash-page-subtitle">Duyệt đơn và kéo thả dự án để cập nhật tiến độ triển khai</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`dash-btn ${viewMode === 'list' ? 'dash-btn-primary' : 'dash-btn-outline'}`}
            onClick={() => setViewMode('list')}
            style={{ fontSize: '0.85rem', padding: '6px 12px', height: '36px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            📋 Danh sách
          </button>
          <button
            type="button"
            className={`dash-btn ${viewMode === 'kanban' ? 'dash-btn-primary' : 'dash-btn-outline'}`}
            onClick={() => setViewMode('kanban')}
            style={{ fontSize: '0.85rem', padding: '6px 12px', height: '36px', display: 'flex', alignItems: 'center', gap: '4px' }}
            id="toggle-kanban-btn"
          >
            🗂️ Kanban Tiến độ
          </button>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-filters">
          {['all', ...Object.keys(ORDER_STATUS)].map(s => (
            <button key={s} className={`dash-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? `Tất cả (${orders.length})` : `${ORDER_STATUS[s]?.label} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        {viewMode === 'list' ? (
          <>
            <div className="dash-filters" style={{ marginBottom: 'var(--space-4)' }}>
              {['all', ...Object.keys(ORDER_STATUS)].map(s => (
                <button key={s} className={`dash-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                  {s === 'all' ? `Tất cả (${orders.length})` : `${ORDER_STATUS[s]?.label} (${orders.filter(o => o.status === s).length})`}
                </button>
              ))}
            </div>

            <div className="dash-card">
              <div className="dash-card-body" style={{ padding: 0 }}>
                {loading ? (
                  <div className="loading-page"><div className="loading-spinner"></div></div>
                ) : (
                  <div className="dash-table-container">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>CTV</th>
                          <th>SĐT CTV</th>
                          <th>Loại web</th>
                          <th>Mô tả</th>
                          <th>Trạng thái</th>
                          <th>Giá trị HĐ</th>
                          <th>Ngày tạo</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => (
                          <tr key={order._id}>
                            <td><strong>{order.orderCode}</strong></td>
                            <td>{order.ctvEmail}</td>
                            <td>{order.ctvPhone}</td>
                            <td style={{ fontSize: '0.8rem' }}>{WEBSITE_TYPES[order.websiteType]}</td>
                            <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.description}>
                              {order.description}
                            </td>
                            <td>
                              {editingOrder === order._id ? (
                                <select className="dash-form-select" style={{ fontSize: '0.75rem', padding: '4px 8px' }} value={editForm.status || order.status}
                                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                  {Object.entries(ORDER_STATUS).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`dash-badge ${ORDER_STATUS[order.status]?.color}`}>{ORDER_STATUS[order.status]?.label}</span>
                              )}
                            </td>
                            <td>
                              {editingOrder === order._id ? (
                                <input type="number" className="dash-form-input" style={{ fontSize: '0.75rem', padding: '4px 8px', width: '120px' }}
                                  placeholder="VNĐ" value={editForm.contractValue || ''} onChange={(e) => setEditForm({ ...editForm, contractValue: Number(e.target.value) })} />
                              ) : (
                                order.contractValue > 0 ? formatCurrency(order.contractValue) : '—'
                              )}
                            </td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>
                              {editingOrder === order._id ? (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button className="dash-btn dash-btn-success dash-btn-sm" onClick={() => updateOrder(order._id)}>
                                    <Save size={12} /> Lưu
                                  </button>
                                  <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => setEditingOrder(null)}>Hủy</button>
                                </div>
                              ) : (
                                <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => { setEditingOrder(order._id); setEditForm({ status: order.status, contractValue: order.contractValue }); }}>
                                  Sửa
                                </button>
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
          </>
        ) : (
          /* Kanban Board View */
          loading ? (
            <div className="loading-page"><div className="loading-spinner"></div></div>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-4)', minHeight: '620px', alignItems: 'flex-start' }}>
              {Object.entries(ORDER_STATUS).map(([statusKey, statusInfo]) => {
                const statusOrders = orders.filter(o => o.status === statusKey);
                return (
                  <div
                    key={statusKey}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, statusKey)}
                    style={{
                      flex: '1',
                      minWidth: '280px',
                      backgroundColor: 'var(--dt-light-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--dt-light-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      maxHeight: '750px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Column Header */}
                    <div style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--dt-light-border)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      borderTopLeftRadius: 'var(--radius-md)',
                      borderTopRightRadius: 'var(--radius-md)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: statusKey === 'pending' ? '#eab308' :
                                           statusKey === 'consulting' ? '#3b82f6' :
                                           statusKey === 'contracted' ? '#a855f7' :
                                           statusKey === 'in_progress' ? '#f97316' :
                                           statusKey === 'completed' ? '#10b981' : '#ef4444'
                        }}></span>
                        {statusInfo.label}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--dt-light-border)',
                        color: 'var(--dt-light-text-secondary)'
                      }}>{statusOrders.length}</span>
                    </div>

                    {/* Column Body / Cards List */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: 'var(--space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                      minHeight: '220px'
                    }}>
                      {statusOrders.length === 0 ? (
                        <div style={{
                          padding: 'var(--space-8) var(--space-4)',
                          textAlign: 'center',
                          color: 'var(--dt-light-text-muted)',
                          fontSize: '0.8rem',
                          border: '2px dashed var(--dt-light-border)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(0,0,0,0.01)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '100px'
                        }}>
                          Kéo thả dự án vào đây
                        </div>
                      ) : (
                        statusOrders.map(order => (
                          <div
                            key={order._id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('orderId', order._id)}
                            style={{
                              backgroundColor: '#fff',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--dt-light-border)',
                              padding: 'var(--space-4)',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                              cursor: 'grab',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 'var(--space-3)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                            }}
                            onDragOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onDragLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'; }}
                            onDrop={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'; }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--dt-primary)' }}>{order.orderCode}</span>
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                backgroundColor: 'var(--dt-light-surface-2)',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 700,
                                color: 'var(--dt-light-text)',
                                border: '1px solid var(--dt-light-border)'
                              }}>
                                {WEBSITE_TYPES[order.websiteType]}
                              </span>
                            </div>

                            <div style={{
                              fontSize: '0.85rem',
                              color: 'var(--dt-light-text-secondary)',
                              lineHeight: '1.4',
                              wordBreak: 'break-word',
                              maxHeight: '52px',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              textOverflow: 'ellipsis'
                            }} title={order.description}>
                              {order.description}
                            </div>

                            <div style={{
                              borderTop: '1px solid var(--dt-light-border)',
                              paddingTop: 'var(--space-2)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '0.75rem',
                              color: 'var(--dt-light-text-muted)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>CTV: <strong>{order.ctvEmail.split('@')[0]}</strong></span>
                                <span>SĐT: {order.ctvPhone}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                <span style={{ fontWeight: 800, color: 'var(--dt-green)', fontSize: '0.85rem' }}>
                                  {order.contractValue > 0 ? formatCurrency(order.contractValue) : '— VNĐ'}
                                </span>
                                <button
                                  type="button"
                                  className="dash-btn dash-btn-outline dash-btn-sm"
                                  style={{ fontSize: '0.7rem', padding: '2px 8px', height: '24px' }}
                                  onClick={() => {
                                    setEditingOrder(order._id);
                                    setEditForm({ status: order.status, contractValue: order.contractValue });
                                    setViewMode('list');
                                  }}
                                >
                                  Sửa nhanh
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </>
  );
}
