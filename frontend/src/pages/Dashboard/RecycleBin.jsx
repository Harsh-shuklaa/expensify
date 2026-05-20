import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import { LuRotateCcw, LuTrash2 } from "react-icons/lu";
import Modal from "../../components/Modal";
import DeleteAlert from "../../components/DeleteAlert";

const RecycleBin = () => {
  useUserAuth();
  const [deletedIncome, setDeletedIncome] = useState([]);
  const [deletedExpense, setDeletedExpense] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permanentDeleteAlert, setPermanentDeleteAlert] = useState({
    show: false,
    type: null,
    id: null,
  });

  const fetchDeletedItems = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Fetch independently so one failure doesn't block the other
      const [incomeResult, expenseResult] = await Promise.allSettled([
        axiosInstance.get(API_PATHS.INCOME.GET_DELETED_INCOME),
        axiosInstance.get(API_PATHS.EXPENSE.GET_DELETED_EXPENSE),
      ]);

      if (incomeResult.status === "fulfilled") {
        setDeletedIncome(incomeResult.value?.data?.data || []);
      } else {
        console.error("Error fetching deleted income:", incomeResult.reason?.response?.data || incomeResult.reason?.message);
      }

      if (expenseResult.status === "fulfilled") {
        setDeletedExpense(expenseResult.value?.data?.data || []);
      } else {
        console.error("Error fetching deleted expenses:", expenseResult.reason?.response?.data || expenseResult.reason?.message);
      }

      if (incomeResult.status === "rejected" && expenseResult.status === "rejected") {
        toast.error("Failed to load Archived Transactions");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Failed to load Archived Transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type, id) => {
    try {
      if (type === "income") {
        await axiosInstance.post(API_PATHS.INCOME.RESTORE_INCOME(id));
      } else {
        await axiosInstance.post(API_PATHS.EXPENSE.RESTORE_EXPENSE(id));
      }
      toast.success(`${type === "income" ? "Income" : "Expense"} restored successfully`);
      fetchDeletedItems();
    } catch (error) {
      console.error("Error restoring item:", error);
      toast.error("Failed to restore item");
    }
  };

  const handlePermanentDelete = async () => {
    const { type, id } = permanentDeleteAlert;
    try {
      if (type === "income") {
        await axiosInstance.delete(API_PATHS.INCOME.PERMANENT_DELETE_INCOME(id));
      } else {
        await axiosInstance.delete(API_PATHS.EXPENSE.PERMANENT_DELETE_EXPENSE(id));
      }
      toast.success("Permanently deleted");
      setPermanentDeleteAlert({ show: false, type: null, id: null });
      fetchDeletedItems();
    } catch (error) {
      console.error("Error permanently deleting:", error);
      toast.error("Failed to permanently delete");
    }
  };

  useEffect(() => {
    fetchDeletedItems();
    return () => { };
  }, []);

  const allItems = [
    ...deletedIncome.map((item) => ({ ...item, type: "income", label: item.source })),
    ...deletedExpense.map((item) => ({ ...item, type: "expense", label: item.category })),
  ].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

  return (
    <DashboardLayout activeMenu="Archived Transactions">
      <div className="my-5 mx-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h5 className="text-lg font-medium dark:text-white">Archived Transactions</h5>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Deleted items are kept here for recovery. Permanently delete items you no longer need.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
          ) : allItems.length === 0 ? (
            <div className="text-center py-16">
              <LuTrash2 className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Archived Transactions is empty</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Deleted income and expense items will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allItems.map((item) => (
                <div
                  key={`${item.type}-${item._id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-600">
                      {item.icon ? (
                        <img src={item.icon} alt={item.label} className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {item.label?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === "income"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          }`}>
                          {item.type === "income" ? "Income" : "Expense"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ${item.amount} · Deleted {moment(item.deletedAt).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(item.type, item._id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      <LuRotateCcw className="text-sm" />
                      Restore
                    </button>
                    <button
                      onClick={() => setPermanentDeleteAlert({ show: true, type: item.type, id: item._id })}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      <LuTrash2 className="text-sm" />
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          isOpen={permanentDeleteAlert.show}
          onClose={() => setPermanentDeleteAlert({ show: false, type: null, id: null })}
          title="Permanent Delete"
        >
          <DeleteAlert
            content="This action cannot be undone. Are you sure you want to permanently delete this item?"
            onDelete={handlePermanentDelete}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default RecycleBin;
