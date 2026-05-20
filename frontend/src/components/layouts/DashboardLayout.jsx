import React, { useContext } from 'react';
import SideMenu from './SideMenu';
import { UserContext } from '../../context/UserContext.jsx';
import Navbar from './Navbar';

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
          <div className='grow mx-5 my-5'>{children}</div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
