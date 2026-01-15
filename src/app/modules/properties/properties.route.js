import express from 'express';
import { propertiesControllers } from './properties.controller.js';
import { Role } from '../auth/auth.model.js';
import { checkAuth } from '../../middlewares/checkAuth.js';
;

const router = express.Router();

// Public routes
router.get(
  '/',
  propertiesControllers.getAllProperties
);

router.get('/:id', propertiesControllers.getProperty);



// Owner/Agent routes
router.post(
  '/',
  checkAuth(Role.OWNER, Role.SUPER_ADMIN),
  propertiesControllers.createProperty
);

router.get(
  '/owner/my-properties',
  checkAuth(Role.OWNER, Role.SUPER_ADMIN),
  propertiesControllers.getMyProperties
);

router.get('/owner/stats', checkAuth(Role.OWNER, Role.SUPER_ADMIN), propertiesControllers.getPropertyStats);

router.get(
  '/owner/trash',
  checkAuth(Role.OWNER, Role.SUPER_ADMIN),
  propertiesControllers.getTrashedProperties
);

// Property management routes
router.patch(
  '/:id',
  checkAuth(Role.SUPER_ADMIN, Role.OWNER),
  propertiesControllers.updateProperty
);

router.patch(
  '/:id/featured', //will be called after payment
  propertiesControllers.toggleFeatured
);

router.patch(
  '/:id/status',
  checkAuth(Role.SUPER_ADMIN, Role.OWNER),
  propertiesControllers.updateStatus
);

router.patch('/:id/restore', checkAuth(Role.SUPER_ADMIN, Role.OWNER), propertiesControllers.restoreProperty);

router.delete('/:id', checkAuth(Role.SUPER_ADMIN, Role.OWNER),  propertiesControllers.deleteProperty);


router.delete('/admin/:id/permanent', checkAuth(Role.ADMIN, Role.SUPER_ADMIN), propertiesControllers.deleteProperty);

export const PropertiesRoutes = router;