import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const ReservationsList = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 5;

  const fetchReservations = () => {
    setLoading(true);
    setTimeout(() => {
      setReservations([
        { _id: "res1", bookingId: "BKG-1001", guestName: "John Doe", guestEmail: "john@example.com", roomType: "Luxury King", roomId: "101", checkIn: "2026-03-01", checkOut: "2026-03-05", status: "Confirmed", amount: 15000, nights: 4, guests: 2 },
        { _id: "res2", bookingId: "BKG-1002", guestName: "Jane Smith", guestEmail: "jane@example.com", roomType: "Standard Queen", roomId: "205", checkIn: "2026-03-10", checkOut: "2026-03-12", status: "Pending", amount: 8000, nights: 2, guests: 1 },
        { _id: "res3", bookingId: "BKG-1003", guestName: "Alice Johnson", guestEmail: "alice@example.com", roomType: "Standard Twin", roomId: "302", checkIn: "2026-02-28", checkOut: "2026-03-02", status: "Checked-in", amount: 12000, nights: 2, guests: 2 }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed": return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending": return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Checked-in": return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Cancelled": return "bg-red-50 text-red-600 border border-red-200";
      default: return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const filteredReservations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return reservations.filter((r) => {
      const matchesSearch = r.guestName?.toLowerCase().includes(q) || r.bookingId?.toLowerCase().includes(q) || r.roomType?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReservations.slice(start, start + itemsPerPage);
  }, [filteredReservations, currentPage]);

  const handleCancel = (reservation) => {
    const ok = window.confirm(`Cancel booking ${reservation.bookingId}?`);
    if (!ok) return;
    toast.success("Reservation cancelled successfully (Dummy)");
    setReservations((prev) => prev.map((r) => r._id === reservation._id ? { ...r, status: "Cancelled" } : r));
  };

  const handleCheckIn = (reservation) => {
    if (reservation.status === "Cancelled") {
      toast.error("Cannot check-in a cancelled reservation");
      return;
    }
    toast.success("Checked-in successfully (Dummy)");
    setReservations((prev) => prev.map((r) => r._id === reservation._id ? { ...r, status: "Checked-in" } : r));
  };

  const handleCheckOut = (reservation) => {
    if (reservation.status !== "Checked-in") {
      toast.error("Guest must be checked in first");
      return;
    }
    const ok = window.confirm(`Check out ${reservation.guestName}?`);
    if (!ok) return;
    toast.success("Checked-out successfully (Dummy)");
    setReservations((prev) => prev.filter((r) => r._id !== reservation._id));
  };

  const handleView = (reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const handleEdit = (reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">All Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hotel bookings</p>
        </div>
        <Link to="/dashboard/reservations/create" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto">
          <FaPlus className="w-4 h-4" />
          Create New Reservation
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by guest name, booking ID, or room..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full lg:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Cancelled">Cancelled</option>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Check-in / Check-out</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedReservations.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-16"><p className="text-gray-500 font-medium">No reservations found</p></td></tr>
                  ) : (
                    paginatedReservations.map((res) => (
                      <tr key={res._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">{res.bookingId}</p></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(res.guestName?.charAt(0) || "G").toUpperCase()}</div>
                            <div><p className="font-medium text-gray-800">{res.guestName}</p><p className="text-xs text-gray-500">{res.guestEmail}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{res.roomType}</p><p className="text-xs text-gray-500">{res.roomId}</p></td>
                        <td className="px-6 py-4"><div className="text-sm"><p className="text-gray-700">In: {res.checkIn}</p><p className="text-gray-500">Out: {res.checkOut}</p></div></td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(res.status)}`}>{res.status}</span></td>
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">Rs {res.amount.toLocaleString()}</p></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleView(res)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><FaEye className="w-4 h-4" /></button>
                            <button onClick={() => handleEdit(res)} className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg" title="Edit"><FaEdit className="w-4 h-4" /></button>
                            {res.status !== "Cancelled" && res.status !== "Checked-in" && (<button onClick={() => handleCheckIn(res)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Check In"><FaSignInAlt className="w-4 h-4" /></button>)}
                            {res.status === "Checked-in" && (<button onClick={() => handleCheckOut(res)} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Check Out"><FaSignOutAlt className="w-4 h-4" /></button>)}
                            {res.status !== "Cancelled" && (<button onClick={() => handleCancel(res)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Cancel"><FaTrash className="w-4 h-4" /></button>)}
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
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No reservations found</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedReservations.map((res) => (
                    <div key={res._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(res.guestName?.charAt(0) || "G").toUpperCase()}</div>
                          <div><p className="font-medium text-gray-800">{res.guestName}</p><p className="text-xs text-gray-500">{res.bookingId}</p></div>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(res.status)}`}>{res.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-400 text-xs">Room</p><p className="text-gray-700">{res.roomType}</p></div>
                        <div><p className="text-gray-400 text-xs">Amount</p><p className="font-semibold text-gray-800">Rs {res.amount.toLocaleString()}</p></div>
                        <div><p className="text-gray-400 text-xs">Check-in</p><p className="text-gray-700">{res.checkIn}</p></div>
                        <div><p className="text-gray-400 text-xs">Check-out</p><p className="text-gray-700">{res.checkOut}</p></div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => handleView(res)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">View</button>
                        <button onClick={() => handleEdit(res)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Edit</button>
                        {res.status !== "Cancelled" && res.status !== "Checked-in" && (<button onClick={() => handleCheckIn(res)} className="flex-1 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100">Check-in</button>)}
                        {res.status === "Checked-in" && (<button onClick={() => handleCheckOut(res)} className="flex-1 px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100">Check-out</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReservations.length)} of {filteredReservations.length}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${currentPage === page ? "bg-[#1e1e1e] text-white" : "border border-gray-200 hover:bg-gray-50"}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Reservation Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-bold text-xl">{(selectedReservation.guestName?.charAt(0) || "G").toUpperCase()}</div>
                <div><p className="text-lg font-bold text-gray-800">{selectedReservation.guestName}</p><p className="text-sm text-gray-500">{selectedReservation.guestEmail}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Booking ID</p><p className="font-semibold text-gray-800">{selectedReservation.bookingId}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Status</p><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(selectedReservation.status)}`}>{selectedReservation.status}</span></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Room Type</p><p className="font-medium text-gray-800">{selectedReservation.roomType}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p><p className="font-medium text-gray-800">{selectedReservation.roomId}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Check-in</p><p className="font-medium text-gray-800">{selectedReservation.checkIn}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Check-out</p><p className="font-medium text-gray-800">{selectedReservation.checkOut}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Nights</p><p className="font-medium text-gray-800">{selectedReservation.nights} nights</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Guests</p><p className="font-medium text-gray-800">{selectedReservation.guests} guests</p></div>
              </div>
              <div className="pt-4 border-t border-gray-200"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Amount</p><p className="text-2xl font-bold text-[#1e266d]">Rs {selectedReservation.amount.toLocaleString()}</p></div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsList;
