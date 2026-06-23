'use client';

import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, COMMISSION_STATUS } from '@/lib/utils';

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCommissions(); }, []);

  async function fetchCommissions() {
    try {
      const res = await fetch('/api/commissions');
      const data = await res.json();
      setCommissions(data.commissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <DollarSign size={22} /> Lịch sử hoa hồng
          </h1>
          <p className="dash-page-subtitle">Chi tiết từng đợt thanh toán hoa hồng</p>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-icon green"><DollarSign size={20} /></div>
            </div>
            <div className="dash-stat-value">{formatCurrency(totalPaid)}</div>
            <div className="dash-stat-label">Đã thanh toán</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-icon orange"><DollarSign size={20} /></div>
            </div>
            <div className="dash-stat-value">{formatCurrency(totalPending)}</div>
            <div className="dash-stat-label">Chờ thanh toán</div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Chi tiết hoa hồng</h2>
          </div>
          <div className="dash-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-page"><div className="loading-spinner"></div></div>
            ) : commissions.length === 0 ? (
              <div className="empty-state">
                <DollarSign size={48} />
                <h3>Chưa có hoa hồng nào</h3>
                <p>Hoa hồng sẽ được tạo khi đơn hàng của bạn được duyệt</p>
              </div>
            ) : (
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Đợt</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày thanh toán</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(c => (
                      <tr key={c._id}>
                        <td><strong>{c.orderCode}</strong></td>
                        <td>Đợt {c.phase}</td>
                        <td style={{ color: 'var(--dt-green)', fontWeight: 600 }}>{formatCurrency(c.amount)}</td>
                        <td>
                          <span className={`dash-badge ${COMMISSION_STATUS[c.status]?.color}`}>
                            {COMMISSION_STATUS[c.status]?.label}
                          </span>
                        </td>
                        <td>{c.paidAt ? formatDate(c.paidAt) : '—'}</td>
                        <td>{c.note || '—'}</td>
                      </tr>
                    ))}
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
