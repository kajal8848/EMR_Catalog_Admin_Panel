const express = require('express');
const { transactionalControllerWrapper } = require('../utils/controllerWrapper');
const { loginUser } = require('../controllers/authController');
const { getCustMstData, updateCustMstData } = require('../controllers/custMstController');

const router = express.Router();

router.post('/login', transactionalControllerWrapper(loginUser));
router.get('/getCustMst', transactionalControllerWrapper(getCustMstData));
router.put('/updateCustMst', transactionalControllerWrapper(updateCustMstData));

module.exports = router;