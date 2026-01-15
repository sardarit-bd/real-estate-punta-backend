import Property from "../modules/properties/properties.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import Payment from "./payment.model.js";
import { stripeService } from "./payments.services.js";
// Create checkout session for featured listing
const createCheckout = catchAsync(async (req, res) => {
  const { propertyId } = req.body;
  
  // Verify property belongs to user
  const property = await Property.findOne({
    _id: propertyId,
    owner: req.user.userId,
    isDeleted: false
  });
  
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }
  
  // Create Stripe checkout session
  const session = await stripeService.createCheckoutSession(property, req.user);

  // Save payment record in database
  const payment = await Payment.create({
    sessionId: session.id,
    amount: 24.99,
    currency: 'usd',
    user: req.user.userId,
    property: propertyId,
    paymentType: 'featured_listing',
    status: 'pending',
    description: 'Featured listing payment',
    metadata: {
      propertyTitle: property.title,
      propertyAddress: property.address,
      userEmail: req.user.email
    }
  });
  
  res.status(200).json({
    success: true,
    message: 'Checkout session created',
    data: {
      sessionId: session.id,
      url: session.url,
      paymentId: payment._id
    }
  });
});

// Verify payment after success
const verifyPayment = catchAsync(async (req, res) => {
  const { sessionId } = req.body;
  
  const session = await stripeService.verifyPayment(sessionId);
  
  if (!session) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session'
    });
  }
  
  // Find payment record
  const payment = await Payment.findOne({ sessionId });
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment record not found'
    });
  }
  
  if (session.payment_status === 'paid') {
    // Update payment record
    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.paymentIntentId = session.payment_intent;
    payment.cardLast4 = session.payment_intent?.charges?.data[0]?.payment_method_details?.card?.last4;
    payment.cardBrand = session.payment_intent?.charges?.data[0]?.payment_method_details?.card?.brand;
    await payment.save();
    
    // Update property to featured
    const propertyId = session.metadata.propertyId;
    
    await Property.findByIdAndUpdate(propertyId, {
      featured: true,
      featuredExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Payment verified. Property is now featured!',
      data: {
        paymentId: payment._id,
        propertyId,
        featured: true,
        paymentStatus: 'paid'
      }
    });
  } else if (session.payment_status === 'unpaid' || session.payment_status === 'canceled') {
    payment.status = 'failed';
    await payment.save();
    
    return res.status(400).json({
      success: false,
      message: 'Payment failed or canceled'
    });
  }
  
  res.status(400).json({
    success: false,
    message: 'Payment not completed'
  });
});

// Get payment history
const getPaymentHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, paymentType, startDate, endDate } = req.query;
  
  const query = { user: req.user.userId };
  
  // Apply filters
  if (status) query.status = status;
  if (paymentType) query.paymentType = paymentType;
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('property', 'title images city address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Payment.countDocuments(query)
  ]);
  
  // Calculate total spent
  const totalSpent = await Payment.aggregate([
    { $match: { ...query, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  res.status(200).json({
    success: true,
    message: 'Payment history retrieved',
    data: {
      payments,
      summary: {
        totalPayments: total,
        totalSpent: totalSpent[0]?.total || 0,
        successfulPayments: await Payment.countDocuments({ ...query, status: 'paid' }),
        refundedPayments: await Payment.countDocuments({ ...query, status: 'refunded' })
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single payment details
const getPaymentDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const payment = await Payment.findOne({
    _id: id,
    user: req.user.userId
  }).populate('property', 'title images city address');
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }
  
  // Get Stripe details if available
  let stripeDetails = null;
  if (payment.paymentIntentId) {
    stripeDetails = await stripeService.getPaymentIntent(payment.paymentIntentId);
  }
  
  res.status(200).json({
    success: true,
    message: 'Payment details retrieved',
    data: {
      payment: payment.toObject(),
      stripeDetails: {
        paymentMethod: stripeDetails?.payment_method_types?.[0],
        billingDetails: stripeDetails?.charges?.data[0]?.billing_details,
        receiptUrl: stripeDetails?.charges?.data[0]?.receipt_url
      }
    }
  });
});

// Request refund
const requestRefund = catchAsync(async (req, res) => {
  const { paymentId, reason, refundAmount } = req.body;
  
  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    user: req.user.userId
  });
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }
  
  // Check if payment is eligible for refund
  if (payment.status !== 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Only paid payments can be refunded'
    });
  }
  
  if (!payment.paymentIntentId) {
    return res.status(400).json({
      success: false,
      message: 'Payment intent not found'
    });
  }
  
  // Calculate refund amount
  const amountToRefund = refundAmount || payment.amount;
  const availableForRefund = payment.amount - payment.totalRefunded;
  
  if (amountToRefund > availableForRefund) {
    return res.status(400).json({
      success: false,
      message: `Maximum refund amount available is $${availableForRefund}`
    });
  }
  
  try {
    // Create refund in Stripe
    const refund = await stripeService.createRefund(
      payment.paymentIntentId,
      amountToRefund,
      reason
    );
    
    // Update payment record
    payment.refunds.push({
      refundId: refund.id,
      amount: amountToRefund,
      reason: reason || 'Customer request',
      status: refund.status
    });
    
    payment.totalRefunded += amountToRefund;
    
    // Update payment status
    if (payment.totalRefunded >= payment.amount) {
      payment.status = 'refunded';
      payment.refundedAt = new Date();
      
      // Remove featured status from property
      if (payment.property) {
        await Property.findByIdAndUpdate(payment.property, {
          featured: false,
          featuredExpiresAt: null
        });
      }
    } else if (payment.totalRefunded > 0) {
      payment.status = 'partially_refunded';
    }
    
    await payment.save();
    
    res.status(200).json({
      success: true,
      message: 'Refund requested successfully',
      data: {
        refundId: refund.id,
        refundAmount: amountToRefund,
        refundStatus: refund.status,
        paymentStatus: payment.status,
        remainingBalance: payment.amount - payment.totalRefunded
      }
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Refund failed: ${error.message}`
    });
  }
});

// Get refund details
const getRefundDetails = catchAsync(async (req, res) => {
  const { refundId } = req.params;
  
  // Find payment with this refund
  const payment = await Payment.findOne({
    'refunds.refundId': refundId,
    user: req.user.userId
  });
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Refund not found'
    });
  }
  
  // Get refund details from Stripe
  const stripeRefund = await stripeService.getRefund(refundId);
  
  // Find the specific refund from payment
  const refund = payment.refunds.find(r => r.refundId === refundId);
  
  res.status(200).json({
    success: true,
    message: 'Refund details retrieved',
    data: {
      refund,
      stripeRefund: {
        id: stripeRefund?.id,
        amount: stripeRefund?.amount ? stripeRefund.amount / 100 : null,
        status: stripeRefund?.status,
        currency: stripeRefund?.currency,
        reason: stripeRefund?.reason
      },
      payment: {
        id: payment._id,
        amount: payment.amount,
        totalRefunded: payment.totalRefunded
      }
    }
  });
});

export const paymentController = {
  createCheckout,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  requestRefund,
  getRefundDetails
}