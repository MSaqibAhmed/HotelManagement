import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import RoomCard from "./RoomCard";
import api from "../../api";

const ALL_TYPES = ["All", "Standard", "Deluxe", "Executive", "Family"];
const FALLBACK_IMG = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80";

const RoomsGrid = () => {
  const { dark } = useTheme();
  const [searchParams] = useSearchParams();

  const checkIn  = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests   = searchParams.get("guests") || "1";
  const hasDates = Boolean(checkIn && checkOut);

  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState("All");

  /* ── Fetch ── */
  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        let data;
        if (hasDates) {
          /* Availability mode — only available rooms for the date range */
          const res = await api.get("/room/public/available", {
            params: {
              checkInDate: checkIn,
              checkOutDate: checkOut,
              adults: guests
            },
          });
          data = res.data.rooms || res.data.data || [];
        } else {
          /* Default mode — all active rooms with live status */
          const res = await api.get("/room/public/getrooms");
          data = res.data.rooms || [];
        }
        setRooms(data);
        setTypeTab("All"); // reset tab on new fetch
      } catch (err) {
        console.error("RoomsGrid fetch error:", err);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [checkIn, checkOut]);

  /* ── Filter by type tab ── */
  const filtered = typeTab === "All"
    ? rooms
    : rooms.filter(r => r.roomType === typeTab);

  /* ── Unique types present in results (for tab visibility) ── */
  const presentTypes = ["All", ...ALL_TYPES.slice(1).filter(t => rooms.some(r => r.roomType === t))];

  const mutedText  = dark ? "text-gray-400" : "text-gray-500";
  const activeTab  = "bg-[#cbb19d] text-white shadow";
  const inactiveTab = dark
    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
    : "bg-white border border-gray-200 text-gray-600 hover:border-[#cbb19d]";

  return (
    <div>
      {/* ── Header info bar (only in availability mode) ── */}
      {hasDates && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${dark ? "bg-[#1a1a1a] text-gray-300" : "bg-[#faf8f6] text-gray-600"}`}>
          Showing available rooms from{" "}
          <span className="font-semibold text-[#cbb19d]">{checkIn}</span>{" "}
          to{" "}
          <span className="font-semibold text-[#cbb19d]">{checkOut}</span>
        </div>
      )}

      {/* ── Room-type filter tabs ── */}
      {presentTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {presentTypes.map(t => (
            <button
              key={t}
              onClick={() => setTypeTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeTab === t ? activeTab : inactiveTab}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div className={`text-center py-16 ${mutedText}`}>
          <div className="inline-block w-8 h-8 border-2 border-[#cbb19d] border-t-transparent rounded-full animate-spin mb-3" />
          <p>Loading rooms…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-20 ${mutedText}`}>
          <p className="text-lg font-medium">
            {hasDates ? "No rooms available for the selected dates." : "No rooms found."}
          </p>
          {hasDates && (
            <p className="text-sm mt-1">Try different dates or browse all rooms.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(room => (
            <RoomCard
              key={room._id}
              id={room._id}
              title={room.roomName || room.roomNumber}
              price={room.pricing?.basePrice}
              img={room.coverImage?.url || FALLBACK_IMG}
              type={room.roomType}
              /* status pill only in default (non-date) mode */
              status={hasDates ? undefined : room.status}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomsGrid;
