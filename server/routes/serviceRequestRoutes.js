
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
    createPCBuildRequest,
    createLaptopUpgradeRequest,
} = require('../controllers/serviceRequestController');

router.use(protect);

router.post('/build', createPCBuildRequest);
router.post('/upgrade', createLaptopUpgradeRequest);

module.exports = router;
