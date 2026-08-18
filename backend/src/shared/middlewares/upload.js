import multer from "multer";
import path from "path";
import AppError from "../appError.js";
import env from "../../config/env.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".xls", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only Excel files (.xls, .xlsx) are supported.",
        400
      ),
      false
    );
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

const jsonFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".json" || file.mimetype === "application/json" || file.mimetype === "text/plain") {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Only JSON files (.json) are supported.", 400), false);
  }
};

export const uploadJson = multer({
  storage,
  fileFilter: jsonFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for large Tally JSON
  },
});

export default uploadExcel;
