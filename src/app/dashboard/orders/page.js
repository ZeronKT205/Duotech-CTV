'use client';

import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { formatDate, ORDER_STATUS, WEBSITE_TYPES } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
          <p className="dash-page-subtitle">Theo dõi tất cả đơn hàng bạn đã báo</p>
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
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order._id}>
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
