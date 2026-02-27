import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaSearch, FaSignInAlt } from "react-icons/fa";
import api from "../../../api";

const THEME = "#d6c3b3";

const CheckIn = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEligibleReservations = () => {
    setLoading(true);
    setTimeout(() => {
      setReservations([
        { _id: "res2", bookingId: "BKG-1002", guestName: "Jane Smith", guestEmail: "jane@example.com", roomType: "Standard Queen", roomId: "205", checkIn: "2026-03-10", checkOut: "2026-03-12", status: "Pending", amount: 8000, nights: 2, guests: 1 }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchEligibleReservations();
  }, []);

  const eligibleForCheckIn = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return reservations.filter((r) => (r.status === "Pending" || r.status === "Confirmed") && (r.guestName?.toLowerCase().includes(q) || r.bookingId?.toLowerCase().includes(q) || r.roomType?.toLowerCase().includes(q)));
  }, [reservations, searchTerm]);

  const handleCheckIn = (reservation) => {
    toast.success("Checked-in successfully (Dummy)");
    setReservations(prev => prev.filter(r => r._id !== reservation._id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Check-In</h1>
          <p className="text-sm text-gray-500 mt-1">Process guest check-ins</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0"><FaSignInAlt className="text-blue-600" /></div>
          <div>
            <h3 className="font-semibold text-blue-800">Check-In Process</h3>
            <p className="text-sm text-blue-700 mt-1">Only reservations with Pending or Confirmed status can be checked in.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by guest name, booking ID, or room..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <span className="text-sm text-gray-500 sm:whitespace-nowrap">{eligibleForCheckIn.length} reservations eligible</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Booking</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Check-in Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-16"><p className="text-gray-500 font-medium">Loading reservations...</p></td></tr>
              ) : eligibleForCheckIn.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-16"><p className="text-gray-500 font-medium">No reservations eligible for check-in</p></td></tr>
              ) : (
                eligibleForCheckIn.map((res) => (
                  <tr key={res._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><p className="font-semibold text-gray-800">{res.bookingId}</p></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(res.guestName?.charAt(0) || "G").toUpperCase()}</div>
                        <div><p className="font-medium text-gray-800">{res.guestName}</p><p className="text-xs text-gray-500">{res.guestEmail}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-700">{res.roomType}</p><p className="text-xs text-gray-500">{res.roomId}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-700">{res.checkIn}</p></td>
                    <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${res.status === "Confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>{res.status}</span></td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleCheckIn(res)} className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: THEME }}>
                        <FaSignInAlt className="w-4 h-4" />Check In
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden">
          {loading ? (
            <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">Loading reservations...</p></div>
          ) : eligibleForCheckIn.length === 0 ? (
            <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No reservations eligible for check-in</p></div>
          ) : (
            <div className="divide-y divide-gray-200">
              {eligibleForCheckIn.map((res) => (
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
                    <div><p className="text-gray-400 text-xs mb-1">Check-in</p><p className="text-gray-700">{res.checkIn}</p></div>
                  </div>
                  <button onClick={() => handleCheckIn(res)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: THEME }}>
                    <FaSignInAlt className="w-4 h-4" />Check In Guest
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
