import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { createCustomerSchema, updateCustomerSchema, listCustomerSchema } from "./customer.schema.js";
import * as customerController from "./customer.controller.js";

const router = Router();

router.get("/", validate(listCustomerSchema), customerController.listCustomers);
router.post("/", validate(createCustomerSchema), customerController.createCustomer);
router.get("/:id", customerController.getCustomerById);
router.patch("/:id", validate(updateCustomerSchema), customerController.updateCustomer);

export default router;
