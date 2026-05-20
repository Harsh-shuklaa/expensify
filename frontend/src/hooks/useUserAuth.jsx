import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import axiosInctance from "../utils/axiosInstance"
import {API_PATHS}  from "../utils/apiPaths"



export const useUserAuth = () => {
  const { user, updateUser, clearUser } = useContext(UserContext); // ❌ 'cleanUser' → ✅ 'clearUser'
  const navigate = useNavigate();

  useEffect(() => {
    if (user) return; // ✅ If user already exists, no need to fetch

    let isMounted = true;

    const fetchUserInfo = async () => {
      try {
        const response = await axiosInctance.get(API_PATHS.AUTH.GET_USER_INFO);

        if (isMounted && response.data) {
          updateUser(response.data);
        }
      } catch (err) {
        console.log("Failed to fetch user info:", err);
        if (isMounted) {
          clearUser(); // ✅ was 'cleanUser', now corrected
          navigate("/login");
        }
      }
    };

    fetchUserInfo();

    return () => {
      isMounted = false; // cleanup
    };
  }, [user, updateUser, clearUser, navigate]); // ✅ added 'user' in dependency array
};
