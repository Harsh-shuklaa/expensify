import React, { useState, useContext, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Inputs/Input";
import ProfilePhotoSelector from "./Inputs/ProfilePhotoSelector";
import { UserContext } from "../context/UserContext";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import uploadImage from "../utils/uploadImage";
import toast from "react-hot-toast";
import { trackEvent } from "../utils/analytics";

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useContext(UserContext);
  const [fullname, setFullname] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFullname(user.fullname || "");
      setProfilePic(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangePasswordMode(false);
    }
  }, [isOpen, user]);

  const handleUpdateProfile = async () => {
    if (!fullname.trim()) {
      toast.error("Name is required.");
      return;
    }

    // Validate password change parameters if enabled
    if (changePasswordMode) {
      if (!currentPassword) {
        toast.error("Current password is required.");
        return;
      }
      if (!newPassword) {
        toast.error("New password is required.");
        return;
      }
      if (!confirmPassword) {
        toast.error("Confirm new password is required.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New password and confirm password do not match.");
        return;
      }
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        toast.error("Password must be at least 8 characters long and contain both letters and numbers.");
        return;
      }
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
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePasswordMode(false);
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

  const handleExportData = async () => {
    try {
      toast.loading("Exporting data...", { id: "export-toast" });
      const response = await axiosInstance.get(API_PATHS.AUTH.EXPORT_DATA, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expensify_data_export.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Data exported successfully!", { id: "export-toast" });
      trackEvent('export_data', 'GDPR');
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data", { id: "export-toast" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete your account? This action cannot be undone and all your financial data will be permanently wiped out under GDPR compliance.")) {
      return;
    }

    try {
      toast.loading("Deleting account...", { id: "delete-toast" });
      await axiosInstance.delete(API_PATHS.AUTH.DELETE_ACCOUNT);
      toast.success("Account permanently deleted", { id: "delete-toast" });
      localStorage.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error("Deletion error:", error);
      toast.error("Failed to delete account", { id: "delete-toast" });
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
              <Input
                type="password"
                value={confirmPassword}
                onChange={({ target }) => setConfirmPassword(target.value)}
                label="Confirm New Password"
                placeholder="Confirm new password"
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
          <h6 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">GDPR & Compliance Control</h6>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="px-3 py-1.5 border border-purple-200 dark:border-purple-900/40 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 cursor-pointer transition-colors"
            >
              Export Data (JSON)
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="px-3 py-1.5 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            className="add-btn add-btn-fill animate-hover"
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
