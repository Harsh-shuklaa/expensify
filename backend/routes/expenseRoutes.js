const express = require('express');

const {
    addExpense,
    getAllExpense,
    downloadExpenseExcel,
    deleteExpense,
    updateExpense,
    getDeletedExpense,
    restoreExpense,
    permanentDeleteExpense,
} = require('../controller/expenseController');

const { Protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/add', Protect, addExpense);
router.get('/get', Protect, getAllExpense);
router.get('/download', Protect, downloadExpenseExcel);
router.get('/deleted', Protect, getDeletedExpense);
router.put('/:id', Protect, updateExpense);
router.delete('/:id', Protect, deleteExpense);
router.post('/restore/:id', Protect, restoreExpense);
router.delete('/permanent/:id', Protect, permanentDeleteExpense);

module.exports = router;
