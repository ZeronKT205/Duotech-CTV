'use client';

import { useState, useEffect, Fragment } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, CheckCircle2, XCircle, ExternalLink, HelpCircle, User, DollarSign, MessageSquare, FileText } from 'lucide-react';
import { formatCurrency, formatDate, ORDER_STATUS, WEBSITE_TYPES, PROJECT_STATUS } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusIndex = (status) => {
    const sequence = ['consulting', 'contracted', 'in_progress', 'completed'];
    return sequence.indexOf(status);
  };

  const projectSteps = [
    { key: 'consulting', label: 'Đang tư vấn', desc: 'Đang liên hệ & tư vấn giải pháp' },
    { key: 'contracted', label: 'Đã ký HĐ', desc: 'Đã chốt hợp đồng & thanh toán đợt 1' },
    { key: 'in_progress', label: 'Đang triển khai', desc: 'Đang lập trình & hoàn thiện website' },
    { key: 'completed', label: 'Hoàn thành', desc: 'Bàn giao, nghiệm thu & nhận hoa hồng' }
  ];

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <ClipboardList size={22} /> Đơn hàng của tôi
          </h1>
          <p className="dash-page-subtitle">Theo dõi tất cả đơn hàng bạn đã báo và tiến độ dự án</p>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-filters">
          {['all', ...Object.keys(ORDER_STATUS)].map(status => (
            <button
              key={status}
              className={`dash-filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'Tất cả' : ORDER_STATUS[status]?.label}
              {status === 'all' && ` (${orders.length})`}
              {status !== 'all' && ` (${orders.filter(o => o.status === status).length})`}
            </button>
          ))}
        </div>

        <div className="dash-card">
          <div className="dash-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-page"><div className="loading-spinner"></div></div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <ClipboardList size={48} />
                <h3>Không có đơn hàng nào</h3>
                <p>Chưa có đơn hàng nào khớp với bộ lọc hiện tại</p>
              </div>
            ) : (
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Loại website</th>
                      <th>Mô tả</th>
                      <th>Ngày tạo</th>
                      <th>Yêu cầu</th>
                      <th>Trạng thái dự án</th>
                      <th style={{ textAlign: 'center' }}>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const isExpanded = !!expandedOrders[order._id];
                      const project = order.projectId;
                      const stepIdx = project ? getStatusIndex(project.status) : -1;

                      return (
                        <Fragment key={order._id}>
                          <tr>
                            <td><strong>{order.orderCode}</strong></td>
                            <td>{WEBSITE_TYPES[order.websiteType] || order.websiteType}</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {order.description}
                            </td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>
                              <span className={`dash-badge ${ORDER_STATUS[order.status]?.color}`}>
                                {ORDER_STATUS[order.status]?.label || order.status}
                              </span>
                            </td>
                            <td>
                              {project ? (
                                <span className={`dash-badge ${PROJECT_STATUS[project.status]?.color || 'blue'}`}>
                                  {PROJECT_STATUS[project.status]?.label || 'Đang tư vấn'}
                                </span>
                              ) : (
                                <span className="dash-badge gray" style={{ backgroundColor: '#e2e8f0', color: '#64748b' }}>
                                  {order.status === 'rejected' ? 'Đã từ chối' : 'Chờ khởi tạo'}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="dash-btn dash-btn-outline dash-btn-sm"
                                onClick={() => toggleExpand(order._id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  height: 'auto'
                                }}
                              >
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                {isExpanded ? 'Đóng' : 'Theo dõi'}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan="7" style={{ backgroundColor: 'var(--dt-light-surface-2)', padding: '20px' }}>
                                <div style={{
                                  padding: '20px',
                                  backgroundColor: '#fff',
                                  borderRadius: '12px',
                                  border: '1px solid var(--dt-light-border)',
                                  boxShadow: 'var(--shadow-sm)',
                                  animation: 'fadeIn 0.2s ease-out'
                                }}>
                                  {/* Header inside detail box */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--dt-light-border)',
                                    paddingBottom: '12px',
                                    marginBottom: '20px',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                  }}>
                                    <div>
                                      <span style={{ fontSize: '0.78rem', color: 'var(--dt-light-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Dự án liên kết:</span>
                                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--dt-primary)', marginLeft: '6px' }}>
                                        {project ? project.projectCode : 'Chưa có dự án'}
                                      </span>
                                    </div>
                                    {project && project.status !== 'cancelled' && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dt-light-text-secondary)' }}>Tiến độ kỹ thuật:</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--dt-primary)' }}>{project.progress}%</span>
                                        <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--dt-light-surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
                                          <div style={{ width: `${project.progress}%`, height: '100%', backgroundColor: 'var(--dt-primary)', borderRadius: '3px' }}></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Visual Stepper */}
                                  {project ? (
                                    project.status === 'cancelled' ? (
                                      <div>
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '10px',
                                          backgroundColor: 'var(--dt-light-surface-2)',
                                          border: '1px solid var(--dt-light-border)',
                                          padding: '12px 16px',
                                          borderRadius: '8px',
                                          color: 'var(--dt-light-text-secondary)',
                                          marginBottom: '20px',
                                          fontSize: '0.85rem'
                                        }}>
                                          <XCircle size={18} style={{ color: 'var(--dt-light-text-secondary)' }} />
                                          <div>
                                            <div style={{ fontWeight: 700 }}>Dự án này đã bị hủy bỏ</div>
                                            {project.cancelReason && <div style={{ fontSize: '0.8rem', marginTop: '2px', fontStyle: 'italic' }}>Lý do hủy: {project.cancelReason}</div>}
                                          </div>
                                        </div>

                                        {/* Greyed out Stepper */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', width: '100%', padding: '0 10px' }}>
                                          <div style={{ position: 'absolute', top: '16px', left: '40px', right: '40px', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
                                          {projectSteps.map((step, idx) => (
                                            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90px', zIndex: 1, position: 'relative' }}>
                                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>
                                                {idx + 1}
                                              </div>
                                              <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}>
                                                {step.label}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Stepper Grid Container */}
                                        <div style={{
                                          position: 'relative',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          padding: '0 20px',
                                          marginTop: '10px',
                                          overflowX: 'auto',
                                          gap: '20px'
                                        }}>
                                          {/* Base Connector Line */}
                                          <div style={{ position: 'absolute', top: '16px', left: '50px', right: '50px', height: '3px', backgroundColor: 'var(--dt-light-border)', zIndex: 0 }}></div>
                                          
                                          {/* Active Connector Line */}
                                          {stepIdx >= 0 && (
                                            <div style={{
                                              position: 'absolute',
                                              top: '16px',
                                              left: '50px',
                                              width: `calc(${(stepIdx / (projectSteps.length - 1)) * 100}% - 40px)`,
                                              height: '3px',
                                              backgroundColor: 'var(--dt-light-text-secondary)',
                                              transition: 'width 0.4s ease',
                                              zIndex: 0
                                            }}></div>
                                          )}

                                          {projectSteps.map((step, idx) => {
                                            const isCompleted = idx < stepIdx;
                                            const isActive = idx === stepIdx;

                                            return (
                                              <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px', flex: 1, zIndex: 1, position: 'relative' }}>
                                                <div style={{
                                                  width: '32px',
                                                  height: '32px',
                                                  borderRadius: '50%',
                                                  backgroundColor: isCompleted ? 'var(--dt-light-surface-3)' : isActive ? '#fff' : 'var(--dt-light-surface-2)',
                                                  border: isCompleted ? '2px solid var(--dt-light-text-secondary)' : isActive ? '2px solid var(--dt-light-text)' : '2px solid var(--dt-light-border)',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  color: isCompleted ? 'var(--dt-light-text-secondary)' : isActive ? 'var(--dt-light-text)' : 'var(--dt-light-text-muted)',
                                                  fontSize: '0.8rem',
                                                  fontWeight: 700,
                                                  boxShadow: isActive ? '0 0 10px rgba(0, 0, 0, 0.05)' : 'none',
                                                  transition: 'all 0.3s ease',
                                                }}>
                                                  {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                                                </div>
                                                <div style={{
                                                  marginTop: '8px',
                                                  fontSize: '0.78rem',
                                                  fontWeight: isActive ? 800 : 600,
                                                  color: isActive ? 'var(--dt-light-text)' : isCompleted ? 'var(--dt-light-text-secondary)' : 'var(--dt-light-text-muted)',
                                                  textAlign: 'center',
                                                  whiteSpace: 'nowrap'
                                                }}>
                                                  {step.label}
                                                </div>
                                                <div style={{
                                                  marginTop: '4px',
                                                  fontSize: '0.65rem',
                                                  color: 'var(--dt-light-text-muted)',
                                                  textAlign: 'center',
                                                  maxWidth: '120px',
                                                  lineHeight: 1.2
                                                }}>
                                                  {step.desc}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Project Detail Box */}
                                        <div style={{
                                          marginTop: '10px',
                                          padding: '16px',
                                          backgroundColor: 'var(--dt-light-surface-2)',
                                          borderRadius: '8px',
                                          border: '1px solid var(--dt-light-border)',
                                          fontSize: '0.85rem',
                                          lineHeight: 1.5
                                        }}>
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <User size={15} style={{ color: 'var(--dt-primary)' }} />
                                              <span><strong>Khách hàng:</strong> {project.customerName || 'Đang cập nhật'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <DollarSign size={15} style={{ color: 'var(--dt-primary)' }} />
                                              <span><strong>Giá trị HĐ:</strong> {project.contractValue > 0 ? formatCurrency(project.contractValue) : 'Đang thương thảo'}</span>
                                            </div>
                                            {project.zaloGroupLink && (
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MessageSquare size={15} style={{ color: 'var(--dt-primary)' }} />
                                                <span>
                                                  <strong>Nhóm Zalo dự án:</strong>{' '}
                                                  <a href={project.zaloGroupLink} target="_blank" rel="noreferrer" style={{ color: 'var(--dt-primary)', fontWeight: 700 }}>
                                                    Vào nhóm Zalo <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }} />
                                                  </a>
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {project.notes && project.notes.length > 0 && (
                                            <div style={{ marginTop: '12px', borderTop: '1px solid var(--dt-light-border)', paddingTop: '10px' }}>
                                              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--dt-light-text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FileText size={15} style={{ color: 'var(--dt-primary)' }} />
                                                <span>Nhật ký hoạt động mới nhất:</span>
                                              </div>
                                              <div style={{ fontStyle: 'italic', color: 'var(--dt-light-text-secondary)', fontSize: '0.8rem' }}>
                                                "{project.notes[project.notes.length - 1].content}"
                                                <span style={{ fontStyle: 'normal', color: 'var(--dt-light-text-muted)', fontSize: '0.75rem', marginLeft: '6px' }}>
                                                  ({new Date(project.notes[project.notes.length - 1].createdAt).toLocaleString('vi-VN')})
                                                </span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      backgroundColor: 'var(--dt-light-surface-2)',
                                      border: '1px solid var(--dt-light-border)',
                                      padding: '12px 16px',
                                      borderRadius: '8px',
                                      color: 'var(--dt-light-text-secondary)',
                                      fontSize: '0.85rem'
                                    }}>
                                      <HelpCircle size={18} />
                                      <div>
                                        {order.status === 'pending' ? (
                                          <span>Yêu cầu báo đơn của bạn đang được ban quản trị xem xét. Dự án sẽ được tạo ngay khi được duyệt.</span>
                                        ) : order.status === 'rejected' ? (
                                          <span>Yêu cầu báo đơn này đã bị từ chối duyệt. Vui lòng kiểm tra lại lý do hoặc tạo đơn mới.</span>
                                        ) : (
                                          <span>Đang tiến hành đồng bộ thông tin dự án...</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
