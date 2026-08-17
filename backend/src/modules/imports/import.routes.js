import { Router } from "express";
import uploadExcel from "../../shared/middlewares/upload.js";
import validate from "../../shared/middlewares/validate.js";
import {
  getImportSchema,
  getImportRowsSchema,
  resolveDealerSchema,
  commitImportSchema,
} from "./import.schema.js";
import * as importController from "./import.controller.js";

const router = Router();

// Upload & Preview
router.post("/preview", uploadExcel.single("file"), importController.previewImport);

// List imports
router.get("/", importController.listImports);

// Get import detail
router.get("/:id", validate(getImportSchema), importController.getImport);

// Get staged rows
router.get("/:id/rows", validate(getImportRowsSchema), importController.getImportRows);

// Resolve dealer
router.post("/:id/resolve-dealer", validate(resolveDealerSchema), importController.resolveDealer);

// Commit import to production
router.post("/:id/commit", validate(commitImportSchema), importController.commit);

export default router;
