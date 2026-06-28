const router = require('express').Router();
const ctrl = require('../controllers/depenseController');
const { authenticateToken, requireAdminOrChef } = require('../middleware/roles');

router.use(authenticateToken);
router.get('/chantier/:chantierId', ctrl.getByChantier);
router.get('/chantier/:chantierId/stats', ctrl.getStats);
router.post('/', requireAdminOrChef, ctrl.create);
router.delete('/:id', requireAdminOrChef, ctrl.remove);

module.exports = router;