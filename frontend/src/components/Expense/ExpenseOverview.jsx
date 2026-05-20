import React, { useEffect, useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { prepareExpenseLineChartData } from '../../utils/helper'
import CustomLineChart from '../Charts/CustomLineChart'
import DateRangeFilter from '../Charts/DateRangeFilter'

const ExpenseOverview = ({ transactions, onExpenseIncome }) => {
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState(30);

  useEffect(() => {
    const now = new Date();
    const filtered = (transactions || []).filter((item) => {
      const itemDate = new Date(item.date);
      const diff = (now - itemDate) / (1000 * 60 * 60 * 24);
      return diff <= range;
    });
    const result = prepareExpenseLineChartData(filtered);
    setChartData(result);
    return () => {};
  }, [transactions, range]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-lg dark:text-white">Expense Overview</h5>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Track your spending trends over time and gain insights into where your money goes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={range} onChange={setRange} />
          <button className="add-btn" onClick={onExpenseIncome}>
            <LuPlus className="text-lg" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="mt-10">
        <CustomLineChart data={chartData} />
      </div>
    </div>
  )
}

export default ExpenseOverview
