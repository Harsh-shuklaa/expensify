const Expense = require('../models/Expense');
const xlsx = require('xlsx');
const path = require('path');

// ADD EXPENSE
exports.addExpense = async (req, res) => {
    const userId = req.user._id;

    try {
        const { icon, category, amount, date } = req.body;
        if (!category || !amount || !date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        const newExpense = await Expense.create({
            userId,
            icon,
            category,
            amount,
            date: new Date(date),
        });

        await newExpense.save();
        res.status(201).json({
            success: true,
            message: 'Expense category added successfully',
            data: newExpense,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error adding expense category',
            error: error.message,
        });
    }
};

// GET ALL EXPENSES (excludes soft-deleted)
exports.getAllExpense = async (req, res) => {
    const userId = req.user._id;

    try {
        const expense = await Expense.find({ userId, isDeleted: { $ne: true } }).sort({ date: -1 });
        res.status(200).json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expense category',
            error: error.message,
        });
    }
};

// UPDATE EXPENSE
exports.updateExpense = async (req, res) => {
    try {
        const { icon, category, amount, date } = req.body;

        if (!category || !amount || !date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        const updatedExpense = await Expense.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { icon, category, amount: Number(amount), date: new Date(date) },
            { new: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({
                success: false,
                message: 'Expense category not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Expense category updated successfully',
            data: updatedExpense,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating expense category',
            error: error.message,
        });
    }
};

// DOWNLOAD EXPENSE EXCEL (excludes soft-deleted)
exports.downloadExpenseExcel = async (req, res) => {
    const userId = req.user._id;

    try {
        const expense = await Expense.find({ userId, isDeleted: { $ne: true } }).sort({ date: -1 });

        const data = expense.map((item) => ({
            Category: item.category,
            Amount: item.amount,
            Date: item.date.toLocaleDateString(),
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Expense');
        const filePath = path.join(__dirname, '../downloads/expense_details.xlsx');
        xlsx.writeFile(wb, filePath);
        res.download(filePath);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error downloading expense category',
            error: error.message,
        });
    }
};

// SOFT DELETE EXPENSE
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense category not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Expense category moved to Archived Transactions',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error deleting expense category',
            error: error.message,
        });
    }
};

// GET DELETED EXPENSES (Archived Transactions)
exports.getDeletedExpense = async (req, res) => {
    const userId = req.user._id;

    try {
        const expense = await Expense.find({ userId, isDeleted: true }).sort({ deletedAt: -1 });
        res.status(200).json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching deleted expenses',
            error: error.message,
        });
    }
};

// RESTORE EXPENSE
exports.restoreExpense = async (req, res) => {
    try {
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id, isDeleted: true },
            { isDeleted: false, deletedAt: null },
            { new: true }
        );

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Deleted expense not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Expense restored successfully',
            data: expense,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error restoring expense',
            error: error.message,
        });
    }
};

// PERMANENT DELETE EXPENSE
exports.permanentDeleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
            isDeleted: true,
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Deleted expense not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Expense permanently deleted',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error permanently deleting expense',
            error: error.message,
        });
    }
};