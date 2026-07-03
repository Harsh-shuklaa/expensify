const mongoose = require('mongoose');

const ExpenseSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    icon: {
        type: String,
    },
    category: {
        type: String,
        required: true,
    }, //example food, Rent, etc
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be a positive number'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Compound index for query performance on user transactions sorted by date
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);