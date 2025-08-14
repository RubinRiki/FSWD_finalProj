const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SUBMISSIONS_DIR = path.join(UPLOADS_DIR, 'submissions');
const PUBLIC_BASE = '/uploads/submissions';

module.exports = { UPLOADS_DIR, SUBMISSIONS_DIR, PUBLIC_BASE };
