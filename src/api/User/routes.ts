import express, { Router } from "express";
import { AuthenticateSession } from "../../middlewares/AuthenticateSession";
import UserController from "./userController";

const router: Router = express.Router();
const User = new UserController();

/* Authentication */
router.post("/logout", AuthenticateSession, User.logout);
router.get("/me", AuthenticateSession, User.profile);
router.post("/end-user-session", User.endUserSession);
router.post(
  "/accept-terms-and-conditions",
  AuthenticateSession,
  User.acceptTermsAndConditions
);

export default router;
