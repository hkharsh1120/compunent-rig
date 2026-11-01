
const express = require('express');
const router = express.Router();

const { protect, authorizeAdmin } = require('../middleware/authMiddleware');

const {
    getCustomers,
    getCustomerDetails,
    updateCustomerStatus,
} = require('../controllers/adminCustomerController');

router.use(protect, authorizeAdmin);

router.get('/', getCustomers);
router.get('/:id', getCustomerDetails);
router.patch('/:id/status', updateCustomerStatus);

module.exports = router;
