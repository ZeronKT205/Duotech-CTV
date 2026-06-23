'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { WEBSITE_TYPES } from '@/lib/utils';

export default function NewOrderPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    websiteType: '',
    description: '',
    ctvPhone: '',
    note: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.websiteType || !form.description || !form.ctvPhone) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/orders');
      }, 2000);
    } catch (err) {
      setError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <div className="dash-topbar">
          <div>
            <h1 className="dash-page-title">
              <CheckCircle2 size={22} style={{ color: '#10b981' }} /> Báo đơn thành công!
            </h1>
          </div>
        </div>
        <div className="dash-body">
          <div className="dash-card">
            <div className="dash-card-body" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🎉</div>
              <h2 style={{ marginBottom: 'var(--space-4)' }}>Đơn hàng đã được gửi!</h2>
              <p style={{ color: 'var(--dt-light-text-secondary)', marginBottom: 'var(--space-6)' }}>
                Nhân viên DUOTECH sẽ liên hệ bạn sớm nhất qua số điện thoại đã cung cấp.
              </p>
              <Link href="/dashboard/orders" className="dash-btn dash-btn-primary">
                Xem đơn hàng <ArrowLeft size={16} />
              </Link>
            </div>
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
            <PlusCircle size={22} /> Báo đơn mới
          </h1>
          <p className="dash-page-subtitle">Nhập thông tin khách hàng muốn làm website</p>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-card" style={{ maxWidth: '700px' }}>
          <div className="dash-card-body">
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#fef2f2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="dash-form-group">
                <label className="dash-form-label">
                  Loại website <span className="dash-form-required">*</span>
                </label>
                <select
                  className="dash-form-select"
                  value={form.websiteType}
                  onChange={(e) => setForm({ ...form, websiteType: e.target.value })}
                  id="order-website-type"
                >
                  <option value="">— Chọn loại website —</option>
                  {Object.entries(WEBSITE_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">
                  Mô tả nhu cầu <span className="dash-form-required">*</span>
                </label>
                <textarea
                  className="dash-form-textarea"
                  placeholder="VD: Khách muốn làm web bất động sản, có tích hợp bản đồ, hiển thị dự án..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  id="order-description"
                />
                <span className="dash-form-helper">Mô tả ngắn gọn về nhu cầu của khách hàng</span>
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">
                  SĐT của bạn (CTV) <span className="dash-form-required">*</span>
                </label>
                <input
                  type="tel"
                  className="dash-form-input"
                  placeholder="VD: 0912345678"
                  value={form.ctvPhone}
                  onChange={(e) => setForm({ ...form, ctvPhone: e.target.value })}
                  id="order-ctv-phone"
                />
                <span className="dash-form-helper">Nhân viên DUOTECH sẽ liên hệ bạn qua SĐT này</span>
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Ghi chú thêm</label>
                <textarea
                  className="dash-form-textarea"
                  placeholder="Thông tin bổ sung (không bắt buộc)"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  style={{ minHeight: '70px' }}
                  id="order-note"
                />
              </div>

              <button
                type="submit"
                className="dash-btn dash-btn-primary dash-btn-lg"
                disabled={loading}
                style={{ width: '100%', marginTop: 'var(--space-4)' }}
                id="submit-order-btn"
              >
                {loading ? (
                  <><div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> Đang gửi...</>
                ) : (
                  <><Send size={18} /> Gửi đơn hàng</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
