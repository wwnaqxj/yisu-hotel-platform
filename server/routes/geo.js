const router = require('express').Router();
const { geocode, nearby } = require('../controllers/geoController');

// Geocode: keyword -> lng/lat
router.post('/geocode', geocode);

// Nearby POI: lng/lat -> items
router.get('/nearby', nearby);

module.exports = router;
