const router = require('express').Router();
const ctrl = require('../controllers/chantierController');
const { authMiddleware } = require('../middleware/auth');

/* PROTECTION GLOBAL */
router.use(authMiddleware);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/etapes', ctrl.getEtapes);
router.get('/:id/stats', ctrl.getStats);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;