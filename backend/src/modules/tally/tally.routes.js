import { Router } from "express";
import * as tallyController from "./tally.controller.js";
import { uploadJson } from "../../shared/middlewares/upload.js";

const router = Router();

// Import Tally Sales JSON
router.post("/import", uploadJson.single("file"), tallyController.importTallySales);

// Tally item mappings
router.get("/mappings", tallyController.getMappings);
router.post("/mappings", tallyController.saveMapping);
router.post("/create-item", tallyController.createItemFromTally);

export default router;
