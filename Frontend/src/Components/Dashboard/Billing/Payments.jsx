import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaReceipt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const getRole = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return String(u?.role || "").toLowerCase();
  } catch {
    return "";
  }
};

const isStaff = (role) => ["admin", "manager", "receptionist"].includes(role);

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
};

const isImageUrl = (url) => {
  if (!url) return false;
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
};

const Payments = () => {
  const role = useMemo(() => getRole(), []);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchPayments = async (signal) => {
    try {
      setLoading(true);

      // You can pass filter to backend if you support it:
      // const qs = statusFilter !== "All" ? `?paymentStatus=${statusFilter}` : "";
      // const { data } = await api.get(`/reservation${qs}`, { signal });

      const { data } = await api.get("/reservation", { signal });
      const reservations = Array.isArray(data?.reservations) ? data.reservations : [];

      const rows = reservations.map((r) => {
        const guestName = r?.guestSnapshot?.name || r?.guest?.name || "Guest";
        const invoiceId = r?.invoice?.invoiceNumber || r?.invoiceNumber || r?.invoiceId || "-";
        const paymentId = r?.payment?.paymentId || r?.reservationNumber || r?._id;

        const amount = safeNum(r?.payment?.amount);
        const method = r?.payment?.method || "-";
        const status = r?.payment?.status || "Pending";
        const receiptUrl = r?.payment?.receipt?.url || "";

        const paymentDate = r?.payment?.confirmedAt || r?.updatedAt || r?.createdAt;

        return {
          _id: r?._id,
          paymentId,
          guestName,
          invoiceId,
          amount,
          paymentDate: fmtDate(paymentDate),
          method,
          status,
          receiptUrl,
          raw: r,
        };
      });

      setPayments(rows);
    } catch (error) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
      toast.error(error.response?.data?.message || "Failed to fetch payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaff(role)) return;
    const controller = new AbortController();
    fetchPayments(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const totalPaid = useMemo(() => {
    return payments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + safeNum(p.amount), 0);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return payments.filter((p) => {
      const matchesSearch =
        !q ||
        String(p.guestName || "").toLowerCase().includes(q) ||
        String(p.paymentId || "").toLowerCase().includes(q) ||
        String(p.invoiceId || "").toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "PendingVerification":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Rejected":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const openReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  const openConfirm = (payment) => {
    setConfirmRow(payment);
    setConfirmOpen(true);
  };

  const confirmOnlinePayment = async () => {
    if (!confirmRow?._id) return;
    try {
      setConfirmLoading(true);

      // ✅ Preferred endpoint (you can add in backend):
      // PATCH /api/reservation/:id/confirm-online
      await api.patch(`/reservation/${confirmRow._id}/confirm-online`);

      toast.success("Payment verified & booking confirmed");
      setConfirmOpen(false);
      setConfirmRow(null);

      const controller = new AbortController();
      await fetchPayments(controller.signal);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Confirm failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  const rejectOnlinePayment = async () => {
    if (!confirmRow?._id) return;
    try {
      setConfirmLoading(true);

      // ✅ Optional endpoint if you build it:
      // PATCH /api/reservation/:id/reject-online
      await api.patch(`/reservation/${confirmRow._id}/reject-online`);

      toast.success("Payment rejected");
      setConfirmOpen(false);
      setConfirmRow(null);

      const controller = new AbortController();
      await fetchPayments(controller.signal);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Reject failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  if (!isStaff(role)) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-[#1e266d]">Payments</h1>
        <p className="text-sm text-gray-500 mt-2">
          Access denied. Only <b>Admin</b>, <b>Manager</b> and <b>Receptionist</b> can view payments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Track and verify online payments</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg px-6 py-3 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium">Total Paid</p>
          <p className="text-xl font-bold text-gray-800">
            Rs {safeNum(totalPaid).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by guest, payment/reservation #, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-56 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="PendingVerification">Pending Verification</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>

          <span className="text-sm text-gray-500">{filteredPayments.length} records</span>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Payment/Reservation</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-16">
                        <p className="text-gray-500 font-medium">No payments found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{p.paymentId}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{p.guestName}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{p.invoiceId}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">Rs {safeNum(p.amount).toLocaleString()}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{p.paymentDate}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {p.method}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(p.status)}`}>
                            {p.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {p.method === "Online" && (
                              <button
                                onClick={() => openReceipt(p)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                              >
                                <FaReceipt className="w-4 h-4" />
                                Receipt
                              </button>
                            )}

                            {p.status !== "Paid" && (
                              <button
                                onClick={() => openConfirm(p)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-900 hover:opacity-90 transition"
                                style={{ backgroundColor: THEME }}
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No payments found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPayments.map((p) => (
                    <div key={p._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">{p.paymentId}</p>
                          <p className="text-sm text-gray-600 mt-1">{p.guestName}</p>
                          <p className="text-xs text-gray-500">Invoice: {p.invoiceId}</p>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(p.status)}`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Amount</p>
                          <p className="font-semibold text-gray-800">Rs {safeNum(p.amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Method</p>
                          <p className="text-gray-700">{p.method}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Date</p>
                          <p className="text-gray-700">{p.paymentDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Receipt</p>
                          <p className="text-gray-700">{p.receiptUrl ? "Available" : "Not uploaded"}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        {p.method === "Online" && (
                          <button
                            onClick={() => openReceipt(p)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                          >
                            <FaReceipt className="w-4 h-4" />
                            Receipt
                          </button>
                        )}

                        {p.status !== "Paid" && (
                          <button
                            onClick={() => openConfirm(p)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-900 hover:opacity-90 transition"
                            style={{ backgroundColor: THEME }}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showReceipt && selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          onClose={() => {
            setShowReceipt(false);
            setSelectedPayment(null);
          }}
          getStatusStyle={getStatusStyle}
        />
      )}

      {confirmOpen && confirmRow && (
        <ConfirmModal
          row={confirmRow}
          loading={confirmLoading}
          onClose={() => {
            setConfirmOpen(false);
            setConfirmRow(null);
          }}
          onConfirm={confirmOnlinePayment}
          onReject={rejectOnlinePayment}
        />
      )}
    </div>
  );
};

const ReceiptModal = ({ payment, onClose, getStatusStyle }) => {
  const url = payment?.receiptUrl || "";
  const canPreview = Boolean(url);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1e266d]">Payment Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Payment/Reservation</p>
            <p className="font-semibold text-gray-800">{payment.paymentId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Invoice</p>
            <p className="font-semibold text-gray-800">{payment.invoiceId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Guest</p>
            <p className="font-medium text-gray-800">{payment.guestName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(payment.status)}`}>
              {payment.status}
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          {!canPreview ? (
            <div className="h-56 flex items-center justify-center text-gray-500">
              No receipt uploaded yet
            </div>
          ) : isImageUrl(url) ? (
            <img src={url} alt="Receipt" className="w-full max-h-[520px] object-contain rounded-xl bg-white" />
          ) : (
            <iframe title="Receipt" src={url} className="w-full h-[520px] rounded-xl bg-white" />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
            Close
          </button>

          {canPreview && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black"
            >
              Open
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ row, loading, onClose, onConfirm, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1e266d]">Verify Payment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Booking: <span className="font-semibold">{row.paymentId}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">
            Guest: <span className="font-semibold">{row.guestName}</span>
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Amount: <span className="font-semibold">Rs {safeNum(row.amount).toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Receipt: <span className="font-semibold">{row.receiptUrl ? "Uploaded" : "Not uploaded"}</span>
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>

          <button
            onClick={onReject}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
          >
            <FaTimesCircle />
            Reject
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-gray-900 disabled:opacity-60"
            style={{ backgroundColor: THEME }}
          >
            <FaCheckCircle />
            {loading ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payments;