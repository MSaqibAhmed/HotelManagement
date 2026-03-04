import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";
const STATUS_OPTIONS = ["All", "Pending", "Confirmed", "Checked-In", "Checked-Out", "Cancelled"];
const ROOM_TYPES = ["Standard", "Deluxe", "Executive", "Family"];

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getRole = () => (getUser()?.role || "").toLowerCase();
const isGuest = (role) => role === "guest";
const isStaff = (role) => ["admin", "manager", "receptionist"].includes(role);

const toDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const ReservationsList = () => {
  const role = useMemo(() => getRole(), []);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const itemsPerPage = 5;

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const endpoint = isGuest(role) ? "/reservation/my" : "/reservation";
      const { data } = await api.get(endpoint);
      setReservations(data?.reservations || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch reservations");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Checked-In":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Checked-Out":
        return "bg-purple-50 text-purple-600 border border-purple-200";
      case "Cancelled":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const normalized = useMemo(() => {
    return (reservations || []).map((r) => {
      const guestName = r?.guestSnapshot?.name || r?.guest?.name || "Guest";
      const guestEmail = r?.guestSnapshot?.email || r?.guest?.email || "";
      const guestPhone = r?.guestSnapshot?.phone || r?.guest?.phone || "";

      const roomNumber = r?.roomSnapshot?.roomNumber || r?.room?.roomNumber || "";
      const roomName = r?.roomSnapshot?.roomName || r?.room?.roomName || "";
      const roomType = r?.roomType || r?.room?.roomType || "";

      const amount = Number(r?.payment?.amount || 0);
      const bookingId = r?.reservationNumber || r?._id;

      const checkIn = r?.checkInDate ? new Date(r.checkInDate).toLocaleDateString() : "";
      const checkOut = r?.checkOutDate ? new Date(r.checkOutDate).toLocaleDateString() : "";

      const nights = Number(r?.nights || 0);
      const adults = Number(r?.guestsCount?.adults || 1);
      const children = Number(r?.guestsCount?.children || 0);
      const guestsText = `${adults} Adult${adults > 1 ? "s" : ""}${children ? `, ${children} Child` : ""}`;

      const status = r?.bookingStatus || "Pending";

      return {
        _id: r?._id,
        bookingId,
        guestName,
        guestEmail,
        guestPhone,
        roomType,
        roomNumber,
        roomName,
        checkIn,
        checkOut,
        nights,
        guestsText,
        amount,
        status,
        raw: r,
      };
    });
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return normalized.filter((r) => {
      const matchesSearch =
        !q ||
        r.guestName?.toLowerCase().includes(q) ||
        r.bookingId?.toLowerCase().includes(q) ||
        r.roomType?.toLowerCase().includes(q) ||
        r.roomNumber?.toLowerCase().includes(q) ||
        r.roomName?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [normalized, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReservations.slice(start, start + itemsPerPage);
  }, [filteredReservations, currentPage]);

  const handleCancel = async (reservation) => {
    const ok = window.confirm(`Cancel booking ${reservation.bookingId}?`);
    if (!ok) return;

    try {
      const reason = isGuest(role) ? "Cancelled by guest" : "Cancelled by staff";
      await api.patch(`/reservation/${reservation._id}/cancel`, { reason });

      toast.success("Reservation cancelled successfully");

      await fetchReservations(); // ✅ always sync with backend
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel reservation");
    }
  };

  const handleView = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetails(true);
  };

  const openEdit = (reservation) => {
    if (!isStaff(role)) return;

    const rr = reservation.raw || {};
    setEditRow({
      _id: reservation._id,
      bookingId: reservation.bookingId,
      roomType: rr?.roomType || reservation.roomType || "",
      checkInDate: toDateInput(rr?.checkInDate),
      checkOutDate: toDateInput(rr?.checkOutDate),
      adults: Number(rr?.guestsCount?.adults || 1),
      children: Number(rr?.guestsCount?.children || 0),
      specialRequests: rr?.specialRequests || "",
    });

    setEditOpen(true);
  };

  const onSaved = async () => {
    await fetchReservations(); // ✅ only refresh
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">
            {isGuest(role) ? "My Reservations" : "All Reservations"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isGuest(role) ? "View your booking status and cancel if needed" : "Manage hotel bookings"}
          </p>
        </div>

        {isStaff(role) && (
          <Link
            to="/dashboard/reservations/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto"
          >
            <FaPlus className="w-4 h-4" />
            Create New Reservation
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking #, guest, room..."
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
            className="w-full lg:w-56 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Status" : s}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-500">{filteredReservations.length} reservations</span>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Booking</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Check-in / Check-out
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedReservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16">
                        <p className="text-gray-500 font-medium">No reservations found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedReservations.map((res) => (
                      <tr key={res._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{res.bookingId}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                              {(res.guestName?.charAt(0) || "G").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{res.guestName}</p>
                              <p className="text-xs text-gray-500">{res.guestEmail}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{res.roomType}</p>
                          <p className="text-xs text-gray-500">
                            {res.roomName ? `${res.roomName} • ` : ""}#{res.roomNumber}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-700">In: {res.checkIn}</p>
                            <p className="text-gray-500">Out: {res.checkOut}</p>
                          </div>
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
                          <p className="font-semibold text-gray-800">Rs {Number(res.amount || 0).toLocaleString()}</p>
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

                            {isStaff(role) && (
                              <button
                                onClick={() => openEdit(res)}
                                className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            )}

                            {res.status !== "Cancelled" && res.status !== "Checked-Out" && (
                              <button
                                onClick={() => handleCancel(res)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Cancel"
                              >
                                <FaTrash className="w-4 h-4" />
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
                            <p className="font-medium text-gray-800">{res.guestName}</p>
                            <p className="text-xs text-gray-500">{res.bookingId}</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(res.status)}`}>
                          {res.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">Room</p>
                          <p className="text-gray-700">
                            {res.roomType} {res.roomNumber ? `• #${res.roomNumber}` : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Amount</p>
                          <p className="font-semibold text-gray-800">Rs {Number(res.amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Check-in</p>
                          <p className="text-gray-700">{res.checkIn}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Check-out</p>
                          <p className="text-gray-700">{res.checkOut}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleView(res)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          View
                        </button>

                        {isStaff(role) && (
                          <button
                            onClick={() => openEdit(res)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                          >
                            Edit
                          </button>
                        )}

                        {res.status !== "Cancelled" && res.status !== "Checked-Out" && (
                          <button
                            onClick={() => handleCancel(res)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
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
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                        currentPage === page ? "bg-[#1e1e1e] text-white" : "border border-gray-200 hover:bg-gray-50"
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

      {showDetails && selectedReservation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Reservation Details</h2>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Booking #</p>
                  <p className="font-semibold text-gray-800">{selectedReservation.bookingId}</p>
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
                  <p className="text-xs text-gray-500 uppercase font-semibold">Guest</p>
                  <p className="font-medium text-gray-800">{selectedReservation.guestName}</p>
                  <p className="text-xs text-gray-500">{selectedReservation.guestEmail}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Room</p>
                  <p className="font-medium text-gray-800">
                    {selectedReservation.roomType} •{" "}
                    {selectedReservation.roomName ? `${selectedReservation.roomName} • ` : ""}#{selectedReservation.roomNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Check-in</p>
                  <p className="font-medium text-gray-800">{selectedReservation.checkIn}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Check-out</p>
                  <p className="font-medium text-gray-800">{selectedReservation.checkOut}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Guests</p>
                  <p className="font-medium text-gray-800">{selectedReservation.guestsText}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Amount</p>
                  <p className="text-2xl font-bold text-[#1e266d]">
                    Rs {Number(selectedReservation.amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && editRow && isStaff(role) && (
        <StaffEditModal
          value={editRow}
          onClose={() => {
            setEditOpen(false);
            setEditRow(null);
          }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
};

const StaffEditModal = ({ value, onClose, onSaved }) => {
  const [form, setForm] = useState({ ...value });
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const change = (e) => {
    const { name, value } = e.target;

    if (name === "adults" || name === "children") {
      let n = Number(value || 0);
      if (name === "adults") n = Math.max(1, Math.min(10, n));
      if (name === "children") n = Math.max(0, Math.min(10, n));
      setForm((p) => ({ ...p, [name]: n }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const save = async () => {
    if (!ROOM_TYPES.includes(form.roomType)) return toast.error("Select valid room type");
    if (!form.checkInDate || !form.checkOutDate) return toast.error("Select dates");

    const s = new Date(form.checkInDate);
    const e = new Date(form.checkOutDate);
    if (e <= s) return toast.error("Check-out must be after check-in");

    try {
      setSaving(true);

      const payload = {
        roomType: form.roomType,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        adults: Number(form.adults || 1),
        children: Number(form.children || 0),
        specialRequests: String(form.specialRequests || ""),
      };

      const { data } = await api.put(`/reservation/${form._id}`, payload);
      toast.success(data?.message || "Updated successfully");

      await onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-[#1e266d]">Edit Reservation</h2>
            <p className="text-sm text-gray-500 mt-1">Booking: {form.bookingId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type</label>
            <select
              name="roomType"
              value={form.roomType}
              onChange={change}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white"
            >
              <option value="">Select Room Type</option>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in</label>
            <input
              type="date"
              name="checkInDate"
              value={form.checkInDate}
              onChange={change}
              min={today}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out</label>
            <input
              type="date"
              name="checkOutDate"
              value={form.checkOutDate}
              onChange={change}
              min={form.checkInDate || today}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Adults</label>
            <input
              type="number"
              name="adults"
              value={form.adults}
              onChange={change}
              min={1}
              max={10}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Children</label>
            <input
              type="number"
              name="children"
              value={form.children}
              onChange={change}
              min={0}
              max={10}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requests</label>
            <textarea
              rows={3}
              name="specialRequests"
              value={form.specialRequests}
              onChange={change}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-900 disabled:opacity-60"
            style={{ backgroundColor: THEME }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationsList;