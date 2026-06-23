export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export const WEBSITE_TYPES = {
  doanh_nghiep: 'Website Doanh nghiệp',
  thuong_mai_dien_tu: 'Website Thương mại điện tử',
  nha_hang: 'Website Nhà hàng - Quán ăn',
  thoi_trang: 'Website Thời trang',
  dich_vu: 'Website Dịch vụ',
  landing_page: 'Landing Page bán hàng',
  giao_duc: 'Website Giáo dục',
  bat_dong_san: 'Website Bất động sản',
  khac: 'Loại khác',
};

export const ORDER_STATUS = {
  pending: { label: 'Chờ xử lý', color: 'yellow' },
  consulting: { label: 'Đang tư vấn', color: 'blue' },
  contracted: { label: 'Đã ký HĐ', color: 'purple' },
  in_progress: { label: 'Đang triển khai', color: 'orange' },
  completed: { label: 'Hoàn thành', color: 'green' },
  cancelled: { label: 'Đã hủy', color: 'red' },
};

export const COMMISSION_STATUS = {
  pending: { label: 'Chờ thanh toán', color: 'yellow' },
  paid: { label: 'Đã thanh toán', color: 'green' },
};
