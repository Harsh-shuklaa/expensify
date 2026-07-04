import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout.jsx';
import Input from '../../components/Inputs/Input.jsx';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import { UserContext } from '../../context/UserContext.jsx';
import toast from 'react-hot-toast';
import { trackEvent } from '../../utils/analytics';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyOtp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { updateUser } = useContext(UserContext);

    const [email, setEmail] = useState(location.state?.email || '');
    const [code, setCode] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }
        if (!/^\d{6}$/.test(code)) {
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
            if (error.response) {
                const { data } = error.response;

                if (data.isExpired) {
                    setError('Your verification code has expired. Please request a new one.');
                    toast.error('Code expired');
                } else if (data.message) {
                    setError(data.message);
                    toast.error(data.message);
                } else {
                    setError('Verification failed. Please check your code and try again.');
                    toast.error('Verification failed');
                }
            } else if (error.request) {
                setError('Unable to reach the server. Please check your internet connection.');
                toast.error('Connection error');
            } else {
                setError('An unexpected error occurred. Please try again.');
                toast.error('Verification failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email) {
            setError('Please enter your email address to resend OTP');
            return;
        }
        if (resendCooldown > 0) return;

        setError('');
        setResending(true);

        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.RESEND_OTP, {
                email
            });

            if (response.data && response.data.success) {
                toast.success(response.data.message || 'A new verification code has been sent to your email.');
                setResendCooldown(RESEND_COOLDOWN_SECONDS);
                setCode(''); // Clear old code input
            }
        } catch (error) {
            if (error.response) {
                const { status, data } = error.response;
                if (status === 429) {
                    setError(data.message || 'Too many resend attempts. Please wait before trying again.');
                } else if (status === 503) {
                    setError(data.message || 'Unable to send verification email. Please try again later.');
                } else {
                    setError(data.message || 'Failed to resend OTP. Please try again.');
                }
            } else {
                setError('Unable to reach the server. Please check your connection.');
            }
            toast.error('Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    const resendButtonText = () => {
        if (resending) return 'Sending...';
        if (resendCooldown > 0) return `Resend in ${resendCooldown}s`;
        return 'Resend Verification Code';
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
                        onChange={({ target }) => {
                            // Only allow digits, max 6 characters
                            const val = target.value.replace(/\D/g, '').slice(0, 6);
                            setCode(val);
                        }}
                        label="6-Digit Verification Code"
                        placeholder="123456"
                        type="text"
                    />

                    <div className="flex justify-end mt-1 mb-4">
                        <button
                            type="button"
                            disabled={resending || loading || resendCooldown > 0}
                            onClick={handleResendOtp}
                            className="text-[12px] font-medium text-primary underline disabled:opacity-50"
                        >
                            {resendButtonText()}
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
