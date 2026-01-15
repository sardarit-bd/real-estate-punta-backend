import express from 'express';
import { getDashboard } from './dashboard.controller.js';
import { checkAuth } from '../../middlewares/checkAuth.js';
import { Role } from '../auth/auth.model.js';

const router = express.Router();

router.get(
  '/',
  checkAuth(Role.ADMIN, Role.OWNER, Role.TENANT),
  getDashboard
);

export const DashboardRoutes = router;
