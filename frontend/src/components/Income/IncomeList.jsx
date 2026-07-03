import React from 'react';
import { LuDownload, LuPencil, LuTrash2, LuTrendingUp } from 'react-icons/lu';
import TransactionInfoCard from '../Cards/TransactionInfoCard';
import moment from 'moment';

const IncomeList = ({ transactions, onDelete, onDownload, onEdit }) => {
  return (
    <div className="card shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
        <div>
          <h5 className="text-base font-bold text-slate-900 dark:text-white">Income Sources</h5>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Track your regular and freelancing earnings</p>
        </div>
        <button className="card-btn flex items-center gap-1.5 text-xs self-start sm:self-auto" onClick={onDownload}>
          <LuDownload size={14} /> Download Report
        </button>
      </div>

      {/* DESKTOP VIEW: Advanced Data Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/60">
              <th className="pb-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Source</th>
              <th className="pb-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</th>
              <th className="pb-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Amount</th>
              <th className="pb-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
            {transactions?.map((income) => (
              <tr key={income._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 group transition-colors">
                <td className="py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center text-lg">
                    {income.icon ? (
                      income.icon.startsWith("http") || income.icon.startsWith("/") ? (
                        <img src={income.icon} alt={income.source} className="w-5 h-5" />
                      ) : (
                        <span>{income.icon}</span>
                      )
                    ) : (
                      <LuTrendingUp size={16} />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{income.source}</span>
                </td>
                <td className="py-3.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {moment(income.date).format("DD MMM YYYY")}
                </td>
                <td className="py-3.5 text-sm font-bold text-green-600 dark:text-green-400 text-right">
                  +₹{income.amount}
                </td>
                <td className="py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(income)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <LuPencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(income._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!transactions || transactions.length === 0) && (
              <tr>
                <td colSpan="4" className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                  No income sources recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW: Transaction Cards */}
      <div className="md:hidden flex flex-col gap-1.5">
        {transactions?.map((income) => (
          <TransactionInfoCard
            key={income._id}
            title={income.source}
            icon={income.icon}
            date={moment(income.date).format("DD MMM YYYY")}
            amount={income.amount}
            type="income"
            onDelete={() => onDelete(income._id)}
            onEdit={() => onEdit(income)}
          />
        ))}
        {(!transactions || transactions.length === 0) && (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            No income sources recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeList;
