const express = require('express')
const router = express.Router();
const VehicleController = require('../controllers/vehicle_controller');
const { corsMiddleware } = require('../middleware/cors_middleware');

router.use(corsMiddleware);

router.get('/vehicle', VehicleController.getAllVehicles);
router.get('/vehicle/:imei', VehicleController.getVehicleByImei);
router.get('/vehicles/ownership', VehicleController.getVehiclesWithOwnershipType);
router.post('/vehicle/create', VehicleController.createVehicle);
router.put('/vehicle/update/:imei', VehicleController.updateVehicle);
router.delete('/vehicle/delete/:imei', VehicleController.deleteVehicle);

// Vehicle routes with status and location data
router.get('/vehicle-with-data', VehicleController.getAllVehiclesWithData);
router.get('/vehicle-with-data/:imei', VehicleController.getVehicleByImeiWithData);

module.exports = router;