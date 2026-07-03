import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout.jsx';
import Input from '../../components/Inputs/Input.jsx';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(location.state?.email || '');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }
        if (code.length !== 6) {
            setError('Reset code must be exactly 6 digits');
            return;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.RESET_PASSWORD, {
                email,
                code,
                newPassword
            });

            if (response.data && response.data.success) {
                toast.success('Password reset successfully! Please log in.');
                navigate('/login');
            }
        } catch (error) {
            if (error.response && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="w-full lg:w-[70%] h-auto md:h-full flex flex-col justify-center my-6 lg:my-0">
                <h3 className="text-xl font-semibold text-black dark:text-white">Reset Password</h3>
                <p className="text-xs text-slate-700 dark:text-slate-400 mt-[5px] mb-6">
                    Enter the 6-digit reset code and your new password.
                </p>
                <div className="text-[12px] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 mb-6">
                    💡 <strong>Tip:</strong> If you don't receive the reset code, please check your <strong>Spam or Junk</strong> folder and mark it as <strong>"Not Spam"</strong>.
                </div>

                <form onSubmit={handleReset}>
                    {!location.state?.email && (
                        <Input
                            value={email}
                            onChange={({ target }) => setEmail(target.value)}
                            label="Email Address"
                            placeholder="abc@example.com"
                            type="text"
                        />
                    )}

                    <Input
                        value={code}
                        onChange={({ target }) => setCode(target.value)}
                        label="6-Digit Reset Code"
                        placeholder="123456"
                        type="text"
                    />

                    <Input
                        value={newPassword}
                        onChange={({ target }) => setNewPassword(target.value)}
                        label="New Password"
                        placeholder="Min 8 characters, letters & numbers"
                        type="password"
                    />

                    {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
};

export default ResetPassword;
