const mongoose = require('mongoose');

const FeedbackSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // null if anonymous or not logged in
    },
    type: {
        type: String,
        enum: ['contact', 'bug', 'feedback', 'feature'],
        required: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved'],
        default: 'new',
    }
}, {
    timestamps: true,
});

// Index to quickly fetch feedback by userId or status
FeedbackSchema.index({ userId: 1 });
FeedbackSchema.index({ status: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
