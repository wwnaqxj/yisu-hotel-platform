const router = require('express').Router();
const { authRequired, requireRole } = require('../middlewares/authMiddleware');
const { upload, uploadSingle } = require('../controllers/uploadController');

router.use(authRequired);
router.use(requireRole('merchant'));

router.post('/single', upload.single('file'), uploadSingle);

module.exports = router;
