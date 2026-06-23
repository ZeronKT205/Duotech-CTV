import mongoose from 'mongoose';

const CommissionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  orderCode: {
    type: String,
    required: true,
  },
  projectCode: {
    type: String,
    default: '',
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
    enum: ['pending', 'paid', 'cancelled'],
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
  paidNote: {
    type: String,
    default: '',
  },
  billImage: {
    type: String,
    default: '',
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
CommissionSchema.index({ projectId: 1 });
CommissionSchema.index({ status: 1 });

if (mongoose.models.Commission) {
  delete mongoose.models.Commission;
}

export default mongoose.models.Commission || mongoose.model('Commission', CommissionSchema);
