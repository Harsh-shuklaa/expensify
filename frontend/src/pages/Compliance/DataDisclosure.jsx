import React from 'react';
import { useNavigate } from 'react-router-dom';

const DataDisclosure = () => {
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

                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Data Collection Disclosure</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Last Updated: July 1, 2026</p>

                <div className="space-y-6 text-sm leading-relaxed">
                    <p>
                        This disclosure outlines precisely what information Expensify collects, how we aggregate it, and the security boundaries applied to your data, supporting general compliance standards (GDPR, CCPA).
                    </p>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">1. Data Storage Boundaries</h2>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Identity Data:</strong> Fullname, Email, Profile Picture.</li>
                            <li><strong>Financial Logs:</strong> Source, Category, Amount, Date, soft-deleted state.</li>
                            <li><strong>Upload Logs:</strong> Static profile pictures saved on backend storage.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">2. Processing & Analysis</h2>
                        <p>
                            We analyze transaction details to render analytics, monthly balance breakdowns, and historical line charts. All aggregations and analytics are executed securely using isolated database queries.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">3. Third Party Disclosures</h2>
                        <p>
                            We do not sell, rent, or trade your personal or financial data. Analytics data may be processed via Google Analytics 4 (if enabled by you) using anonymized IP trackers.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DataDisclosure;
