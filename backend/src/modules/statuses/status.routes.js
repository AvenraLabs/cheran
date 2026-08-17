import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { listStatusSchema, createStatusSchema } from "./status.schema.js";
import * as statusController from "./status.controller.js";

const router = Router();

router
  .route("/")
  .get(validate(listStatusSchema), statusController.listStatuses)
  .post(validate(createStatusSchema), statusController.createStatus);

export default router;
