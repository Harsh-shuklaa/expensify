import React, { useState, useContext, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Input from '../../components/Inputs/Input';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import { UserContext } from '../../context/UserContext';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import uploadImage from '../../utils/uploadImage';
import toast from 'react-hot-toast';
import { trackEvent, initGA } from '../../utils/analytics';
import { LuUser, LuKey, LuCookie, LuDatabase } from 'react-icons/lu';
import { useUserAuth } from '../../hooks/useUserAuth';

const Settings = () => {
  useUserAuth();
  const { user, updateUser } = useContext(UserContext);
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [profilePic, setProfilePic] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  // Cookie preference state
  const [allowCookies, setAllowCookies] = useState(false);

  useEffect(() => {
    if (user) {
      setFullname(user.fullname || '');
    }
    const consent = localStorage.getItem('cookieConsent');
    setAllowCookies(consent === 'accepted');
  }, [user]);

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
    } catch (error) {
      console.error("Profile update error:", error.response?.data || error.message);
      const msg = error.response?.data?.message || "Error updating profile";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCookieToggle = (e) => {
    const checked = e.target.checked;
    setAllowCookies(checked);
    if (checked) {
      localStorage.setItem('cookieConsent', 'accepted');
      initGA();
      toast.success("Cookies & analytics enabled.");
      trackEvent('cookie_consent_accepted', 'Settings');
    } else {
      localStorage.setItem('cookieConsent', 'declined');
      toast.success("Cookies & analytics disabled.");
      trackEvent('cookie_consent_declined', 'Settings');
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
    <DashboardLayout activeMenu="Settings">
      <div className="my-5 mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings & Control Panel</h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
          Manage your personal details, secure login password, cookie consents, and GDPR data portability rights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Details */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 text-sm">
              <LuUser className="text-primary text-base" /> Profile Information
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <ProfilePhotoSelector
                image={profilePic}
                setImage={setProfilePic}
                existingImageUrl={user?.profileImageUrl}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  value={fullname}
                  onChange={({ target }) => setFullname(target.value)}
                  label="Full Name"
                  placeholder="Your name"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    className="w-full text-xs px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setChangePasswordMode(!changePasswordMode)}
                  className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer font-medium transition-colors"
                >
                  <LuKey /> {changePasswordMode ? "Cancel Password Change" : "Change Login Password"}
                </button>

                {changePasswordMode && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
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
                    <div className="col-span-1 md:col-span-2">
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={({ target }) => setConfirmPassword(target.value)}
                        label="Confirm New Password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-xs font-semibold text-white rounded-lg shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {loading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Privacy & Compliance */}
          <div className="flex flex-col gap-6">
            {/* Cookie Controls */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 text-sm">
                <LuCookie className="text-primary text-base" /> Cookie Preferences
              </h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Allow analytics cookies to help us track dashboard engagement and report errors. Essential cookies remain active.
              </p>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Enable Google Analytics
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCookies}
                    onChange={handleCookieToggle}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {/* GDPR Controls */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 text-sm">
                <LuDatabase className="text-primary text-base" /> Data Rights & Erasure
              </h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Under GDPR/CCPA, you can request a file containing all your financial entries or permanently erase your profile logs.
              </p>

              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full text-center px-4 py-2 border border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 cursor-pointer transition-colors"
                >
                  Export Data Packages (JSON)
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="w-full text-center px-4 py-2 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                >
                  Delete Account Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
