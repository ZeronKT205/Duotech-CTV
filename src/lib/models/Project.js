import mongoose from 'mongoose';

const ProjectNoteSchema = new mongoose.Schema({
  content: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  statusChange: {
    from: { type: String, default: null },
    to: { type: String, default: null },
  },
}, { _id: true });

const ProjectSchema = new mongoose.Schema({
  projectCode: {
    type: String,
    unique: true,
    required: true,
  },
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

  // Project info
  customerName: {
    type: String,
    default: '',
    trim: true,
  },
  websiteType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },

  // Status & Progress
  status: {
    type: String,
    enum: ['consulting', 'contracted', 'in_progress', 'completed', 'cancelled'],
    default: 'consulting',
  },
  progress: {
    type: Number,
    default: 20,
    min: 0,
    max: 100,
  },

  // Financial
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

  // Contact & Management
  zaloGroupLink: {
    type: String,
    default: '',
    trim: true,
  },
  contactLinks: [{
    label: { type: String, default: '' },
    url: { type: String, default: '' },
  }],

  // Notes history
  notes: [ProjectNoteSchema],

  // Cancellation
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancelReason: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Auto-generate project code
ProjectSchema.pre('validate', async function () {
  if (this.isNew && !this.projectCode) {
    const count = await this.constructor.countDocuments();
    this.projectCode = `DA-${String(count + 1).padStart(4, '0')}`;
  }
});

// Auto-calculate commission
ProjectSchema.pre('save', function () {
  if (this.contractValue > 0 && this.commissionRate > 0) {
    this.commissionTotal = Math.round(this.contractValue * this.commissionRate / 100);
  }
});

// Auto-set progress based on status (if not manually overridden)
ProjectSchema.pre('save', function () {
  if (this.isModified('status')) {
    const statusProgress = {
      consulting: 20,
      contracted: 40,
      in_progress: 70,
      completed: 100,
      cancelled: 0,
    };
    // Only auto-set if progress hasn't been manually set higher than status default
    const defaultProgress = statusProgress[this.status] || 0;
    if (this.status === 'completed' || this.status === 'cancelled') {
      this.progress = defaultProgress;
    } else if (this.progress < defaultProgress) {
      this.progress = defaultProgress;
    }
  }
});

ProjectSchema.index({ ctvId: 1, createdAt: -1 });
ProjectSchema.index({ orderId: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ projectCode: 1 });

if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
