'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({ commissionRate: 7 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) setMessage('✅ Lưu cài đặt thành công!');
      else setMessage('⚠️ Có lỗi xảy ra');
    } catch (err) { setMessage('⚠️ Lỗi kết nối'); }
    finally { setSaving(false); }
  }

  if (session?.user?.role !== 'admin') {
    return <div className="dash-body"><div className="empty-state"><h3>Bạn không có quyền truy cập</h3></div></div>;
  }

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <Settings size={22} /> Cài đặt hệ thống
          </h1>
          <p className="dash-page-subtitle">Cấu hình chung cho hệ thống CTV</p>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-card" style={{ maxWidth: '600px' }}>
          <div className="dash-card-header"><h2 className="dash-card-title">Cài đặt hoa hồng</h2></div>
          <div className="dash-card-body">
            {loading ? (
              <div className="loading-page"><div className="loading-spinner"></div></div>
            ) : (
              <form onSubmit={handleSave}>
                {message && (
                  <div style={{ padding: 'var(--space-3) var(--space-4)', background: message.includes('✅') ? '#ecfdf5' : '#fef2f2', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.85rem' }}>
                    {message}
                  </div>
                )}
                <div className="dash-form-group">
                  <label className="dash-form-label">% Hoa hồng mặc định</label>
                  <input type="number" className="dash-form-input" value={settings.commissionRate} min={0} max={100} step={0.5}
                    onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })} id="setting-commission-rate" />
                  <span className="dash-form-helper">Áp dụng cho đơn hàng mới. Đơn hàng cũ không bị ảnh hưởng.</span>
                </div>
                <button type="submit" className="dash-btn dash-btn-primary" disabled={saving} style={{ marginTop: 'var(--space-4)' }} id="save-settings-btn">
                  {saving ? 'Đang lưu...' : <><Save size={16} /> Lưu cài đặt</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
