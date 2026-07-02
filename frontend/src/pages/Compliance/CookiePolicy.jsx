import React from 'react';
import { useNavigate } from 'react-router-dom';

const CookiePolicy = () => {
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

                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Cookie Policy</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Last Updated: July 1, 2026</p>

                <div className="space-y-6 text-sm leading-relaxed">
                    <p>
                        This Cookie Policy explains how Expensify uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                    </p>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">1. What are Cookies?</h2>
                        <p>
                            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">2. Types of Cookies We Use</h2>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>
                                <strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as accessing secure areas (session tokens and user state).
                            </li>
                            <li>
                                <strong>Performance and Analytics Cookies:</strong> These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use. We integrate Google Analytics 4 to track anonymized user events.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">3. How Can I Control Cookies?</h2>
                        <p>
                            You have the right to decide whether to accept or reject non-essential cookies. You can exercise your cookie preferences by indicating your choice on the Cookie Consent Banner that appears when you first visit the app, or by modifying your browser controls.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicy;
