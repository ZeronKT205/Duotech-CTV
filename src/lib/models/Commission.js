import mongoose from 'mongoose';

const CommissionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  orderCode: {
    type: String,
    required: true,
  },
  ctvId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  phase: {
    type: Number,
    enum: [1, 2],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  paidAt: {
    type: Date,
    default: null,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  note: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

CommissionSchema.index({ ctvId: 1, createdAt: -1 });
CommissionSchema.index({ orderId: 1 });
CommissionSchema.index({ status: 1 });

export default mongoose.models.Commission || mongoose.model('Commission', CommissionSchema);
