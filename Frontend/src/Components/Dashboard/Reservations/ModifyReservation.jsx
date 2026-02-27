import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import api from "../../../api";

const THEME = "#d6c3b3";

const ModifyReservation = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const fetchReservations = () => {
    setLoading(true);
    setTimeout(() => {
      setReservations([
        { _id: "res1", bookingId: "BKG-1001", guestName: "John Doe", guestEmail: "john@example.com", roomType: "Luxury King", roomId: "101", checkIn: "2026-03-01", checkOut: "2026-03-05", status: "Confirmed", amount: 15000, nights: 4, guests: 2 },
        { _id: "res2", bookingId: "BKG-1002", guestName: "Jane Smith", guestEmail: "jane@example.com", roomType: "Standard Queen", roomId: "205", checkIn: "2026-03-10", checkOut: "2026-03-12", status: "Pending", amount: 8000, nights: 2, guests: 1 },
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const filteredReservations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return reservations.filter((r) => r.status !== "Cancelled" && r.status !== "Checked-out" && (r.guestName?.toLowerCase().includes(q) || r.bookingId?.toLowerCase().includes(q) || r.roomType?.toLowerCase().includes(q)));
  }, [reservations, searchTerm]);

  const handleEdit = (reservation) => {
    setSelectedReservation({ ...reservation });
    setShowEditForm(true);
  };

  const handleCancel = (reservation) => {
    const ok = window.confirm(`Cancel booking ${reservation.bookingId}?`);
    if (!ok) return;
    toast.success("Reservation cancelled successfully (Dummy)");
    setReservations((prev) => prev.map((r) => r._id === reservation._id ? { ...r, status: "Cancelled" } : r));
  };

  const handleUpdate = (updatedReservation) => {
    setLoading(true);
    setTimeout(() => {
      toast.success("Reservation updated successfully (Dummy)");
      setShowEditForm(false);
      setSelectedReservation(null);
      setReservations(prev => prev.map(r => r._id === updatedReservation._id ? updatedReservation : r));
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Modify / Cancel Reservation</h1>
          <p className="text-sm text-gray-500 mt-1">Edit or cancel existing bookings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by guest name, booking ID, or room..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <span className="text-sm text-gray-500 sm:whitespace-nowrap">{filteredReservations.length} active reservations</span>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Dates</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReservations.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-16"><p className="text-gray-500 font-medium">No reservations found</p></td></tr>
                  ) : (
                    filteredReservations.map((res) => (
                      <tr key={res._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">{res.bookingId}</p></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(res.guestName?.charAt(0) || "G").toUpperCase()}</div>
                            <div><p className="font-medium text-gray-800">{res.guestName}</p><p className="text-xs text-gray-500">{res.guestEmail}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{res.roomType}</p><p className="text-xs text-gray-500">{res.roomId}</p></td>
                        <td className="px-6 py-4"><div className="text-sm"><p className="text-gray-700">{res.checkIn}</p><p className="text-gray-500">{res.checkOut}</p></div></td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${res.status === "Confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>{res.status}</span></td>
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">Rs {res.amount.toLocaleString()}</p></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEdit(res)} className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg" title="Edit"><FaEdit className="w-4 h-4" /></button>
                            <button onClick={() => handleCancel(res)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Cancel"><FaTrash className="w-4 h-4" /></button>
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
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No reservations found</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredReservations.map((res) => (
                    <div key={res._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(res.guestName?.charAt(0) || "G").toUpperCase()}</div>
                          <div className="min-w-0"><p className="font-medium text-gray-800 truncate">{res.guestName}</p><p className="text-xs text-gray-500">{res.bookingId}</p></div>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium shrink-0 ${res.status === "Confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>{res.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-400 text-xs mb-1">Room</p><p className="text-gray-700">{res.roomType}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Amount</p><p className="font-semibold text-gray-800">Rs {res.amount.toLocaleString()}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Check-in</p><p className="text-gray-700">{res.checkIn}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Check-out</p><p className="text-gray-700">{res.checkOut}</p></div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => handleEdit(res)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Edit</button>
                        <button onClick={() => handleCancel(res)} className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showEditForm && selectedReservation && (
        <EditForm reservation={selectedReservation} onClose={() => { setShowEditForm(false); setSelectedReservation(null); }} onUpdate={handleUpdate} />
      )}
    </div>
  );
};

const EditForm = ({ reservation, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    guestName: reservation.guestName || "",
    guestEmail: reservation.guestEmail || "",
    guestPhone: reservation.guestPhone || "",
    roomType: reservation.roomType || "",
    roomId: reservation.roomId || "",
    checkIn: reservation.checkIn || "",
    checkOut: reservation.checkOut || "",
    nights: reservation.nights || 0,
    guests: reservation.guests || 1,
    status: reservation.status || "Pending",
    amount: reservation.amount || 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.guestName.trim()) newErrors.guestName = "Guest name is required";
    if (!formData.guestEmail.trim()) newErrors.guestEmail = "Email is required";
    if (!formData.guestPhone.trim()) newErrors.guestPhone = "Phone is required";
    if (!formData.roomType.trim()) newErrors.roomType = "Room type is required";
    if (!formData.checkIn) newErrors.checkIn = "Check-in date is required";
    if (!formData.checkOut) newErrors.checkOut = "Check-out date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await onUpdate({ ...reservation, ...formData });
    } catch {
      // Error already handled in onUpdate
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none transition ${errors[field] ? "border-red-500" : "border-gray-200"
    }`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-[#1e266d] mb-6">Edit Reservation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Guest Name *</label>
              <input type="text" name="guestName" value={formData.guestName} onChange={handleChange} className={inputClass("guestName")} />
              {errors.guestName && <p className="text-red-500 text-xs font-semibold mt-2">{errors.guestName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input type="email" name="guestEmail" value={formData.guestEmail} onChange={handleChange} className={inputClass("guestEmail")} />
              {errors.guestEmail && <p className="text-red-500 text-xs font-semibold mt-2">{errors.guestEmail}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
              <input type="tel" name="guestPhone" value={formData.guestPhone} onChange={handleChange} className={inputClass("guestPhone")} />
              {errors.guestPhone && <p className="text-red-500 text-xs font-semibold mt-2">{errors.guestPhone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Guests</label>
              <input type="number" name="guests" value={formData.guests} onChange={handleChange} min="1" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type *</label>
              <input type="text" name="roomType" value={formData.roomType} onChange={handleChange} className={inputClass("roomType")} />
              {errors.roomType && <p className="text-red-500 text-xs font-semibold mt-2">{errors.roomType}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
              <input type="text" name="roomId" value={formData.roomId} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date *</label>
              <input type="date" name="checkIn" value={formData.checkIn} onChange={handleChange} className={inputClass("checkIn")} />
              {errors.checkIn && <p className="text-red-500 text-xs font-semibold mt-2">{errors.checkIn}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date *</label>
              <input type="date" name="checkOut" value={formData.checkOut} onChange={handleChange} className={inputClass("checkOut")} />
              {errors.checkOut && <p className="text-red-500 text-xs font-semibold mt-2">{errors.checkOut}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Checked-in">Checked-in</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black disabled:opacity-60">{loading ? "Updating..." : "Update Reservation"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifyReservation;
