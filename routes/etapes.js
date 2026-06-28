const router = require('express').Router();
const ctrl = require('../controllers/etapeController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/chantier/:chantierId', ctrl.getByChantier);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:etapeId/intervenants/:intervenantId', ctrl.assignIntervenant);
router.delete('/:etapeId/intervenants/:intervenantId', ctrl.removeIntervenant);

module.exports = router;
