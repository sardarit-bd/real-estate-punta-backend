import { Router } from "express";
import { AuthControllers } from "./auth.controller.js";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { Role } from "./auth.model.js";


const router = Router();

router.post("/register", AuthControllers.createUser);
router.get('/me', checkAuth(Role.OWNER, Role.TENANT, Role.ADMIN, Role.SUPER_ADMIN), AuthControllers.getMe)
router.patch("/users/me",checkAuth(Role.ADMIN, Role.OWNER, Role.TENANT, Role.SUPER_ADMIN), AuthControllers.updateMe);

router.delete('/delete-me', checkAuth(Role.OWNER, Role.TENANT, Role.ADMIN), AuthControllers.deleteMe)

router.post("/login", AuthControllers.credentialsLogin);
router.post("/logout", AuthControllers.logout);

router.post("/change-password", checkAuth(Role.OWNER, Role.TENANT, Role.ADMIN, Role.SUPER_ADMIN), AuthControllers.changePassword);
router.post("/forgot-password", AuthControllers.forgotPassword);
router.post("/reset-password", checkAuth(Role.OWNER, Role.TENANT, Role.ADMIN, Role.SUPER_ADMIN), AuthControllers.resetPassword);


export const AuthRoutes = router;