import React, { useState, useContext, useEffect } from 'react';
import { HiOutlineMenuAlt1, HiOutlineX } from 'react-icons/hi';
import { LuSun, LuMoon } from 'react-icons/lu';
import SideMenu from './SideMenu';
import { ThemeContext } from '../../context/ThemeContext';
import LOGO from '../../assets/images/logo.png';

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (openSideMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [openSideMenu]);

  return (
    <>
      <div className="flex items-center gap-5 bg-white dark:bg-slate-800 border-b border-gray-200/50 dark:border-slate-700 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-50 transition-all duration-300">
        <button
          className="block lg:hidden text-black dark:text-white"
          onClick={() => setOpenSideMenu(!openSideMenu)}
        >
          {openSideMenu ? (
            <HiOutlineX className="text-2xl cursor-pointer transition-all duration-300" />
          ) : (
            <HiOutlineMenuAlt1 className="text-2xl cursor-pointer transition-all duration-300" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <img src={LOGO} alt="Expensify Logo" className="w-8 h-8 rounded-lg" />
          <h2 className="text-lg font-semibold text-black dark:text-white">Expensify</h2>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-yellow-400 cursor-pointer transition-all duration-300"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <LuSun className="text-lg" /> : <LuMoon className="text-lg" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer — Backdrop + Slide-in SideMenu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${openSideMenu
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop overlay — click to close */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setOpenSideMenu(false)}
        />

        {/* Drawer panel — slides in from left */}
        <div
          className={`absolute top-[69px] left-0 h-[calc(100dvh-69px)] w-64 z-50 bg-white dark:bg-slate-800 shadow-xl overflow-y-auto transition-transform duration-300 ease-in-out ${openSideMenu ? "translate-x-0" : "-translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <SideMenu activeMenu={activeMenu} />
        </div>
      </div>
    </>
  );
};

export default Navbar;