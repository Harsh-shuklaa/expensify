const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { isValidObjectId, Types } = require('mongoose');

// DashBoard Data
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const userObjectId = new Types.ObjectId(String(userId));

        // Support range query param (default: income=60, expense=30)
        const range = parseInt(req.query.range) || null;
        const incomeRange = range || 60;
        const expenseRange = range || 30;

        // Fetch total income and expense data for the user (exclude soft-deleted)
        const totalIncome = await Income.aggregate([
            { $match: { userId: userObjectId, isDeleted: { $ne: true } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const totalExpense = await Expense.aggregate([
            { $match: { userId: userObjectId, isDeleted: { $ne: true } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // Get income transactions in last N days
        const lastNDaysIncomeTransactions = await Income.find({
            userId,
            isDeleted: { $ne: true },
            date: { $gte: new Date(Date.now() - incomeRange * 24 * 60 * 60 * 1000) },
        }).sort({ date: -1 });

        const IncomeLast60Days = lastNDaysIncomeTransactions.reduce(
            (sum, transaction) => sum + transaction.amount, 0
        );

        // Get expense transactions in last N days
        const lastNDaysExpenseTransactions = await Expense.find({
            userId,
            isDeleted: { $ne: true },
            date: { $gte: new Date(Date.now() - expenseRange * 24 * 60 * 60 * 1000) },
        }).sort({ date: -1 });

        const expensesLast30Days = lastNDaysExpenseTransactions.reduce(
            (sum, transaction) => sum + transaction.amount, 0
        );

        // Fetch last 5 transactions (income + expense), exclude soft-deleted
        const lastTransactions = [
            ...(await Income.find({ userId, isDeleted: { $ne: true } }).sort({ date: -1 }).limit(5)).map(
                (txn) => ({
                    ...txn.toObject(),
                    type: 'income',
                })
            ),
            ...(await Expense.find({ userId, isDeleted: { $ne: true } }).sort({ date: -1 }).limit(5)).map(
                (txn) => ({
                    ...txn.toObject(),
                    type: 'expense',
                })
            ),
        ].sort((a, b) => b.date - a.date);

        // Final Response
        res.json({
            totalBalance:
                (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
            totalIncome: totalIncome[0]?.total || 0,
            totalExpense: totalExpense[0]?.total || 0,
            last30DaysExpenses: {
                total: expensesLast30Days,
                transactions: lastNDaysExpenseTransactions,
            },
            last60DaysIncome: {
                total: IncomeLast60Days,
                transactions: lastNDaysIncomeTransactions,
            },
            recentTransactions: lastTransactions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message,
        });
    }
};