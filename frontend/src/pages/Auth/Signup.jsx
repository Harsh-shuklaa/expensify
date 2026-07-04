import React, { useState } from 'react';
import AuthLayout from "../../components/layouts/AuthLayout";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext.jsx';
import uploadImage from "../../utils/uploadImage";
import { trackEvent } from '../../utils/analytics';

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullname, setfullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    let profileImageUrl = "";

    if (!fullname) {
      setError("Please enter your name");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (profilePic) {
        try {
          const imgUploadRes = await uploadImage(profilePic);
          profileImageUrl = imgUploadRes.imageUrl || "";
        } catch (error) {
          console.error("Image upload failed:", error);
          profileImageUrl = "";
        }
      }

      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        fullname,
        email,
        password,
        profileImageUrl,
      });

      if (response.data && response.data.success) {
        trackEvent("signup_initiated", "Authentication", email);
        navigate("/verify-otp", { state: { email: response.data.email || email } });
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 409 && data.canResendOtp) {
          // Unverified user exists with active OTP — redirect to verify page
          setError(data.message);
          setTimeout(() => {
            navigate("/verify-otp", { state: { email: data.email || email } });
          }, 2000);
        } else if (status === 503) {
          // Email delivery failed — user was rolled back
          setError(data.message || "Unable to send verification email. Please try again later.");
        } else if (status === 429) {
          // Rate limited
          setError(data.message || "Too many signup attempts. Please try again later.");
        } else if (data.message) {
          setError(data.message);
        } else {
          setError("Registration failed. Please try again.");
        }
      } else if (error.request) {
        setError("Unable to reach the server. Please check your internet connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className='lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center'>
        <h3 className='text-xl font-semibold text-black dark:text-white'>Create an Account</h3>
        <p className='text-xs text-slate-700 dark:text-slate-400 mt-[5px] mb-6'>
          Join us today by entering your details below
        </p>
        <form onSubmit={handleSignUp}>
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Input
              type="text"
              value={fullname}
              onChange={({ target }) => setfullname(target.value)}
              label="Full Name"
              placeholder="John Doe"
            />
            <Input
              type="text"
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Email Address"
              placeholder="abc@example.com"
            />
            <div className='col-span-1 md:col-span-2'>
              <Input
                type="password"
                value={password}
                onChange={({ target }) => setPassword(target.value)}
                label="Password"
                placeholder="Min 8 characters"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          <p className='text-[13px] text-slate-800 dark:text-slate-400 mt-3'>
            Already have an account?{" "}
            <Link className="font-medium text-primary underline" to="/login">
              Login
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
