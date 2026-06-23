'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const AnimatedCounter = ({ target, duration = 2000, suffix = '', prefix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const [ref, setRef] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(ref);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref);
    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref]);

  useEffect(() => {
    if (!visible) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(easeProgress * target);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [visible, target, duration]);

  return (
    <span ref={setRef}>
      {prefix}
      {count.toLocaleString('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

import { ChevronDown, ArrowRight, Globe, ShoppingCart, Utensils, Shirt, Briefcase, FileText, GraduationCap, Building2, ExternalLink, Phone, Mail, Shield, Check, Users, DollarSign, MessageCircle, Star, Zap, MapPin } from 'lucide-react';

const SERVICES = [
  { icon: <Building2 size={22} />, title: 'Website Doanh nghiệp', desc: 'Xây dựng hình ảnh chuyên nghiệp, tăng uy tín thương hiệu' },
  { icon: <ShoppingCart size={22} />, title: 'Website Thương mại điện tử', desc: 'Nền tảng bán hàng online, tích hợp thanh toán đa dạng' },
  { icon: <Utensils size={22} />, title: 'Website Nhà hàng - Quán ăn', desc: 'Menu online, đặt bàn, delivery. Tối ưu trải nghiệm khách hàng' },
  { icon: <Shirt size={22} />, title: 'Website Thời trang', desc: 'Lookbook, catalog sản phẩm, tích hợp mạng xã hội' },
  { icon: <Briefcase size={22} />, title: 'Website Dịch vụ', desc: 'Giới thiệu dịch vụ, booking online, SEO chuẩn chỉnh' },
  { icon: <FileText size={22} />, title: 'Landing Page bán hàng', desc: 'Tối ưu chuyển đổi, A/B testing, pixel tracking' },
  { icon: <GraduationCap size={22} />, title: 'Website Giáo dục', desc: 'LMS, khóa học online, quản lý học viên chuyên nghiệp' },
  { icon: <Globe size={22} />, title: 'Website lớn & Tùy chỉnh', desc: 'Dự án quy mô lớn, custom theo yêu cầu đặc biệt' },
];

const FAQS = [
  { q: 'Tôi cần kinh nghiệm gì để trở thành CTV?', a: 'Hoàn toàn KHÔNG cần kinh nghiệm. Bạn chỉ cần giới thiệu khách hàng có nhu cầu làm website. Toàn bộ quy trình từ tư vấn, báo giá, thiết kế, triển khai đến bảo hành đều do đội ngũ DUOTECH đảm nhận.' },
  { q: 'Hoa hồng được tính như thế nào?', a: 'Hoa hồng cố định 7% trên giá trị hợp đồng, chia làm 2 đợt: Đợt 1 (50%) khi ký hợp đồng, Đợt 2 (50%) khi hoàn thành dự án. Ví dụ: dự án 100 triệu → bạn nhận 7 triệu (3.5tr đợt 1 + 3.5tr đợt 2).' },
  { q: 'Làm thế nào để theo dõi tiến độ dự án?', a: 'Sau khi giới thiệu khách hàng, chúng tôi sẽ lập nhóm Zalo bao gồm bạn (CTV), nhân viên DUOTECH và khách hàng. Bạn có thể theo dõi trực tiếp tiến độ dự án trong nhóm Zalo này.' },
  { q: 'Khi nào tôi nhận được hoa hồng?', a: 'Đợt 1: Ngay sau khi khách hàng ký hợp đồng và thanh toán. Đợt 2: Sau khi dự án hoàn thành và bàn giao. Hoa hồng được chuyển khoản trực tiếp vào tài khoản ngân hàng bạn đăng ký.' },
  { q: 'Tôi có cần gặp mặt khách hàng không?', a: 'Không bắt buộc. Bạn chỉ cần kết nối khách hàng vào nhóm Zalo với đội ngũ DUOTECH. Chúng tôi sẽ tiếp nhận và tư vấn trực tiếp cho khách hàng.' },
  { q: 'DUOTECH có uy tín không?', a: 'DUOTECH là đơn vị thiết kế website uy tín có địa chỉ văn phòng tại Lô 5 B2.40 Khu Đô Thị FPT, Da Nang, Vietnam, 50000. Chúng tôi đã triển khai nhiều dự án lớn như theieltsdictionary.com và có website chính thức tại duotechgroup.vn.' },
];

const Logo = () => (
  <span className="landing-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="duotech-logo-svg" style={{ flexShrink: 0 }}>
      <path d="M25 15H42" stroke="#0052cc" strokeWidth="4" strokeLinecap="round" />
      <circle cx="44" cy="15" r="3" fill="white" stroke="#0052cc" strokeWidth="3" />
      <path d="M25 85H42" stroke="#0052cc" strokeWidth="4" strokeLinecap="round" />
      <circle cx="44" cy="85" r="3" fill="white" stroke="#0052cc" strokeWidth="3" />
      <path d="M25 20V80M25 20H60C76.5 20 90 33.5 90 50C90 66.5 76.5 80 60 80H25" stroke="#0052cc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 35V65M38 35H55C63.2 35 70 41.8 70 50C70 58.2 63.2 65 55 65H38" stroke="#0052cc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 30V48H25" stroke="#0052cc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="27" r="2.5" fill="white" stroke="#0052cc" strokeWidth="2.5" />
      <path d="M15 70V52H25" stroke="#0052cc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="73" r="2.5" fill="white" stroke="#0052cc" strokeWidth="2.5" />
      <path d="M10 50H25" stroke="#0052cc" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="7" cy="50" r="3" fill="white" stroke="#0052cc" strokeWidth="3" />
      <path d="M38 50H54" stroke="#0052cc" strokeWidth="3" strokeLinecap="round" />
      <circle cx="56" cy="50" r="2.5" fill="white" stroke="#0052cc" strokeWidth="2.5" />
    </svg>
    <span style={{ fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', fontSize: '1.25rem', color: '#0f172a' }}>DUO TECH</span>
    <span className="logo-dot" style={{ width: '6px', height: '6px', background: 'var(--dt-neon)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }}></span>
  </span>
);

export default function LandingPage() {
  const { data: session } = useSession();
  const [openFaq, setOpenFaq] = useState(null);
  const [calcValue, setCalcValue] = useState(100);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (

    <>
      {/* NAVBAR */}
      <nav className="landing-nav">
        <Link href="/">
          <Logo />
        </Link>
        <ul className="landing-nav-links">
          <li><a href="#quy-trinh">Quy trình</a></li>
          <li><a href="#hoa-hong">Hoa hồng</a></li>
          <li><a href="#dich-vu">Dịch vụ</a></li>
          <li><a href="#uy-tin">Uy tín</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        {session ? (
          <Link href="/dashboard" className="landing-nav-cta" id="nav-login-btn">
            Vào Dashboard <ArrowRight size={16} />
          </Link>
        ) : (
          <Link href="/login" className="landing-nav-cta" id="nav-login-btn">
            Đăng nhập <ArrowRight size={16} />
          </Link>
        )}
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge animate-fade-left">
              <span className="new-tag">New</span>
              Custom & Customize DUOTECH Platform
            </div>
            <h1 className="hero-title animate-fade-left delay-1" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', lineHeight: '1.3', letterSpacing: '0.02em', marginBottom: 'var(--space-6)' }}>
              <span className="outline-text" style={{ display: 'block', marginBottom: '12px' }}>KÊNH CTV</span>
              <span style={{ display: 'block', marginBottom: '12px', paddingLeft: 'clamp(20px, 8vw, 80px)' }}>CỦA RIÊNG</span>
              <span className="highlight-blue" style={{ display: 'block' }}>DUOTECH</span>
            </h1>
            <p className="hero-subtitle animate-fade-left delay-2">
              Giới thiệu khách hàng có nhu cầu thiết kế website — nhận ngay
              <strong style={{ color: 'var(--dt-neon)' }}> hoa hồng 7%</strong> trên mỗi dự án.
              Không cần kinh nghiệm, DUOTECH lo tất cả.
            </p>
            <div className="hero-actions animate-fade-up delay-3">
              {session ? (
                <Link href="/dashboard" className="btn-pill-primary" id="hero-cta-btn">
                  Vào Dashboard
                  <span className="btn-arrow"><ArrowRight size={14} /></span>
                </Link>
              ) : (
                <Link href="/login" className="btn-pill-primary" id="hero-cta-btn">
                  Bắt đầu ngay
                  <span className="btn-arrow"><ArrowRight size={14} /></span>
                </Link>
              )}
              <a href="#quy-trinh" className="btn-pill-secondary">
                Tìm hiểu thêm
              </a>
            </div>
            <div className="hero-audience animate-fade-up delay-4">
              <div className="hero-avatars">
                <img src="/api/uploads?key=uploads%2Favt-1782206546881-0.jpg" alt="CTV Avatar Top 1" className="hero-avatar" />
                <img src="/api/uploads?key=uploads%2Favt-1782206547632-1.jpg" alt="CTV Avatar Top 2" className="hero-avatar" />
                <img src="/api/uploads?key=uploads%2Favt-1782206548323-2.jpg" alt="CTV Avatar Top 3" className="hero-avatar" />
              </div>
              <div className="hero-audience-text">
                Dành riêng cho Trung tâm,<br />doanh nghiệp & các CTV công nghệ.
              </div>
            </div>
          </div>
          <div className="hero-mockup-wrapper animate-fade-up delay-2">
            <div className="hero-vip-image-container" style={{ zIndex: 2, position: 'relative', width: '100%', height: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="/vip-hero.png" 
                alt="DUOTECH VIP 3D Logo" 
                className="hero-vip-logo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="marquee-section">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex' }}>
              {['WEBSITE DOANH NGHIỆP', 'THƯƠNG MẠI ĐIỆN TỬ', 'NHÀ HÀNG & QUÁN ĂN', 'THỜI TRANG', 'DỊCH VỤ', 'LANDING PAGE', 'GIÁO DỤC', 'BẤT ĐỘNG SẢN', 'TÙYCHỈNH'].map((text, j) => (
                <span className="marquee-item" key={j}>
                  <span className="dot"></span> {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* QUY TRÌNH */}
      <section className="section reveal-on-scroll" id="quy-trinh">

        <p className="section-label animate-fade-up">Quy trình làm việc</p>
        <h2 className="section-title animate-fade-up delay-1">
          Chỉ <span style={{ color: 'var(--dt-neon)' }}>4 bước</span> để nhận hoa hồng
        </h2>
        <p className="section-subtitle animate-fade-up delay-2">
          Quy trình đơn giản, minh bạch. Bạn chỉ cần giới thiệu — DUOTECH lo tất cả phần còn lại.
        </p>

        <div className="bento-grid">
          <div className="bento-card neon animate-fade-up delay-2">
            <p className="bento-card-label">01 / Tìm kiếm</p>
            <h3 className="bento-card-title">Tìm khách hàng.</h3>
            <p className="bento-card-desc">
              Giới thiệu người có nhu cầu thiết kế website đến DUOTECH. Không giới hạn số lượng.
            </p>
            <div className="bento-tags">
              <span className="bento-tag">Bạn bè</span>
              <span className="bento-tag">Mạng xã hội</span>
              <span className="bento-tag">Doanh nghiệp</span>
            </div>
          </div>

          <div className="bento-card yellow animate-fade-up delay-3">
            <p className="bento-card-label">02 / Báo đơn</p>
            <h3 className="bento-card-title">Nhập thông tin.</h3>
            <p className="bento-card-desc">
              Đăng nhập hệ thống, nhập mô tả ngắn gọn về nhu cầu khách hàng và SĐT liên hệ của bạn.
            </p>
          </div>

          <div className="bento-card grey animate-fade-up delay-4">
            <p className="bento-card-label">03 / Kết nối</p>
            <h3 className="bento-card-title">Lập nhóm Zalo.</h3>
            <p className="bento-card-desc">
              DUOTECH liên hệ bạn, cùng tạo nhóm Zalo &quot;DUOTECH - Tên website&quot; gồm CTV + nhân viên + khách hàng.
            </p>
          </div>

          <div className="bento-card dark wide animate-fade-up delay-3">
            <p className="bento-card-label">04 / Nhận thưởng</p>
            <h3 className="bento-card-title" style={{ fontSize: '2.2rem' }}>
              Nhận hoa hồng <span style={{ color: 'var(--dt-orange)' }}>7%</span>
            </h3>
            <p className="bento-card-desc" style={{ maxWidth: '500px' }}>
              Khi ký hợp đồng → nhận đợt 1 (50%). Khi hoàn thành dự án → nhận đợt 2 (50%).
              Theo dõi tiến độ trực tiếp trong nhóm Zalo. Trách nhiệm của bạn chỉ là giới thiệu — DUOTECH lo toàn bộ từ tư vấn, báo giá, triển khai đến bảo hành.
            </p>
          </div>

          <div className="bento-card dark animate-fade-up delay-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <p className="bento-card-label">Độ chính xác</p>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '4rem', color: 'var(--dt-orange)', lineHeight: 1 }}>
              <AnimatedCounter target={99} />
            </div>
            <div style={{ width: '80%', height: '4px', background: 'var(--dt-dark-border)', borderRadius: '2px', marginTop: 'var(--space-4)', overflow: 'hidden' }}>
              <div style={{ width: '99%', height: '100%', background: 'var(--dt-orange)', borderRadius: '2px' }}></div>
            </div>
            <p className="bento-card-desc" style={{ marginTop: 'var(--space-3)' }}>% Thanh toán đúng hạn</p>
          </div>

        </div>
      </section>

      {/* HOA HỒNG */}
      <section className="commission-section reveal-on-scroll" id="hoa-hong">
        <div className="section" style={{ paddingTop: 'var(--space-24)', paddingBottom: 'var(--space-24)' }}>
          <p className="section-label animate-fade-up">Hoa hồng chi tiết</p>
          <h2 className="section-title animate-fade-up delay-1">
            Minh bạch trong <span style={{ color: 'var(--dt-neon)' }}>từng đồng</span>
          </h2>
          <p className="section-subtitle animate-fade-up delay-2">
            Kéo thanh trượt hoặc nhập số tiền để tính hoa hồng bạn sẽ nhận được
          </p>

          {/* Interactive Calculator Slider */}
          <div className="calc-container animate-fade-up delay-2" style={{ maxWidth: '600px', margin: '0 auto var(--space-8)', padding: 'var(--space-6)', background: 'white', border: '2px solid var(--dt-dark-border)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--dt-dark-text-secondary)', fontWeight: 600 }}>Giá trị hợp đồng dự kiến:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={calcValue}
                  onChange={(e) => setCalcValue(Math.max(10, Math.min(1000, Number(e.target.value))))}
                  style={{ width: '80px', background: 'var(--dt-dark-bg)', color: 'var(--dt-neon)', border: '2px solid var(--dt-dark-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontWeight: 800, textAlign: 'center', fontSize: '1.1rem' }}
                />
                <span style={{ fontSize: '1.1rem', color: 'var(--dt-neon)', fontWeight: 800 }}>triệu VNĐ</span>
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={calcValue > 500 ? 500 : calcValue}
              onChange={(e) => setCalcValue(Number(e.target.value))}
              style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--dt-dark-border)', outline: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
              className="commission-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--dt-dark-text-muted)', marginTop: 'var(--space-2)' }}>
              <span>10 triệu</span>
              <span>250 triệu</span>
              <span>500+ triệu</span>
            </div>
          </div>

          <div className="commission-visual animate-fade-up delay-3">
            <div className="commission-box">
              <p className="commission-box-label">Giá trị hợp đồng</p>
              <p className="commission-box-value" style={{ color: 'var(--dt-dark-text)' }}>{calcValue}tr</p>
              <p className="commission-box-note">{(calcValue * 1000000).toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="commission-arrow">→</div>
            <div className="commission-box">
              <p className="commission-box-label">Hoa hồng 7%</p>
              <p className="commission-box-value">{(calcValue * 0.07).toFixed(2).replace(/\.00$/, '').replace(/0$/, '').replace(/\.$/, '')}tr</p>
              <p className="commission-box-note">{(calcValue * 1000000 * 0.07).toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="commission-arrow">→</div>
            <div className="commission-box">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <p className="commission-box-label">Đợt 1 (50%)</p>
                  <p className="commission-box-value" style={{ fontSize: '1.5rem', color: 'var(--dt-neon)' }}>{(calcValue * 0.07 / 2).toFixed(3).replace(/\.000$/, '').replace(/0+$/, '').replace(/\.$/, '')}tr</p>
                  <p className="commission-box-note">Ký hợp đồng</p>
                </div>
                <div>
                  <p className="commission-box-label">Đợt 2 (50%)</p>
                  <p className="commission-box-value" style={{ fontSize: '1.5rem', color: 'var(--dt-neon)' }}>{(calcValue * 0.07 / 2).toFixed(3).replace(/\.000$/, '').replace(/0+$/, '').replace(/\.$/, '')}tr</p>
                  <p className="commission-box-note">Hoàn thành DA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="commission-note animate-fade-up delay-4">
            <strong>💡 Lưu ý:</strong> CTV chỉ cần giới thiệu khách hàng. Toàn bộ quy trình từ <strong>tư vấn</strong>, <strong>lên yêu cầu</strong>, <strong>báo giá</strong>, <strong>triển khai</strong> đến <strong>bảo hành</strong> — tất cả đều do DUOTECH đảm nhận 100%.
          </div>
        </div>
      </section>

      {/* DỊCH VỤ */}
      <section className="section reveal-on-scroll" id="dich-vu">
        <p className="section-label animate-fade-up">Dịch vụ</p>
        <h2 className="section-title animate-fade-up delay-1">
          Các loại website <span style={{ color: 'var(--dt-neon)' }}>bạn có thể giới thiệu</span>
        </h2>
        <p className="section-subtitle animate-fade-up delay-2">
          DUOTECH cung cấp giải pháp thiết kế website hiện đại, chuẩn SEO cho mọi ngành nghề
        </p>

        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <div className="service-card animate-fade-up" key={i} style={{ animationDelay: `${0.1 * i}s` }}>
              <div className="service-rope-left" />
              <div className="service-rope-right" />
              <div className="service-icon">
                {s.icon}
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* UY TÍN */}
      <section className="section reveal-on-scroll" id="uy-tin">
        <p className="section-label animate-fade-up">Uy tín & Dự án</p>
        <h2 className="section-title animate-fade-up delay-1">
          Tại sao chọn <span style={{ color: 'var(--dt-neon)' }}>DUOTECH</span>?
        </h2>
        <p className="section-subtitle animate-fade-up delay-2">
          Công ty chính thức, dự án thực tế, đội ngũ chuyên nghiệp
        </p>

        <div className="credibility-grid">
          <div className="credibility-card animate-fade-up delay-2">
            <h3>🏢 Thông tin Doanh nghiệp</h3>
            <div className="credibility-item">
              <MapPin size={18} /> <span>Địa chỉ: <strong>Lô 5 B2.40 Khu Đô Thị FPT, Da Nang, Vietnam, 50000</strong></span>
            </div>
            <div className="credibility-item">
              <Globe size={18} /> <span>Website: <a href="https://www.duotechgroup.vn/" target="_blank" rel="noopener noreferrer">duotechgroup.vn <ExternalLink size={12} /></a></span>
            </div>
            <div className="credibility-item">
              <Phone size={18} /> <span>Hotline: <strong>0366 843 236</strong></span>
            </div>
            <div className="credibility-item">
              <MessageCircle size={18} /> <span>Zalo: <strong>0335 111 783</strong></span>
            </div>
            <div className="credibility-item">
              <Mail size={18} /> <span>Email: <a href="mailto:duotechcompany.hr@gmail.com">duotechcompany.hr@gmail.com</a></span>
            </div>
          </div>

          <div className="credibility-card animate-fade-up delay-3">
            <h3>🚀 Dự án nổi bật</h3>
            <div className="credibility-item">
              <Star size={18} /> <span>
                <a href="https://theieltsdictionary.com" target="_blank" rel="noopener noreferrer">
                  theieltsdictionary.com <ExternalLink size={12} />
                </a>
              </span>
            </div>
            <div className="credibility-item">
              <Check size={18} /> <span>Nền tảng học IELTS quy mô lớn</span>
            </div>
            <div className="credibility-item">
              <Check size={18} /> <span>Thiết kế website hiện đại, chuẩn SEO</span>
            </div>
            <div className="credibility-item">
              <Check size={18} /> <span>Tối ưu chuyển đổi & trải nghiệm người dùng</span>
            </div>
            <div className="credibility-item">
              <Users size={18} /> <span>Đội ngũ phát triển chuyên nghiệp</span>
            </div>
            <div className="credibility-item">
              <Zap size={18} /> <span>Bảo hành & hỗ trợ kỹ thuật lâu dài</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section reveal-on-scroll" id="faq">
        <p className="section-label animate-fade-up">Câu hỏi thường gặp</p>
        <h2 className="section-title animate-fade-up delay-1">FAQ</h2>
        <p className="section-subtitle animate-fade-up delay-2">
          Giải đáp mọi thắc mắc về chương trình Cộng Tác Viên DUOTECH
        </p>

        <div className="faq-container">
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div
                className={`faq-item animate-fade-up ${openFaq === i ? 'open' : ''}`}
                key={i}
                style={{ animationDelay: `${0.08 * i}s` }}
              >
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  id={`faq-toggle-${i}`}
                >
                  {faq.q}
                  <ChevronDown size={18} />
                </button>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="faq-mockup animate-fade-up delay-3">
            <div className="faq-vip-image-container">
              <img 
                src="/vip-hero.png" 
                alt="DUOTECH VIP 3D Logo" 
                className="faq-vip-logo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ZALO GROUP */}
      <section className="zalo-section reveal-on-scroll">
        <div className="zalo-card animate-scale-in">
          <h2>💬 Tham gia nhóm Zalo CTV</h2>
          <p>
            Trao đổi, chia sẻ kinh nghiệm và nhận hỗ trợ trực tiếp từ đội ngũ DUOTECH
          </p>
          <a
            href="https://zalo.me/g/hwqvrwour2avyrcnnfqv"
            target="_blank"
            rel="noopener noreferrer"
            className="zalo-btn"
            id="zalo-group-btn"
          >
            Tham gia nhóm ngay <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Logo />
            <p>
              Thiết kế & phát triển Website chuẩn chỉnh.
              Giải pháp thiết kế website hiện đại, chuẩn SEO và tối ưu chuyển đổi.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--dt-dark-text-muted)' }}>
              Địa chỉ: Lô 5 B2.40 Khu Đô Thị FPT, Da Nang, Vietnam, 50000
            </p>
          </div>
          <div className="footer-col">
            <h4>Dịch vụ</h4>
            <a href="#dich-vu">Website Doanh nghiệp</a>
            <a href="#dich-vu">Thương mại điện tử</a>
            <a href="#dich-vu">Landing Page</a>
            <a href="#dich-vu">Website Giáo dục</a>
          </div>
          <div className="footer-col">
            <h4>CTV</h4>
            <a href="#quy-trinh">Quy trình</a>
            <a href="#hoa-hong">Hoa hồng</a>
            <a href="#faq">FAQ</a>
            {session ? (
              <Link href="/dashboard">Vào Dashboard</Link>
            ) : (
              <Link href="/login">Đăng nhập</Link>
            )}
          </div>
          <div className="footer-col">
            <h4>Liên hệ</h4>
            <a href="tel:0366843236" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={14} style={{ color: 'var(--dt-neon)' }} /> 0366 843 236
            </a>
            <a href="https://zalo.me/0335111783" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={14} style={{ color: 'var(--dt-neon)' }} /> Zalo: 0335 111 783
            </a>
            <a href="mailto:duotechcompany.hr@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} style={{ color: 'var(--dt-neon)' }} /> Email: duotechcompany.hr@gmail.com
            </a>
            <a href="https://www.duotechgroup.vn/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={14} style={{ color: 'var(--dt-neon)' }} /> duotechgroup.vn
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 DUO TECH COMPANY. All rights reserved.</span>
          <span>Thiết kế bởi DUOTECH</span>
        </div>
      </footer>
    </>
  );
}
