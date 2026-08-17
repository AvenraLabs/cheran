import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { updateSettingSchema } from "./setting.schema.js";
import * as settingController from "./setting.controller.js";

const router = Router();

router.get("/", settingController.listSettings);
router.put("/:key", validate(updateSettingSchema), settingController.updateSetting);

export default router;
