import React, { useContext, useState, useEffect } from 'react';
import SideMenu from './SideMenu';
import { UserContext } from '../../context/UserContext.jsx';
import Navbar from './Navbar';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LuPlus, LuWallet, LuHandCoins, LuLayoutDashboard, LuWalletMinimal, LuCircleHelp, LuSettings, LuX } from 'react-icons/lu';
import Modal from '../Modal';
import AddIncomeForm from '../Income/AddIncomeForm';
import AddExpenseForm from '../Expense/AddExpneseForm';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mobile Quick Action FAB states
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Track sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = () => {
      setSidebarCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  // Quick Action: Add Income
  const handleAddIncome = async (income) => {
    const { source, amount, date, icon } = income;
    if (!source.trim() || !amount || isNaN(amount) || Number(amount) <= 0 || !date) {
      toast.error("Please fill all fields with valid data.");
      return;
    }

    try {
      const payload = { source, amount: Number(amount), date, icon };
      await axiosInstance.post(API_PATHS.INCOME.ADD_INCOME, payload);
      toast.success("Income added successfully");
      setShowIncomeModal(false);
      
      // Dispatch global refresh event
      window.dispatchEvent(new Event('transaction-added'));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add income");
    }
  };

  // Quick Action: Add Expense
  const handleAddExpense = async (expense) => {
    const { category, amount, date, icon } = expense;
    if (!category.trim() || !amount || isNaN(amount) || Number(amount) <= 0 || !date) {
      toast.error("Please fill all fields with valid data.");
      return;
    }

    try {
      const payload = { category, amount: Number(amount), date, icon };
      await axiosInstance.post(API_PATHS.EXPENSE.ADD_EXPENSE, payload);
      toast.success("Expense added successfully");
      setShowExpenseModal(false);
      
      // Dispatch global refresh event
      window.dispatchEvent(new Event('transaction-added'));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add expense");
    }
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: LuLayoutDashboard },
    { label: "Income", path: "/income", icon: LuWalletMinimal },
    { label: "Expense", path: "/expense", icon: LuHandCoins },
    { label: "Support", path: "/support", icon: LuCircleHelp },
    { label: "Settings", path: "/settings", icon: LuSettings }
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f8f9fc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20 lg:pb-0">
      <Navbar activeMenu={activeMenu} />

      {user && (
        <div className="flex">
          {/* Desktop Left Sidebar (hidden on mobile) */}
          <div className="hidden lg:block shrink-0 transition-all duration-300">
            <SideMenu activeMenu={activeMenu} />
          </div>

          {/* Main Content Area */}
          <div 
            className={`grow min-w-0 overflow-x-hidden mx-4 my-5 lg:mx-8 lg:my-6 flex flex-col justify-between min-h-[calc(100vh-130px)] transition-all duration-300`}
          >
            <div className="grow animate-fade-in">{children}</div>
            
            {/* Desktop Footer (hidden on mobile) */}
            <footer className="hidden lg:flex mt-12 pt-6 pb-2 border-t border-slate-200/50 dark:border-slate-800/80 items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <p>&copy; {new Date().getFullYear()} Expensify. All rights reserved.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 justify-center">
                <Link to="/privacy-policy" className="hover:underline hover:text-primary transition-colors">Privacy Policy</Link>
                <Link to="/terms-of-service" className="hover:underline hover:text-primary transition-colors">Terms of Service</Link>
                <Link to="/cookie-policy" className="hover:underline hover:text-primary transition-colors">Cookie Policy</Link>
                <Link to="/data-disclosure" className="hover:underline hover:text-primary transition-colors">Data Disclosure</Link>
                <Link to="/account-deletion-policy" className="hover:underline hover:text-primary transition-colors">Account Deletion Policy</Link>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (hidden on desktop) */}
      {user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/50 dark:border-slate-800/80 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg">
          {/* Left Tabs */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center gap-0.5 py-1 text-center cursor-pointer transition-colors ${
              location.pathname === '/dashboard' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <LuLayoutDashboard size={20} />
            <span className="text-[10px] font-semibold">Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate('/income')}
            className={`flex flex-col items-center gap-0.5 py-1 text-center cursor-pointer transition-colors ${
              location.pathname === '/income' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <LuWalletMinimal size={20} />
            <span className="text-[10px] font-semibold">Income</span>
          </button>

          {/* Center FAB Spacer */}
          <div className="w-12 h-12 relative flex items-center justify-center -mt-5">
            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className={`w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 cursor-pointer z-50 transition-all duration-300 ${
                showFabMenu ? 'rotate-45' : ''
              }`}
            >
              <LuPlus size={24} />
            </button>

            {/* Quick Actions Drawer Overlay */}
            {showFabMenu && (
              <>
                <div 
                  className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-40" 
                  onClick={() => setShowFabMenu(false)}
                />
                <div className="absolute bottom-16 bg-white dark:bg-slate-800 rounded-2xl p-2.5 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-1 w-36 z-50 animate-fade-in left-1/2 -translate-x-1/2">
                  <button
                    onClick={() => {
                      setShowFabMenu(false);
                      setShowIncomeModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-xl cursor-pointer transition-colors"
                  >
                    <LuWallet size={16} />
                    Add Income
                  </button>
                  <button
                    onClick={() => {
                      setShowFabMenu(false);
                      setShowExpenseModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer transition-colors"
                  >
                    <LuHandCoins size={16} />
                    Add Expense
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Tabs */}
          <button
            onClick={() => navigate('/expense')}
            className={`flex flex-col items-center gap-0.5 py-1 text-center cursor-pointer transition-colors ${
              location.pathname === '/expense' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <LuHandCoins size={20} />
            <span className="text-[10px] font-semibold">Expense</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className={`flex flex-col items-center gap-0.5 py-1 text-center cursor-pointer transition-colors ${
              location.pathname === '/settings' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <LuSettings size={20} />
            <span className="text-[10px] font-semibold">Settings</span>
          </button>
        </div>
      )}

      {/* Global Add Modals */}
      <Modal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        title="Add Income"
      >
        <AddIncomeForm onAddIncome={handleAddIncome} />
      </Modal>

      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Add Expense"
      >
        <AddExpenseForm onAddExpense={handleAddExpense} />
      </Modal>
    </div>
  );
};

export default DashboardLayout;
