import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaReceipt,
  FaCheck,
  FaTimes,
  FaCreditCard,
  FaMoneyBillWave,
  FaEye,
} from "react-icons/fa";
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
const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const mergeRows = (...lists) => {
  const map = new Map();

  lists.flat().forEach((item) => {
    const reservationId = item?.reservation?._id || "";
    const invoiceId = item?.invoice?._id || "";
    const key = invoiceId || reservationId;

    if (!key) return;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      return;
    }

    map.set(key, {
      reservation: item?.reservation || existing?.reservation || {},
      invoice: item?.invoice || existing?.invoice || null,
    });
  });

  return Array.from(map.values());
};

const Payments = () => {
  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isGuest = role === "guest";
  const isStaff = ["admin", "manager", "receptionist"].includes(role);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");

  const [selected, setSelected] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState(null);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payRow, setPayRow] = useState(null);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payAmount, setPayAmount] = useState("");
  const [payStage, setPayStage] = useState("Advance");
  const [payNote, setPayNote] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);

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
      case "PartiallyPaid":
        return "bg-purple-50 text-purple-600 border border-purple-200";
      case "Rejected":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const normalizeInvoiceMethod = (invoice, reservation) => {
    if (invoice?.paymentHistory?.length) {
      const last = invoice.paymentHistory[invoice.paymentHistory.length - 1];
      return last?.method || "Cash";
    }
    return reservation?.payment?.method || "Cash";
  };

  const normalizeReceiptUrl = (invoice, reservation) => {
    if (invoice?.paymentHistory?.length) {
      const withReceipt = [...invoice.paymentHistory]
        .reverse()
        .find((item) => item?.receipt?.url);
      if (withReceipt?.receipt?.url) return withReceipt.receipt.url;
    }
    return reservation?.payment?.receipt?.url || "";
  };

  const fetchInvoices = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (methodFilter !== "All") params.set("method", methodFilter);
    if (searchTerm.trim()) params.set("q", searchTerm.trim());

    const { data } = await api.get(`/billing/invoices?${params.toString()}`);
    return (data?.invoices || []).map((inv) => ({
      reservation: inv?.reservation || {},
      invoice: inv,
    }));
  }, [methodFilter, searchTerm, statusFilter]);

  const fetchPendingPayments = useCallback(async () => {
    const { data } = await api.get("/billing/pending-payments");
    return (data?.invoices || []).map((inv) => ({
      reservation: inv?.reservation || {},
      invoice: inv,
    }));
  }, []);

  const fetchPendingReservations = useCallback(async () => {
    const { data } = await api.get("/billing/pending-reservations");
    return data?.data || [];
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      if (isGuest) {
        const [invoiceRows, pendingRows] = await Promise.all([
          fetchInvoices(),
          fetchPendingPayments(),
        ]);

        setRows(mergeRows(invoiceRows, pendingRows));
        return;
      }

      const [invoiceRows, pendingRows, reservationRows] = await Promise.all([
        fetchInvoices(),
        fetchPendingPayments(),
        fetchPendingReservations(),
      ]);

      setRows(mergeRows(invoiceRows, pendingRows, reservationRows));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch payments");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices, fetchPendingPayments, fetchPendingReservations, isGuest]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mapped = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return (rows || [])
      .map((r) => {
        const reservation = r?.reservation || {};
        const invoice = r?.invoice || null;

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

        const reservationNumber = reservation?.reservationNumber || "—";
        const roomType = reservation?.roomType || reservation?.room?.roomType || "—";
        const roomNumber =
          reservation?.roomSnapshot?.roomNumber ||
          reservation?.room?.roomNumber ||
          "-";

        const totalAmount = Number(
          invoice?.totalAmount ?? reservation?.payment?.amount ?? 0
        );

        const paidAmount = Number(invoice?.paidAmount || 0);

        const remainingAmount = Number(
          invoice?.remainingAmount ?? Math.max(totalAmount - paidAmount, 0)
        );

        const method = normalizeInvoiceMethod(invoice, reservation);
        const status = invoice?.status || reservation?.payment?.status || "Pending";
        const receiptUrl = normalizeReceiptUrl(invoice, reservation);
        const createdAt = invoice?.createdAt || reservation?.createdAt;
        const invoiceNumber = invoice?.invoiceNumber || "Not Generated Yet";
        const paymentHistory = invoice?.paymentHistory || [];

        return {
          reservation,
          invoice,
          guestName,
          guestEmail,
          reservationNumber,
          roomType,
          roomNumber,
          totalAmount,
          paidAmount,
          remainingAmount,
          method,
          status,
          receiptUrl,
          createdAt,
          invoiceNumber,
          paymentHistory,
        };
      })
      .filter((x) => {
        const matchesSearch =
          !q ||
          x.guestName?.toLowerCase().includes(q) ||
          x.guestEmail?.toLowerCase().includes(q) ||
          x.reservationNumber?.toLowerCase().includes(q) ||
          x.invoiceNumber?.toLowerCase().includes(q);

        const matchesStatus = statusFilter === "All" || x.status === statusFilter;
        const matchesMethod = methodFilter === "All" || x.method === methodFilter;

        return matchesSearch && matchesStatus && matchesMethod;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [rows, searchTerm, statusFilter, methodFilter]);

  const resetPayModal = () => {
    setPayRow(null);
    setPayMethod("Cash");
    setPayAmount("");
    setPayStage("Advance");
    setPayNote("");
    setReceiptFile(null);
    setPayModalOpen(false);
  };

  const openPayModal = (row) => {
    const remaining = Number(row?.remainingAmount || row?.totalAmount || 0);

    if (remaining <= 0) {
      toast.error("No remaining amount");
      return;
    }

    setPayRow(row);
    setPayMethod(isGuest ? "Online" : row?.method || "Cash");
    setPayAmount(remaining > 0 ? String(remaining) : "");
    setPayStage(
      row?.paidAmount > 0
        ? "Final"
        : remaining === Number(row?.totalAmount || 0)
        ? "Advance"
        : "Partial"
    );
    setPayNote("");
    setReceiptFile(null);
    setPayModalOpen(true);
  };

  const submitPayment = async () => {
    if (!payRow?.reservation?._id) {
      toast.error("Reservation not found");
      return;
    }

    if (!payAmount || Number(payAmount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    const remaining = Number(payRow?.remainingAmount || payRow?.totalAmount || 0);

    if (Number(payAmount) > remaining) {
      toast.error("Amount exceeds remaining balance");
      return;
    }

    if (isGuest && payMethod !== "Online") {
      toast.error("Guest can only upload online payment receipt");
      return;
    }

    if (payMethod === "Online" && !receiptFile) {
      toast.error("Receipt is required for online payment");
      return;
    }

    try {
      setActionLoading(true);

      const fd = new FormData();
      fd.append("reservationId", payRow.reservation._id);
      fd.append("method", payMethod);
      fd.append("amount", Number(payAmount));
      fd.append("stage", payStage);
      fd.append("note", payNote);

      if (receiptFile) {
        fd.append("receipt", receiptFile);
      }

      const { data } = await api.post("/billing/payment", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(data?.message || "Payment submitted successfully");
      resetPayModal();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Payment submit failed");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmInvoice = async (invoiceId) => {
    if (!invoiceId) {
      toast.error("Invoice not found");
      return;
    }

    try {
      setActionLoading(true);
      const { data } = await api.post(`/billing/invoices/${invoiceId}/confirm`);
      toast.success(data?.message || "Payment confirmed");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Confirm failed");
    } finally {
      setActionLoading(false);
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
      setActionLoading(true);
      const { data } = await api.post(
        `/billing/invoices/${rejectRow.invoice._id}/reject`,
        {
          note: rejectNote.trim(),
        }
      );

      toast.success(data?.message || "Payment rejected");
      setRejectModalOpen(false);
      setRejectRow(null);
      setRejectNote("");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reject failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReceipt = (row) => {
    setSelected(row);
    setShowReceipt(true);
  };

  const openHistoryModal = (row) => {
    setHistoryRow(row);
    setHistoryOpen(true);
  };

  const canPayRow = (row) => {
    if (!row?.reservation?._id) return false;
    if (row?.status === "Paid") return false;
    if (Number(row?.remainingAmount || 0) <= 0) return false;
    return true;
  };

  const canGuestUploadReceipt = (row) =>
    isGuest &&
    canPayRow(row) &&
    row?.method === "Online" &&
    ["Pending", "PartiallyPaid", "Rejected"].includes(row?.status);

  const canStaffTakePayment = (row) =>
    isStaff &&
    canPayRow(row) &&
    ["Pending", "PartiallyPaid", "Rejected"].includes(row?.status);

  const canStaffConfirm = (row) =>
    isStaff &&
    row?.invoice?._id &&
    row?.status === "PendingVerification";

  const canShowReceiptButton = (row) => Boolean(row?.receiptUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">
            {isStaff ? "Payments Management" : "My Payments"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff
              ? "Receptionist cash, online, partial aur remaining checkout payments handle karega."
              : "Guest apni payment status dekh sakta hai. Sirf online payment hone par receipt upload kar sakta hai."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Records</p>
          <h3 className="text-2xl font-bold text-[#1e266d] mt-1">{mapped.length}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {mapped.filter((x) => x.status === "Pending").length}
          </h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Pending Verification</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">
            {mapped.filter((x) => x.status === "PendingVerification").length}
          </h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Partially Paid</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">
            {mapped.filter((x) => x.status === "PartiallyPaid").length}
          </h3>
        </div>
      </div>

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
            className="w-full lg:w-56 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="PendingVerification">Pending Verification</option>
            <option value="PartiallyPaid">Partially Paid</option>
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

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[1400px]">
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
                      <td colSpan="9" className="text-center py-16">
                        <p className="text-gray-500 font-medium">No records found</p>
                      </td>
                    </tr>
                  ) : (
                    mapped.map((row) => (
                      <tr
                        key={row.reservation?._id || row.invoice?._id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {row.reservationNumber || "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Invoice: {row.invoiceNumber}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{row.guestName}</p>
                          <p className="text-xs text-gray-500">{row.guestEmail}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{row.roomType || "—"}</p>
                          <p className="text-xs text-gray-500">
                            Room {row.roomNumber || "-"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(row.totalAmount)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-emerald-700">
                            {formatCurrency(row.paidAmount)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-red-600">
                            {formatCurrency(row.remainingAmount)}
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
                            <p className="text-xs text-red-600 mt-1">
                              Note: {row.invoice.note}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => openHistoryModal(row)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="Payment history"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>

                            {canShowReceiptButton(row) && (
                              <button
                                onClick={() => handleViewReceipt(row)}
                                className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                                title="Receipt"
                              >
                                <FaReceipt className="w-4 h-4" />
                              </button>
                            )}

                            {canGuestUploadReceipt(row) && (
                              <button
                                onClick={() => openPayModal(row)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-900"
                                style={{ backgroundColor: THEME }}
                                title="Upload online receipt"
                              >
                                <FaCreditCard className="w-4 h-4" />
                                {row.paidAmount > 0 ? "Upload Remaining Receipt" : "Upload Receipt"}
                              </button>
                            )}

                            {canStaffTakePayment(row) && (
                              <button
                                onClick={() => openPayModal(row)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-900"
                                style={{ backgroundColor: THEME }}
                                title="Add payment"
                              >
                                <FaMoneyBillWave className="w-4 h-4" />
                                {row.paidAmount > 0 ? "Pay Remaining" : "Add Payment"}
                              </button>
                            )}

                            {canStaffConfirm(row) && (
                              <>
                                <button
                                  disabled={actionLoading}
                                  onClick={() => confirmInvoice(row.invoice._id)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-60"
                                  title="Confirm"
                                >
                                  <FaCheck />
                                </button>

                                <button
                                  disabled={actionLoading}
                                  onClick={() => openRejectModal(row)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-60"
                                  title="Reject"
                                >
                                  <FaTimes />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden p-4 space-y-4">
              {mapped.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No records found</div>
              ) : (
                mapped.map((row) => (
                  <div
                    key={row.reservation?._id || row.invoice?._id}
                    className="border border-gray-200 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#1e266d]">
                          {row.reservationNumber || "—"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Invoice: {row.invoiceNumber}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500">Guest:</span> {row.guestName}
                      </p>
                      <p>
                        <span className="text-gray-500">Room:</span> {row.roomType} /{" "}
                        {row.roomNumber || "-"}
                      </p>
                      <p>
                        <span className="text-gray-500">Total:</span>{" "}
                        {formatCurrency(row.totalAmount)}
                      </p>
                      <p>
                        <span className="text-gray-500">Paid:</span>{" "}
                        {formatCurrency(row.paidAmount)}
                      </p>
                      <p>
                        <span className="text-gray-500">Remaining:</span>{" "}
                        {formatCurrency(row.remainingAmount)}
                      </p>
                      <p>
                        <span className="text-gray-500">Method:</span> {row.method}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => openHistoryModal(row)}
                        className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold"
                      >
                        History
                      </button>

                      {canShowReceiptButton(row) && (
                        <button
                          onClick={() => handleViewReceipt(row)}
                          className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold"
                        >
                          Receipt
                        </button>
                      )}

                      {canGuestUploadReceipt(row) && (
                        <button
                          onClick={() => openPayModal(row)}
                          className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-900"
                          style={{ backgroundColor: THEME }}
                        >
                          {row.paidAmount > 0 ? "Upload Remaining Receipt" : "Upload Receipt"}
                        </button>
                      )}

                      {canStaffTakePayment(row) && (
                        <button
                          onClick={() => openPayModal(row)}
                          className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-900"
                          style={{ backgroundColor: THEME }}
                        >
                          {row.paidAmount > 0 ? "Pay Remaining" : "Add Payment"}
                        </button>
                      )}

                      {canStaffConfirm(row) && (
                        <>
                          <button
                            disabled={actionLoading}
                            onClick={() => confirmInvoice(row.invoice._id)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
                          >
                            Confirm
                          </button>

                          <button
                            disabled={actionLoading}
                            onClick={() => openRejectModal(row)}
                            className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {payModalOpen && payRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1e266d]">
                {isGuest ? "Upload Online Payment Receipt" : "Add Payment"}
              </h2>
              <button
                onClick={resetPayModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
              <p className="text-sm text-gray-700">
                <b>{payRow.reservationNumber}</b>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-bold text-gray-800">
                    {formatCurrency(payRow.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Paid</p>
                  <p className="font-bold text-emerald-700">
                    {formatCurrency(payRow.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining</p>
                  <p className="font-bold text-red-600">
                    {formatCurrency(payRow.remainingAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method
                </label>

                {isGuest ? (
                  <input
                    value="Online"
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600"
                  />
                ) : (
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
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Stage
                </label>
                <select
                  value={payStage}
                  onChange={(e) => setPayStage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e266d]/15 bg-white"
                >
                  <option value="Advance">Advance</option>
                  <option value="Partial">Partial</option>
                  <option value="Final">Final</option>
                  <option value="Full">Full</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e266d]/15"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Maximum payable amount: {formatCurrency(payRow.remainingAmount)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  rows={3}
                  placeholder="Optional note..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e266d]/15"
                />
              </div>

              {(payMethod === "Online" || isGuest) && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Receipt (image/pdf) *
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {isGuest
                      ? "Guest sirf online payment ki receipt upload kar sakta hai. Verification receptionist/admin karega."
                      : "Online payment ke liye receipt required hai. Staff verify karke confirm karega."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
              <button
                onClick={resetPayModal}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={submitPayment}
                className="px-6 py-2.5 rounded-xl font-bold disabled:opacity-60"
                style={{ backgroundColor: THEME, color: "#111827" }}
              >
                {actionLoading
                  ? "Submitting..."
                  : isGuest
                  ? "Submit Receipt"
                  : "Submit Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Receipt</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
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
                  <img
                    src={selected.receiptUrl}
                    alt="receipt"
                    className="w-full rounded-xl border border-gray-200"
                  />
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

      {historyOpen && historyRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-[#1e266d]">Payment History</h2>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
              <p className="font-semibold text-gray-800">
                Reservation: {historyRow.reservationNumber}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-bold">{formatCurrency(historyRow.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Paid</p>
                  <p className="font-bold text-emerald-700">
                    {formatCurrency(historyRow.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining</p>
                  <p className="font-bold text-red-600">
                    {formatCurrency(historyRow.remainingAmount)}
                  </p>
                </div>
              </div>
            </div>

            {!historyRow.paymentHistory?.length ? (
              <p className="text-sm text-gray-500">No payment history found.</p>
            ) : (
              <div className="space-y-3">
                {historyRow.paymentHistory.map((item, index) => (
                  <div
                    key={`${item?.paidAt || index}-${index}`}
                    className="border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item?.stage || "Payment"} • {item?.method || "Cash"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item?.paidAt
                            ? new Date(item.paidAt).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1e266d]">
                          {formatCurrency(item?.amount)}
                        </p>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            item?.status === "Approved"
                              ? "Paid"
                              : item?.status === "Rejected"
                              ? "Rejected"
                              : "PendingVerification"
                          )}`}
                        >
                          {item?.status || "—"}
                        </span>
                      </div>
                    </div>

                    {item?.note ? (
                      <p className="text-sm text-gray-600 mt-3">
                        <span className="font-semibold">Note:</span> {item.note}
                      </p>
                    ) : null}

                    {item?.receipt?.url ? (
                      <div className="mt-3">
                        <a
                          href={item.receipt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50"
                        >
                          <FaReceipt />
                          View Receipt
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setHistoryOpen(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModalOpen && rejectRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1e266d]">Reject Payment</h2>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600">
              <b>{rejectRow.reservationNumber}</b> •{" "}
              {formatCurrency(rejectRow.totalAmount)}
            </p>

            <div className="mt-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reject Reason *
              </label>
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
                disabled={actionLoading}
                onClick={rejectInvoice}
                className="px-6 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionLoading ? "Working..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;