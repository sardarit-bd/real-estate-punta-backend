import mongoose from 'mongoose';

const leaseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Parties Information
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Property Information
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  
  // Lease Terms
  startDate: {
    type: Date,
    required: true
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  rentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  rentFrequency: {
    type: String,
    enum: ['monthly', 'weekly', 'biweekly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  
  securityDeposit: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['draft', 'sent_to_tenant', 'changes_requested', 'signed_by_landlord', 'signed_by_tenant', 'fully_executed', 'cancelled', 'expired'],
    default: 'draft'
  },
  
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // E-Signature Information
  signatures: {
    landlord: {
      signedAt: Date,
      signatureType: String,
      signatureData: mongoose.Schema.Types.Mixed,
      ipAddress: String,
      userAgent: String,
      verificationToken: String
    },
    tenant: {
      signedAt: Date,
      signatureType: String,
      signatureData: mongoose.Schema.Types.Mixed,
      ipAddress: String,
      userAgent: String,
      verificationToken: String
    }
  },
  
  // Document Information
  finalDocument: {
    type: String // URL or file path
  },
  
  // Terms and Conditions
  terms: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  
  // Communication
  messages: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    attachments: [{
      url: String,
      name: String,
      type: String
    }],
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Changes Requested
  requestedChanges: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date,
  }],
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Lock after signing
  isLocked: {
    type: Boolean,
    default: false
  },
  
  lockedAt: Date,
  
  // Expiration tracking
  expiresAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  deletedAt: Date,
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
leaseSchema.index({ landlord: 1, status: 1 });
leaseSchema.index({ tenant: 1, status: 1 });
leaseSchema.index({ property: 1 });
leaseSchema.index({ status: 1, endDate: 1 });
leaseSchema.index({ createdAt: -1 });
leaseSchema.index({ isLocked: 1 });
leaseSchema.index({ 'signatures.landlord.verificationToken': 1 });
leaseSchema.index({ 'signatures.tenant.verificationToken': 1 });

// Virtuals
leaseSchema.virtual('duration').get(function() {
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

leaseSchema.virtual('isActive').get(function() {
  return this.status === 'fully_executed' && 
         new Date() >= this.startDate && 
         new Date() <= this.endDate;
});

leaseSchema.virtual('isExpired').get(function() {
  return this.status === 'fully_executed' && new Date() > this.endDate;
});

leaseSchema.virtual('isSignedByLandlord').get(function() {
  return !!this.signatures.landlord?.signedAt;
});

leaseSchema.virtual('isSignedByTenant').get(function() {
  return !!this.signatures.tenant?.signedAt;
});

leaseSchema.virtual('isFullySigned').get(function() {
  return !!this.signatures.landlord?.signedAt && !!this.signatures.tenant?.signedAt;
});

leaseSchema.virtual('nextAction').get(function() {
  switch(this.status) {
    case 'draft':
      return { by: 'landlord', action: 'send_to_tenant' };
    case 'sent_to_tenant':
      return { by: 'tenant', action: 'review' };
    case 'changes_requested':
      return { by: 'landlord', action: 'update_lease' };
    case 'signed_by_landlord':
      return { by: 'tenant', action: 'sign' };
    case 'signed_by_tenant':
      return { by: 'landlord', action: 'sign' };
    default:
      return null;
  }
});

// Middleware to update status history
leaseSchema.pre('save', function() {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this._updatedBy || this.createdBy,
      changedAt: new Date()
    });
  }
  
  // Auto-lock when fully executed
  if (this.status === 'fully_executed' && !this.isLocked) {
    this.isLocked = true;
    this.lockedAt = new Date();
  }
  
  // Auto-expire when end date passed
  if (this.status === 'fully_executed' && new Date() > this.endDate) {
    this.status = 'expired';
  }
  
  // Set expiresAt for signature (30 days from creation)
  if (!this.expiresAt && this.status !== 'fully_executed') {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    this.expiresAt = expires;
  }
  
});

const Lease = mongoose.models.Lease || mongoose.model('Lease', leaseSchema);
export default Lease;