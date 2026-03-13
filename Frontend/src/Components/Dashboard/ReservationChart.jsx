import React, { useState, useEffect } from 'react';

const ReservationChart = ({ chartData = [], labels = [] }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Use provided data or fallback to defaults if empty
  const data = chartData.length > 0 ? chartData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const chartLabels = labels.length > 0 ? labels : Array(12).fill("");

  // Calculate dynamic max height to scale bars properly
  const maxValue = Math.max(...data, 10); // Ensure minimum denominator is 10 to avoid tall zero bars
  const scaleData = data.map(val => (val / maxValue) * 100);

  return (
    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm mb-8 w-full overflow-hidden">
      <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Reservations Created</h3>
      
      <div className="relative h-[250px] w-full min-w-[500px]">
        {/* Y-Axis Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-full border-t border-gray-100 h-0"></div>
          ))}
          <div className="w-full border-t border-gray-300 h-0"></div>
        </div>

        <div className="relative h-full w-full flex items-end justify-around px-2 z-10">
          {scaleData.map((height, i) => (
            <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end min-w-[30px]">
              
              <div
                style={{ 
                  height: loaded ? `${height}%` : '0%',
                  transitionDelay: `${i * 50}ms` 
                }}
                className={`w-[60%] max-w-[40px] bg-[#db6176] rounded-t-[2px] cursor-pointer 
                  transition-all duration-700 ease-out hover:bg-[#c44d62]`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded px-2 py-1 pointer-events-none z-50">
                  {data[i]}
                </div>
              </div>
              
              <div className="absolute -bottom-6 w-full text-center">
                <span className="text-[9px] md:text-[10px] text-gray-400 whitespace-nowrap">
                  {chartLabels[i]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-12 text-[10px] font-bold uppercase text-gray-500 tracking-widest">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#db6176] rounded-sm"></span> 
          New Bookings
        </div>
      </div>
    </div>
  );
};

export default ReservationChart;
