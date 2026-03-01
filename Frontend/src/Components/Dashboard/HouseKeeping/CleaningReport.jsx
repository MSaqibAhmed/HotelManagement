import React from 'react';

const CleaningReport = () => {
  const reportData = [
    { id: '01', name: 'Jimmy', complete: 0, pending: 1, underProcess: 0 },
    { id: '02', name: 'Depa', complete: 0, pending: 0, underProcess: 0 },
    { id: '03', name: 'Moxi', complete: 1, pending: 1, underProcess: 1 },
    { id: '04', name: 'Axa', complete: 0, pending: 0, underProcess: 0 },
    { id: '05', name: 'Hiro', complete: 0, pending: 0, underProcess: 0 },
    { id: '06', name: 'JOrdan', complete: 1, pending: 1, underProcess: 0 },
    { id: '07', name: 'Meta', complete: 0, pending: 1, underProcess: 0 },
    { id: '08', name: 'Heta', complete: 1, pending: 0, underProcess: 1 },
    { id: '09', name: 'Mozo', complete: 3, pending: 0, underProcess: 0 },
  ];

  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Cleaning Report</h1>

      <div className="border border-gray-200 rounded shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 bg-white">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Show</span>
            <select className="border border-gray-300 rounded px-1 py-1 outline-none">
              <option>10</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm w-full md:w-auto">
            <span>Search:</span>
            <input type="text" className="border border-gray-300 rounded px-2 py-1.5 w-full md:w-48 outline-none focus:border-gray-400" />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-y border-gray-200 bg-white text-gray-800 font-bold uppercase text-[12px]">
                <th className="px-4 py-3 cursor-pointer">ID ↑↓</th>
                <th className="px-4 py-3 cursor-pointer">Emp. Name ↑↓</th>
                <th className="px-4 py-3 cursor-pointer">Complete ↑↓</th>
                <th className="px-4 py-3 cursor-pointer">Pending ↑↓</th>
                <th className="px-4 py-3 cursor-pointer">Under Process ↑↓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-gray-700">{row.id}</td>
                  <td className="px-4 py-4 text-gray-700">{row.name}</td>
                  <td className="px-4 py-4 text-gray-700">{row.complete}</td>
                  <td className="px-4 py-4 text-gray-700">{row.pending}</td>
                  <td className="px-4 py-4 text-gray-700">{row.underProcess}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 border-t border-gray-200 text-sm text-gray-600 bg-white">
          <div>Showing 1 to 9 of 9 entries</div>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button className="px-3 py-1.5 bg-gray-50 text-gray-400">Previous</button>
            <button className="px-4 py-1.5 bg-[#4B3F72] text-white">1</button>
            <button className="px-3 py-1.5 hover:bg-gray-50 border-l border-gray-300">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleaningReport;