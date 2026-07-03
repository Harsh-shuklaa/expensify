import React, { useEffect, useState, useContext, useRef } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout.jsx";
import { useUserAuth } from "../../hooks/useUserAuth.jsx";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "../../utils/apiPaths.js";
import axiosInstance from "../../utils/axiosInstance.js";
import { LuHandCoins, LuWalletMinimal } from "react-icons/lu";
import { IoMdCard } from "react-icons/io";
import { addThousandsSeparator } from "../../utils/helper.js";
import RecentTransactions from "../../components/Dashboard/RecentTransactions.jsx";
import FinanceOverview from "../../components/Dashboard/FinanceOverview";
import Last30DaysExpenses from "../../components/Dashboard/Last30DaysExpenses.jsx";
import RecentIncomeWithChart from "../../components/Dashboard/RecentIncomeWithChart.jsx";
import RecentIncome from "../../components/Dashboard/RecentIncome.jsx";
import ExpenseTransactions from "../../components/Dashboard/ExpenseTransactions.jsx";
import { UserContext } from "../../context/UserContext.jsx";
import moment from "moment";

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const carouselRef = useRef(null);

  const fetchDashboardData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA);
      if (response.data) setDashboardData(response.data);
    } catch (error) {
      console.log("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleRefresh = () => fetchDashboardData();
    window.addEventListener("transaction-added", handleRefresh);
    return () => window.removeEventListener("transaction-added", handleRefresh);
  }, []);

  // Track which card is active via scroll position
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const cardWidth = el.scrollWidth / 3;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveCard(Math.min(2, Math.max(0, idx)));
  };

  const cards = [
    {
      label: "Total Balance",
      value: dashboardData?.totalBalance || 0,
      icon: <IoMdCard size={20} />,
      iconBg: "bg-primary/15 text-primary",
      gradient: "from-violet-500/10 via-purple-400/5 to-white",
      textColor: "text-primary",
      sub: "Available funds across accounts",
    },
    {
      label: "Total Income",
      value: dashboardData?.totalIncome || 0,
      icon: <LuWalletMinimal size={20} />,
      iconBg: "bg-green-500/15 text-green-600",
      gradient: "from-green-400/10 via-emerald-300/5 to-white",
      textColor: "text-green-600",
      sub: "Received earnings this period",
    },
    {
      label: "Total Expenses",
      value: dashboardData?.totalExpense || 0,
      icon: <LuHandCoins size={20} />,
      iconBg: "bg-red-500/15 text-red-500",
      gradient: "from-red-400/10 via-rose-300/5 to-white",
      textColor: "text-red-500",
      sub: "Spent funds across categories",
    },
  ];

  return (
    <DashboardLayout activeMenu="Dashboard">
      {/* Root: absolutely no horizontal overflow */}
      <div
        className="w-full overflow-x-hidden"
        style={{ maxWidth: "100%", boxSizing: "border-box" }}
      >
        {/* ── Welcome Banner ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl px-5 py-4 mb-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
              Welcome back, {user?.fullname || "User"}!
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Here is your financial overview for today.
            </p>
          </div>
          <p className="hidden md:block text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0 mt-1">
            {moment().format("ddd, MMM Do YYYY")}
          </p>
        </div>

        {/* ── Summary Cards — SNAP CAROUSEL on mobile, 3-col grid on lg+ ── */}
        {/* On mobile: negative margin to escape the parent padding, then re-add padding as gap  */}
        <div className="mb-5">
          {/* Mobile: horizontal snap scroll */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex lg:hidden gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {cards.map((card, i) => (
              <div
                key={i}
                className={`snap-center shrink-0 bg-gradient-to-br ${card.gradient} dark:from-slate-800 dark:to-slate-900 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm`}
                style={{ width: "calc(100vw - 80px)", minWidth: "260px" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${card.textColor}`}>
                    {card.label}
                  </span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{addThousandsSeparator(card.value)}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Carousel Dots — mobile only */}
          <div className="flex lg:hidden justify-center gap-1.5 mt-2.5">
            {cards.map((_, i) => (
              <span
                key={i}
                className={`inline-block h-1.5 rounded-full transition-all duration-300 ${
                  activeCard === i ? "w-5 bg-primary" : "w-1.5 bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Desktop: 3-column grid */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-5">
            {cards.map((card, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${card.gradient} dark:from-slate-800 dark:to-slate-900 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${card.textColor}`}>
                    {card.label}
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{addThousandsSeparator(card.value)}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Dashboard Sections: single column on mobile, 2-col on lg ── */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-5">

          {/* 1. Financial Overview */}
          <div className="w-full min-w-0 overflow-hidden">
            <FinanceOverview
              totalBalance={dashboardData?.totalBalance || 0}
              totalIncome={dashboardData?.totalIncome || 0}
              totalExpense={dashboardData?.totalExpense || 0}
            />
          </div>

          {/* 2. Recent Transactions */}
          <div className="w-full min-w-0 overflow-hidden">
            <RecentTransactions
              transactions={dashboardData?.recentTransactions}
              onSeeMore={() => navigate("/expense")}
            />
          </div>

          {/* 3. Income Chart */}
          <div className="w-full min-w-0 overflow-hidden">
            <RecentIncomeWithChart
              data={dashboardData?.last60DaysIncome?.transactions?.slice(0, 4) || []}
              totalIncome={dashboardData?.totalIncome || 0}
            />
          </div>

          {/* 4. Recent Income List */}
          <div className="w-full min-w-0 overflow-hidden">
            <RecentIncome
              transactions={dashboardData?.last60DaysIncome?.transactions || []}
              onSeeMore={() => navigate("/income")}
            />
          </div>

          {/* 5. Expense Chart */}
          <div className="w-full min-w-0 overflow-hidden">
            <Last30DaysExpenses
              data={dashboardData?.last30DaysExpenses?.transactions || []}
            />
          </div>

          {/* 6. Recent Expenses List */}
          <div className="w-full min-w-0 overflow-hidden">
            <ExpenseTransactions
              transactions={dashboardData?.last30DaysExpenses?.transactions || []}
              onSeeMore={() => navigate("/expense")}
            />
          </div>

          {/* 7. Quick Actions */}
          <div className="w-full min-w-0 overflow-hidden">
            <div className="card h-full">
              <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Quick Actions</h5>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                Fast navigation to key sections.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: "💰", label: "Manage Income", path: "/income" },
                  { emoji: "💸", label: "Manage Expense", path: "/expense" },
                  { emoji: "🗑️", label: "Recycle Bin", path: "/recycle-bin" },
                  { emoji: "⚙️", label: "Settings", path: "/settings" },
                ].map(({ emoji, label, path }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-center transition-colors cursor-pointer"
                  >
                    <span className="text-xl mb-1">{emoji}</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 8. Support Widget */}
          <div className="w-full min-w-0 overflow-hidden">
            <div className="card flex flex-col h-full">
              <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Need Assistance?</h5>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed flex-1">
                Have questions, found a bug, or want to suggest new features? Reach out to our
                support team directly.
              </p>
              <button
                onClick={() => navigate("/support")}
                className="mt-5 w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Contact Support
              </button>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
