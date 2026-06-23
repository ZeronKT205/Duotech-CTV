'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { User, Save, HelpCircle, Upload, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profile, setProfile] = useState({
    phone: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    qrCodeImage: '',
  });

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/users/profile');
      const data = await res.json();
      if (data.user) {
        setProfile({
          phone: data.user.phone || '',
          bankName: data.user.bankName || '',
          bankAccountNumber: data.user.bankAccountNumber || '',
          bankAccountName: data.user.bankAccountName || '',
          qrCodeImage: data.user.qrCodeImage || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file) {
    setUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setProfile((prev) => ({ ...prev, qrCodeImage: data.url }));
        setMessage({ type: 'success', text: 'Tải ảnh QR lên thành công!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi tải ảnh lên Cloudflare R2' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Lỗi kết nối khi tải ảnh' });
    } finally {
      setUploading(false);
    }
  }

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Cập nhật thành công!' });
        setShowSuccessModal(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <div className="dash-topbar"><div><h1 className="dash-page-title"><User size={22} /> Thông tin cá nhân</h1></div></div>
        <div className="dash-body"><div className="loading-page"><div className="loading-spinner"></div></div></div>
      </>
    );
  }

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <User size={22} /> Thông tin cá nhân
          </h1>
          <p className="dash-page-subtitle">Cập nhật thông tin liên hệ và ngân hàng nhận hoa hồng</p>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-card" style={{ maxWidth: '700px' }}>
          <div className="dash-card-body">
            {/* Google Info (readonly) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--dt-light-surface-2)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
              {session?.user?.image && (
                <img src={session.user.image} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} referrerPolicy="no-referrer" />
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{session?.user?.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)' }}>{session?.user?.email}</div>
              </div>
              <span className={`dash-badge ${session?.user?.role === 'admin' ? 'purple' : 'blue'}`} style={{ marginLeft: 'auto' }}>
                {session?.user?.role === 'admin' ? '👑 Admin' : '🤝 CTV'}
              </span>
            </div>

            {/* Restart Tour Button */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <button 
                type="button"
                className="dash-btn dash-btn-outline" 
                onClick={() => {
                  localStorage.removeItem('duotech_tour_completed');
                  window.dispatchEvent(new Event('duotech-restart-tour'));
                  window.location.href = '/dashboard';
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                id="restart-tour-btn"
              >
                <HelpCircle size={16} /> Xem lại hướng dẫn sử dụng hệ thống
              </button>
            </div>

            {message.text && (
              <div style={{ padding: 'var(--space-3) var(--space-4)', background: message.type === 'success' ? '#ecfdf5' : '#fef2f2', color: message.type === 'success' ? '#065f46' : '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.85rem', border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
                {message.type === 'success' ? '✅' : '⚠️'} {message.text}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="dash-form-group">
                <label className="dash-form-label">Số điện thoại</label>
                <input
                  type="tel"
                  className="dash-form-input"
                  placeholder="VD: 0912345678"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  id="profile-phone"
                />
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--space-4)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--dt-light-border)' }}>
                🏦 Thông tin ngân hàng (nhận hoa hồng)
              </h3>

              <div className="dash-form-group">
                <label className="dash-form-label">Tên ngân hàng</label>
                <input
                  type="text"
                  className="dash-form-input"
                  placeholder="VD: Vietcombank, MB Bank, ACB..."
                  value={profile.bankName}
                  onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                  id="profile-bank-name"
                />
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Số tài khoản</label>
                <input
                  type="text"
                  className="dash-form-input"
                  placeholder="Nhập số tài khoản ngân hàng"
                  value={profile.bankAccountNumber}
                  onChange={(e) => setProfile({ ...profile, bankAccountNumber: e.target.value })}
                  id="profile-bank-account"
                />
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label">Tên chủ tài khoản</label>
                <input
                  type="text"
                  className="dash-form-input"
                  placeholder="VD: NGUYEN VAN A"
                  value={profile.bankAccountName}
                  onChange={(e) => setProfile({ ...profile, bankAccountName: e.target.value })}
                  id="profile-bank-holder"
                />
              </div>

              <div className="dash-form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="dash-form-label">Mã QR Thanh toán / Nhận tiền</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {profile.qrCodeImage ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                      <div style={{ position: 'relative', width: '160px', height: '160px', border: '1px solid var(--dt-light-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <img src={profile.qrCodeImage} alt="QR Code" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, qrCodeImage: '' })}
                          style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: 'rgba(239, 68, 68, 0.95)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                          title="Xóa ảnh"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>Đã tải lên mã QR ngân hàng của bạn.</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--dt-green)', fontWeight: 500 }}>✓ Đang hoạt động</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--dt-primary)'; e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.02)'; }}
                      onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--dt-light-border)'; e.currentTarget.style.backgroundColor = 'var(--dt-light-surface-2)'; }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'var(--dt-light-border)';
                        e.currentTarget.style.backgroundColor = 'var(--dt-light-surface-2)';
                        const file = e.dataTransfer.files[0];
                        if (file) await handleFileUpload(file);
                      }}
                      style={{ width: '100%', border: '2px dashed var(--dt-light-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', backgroundColor: 'var(--dt-light-surface-2)', transition: 'all 0.2s', minHeight: '140px' }}
                      onClick={() => document.getElementById('qr-file-input').click()}
                    >
                      <Upload size={24} style={{ color: 'var(--dt-light-text-muted)', marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--dt-light-text)' }}>Nhấp hoặc kéo thả ảnh QR ngân hàng vào đây</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--dt-light-text-muted)' }}>Chấp nhận JPG, PNG, WEBP tối đa 5MB</span>
                      <input 
                        type="file" 
                        id="qr-file-input" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleFileUpload(file);
                        }} 
                      />
                    </div>
                  )}
                  {uploading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--dt-light-text-muted)', marginTop: '4px' }}>
                      <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                      <span>Đang tải lên Cloudflare R2...</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="dash-btn dash-btn-primary dash-btn-lg"
                disabled={saving}
                style={{ width: '100%', marginTop: 'var(--space-4)' }}
                id="save-profile-btn"
              >
                {saving ? (
                  <><div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> Đang lưu...</>
                ) : (
                  <><Save size={18} /> Lưu thông tin</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '400px', width: '100%', animation: 'fadeIn 0.2s ease-out', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            <div className="dash-card-body" style={{ textAlign: 'center', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                ✓
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--dt-light-text)' }}>Cập nhật thành công!</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dt-light-text-muted)', lineHeight: '1.5' }}>
                Thông tin cá nhân và tài khoản ngân hàng của bạn đã được cập nhật thành công trên hệ thống.
              </p>
              <button 
                type="button" 
                className="dash-btn dash-btn-primary" 
                onClick={() => setShowSuccessModal(false)}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
