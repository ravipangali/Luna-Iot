const express = require('express')
const router = express.Router();
const VehicleController = require('../controllers/vehicle_controller');
const { corsMiddleware } = require('../middleware/cors_middleware');

router.use(corsMiddleware);

// Main vehicle endpoints
router.get('/vehicle', VehicleController.getAllVehicles);
router.get('/vehicle/:imei', VehicleController.getVehicleByImei);
router.post('/vehicle/create', VehicleController.createVehicle);
router.put('/vehicle/update/:imei', VehicleController.updateVehicle);
router.delete('/vehicle/delete/:imei', VehicleController.deleteVehicle);

module.exports = router;