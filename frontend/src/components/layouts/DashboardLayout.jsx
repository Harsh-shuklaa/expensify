import React, { useContext } from 'react';
import SideMenu from './SideMenu';
import { UserContext } from '../../context/UserContext.jsx';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-all duration-300">
      <Navbar activeMenu={activeMenu} />

      {user && (
        <div className='flex'>
          <div className='max-[1080px]:hidden'>
            <SideMenu activeMenu={activeMenu} />
          </div>
          <div className='grow mx-5 my-5 flex flex-col justify-between min-h-[calc(100vh-110px)]'>
            <div className="grow">{children}</div>
            <footer className="mt-8 pt-6 pb-2 border-t border-gray-200/50 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
              <p>&copy; {new Date().getFullYear()} Expensify. All rights reserved.</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                <Link to="/privacy-policy" className="hover:underline hover:text-primary">Privacy Policy</Link>
                <Link to="/terms-of-service" className="hover:underline hover:text-primary">Terms of Service</Link>
                <Link to="/cookie-policy" className="hover:underline hover:text-primary">Cookie Policy</Link>
                <Link to="/data-disclosure" className="hover:underline hover:text-primary">Data Disclosure</Link>
                <Link to="/account-deletion-policy" className="hover:underline hover:text-primary">Account Deletion Policy</Link>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
