import React, { useState, useContext } from 'react';
import AuthLayout from '../../components/layouts/AuthLayout.jsx';
import Input from '../../components/Inputs/Input.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import { UserContext } from '../../context/UserContext.jsx';
import { trackEvent } from '../../utils/analytics';

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useContext(UserContext);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, user } = response.data;

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        updateUser(user);
        trackEvent("login", "Authentication", email);
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 403 && data.isVerified === false) {
          // Unverified user — offer to navigate to verification page
          setError('Your email is not verified yet. Please complete OTP verification to access your account.');
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            navigate('/verify-otp', { state: { email: data.email || email } });
          }, 3000);
        } else if (status === 423) {
          // Account locked
          setError(data.message || 'Account is temporarily locked. Please try again later.');
        } else if (status === 429) {
          // Rate limited
          setError(data.message || 'Too many login attempts. Please try again later.');
        } else if (data.message) {
          setError(data.message);
        } else {
          setError('Login failed. Please check your credentials and try again.');
        }
      } else if (error.request) {
        setError('Unable to reach the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full lg:w-[70%] h-auto md:h-full flex flex-col justify-center my-6 lg:my-0 lg:ml-20 lg:mr-20">
        <h3 className="text-xl font-semibold text-black dark:text-white">Welcome Back</h3>
        <p className="text-xs text-slate-700 dark:text-slate-400 mt-[5px] mb-6">
          Please enter your details to log in
        </p>

        <form onSubmit={handleLogin}>
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="abc@example.com"
            type="text"
          />

          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Min 8 characters"
            type="password"
          />

          <div className="flex justify-end mt-1 mb-4">
            <Link className="text-[12px] font-medium text-primary underline" to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
          <p className='text-[13px] text-slate-800 dark:text-slate-400 mt-3'>
            Don't have an account?{" "}
            <Link className="font-medium text-primary underline" to="/Signup">
              SignUp
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;