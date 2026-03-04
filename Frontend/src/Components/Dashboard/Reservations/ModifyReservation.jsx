import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import api from "../../../api";

const THEME = "#d6c3b3";

const ROOM_TYPES = ["Standard", "Deluxe", "Executive", "Family"];
const STATUS_OPTIONS = ["Pending", "Confirmed", "Checked-In", "Checked-Out", "Cancelled"];

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const isGuestRole = (role) => String(role || "").toLowerCase() === "guest";
const isStaffRole = (role) =>
  ["admin", "manager", "receptionist"].includes(String(role || "").toLowerCase());

const toDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeFromBackend = (r) => {
  const guestName = r?.guestSnapshot?.name || r?.guest?.name || "Guest";
  const guestEmail = r?.guestSnapshot?.email || r?.guest?.email || "";
  const guestPhone = r?.guestSnapshot?.phone || r?.guest?.phone || "";

  const roomType = r?.roomType || r?.room?.roomType || "";
  const roomNumber = r?.roomSnapshot?.roomNumber || r?.room?.roomNumber || "";
  const roomName = r?.roomSnapshot?.roomName || r?.room?.roomName || "";

  const checkInDate = r?.checkInDate || "";
  const checkOutDate = r?.checkOutDate || "";

  const amount = Number(r?.payment?.amount || 0);
  const paymentMethod = r?.payment?.method || "Cash";

  const adults = Number(r?.guestsCount?.adults || 1);
  const children = Number(r?.guestsCount?.children || 0);

  return {
    _id: r?._id,
    bookingId: r?.reservationNumber || r?._id,
    guestName,
    guestEmail,
    guestPhone,
    roomType,
    roomNumber,
    roomName,
    checkInDate,
    checkOutDate,
    status: r?.bookingStatus || "Pending",
    nights: Number(r?.nights || 0),
    adults,
    children,
    paymentMethod,
    specialRequests: r?.specialRequests || "",
    amount,
    raw: r,
  };
};

const ModifyReservation = () => {
  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();

  const canSeeAll = isStaffRole(role);
  const isGuest = isGuestRole(role);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);

      const endpoint = canSeeAll ? "/reservation" : "/reservation/my";
      const { data } = await api.get(endpoint);

      const list = (data?.reservations || []).map(normalizeFromBackend);

      const activeOnly = list.filter((r) => r.status !== "Cancelled" && r.status !== "Checked-Out");
      setReservations(activeOnly);
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

  const filteredReservations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return reservations;

    return reservations.filter((r) => {
      return (
        r.guestName?.toLowerCase().includes(q) ||
        r.bookingId?.toLowerCase().includes(q) ||
        r.roomType?.toLowerCase().includes(q) ||
        r.roomNumber?.toLowerCase().includes(q)
      );
    });
  }, [reservations, searchTerm]);

  const handleEdit = (reservation) => {
    if (!isGuest) return;
    setSelectedReservation({ ...reservation });
    setShowEditForm(true);
  };

  const handleCancel = async (reservation) => {
    const ok = window.confirm(`Cancel booking ${reservation.bookingId}?`);
    if (!ok) return;

    try {
      await api.patch(`/reservation/${reservation._id}/cancel`, { reason: "Cancelled by guest" });
      toast.success("Reservation cancelled successfully");
      await fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel reservation");
    }
  };

  const handleUpdate = async (updated) => {
    try {
      setLoading(true);

      const payload = {
        roomType: updated.roomType,
        checkInDate: updated.checkInDate,
        checkOutDate: updated.checkOutDate,
        adults: updated.adults,
        children: updated.children,
        specialRequests: updated.specialRequests,
      };

      const { data } = await api.put(`/reservation/${updated._id}`, payload);

      toast.success(data?.message || "Reservation updated successfully");
      await fetchReservations();

      setShowEditForm(false);
      setSelectedReservation(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Modify / Cancel Reservation</h1>
          <p className="text-sm text-gray-500 mt-1">Guest can modify/cancel own booking only</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking #, room type, room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>
          <span className="text-sm text-gray-500 sm:whitespace-nowrap">
            {filteredReservations.length} active reservations
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
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Booking</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Dates</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
                        <p className="text-gray-500 font-medium">No reservations found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => (
                      <tr key={res._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{res.bookingId}</p>
                          <p className="text-xs text-gray-500">{res.guestEmail}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{res.roomType}</p>
                          <p className="text-xs text-gray-500">
                            {res.roomName ? `${res.roomName} • ` : ""}#{res.roomNumber}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-700">{toDateInput(res.checkInDate)}</p>
                            <p className="text-gray-500">{toDateInput(res.checkOutDate)}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              res.status === "Confirmed"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
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
                              onClick={() => handleEdit(res)}
                              disabled={!isGuest}
                              className={`p-2 rounded-lg ${
                                isGuest
                                  ? "text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10"
                                  : "text-gray-300 cursor-not-allowed"
                              }`}
                              title={isGuest ? "Edit" : "Only guest can edit here"}
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleCancel(res)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Cancel"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {filteredReservations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No reservations found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredReservations.map((res) => (
                    <div key={res._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{res.bookingId}</p>
                          <p className="text-xs text-gray-500 truncate">{res.roomType}</p>
                        </div>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                            res.status === "Confirmed"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Room</p>
                          <p className="text-gray-700">
                            {res.roomName ? `${res.roomName} • ` : ""}#{res.roomNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Amount</p>
                          <p className="font-semibold text-gray-800">Rs {Number(res.amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Check-in</p>
                          <p className="text-gray-700">{toDateInput(res.checkInDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Check-out</p>
                          <p className="text-gray-700">{toDateInput(res.checkOutDate)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(res)}
                          disabled={!isGuest}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg ${
                            isGuest
                              ? "text-gray-600 bg-gray-50 hover:bg-gray-100"
                              : "text-gray-300 bg-gray-50 cursor-not-allowed"
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCancel(res)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showEditForm && selectedReservation && isGuest && (
        <EditForm
          reservation={selectedReservation}
          onClose={() => {
            setShowEditForm(false);
            setSelectedReservation(null);
          }}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

const EditForm = ({ reservation, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    roomType: reservation.roomType || "",
    checkInDate: toDateInput(reservation.checkInDate),
    checkOutDate: toDateInput(reservation.checkOutDate),
    adults: reservation.adults || 1,
    children: reservation.children || 0,
    specialRequests: reservation.specialRequests || "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "adults" || name === "children") {
      let n = Number(value || 0);
      if (name === "adults") n = Math.max(1, Math.min(10, n));
      if (name === "children") n = Math.max(0, Math.min(10, n));
      setFormData((p) => ({ ...p, [name]: n }));
      setErrors((p) => ({ ...p, [name]: "" }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!ROOM_TYPES.includes(formData.roomType)) newErrors.roomType = "Select valid room type";
    if (!formData.checkInDate) newErrors.checkInDate = "Check-in date required";
    if (!formData.checkOutDate) newErrors.checkOutDate = "Check-out date required";

    if (formData.checkInDate && formData.checkOutDate) {
      const s = new Date(formData.checkInDate);
      const e = new Date(formData.checkOutDate);
      if (e <= s) newErrors.checkOutDate = "Check-out must be after check-in";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onUpdate({
        ...reservation,
        roomType: formData.roomType,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        adults: Number(formData.adults || 1),
        children: Number(formData.children || 0),
        specialRequests: formData.specialRequests,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none transition ${
      errors[field] ? "border-red-500" : "border-gray-200"
    }`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-[#1e266d] mb-6">Modify Reservation</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type *</label>
              <select name="roomType" value={formData.roomType} onChange={handleChange} className={inputClass("roomType")}>
                <option value="">Select Room Type</option>
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.roomType && <p className="text-red-500 text-xs font-semibold mt-2">{errors.roomType}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <input
                value={reservation.paymentMethod || "Cash"}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date *</label>
              <input
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleChange}
                min={today}
                className={inputClass("checkInDate")}
              />
              {errors.checkInDate && <p className="text-red-500 text-xs font-semibold mt-2">{errors.checkInDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date *</label>
              <input
                type="date"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleChange}
                min={formData.checkInDate || today}
                className={inputClass("checkOutDate")}
              />
              {errors.checkOutDate && <p className="text-red-500 text-xs font-semibold mt-2">{errors.checkOutDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Adults</label>
              <input
                type="number"
                name="adults"
                value={formData.adults}
                onChange={handleChange}
                min={1}
                max={10}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Children</label>
              <input
                type="number"
                name="children"
                value={formData.children}
                onChange={handleChange}
                min={0}
                max={10}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requests</label>
            <textarea
              rows={3}
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-900 disabled:opacity-60"
              style={{ backgroundColor: THEME }}
            >
              {loading ? "Updating..." : "Update Reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifyReservation;