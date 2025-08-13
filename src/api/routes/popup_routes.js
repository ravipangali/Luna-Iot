const express = require('express')
const router = express.Router();
const PopupController = require('../controllers/popup_controller');
const { corsMiddleware } = require('../middleware/cors_middleware');
const { AuthMiddleware } = require('../middleware/auth_middleware');

router.use(corsMiddleware);

// Public route - no auth required
router.get('/popup/active', PopupController.getActivePopups);

// Protected routes - require auth and Super Admin role
router.get('/popup', AuthMiddleware.verifyToken, PopupController.getAllPopups);
router.get('/popup/:id', AuthMiddleware.verifyToken, PopupController.getPopupById);
router.post('/popup/create', AuthMiddleware.verifyToken, PopupController.createPopup);
router.put('/popup/update/:id', AuthMiddleware.verifyToken, PopupController.updatePopup);
router.delete('/popup/delete/:id', AuthMiddleware.verifyToken, PopupController.deletePopup);

module.exports = router;