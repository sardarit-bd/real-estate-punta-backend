import express from 'express';
import {
    createLease,
    sendToTenant,
    requestChanges,
    updateLease,
    signLease,
    getMyLeases,
    getLeaseById,
    cancelLease,
    getLeaseStats,
    deleteLease,
    restoreLease,
} from './lease.controller.js'
import { checkAuth } from '../../middlewares/checkAuth.js';
import { Role } from '../auth/auth.model.js';


const router = express.Router();


// Lease Creation
router.post(
    '/',
    checkAuth(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN, Role.TENANT),
    createLease
);

// Get leases for current user
router.get('/my-leases', checkAuth(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN, Role.TENANT), getMyLeases);

// Get lease statistics
router.get('/stats', checkAuth(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN), getLeaseStats);

// Lease Management Routes
router.use(checkAuth(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN, Role.TENANT));
router
    .route('/:leaseId')
    .get(getLeaseById)
    .delete(deleteLease);

// Send lease to tenant
router.post(
    '/:leaseId/send',
    sendToTenant
);

// Request changes to lease
router.post(
    '/:leaseId/request-changes',
    requestChanges
);

// Update lease (after changes requested)
router.put(
    '/:leaseId/update',
    updateLease
);

// Sign lease
router.post(
    '/:leaseId/sign',
    signLease
);


// Cancel lease
router.post(
    '/:leaseId/cancel',
    cancelLease
);

// Restore deleted lease
router.post('/:leaseId/restore', restoreLease);



export const LeaseRoutes = router;