import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { createItemSchema, updateItemSchema, listItemSchema } from "./item.schema.js";
import * as itemController from "./item.controller.js";

const router = Router();

router.get("/", validate(listItemSchema), itemController.listItems);
router.get("/options", itemController.getItemOptions);
router.post("/", validate(createItemSchema), itemController.createItem);
router.get("/:id", itemController.getItemById);
router.patch("/:id", validate(updateItemSchema), itemController.updateItem);

export default router;
