import React, { useState } from 'react';

const BookingTable = ({ data = [], role = "admin" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entries, setEntries] = useState(10);

  const filteredData = data.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ).slice(0, entries);

  // Define headers based on roles
  const isHK = role === "housekeeping";
  const isMaint = role === "maintenance";
  const isHQ = isHK || isMaint;

  const headers = isHQ 
    ? ['Task ID', 'Room', 'Priority', 'Status'] 
    : ['Guest Name', 'Room Type', 'Check In', 'Check Out', 'Amount', 'Paid', 'Due', 'Status'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
        <h3 className="text-lg font-bold text-[#1e266d]">
          {isHK ? "My Assigned Tasks" : isMaint ? "My Assigned Requests" : "Recent Check-ins"}
        </h3>
      </div>
      
      <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select 
            className="border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#1e266d] bg-white text-gray-700 font-medium"
            value={entries} 
            onChange={(e) => setEntries(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select> 
          <span>entries</span>
        </div>
        <div className="flex items-center w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search bookings..."
            className="w-full md:w-64 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#1e266d] bg-white transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-gray-50/80 border-y border-gray-100">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filteredData.length > 0 ? filteredData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/80 transition-colors duration-150">
                <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                <td className="px-6 py-4 text-gray-600">{row.room}</td>
                
                {!isHQ && (
                  <>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{row.checkIn}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{row.checkOut}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap">{row.amount}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600 whitespace-nowrap">{row.paid}</td>
                    <td className="px-6 py-4 font-semibold text-red-500 whitespace-nowrap">{row.due}</td>
                  </>
                )}
                
                {isHQ && (
                  <td className="px-6 py-4 text-gray-600">{row.due}</td>
                )}

                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${row.status === 'Success' ? 'bg-emerald-100 text-emerald-700' 
                    : row.status === 'Pending' ? 'bg-amber-100 text-amber-700' 
                    : row.status === 'Cancelled' ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-400 font-medium">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingTable;
