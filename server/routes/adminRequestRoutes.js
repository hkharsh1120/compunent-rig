
const express = require('express');
const router = express.Router();

const { protect, authorizeAdmin } = require('../middleware/authMiddleware');

const {
    getBuildRequests,
    getUpgradeRequests,
    getStatusOptions,
    updateBuildRequest,
    updateUpgradeRequest,
} = require('../controllers/adminRequestController');

router.use(protect, authorizeAdmin);

// Get status options for a request type
router.get('/status-options', getStatusOptions);

// PC Build requests
router.get('/build', getBuildRequests);
router.patch('/build/:id', updateBuildRequest);

// Laptop Upgrade requests
router.get('/upgrade', getUpgradeRequests);
router.patch('/upgrade/:id', updateUpgradeRequest);

module.exports = router;
