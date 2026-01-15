import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { paymentController } from './payment.controller.js';
import { Role } from '../modules/auth/auth.model.js';


const router = express.Router();

// Create checkout session (requires auth)
router.post(
  '/create-checkout',
  checkAuth(Role.OWNER, Role.SUPER_ADMIN, Role.TENANT),
  paymentController.createCheckout
);

// Verify payment (requires auth)
router.post(
  '/verify',
    checkAuth(Role.OWNER, Role.SUPER_ADMIN, Role.TENANT),
  paymentController.verifyPayment
);

// Get payment history
router.get('/history', checkAuth(Role.OWNER, Role.SUPER_ADMIN, Role.TENANT), paymentController.getPaymentHistory);

// Get single payment details
router.get('/:id', checkAuth(Role.OWNER, Role.SUPER_ADMIN, Role.TENANT), paymentController.getPaymentDetails);

// Request refund
router.post('/refund', checkAuth(Role.OWNER, Role.SUPER_ADMIN, Role.TENANT), paymentController.requestRefund);

// Get refund details
router.get('/refunds/:refundId', checkAuth(Role.OWNER, Role.SUPER_ADMIN, Role.TENANT), paymentController.getRefundDetails);
export const PaymentRoutes = router;