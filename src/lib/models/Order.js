import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderCode: {
    type: String,
    unique: true,
    required: true,
  },
  ctvId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ctvEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  ctvPhone: {
    type: String,
    required: true,
    trim: true,
  },
  websiteType: {
    type: String,
    required: true,
    enum: [
      'doanh_nghiep',
      'thuong_mai_dien_tu',
      'nha_hang',
      'thoi_trang',
      'dich_vu',
      'landing_page',
      'giao_duc',
      'bat_dong_san',
      'khac',
    ],
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  note: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  // Link to project if approved
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  // Rejection reason
  rejectionReason: {
    type: String,
    default: '',
    trim: true,
  },
  adminNote: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Auto-generate order code
OrderSchema.pre('validate', async function() {
  if (this.isNew && !this.orderCode) {
    const count = await this.constructor.countDocuments();
    this.orderCode = `DT-${String(count + 1).padStart(4, '0')}`;
  }
});

OrderSchema.index({ ctvId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderCode: 1 });

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
