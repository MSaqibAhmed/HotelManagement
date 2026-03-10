import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, BedDouble, ArrowRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const CheckAvailability = () => {
  const { dark } = useTheme();
  const navigate  = useNavigate();

  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [checkIn,  setCheckIn]  = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [rooms,    setRooms]    = useState("1");
  const [guests,   setGuests]   = useState("2");

  const handleSearch = () => {
    navigate(`/rooms?checkin=${checkIn}&checkout=${checkOut}&rooms=${rooms}&guests=${guests}`);
  };

  const bg    = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";
  const inp   = dark
    ? "bg-[#111111] border-gray-700 text-white focus:border-[#cbb19d]"
    : "bg-white border-gray-200 text-gray-800 focus:border-[#cbb19d]";
  const label = dark ? "text-gray-400" : "text-gray-500";
  const text  = dark ? "text-white"    : "text-gray-900";

  return (
    <div className={`rounded-2xl border p-6 md:p-8 ${bg}`}>
      <h3 className={`font-serif text-lg font-semibold mb-6 ${text}`}>
        Check Availability
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {/* Check-In */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-widest mb-1.5 ${label}`}>
            Check-In
          </label>
          <div className="relative">
            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cbb19d] pointer-events-none" />
            <input type="date" value={checkIn} min={today}
              onChange={e => setCheckIn(e.target.value)}
              className={`w-full border rounded-xl pl-8 pr-2 py-2.5 text-sm outline-none transition-colors ${inp}`} />
          </div>
        </div>

        {/* Check-Out */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-widest mb-1.5 ${label}`}>
            Check-Out
          </label>
          <div className="relative">
            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cbb19d] pointer-events-none" />
            <input type="date" value={checkOut} min={checkIn}
              onChange={e => setCheckOut(e.target.value)}
              className={`w-full border rounded-xl pl-8 pr-2 py-2.5 text-sm outline-none transition-colors ${inp}`} />
          </div>
        </div>

        {/* Rooms */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-widest mb-1.5 ${label}`}>
            Rooms
          </label>
          <div className="relative">
            <BedDouble size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cbb19d] pointer-events-none" />
            <select value={rooms} onChange={e => setRooms(e.target.value)}
              className={`w-full border rounded-xl pl-8 pr-2 py-2.5 text-sm outline-none appearance-none transition-colors ${inp}`}>
              {["1 Room","2 Rooms","3 Rooms","4 Rooms"].map((r, i) => (
                <option key={i} value={i + 1}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-widest mb-1.5 ${label}`}>
            Guests
          </label>
          <div className="relative">
            <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cbb19d] pointer-events-none" />
            <select value={guests} onChange={e => setGuests(e.target.value)}
              className={`w-full border rounded-xl pl-8 pr-2 py-2.5 text-sm outline-none appearance-none transition-colors ${inp}`}>
              {["1 Adult","2 Adults","3 Adults","4 Adults","5+ Adults"].map((g, i) => (
                <option key={i} value={i + 1}>{g}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      <button
        onClick={handleSearch}
        className="flex items-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a] text-white
                   px-8 py-3 rounded-xl font-medium text-sm transition-all duration-300
                   shadow-md shadow-[#cbb19d]/20"
      >
        Check Availability <ArrowRight size={15} />
      </button>
    </div>
  );
};

export default CheckAvailability;
