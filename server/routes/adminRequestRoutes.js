
const express = require('express');
const router = express.Router();

const { protect, authorizeAdmin } = require('../middleware/authMiddleware');

const {
    getBuildRequests,
    getUpgradeRequests,
    updateBuildRequest,
    updateUpgradeRequest,
} = require('../controllers/adminRequestController');

router.use(protect, authorizeAdmin);

router.get('/build', getBuildRequests);
router.patch('/build/:id', updateBuildRequest);

router.get('/upgrade', getUpgradeRequests);
router.patch('/upgrade/:id', updateUpgradeRequest);

module.exports = router;
