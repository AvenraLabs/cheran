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

// Get unresolved dealers summary (grouped unique names & counts)
router.get("/:id/unresolved-dealers", validate(getImportSchema), importController.getUnresolvedDealers);

// Resolve dealer (resolves all matching rows for that dealer name)
router.post("/:id/resolve-dealer", validate(resolveDealerSchema), importController.resolveDealer);

// Auto create and resolve all remaining unmatched dealers in one click
router.post("/:id/auto-create-dealers", validate(getImportSchema), importController.autoCreateDealers);

// Commit import to production
router.post("/:id/commit", validate(commitImportSchema), importController.commit);

// Delete / Discard import preview batch
router.delete("/:id", validate(getImportSchema), importController.deleteImport);

export default router;
