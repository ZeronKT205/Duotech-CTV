'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Send, ArrowLeft, CheckCircle2, ClipboardList, Award, Coins } from 'lucide-react';
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }} className="new-order-grid">
          
          {/* Cột trái: Form báo đơn */}
          <div className="dash-card" style={{ margin: 0 }}>
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

          {/* Cột phải: Sơ đồ quy trình bento */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}>
            {/* Header card quy trình */}
            <div style={{
              padding: 'var(--space-5)',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#fff',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid #000',
              boxShadow: 'var(--shadow-md)',
              marginBottom: 'var(--space-1)',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, letterSpacing: '0.05em', color: '#ffd200', textTransform: 'uppercase' }}>
                🚀 Quy trình Hợp tác & Nhận hoa hồng
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                Báo đơn dễ dàng, theo dõi tiến trình dự án minh bạch và nhận thanh toán tự động qua 4 bước:
              </p>
            </div>

            {/* Bước 1 */}
            <div className="bento-card" style={{ padding: 'var(--space-4)', display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#fff' }}>
              <div style={{
                background: '#eff6ff',
                color: '#0052cc',
                width: '38px', height: '38px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: '2px solid #000',
                boxShadow: '2px 2px 0px #000'
              }}>
                <Send size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--dt-light-text)' }}>
                  Bước 1: Báo thông tin khách hàng
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--dt-light-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Điền nhu cầu làm website của khách hàng và gửi yêu cầu tư vấn trực tiếp trên form này.
                </p>
              </div>
            </div>

            {/* Bước 2 */}
            <div className="bento-card" style={{ padding: 'var(--space-4)', display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#fff' }}>
              <div style={{
                background: '#fffbeb',
                color: '#b58900',
                width: '38px', height: '38px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: '2px solid #000',
                boxShadow: '2px 2px 0px #000'
              }}>
                <ClipboardList size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--dt-light-text)' }}>
                  Bước 2: DUOTECH liên hệ tư vấn
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--dt-light-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Admin liên hệ, kết nối Zalo Group với khách hàng, tư vấn giải pháp và báo giá chi tiết.
                </p>
              </div>
            </div>

            {/* Bước 3 */}
            <div className="bento-card" style={{ padding: 'var(--space-4)', display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#fff' }}>
              <div style={{
                background: '#f5f3ff',
                color: '#7c3aed',
                width: '38px', height: '38px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: '2px solid #000',
                boxShadow: '2px 2px 0px #000'
              }}>
                <Award size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--dt-light-text)' }}>
                  Bước 3: Ký hợp đồng & Nhận Đợt 1
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--dt-light-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Khách ký hợp đồng thành công, hệ thống tự động ghi nhận và duyệt chi **50% hoa hồng đợt 1** của bạn.
                </p>
              </div>
            </div>

            {/* Bước 4 */}
            <div className="bento-card" style={{ padding: 'var(--space-4)', display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#fff' }}>
              <div style={{
                background: '#ecfdf5',
                color: '#059669',
                width: '38px', height: '38px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: '2px solid #000',
                boxShadow: '2px 2px 0px #000'
              }}>
                <Coins size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--dt-light-text)' }}>
                  Bước 4: Hoàn thành & Nhận Đợt 2
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--dt-light-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Bàn giao nghiệm thu website hoàn thiện, hệ thống tự động duyệt chi tiếp **50% hoa hồng đợt 2** còn lại.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global style hack for grid responsiveness */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .new-order-grid {
              grid-template-columns: 1.15fr 0.85fr !important;
            }
          }
        `}} />
      </div>
    </>
  );
}
