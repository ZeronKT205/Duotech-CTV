'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HelpCircle, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

const steps = [
  {
    title: "👋 Chào mừng bạn đến với DuoTech!",
    content: "DuoTech thiết lập hệ thống giúp bạn dễ dàng báo cáo đơn hàng và nhận hoa hồng 7% tự động. Hãy dành 1 phút để xem qua hướng dẫn sử dụng nhé!",
    selector: null
  },
  {
    title: "📊 Bảng điều khiển",
    content: "Đây là thanh Menu quản lý. Tại đây bạn có thể chuyển đổi giữa các trang: Tổng quan, Báo đơn mới, Danh sách đơn hàng, Quản lý hoa hồng và Hồ sơ cá nhân của mình.",
    selector: ".dash-sidebar"
  },
  {
    title: "📈 Theo dõi hiệu suất",
    content: "Các chỉ số hiển thị thời gian thực về: Tổng số đơn hàng bạn đã báo, Số đơn đang xử lý, Số tiền hoa hồng đã nhận và Hoa hồng đang chờ duyệt.",
    selector: ".dash-stats-grid"
  },
  {
    title: "✍️ Báo đơn khách hàng",
    content: "Khi có khách hàng có nhu cầu làm website (bán hàng, doanh nghiệp, landing page, v.v.), hãy click vào đây để nhập thông tin khách hàng. Đội ngũ DuoTech sẽ tư vấn và chốt hợp đồng giúp bạn!",
    selector: "#topbar-new-order-btn"
  },
  {
    title: "📋 Đơn hàng gần đây",
    content: "Danh sách hiển thị các đơn hàng bạn đã báo. Bạn có thể theo dõi trực tiếp tiến độ dự án, giá trị hợp đồng và trạng thái thanh toán hoa hồng.",
    selector: ".dash-card"
  },
  {
    title: "💳 Thiết lập thanh toán",
    content: "Bước cực kỳ quan trọng! Đừng quên vào trang 'Thông tin cá nhân' để cập nhật số tài khoản ngân hàng và mã QR. Hoa hồng của bạn sẽ được chuyển khoản trực tiếp qua thông tin này.",
    selector: "#nav--dashboard-profile"
  },
  {
    title: "🎉 Sẵn sàng hoạt động!",
    content: "Hệ thống đã sẵn sàng. Chúc bạn giới thiệu được thật nhiều dự án thành công và kiếm được nhiều hoa hồng cùng DuoTech!",
    selector: null
  }
];

export default function OnboardingTour() {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [popoverStyle, setPopoverStyle] = useState({
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  });

  // Only start tour on the main dashboard page
  useEffect(() => {
    const isDashboard = pathname === '/dashboard';
    const isCompleted = localStorage.getItem('duotech_tour_completed');
    if (isDashboard && !isCompleted) {
      // Small delay to ensure page elements are fully loaded
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Listen for custom restart event
  useEffect(() => {
    const handleRestart = () => {
      setStepIndex(0);
      setIsActive(true);
    };
    window.addEventListener('duotech-restart-tour', handleRestart);
    return () => {
      window.removeEventListener('duotech-restart-tour', handleRestart);
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    if (!currentStep.selector) {
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const element = document.querySelector(currentStep.selector);
    if (!element) {
      // Fallback to center if element is not rendered
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    // Scroll to element gently
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const calculatePosition = () => {
      const rect = element.getBoundingClientRect();
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;

      if (viewWidth < 768) {
        setPopoverStyle({
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
        });
        return;
      }

      // Desktop placement logic (default below target, fallback above target)
      let top = rect.bottom + 16;
      let left = rect.left + (rect.width - 320) / 2;

      // Prevent overflow horizontally
      if (left < 20) left = 20;
      if (left + 320 > viewWidth - 20) left = viewWidth - 320 - 20;

      // Prevent overflow vertically (shift above target if needed)
      if (top + 220 > viewHeight && rect.top > 240) {
        top = rect.top - 220 - 16;
      }

      setPopoverStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transform: 'none',
      });
    };

    const timer = setTimeout(calculatePosition, 400);
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    element.classList.add('tour-highlight');

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
      element.classList.remove('tour-highlight');
    };
  }, [stepIndex, isActive]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      completeTour();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem('duotech_tour_completed', 'true');
  };

  if (!isActive) return null;

  const currentStep = steps[stepIndex];

  return (
    <>
      <div className="tour-overlay" onClick={completeTour} />
      <div className="tour-popover" style={popoverStyle}>
        <div className="tour-popover-header">
          <div className="tour-popover-title">
            {stepIndex === 0 || stepIndex === steps.length - 1 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: 'var(--dt-orange)' }} /> {currentStep.title}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={16} style={{ color: 'var(--dt-neon)' }} /> {currentStep.title}
              </span>
            )}
          </div>
          <button onClick={completeTour} aria-label="Close guide" style={{ color: 'var(--dt-light-text-muted)', display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <p className="tour-popover-content">
          {currentStep.content}
        </p>
        <div className="tour-popover-actions">
          <span className="tour-progress">
            Bước {stepIndex + 1} / {steps.length}
          </span>
          <div className="tour-btns">
            {stepIndex > 0 && (
              <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={handleBack} style={{ padding: '6px 12px' }}>
                <ChevronLeft size={14} /> Trước
              </button>
            )}
            <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={handleNext} style={{ padding: '6px 14px' }}>
              {stepIndex === steps.length - 1 ? "Hoàn thành" : "Tiếp theo"} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
