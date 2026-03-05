import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const isProbablyPdf = (url) => String(url || "").toLowerCase().includes(".pdf");

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const staff = ["admin", "manager", "receptionist"].includes(role);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);

  const [rejectNote, setRejectNote] = useState("");

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/billing/invoices/${id}`);
      setInvoice(data?.invoice || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch invoice");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/billing/invoices/${id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice?.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.response?.data?.message || "PDF download failed");
    }
  };

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      const { data } = await api.post(`/billing/invoices/${id}/confirm`);
      toast.success(data?.message || "Confirmed");
      fetchInvoice();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Confirm failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectNote.trim()) {
        toast.error("Please add reject reason/note");
        return;
      }
      setActionLoading(true);
      const { data } = await api.post(`/billing/invoices/${id}/reject`, { note: rejectNote.trim() });
      toast.success(data?.message || "Rejected");
      setRejectNote("");
      fetchInvoice();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reject failed");
    } finally {
      setActionLoading(false);
    }
  };

  const receiptUrl = invoice?.receipt?.url || "";
  const status = invoice?.status || "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Invoice Detail</h1>
          <p className="text-sm text-gray-500 mt-1">
            {invoice?.invoiceNumber || "-"} • {invoice?.method || "-"} • {status || "-"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            Back
          </button>

          <button
            onClick={downloadPdf}
            className="px-5 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-gray-900 transition"
          >
            Download PDF Invoice
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
        </div>
      ) : !invoice ? (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <p className="text-gray-500">Invoice not found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Guest</p>
                <p className="font-semibold text-gray-800">{invoice?.guest?.name || "Guest"}</p>
                <p className="text-gray-500">{invoice?.guest?.email || ""}</p>
                <p className="text-gray-500">{invoice?.guest?.phone || ""}</p>
              </div>

              <div>
                <p className="text-gray-500">Reservation</p>
                <p className="font-semibold text-gray-800">{invoice?.reservation?.reservationNumber || "-"}</p>
                <p className="text-gray-500">Room Type: {invoice?.reservation?.roomType || "-"}</p>
                <p className="text-gray-500">
                  Room: {invoice?.reservation?.roomSnapshot?.roomNumber || ""}{" "}
                  {invoice?.reservation?.roomSnapshot?.roomName ? `(${invoice.reservation.roomSnapshot.roomName})` : ""}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Amount</p>
                <p className="text-2xl font-black text-[#1e266d]">
                  Rs {Number(invoice?.amount || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-semibold text-gray-800">
                  {invoice?.createdAt ? new Date(invoice.createdAt).toLocaleString() : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Receipt</h2>

            {!receiptUrl ? (
              <p className="text-gray-500">
                No receipt uploaded{invoice?.method === "Online" ? " (Online requires receipt)" : ""}.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => window.open(receiptUrl, "_blank")}
                    className="px-4 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50"
                  >
                    Open Receipt
                  </button>

                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-black text-white font-bold hover:bg-gray-900"
                  >
                    Download Receipt
                  </a>
                </div>

                {!isProbablyPdf(receiptUrl) ? (
                  <img
                    src={receiptUrl}
                    alt="receipt"
                    className="w-full max-w-2xl rounded-xl border border-gray-200"
                  />
                ) : (
                  <p className="text-gray-500 text-sm">
                    Receipt is a PDF. Click “Open Receipt” to view.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Staff actions */}
          {staff && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Verification</h2>

              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Current Status: <span className="font-bold text-gray-800">{status}</span>
                  </p>
                  {invoice?.note ? (
                    <p className="text-sm text-red-600 mt-1">Note: {invoice.note}</p>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={actionLoading || status === "Paid"}
                    onClick={handleConfirm}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {actionLoading ? "Working..." : "Confirm (Mark Paid)"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reject Note</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  placeholder="Reason for rejection..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e266d]/15"
                />
                <button
                  disabled={actionLoading || status === "Paid"}
                  onClick={handleReject}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoiceDetail;