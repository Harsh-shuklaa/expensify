const express = require('express');
const { Protect } = require('../middleware/authMiddleware'); 
const { getDashboardData } = require('../controller/dashboardController');

    
const router = express.Router();

router.get('/', Protect, getDashboardData);


module.exports = router;
