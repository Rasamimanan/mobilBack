const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ctrl.getStats);

module.exports = router;
