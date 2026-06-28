const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ctrl.getMine);
router.put('/:id/lu', ctrl.marquerLu);
router.put('/tous/lus', ctrl.marquerTousLus);

module.exports = router;