import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuPencil } from 'react-icons/lu';
import { SIDE_MENU_DATA } from '../../utils/data';
import { UserContext } from '../../context/UserContext.jsx';
import CharAvatar from '../../components/Cards/CharAvatar.jsx';
import EditProfileModal from '../EditProfileModal';

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleClick = (route) => {
    if (route === "/logout") {
      handleLogout();
      return;
    }
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/login");
  };

  return (
    <>
      <div className='w-64 h-full lg:h-[calc(100dvh-61px)] bg-white dark:bg-slate-800 border-r border-gray-200/50 dark:border-slate-700 p-5 lg:sticky lg:top-[69px] z-20 overflow-y-auto transition-all duration-300'>
        <div className='flex flex-col items-center justify-center gap-3 mt-3 mb-7 relative'>
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile"
              className='w-20 h-20 bg-slate-400 rounded-full object-cover'
            />
          ) : (
            <CharAvatar
              fullname={user?.fullname || ""}
              width="w-20"
              height="h-20"
              style="text-xl"
            />
          )}

          <h5 className='text-gray-950 dark:text-gray-100 font-medium leading-6'>
            {user?.fullname || ""}
          </h5>

          <button
            onClick={() => setShowEditProfile(true)}
            className='flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer transition-colors'
          >
            <LuPencil className="text-sm" />
            Edit Profile
          </button>
        </div>

        {SIDE_MENU_DATA.map((item, index) => (
          <button
            key={`menu_${index}`}
            className={`w-full flex items-center gap-4 text-[15px] cursor-pointer py-3 px-6 rounded-lg mb-3 transition-all duration-200 text-left ${activeMenu === item.label
              ? "text-white bg-primary"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            onClick={() => handleClick(item.path)}
          >
            <item.icon className="text-xl" />
            {item.label}
          </button>
        ))}
      </div>

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </>
  );
};

export default SideMenu;
