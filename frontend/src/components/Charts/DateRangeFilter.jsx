import React from "react";

const DateRangeFilter = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 cursor-pointer outline-none transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-500"
    >
      <option value={7}>Last 7 Days</option>
      <option value={30}>Last 30 Days</option>
      <option value={60}>Last 60 Days</option>
    </select>
  );
};

export default DateRangeFilter;
