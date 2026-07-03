import React, { useState, useContext, useEffect } from 'react';
import { HiOutlineMenuAlt1 } from 'react-icons/hi';
import { LuSun, LuMoon, LuBell, LuX, LuLayoutDashboard, LuWalletMinimal, LuHandCoins, LuTrash2, LuCircleHelp, LuSettings, LuLogOut, LuPencil } from 'react-icons/lu';
import { ThemeContext } from '../../context/ThemeContext';
import { UserContext } from '../../context/UserContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { trackEvent } from '../../utils/analytics';
import CharAvatar from '../Cards/CharAvatar.jsx';
import LOGO from '../../assets/images/logo.png';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LuLayoutDashboard, path: '/dashboard' },
  { label: 'Income', icon: LuWalletMinimal, path: '/income' },
  { label: 'Expense', icon: LuHandCoins, path: '/expense' },
  { label: 'Archived', icon: LuTrash2, path: '/recycle-bin' },
  { label: 'Support', icon: LuCircleHelp, path: '/support' },
  { label: 'Settings', icon: LuSettings, path: '/settings' },
];

const Navbar = ({ activeMenu }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const handleNav = (path) => {
    closeDrawer();
    navigate(path);
  };

  const handleLogout = () => {
    closeDrawer();
    trackEvent('logout', 'Authentication');
    localStorage.clear();
    clearUser();
    navigate('/login');
  };

  return (
    <>
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 border-b border-gray-200/50 dark:border-slate-800 backdrop-blur-md py-3.5 px-4 sticky top-0 z-50 transition-all duration-300">
        {/* Hamburger — mobile only */}
        <button
          className="block lg:hidden p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <HiOutlineMenuAlt1 className="text-xl" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={LOGO} alt="Expensify" className="w-7 h-7 rounded-lg shadow-sm" />
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Expensify</h2>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
            title="Notifications"
          >
            <LuBell size={16} />
          </button>
          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-yellow-400 cursor-pointer transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <LuSun size={16} /> : <LuMoon size={16} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      {/* Drawer Panel — slides in from left */}
      <div
        className={`fixed top-0 left-0 h-full z-[70] lg:hidden flex flex-col bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 'min(80vw, 280px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Expensify" className="w-6 h-6 rounded-md" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">Expensify</span>
          </div>
          <button
            onClick={closeDrawer}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <LuX size={16} />
          </button>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="shrink-0">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <CharAvatar
                    fullname={user?.fullname || ''}
                    width="w-10"
                    height="h-10"
                    style="text-sm"
                  />
                )}
              </div>
              {/* Name + Email */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.fullname || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleNav('/settings')}
              className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary-dark cursor-pointer transition-colors"
            >
              <LuPencil size={11} />
              Edit Profile
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
              const isActive = location.pathname === path || activeMenu === label;
              return (
                <button
                  key={path}
                  onClick={() => handleNav(path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-primary text-white shadow-sm shadow-primary/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={17} className={isActive ? 'opacity-100' : 'opacity-70'} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Footer */}
        <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
          >
            <LuLogOut size={17} />
            Logout
          </button>
          <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-3 font-medium tracking-wider uppercase">
            Expensify © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
};

export default Navbar;