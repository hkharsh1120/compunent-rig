
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const {
    pcBuildSchema,
    laptopUpgradeSchema,
} = require('../validators/serviceValidator');

const {
    createPCBuildRequest,
    createLaptopUpgradeRequest,
} = require('../controllers/serviceRequestController');

router.use(protect);

router.post('/build', validate(pcBuildSchema), createPCBuildRequest);
router.post('/upgrade', validate(laptopUpgradeSchema), createLaptopUpgradeRequest);

module.exports = router;
