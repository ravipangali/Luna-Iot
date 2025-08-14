const express = require('express')
const router = express.Router();
const PopupController = require('../controllers/popup_controller');
const { upload } = require('../middleware/upload_middleware');
const { corsMiddleware } = require('../middleware/cors_middleware');

router.use(corsMiddleware);

// Public route - no auth required
router.get('/popup/active', PopupController.getActivePopups);

// Protected routes - require auth and Super Admin role
router.get('/popup', PopupController.getAllPopups);
router.get('/popup/:id', PopupController.getPopupById);
router.post('/popup/create', upload.single('image'),  PopupController.createPopup);
router.put('/popup/update/:id', upload.single('image'),  PopupController.updatePopup);
router.delete('/popup/delete/:id', PopupController.deletePopup);

module.exports = router;