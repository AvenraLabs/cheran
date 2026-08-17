import { Router } from "express";
import { z } from "zod";
import validate from "../../shared/middlewares/validate.js";
import requireAuth from "../../shared/middlewares/authMiddleware.js";
import * as authController from "./auth.controller.js";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", requireAuth, authController.getMe);

export default router;
