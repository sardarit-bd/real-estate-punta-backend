import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session for featured listing
const createCheckoutSession = async (property, user) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Featured Listing',
              description: `Featured listing for: ${property.title}`,
            },
            unit_amount: 2499, // $24.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        propertyId: property._id.toString(),
        userId: user.userId.toString(),
        type: 'featured_listing'
      },
    });

    return session;
  } catch (error) {
    console.error('Stripe error:', error);
    throw new Error(error.message);
  }
};

// Verify payment
const verifyPayment = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Verification error:', error);
    return null;
  }
};

// Create refund
const createRefund = async (paymentIntentId, amount = null, reason = null) => {
  try {
    const refundParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    if (reason) {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);
    return refund;
  } catch (error) {
    console.error('Refund error:', error);
    throw new Error(error.message);
  }
};

// Get payment intent details
const getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Get payment intent error:', error);
    return null;
  }
};

// Get refund details
const getRefund = async (refundId) => {
  try {
    const refund = await stripe.refunds.retrieve(refundId);
    return refund;
  } catch (error) {
    console.error('Get refund error:', error);
    return null;
  }
};

export const stripeService = {
  createCheckoutSession,
  verifyPayment,
  createRefund,
  getPaymentIntent,
  getRefund
};
