import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout.jsx';
import Input from '../../components/Inputs/Input.jsx';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email });
            if (response.data && response.data.success) {
                toast.success('If the account exists, a reset code has been sent!');
                // Navigate to password reset submission and pass email in state
                navigate('/reset-password', { state: { email } });
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
                <h3 className="text-xl font-semibold text-black dark:text-white">Forgot Password</h3>
                <p className="text-xs text-slate-700 dark:text-slate-400 mt-[5px] mb-6">
                    Enter your email address and we'll send you a code to reset your password.
                </p>

                <form onSubmit={handleSubmit}>
                    <Input
                        value={email}
                        onChange={({ target }) => setEmail(target.value)}
                        label="Email Address"
                        placeholder="abc@example.com"
                        type="text"
                    />

                    {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'SENDING...' : 'SEND RESET CODE'}
                    </button>
                    <p className='text-[13px] text-slate-800 dark:text-slate-400 mt-3'>
                        Back to{" "}
                        <Link className="font-medium text-primary underline" to="/login">
                            Login
                        </Link>
                    </p>
                </form>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
