import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccountDeletionPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-6">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 p-8 rounded-3xl shadow-xl">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 px-4 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                    &larr; Back
                </button>

                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Account Deletion Policy</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Last Updated: July 1, 2026</p>

                <div className="space-y-6 text-sm leading-relaxed">
                    <p>
                        At Expensify, we value your privacy and trust. This Account Deletion Policy explains how you can request the permanent deletion of your account and all associated personal and financial data.
                    </p>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">1. Requesting Account Deletion</h2>
                        <p>
                            You have the right to delete your account at any time. You can request deletion directly from the **Edit Profile** menu inside your dashboard. 
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">2. What Happens When You Delete Your Account?</h2>
                        <p>
                            When you initiate account deletion:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>All your personal details (fullname, email, password hash, and profile image file) are permanently erased from our databases.</li>
                            <li>All your logged financial details (income entries, expense items, and deleted logs) are permanently and hard-deleted.</li>
                            <li>You will be immediately logged out, and your session tokens will be invalidated.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">3. Retention Exceptions</h2>
                        <p>
                            We perform a full hard-delete. We do not retain any copies or backup archives of your financial or personal transactions after deletion is completed.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AccountDeletionPolicy;
