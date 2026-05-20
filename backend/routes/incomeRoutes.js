const express = require('express');

const {
    addIncome,
    getAllIncome,
    downloadIncomeExcel,
    deleteIncome,
    updateIncome,
    getDeletedIncome,
    restoreIncome,
    permanentDeleteIncome,
} = require('../controller/incomeController');

const { Protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/add', Protect, addIncome);
router.get('/get', Protect, getAllIncome);
router.get('/download', Protect, downloadIncomeExcel);
router.get('/deleted', Protect, getDeletedIncome);
router.put('/:id', Protect, updateIncome);
router.delete('/:id', Protect, deleteIncome);
router.post('/restore/:id', Protect, restoreIncome);
router.delete('/permanent/:id', Protect, permanentDeleteIncome);

module.exports = router;
