const router = require('express').Router();
const { register, login, me, updateProfile, updatePassword } = require('../controllers/authController');
const { authRequired } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);
router.put('/profile', authRequired, updateProfile);
router.put('/password', authRequired, updatePassword);

module.exports = router;
