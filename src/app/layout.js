import './globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: {
    default: 'DUOTECH CTV - Chương Trình Cộng Tác Viên Thiết Kế Website Hoa Hồng 7%',
    template: '%s | DUOTECH CTV - Kiếm Tiền Online'
  },
  metadataBase: new URL('https://ctv.duotechgroup.vn'),
  description: 'Trở thành Cộng tác viên (CTV) thiết kế Website cùng DUOTECH. Nhận ngay 7% hoa hồng trên mỗi hợp đồng giới thiệu thành công. Quy trình rõ ràng, minh bạch, DUOTECH đảm nhận toàn bộ khâu tư vấn, triển khai và bảo hành.',
  keywords: [
    'thiết kế website',
    'cộng tác viên thiết kế web',
    'kiếm tiền online',
    'affiliate marketing',
    'công ty thiết kế web uy tín',
    'DUOTECH CTV',
    'hoa hồng giới thiệu web',
    'làm web đà nẵng',
    'thiết kế web fpt city'
  ],
  authors: [{ name: 'DUOTECH', url: 'https://duotechgroup.vn' }],
  creator: 'DUOTECH',
  publisher: 'DUOTECH',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://ctv.duotechgroup.vn',
    title: 'Chương Trình Cộng Tác Viên DUOTECH | Nhận Hoa Hồng 7% Giới Thiệu Website',
    description: 'Trở thành Cộng tác viên thiết kế website cùng DUOTECH. Nhận ngay 7% hoa hồng, nhận tiền qua Zalo/Ngân hàng nhanh chóng. DUOTECH lo từ A đến Z.',
    siteName: 'DUOTECH CTV',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'DUOTECH Logo',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chương Trình Cộng Tác Viên DUOTECH | Hoa Hồng 7%',
    description: 'Giới thiệu khách hàng làm website, nhận hoa hồng 7%. Quy trình nhanh chóng, hỗ trợ tận tình từ DUOTECH.',
    images: ['/icon.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' }
    ]
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
