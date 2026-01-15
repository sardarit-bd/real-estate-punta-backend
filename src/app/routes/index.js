import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route.js";
import { PropertiesRoutes } from "../modules/properties/properties.route.js";
import { UploadRoutes } from "../modules/upload/upload.routes.js";
import { PaymentRoutes } from "../payments/payments.route.js";
import { LeaseRoutes } from "../modules/lease/lease.routes.js";
import { UsersRoutes } from "../modules/users/users.route.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const router = Router()

const moduleRoutes = [
    {
        path: '/auth',
        route: AuthRoutes
    },
    {
        path: '/dashboard',
        route: DashboardRoutes
    },
    {
        path: '/properties',
        route: PropertiesRoutes
    },
    {
        path: '/upload',
        route: UploadRoutes
    },
    {
        path: '/payment',
        route: PaymentRoutes
    },
    {
        path: '/leases',
        route: LeaseRoutes,
    },
    {
        path: '/users',
        route: UsersRoutes
    }
]

moduleRoutes.forEach(route => {
    router.use(route.path, route.route)
})