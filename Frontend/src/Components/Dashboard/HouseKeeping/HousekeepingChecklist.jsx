import React from 'react';

const HousekeepingChecklist = () => {
  const data = [
    { id: '01', point: 'Washing', type: 'Laundry' },
    { id: '02', point: 'Dry-Cleaning', type: 'Laundry' },
    { id: '03', point: 'Towels', type: 'Laundry' },
    { id: '04', point: 'Ironing', type: 'Laundry' },
    { id: '05', point: 'Floor Cleaning', type: 'House Keeper' },
    { id: '06', point: 'Sanitize the toilet', type: 'House Keeper' },
    { id: '07', point: 'Dustbins and replace', type: 'House Keeper' },
    { id: '08', point: 'Wipe down countertops', type: 'House Keeper' },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Housekeeping Checklist</h1>
        <button className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-black transition-colors">
          Add Checklist
        </button>
      </div>

      <div className="border rounded shadow-sm overflow-hidden bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select className="border rounded px-1 py-1"><option>10</option></select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm w-full md:w-auto">
            <span>Search:</span>
            <input type="text" className="border rounded px-2 py-1 w-full md:w-48 outline-none focus:border-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-y border-gray-200 text-gray-800 font-bold uppercase text-[12px]">
                <th className="px-4 py-3">ID ↑↓</th>
                <th className="px-4 py-3">Check Point ↑↓</th>
                <th className="px-4 py-3">Type ↑↓</th>
                <th className="px-4 py-3">Actions ↑↓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, index) => (
                <tr key={row.id} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-4">{row.id}</td>
                  <td className="px-4 py-4">{row.point}</td>
                  <td className="px-4 py-4">{row.type}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-4">
                       <button className="text-gray-600 hover:text-blue-600 leading-none">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                       </button>
                       <button className="text-red-400 hover:text-red-600 leading-none">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 border-t text-sm text-gray-600">
          <div>Showing 1 to 8 of 8 entries</div>
          <div className="flex border rounded overflow-hidden">
            <button className="px-3 py-1.5 bg-gray-50 text-gray-400">Previous</button>
            <button className="px-4 py-1.5 bg-[#4B3F72] text-white">1</button>
            <button className="px-3 py-1.5 border-l hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousekeepingChecklist;