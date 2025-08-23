const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { SUBMISSIONS_DIR } = require('../config/storage');

fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });

const MAX_MB = parseInt(process.env.MAX_UPLOAD_MB || '25', 10);
const limits = { fileSize: MAX_MB * 1024 * 1024 };

const ALLOWED = new Set(['application/pdf']);


const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SUBMISSIONS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

function fileFilter(_req, file, cb) {
  const okMime = ALLOWED.has(file.mimetype);
  const okExt  = path.extname(file.originalname || '').toLowerCase() === '.pdf';
  if (okMime && okExt) return cb(null, true);
  const err = new Error('Only PDF files are allowed');
  err.status = 400;
+  cb(err);
}

const upload = multer({ storage, fileFilter, limits });

module.exports = { upload };
