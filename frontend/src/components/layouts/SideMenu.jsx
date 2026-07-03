import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuPencil, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { SIDE_MENU_DATA } from '../../utils/data';
import { UserContext } from '../../context/UserContext.jsx';
import { trackEvent } from '../../utils/analytics';
import CharAvatar from '../../components/Cards/CharAvatar.jsx';
import EditProfileModal from '../EditProfileModal';

const SideMenu = ({ activeMenu, alwaysExpanded = false }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // Collapse state loaded from localStorage or default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (alwaysExpanded) return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Keep state synced if alwaysExpanded changes
  useEffect(() => {
    if (alwaysExpanded) {
      setIsCollapsed(false);
    }
  }, [alwaysExpanded]);

  const toggleCollapse = () => {
    if (alwaysExpanded) return;
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('sidebar-collapsed', nextVal);
    // Dispatch custom event to notify parent containers of sidebar resize
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  const handleClick = (route) => {
    if (route === "/logout") {
      handleLogout();
      return;
    }
    navigate(route);
  };

  const handleLogout = () => {
    trackEvent("logout", "Authentication");
    localStorage.clear();
    clearUser();
    navigate("/login");
  };

  return (
    <>
      <div 
        className={`h-full lg:h-[calc(100dvh-69px)] bg-white/70 dark:bg-slate-900/70 border-r border-gray-200/50 dark:border-slate-800 lg:sticky lg:top-[69px] z-20 flex flex-col justify-between transition-all duration-300 ${
          isCollapsed ? 'w-20 p-3' : 'w-64 p-5'
        }`}
      >
        <div className="flex flex-col gap-1">
          {/* Collapse Toggle Button (Desktop Only) */}
          {!alwaysExpanded && (
            <button 
              onClick={toggleCollapse}
              className="hidden lg:flex ml-auto w-8 h-8 items-center justify-center rounded-lg border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              {isCollapsed ? <LuChevronRight size={18} /> : <LuChevronLeft size={18} />}
            </button>
          )}

          {/* Profile Card Section */}
          <div className={`flex flex-col items-center justify-center gap-2 mt-2 mb-6 relative border-b border-slate-200/40 dark:border-slate-800/40 ${isCollapsed ? 'pb-4' : 'pb-6'}`}>
            <div className="relative group/avatar">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className={`rounded-full object-cover shadow-sm transition-all duration-300 ${
                    isCollapsed ? 'w-10 h-10' : 'w-20 h-20'
                  }`}
                />
              ) : (
                <CharAvatar
                  fullname={user?.fullname || ""}
                  width={isCollapsed ? "w-10" : "w-20"}
                  height={isCollapsed ? "h-10" : "h-20"}
                  style={isCollapsed ? "text-sm" : "text-xl"}
                />
              )}
            </div>

            {!isCollapsed && (
              <>
                <h5 className="text-slate-900 dark:text-slate-100 font-semibold text-sm leading-tight text-center mt-1">
                  {user?.fullname || ""}
                </h5>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                  {user?.email || ""}
                </p>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-dark cursor-pointer mt-1 transition-colors"
                >
                  <LuPencil size={11} />
                  Edit Profile
                </button>
              </>
            )}
          </div>

          {/* Menu Items */}
          <div className="space-y-1.5">
            {SIDE_MENU_DATA.map((item, index) => {
              const isActive = activeMenu === item.label;
              return (
                <button
                  key={`menu_${index}`}
                  className={`w-full flex items-center gap-3.5 cursor-pointer py-2.5 rounded-xl text-sm transition-all duration-200 text-left ${
                    isCollapsed ? 'justify-center px-0' : 'px-4'
                  } ${
                    isActive
                      ? "text-white bg-gradient-to-r from-primary to-purple-600 shadow-md shadow-primary/10"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  onClick={() => handleClick(item.path)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand signature when expanded */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium tracking-wider">
            PREMIUM FINTECH SaaS
          </div>
        )}
      </div>

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </>
  );
};

export default SideMenu;
