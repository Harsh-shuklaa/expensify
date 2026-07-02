import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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

                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Terms of Service</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Last Updated: July 1, 2026</p>

                <div className="space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">1. Agreement to Terms</h2>
                        <p>
                            By creating an account or accessing the Expensify Expense Tracker, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you must not access or use the application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">2. Description of Service</h2>
                        <p>
                            Expensify provides users with web-based tools to track personal financial details, specifically income resources and expense categories, including data aggregation, charting, and Excel exports.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">3. User Obligations</h2>
                        <p>
                            You are responsible for maintaining the confidentiality of your credentials (email and password), verifying your email during signup, and preventing unauthorized access to your account. You agree to use the service in compliance with all local laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">4. Termination and Deletion</h2>
                        <p>
                            We reserve the right to suspend or terminate your access to the application for any reason, including violation of these terms. You have the right to terminate your agreement at any time by requesting permanent account deletion.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">5. Disclaimer of Warranties</h2>
                        <p>
                            Expensify is provided on an "as-is" and "as-available" basis without warranties of any kind, either express or implied. We do not guarantee that the service will be error-free, uninterrupted, or free from data loss.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
