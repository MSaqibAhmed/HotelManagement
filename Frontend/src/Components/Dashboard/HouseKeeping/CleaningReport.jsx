import React, { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const CleaningReport = () => {
  const [reportData, setReportData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const fetchReport = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/housekeeping/report");
      setReportData(data.report || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch cleaning report");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return reportData.filter(
      (item) =>
        item.empName?.toLowerCase().includes(q) ||
        item.employeeId?.toLowerCase().includes(q)
    );
  }, [reportData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Cleaning Report</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of housekeeping task completion</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by employee name or ID..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <span className="text-sm text-gray-500 sm:whitespace-nowrap">{filteredData.length} employee(s)</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Employee Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Complete</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Pending</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Under Process</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-16"><div className="flex flex-col items-center"><p className="text-gray-500 font-medium">No report data found</p><p className="text-sm text-gray-400 mt-1">Data will appear once tasks are assigned</p></div></td></tr>
                  ) : (
                    paginatedData.map((row) => {
                      const total = row.completed + row.pending + row.underProcess;
                      const rate = total > 0 ? Math.round((row.completed / total) * 100) : 0;
                      return (
                        <tr key={row.employeeId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-700">{row.employeeId}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(row.empName?.charAt(0) || "E").toUpperCase()}</div>
                              <span className="font-medium text-gray-800">{row.empName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">{row.completed}</span></td>
                          <td className="px-6 py-4"><span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">{row.pending}</span></td>
                          <td className="px-6 py-4"><span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">{row.underProcess}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {paginatedData.length === 0 ? (
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No report data found</p><p className="text-sm text-gray-400 mt-1">Data will appear once tasks are assigned</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedData.map((row) => {
                    const total = row.completed + row.pending + row.underProcess;
                    const rate = total > 0 ? Math.round((row.completed / total) * 100) : 0;
                    return (
                      <div key={row.employeeId} className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(row.empName?.charAt(0) || "E").toUpperCase()}</div>
                          <div>
                            <p className="font-medium text-gray-800">{row.empName}</p>
                            <p className="text-sm text-gray-500">ID: {row.employeeId}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="text-center"><p className="text-gray-400 text-xs mb-1">Complete</p><p className="text-emerald-600 font-semibold">{row.completed}</p></div>
                          <div className="text-center"><p className="text-gray-400 text-xs mb-1">Pending</p><p className="text-gray-600 font-semibold">{row.pending}</p></div>
                          <div className="text-center"><p className="text-gray-400 text-xs mb-1">In Progress</p><p className="text-amber-600 font-semibold">{row.underProcess}</p></div>
                          <div className="text-center"><p className="text-gray-400 text-xs mb-1">Rate</p><p className="text-[#1e266d] font-semibold">{rate}%</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${currentPage === page ? "bg-[#1e1e1e] text-white" : "border border-gray-200 hover:bg-gray-50"}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CleaningReport;
