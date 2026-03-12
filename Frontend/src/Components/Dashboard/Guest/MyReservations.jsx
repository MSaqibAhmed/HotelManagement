import React, { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaEye,
  FaTimesCircle,
  FaClipboardList,
  FaPlus,
  FaCalendarCheck,
  FaEdit,
  FaFileInvoice,
  FaCloudUploadAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const ROOM_TYPES = ["Standard", "Deluxe", "Executive", "Family"];

const INITIAL_FORM_DATA = {
  roomType: "Standard",
  checkInDate: "",
  checkOutDate: "",
  adults: 1,
  children: 0,
  paymentMethod: "Cash",
  specialRequests: "",
};

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState("");
  const [reservationForm, setReservationForm] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Upload Receipt State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingId, setUploadingId] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const itemsPerPage = 5;

  const getUserFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isGuest = role === "guest";

  const getLocalDateInputValue = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = getLocalDateInputValue();

  const toLocalMidnight = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : "");

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `Rs ${amount.toLocaleString()}`;
  };

  const normalizeStatus = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "confirmed") return "Confirmed";
    if (value === "pending") return "Pending";
    if (value === "checked-in" || value === "checked in") return "Checked-In";
    if (value === "checked-out" || value === "checked out") return "Checked-Out";
    if (value === "cancelled" || value === "canceled") return "Cancelled";

    return status || "Pending";
  };

  const normalizeReservation = (item) => {
    const room = item?.room || {};
    const roomSnapshot = item?.roomSnapshot || {};
    const guestSnapshot = item?.guestSnapshot || {};
    const payment = item?.payment || {};

    return {
      _id: item?._id,
      reservationNumber: item?.reservationNumber || item?.bookingId || "N/A",
      guestName: guestSnapshot?.name || item?.guestName || user?.name || "Guest",
      guestEmail: guestSnapshot?.email || item?.guestEmail || user?.email || "",
      roomType: item?.roomType || room?.roomType || roomSnapshot?.roomType || "N/A",
      roomNumber: room?.roomNumber || roomSnapshot?.roomNumber || item?.roomId || "Pending",
      checkInDate: item?.checkInDate || item?.checkIn || "",
      checkOutDate: item?.checkOutDate || item?.checkOut || "",
      status: normalizeStatus(item?.bookingStatus || item?.status),
      amount: Number(payment?.amount ?? item?.amount ?? 0),
      paymentStatus: payment?.status || item?.paymentStatus || "Pending",
      nights: Number(item?.nights || 0),
      adults: Number(item?.adults || 1),
      children: Number(item?.children || 0),
      paymentMethod: payment?.method || item?.payment?.method || "Cash",
      specialRequests: item?.specialRequests || "",
      createdAt: item?.createdAt || "",
      reservationRaw: item,
    };
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/guest/reservations");
      const rawReservations = data?.reservations || data || [];
      setReservations(rawReservations.map(normalizeReservation));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isGuest) {
      fetchReservations();
    }
  }, [isGuest]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Checked-In":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Checked-Out":
        return "bg-gray-50 text-gray-600 border border-gray-200";
      case "Cancelled":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const canCancelReservation = (reservation) => {
    const status = normalizeStatus(reservation?.status);
    return !["Checked-In", "Checked-Out", "Cancelled"].includes(status);
  };

  const canModifyReservation = (reservation) => {
    const status = normalizeStatus(reservation?.status);
    return status === "Pending";
  };

  const canDownloadInvoice = (reservation) => {
    const status = normalizeStatus(reservation?.status);
    return ["Confirmed", "Checked-In", "Checked-Out"].includes(status);
  };

  const needsReceipt = (reservation) => {
    const isOnline = reservation?.paymentMethod === "Online";
    const paymentStatus = reservation?.paymentStatus || "Pending";
    return isOnline && ["Pending", "Rejected"].includes(paymentStatus);
  };

  const handleDownloadInvoice = (reservation) => {
    const hotelName = "Grand Horizon Hotel";
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${reservation.reservationNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #1e266d; padding-bottom: 16px; margin-bottom: 24px; }
          .hotel-name { font-size: 28px; font-weight: bold; color: #1e266d; margin: 0; }
          .invoice-title { font-size: 16px; color: #666; margin: 6px 0 0; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 13px; font-weight: bold; color: #1e266d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
          .row label { color: #666; }
          .row span { font-weight: 600; color: #111; }
          .total-row { border-top: 2px solid #1e266d; margin-top: 10px; padding-top: 10px; }
          .total-row span { color: #1e266d; font-size: 20px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="hotel-name">${hotelName}</p>
          <p class="invoice-title">Reservation Invoice</p>
        </div>
        <div class="section">
          <div class="section-title">Reservation Details</div>
          <div class="row"><label>Reservation No</label><span>${reservation.reservationNumber}</span></div>
          <div class="row"><label>Status</label><span>${reservation.status}</span></div>
          <div class="row"><label>Created</label><span>${formatDate(reservation.createdAt)}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Guest</div>
          <div class="row"><label>Name</label><span>${reservation.guestName}</span></div>
          <div class="row"><label>Email</label><span>${reservation.guestEmail || "N/A"}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Room</div>
          <div class="row"><label>Room Type</label><span>${reservation.roomType}</span></div>
          <div class="row"><label>Room Number</label><span>${reservation.roomNumber}</span></div>
          <div class="row"><label>Check-In</label><span>${formatDate(reservation.checkInDate)}</span></div>
          <div class="row"><label>Check-Out</label><span>${formatDate(reservation.checkOutDate)}</span></div>
          <div class="row"><label>Nights</label><span>${reservation.nights}</span></div>
          <div class="row"><label>Guests</label><span>${reservation.adults} Adults, ${reservation.children} Children</span></div>
        </div>
        <div class="section">
          <div class="section-title">Payment</div>
          <div class="row"><label>Payment Status</label><span>${reservation.paymentStatus}</span></div>
          <div class="row total-row"><label><b>Total Amount</b></label><span><b>Rs ${Number(reservation.amount || 0).toLocaleString()}</b></span></div>
        </div>
        <div class="footer">Thank you for choosing ${hotelName}. We hope to see you again!</div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank", "width=700,height=900");
    if (win) {
      win.document.write(invoiceHTML);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    } else {
      toast.error("Pop-up blocked. Please allow pop-ups for invoice printing.");
    }
  };

  const filteredReservations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return reservations.filter((r) => {
      const matchesSearch =
        !q ||
        r.guestName?.toLowerCase().includes(q) ||
        r.reservationNumber?.toLowerCase().includes(q) ||
        r.roomType?.toLowerCase().includes(q) ||
        String(r.roomNumber || "").toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / itemsPerPage));

  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReservations.slice(start, start + itemsPerPage);
  }, [filteredReservations, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      total: reservations.length,
      active: reservations.filter((r) => ["Pending", "Confirmed"].includes(r.status)).length,
      checkedIn: reservations.filter((r) => r.status === "Checked-In").length,
      cancelled: reservations.filter((r) => r.status === "Cancelled").length,
    };
  }, [reservations]);

  const handleView = async (reservation) => {
    try {
      setShowModal(true);
      setDetailsLoading(true);

      const { data } = await api.get(`/guest/reservations/${reservation._id}`);
      const raw = data?.reservation || data;
      setSelectedReservation(normalizeReservation(raw));
    } catch (error) {
      setSelectedReservation(reservation);
      toast.error(error?.response?.data?.message || "Failed to load reservation details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancelReservation = async (reservation) => {
    const ok = window.confirm(`Cancel reservation "${reservation.reservationNumber}"?`);
    if (!ok) return;

    try {
      setCancellingId(reservation._id);
      await api.patch(`/guest/reservations/${reservation._id}/cancel`);
      toast.success("Reservation cancelled successfully");

      if (selectedReservation?._id === reservation._id) {
        setSelectedReservation((prev) => (prev ? { ...prev, status: "Cancelled" } : prev));
      }

      fetchReservations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel reservation");
    } finally {
      setCancellingId("");
    }
  };

  const openUploadModal = (reservation) => {
    setUploadingId(reservation._id);
    setReceiptFile(null);
    setReceiptPreview("");
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadingId("");
    setReceiptFile(null);
    setReceiptPreview("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    if (!receiptFile || !receiptPreview) {
      toast.error("Please select a receipt image");
      return;
    }

    try {
      setUploadLoading(true);

      await api.post(`/reservation/${uploadingId}/upload-receipt`, {
        receiptImage: receiptPreview,
      });

      toast.success("Receipt uploaded successfully. Pending verification.");
      closeUploadModal();
      fetchReservations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to upload receipt");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleReservationFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "adults" || name === "children") {
      let num = value === "" ? "" : Number(value);
      if (num === "") {
        setReservationForm((prev) => ({ ...prev, [name]: "" }));
        setFormErrors((prev) => ({ ...prev, [name]: "" }));
        return;
      }
      if (Number.isNaN(num)) num = 0;
      if (name === "adults") num = Math.max(1, Math.min(10, num));
      if (name === "children") num = Math.max(0, Math.min(10, num));
      setReservationForm((prev) => ({ ...prev, [name]: num }));
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    setReservationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetReservationForm = () => {
    setReservationForm(INITIAL_FORM_DATA);
    setFormErrors({});
    setPreviewData(null);
    setIsEditMode(false);
    setEditingReservationId("");
  };

  const openCreateModal = () => {
    resetReservationForm();
    setShowReservationModal(true);
  };

  const openEditModal = (reservation) => {
    setIsEditMode(true);
    setEditingReservationId(reservation._id);
    setReservationForm({
      roomType: reservation.roomType || "Standard",
      checkInDate: reservation.checkInDate ? new Date(reservation.checkInDate).toISOString().split("T")[0] : "",
      checkOutDate: reservation.checkOutDate ? new Date(reservation.checkOutDate).toISOString().split("T")[0] : "",
      adults: reservation.adults || 1,
      children: reservation.children || 0,
      paymentMethod: reservation.paymentMethod || "Cash",
      specialRequests: reservation.specialRequests || "",
    });
    setFormErrors({});
    setPreviewData(null);
    setShowReservationModal(true);
  };

  const closeReservationModal = () => {
    setShowReservationModal(false);
    resetReservationForm();
  };

  const validateReservationForm = () => {
    const errors = {};

    if (!reservationForm.roomType) {
      errors.roomType = "Room type is required";
    }

    if (!reservationForm.checkInDate) {
      errors.checkInDate = "Check-in date is required";
    }

    if (!reservationForm.checkOutDate) {
      errors.checkOutDate = "Check-out date is required";
    }

    if (!reservationForm.adults || Number(reservationForm.adults) < 1) {
      errors.adults = "Adults count must be at least 1";
    }

    if (
      reservationForm.checkInDate &&
      reservationForm.checkOutDate &&
      new Date(reservationForm.checkOutDate) <= new Date(reservationForm.checkInDate)
    ) {
      errors.checkOutDate = "Check-out must be after check-in";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePreviewReservation = async () => {
    if (!validateReservationForm()) return;

    try {
      setPreviewLoading(true);

      const qs = new URLSearchParams({
        roomType: reservationForm.roomType,
        checkInDate: toLocalMidnight(reservationForm.checkInDate),
        checkOutDate: toLocalMidnight(reservationForm.checkOutDate),
        adults: String(Number(reservationForm.adults || 1)),
        children: String(Number(reservationForm.children || 0)),
      });

      const { data } = await api.get(`/reservation/preview?${qs.toString()}`);

      setPreviewData(data || null);
      toast.success("Reservation preview loaded");
    } catch (error) {
      setPreviewData(null);
      toast.error(error?.response?.data?.message || "Failed to preview reservation");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmitReservation = async (e) => {
    e.preventDefault();

    if (!validateReservationForm()) return;

    try {
      setSubmitLoading(true);

      const payload = {
        roomType: reservationForm.roomType,
        checkInDate: toLocalMidnight(reservationForm.checkInDate),
        checkOutDate: toLocalMidnight(reservationForm.checkOutDate),
        adults: Number(reservationForm.adults || 1),
        children: Number(reservationForm.children || 0),
        paymentMethod: reservationForm.paymentMethod || "Cash",
        specialRequests: reservationForm.specialRequests.trim(),
      };

      if (isEditMode) {
        await api.put(`/guest/reservations/${editingReservationId}`, payload);
        toast.success("Reservation updated successfully");
      } else {
        await api.post("/reservation/create", payload);
        toast.success("Reservation created successfully! Pending confirmation.");
      }

      closeReservationModal();
      fetchReservations();
      setCurrentPage(1);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        (isEditMode ? "Failed to update reservation" : "Failed to create reservation")
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isGuest) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
        <p className="text-lg font-semibold text-red-600">Access Denied</p>
        <p className="text-sm text-gray-500 mt-2">
          This page is only available for guest accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">My Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your bookings, create reservations, and track reservation status
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto"
        >
          <FaPlus className="w-4 h-4" />
          New Reservation
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Reservations</p>
          <p className="text-2xl font-bold text-[#1e266d] mt-1">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Checked-In</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.checkedIn}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reservation no, room type, room number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full lg:w-52 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-In">Checked-In</option>
            <option value="Checked-Out">Checked-Out</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <span className="text-sm text-gray-500">
            {filteredReservations.length} reservations
          </span>
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
              <table className="w-full min-w-[1150px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Reservation No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Room
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Check-In / Check-Out
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Guests
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedReservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <FaClipboardList className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No reservations found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Your reservation history will appear here
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedReservations.map((res) => (
                      <tr key={res._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{res.reservationNumber}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{res.roomType}</p>
                          <p className="text-xs text-gray-500">Room {res.roomNumber}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-700">In: {formatDate(res.checkInDate)}</p>
                            <p className="text-gray-500">Out: {formatDate(res.checkOutDate)}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{res.adults + res.children}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                              res.status
                            )}`}
                          >
                            {res.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{formatCurrency(res.amount)}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(res)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>

                            {needsReceipt(res) && (
                              <button
                                onClick={() => openUploadModal(res)}
                                className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                                title="Upload Receipt"
                              >
                                <FaCloudUploadAlt className="w-4 h-4" />
                              </button>
                            )}

                            {canDownloadInvoice(res) && (
                              <button
                                onClick={() => handleDownloadInvoice(res)}
                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Download Invoice"
                              >
                                <FaFileInvoice className="w-4 h-4" />
                              </button>
                            )}

                            {canModifyReservation(res) && (
                              <button
                                onClick={() => openEditModal(res)}
                                className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Modify Reservation"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            )}

                            {canCancelReservation(res) && (
                              <button
                                onClick={() => handleCancelReservation(res)}
                                disabled={cancellingId === res._id}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                title="Cancel Reservation"
                              >
                                <FaTimesCircle className="w-4 h-4" />
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
              {paginatedReservations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <FaClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No reservations found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedReservations.map((res) => (
                    <div key={res._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                            {(res.guestName?.charAt(0) || "G").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{res.reservationNumber}</p>
                            <p className="text-xs text-gray-500">{res.roomType}</p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            res.status
                          )}`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Check-In</p>
                          <p className="text-gray-700">{formatDate(res.checkInDate)}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Check-Out</p>
                          <p className="text-gray-700">{formatDate(res.checkOutDate)}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Guests</p>
                          <p className="text-gray-700">{res.adults + res.children}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Amount</p>
                          <p className="font-semibold text-gray-800">{formatCurrency(res.amount)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleView(res)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          View Details
                        </button>

                        {needsReceipt(res) && (
                          <button
                            onClick={() => openUploadModal(res)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-[#1e266d] bg-[#1e266d]/5 rounded-lg hover:bg-[#1e266d]/10"
                          >
                            Upload Receipt
                          </button>
                        )}

                        {canModifyReservation(res) && (
                          <button
                            onClick={() => openEditModal(res)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100"
                          >
                            Modify
                          </button>
                        )}

                        {canCancelReservation(res) && (
                          <button
                            onClick={() => handleCancelReservation(res)}
                            disabled={cancellingId === res._id}
                            className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
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
                  {Math.min(currentPage * itemsPerPage, filteredReservations.length)} of{" "}
                  {filteredReservations.length}
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
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg ${currentPage === page
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

      {showReservationModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1e266d]">
                  {isEditMode ? "Modify Reservation" : "Create Reservation"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Reservation will be handled from your guest account automatically
                </p>
              </div>

              <button
                onClick={closeReservationModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitReservation} className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Guest Auto Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Guest Name</p>
                    <p className="text-sm font-medium text-gray-800">{user?.name || "Guest"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                    <p className="text-sm font-medium text-gray-800">{user?.email || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Type *
                  </label>
                  <select
                    name="roomType"
                    value={reservationForm.roomType}
                    onChange={handleReservationFormChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white ${formErrors.roomType ? "border-red-500" : "border-gray-200"
                      }`}
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {formErrors.roomType && (
                    <p className="text-red-500 text-xs font-semibold mt-2">{formErrors.roomType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={reservationForm.paymentMethod}
                    onChange={handleReservationFormChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${formErrors.paymentMethod ? "border-red-500" : "border-gray-200"
                      }`}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adults *
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="adults"
                    value={reservationForm.adults}
                    onChange={handleReservationFormChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${formErrors.adults ? "border-red-500" : "border-gray-200"
                      }`}
                  />
                  {formErrors.adults && (
                    <p className="text-red-500 text-xs font-semibold mt-2">
                      {formErrors.adults}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="children"
                    value={reservationForm.children}
                    onChange={handleReservationFormChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${formErrors.children ? "border-red-500" : "border-gray-200"
                      }`}
                  />
                  {formErrors.children && (
                    <p className="text-red-500 text-xs font-semibold mt-2">
                      {formErrors.children}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    name="checkInDate"
                    value={reservationForm.checkInDate}
                    onChange={handleReservationFormChange}
                    min={today}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${formErrors.checkInDate ? "border-red-500" : "border-gray-200"
                      }`}
                  />
                  {formErrors.checkInDate && (
                    <p className="text-red-500 text-xs font-semibold mt-2">
                      {formErrors.checkInDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-Out Date *
                  </label>
                  <input
                    type="date"
                    name="checkOutDate"
                    value={reservationForm.checkOutDate}
                    onChange={handleReservationFormChange}
                    min={reservationForm.checkInDate || today}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${formErrors.checkOutDate ? "border-red-500" : "border-gray-200"
                      }`}
                  />
                  {formErrors.checkOutDate && (
                    <p className="text-red-500 text-xs font-semibold mt-2">
                      {formErrors.checkOutDate}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    name="specialRequests"
                    value={reservationForm.specialRequests}
                    onChange={handleReservationFormChange}
                    rows="4"
                    placeholder="Any special requirement for your stay..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Reservation Preview</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Check available room and estimated total before submit
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePreviewReservation}
                    disabled={previewLoading}
                    className="px-4 py-2.5 border border-[#1e266d] text-[#1e266d] rounded-xl font-semibold hover:bg-[#1e266d]/5 disabled:opacity-50"
                  >
                    {previewLoading ? "Loading Preview..." : "Preview Reservation"}
                  </button>
                </div>

                {previewData && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Room Type</p>
                        <p className="text-sm font-medium text-gray-800">
                          {previewData?.selectedRoom?.roomType || reservationForm.roomType}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Available Room</p>
                        <p className="text-sm font-medium text-gray-800">
                          {previewData?.selectedRoom?.roomNumber || "Available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Nights</p>
                        <p className="text-sm font-medium text-gray-800">
                          {previewData?.nights || 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Capacity</p>
                        <p className="text-sm font-medium text-gray-800">
                          {previewData?.selectedRoom?.capacity || "—"} persons
                        </p>
                      </div>
                    </div>

                    {/* Pricing breakdown */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Base Price</span>
                        <span className="font-medium">Rs {Number(previewData?.selectedRoom?.basePrice || 0).toLocaleString()} / night</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Persons</span>
                        <span className="font-medium">{previewData?.totalPersons || 0}</span>
                      </div>
                      {Number(previewData?.extraPersons) > 0 && (
                        <div className="flex justify-between text-sm text-amber-700">
                          <span>Extra Persons ({previewData.extraPersons} × Rs 500/night × {previewData.nights} nights)</span>
                          <span className="font-medium">Rs {Number(previewData.extraCharge || 0).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 mt-1.5">
                        <span className="text-[#1e266d]">Total Estimated Amount</span>
                        <span className="text-[#1e266d] text-base">{formatCurrency(previewData?.amount || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReservationModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black disabled:opacity-60"
                >
                  <FaCalendarCheck className="w-4 h-4" />
                  {submitLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update Reservation"
                      : "Create Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1e266d]">Reservation Details</h2>
                {selectedReservation?.reservationNumber && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedReservation.reservationNumber}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedReservation(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
              </div>
            ) : selectedReservation ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {(selectedReservation.guestName?.charAt(0) || "G").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">{selectedReservation.guestName}</p>
                      <p className="text-sm text-gray-500">
                        {selectedReservation.guestEmail || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Reservation No</p>
                      <p className="font-semibold text-gray-800">
                        {selectedReservation.reservationNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                          selectedReservation.status
                        )}`}
                      >
                        {selectedReservation.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Room Type</p>
                      <p className="font-medium text-gray-800">{selectedReservation.roomType}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p>
                      <p className="font-medium text-gray-800">{selectedReservation.roomNumber}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Check-In</p>
                      <p className="font-medium text-gray-800">
                        {formatDate(selectedReservation.checkInDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Check-Out</p>
                      <p className="font-medium text-gray-800">
                        {formatDate(selectedReservation.checkOutDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Nights</p>
                      <p className="font-medium text-gray-800">{selectedReservation.nights} nights</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Guests</p>
                      <p className="font-medium text-gray-800">
                        {selectedReservation.adults} Adults, {selectedReservation.children} Children
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Payment Status</p>
                      <p className="font-medium text-gray-800">{selectedReservation.paymentStatus}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Created At</p>
                      <p className="font-medium text-gray-800">
                        {formatDate(selectedReservation.createdAt)}
                      </p>
                    </div>
                  </div>

                  {selectedReservation.specialRequests && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Special Requests
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">
                        {selectedReservation.specialRequests}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-[#1e266d]">
                      {formatCurrency(selectedReservation.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  {canDownloadInvoice(selectedReservation) && (
                    <button
                      onClick={() => handleDownloadInvoice(selectedReservation)}
                      className="px-6 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-100 flex items-center gap-2"
                    >
                      <FaFileInvoice className="w-4 h-4" />
                      Download Invoice
                    </button>
                  )}

                  {canModifyReservation(selectedReservation) && (
                    <button
                      onClick={() => {
                        setShowModal(false);
                        openEditModal(selectedReservation);
                      }}
                      className="px-6 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-semibold hover:bg-amber-100"
                    >
                      Modify Reservation
                    </button>
                  )}

                  {canCancelReservation(selectedReservation) && (
                    <button
                      onClick={() => handleCancelReservation(selectedReservation)}
                      disabled={cancellingId === selectedReservation._id}
                      className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50"
                    >
                      {cancellingId === selectedReservation._id ? "Cancelling..." : "Cancel Reservation"}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedReservation(null);
                    }}
                    className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-[#1e266d] mb-2">Upload Payment Receipt</h2>
            <p className="text-sm text-gray-500 mb-6">
              Please upload a clear screenshot of your online payment transaction.
            </p>

            <form onSubmit={handleUploadReceipt} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center group hover:border-[#1e266d] transition-colors relative">
                {receiptPreview ? (
                  <div className="relative w-full aspect-[3/4] sm:aspect-square flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    <img 
                      src={receiptPreview} 
                      alt="Receipt Preview" 
                      className="object-contain w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium text-sm">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaCloudUploadAlt className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-[#1e266d] transition-colors" />
                    <p className="text-sm font-medium text-gray-700">Click to upload receipt</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                  disabled={uploadLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploadLoading || !receiptFile}
                  className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black disabled:opacity-60 flex items-center gap-2"
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Receipt"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservations;