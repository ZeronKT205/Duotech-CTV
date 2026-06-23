'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Bell, ShoppingBag, FolderKanban, UserPlus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function LiveActivityTicker() {
  const [activity, setActivity] = useState(null);
  const [visible, setVisible] = useState(false);

  // Pool of Vietnamese name components to generate organic names
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Lương', 'Trịnh'];
  const middleNames = ['Minh', 'Thị', 'Văn', 'Quốc', 'Hoài', 'Thanh', 'Hữu', 'Ngọc', 'Đức', 'Xuân', 'Kim', 'Bảo', 'Anh', 'Tú', 'Gia', 'Nhật', 'Khánh'];
  const lastNames = ['Triết', 'Chi', 'Nam', 'Dung', 'Anh', 'Huy', 'Hằng', 'Lâm', 'Phương', 'Dũng', 'Tài', 'Hải', 'Sơn', 'Tùng', 'Trang', 'Vy', 'Linh', 'Khánh', 'Phong', 'Quang', 'Hùng', 'Cường', 'Tuấn', 'Duy', 'Hòa'];

  const websiteTypes = [
    'Website Doanh Nghiệp',
    'Landing Page Bán Hàng',
    'Website Thương mại điện tử',
    'Website Nhà hàng - Quán ăn',
    'Website Thời trang',
    'Website Học trực tuyến (LMS)',
    'Website Bất Động Sản',
    'Website Giới Thiệu Dịch Vụ'
  ];

  const projectCodes = ['DUO_9821', 'DUO_4829', 'DUO_1029', 'DUO_7734', 'DUO_5928', 'DUO_3049', 'DUO_6820', 'DUO_8471', 'DUO_1294', 'DUO_4058'];

  const getRandomName = () => {
    const f = firstNames[Math.floor(Math.random() * firstNames.length)];
    const m = middleNames[Math.floor(Math.random() * middleNames.length)];
    const l = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${f} ${m} ${l}`;
  };

  const generateRandomActivity = () => {
    const name = getRandomName();
    const eventTypes = ['signup', 'order', 'project', 'commission', 'payout'];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    let action = '';
    let amount = null;
    
    if (type === 'signup') {
      action = 'vừa đăng ký tham gia chương trình CTV mới';
    } else if (type === 'order') {
      const web = websiteTypes[Math.floor(Math.random() * websiteTypes.length)];
      action = `vừa gửi yêu cầu báo đơn: ${web}`;
    } else if (type === 'project') {
      const code = projectCodes[Math.floor(Math.random() * projectCodes.length)];
      action = `vừa bàn giao hoàn tất dự án ${code} cho khách hàng`;
    } else if (type === 'commission') {
      const code = projectCodes[Math.floor(Math.random() * projectCodes.length)];
      const phase = Math.random() > 0.5 ? 'đợt 1' : 'đợt 2';
      // Random commission between 800k and 6M VND (stepped by 100k) multiplied by 4
      amount = (Math.floor(Math.random() * (6000000 - 800000 + 1) / 100000) * 100000 + 800000) * 4;
      action = `vừa nhận hoa hồng ${phase} từ dự án ${code}`;
    } else if (type === 'payout') {
      // Random payout between 1.5M and 12M VND (stepped by 50k) multiplied by 4
      amount = (Math.floor(Math.random() * (12000000 - 1500000 + 1) / 50000) * 50000 + 1500000) * 4;
      action = 'vừa rút tiền hoa hồng tích lũy về tài khoản ngân hàng';
    }

    return { name, action, amount, type };
  };

  useEffect(() => {
    // Show initial notification after 4 seconds
    const initialTimer = setTimeout(() => {
      triggerActivity();
    }, 4000);

    // Periodic loop: Trigger a new activity notification exactly every 40 seconds
    const intervalTimer = setInterval(() => {
      triggerActivity();
    }, 40000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  const triggerActivity = () => {
    const selected = generateRandomActivity();
    setActivity(selected);
    setVisible(true);

    // Automatically hide after 7 seconds
    setTimeout(() => {
      setVisible(false);
    }, 7000);
  };

  if (!activity) return null;

  const icons = {
    payout: <DollarSign size={16} style={{ color: '#16a34a' }} />,
    commission: <DollarSign size={16} style={{ color: '#2563eb' }} />,
    order: <ShoppingBag size={16} style={{ color: '#ea580c' }} />,
    project: <FolderKanban size={16} style={{ color: '#7c3aed' }} />,
    signup: <UserPlus size={16} style={{ color: '#4b5563' }} />
  };

  const badgeBg = {
    payout: 'rgba(22, 163, 74, 0.1)',
    commission: 'rgba(37, 99, 235, 0.1)',
    order: 'rgba(234, 88, 12, 0.1)',
    project: 'rgba(124, 58, 237, 0.1)',
    signup: 'rgba(75, 85, 99, 0.1)'
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '14px 18px',
        zIndex: 9999,
        border: '1px solid var(--dt-light-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
        transform: visible ? 'translateY(0)' : 'translateY(100px)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        maxWidth: '360px'
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          backgroundColor: badgeBg[activity.type] || 'rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {icons[activity.type] || <Bell size={16} />}
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Hệ thống hoạt động
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--dt-light-text-primary)', lineHeight: '1.4' }}>
          <strong>{activity.name}</strong> {activity.action}
          {activity.amount && (
            <span style={{ color: '#16a34a', fontWeight: 800, marginLeft: '4px' }}>
              ({formatCurrency(activity.amount)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
