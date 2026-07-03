import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout.jsx';
import Input from '../../components/Inputs/Input.jsx';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import { UserContext } from '../../context/UserContext.jsx';
import toast from 'react-hot-toast';
import { trackEvent } from '../../utils/analytics';

const VerifyOtp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { updateUser } = useContext(UserContext);

    const [email, setEmail] = useState(location.state?.email || '');
    const [code, setCode] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }
        if (code.length !== 6) {
            setError('Verification code must be exactly 6 digits');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.VERIFY_EMAIL, {
                email,
                code
            });

            const { token, user } = response.data;

            if (token) {
                localStorage.setItem('token', token);
                updateUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                trackEvent("signup", "Authentication");
                toast.success('Email verified successfully!');
                navigate('/dashboard');
            }
        } catch (error) {
            if (error.response && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
            toast.error('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email) {
            setError('Please enter your email address to resend OTP');
            return;
        }
        setError('');
        setResending(true);

        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.RESEND_OTP, {
                email
            });

            if (response.data && response.data.success) {
                toast.success(response.data.message || 'Verification OTP has been resent to your email.');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthLayout>
            <div className="w-full lg:w-[70%] h-auto md:h-full flex flex-col justify-center my-6 lg:my-0">
                <h3 className="text-xl font-semibold text-black dark:text-white">Verify Your Email</h3>
                <p className="text-xs text-slate-700 dark:text-slate-400 mt-[5px] mb-6">
                    Enter the 6-digit code sent to your email to activate your account.
                </p>
                <div className="text-[12px] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 mb-6">
                    💡 <strong>Tip:</strong> If you don't receive the email, please check your <strong>Spam or Junk</strong> folder and mark it as <strong>"Not Spam"</strong>.
                </div>

                <form onSubmit={handleVerify}>
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
                        label="6-Digit Verification Code"
                        placeholder="123456"
                        type="text"
                    />

                    <div className="flex justify-end mt-1 mb-4">
                        <button
                            type="button"
                            disabled={resending || loading}
                            onClick={handleResendOtp}
                            className="text-[12px] font-medium text-primary underline disabled:opacity-50"
                        >
                            {resending ? 'Sending...' : 'Resend Verification Code'}
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}
                    <button type="submit" disabled={loading || resending} className="btn-primary">
                        {loading ? 'VERIFYING...' : 'VERIFY EMAIL'}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
};

export default VerifyOtp;
