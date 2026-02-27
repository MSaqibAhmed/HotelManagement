import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaReceipt } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchPayments = () => {
    setLoading(true);
    setTimeout(() => {
      setPayments([
        { _id: "pay1", paymentId: "PAY-2026-001", guestName: "John Doe", invoiceId: "INV-2026-001", amount: 15000, paymentDate: "2026-03-05", method: "Credit Card", status: "Success" }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalPaid = useMemo(() => {
    return payments.filter((p) => p.status === "Success").reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return payments.filter((p) => {
      const matchesSearch = p.guestName?.toLowerCase().includes(q) || p.paymentId?.toLowerCase().includes(q) || p.invoiceId?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Success": return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending": return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Failed": return "bg-red-50 text-red-600 border border-red-200";
      default: return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Payments History</h1>
          <p className="text-sm text-gray-500 mt-1">Track all payment transactions</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg px-6 py-3 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium">Total Paid</p>
          <p className="text-xl font-bold text-gray-800">Rs {totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by guest name, payment ID, or invoice..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full lg:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
            <option value="All">All Status</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
          <span className="text-sm text-gray-500">{filteredPayments.length} payments</span>
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
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Payment ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Payment Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-16"><p className="text-gray-500 font-medium">No payments found</p></td></tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">{payment.paymentId}</p></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(payment.guestName?.charAt(0) || "G").toUpperCase()}</div>
                            <div><p className="font-medium text-gray-800">{payment.guestName}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{payment.invoiceId}</p></td>
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">Rs {payment.amount.toLocaleString()}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{payment.paymentDate}</p></td>
                        <td className="px-6 py-4"><span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{payment.method}</span></td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(payment.status)}`}>{payment.status}</span></td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleViewReceipt(payment)} className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                            <FaReceipt className="w-4 h-4" />Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No payments found</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <div key={payment._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(payment.guestName?.charAt(0) || "G").toUpperCase()}</div>
                          <div><p className="font-medium text-gray-800">{payment.guestName}</p><p className="text-xs text-gray-500">{payment.paymentId}</p></div>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(payment.status)}`}>{payment.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-400 text-xs mb-1">Invoice</p><p className="text-gray-700">{payment.invoiceId}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Amount</p><p className="font-semibold text-gray-800">Rs {payment.amount.toLocaleString()}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Date</p><p className="text-gray-700">{payment.paymentDate}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Method</p><p className="text-gray-700">{payment.method}</p></div>
                      </div>
                      <button onClick={() => handleViewReceipt(payment)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        <FaReceipt className="w-4 h-4" />View Receipt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showReceipt && selectedPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Payment Receipt</h2>
              <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaReceipt className="text-white text-2xl" />
                </div>
                <p className="font-bold text-gray-800">LuxuryStay Hotel</p>
                <p className="text-xs text-gray-500">Payment Receipt</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Receipt ID</p>
                  <p className="font-semibold text-gray-800">{selectedPayment.paymentId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Invoice ID</p>
                  <p className="font-semibold text-gray-800">{selectedPayment.invoiceId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Guest Name</p>
                  <p className="font-medium text-gray-800">{selectedPayment.guestName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Payment Date</p>
                  <p className="font-medium text-gray-800">{selectedPayment.paymentDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Payment Method</p>
                  <p className="font-medium text-gray-800">{selectedPayment.method}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 uppercase font-semibold">Amount Paid</p>
                  <p className="text-2xl font-bold text-[#1e266d]">Rs {selectedPayment.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">Thank you for your payment!</p>
                <p className="text-xs text-gray-400 mt-1">This is a computer-generated receipt.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setShowReceipt(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Close</button>
              <button onClick={() => { toast.success("Receipt downloaded"); }} className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black">Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
