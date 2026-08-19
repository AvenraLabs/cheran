import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/authMiddleware.js";
import {
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "./user.schema.js";
import * as userController from "./user.controller.js";

const router = Router();

// Protect all user management endpoints - Admin only
router.use(authorize("ADMIN"));

router.get("/", validate(listUsersSchema), userController.listUsers);
router.post("/", validate(createUserSchema), userController.createUser);
router.get("/:id", validate(userIdParamSchema), userController.getUserById);
router.patch("/:id", validate(updateUserSchema), userController.updateUser);
router.put("/:id", validate(updateUserSchema), userController.updateUser);
router.delete("/:id", validate(userIdParamSchema), userController.deleteUser);

export default router;
