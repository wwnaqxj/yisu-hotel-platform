const router = require('express').Router();
const { streamObject } = require('../controllers/mediaController');

// Public proxy for MinIO objects (bucket can remain private).
// Example: /api/media/yisu/images/xxx.png
router.get('/:bucket/*', streamObject);

module.exports = router;
