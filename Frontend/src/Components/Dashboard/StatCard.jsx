import React from 'react';

const StatCard = ({ title, value, trend, trendLabel, trendColor }) => {
  return (
    <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col justify-between">
      <p className="text-gray-500 text-[13px] font-medium mb-2">{title}</p>
      <h2 className="text-3xl font-bold text-slate-800 mb-4">{value}</h2>
      {trend && trendLabel && (
        <div className="flex items-center gap-2">
          <span className={`${trendColor || 'bg-blue-500'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>
            {trend}
          </span>
          <span className="text-gray-400 text-[11px] font-medium">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
