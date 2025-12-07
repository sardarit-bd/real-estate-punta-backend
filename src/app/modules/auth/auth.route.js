import { Router } from "express";
import { AuthControllers } from "./auth.controller.js";
import { checkAuth } from "../../middlewares/checkAuth.js";


const router = Router();

router.post("/register", AuthControllers.createUser);
router.get('/me', checkAuth('owner', 'super_admin'), AuthControllers.getMe)
router.post("/login", AuthControllers.credentialsLogin);
router.post("/logout", AuthControllers.logout);


export const AuthRoutes = router;