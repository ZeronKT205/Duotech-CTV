'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ClipboardList, DollarSign, TrendingUp, PlusCircle, ArrowRight, Clock, BarChart3 } from 'lucide-react';
import { formatCurrency, formatDate, ORDER_STATUS, WEBSITE_TYPES } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/orders?limit=5'),
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      setStats(statsData);
      setRecentOrders(ordersData.orders || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = session?.user?.role === 'admin';

  if (loading) {
    return (
      <>
        <div className="dash-topbar">
          <div>
            <h1 className="dash-page-title">Tổng quan</h1>
            <p className="dash-page-subtitle">Xin chào, {session?.user?.name}!</p>
          </div>
        </div>
        <div className="dash-body">
          <div className="loading-page">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            {isAdmin ? (
              <>
                <BarChart3 size={22} /> Quản lý hệ thống
              </>
            ) : (
              <>
                <LayoutDashboard size={22} /> Tổng quan
              </>
            )}
          </h1>
          <p className="dash-page-subtitle">Xin chào, {session?.user?.name}!</p>
        </div>
        <Link href="/dashboard/new-order" className="dash-btn dash-btn-primary" id="topbar-new-order-btn">
          <PlusCircle size={16} /> Báo đơn mới
        </Link>
      </div>

      <div className="dash-body">
        {/* Stats */}
        <div className="dash-stats-grid">
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-icon blue"><ClipboardList size={20} /></div>
            </div>
            <div className="dash-stat-value">{stats?.totalOrders || 0}</div>
            <div className="dash-stat-label">Tổng đơn hàng</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-icon orange"><Clock size={20} /></div>
            </div>
            <div className="dash-stat-value">{stats?.pendingOrders || 0}</div>
            <div className="dash-stat-label">Đang xử lý</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-icon green"><DollarSign size={20} /></div>
            </div>
            <div className="dash-stat-value">{formatCurrency(stats?.paidCommission || 0)}</div>
            <div className="dash-stat-label">Hoa hồng đã nhận</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-icon purple"><TrendingUp size={20} /></div>
            </div>
            <div className="dash-stat-value">{formatCurrency(stats?.pendingCommission || 0)}</div>
            <div className="dash-stat-label">Hoa hồng chờ</div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              <ClipboardList size={18} /> Đơn hàng gần đây
            </h2>
            <Link href="/dashboard/orders" className="dash-btn dash-btn-outline dash-btn-sm">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="dash-card-body" style={{ padding: 0 }}>
            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <ClipboardList size={48} />
                <h3>Chưa có đơn hàng nào</h3>
                <p>Hãy bắt đầu bằng cách giới thiệu khách hàng đầu tiên!</p>
                <Link href="/dashboard/new-order" className="dash-btn dash-btn-primary">
                  <PlusCircle size={16} /> Báo đơn ngay
                </Link>
              </div>
            ) : (
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Loại website</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Giá trị HĐ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order._id}>
                        <td><strong>{order.orderCode}</strong></td>
                        <td>{WEBSITE_TYPES[order.websiteType] || order.websiteType}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <span className={`dash-badge ${ORDER_STATUS[order.status]?.color || 'yellow'}`}>
                            {ORDER_STATUS[order.status]?.label || order.status}
                          </span>
                        </td>
                        <td>{order.contractValue > 0 ? formatCurrency(order.contractValue) : '—'}</td>
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
