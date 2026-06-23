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
    enum: ['pending', 'consulting', 'contracted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  contractValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  commissionRate: {
    type: Number,
    default: 7,
  },
  commissionTotal: {
    type: Number,
    default: 0,
  },
  adminNote: {
    type: String,
    default: '',
  },
  zaloGroupName: {
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

OrderSchema.pre('save', async function() {
  // Auto-calculate commission
  if (this.contractValue > 0 && this.commissionRate > 0) {
    this.commissionTotal = Math.round(this.contractValue * this.commissionRate / 100);
  }
});

OrderSchema.index({ ctvId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderCode: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
