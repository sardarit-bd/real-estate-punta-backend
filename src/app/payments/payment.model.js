import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Payment Details
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  paymentIntentId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Amount and Currency
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'usd'
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'canceled'],
    default: 'pending'
  },
  
  // Payment Type
  paymentType: {
    type: String,
    enum: ['featured_listing', 'property_promotion', 'one_time'],
    required: true
  },
  
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  
  // Metadata
  description: {
    type: String
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Refund Information
  refunds: [{
    refundId: String,
    amount: Number,
    reason: String,
    status: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  totalRefunded: {
    type: Number,
    default: 0
  },
  
  // Card Information
  cardLast4: {
    type: String
  },
  
  cardBrand: {
    type: String
  },
  
  // Timestamps
  paidAt: {
    type: Date
  },
  
  refundedAt: {
    type: Date
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ sessionId: 1 });
paymentSchema.index({ paymentIntentId: 1 });
paymentSchema.index({ property: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, paidAt: 1 });

// Virtual for formatted amount
paymentSchema.virtual('displayAmount').get(function() {
  return `$${(this.amount / 100).toFixed(2)} ${this.currency.toUpperCase()}`;
});

// Virtual for status display
paymentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending',
    'paid': 'Paid',
    'failed': 'Failed',
    'refunded': 'Refunded',
    'partially_refunded': 'Partially Refunded',
    'canceled': 'Canceled'
  };
  return statusMap[this.status] || this.status;
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;