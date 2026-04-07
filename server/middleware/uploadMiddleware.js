const path = require("path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "..", "uploads", "complaints")),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName.replace(/[^\w\-]/g, "_").slice(0, 40);
    cb(null, `${Date.now()}-${safeName}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new AppError("Invalid file type. Only images and PDF are allowed.", 400));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },
});

module.exports = upload;
