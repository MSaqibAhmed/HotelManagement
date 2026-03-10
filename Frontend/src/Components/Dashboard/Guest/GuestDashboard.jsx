import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api";
import { useTheme } from "../../../context/ThemeContext";
import { BedDouble, CalendarDays, Clock, Headset, MessageSquareText, ShieldAlert, Wrench } from "lucide-react";

const GuestDashboard = () => {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }

    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/reservation/my-reservations");
        if (res.data && res.data.reservations) {
          setReservations(res.data.reservations);
        }
      } catch (error) {
        console.error("Failed to fetch reservations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const activeReservations = reservations.filter(
    (res) => res.status === "Confirmed" || res.status === "Checked-In"
  );
  const currentBooking = activeReservations.length > 0 ? activeReservations[0] : null;

  const bg = dark ? "bg-[#111111] text-gray-200" : "bg-gray-50 text-gray-800";
  const cardBg = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-100";
  const muted = dark ? "text-gray-400" : "text-gray-500";

  if (loading) {
    return (
      <div className={`min-h-[70vh] flex justify-center items-center ${bg}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#cbb19d]"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-[80vh] px-6 py-12 ${bg} pt-28`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className={`text-4xl font-serif ${dark ? "text-white" : "text-gray-900"}`}>
            Welcome back, {user?.name || "Guest"}!
          </h1>
          <p className={`mt-2 ${muted}`}>Here is an overview of your current stay and quick actions.</p>
        </div>

        {/* Current Booking Section */}
        <h2 className="text-xl font-bold mb-6">Current Booking</h2>
        {currentBooking ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#cbb19d]/10 text-[#cbb19d] rounded-xl"><BedDouble size={20} /></div>
                <h3 className="font-semibold">Room Details</h3>
              </div>
              <p className="text-2xl font-bold text-[#cbb19d]">
                {currentBooking.roomId?.roomType || "Room"}
              </p>
              <p className={`text-sm mt-1 ${muted}`}>Room {currentBooking.roomId?.roomNumber || "N/A"}</p>
            </div>

            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#cbb19d]/10 text-[#cbb19d] rounded-xl"><CalendarDays size={20} /></div>
                <h3 className="font-semibold">Stay Duration</h3>
              </div>
              <p className="text-2xl font-bold text-[#cbb19d]">
                {Math.ceil((new Date(currentBooking.checkOutDate) - new Date(currentBooking.checkInDate)) / (1000 * 60 * 60 * 24))} Nights
              </p>
              <p className={`text-sm mt-1 ${muted}`}>
                {new Date(currentBooking.checkInDate).toLocaleDateString()} - {new Date(currentBooking.checkOutDate).toLocaleDateString()}
              </p>
            </div>

            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#cbb19d]/10 text-[#cbb19d] rounded-xl"><Clock size={20} /></div>
                <h3 className="font-semibold">Status</h3>
              </div>
              <p className="text-2xl font-bold text-[#cbb19d]">{currentBooking.status}</p>
              <p className={`text-sm mt-1 ${muted}`}>Booking Ref: #{currentBooking._id.slice(-6).toUpperCase()}</p>
            </div>
            
            <div className={`p-6 rounded-2xl shadow-sm border ${cardBg} flex flex-col justify-center`}>
                <Link to="/guest/my-reservations" className="block text-center w-full py-3 border border-[#cbb19d] text-[#cbb19d] font-bold rounded-xl hover:bg-[#cbb19d] hover:text-white transition-colors">
                  View All Reservations
                </Link>
            </div>
          </div>
        ) : (
          <div className={`p-8 rounded-2xl shadow-sm border mb-12 text-center ${cardBg}`}>
            <p className={`text-lg mb-4 ${muted}`}>You don't have any active bookings right now.</p>
            <Link to="/rooms" className="inline-block bg-[#cbb19d] text-white px-6 py-3 rounded-full font-medium hover:bg-[#b89f8a] transition-all shadow-sm">
              Explore Rooms
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/guest/request-services" className={`p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center group hover:border-[#cbb19d] transition-all cursor-pointer ${cardBg}`}>
            <div className="p-4 bg-gray-50 dark:bg-[#111] rounded-full text-gray-400 group-hover:text-[#cbb19d] group-hover:scale-110 transition-all mb-4">
              <MessageSquareText size={28} />
            </div>
            <h3 className="font-semibold mb-1">Request Service</h3>
            <p className={`text-xs ${muted}`}>Room service, laundry, spa</p>
          </Link>

          <Link to="/guest/request-services" className={`p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center group hover:border-[#cbb19d] transition-all cursor-pointer ${cardBg}`}>
            <div className="p-4 bg-gray-50 dark:bg-[#111] rounded-full text-gray-400 group-hover:text-[#cbb19d] group-hover:scale-110 transition-all mb-4">
              <Wrench size={28} />
            </div>
            <h3 className="font-semibold mb-1">Report Issue</h3>
            <p className={`text-xs ${muted}`}>Maintenance & repairs</p>
          </Link>

          <Link to="/guest/feedback" className={`p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center group hover:border-[#cbb19d] transition-all cursor-pointer ${cardBg}`}>
            <div className="p-4 bg-gray-50 dark:bg-[#111] rounded-full text-gray-400 group-hover:text-[#cbb19d] group-hover:scale-110 transition-all mb-4">
              <ShieldAlert size={28} />
            </div>
            <h3 className="font-semibold mb-1">Feedback</h3>
            <p className={`text-xs ${muted}`}>Rate your experience</p>
          </Link>

          <Link to="/contact" className={`p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center group hover:border-[#cbb19d] transition-all cursor-pointer ${cardBg}`}>
            <div className="p-4 bg-gray-50 dark:bg-[#111] rounded-full text-gray-400 group-hover:text-[#cbb19d] group-hover:scale-110 transition-all mb-4">
              <Headset size={28} />
            </div>
            <h3 className="font-semibold mb-1">Contact Front Desk</h3>
            <p className={`text-xs ${muted}`}>24/7 support</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
