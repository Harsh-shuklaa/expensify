const Income = require('../models/Income');
const xlsx = require('xlsx');
const path = require('path');

// ADD INCOME SOURCE
exports.addIncome = async (req, res) => {
    const userId = req.user._id;

    try {
        const { icon, source, amount, date } = req.body;
        if (!source || !amount || !date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        const newIncome = await Income.create({
            userId,
            icon,
            source,
            amount,
            date: new Date(date),
        });

        await newIncome.save();
        res.status(201).json({
            success: true,
            message: 'Income source added successfully',
            data: newIncome,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error adding income source',
            error: error.message,
        });
    }
};

// GET ALL INCOME SOURCE (excludes soft-deleted)
exports.getAllIncome = async (req, res) => {
    const userId = req.user._id;

    try {
        const income = await Income.find({ userId, isDeleted: { $ne: true } }).sort({ date: -1 });
        res.status(200).json({
            success: true,
            data: income,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching income sources',
            error: error.message,
        });
    }
};

// UPDATE INCOME SOURCE
exports.updateIncome = async (req, res) => {
    try {
        const { icon, source, amount, date } = req.body;

        if (!source || !amount || !date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        const updatedIncome = await Income.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { icon, source, amount: Number(amount), date: new Date(date) },
            { new: true }
        );

        if (!updatedIncome) {
            return res.status(404).json({
                success: false,
                message: 'Income source not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Income source updated successfully',
            data: updatedIncome,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating income source',
            error: error.message,
        });
    }
};

// DOWNLOAD INCOME SOURCE EXCEL (excludes soft-deleted)
exports.downloadIncomeExcel = async (req, res) => {
    const userId = req.user._id;

    try {
        const income = await Income.find({ userId, isDeleted: { $ne: true } }).sort({ date: -1 });

        const data = income.map((item) => ({
            Source: item.source,
            Amount: item.amount,
            Date: item.date.toLocaleDateString(),
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Income');
        const filePath = path.join(__dirname, '../downloads/income_details.xlsx');
        xlsx.writeFile(wb, filePath);
        res.download(filePath);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error downloading income sources',
            error: error.message,
        });
    }
};

// SOFT DELETE INCOME SOURCE
exports.deleteIncome = async (req, res) => {
    try {
        const income = await Income.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!income) {
            return res.status(404).json({
                success: false,
                message: 'Income source not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Income source moved to Archived Transactions',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error deleting income source',
            error: error.message,
        });
    }
};

// GET DELETED INCOME SOURCES (Archived Transactions)
exports.getDeletedIncome = async (req, res) => {
    const userId = req.user._id;

    try {
        const income = await Income.find({ userId, isDeleted: true }).sort({ deletedAt: -1 });
        res.status(200).json({
            success: true,
            data: income,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching deleted income sources',
            error: error.message,
        });
    }
};

// RESTORE INCOME SOURCE
exports.restoreIncome = async (req, res) => {
    try {
        const income = await Income.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id, isDeleted: true },
            { isDeleted: false, deletedAt: null },
            { new: true }
        );

        if (!income) {
            return res.status(404).json({
                success: false,
                message: 'Deleted income source not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Income source restored successfully',
            data: income,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error restoring income source',
            error: error.message,
        });
    }
};

// PERMANENT DELETE INCOME SOURCE
exports.permanentDeleteIncome = async (req, res) => {
    try {
        const income = await Income.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
            isDeleted: true,
        });

        if (!income) {
            return res.status(404).json({
                success: false,
                message: 'Deleted income source not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Income source permanently deleted',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error permanently deleting income source',
            error: error.message,
        });
    }
};