import React from 'react';

const RoomCleaningList = () => {
  const data = [
    { id: '01', name: 'Jone', room: 'B-1202', date: '22/01/2024', status: 'Under Progress' },
    { id: '02', name: 'Meeta', room: 'C-1202', date: '21/01/2024', status: 'Under Progress' },
    { id: '03', name: 'Joshef', room: 'D-1202', date: '22/01/2024', status: 'Under Progress' },
    { id: '04', name: 'Roj', room: 'E-1202', date: '19/01/2024', status: 'Under Progress' },
    { id: '05', name: 'Jone', room: 'H-1101', date: '18/01/2024', status: 'Under Progress' },
    { id: '06', name: 'Risha', room: 'G-1108', date: '18/01/2024', status: 'Under Progress' },
    { id: '07', name: 'Roma', room: 'K-1308', date: '05/03/2024', status: 'Under Progress' },
    { id: '08', name: 'Lina', room: 'L-1408', date: '08/03/2024', status: 'Under Progress' },
    { id: '09', name: 'Micky', room: 'L-1405', date: '08/03/2024', status: 'Under Progress' },
  ];

  return (
    <div className="p-4 md:p-8 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Room Cleaning List</h1>

      <div className="border rounded shadow-sm overflow-hidden bg-white">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Show</span>
            <select className="border rounded px-1 py-1 outline-none bg-transparent">
              <option>10</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700 w-full md:w-auto">
            <span>Search:</span>
            <input type="text" className="border border-gray-300 rounded px-2 py-1 w-full md:w-48 outline-none focus:border-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-y border-gray-200 text-gray-800 font-bold uppercase text-[12px]">
                <th className="px-4 py-3 cursor-pointer">ID <span className="text-[10px]">↑↓</span></th>
                <th className="px-4 py-3 cursor-pointer">Emp Name <span className="text-[10px]">↑↓</span></th>
                <th className="px-4 py-3 cursor-pointer">Room Number <span className="text-[10px]">↑↓</span></th>
                <th className="px-4 py-3 cursor-pointer">Date <span className="text-[10px]">↑↓</span></th>
                <th className="px-4 py-3 cursor-pointer">Status <span className="text-[10px]">↑↓</span></th>
                <th className="px-4 py-3 cursor-pointer">Actions <span className="text-[10px]">↑↓</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">{row.id}</td>
                  <td className="px-4 py-4">{row.name}</td>
                  <td className="px-4 py-4">{row.room}</td>
                  <td className="px-4 py-4">{row.date}</td>
                  <td className="px-4 py-4">{row.status}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-4">
                      {/* Edit SVG */}
                      <button className="text-gray-600 hover:text-blue-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      {/* Trash SVG */}
                      <button className="text-red-400 hover:text-red-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 border-t text-sm text-gray-600">
          <div>Showing 1 to 9 of 9 entries</div>
          <div className="flex border rounded overflow-hidden">
            <button className="px-3 py-1.5 bg-gray-50 text-gray-400">Previous</button>
            <button className="px-4 py-1.5 bg-[#4B3F72] text-white">1</button>
            <button className="px-3 py-1.5 hover:bg-gray-50 border-l">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCleaningList;