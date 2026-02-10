const router = require('express').Router();
const { register, login, me } = require('../controllers/authController');
const { authRequired } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);

module.exports = router;
