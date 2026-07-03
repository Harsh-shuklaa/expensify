import React, { useContext, useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/UserContext.jsx';
import { useUserAuth } from '../../hooks/useUserAuth';
import Input from '../../components/Inputs/Input';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import uploadImage from '../../utils/uploadImage';
import toast from 'react-hot-toast';
import { LuKey, LuUser, LuShieldAlert, LuBinary, LuUpload, LuDownload, LuTrash2, LuSave } from 'react-icons/lu';

const Settings = () => {
  useUserAuth();
  const { user, updateUser, clearUser } = useContext(UserContext);
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(user?.profileImageUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  
  // Cookie preference state
  const [allowCookies, setAllowCookies] = useState(() => {
    return localStorage.getItem('allow-cookies') === 'true';
  });

  useEffect(() => {
    if (user) {
      setFullname(user.fullname || '');
      setProfilePicPreview(user.profileImageUrl || '');
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
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
      
      // Save cookie preference
      localStorage.setItem('allow-cookies', allowCookies);
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
      toast.success("Data exported successfully", { id: "export-toast" });
    } catch (error) {
      console.error("Data export failed:", error);
      toast.error("Failed to export compliance data", { id: "export-toast" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? This permanently deletes your profile and all transaction history. This cannot be undone.")) {
      return;
    }
    try {
      await axiosInstance.delete(API_PATHS.AUTH.DELETE_ACCOUNT);
      toast.success("Account deleted successfully.");
      localStorage.clear();
      clearUser();
      window.location.href = '/login';
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
    }
  };

  return (
    <DashboardLayout activeMenu="Settings">
      <div className="max-w-4xl mx-auto my-3 pb-24 lg:pb-0">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          
          {/* Section 1: Personal Information Card */}
          <div className="card shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <LuUser className="text-primary text-lg" />
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">Personal Information</h5>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Avatar Upload Area */}
              <div className="relative group/upload w-24 h-24 shrink-0 cursor-pointer">
                {profilePicPreview ? (
                  <img
                    src={profilePicPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    {fullname?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center rounded-full opacity-0 group-hover/upload:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-medium">
                  <LuUpload size={16} className="mb-1" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Form Inputs */}
              <div className="grow w-full space-y-4">
                <Input
                  type="text"
                  value={fullname}
                  onChange={({ target }) => setFullname(target.value)}
                  label="Display Name"
                  placeholder="Enter full name"
                />
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Email Address (Linked & Verified)
                  </label>
                  <input
                    type="text"
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Password Management Card */}
          <div className="card shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <LuKey className="text-primary text-lg" />
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">Security Credentials</h5>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordMode(!changePasswordMode)}
                className="text-xs font-semibold text-primary hover:text-primary-dark cursor-pointer transition-colors"
              >
                {changePasswordMode ? "Cancel Change" : "Update Password"}
              </button>
            </div>

            {changePasswordMode ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
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
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Password was last updated when account was registered. Change it to secure your login.
              </p>
            )}
          </div>

          {/* Section 3: Privacy & Security (GDPR Compliance) */}
          <div className="card shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <LuShieldAlert className="text-primary text-lg" />
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">Compliance & Account Data</h5>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h6 className="text-xs font-bold text-slate-700 dark:text-slate-300">Data Portability & Export</h6>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Request a download of all your transaction entries, logs, and account settings.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <LuDownload size={14} /> Export All JSON
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <h6 className="text-xs font-bold text-red-600">Delete Account & Profile</h6>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Permanently delete your profile, and wipe all financial data from the records.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100/60 dark:hover:bg-red-950/40 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <LuTrash2 size={14} /> Erase My Profile
              </button>
            </div>
          </div>

          {/* Section 4: System Preferences */}
          <div className="card shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <LuBinary className="text-primary text-lg" />
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">System Preferences</h5>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="allow-cookies"
                checked={allowCookies}
                onChange={(e) => setAllowCookies(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary accent-primary cursor-pointer"
              />
              <label htmlFor="allow-cookies" className="cursor-pointer">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Allow Analytics Cookies & Logs</span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Enable Google Analytics tracking codes and locally persistent cache structures to save preference configurations.
                </span>
              </label>
            </div>
          </div>

          {/* Save Button (Fixed to bottom on Mobile, inline on Desktop) */}
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/60 dark:border-slate-800/80 lg:static lg:bg-transparent lg:p-0 lg:border-t-0 z-40 shadow-lg lg:shadow-none">
            <button
              type="submit"
              disabled={loading}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 text-white font-semibold text-xs py-3 px-6 rounded-xl cursor-pointer shadow-md shadow-primary/20 select-none"
            >
              <LuSave size={16} />
              {loading ? "Saving changes..." : "Save Config Profile"}
            </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
