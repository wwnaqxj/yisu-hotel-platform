const router = require('express').Router();
const { chat } = require('../controllers/assistantController');

router.post('/chat', chat);

module.exports = router;
