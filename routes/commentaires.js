const router = require('express').Router();
const ctrl = require('../controllers/commentaireController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/etape/:etapeId', ctrl.getByEtape);
router.post('/', ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;