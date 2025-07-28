const express = require('express')
const router = express.Router();
const LocationController = require('../controllers/location_controller');
const { corsMiddleware } = require('../middleware/cors_middleware');

router.use(corsMiddleware);

router.get('/location/:imei', LocationController.getLocationByImei);
router.get('/location/latest/:imei', LocationController.getLatestLocation);
router.get('/location/range/:imei', LocationController.getLocationByDateRange);

module.exports = router;