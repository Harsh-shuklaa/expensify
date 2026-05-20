import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

const CustomBarChart = ({ data }) => {
  const getBarColor = (index) => {
    return index % 2 === 0 ? "#875cf5" : "#cfbefb";
  };

  const CustomerTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-white dark:bg-slate-800 shadow-md rounded-lg p-2 border border-gray-300 dark:border-slate-600'>
          <p className='text-xs font-semibold text-purple-800 dark:text-purple-400 mb-1'>{payload[0].payload.source}</p>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            Amount: <span className='text-sm font-medium text-gray-900 dark:text-white'>${payload[0].payload.amount}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='mt-6 h-[300px]'>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke='none' />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} stroke='none' />
          <YAxis tick={{ fontSize: 12, fill: "#888" }} stroke='none' />
          <Tooltip content={CustomerTooltip} />
          <Bar
            dataKey="amount"
            fill='#FF8042'
            radius={[10, 10, 0, 0]}
            animationDuration={800}
            animationEasing="ease-in-out"
          >
            {(data || []).map((entry, index) => (
              <Cell key={index} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CustomBarChart
