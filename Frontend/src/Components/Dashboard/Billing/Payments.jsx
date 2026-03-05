import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaReceipt, FaCheck, FaTimes, FaCreditCard } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const isProbablyPdf = (url) => String(url || "").toLowerCase().includes(".pdf");

const Payments = () => {
  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isGuest = role === "guest";
  const isStaff = ["admin", "manager", "receptionist"].includes(role);

  const [rows, setRows] = useState([]); // [{ reservation, invoice }]
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Guest by default pending dekhega
  const [statusFilter, setStatusFilter] = useState(isGuest ? "Pending" : "All");
  const [methodFilter, setMethodFilter] = useState("All");

  // receipt view modal
  const [selected, setSelected] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // pay modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payRow, setPayRow] = useState(null);
  const [payMethod, setPayMethod] = useState("Cash");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRow, setRejectRow] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "PendingVerification":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Rejected":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const fetchGuestInvoices = async () => {
    // ✅ Guest ke liye: All = Pending + PendingVerification merge
    const baseParams = new URLSearchParams();
    if (methodFilter !== "All") baseParams.set("method", methodFilter);
    if (searchTerm.trim()) baseParams.set("q", searchTerm.trim());

    const fetchByStatus = async (st) => {
      const params = new URLSearchParams(baseParams.toString());
      if (st && st !== "All") params.set("status", st);
      const { data } = await api.get(`/billing/invoices?${params.toString()}`);
      return data?.invoices || [];
    };

    if (statusFilter === "All") {
      const [p1, p2] = await Promise.all([
        fetchByStatus("Pending"),
        fetchByStatus("PendingVerification"),
      ]);

      // merge unique by _id
      const map = new Map();
      [...p1, ...p2].forEach((inv) => map.set(String(inv._id), inv));
      return Array.from(map.values());
    }

    return fetchByStatus(statusFilter);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      if (isStaff) {
        // ✅ staff sees pending reservations with attached invoice (if any)
        const { data } = await api.get("/billing/pending-reservations");
        setRows(data?.data || []);
      } else {
        // ✅ guest sees their invoices (Pending / PendingVerification etc)
        const invoices = await fetchGuestInvoices();

        const guestRows = invoices.map((inv) => ({
          reservation: inv.reservation,
          invoice: inv,
        }));

        setRows(guestRows);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch payments");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, methodFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const mapped = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return (rows || [])
      .map((r) => {
        const reservation = r.reservation || {};
        const invoice = r.invoice || null;

        const guestName =
          reservation?.guest?.name ||
          reservation?.guestSnapshot?.name ||
          invoice?.guest?.name ||
          "Guest";

        const guestEmail =
          reservation?.guest?.email ||
          reservation?.guestSnapshot?.email ||
          invoice?.guest?.email ||
          "";

        const reservationNumber = reservation?.reservationNumber || "";
        const roomType = reservation?.roomType || "";
        const roomNumber =
          reservation?.roomSnapshot?.roomNumber ||
          reservation?.room?.roomNumber ||
          "";

        const amount = Number(invoice?.amount || reservation?.payment?.amount || 0) || 0;

        const method = invoice?.method || reservation?.payment?.method || "Cash";

        const status = invoice?.status || reservation?.payment?.status || "Pending";

        const receiptUrl = invoice?.receipt?.url || reservation?.payment?.receipt?.url || "";

        const createdAt = invoice?.createdAt || reservation?.createdAt;

        return {
          reservation,
          invoice,
          guestName,
          guestEmail,
          reservationNumber,
          roomType,
          roomNumber,
          amount,
          method,
          status,
          receiptUrl,
          createdAt,
        };
      })
      .filter((x) => {
        const matchesSearch =
          !q ||
          x.guestName?.toLowerCase().includes(q) ||
          x.guestEmail?.toLowerCase().includes(q) ||
          x.reservationNumber?.toLowerCase().includes(q) ||
          x.invoice?.invoiceNumber?.toLowerCase().includes(q);

        const matchesStatus = statusFilter === "All" || x.status === statusFilter;
        const matchesMethod = methodFilter === "All" || x.method === methodFilter;

        return matchesSearch && matchesStatus && matchesMethod;
      });
  }, [rows, searchTerm, statusFilter, methodFilter]);

  const openPayModal = (row) => {
    setPayRow(row);
    // ✅ if already Online pendingVerification, keep Online selected
    setPayMethod(row.method || (row.status === "PendingVerification" ? "Online" : "Cash"));
    setReceiptFile(null);
    setPayModalOpen(true);
  };

  // ✅ Guest submits payment / uploads receipt
  const submitPayment = async () => {
    if (!payRow?.reservation?._id) {
      toast.error("Reservation not found");
      return;
    }

    if (payMethod === "Online" && !receiptFile) {
      toast.error("Receipt is required for Online payment");
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("reservationId", payRow.reservation._id);
      fd.append("method", payMethod);
      if (receiptFile) fd.append("receipt", receiptFile);

      const { data } = await api.post("/billing/payment", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(data?.message || "Payment submitted");
      setPayModalOpen(false);
      setPayRow(null);
      setReceiptFile(null);

      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Payment submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Staff confirm existing invoice
  const confirmInvoice = async (invoiceId) => {
    try {
      setSubmitting(true);
      const { data } = await api.post(`/billing/invoices/${invoiceId}/confirm`);
      toast.success(data?.message || "Payment confirmed");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Confirm failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectModal = (row) => {
    setRejectRow(row);
    setRejectNote("");
    setRejectModalOpen(true);
  };

  const rejectInvoice = async () => {
    if (!rejectRow?.invoice?._id) {
      toast.error("Invoice not found");
      return;
    }
    if (!rejectNote.trim()) {
      toast.error("Reject note is required");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post(`/billing/invoices/${rejectRow.invoice._id}/reject`, {
        note: rejectNote.trim(),
      });
      toast.success(data?.message || "Rejected");
      setRejectModalOpen(false);
      setRejectRow(null);
      setRejectNote("");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reject failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReceipt = (row) => {
    setSelected(row);
    setShowReceipt(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">
            {isStaff ? "Pending Reservations Payments" : "My Pending Payments"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff
              ? "Staff: receipt verify karo aur confirm/reject karo."
              : "Guest: online ho to receipt upload karo, phir staff confirm karega."}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search guest, reservation, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-64 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="PendingVerification">Pending Verification</option>
            <option value="Paid">Paid</option>
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

          <span className="text-sm text-gray-500">{mapped.length} records</span>
        </div>
      </div>

      {/* Table */}
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Reservation / Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Room
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Method
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
                  {mapped.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16">
                        <p className="text-gray-500 font-medium">No records found</p>
                      </td>
                    </tr>
                  ) : (
                    mapped.map((row) => {
                      const invoiceNumber = row.invoice?.invoiceNumber || "—";

                      // ✅ Guest: receipt upload option for Pending + PendingVerification
                      const canGuestUpload =
                        isGuest && (row.status === "Pending" || row.status === "PendingVerification");

                      // ✅ Staff: confirm button for Pending + PendingVerification (invoice must exist)
                      const canStaffConfirm =
                        isStaff &&
                        row.invoice?._id &&
                        (row.status === "Pending" || row.status === "PendingVerification");

                      return (
                        <tr key={row.reservation?._id || row.invoice?._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-800">{row.reservationNumber}</p>
                            <p className="text-xs text-gray-500">Invoice: {invoiceNumber}</p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800">{row.guestName}</p>
                            <p className="text-xs text-gray-500">{row.guestEmail}</p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{row.roomType}</p>
                            <p className="text-xs text-gray-500">Room {row.roomNumber || "-"}</p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-800">
                              Rs {Number(row.amount || 0).toLocaleString()}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {row.method}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                                row.status
                              )}`}
                            >
                              {row.status}
                            </span>
                            {row.invoice?.note ? (
                              <p className="text-xs text-red-600 mt-1">Note: {row.invoice.note}</p>
                            ) : null}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewReceipt(row)}
                                className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                                title="Receipt"
                              >
                                <FaReceipt className="w-4 h-4" />
                              </button>

                              {canGuestUpload && (
                                <button
                                  onClick={() => openPayModal(row)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-900"
                                  style={{ backgroundColor: THEME }}
                                  title="Upload receipt"
                                >
                                  <FaCreditCard className="w-4 h-4" /> Upload Receipt
                                </button>
                              )}

                              {canStaffConfirm && (
                                <>
                                  <button
                                    disabled={submitting}
                                    onClick={() => confirmInvoice(row.invoice._id)}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                    title="Confirm"
                                  >
                                    <FaCheck />
                                  </button>

                                  <button
                                    disabled={submitting}
                                    onClick={() => openRejectModal(row)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Reject"
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile view same as your old code — keep it if you want */}
          </>
        )}
      </div>

      {/* Pay Modal (Guest receipt upload) */}
      {payModalOpen && payRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1e266d]">Upload Receipt</h2>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600">
              <b>{payRow.reservation?.reservationNumber}</b> • Rs {Number(payRow.amount || 0).toLocaleString()}
            </p>

            <div className="mt-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => {
                  setPayMethod(e.target.value);
                  setReceiptFile(null);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e266d]/15 bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>

            {payMethod === "Online" && (
              <div className="mt-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Receipt (image/pdf) *</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Online payment ke liye receipt required hai. Staff verify karke confirm karega.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
              <button
                onClick={() => setPayModalOpen(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={submitPayment}
                className="px-6 py-2.5 rounded-xl font-bold disabled:opacity-60"
                style={{ backgroundColor: THEME, color: "#111827" }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Receipt</h2>
              <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            {!selected.receiptUrl ? (
              <p className="text-sm text-gray-500">No receipt uploaded.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => window.open(selected.receiptUrl, "_blank")}
                    className="px-4 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50"
                  >
                    Open
                  </button>
                  <a
                    href={selected.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-black text-white font-bold hover:bg-gray-900"
                  >
                    Download
                  </a>
                </div>

                {!isProbablyPdf(selected.receiptUrl) ? (
                  <img src={selected.receiptUrl} alt="receipt" className="w-full rounded-xl border border-gray-200" />
                ) : (
                  <p className="text-xs text-gray-500">Receipt is PDF. Open to view.</p>
                )}
              </>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowReceipt(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && rejectRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1e266d]">Reject Payment</h2>
              <button onClick={() => setRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600">
              <b>{rejectRow.reservationNumber}</b> • Rs {Number(rejectRow.amount || 0).toLocaleString()}
            </p>

            <div className="mt-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reject Reason *</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e266d]/15"
                placeholder="Reason..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={rejectInvoice}
                className="px-6 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? "Working..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;