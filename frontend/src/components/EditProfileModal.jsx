import React, { useState, useContext, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Inputs/Input";
import ProfilePhotoSelector from "./Inputs/ProfilePhotoSelector";
import { UserContext } from "../context/UserContext";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import uploadImage from "../utils/uploadImage";
import toast from "react-hot-toast";

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useContext(UserContext);
  const [fullname, setFullname] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFullname(user.fullname || "");
      setProfilePic(null);
      setCurrentPassword("");
      setNewPassword("");
      setChangePasswordMode(false);
    }
  }, [isOpen, user]);

  const handleUpdateProfile = async () => {
    if (!fullname.trim()) {
      toast.error("Name is required.");
      return;
    }

    setLoading(true);
    try {
      let profileImageUrl = user?.profileImageUrl || "";

      // Upload new image if selected
      if (profilePic) {
        try {
          const imgUploadRes = await uploadImage(profilePic);
          profileImageUrl = imgUploadRes.imageUrl || profileImageUrl;
        } catch (err) {
          console.error("Image upload failed:", err);
          toast.error("Image upload failed, but saving other changes...");
        }
      }

      const response = await axiosInstance.patch(API_PATHS.AUTH.UPDATE_PROFILE, {
        fullname: fullname.trim(),
        profileImageUrl,
      });

      if (response.data?.user) {
        updateUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("Profile updated successfully");
      } else {
        // Fallback: manually update with what we sent
        const updatedUser = { ...user, fullname: fullname.trim(), profileImageUrl };
        updateUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Profile updated");
      }

      // Change password if fields are filled
      if (changePasswordMode && currentPassword && newPassword) {
        await axiosInstance.patch(API_PATHS.AUTH.CHANGE_PASSWORD, {
          currentPassword,
          newPassword,
        });
        toast.success("Password changed successfully");
      }

      onClose();
    } catch (error) {
      console.error("Profile update error:", error.response?.data || error.message);
      const msg = error.response?.data?.message || "Error updating profile";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        <ProfilePhotoSelector
          image={profilePic}
          setImage={setProfilePic}
          existingImageUrl={user?.profileImageUrl}
        />

        <Input
          type="text"
          value={fullname}
          onChange={({ target }) => setFullname(target.value)}
          label="Full Name"
          placeholder="Your name"
        />

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
          <button
            type="button"
            onClick={() => setChangePasswordMode(!changePasswordMode)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer transition-colors"
          >
            {changePasswordMode ? "Cancel Password Change" : "Change Password"}
          </button>

          {changePasswordMode && (
            <div className="mt-3 space-y-2">
              <Input
                type="password"
                value={currentPassword}
                onChange={({ target }) => setCurrentPassword(target.value)}
                label="Current Password"
                placeholder="Enter current password"
              />
              <Input
                type="password"
                value={newPassword}
                onChange={({ target }) => setNewPassword(target.value)}
                label="New Password"
                placeholder="Min 8 characters"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            className="add-btn add-btn-fill"
            onClick={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditProfileModal;
