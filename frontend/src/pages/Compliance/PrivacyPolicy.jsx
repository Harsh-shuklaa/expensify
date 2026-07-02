import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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

                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Privacy Policy</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Last Updated: July 1, 2026</p>

                <div className="space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">1. Information We Collect</h2>
                        <p>
                            We collect personal information that you provide to us directly, such as your full name, email address, password hash, and profile image. Additionally, we store transaction details (incomes and expenses) that you record in the application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">2. How We Use Your Information</h2>
                        <p>
                            We use your personal data to operate, maintain, and provide the features of the Expensify Expense Tracker, including authenticating your account, securing your transactions, processing support requests, and conducting auditing and debugging.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">3. GDPR & CCPA Rights</h2>
                        <p>
                            Under GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act), you possess the following rights regarding your personal details:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Right of Portability:</strong> You can export a copy of all stored profile and financial data at any time from your account settings.</li>
                            <li><strong>Right of Erasure (Deletion):</strong> You can permanently delete your profile and all associated data, resolving any retention requirements.</li>
                            <li><strong>Right of Rectification:</strong> You can edit your profile details (name and profile image) directly.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">4. Data Security</h2>
                        <p>
                            We implement industry-standard security measures, including bcrypt password hashing, JWT access token rotation, custom rate limiting, and NoSQL sanitization. However, no electronic storage system is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">5. Contact Information</h2>
                        <p>
                            For inquiries regarding this privacy policy or to submit user rights claims, contact our support team at <span className="text-purple-600 dark:text-purple-400">expensifya@gmail.com</span>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
