import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaSearch, FaEye, FaDownload, FaEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const itemsPerPage = 5;

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "PendingVerification":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "PartiallyPaid":
        return "bg-purple-50 text-purple-600 border border-purple-200";
      case "Rejected":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const getLatestMethod = (invoice) => {
    if (invoice?.paymentHistory?.length) {
      return invoice.paymentHistory[invoice.paymentHistory.length - 1]?.method || "Cash";
    }
    return invoice?.reservation?.payment?.method || "Cash";
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (methodFilter !== "All") params.set("method", methodFilter);
      if (searchTerm.trim()) params.set("q", searchTerm.trim());

      const { data } = await api.get(`/billing/invoices?${params.toString()}`);
      setInvoices(data?.invoices || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, methodFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const normalizedInvoices = useMemo(() => {
    return (invoices || []).map((inv) => {
      const reservation = inv?.reservation || {};
      const guest = inv?.guest || {};

      return {
        _id: inv?._id,
        raw: inv,
        invoiceId: inv?.invoiceNumber || "—",
        guestName:
          guest?.name ||
          reservation?.guestSnapshot?.name ||
          "Guest",
        guestEmail:
          guest?.email ||
          reservation?.guestSnapshot?.email ||
          "",
        roomRef:
          reservation?.roomSnapshot?.roomNumber
            ? `Room ${reservation.roomSnapshot.roomNumber}`
            : reservation?.roomType || "—",
        bookingRef: reservation?.reservationNumber || "—",
        totalAmount: Number(inv?.totalAmount || 0),
        paidAmount: Number(inv?.paidAmount || 0),
        remainingAmount: Number(inv?.remainingAmount || 0),
        issueDate: inv?.createdAt
          ? new Date(inv.createdAt).toLocaleDateString()
          : "—",
        dueDate: reservation?.checkOutDate
          ? new Date(reservation.checkOutDate).toLocaleDateString()
          : inv?.createdAt
          ? new Date(inv.createdAt).toLocaleDateString()
          : "—",
        status: inv?.status || "Pending",
        method: getLatestMethod(inv),
        paymentHistory: inv?.paymentHistory || [],
      };
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return normalizedInvoices.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.guestName?.toLowerCase().includes(q) ||
        inv.guestEmail?.toLowerCase().includes(q) ||
        inv.invoiceId?.toLowerCase().includes(q) ||
        inv.bookingRef?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
      const matchesMethod = methodFilter === "All" || inv.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [normalizedInvoices, searchTerm, statusFilter, methodFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter]);

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setViewModalOpen(true);
  };

  const handleDownload = async (invoice) => {
    try {
      setActionLoadingId(invoice._id);

      const response = await api.get(`/billing/invoices/${invoice._id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceId || "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Download failed");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSendEmail = async (invoice) => {
    try {
      setActionLoadingId(invoice._id);
      const { data } = await api.post(`/billing/invoices/${invoice._id}/send-email`);
      toast.success(data?.message || "Invoice sent successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Send email failed");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all hotel invoices with partial and full payment details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Invoices</p>
          <h3 className="text-2xl font-bold text-[#1e266d] mt-1">{normalizedInvoices.length}</h3>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Paid</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {normalizedInvoices.filter((x) => x.status === "Paid").length}
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Partially Paid</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">
            {normalizedInvoices.filter((x) => x.status === "PartiallyPaid").length}
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Pending Verification</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">
            {normalizedInvoices.filter((x) => x.status === "PendingVerification").length}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by guest name, invoice ID, or booking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-52 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="PendingVerification">Pending Verification</option>
            <option value="PartiallyPaid">Partially Paid</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full lg:w-44 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Online">Online</option>
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
              <table className="w-full min-w-[1300px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Invoice ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Room / Booking
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Paid
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Remaining
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Issue Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-16">
                        <p className="text-gray-500 font-medium">No invoices found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{inv.invoiceId}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                              {(inv.guestName?.charAt(0) || "G").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{inv.guestName}</p>
                              <p className="text-xs text-gray-500">{inv.guestEmail}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{inv.roomRef}</p>
                          <p className="text-xs text-gray-500">{inv.bookingRef}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(inv.totalAmount)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-emerald-700">
                            {formatCurrency(inv.paidAmount)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-red-600">
                            {formatCurrency(inv.remainingAmount)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {inv.method}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{inv.issueDate}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                              inv.status
                            )}`}
                          >
                            {inv.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(inv)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>

                            <button
                              disabled={actionLoadingId === inv._id}
                              onClick={() => handleDownload(inv)}
                              className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg disabled:opacity-60"
                              title="Download"
                            >
                              <FaDownload className="w-4 h-4" />
                            </button>

                            <button
                              disabled={actionLoadingId === inv._id}
                              onClick={() => handleSendEmail(inv)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-60"
                              title="Send Email"
                            >
                              <FaEnvelope className="w-4 h-4" />
                            </button>
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
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No invoices found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedInvoices.map((inv) => (
                    <div key={inv._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                            {(inv.guestName?.charAt(0) || "G").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{inv.guestName}</p>
                            <p className="text-xs text-gray-500">{inv.invoiceId}</p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            inv.status
                          )}`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Room / Booking</p>
                          <p className="text-gray-700">
                            {inv.roomRef} / {inv.bookingRef}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Method</p>
                          <p className="text-gray-700">{inv.method}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Total</p>
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(inv.totalAmount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Paid</p>
                          <p className="font-semibold text-emerald-700">
                            {formatCurrency(inv.paidAmount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Remaining</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(inv.remainingAmount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Issue Date</p>
                          <p className="text-gray-700">{inv.issueDate}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleView(inv)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleDownload(inv)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          Download
                        </button>

                        <button
                          onClick={() => handleSendEmail(inv)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of{" "}
                  {filteredInvoices.length}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                        currentPage === page
                          ? "bg-[#1e1e1e] text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {viewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-[#1e266d]">Invoice Details</h2>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Invoice ID</p>
                <p className="font-bold text-gray-800 mt-1">{selectedInvoice.invoiceId}</p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                    selectedInvoice.status
                  )}`}
                >
                  {selectedInvoice.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Guest</p>
                <p className="font-semibold text-gray-800 mt-1">{selectedInvoice.guestName}</p>
                <p className="text-sm text-gray-500">{selectedInvoice.guestEmail}</p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Booking Ref</p>
                <p className="font-semibold text-gray-800 mt-1">{selectedInvoice.bookingRef}</p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-bold text-gray-800 mt-1">
                  {formatCurrency(selectedInvoice.totalAmount)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-semibold text-gray-800 mt-1">{selectedInvoice.method}</p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Paid Amount</p>
                <p className="font-bold text-emerald-700 mt-1">
                  {formatCurrency(selectedInvoice.paidAmount)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Remaining Amount</p>
                <p className="font-bold text-red-600 mt-1">
                  {formatCurrency(selectedInvoice.remainingAmount)}
                </p>
              </div>
            </div>

            <div className="mt-5 bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-3">Payment History</p>

              {!selectedInvoice.paymentHistory?.length ? (
                <p className="text-sm text-gray-500">No payment history found.</p>
              ) : (
                <div className="space-y-3">
                  {selectedInvoice.paymentHistory.map((item, index) => (
                    <div
                      key={`${item?.paidAt || index}-${index}`}
                      className="bg-white border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item?.stage || "Payment"} • {item?.method || "Cash"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item?.paidAt ? new Date(item.paidAt).toLocaleString() : "—"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-[#1e266d]">
                            {formatCurrency(item?.amount)}
                          </p>
                          <p className="text-xs text-gray-500">{item?.status || "—"}</p>
                        </div>
                      </div>

                      {item?.note ? (
                        <p className="text-sm text-gray-600 mt-3">
                          <span className="font-semibold">Note:</span> {item.note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedInvoice(null);
                }}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesList;