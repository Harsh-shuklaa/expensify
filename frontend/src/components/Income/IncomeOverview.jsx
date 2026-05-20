import React, { useEffect, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { prepareIncomeBarChartData } from "../../utils/helper";
import CustomBarChart from "../Charts/CustomBarChart";
import DateRangeFilter from "../Charts/DateRangeFilter";

const IncomeOverview = ({ transactions, onAddIncome }) => {
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState(60);

  useEffect(() => {
    const now = new Date();
    const filtered = (transactions || []).filter((item) => {
      const itemDate = new Date(item.date);
      const diff = (now - itemDate) / (1000 * 60 * 60 * 24);
      return diff <= range;
    });
    const result = prepareIncomeBarChartData(filtered);
    setChartData(result);
    return () => {};
  }, [transactions, range]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-lg dark:text-white">Income Overview</h5>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Track your earnings over time and analyze your income trends.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={range} onChange={setRange} />
          <button className="add-btn" onClick={onAddIncome}>
            <LuPlus className="text-lg" />
            Add Income
          </button>
        </div>
      </div>

      <div className="mt-10">
        <CustomBarChart data={chartData} />
      </div>
    </div>
  );
};

export default IncomeOverview;
