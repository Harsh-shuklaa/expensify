import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import axiosInstance from "../utils/axiosInstance"
import {API_PATHS}  from "../utils/apiPaths"



export const useUserAuth = () => {
  const { user, updateUser, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearUser();
      navigate("/login");
      return;
    }

    // Safety net: unverified users should never have a token in normal flow.
    // If somehow an unverified user state is in context, clear and send to login.
    if (user && !user.isVerified) {
      clearUser();
      navigate('/login');
      return;
    }

    if (user) return; // If user already exists and is verified, no need to fetch

    let isMounted = true;

    const fetchUserInfo = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);

        if (isMounted && response.data) {
          const userData = response.data.user || response.data;
          updateUser(userData);
          if (userData && !userData.isVerified) {
            navigate("/verify-otp", { state: { email: userData.email } });
          }
        }
      } catch (err) {
        console.log("Failed to fetch user info:", err);
        if (isMounted) {
          clearUser();
          navigate("/login");
        }
      }
    };

    fetchUserInfo();

    return () => {
      isMounted = false; // cleanup
    };
  }, [user, updateUser, clearUser, navigate]);
};
