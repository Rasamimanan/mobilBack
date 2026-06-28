const router = require('express').Router();
const ctrl = require('../controllers/rechercheController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ctrl.search);

module.exports = router;