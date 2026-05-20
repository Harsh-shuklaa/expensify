import React from 'react';
import CARD2 from "../../assets/images/card2.png";
import LOGO from "../../assets/images/logo.png";
import { LuTrendingUpDown } from 'react-icons/lu';

const StatsInfoCard = ({ icon, label, value, color }) => {
  return (
    <div className='flex gap-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md shadow-purple-400/10 border border-gray-200/50 dark:border-slate-700 z-10 transition-all duration-200'>
      <div className={`w-12 h-12 flex items-center justify-center text-[26px] text-white ${color} rounded-full drop-shadow-xl`}>
        {icon}
      </div>
      <div>
        <h6 className='text-xs text-gray-500 dark:text-gray-400 mb-1'>{label}</h6>
        <span className='text-[20px] dark:text-white'>${value}</span>
      </div>
    </div>
  );
};

const AuthLayout = ({ children }) => {
  return (
    <div className='flex min-h-screen bg-white dark:bg-slate-900'>
      <div className='w-screen h-screen md:w-[60vw] px-12 pt-8 pb-12'>
        <div className="flex items-center gap-2 mb-2">
          <img src={LOGO} alt="Expensify Logo" className="w-8 h-8 rounded-lg" />
          <h2 className='text-lg font-semibold text-black dark:text-white'>Expensify</h2>
        </div>
        {children}
      </div>

      <div className='hidden md:block w-[40vw] h-screen bg-violet-50 dark:bg-slate-800 bg-auth-bd-img bg-cover bg-no-repeat bg-center overflow-hidden p-8 relative'>
        <div className='w-48 h-48 rounded-[48px] bg-purple-600 absolute -top-7 -left-5' />
        <div className='w-48 h-48 rounded-[40px] border-[20px] border-fuchsia-600 absolute top-[20%] right-0'></div>
        <div className='w-48 h-48 rounded-[40px] bg-violet-500 absolute -bottom-7 -left-5'></div>

        <div className='grid grid-cols-1 z-20'>
          <StatsInfoCard
            icon={<LuTrendingUpDown />}
            label="Track Your Income & Expenses"
            value="430,000"
            color="bg-primary"
          />
        </div>

        <img
          src={CARD2}
          className='w-64 lg:w-[90%] absolute bottom-10 shadow-lg shadow-blue-400/15'
          alt="card graphic"
        />
      </div>
    </div>
  );
};

export default AuthLayout;
