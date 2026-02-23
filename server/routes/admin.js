const router = require('express').Router();
const { authRequired, requireRole } = require('../middlewares/authMiddleware');
const { auditList, auditDetail, approve, reject, offline, online } = require('../controllers/adminController');

router.use(authRequired);
router.use(requireRole('admin'));

router.get('/audit', auditList);
router.get('/audit/:id', auditDetail);
router.post('/audit/:id/approve', approve);
router.post('/audit/:id/reject', reject);
router.post('/hotel/:id/offline', offline);
router.post('/hotel/:id/online', online);

module.exports = router;
