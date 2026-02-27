import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaEye, FaDownload, FaEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const fetchInvoices = () => {
    setLoading(true);
    setTimeout(() => {
      setInvoices([
        { _id: "inv1", invoiceId: "INV-2026-001", guestName: "John Doe", guestEmail: "john@example.com", roomRef: "Room 101", bookingRef: "BKG-1001", amount: 15000, issueDate: "2026-03-05", dueDate: "2026-03-05", status: "Paid" }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid": return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending": return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Overdue": return "bg-red-50 text-red-600 border border-red-200";
      case "Partial": return "bg-blue-50 text-blue-600 border border-blue-200";
      default: return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return invoices.filter((inv) => {
      const matchesSearch = inv.guestName?.toLowerCase().includes(q) || inv.invoiceId?.toLowerCase().includes(q) || inv.bookingRef?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  const handleView = (invoice) => {
    toast.info(`Viewing invoice ${invoice.invoiceId}`);
  };

  const handleDownload = (invoice) => {
    toast.success(`Downloading invoice ${invoice.invoiceId}`);
  };

  const handleSendEmail = (invoice) => {
    toast.success(`Invoice ${invoice.invoiceId} sent to ${invoice.guestEmail}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all hotel invoices</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by guest name, invoice ID, or booking..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full lg:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Partial">Partial</option>
          </select>
          <span className="text-sm text-gray-500">{filteredInvoices.length} invoices</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Invoice ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room / Booking</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Issue Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedInvoices.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-16"><p className="text-gray-500 font-medium">No invoices found</p></td></tr>
                  ) : (
                    paginatedInvoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">{inv.invoiceId}</p></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(inv.guestName?.charAt(0) || "G").toUpperCase()}</div>
                            <div><p className="font-medium text-gray-800">{inv.guestName}</p><p className="text-xs text-gray-500">{inv.guestEmail}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{inv.roomRef}</p><p className="text-xs text-gray-500">{inv.bookingRef}</p></td>
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">Rs {inv.amount.toLocaleString()}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{inv.issueDate}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{inv.dueDate}</p></td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(inv.status)}`}>{inv.status}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleView(inv)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><FaEye className="w-4 h-4" /></button>
                            <button onClick={() => handleDownload(inv)} className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg" title="Download"><FaDownload className="w-4 h-4" /></button>
                            <button onClick={() => handleSendEmail(inv)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Send Email"><FaEnvelope className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden">
              {paginatedInvoices.length === 0 ? (
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No invoices found</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedInvoices.map((inv) => (
                    <div key={inv._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(inv.guestName?.charAt(0) || "G").toUpperCase()}</div>
                          <div><p className="font-medium text-gray-800">{inv.guestName}</p><p className="text-xs text-gray-500">{inv.invoiceId}</p></div>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(inv.status)}`}>{inv.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-400 text-xs mb-1">Room / Booking</p><p className="text-gray-700">{inv.roomRef} / {inv.bookingRef}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Amount</p><p className="font-semibold text-gray-800">Rs {inv.amount.toLocaleString()}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Issue Date</p><p className="text-gray-700">{inv.issueDate}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Due Date</p><p className="text-gray-700">{inv.dueDate}</p></div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => handleView(inv)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">View</button>
                        <button onClick={() => handleDownload(inv)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Download</button>
                        <button onClick={() => handleSendEmail(inv)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Send</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length}</p>
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

export default InvoicesList;
