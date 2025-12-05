import { Router } from "express";
import { AuthControllers } from "./auth.controller.js";


const router = Router();

router.post("/register", AuthControllers.createUser);
router.get('/me', AuthControllers.getMe)
router.post("/login", AuthControllers.credentialsLogin);
router.post("/logout", AuthControllers.logout);



export const AuthRoutes = router;