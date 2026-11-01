const express = require('express');
const router = express.Router();

const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const { getDashboard } = require('../controllers/adminDashboardController');

router.use(protect, authorizeAdmin);

router.get('/stats', getDashboard);

module.exports = router;