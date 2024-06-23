import express, { Router } from "express";
import AuthController from "./authController";

const router: Router = express.Router();

const auth = new AuthController();

/* Authentication */
router.post("/sign-up", auth.signup);
router.post("/sign-in", auth.signIn);
router.get("/google", auth.googleAuth);
router.get("/google/callback", auth.googleLogin);
export default router;
