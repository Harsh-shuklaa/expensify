import React, { useState, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/UserContext';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { LuCircleHelp, LuBug, LuMessageSquare, LuSparkles } from 'react-icons/lu';
import { trackEvent } from '../../utils/analytics';

const Support = () => {
    const { user } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState('contact'); // contact, bug, feedback, feature

    const [fullname, setFullname] = useState(user?.fullname || '');
    const [email, setEmail] = useState(user?.email || '');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!fullname.trim() || !email.trim() || !subject.trim() || !message.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            await axiosInstance.post(API_PATHS.FEEDBACK.CREATE, {
                type: activeTab,
                fullname,
                email,
                subject,
                message
            });

            toast.success('Your message has been submitted successfully!');
            
            // Track analytics event
            trackEvent(`submit_${activeTab}`, 'Feedback', subject);

            setSubject('');
            setMessage('');
        } catch (error) {
            console.error('Feedback submit error:', error);
            const msg = error.response?.data?.message || 'Failed to submit message';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'contact', label: 'Contact Us', icon: LuCircleHelp, desc: 'Get in touch with general inquiries.' },
        { id: 'bug', label: 'Bug Report', icon: LuBug, desc: 'Found an error or issue? Let us know.' },
        { id: 'feedback', label: 'Feedback', icon: LuMessageSquare, desc: 'Tell us how to improve your experience.' },
        { id: 'feature', label: 'Feature Request', icon: LuSparkles, desc: 'Suggest new utilities or upgrades.' }
    ];

    return (
        <DashboardLayout activeMenu="Support">
            <div className="my-5 mx-auto max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Support & Feedback</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
                    Connect with our support team or send us your requests to help improve Expensify.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSubject('');
                                    setMessage('');
                                }}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? 'border-primary bg-primary/5 text-primary shadow-sm dark:bg-primary/10'
                                        : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <Icon className="text-2xl mb-2" />
                                <span className="text-xs font-semibold">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 text-sm">
                        {tabs.find((t) => t.id === activeTab)?.label} Form
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        {tabs.find((t) => t.id === activeTab)?.desc}
                    </p>

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    value={fullname}
                                    onChange={(e) => setFullname(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full text-xs px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full text-xs px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter subject"
                                className="w-full text-xs px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows="5"
                                placeholder="Enter your detailed message..."
                                className="w-full text-xs px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-colors"
                                required
                            ></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 bg-primary hover:bg-primary-dark text-xs font-semibold text-white rounded-lg shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'SUBMITTING...' : 'SUBMIT MESSAGE'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Support;
