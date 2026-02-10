const router = require('express').Router();
const { authRequired, requireRole } = require('../middlewares/authMiddleware');
const { createHotel, updateHotel, myHotels } = require('../controllers/merchantController');

router.use(authRequired);
router.use(requireRole('merchant'));

router.get('/hotel/list', myHotels);
router.post('/hotel', createHotel);
router.put('/hotel/:id', updateHotel);

module.exports = router;
