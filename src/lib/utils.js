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
  pending: { label: 'Cần xử lý', color: 'yellow' },
  approved: { label: 'Tạo dự án thành công', color: 'green' },
  rejected: { label: 'Tạo dự án thất bại', color: 'red' },
};

export const PROJECT_STATUS = {
  consulting: { label: 'Đang tư vấn', color: 'blue', progress: 20 },
  contracted: { label: 'Đã ký HĐ', color: 'purple', progress: 40 },
  in_progress: { label: 'Đang triển khai', color: 'orange', progress: 70 },
  completed: { label: 'Hoàn thành', color: 'green', progress: 100 },
  cancelled: { label: 'Đã hủy', color: 'red', progress: 0 },
};

export const COMMISSION_STATUS = {
  pending: { label: 'Chờ thanh toán', color: 'yellow' },
  paid: { label: 'Đã thanh toán', color: 'green' },
  cancelled: { label: 'Đã hủy', color: 'red' },
};
